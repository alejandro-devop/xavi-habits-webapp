const FOLLOW_UP_FIELDS = `
  id
  activityId
  date
  startTime
  durationMinutes
  isOpen
  endTime
  endDate
  endDateTime
  notes
  sessionSubtasksCount {
    total
    completed
  }
`

const FOLLOW_UP_ACTIVITY_FIELDS = `
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

/**
 * Las subtareas de la sesión, **solo aquí** (criterio 10): en el documento del
 * día serían N sesiones × sus subtareas para no pintarlas en ninguna parte.
 */
const SESSION_SUBTASK_FIELDS = `
  sessionSubtasks {
    id
    followUpId
    activitySubtaskId
    title
    isCompleted
    orderIndex
    createdAt
    updatedAt
  }
`

export const ACTIVITY_OPEN_FOLLOW_UP_QUERY = `
  query ActivityOpenFollowUp {
    activityOpenFollowUp {
      ${FOLLOW_UP_FIELDS}
      ${SESSION_SUBTASK_FIELDS}
      ${FOLLOW_UP_ACTIVITY_FIELDS}
    }
  }
`

export const ACTIVITY_DAY_FOLLOW_UPS_QUERY = `
  query ActivityDayFollowUps($date: String!) {
    activityDayFollowUps(date: $date) {
      ${FOLLOW_UP_FIELDS}
      ${FOLLOW_UP_ACTIVITY_FIELDS}
    }
  }
`

export const ACTIVITY_FOLLOW_UPS_IN_DATES_QUERY = `
  query ActivityFollowUpsInDates($from: String!, $to: String!) {
    activityFollowUpsInDates(from: $from, to: $to) {
      date
      followUps {
        ${FOLLOW_UP_FIELDS}
        activity {
          id
          title
          category {
            id
            name
            color
            icon
          }
        }
      }
    }
  }
`

export const ACTIVITY_FOLLOW_UP_START_MUTATION = `
  mutation ActivityFollowUpStart($input: ActivityFollowUpStartInput!) {
    activityFollowUpStart(input: $input) {
      ${FOLLOW_UP_FIELDS}
      ${FOLLOW_UP_ACTIVITY_FIELDS}
    }
  }
`

export const ACTIVITY_FOLLOW_UP_ADD_MUTATION = `
  mutation ActivityFollowUpAdd($input: ActivityFollowUpAddInput!) {
    activityFollowUpAdd(input: $input) {
      ${FOLLOW_UP_FIELDS}
    }
  }
`

export const ACTIVITY_FOLLOW_UP_EDIT_MUTATION = `
  mutation ActivityFollowUpEdit($input: ActivityFollowUpEditInput!) {
    activityFollowUpEdit(input: $input) {
      ${FOLLOW_UP_FIELDS}
    }
  }
`

export const ACTIVITY_FOLLOW_UP_REMOVE_MUTATION = `
  mutation ActivityFollowUpRemove($id: ID!) {
    activityFollowUpRemove(id: $id)
  }
`

export const ACTIVITY_FOLLOW_UP_SUBTASK_EDIT_MUTATION = `
  mutation ActivityFollowUpSubtaskEdit($input: ActivityFollowUpSubtaskEditInput!) {
    activityFollowUpSubtaskEdit(input: $input) {
      id
      followUpId
      activitySubtaskId
      title
      isCompleted
      orderIndex
      createdAt
      updatedAt
    }
  }
`

/**
 * **«Lo de otras veces»** (FEAT-018, criterio 546): las últimas sesiones de
 * **una** actividad, para sacar de ahí tres píldoras de un toque.
 *
 * `activityFollowUps` ya estaba en el esquema y ya estaba resuelto
 * (`listFollowUps`): devuelve **solo sesiones cerradas** —`duration_minutes IS
 * NOT NULL`— y ordena por `date DESC, start_time DESC`, así que la sesión que
 * está corriendo ahora mismo nunca se ofrece a sí misma como píldora.
 *
 * **La selección es corta a propósito** y **no** usa `FOLLOW_UP_FIELDS`: para
 * tres píldoras no hacen falta ni `sessionSubtasksCount` —que son N resoluciones
 * más en el servidor, una por fila— ni la actividad, que quien abre el editor ya
 * tiene delante. `date` y `startTime` viajan solo para poder leer la respuesta
 * en un depurador; `id` es lo que permite excluir la sesión que se está
 * editando.
 */
export const ACTIVITY_FOLLOW_UPS_BY_ACTIVITY_QUERY = `
  query ActivityFollowUpsByActivity($activityId: ID, $limit: Int) {
    activityFollowUps(activityId: $activityId, limit: $limit) {
      id
      date
      startTime
      notes
    }
  }
`
