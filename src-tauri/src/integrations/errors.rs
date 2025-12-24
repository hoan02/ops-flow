//! Error types for integration adapters.
//!
//! Provides structured error types that map to user-friendly messages
//! and support TypeScript discriminated unions via tauri-specta.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Error types for integration operations.
///
/// Uses `#[serde(tag = "type")]` to create TypeScript discriminated unions:
/// ```typescript
/// type IntegrationError =
///   | { type: 'NetworkError'; message: string }
///   | { type: 'AuthError'; message: string }
///   | { type: 'ApiError'; status: number; message: string }
///   | { type: 'ConfigError'; message: string }
///   | { type: 'NotFound' }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum IntegrationError {
    /// Network-related errors (connection failures, timeouts, etc.)
    NetworkError { message: String },
    /// Authentication/authorization errors (invalid credentials, expired tokens, etc.)
    AuthError { message: String },
    /// API errors with HTTP status codes (4xx, 5xx responses)
    ApiError { status: u16, message: String },
    /// Configuration errors (missing settings, invalid URLs, etc.)
    ConfigError { message: String },
    /// Resource not found
    NotFound,
}

impl std::fmt::Display for IntegrationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            IntegrationError::NetworkError { message } => {
                write!(f, "Network error: {message}")
            }
            IntegrationError::AuthError { message } => {
                write!(f, "Authentication error: {message}")
            }
            IntegrationError::ApiError { status, message } => {
                write!(f, "API error (status {status}): {message}")
            }
            IntegrationError::ConfigError { message } => {
                write!(f, "Configuration error: {message}")
            }
            IntegrationError::NotFound => write!(f, "Resource not found"),
        }
    }
}

impl std::error::Error for IntegrationError {}

/// Convert reqwest errors to IntegrationError
impl From<reqwest::Error> for IntegrationError {
    fn from(err: reqwest::Error) -> Self {
        log::error!("HTTP request error: {err}");
        
        if err.is_timeout() {
            IntegrationError::NetworkError {
                message: "Request timed out".to_string(),
            }
        } else if err.is_connect() {
            IntegrationError::NetworkError {
                message: "Failed to connect to server".to_string(),
            }
        } else {
            IntegrationError::NetworkError {
                message: format!("Network error: {}", err),
            }
        }
    }
}

/// Convert HTTP status codes to IntegrationError
pub fn status_to_error(status: u16, message: Option<String>) -> IntegrationError {
    let default_message = format!("HTTP {status}");
    let error_message = message.unwrap_or(default_message);

    match status {
        401 | 403 => IntegrationError::AuthError {
            message: error_message,
        },
        404 => IntegrationError::NotFound,
        400..=499 => IntegrationError::ApiError {
            status,
            message: error_message,
        },
        500..=599 => IntegrationError::ApiError {
            status,
            message: error_message,
        },
        _ => IntegrationError::ApiError {
            status,
            message: error_message,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_network_error_display() {
        let err = IntegrationError::NetworkError {
            message: "Connection refused".to_string(),
        };
        assert_eq!(err.to_string(), "Network error: Connection refused");
    }

    #[test]
    fn test_auth_error_display() {
        let err = IntegrationError::AuthError {
            message: "Invalid token".to_string(),
        };
        assert_eq!(err.to_string(), "Authentication error: Invalid token");
    }

    #[test]
    fn test_api_error_display() {
        let err = IntegrationError::ApiError {
            status: 404,
            message: "Not found".to_string(),
        };
        assert_eq!(err.to_string(), "API error (status 404): Not found");
    }

    #[test]
    fn test_status_to_error_401() {
        let err = status_to_error(401, Some("Unauthorized".to_string()));
        match err {
            IntegrationError::AuthError { message } => {
                assert_eq!(message, "Unauthorized");
            }
            _ => panic!("Expected AuthError"),
        }
    }

    #[test]
    fn test_status_to_error_404() {
        let err = status_to_error(404, None);
        match err {
            IntegrationError::NotFound => {}
            _ => panic!("Expected NotFound"),
        }
    }

    #[test]
    fn test_status_to_error_500() {
        let err = status_to_error(500, Some("Internal server error".to_string()));
        match err {
            IntegrationError::ApiError { status, message } => {
                assert_eq!(status, 500);
                assert_eq!(message, "Internal server error");
            }
            _ => panic!("Expected ApiError"),
        }
    }
}

