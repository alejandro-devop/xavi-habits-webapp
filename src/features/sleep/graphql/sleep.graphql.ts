export const SLEEP_LOGS_QUERY = `
  query SleepLogs($startDate: DateTime, $endDate: DateTime, $quality: SleepQuality, $page: Int, $limit: Int) {
    sleepLogs(startDate: $startDate, endDate: $endDate, quality: $quality, page: $page, limit: $limit) {
      sleepLogs {
        id
        userId
        sleepDate
        bedtime
        wakeTime
        durationMinutes
        durationHours
        quality
        moodOnWaking
        notes
        createdAt
        updatedAt
      }
      page
      limit
      total
    }
  }
`

export const SLEEP_LOG_QUERY = `
  query SleepLog($id: ID!) {
    sleepLog(id: $id) {
      id
      userId
      sleepDate
      bedtime
      wakeTime
      durationMinutes
      durationHours
      quality
      moodOnWaking
      notes
      createdAt
      updatedAt
    }
  }
`

export const SLEEP_LOG_ADD_MUTATION = `
  mutation SleepLogAdd($input: SleepLogInput!) {
    sleepLogAdd(input: $input) {
      id
      userId
      sleepDate
      bedtime
      wakeTime
      durationMinutes
      durationHours
      quality
      moodOnWaking
      notes
      createdAt
      updatedAt
    }
  }
`

export const SLEEP_LOG_EDIT_MUTATION = `
  mutation SleepLogEdit($input: SleepLogEditInput!) {
    sleepLogEdit(input: $input) {
      id
      userId
      sleepDate
      bedtime
      wakeTime
      durationMinutes
      durationHours
      quality
      moodOnWaking
      notes
      createdAt
      updatedAt
    }
  }
`

export const SLEEP_LOG_REMOVE_MUTATION = `
  mutation SleepLogRemove($id: ID!) {
    sleepLogRemove(id: $id)
  }
`
