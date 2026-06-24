export interface HabitMeasureInput {
  name: string
  abbreviation?: string | null
  type?: string | null
}

export interface HabitMeasureEditInput extends HabitMeasureInput {
  id: string
}

export interface HabitMeasureFormValues {
  name: string
  abbreviation: string
  type: string
}
