import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faBook,
  faBrain,
  faBullseye,
  faCalendar,
  faChartLine,
  faCheck,
  faClock,
  faDumbbell,
  faEnvelope,
  faEye,
  faEyeSlash,
  faFilter,
  faFire,
  faGear,
  faGraduationCap,
  faHeart,
  faHouse,
  faListCheck,
  faLock,
  faMagnifyingGlass,
  faPenToSquare,
  faPersonRunning,
  faPiggyBank,
  faPlay,
  faPlus,
  faStar,
  faTrash,
  faTrophy,
  faUser,
  faWallet,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

/** Stored icon names — never `fa-*` or camelCase FA exports. */
export type AppIconName =
  | 'home'
  | 'bell'
  | 'calendar'
  | 'check'
  | 'xmark'
  | 'plus'
  | 'play'
  | 'trash'
  | 'edit'
  | 'user'
  | 'lock'
  | 'envelope'
  | 'eye'
  | 'eye-slash'
  | 'chart-line'
  | 'fire'
  | 'book'
  | 'clock'
  | 'list-check'
  | 'heart'
  | 'star'
  | 'wallet'
  | 'piggy-bank'
  | 'graduation-cap'
  | 'running'
  | 'dumbbell'
  | 'brain'
  | 'target'
  | 'trophy'
  | 'gear'
  | 'search'
  | 'filter'

export type AppIconEntry = {
  name: AppIconName
  label: string
  icon: IconDefinition
  keywords: string[]
}

export const appIcons: AppIconEntry[] = [
  { name: 'home', label: 'Inicio', icon: faHouse, keywords: ['house', 'inicio', 'casa'] },
  { name: 'bell', label: 'Campana', icon: faBell, keywords: ['notificación', 'alerta'] },
  { name: 'calendar', label: 'Calendario', icon: faCalendar, keywords: ['fecha', 'evento'] },
  { name: 'check', label: 'Check', icon: faCheck, keywords: ['ok', 'hecho', 'completado'] },
  { name: 'xmark', label: 'Cerrar', icon: faXmark, keywords: ['close', 'cancelar'] },
  { name: 'plus', label: 'Añadir', icon: faPlus, keywords: ['nuevo', 'crear'] },
  { name: 'play', label: 'Iniciar', icon: faPlay, keywords: ['reproducir', 'start', 'comenzar'] },
  { name: 'trash', label: 'Eliminar', icon: faTrash, keywords: ['borrar', 'delete'] },
  {
    name: 'edit',
    label: 'Editar',
    icon: faPenToSquare,
    keywords: ['pen', 'modificar', 'lapiz'],
  },
  { name: 'user', label: 'Usuario', icon: faUser, keywords: ['perfil', 'cuenta'] },
  { name: 'lock', label: 'Bloqueo', icon: faLock, keywords: ['seguridad', 'password'] },
  { name: 'envelope', label: 'Correo', icon: faEnvelope, keywords: ['email', 'mail'] },
  { name: 'eye', label: 'Ver', icon: faEye, keywords: ['visible', 'mostrar'] },
  { name: 'eye-slash', label: 'Ocultar', icon: faEyeSlash, keywords: ['hidden', 'password'] },
  { name: 'chart-line', label: 'Gráfica', icon: faChartLine, keywords: ['stats', 'métricas'] },
  { name: 'fire', label: 'Racha', icon: faFire, keywords: ['streak', 'motivación'] },
  { name: 'book', label: 'Libro', icon: faBook, keywords: ['curso', 'leer'] },
  { name: 'clock', label: 'Reloj', icon: faClock, keywords: ['tiempo', 'hora'] },
  { name: 'list-check', label: 'Lista', icon: faListCheck, keywords: ['tareas', 'habits'] },
  { name: 'heart', label: 'Favorito', icon: faHeart, keywords: ['like', 'amor'] },
  { name: 'star', label: 'Estrella', icon: faStar, keywords: ['rating', 'destacado'] },
  { name: 'wallet', label: 'Cartera', icon: faWallet, keywords: ['dinero', 'finanzas'] },
  { name: 'piggy-bank', label: 'Ahorro', icon: faPiggyBank, keywords: ['ahorro', 'meta'] },
  {
    name: 'graduation-cap',
    label: 'Formación',
    icon: faGraduationCap,
    keywords: ['curso', 'estudio'],
  },
  {
    name: 'running',
    label: 'Correr',
    icon: faPersonRunning,
    keywords: ['person-running', 'ejercicio', 'deporte'],
  },
  { name: 'dumbbell', label: 'Pesas', icon: faDumbbell, keywords: ['gym', 'fuerza'] },
  { name: 'brain', label: 'Mente', icon: faBrain, keywords: ['focus', 'cognición'] },
  {
    name: 'target',
    label: 'Objetivo',
    icon: faBullseye,
    keywords: ['bullseye', 'meta', 'objetivo'],
  },
  { name: 'trophy', label: 'Trofeo', icon: faTrophy, keywords: ['logro', 'premio'] },
  { name: 'gear', label: 'Ajustes', icon: faGear, keywords: ['settings', 'config'] },
  {
    name: 'search',
    label: 'Buscar',
    icon: faMagnifyingGlass,
    keywords: ['magnifying-glass', 'lupa'],
  },
  { name: 'filter', label: 'Filtrar', icon: faFilter, keywords: ['filtro', 'ordenar'] },
]

export const appIconMap = new Map<AppIconName, IconDefinition>(
  appIcons.map((entry) => [entry.name, entry.icon]),
)

/** Maps FA icon names / aliases to stored app names. */
export const iconNameAliases: Record<string, AppIconName> = {
  house: 'home',
  'pen-to-square': 'edit',
  'magnifying-glass': 'search',
  'person-running': 'running',
  bullseye: 'target',
}
