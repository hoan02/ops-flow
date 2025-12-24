# Task 5: Kubernetes (microk8s) Integration

## Mục tiêu

Implement Kubernetes integration để fetch namespaces, pods, services từ microk8s cluster.

## Yêu cầu

### 1. Kubernetes Client Setup

- Thêm `k8s-openapi` và `kube` crates
- Kubeconfig path: `~/.kube/config` (default) hoặc custom path
- Support cho microk8s: `~/.kube/microk8s-config`

**File:** `src-tauri/src/integrations/kubernetes/mod.rs`

### 2. Kubernetes Adapter Implementation

- Implement `IntegrationAdapter` trait cho Kubernetes
- Operations:
  - List namespaces
  - List pods trong namespace
  - List services trong namespace
  - Get pod status/details
  - Get service details

**File:** `src-tauri/src/integrations/kubernetes/adapter.rs`

### 3. Kubernetes Types

- `K8sNamespace`: name, status, created_at
- `K8sPod`: name, namespace, status, containers, node
- `K8sService`: name, namespace, type, ports, endpoints

**File:** `src-tauri/src/integrations/kubernetes/types.rs`

### 4. Tauri Commands

- `fetch_k8s_namespaces(integration_id: String) -> Result<Vec<K8sNamespace>, String>`
- `fetch_k8s_pods(integration_id: String, namespace: String) -> Result<Vec<K8sPod>, String>`
- `fetch_k8s_services(integration_id: String, namespace: String) -> Result<Vec<K8sService>, String>`
- `fetch_k8s_pod_details(integration_id: String, namespace: String, pod_name: String) -> Result<K8sPod, String>`

**Register trong:** `src-tauri/src/bindings.rs`

### 5. React Service

- TanStack Query hooks:
  - `useK8sNamespaces(integrationId: string)`
  - `useK8sPods(integrationId: string, namespace: string)`
  - `useK8sServices(integrationId: string, namespace: string)`
  - `useK8sPodDetails(integrationId: string, namespace: string, podName: string)`

**File:** `src/services/kubernetes.ts`

### 6. Credentials/Config

- Kubeconfig path trong integration config
- Không cần credentials riêng (dùng kubeconfig)

## Acceptance Criteria

- [ ] Kubernetes client kết nối được với microk8s
- [ ] Namespaces được list thành công
- [ ] Pods và services được fetch theo namespace
- [ ] Pod details được fetch
- [ ] Error handling cho connection failures, auth errors
- [ ] TanStack Query hooks hoạt động với caching
- [ ] Tests cho Kubernetes adapter (mock hoặc integration tests)

## Notes

- microk8s sử dụng kubeconfig tại `~/.kube/microk8s-config`
- Có thể cần setup permissions cho service account
- Cache với TTL ngắn cho real-time pod/service status
