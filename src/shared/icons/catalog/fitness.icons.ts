import {
  faBicycle,
  faBolt,
  faDumbbell,
  faFire,
  faFutbol,
  faPersonRunning,
  faPersonSwimming,
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
  { name: 'person-swimming', label: 'Natación', category: 'fitness', icon: faPersonSwimming, keywords: ['nadar', 'piscina', 'swim', 'deporte'] },
  { name: 'futbol', label: 'Fútbol', category: 'fitness', icon: faFutbol, keywords: ['soccer', 'deporte', 'balón', 'equipo'] },
] as const satisfies readonly AppIconEntry[]
