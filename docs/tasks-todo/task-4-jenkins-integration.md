# Task 4: Jenkins Integration Adapter

## Mục tiêu
Implement Jenkins integration adapter để fetch jobs, builds, và trigger builds.

## Yêu cầu

### 1. Jenkins Adapter Implementation
- Implement `IntegrationAdapter` trait cho Jenkins
- API endpoints:
  - `GET /api/json?tree=jobs[name,url,color]` - List jobs
  - `GET /job/{job_name}/api/json?tree=builds[number,status,timestamp,url]` - Get builds
  - `GET /job/{job_name}/{build_number}/api/json` - Get build details
  - `POST /job/{job_name}/build` - Trigger build (light action)

**File:** `src-tauri/src/integrations/jenkins.rs`

### 2. Jenkins Types
- `JenkinsJob`: name, url, color (status indicator)
- `JenkinsBuild`: number, status, timestamp, url, duration
- `JenkinsBuildStatus`: success, failure, building, aborted, etc.

**File:** `src-tauri/src/integrations/jenkins/types.rs`

### 3. Tauri Commands
- `fetch_jenkins_jobs(integration_id: String) -> Result<Vec<JenkinsJob>, String>`
- `fetch_jenkins_builds(integration_id: String, job_name: String) -> Result<Vec<JenkinsBuild>, String>`
- `fetch_jenkins_build_details(integration_id: String, job_name: String, build_number: u32) -> Result<JenkinsBuild, String>`
- `trigger_jenkins_build(integration_id: String, job_name: String, parameters: Option<HashMap<String, String>>) -> Result<(), String>`

**Register trong:** `src-tauri/src/bindings.rs`

### 4. React Service
- TanStack Query hooks:
  - `useJenkinsJobs(integrationId: string)`
  - `useJenkinsBuilds(integrationId: string, jobName: string)`
  - `useJenkinsBuildDetails(integrationId: string, jobName: string, buildNumber: number)`
  - `useTriggerJenkinsBuild()` (mutation)

**File:** `src/services/jenkins.ts`

### 5. Credentials
- Jenkins API token hoặc username/password
- Lưu vào keyring với key: `jenkins_{integration_id}`

## Acceptance Criteria
- [ ] Jenkins adapter có thể fetch jobs
- [ ] Build status được fetch thành công
- [ ] Build details được fetch
- [ ] Trigger build action hoạt động
- [ ] Credentials được lưu và load từ keyring
- [ ] Error handling cho auth failures, network errors
- [ ] TanStack Query hooks hoạt động với caching
- [ ] Tests cho Jenkins adapter

## Notes
- Jenkins API sử dụng Basic Auth hoặc API token
- Trigger build là light action (không tạo logic CI/CD mới)
- Cache với TTL ngắn cho real-time status

