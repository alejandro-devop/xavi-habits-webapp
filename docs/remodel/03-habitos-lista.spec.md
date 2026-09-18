# Spec — Fase 4: "Mis Hábitos"

> **Estado:** lista para construir
> **Depende de:** `02-habitos-mi-dia.spec.md` (el chasis del módulo y el ámbito Aura tienen que estar construidos)

## Objetivo

"Mis Hábitos" deja de ser una lista agrupada por categoría que solo dice *qué* hábitos tienes, y pasa a ser una rejilla de tarjetas de vidrio que dice *cómo vas* con cada uno: tira de los últimos días, progreso del periodo, racha, y a qué persona te acerca. Con buscador, orden y filtros, que hoy no existen.

**Referencia visual aprobada por el usuario:** `docs/remodel/assets/03-habitos-lista.html` — ábrela antes de escribir una línea.

## Fuera de alcance

- Detalle, semana, calendario, formulario de hábito, archivados, categorías, medidas y Mi Persona. Cada uno tiene su fase.
- `HabitFormModal`: se sigue abriendo igual desde el CTA y desde "Editar". Su rediseño es la Fase 6.
- Backend y capa de datos. Ni una query nueva.

## Pantallas y rutas

| Ruta | Página | Qué cambia |
|------|--------|------------|
| `/app/habits/list` | `src/features/habits/pages/HabitsListPage.tsx` | Reconstrucción completa |

## Diseño

### Rejilla plana, sin secciones

**Decisión del usuario: se quita el agrupado por categoría.** Hoy la página parte los hábitos en secciones por categoría; pasa a ser una sola rejilla `repeat(auto-fill, minmax(324px, 1fr))` ordenable. La categoría no desaparece: se convierte en filtro y en insignia dentro de la tarjeta. Esto elimina el `grouped`/`getCategoryName` del componente actual.

### Barra de herramientas

Una fila de píldoras sobre la rejilla, todo filtrado **en cliente** sobre los hábitos ya cargados, sin refetch:

| Control | Comportamiento |
|---|---|
| Buscador | Filtra por nombre y descripción, sin distinguir mayúsculas ni acentos |
| Ordenar | Racha (por defecto), Nombre, Progreso del periodo, Más reciente |
| Categoría | "Todas" + una opción por categoría de `useHabitCategoriesQuery()` |
| Propósito | "Todos" + una por propósito de `useHabitPurposesQuery()` — ver "Propósito" abajo |
| Tarjetas / Tabla | Conmutador de vista |
| ＋ Nuevo hábito | CTA píldora mint; botón flotante circular en móvil |

En móvil solo quedan visibles el buscador y el CTA flotante; orden y filtros se pliegan en un `Popover` con el icono de ajustes. Estado en `useState` local, sin URL ni Zustand.

### Tarjeta de hábito

Vidrio nivel 1, radio 24px, con un halo difuminado del color del hábito (`habit.color`) en la esquina superior derecha. Sustituye al borde izquierdo de color de hoy. Si el hábito no tiene color, no hay halo.

1. Cápsula de 44px con `AppIcon` del hábito, nombre y descripción a dos líneas con corte por elipsis, y `⋯` (`IconButton` + `Popover`) con el mismo menú de hoy: Ver detalle, Editar, Completar, Archivar. **Conserva `useConfirmDialog` en Completar y Archivar.**
2. Insignias: tipo (Mantener en mint / Evitar en violeta), frecuencia o "Con medida", racha, salvavidas disponibles, y "En pausa" si `status` no es activo. Reutiliza `HabitTypeBadge`, `HabitStatusBadge` y `HabitStreakBadge`; no los rehagas.
3. **Tira de días** (ver abajo).
4. Progreso del periodo: barra con `habit.days` sobre `habit.periodDays`, en violeta para los hábitos de evitar. Reutiliza `HabitPeriodProgress` si encaja.

### Tira de días — y la trampa que hay que evitar

Barras de los últimos días, con la misma semántica de color que Mi Día: logrado, parcial, fallado, salvavidas, sin registro.

- **Escritorio: 14 días. Móvil (<768px): 7 días.** El usuario lo pidió explícitamente: 14 no caben en 360px.
- La ventana se recorta **al pintar**, no al consultar. El rango de `useHabitFollowUpsInDatesQuery` es el mismo en las dos anchuras (14 días); en móvil se renderizan los 7 últimos. Así cambiar de tamaño no cambia ningún dato.
- La etiqueta bajo la tira dice la ventana real que se está viendo: "Últimos 14 días · 11/14" o "Últimos 7 días · 6/7". Ese contador **sí** es de la ventana visible, y por eso la etiqueta la nombra.

> **⚠️ La trampa, dicha por el usuario por experiencia propia.** En una versión anterior la racha se calculaba a partir de los días cargados en pantalla: con 7 días visibles, una racha real de 20 se mostraba como 7. **La racha no se deriva nunca de la ventana visible.** Sale siempre de `habit.streak` (y `habit.maxStreak`), que vienen de la API y no dependen de lo que se esté pintando. Lo mismo vale para el progreso del periodo: `habit.days` / `habit.periodDays`, nunca un recuento de barras. La única cifra que puede salir de la ventana es el contador de la etiqueta, y solo porque la etiqueta dice de qué ventana habla.

### Propósito — a quién te acerca este hábito

`Habit.purposeId` y el tipo `HabitPurpose` ya existen, y hoy el propósito solo se ve al crear un hábito y en "Mi Persona". Aquí sale a la superficie con el coste más bajo posible:

- Si el hábito tiene propósito, la descripción de la tarjeta se acompaña de una línea corta: **"Te acerca a: {nombre del propósito}"**, con el icono del propósito. Si no lo tiene, no se muestra nada — sin huecos ni marcadores de posición.
- El filtro "Propósito" de la barra de herramientas permite ver solo los hábitos que sirven a una identidad concreta.
- **Ni una palabra de culpa.** El propósito describe hacia dónde vas, no lo que fallaste. No se pinta en rojo, no se cruza, no aparece un "has abandonado a…" para los hábitos en pausa.

Si `useHabitPurposesQuery` resulta costosa o el hábito no trae el propósito incrustado, resuélvelo con una sola consulta de propósitos y un mapa por id en cliente — no una consulta por tarjeta.

### Vista de tabla

**El usuario la quiere para evaluarla.** Usa el `Table` de `shared/ui`; no montes una rejilla a mano. Columnas: Hábito (icono + nombre), Tipo, Frecuencia, Racha, Periodo. Ordena por la misma clave que la rejilla. En móvil la tabla va dentro de un contenedor con `overflow-x: auto`; el resto de la página no hace scroll horizontal nunca.

El conmutador guarda la preferencia en `localStorage` envuelto en `try/catch`, porque puede fallar en navegación privada, y si no hay valor arranca en Tarjetas.

### Estados

- *Cargando:* skeletons con la forma de la tarjeta, no un spinner centrado.
- *Vacío (sin hábitos):* `EmptyState` con el CTA. Se conserva el texto actual.
- *Vacío por filtro:* mensaje distinto del anterior, con acción para limpiar filtros. No confundas los dos casos.

## Datos

- **Queries:** `useHabitsQuery({ status: 'active' })`, `useHabitCategoriesQuery()`, `useHabitPurposesQuery()`, y `useHabitFollowUpsInDatesQuery(from, to)` con los últimos 14 días para las tiras.
- **Mutations:** `useCompleteHabitMutation`, `useUpdateHabitMutation` (archivar), las que ya usa `HabitCard`.
- **Query keys:** ninguna nueva.
- **Estado local:** búsqueda, orden, filtros y vista, todo con `useState` en la página.

## Criterios de aceptación

- [ ] `/app/habits/list` muestra una rejilla plana de tarjetas, sin secciones por categoría, fiel a `docs/remodel/assets/03-habitos-lista.html`
- [ ] Buscador, orden, filtro de categoría y filtro de propósito funcionan en cliente y se combinan entre sí
- [ ] **La racha mostrada sale de `habit.streak`, nunca de contar la tira visible.** Compruébalo con un hábito cuya racha supere los días de la ventana: en móvil, con 7 barras, una racha de 20 debe seguir diciendo 20
- [ ] El progreso del periodo sale de `habit.days` / `habit.periodDays`, no de la tira
- [ ] La tira muestra 14 días en escritorio y 7 a ~375px, con los mismos datos cargados en ambos casos
- [ ] La etiqueta bajo la tira nombra la ventana que se está viendo y su contador cuadra con las barras pintadas
- [ ] Los hábitos con propósito muestran "Te acerca a: …"; los que no lo tienen no muestran hueco
- [ ] Mantener y Evitar se distinguen por color, no solo por texto
- [ ] La vista de tabla usa `Table` de `shared/ui`, ordena igual que la rejilla y solo ella hace scroll horizontal en móvil
- [ ] La preferencia de vista sobrevive a recargar y no rompe con `localStorage` bloqueado
- [ ] El menú `⋯` conserva Ver detalle, Editar, Completar y Archivar, con sus diálogos de confirmación
- [ ] Vacío sin hábitos y vacío por filtro son mensajes distintos
- [ ] Funciona en tema claro y oscuro
- [ ] Funciona a ~375px de ancho
- [ ] Estados vacío, cargando y error resueltos

## Notas para el constructor

- **Empieza por la maqueta**, no por el código.
- Lee antes cómo quedó `HabitMyDayPage` tras la Fase 3: la semántica de color de los días, el `Popover` de acciones y los skeletons deben ser los mismos. Si allí nació un componente para el marcador de día, reutilízalo aquí en vez de escribir otro.
- El agrupado por categoría que hoy vive en `HabitsListPage` (el `useMemo` de `grouped` y `getCategoryName`) desaparece. El código viejo está en el tag `pre-aura` si lo necesitas.
- Los emojis de la maqueta son marcador de posición; los iconos reales vienen de `AppIcon`.
- El halo de color usa `habit.color`, que es un hex arbitrario del usuario: aplícalo con `color-mix()` o con alfa, y comprueba que un color oscuro no deja el texto ilegible en tema claro.
- El buscador normaliza acentos (`normalize('NFD')` + quitar diacríticos) — "meditacion" tiene que encontrar "Meditación".
- Al terminar, `graphify update .`
