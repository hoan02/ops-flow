//! Credentials storage commands using OS keyring.
//!
//! Credentials are stored securely in the OS keychain and are never
//! written to config files.

use crate::types::IntegrationCredentials;
use keyring::Entry;
use tauri::AppHandle;

/// Gets the keyring entry for an integration's credentials.
fn get_keyring_entry(integration_id: &str) -> Result<Entry, String> {
    Entry::new("ops-flow", integration_id).map_err(|e| {
        log::error!("Failed to create keyring entry for integration {integration_id}: {e}");
        format!("Failed to access keyring: {e}")
    })
}

/// Saves integration credentials to the OS keyring.
#[tauri::command]
#[specta::specta]
pub async fn save_integration_credentials(
    _app: AppHandle,
    integration_id: String,
    credentials: IntegrationCredentials,
) -> Result<(), String> {
    log::debug!("Saving credentials for integration: {integration_id}");

    // Serialize credentials to JSON
    let credentials_json = serde_json::to_string(&credentials).map_err(|e| {
        log::error!("Failed to serialize credentials: {e}");
        format!("Failed to serialize credentials: {e}")
    })?;

    // Store in keyring
    let entry = get_keyring_entry(&integration_id)?;
    entry.set_password(&credentials_json).map_err(|e| {
        log::error!("Failed to save credentials to keyring: {e}");
        format!("Failed to save credentials: {e}")
    })?;

    log::info!("Successfully saved credentials for integration: {integration_id}");
    Ok(())
}

/// Gets integration credentials from the OS keyring.
#[tauri::command]
#[specta::specta]
pub async fn get_integration_credentials(
    _app: AppHandle,
    integration_id: String,
) -> Result<Option<IntegrationCredentials>, String> {
    log::debug!("Loading credentials for integration: {integration_id}");

    let entry = get_keyring_entry(&integration_id)?;

    match entry.get_password() {
        Ok(password_json) => {
            let credentials: IntegrationCredentials = serde_json::from_str(&password_json)
                .map_err(|e| {
                    log::error!("Failed to parse credentials from keyring: {e}");
                    format!("Failed to parse credentials: {e}")
                })?;
            log::info!("Successfully loaded credentials for integration: {integration_id}");
            Ok(Some(credentials))
        }
        Err(keyring::Error::NoEntry) => {
            log::debug!("No credentials found for integration: {integration_id}");
            Ok(None)
        }
        Err(e) => {
            log::error!("Failed to get credentials from keyring: {e}");
            Err(format!("Failed to get credentials: {e}"))
        }
    }
}

/// Deletes integration credentials from the OS keyring.
#[tauri::command]
#[specta::specta]
pub async fn delete_integration_credentials(
    _app: AppHandle,
    integration_id: String,
) -> Result<(), String> {
    log::debug!("Deleting credentials for integration: {integration_id}");

    let entry = get_keyring_entry(&integration_id)?;
    entry.delete_password().map_err(|e| {
        log::error!("Failed to delete credentials from keyring: {e}");
        format!("Failed to delete credentials: {e}")
    })?;

    log::info!("Successfully deleted credentials for integration: {integration_id}");
    Ok(())
}
