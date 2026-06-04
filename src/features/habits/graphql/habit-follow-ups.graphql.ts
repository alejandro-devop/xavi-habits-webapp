const FOLLOW_UP_FULL_FIELDS = `
  id
  date
  habitId
  isAccomplished
  isFailed
  isLifeline
  difficulty
  count
  time
  notes
  story
  archived
`

export const HABIT_FOLLOW_UP_ADD_MUTATION = `
  mutation HabitFollowUpAdd($input: HabitFollowUpAddInput!) {
    habitFollowUpAdd(input: $input) {
      ${FOLLOW_UP_FULL_FIELDS}
    }
  }
`

export const HABIT_FOLLOW_UP_EDIT_MUTATION = `
  mutation HabitFollowUpEdit($input: HabitFollowUpEditInput!) {
    habitFollowUpEdit(input: $input) {
      ${FOLLOW_UP_FULL_FIELDS}
    }
  }
`

export const HABIT_FOLLOW_UP_REMOVE_MUTATION = `
  mutation HabitFollowUpRemove($id: ID!) {
    habitFollowUpRemove(id: $id)
  }
`
