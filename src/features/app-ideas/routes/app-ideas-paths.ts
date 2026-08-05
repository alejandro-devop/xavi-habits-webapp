export const appIdeasPaths = {
  root: '/app/ideas',
  new: '/app/ideas/new',
  idea: (id: string) => `/app/ideas/${id}`,
} as const
