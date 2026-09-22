import { useCallback, useMemo } from 'react'
import { useVidaHistoryWindow } from '@/features/vida/hooks/useVidaHistoryWindow'
import { useVidaItemsQuery } from '@/features/vida/hooks/useVidaItems'
import {
  getPatternAnswer,
  useVidaDeviceNotesStore,
  vidaBridgeKey,
} from '@/features/vida/store/vida-device-notes.store'
import {
  buildAdherence,
  type VidaAdherence,
} from '@/features/vida/utils/vida-adherence.utils'
import {
  formatDateToYmd,
  getMondayOfWeek,
  parseYmdToLocalDate,
} from '@/features/vida/utils/vida-date.utils'
import {
  answerNoteFor,
  bridgeAnswerNoteFor,
  buildActivityPatterns,
  isSuggestionSilenced,
  type VidaActivityPattern,
  type VidaPatternAnswer,
  type VidaPatternSuggestion,
  type VidaPatternWaiting,
} from '@/features/vida/utils/vida-patterns.utils'

/**
 * **El pegamento, y el único punto de entrada de las tres pantallas**
 * (FEAT-007, tajada 2).
 *
 * Junta la ventana de seis semanas, la plantilla y las respuestas guardadas en
 * el aparato, y devuelve **las sugerencias ya filtradas** por la regla de D1.
 * Revisión (esta tajada), Hoy (la 3) y la hoja de la plantilla (la 4) consumen
 * esto y **ninguna vuelve a decidir**: si cada pantalla aplicara la regla por
 * su cuenta, «Dejarlo» en una no callaría en las otras, que es justo lo que el
 * criterio 83 prohíbe.
 *
 * Molde: `useVidaDayData` —un hook que junta consultas y derivación y no pinta
 * nada—. Aquí tampoco hay JSX, ni `new Date()`: el «hoy» entra por parámetro.
 *
 * **No monta ninguna consulta nueva**: la ventana ya existe (tajada 1), la
 * plantilla es `vidaKeys.items.list(true)` —la misma que ya piden Plantilla,
 * Actividades y Archivadas— y las respuestas son `localStorage`. Con
 * `enabled: false` **no se pide nada**, ni la ventana ni la plantilla: las dos
 * pasan por el mismo interruptor, que es lo que las tajadas 3 y 4 necesitan
 * para montar esto **diferido** sin tocar el primer pintado de Hoy.
 */

export type UseVidaPatternsInput = {
  /** Se monta solo con su sección abierta: la ventana cuesta 43 consultas. */
  enabled: boolean
  /** `YYYY-MM-DD` de hoy. */
  today: string
  /** Minutos desde medianoche, o `null`. */
  nowMinutes: number | null
  /** A qué hora empieza y termina el día: lo trae quien ya lo tiene. */
  dayHours: { startTime: string; endTime: string }
}

/** Una tarjeta, con lo que se contestó si se contestó. */
export type VidaPatternView = VidaActivityPattern & {
  /** «Lo dejaste el 21 de septiembre. Vuelve el 19 de octubre…» (D1). */
  answerNote: string | null
}

/** Una sugerencia ya contestada, para «Contestadas» (criterio 99, tajada 4). */
export type VidaAnsweredSuggestion = {
  id: string
  title: string
  icon: string
  color: string | null
  /**
   * **Dónde se contestó.** La misma pregunta se puede haber contestado en «La
   * semana» (el puente de FEAT-006, que guarda el lunes) o aquí. Las dos
   * callan la sugerencia, así que **las dos tienen que verse**: una respuesta
   * que calla algo sin aparecer en ninguna lista es una respuesta invisible.
   */
  source: 'pattern' | 'bridge'
  /** `null` cuando la respuesta vino del puente, que no guarda número. */
  answer: VidaPatternAnswer | null
  /** La frase entera, con la fecha de vuelta dentro. */
  note: string
}

export type VidaPatternsResult = {
  adherence: VidaAdherence
  /** Con la pregunta ya callada cuando toca. */
  patterns: VidaPatternView[]
  /** Las que aún no llegan a cuatro apariciones: dicen cuántas llevan. */
  waiting: VidaPatternWaiting[]
  /** Las preguntas vivas, sin repetir, en el orden de las tarjetas. */
  liveSuggestions: VidaPatternSuggestion[]
  answered: VidaAnsweredSuggestion[]
  /** «3 con algo que proponer» · «nada que proponer ahora mismo». */
  patternsLabel: string
  /** Nada ha llegado todavía: esqueletos, y ninguna cifra a cero. */
  nothingYet: boolean
  isPending: boolean
  hasError: boolean
  refetch: () => void
  /** **«Dejarlo»**: guarda la respuesta con su fecha y su número (82, 83). */
  answerSuggestion: (suggestion: VidaPatternSuggestion) => void
}

export function useVidaPatterns({
  enabled,
  today,
  nowMinutes,
  dayHours,
}: UseVidaPatternsInput): VidaPatternsResult {
  const history = useVidaHistoryWindow({ enabled, today })
  // `true` a propósito: un ítem desactivado no propone nada pero **sí** enseña
  // lo que se sabe de él (criterio 85), y esta es la misma clave que ya piden
  // Plantilla, Actividades y Archivadas.
  const itemsQuery = useVidaItemsQuery(true, enabled)
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])
  // Deshabilitada (`isPending` + `idle`) **no es «cargando»**: sin sesión no va
  // a llegar nada y la sección no se puede quedar girando para siempre. Es la
  // misma lectura que hace `useVidaHistoryWindow`.
  const itemsPending = itemsQuery.isPending && itemsQuery.fetchStatus !== 'idle'

  const patternAnswers = useVidaDeviceNotesStore((state) => state.patternAnswers)
  const dismissedBridges = useVidaDeviceNotesStore((state) => state.dismissedBridges)
  const answerPatternSuggestion = useVidaDeviceNotesStore(
    (state) => state.answerPatternSuggestion,
  )

  const adherence = useMemo(
    () => buildAdherence({ days: history.days, dayHours, today, nowMinutes }),
    [history.days, dayHours, today, nowMinutes],
  )

  const derived = useMemo(
    () => buildActivityPatterns({ days: history.days, items, dayHours, today }),
    [history.days, items, dayHours, today],
  )

  // El puente de FEAT-006 guarda su «Dejarlo como está» con **el lunes en la
  // clave**. Aquí se traduce a la lista de ítems callados esta semana, que es
  // lo que la regla pura necesita para no preguntar dos veces lo mismo.
  const weekMonday = useMemo(
    () => (today ? formatDateToYmd(getMondayOfWeek(parseYmdToLocalDate(today))) : ''),
    [today],
  )
  const dismissedBridgeItemIds = useMemo(() => {
    if (!weekMonday) return []
    const prefix = vidaBridgeKey(weekMonday, '')
    return dismissedBridges
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length))
  }, [dismissedBridges, weekMonday])

  const patterns = useMemo<VidaPatternView[]>(
    () =>
      derived.patterns.map((pattern) => {
        const suggestion = pattern.suggestion
        if (!suggestion) return { ...pattern, answerNote: null }
        const answer = getPatternAnswer(patternAnswers, suggestion)
        const silenced = isSuggestionSilenced({
          suggestion,
          answer,
          today,
          dismissedBridgeItemIds,
        })
        return {
          ...pattern,
          // Callada no es escondida: la tarjeta sigue contando lo que pasa y
          // dice **cuándo vuelve la pregunta** (criterio 99). Lo que no hace
          // es volver a preguntarlo. Y da igual dónde se contestara: si fue en
          // el puente, se dice eso.
          suggestion: silenced ? null : suggestion,
          answerNote: silenced
            ? answer
              ? answerNoteFor(answer)
              : bridgeAnswerNoteFor(weekMonday)
            : null,
        }
      }),
    [derived.patterns, patternAnswers, today, dismissedBridgeItemIds, weekMonday],
  )

  const liveSuggestions = useMemo(
    () =>
      patterns
        .map((pattern) => pattern.suggestion)
        .filter((suggestion): suggestion is VidaPatternSuggestion => Boolean(suggestion)),
    [patterns],
  )

  const answered = useMemo<VidaAnsweredSuggestion[]>(
    () =>
      derived.patterns
        .map((pattern): VidaAnsweredSuggestion | null => {
          const suggestion = pattern.suggestion
          if (!suggestion) return null
          const base = {
            id: suggestion.id,
            title: pattern.title,
            icon: pattern.icon,
            color: pattern.color,
          }
          const answer = getPatternAnswer(patternAnswers, suggestion)
          if (answer) {
            return { ...base, source: 'pattern' as const, answer, note: answerNoteFor(answer) }
          }
          // **La contestada en el puente también se ve** (criterio 99): calla
          // esta misma pregunta, así que tiene que estar en la lista y decir
          // cuándo vuelve, aunque su respuesta viva en `dismissedBridges`.
          if (suggestion.kind === 'start-time' && dismissedBridgeItemIds.includes(suggestion.itemId)) {
            return {
              ...base,
              source: 'bridge' as const,
              answer: null,
              note: bridgeAnswerNoteFor(weekMonday),
            }
          }
          return null
        })
        .filter((entry): entry is VidaAnsweredSuggestion => Boolean(entry)),
    [derived.patterns, patternAnswers, dismissedBridgeItemIds, weekMonday],
  )

  const withSuggestion = liveSuggestions.length
  const patternsLabel =
    withSuggestion > 0
      ? `${withSuggestion} con algo que proponer`
      : 'nada que proponer ahora mismo'

  const answerSuggestion = useCallback(
    (suggestion: VidaPatternSuggestion) => {
      answerPatternSuggestion(suggestion.id, {
        answeredOn: today,
        offsetMinutes: suggestion.offsetMinutes,
        dayOfWeek: suggestion.dayOfWeek,
      })
    },
    [answerPatternSuggestion, today],
  )

  return {
    adherence,
    patterns,
    waiting: derived.waiting,
    liveSuggestions,
    answered,
    patternsLabel,
    nothingYet:
      (history.isPending && history.days.every((day) => day.isPending)) || itemsPending,
    isPending: history.isPending || itemsPending,
    hasError: history.hasError || itemsQuery.isError,
    refetch: () => {
      history.refetch()
      if (itemsQuery.isError) void itemsQuery.refetch()
    },
    answerSuggestion,
  }
}
