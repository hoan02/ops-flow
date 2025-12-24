# Task 2: Integration Adapters Foundation

## Mục tiêu
Xây dựng foundation cho integration adapters: HTTP client setup, error handling, và base adapter pattern.

## Yêu cầu

### 1. HTTP Client Setup
- Thêm `reqwest` với features: `json`, `rustls-tls`
- Tạo shared HTTP client với:
  - Timeout configuration
  - Retry logic cho network errors
  - Error handling patterns

**File:** `src-tauri/src/utils/http_client.rs`

### 2. Base Integration Adapter Trait
- Định nghĩa trait `IntegrationAdapter` với:
  - `test_connection() -> Result<(), String>`
  - `get_name() -> String`
  - Common error types

**File:** `src-tauri/src/integrations/mod.rs`

### 3. Integration Registry
- Registry để quản lý các adapters
- Load credentials từ keyring khi cần
- Cache adapter instances

**File:** `src-tauri/src/integrations/registry.rs`

### 4. Error Handling
- Custom error types cho mỗi integration
- Network errors, auth errors, API errors
- User-friendly error messages

**File:** `src-tauri/src/integrations/errors.rs`

## Acceptance Criteria
- [ ] HTTP client được setup với proper configuration
- [ ] Base adapter trait được định nghĩa
- [ ] Integration registry có thể load và cache adapters
- [ ] Error handling patterns được implement
- [ ] Tests cho HTTP client và error handling

## Notes
- Chưa implement specific adapters (sẽ làm ở task sau)
- Focus vào architecture và patterns
- Tất cả HTTP calls đi qua Rust (không dùng fetch từ frontend)

