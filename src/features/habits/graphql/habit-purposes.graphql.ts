export const HABIT_PURPOSES_QUERY = `
  query HabitPurposes {
    habitPurposes {
      id userId name description icon placement orderIndex createdAt updatedAt
    }
  }
`

export const HABIT_PURPOSE_ADD_MUTATION = `
  mutation HabitPurposeAdd($input: HabitPurposeInput!) {
    habitPurposeAdd(input: $input) {
      id userId name description icon placement orderIndex createdAt updatedAt
    }
  }
`

export const HABIT_PURPOSE_EDIT_MUTATION = `
  mutation HabitPurposeEdit($input: HabitPurposeEditInput!) {
    habitPurposeEdit(input: $input) {
      id userId name description icon placement orderIndex createdAt updatedAt
    }
  }
`

export const HABIT_PURPOSE_REMOVE_MUTATION = `
  mutation HabitPurposeRemove($id: ID!) {
    habitPurposeRemove(id: $id)
  }
`
