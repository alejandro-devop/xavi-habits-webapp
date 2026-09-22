import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as activityCategoriesApi from '@/features/vida/api/activity-categories.api'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import type {
  ActivityCategoryEditInput,
  ActivityCategoryGoalSetInput,
  ActivityCategoryInput,
} from '@/features/vida/types/activity-category.types'
import { invalidateActivityCategoryQueries } from '@/features/vida/utils/invalidate-vida-queries'
import { toErrorMessage } from '@/features/vida/utils/vida-error.utils'
import { vidaKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

/**
 * `onError` con toast en las mutaciones que estrena la hoja de F1 (tajada 2).
 * Mismo criterio que en `useActivities.ts`: va en el hook y no en cada
 * pantalla, para que la siguiente no se lo olvide. **No basta** para el
 * criterio 16: lo que mantiene la hoja abierta es que el cierre vive en el
 * `onSuccess` local del `mutate`, no aquí. El mensaje lo arma
 * `toErrorMessage`, compartido por los tres hooks de Vida.
 */

export function useActivityCategoriesQuery() {
  const enabled = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.categories.list(),
    enabled,
    queryFn: activityCategoriesApi.getActivityCategories,
    staleTime: 1000 * 60 * 5,
  })
}

export function useActivityCategoryQuery(id: string | undefined) {
  const enabled = useVidaQueryGuard()
  return useQuery({
    queryKey: vidaKeys.categories.detail(id ?? ''),
    enabled: enabled && Boolean(id),
    queryFn: () => activityCategoriesApi.getActivityCategory(id!),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateActivityCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityCategoryInput) =>
      activityCategoriesApi.createActivityCategory(input),
    onSuccess: () => {
      invalidateActivityCategoryQueries(queryClient)
      toast.success('Categoría creada')
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos crear la categoría'))
    },
  })
}

export function useUpdateActivityCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityCategoryEditInput) =>
      activityCategoriesApi.updateActivityCategory(input),
    onSuccess: (_data, variables) => {
      invalidateActivityCategoryQueries(queryClient, { id: variables.id })
      toast.success('Categoría actualizada')
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos guardar la categoría'))
    },
  })
}

/**
 * Apuntar (o desapuntar) una categoría a una meta. Reusa la invalidación que ya
 * existe: al volver el catálogo, todo lo que dependa de la meta se recalcula
 * solo, sin recargar la página.
 *
 * **Sin toast de éxito a propósito**: al guardar el formulario esta mutación
 * viaja junto a `activityCategoryEdit`, que ya dice «Categoría actualizada»;
 * dos avisos por un solo guardado serían ruido. El de error sí está, porque al
 * crear es el segundo viaje y puede fallar solo.
 */
export function useSetActivityCategoryGoalMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: ActivityCategoryGoalSetInput) =>
      activityCategoriesApi.setActivityCategoryGoal(input),
    onSuccess: (_data, variables) => {
      invalidateActivityCategoryQueries(queryClient, { id: variables.categoryId })
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, 'No pudimos guardar la meta de la categoría'))
    },
  })
}

export function useDeleteActivityCategoryMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => activityCategoriesApi.deleteActivityCategory(id),
    onSuccess: () => {
      invalidateActivityCategoryQueries(queryClient)
      toast.success('Categoría eliminada')
    },
  })
}
