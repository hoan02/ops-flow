//! Kubernetes integration commands.
//!
//! Provides Tauri commands for interacting with Kubernetes API through the adapter.

use crate::integrations::kubernetes::{K8sNamespace, K8sPod, K8sService, KubernetesAdapter};
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

/// Helper function to create a Kubernetes adapter for an integration.
async fn create_kubernetes_adapter(
    app: &AppHandle,
    integration: &Integration,
) -> Result<KubernetesAdapter, String> {
    if integration.integration_type != crate::types::IntegrationType::Kubernetes {
        return Err(format!(
            "Integration {} is not a Kubernetes integration",
            integration.id
        ));
    }

    let credentials = load_credentials(app, integration)
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

    KubernetesAdapter::new(kubeconfig_path)
        .await
        .map_err(|e| format!("Failed to create Kubernetes adapter: {}", e))
}

/// Fetches Kubernetes namespaces for a given integration.
#[tauri::command]
#[specta::specta]
pub async fn fetch_k8s_namespaces(
    app: AppHandle,
    integration_id: String,
) -> Result<Vec<K8sNamespace>, String> {
    log::debug!("Fetching Kubernetes namespaces for integration: {}", integration_id);

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_kubernetes_adapter(&app, &integration).await?;

    adapter
        .fetch_namespaces()
        .await
        .map_err(|e| format!("Failed to fetch namespaces: {}", e))
}

/// Fetches Kubernetes pods in a specific namespace.
#[tauri::command]
#[specta::specta]
pub async fn fetch_k8s_pods(
    app: AppHandle,
    integration_id: String,
    namespace: String,
) -> Result<Vec<K8sPod>, String> {
    log::debug!(
        "Fetching Kubernetes pods for integration: {}, namespace: {}",
        integration_id,
        namespace
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_kubernetes_adapter(&app, &integration).await?;

    adapter
        .fetch_pods(&namespace)
        .await
        .map_err(|e| format!("Failed to fetch pods: {}", e))
}

/// Fetches Kubernetes services in a specific namespace.
#[tauri::command]
#[specta::specta]
pub async fn fetch_k8s_services(
    app: AppHandle,
    integration_id: String,
    namespace: String,
) -> Result<Vec<K8sService>, String> {
    log::debug!(
        "Fetching Kubernetes services for integration: {}, namespace: {}",
        integration_id,
        namespace
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_kubernetes_adapter(&app, &integration).await?;

    adapter
        .fetch_services(&namespace)
        .await
        .map_err(|e| format!("Failed to fetch services: {}", e))
}

/// Fetches detailed information for a specific Kubernetes pod.
#[tauri::command]
#[specta::specta]
pub async fn fetch_k8s_pod_details(
    app: AppHandle,
    integration_id: String,
    namespace: String,
    pod_name: String,
) -> Result<K8sPod, String> {
    log::debug!(
        "Fetching Kubernetes pod details for integration: {}, namespace: {}, pod: {}",
        integration_id,
        namespace,
        pod_name
    );

    let integration = get_integration(&app, &integration_id).await?;
    let adapter = create_kubernetes_adapter(&app, &integration).await?;

    adapter
        .fetch_pod_details(&namespace, &pod_name)
        .await
        .map_err(|e| format!("Failed to fetch pod details: {}", e))
}

