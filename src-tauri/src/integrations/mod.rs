//! Integration adapters foundation.
//!
//! Provides the base trait and infrastructure for integration adapters
//! that connect to external services (GitLab, Jenkins, Kubernetes, etc.).

pub mod errors;
pub mod registry;

pub use errors::IntegrationError;
pub use registry::{clear_cache, get_adapter, load_credentials};

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
/// This function will be implemented in future tasks to create specific
/// adapter types (GitLabAdapter, JenkinsAdapter, etc.).
///
/// For now, returns an error indicating the adapter is not yet implemented.
pub fn create_adapter(
    integration: &Integration,
    _credentials: &crate::types::IntegrationCredentials,
) -> Result<Box<dyn IntegrationAdapter>, IntegrationError> {
    log::debug!(
        "Creating adapter for integration: {} ({:?})",
        integration.id,
        integration.integration_type
    );

    // TODO: Implement specific adapters in future tasks
    // For now, return an error indicating not implemented
    Err(IntegrationError::ConfigError {
        message: format!(
            "Adapter for {:?} is not yet implemented",
            integration.integration_type
        ),
    })
}

