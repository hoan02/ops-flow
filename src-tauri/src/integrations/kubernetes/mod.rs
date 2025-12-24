//! Kubernetes integration adapter.
//!
//! Implements the IntegrationAdapter trait for Kubernetes API interactions.

mod adapter;
mod types;

pub use adapter::KubernetesAdapter;
pub use types::{K8sNamespace, K8sPod, K8sService};
