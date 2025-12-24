import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DevOpsState {
  selectedProjectId: string | null
  selectedEnvironmentId: string | null
  selectedIntegrationId: string | null

  setSelectedProjectId: (id: string | null) => void
  setSelectedEnvironmentId: (id: string | null) => void
  setSelectedIntegrationId: (id: string | null) => void
}

export const useDevOpsStore = create<DevOpsState>()(
  devtools(
    set => ({
      selectedProjectId: null,
      selectedEnvironmentId: null,
      selectedIntegrationId: null,

      setSelectedProjectId: id =>
        set({ selectedProjectId: id }, undefined, 'setSelectedProjectId'),

      setSelectedEnvironmentId: id =>
        set(
          { selectedEnvironmentId: id },
          undefined,
          'setSelectedEnvironmentId'
        ),

      setSelectedIntegrationId: id =>
        set(
          { selectedIntegrationId: id },
          undefined,
          'setSelectedIntegrationId'
        ),
    }),
    {
      name: 'devops-store',
    }
  )
)
