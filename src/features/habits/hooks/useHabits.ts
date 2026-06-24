import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as habitsApi from '@/features/habits/api/habits.api'
import type {
  HabitEditInput,
  HabitFilters,
  HabitInput,
} from '@/features/habits/types/habit.types'
import { useAuthBootstrap } from '@/features/auth/providers/useAuthBootstrap'
import { selectIsAuthenticated } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { habitKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

function useHabitQueryGuard() {
  const isReady = useAuthBootstrap().status === 'ready'
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  return isReady && isAuthenticated
}

export function useHabitMyDayQuery(date: string) {
  const enabled = useHabitQueryGuard()
  return useQuery({
    queryKey: habitKeys.myDay(date),
    enabled,
    queryFn: () => habitsApi.getHabitMyDay(date),
    staleTime: 1000 * 30,
  })
}

export function useHabitsQuery(filters: HabitFilters = {}) {
  const enabled = useHabitQueryGuard()
  return useQuery({
    queryKey: habitKeys.list(filters as Record<string, unknown>),
    enabled,
    queryFn: () => habitsApi.getHabits(filters),
    staleTime: 1000 * 30,
  })
}

export function useHabitQuery(id: string | undefined) {
  const enabled = useHabitQueryGuard()
  return useQuery({
    queryKey: habitKeys.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => habitsApi.getHabit(id!),
    staleTime: 1000 * 30,
  })
}

export function useHabitWeekViewQuery(habitId: string | undefined, weekStart: string | undefined) {
  const enabled = useHabitQueryGuard()
  return useQuery({
    queryKey: habitKeys.weekView(habitId ?? '', weekStart ?? ''),
    enabled: enabled && Boolean(habitId) && Boolean(weekStart),
    queryFn: () => habitsApi.getHabitWeekView(habitId!, weekStart!),
    staleTime: 1000 * 30,
  })
}

export function useHabitFollowUpsInDatesQuery(from: string, to: string) {
  const enabled = useHabitQueryGuard()
  return useQuery({
    queryKey: habitKeys.calendar(from, to),
    enabled,
    queryFn: () => habitsApi.getHabitFollowUpsInDates(from, to),
    staleTime: 1000 * 30,
  })
}

export function useHabitCategoriesQuery() {
  const enabled = useHabitQueryGuard()
  return useQuery({
    queryKey: habitKeys.categories.list(),
    enabled,
    queryFn: () => habitsApi.getHabitCategories(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useHabitMeasuresQuery() {
  const enabled = useHabitQueryGuard()
  return useQuery({
    queryKey: habitKeys.measures.list(),
    enabled,
    queryFn: () => habitsApi.getHabitMeasures(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateHabitMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: HabitInput) => habitsApi.createHabit(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.all, refetchType: 'all' })
      toast.success('Hábito creado')
    },
  })
}

export function useUpdateHabitMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: HabitEditInput) => habitsApi.updateHabit(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.all, refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: habitKeys.detail(variables.id), refetchType: 'all' })
      toast.success('Hábito actualizado')
    },
  })
}

export function useDeleteHabitMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => habitsApi.removeHabit(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.all, refetchType: 'all' })
      toast.success('Hábito eliminado')
    },
  })
}

export function useCompleteHabitMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => habitsApi.completeHabit(id),
    onSuccess: () => {
      const today = new Date().toISOString().split('T')[0]
      void queryClient.invalidateQueries({ queryKey: habitKeys.all })
      void queryClient.invalidateQueries({ queryKey: habitKeys.myDay(today) })
      toast.success('¡Hábito completado!')
    },
  })
}
