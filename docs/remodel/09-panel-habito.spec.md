# Spec — Fase 10: El panel del hábito

> **Estado:** lista para construir
> **Depende de:** `06-mi-persona.spec.md` (la regla de la identidad también manda aquí).
> **Render aprobado:** `docs/remodel/assets/09-panel-habito.html`
> **Pedida por el usuario el 2026-09-18:** «una vista donde se vea todo el progreso de un hábito, con métricas de subidas y bajadas […] una dashboard del hábito seleccionado donde yo pueda ver métricas, progreso y todo».

## Objetivo

Abrir un hábito deja de enseñar cuatro números sueltos y una rejilla, y pasa a
**contar cómo va**: si vas mejor o peor que antes, dónde se te cae, cuánto duran
tus rachas y —cuando el hábito tiene cantidad— cuánto haces frente a tu objetivo.
Un panel que se lee en diez segundos sin tener que interpretar gráficos.

## Las tres decisiones, cerradas

El render las dejaba abiertas. Van decididas y **no se re-litigan**:

1. **Convive, no sustituye.** El panel es una **tercera pestaña**, `Panel`, y es la
   que abre por defecto. `Esta semana` e `Historial completo` se quedan como
   están. Sustituir la pantalla de detalle obligaba a rehacer editar, archivar,
   restaurar y ocultar, que no tienen nada que ver con métricas.
2. **Rango por defecto: 90 días, recortado a la vida del hábito.** El reparo
   («un hábito nuevo lo verá casi vacío») no se arregla con 30 días, se arregla
   **recortando**: el eje empieza en `max(habit.startDate, hoy − rango)`, nunca
   antes de que el hábito existiera. Selector de `30 d · 90 d · 1 año`.
   **«Todo» no entra**: eso ya es la pestaña `Historial completo`.
3. **La ficha de recaídas se queda, pero cambia de lado.** No cuenta las veces
   que caíste: cuenta **las veces que volviste**. Es el mismo dato leído por el
   lado que predice que sigas —ver `proposito-de-habito-no-funciono`— y el panel
   sigue enseñando los bajones en la línea semanal, en el peor día de la semana
   y en los huecos entre rachas. Nadie está escondiendo el fallo; simplemente no
   se le pone un contador con nombre de reproche.

## Fuera de alcance

- **Backend.** No hay consulta por hábito y no se va a pedir una. Todo sale de
  `habitFollowUpsInDates(from, to)`, que devuelve los follow-ups de **todos** los
  hábitos y se filtra en cliente. Es lo que ya hace `HabitHistoryTab`.
- **El mapa de 90 días** del render. Lo dibuja ya `HabitContributionGrid` en la
  pestaña `Historial completo`, con la historia entera y no con 90 días. Repetirlo
  en el panel es pagar dos veces por el mismo píxel.
- **Comparar hábitos entre sí.** Este panel es de un hábito.
- **Exportar, imprimir, compartir.**
- **Tocar `Esta semana` o `Historial completo`.**

## Pantallas y rutas

| Ruta | Página | Qué cambia |
|------|--------|------------|
| `/app/habits/:id` | `src/features/habits/pages/HabitDetailPage.tsx` | Nueva pestaña `Panel`, primera y por defecto. `HabitStatsBanner` sale de la página. |

**`HabitStatsBanner` se borra** (componente y `.module.scss`). Solo se usa aquí y
la fila de fichas del panel es un superconjunto suyo: mismos números más el
movimiento. Dejarlo huérfano repetiría la deuda de `HabitPurposeCard`.

## Diseño

Referencia: `docs/remodel/assets/09-panel-habito.html`, marcos 2, 3 y 4.

### Lo que se dibuja, en orden

1. **La lectura.** Una frase arriba del todo, compuesta **con reglas, no
   inventada**: cómo vas frente al periodo anterior y cuál es tu punto flaco.
   *«Vas mejor que el mes pasado. Donde se te cae: los domingos, al 29%.»*
   Si no hay datos para sostener una mitad, esa mitad no se escribe. Si no hay
   para ninguna, no hay frase.
2. **Fila de fichas:** `Racha actual` (con récord al lado), `Cumplimiento <rango>`
   (con la diferencia en puntos frente al periodo anterior de igual longitud),
   `Días totales`, `Veces que volviste` (con «la última, hace N días»).
3. **Cumplimiento semana a semana** — línea, 2px, mint. Es la pregunta «¿cómo
   cambia?», y es donde se ven las subidas y bajadas que pidió el usuario. El
   peor punto va **anotado con su cifra**, no dejado a la vista del que mire.
4. **Dónde se te cae** — barras por día de la semana. La pregunta es «¿cuál es el
   peor?», así que el color es una **rampa de un solo tono** y el peor día se
   marca con color de estado **y su etiqueta**, nunca solo con el color.
5. **Tus rachas, una a una** — una barra por episodio de racha, los huecos son
   las roturas. El récord se distingue en violeta **y va rotulado «récord»**.
6. **Cuánto, frente a tu objetivo** — *solo* si `habitType` es `count` o `time`
   **y** hay objetivo diario (`getHabitDailyGoal(habit) > 0`).
7. **Cómo se te hizo** — dificultad media por semana, *solo* si hay alguna
   dificultad registrada en el rango. **Su propio panel**: jamás montada sobre el
   cumplimiento.

Los dos últimos **no siempre existen**. Un panel vacío con un gráfico de ceros es
peor que no tener el panel.

### Reglas de gráfico que no se rompen

- **Nunca dos ejes verticales** en el mismo gráfico.
- **Toda cifra lleva etiqueta visible.** Mint y ámbar no llegan a 3:1 sobre el
  vidrio claro: el número no puede quedar codificado solo en el color.
- **Los colores de estado** (cumplido, salvavidas, fallado) van siempre con su
  etiqueta en la leyenda.
- **Sin librería de gráficos.** SVG a mano, como el render. No se añaden
  dependencias.
- **Capa de hover:** cruceta + tooltip en la línea, tooltip por marca en las
  barras. El área sensible es mayor que la marca.
- **Cada gráfico lleva su tabla de datos** en un `<table>` oculto visualmente
  (patrón `srOnly` de `ConnectionIndicator.module.scss`), para lector de pantalla
  y para quien no distingue los tonos.
- **El texto lleva tokens de texto**, nunca el color de la serie.

### La dificultad es 0–4, no 1–5

El render dibujó un eje de 1 a 5. En el código la escala real es **0–4** con
etiquetas ya escritas en `habit-difficulty.utils.ts` (`Muy fácil` … `Extremo`).
Manda el código: eje 0–4 y esas etiquetas.

### Estados

- **Hábito sin ningún follow-up en el rango:** un único estado vacío honesto
  («todavía no hay nada que medir aquí»), no siete gráficos a cero.
- **Menos de 14 días de vida:** ni línea semanal ni frase de lectura —no hay con
  qué comparar. Las fichas sí se pintan.
- **Cargando:** `Spinner`, como hace hoy `HabitHistoryTab`.

### Lo que el panel no dice

La regla innegociable de la fase 7 también manda aquí: **el panel no habla de
identidad ni de propósito**, ni para felicitar ni para recordar. Es un panel de
números.

## Datos

- **Query:** `useHabitFollowUpsInDatesQuery(from, to)` — la que ya existe, con su
  `habitKeys.calendar(from, to)`. Cambiar el rango cambia la clave y trae otro
  tramo; TanStack Query cachea los tramos ya vistos.
- **Filtrado en cliente** por `habitId`, igual que `HabitHistoryTab`.
- **Para la diferencia frente al periodo anterior** hace falta el tramo previo de
  igual longitud: **una segunda consulta con el mismo hook** y otras fechas, no
  una consulta doblemente larga que luego se parte.
- **Mutations:** ninguna. El panel no escribe.
- **Estado local:** el rango elegido, en `useState` de la página. No se persiste.

### El cálculo va aparte del dibujo

Toda la aritmética en `src/features/habits/utils/habit-panel.utils.ts`, funciones
**puras** que reciben follow-ups y devuelven datos, con tests. Los componentes
solo pintan. Las funciones mínimas:

```ts
export function buildWeeklyCompliance(days: HabitDayEntry[]): WeeklyPoint[]
export function buildWeekdayBreakdown(days: HabitDayEntry[]): WeekdayStat[]
export function buildStreakEpisodes(days: HabitDayEntry[]): StreakEpisode[]
export function countComebacks(days: HabitDayEntry[]): { total: number; lastDaysAgo: number | null }
export function composeReading(current: RangeSummary, previous: RangeSummary | null, worst: WeekdayStat | null): string | null
```

`composeReading` devuelve `null` cuando no hay con qué componer. Esa es la regla
de «si no hay datos suficientes, no se escribe», y tiene que poder testearse sola.

## Criterios de aceptación

- [ ] `/app/habits/:id` abre en la pestaña `Panel`; `Esta semana` e `Historial completo` siguen funcionando igual
- [ ] El selector de rango ofrece 30 d, 90 d y 1 año, y por defecto está en 90 d
- [ ] Con un hábito creado hace 10 días y rango 90 d, el eje **empieza en su fecha de inicio**, no 90 días atrás
- [ ] La frase de lectura no aparece cuando no hay periodo anterior con el que comparar
- [ ] La ficha dice **«Veces que volviste»** y en ningún sitio del panel aparece la palabra «recaída»
- [ ] El peor punto de la línea semanal lleva su cifra escrita al lado
- [ ] El peor día de la semana se distingue por color **y** por etiqueta
- [ ] «Cuánto, frente a tu objetivo» **no aparece** en un hábito booleano ni en uno sin objetivo diario
- [ ] «Cómo se te hizo» **no aparece** si no hay ninguna dificultad registrada en el rango, y usa la escala 0–4
- [ ] Ningún gráfico tiene dos ejes verticales
- [ ] Cada gráfico tiene su tabla oculta con los mismos números que dibuja
- [ ] Un hábito sin follow-ups muestra un estado vacío, no gráficos a cero
- [ ] El panel no menciona propósito ni identidad
- [ ] `HabitStatsBanner` ya no existe en el repositorio
- [ ] Las funciones de `habit-panel.utils.ts` tienen tests: rango vacío, un solo día, racha en curso al final del rango, y huecos sin registro
- [ ] Funciona en tema claro y oscuro
- [ ] Funciona a ~375px de ancho — los gráficos se apilan, no se recortan
- [ ] Estados vacío, cargando y error resueltos

## Notas para el constructor

- **Imita `HabitHistoryTab`** (en `HabitDetailPage.tsx`) para traer y filtrar los
  follow-ups: ya resuelve el filtrado por hábito sobre los grupos por fecha.
  `buildFollowUpsByHabit` en `habit-stats.utils.ts` hace justo eso para varios.
- **Un día sin follow-up no es un día fallado.** Sin registro es sin registro, y
  cuenta distinto en el cumplimiento que un fallo explícito. Mirar cómo lo
  resuelve `HabitContributionGrid` antes de inventar otra convención.
- **El salvavidas cuenta como día cubierto**, no como fallo. Es la convención de
  toda la app desde la fase 2.
- Los colores de estado ya están en el sistema; no inventes tonos nuevos. Si
  añades una rampa para las barras de día de la semana, **pásala por el
  validador de paleta** antes de darla por buena.
- Componentes nuevos en `src/features/habits/components/`, no en `shared/ui`:
  son del dominio.
- No añadas dependencias.
- Al terminar, `graphify update .`
