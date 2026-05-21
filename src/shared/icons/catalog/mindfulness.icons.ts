import {
  faBrain,
  faFaceSmile,
  faHandsPraying,
  faLeaf,
  faSeedling,
  faSpa,
  faSun,
} from '@fortawesome/free-solid-svg-icons'
import type { AppIconEntry } from '@/shared/icons/types'

export const mindfulnessIcons = [
  { name: 'brain', label: 'Mente', category: 'mindfulness', icon: faBrain, keywords: ['focus', 'cognición', 'meditar', 'estudio', 'mindfulness'] },
  { name: 'spa', label: 'Meditar', category: 'mindfulness', icon: faSpa, keywords: ['relax', 'wellness', 'calma', 'yoga'] },
  { name: 'seedling', label: 'Crecimiento', category: 'mindfulness', icon: faSeedling, keywords: ['naturaleza', 'hábito', 'planta', 'mindfulness'] },
  { name: 'leaf', label: 'Naturaleza', category: 'mindfulness', icon: faLeaf, keywords: ['eco', 'verde', 'aire libre'] },
  { name: 'sun', label: 'Sol', category: 'mindfulness', icon: faSun, keywords: ['mañana', 'energía', 'luz', 'despertar'] },
  { name: 'face-smile', label: 'Ánimo', category: 'mindfulness', icon: faFaceSmile, keywords: ['felicidad', 'positivo', 'humor'] },
  { name: 'hands-praying', label: 'Gratitud', category: 'mindfulness', icon: faHandsPraying, keywords: ['oración', 'mindfulness', 'spiritual'] },
] as const satisfies readonly AppIconEntry[]
