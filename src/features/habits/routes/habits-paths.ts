export const habitsPaths = {
  root: '/app/habits',
  myDay: '/app/habits/my-day',
  list: '/app/habits/list',
  categories: '/app/habits/categories',
  detail: (id: string) => `/app/habits/${id}`,
  edit: (id: string) => `/app/habits/${id}/edit`,
  week: (id: string) => `/app/habits/${id}/week`,
  calendar: (id: string) => `/app/habits/${id}/calendar`,
} as const
