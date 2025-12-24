//! Core types for DevOps Center: Projects, Environments, Integrations, and Mappings.
//!
//! These types are shared between Rust backend and TypeScript frontend via tauri-specta.

use serde::{Deserialize, Serialize};
use specta::Type;

// ============================================================================
// Project
// ============================================================================

/// A project represents a software project that can have multiple environments.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct Project {
    /// Unique identifier for the project
    pub id: String,
    /// Human-readable project name
    pub name: String,
    /// Optional project description
    pub description: Option<String>,
    /// List of environment IDs associated with this project
    pub environments: Vec<String>,
}

// ============================================================================
// Environment
// ============================================================================

/// An environment represents a deployment target (dev, staging, prod, etc.)
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct Environment {
    /// Unique identifier for the environment
    pub id: String,
    /// Environment name (e.g., "dev", "staging", "prod")
    pub name: String,
    /// Kubernetes namespace (if applicable)
    pub namespace: Option<String>,
    /// ID of the project this environment belongs to
    pub project_id: String,
}

// ============================================================================
// Integration
// ============================================================================

/// Type of integration system
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum IntegrationType {
    GitLab,
    Jenkins,
    Kubernetes,
    SonarQube,
    Keycloak,
}

/// Integration configuration (does not contain credentials)
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct Integration {
    /// Unique identifier for the integration
    pub id: String,
    /// Type of integration
    #[serde(rename = "type")]
    pub integration_type: IntegrationType,
    /// Human-readable integration name
    pub name: String,
    /// Base URL of the integration service
    pub base_url: String,
    /// Reference to credentials stored in OS keyring
    /// This is the key used to retrieve credentials from keyring
    pub credentials_ref: Option<String>,
}

// ============================================================================
// Mapping
// ============================================================================

/// Mapping between different system identifiers
/// Maps repository IDs to job IDs to namespaces, service names, etc.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct Mapping {
    /// Unique identifier for the mapping
    pub id: String,
    /// GitLab repository ID (if applicable)
    pub repo_id: Option<String>,
    /// Jenkins job ID (if applicable)
    pub job_id: Option<String>,
    /// Kubernetes namespace
    pub namespace: Option<String>,
    /// Service name in Kubernetes
    pub service_name: Option<String>,
    /// Project ID this mapping belongs to
    pub project_id: Option<String>,
    /// Environment ID this mapping belongs to
    pub environment_id: Option<String>,
}

// ============================================================================
// Integration Credentials
// ============================================================================

/// Credentials for an integration (stored securely in OS keyring)
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct IntegrationCredentials {
    /// API token or access token
    pub token: Option<String>,
    /// Username (if applicable)
    pub username: Option<String>,
    /// Password (if applicable)
    pub password: Option<String>,
    /// Additional custom fields as key-value pairs
    #[serde(default)]
    pub custom: std::collections::HashMap<String, String>,
}

