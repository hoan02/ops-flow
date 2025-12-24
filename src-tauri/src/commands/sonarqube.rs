//! SonarQube integration commands.
//!
//! Provides Tauri commands for interacting with SonarQube API through the adapter.

use crate::integrations::sonarqube::{SonarQubeAdapter, SonarQubeMetrics, SonarQubeProject};
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

/// Helper function to create a SonarQube adapter for an integration.
async fn create_sonarqube_adapter(
    app: &AppHandle,
    integration: &Integration,
) -> Result<SonarQubeAdapter, String> {
    if integration.integration_type != crate::types::IntegrationType::SonarQube {
        return Err(format!(
            "Integration {} is not a SonarQube integration",
            integration.id
        ));
    }

    let credentials = load_credentials(app, integration)
        .await
        .map_err(|e| format!("Failed to load credentials: {}", e))?;

    let token = credentials
        .token
        .ok_or_else(|| "SonarQube integration requires a token".to_string())?;

    Ok(SonarQubeAdapter::new(integration.base_url.clone(), token))
}

/// Fetches SonarQube projects for a given integration.
#[tauri::command]
#[specta::specta]
pub async fn fetch_sonarqube_projects(
    app: AppHandle,
    integration_id: String,
) -> Result<Vec<SonarQubeProject>, String> {
    log::debug!(
        "Fetching SonarQube projects for integration: {}",
        integration_id
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_sonarqube_adapter(&app, &integration).await?;

    adapter
        .fetch_projects()
        .await
        .map_err(|e| format!("Failed to fetch projects: {}", e))
}

/// Fetches SonarQube metrics for a given project.
#[tauri::command]
#[specta::specta]
pub async fn fetch_sonarqube_metrics(
    app: AppHandle,
    integration_id: String,
    project_key: String,
) -> Result<SonarQubeMetrics, String> {
    log::debug!(
        "Fetching SonarQube metrics for integration: {}, project: {}",
        integration_id,
        project_key
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_sonarqube_adapter(&app, &integration).await?;

    adapter
        .fetch_metrics(&project_key)
        .await
        .map_err(|e| format!("Failed to fetch metrics: {}", e))
}

