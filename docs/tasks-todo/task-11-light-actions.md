# Task 11: Light Actions - Trigger Operations

## Mục tiêu
Implement light actions để trigger operations từ UI (ví dụ: trigger Jenkins build).

## Yêu cầu

### 1. Action Types
- **Trigger Jenkins Build**: Trigger build với optional parameters
- **Trigger GitLab Pipeline**: Trigger pipeline với optional variables
- **Restart K8s Pod**: Delete pod để trigger restart (nếu có permissions)
- **Refresh Status**: Manual refresh cho specific node

**Note:** Chỉ implement actions không tạo logic CI/CD mới, chỉ trigger existing operations.

### 2. Action UI
- Context menu trên nodes (right-click)
- Action buttons trong node details panel
- Confirmation dialogs cho destructive actions

**Components:**
- `src/components/canvas/NodeContextMenu.tsx`
- `src/components/canvas/ActionButtons.tsx`

### 3. Action Implementations

#### Trigger Jenkins Build
- Call Jenkins API: `POST /job/{job_name}/build`
- Support build parameters
- Show build status after trigger

**Command:** `trigger_jenkins_build(integration_id, job_name, parameters)`

#### Trigger GitLab Pipeline
- Call GitLab API: `POST /api/v4/projects/{id}/trigger/pipeline`
- Support pipeline variables
- Show pipeline status after trigger

**Command:** `trigger_gitlab_pipeline(integration_id, project_id, ref, variables)`

#### Restart K8s Pod (Optional)
- Delete pod: `DELETE /api/v1/namespaces/{namespace}/pods/{pod_name}`
- K8s sẽ tự động recreate pod
- Require confirmation

**Command:** `restart_k8s_pod(integration_id, namespace, pod_name)`

### 4. Action Feedback
- Loading states
- Success/error notifications
- Update node status sau khi action complete

### 5. Permissions
- Check permissions trước khi show actions
- Hide actions nếu không có permissions
- Show error messages nếu action fails do permissions

## Acceptance Criteria
- [ ] Context menu hiển thị actions phù hợp
- [ ] Trigger Jenkins build hoạt động
- [ ] Trigger GitLab pipeline hoạt động
- [ ] Restart K8s pod hoạt động (nếu implement)
- [ ] Action feedback (loading, success, error) hoạt động
- [ ] Permissions được check đúng
- [ ] Confirmation dialogs cho destructive actions
- [ ] Tests cho action operations

## Notes
- Actions chỉ trigger existing operations, không tạo logic mới
- Handle errors gracefully (network, permissions, etc.)
- Log actions để audit (nếu cần)

