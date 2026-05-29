import {
  faCamera,
  faClapperboard,
  faDice,
  faFilm,
  faGamepad,
  faGuitar,
  faHeadphones,
  faMasksTheater,
  faMusic,
  faPalette,
  faPizzaSlice,
  faTv,
} from '@fortawesome/free-solid-svg-icons'
import type { AppIconEntry } from '@/shared/icons/types'

export const entertainmentIcons = [
  { name: 'music', label: 'Música', category: 'entertainment', icon: faMusic, keywords: ['canción', 'audio', 'playlist'] },
  { name: 'guitar', label: 'Guitarra', category: 'entertainment', icon: faGuitar, keywords: ['instrumento', 'música', 'práctica'] },
  { name: 'headphones', label: 'Auriculares', category: 'entertainment', icon: faHeadphones, keywords: ['música', 'audio', 'escuchar'] },
  { name: 'film', label: 'Cine', category: 'entertainment', icon: faFilm, keywords: ['película', 'video', 'series'] },
  { name: 'clapperboard', label: 'Rodaje', category: 'entertainment', icon: faClapperboard, keywords: ['cine', 'video', 'contenido'] },
  { name: 'camera', label: 'Cámara', category: 'entertainment', icon: faCamera, keywords: ['foto', 'fotografía', 'creativo'] },
  { name: 'palette', label: 'Arte', category: 'entertainment', icon: faPalette, keywords: ['pintura', 'diseño', 'creatividad', 'draw'] },
  { name: 'gamepad', label: 'Gaming', category: 'entertainment', icon: faGamepad, keywords: ['juegos', 'videojuegos', 'gaming', 'play'] },
  { name: 'dice', label: 'Juego', category: 'entertainment', icon: faDice, keywords: ['azar', 'board game', 'ocio'] },
  { name: 'tv', label: 'Televisión', category: 'entertainment', icon: faTv, keywords: ['series', 'streaming', 'pantalla'] },
  { name: 'pizza-slice', label: 'Pizza', category: 'entertainment', icon: faPizzaSlice, keywords: ['comida', 'cena', 'ocio', 'restaurante'] },
  { name: 'masks-theater', label: 'Teatro', category: 'entertainment', icon: faMasksTheater, keywords: ['drama', 'actuación', 'cultura', 'show'] },
] as const satisfies readonly AppIconEntry[]
