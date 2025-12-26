//! Flow editor persistence commands.
//!
//! Handles loading and saving flow editor data to disk.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::types::validate_string_input;

/// Flow metadata for listing saved flows
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FlowMetadata {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Complete flow data including nodes and edges
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Flow {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub nodes: serde_json::Value,
    pub edges: serde_json::Value,
    pub viewport: Option<serde_json::Value>,
}

/// Gets the path to the flows directory.
fn get_flows_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    let flows_dir = app_data_dir.join("flows");

    // Ensure the directory exists
    std::fs::create_dir_all(&flows_dir)
        .map_err(|e| format!("Failed to create flows directory: {e}"))?;

    Ok(flows_dir)
}

/// Gets the path to a specific flow file.
fn get_flow_path(app: &AppHandle, flow_id: &str) -> Result<PathBuf, String> {
    validate_string_input(flow_id, 100, "Flow ID").map_err(|e| {
        log::warn!("Invalid flow ID: {e}");
        e
    })?;

    // Sanitize flow_id to prevent path traversal
    let sanitized_id = flow_id
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>();

    if sanitized_id.is_empty() {
        return Err("Flow ID cannot be empty".to_string());
    }

    let flows_dir = get_flows_dir(app)?;
    Ok(flows_dir.join(format!("{sanitized_id}.json")))
}

/// Load list of all saved flows (metadata only).
#[tauri::command]
#[specta::specta]
pub async fn load_flows(app: AppHandle) -> Result<Vec<FlowMetadata>, String> {
    log::debug!("Loading flows list");
    let flows_dir = get_flows_dir(&app)?;

    if !flows_dir.exists() {
        log::info!("Flows directory does not exist, returning empty list");
        return Ok(vec![]);
    }

    let mut flows = Vec::new();

    let entries = std::fs::read_dir(&flows_dir).map_err(|e| {
        log::error!("Failed to read flows directory: {e}");
        format!("Failed to read flows directory: {e}")
    })?;

    for entry in entries {
        let entry = entry.map_err(|e| {
            log::error!("Failed to read directory entry: {e}");
            format!("Failed to read directory entry: {e}")
        })?;

        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }

        match std::fs::read_to_string(&path) {
            Ok(contents) => match serde_json::from_str::<Flow>(&contents) {
                Ok(flow) => {
                    flows.push(FlowMetadata {
                        id: flow.id,
                        name: flow.name,
                        created_at: flow.created_at,
                        updated_at: flow.updated_at,
                    });
                }
                Err(e) => {
                    log::warn!("Failed to parse flow file {:?}: {e}", path);
                }
            },
            Err(e) => {
                log::warn!("Failed to read flow file {:?}: {e}", path);
            }
        }
    }

    // Sort by updated_at descending (most recent first)
    flows.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    log::info!("Loaded {} flows", flows.len());
    Ok(flows)
}

/// Load a specific flow by ID.
#[tauri::command]
#[specta::specta]
pub async fn load_flow(app: AppHandle, flow_id: String) -> Result<Flow, String> {
    log::debug!("Loading flow: {flow_id}");
    let flow_path = get_flow_path(&app, &flow_id)?;

    if !flow_path.exists() {
        return Err(format!("Flow not found: {flow_id}"));
    }

    let contents = std::fs::read_to_string(&flow_path).map_err(|e| {
        log::error!("Failed to read flow file: {e}");
        format!("Failed to read flow file: {e}")
    })?;

    let flow: Flow = serde_json::from_str(&contents).map_err(|e| {
        log::error!("Failed to parse flow JSON: {e}");
        format!("Failed to parse flow: {e}")
    })?;

    log::info!("Successfully loaded flow: {flow_id}");
    Ok(flow)
}

/// Save a flow to disk.
/// Uses atomic write (temp file + rename) to prevent corruption.
#[tauri::command]
#[specta::specta]
pub async fn save_flow(app: AppHandle, flow: Flow) -> Result<(), String> {
    validate_string_input(&flow.id, 100, "Flow ID").map_err(|e| {
        log::warn!("Invalid flow ID: {e}");
        e
    })?;

    validate_string_input(&flow.name, 200, "Flow name").map_err(|e| {
        log::warn!("Invalid flow name: {e}");
        e
    })?;

    log::debug!("Saving flow: {} ({})", flow.name, flow.id);
    let flow_path = get_flow_path(&app, &flow.id)?;

    let json_content = serde_json::to_string_pretty(&flow).map_err(|e| {
        log::error!("Failed to serialize flow: {e}");
        format!("Failed to serialize flow: {e}")
    })?;

    // Write to a temporary file first, then rename (atomic operation)
    let temp_path = flow_path.with_extension("tmp");

    std::fs::write(&temp_path, json_content).map_err(|e| {
        log::error!("Failed to write flow file: {e}");
        format!("Failed to write flow file: {e}")
    })?;

    if let Err(rename_err) = std::fs::rename(&temp_path, &flow_path) {
        log::error!("Failed to finalize flow file: {rename_err}");
        // Clean up the temp file to avoid leaving orphaned files on disk
        if let Err(remove_err) = std::fs::remove_file(&temp_path) {
            log::warn!("Failed to remove temp file after rename failure: {remove_err}");
        }
        return Err(format!("Failed to finalize flow file: {rename_err}"));
    }

    log::info!("Successfully saved flow to {flow_path:?}");
    Ok(())
}

/// Delete a flow by ID.
#[tauri::command]
#[specta::specta]
pub async fn delete_flow(app: AppHandle, flow_id: String) -> Result<(), String> {
    log::debug!("Deleting flow: {flow_id}");
    let flow_path = get_flow_path(&app, &flow_id)?;

    if !flow_path.exists() {
        return Err(format!("Flow not found: {flow_id}"));
    }

    std::fs::remove_file(&flow_path).map_err(|e| {
        log::error!("Failed to delete flow file: {e}");
        format!("Failed to delete flow: {e}")
    })?;

    log::info!("Successfully deleted flow: {flow_id}");
    Ok(())
}
