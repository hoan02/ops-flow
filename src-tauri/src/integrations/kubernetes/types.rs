//! Kubernetes-specific types for API responses.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Kubernetes namespace representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct K8sNamespace {
    /// Namespace name
    pub name: String,
    /// Namespace status (e.g., "Active", "Terminating")
    pub status: String,
    /// Creation timestamp (ISO 8601 format)
    pub created_at: String,
}

/// Kubernetes pod representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct K8sPod {
    /// Pod name
    pub name: String,
    /// Namespace the pod belongs to
    pub namespace: String,
    /// Pod status (e.g., "Running", "Pending", "Failed", "Succeeded")
    pub status: String,
    /// List of container names in the pod
    pub containers: Vec<String>,
    /// Node name where the pod is running
    pub node: Option<String>,
}

/// Kubernetes service representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct K8sService {
    /// Service name
    pub name: String,
    /// Namespace the service belongs to
    pub namespace: String,
    /// Service type (e.g., "ClusterIP", "NodePort", "LoadBalancer", "ExternalName")
    pub r#type: String,
    /// List of ports exposed by the service
    pub ports: Vec<K8sServicePort>,
    /// Number of endpoints (if available)
    pub endpoint_count: Option<u32>,
}

/// Kubernetes service port representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct K8sServicePort {
    /// Port name (if specified)
    pub name: Option<String>,
    /// Port number
    pub port: u32,
    /// Target port (can be a number or string)
    pub target_port: Option<String>,
    /// Protocol (e.g., "TCP", "UDP")
    pub protocol: String,
}

