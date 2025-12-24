# Task 6: SonarQube and Keycloak Integration Adapters

## Mục tiêu

Implement SonarQube và Keycloak integration adapters để fetch code quality metrics và auth configs.

## Yêu cầu

### 1. SonarQube Adapter

- API endpoints:
  - `GET /api/projects/search` - List projects
  - `GET /api/measures/component` - Get metrics (coverage, bugs, vulnerabilities, code_smells)
  - `GET /api/ce/activity` - Get analysis activity

**Files:**

- `src-tauri/src/integrations/sonarqube.rs`
- `src-tauri/src/integrations/sonarqube/types.rs`

**Types:**

- `SonarQubeProject`: key, name, qualifier
- `SonarQubeMetrics`: coverage, bugs, vulnerabilities, code_smells, technical_debt

**Commands:**

- `fetch_sonarqube_projects(integration_id: String) -> Result<Vec<SonarQubeProject>, String>`
- `fetch_sonarqube_metrics(integration_id: String, project_key: String) -> Result<SonarQubeMetrics, String>`

**React Service:** `src/services/sonarqube.ts`

### 2. Keycloak Adapter

- API endpoints:
  - `GET /admin/realms` - List realms (nếu có admin access)
  - `GET /realms/{realm}/.well-known/openid-configuration` - Get realm config
  - `GET /admin/realms/{realm}/clients` - List clients (nếu có admin access)

**Files:**

- `src-tauri/src/integrations/keycloak.rs`
- `src-tauri/src/integrations/keycloak/types.rs`

**Types:**

- `KeycloakRealm`: realm, enabled
- `KeycloakClient`: client_id, name, enabled

**Commands:**

- `fetch_keycloak_realms(integration_id: String) -> Result<Vec<KeycloakRealm>, String>`
- `fetch_keycloak_clients(integration_id: String, realm: String) -> Result<Vec<KeycloakClient>, String>`

**React Service:** `src/services/keycloak.ts`

### 3. Credentials

- SonarQube: API token
- Keycloak: Admin username/password hoặc service account token
- Lưu vào keyring với keys: `sonarqube_{integration_id}`, `keycloak_{integration_id}`

## Acceptance Criteria

- [ ] SonarQube adapter fetch được projects và metrics
- [ ] Keycloak adapter fetch được realms và clients
- [ ] Credentials được lưu và load từ keyring
- [ ] Error handling cho auth failures
- [ ] TanStack Query hooks hoạt động với caching
- [ ] Tests cho cả hai adapters

## Notes

- SonarQube và Keycloak có thể không có admin access trong một số trường hợp
- Handle gracefully khi không có permissions
- Cache metrics với TTL dài hơn (5-10 phút) vì không thay đổi thường xuyên
