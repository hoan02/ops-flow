//! Keycloak integration commands.
//!
//! Provides Tauri commands for interacting with Keycloak API through the adapter.

use crate::integrations::keycloak::{KeycloakAdapter, KeycloakClient, KeycloakRealm};
use crate::integrations::registry::load_credentials;
use crate::types::Integration;
use tauri::AppHandle;

/// Helper function to get an integration by ID.
async fn get_integration(app: &AppHandle, integration_id: &str) -> Result<Integration, String> {
    let integrations = crate::commands::config::load_integrations(app.clone()).await?;
    integrations
        .into_iter()
        .find(|i| i.id == integration_id)
        .ok_or_else(|| format!("Integration not found: {}", integration_id))
}

/// Helper function to create a Keycloak adapter for an integration.
async fn create_keycloak_adapter(
    app: &AppHandle,
    integration: &Integration,
) -> Result<KeycloakAdapter, String> {
    if integration.integration_type != crate::types::IntegrationType::Keycloak {
        return Err(format!(
            "Integration {} is not a Keycloak integration",
            integration.id
        ));
    }

    let credentials = load_credentials(app, integration)
        .await
        .map_err(|e| format!("Failed to load credentials: {}", e))?;

    let username = credentials
        .username
        .ok_or_else(|| "Keycloak integration requires a username".to_string())?;

    // Use password or token (both can be used as password in Basic Auth)
    let password = credentials
        .password
        .or(credentials.token)
        .ok_or_else(|| "Keycloak integration requires a password or token".to_string())?;

    Ok(KeycloakAdapter::new(
        integration.base_url.clone(),
        username,
        password,
    ))
}

/// Fetches Keycloak realms for a given integration.
#[tauri::command]
#[specta::specta]
pub async fn fetch_keycloak_realms(
    app: AppHandle,
    integration_id: String,
) -> Result<Vec<KeycloakRealm>, String> {
    log::debug!(
        "Fetching Keycloak realms for integration: {}",
        integration_id
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_keycloak_adapter(&app, &integration).await?;

    adapter
        .fetch_realms()
        .await
        .map_err(|e| format!("Failed to fetch realms: {}", e))
}

/// Fetches Keycloak clients for a given realm.
#[tauri::command]
#[specta::specta]
pub async fn fetch_keycloak_clients(
    app: AppHandle,
    integration_id: String,
    realm: String,
) -> Result<Vec<KeycloakClient>, String> {
    log::debug!(
        "Fetching Keycloak clients for integration: {}, realm: {}",
        integration_id,
        realm
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_keycloak_adapter(&app, &integration).await?;

    adapter
        .fetch_clients(&realm)
        .await
        .map_err(|e| format!("Failed to fetch clients: {}", e))
}

