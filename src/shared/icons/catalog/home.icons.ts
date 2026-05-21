import {
  faBath,
  faBroom,
  faBus,
  faCar,
  faCartShopping,
  faHouse,
  faMotorcycle,
  faShirt,
  faSoap,
} from '@fortawesome/free-solid-svg-icons'
import type { AppIconEntry } from '@/shared/icons/types'

export const homeIcons = [
  { name: 'home', label: 'Hogar', category: 'home', icon: faHouse, keywords: ['house', 'inicio', 'casa', 'doméstico'] },
  { name: 'shirt', label: 'Ropa', category: 'home', icon: faShirt, keywords: ['lavandería', 'vestir', 'closet'] },
  { name: 'cart-shopping', label: 'Compras', category: 'home', icon: faCartShopping, keywords: ['supermercado', 'errands', 'shopping'] },
  { name: 'car', label: 'Coche', category: 'home', icon: faCar, keywords: ['conducir', 'transporte', 'viaje'] },
  { name: 'bus', label: 'Autobús', category: 'home', icon: faBus, keywords: ['transporte', 'commute', 'público'] },
  { name: 'motorcycle', label: 'Moto', category: 'home', icon: faMotorcycle, keywords: ['transporte', 'viaje'] },
  { name: 'broom', label: 'Limpieza', category: 'home', icon: faBroom, keywords: ['limpiar', 'hogar', 'chores', 'housekeeping'] },
  { name: 'soap', label: 'Higiene', category: 'home', icon: faSoap, keywords: ['lavar', 'baño', 'limpieza'] },
  { name: 'bath', label: 'Baño', category: 'home', icon: faBath, keywords: ['ducha', 'relax', 'higiene'] },
] as const satisfies readonly AppIconEntry[]
