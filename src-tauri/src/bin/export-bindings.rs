//! Binary to export TypeScript bindings for Tauri commands.
//!
//! Run with: cargo run --bin export-bindings
//!
//! This is a separate binary to avoid Windows DLL issues when running as a test.

fn main() {
    tauri_app_lib::bindings::export_ts_bindings();
    println!("✓ TypeScript bindings exported to ../src/lib/bindings.ts");
}
