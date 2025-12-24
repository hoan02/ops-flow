//! Tauri command handlers organized by domain.
//!
//! Each submodule contains related commands and their helper functions.
//! Import specific commands via their submodule (e.g., `commands::preferences::greet`).

pub mod config;
pub mod credentials;
pub mod gitlab;
pub mod jenkins;
pub mod keycloak;
pub mod kubernetes;
pub mod notifications;
pub mod preferences;
pub mod quick_pane;
pub mod recovery;
pub mod sonarqube;
