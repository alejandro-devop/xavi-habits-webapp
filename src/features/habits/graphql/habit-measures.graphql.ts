const MEASURE_FIELDS = `
  id
  userId
  name
  abbreviation
  type
  createdAt
  updatedAt
`

export const HABIT_MEASURE_QUERY = `
  query HabitMeasure($id: ID!) {
    habitMeasure(id: $id) {
      ${MEASURE_FIELDS}
    }
  }
`

export const HABIT_MEASURE_ADD_MUTATION = `
  mutation HabitMeasureAdd($input: HabitMeasureInput!) {
    habitMeasureAdd(input: $input) {
      ${MEASURE_FIELDS}
    }
  }
`

export const HABIT_MEASURE_EDIT_MUTATION = `
  mutation HabitMeasureEdit($input: HabitMeasureEditInput!) {
    habitMeasureEdit(input: $input) {
      ${MEASURE_FIELDS}
    }
  }
`

export const HABIT_MEASURE_REMOVE_MUTATION = `
  mutation HabitMeasureRemove($id: ID!) {
    habitMeasureRemove(id: $id)
  }
`
