const FOLLOW_UP_FIELDS = `
  id
  activityId
  date
  startTime
  durationMinutes
  isOpen
  endTime
  endDate
  endDateTime
  notes
  linkedTodoId
`

const FOLLOW_UP_ACTIVITY_FIELDS = `
  activity {
    id
    title
    description
    category {
      id
      name
      color
      icon
    }
  }
`

const FOLLOW_UP_LINKED_TODO_FIELDS = `
  linkedTodo {
    id
    title
  }
`

export const ACTIVITY_OPEN_FOLLOW_UP_QUERY = `
  query ActivityOpenFollowUp {
    activityOpenFollowUp {
      ${FOLLOW_UP_FIELDS}
      ${FOLLOW_UP_ACTIVITY_FIELDS}
      ${FOLLOW_UP_LINKED_TODO_FIELDS}
    }
  }
`

export const ACTIVITY_DAY_FOLLOW_UPS_QUERY = `
  query ActivityDayFollowUps($date: String!) {
    activityDayFollowUps(date: $date) {
      ${FOLLOW_UP_FIELDS}
      ${FOLLOW_UP_ACTIVITY_FIELDS}
    }
  }
`

export const ACTIVITY_FOLLOW_UPS_IN_DATES_QUERY = `
  query ActivityFollowUpsInDates($from: String!, $to: String!) {
    activityFollowUpsInDates(from: $from, to: $to) {
      date
      followUps {
        ${FOLLOW_UP_FIELDS}
        activity {
          id
          title
          category {
            id
            name
            color
            icon
          }
        }
      }
    }
  }
`

export const ACTIVITY_FOLLOW_UP_START_MUTATION = `
  mutation ActivityFollowUpStart($input: ActivityFollowUpStartInput!) {
    activityFollowUpStart(input: $input) {
      ${FOLLOW_UP_FIELDS}
      ${FOLLOW_UP_ACTIVITY_FIELDS}
      ${FOLLOW_UP_LINKED_TODO_FIELDS}
    }
  }
`

export const ACTIVITY_FOLLOW_UP_ADD_MUTATION = `
  mutation ActivityFollowUpAdd($input: ActivityFollowUpAddInput!) {
    activityFollowUpAdd(input: $input) {
      ${FOLLOW_UP_FIELDS}
    }
  }
`

export const ACTIVITY_FOLLOW_UP_EDIT_MUTATION = `
  mutation ActivityFollowUpEdit($input: ActivityFollowUpEditInput!) {
    activityFollowUpEdit(input: $input) {
      ${FOLLOW_UP_FIELDS}
    }
  }
`

export const ACTIVITY_FOLLOW_UP_REMOVE_MUTATION = `
  mutation ActivityFollowUpRemove($id: ID!) {
    activityFollowUpRemove(id: $id)
  }
`
