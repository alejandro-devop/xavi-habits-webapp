const CATEGORY_FIELDS = `
  id
  userId
  name
  description
  icon
  color
  orderIndex
`

export const HABIT_CATEGORY_QUERY = `
  query HabitCategory($id: ID!) {
    habitCategory(id: $id) {
      ${CATEGORY_FIELDS}
    }
  }
`

export const HABIT_CATEGORY_ADD_MUTATION = `
  mutation HabitCategoryAdd($input: HabitCategoryInput!) {
    habitCategoryAdd(input: $input) {
      ${CATEGORY_FIELDS}
    }
  }
`

export const HABIT_CATEGORY_EDIT_MUTATION = `
  mutation HabitCategoryEdit($input: HabitCategoryEditInput!) {
    habitCategoryEdit(input: $input) {
      ${CATEGORY_FIELDS}
    }
  }
`

export const HABIT_CATEGORY_REMOVE_MUTATION = `
  mutation HabitCategoryRemove($id: ID!) {
    habitCategoryRemove(id: $id)
  }
`
