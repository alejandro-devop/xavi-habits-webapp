const ACTIVITY_FIELDS = `
  id
  userId
  title
  description
  status
  priority
  categoryId
  scheduledDate
  completedAt
  spentTimeMinutes
  createdAt
  updatedAt
`

const ACTIVITY_SUBTASKS_COUNT_FIELDS = `
  subtasksCount {
    total
    completed
  }
`

export const ACTIVITIES_QUERY = `
  query Activities(
    $status: ActivityStatus
    $priority: ActivityPriority
    $categoryId: ID
    $startDate: DateTime
    $endDate: DateTime
    $page: Int
    $limit: Int
  ) {
    activities(
      status: $status
      priority: $priority
      categoryId: $categoryId
      startDate: $startDate
      endDate: $endDate
      page: $page
      limit: $limit
    ) {
      activities {
        ${ACTIVITY_FIELDS}
        category {
          id
          name
          icon
          color
        }
        ${ACTIVITY_SUBTASKS_COUNT_FIELDS}
      }
      page
      limit
      total
    }
  }
`

export const ACTIVITY_QUERY = `
  query Activity($id: ID!) {
    activity(id: $id) {
      ${ACTIVITY_FIELDS}
      category {
        id
        name
        description
        icon
        color
        orderIndex
      }
      ${ACTIVITY_SUBTASKS_COUNT_FIELDS}
    }
  }
`

export const ACTIVITY_ADD_MUTATION = `
  mutation ActivityAdd($input: ActivityInput!) {
    activityAdd(input: $input) {
      ${ACTIVITY_FIELDS}
      category {
        id
        name
        icon
        color
      }
      ${ACTIVITY_SUBTASKS_COUNT_FIELDS}
    }
  }
`

export const ACTIVITY_EDIT_MUTATION = `
  mutation ActivityEdit($input: ActivityEditInput!) {
    activityEdit(input: $input) {
      ${ACTIVITY_FIELDS}
      category {
        id
        name
        icon
        color
      }
      ${ACTIVITY_SUBTASKS_COUNT_FIELDS}
    }
  }
`

export const ACTIVITY_REMOVE_MUTATION = `
  mutation ActivityRemove($id: ID!) {
    activityRemove(id: $id)
  }
`

export const ACTIVITY_COMPLETE_MUTATION = `
  mutation ActivityComplete($id: ID!) {
    activityComplete(id: $id) {
      id
      status
      completedAt
      spentTimeMinutes
    }
  }
`
