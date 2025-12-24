//! GitLab-specific types for API responses.

use serde::{Deserialize, Serialize};
use specta::Type;

/// GitLab project representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct GitLabProject {
    /// Project ID
    pub id: u32,
    /// Project name
    pub name: String,
    /// Project path (e.g., "group/project")
    pub path: String,
    /// Web URL to access the project
    pub web_url: String,
}

/// GitLab pipeline representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct GitLabPipeline {
    /// Pipeline ID
    pub id: u32,
    /// Pipeline status (e.g., "success", "failed", "running", "pending")
    pub status: String,
    /// Git reference (branch or tag)
    pub r#ref: String,
    /// Creation timestamp (ISO 8601 format)
    pub created_at: String,
}

/// GitLab webhook representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct GitLabWebhook {
    /// Webhook ID
    pub id: u32,
    /// Webhook URL
    pub url: String,
    /// List of events this webhook subscribes to
    pub events: Vec<String>,
}
