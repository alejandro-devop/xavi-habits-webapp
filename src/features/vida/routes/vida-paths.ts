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
  /**
   * Otro día en la misma pantalla: `?d=YYYY-MM-DD` (tajada 4 de FEAT-003).
   *
   * **Un solo sitio construye esta URL.** El día visto no es un segmento de
   * ruta a propósito: así `hoy` no se duplica, `app-nav.config.ts` sigue siendo
   * la única fuente de destinos y la píldora del módulo se enciende igual.
   */
  hoyForDate: (date: string) => `/app/vida/hoy?d=${date}`,
  /**
   * La revisión de un día concreto: mismo `?d=` que Hoy (FEAT-006, criterio 2).
   *
   * **Un solo sitio construye esta URL**, igual que `hoyForDate`: la tira de
   * días de la revisión y el «Ver cómo fue el día» de Hoy salen de aquí, así
   * que `app-nav.config.ts` sigue siendo la única fuente de destinos y la
   * píldora «Revisión» se enciende igual.
   */
  revisionForDate: (date: string) => `/app/vida/revision?d=${date}`,
  /**
   * La semana de un vistazo (tajada 5). **No entra como píldora en la barra**:
   * se llega desde la tira de Hoy, y por eso `app-nav.config.ts` no la conoce.
   */
  semana: '/app/vida/semana',
  /** La semana que contiene esa fecha: mismo parámetro `?d=` que Hoy. */
  semanaForDate: (date: string) => `/app/vida/semana?d=${date}`,
} as const
