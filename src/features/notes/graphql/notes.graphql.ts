const NOTE_FIELDS = `
  id
  content
  tags { id name color }
  createdAt
  updatedAt
`

export const NOTES_QUERY = `
  query Notes($tagId: ID, $dateFrom: DateTime, $dateTo: DateTime, $page: Int, $limit: Int) {
    notes(tagId: $tagId, dateFrom: $dateFrom, dateTo: $dateTo, page: $page, limit: $limit) {
      notes { ${NOTE_FIELDS} }
      page
      limit
      total
    }
  }
`

export const NOTE_QUERY = `
  query Note($id: ID!) {
    note(id: $id) { ${NOTE_FIELDS} }
  }
`

export const NOTE_ADD_MUTATION = `
  mutation NoteAdd($input: NoteInput!) {
    noteAdd(input: $input) { ${NOTE_FIELDS} }
  }
`

export const NOTE_EDIT_MUTATION = `
  mutation NoteEdit($input: NoteEditInput!) {
    noteEdit(input: $input) { ${NOTE_FIELDS} }
  }
`

export const NOTE_REMOVE_MUTATION = `
  mutation NoteRemove($id: ID!) {
    noteRemove(id: $id)
  }
`
