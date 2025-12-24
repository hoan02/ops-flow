# Task 10: Real-time Status Polling System

## Mục tiêu
Xây dựng hệ thống polling để update real-time status từ các external systems và sync với canvas.

## Yêu cầu

### 1. Polling Strategy
- Configurable polling intervals:
  - Fast (10-30s): Pipeline status, build status, pod status
  - Medium (1-2 min): Service status, metrics
  - Slow (5-10 min): Project lists, configurations
- Smart polling: chỉ poll khi canvas đang hiển thị
- Pause polling khi app minimized hoặc tab không active

**File:** `src/hooks/useStatusPolling.ts`

### 2. Polling Manager
- Centralized polling manager
- Register/unregister polling tasks
- Throttle requests để tránh rate limiting
- Error handling và retry logic

**File:** `src/lib/polling/manager.ts`

### 3. Status Updates
- Update Zustand store với latest status
- Trigger React Flow node updates
- Show notifications cho status changes (optional)

**Files:**
- `src/store/status-store.ts` - Status state
- `src/hooks/useCanvasStatusUpdates.ts` - Canvas sync

### 4. Integration với TanStack Query
- Sử dụng TanStack Query `refetchInterval` cho polling
- Invalidate queries khi cần manual refresh
- Optimistic updates cho better UX

**Example:**
```typescript
useQuery({
  queryKey: ['jenkins-builds', integrationId, jobName],
  queryFn: () => fetchJenkinsBuilds(integrationId, jobName),
  refetchInterval: 30000, // 30s
  refetchIntervalInBackground: false, // Pause when tab inactive
})
```

### 5. Performance Optimization
- Debounce status updates
- Batch updates
- Only update changed nodes
- Virtual scrolling nếu có nhiều nodes

## Acceptance Criteria
- [ ] Polling system hoạt động với configurable intervals
- [ ] Status được update real-time trên canvas
- [ ] Polling pause khi app không active
- [ ] Error handling và retry logic hoạt động
- [ ] Performance tốt (không lag UI)
- [ ] TanStack Query integration hoạt động
- [ ] Tests cho polling logic

## Notes
- Respect rate limits của external APIs
- Có thể thêm WebSocket support sau (nếu external systems support)
- User có thể disable polling cho specific integrations

