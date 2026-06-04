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
  weekView: (habitId: string, weekStart: string) =>
    [...habitKeys.all, 'weekView', habitId, weekStart] as const,
  calendar: (from: string, to: string) => [...habitKeys.all, 'calendar', from, to] as const,
  categories: {
    all: () => [...habitKeys.all, 'categories'] as const,
    list: () => [...habitKeys.categories.all(), 'list'] as const,
    detail: (id: string) => [...habitKeys.categories.all(), 'detail', id] as const,
  },
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
    open: () => [...activityKeys.followUps.all(), 'open'] as const,
    day: (date: string) => [...activityKeys.followUps.all(), 'day', date] as const,
    range: (from: string, to: string) =>
      [...activityKeys.followUps.all(), 'range', from, to] as const,
  },
  pendingTodos: (activityId: string) =>
    [...activityKeys.all, 'pendingTodos', activityId] as const,
}

export const courseKeys = {
  all: ['courses'] as const,
  list: (filters: ListFilters = {}) => [...courseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
  progress: (courseId: string) => [...courseKeys.all, 'progress', courseId] as const,
}

export const weeklyRoutineKeys = {
  all: ['weeklyRoutines'] as const,
  list: (filters: ListFilters = {}) => [...weeklyRoutineKeys.all, 'list', filters] as const,
  detail: (id: string) => [...weeklyRoutineKeys.all, 'detail', id] as const,
  active: () => [...weeklyRoutineKeys.all, 'active'] as const,
}

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: ListFilters = {}) => [...todoKeys.all, 'list', filters] as const,
  detail: (id: string) => [...todoKeys.all, 'detail', id] as const,
  folders: {
    all: () => [...todoKeys.all, 'folders'] as const,
    list: () => [...todoKeys.folders.all(), 'list'] as const,
  },
}

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: ListFilters = {}) => [...noteKeys.all, 'list', filters] as const,
  detail: (id: string) => [...noteKeys.all, 'detail', id] as const,
}

export const quarterKeys = {
  all: ['quarters'] as const,
  list: () => [...quarterKeys.all, 'list'] as const,
  detail: (id: string) => [...quarterKeys.all, 'detail', id] as const,
  active: () => [...quarterKeys.all, 'active'] as const,
  projects: {
    all: () => [...quarterKeys.all, 'projects'] as const,
    list: () => [...quarterKeys.projects.all(), 'list'] as const,
    detail: (id: string) => [...quarterKeys.projects.all(), 'detail', id] as const,
  },
  sessionLogs: {
    all: () => [...quarterKeys.all, 'sessionLogs'] as const,
    byQuarter: (quarterId: string, projectId?: string) =>
      [...quarterKeys.sessionLogs.all(), 'quarter', quarterId, projectId ?? 'all'] as const,
    byProject: (projectId: string) =>
      [...quarterKeys.sessionLogs.all(), 'project', projectId] as const,
  },
  weekSchedule: {
    all: () => [...quarterKeys.all, 'weekSchedule'] as const,
    byQuarter: (quarterId: string) =>
      [...quarterKeys.weekSchedule.all(), 'quarter', quarterId] as const,
  },
}
