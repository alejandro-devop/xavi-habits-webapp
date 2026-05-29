import {
  faBarsProgress,
  faBookmark,
  faBullseye,
  faCalendar,
  faCalendarDays,
  faClipboard,
  faClock,
  faFlag,
  faHourglass,
  faListCheck,
  faStopwatch,
  faTag,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons'
import type { AppIconEntry } from '@/shared/icons/types'

export const productivityIcons = [
  { name: 'calendar', label: 'Calendario', category: 'productivity', icon: faCalendar, keywords: ['fecha', 'evento', 'agenda'] },
  { name: 'calendar-days', label: 'Calendario días', category: 'productivity', icon: faCalendarDays, keywords: ['semana', 'planificación', 'schedule'] },
  { name: 'clock', label: 'Reloj', category: 'productivity', icon: faClock, keywords: ['tiempo', 'hora', 'duración'] },
  { name: 'stopwatch', label: 'Cronómetro', category: 'productivity', icon: faStopwatch, keywords: ['timer', 'intervalo', 'tiempo'] },
  { name: 'hourglass', label: 'Reloj de arena', category: 'productivity', icon: faHourglass, keywords: ['espera', 'deadline', 'plazo'] },
  { name: 'list-check', label: 'Lista de tareas', category: 'productivity', icon: faListCheck, keywords: ['tareas', 'habits', 'checklist', 'hábitos'] },
  { name: 'clipboard', label: 'Portapapeles', category: 'productivity', icon: faClipboard, keywords: ['notas', 'copiar', 'lista'] },
  { name: 'bars-progress', label: 'Progreso', category: 'productivity', icon: faBarsProgress, keywords: ['avance', 'proyecto', 'status'] },
  { name: 'bookmark', label: 'Marcador', category: 'productivity', icon: faBookmark, keywords: ['guardar', 'referencia', 'favorito'] },
  { name: 'target', label: 'Objetivo', category: 'productivity', icon: faBullseye, keywords: ['bullseye', 'meta', 'objetivo', 'focus'] },
  { name: 'trophy', label: 'Logro', category: 'productivity', icon: faTrophy, keywords: ['premio', 'recompensa', 'hito'] },
  { name: 'flag', label: 'Meta', category: 'productivity', icon: faFlag, keywords: ['objetivo', 'hito', 'prioridad', 'marcador'] },
  { name: 'tag', label: 'Etiqueta', category: 'productivity', icon: faTag, keywords: ['tags', 'categoría', 'clasificar', 'label'] },
] as const satisfies readonly AppIconEntry[]
