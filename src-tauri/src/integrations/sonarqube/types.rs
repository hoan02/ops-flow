//! SonarQube-specific types for API responses.

use serde::{Deserialize, Serialize};
use specta::Type;

/// SonarQube project representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct SonarQubeProject {
    /// Project key (unique identifier)
    pub key: String,
    /// Project name
    pub name: String,
    /// Project qualifier (e.g., "TRK" for track, "APP" for application)
    pub qualifier: String,
}

/// SonarQube metrics representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct SonarQubeMetrics {
    /// Code coverage percentage (0-100)
    pub coverage: Option<f64>,
    /// Number of bugs
    pub bugs: i32,
    /// Number of vulnerabilities
    pub vulnerabilities: i32,
    /// Number of code smells
    pub code_smells: i32,
    /// Technical debt in minutes (as string to avoid i64 BigInt issues)
    pub technical_debt: Option<String>,
}
