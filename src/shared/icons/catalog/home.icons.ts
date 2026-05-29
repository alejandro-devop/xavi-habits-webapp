import {
  faBath,
  faBroom,
  faBus,
  faCar,
  faCartShopping,
  faHouse,
  faKey,
  faMotorcycle,
  faShirt,
  faSnowflake,
  faSoap,
  faTree,
  faUmbrella,
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
  { name: 'tree', label: 'Árbol', category: 'home', icon: faTree, keywords: ['jardín', 'naturaleza', 'patio', 'planta'] },
  { name: 'snowflake', label: 'Nieve', category: 'home', icon: faSnowflake, keywords: ['invierno', 'frío', 'clima'] },
  { name: 'umbrella', label: 'Paraguas', category: 'home', icon: faUmbrella, keywords: ['lluvia', 'clima', 'salir'] },
  { name: 'key', label: 'Llaves', category: 'home', icon: faKey, keywords: ['casa', 'entrada', 'cerradura', 'hogar'] },
] as const satisfies readonly AppIconEntry[]
