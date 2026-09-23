/**
 * Documentos GraphQL de las **metas** de Vida.
 *
 * Aquí solo vive la escritura: las metas se **leen** dentro del catálogo de
 * categorías (`ActivityCategory.goal`, en `activity-categories.graphql.ts`) y
 * no hay ninguna consulta `vidaGoals` en el front. Si algún día la hay, entra
 * en este archivo.
 */
export const VIDA_GOAL_DAYS_SET_MUTATION = `
  mutation VidaGoalDaysSet($input: VidaGoalDaysSetInput!) {
    vidaGoalDaysSet(input: $input) {
      id
      slug
      name
      icon
      color
      targetMinutes
      activeDays
      orderIndex
    }
  }
`
