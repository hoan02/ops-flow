# Task 8: React Flow Canvas - Visualization

## Mục tiêu
Xây dựng React Flow canvas để visualize mối quan hệ giữa GitLab, Jenkins, K8s, SonarQube, Keycloak và trạng thái real-time.

## Yêu cầu

### 1. Install React Flow
- Thêm `@xyflow/react` package
- Setup React Flow provider

**Command:** `npm install @xyflow/react`

### 2. Node Types
Định nghĩa các node types:
- **GitLab Node**: Project icon, name, pipeline status
- **Jenkins Node**: Job icon, name, build status
- **K8s Namespace Node**: Namespace icon, name, pod count
- **K8s Service Node**: Service icon, name, status
- **K8s Pod Node**: Pod icon, name, status
- **SonarQube Node**: Project icon, name, quality gate status
- **Keycloak Node**: Realm/Client icon, name

**Components:**
- `src/components/canvas/nodes/GitLabNode.tsx`
- `src/components/canvas/nodes/JenkinsNode.tsx`
- `src/components/canvas/nodes/K8sNamespaceNode.tsx`
- `src/components/canvas/nodes/K8sServiceNode.tsx`
- `src/components/canvas/nodes/K8sPodNode.tsx`
- `src/components/canvas/nodes/SonarQubeNode.tsx`
- `src/components/canvas/nodes/KeycloakNode.tsx`

### 3. Edge Types
Định nghĩa các edge types:
- **Webhook Edge**: GitLab → Jenkins (trigger)
- **Build Edge**: Jenkins → K8s (deploy)
- **Deploy Edge**: K8s Namespace → Services → Pods
- **Quality Edge**: GitLab → SonarQube (analysis)

**Components:**
- `src/components/canvas/edges/WebhookEdge.tsx`
- `src/components/canvas/edges/BuildEdge.tsx`
- `src/components/canvas/edges/DeployEdge.tsx`

### 4. Canvas Layout Logic
- Auto-layout algorithm (hierarchical hoặc force-directed)
- Position nodes dựa trên relationships từ mappings config
- Group nodes by project/environment

**File:** `src/lib/canvas/layout.ts`

### 5. Real-time Status Updates
- Polling hoặc WebSocket (nếu có) để update node status
- Update node colors/icons dựa trên status
- Animate status changes

**File:** `src/hooks/useCanvasStatusUpdates.ts`

### 6. Canvas Interactions
- Click node để show details panel
- Hover để show tooltip với thông tin
- Zoom/pan controls
- Minimap (optional)

**File:** `src/components/canvas/DevOpsCanvas.tsx`

### 7. Node Details Panel
- Side panel hoặc modal hiển thị chi tiết khi click node
- Show real-time metrics, logs (nếu có), actions

**Component:** `src/components/canvas/NodeDetailsPanel.tsx`

## Acceptance Criteria
- [ ] React Flow được setup và hoạt động
- [ ] Tất cả node types được implement với proper styling
- [ ] Edge types được implement với proper styling
- [ ] Auto-layout hoạt động dựa trên mappings
- [ ] Real-time status updates hoạt động
- [ ] Node interactions (click, hover) hoạt động
- [ ] Details panel hiển thị thông tin đúng
- [ ] Canvas responsive và performant

## Notes
- Sử dụng React Flow v11+ (latest stable)
- Performance: virtualize nodes nếu có nhiều (>100 nodes)
- Status colors: green (success), red (failure), yellow (building), gray (unknown)
- Follow existing UI theme (dark/light mode support)

