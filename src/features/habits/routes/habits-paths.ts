export const habitsPaths = {
  root: '/app/habits',
  myDay: '/app/habits/my-day',
  list: '/app/habits/list',
  archived: '/app/habits/archived',
  categories: '/app/habits/categories',
  measures: '/app/habits/measures',
  detail: (id: string) => `/app/habits/${id}`,
  edit: (id: string) => `/app/habits/${id}/edit`,
  week: (id: string) => `/app/habits/${id}/week`,
  calendar: (id: string) => `/app/habits/${id}/calendar`,
  persona: '/app/habits/persona',
} as const
