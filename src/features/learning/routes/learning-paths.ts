export const learningPaths = {
  root: '/app/learning',
  new: '/app/learning/new',
  note: (id: string) => `/app/learning/${id}`,
} as const
