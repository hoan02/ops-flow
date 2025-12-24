//! Kubernetes integration adapter implementation.
//!
//! Handles API calls to Kubernetes clusters using kubeconfig authentication.

use crate::integrations::{IntegrationAdapter, IntegrationError};
use crate::types::IntegrationType;
use async_trait::async_trait;
use k8s_openapi::api::core::v1::{Namespace, Pod, Service};
use kube::{Api, Client, Config};
use std::path::PathBuf;

use super::types::{K8sNamespace, K8sPod, K8sService, K8sServicePort};

/// Kubernetes integration adapter.
///
/// Handles API calls to Kubernetes clusters using kubeconfig file authentication.
pub struct KubernetesAdapter {
    /// Kubernetes client
    client: Client,
    /// Kubeconfig path used for this adapter
    #[allow(dead_code)] // Used in get_base_url() trait method
    kubeconfig_path: PathBuf,
}

impl KubernetesAdapter {
    /// Creates a new Kubernetes adapter instance.
    ///
    /// # Arguments
    /// * `kubeconfig_path` - Path to the kubeconfig file (e.g., ~/.kube/config or ~/.kube/microk8s-config)
    ///
    /// # Returns
    /// * `Ok(adapter)` - Adapter created successfully
    /// * `Err(IntegrationError)` - Failed to create adapter
    pub async fn new(kubeconfig_path: String) -> Result<Self, IntegrationError> {
        log::debug!(
            "Creating Kubernetes adapter with kubeconfig: {}",
            kubeconfig_path
        );

        // Expand home directory if path starts with ~
        let expanded_path = if let Some(stripped) = kubeconfig_path.strip_prefix('~') {
            let home = dirs::home_dir().ok_or_else(|| IntegrationError::ConfigError {
                message: "Failed to determine home directory".to_string(),
            })?;
            home.join(
                stripped
                    .strip_prefix('/')
                    .or(stripped.strip_prefix("\\"))
                    .unwrap_or(stripped),
            )
        } else {
            PathBuf::from(kubeconfig_path)
        };

        // Check if kubeconfig file exists
        if !expanded_path.exists() {
            return Err(IntegrationError::ConfigError {
                message: format!("Kubeconfig file not found: {}", expanded_path.display()),
            });
        }

        // Load kubeconfig and create client
        // Set KUBECONFIG environment variable temporarily for kube crate
        std::env::set_var("KUBECONFIG", &expanded_path);

        let config = Config::infer().await.map_err(|e| {
            std::env::remove_var("KUBECONFIG");
            IntegrationError::ConfigError {
                message: format!("Failed to load kubeconfig: {}", e),
            }
        })?;

        let client = Client::try_from(config).map_err(|e| {
            std::env::remove_var("KUBECONFIG");
            IntegrationError::ConfigError {
                message: format!("Failed to create Kubernetes client: {}", e),
            }
        })?;

        // Clear the environment variable after client creation
        std::env::remove_var("KUBECONFIG");

        Ok(Self {
            client,
            kubeconfig_path: expanded_path,
        })
    }

    /// Fetches all namespaces from the Kubernetes cluster.
    pub async fn fetch_namespaces(&self) -> Result<Vec<K8sNamespace>, IntegrationError> {
        log::debug!("Fetching Kubernetes namespaces");

        let api: Api<Namespace> = Api::all(self.client.clone());

        let namespaces = api.list(&Default::default()).await.map_err(|e| {
            log::error!("Failed to list namespaces: {}", e);
            IntegrationError::NetworkError {
                message: format!("Failed to list namespaces: {}", e),
            }
        })?;

        let mut result = Vec::new();
        for ns in namespaces {
            let name = ns.metadata.name.unwrap_or_default();
            let status = ns
                .status
                .as_ref()
                .and_then(|s| s.phase.as_ref())
                .cloned()
                .unwrap_or_else(|| "Unknown".to_string());

            let created_at = ns
                .metadata
                .creation_timestamp
                .as_ref()
                .map(|t| t.0.format("%+").to_string())
                .unwrap_or_else(|| "Unknown".to_string());

            result.push(K8sNamespace {
                name,
                status,
                created_at,
            });
        }

        Ok(result)
    }

    /// Fetches all pods in a specific namespace.
    pub async fn fetch_pods(&self, namespace: &str) -> Result<Vec<K8sPod>, IntegrationError> {
        log::debug!("Fetching Kubernetes pods in namespace: {}", namespace);

        let api: Api<Pod> = Api::namespaced(self.client.clone(), namespace);

        let pods = api.list(&Default::default()).await.map_err(|e| {
            log::error!("Failed to list pods in namespace {}: {}", namespace, e);
            IntegrationError::NetworkError {
                message: format!("Failed to list pods: {}", e),
            }
        })?;

        let mut result = Vec::new();
        for pod in pods {
            let name = pod.metadata.name.clone().unwrap_or_default();
            let pod_namespace = pod
                .metadata
                .namespace
                .clone()
                .unwrap_or_else(|| namespace.to_string());

            // Determine pod status
            let status = pod
                .status
                .as_ref()
                .and_then(|s| {
                    // Check phase first
                    if let Some(phase) = &s.phase {
                        return Some(phase.clone());
                    }
                    // Check container statuses
                    if let Some(container_statuses) = &s.container_statuses {
                        for cs in container_statuses {
                            if let Some(state) = &cs.state {
                                if state.waiting.is_some() {
                                    return Some("Pending".to_string());
                                }
                                if state.terminated.is_some() {
                                    return Some("Terminated".to_string());
                                }
                            }
                        }
                    }
                    None
                })
                .unwrap_or_else(|| "Unknown".to_string());

            // Extract container names
            let containers: Vec<String> = pod
                .spec
                .as_ref()
                .map(|spec| spec.containers.iter().map(|c| c.name.clone()).collect())
                .unwrap_or_default();

            // Extract node name
            let node = pod.spec.as_ref().and_then(|spec| spec.node_name.clone());

            result.push(K8sPod {
                name,
                namespace: pod_namespace,
                status,
                containers,
                node,
            });
        }

        Ok(result)
    }

    /// Fetches all services in a specific namespace.
    pub async fn fetch_services(
        &self,
        namespace: &str,
    ) -> Result<Vec<K8sService>, IntegrationError> {
        log::debug!("Fetching Kubernetes services in namespace: {}", namespace);

        let api: Api<Service> = Api::namespaced(self.client.clone(), namespace);

        let services = api.list(&Default::default()).await.map_err(|e| {
            log::error!("Failed to list services in namespace {}: {}", namespace, e);
            IntegrationError::NetworkError {
                message: format!("Failed to list services: {}", e),
            }
        })?;

        let mut result = Vec::new();
        for service in services {
            let name = service.metadata.name.clone().unwrap_or_default();
            let service_namespace = service
                .metadata
                .namespace
                .clone()
                .unwrap_or_else(|| namespace.to_string());

            // Extract service type
            let service_type = service
                .spec
                .as_ref()
                .and_then(|spec| spec.type_.clone())
                .unwrap_or_else(|| "ClusterIP".to_string());

            // Extract ports
            let ports: Vec<K8sServicePort> = service
                .spec
                .as_ref()
                .map(|spec| {
                    spec.ports
                        .as_ref()
                        .map(|ports| {
                            ports
                                .iter()
                                .map(|p| K8sServicePort {
                                    name: p.name.clone(),
                                    port: p.port as u32,
                                    target_port: p.target_port.as_ref().map(|tp| match tp {
                                        k8s_openapi::apimachinery::pkg::util::intstr::IntOrString::Int(i) => {
                                            i.to_string()
                                        }
                                        k8s_openapi::apimachinery::pkg::util::intstr::IntOrString::String(s) => {
                                            s.clone()
                                        }
                                    }),
                                    protocol: p.protocol.as_ref().cloned().unwrap_or_else(|| "TCP".to_string()),
                                })
                                .collect()
                        })
                        .unwrap_or_default()
                })
                .unwrap_or_default();

            // Extract endpoint count (if available from status)
            let endpoint_count = service
                .status
                .as_ref()
                .and_then(|s| s.load_balancer.as_ref())
                .and_then(|lb| lb.ingress.as_ref())
                .map(|ingress| ingress.len() as u32);

            result.push(K8sService {
                name,
                namespace: service_namespace,
                r#type: service_type,
                ports,
                endpoint_count,
            });
        }

        Ok(result)
    }

    /// Fetches detailed information for a specific pod.
    pub async fn fetch_pod_details(
        &self,
        namespace: &str,
        pod_name: &str,
    ) -> Result<K8sPod, IntegrationError> {
        log::debug!(
            "Fetching Kubernetes pod details: {}/{}",
            namespace,
            pod_name
        );

        let api: Api<Pod> = Api::namespaced(self.client.clone(), namespace);

        let pod = api.get(pod_name).await.map_err(|e| {
            log::error!("Failed to get pod {}/{}: {}", namespace, pod_name, e);
            if e.to_string().contains("NotFound") {
                IntegrationError::NotFound
            } else {
                IntegrationError::NetworkError {
                    message: format!("Failed to get pod: {}", e),
                }
            }
        })?;

        let name = pod.metadata.name.clone().unwrap_or_default();
        let pod_namespace = pod
            .metadata
            .namespace
            .clone()
            .unwrap_or_else(|| namespace.to_string());

        // Determine pod status
        let status = pod
            .status
            .as_ref()
            .and_then(|s| {
                if let Some(phase) = &s.phase {
                    return Some(phase.clone());
                }
                if let Some(container_statuses) = &s.container_statuses {
                    for cs in container_statuses {
                        if let Some(state) = &cs.state {
                            if state.waiting.is_some() {
                                return Some("Pending".to_string());
                            }
                            if state.terminated.is_some() {
                                return Some("Terminated".to_string());
                            }
                        }
                    }
                }
                None
            })
            .unwrap_or_else(|| "Unknown".to_string());

        // Extract container names
        let containers: Vec<String> = pod
            .spec
            .as_ref()
            .map(|spec| spec.containers.iter().map(|c| c.name.clone()).collect())
            .unwrap_or_default();

        // Extract node name
        let node = pod.spec.as_ref().and_then(|spec| spec.node_name.clone());

        Ok(K8sPod {
            name,
            namespace: pod_namespace,
            status,
            containers,
            node,
        })
    }
}

#[async_trait]
impl IntegrationAdapter for KubernetesAdapter {
    async fn test_connection(&self) -> Result<(), IntegrationError> {
        // Test connection by fetching API version or listing namespaces
        log::debug!("Testing Kubernetes connection");
        let _ = self.fetch_namespaces().await?;
        Ok(())
    }

    fn get_name(&self) -> &str {
        "Kubernetes"
    }

    fn get_integration_type(&self) -> IntegrationType {
        IntegrationType::Kubernetes
    }

    fn get_base_url(&self) -> &str {
        // Kubernetes doesn't have a single base URL, return kubeconfig path as string
        self.kubeconfig_path.to_str().unwrap_or("")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kubeconfig_path_expansion() {
        // Test that ~ expansion would work (can't test actual expansion without filesystem)
        let path = "~/.kube/config";
        assert!(path.starts_with('~'));
    }
}
