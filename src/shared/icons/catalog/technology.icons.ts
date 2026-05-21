import {
  faCloud,
  faDatabase,
  faLaptopCode,
  faMicrochip,
  faMobileScreen,
  faRobot,
  faServer,
  faTabletScreenButton,
  faWifi,
} from '@fortawesome/free-solid-svg-icons'
import type { AppIconEntry } from '@/shared/icons/types'

export const technologyIcons = [
  { name: 'mobile', label: 'Móvil', category: 'technology', icon: faMobileScreen, keywords: ['mobile-screen', 'phone', 'smartphone', 'app'] },
  { name: 'tablet', label: 'Tablet', category: 'technology', icon: faTabletScreenButton, keywords: ['tablet-screen-button', 'ipad', 'dispositivo'] },
  { name: 'wifi', label: 'WiFi', category: 'technology', icon: faWifi, keywords: ['internet', 'red', 'conexión'] },
  { name: 'database', label: 'Base de datos', category: 'technology', icon: faDatabase, keywords: ['sql', 'datos', 'storage'] },
  { name: 'server', label: 'Servidor', category: 'technology', icon: faServer, keywords: ['backend', 'hosting', 'infra'] },
  { name: 'cloud', label: 'Nube', category: 'technology', icon: faCloud, keywords: ['cloud', 'sync', 'backup', 'calma', 'relajación', 'mindfulness'] },
  { name: 'robot', label: 'Robot', category: 'technology', icon: faRobot, keywords: ['ia', 'ai', 'automation', 'bot'] },
  { name: 'microchip', label: 'Chip', category: 'technology', icon: faMicrochip, keywords: ['hardware', 'cpu', 'electrónica'] },
  { name: 'laptop-code', label: 'Desarrollo', category: 'technology', icon: faLaptopCode, keywords: ['coding', 'programación', 'dev', 'software'] },
] as const satisfies readonly AppIconEntry[]
