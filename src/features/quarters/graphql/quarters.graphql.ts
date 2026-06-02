const PROJECT_FRAGMENT = `
  id
  userId
  name
  description
  priority
  status
  createdAt
  updatedAt
  objectives {
    id
    projectId
    title
    description
    status
    orderIndex
    createdAt
    updatedAt
  }
  members {
    id
    userId
    role
    invitedAt
    acceptedAt
  }
`

const QUARTER_PROJECT_FRAGMENT = `
  id
  quarterId
  projectId
  weeklyHours
  createdAt
  updatedAt
  project {
    id
    name
    description
    priority
    status
  }
`

const QUARTER_FRAGMENT = `
  id
  userId
  name
  startDate
  endDate
  status
  retrospectiveNotes
  summaryNotes
  createdAt
  updatedAt
  projects {
    ${QUARTER_PROJECT_FRAGMENT}
  }
`

const SESSION_LOG_FRAGMENT = `
  id
  quarterId
  projectId
  userId
  sessionDate
  weekStartDate
  content
  createdAt
  updatedAt
  project {
    id
    name
    status
  }
`

// ─── Queries ──────────────────────────────────────────────────────────────────

export const PROJECTS_QUERY = `
  query Projects {
    projects {
      ${PROJECT_FRAGMENT}
    }
  }
`

export const PROJECT_QUERY = `
  query Project($id: ID!) {
    project(id: $id) {
      ${PROJECT_FRAGMENT}
    }
  }
`

export const QUARTERS_QUERY = `
  query Quarters {
    quarters {
      ${QUARTER_FRAGMENT}
    }
  }
`

export const QUARTER_QUERY = `
  query Quarter($id: ID!) {
    quarter(id: $id) {
      ${QUARTER_FRAGMENT}
    }
  }
`

export const ACTIVE_QUARTER_QUERY = `
  query ActiveQuarter {
    activeQuarter {
      ${QUARTER_FRAGMENT}
    }
  }
`

export const SESSION_LOGS_QUERY = `
  query SessionLogs($quarterId: ID!, $projectId: ID) {
    sessionLogs(quarterId: $quarterId, projectId: $projectId) {
      ${SESSION_LOG_FRAGMENT}
    }
  }
`

export const PROJECT_SESSION_LOGS_QUERY = `
  query ProjectSessionLogs($projectId: ID!) {
    projectSessionLogs(projectId: $projectId) {
      ${SESSION_LOG_FRAGMENT}
    }
  }
`

// ─── Mutations ────────────────────────────────────────────────────────────────

export const PROJECT_ADD_MUTATION = `
  mutation ProjectAdd($input: ProjectAddInput!) {
    projectAdd(input: $input) {
      ${PROJECT_FRAGMENT}
    }
  }
`

export const PROJECT_EDIT_MUTATION = `
  mutation ProjectEdit($input: ProjectEditInput!) {
    projectEdit(input: $input) {
      ${PROJECT_FRAGMENT}
    }
  }
`

export const PROJECT_REMOVE_MUTATION = `
  mutation ProjectRemove($id: ID!) {
    projectRemove(id: $id)
  }
`

export const OBJECTIVE_ADD_MUTATION = `
  mutation ProjectObjectiveAdd($input: ObjectiveAddInput!) {
    projectObjectiveAdd(input: $input) {
      id
      projectId
      title
      description
      status
      orderIndex
      createdAt
      updatedAt
    }
  }
`

export const OBJECTIVE_EDIT_MUTATION = `
  mutation ProjectObjectiveEdit($input: ObjectiveEditInput!) {
    projectObjectiveEdit(input: $input) {
      id
      projectId
      title
      description
      status
      orderIndex
      createdAt
      updatedAt
    }
  }
`

export const OBJECTIVE_REMOVE_MUTATION = `
  mutation ProjectObjectiveRemove($id: ID!) {
    projectObjectiveRemove(id: $id)
  }
`

export const QUARTER_ADD_MUTATION = `
  mutation QuarterAdd($input: QuarterAddInput!) {
    quarterAdd(input: $input) {
      ${QUARTER_FRAGMENT}
    }
  }
`

export const QUARTER_EDIT_MUTATION = `
  mutation QuarterEdit($input: QuarterEditInput!) {
    quarterEdit(input: $input) {
      ${QUARTER_FRAGMENT}
    }
  }
`

export const QUARTER_ACTIVATE_MUTATION = `
  mutation QuarterActivate($id: ID!) {
    quarterActivate(id: $id) {
      ${QUARTER_FRAGMENT}
    }
  }
`

export const QUARTER_COMPLETE_MUTATION = `
  mutation QuarterComplete($input: QuarterCompleteInput!) {
    quarterComplete(input: $input) {
      ${QUARTER_FRAGMENT}
    }
  }
`

export const QUARTER_PROJECT_ADD_MUTATION = `
  mutation QuarterProjectAdd($input: QuarterProjectAddInput!) {
    quarterProjectAdd(input: $input) {
      ${QUARTER_PROJECT_FRAGMENT}
    }
  }
`

export const QUARTER_PROJECT_EDIT_MUTATION = `
  mutation QuarterProjectEdit($input: QuarterProjectEditInput!) {
    quarterProjectEdit(input: $input) {
      ${QUARTER_PROJECT_FRAGMENT}
    }
  }
`

export const QUARTER_PROJECT_REMOVE_MUTATION = `
  mutation QuarterProjectRemove($id: ID!) {
    quarterProjectRemove(id: $id)
  }
`

export const SESSION_LOG_ADD_MUTATION = `
  mutation SessionLogAdd($input: SessionLogAddInput!) {
    sessionLogAdd(input: $input) {
      ${SESSION_LOG_FRAGMENT}
    }
  }
`

export const SESSION_LOG_EDIT_MUTATION = `
  mutation SessionLogEdit($input: SessionLogEditInput!) {
    sessionLogEdit(input: $input) {
      ${SESSION_LOG_FRAGMENT}
    }
  }
`

export const SESSION_LOG_REMOVE_MUTATION = `
  mutation SessionLogRemove($id: ID!) {
    sessionLogRemove(id: $id)
  }
`

const WEEK_SCHEDULE_SLOT_FRAGMENT = `
  id
  quarterId
  projectId
  userId
  dayOfWeek
  startTime
  hours
  notes
  createdAt
  updatedAt
  project {
    id
    name
    status
  }
`

export const WEEK_SCHEDULE_SLOTS_QUERY = `
  query WeekScheduleSlots($quarterId: ID!) {
    weekScheduleSlots(quarterId: $quarterId) {
      ${WEEK_SCHEDULE_SLOT_FRAGMENT}
    }
  }
`

export const WEEK_SCHEDULE_SLOT_ADD_MUTATION = `
  mutation WeekScheduleSlotAdd($input: WeekScheduleSlotAddInput!) {
    weekScheduleSlotAdd(input: $input) {
      ${WEEK_SCHEDULE_SLOT_FRAGMENT}
    }
  }
`

export const WEEK_SCHEDULE_SLOT_EDIT_MUTATION = `
  mutation WeekScheduleSlotEdit($input: WeekScheduleSlotEditInput!) {
    weekScheduleSlotEdit(input: $input) {
      ${WEEK_SCHEDULE_SLOT_FRAGMENT}
    }
  }
`

export const WEEK_SCHEDULE_SLOT_REMOVE_MUTATION = `
  mutation WeekScheduleSlotRemove($id: ID!) {
    weekScheduleSlotRemove(id: $id)
  }
`
