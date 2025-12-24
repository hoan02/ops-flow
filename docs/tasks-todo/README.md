# DevOps Center - Implementation Plan

## Tổng quan

Kế hoạch triển khai DevOps Center desktop application sử dụng Tauri. Ứng dụng đóng vai trò **Visualization** và **Configuration Orchestration**, không phải CI/CD system mới.

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop App (Tauri)                  │
├─────────────────────────────────────────────────────────┤
│  Frontend (React)          │  Backend (Rust)            │
│  - React Flow Canvas       │  - Integration Adapters    │
│  - Left Sidebar UI         │  - Config Management      │
│  - TanStack Query          │  - Credentials (keyring)   │
│  - Zustand Store           │  - HTTP Client (reqwest)  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    GitLab              Jenkins            Kubernetes
    SonarQube           Keycloak           (microk8s)
```

## Task Breakdown

### Phase 1: Foundation (Tasks 1-2)

- **Task 1**: Project Structure and Config Management
- **Task 2**: Integration Adapters Foundation

**Mục tiêu:** Thiết lập cấu trúc cơ bản, config management, và foundation cho integrations.

### Phase 2: Integrations (Tasks 3-6)

- **Task 3**: GitLab Integration
- **Task 4**: Jenkins Integration
- **Task 5**: Kubernetes Integration
- **Task 6**: SonarQube & Keycloak Integrations

**Mục tiêu:** Implement tất cả integration adapters để fetch data từ external systems.

### Phase 3: UI & Visualization (Tasks 7-9)

- **Task 7**: Left Sidebar UI
- **Task 8**: React Flow Canvas
- **Task 9**: Mapping System

**Mục tiêu:** Xây dựng UI để visualize và quản lý configs.

### Phase 4: Real-time & Actions (Tasks 10-11)

- **Task 10**: Real-time Status Polling
- **Task 11**: Light Actions

**Mục tiêu:** Real-time updates và trigger operations.

### Phase 5: Polish (Tasks 12-13)

- **Task 12**: UI Polish and i18n
- **Task 13**: Testing and Documentation

**Mục tiêu:** Hoàn thiện UI/UX, testing, và documentation.

## Nguyên tắc thiết kế

1. **Không over-engineering**: Giải pháp đơn giản nhất
2. **File-based config**: YAML/JSON, không dùng DB ban đầu
3. **Secure credentials**: OS keychain (keyring)
4. **Source of truth**: External systems (GitLab, Jenkins, etc.)
5. **No duplication**: Không duplicate data từ external systems
6. **Light actions only**: Chỉ trigger operations, không tạo logic CI/CD mới

## Dependencies

### Rust Crates cần thêm:

- `reqwest` - HTTP client
- `keyring` - OS keychain
- `k8s-openapi` + `kube` - Kubernetes client
- `serde_yaml` - YAML parsing
- `serde_json` - JSON (đã có)

### npm Packages cần thêm:

- `@xyflow/react` - React Flow
- `yaml` - YAML parsing (nếu cần ở frontend)

## File Structure (sẽ tạo)

```
src-tauri/src/
├── integrations/
│   ├── mod.rs
│   ├── registry.rs
│   ├── errors.rs
│   ├── gitlab/
│   ├── jenkins/
│   ├── kubernetes/
│   ├── sonarqube/
│   └── keycloak/
├── types/
│   ├── project.rs
│   ├── integration.rs
│   └── mapping.rs
└── commands/
    ├── projects.rs
    ├── environments.rs
    ├── integrations.rs
    └── mappings.rs

src/
├── components/
│   ├── projects/
│   ├── environments/
│   ├── integrations/
│   ├── mappings/
│   └── canvas/
├── services/
│   ├── projects.ts
│   ├── environments.ts
│   ├── integrations.ts
│   ├── mappings.ts
│   ├── gitlab.ts
│   ├── jenkins.ts
│   ├── kubernetes.ts
│   ├── sonarqube.ts
│   └── keycloak.ts
└── store/
    └── devops-store.ts
```

## Thứ tự ưu tiên

1. **Task 1** - Foundation (config management)
2. **Task 2** - Integration foundation
3. **Task 3-6** - Integrations (có thể làm song song một số)
4. **Task 7** - Left sidebar UI
5. **Task 8** - Canvas visualization
6. **Task 9** - Mapping system
7. **Task 10** - Real-time polling
8. **Task 11** - Light actions
9. **Task 12-13** - Polish và testing

## Notes

- Mỗi task có acceptance criteria rõ ràng
- Follow existing architecture patterns từ codebase
- Tests được viết song song với implementation
- Documentation được update khi thêm features mới

## Future Enhancements

Xem `task-x-future-enhancements.md` cho các tính năng có thể thêm sau (SQLite history, WebSocket, alerting, etc.)
