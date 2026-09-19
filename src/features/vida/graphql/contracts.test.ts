import { buildSchema, parse, validate } from 'graphql'
import { describe, expect, it } from 'vitest'
import activitySdl from '@/features/vida/graphql/schema/activity.schema.graphql?raw'
import * as activityCategoryDocuments from '@/features/vida/graphql/activity-categories.graphql'
import * as activityFollowUpDocuments from '@/features/vida/graphql/activity-followups.graphql'
import * as activityDocuments from '@/features/vida/graphql/activities.graphql'

/**
 * Contrato de la capa de datos de Vida contra el esquema real del backend.
 *
 * El SDL está vendorizado (`schema/activity.schema.graphql`, copiado de
 * `xavi-platform-node`): el test debe correr en cualquier máquina, sin el repo
 * hermano al lado y sin red. Si el backend cambia, este test no se entera solo:
 * hay que volver a copiar el SDL y entonces sí falla lo que quedó desfasado.
 *
 * No es una comprobación por regex: se construye el esquema y se valida cada
 * documento con `validate` de `graphql`, que es lo mismo que hará el servidor.
 */

const schema = buildSchema(activitySdl)

function documentsOf(module: Record<string, unknown>): [string, string][] {
  return Object.entries(module)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .sort(([a], [b]) => a.localeCompare(b))
}

const documents = [
  ...documentsOf(activityDocuments),
  ...documentsOf(activityCategoryDocuments),
  ...documentsOf(activityFollowUpDocuments),
]

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
      'ACTIVITY_CATEGORY_QUERY',
      'ACTIVITY_CATEGORY_REMOVE_MUTATION',
      'ACTIVITY_DAY_FOLLOW_UPS_QUERY',
      'ACTIVITY_FOLLOW_UP_ADD_MUTATION',
      'ACTIVITY_FOLLOW_UP_EDIT_MUTATION',
      'ACTIVITY_FOLLOW_UP_REMOVE_MUTATION',
      'ACTIVITY_FOLLOW_UP_START_MUTATION',
      'ACTIVITY_FOLLOW_UPS_IN_DATES_QUERY',
      'ACTIVITY_OPEN_FOLLOW_UP_QUERY',
    ])
  })

  it.each(documents)('%s valida contra el esquema', (_name, document) => {
    const errors = validate(schema, parse(document))
    expect(errors.map((error) => error.message)).toEqual([])
  })

  it.each(documents)('%s no arrastra nada del módulo de tareas', (_name, document) => {
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
})
