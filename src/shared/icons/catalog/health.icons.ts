import {
  faAppleWhole,
  faBed,
  faBowlFood,
  faDroplet,
  faHeart,
  faHeartPulse,
  faMedkit,
  faMoon,
  faPills,
  faStethoscope,
  faSyringe,
  faTooth,
  faUtensils,
  faWeightScale,
} from '@fortawesome/free-solid-svg-icons'
import type { AppIconEntry } from '@/shared/icons/types'

export const healthIcons = [
  { name: 'heart', label: 'Salud', category: 'health', icon: faHeart, keywords: ['like', 'amor', 'bienestar', 'cardio'] },
  { name: 'heart-pulse', label: 'Pulso', category: 'health', icon: faHeartPulse, keywords: ['gym', 'fitness', 'cardio', 'ejercicio', 'salud'] },
  { name: 'apple-whole', label: 'Nutrición', category: 'health', icon: faAppleWhole, keywords: ['fruta', 'dieta', 'healthy', 'comida sana'] },
  { name: 'bowl-food', label: 'Comida', category: 'health', icon: faBowlFood, keywords: ['alimentación', 'meal', 'diet', 'comer'] },
  { name: 'utensils', label: 'Utensilios', category: 'health', icon: faUtensils, keywords: ['comer', 'cena', 'almuerzo', 'food'] },
  { name: 'droplet', label: 'Hidratación', category: 'health', icon: faDroplet, keywords: ['agua', 'water', 'beber'] },
  { name: 'moon', label: 'Noche', category: 'health', icon: faMoon, keywords: ['sueño', 'sleep', 'descanso', 'noche'] },
  { name: 'bed', label: 'Dormir', category: 'health', icon: faBed, keywords: ['sueño', 'sleep', 'descanso', 'siesta'] },
  { name: 'medkit', label: 'Botiquín', category: 'health', icon: faMedkit, keywords: ['medicina', 'primeros auxilios', 'salud'] },
  { name: 'stethoscope', label: 'Médico', category: 'health', icon: faStethoscope, keywords: ['doctor', 'consulta', 'salud'] },
  { name: 'weight-scale', label: 'Peso', category: 'health', icon: faWeightScale, keywords: ['báscula', 'fitness', 'control'] },
  { name: 'pills', label: 'Medicación', category: 'health', icon: faPills, keywords: ['pastillas', 'farmacia', 'tratamiento', 'medicina'] },
  { name: 'syringe', label: 'Vacuna', category: 'health', icon: faSyringe, keywords: ['inyección', 'vacuna', 'médico', 'salud'] },
  { name: 'tooth', label: 'Dental', category: 'health', icon: faTooth, keywords: ['dientes', 'dentista', 'higiene', 'salud'] },
] as const satisfies readonly AppIconEntry[]
