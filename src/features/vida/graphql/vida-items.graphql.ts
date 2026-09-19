const VIDA_ITEM_FIELDS = `
  id
  userId
  activityId
  days
  notes
  isActive
  orderIndex
  createdAt
  updatedAt
`

/** Mismo subconjunto de `Activity` que seleccionan los documentos de follow-ups. */
const VIDA_ITEM_ACTIVITY_FIELDS = `
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

const VIDA_TAKEN_TODAY_FIELDS = `
  id
  userId
  vidaItemId
  date
  createdAt
`

export const VIDA_ITEMS_QUERY = `
  query VidaItems($includeInactive: Boolean) {
    vidaItems(includeInactive: $includeInactive) {
      ${VIDA_ITEM_FIELDS}
      ${VIDA_ITEM_ACTIVITY_FIELDS}
    }
  }
`

export const VIDA_SUGGESTIONS_FOR_DATE_QUERY = `
  query VidaSuggestionsForDate($date: String!) {
    vidaSuggestionsForDate(date: $date) {
      takenToday
      item {
        ${VIDA_ITEM_FIELDS}
        ${VIDA_ITEM_ACTIVITY_FIELDS}
      }
    }
  }
`

export const VIDA_TAKEN_TODAY_QUERY = `
  query VidaTakenToday($date: String!) {
    vidaTakenToday(date: $date) {
      ${VIDA_TAKEN_TODAY_FIELDS}
    }
  }
`

export const VIDA_ITEM_CREATE_MUTATION = `
  mutation VidaItemCreate($input: VidaItemCreateInput!) {
    vidaItemCreate(input: $input) {
      ${VIDA_ITEM_FIELDS}
      ${VIDA_ITEM_ACTIVITY_FIELDS}
    }
  }
`

export const VIDA_ITEM_UPDATE_MUTATION = `
  mutation VidaItemUpdate($input: VidaItemUpdateInput!) {
    vidaItemUpdate(input: $input) {
      ${VIDA_ITEM_FIELDS}
      ${VIDA_ITEM_ACTIVITY_FIELDS}
    }
  }
`

export const VIDA_ITEM_DELETE_MUTATION = `
  mutation VidaItemDelete($input: VidaItemDeleteInput!) {
    vidaItemDelete(input: $input)
  }
`

export const VIDA_MARK_TAKEN_TODAY_MUTATION = `
  mutation VidaMarkTakenToday($input: VidaMarkTakenTodayInput!) {
    vidaMarkTakenToday(input: $input) {
      ${VIDA_TAKEN_TODAY_FIELDS}
    }
  }
`

export const VIDA_UNMARK_TAKEN_TODAY_MUTATION = `
  mutation VidaUnmarkTakenToday($input: VidaUnmarkTakenTodayInput!) {
    vidaUnmarkTakenToday(input: $input)
  }
`
