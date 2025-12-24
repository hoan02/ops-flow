//! Jenkins integration commands.
//!
//! Provides Tauri commands for interacting with Jenkins API through the adapter.

use crate::integrations::jenkins::{JenkinsAdapter, JenkinsBuild, JenkinsJob};
use crate::integrations::registry::load_credentials;
use crate::types::Integration;
use std::collections::HashMap;
use tauri::AppHandle;

/// Helper function to get an integration by ID.
async fn get_integration(app: &AppHandle, integration_id: &str) -> Result<Integration, String> {
    let integrations = crate::commands::config::load_integrations(app.clone()).await?;
    integrations
        .into_iter()
        .find(|i| i.id == integration_id)
        .ok_or_else(|| format!("Integration not found: {}", integration_id))
}

/// Helper function to create a Jenkins adapter for an integration.
async fn create_jenkins_adapter(
    app: &AppHandle,
    integration: &Integration,
) -> Result<JenkinsAdapter, String> {
    if integration.integration_type != crate::types::IntegrationType::Jenkins {
        return Err(format!(
            "Integration {} is not a Jenkins integration",
            integration.id
        ));
    }

    let credentials = load_credentials(app, integration)
        .await
        .map_err(|e| format!("Failed to load credentials: {}", e))?;

    let username = credentials
        .username
        .ok_or_else(|| "Jenkins integration requires a username".to_string())?;

    // Use password or token (both can be used as password in Basic Auth)
    let password = credentials
        .password
        .or(credentials.token)
        .ok_or_else(|| "Jenkins integration requires a password or token".to_string())?;

    Ok(JenkinsAdapter::new(
        integration.base_url.clone(),
        username,
        password,
    ))
}

/// Fetches Jenkins jobs for a given integration.
#[tauri::command]
#[specta::specta]
pub async fn fetch_jenkins_jobs(
    app: AppHandle,
    integration_id: String,
) -> Result<Vec<JenkinsJob>, String> {
    log::debug!("Fetching Jenkins jobs for integration: {}", integration_id);

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_jenkins_adapter(&app, &integration).await?;

    adapter
        .fetch_jobs()
        .await
        .map_err(|e| format!("Failed to fetch jobs: {}", e))
}

/// Fetches Jenkins builds for a given job.
#[tauri::command]
#[specta::specta]
pub async fn fetch_jenkins_builds(
    app: AppHandle,
    integration_id: String,
    job_name: String,
) -> Result<Vec<JenkinsBuild>, String> {
    log::debug!(
        "Fetching Jenkins builds for integration: {}, job: {}",
        integration_id,
        job_name
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_jenkins_adapter(&app, &integration).await?;

    adapter
        .fetch_builds(&job_name)
        .await
        .map_err(|e| format!("Failed to fetch builds: {}", e))
}

/// Fetches detailed information for a specific Jenkins build.
#[tauri::command]
#[specta::specta]
pub async fn fetch_jenkins_build_details(
    app: AppHandle,
    integration_id: String,
    job_name: String,
    build_number: u32,
) -> Result<JenkinsBuild, String> {
    log::debug!(
        "Fetching Jenkins build details for integration: {}, job: {}, build: {}",
        integration_id,
        job_name,
        build_number
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_jenkins_adapter(&app, &integration).await?;

    adapter
        .fetch_build_details(&job_name, build_number)
        .await
        .map_err(|e| format!("Failed to fetch build details: {}", e))
}

/// Triggers a Jenkins build for a given job.
#[tauri::command]
#[specta::specta]
pub async fn trigger_jenkins_build(
    app: AppHandle,
    integration_id: String,
    job_name: String,
    parameters: Option<HashMap<String, String>>,
) -> Result<(), String> {
    log::debug!(
        "Triggering Jenkins build for integration: {}, job: {}",
        integration_id,
        job_name
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_jenkins_adapter(&app, &integration).await?;

    adapter
        .trigger_build(&job_name, parameters)
        .await
        .map_err(|e| format!("Failed to trigger build: {}", e))
}
