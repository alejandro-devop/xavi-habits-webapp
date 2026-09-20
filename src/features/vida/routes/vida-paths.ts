export const vidaPaths = {
  root: '/app/vida',
  hoy: '/app/vida/hoy',
  plantilla: '/app/vida/plantilla',
  revision: '/app/vida/revision',
  actividades: '/app/vida/actividades',
  /** Las archivadas cuelgan del catálogo: es el mismo listado con otro filtro. */
  archivadas: '/app/vida/actividades/archivadas',
  /** Categorías es hermana del catálogo, no su hija: se gestiona sola. */
  categorias: '/app/vida/categorias',
  /** El horario del día: en el popover «Ajustes» del módulo, como en hábitos. */
  ajustes: '/app/vida/ajustes',
} as const
