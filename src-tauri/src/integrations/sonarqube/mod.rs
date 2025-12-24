//! SonarQube integration adapter.
//!
//! Implements the IntegrationAdapter trait for SonarQube API interactions.

mod types;

pub use types::{SonarQubeMetrics, SonarQubeProject};

use crate::integrations::{IntegrationAdapter, IntegrationError};
use crate::types::IntegrationType;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::Value;

/// SonarQube integration adapter.
///
/// Handles API calls to SonarQube instances using API token authentication.
pub struct SonarQubeAdapter {
    /// Base URL of the SonarQube instance
    base_url: String,
    /// API token for authentication
    token: String,
    /// HTTP client for API requests
    client: Client,
}

impl SonarQubeAdapter {
    /// Creates a new SonarQube adapter instance.
    pub fn new(base_url: String, token: String) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            token,
            client: Client::new(),
        }
    }

    /// Builds the full API URL for a given endpoint.
    fn api_url(&self, endpoint: &str) -> String {
        format!("{}/api{}", self.base_url, endpoint)
    }

    /// Makes an authenticated GET request to the SonarQube API.
    async fn get<T: for<'de> serde::Deserialize<'de>>(
        &self,
        endpoint: &str,
    ) -> Result<T, IntegrationError> {
        let url = self.api_url(endpoint);
        log::debug!("SonarQube API GET: {}", url);

        let response = self
            .client
            .get(&url)
            .basic_auth(&self.token, Some(""))
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            log::error!("SonarQube API error ({}): {}", status, error_text);
            return Err(crate::integrations::errors::status_to_error(
                status.as_u16(),
                Some(error_text),
            ));
        }

        response.json::<T>().await.map_err(|e| {
            log::error!("Failed to parse SonarQube API response: {}", e);
            IntegrationError::ConfigError {
                message: format!("Failed to parse response: {}", e),
            }
        })
    }

    /// Fetches all projects from SonarQube.
    pub async fn fetch_projects(&self) -> Result<Vec<SonarQubeProject>, IntegrationError> {
        let endpoint = "/projects/search?ps=100";
        let response: Value = self.get(endpoint).await?;

        let components = response
            .get("components")
            .and_then(|c| c.as_array())
            .ok_or_else(|| IntegrationError::ConfigError {
                message: "Invalid response format: missing 'components' array".to_string(),
            })?;

        let mut projects = Vec::new();
        for component in components {
            let key = component
                .get("key")
                .and_then(|k| k.as_str())
                .ok_or_else(|| IntegrationError::ConfigError {
                    message: "Invalid project format: missing 'key'".to_string(),
                })?
                .to_string();

            let name = component
                .get("name")
                .and_then(|n| n.as_str())
                .ok_or_else(|| IntegrationError::ConfigError {
                    message: "Invalid project format: missing 'name'".to_string(),
                })?
                .to_string();

            let qualifier = component
                .get("qualifier")
                .and_then(|q| q.as_str())
                .unwrap_or("TRK")
                .to_string();

            projects.push(SonarQubeProject {
                key,
                name,
                qualifier,
            });
        }

        Ok(projects)
    }

    /// Fetches metrics for a specific project.
    pub async fn fetch_metrics(
        &self,
        project_key: &str,
    ) -> Result<SonarQubeMetrics, IntegrationError> {
        // Request specific metrics
        let metrics = "coverage,bugs,vulnerabilities,code_smells,sqale_index";
        let endpoint = format!(
            "/measures/component?component={}&metricKeys={}",
            urlencoding::encode(project_key),
            metrics
        );

        let response: Value = self.get(&endpoint).await?;

        let measures = response
            .get("component")
            .and_then(|c| c.get("measures"))
            .and_then(|m| m.as_array())
            .ok_or_else(|| IntegrationError::ConfigError {
                message: "Invalid response format: missing 'measures' array".to_string(),
            })?;

        let mut coverage = None;
        let mut bugs = 0;
        let mut vulnerabilities = 0;
        let mut code_smells = 0;
        let mut technical_debt = None;

        for measure in measures {
            let metric = measure
                .get("metric")
                .and_then(|m| m.as_str())
                .unwrap_or("");

            let value = measure.get("value").and_then(|v| v.as_str());

            match metric {
                "coverage" => {
                    if let Some(v) = value {
                        coverage = v.parse::<f64>().ok();
                    }
                }
                "bugs" => {
                    if let Some(v) = value {
                        bugs = v.parse::<i32>().unwrap_or(0);
                    }
                }
                "vulnerabilities" => {
                    if let Some(v) = value {
                        vulnerabilities = v.parse::<i32>().unwrap_or(0);
                    }
                }
                "code_smells" => {
                    if let Some(v) = value {
                        code_smells = v.parse::<i32>().unwrap_or(0);
                    }
                }
                "sqale_index" => {
                    // Technical debt in minutes (stored as string)
                    if let Some(v) = value {
                        technical_debt = Some(v.to_string());
                    }
                }
                _ => {}
            }
        }

        Ok(SonarQubeMetrics {
            coverage,
            bugs,
            vulnerabilities,
            code_smells,
            technical_debt,
        })
    }
}

#[async_trait]
impl IntegrationAdapter for SonarQubeAdapter {
    async fn test_connection(&self) -> Result<(), IntegrationError> {
        // Test connection by fetching system info
        // This is a lightweight endpoint that verifies authentication
        let _: Value = self.get("/system/status").await?;
        Ok(())
    }

    fn get_name(&self) -> &str {
        "SonarQube"
    }

    fn get_integration_type(&self) -> IntegrationType {
        IntegrationType::SonarQube
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
        let adapter = SonarQubeAdapter::new(
            "https://sonarqube.example.com".to_string(),
            "test-token".to_string(),
        );
        assert_eq!(
            adapter.api_url("/projects/search"),
            "https://sonarqube.example.com/api/projects/search"
        );
    }

    #[test]
    fn test_api_url_trailing_slash() {
        let adapter = SonarQubeAdapter::new(
            "https://sonarqube.example.com/".to_string(),
            "test-token".to_string(),
        );
        assert_eq!(
            adapter.api_url("/projects/search"),
            "https://sonarqube.example.com/api/projects/search"
        );
    }
}

