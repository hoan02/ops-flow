//! Keycloak-specific types for API responses.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Keycloak realm representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct KeycloakRealm {
    /// Realm identifier
    pub realm: String,
    /// Whether the realm is enabled
    pub enabled: bool,
}

/// Keycloak client representation.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct KeycloakClient {
    /// Client ID
    pub client_id: String,
    /// Client name
    pub name: String,
    /// Whether the client is enabled
    pub enabled: bool,
}
