//! Jenkins integration adapter.
//!
//! Implements the IntegrationAdapter trait for Jenkins API interactions.

mod types;

pub use types::{JenkinsBuild, JenkinsBuildStatus, JenkinsJob};

use crate::integrations::{IntegrationAdapter, IntegrationError};
use crate::types::IntegrationType;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::Value;
use std::collections::HashMap;

/// Jenkins integration adapter.
///
/// Handles API calls to Jenkins instances using Basic Auth (username/password or API token).
pub struct JenkinsAdapter {
    /// Base URL of the Jenkins instance
    base_url: String,
    /// Username for authentication
    username: String,
    /// Password or API token for authentication
    password: String,
    /// HTTP client for API requests
    client: Client,
}

impl JenkinsAdapter {
    /// Creates a new Jenkins adapter instance.
    pub fn new(base_url: String, username: String, password: String) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            username,
            password,
            client: Client::new(),
        }
    }

    /// Builds the full API URL for a given endpoint.
    fn api_url(&self, endpoint: &str) -> String {
        format!("{}{}", self.base_url, endpoint)
    }

    /// Makes an authenticated GET request to the Jenkins API.
    async fn get<T: for<'de> serde::Deserialize<'de>>(
        &self,
        endpoint: &str,
    ) -> Result<T, IntegrationError> {
        let url = self.api_url(endpoint);
        log::debug!("Jenkins API GET: {}", url);

        let response = self
            .client
            .get(&url)
            .basic_auth(&self.username, Some(&self.password))
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            log::error!("Jenkins API error ({}): {}", status, error_text);
            return Err(crate::integrations::errors::status_to_error(
                status.as_u16(),
                Some(error_text),
            ));
        }

        response.json::<T>().await.map_err(|e| {
            log::error!("Failed to parse Jenkins API response: {}", e);
            IntegrationError::ConfigError {
                message: format!("Failed to parse response: {}", e),
            }
        })
    }

    /// Makes an authenticated POST request to the Jenkins API.
    async fn post(&self, endpoint: &str) -> Result<(), IntegrationError> {
        let url = self.api_url(endpoint);
        log::debug!("Jenkins API POST: {}", url);

        let response = self
            .client
            .post(&url)
            .basic_auth(&self.username, Some(&self.password))
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            log::error!("Jenkins API error ({}): {}", status, error_text);
            return Err(crate::integrations::errors::status_to_error(
                status.as_u16(),
                Some(error_text),
            ));
        }

        Ok(())
    }

    /// Fetches all jobs from Jenkins, including jobs inside folders (recursively).
    pub async fn fetch_jobs(&self) -> Result<Vec<JenkinsJob>, IntegrationError> {
        use std::collections::VecDeque;

        let mut all_jobs = Vec::new();
        let mut folders_to_process: VecDeque<String> = VecDeque::new();
        folders_to_process.push_back(String::new()); // Start with root

        // Process folders iteratively (using a queue)
        while let Some(path) = folders_to_process.pop_front() {
            // Build endpoint based on path - include _class to identify folders
            let endpoint = if path.is_empty() {
                "/api/json?tree=jobs[name,url,color,_class]".to_string()
            } else {
                let encoded_path = path
                    .split('/')
                    .map(|segment| urlencoding::encode(segment))
                    .collect::<Vec<_>>()
                    .join("/job/");
                format!("/job/{}/api/json?tree=jobs[name,url,color,_class]", encoded_path)
            };

            let response: Value = match self.get(&endpoint).await {
                Ok(r) => r,
                Err(e) => {
                    log::warn!("Failed to fetch from path {}: {}", path, e);
                    continue; // Skip this folder and continue
                }
            };

            let jobs_array = match response.get("jobs").and_then(|j| j.as_array()) {
                Some(arr) => arr,
                None => {
                    log::warn!("Invalid response format for path {}: missing 'jobs' array", path);
                    continue;
                }
            };

            // Process each item in this folder
            for job_value in jobs_array {
                let name = match job_value.get("name").and_then(|n| n.as_str()) {
                    Some(n) => n.to_string(),
                    None => continue, // Skip invalid items
                };

                let url = match job_value.get("url").and_then(|u| u.as_str()) {
                    Some(u) => u.to_string(),
                    None => continue,
                };

                let color = job_value
                    .get("color")
                    .and_then(|c| c.as_str())
                    .unwrap_or("notbuilt")
                    .to_string();

                // Check _class field to determine if this is a folder
                // Folders have _class like "com.cloudbees.hudson.plugins.folder.Folder"
                let class_name = job_value
                    .get("_class")
                    .and_then(|c| c.as_str())
                    .unwrap_or("");
                let is_folder = class_name.contains("Folder") || color == "folder";

                let full_path = if path.is_empty() {
                    name.clone()
                } else {
                    format!("{}/{}", path, name)
                };

                if is_folder {
                    // Add to queue for processing
                    folders_to_process.push_back(full_path);
                } else {
                    // This is an actual job - add it to results
                    all_jobs.push(JenkinsJob {
                        name: full_path,
                        url,
                        color,
                    });
                }
            }
        }

        Ok(all_jobs)
    }

    /// Fetches builds for a specific job.
    pub async fn fetch_builds(
        &self,
        job_name: &str,
    ) -> Result<Vec<JenkinsBuild>, IntegrationError> {
        // URL encode job name
        let encoded_job_name = urlencoding::encode(job_name);
        let endpoint = format!(
            "/job/{}/api/json?tree=builds[number,result,timestamp,url,duration]",
            encoded_job_name
        );

        let response: Value = self.get(&endpoint).await?;

        let builds_array = response
            .get("builds")
            .and_then(|b| b.as_array())
            .ok_or_else(|| IntegrationError::ConfigError {
                message: "Invalid response format: missing 'builds' array".to_string(),
            })?;

        let mut builds = Vec::new();
        for build_value in builds_array {
            let number = build_value
                .get("number")
                .and_then(|n| n.as_u64())
                .ok_or_else(|| IntegrationError::ConfigError {
                    message: "Invalid build format: missing 'number'".to_string(),
                })? as u32;

            let url = build_value
                .get("url")
                .and_then(|u| u.as_str())
                .ok_or_else(|| IntegrationError::ConfigError {
                    message: "Invalid build format: missing 'url'".to_string(),
                })?
                .to_string();

            let timestamp = build_value
                .get("timestamp")
                .and_then(|t| t.as_i64())
                .ok_or_else(|| IntegrationError::ConfigError {
                    message: "Invalid build format: missing 'timestamp'".to_string(),
                })?
                .to_string();

            let duration = build_value
                .get("duration")
                .and_then(|d| d.as_i64())
                .map(|d| d.to_string());

            // Parse result/status
            let status = match build_value.get("result").and_then(|r| r.as_str()) {
                Some("SUCCESS") => JenkinsBuildStatus::Success,
                Some("FAILURE") => JenkinsBuildStatus::Failure,
                Some("UNSTABLE") => JenkinsBuildStatus::Unstable,
                Some("ABORTED") => JenkinsBuildStatus::Aborted,
                Some("NOT_BUILT") => JenkinsBuildStatus::NotBuilt,
                None => {
                    // If result is None, build is likely still running
                    JenkinsBuildStatus::Building
                }
                _ => JenkinsBuildStatus::NotBuilt,
            };

            builds.push(JenkinsBuild {
                number,
                status,
                timestamp,
                url,
                duration,
            });
        }

        Ok(builds)
    }

    /// Fetches detailed information for a specific build.
    pub async fn fetch_build_details(
        &self,
        job_name: &str,
        build_number: u32,
    ) -> Result<JenkinsBuild, IntegrationError> {
        let encoded_job_name = urlencoding::encode(job_name);
        let endpoint = format!("/job/{}/{}/api/json", encoded_job_name, build_number);

        let response: Value = self.get(&endpoint).await?;

        let number = response
            .get("number")
            .and_then(|n| n.as_u64())
            .ok_or_else(|| IntegrationError::ConfigError {
                message: "Invalid build format: missing 'number'".to_string(),
            })? as u32;

        let url = response
            .get("url")
            .and_then(|u| u.as_str())
            .ok_or_else(|| IntegrationError::ConfigError {
                message: "Invalid build format: missing 'url'".to_string(),
            })?
            .to_string();

        let timestamp = response
            .get("timestamp")
            .and_then(|t| t.as_i64())
            .ok_or_else(|| IntegrationError::ConfigError {
                message: "Invalid build format: missing 'timestamp'".to_string(),
            })?
            .to_string();

        let duration = response
            .get("duration")
            .and_then(|d| d.as_i64())
            .map(|d| d.to_string());

        // Parse result/status
        let status = match response.get("result").and_then(|r| r.as_str()) {
            Some("SUCCESS") => JenkinsBuildStatus::Success,
            Some("FAILURE") => JenkinsBuildStatus::Failure,
            Some("UNSTABLE") => JenkinsBuildStatus::Unstable,
            Some("ABORTED") => JenkinsBuildStatus::Aborted,
            Some("NOT_BUILT") => JenkinsBuildStatus::NotBuilt,
            None => {
                // Check if building
                if response
                    .get("building")
                    .and_then(|b| b.as_bool())
                    .unwrap_or(false)
                {
                    JenkinsBuildStatus::Building
                } else {
                    JenkinsBuildStatus::Pending
                }
            }
            _ => JenkinsBuildStatus::NotBuilt,
        };

        Ok(JenkinsBuild {
            number,
            status,
            timestamp,
            url,
            duration,
        })
    }

    /// Triggers a build for a specific job.
    pub async fn trigger_build(
        &self,
        job_name: &str,
        parameters: Option<HashMap<String, String>>,
    ) -> Result<(), IntegrationError> {
        let encoded_job_name = urlencoding::encode(job_name);

        // If parameters are provided, use buildWithParameters endpoint
        let endpoint = if let Some(params) = parameters {
            if params.is_empty() {
                format!("/job/{}/build", encoded_job_name)
            } else {
                // Build query string for parameters
                let query_params: Vec<String> = params
                    .iter()
                    .map(|(k, v)| format!("{}={}", urlencoding::encode(k), urlencoding::encode(v)))
                    .collect();
                format!(
                    "/job/{}/buildWithParameters?{}",
                    encoded_job_name,
                    query_params.join("&")
                )
            }
        } else {
            format!("/job/{}/build", encoded_job_name)
        };

        self.post(&endpoint).await
    }
}

#[async_trait]
impl IntegrationAdapter for JenkinsAdapter {
    async fn test_connection(&self) -> Result<(), IntegrationError> {
        // Test connection by fetching Jenkins version info
        // This is a lightweight endpoint that verifies authentication
        let _: Value = self.get("/api/json?tree=nodeName").await?;
        Ok(())
    }

    fn get_name(&self) -> &str {
        "Jenkins"
    }

    fn get_integration_type(&self) -> IntegrationType {
        IntegrationType::Jenkins
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
        let adapter = JenkinsAdapter::new(
            "https://jenkins.example.com".to_string(),
            "user".to_string(),
            "token".to_string(),
        );
        assert_eq!(
            adapter.api_url("/api/json"),
            "https://jenkins.example.com/api/json"
        );
    }

    #[test]
    fn test_api_url_trailing_slash() {
        let adapter = JenkinsAdapter::new(
            "https://jenkins.example.com/".to_string(),
            "user".to_string(),
            "token".to_string(),
        );
        assert_eq!(
            adapter.api_url("/api/json"),
            "https://jenkins.example.com/api/json"
        );
    }
}
