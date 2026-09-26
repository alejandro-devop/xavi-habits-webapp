import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as followUpsApi from '@/features/habits/api/habit-follow-ups.api'
import type {
  HabitFollowUpAddInput,
  HabitFollowUpEditInput,
} from '@/features/habits/types/habit.types'
import { timeOfDayForDate } from '@/features/habits/utils/habit-time.utils'
import { habitKeys } from '@/shared/api/query-keys'
import { useToast } from '@/shared/ui/Toast'

type FollowUpMutationContext = {
  habitId: string
  date?: string
  weekStart?: string
}

/** Invalida todo lo que depende del log (racha incluida en habitMyDay / detail / list). */
function invalidateAfterFollowUpChange(
  queryClient: ReturnType<typeof useQueryClient>,
  habitId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: [...habitKeys.all, 'myDay'],
    refetchType: 'all',
  })
  void queryClient.invalidateQueries({
    queryKey: habitKeys.detail(habitId),
    refetchType: 'all',
  })
  void queryClient.invalidateQueries({
    queryKey: [...habitKeys.all, 'list'],
    refetchType: 'all',
  })
  void queryClient.invalidateQueries({
    queryKey: [...habitKeys.all, 'weekView', habitId],
    refetchType: 'all',
  })
  void queryClient.invalidateQueries({
    queryKey: [...habitKeys.all, 'calendar'],
    refetchType: 'all',
  })
}

export function useAddHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    /**
     * **Aquí se sella la hora, y por eso se sella aquí.** Los cuatro sitios que
     * escriben un seguimiento (el círculo de Mi Día, los tres caminos del cajón
     * de registro, el salvavidas y su botón) pasan todos por este embudo: la
     * decisión se toma una vez en lugar de cuatro, y marcar sigue costando un
     * toque — cero píxeles nuevos en ese camino.
     *
     * La hora se toma **dentro del `mutationFn`**, o sea al pulsar, no al montar
     * el formulario. Si el día registrado no es hoy, `timeOfDayForDate` devuelve
     * `null` y entonces **la clave no viaja**: `timeOfDay` ausente deja la hora
     * en `null` en el API, y un cliente nuevo contra un API sin el campo no se
     * cae por mandar algo que no existe.
     */
    mutationFn: (input: HabitFollowUpAddInput) => {
      if (input.timeOfDay !== undefined) return followUpsApi.addHabitFollowUp(input)
      const timeOfDay = timeOfDayForDate(input.date)
      return followUpsApi.addHabitFollowUp(timeOfDay ? { ...input, timeOfDay } : input)
    },
    onSuccess: (_data, variables) => {
      invalidateAfterFollowUpChange(queryClient, variables.habitId)
    },
    onError: () => {
      toast.error('Error al registrar el log')
    },
  })
}

export function useUpdateHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({
      input,
    }: {
      input: HabitFollowUpEditInput
      context: FollowUpMutationContext
    }) => followUpsApi.updateHabitFollowUp(input),
    onSuccess: (_data, { context }) => {
      invalidateAfterFollowUpChange(queryClient, context.habitId)
    },
    onError: () => {
      toast.error('Error al actualizar el log')
    },
  })
}

export function useRemoveHabitFollowUpMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id }: { id: string; context: FollowUpMutationContext }) =>
      followUpsApi.removeHabitFollowUp(id),
    onSuccess: (_data, { context }) => {
      invalidateAfterFollowUpChange(queryClient, context.habitId)
    },
    onError: () => {
      toast.error('Error al eliminar el log')
    },
  })
}

/**
 * Corregir **solo** la hora de un seguimiento que ya existe.
 *
 * Hermana de `useUpdateHabitFollowUpMutation` y no la misma: aquella reescribe
 * `difficulty` y `notes` en el mismo `habitFollowUpEdit`, y la corrección de la
 * hora no debe tocar nada más que la hora. En el input viaja `{ id, timeOfDay }`
 * y nada más; el API entiende «ausente = no toques la hora, `null` = bórrala».
 */
export function useSetFollowUpTimeOfDayMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({
      id,
      timeOfDay,
    }: {
      id: string
      timeOfDay: string
      context: FollowUpMutationContext
    }) => followUpsApi.updateHabitFollowUp({ id, timeOfDay }),
    onSuccess: (_data, { timeOfDay, context }) => {
      invalidateAfterFollowUpChange(queryClient, context.habitId)
      toast.success(`Hora corregida: ${timeOfDay}`)
    },
    onError: () => {
      toast.error('Error al guardar la hora')
    },
  })
}
