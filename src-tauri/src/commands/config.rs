//! Config management commands for Projects, Environments, Integrations, and Mappings.
//!
//! Handles loading and saving configuration files with atomic writes.
//! Config files are stored in YAML format for human readability.

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use crate::types::{Environment, Integration, Mapping, Project};

/// Gets the path to the config directory.
fn get_config_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    let config_dir = app_data_dir.join("config");

    // Ensure the directory exists
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {e}"))?;

    Ok(config_dir)
}

/// Generic function to load YAML config file.
fn load_yaml_config<T>(path: &PathBuf) -> Result<Vec<T>, String>
where
    T: for<'de> serde::Deserialize<'de>,
{
    if !path.exists() {
        log::info!("Config file not found: {path:?}, returning empty vec");
        return Ok(Vec::new());
    }

    let contents = std::fs::read_to_string(path).map_err(|e| {
        log::error!("Failed to read config file {path:?}: {e}");
        format!("Failed to read config file: {e}")
    })?;

    let data: Vec<T> = serde_yaml::from_str(&contents).map_err(|e| {
        log::error!("Failed to parse YAML config file {path:?}: {e}");
        format!("Failed to parse config file: {e}")
    })?;

    log::debug!("Successfully loaded {} items from {path:?}", data.len());
    Ok(data)
}

/// Generic function to save YAML config file with atomic write.
fn save_yaml_config<T>(path: &PathBuf, data: &[T]) -> Result<(), String>
where
    T: serde::Serialize,
{
    let yaml_content = serde_yaml::to_string(data).map_err(|e| {
        log::error!("Failed to serialize config to YAML: {e}");
        format!("Failed to serialize config: {e}")
    })?;

    // Write to a temporary file first, then rename (atomic operation)
    let temp_path = path.with_extension("tmp");

    std::fs::write(&temp_path, yaml_content).map_err(|e| {
        log::error!("Failed to write config file: {e}");
        format!("Failed to write config file: {e}")
    })?;

    if let Err(rename_err) = std::fs::rename(&temp_path, path) {
        log::error!("Failed to finalize config file: {rename_err}");
        // Clean up the temp file to avoid leaving orphaned files on disk
        if let Err(remove_err) = std::fs::remove_file(&temp_path) {
            log::warn!("Failed to remove temp file after rename failure: {remove_err}");
        }
        return Err(format!("Failed to finalize config file: {rename_err}"));
    }

    log::info!("Successfully saved {} items to {path:?}", data.len());
    Ok(())
}

// ============================================================================
// Projects Commands
// ============================================================================

/// Loads all projects from disk.
#[tauri::command]
#[specta::specta]
pub async fn load_projects(app: AppHandle) -> Result<Vec<Project>, String> {
    log::debug!("Loading projects from disk");
    let config_dir = get_config_dir(&app)?;
    let projects_path = config_dir.join("projects.yaml");
    load_yaml_config(&projects_path)
}

/// Saves all projects to disk.
#[tauri::command]
#[specta::specta]
pub async fn save_projects(app: AppHandle, projects: Vec<Project>) -> Result<(), String> {
    log::debug!("Saving {} projects to disk", projects.len());
    let config_dir = get_config_dir(&app)?;
    let projects_path = config_dir.join("projects.yaml");
    save_yaml_config(&projects_path, &projects)
}

// ============================================================================
// Environments Commands
// ============================================================================

/// Loads all environments from disk.
#[tauri::command]
#[specta::specta]
pub async fn load_environments(app: AppHandle) -> Result<Vec<Environment>, String> {
    log::debug!("Loading environments from disk");
    let config_dir = get_config_dir(&app)?;
    let environments_path = config_dir.join("environments.yaml");
    load_yaml_config(&environments_path)
}

/// Saves all environments to disk.
#[tauri::command]
#[specta::specta]
pub async fn save_environments(app: AppHandle, environments: Vec<Environment>) -> Result<(), String> {
    log::debug!("Saving {} environments to disk", environments.len());
    let config_dir = get_config_dir(&app)?;
    let environments_path = config_dir.join("environments.yaml");
    save_yaml_config(&environments_path, &environments)
}

// ============================================================================
// Integrations Commands
// ============================================================================

/// Loads all integrations from disk.
#[tauri::command]
#[specta::specta]
pub async fn load_integrations(app: AppHandle) -> Result<Vec<Integration>, String> {
    log::debug!("Loading integrations from disk");
    let config_dir = get_config_dir(&app)?;
    let integrations_path = config_dir.join("integrations.yaml");
    load_yaml_config(&integrations_path)
}

/// Saves all integrations to disk.
#[tauri::command]
#[specta::specta]
pub async fn save_integrations(app: AppHandle, integrations: Vec<Integration>) -> Result<(), String> {
    log::debug!("Saving {} integrations to disk", integrations.len());
    let config_dir = get_config_dir(&app)?;
    let integrations_path = config_dir.join("integrations.yaml");
    save_yaml_config(&integrations_path, &integrations)
}

/// Tests the connection to an integration service.
#[tauri::command]
#[specta::specta]
pub async fn test_integration_connection(
    app: AppHandle,
    integration_id: String,
) -> Result<bool, String> {
    log::debug!("Testing connection for integration: {}", integration_id);

    use crate::integrations::registry::load_credentials;
    use crate::integrations::create_adapter;
    use crate::types::IntegrationType;
    use crate::integrations::errors::IntegrationError;

    // Load integration
    let integrations = load_integrations(app.clone()).await?;
    let integration = integrations
        .into_iter()
        .find(|i| i.id == integration_id)
        .ok_or_else(|| format!("Integration not found: {}", integration_id))?;

    // Special handling for Kubernetes (async adapter creation)
    if integration.integration_type == IntegrationType::Kubernetes {
        use crate::integrations::{IntegrationAdapter, kubernetes::KubernetesAdapter};
        let credentials = load_credentials(&app, &integration)
            .await
            .map_err(|e| format!("Failed to load credentials: {}", e))?;

        // Get kubeconfig path from custom fields or use defaults
        let kubeconfig_path = credentials
            .custom
            .get("kubeconfig_path")
            .cloned()
            .or_else(|| {
                // Try default paths
                if let Some(home) = dirs::home_dir() {
                    let microk8s_config = home.join(".kube").join("microk8s-config");
                    if microk8s_config.exists() {
                        return Some(microk8s_config.to_string_lossy().to_string());
                    }
                    let default_config = home.join(".kube").join("config");
                    if default_config.exists() {
                        return Some(default_config.to_string_lossy().to_string());
                    }
                }
                None
            })
            .ok_or_else(|| {
                "Kubernetes integration requires a kubeconfig_path in custom fields or default kubeconfig file".to_string()
            })?;

        let adapter = KubernetesAdapter::new(kubeconfig_path)
            .await
            .map_err(|e| format!("Failed to create Kubernetes adapter: {}", e))?;

        let result: Result<(), IntegrationError> = adapter.test_connection().await;
        result.map_err(|e| format!("Connection test failed: {}", e))?;
        log::info!("Successfully tested connection for integration: {}", integration_id);
        return Ok(true);
    }

    // For other integrations, use the standard adapter creation
    let credentials = load_credentials(&app, &integration)
        .await
        .map_err(|e| format!("Failed to load credentials: {}", e))?;

    let adapter = create_adapter(&integration, &credentials)
        .map_err(|e| format!("Failed to create adapter: {}", e))?;

    adapter
        .test_connection()
        .await
        .map_err(|e| format!("Connection test failed: {}", e))?;

    log::info!("Successfully tested connection for integration: {}", integration_id);
    Ok(true)
}

// ============================================================================
// Mappings Commands
// ============================================================================

/// Loads all mappings from disk.
#[tauri::command]
#[specta::specta]
pub async fn load_mappings(app: AppHandle) -> Result<Vec<Mapping>, String> {
    log::debug!("Loading mappings from disk");
    let config_dir = get_config_dir(&app)?;
    let mappings_path = config_dir.join("mappings.yaml");
    load_yaml_config(&mappings_path)
}

/// Saves all mappings to disk.
#[tauri::command]
#[specta::specta]
pub async fn save_mappings(app: AppHandle, mappings: Vec<Mapping>) -> Result<(), String> {
    log::debug!("Saving {} mappings to disk", mappings.len());
    let config_dir = get_config_dir(&app)?;
    let mappings_path = config_dir.join("mappings.yaml");
    save_yaml_config(&mappings_path, &mappings)
}

#[cfg(test)]
mod tests {
    use crate::types::{Environment, Integration, IntegrationType, Mapping, Project};

    /// Test that Project can be serialized and deserialized to/from YAML
    #[test]
    fn test_project_serialization() {
        let project = Project {
            id: "test-project-1".to_string(),
            name: "Test Project".to_string(),
            description: Some("A test project".to_string()),
            environments: vec!["env-1".to_string(), "env-2".to_string()],
        };

        // Test serialization
        let yaml = serde_yaml::to_string(&vec![project.clone()]).unwrap();
        assert!(yaml.contains("test-project-1"));
        assert!(yaml.contains("Test Project"));

        // Test deserialization
        let projects: Vec<Project> = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].id, project.id);
    }

    /// Test that Environment can be serialized and deserialized to/from YAML
    #[test]
    fn test_environment_serialization() {
        let environment = Environment {
            id: "env-1".to_string(),
            name: "dev".to_string(),
            namespace: Some("dev-namespace".to_string()),
            project_id: "project-1".to_string(),
        };

        let yaml = serde_yaml::to_string(&vec![environment.clone()]).unwrap();
        let environments: Vec<Environment> = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(environments.len(), 1);
        assert_eq!(environments[0].id, environment.id);
    }

    /// Test that Integration can be serialized and deserialized to/from YAML
    #[test]
    fn test_integration_serialization() {
        let integration = Integration {
            id: "integration-1".to_string(),
            integration_type: IntegrationType::GitLab,
            name: "GitLab Main".to_string(),
            base_url: "https://gitlab.com".to_string(),
            credentials_ref: Some("gitlab-main-creds".to_string()),
        };

        let yaml = serde_yaml::to_string(&vec![integration.clone()]).unwrap();
        let integrations: Vec<Integration> = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(integrations.len(), 1);
        assert_eq!(integrations[0].id, integration.id);
    }

    /// Test that Mapping can be serialized and deserialized to/from YAML
    #[test]
    fn test_mapping_serialization() {
        let mapping = Mapping {
            id: "mapping-1".to_string(),
            repo_id: Some("repo-123".to_string()),
            job_id: Some("job-456".to_string()),
            namespace: Some("prod-namespace".to_string()),
            service_name: Some("my-service".to_string()),
            project_id: Some("project-1".to_string()),
            environment_id: Some("env-1".to_string()),
        };

        let yaml = serde_yaml::to_string(&vec![mapping.clone()]).unwrap();
        let mappings: Vec<Mapping> = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(mappings.len(), 1);
        assert_eq!(mappings[0].id, mapping.id);
    }
}

