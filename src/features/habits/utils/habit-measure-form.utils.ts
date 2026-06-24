import type {
  HabitMeasureEditInput,
  HabitMeasureFormValues,
  HabitMeasureInput,
} from '@/features/habits/types/habit-measure.types'
import type { HabitMeasure } from '@/features/habits/types/habit.types'

export function defaultMeasureFormValues(): HabitMeasureFormValues {
  return {
    name: '',
    abbreviation: '',
    type: '',
  }
}

export function measureToFormValues(measure: HabitMeasure): HabitMeasureFormValues {
  return {
    name: measure.name,
    abbreviation: measure.abbreviation ?? '',
    type: measure.type ?? '',
  }
}

export function validateMeasureForm(values: HabitMeasureFormValues): string | null {
  if (!values.name.trim()) {
    return 'El nombre es obligatorio.'
  }
  return null
}

export function buildMeasureCreatePayload(values: HabitMeasureFormValues): HabitMeasureInput {
  return {
    name: values.name.trim(),
    abbreviation: values.abbreviation.trim() || null,
    type: values.type.trim() || null,
  }
}

export function buildMeasureEditPayload(
  values: HabitMeasureFormValues,
  measure: HabitMeasure,
): HabitMeasureEditInput {
  return {
    id: measure.id,
    ...buildMeasureCreatePayload(values),
  }
}

export function formatMeasureLabel(measure: HabitMeasure): string {
  const abbr = measure.abbreviation?.trim()
  return abbr ? `${measure.name} (${abbr})` : measure.name
}

export function formatMeasureDisplay(
  measure: HabitMeasure | null | undefined,
  fallback = 'veces',
): string {
  if (!measure) return fallback
  return measure.abbreviation?.trim() || measure.name
}
