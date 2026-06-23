export const activitiesPaths = {
  root: '/app/activities',
  list: '/app/activities/list',
  new: '/app/activities/new',
  categories: '/app/activities/categories',
  tracking: '/app/activities/tracking',
  detail: (id: string) => `/app/activities/${id}`,
  edit: (id: string) => `/app/activities/${id}/edit`,
} as const

export type ActivitiesPath = (typeof activitiesPaths)[keyof typeof activitiesPaths]
