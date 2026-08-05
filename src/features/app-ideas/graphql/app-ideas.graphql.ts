const APP_IDEA_FIELDS = `
  id
  userId
  title
  contentMarkdown
  status
  createdAt
  updatedAt
`

export const APP_IDEAS_QUERY = `
  query AppIdeas($search: String, $status: AppIdeaStatus, $page: Int, $limit: Int) {
    appIdeas(search: $search, status: $status, page: $page, limit: $limit) {
      ideas { ${APP_IDEA_FIELDS} }
      page
      limit
      total
    }
  }
`

export const APP_IDEA_QUERY = `
  query AppIdea($id: ID!) {
    appIdea(id: $id) { ${APP_IDEA_FIELDS} }
  }
`

export const APP_IDEA_ADD_MUTATION = `
  mutation AppIdeaAdd($input: AppIdeaInput!) {
    appIdeaAdd(input: $input) { ${APP_IDEA_FIELDS} }
  }
`

export const APP_IDEA_EDIT_MUTATION = `
  mutation AppIdeaEdit($input: AppIdeaEditInput!) {
    appIdeaEdit(input: $input) { ${APP_IDEA_FIELDS} }
  }
`

export const APP_IDEA_REMOVE_MUTATION = `
  mutation AppIdeaRemove($id: ID!) {
    appIdeaRemove(id: $id)
  }
`
