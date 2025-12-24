# Task 13: Testing and Documentation

## Mục tiêu

Viết tests và documentation cho DevOps Center features.

## Yêu cầu

### 1. Unit Tests

- Rust tests cho:
  - Config management (load/save)
  - Integration adapters (mock HTTP responses)
  - Mapping validation
  - Credentials storage

**Files:**

- `src-tauri/src/commands/*.rs` - Add `#[cfg(test)]` modules
- `src-tauri/src/integrations/*/mod.rs` - Test adapters

### 2. Integration Tests

- Test end-to-end flows:
  - Create project → Create environment → Create integration → Test connection
  - Create mapping → Visualize on canvas
  - Trigger action → Verify status update

**Files:**

- `src-tauri/tests/integration_tests.rs`

### 3. Frontend Tests

- React component tests:
  - Project/Environment/Integration CRUD
  - Canvas rendering
  - Status updates

**Files:**

- `src/components/**/*.test.tsx`

### 4. Documentation

- User guide: How to use DevOps Center
- Developer docs: Architecture, adding new integrations
- API docs: Tauri commands, types

**Files:**

- `docs/userguide/devops-center.md`
- `docs/developer/integrations.md`
- `docs/developer/canvas.md`

### 5. Example Configs

- Example config files:
  - `examples/config/projects.yaml.example`
  - `examples/config/integrations.yaml.example`
  - `examples/config/mappings.yaml.example`

**Directory:** `examples/config/`

## Acceptance Criteria

- [ ] Unit tests coverage > 70%
- [ ] Integration tests cho main flows
- [ ] Component tests cho UI components
- [ ] User guide được viết
- [ ] Developer docs được update
- [ ] Example configs được provide
- [ ] All tests pass

## Notes

- Focus tests vào business logic
- Mock external API calls
- Use Vitest cho frontend tests
- Use Rust's built-in test framework
