import {
  faAtom,
  faBook,
  faBookOpen,
  faCalculator,
  faChalkboard,
  faFlask,
  faGlobe,
  faGraduationCap,
  faLanguage,
  faLightbulb,
  faMicroscope,
  faPuzzlePiece,
  faSchool,
} from '@fortawesome/free-solid-svg-icons'
import type { AppIconEntry } from '@/shared/icons/types'

export const studyIcons = [
  { name: 'book', label: 'Libro', category: 'study', icon: faBook, keywords: ['curso', 'leer', 'lectura', 'reading'] },
  { name: 'book-open', label: 'Lectura', category: 'study', icon: faBookOpen, keywords: ['leer', 'estudio', 'reading', 'aprendizaje'] },
  { name: 'graduation-cap', label: 'Formación', category: 'study', icon: faGraduationCap, keywords: ['curso', 'estudio', 'universidad', 'degree'] },
  { name: 'school', label: 'Escuela', category: 'study', icon: faSchool, keywords: ['clase', 'academia', 'education'] },
  { name: 'chalkboard', label: 'Pizarra', category: 'study', icon: faChalkboard, keywords: ['clase', 'profesor', 'lesson'] },
  { name: 'flask', label: 'Ciencia', category: 'study', icon: faFlask, keywords: ['laboratorio', 'química', 'experimento'] },
  { name: 'microscope', label: 'Microscopio', category: 'study', icon: faMicroscope, keywords: ['biología', 'investigación', 'lab'] },
  { name: 'calculator', label: 'Calculadora', category: 'study', icon: faCalculator, keywords: ['matemáticas', 'números', 'math'] },
  { name: 'language', label: 'Idiomas', category: 'study', icon: faLanguage, keywords: ['inglés', 'traducción', 'learn language'] },
  { name: 'globe', label: 'Mundo', category: 'study', icon: faGlobe, keywords: ['geografía', 'cultura', 'internacional'] },
  { name: 'lightbulb', label: 'Idea', category: 'study', icon: faLightbulb, keywords: ['aprendizaje', 'insight', 'creatividad'] },
  { name: 'atom', label: 'Física', category: 'study', icon: faAtom, keywords: ['ciencia', 'partículas', 'stem'] },
  { name: 'puzzle-piece', label: 'Puzzle', category: 'study', icon: faPuzzlePiece, keywords: ['lógica', 'problema', 'brain teaser'] },
] as const satisfies readonly AppIconEntry[]
