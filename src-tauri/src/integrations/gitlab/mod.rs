//! GitLab integration adapter.
//!
//! Implements the IntegrationAdapter trait for GitLab API interactions.

mod types;

pub use types::{GitLabPipeline, GitLabProject, GitLabWebhook};

use crate::integrations::{IntegrationAdapter, IntegrationError};
use crate::types::IntegrationType;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;

/// GitLab integration adapter.
///
/// Handles API calls to GitLab instances using Personal Access Token authentication.
pub struct GitLabAdapter {
    /// Base URL of the GitLab instance
    base_url: String,
    /// Personal Access Token for authentication
    token: String,
    /// HTTP client for API requests
    client: Client,
}

impl GitLabAdapter {
    /// Creates a new GitLab adapter instance.
    pub fn new(base_url: String, token: String) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            token,
            client: Client::new(),
        }
    }

    /// Builds the full API URL for a given endpoint.
    fn api_url(&self, endpoint: &str) -> String {
        format!("{}/api/v4{}", self.base_url, endpoint)
    }

    /// Makes an authenticated GET request to the GitLab API.
    async fn get<T: for<'de> serde::Deserialize<'de>>(
        &self,
        endpoint: &str,
    ) -> Result<T, IntegrationError> {
        let url = self.api_url(endpoint);
        log::debug!("GitLab API GET: {}", url);

        let response = self
            .client
            .get(&url)
            .header("PRIVATE-TOKEN", &self.token)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            log::error!("GitLab API error ({}): {}", status, error_text);
            return Err(crate::integrations::errors::status_to_error(
                status.as_u16(),
                Some(error_text),
            ));
        }

        response.json::<T>().await.map_err(|e| {
            log::error!("Failed to parse GitLab API response: {}", e);
            IntegrationError::ConfigError {
                message: format!("Failed to parse response: {}", e),
            }
        })
    }

    /// Makes an authenticated POST request to the GitLab API.
    async fn post<T: for<'de> serde::Deserialize<'de>>(
        &self,
        endpoint: &str,
        body: serde_json::Value,
    ) -> Result<T, IntegrationError> {
        let url = self.api_url(endpoint);
        log::debug!("GitLab API POST: {}", url);

        let response = self
            .client
            .post(&url)
            .header("PRIVATE-TOKEN", &self.token)
            .header("Content-Type", "application/json")
            .json(&body)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            log::error!("GitLab API error ({}): {}", status, error_text);
            return Err(crate::integrations::errors::status_to_error(
                status.as_u16(),
                Some(error_text),
            ));
        }

        response.json::<T>().await.map_err(|e| {
            log::error!("Failed to parse GitLab API response: {}", e);
            IntegrationError::ConfigError {
                message: format!("Failed to parse response: {}", e),
            }
        })
    }

    /// Fetches all projects from GitLab.
    pub async fn fetch_projects(&self) -> Result<Vec<GitLabProject>, IntegrationError> {
        self.get("/projects?per_page=100").await
    }

    /// Fetches pipelines for a specific project.
    pub async fn fetch_pipelines(
        &self,
        project_id: u32,
    ) -> Result<Vec<GitLabPipeline>, IntegrationError> {
        self.get(&format!("/projects/{}/pipelines?per_page=100", project_id))
            .await
    }

    /// Fetches webhooks for a specific project.
    pub async fn fetch_webhooks(&self, project_id: u32) -> Result<Vec<GitLabWebhook>, IntegrationError> {
        self.get(&format!("/projects/{}/hooks", project_id))
            .await
    }

    /// Triggers a pipeline for a specific project.
    pub async fn trigger_pipeline(
        &self,
        project_id: u32,
        r#ref: String,
    ) -> Result<GitLabPipeline, IntegrationError> {
        let body = json!({
            "ref": r#ref
        });
        self.post(&format!("/projects/{}/trigger/pipeline", project_id), body)
            .await
    }
}

#[async_trait]
impl IntegrationAdapter for GitLabAdapter {
    async fn test_connection(&self) -> Result<(), IntegrationError> {
        // Test connection by fetching current user info
        // This is a lightweight endpoint that verifies authentication
        let _: serde_json::Value = self.get("/user").await?;
        Ok(())
    }

    fn get_name(&self) -> &str {
        "GitLab"
    }

    fn get_integration_type(&self) -> IntegrationType {
        IntegrationType::GitLab
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
        let adapter = GitLabAdapter::new(
            "https://gitlab.com".to_string(),
            "test-token".to_string(),
        );
        assert_eq!(
            adapter.api_url("/projects"),
            "https://gitlab.com/api/v4/projects"
        );
    }

    #[test]
    fn test_api_url_trailing_slash() {
        let adapter = GitLabAdapter::new(
            "https://gitlab.com/".to_string(),
            "test-token".to_string(),
        );
        assert_eq!(
            adapter.api_url("/projects"),
            "https://gitlab.com/api/v4/projects"
        );
    }
}

