---
id: FEAT-002
title: El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días
status: planned
architect: yes    # primera pantalla real de Vida, datos de arranque nuevos y dos selectores que hoy viven en hábitos
area: features/vida
requested: 2026-09-19
updated: 2026-09-19
---

# FEAT-002 — El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días

## 1. The request — feature-analyst

**Summary for whoever's next:** F1 del plan de Vida: `/app/vida/actividades` deja
de ser un cascarón y pasa a ser el catálogo de las cosas que uno hace en un día
— agrupado por categoría, con los días en que cada una está en la plantilla, y
una hoja para crear y editar con solo dos campos obligatorios. La primera tajada
es el **primer minuto**: sin nada creado, una lista de puntos de partida que en
un toque crea seis actividades con sus categorías, y el catálogo agrupado para
verlas.

**What problem it solves:** para planear un día hace falta tener nombradas las
cosas que uno hace en un día, y hoy el usuario no tiene dónde ponerlas: el
módulo Vida existe (F0) pero todas sus pantallas están vacías. El problema no es
«falta un CRUD de actividades»: es que **el primer minuto de uso no puede acabar
en una pantalla en blanco con un formulario**, porque entonces nadie llega a
planear nada. De ahí que los puntos de partida sean la tajada 1 y no un extra.

**Who it's for:** el usuario del módulo Vida, en dos momentos muy distintos: (a)
el día que entra por primera vez y no tiene nada, y (b) cada pocas semanas,
cuando cambia algo de su rutina y vuelve a ajustar el catálogo. Entre esos dos
momentos casi no se entra aquí: las pantallas del día a día son Hoy (F2/F3).

**User's words:**

> «Vamos con F1, agrupado por categoría»

Y el pedido original del módulo, del 2026-09-18, que enmarca esto:

> «Como siempre me soñé el módulo de actividades y follow-ups: es más como una
> plantilla de mi vida, donde planeo día a día lo que voy a hacer y puedo seguir
> la plantilla o registrar lo que se sale, y al final del día evaluar cómo me
> va. Con el tiempo el sistema entiende y me ayuda mejor a planear.»

El render aprobado es `docs/vida/assets/05-vida-catalogo.html` (tres pantallas y
cuatro notas al pie; las notas son parte de la spec). Se abre en
`http://localhost:5173/docs/vida/assets/05-vida-catalogo.html`.

**Out of scope:** (lo que alguien podría dar por incluido y NO lo está)

- **Campos del API que existen y no se enseñan:** `status`, `priority`,
  `scheduledDate`, `completedAt`, subtareas (`ActivitySubtask`), `todoFolders`,
  enlaces a tareas y todo lo de entrenamiento. Es la vida, no un gestor de
  proyectos. Tampoco aparece su vocabulario: ni «pendiente», ni «prioridad», ni
  «vencida».
- **La plantilla Vida completa es F4.** Aquí solo se crea/actualiza el
  `VidaItem` de una actividad desde su hoja (interruptor + días). La vista de
  semana tipo, las notas del ítem, el orden y la gestión general de la plantilla
  no entran.
- **Hoy, el plan del día y las sesiones son F2/F3.** Desde el catálogo no se
  empieza nada, no se cronometra nada y no se registra tiempo.
- **«Cuánto suele llevar» no existe en F1** (decisión D2, resuelta). Ni en la
  tarjeta ni en la hoja: el API no tiene dónde guardar una duración estimada
  (`spentTimeMinutes` es tiempo **registrado**). La duración típica la derivará
  **F6** de los registros; si algún día se quiere poder editar a mano, eso es
  **cambio de backend** y su propia conversación.
- **«2 veces al día»** (una tarjeta del render lo dice) tampoco existe: el API
  no modela repeticiones por día. No se inventa.
- **Borrar de verdad.** `activityRemove` **no se usa en F1**: nada se borra del
  todo. Archivar es reversible (D1, resuelta). Tampoco hay papelera.
- **Borrar categorías.** Se crean y se editan; borrar deja actividades
  huérfanas y se decide cuando duela.
- **Reordenar** actividades o categorías (arrastrar, `orderIndex`), duplicar,
  importar/exportar, acciones en lote más allá del botón de los puntos de
  partida, y multi-selección en el catálogo.
- **Paginación visible.** `activities` es paginado en el API; el catálogo trae
  un lote y no enseña controles de página. Si hubiera más de lo que trae, lo
  dice en una línea en vez de mentir con el total.
- **Cambios de backend.** Ninguno. Lo que no dé el API, se anota como hueco.

**Acceptance criteria:**

*El catálogo agrupado (tajada 1)*

- [ ] 1. Con actividades creadas, `/app/vida/actividades` las muestra
  **agrupadas por categoría**: una cabecera por grupo con el color de la
  categoría, su nombre y cuántas actividades tiene; dentro, una tarjeta por
  actividad con el icono de la categoría, su color de fondo y el nombre.
- [ ] 2. Una actividad sin categoría (`categoryId` nulo) aparece en un grupo
  **«Sin categoría»** al final, con un icono neutro. No desaparece del catálogo.
- [ ] 3. Cada tarjeta muestra **siete casillas L M X J V S D** con marcadas las
  del `VidaItem` activo de esa actividad; si no hay `VidaItem` activo, en su
  lugar se lee **«sin plantilla»** y no se pinta ninguna casilla.
- [ ] 4. La línea bajo el título dice **«N actividades · M categorías»** y los
  números coinciden con lo que se ve en pantalla.
- [ ] 5. El buscador filtra **en cliente** por nombre, sin distinguir mayúsculas
  ni tildes («banar» encuentra «Bañarme»); los grupos que se quedan sin
  resultados no se pintan; si no queda ninguno se ve «Sin resultados para
  “<texto>”» con una forma visible de limpiar la búsqueda.

*El primer minuto — puntos de partida (tajada 1)*

- [ ] 6. Con **cero** actividades no se ve ni lista vacía ni formulario: se ven
  los **puntos de partida**, al menos las 13 del render (bañarme, lavarme los
  dientes, pasear a las mascotas, organizar la casa, desayunar con calma,
  cocinar, poner una lavadora, leer un rato, descansar, compra de la semana,
  llamar a alguien, salir a caminar, dormir la siesta), cada una con su icono y
  su **categoría ya puesta**.
- [ ] 7. Marcando 6 y pulsando el botón —que dice cuántas son: **«Crear las
  6»**— al terminar hay exactamente 6 actividades en el catálogo, cada una con
  su categoría asignada.
- [ ] 8. Las categorías sugeridas que **no existían se crean** con nombre, icono
  y color; las que ya existían **con ese nombre** (ignorando mayúsculas y
  tildes) **se reutilizan y no se duplican**.
- [ ] 9. Sin ninguna marcada, el botón está deshabilitado y no crea nada.
- [ ] 10. Mientras crea, el botón queda en espera y **no admite un segundo
  toque**: una doble pulsación no crea nada por duplicado.
- [ ] 11. Si una creación falla a mitad, se ve un **error visible** que nombra
  qué falló, lo ya creado **sigue creado**, y el catálogo muestra exactamente lo
  que se creó (no se anuncia «6 creadas» si fueron 4).

*Crear y editar — la hoja (tajada 2)*

- [ ] 12. La hoja de crear pide **nombre y categoría**, nada más obligatorio.
  Con el nombre vacío (o solo espacios) o sin categoría, el botón de crear **no
  envía** y se señala el campo que falta.
- [ ] 13. Al crear, la hoja se cierra y la actividad aparece en su grupo **sin
  recargar la página**.
- [ ] 14. **«+ nueva»** abre, dentro de la misma hoja, nombre + icono
  (`IconPickerLazy`) + color (`HabitColorPicker`); al confirmar, la categoría
  queda creada **y seleccionada**, y el nombre que ya se había escrito **no se
  pierde**.
- [ ] 15. El menú **«···»** de una tarjeta abre **editar** en la misma hoja con
  nombre y categoría ya puestos; al guardar, la tarjeta refleja el cambio y, si
  cambió la categoría, **cambia de grupo**.
- [ ] 16. Si **cualquier** mutación falla (crear actividad, editar, crear
  categoría, guardar plantilla), se ve un mensaje de error visible y la hoja
  **no se cierra ni pierde lo escrito**. (Hoy ningún hook de Vida tiene
  `onError`: esto es exactamente lo que los tres revisores de F0 dejaron
  anotado.)

*La plantilla desde la hoja (tajada 3)*

- [ ] 17. Con «ponerla en mi plantilla» encendido y al menos un día marcado, al
  guardar existe un `VidaItem` con esos días y la tarjeta del catálogo muestra
  esas casillas.
- [ ] 18. Encendido y **sin ningún día** marcado, el guardado no procede y se
  señala qué falta.
- [ ] 19. Editando una actividad que **ya** está en la plantilla, los días vienen
  marcados; cambiarlos **actualiza el mismo `VidaItem`**, no crea otro.
- [ ] 20. Apagando el interruptor, la tarjeta pasa a «sin plantilla» y **no se
  pierde** la nota del `VidaItem` (se desactiva, no se borra).

*Archivar, restaurar y categorías (tajada 4)*

- [ ] 21. **«Archivar»** desde el «···» pide confirmación, dice en una línea que
  se puede restaurar y que lo registrado se conserva, y al confirmar la
  actividad desaparece del catálogo sin recargar. La mutación es `activityEdit`
  con `status: 'cancelled'`; **nunca** se llama a `activityRemove`.
- [ ] 22. Al archivar, si la actividad tenía un `VidaItem`, éste queda
  **desactivado** (`isActive: false`), **no borrado**: sus días y su nota siguen
  ahí.
- [ ] 23. Las actividades archivadas **no aparecen** en el catálogo, ni en los
  puntos de partida, ni en las sugerencias de plantilla. Tampoco cuentan en el
  «N actividades · M categorías» del criterio 4.
- [ ] 24. Un acceso discreto **«ver archivadas»** en el catálogo lleva al mismo
  listado filtrado por `status: cancelled`; desde ahí **«Restaurar»** hace
  `activityEdit` a `status: 'pending'` y **reactiva** el `VidaItem` que se
  desactivó (`isActive: true`), con sus días intactos. La actividad vuelve a su
  grupo del catálogo.
- [ ] 25. En toda la interfaz las palabras son **«Archivar»** y **«Restaurar»**.
  En ningún sitio se lee «cancelar», «cancelada» ni «eliminar» refiriéndose a
  esto (el `cancelled` del API no asoma nunca a la pantalla).
- [ ] 26. El estado vacío de archivadas existe: sin ninguna, se lee algo como
  «No has archivado nada» y hay vuelta al catálogo.
- [ ] 27. «Categorías ›» lleva a gestionar categorías: se ven todas con su
  icono, su color, su nombre y cuántas actividades tiene cada una; se edita
  nombre, icono y color, y el cambio se ve en el catálogo al volver.

*Estados — los que esta vez sí existen*

- [ ] 28. **Cargando:** mientras las consultas están en vuelo se ve un esqueleto
  o indicador; **nunca** se enseña el estado de «no tienes nada» ni los puntos
  de partida mientras aún se está cargando.
- [ ] 29. **Sin sesión:** con la consulta deshabilitada por `useVidaQueryGuard`
  (queda en `isPending` con `fetchStatus: 'idle'`), la pantalla **no pinta un
  spinner eterno**: muestra un mensaje breve con la vía para entrar.
  Comprobable en test con un `QueryClient` y el guard en `false`.
- [ ] 30. **Error de carga:** mensaje en lenguaje humano y un botón que vuelve a
  pedir los datos; al reintentar con éxito, la pantalla se pinta.
- [ ] 31. **Móvil a 375 px:** no hay scroll horizontal en ninguna de las tres
  pantallas, y el menú «···» queda visible dentro de la tarjeta.
- [ ] 32. **Texto largo:** un nombre de ~60 caracteres y un nombre de categoría
  de ~40 no rompen la tarjeta, no empujan el «···» fuera y no producen scroll
  horizontal (se envuelven o se recortan con elipsis).
- [ ] 33. **Tema oscuro:** cabeceras de grupo, tarjetas, hoja y el color de
  categoría mantienen contraste legible; nada de texto oscuro sobre fondo
  oscuro.
- [ ] 34. **Lenguaje:** ninguna palabra de culpa ni de gestión de proyectos en
  toda la pantalla (regla de producto de Vida y de hábitos).
- [ ] 35. **Línea base no empeorada** (`docs/features/ENVIRONMENT.md`):
  `pnpm typecheck` limpio, `pnpm lint` no peor que 14 errores / 0 warnings,
  `pnpm test` sin fallos nuevos sobre los 2 preexistentes, y el **chunk inicial
  no crece** por iconos: nada importa a pelo del barril de
  `@fortawesome/free-solid-svg-icons`.
- [ ] 36. **Solo el usuario puede cerrarlo** (está detrás del login, y los
  agentes no entran con credenciales): el recorrido real entero —primer minuto →
  catálogo agrupado → crear con categoría nueva → ponerla en la plantilla →
  editar → archivar y restaurar— con su cuenta. Los agentes verifican con tests y arneses; esto queda
  dicho, no disimulado.

**Slices:**

| # | What it does | State |
|---|---|---|
| 1 | **El primer minuto y el catálogo.** Sin nada creado, los puntos de partida: se marcan varias y un botón las crea todas con sus categorías (creando las que falten). Con actividades, el catálogo agrupado por categoría, con los días de la plantilla, el buscador y los estados (cargando, sin sesión, error, vacío, 375 px, oscuro). Solo lectura: aún no hay hoja. | pending |
| 2 | **Crear y editar desde la hoja.** El `+` y el «···» → editar abren la hoja con nombre y categoría (píldoras), con «+ nueva» categoría (icono + color) dentro de la misma hoja. Errores de mutación visibles. Sin duración: la hoja tiene nombre y categoría, nada más (D2). | pending |
| 3 | **Ponerla en mi plantilla.** El interruptor y los siete días en la hoja: crea, actualiza y desactiva el `VidaItem`, y las casillas de la tarjeta lo reflejan. | pending |
| 4 | **Archivar, restaurar y gestionar categorías.** El «···» → «Archivar» (`status: 'cancelled'` + `VidaItem` desactivado), «ver archivadas» con «Restaurar», y la pantalla/hoja de categorías: listar, editar nombre, icono y color. | pending |

Cada tajada se puede revisar sola: la 1 ya es útil (un catálogo poblado en un
minuto), la 2 añade el control fino, la 3 conecta con la plantilla, la 4 limpia.

**Architect? yes** porque es la **primera pantalla real** del módulo Vida — no
hay ninguna hermana en `features/vida` que imitar—, introduce **datos de
arranque nuevos** (los puntos de partida, análogos pero no iguales a
`src/features/habits/data/habit-templates.ts`), una **hoja que crea entidades
de otro tipo desde dentro** (categoría desde la hoja de actividad) y obliga a
decidir dónde vive `HabitColorPicker`
(`src/features/habits/components/HabitColorPicker/`), que hoy está en hábitos y
lo va a usar Vida. Además hay que cruzar dos consultas (actividades ×
`VidaItem`) para pintar una tarjeta, y eso es una forma nueva en este módulo.

Lo que **ya existe y no se vuelve a construir** (la capa de datos de F0 está
probada; F1 la consume):

- `src/features/vida/hooks/useActivities.ts` — `useActivitiesQuery`,
  `useCreateActivityMutation`, `useUpdateActivityMutation`,
  `useDeleteActivityMutation`.
- `src/features/vida/hooks/useActivityCategories.ts` —
  `useActivityCategoriesQuery`, `useCreateActivityCategoryMutation`,
  `useUpdateActivityCategoryMutation`.
- `src/features/vida/hooks/useVidaItems.ts` — `useVidaItemsQuery`,
  `useCreateVidaItemMutation`, `useUpdateVidaItemMutation`.
- `src/features/vida/hooks/useVidaQueryGuard.ts`,
  `src/features/vida/utils/invalidate-vida-queries.ts`, `vidaKeys` en
  `src/shared/api/query-keys.ts`.
- `src/features/vida/utils/vida-date.utils.ts` (**falta** la conversión `Date` →
  `VidaDayOfWeek`, ya anotada por el constructor de la tajada 3 de F0).
- `src/shared/ui/IconPicker/` (`IconPickerLazy`) y
  `src/features/habits/components/HabitColorPicker/` (paleta en
  `src/features/habits/data/habit-colors.ts`).
- Referencias de patrón: `src/features/habits/pages/HabitsListPage.tsx` +
  `components/HabitListCard/` para el listado, y
  `components/HabitFormModal/HabitCreateWizard.tsx` (paso 1) para cómo se
  aplican los puntos de partida creando las categorías que falten.
- Si se añade cualquier documento GraphQL nuevo, entra en la lista de
  `src/features/vida/graphql/contracts.test.ts`.

**Hipótesis marcadas, para que el arquitecto las confirme o las tire** (no son
decisiones del usuario, son técnicas, y no las tomo yo):

- El catálogo necesita **todas** las actividades para agrupar y buscar en
  cliente, y `activities` es paginado (`{ activities, page, limit, total }`).
  Hay que fijar un `limit` y decidir qué se enseña si `total` lo supera.
- **Trampa de D1:** `ActivityFilters.status` admite **un** estado, no una
  exclusión. «Todas menos las `cancelled`» no se puede pedir en una sola
  consulta: o se filtra en cliente lo que llega (y entonces el `total` del API
  no es el de la pantalla, ojo con el criterio 4 y con la paginación), o se
  piden los estados que sí valen. «Ver archivadas» sí es una consulta directa
  con `status: 'cancelled'`.
- Los puntos de partida son datos puros, sin API, al estilo de
  `habit-templates.ts` (que trae **nombres** de categoría, nunca ids). Sitio
  probable: `src/features/vida/data/`.
- El `onError` que falta: o se añade a los hooks de `features/vida/hooks/` (y
  los arregla para todas las fases) o se pone en cada consumo de F1. La primera
  toca código de F0, ya entregado.
- Retirar/archivar y las casillas de días cruzan `activities` con `vidaItems`:
  qué se invalida al guardar está en `invalidate-vida-queries.ts` y conviene
  revisarlo antes de escribir la tajada 3.

**Decisions that aren't mine:**

**D1 — Qué hace «archivar» una actividad. RESUELTA (2026-09-19, el usuario):**
**archivar = `activityEdit` con `status: 'cancelled'`.** Es lo reversible y lo
coherente con hábitos (que ya tiene Archivados + Restaurar), y conserva los
follow-ups. Las reglas, tal como se dijeron:

- Las `cancelled` **no aparecen** en el catálogo, ni en los puntos de partida,
  ni en las sugerencias de plantilla.
- Al archivar, el `VidaItem` de esa actividad (si lo tiene) **se desactiva**
  (`isActive: false`), **no se borra**.
- El catálogo tiene un **acceso discreto «ver archivadas»**: el mismo listado
  con filtro `status: cancelled`. Desde ahí, **«Restaurar»** hace `activityEdit`
  a `status: 'pending'` y **reactiva** el `VidaItem`.
- **`activityRemove` no se usa en F1.** Nada se borra del todo.
- En la interfaz las palabras son **«Archivar»** y **«Restaurar»**, nunca
  «cancelar». El `cancelled` del API es detalle interno.

*(Contexto que llevó a la pregunta, por si alguien lo revisita: el API no tiene
archivado de actividades — `Activity` no tiene `isArchived`, y en
`src/features/vida/graphql/activities.graphql.ts` solo existen `ActivityAdd`,
`ActivityEdit`, `ActivityRemove` y `ActivityComplete`. `status` era el campo que
habíamos decidido no enseñar; se usa como mecanismo, no como vocabulario.)*

**D2 — «Cuánto suele llevar». RESUELTA (2026-09-19, el usuario): se omite en
F1.** No se inventa almacenamiento: ni `description` ni `localStorage`. La hoja
de crear/editar tiene **nombre, categoría y plantilla + días**, y nada más.

La duración típica **la derivará F6** de los registros y se enseñará entonces
(el render ya lo decía: «opcional, lo aprende solo»). Y queda anotado para quien
lo pregunte más adelante: **poder editarla a mano es un cambio de backend** —
`Activity` no tiene campo de duración estimada, `spentTimeMinutes` es tiempo
registrado— y tendrá su propia conversación.

**Lo que NO está abierto** (decidido ya, no se re-litiga): agrupado por
categoría (lo dijo el usuario hoy); «ponerla en mi plantilla» con sus días desde
la hoja de crear; nombre y categoría como únicos obligatorios; estado,
prioridad, fecha y subtareas fuera de la vista; archivar es reversible y nada se
borra (D1); la duración típica no se pide, se aprende (D2); el módulo se llama
Vida y su día se llama «Hoy».

**Ninguna tajada queda bloqueada:** con D1 y D2 resueltas, el arquitecto puede
planificar las cuatro.

**Relación con otras features:** cuelga de **FEAT-001** (F0: rutas de
`/app/vida`, capa de datos, query keys). Y **condiciona a F4** (la plantilla
Vida): la tajada 3 escribe `VidaItem` desde aquí, así que quien construya F4 debe
leer esta tajada antes para no duplicar el flujo. F6 depende de D2.

## 2. The plan — feature-architect

**Summary for the builder:** la referencia a imitar es **`src/features/habits/pages/HabitsListPage.tsx` + `components/HabitListCard/`** (listado con cabecera, esqueleto, error con reintento, vacío y tarjetas resueltas con un mapa por id) y, para la hoja, **`components/HabitFormModal/HabitCreateWizard.tsx` + `HabitFormStepButtons.tsx` + `CreateHabitCategoryStep/`** (`SteppedModal` con `push`/`pop`: el «+ nueva categoría» es literalmente eso). El código nuevo va todo en `src/features/vida/{components,data,pages,utils}` y en `src/shared/ui/ColorPicker/`. **No se crea ni un documento GraphQL** (los cinco que hacen falta ya existen y están en `contracts.test.ts`), ni un hook de consulta, ni una `vidaKeys` nueva: la capa de datos de F0 cubre las cuatro tajadas.

---

### What already exists

**La capa de datos, entera y probada (F0). No se toca salvo lo que se dice abajo.**

| Qué | Dónde | Qué da a F1 |
|---|---|---|
| Consulta de actividades | `src/features/vida/hooks/useActivities.ts:14` (`useActivitiesQuery`) | el catálogo y las archivadas |
| Mutaciones de actividad | `useActivities.ts:34,46` (`useCreateActivityMutation`, `useUpdateActivityMutation`) | crear, editar, archivar (`status`), restaurar |
| Categorías | `src/features/vida/hooks/useActivityCategories.ts:12,32,45` | grupos, «+ nueva», pantalla de categorías |
| Plantilla | `src/features/vida/hooks/useVidaItems.ts:26,58,70` (`useVidaItemsQuery(includeInactive)`) | casillas L M X J V S D, crear/actualizar/desactivar |
| Guard de sesión | `src/features/vida/hooks/useVidaQueryGuard.ts:9` | criterio 29 |
| Invalidaciones | `src/features/vida/utils/invalidate-vida-queries.ts:41,49,77` | ya invalidan lo correcto; **no hace falta tocarlo** |
| Query keys | `src/shared/api/query-keys.ts:32-66` (`vidaKeys`) | completas |
| Documentos GraphQL | `src/features/vida/graphql/activities.graphql.ts`, `activity-categories.graphql.ts`, `vida-items.graphql.ts` | `ACTIVITIES_QUERY` ya selecciona `category { id name icon color }` (línea 42-47): el icono y el color de la tarjeta vienen en la misma consulta |
| Búsqueda en cliente | `src/features/vida/utils/activity-filters.ts:36` (`filterActivitiesBySearch`) | existe, **le faltan las tildes** (ver abajo) |

**Existe medio F1 en el módulo de hábitos**, y es lo que hay que imitar, no copiar:

- Listado agrupado con contador en la cabecera: `HabitsListPage.tsx:145-157` (la línea «N activos · M categorías» es exactamente el criterio 4), esqueleto `:159-181`, error con reintento `:183-197`, vacío `:199-213`, mapa `categoriesById` `:86-89` («ni una consulta por tarjeta»).
- Tarjeta con icono + color + menú «···»: `HabitListCard.tsx:138-173` (`Popover` + `IconButton icon="ellipsis"`), archivar con confirmación `:91-101` (`useConfirmDialog`, `updateMutation.mutate({ id, status: 'archived' })`) — el mismo gesto que pide el criterio 21.
- Puntos de partida como datos puros: `src/features/habits/data/habit-templates.ts` (la plantilla trae **`categoryName`, nunca un id**: línea 27-28) y su aplicación `src/features/habits/utils/habit-form.utils.ts:319-345` (`applyHabitTemplate`: busca la categoría por nombre en el catálogo y, si no está, deja `pendingCategoryName`). **Ese es el patrón del criterio 8.**
- «+ nueva» dentro de la misma hoja: `HabitFormStepButtons.tsx:18-42` (`NewCategoryButton` hace `push({title, content:<CreateHabitCategoryStep/>})`) + `CreateHabitCategoryStep/CreateHabitCategoryStep.tsx:16-103` (nombre + `IconPicker` + color, y al crear `onCreated(category.id)` + `pop()`). El estado del formulario de debajo **no se pierde** porque el paso se apila encima: `SteppedModal.tsx:86-118`.
- Error de mutación visible sin cerrar la hoja: `HabitCreateWizard.tsx:279-283` (`<Alert variant="danger">` cuando `createMutation.isError`) + `:291` (`mutate(payload, { onSuccess: handleClose })` — solo se cierra si salió bien). Es la respuesta al criterio 16.
- Archivadas: `src/features/habits/pages/HabitsArchivedPage.tsx` (56 líneas: consulta con filtro, vacío con vuelta, lista).
- Categorías: `src/features/habits/pages/HabitCategoriesPage.tsx` + `components/HabitCategoryForm/`.

**Lo que NO existe en ningún sitio** (buscado por nombre, por forma y por el borde):

- **Nada agrupa una lista por categoría** en este repo. `HabitsListPage` filtra por categoría, no agrupa; `countHabitsByCategory` cuenta pero no reparte. La agrupación es código nuevo.
- **Nada cruza dos consultas para pintar una tarjeta** con un mapa `activityId → VidaItem`. Lo más cercano es `buildFollowUpsByHabit` (`habits/utils/habit-stats.utils.ts`), que es la misma **forma** (lista → `Map` en la página, la tarjeta recibe lo suyo ya resuelto) y por eso se imita.
- **Nada pinta siete casillas de día de la semana.** `HabitWeekGrid`/`HabitDayMarker` pintan **fechas**, no días de la semana; no sirven.
- **`VidaDayOfWeek` no tiene ni orden ni etiquetas** en ningún archivo. Se crean.
- **Ninguna pantalla de Vida existe todavía:** las cuatro de `src/features/vida/pages/` son cascarones de un `PageHeader` (`VidaActividadesPage.tsx` son 6 líneas).
- **No hay ninguna duplicación**: `features/vida` y `features/habits` no comparten una sola línea de dominio, y el `src/features/activities/` de `79bece0` está borrado. Lo único que existe **dos veces** en el repo y roza esto es el selector de color: `HabitColorPicker` (paleta de 17) y el `<input type="color">` a pelo de `CreateHabitCategoryStep.tsx:76-91`. **Es un bug latente, no es de esta feature**: el paso de categoría de hábitos ofrece 16 millones de colores donde el resto de la app ofrece 17. Queda dicho; arreglarlo es otra tarea. (Si el constructor de la tajada 2 quiere, cambiar esa línea es de un renglón una vez movido el `ColorPicker`.)

---

### Reference implementation

**`src/features/habits/pages/HabitsListPage.tsx` + `src/features/habits/components/HabitListCard/HabitListCard.tsx`.**

No porque sea el mejor código del repo, sino porque es **el que tiene la misma figura**: una consulta paginada + un catálogo auxiliar + un cruce resuelto en un `Map` en la página + tarjetas tontas + los cuatro estados (cargando / error con reintento / vacío / lleno) + un `Popover` «···» con acciones que mutan. Está vivo (es la pantalla más usada de hábitos) y tiene test (`HabitsListPage.test.tsx`, `HabitListCard.test.tsx`) que sirve de molde.

Para la hoja, la referencia es **`HabitCreateWizard.tsx`** (no `HabitEditForm`): es la que usa `SteppedModal` con `ds="aura"` y `mobileSheet` — que es literalmente la hoja inferior del render C — y la que apila el paso de categoría nueva.

---

### Where the new code goes

```
src/features/vida/
  components/
    VidaActivityCard/            VidaActivityCard.tsx .module.scss .test.tsx index.ts     T1
    VidaCatalogGroup/            VidaCatalogGroup.tsx .module.scss index.ts               T1
    VidaStartingPoints/          VidaStartingPoints.tsx .module.scss .test.tsx index.ts   T1
    VidaActivitySheet/           VidaActivitySheet.tsx .module.scss .test.tsx index.ts    T2
    CreateVidaCategoryStep/      CreateVidaCategoryStep.tsx .module.scss index.ts         T2
    VidaCategoryForm/            VidaCategoryForm.tsx .module.scss index.ts               T4
  data/
    vida-starting-points.ts                                                               T1
  hooks/
    useCreateStartingActivities.ts  (+ .test.tsx)                                          T1
    useSaveVidaItemForActivity.ts   (+ .test.tsx)                                          T3
  pages/
    VidaActividadesPage.tsx        .module.scss  .test.tsx    (hoy 6 líneas)              T1
    VidaArchivadasPage.tsx         .module.scss  .test.tsx                                T4
    VidaCategoriasPage.tsx         .module.scss  .test.tsx                                T4
  utils/
    vida-catalog.utils.ts          (+ .test.ts)                                            T1
    vida-text.utils.ts             (+ .test.ts)                                            T1

src/shared/ui/ColorPicker/
    ColorPicker.tsx .module.scss color-palette.ts ColorPicker.test.tsx index.ts           T2
```

**Archivos existentes que se modifican, con el punto exacto:**

| Archivo | Punto | Qué | Tajada |
|---|---|---|---|
| `src/features/vida/pages/VidaActividadesPage.tsx` | entero (6 líneas) | la pantalla | 1 |
| `src/features/vida/utils/activity-filters.ts` | `:36-45` | `filterActivitiesBySearch` pasa por `normalizeText` (tildes) y busca **solo por `title`** (criterio 5 dice «por nombre»); hoy mira también `description` y `category.name`. Único consumidor hoy: sus tests. | 1 |
| `src/features/vida/utils/vida-date.utils.ts` | al final (tras `:45`) | `VIDA_DAY_ORDER: VidaDayOfWeek[]` (lunes→domingo) y `VIDA_DAY_SHORT_LABELS` (`L M X J V S D`). **No** hace falta el `Date → VidaDayOfWeek` que F0 dejó anotado: F1 no convierte fechas. El hueco sigue abierto para F2/F3. | 1 |
| `src/features/vida/hooks/useActivities.ts` | `:37,49` | `onError: (e) => toast.error(...)` en las dos mutaciones (`useToast` ya está importado en `:12`) | 1 |
| `src/features/vida/hooks/useActivityCategories.ts` | `:35,48` | ídem | 2 |
| `src/features/vida/hooks/useVidaItems.ts` | `:61,73` | ídem | 3 |
| `src/features/habits/components/HabitFormModal/HabitWizardStep1.tsx` | `:3` y `:118` | `HabitColorPicker` → `ColorPicker` de `@/shared/ui/ColorPicker` | 2 |
| `src/features/habits/components/HabitFormModal/HabitEditForm.tsx` | `:4` y `:305` | ídem | 2 |
| `src/features/habits/data/habit-colors.ts` | `:11-97` | pasa a re-exportar la paleta desde `@/shared/ui/ColorPicker/color-palette`; **se queda con `pickInitialHabitColor` (`:113`)**, que es de dominio hábitos | 2 |
| `src/shared/ui/index.ts` | barril | exporta `ColorPicker` | 2 |
| `src/features/vida/routes/vida-paths.ts` | `:6` | `+ archivadas: '/app/vida/actividades/archivadas'`, `+ categorias: '/app/vida/categorias'` | 4 |
| `src/features/vida/routes/vida.routes.tsx` | `:39-42` | dos `children` nuevos | 4 |
| `src/features/vida/routes/vida.routes.test.tsx` | — | las dos rutas nuevas entran en sus asserts | 4 |

**Archivos que se borran** (tajada 2, al mover el selector): `src/features/habits/components/HabitColorPicker/{HabitColorPicker.tsx,HabitColorPicker.module.scss,HabitColorPicker.test.tsx,index.ts}` — el test se mueve a `ColorPicker.test.tsx` y sigue verde. `habit-colors.test.ts` **no se toca**: sigue importando de `data/habit-colors`, que re-exporta.

---

### Las dos decisiones técnicas que el analista dejó abiertas

**1. La trampa de `ActivityFilters.status` (confirmado: `activity.schema.graphql:153-161`, un solo enum anulable).**

**Se pide una consulta sin filtro de estado y se filtran las `cancelled` en cliente.**

```ts
const CATALOG_LIMIT = 200   // constante del catálogo, no de F0
useActivitiesQuery({ page: 1, limit: CATALOG_LIMIT })   // status: null → todos
```

- El recuento del criterio 4 sale **del array ya filtrado en cliente**, nunca de `data.total`. `total` cuenta también las archivadas y mentiría.
- La línea de «hay más» se decide con `data.total > data.activities.length` — comparando el **crudo**, antes de filtrar: eso es exactamente «el lote no cabe entero». Texto sin mentir el total: «Mostrando las primeras 200. Archiva lo que ya no hagas para verlo todo.»
- Descartado pedir tres consultas (`pending`, `in_progress`, `completed`): tres viajes, tres entradas de caché, tres paginaciones que no se pueden fundir en una sola línea honesta, y cualquier estado que el backend añada mañana desaparecería del catálogo en silencio.
- «Ver archivadas» sí es directa: `useActivitiesQuery({ status: 'cancelled', page: 1, limit: CATALOG_LIMIT })`.

**2. El `onError` que falta: se arregla en los hooks de F0**, no en cada consumo. Son seis líneas, `useToast` ya está importado en los tres archivos, y arregla F1–F6 de una vez; ponerlo en cada pantalla lo condena a olvidarse en la siguiente. Se añade en la tajada que lo estrena (ver tabla).

El toast **no basta** para el criterio 16: lo que garantiza que la hoja no se cierra es que el cierre vive en el `onSuccess` **local** del `mutate` (`HabitCreateWizard.tsx:291`), no en el hook, más un `<Alert variant="danger">` dentro de la hoja cuando `mutation.isError` (`HabitCreateWizard.tsx:279-283`). Las dos cosas, como en hábitos.

**Consecuencia para los puntos de partida:** el `onSuccess` del hook lanza un toast **por mutación**. Crear seis actividades con `useCreateActivityMutation` en bucle = seis toasts «Actividad creada» y hasta cuatro «Categoría creada». Por eso la tajada 1 trae `useCreateStartingActivities.ts`, que consume **`api/activities.api.ts` y `api/activity-categories.api.ts` directamente** (la capa que ya existe: no duplica nada), invalida **una vez** al final con `invalidateActivityQueries` + `invalidateActivityCategoryQueries`, y da un solo mensaje. Es el único sitio de Vida autorizado a saltarse el toast por mutación, y su comentario de cabecera tiene que decir por qué. Resuelve además los criterios 10 (`isPending` deshabilita el botón) y 11 (**resuelve, no lanza**, con `{ created: Activity[], failed: {name, reason}[] }`: lo creado sigue creado y el resumen nombra lo que falló).

---

### Slices, with paths

| # | What it does | Files | Criteria it closes | State |
|---|---|---|---|---|
| 1 | **El primer minuto y el catálogo (solo lectura).** Puntos de partida con selección múltiple y creación en lote; catálogo agrupado por categoría con casillas de plantilla y buscador; los cuatro estados. | **Crea:** `data/vida-starting-points.ts` · `hooks/useCreateStartingActivities.ts` (+test) · `utils/vida-catalog.utils.ts` (+test) · `utils/vida-text.utils.ts` (+test) · `components/VidaStartingPoints/` · `components/VidaCatalogGroup/` · `components/VidaActivityCard/` (+test) · `pages/VidaActividadesPage.module.scss` · `pages/VidaActividadesPage.test.tsx`. **Modifica:** `pages/VidaActividadesPage.tsx` (entero) · `utils/activity-filters.ts:36-45` · `utils/vida-date.utils.ts` (al final) · `hooks/useActivities.ts:37,49` (`onError`). | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 28, 29, 30, 31*, 32*, 33*, 34, 35 | pending |
| 2 | **Crear y editar desde la hoja.** FAB `+` y «···» → Editar abren `SteppedModal` con nombre + píldoras de categoría + «+ nueva» (icono y color). Mueve el selector de color a compartido. | **Crea:** `shared/ui/ColorPicker/{ColorPicker.tsx,.module.scss,color-palette.ts,ColorPicker.test.tsx,index.ts}` · `components/VidaActivitySheet/` (+test) · `components/CreateVidaCategoryStep/`. **Modifica:** `pages/VidaActividadesPage.tsx` (FAB, menú «···» → editar, estado de la hoja) · `components/VidaActivityCard/VidaActivityCard.tsx` (el menú) · `habits/components/HabitFormModal/HabitWizardStep1.tsx:3,118` · `habits/components/HabitFormModal/HabitEditForm.tsx:4,305` · `habits/data/habit-colors.ts:11-97` · `shared/ui/index.ts` · `hooks/useActivityCategories.ts:35,48`. **Borra:** `habits/components/HabitColorPicker/`. | 12, 13, 14, 15, 16, 31*, 32*, 33*, 34, 35 | pending |
| 3 | **Ponerla en mi plantilla.** Interruptor + siete días en la hoja: crea, actualiza y desactiva el `VidaItem`; la tarjeta lo refleja. | **Crea:** `hooks/useSaveVidaItemForActivity.ts` (+test). **Modifica:** `components/VidaActivitySheet/VidaActivitySheet.tsx` (bloque plantilla + validación) · `pages/VidaActividadesPage.tsx` (pasa el `VidaItem` de la actividad a la hoja) · `hooks/useVidaItems.ts:61,73` (`onError`). | 17, 18, 19, 20, 31*, 33*, 35 | pending |
| 4 | **Archivar, restaurar y categorías.** «···» → Archivar con confirmación; `/app/vida/actividades/archivadas` con Restaurar; `/app/vida/categorias` para listar y editar. | **Crea:** `pages/VidaArchivadasPage.tsx` (+scss, +test) · `pages/VidaCategoriasPage.tsx` (+scss, +test) · `components/VidaCategoryForm/`. **Modifica:** `components/VidaActivityCard/VidaActivityCard.tsx` (Archivar) · `pages/VidaActividadesPage.tsx` (enlaces «ver archivadas» y «Categorías ›») · `routes/vida-paths.ts:6` · `routes/vida.routes.tsx:39-42` · `routes/vida.routes.test.tsx`. | 21, 22, 23, 24, 25, 26, 27, 31*, 32*, 33*, 34, 35 | pending |

`*` Los criterios 31, 32 y 33 (375 px, texto largo, tema oscuro) se cierran **en cada tajada sobre lo que esa tajada pinta**, no al final: el reviewer los pide otra vez cada vez.

**Las tajadas se quedan en cuatro y en este orden.** Mirando el código no aparece ninguna dependencia que obligue a recortarlas de otra forma, pero sí dos ajustes de alcance dentro de la tajada 1 que hay que respetar o la pantalla queda con botones muertos:

1. **La tajada 1 no pinta el FAB `+` ni «Categorías ›»**, aunque salgan en la pantalla B del render: el `+` llega en la 2 y «Categorías ›» en la 4. La tajada 1 es solo lectura y su única acción de escritura son los puntos de partida.
2. **El criterio 3 se verifica en la tajada 1 con test de componente, no a mano.** Nada crea `VidaItem` hasta la tajada 3, así que en un recorrido real de la tajada 1 todas las tarjetas leerán «sin plantilla». El test de `VidaActivityCard` inyecta un `VidaItem` con días y comprueba las casillas marcadas; la mitad «a mano» del criterio se cierra en la tajada 3. Esto es honestidad sobre la tajada, no un recorte del criterio.

---

### What NOT to create

- **Ningún documento GraphQL.** Los cinco que hacen falta ya existen y ya están en la lista de `src/features/vida/graphql/contracts.test.ts:49-79`: `ACTIVITIES_QUERY`, `ACTIVITY_ADD_MUTATION`, `ACTIVITY_EDIT_MUTATION`, `ACTIVITY_CATEGORY_ADD_MUTATION`, `ACTIVITY_CATEGORY_EDIT_MUTATION`, `VIDA_ITEMS_QUERY`, `VIDA_ITEM_CREATE_MUTATION`, `VIDA_ITEM_UPDATE_MUTATION`. **`contracts.test.ts` no se toca.**
- **Ningún hook de consulta ni mutación nuevo sobre el API.** Los dos hooks nuevos (`useCreateStartingActivities`, `useSaveVidaItemForActivity`) son **orquestadores** sobre `api/`, no acceso nuevo.
- **Ninguna clave en `vidaKeys`.** `activities.list(filters)` ya distingue por filtros serializados (`activity-filters.ts:12-22` mete `status`, `page` y `limit` en la clave), así que catálogo y archivadas ya son dos entradas distintas.
- **Nada en `invalidate-vida-queries.ts`.** `invalidateActivityQueries` tira de `vidaKeys.activities.all()` y arrastra por prefijo las dos listas; `invalidateVidaItemQueries` hace lo propio con la plantilla. Revisado: cubre las cuatro tajadas.
- **Ningún selector de iconos.** `IconPickerLazy` es lo que exporta `@/shared/ui/IconPicker` (`IconPickerLazy.tsx:30`): importar `IconPicker` de ahí **ya** es el diferido. No importar de `@/shared/ui/IconPicker/IconPicker`, y **ni un solo import a pelo de `@fortawesome/free-solid-svg-icons`** (criterio 35).
- **Ninguna paleta de color nueva.** Se mueve la de `habit-colors.ts`, no se escribe otra.
- **Ningún `useConfirmDialog` nuevo** ni `Popover`, `Switch`, `Checkbox`, `Alert`, `EmptyState`, `Skeleton`, `Spinner`, `SteppedModal`, `FormField`, `Input`, `Badge`, `Card`, `IconButton`, `AppIcon`: los catorce están en `src/shared/ui/`.

---

### Where it does NOT go

- **`HabitColorPicker` no se importa cruzado** desde `features/vida`. Se **mueve** a `src/shared/ui/ColorPicker/` en la tajada 2, que es la que lo necesita. Razón: dos módulos lo usan, la regla del proyecto es «shared mínimo pero real» (`docs/project-conventions.md:117-127`: shared cuando «al menos dos features lo necesitan sin acoplamiento de negocio») y una paleta de 17 hexadecimales no conoce ningún dominio. Lo que **sí** se queda en hábitos es `pickInitialHabitColor` (`habit-colors.ts:113`), que sortea el color de un hábito nuevo a partir de los que ya usan **los hábitos**: eso sí es dominio. Descartado mover el archivo entero: arrastraría `habit-colors.test.ts` (los ΔE de la paleta) sin ganar nada.
- **No se restaura nada de `79bece0:src/features/activities/`.** Aquel catálogo era un gestor de tareas —estado, prioridad, subtareas, carpetas— y su vocabulario es justo el que el criterio 34 prohíbe. Lo que se rescata de ahí es F2/F3, no esto.
- **No se toca `app-nav.config.ts`.** «Ver archivadas» y «Categorías ›» son navegación **dentro** de la pantalla (el render las pone en la barra de búsqueda y en el menú), no secciones del módulo: no son píldoras ni entradas de `⌘K`. Añadirlas ahí metería dos destinos más en la fila de píldoras de Vida, que ya tiene cuatro y a 375 px va justa.
- **No se reutiliza `habit-list.utils.ts` ni `habit-week.utils.ts`.** `filterHabits` filtra por categoría, no agrupa, y `HabitWeekBarDay` habla de **fechas**, no de días de la semana. Imitar la forma, sí; importar, no: son tipos de hábito.
- **No se usa `activityRemove`** (existe en `activities.api.ts:71` y en `useDeleteActivityMutation`) ni `activityComplete`. D1 lo cerró: nada se borra, nada se «completa» desde el catálogo.
- **No se guarda la duración** en `description` ni en `localStorage` (D2).
- **No se pide backend.** `Activity` no tiene `isArchived` ni duración estimada, y el SDL vendorizado no se recopia en esta feature.

---

### Cómo se verifica (la pantalla está tras el login)

La línea base está en `docs/features/ENVIRONMENT.md`: `pnpm typecheck` limpio, `pnpm lint` 14 errores / 0 warnings, `pnpm test` 2 fallos de 530 (`SearchSelect`, preexistentes), build 817,6 kB. Los tres primeros se corren enteros al empezar y al terminar cada tajada; el build al terminar.

**Con test de componente** (`vitest` + RTL, molde en `src/features/habits/pages/HabitsListPage.test.tsx` y `src/features/habits/components/HabitFormModal/HabitFormModal.test.tsx`, que mockea los hooks con `vi.mock`; el render con providers es `@/test/render` → `renderWithProviders`):

- Criterios **1-5** (agrupado, «Sin categoría» al final, casillas, recuento, buscador sin tildes): `VidaActividadesPage.test.tsx` + `VidaActivityCard.test.tsx` + los tests puros de `vida-catalog.utils.ts` y `vida-text.utils.ts`.
- Criterios **6-11**: `VidaStartingPoints.test.tsx` (selección, botón deshabilitado, texto «Crear las 6») y `useCreateStartingActivities.test.tsx` (reutiliza categoría existente ignorando mayúsculas y tildes; no crea dos veces con doble toque; fallo a mitad → lo creado sigue creado y el resumen nombra el fallo).
- Criterios **12-20**: `VidaActivitySheet.test.tsx` (validación de nombre y categoría, la hoja no se cierra si la mutación falla, «+ nueva» conserva el nombre escrito, interruptor sin días no guarda, editar actualiza el **mismo** `VidaItem`).
- Criterios **21-27**: tests de `VidaActivityCard` (confirmación con las palabras «Archivar»/«Restaurar»), `VidaArchivadasPage.test.tsx`, `VidaCategoriasPage.test.tsx`.
- Criterios **28-30**: con `QueryClient` propio. El **29** es el que hay que hacer bien: `useVidaQueryGuard` en `false` deja la consulta en `isPending` con `fetchStatus: 'idle'`, así que **`isLoading` es `true` y el esqueleto se quedaría para siempre**. La condición del esqueleto tiene que ser `isPending && fetchStatus !== 'idle'`; la del mensaje de sesión, `fetchStatus === 'idle' && isPending`. Se prueba mockeando el guard.
- Criterios **32** y **34**: texto largo y vocabulario, por aserción sobre el DOM.

**Con arnés temporal** (`.html` + `.tsx` bajo `src/` con `MemoryRouter` y datos sintéticos, servido por el 5173, **borrado antes de reportar** — la vía que ya funcionó tres veces en este repo):

- Criterio **31** (375 px sin scroll horizontal, «···» dentro de la tarjeta): se mide `document.documentElement.scrollWidth <= clientWidth` con el viewport a 375, y la posición del «···» con `getBoundingClientRect`.
- Criterio **33** (tema oscuro): se pinta con `[data-ds='aura']` y el tema oscuro puesto, y se leen los `getComputedStyle` de cabecera de grupo, tarjeta, hoja y punto de color. Ojo: si la ventana está oculta no hay capturas — se mide el DOM, no se mira.
- Criterio **32** en su parte visual (que el nombre de 60 caracteres no empuje nada fuera).

**Solo el usuario** (criterio **36**, y está escrito así a propósito): el recorrido real entero con sesión. Primer minuto → catálogo agrupado → crear con categoría nueva → plantilla → editar → archivar → restaurar. Ningún agente entra con credenciales; los pasos se le entregan al cerrar cada tajada.

---

### Lo que no pude averiguar

- **El render no se abrió en el navegador**, se leyó el HTML (`docs/vida/assets/05-vida-catalogo.html:110-214`). Las tres pantallas, las píldoras, las casillas de día, el FAB y las cuatro notas al pie están recogidos; lo que no se ha comprobado es cómo se ve **pintado**. Quien construya la tajada 1 debería abrirlo en `http://localhost:5173/docs/vida/assets/05-vida-catalogo.html` antes de escribir el SCSS.
- **Las 13 actividades de arranque del render traen emoji, no nombre de icono de Font Awesome**, y sus cuatro categorías (Casa, Mascotas, Yo, Comida) no traen hexadecimal exacto salvo por `var(--violet)`, `var(--amber)`, `var(--sky)`. La traducción emoji → `AppIcon name` y color → hex de la paleta (`color-palette.ts`) la tiene que hacer quien escriba `vida-starting-points.ts`, eligiendo del catálogo de iconos y de los seis del núcleo. No está decidida aquí.
- **El orden dentro de cada grupo** no lo fija ni el criterio ni el render. Propuesta, no decisión: `orderIndex` de la categoría para los grupos y alfabético por `title` dentro de cada uno.

## 3. Construction — feature-builder

## 4. Review — feature-reviewer
