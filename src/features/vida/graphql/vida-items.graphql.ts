const VIDA_ITEM_FIELDS = `
  id
  userId
  activityId
  days
  startTime
  durationMinutes
  notes
  isActive
  orderIndex
  createdAt
  updatedAt
`

/**
 * Mismo subconjunto de `Activity` que seleccionan los documentos de follow-ups,
 * **más `status`** (FEAT-003, tajada 5): «armar desde la plantilla» no puede
 * poner en el día una actividad archivada (`status: 'cancelled'`), y el ítem de
 * plantilla es el único sitio donde eso se puede saber sin una consulta más.
 */
const VIDA_ITEM_ACTIVITY_FIELDS = `
  activity {
    id
    title
    description
    status
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
