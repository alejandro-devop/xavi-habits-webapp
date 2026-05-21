import {
  faBicycle,
  faBolt,
  faDumbbell,
  faFire,
  faPersonRunning,
  faPersonWalking,
} from '@fortawesome/free-solid-svg-icons'
import type { AppIconEntry } from '@/shared/icons/types'

export const fitnessIcons = [
  { name: 'dumbbell', label: 'Pesas', category: 'fitness', icon: faDumbbell, keywords: ['gym', 'fitness', 'exercise', 'workout', 'pesas', 'ejercicio', 'fuerza'] },
  { name: 'running', label: 'Correr', category: 'fitness', icon: faPersonRunning, keywords: ['person-running', 'ejercicio', 'deporte', 'cardio', 'run', 'gym'] },
  { name: 'walking', label: 'Caminar', category: 'fitness', icon: faPersonWalking, keywords: ['person-walking', 'paseo', 'steps', 'pasos'] },
  { name: 'bicycle', label: 'Bicicleta', category: 'fitness', icon: faBicycle, keywords: ['ciclismo', 'bike', 'cardio'] },
  { name: 'fire', label: 'Racha', category: 'fitness', icon: faFire, keywords: ['streak', 'motivación', 'calorías', 'intenso'] },
  { name: 'bolt', label: 'Energía', category: 'fitness', icon: faBolt, keywords: ['rápido', 'power', 'hiit', 'intensidad'] },
] as const satisfies readonly AppIconEntry[]
