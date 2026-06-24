import {
  SLEEP_LOGS_QUERY,
  SLEEP_LOG_QUERY,
  SLEEP_LOG_ADD_MUTATION,
  SLEEP_LOG_EDIT_MUTATION,
  SLEEP_LOG_REMOVE_MUTATION,
} from '@/features/sleep/graphql/sleep.graphql'
import type {
  SleepLog,
  SleepLogEditInput,
  SleepLogInput,
  SleepLogsFilters,
  SleepLogsResponse,
} from '@/features/sleep/types/sleep.types'
import { graphqlRequest } from '@/shared/api/graphql-client'

type SleepLogsData = { sleepLogs: SleepLogsResponse }
type SleepLogData = { sleepLog: SleepLog | null }
type SleepLogAddData = { sleepLogAdd: SleepLog }
type SleepLogEditData = { sleepLogEdit: SleepLog }
type SleepLogRemoveData = { sleepLogRemove: boolean }

export async function getSleepLogs(filters: SleepLogsFilters = {}): Promise<SleepLogsResponse> {
  const data = await graphqlRequest<SleepLogsData, SleepLogsFilters>(SLEEP_LOGS_QUERY, filters)
  return data.sleepLogs
}

export async function getSleepLog(id: string): Promise<SleepLog | null> {
  const data = await graphqlRequest<SleepLogData, { id: string }>(SLEEP_LOG_QUERY, { id })
  return data.sleepLog
}

export async function createSleepLog(input: SleepLogInput): Promise<SleepLog> {
  const data = await graphqlRequest<SleepLogAddData, { input: SleepLogInput }>(
    SLEEP_LOG_ADD_MUTATION,
    { input },
  )
  return data.sleepLogAdd
}

export async function updateSleepLog(input: SleepLogEditInput): Promise<SleepLog> {
  const data = await graphqlRequest<SleepLogEditData, { input: SleepLogEditInput }>(
    SLEEP_LOG_EDIT_MUTATION,
    { input },
  )
  return data.sleepLogEdit
}

export async function removeSleepLog(id: string): Promise<boolean> {
  const data = await graphqlRequest<SleepLogRemoveData, { id: string }>(
    SLEEP_LOG_REMOVE_MUTATION,
    { id },
  )
  return data.sleepLogRemove
}
