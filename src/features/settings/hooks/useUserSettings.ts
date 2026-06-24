import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as settingsApi from '@/features/settings/api/user-settings.api'
import type { UpdateUserSettingsInput } from '@/features/settings/types/user-settings.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { habitKeys, settingsKeys } from '@/shared/api/query-keys'

function useSettingsQueryGuard() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

export function useUserSettingsQuery() {
  const enabled = useSettingsQueryGuard()
  return useQuery({
    queryKey: settingsKeys.my(),
    enabled,
    queryFn: () => settingsApi.getMySettings(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateUserSettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateUserSettingsInput) => settingsApi.updateMySettings(input),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.my(), data)
      void queryClient.invalidateQueries({ queryKey: habitKeys.all, refetchType: 'all' })
    },
  })
}
