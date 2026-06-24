import {
  MY_SETTINGS_QUERY,
  UPDATE_MY_SETTINGS_MUTATION,
} from '@/features/settings/graphql/user-settings.graphql'
import type {
  UpdateUserSettingsInput,
  UserSettings,
} from '@/features/settings/types/user-settings.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

export async function getMySettings(): Promise<UserSettings> {
  const data = await graphqlRequest<{ mySettings: UserSettings }>(MY_SETTINGS_QUERY)
  return data.mySettings
}

export async function updateMySettings(input: UpdateUserSettingsInput): Promise<UserSettings> {
  const data = await graphqlRequest<
    { updateMySettings: UserSettings },
    { input: UpdateUserSettingsInput }
  >(UPDATE_MY_SETTINGS_MUTATION, { input })
  return data.updateMySettings
}
