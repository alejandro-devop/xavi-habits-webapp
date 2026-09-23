import { buildSchema, parse, validate } from 'graphql'
import { describe, expect, it } from 'vitest'
import activityDayPlanSdl from '@/features/vida/graphql/schema/activity-day-plan.schema.graphql?raw'
import activitySdl from '@/features/vida/graphql/schema/activity.schema.graphql?raw'
import vidaSdl from '@/features/vida/graphql/schema/vida.schema.graphql?raw'
import userSettingsSdl from '@/features/settings/graphql/schema/user-settings.schema.graphql?raw'
import * as activityCategoryDocuments from '@/features/vida/graphql/activity-categories.graphql'
import * as activityDayPlanDocuments from '@/features/vida/graphql/activity-day-plan.graphql'
import * as activityFollowUpDocuments from '@/features/vida/graphql/activity-followups.graphql'
import * as activityDocuments from '@/features/vida/graphql/activities.graphql'
import * as vidaItemDocuments from '@/features/vida/graphql/vida-items.graphql'
import * as userSettingsDocuments from '@/features/settings/graphql/user-settings.graphql'

/**
 * Contrato de la capa de datos de Vida contra el esquema real del backend.
 *
 * Los SDL están vendorizados (`schema/*.schema.graphql`, copiados de
 * `xavi-platform-node`): el test debe correr en cualquier máquina, sin el repo
 * hermano al lado y sin red. Si el backend cambia, este test no se entera solo:
 * hay que volver a copiar el SDL y entonces sí falla lo que quedó desfasado.
 *
 * No es una comprobación por regex: se construye el esquema y se valida cada
 * documento con `validate` de `graphql`, que es lo mismo que hará el servidor.
 *
 * **Un solo esquema con los cuatro SDL.** `activity-day-plan`, `vida` y
 * `user-settings` hacen `extend type Query`/`Mutation` y referencian `Activity`
 * y `DateTime`: por separado no levantan. Los bloques base (Query/Mutation
 * vacíos, escalares, tipos ajenos reducidos) viven **solo** en
 * `activity.schema.graphql`; los otros tres son copia literal sin añadidos.
 *
 * **`user-settings` vive aquí aunque sea de `features/settings`** (FEAT-003,
 * tajada 1): el módulo Vida es quien estrenó `vidaDayStartTime` /
 * `vidaDayEndTime`, y un arnés propio en `settings/` tendría que inventarse los
 * bloques base que solo existen en `activity.schema.graphql`. Es el único
 * esquema combinado del repositorio; si algún día `settings` crece, se mueve.
 */

const schema = buildSchema(
  [activitySdl, activityDayPlanSdl, vidaSdl, userSettingsSdl].join('\n'),
)

function documentsOf(module: Record<string, unknown>): [string, string][] {
  return Object.entries(module)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .sort(([a], [b]) => a.localeCompare(b))
}

/**
 * Los documentos **del módulo Vida**. Son los que además tienen prohibido
 * arrastrar nada del módulo de tareas.
 */
const vidaDocuments = [
  ...documentsOf(activityDocuments),
  ...documentsOf(activityCategoryDocuments),
  ...documentsOf(activityFollowUpDocuments),
  ...documentsOf(activityDayPlanDocuments),
  ...documentsOf(vidaItemDocuments),
]

/**
 * Los de ajustes se validan igual, pero **no** pasan por la regla de «nada de
 * tareas»: `standupTodoFolderId` es un campo legítimo de `UserSettings` que ya
 * se pedía antes de Vida. Sacarlo de la selección para contentar a un test
 * sería romper la cuenta de otra feature.
 */
const documents = [...vidaDocuments, ...documentsOf(userSettingsDocuments)]

describe('contratos GraphQL de Vida contra el esquema real', () => {
  it('exporta los documentos que la capa de datos usa', () => {
    expect(documents.map(([name]) => name)).toEqual([
      'ACTIVITIES_QUERY',
      'ACTIVITY_ADD_MUTATION',
      'ACTIVITY_COMPLETE_MUTATION',
      'ACTIVITY_EDIT_MUTATION',
      'ACTIVITY_QUERY',
      'ACTIVITY_REMOVE_MUTATION',
      'ACTIVITY_CATEGORIES_QUERY',
      'ACTIVITY_CATEGORY_ADD_MUTATION',
      'ACTIVITY_CATEGORY_EDIT_MUTATION',
      'ACTIVITY_CATEGORY_GOAL_SET_MUTATION',
      'ACTIVITY_CATEGORY_QUERY',
      'ACTIVITY_CATEGORY_REMOVE_MUTATION',
      'ACTIVITY_DAY_FOLLOW_UPS_QUERY',
      'ACTIVITY_FOLLOW_UP_ADD_MUTATION',
      'ACTIVITY_FOLLOW_UP_EDIT_MUTATION',
      'ACTIVITY_FOLLOW_UP_REMOVE_MUTATION',
      'ACTIVITY_FOLLOW_UP_START_MUTATION',
      'ACTIVITY_FOLLOW_UP_SUBTASK_EDIT_MUTATION',
      // «Lo de otras veces» (FEAT-018, tajada 2).
      'ACTIVITY_FOLLOW_UPS_BY_ACTIVITY_QUERY',
      'ACTIVITY_FOLLOW_UPS_IN_DATES_QUERY',
      'ACTIVITY_OPEN_FOLLOW_UP_QUERY',
      'ACTIVITY_DAY_PLAN_ITEM_ADD_MUTATION',
      'ACTIVITY_DAY_PLAN_ITEM_EDIT_MUTATION',
      'ACTIVITY_DAY_PLAN_ITEM_REMOVE_MUTATION',
      'ACTIVITY_DAY_PLAN_QUERY',
      'ACTIVITY_DAY_PLAN_SET_MUTATION',
      'VIDA_ITEM_CREATE_MUTATION',
      'VIDA_ITEM_DELETE_MUTATION',
      'VIDA_ITEM_UPDATE_MUTATION',
      'VIDA_ITEMS_QUERY',
      'VIDA_MARK_TAKEN_TODAY_MUTATION',
      'VIDA_SUGGESTIONS_FOR_DATE_QUERY',
      'VIDA_TAKEN_TODAY_QUERY',
      'VIDA_UNMARK_TAKEN_TODAY_MUTATION',
      'MY_SETTINGS_QUERY',
      'UPDATE_MY_SETTINGS_MUTATION',
    ])
  })

  it.each(documents)('%s valida contra el esquema', (_name, document) => {
    const errors = validate(schema, parse(document))
    expect(errors.map((error) => error.message)).toEqual([])
  })

  it.each(vidaDocuments)('%s no arrastra nada del módulo de tareas', (_name, document) => {
    expect(document).not.toMatch(/todo/i)
    expect(document).not.toMatch(/standup/i)
  })

  it('la comprobación tiene dientes: lo que el esquema no tiene, no valida', () => {
    // Si un campo inventado validara, el resto de este archivo no probaría nada.
    // (`todoFolders` no sirve de ejemplo: sigue existiendo en el esquema; que no
    //  lo pidamos es política nuestra, y eso lo comprueba el test de arriba.)
    const errors = validate(
      schema,
      parse(`
        query ActivityConCampoInventado($id: ID!) {
          activity(id: $id) {
            id
            spentTimeSeconds
          }
        }
      `),
    )
    expect(errors.map((error) => error.message)).toEqual([
      'Cannot query field "spentTimeSeconds" on type "Activity". Did you mean "spentTimeMinutes"?',
    ])
  })

  it('el esquema vendorizado trae los campos que el código viejo no conocía', () => {
    for (const field of [
      'subtasks: [ActivitySubtask!]!',
      'subtasksCount: ActivitySubtasksCount!',
      'sessionSubtasks: [ActivityFollowUpSubtask!]!',
      'sessionSubtasksCount: ActivitySubtasksCount!',
      'isOpen: Boolean!',
      'endDateTime: String',
    ]) {
      expect(activitySdl).toContain(field)
    }
  })

  it('los SDL nuevos son copia literal: no repiten los bloques base', () => {
    for (const sdl of [activityDayPlanSdl, vidaSdl, userSettingsSdl]) {
      expect(sdl).toContain('extend type Query')
      expect(sdl).toContain('extend type Mutation')
      expect(sdl).not.toMatch(/^type Query \{/m)
      expect(sdl).not.toMatch(/^type Mutation \{/m)
      expect(sdl).not.toMatch(/^scalar /m)
    }
  })

  it('el esquema combinado resuelve las referencias cruzadas a Activity', () => {
    // Si `ActivityDayPlanItem.activity` no apuntara al `Activity` del otro SDL,
    // `buildSchema` habría fallado antes de llegar aquí.
    const dayPlanItem = schema.getType('ActivityDayPlanItem')
    const vidaItem = schema.getType('VidaItem')
    expect(dayPlanItem).toBeDefined()
    expect(vidaItem).toBeDefined()
    expect(String(dayPlanItem?.toString())).toBe('ActivityDayPlanItem')
    expect(activityDayPlanSdl).toContain('activity: Activity!')
    expect(vidaSdl).toContain('activity: Activity')
  })

  it('la plantilla de Vida trae hora y duración en el tipo y en los dos inputs', () => {
    // El prerrequisito entero de FEAT-003: si el SDL se recopia sin esto, la
    // tajada 1 no tiene dónde guardar nada y se entera aquí.
    for (const block of ['type VidaItem', 'input VidaItemCreateInput', 'input VidaItemUpdateInput']) {
      const section = vidaSdl.slice(vidaSdl.indexOf(`${block} {`))
      const body = section.slice(0, section.indexOf('\n  }'))
      expect(body).toContain('startTime: String')
      expect(body).toContain('durationMinutes: Int')
    }
  })

  it('los ajustes traen el horario del día de Vida, y no es obligatorio', () => {
    const userSettings = schema.getType('UserSettings')
    expect(userSettings).toBeDefined()
    // Anulables a propósito: nulos por defecto, y el cliente pone 06:30 / 23:00.
    expect(userSettingsSdl).toContain('vidaDayStartTime: String')
    expect(userSettingsSdl).toContain('vidaDayEndTime: String')
    expect(userSettingsSdl).not.toContain('vidaDayStartTime: String!')
    expect(userSettingsSdl).not.toContain('vidaDayEndTime: String!')
  })

  it('la comprobación tiene dientes en los ajustes', () => {
    const errors = validate(
      schema,
      parse(`
        query MySettingsConCampoInventado {
          mySettings {
            userId
            vidaDayDuration
          }
        }
      `),
    )
    expect(errors.map((error) => error.message)).toEqual([
      'Cannot query field "vidaDayDuration" on type "UserSettings". Did you mean "vidaDayEndTime" or "vidaDayStartTime"?',
    ])
  })

  it('la comprobación tiene dientes también en los módulos nuevos', () => {
    const errors = validate(
      schema,
      parse(`
        query VidaItemsConCampoInventado {
          vidaItems {
            id
            frecuencia
          }
        }
      `),
    )
    expect(errors.map((error) => error.message)).toEqual([
      'Cannot query field "frecuencia" on type "VidaItem".',
    ])
  })
})
