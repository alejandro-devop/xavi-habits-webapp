import type { HabitFormValues } from '@/features/habits/utils/habit-form.utils'

/**
 * Puntos de partida para el paso 1 del wizard. Datos puros, sin API.
 *
 * Los campos que rellenan el formulario se tipan contra `HabitFormValues`, así
 * que una plantilla no puede desincronizarse del formulario sin que falle la
 * compilación.
 *
 * Una plantilla **no trae `measureId` ni `categoryId`**: las medidas y las
 * categorías son datos de cada usuario. Trae nombres, y quien la aplica decide
 * qué hacer con ellos (ver `applyHabitTemplate`).
 */
export type HabitTemplateValues = Pick<
  HabitFormValues,
  'name' | 'habitType' | 'icon' | 'color' | 'dailyGoal' | 'timerGoal' | 'weeklyLifelines'
>

export interface HabitTemplate extends HabitTemplateValues {
  id: string
  /** La línea pequeña de la tarjeta: «15 min · diario». */
  summary: string
  /** Hueco 2 de la frase de intención, ya redactado. */
  intentionAction: string
  /** Nombre de la medida sugerida, nunca un id. */
  measureName?: string
  /** Nombre de la categoría sugerida, nunca un id. */
  categoryName?: string
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: 'meditar',
    name: 'Meditar',
    habitType: 'time',
    icon: 'spa',
    color: '#10b981',
    dailyGoal: '',
    timerGoal: '15',
    weeklyLifelines: '1',
    summary: '15 min · diario',
    intentionAction: '15 minutos de meditación',
    categoryName: 'Bienestar',
  },
  {
    id: 'beber-agua',
    name: 'Beber agua',
    habitType: 'count',
    icon: 'droplet',
    color: '#0ea5e9',
    dailyGoal: '8',
    timerGoal: '',
    weeklyLifelines: '1',
    summary: '8 vasos · con medida',
    intentionAction: 'un vaso de agua',
    measureName: 'Vasos',
    categoryName: 'Salud',
  },
  {
    id: 'leer',
    name: 'Leer',
    habitType: 'time',
    icon: 'book-open',
    color: '#8b5cf6',
    dailyGoal: '',
    timerGoal: '20',
    weeklyLifelines: '1',
    summary: '20 min · diario',
    intentionAction: '20 minutos de lectura',
    categoryName: 'Mente',
  },
  {
    id: 'caminar',
    name: 'Caminar',
    habitType: 'count',
    icon: 'walking',
    color: '#f59e0b',
    dailyGoal: '8000',
    timerGoal: '',
    weeklyLifelines: '2',
    summary: '8.000 pasos',
    intentionAction: 'un paseo',
    measureName: 'Pasos',
    categoryName: 'Salud',
  },
  {
    id: 'entrenar',
    name: 'Entrenar',
    habitType: 'time',
    icon: 'dumbbell',
    color: '#ef4444',
    dailyGoal: '',
    timerGoal: '45',
    weeklyLifelines: '2',
    summary: '45 min · con margen',
    intentionAction: '45 minutos de entrenamiento',
    categoryName: 'Salud',
  },
  {
    id: 'escribir',
    name: 'Escribir',
    habitType: 'count',
    icon: 'pen',
    color: '#6366f1',
    dailyGoal: '1',
    timerGoal: '',
    weeklyLifelines: '1',
    summary: '1 página · diario',
    intentionAction: 'una página',
    measureName: 'Páginas',
    categoryName: 'Mente',
  },
  {
    id: 'dormir-a-mi-hora',
    name: 'Dormir a mi hora',
    habitType: 'boolean',
    icon: 'moon',
    color: '#7c3aed',
    dailyGoal: '',
    timerGoal: '',
    weeklyLifelines: '1',
    summary: 'Un toque · diario',
    intentionAction: 'apagar la luz a mi hora',
    categoryName: 'Descanso',
  },
  {
    id: 'estirar',
    name: 'Estirar',
    habitType: 'time',
    icon: 'leaf',
    color: '#14b8a6',
    dailyGoal: '',
    timerGoal: '10',
    weeklyLifelines: '1',
    summary: '10 min · diario',
    intentionAction: '10 minutos de estiramientos',
    categoryName: 'Salud',
  },
]
