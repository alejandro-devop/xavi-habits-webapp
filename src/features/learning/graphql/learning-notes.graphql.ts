const LEARNING_TAG_FIELDS = `
  id
  name
  slug
`

const LEARNING_NOTE_FIELDS = `
  id
  userId
  title
  contentMarkdown
  tags { ${LEARNING_TAG_FIELDS} }
  createdAt
  updatedAt
`

export const LEARNING_NOTES_QUERY = `
  query LearningNotes($search: String, $tags: [String!], $page: Int, $limit: Int) {
    learningNotes(search: $search, tags: $tags, page: $page, limit: $limit) {
      notes { ${LEARNING_NOTE_FIELDS} }
      page
      limit
      total
    }
  }
`

export const LEARNING_NOTE_QUERY = `
  query LearningNote($id: ID!) {
    learningNote(id: $id) { ${LEARNING_NOTE_FIELDS} }
  }
`

export const LEARNING_TAGS_QUERY = `
  query LearningTags($query: String) {
    learningTags(query: $query) { ${LEARNING_TAG_FIELDS} }
  }
`

export const LEARNING_NOTE_ADD_MUTATION = `
  mutation LearningNoteAdd($input: LearningNoteInput!) {
    learningNoteAdd(input: $input) { ${LEARNING_NOTE_FIELDS} }
  }
`

export const LEARNING_NOTE_EDIT_MUTATION = `
  mutation LearningNoteEdit($input: LearningNoteEditInput!) {
    learningNoteEdit(input: $input) { ${LEARNING_NOTE_FIELDS} }
  }
`

export const LEARNING_NOTE_REMOVE_MUTATION = `
  mutation LearningNoteRemove($id: ID!) {
    learningNoteRemove(id: $id)
  }
`

export const LEARNING_TAG_ADD_MUTATION = `
  mutation LearningTagAdd($input: LearningTagInput!) {
    learningTagAdd(input: $input) { ${LEARNING_TAG_FIELDS} }
  }
`
