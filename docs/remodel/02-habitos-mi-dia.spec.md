# Spec — Fase 2+3: Chasis del módulo de hábitos y pantalla "Mi Día"

> **Estado:** lista para construir
> **Depende de:** `01-login-aura.spec.md` (el ámbito `[data-ds='aura']` y el componente `AuroraCanvas` tienen que existir antes)

## Objetivo

El módulo de hábitos estrena el lenguaje Aura: chasis propio con navegación en píldoras sobre lienzo aurora, y una pantalla "Mi Día" reconstruida —anillo del día en lugar de barra apilada, tres tarjetas de métrica, filtro por categoría, filas de vidrio con la semana en curso y un panel lateral para el registro detallado.

**Referencia visual aprobada por el usuario:** `docs/remodel/assets/02-habitos-mi-dia.html` — ábrela en el navegador antes de escribir una línea. Es la fuente de verdad de layout, medidas y estados.

## Fuera de alcance

- **Las otras 8 pantallas del módulo** (Mis Hábitos, Archivados, Categorías, Medidas, Mi Persona, Detalle, Semana, Calendario, Formulario). Heredan el chasis nuevo y deben seguir funcionando y viéndose dignas, pero **no se rediseñan aquí**. Cada una tiene su fase.
- **`HabitsWidget`** (el que vive en `/app/today`). Fase 8.
- **El backend y la capa de datos.** No se toca `api/`, `graphql/`, `types/`, ni se añaden queries. Todo lo nuevo se calcula en cliente sobre lo que ya devuelve `useHabitMyDayQuery`.
- **Los tokens de `:root`.** Siguen en azul Apple; el módulo se envuelve en el ámbito `[data-ds='aura']`, igual que auth.

## Pantallas y rutas

| Ruta | Página | Qué cambia |
|------|--------|------------|
| `/app/habits/*` | `src/features/habits/components/HabitsModuleLayout` | Chasis nuevo: lienzo aurora, navegación en píldoras, ámbito Aura |
| `/app/habits` y `/app/habits/my-day` | `src/features/habits/pages/HabitMyDayPage.tsx` | Reconstrucción completa de la pantalla |

## Diseño

### Chasis del módulo (Fase 2)

`HabitsModuleLayout` pasa a: `<AuroraCanvas />` + barra pegajosa de vidrio (`position:sticky`, `backdrop-filter:blur(28px)`) con el lockup del anillo Aura a la izquierda y la navegación en píldoras. El nodo raíz lleva `data-ds="aura"`.

**Reagrupación de la navegación.** Hoy son seis enlaces planos; pasan a cuatro píldoras, porque tres de ellos son ajustes y no destinos de uso diario:

| Píldora | Ruta |
|---|---|
| Mi día | `habitsPaths.myDay` |
| Mis hábitos | `habitsPaths.list` |
| Archivados | `habitsPaths.archived` |
| Ajustes | agrupa Categorías, Medidas y Mi Persona |

"Ajustes" se resuelve con el `Popover` que ya existe en `shared/ui`, con los tres enlaces dentro. **No se crean rutas nuevas** y `habitsPaths` no cambia. La píldora "Calendario" que aparece en la maqueta **no se construye**: hoy el calendario es por hábito (`:id/calendar`), no un destino del módulo. Se decidirá en la Fase 5.

La píldora activa usa fondo sólido + `--color-primary` + resplandor mint; las inactivas, texto secundario sobre vidrio. A <768px la fila de píldoras hace scroll horizontal sin cortar la activa.

### Mi Día (Fase 3)

**Encabezado.** Cintillo `Semana 38 · 15–21 sep` en mayúsculas y `--color-primary`, título grande con la fecha en foco, y a la derecha el selector de semana como píldora de vidrio `‹ Esta semana ›`. Sustituye al `HabitWeekSelector` actual en aspecto, conservando su lógica y sus props (`weekStart`, `onWeekChange`).

**Tres tarjetas de métrica** en `grid-template-columns: 1.35fr 1fr 1fr`, que colapsa a una columna a <900px. **Todo se calcula en cliente** sobre `entries` de `useHabitMyDayQuery`; no hay datos nuevos de API:

1. **Tu día.** Anillo SVG de 104px, trazo 11px con cap redondeado y degradado mint, con el porcentaje en el centro (`Inter`, `font-variant-numeric: tabular-nums`). Al lado, cuatro contadores con punto de color: logrados, con salvavidas, fallados, pendientes. El porcentaje es `(logrados + salvavidas) / total`, la misma cuenta que hoy hace la barra apilada.
2. **Racha media.** Media de `habit.streak` de las entradas, cuántos hábitos superan los 10 días, y barra de progreso hacia `max(habit.maxStreak)` del conjunto. **No inventes una meta de 21 días**: la referencia es la mejor racha histórica real.
3. **Hábito estrella.** El de mayor `habit.streak`. Muestra nombre con su icono, `habit.days` sobre `habit.periodDays` si aplica, barra de progreso y la racha activa.

Con menos de 2 hábitos, las tarjetas 2 y 3 se ocultan (una media de un solo dato no dice nada); la tarjeta 1 se queda a ancho completo.

**Filtro por categoría.** Fila de píldoras: "Todos" + una por categoría de `useHabitCategoriesQuery()`, cada una con su contador de hábitos del día. Es filtro **de cliente** sobre `entries`, sin refetch. La activa lleva borde y sombra mint. Estado en `useState` local; no hace falta persistirlo ni llevarlo a la URL. A la derecha, el CTA píldora "＋ Nuevo hábito", que en móvil se convierte en botón flotante circular abajo a la derecha.

**Filas de hábito.** `grid-template-columns: 1fr 268px 78px 52px` sobre tira de vidrio nivel 1, radio 22px:

1. **Identidad:** cápsula de 42px con el icono del hábito (usa `AppIcon`, no emoji: los emojis de la maqueta son marcador de posición), nombre, y debajo la etiqueta de categoría en píldora + microcopy de frecuencia o medida. Si el hábito tiene salvavidas, tres puntos violeta —apagados los gastados— junto al microcopy. Esto sustituye al `HabitLifelineButton` suelto.
2. **Semana en curso:** siete marcadores de 26px. **Cambio importante: se muestra la semana, no el mes entero.** Estados: vacío, logrado (relleno mint + halo), fallado (rojo tenue), salvavidas (violeta con corazón), parcial (`conic-gradient` con el porcentaje real de `getDayRingProgress`), hoy (borde marcado), futuro (opacidad 0.4). Reutiliza `HabitDayMarker` si ya cubre los estados; si no, extiéndelo, no lo dupliques.
3. **Racha:** píldora ámbar con llama y número tabular.
4. **Control circular de 40px** a la derecha.

**Interacción — defínela así, la maqueta dice "mantén pulsado" y eso no vale (no es accesible ni funciona con teclado):**

| Gesto | Resultado |
|---|---|
| Clic en el control circular, hábito booleano | Alterna logrado ↔ vacío directamente |
| Clic en el control circular, hábito con medida | Abre el panel de registro (alternar no tiene sentido si hay que introducir una cantidad) |
| Clic en un marcador de día | Abre el panel de registro para **ese** día |
| Clic en el nombre o la cápsula | Navega al detalle del hábito |
| Botón `⋯` al final de la fila (`IconButton` + `Popover`) | Registrar, usar salvavidas, editar, archivar |

Todo alcanzable con teclado: los controles son `<button>` reales con `aria-label` que nombra hábito y día ("Marcar Meditación matutina, miércoles 17"), no `div` con `onClick`.

**Panel de registro.** El `Modal` centrado actual se sustituye por el `Drawer` de `shared/ui` anclado a la derecha (en móvil, hoja inferior), 400px, vidrio nivel 2. Contiene: fecha + hábito en la cabecera, selector segmentado Logrado / Fallado / Salvavidas, campo de cantidad si el hábito tiene medida, selector de dificultad de tres opciones, nota, y al fondo Guardar + Cancelar. Es el mismo `HabitFollowUpForm` con otro contenedor: **conserva su lógica y sus mutaciones**, no lo reescribas.

**Estados.**
- *Cargando:* skeletons con la forma de las tiras (`Skeleton` de `shared/ui`), no un spinner centrado. Las tarjetas de métrica también en skeleton.
- *Vacío:* `EmptyState` sobre tarjeta de vidrio, con el CTA "Nuevo hábito". Se conservan los dos textos actuales según `canRegister`.
- *Semana futura:* aviso en píldora ámbar bajo el título ("Semana futura — solo consulta") y todos los controles de registro `disabled`, no ocultos.
- *Filtro sin resultados:* mensaje corto con acción para volver a "Todos". Es nuevo, no lo olvides.

### Tokens

Ninguno nuevo respecto a la Fase 1. Se consumen los del ámbito `[data-ds='aura']` que ya existe. Los colores de estado de los marcadores (mint / rojo / violeta / ámbar) salen de `--color-primary`, `--color-danger`, `--aura-*` y los tokens de categoría; **nada de hex a pelo en los `.module.scss`**.

## Datos

Sin cambios de API. Se usa lo que ya hay:

- **Queries:** `useHabitMyDayQuery(focusDate)`, `useHabitFollowUpsInDatesQuery(from, to)`, `useHabitCategoriesQuery()` (nuevo consumo en esta pantalla, para las píldoras de filtro).
- **Mutations:** `useAddHabitFollowUpMutation`, `useUpdateHabitFollowUpMutation`, `useRemoveHabitFollowUpMutation`, ya usadas por `HabitFollowUpForm`.
- **Query keys:** sin claves nuevas.
- **Estado local:** `weekStart` (ya existe), `categoryFilter` y el estado del panel (`useState` en la página). Nada de Zustand.
- El rango de `useHabitFollowUpsInDatesQuery` puede acortarse de mes a semana ya que la fila solo pinta 7 días — **pero confirma primero** que nada más en la pantalla dependa del rango mensual. Si dudas, déjalo como está y anótalo.

## Criterios de aceptación

- [ ] `/app/habits` muestra el chasis nuevo: lienzo aurora, barra pegajosa de vidrio y cuatro píldoras de navegación, fiel a `docs/remodel/assets/02-habitos-mi-dia.html`
- [ ] Categorías, Medidas y Mi Persona siguen alcanzables desde la píldora "Ajustes" y sus rutas responden igual que antes
- [ ] "Mi Día" muestra el anillo del día con el porcentaje correcto y los cuatro contadores cuadrando con el total de hábitos
- [ ] Las tarjetas de Racha media y Hábito estrella salen de datos reales y se ocultan con menos de 2 hábitos
- [ ] El filtro por categoría acota la lista sin lanzar peticiones nuevas y tiene estado de "sin resultados"
- [ ] Cada fila muestra los 7 días de la semana en curso con sus estados: vacío, logrado, fallado, salvavidas, parcial, hoy y futuro
- [ ] Los salvavidas se ven como puntos en la fila y se gastan desde el panel o el menú `⋯`
- [ ] El registro detallado abre en `Drawer` lateral (hoja inferior a 375px) y guarda con las mismas mutaciones que hoy
- [ ] Todo el registro se puede completar solo con teclado, y cada control anuncia hábito y día
- [ ] Cargando muestra skeletons con forma de tira; vacío muestra `EmptyState` con CTA
- [ ] En semana futura los controles están deshabilitados, visibles y con el aviso correspondiente
- [ ] Las otras 8 pantallas del módulo siguen funcionando bajo el chasis nuevo
- [ ] Fuera de `/app/habits` y `/auth`, la app se ve exactamente igual que antes
- [ ] Funciona en tema claro y oscuro
- [ ] Funciona a ~375px de ancho
- [ ] Estados vacío, cargando y error resueltos

## Notas para el constructor

- **Empieza por la maqueta**, no por el código: `docs/remodel/assets/02-habitos-mi-dia.html`.
- **Esto no es una calca de la pantalla actual.** El usuario quiere que cambie. Si algo de la maqueta contradice a `HabitMyDayPage.tsx`, gana la maqueta — salvo en la interacción, donde manda la tabla de gestos de esta spec.
- Los emojis de la maqueta (🧘 💧 📓) son marcador de posición. Los iconos reales vienen de `AppIcon` con el icono guardado en el hábito.
- `HabitDayCard` es hoy un componente gordo que mezcla fila, marcadores y modal. Sepáralo: la fila y el panel son cosas distintas. `HabitStreakBadge`, `HabitDayMarker` y `HabitFollowUpForm` se reutilizan; `HabitLifelineButton` deja de usarse en esta pantalla, pero **no lo borres**: otras pantallas lo usan.
- El código viejo de cualquier pieza está en el tag `pre-aura` (`git show pre-aura:ruta`) si necesitas consultarlo.
- Los cálculos de métrica son derivados puros: ponlos en `src/features/habits/utils/habit-stats.utils.ts` con sus tests unitarios, no dentro del componente.
- Reutiliza `Drawer`, `Popover`, `IconButton`, `Skeleton`, `EmptyState` y `StatCard` de `shared/ui`. Si `StatCard` no admite el anillo ni la barra, compón dentro de `Card` antes de crear nada nuevo.
- La zona `/app/*` está protegida. Si no hay sesión activa en el navegador para el smoke visual, **no introduzcas credenciales**: dilo en el reporte y verifica lo que puedas.
- Al terminar, `graphify update .`
