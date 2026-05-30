const WEEKLY_ROUTINE_ACTIVITY_FIELDS = `
  id
  routineId
  activityId
  dayOfWeek
  startTime
  durationMinutes
  notes
  createdAt
  updatedAt
  activity {
    id
    title
    description
    category {
      id
      name
      icon
      color
    }
  }
`

const WEEKLY_ROUTINE_FIELDS = `
  id
  userId
  name
  description
  startDay
  isActive
  dayStartTime
  dayEndTime
  activitiesCount
  createdAt
  updatedAt
`

const WEEKLY_ROUTINE_WITH_SCHEDULE = `
  ${WEEKLY_ROUTINE_FIELDS}
  schedule {
    dayOfWeek
    activities {
      ${WEEKLY_ROUTINE_ACTIVITY_FIELDS}
    }
  }
`

export const WEEKLY_ROUTINES_QUERY = `
  query WeeklyRoutines($isActive: Boolean, $page: Int, $limit: Int) {
    weeklyRoutines(isActive: $isActive, page: $page, limit: $limit) {
      routines {
        ${WEEKLY_ROUTINE_FIELDS}
      }
      page
      limit
      total
    }
  }
`

export const WEEKLY_ROUTINE_QUERY = `
  query WeeklyRoutine($id: ID!) {
    weeklyRoutine(id: $id) {
      ${WEEKLY_ROUTINE_WITH_SCHEDULE}
    }
  }
`

export const WEEKLY_ROUTINE_ACTIVE_QUERY = `
  query WeeklyRoutineActive {
    weeklyRoutineActive {
      ${WEEKLY_ROUTINE_WITH_SCHEDULE}
    }
  }
`

export const WEEKLY_ROUTINE_ADD_MUTATION = `
  mutation WeeklyRoutineAdd($input: WeeklyRoutineInput!) {
    weeklyRoutineAdd(input: $input) {
      ${WEEKLY_ROUTINE_FIELDS}
    }
  }
`

export const WEEKLY_ROUTINE_EDIT_MUTATION = `
  mutation WeeklyRoutineEdit($input: WeeklyRoutineEditInput!) {
    weeklyRoutineEdit(input: $input) {
      ${WEEKLY_ROUTINE_WITH_SCHEDULE}
    }
  }
`

export const WEEKLY_ROUTINE_REMOVE_MUTATION = `
  mutation WeeklyRoutineRemove($id: ID!) {
    weeklyRoutineRemove(id: $id)
  }
`

export const WEEKLY_ROUTINE_SET_ACTIVE_MUTATION = `
  mutation WeeklyRoutineSetActive($id: ID!) {
    weeklyRoutineSetActive(id: $id) {
      ${WEEKLY_ROUTINE_FIELDS}
    }
  }
`

export const WEEKLY_ROUTINE_TOGGLE_ACTIVE_MUTATION = `
  mutation WeeklyRoutineToggleActive($id: ID!) {
    weeklyRoutineToggleActive(id: $id) {
      ${WEEKLY_ROUTINE_FIELDS}
    }
  }
`

export const WEEKLY_ROUTINE_ACTIVITY_ADD_MUTATION = `
  mutation WeeklyRoutineActivityAdd($input: WeeklyRoutineActivityInput!) {
    weeklyRoutineActivityAdd(input: $input) {
      ${WEEKLY_ROUTINE_ACTIVITY_FIELDS}
    }
  }
`

export const WEEKLY_ROUTINE_ACTIVITY_BATCH_ADD_MUTATION = `
  mutation WeeklyRoutineActivityBatchAdd($input: WeeklyRoutineActivityBatchInput!) {
    weeklyRoutineActivityBatchAdd(input: $input) {
      ${WEEKLY_ROUTINE_ACTIVITY_FIELDS}
    }
  }
`

export const WEEKLY_ROUTINE_ACTIVITY_EDIT_MUTATION = `
  mutation WeeklyRoutineActivityEdit($input: WeeklyRoutineActivityEditInput!) {
    weeklyRoutineActivityEdit(input: $input) {
      ${WEEKLY_ROUTINE_ACTIVITY_FIELDS}
    }
  }
`

export const WEEKLY_ROUTINE_ACTIVITY_REMOVE_MUTATION = `
  mutation WeeklyRoutineActivityRemove($id: ID!) {
    weeklyRoutineActivityRemove(id: $id)
  }
`
