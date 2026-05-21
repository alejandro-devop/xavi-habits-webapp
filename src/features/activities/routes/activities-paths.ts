export const activitiesPaths = {
  root: '/app/activities',
  categories: '/app/activities/categories',
} as const

export type ActivitiesPath = (typeof activitiesPaths)[keyof typeof activitiesPaths]
