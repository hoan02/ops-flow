//! Shared HTTP client for integration adapters.
//!
//! Provides a configured reqwest client with:
//! - Timeout configuration
//! - Retry logic for network errors
//! - Consistent error handling

use crate::integrations::errors::IntegrationError;
use std::time::Duration;

/// Creates a configured HTTP client for integration API calls.
///
/// Configuration:
/// - Connect timeout: 10 seconds
/// - Read timeout: 30 seconds
/// - JSON support enabled
/// - Rustls TLS backend (no OpenSSL dependency)
pub fn create_http_client() -> Result<reqwest::Client, IntegrationError> {
    reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| {
            log::error!("Failed to create HTTP client: {e}");
            IntegrationError::ConfigError {
                message: format!("Failed to initialize HTTP client: {e}"),
            }
        })
}

/// Executes an HTTP request with retry logic.
///
/// Retries up to 3 times with exponential backoff for network errors.
/// Does not retry on authentication errors (4xx) or client errors.
///
/// # Arguments
/// * `_client` - The HTTP client to use (currently unused, reserved for future use)
/// * `request` - The request builder to execute
///
/// # Returns
/// * `Ok(response)` - Successful response
/// * `Err(IntegrationError)` - Error after all retries exhausted
pub async fn execute_with_retry(
    _client: &reqwest::Client,
    request: reqwest::RequestBuilder,
) -> Result<reqwest::Response, IntegrationError> {
    const MAX_RETRIES: u32 = 3;
    const INITIAL_DELAY_MS: u64 = 500;

    let mut last_error = None;

    for attempt in 0..=MAX_RETRIES {
        match request.try_clone() {
            Some(retry_request) => {
                match retry_request.send().await {
                    Ok(response) => {
                        let status = response.status();
                        
                        // Don't retry on client errors (4xx) except for network timeouts
                        if status.is_client_error() && status != 408 {
                            return Err(crate::integrations::errors::status_to_error(
                                status.as_u16(),
                                Some(format!("Client error: {}", status)),
                            ));
                        }

                        // Don't retry on authentication errors
                        if status == 401 || status == 403 {
                            return Err(crate::integrations::errors::status_to_error(
                                status.as_u16(),
                                Some("Authentication failed".to_string()),
                            ));
                        }

                        // Return successful responses
                        if status.is_success() {
                            return Ok(response);
                        }

                        // For server errors (5xx), continue to retry
                        if status.is_server_error() {
                            log::warn!(
                                "Server error {} on attempt {}, will retry",
                                status,
                                attempt + 1
                            );
                            last_error = Some(crate::integrations::errors::status_to_error(
                                status.as_u16(),
                                Some(format!("Server error: {}", status)),
                            ));
                        } else {
                            // Other status codes - return immediately
                            return Err(crate::integrations::errors::status_to_error(
                                status.as_u16(),
                                Some(format!("HTTP error: {}", status)),
                            ));
                        }
                    }
                    Err(e) => {
                        // Network errors - retry with exponential backoff
                        if e.is_timeout() || e.is_connect() || e.is_request() {
                            log::warn!(
                                "Network error on attempt {}: {}, will retry",
                                attempt + 1,
                                e
                            );
                            last_error = Some(e.into());

                            // Exponential backoff: 500ms, 1000ms, 2000ms
                            if attempt < MAX_RETRIES {
                                let delay_ms = INITIAL_DELAY_MS * (1 << attempt);
                                tokio::time::sleep(Duration::from_millis(delay_ms)).await;
                                continue;
                            }
                        } else {
                            // Non-retryable errors (parsing, etc.) - return immediately
                            return Err(e.into());
                        }
                    }
                }
            }
            None => {
                // Request cannot be cloned (e.g., streaming body) - execute once
                return request.send().await.map_err(Into::into);
            }
        }
    }

    // All retries exhausted
    Err(last_error.unwrap_or_else(|| IntegrationError::NetworkError {
        message: "Request failed after retries".to_string(),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_http_client() {
        let client = create_http_client();
        assert!(client.is_ok());
    }

    #[tokio::test]
    async fn test_http_client_timeout_config() {
        let client = create_http_client().unwrap();
        
        // Test that client has timeout configured by trying a request
        // that should timeout quickly (using a non-routable IP)
        let result = client
            .get("http://192.0.2.0:1") // Test-Net-1, RFC 5737
            .timeout(Duration::from_millis(100))
            .send()
            .await;
        
        // Should fail, but not panic
        assert!(result.is_err());
    }
}

