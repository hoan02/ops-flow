//! GitLab integration commands.
//!
//! Provides Tauri commands for interacting with GitLab API through the adapter.

use crate::integrations::gitlab::{GitLabAdapter, GitLabPipeline, GitLabProject, GitLabWebhook};
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

/// Helper function to create a GitLab adapter for an integration.
async fn create_gitlab_adapter(
    app: &AppHandle,
    integration: &Integration,
) -> Result<GitLabAdapter, String> {
    if integration.integration_type != crate::types::IntegrationType::GitLab {
        return Err(format!(
            "Integration {} is not a GitLab integration",
            integration.id
        ));
    }

    let credentials = load_credentials(app, integration)
        .await
        .map_err(|e| format!("Failed to load credentials: {}", e))?;

    let token = credentials
        .token
        .ok_or_else(|| "GitLab integration requires a token".to_string())?;

    Ok(GitLabAdapter::new(integration.base_url.clone(), token))
}

/// Fetches GitLab projects for a given integration.
#[tauri::command]
#[specta::specta]
pub async fn fetch_gitlab_projects(
    app: AppHandle,
    integration_id: String,
) -> Result<Vec<GitLabProject>, String> {
    log::debug!(
        "Fetching GitLab projects for integration: {}",
        integration_id
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_gitlab_adapter(&app, &integration).await?;

    adapter
        .fetch_projects()
        .await
        .map_err(|e| format!("Failed to fetch projects: {}", e))
}

/// Fetches GitLab pipelines for a given project.
#[tauri::command]
#[specta::specta]
pub async fn fetch_gitlab_pipelines(
    app: AppHandle,
    integration_id: String,
    project_id: u32,
) -> Result<Vec<GitLabPipeline>, String> {
    log::debug!(
        "Fetching GitLab pipelines for integration: {}, project: {}",
        integration_id,
        project_id
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_gitlab_adapter(&app, &integration).await?;

    adapter
        .fetch_pipelines(project_id)
        .await
        .map_err(|e| format!("Failed to fetch pipelines: {}", e))
}

/// Fetches GitLab webhooks for a given project.
#[tauri::command]
#[specta::specta]
pub async fn fetch_gitlab_webhooks(
    app: AppHandle,
    integration_id: String,
    project_id: u32,
) -> Result<Vec<GitLabWebhook>, String> {
    log::debug!(
        "Fetching GitLab webhooks for integration: {}, project: {}",
        integration_id,
        project_id
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_gitlab_adapter(&app, &integration).await?;

    adapter
        .fetch_webhooks(project_id)
        .await
        .map_err(|e| format!("Failed to fetch webhooks: {}", e))
}

/// Triggers a GitLab pipeline for a given project.
#[tauri::command]
#[specta::specta]
pub async fn trigger_gitlab_pipeline(
    app: AppHandle,
    integration_id: String,
    project_id: u32,
    r#ref: String,
) -> Result<GitLabPipeline, String> {
    log::debug!(
        "Triggering GitLab pipeline for integration: {}, project: {}, ref: {}",
        integration_id,
        project_id,
        r#ref
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_gitlab_adapter(&app, &integration).await?;

    adapter
        .trigger_pipeline(project_id, r#ref)
        .await
        .map_err(|e| format!("Failed to trigger pipeline: {}", e))
}
