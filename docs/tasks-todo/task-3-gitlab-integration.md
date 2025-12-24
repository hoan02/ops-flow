# Task 3: GitLab Integration Adapter

## Mục tiêu

Implement GitLab integration adapter để fetch projects, pipelines, và webhooks.

## Yêu cầu

### 1. GitLab Adapter Implementation

- Implement `IntegrationAdapter` trait cho GitLab
- API endpoints cần thiết:
  - `GET /api/v4/projects` - List projects
  - `GET /api/v4/projects/{id}/pipelines` - Get pipeline status
  - `GET /api/v4/projects/{id}/webhooks` - List webhooks
  - `POST /api/v4/projects/{id}/trigger/pipeline` - Trigger pipeline (optional, light action)

**File:** `src-tauri/src/integrations/gitlab.rs`

### 2. GitLab Types

- `GitLabProject`: id, name, path, web_url
- `GitLabPipeline`: id, status, ref, created_at
- `GitLabWebhook`: id, url, events

**File:** `src-tauri/src/integrations/gitlab/types.rs`

### 3. Tauri Commands

- `fetch_gitlab_projects(integration_id: String) -> Result<Vec<GitLabProject>, String>`
- `fetch_gitlab_pipelines(integration_id: String, project_id: u32) -> Result<Vec<GitLabPipeline>, String>`
- `fetch_gitlab_webhooks(integration_id: String, project_id: u32) -> Result<Vec<GitLabWebhook>, String>`
- `trigger_gitlab_pipeline(integration_id: String, project_id: u32, ref: String) -> Result<GitLabPipeline, String>` (optional)

**Register trong:** `src-tauri/src/bindings.rs`

### 4. React Service

- TanStack Query hooks:
  - `useGitLabProjects(integrationId: string)`
  - `useGitLabPipelines(integrationId: string, projectId: number)`
  - `useGitLabWebhooks(integrationId: string, projectId: number)`
  - `useTriggerGitLabPipeline()` (mutation)

**File:** `src/services/gitlab.ts`

### 5. Credentials

- GitLab Personal Access Token hoặc OAuth token
- Lưu vào keyring với key: `gitlab_{integration_id}`

## Acceptance Criteria

- [ ] GitLab adapter có thể fetch projects
- [ ] Pipeline status được fetch thành công
- [ ] Webhooks được list
- [ ] Credentials được lưu và load từ keyring
- [ ] Error handling cho auth failures, network errors
- [ ] TanStack Query hooks hoạt động với caching
- [ ] Tests cho GitLab adapter

## Notes

- Chỉ implement read operations + optional trigger action
- Không tạo webhook mới (source of truth là GitLab)
- Cache với TTL ngắn (30-60s) cho real-time data
