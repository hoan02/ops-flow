# Task 1: Project Structure and Config Management Foundation

## Mục tiêu

Thiết lập cấu trúc cơ bản cho DevOps Center: định nghĩa types, config management system, và file-based storage.

## Yêu cầu

### 1. Định nghĩa Core Types (Rust + TypeScript)

- **Project**: id, name, description, environments
- **Environment**: id, name (dev/staging/prod), namespace, project_id
- **Integration**: id, type (GitLab/Jenkins/K8s/SonarQube/Keycloak), name, config (base_url, credentials_ref)
- **Mapping**: repo_id ↔ job_id ↔ namespace, service_name, etc.

**Files:**

- `src-tauri/src/types/project.rs` - Rust types
- `src/types/project.ts` - TypeScript types (generated từ tauri-specta)

### 2. Config Management System (File-based)

- **Location**: `app_data_dir()/config/`
- **Format**: YAML cho human-readable, JSON cho programmatic access
- **Files**:
  - `projects.yaml` - Danh sách projects
  - `environments.yaml` - Environment configs
  - `integrations.yaml` - Integration configs (không chứa credentials)
  - `mappings.yaml` - Mapping giữa các hệ thống

**Rust Commands:**

- `load_projects() -> Result<Vec<Project>, String>`
- `save_projects(projects: Vec<Project>) -> Result<(), String>`
- Tương tự cho environments, integrations, mappings
- Atomic write pattern (write temp file, rename)

**React Services:**

- `src/services/projects.ts` - TanStack Query hooks
- `src/services/environments.ts`
- `src/services/integrations.ts`
- `src/services/mappings.ts`

### 3. Secure Credentials Storage

- Sử dụng `keyring` crate cho credentials
- Mỗi integration có `credentials_ref` (key trong keyring)
- Commands:
  - `save_integration_credentials(integration_id: String, credentials: IntegrationCredentials) -> Result<(), String>`
  - `get_integration_credentials(integration_id: String) -> Result<Option<IntegrationCredentials>, String>`

### 4. In-memory Cache với TTL

- Cache cho API responses từ external systems
- TTL ngắn (30-60 giây) cho real-time data
- Sử dụng TanStack Query với `staleTime` và `gcTime`

## Acceptance Criteria

- [ ] Rust types được định nghĩa và export qua tauri-specta
- [ ] TypeScript types được generate và có thể import
- [ ] Config files được load/save thành công với atomic writes
- [ ] Credentials được lưu vào OS keychain
- [ ] TanStack Query hooks hoạt động cho tất cả config types
- [ ] Tests cho config load/save operations

## Notes

- Không dùng database ở giai đoạn này
- Config files phải human-readable (YAML)
- Credentials KHÔNG được lưu trong config files
