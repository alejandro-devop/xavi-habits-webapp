export type ListFilters = Record<string, unknown>

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
}

export const habitKeys = {
  all: ['habits'] as const,
  list: (filters: ListFilters = {}) => [...habitKeys.all, 'list', filters] as const,
  detail: (id: string) => [...habitKeys.all, 'detail', id] as const,
  myDay: (date: string) => [...habitKeys.all, 'myDay', date] as const,
}

export const activityKeys = {
  all: ['activities'] as const,
  list: (filters: ListFilters = {}) => [...activityKeys.all, 'list', filters] as const,
  detail: (id: string) => [...activityKeys.all, 'detail', id] as const,
  categories: {
    all: () => [...activityKeys.all, 'categories'] as const,
    list: () => [...activityKeys.categories.all(), 'list'] as const,
    detail: (id: string) => [...activityKeys.categories.all(), 'detail', id] as const,
  },
  followUps: {
    all: () => [...activityKeys.all, 'followUps'] as const,
    day: (date: string) => [...activityKeys.followUps.all(), 'day', date] as const,
    range: (from: string, to: string) =>
      [...activityKeys.followUps.all(), 'range', from, to] as const,
  },
}

export const courseKeys = {
  all: ['courses'] as const,
  list: (filters: ListFilters = {}) => [...courseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
  progress: (courseId: string) => [...courseKeys.all, 'progress', courseId] as const,
}

export const todoKeys = {
  all: ['todos'] as const,
  list: (filters: ListFilters = {}) => [...todoKeys.all, 'list', filters] as const,
  detail: (id: string) => [...todoKeys.all, 'detail', id] as const,
}
