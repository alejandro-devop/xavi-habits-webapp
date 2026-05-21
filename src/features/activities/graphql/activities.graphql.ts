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
        category {
          id
          name
          icon
          color
        }
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
      category {
        id
        name
        description
        icon
        color
        orderIndex
      }
    }
  }
`

export const ACTIVITY_ADD_MUTATION = `
  mutation ActivityAdd($input: ActivityInput!) {
    activityAdd(input: $input) {
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
      category {
        id
        name
        icon
        color
      }
    }
  }
`

export const ACTIVITY_EDIT_MUTATION = `
  mutation ActivityEdit($input: ActivityEditInput!) {
    activityEdit(input: $input) {
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
      category {
        id
        name
        icon
        color
      }
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
