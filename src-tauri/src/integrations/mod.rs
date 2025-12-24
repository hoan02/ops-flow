//! Integration adapters foundation.
//!
//! Provides the base trait and infrastructure for integration adapters
//! that connect to external services (GitLab, Jenkins, Kubernetes, etc.).

pub mod errors;
pub mod gitlab;
pub mod jenkins;
pub mod keycloak;
pub mod kubernetes;
pub mod registry;
pub mod sonarqube;

pub use errors::IntegrationError;

use crate::types::{Integration, IntegrationType};
use async_trait::async_trait;

/// Base trait for all integration adapters.
///
/// Each integration type (GitLab, Jenkins, etc.) implements this trait
/// to provide a consistent interface for:
/// - Testing connections
/// - Retrieving integration metadata
/// - Performing integration-specific operations
#[async_trait]
pub trait IntegrationAdapter: Send + Sync {
    /// Tests the connection to the integration service.
    ///
    /// Performs a lightweight API call to verify:
    /// - Network connectivity
    /// - Authentication credentials are valid
    /// - Service is accessible
    ///
    /// # Returns
    /// * `Ok(())` - Connection successful
    /// * `Err(IntegrationError)` - Connection failed
    async fn test_connection(&self) -> Result<(), IntegrationError>;

    /// Returns the human-readable name of this integration.
    fn get_name(&self) -> &str;

    /// Returns the type of integration this adapter handles.
    fn get_integration_type(&self) -> IntegrationType;

    /// Returns the base URL of the integration service.
    fn get_base_url(&self) -> &str;
}

/// Helper function to create an adapter instance for a given integration.
///
/// Creates the appropriate adapter type based on the integration type.
pub fn create_adapter(
    integration: &Integration,
    credentials: &crate::types::IntegrationCredentials,
) -> Result<Box<dyn IntegrationAdapter>, IntegrationError> {
    log::debug!(
        "Creating adapter for integration: {} ({:?})",
        integration.id,
        integration.integration_type
    );

    match integration.integration_type {
        IntegrationType::GitLab => {
            // GitLab API v4 only supports Personal Access Token authentication
            // Basic Auth with username/password is not supported
            let token =
                credentials
                    .token
                    .as_ref()
                    .ok_or_else(|| IntegrationError::ConfigError {
                        message: "GitLab integration requires a Personal Access Token. GitLab API v4 does not support Basic Auth with username/password.".to_string(),
                    })?;

            let adapter = gitlab::GitLabAdapter::new(integration.base_url.clone(), token.clone());
            Ok(Box::new(adapter))
        }
        IntegrationType::Jenkins => {
            let username =
                credentials
                    .username
                    .as_ref()
                    .ok_or_else(|| IntegrationError::ConfigError {
                        message: "Jenkins integration requires a username".to_string(),
                    })?;

            // Use password or token (both can be used as password in Basic Auth)
            let password = credentials
                .password
                .as_ref()
                .or_else(|| credentials.token.as_ref())
                .ok_or_else(|| IntegrationError::ConfigError {
                    message: "Jenkins integration requires a password or token".to_string(),
                })?;

            let adapter = jenkins::JenkinsAdapter::new(
                integration.base_url.clone(),
                username.clone(),
                password.clone(),
            );
            Ok(Box::new(adapter))
        }
        IntegrationType::SonarQube => {
            let token =
                credentials
                    .token
                    .as_ref()
                    .ok_or_else(|| IntegrationError::ConfigError {
                        message: "SonarQube integration requires a token".to_string(),
                    })?;

            let adapter =
                sonarqube::SonarQubeAdapter::new(integration.base_url.clone(), token.clone());
            Ok(Box::new(adapter))
        }
        IntegrationType::Keycloak => {
            let username =
                credentials
                    .username
                    .as_ref()
                    .ok_or_else(|| IntegrationError::ConfigError {
                        message: "Keycloak integration requires a username".to_string(),
                    })?;

            // Use password or token (both can be used as password in Basic Auth)
            let password = credentials
                .password
                .as_ref()
                .or_else(|| credentials.token.as_ref())
                .ok_or_else(|| IntegrationError::ConfigError {
                    message: "Keycloak integration requires a password or token".to_string(),
                })?;

            let adapter = keycloak::KeycloakAdapter::new(
                integration.base_url.clone(),
                username.clone(),
                password.clone(),
            );
            Ok(Box::new(adapter))
        }
        IntegrationType::Kubernetes => {
            // Kubernetes adapter creation is async and handled directly in command layer
            // This function is synchronous, so we return an error here
            // The command layer will create the adapter asynchronously
            Err(IntegrationError::ConfigError {
                message: "Kubernetes adapter must be created asynchronously in command layer"
                    .to_string(),
            })
        }
    }
}
