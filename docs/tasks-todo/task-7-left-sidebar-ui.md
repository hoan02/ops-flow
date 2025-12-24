# Task 7: Left Sidebar UI - Project/Environment/Integration List

## Mục tiêu

Xây dựng UI cho left sidebar hiển thị danh sách projects, environments, và integrations với CRUD operations.

## Yêu cầu

### 1. Left Sidebar Structure

- Tree view hoặc list view với sections:
  - **Projects** section
  - **Environments** section (grouped by project)
  - **Integrations** section (GitLab, Jenkins, K8s, SonarQube, Keycloak)

**File:** `src/components/layout/LeftSideBar.tsx`

### 2. Projects Section

- List projects từ config
- Add/Edit/Delete project
- Click để select project (highlight)
- Show project name, description

**Components:**

- `src/components/projects/ProjectList.tsx`
- `src/components/projects/ProjectItem.tsx`
- `src/components/projects/ProjectDialog.tsx` (Add/Edit)

### 3. Environments Section

- Grouped by project
- List environments (dev/staging/prod)
- Add/Edit/Delete environment
- Show namespace, project name

**Components:**

- `src/components/environments/EnvironmentList.tsx`
- `src/components/environments/EnvironmentItem.tsx`
- `src/components/environments/EnvironmentDialog.tsx`

### 4. Integrations Section

- List integrations với type icons
- Add/Edit/Delete integration
- Test connection button
- Show status (connected/disconnected)

**Components:**

- `src/components/integrations/IntegrationList.tsx`
- `src/components/integrations/IntegrationItem.tsx`
- `src/components/integrations/IntegrationDialog.tsx`
- `src/components/integrations/IntegrationCredentialsDialog.tsx`

### 5. CRUD Operations

- Sử dụng TanStack Query mutations
- Optimistic updates
- Error handling với toast notifications
- Validation (form validation)

### 6. State Management

- Selected project/environment/integration trong Zustand store
- `src/store/devops-store.ts`:
  - `selectedProjectId: string | null`
  - `selectedEnvironmentId: string | null`
  - `selectedIntegrationId: string | null`

## Acceptance Criteria

- [ ] Projects được hiển thị và có thể CRUD
- [ ] Environments được hiển thị và có thể CRUD
- [ ] Integrations được hiển thị và có thể CRUD
- [ ] Test connection hoạt động cho integrations
- [ ] Selected items được highlight
- [ ] Form validation hoạt động
- [ ] Error handling với user-friendly messages
- [ ] UI responsive và accessible

## Notes

- Sử dụng shadcn/ui components (Dialog, Form, etc.)
- Follow existing UI patterns từ codebase
- i18n support cho tất cả labels
- Keyboard navigation support
