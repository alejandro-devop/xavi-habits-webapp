export const activitiesPaths = {
  root: '/app/activities',
  list: '/app/activities/list',
  new: '/app/activities/new',
  categories: '/app/activities/categories',
  tracking: '/app/activities/tracking',
  standup: '/app/activities/standup',
  standupWeek: '/app/activities/standup/week',
  detail: (id: string) => `/app/activities/${id}`,
  edit: (id: string) => `/app/activities/${id}/edit`,
} as const
