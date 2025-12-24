# Task 9: Mapping System - Connect Systems Together

## Mục tiêu

Xây dựng mapping system để kết nối GitLab repos với Jenkins jobs, K8s namespaces, và các hệ thống khác.

## Yêu cầu

### 1. Mapping Types

Định nghĩa mapping types:

- **Repo → Job**: GitLab project → Jenkins job
- **Job → Namespace**: Jenkins job → K8s namespace
- **Repo → SonarQube**: GitLab project → SonarQube project
- **Namespace → Services**: K8s namespace → Services mapping
- **Service → Pods**: K8s service → Pods mapping

**Rust Types:** `src-tauri/src/types/mapping.rs`
**TypeScript Types:** Generated từ tauri-specta

### 2. Mapping Config Structure

```yaml
mappings:
  - id: 'mapping-1'
    type: 'repo_to_job'
    source:
      integration_id: 'gitlab-1'
      project_id: 123
      repo_path: 'group/project'
    target:
      integration_id: 'jenkins-1'
      job_name: 'build-project'
  - id: 'mapping-2'
    type: 'job_to_namespace'
    source:
      integration_id: 'jenkins-1'
      job_name: 'build-project'
    target:
      integration_id: 'k8s-1'
      namespace: 'project-dev'
```

**File:** `config/mappings.yaml`

### 3. Mapping CRUD Operations

- Create mapping (validate source/target exist)
- Read mappings (filter by type, source, target)
- Update mapping
- Delete mapping
- Validate mapping (check if source/target still exist)

**Rust Commands:**

- `create_mapping(mapping: Mapping) -> Result<Mapping, String>`
- `get_mappings(filters: Option<MappingFilters>) -> Result<Vec<Mapping>, String>`
- `update_mapping(mapping_id: String, mapping: Mapping) -> Result<Mapping, String>`
- `delete_mapping(mapping_id: String) -> Result<(), String>`
- `validate_mapping(mapping_id: String) -> Result<MappingValidation, String>`

**React Service:** `src/services/mappings.ts`

### 4. Mapping UI

- Mapping editor dialog
- Visual mapping builder (drag & drop từ source → target)
- Mapping list với validation status
- Auto-suggest mappings dựa trên naming conventions

**Components:**

- `src/components/mappings/MappingList.tsx`
- `src/components/mappings/MappingDialog.tsx`
- `src/components/mappings/MappingBuilder.tsx`

### 5. Canvas Integration

- Sử dụng mappings để tạo edges trong React Flow canvas
- Auto-detect relationships từ mappings
- Highlight mappings khi hover

## Acceptance Criteria

- [ ] Mapping types được định nghĩa đầy đủ
- [ ] CRUD operations hoạt động
- [ ] Mapping validation hoạt động
- [ ] UI cho create/edit mappings
- [ ] Mappings được sử dụng trong canvas để tạo edges
- [ ] Auto-suggest hoạt động (nếu implement)
- [ ] Tests cho mapping operations

## Notes

- Mappings là source of truth cho relationships
- Validate mappings khi load để đảm bảo source/target còn tồn tại
- Support cho multiple mappings cùng type (one-to-many, many-to-one)
