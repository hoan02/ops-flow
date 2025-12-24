//! Keycloak integration adapter.
//!
//! Implements the IntegrationAdapter trait for Keycloak API interactions.

mod types;

pub use types::{KeycloakClient, KeycloakRealm};

use crate::integrations::{IntegrationAdapter, IntegrationError};
use crate::types::IntegrationType;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::Value;

/// Keycloak integration adapter.
///
/// Handles API calls to Keycloak instances using Basic Auth (username/password or service account token).
pub struct KeycloakAdapter {
    /// Base URL of the Keycloak instance
    base_url: String,
    /// Username for authentication (admin username or service account)
    username: String,
    /// Password or service account token for authentication
    password: String,
    /// HTTP client for API requests
    client: Client,
}

impl KeycloakAdapter {
    /// Creates a new Keycloak adapter instance.
    pub fn new(base_url: String, username: String, password: String) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            username,
            password,
            client: Client::new(),
        }
    }

    /// Builds the full API URL for a given endpoint.
    fn api_url(&self, endpoint: &str) -> String {
        format!("{}{}", self.base_url, endpoint)
    }

    /// Makes an authenticated GET request to the Keycloak API.
    async fn get<T: for<'de> serde::Deserialize<'de>>(
        &self,
        endpoint: &str,
    ) -> Result<T, IntegrationError> {
        let url = self.api_url(endpoint);
        log::debug!("Keycloak API GET: {}", url);

        let response = self
            .client
            .get(&url)
            .basic_auth(&self.username, Some(&self.password))
            .header("Accept", "application/json")
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            log::error!("Keycloak API error ({}): {}", status, error_text);
            
            // Handle permission errors gracefully (403/404 for admin endpoints)
            if status == 403 || status == 404 {
                // Return a more user-friendly error for permission issues
                return Err(IntegrationError::AuthError {
                    message: format!(
                        "Access denied. Admin access may be required for this operation. Status: {}",
                        status
                    ),
                });
            }
            
            return Err(crate::integrations::errors::status_to_error(
                status.as_u16(),
                Some(error_text),
            ));
        }

        response.json::<T>().await.map_err(|e| {
            log::error!("Failed to parse Keycloak API response: {}", e);
            IntegrationError::ConfigError {
                message: format!("Failed to parse response: {}", e),
            }
        })
    }

    /// Fetches all realms from Keycloak.
    ///
    /// Note: This requires admin access. If admin access is not available,
    /// this will return an error. The error is handled gracefully.
    pub async fn fetch_realms(&self) -> Result<Vec<KeycloakRealm>, IntegrationError> {
        let endpoint = "/admin/realms";
        
        // Try to fetch realms, but handle permission errors gracefully
        let response: Vec<Value> = match self.get(endpoint).await {
            Ok(realms) => realms,
            Err(IntegrationError::AuthError { .. }) => {
                // If we don't have admin access, return empty list with a warning
                log::warn!("Admin access not available for fetching realms. Returning empty list.");
                return Ok(Vec::new());
            }
            Err(e) => return Err(e),
        };

        let mut realms = Vec::new();
        for realm_value in response {
            let realm = realm_value
                .get("realm")
                .and_then(|r| r.as_str())
                .ok_or_else(|| IntegrationError::ConfigError {
                    message: "Invalid realm format: missing 'realm'".to_string(),
                })?
                .to_string();

            let enabled = realm_value
                .get("enabled")
                .and_then(|e| e.as_bool())
                .unwrap_or(true);

            realms.push(KeycloakRealm { realm, enabled });
        }

        Ok(realms)
    }

    /// Fetches clients for a specific realm.
    ///
    /// Note: This requires admin access. If admin access is not available,
    /// this will return an error. The error is handled gracefully.
    pub async fn fetch_clients(
        &self,
        realm: &str,
    ) -> Result<Vec<KeycloakClient>, IntegrationError> {
        let endpoint = format!("/admin/realms/{}/clients", urlencoding::encode(realm));
        
        // Try to fetch clients, but handle permission errors gracefully
        let response: Vec<Value> = match self.get(&endpoint).await {
            Ok(clients) => clients,
            Err(IntegrationError::AuthError { .. }) => {
                // If we don't have admin access, return empty list with a warning
                log::warn!("Admin access not available for fetching clients. Returning empty list.");
                return Ok(Vec::new());
            }
            Err(e) => return Err(e),
        };

        let mut clients = Vec::new();
        for client_value in response {
            let client_id = client_value
                .get("clientId")
                .and_then(|c| c.as_str())
                .ok_or_else(|| IntegrationError::ConfigError {
                    message: "Invalid client format: missing 'clientId'".to_string(),
                })?
                .to_string();

            let name = client_value
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or(&client_id)
                .to_string();

            let enabled = client_value
                .get("enabled")
                .and_then(|e| e.as_bool())
                .unwrap_or(true);

            clients.push(KeycloakClient {
                client_id,
                name,
                enabled,
            });
        }

        Ok(clients)
    }
}

#[async_trait]
impl IntegrationAdapter for KeycloakAdapter {
    async fn test_connection(&self) -> Result<(), IntegrationError> {
        // Test connection by fetching realm configuration
        // Use the well-known endpoint which doesn't require admin access
        let endpoint = "/realms/master/.well-known/openid-configuration";
        let _: Value = self.get(endpoint).await?;
        Ok(())
    }

    fn get_name(&self) -> &str {
        "Keycloak"
    }

    fn get_integration_type(&self) -> IntegrationType {
        IntegrationType::Keycloak
    }

    fn get_base_url(&self) -> &str {
        &self.base_url
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_url() {
        let adapter = KeycloakAdapter::new(
            "https://keycloak.example.com".to_string(),
            "admin".to_string(),
            "password".to_string(),
        );
        assert_eq!(
            adapter.api_url("/admin/realms"),
            "https://keycloak.example.com/admin/realms"
        );
    }

    #[test]
    fn test_api_url_trailing_slash() {
        let adapter = KeycloakAdapter::new(
            "https://keycloak.example.com/".to_string(),
            "admin".to_string(),
            "password".to_string(),
        );
        assert_eq!(
            adapter.api_url("/admin/realms"),
            "https://keycloak.example.com/admin/realms"
        );
    }
}

