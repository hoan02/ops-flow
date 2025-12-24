//! Jenkins-specific types for API responses.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Jenkins job representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct JenkinsJob {
    /// Job name
    pub name: String,
    /// Job URL
    pub url: String,
    /// Job color/status indicator (e.g., "blue" for success, "red" for failure, "notbuilt" for not built)
    pub color: String,
}

/// Jenkins build status enumeration.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum JenkinsBuildStatus {
    Success,
    Failure,
    Unstable,
    Aborted,
    NotBuilt,
    Building,
    Pending,
}

/// Jenkins build representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct JenkinsBuild {
    /// Build number
    pub number: u32,
    /// Build status
    pub status: JenkinsBuildStatus,
    /// Build timestamp (Unix timestamp in milliseconds, as string to avoid i64 BigInt issues)
    pub timestamp: String,
    /// Build URL
    pub url: String,
    /// Build duration in milliseconds (None if still building, as string to avoid i64 BigInt issues)
    pub duration: Option<String>,
}
