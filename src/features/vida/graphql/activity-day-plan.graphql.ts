const DAY_PLAN_ITEM_FIELDS = `
  id
  userId
  activityId
  date
  startTime
  endTime
  orderIndex
  completedAt
  createdAt
  updatedAt
`

/** Mismo subconjunto de `Activity` que seleccionan los documentos de follow-ups. */
const DAY_PLAN_ACTIVITY_FIELDS = `
  activity {
    id
    title
    description
    category {
      id
      name
      color
      icon
    }
  }
`

export const ACTIVITY_DAY_PLAN_QUERY = `
  query ActivityDayPlan($date: String!) {
    activityDayPlan(date: $date) {
      ${DAY_PLAN_ITEM_FIELDS}
      ${DAY_PLAN_ACTIVITY_FIELDS}
    }
  }
`

export const ACTIVITY_DAY_PLAN_SET_MUTATION = `
  mutation ActivityDayPlanSet($input: ActivityDayPlanSetInput!) {
    activityDayPlanSet(input: $input) {
      ${DAY_PLAN_ITEM_FIELDS}
      ${DAY_PLAN_ACTIVITY_FIELDS}
    }
  }
`

export const ACTIVITY_DAY_PLAN_ITEM_ADD_MUTATION = `
  mutation ActivityDayPlanItemAdd($input: ActivityDayPlanItemAddInput!) {
    activityDayPlanItemAdd(input: $input) {
      ${DAY_PLAN_ITEM_FIELDS}
      ${DAY_PLAN_ACTIVITY_FIELDS}
    }
  }
`

export const ACTIVITY_DAY_PLAN_ITEM_EDIT_MUTATION = `
  mutation ActivityDayPlanItemEdit($input: ActivityDayPlanItemEditInput!) {
    activityDayPlanItemEdit(input: $input) {
      ${DAY_PLAN_ITEM_FIELDS}
      ${DAY_PLAN_ACTIVITY_FIELDS}
    }
  }
`

export const ACTIVITY_DAY_PLAN_ITEM_REMOVE_MUTATION = `
  mutation ActivityDayPlanItemRemove($input: ActivityDayPlanItemRemoveInput!) {
    activityDayPlanItemRemove(input: $input)
  }
`
