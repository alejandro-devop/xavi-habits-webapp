export const TODOS_QUERY = `
  query Todos(
    $status: TodoStatus
    $priority: TodoPriority
    $tagId: ID
    $folderId: ID
    $withoutFolder: Boolean
    $selectedToday: Boolean
    $pendingOnly: Boolean
    $dueBefore: DateTime
    $dueAfter: DateTime
    $page: Int
    $limit: Int
  ) {
    todos(
      status: $status
      priority: $priority
      tagId: $tagId
      folderId: $folderId
      withoutFolder: $withoutFolder
      selectedToday: $selectedToday
      pendingOnly: $pendingOnly
      dueBefore: $dueBefore
      dueAfter: $dueAfter
      page: $page
      limit: $limit
    ) {
      todos {
        id
        title
        status
        priority
        dueDate
        completedAt
        selectedToday
        createdAt
        updatedAt
        subtasksCount {
          total
          completed
        }
        subtasks {
          id
          isCompleted
        }
        tags {
          id
          name
          color
        }
      }
      page
      limit
      total
    }
  }
`

export const TODO_QUERY = `
  query Todo($id: ID!) {
    todo(id: $id) {
      id
      userId
      title
      description
      status
      priority
      dueDate
      completedAt
      selectedToday
      folderId
      createdAt
      updatedAt
      subtasks {
        id
        todoId
        title
        isCompleted
        orderIndex
        createdAt
        updatedAt
      }
      subtasksCount {
        total
        completed
      }
      tags {
        id
        name
        color
      }
    }
  }
`

export const TODO_TAGS_QUERY = `
  query TodoTags {
    todoTags {
      id
      name
      color
    }
  }
`

export const TODO_ADD_MUTATION = `
  mutation TodoAdd($input: TodoInput!) {
    todoAdd(input: $input) {
      id
      title
      status
      priority
      dueDate
      completedAt
      selectedToday
      createdAt
      updatedAt
      subtasksCount {
        total
        completed
      }
      tags {
        id
        name
        color
      }
    }
  }
`

export const TODO_EDIT_MUTATION = `
  mutation TodoEdit($input: TodoEditInput!) {
    todoEdit(input: $input) {
      id
      title
      description
      status
      priority
      dueDate
      completedAt
      selectedToday
      folderId
      updatedAt
      subtasksCount {
        total
        completed
      }
      tags {
        id
        name
        color
      }
    }
  }
`

export const TODO_REMOVE_MUTATION = `
  mutation TodoRemove($id: ID!) {
    todoRemove(id: $id)
  }
`

export const TODO_COMPLETE_MUTATION = `
  mutation TodoComplete($id: ID!) {
    todoComplete(id: $id) {
      id
      status
      completedAt
    }
  }
`

export const TODO_SUBTASK_ADD_MUTATION = `
  mutation TodoSubtaskAdd($input: TodoSubtaskInput!) {
    todoSubtaskAdd(input: $input) {
      id
      todoId
      title
      isCompleted
      orderIndex
      createdAt
      updatedAt
    }
  }
`

export const TODO_SUBTASK_EDIT_MUTATION = `
  mutation TodoSubtaskEdit($input: TodoSubtaskEditInput!) {
    todoSubtaskEdit(input: $input) {
      id
      todoId
      title
      isCompleted
      orderIndex
      updatedAt
    }
  }
`

export const TODO_SUBTASK_REMOVE_MUTATION = `
  mutation TodoSubtaskRemove($input: TodoSubtaskRemoveInput!) {
    todoSubtaskRemove(input: $input)
  }
`

export const TODO_TAG_ADD_MUTATION = `
  mutation TodoTagAdd($input: TodoTagInput!) {
    todoTagAdd(input: $input) {
      id
      name
      color
    }
  }
`

export const TODO_TAG_EDIT_MUTATION = `
  mutation TodoTagEdit($input: TodoTagEditInput!) {
    todoTagEdit(input: $input) {
      id
      name
      color
    }
  }
`

export const TODO_TAG_REMOVE_MUTATION = `
  mutation TodoTagRemove($id: ID!) {
    todoTagRemove(id: $id)
  }
`

export const TODO_FOLDERS_QUERY = `
  query TodoFolders {
    todoFolders {
      id
      name
      color
      orderIndex
      todoCount
      createdAt
      updatedAt
    }
  }
`

export const TODO_FOLDER_ADD_MUTATION = `
  mutation TodoFolderAdd($input: TodoFolderInput!) {
    todoFolderAdd(input: $input) {
      id
      name
      color
      orderIndex
      todoCount
      createdAt
      updatedAt
    }
  }
`

export const TODO_FOLDER_EDIT_MUTATION = `
  mutation TodoFolderEdit($input: TodoFolderEditInput!) {
    todoFolderEdit(input: $input) {
      id
      name
      color
      orderIndex
      todoCount
      updatedAt
    }
  }
`

export const TODO_FOLDER_REMOVE_MUTATION = `
  mutation TodoFolderRemove($id: ID!) {
    todoFolderRemove(id: $id)
  }
`

const DAILY_TEMPLATE_FIELDS = `
  id
  userId
  title
  description
  priority
  folderId
  days
  orderIndex
  createdAt
  updatedAt
`

export const TODO_DAILY_TEMPLATES_QUERY = `
  query TodoDailyTemplates {
    todoDailyTemplates {
      ${DAILY_TEMPLATE_FIELDS}
    }
  }
`

export const TODO_DAILY_TEMPLATES_BY_DAY_QUERY = `
  query TodoDailyTemplatesByDay($day: Int!) {
    todoDailyTemplatesByDay(day: $day) {
      ${DAILY_TEMPLATE_FIELDS}
    }
  }
`

export const TODO_DAILY_TEMPLATE_ADD_MUTATION = `
  mutation TodoDailyTemplateAdd($input: TodoDailyTemplateInput!) {
    todoDailyTemplateAdd(input: $input) {
      ${DAILY_TEMPLATE_FIELDS}
    }
  }
`

export const TODO_DAILY_TEMPLATE_EDIT_MUTATION = `
  mutation TodoDailyTemplateEdit($input: TodoDailyTemplateEditInput!) {
    todoDailyTemplateEdit(input: $input) {
      ${DAILY_TEMPLATE_FIELDS}
    }
  }
`

export const TODO_DAILY_TEMPLATE_REMOVE_MUTATION = `
  mutation TodoDailyTemplateRemove($id: ID!) {
    todoDailyTemplateRemove(id: $id)
  }
`
