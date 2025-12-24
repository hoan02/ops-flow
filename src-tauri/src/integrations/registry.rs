//! Integration adapter registry.
//!
//! Manages adapter instances with caching and credential loading from keyring.

use crate::commands::credentials;
use crate::integrations::{create_adapter, IntegrationAdapter, IntegrationError};
use crate::types::{Integration, IntegrationCredentials};
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

/// Global registry state with cached adapter instances.
///
/// Note: Currently not used for caching due to trait object limitations.
/// Future improvement: Use Arc<dyn IntegrationAdapter> for proper caching.
struct RegistryState {
    /// Placeholder for future caching implementation
    _phantom: std::marker::PhantomData<()>,
}

impl RegistryState {
    fn new() -> Self {
        Self {
            _phantom: std::marker::PhantomData,
        }
    }
}

/// Global registry instance (thread-safe)
static REGISTRY: Mutex<Option<Arc<Mutex<RegistryState>>>> = Mutex::new(None);

/// Initialize the registry (called once at startup).
fn init_registry() -> Arc<Mutex<RegistryState>> {
    let mut registry = REGISTRY.lock().unwrap();
    if let Some(ref existing) = *registry {
        return existing.clone();
    }

    let state = Arc::new(Mutex::new(RegistryState::new()));
    *registry = Some(state.clone());
    state
}

/// Gets the registry state.
fn get_registry() -> Arc<Mutex<RegistryState>> {
    let registry = REGISTRY.lock().unwrap();
    registry.clone().unwrap_or_else(|| init_registry())
}

/// Loads credentials for an integration from the OS keyring.
///
/// # Arguments
/// * `app` - Tauri app handle
/// * `integration` - The integration to load credentials for
///
/// # Returns
/// * `Ok(credentials)` - Credentials loaded successfully
/// * `Err(IntegrationError)` - Failed to load credentials
pub async fn load_credentials(
    app: &AppHandle,
    integration: &Integration,
) -> Result<IntegrationCredentials, IntegrationError> {
    log::debug!("Loading credentials for integration: {}", integration.id);

    // Use the integration ID or credentials_ref as the keyring key
    let credentials_id = integration
        .credentials_ref
        .as_ref()
        .unwrap_or(&integration.id);

    // Load from keyring using existing command
    match credentials::get_integration_credentials(app.clone(), credentials_id.clone()).await {
        Ok(Some(creds)) => {
            log::info!("Successfully loaded credentials for integration: {}", integration.id);
            Ok(creds)
        }
        Ok(None) => {
            log::warn!("No credentials found for integration: {}", integration.id);
            Err(IntegrationError::ConfigError {
                message: format!(
                    "No credentials found for integration '{}'. Please configure credentials first.",
                    integration.name
                ),
            })
        }
        Err(e) => {
            log::error!("Failed to load credentials for integration {}: {}", integration.id, e);
            Err(IntegrationError::ConfigError {
                message: format!("Failed to load credentials: {e}"),
            })
        }
    }
}

/// Gets or creates an adapter instance for an integration.
///
/// Uses caching to avoid recreating adapters. If an adapter is not cached,
/// it will be created using `create_adapter()` after loading credentials.
///
/// Note: Due to trait object limitations, we currently recreate adapters
/// on each call. Future improvements will use Arc<dyn IntegrationAdapter>
/// to enable proper caching with shared ownership.
///
/// # Arguments
/// * `app` - Tauri app handle
/// * `integration` - The integration to get an adapter for
///
/// # Returns
/// * `Ok(adapter)` - Adapter instance
/// * `Err(IntegrationError)` - Failed to create adapter
pub async fn get_adapter(
    app: &AppHandle,
    integration: &Integration,
) -> Result<Box<dyn IntegrationAdapter>, IntegrationError> {
    log::debug!("Getting adapter for integration: {}", integration.id);

    // Load credentials
    let credentials = load_credentials(app, integration).await?;

    // Create adapter
    // Note: We're not caching yet due to Box<dyn Trait> limitations.
    // Future improvement: Use Arc<dyn IntegrationAdapter> for proper caching.
    create_adapter(integration, &credentials)
}

/// Clears the adapter cache.
///
/// Useful for forcing adapter recreation after credential updates.
///
/// Note: Currently a no-op as caching is not yet implemented.
/// Future improvement: Clear cached adapters when implemented.
pub fn clear_cache() {
    log::debug!("Clearing adapter cache (no-op: caching not yet implemented)");
    // Future: Clear cached adapters when caching is implemented
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init_registry() {
        let registry1 = init_registry();
        let registry2 = init_registry();
        
        // Should return the same instance
        assert!(Arc::ptr_eq(&registry1, &registry2));
    }

    #[test]
    fn test_clear_cache() {
        // Currently a no-op, but test that it doesn't panic
        clear_cache();
    }
}

