---
id: FEAT-002
title: El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días
status: building
architect: yes    # primera pantalla real de Vida, datos de arranque nuevos y dos selectores que hoy viven en hábitos
area: features/vida
requested: 2026-09-19
updated: 2026-09-20
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
| 1 | **El primer minuto y el catálogo.** Sin nada creado, los puntos de partida: se marcan varias y un botón las crea todas con sus categorías (creando las que falten). Con actividades, el catálogo agrupado por categoría, con los días de la plantilla, el buscador y los estados (cargando, sin sesión, error, vacío, 375 px, oscuro). Solo lectura: aún no hay hoja. | accepted (2026-09-20) |
| 2 | **Crear y editar desde la hoja.** El `+` y el «···» → editar abren la hoja con nombre y categoría (píldoras), con «+ nueva» categoría (icono + color) dentro de la misma hoja. Errores de mutación visibles. Sin duración: la hoja tiene nombre y categoría, nada más (D2). | accepted (2026-09-20) |
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
| 1 | **El primer minuto y el catálogo (solo lectura).** Puntos de partida con selección múltiple y creación en lote; catálogo agrupado por categoría con casillas de plantilla y buscador; los cuatro estados. | **Crea:** `data/vida-starting-points.ts` · `hooks/useCreateStartingActivities.ts` (+test) · `utils/vida-catalog.utils.ts` (+test) · `utils/vida-text.utils.ts` (+test) · `components/VidaStartingPoints/` · `components/VidaCatalogGroup/` · `components/VidaActivityCard/` (+test) · `pages/VidaActividadesPage.module.scss` · `pages/VidaActividadesPage.test.tsx`. **Modifica:** `pages/VidaActividadesPage.tsx` (entero) · `utils/activity-filters.ts:36-45` · `utils/vida-date.utils.ts` (al final) · `hooks/useActivities.ts:37,49` (`onError`). | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 28, 29, 30, 31*, 32*, 33*, 34, 35 | accepted (2026-09-20) |
| 2 | **Crear y editar desde la hoja.** FAB `+` y «···» → Editar abren `SteppedModal` con nombre + píldoras de categoría + «+ nueva» (icono y color). Mueve el selector de color a compartido. | **Crea:** `shared/ui/ColorPicker/{ColorPicker.tsx,.module.scss,color-palette.ts,ColorPicker.test.tsx,index.ts}` · `components/VidaActivitySheet/` (+test) · `components/CreateVidaCategoryStep/`. **Modifica:** `pages/VidaActividadesPage.tsx` (FAB, menú «···» → editar, estado de la hoja) · `components/VidaActivityCard/VidaActivityCard.tsx` (el menú) · `habits/components/HabitFormModal/HabitWizardStep1.tsx:3,118` · `habits/components/HabitFormModal/HabitEditForm.tsx:4,305` · `habits/data/habit-colors.ts:11-97` · `shared/ui/index.ts` · `hooks/useActivityCategories.ts:35,48`. **Borra:** `habits/components/HabitColorPicker/`. | 12, 13, 14, 15, 16, 31*, 32*, 33*, 34, 35 | accepted (2026-09-20) |
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

*(una entrada por tajada, añadidas debajo)*

### Tajada 1 — El primer minuto y el catálogo

**Summary for the reviewer:**
1. `/app/vida/actividades` deja de ser un cascarón de 6 líneas: con cero
   actividades enseña los **13 puntos de partida** (6 marcados) y un botón que
   las crea con sus categorías; con actividades, el **catálogo agrupado por
   categoría** con casillas de plantilla, buscador sin tildes y los cuatro
   estados (cargando / sin sesión / error / vacío). Solo lectura: ni FAB `+` ni
   «Categorías ›» (llegan en las tajadas 2 y 4).
2. Todo el código nuevo vive en `src/features/vida/{components,data,hooks,pages,utils}`;
   de fuera del módulo solo se tocó `src/features/vida/routes/vida.routes.test.tsx`.
3. **Lo que más probablemente rompí:** el **test de rutas de Vida**
   (`vida.routes.test.tsx`). Actividades ya no renderiza en seco —pide
   `QueryClientProvider` y contexto de sesión a través de `useVidaQueryGuard`—,
   así que el test ahora **mockea el guard a `false`** y monta un `QueryClient`
   propio. Si mañana alguien quiere que ese test compruebe la pantalla con
   datos, ese mock le estorbará. Segundo sospechoso:
   `filterActivitiesBySearch`, que **dejó de mirar `description` y
   `category.name`** — hoy su único consumidor es esta pantalla y sus tests,
   pero cualquier pantalla futura que esperara la búsqueda ancha se llevará una
   sorpresa. Tercero: el chunk inicial subió de 817,6 kB a **833,0 kB** (+15,4);
   no es por iconos (el `app-icons` perezoso sigue en 620,20 kB), es código de
   la pantalla, pero el número de la línea base cambia.

**What was built:**

*Creado*

| Archivo | Qué hace |
|---|---|
| `src/features/vida/data/vida-starting-points.ts` (+`.test.ts`) | Los 13 puntos de partida del render y sus 4 categorías sugeridas (Casa, Mascotas, Yo, Comida) con icono y hexadecimal. Datos puros, `categoryName` y **nunca** un id, igual que `habit-templates.ts`. El test fija los cuatro hexadecimales del núcleo de la paleta. |
| `src/features/vida/utils/vida-text.utils.ts` (+`.test.ts`) | `normalizeVidaText` (minúsculas + sin tildes) y `compareVidaNames` (`localeCompare` en `'es'`). Copiado y no importado de `habit-list.utils.ts`: Vida no depende de hábitos. |
| `src/features/vida/utils/vida-catalog.utils.ts` (+`.test.ts`) | Aritmética pura del catálogo: `excludeArchivedActivities`, `buildVidaItemsByActivity` (`activityId → VidaItem` **activo**), `groupActivitiesByCategory` (orden por `orderIndex`, «Sin categoría» siempre al final) y `countCatalogCategories`. |
| `src/features/vida/hooks/useCreateStartingActivities.ts` (+`.test.tsx`) | El orquestador del botón: resuelve las categorías necesarias (reutiliza por nombre normalizado, crea las que falten), crea las actividades, **invalida una sola vez** y da **un solo mensaje**. No lanza: resuelve con `{ created, failed }`. |
| `src/features/vida/components/VidaActivityCard/` (+`.test.tsx`) | La tarjeta: cápsula con icono y color de la categoría, nombre y las **siete casillas L M X J V S D** o «sin plantilla». |
| `src/features/vida/components/VidaCatalogGroup/` | La cabecera del grupo (punto de color, nombre, recuento) y su rejilla de tarjetas. |
| `src/features/vida/components/VidaStartingPoints/` (+`.test.tsx`) | El primer minuto: 13 píldoras, 6 marcadas, el botón que dice cuántas, el `Alert` de lo que falló. |
| `src/features/vida/pages/VidaActividadesPage.module.scss` | El SCSS de la pantalla y su esqueleto. |
| `src/features/vida/pages/VidaActividadesPage.test.tsx` | 13 casos: agrupado, «Sin categoría» al final, recuento, archivadas fuera, buscador, sin resultados, esqueleto, sin sesión, error + reintento, vacío → puntos de partida, ausencia de FAB/«Categorías ›», texto largo y vocabulario. |

*Modificado*

| Archivo | Qué |
|---|---|
| `src/features/vida/pages/VidaActividadesPage.tsx` | De 6 líneas a la pantalla entera. `CATALOG_LIMIT = 200`, consulta **sin filtro de estado**, recuento del array ya filtrado (nunca de `total`), línea «Mostrando las primeras 200…» cuando `total > activities.length`. |
| `src/features/vida/utils/activity-filters.ts:44-48` | `filterActivitiesBySearch` pasa por `normalizeVidaText` y busca **solo por `title`**. |
| `src/features/vida/utils/vida-date.utils.ts` (al final) | `VIDA_DAY_ORDER` (lunes→domingo), `VIDA_DAY_SHORT_LABELS` (L M X J V S D) y `VIDA_DAY_LABELS` (para el `aria-label`, que una letra suelta no se lee). |
| `src/features/vida/hooks/useActivities.ts:53,68` | `onError` con toast en crear y actualizar, el hueco que dejaron anotado los tres revisores de F0. |
| `src/features/vida/routes/vida.routes.test.tsx` | Mock de `useVidaQueryGuard` a `false` + `QueryClientProvider` en `renderAt`. La aserción «nada más que el título» pasa a ser un `it.each` sobre **plantilla, hoy y revisión**: Actividades ya no es un cascarón. |

**Why this way:**

- **El esqueleto mira `fetchStatus`, no solo `isPending`** (criterio 29). Con el
  guard en `false` la consulta queda `isPending` con `fetchStatus: 'idle'` para
  siempre; si el esqueleto mirara `isPending` a secas giraría eternamente. La
  pantalla distingue: `isPending && fetchStatus === 'idle'` → mensaje de sesión;
  `isPending` a secas → esqueleto. Descartado usar `isLoading`, que es
  exactamente el booleano que miente aquí.
- **`useCreateStartingActivities` orquesta sobre `api/` y no sobre los hooks de
  mutación.** Seis actividades + cuatro categorías con los hooks serían **diez
  toasts** por un solo gesto. Es el único sitio de Vida autorizado a saltárselos
  y su comentario de cabecera lo dice. Descartada la alternativa —silenciar el
  toast con una bandera en el hook— porque contamina la capa de datos de F0 para
  un caso de una pantalla.
- **Resuelve, no lanza** (criterio 11): `{ created, failed }`. Un `Promise.all`
  que rechaza dejaría a medias sin poder decir **qué** quedó creado, y la
  pantalla anunciaría «6 creadas» cuando fueron 4.
- **Las categorías se piden frescas** (`getActivityCategories()`) dentro de la
  mutación en vez de leer la caché de la pantalla: si el usuario ya tenía «Casa»
  de antes, se reutiliza aunque la caché venga de hace rato. Si esa lectura
  falla se sigue con lista vacía —como mucho se duplica una categoría— en vez de
  no crear nada.
- **El recuento sale del array filtrado en cliente**, nunca de `data.total`:
  `total` cuenta también las archivadas. La línea «hay más» sí compara el
  **crudo**, que es lo que dice si el lote no cabía.
- **Un nombre largo se recorta con elipsis** (`text-overflow` + `min-width: 0`
  en cadena) en vez de envolverse: en una fila de una línea, envolver empujaría
  las casillas fuera de la tarjeta.
- **Los grupos se ordenan por `orderIndex` de la categoría** y, a igualdad, por
  nombre; dentro, alfabético por título. Era la propuesta —no decisión— que
  dejó el arquitecto; queda tomada aquí y dicha, por si el usuario la quiere de
  otra forma.

**Verification:**

```
$ pnpm typecheck
> tsc -b --noEmit
(limpio)

$ pnpm lint
✖ 14 problems (14 errors, 0 warnings)
$ pnpm lint | grep -c "features/vida"
0

$ pnpm test
 Test Files  1 failed | 72 passed (73)
      Tests  2 failed | 579 passed (581)
(los 2 fallos son SearchSelect.test.tsx, preexistentes en la línea base)

$ pnpm vitest run src/features/vida
 Test Files  15 passed (15)
      Tests  161 passed (161)

$ pnpm build
dist/assets/index-DoNhT2sV.js       832.97 kB │ gzip: 255.54 kB
dist/assets/app-icons-B03FATU2.js   620.20 kB │ gzip: 193.19 kB
dist/assets/IconPicker-CzH4q4OG.js    4.64 kB │ gzip:   1.81 kB

$ grep -rn "free-solid-svg-icons" src/features/vida/
(ninguno)
```

La línea base pasa de 530 a **581 tests**: 51 nuevos, ninguno roto. El lint
llegó a 15 errores a mitad de construcción (`no-useless-assignment` en
`useCreateStartingActivities.ts:111`, una inicialización `= []` que ambas ramas
pisaban) y se dejó en los 14 de la línea base.

**Criteria it closes:**

| # | Estado | Evidencia |
|---|---|---|
| 1 | cerrado | `VidaActividadesPage.test.tsx` «agrupa por categoría…»: la cabecera «Casa» lleva `2 actividades`, su `<section>` lleva `--vida-category-color: #8b5cf6` y dentro hay 2 `article`. |
| 2 | cerrado | «la actividad sin categoría va a "Sin categoría", y va la última»: el último `h2` contiene «Sin categoría» y dentro está «Llamar a alguien». Icono neutro `circle-dot` en `vida-catalog.utils.ts:16`. |
| 3 | cerrado **por test de componente** | `VidaActivityCard.test.tsx`: con un `VidaItem` inyectado (`monday/wednesday/friday`) las siete casillas salen `L M X J V S D` y las marcadas son `L X V`; sin `VidaItem` se lee «sin plantilla» y no hay ninguna casilla. **Tal como acordó el arquitecto**: nada crea `VidaItem` hasta la tajada 3, así que en un recorrido real de esta tajada todas las tarjetas dirán «sin plantilla». La mitad «a mano» se cierra en la tajada 3. |
| 4 | cerrado | «4 actividades · 2 categorías» con 4 `article` y 3 grupos en pantalla («Sin categoría» no cuenta como categoría). Un caso extra comprueba que una `cancelled` ni se pinta ni cuenta. |
| 5 | cerrado | Escribir `banar` deja «Bañarme» y esconde el grupo «Casa»; `zzz` da «Sin resultados para “zzz”» y el botón «Limpiar búsqueda» restaura. Más `vida-text.utils.test.ts` y los tests de `activity-filters`. |
| 6 | cerrado | Con `activities: []` salen los 13 puntos (`VidaStartingPoints.test.tsx`: 6 `pressed`, 7 no), cada uno con su icono y su `categoryName`; no hay ningún `textbox` en pantalla. Los 17 nombres de icono se comprobaron contra `src/shared/icons/catalog`. |
| 7 | cerrado | `useCreateStartingActivities.test.tsx` «crea exactamente lo marcado»: 3 puntos → 3 `createActivity`, todas con `categoryId`. Y en la pantalla el botón dice «Crear las 6» / «Crear las 7» según lo marcado. |
| 8 | cerrado | «reutiliza la categoría que ya existía…»: con «YO» y «compañía» en la cuenta, pedir «Yo» y «Compania» **no llama a `createActivityCategory`** y usa los ids existentes. Y «crea con nombre, icono y color…»: `createActivityCategory({ name: 'Casa', icon: 'house-chimney', color: '#8b5cf6' })`. Dos actividades de «Yo» crean **una** categoría. |
| 9 | cerrado | «sin ninguna marcada el botón está deshabilitado y no crea nada»: `toBeDisabled()` y `mutate` sin llamadas. |
| 10 | cerrado | `VidaStartingPoints.test.tsx` «mientras crea no admite un segundo toque» (dos clics con `isPending` → 0 llamadas) + `useCreateStartingActivities.test.tsx` «un segundo toque mientras crea no vuelve a crear» (con la promesa retenida, `createActivity` queda en 1). |
| 11 | cerrado | Hook: con «Cocinar» fallando, `created` = `['Bañarme','Descansar']`, `failed` = `[{name:'Cocinar', reason:'El servidor no respondió'}]`, `isError` **false**, el toast dice «2 de 3» y **no** hay toast de éxito. Pantalla: `Alert` «Algunas no se pudieron crear» con el motivo, lo creado se desmarca y «Cocinar» sigue marcada. |
| 28 | cerrado | Con `isPending` + `fetchStatus: 'fetching'` hay `[aria-busy="true"]` y **no** hay puntos de partida ni botón «Crear las…». |
| 29 | cerrado | Con `isPending` + `fetchStatus: 'idle'`: «Entra para ver tus actividades», enlace «Iniciar sesión» y **ningún** `aria-busy`. |
| 30 | cerrado | Con `isError`: «No pudimos cargar tus actividades» y el botón «Reintentar» llama a `refetch` una vez. |
| 31 | **pendiente de prueba manual** | El 5173 del usuario estaba apagado (`probe.sh`: «APAGADO (nadie escucha)», `curl` rc 7), así que no se pudo montar el arnés. Por código: `min-width: 0` en toda la cadena, rejilla `repeat(auto-fill, minmax(min(20.25rem, 100%), 1fr))` y elipsis en nombre y categoría — pero **no está medido**. La mitad del criterio que habla del «···» no aplica todavía: esta tajada no lo pinta. |
| 32 | cerrado en DOM, **visual pendiente** | Test de pantalla con título de 61 caracteres y categoría de 42: los dos se pintan enteros sin romper el árbol; `VidaActivityCard.test.tsx` repite con el nombre largo. Que no produzcan scroll horizontal a 375 px es la parte que necesita el arnés (ver 31). |
| 33 | **pendiente de prueba manual** | Mismo motivo: sin 5173 no hay arnés. Por código no hay ni un color literal en el SCSS: todo sale de `--color-text`, `--color-text-muted`, `--color-primary`, `--color-glass-border` y `--aura-glass-1`, y el color de categoría entra siempre por `color-mix` contra el texto o el fondo, que es lo que lo mantiene legible al invertir el tema. **No verificado.** |
| 34 | cerrado | Test de pantalla y de tarjeta: el texto renderizado no contiene «pendiente», «prioridad», «vencida», «atrasad», «fallaste», «incumpl», «desperdici», «cancelad», «eliminar» ni «tarea». |
| 35 | cerrado con un matiz | typecheck limpio, lint 14/0 (ninguno en Vida), tests 2 fallos preexistentes y ni un import a pelo de `@fortawesome/free-solid-svg-icons`. **El matiz:** el chunk inicial pasa de 817,6 kB a **833,0 kB**. No es por iconos (`app-icons` sigue perezoso en 620,20 kB), es el código de la pantalla; pero el criterio dice «no crece **por iconos**» y ahí está limpio. |

Los criterios 12-27 son de las tajadas 2-4 y no se tocan. El **36** es del
usuario por definición.

**Risks:**

- **`vida.routes.test.tsx` con el guard mockeado a `false`.** El test comprueba
  el enrutado, no la pantalla; si alguien espera que ahí se vea el catálogo con
  datos, ese mock lo impide. Era eso o meter `AuthBootstrapProvider` en un test
  de rutas.
- **`filterActivitiesBySearch` se estrechó a `title`.** Cambio pedido por el
  plan (criterio 5 dice «por nombre»), pero es una función compartida del
  módulo: cualquier pantalla futura que esperase la búsqueda ancha —descripción
  y categoría— ya no la tiene.
- **`onError` nuevo en `useActivities`.** Cualquier consumidor que hoy tragara
  un fallo en silencio ahora enseña un toast. Es la intención, pero es un cambio
  de comportamiento en código de F0, ya entregado.
- **`CATALOG_LIMIT = 200` sin paginación.** Con más de 200 actividades sale la
  línea «Mostrando las primeras 200…» y el resto no se ve. Está dicho en
  pantalla, no escondido, pero es un techo real.
- **Los dos estados que no pude mirar** (375 px y tema oscuro) son precisamente
  los que un test no sustituye. Van como pendientes, no como cerrados.
- **El grafo** se actualizó con `graphify update .` (2696 nodos, 2874 aristas).

**Deviations from the plan:**

1. **`data/vida-starting-points.test.ts` no estaba en la lista de archivos del
   plan.** Se añadió para fijar los cuatro hexadecimales del núcleo de la
   paleta: como los colores se escriben aquí como literales —para no atar
   `features/vida` a `features/habits`— sin test se desincronizan en silencio
   cuando la paleta se mude a `@/shared/ui/ColorPicker` en la tajada 2.
2. **Se tocó `routes/vida.routes.test.tsx`, que el plan asignaba a la tajada
   4.** No fue opcional: al dejar de ser un cascarón, `VidaActividadesPage`
   rompía ese test. Se arregló sin recortar lo que comprueba (las cuatro rutas
   siguen verificándose; la aserción «nada más que el título» pasó a cubrir
   explícitamente plantilla, hoy y revisión, que es donde sigue siendo cierta).
3. **`VIDA_DAY_LABELS` no estaba en el plan** (que pedía `VIDA_DAY_ORDER` y
   `VIDA_DAY_SHORT_LABELS`). Hizo falta para el `aria-label` de la fila de
   casillas: «L M X J V S D» leído en voz alta no dice nada.
4. **El orden de los grupos** (por `orderIndex`, luego por nombre; alfabético
   dentro) era «propuesta, no decisión» del arquitecto. Queda tomada así.
5. **Los dos ajustes de alcance del arquitecto se respetaron** y hay un test que
   lo vigila: la pantalla **no** pinta el FAB `+` ni «Categorías ›», y el
   criterio 3 se cierra por test de `VidaActivityCard` con un `VidaItem`
   inyectado.

**Lo que queda para el usuario** (criterio 36, la parte de esta tajada). Está
detrás del login y ningún agente entra con credenciales. Con el 5173 arriba y la
sesión iniciada:

1. Ir a **Vida → Actividades** (`/app/vida/actividades`).
2. **Si la cuenta no tiene ninguna actividad:** deberían verse las 13 tarjetas
   de puntos de partida con 6 ya marcadas y el botón **«Crear las 6»**. Tocar
   alguna más y otra menos: el botón cambia el número. Pulsarlo → un solo aviso
   y el catálogo agrupado con exactamente esas, cada una en su categoría.
   *(Si la cuenta ya tiene actividades, este paso no aparece: es correcto.)*
3. Comprobar la línea bajo el título: **«N actividades · M categorías»** con los
   números de lo que se ve. «Sin categoría», si sale, va **al final** y no cuenta
   como categoría.
4. Escribir **«banar»** en el buscador: debería aparecer «Bañarme» y esconderse
   los grupos sin resultados. Escribir **«zzz»**: «Sin resultados para “zzz”» y
   un botón para limpiar.
5. **A 375 px** (o en el móvil): que no haya scroll horizontal y que ningún
   nombre largo se salga de la tarjeta. **Esto no lo pude medir**: el 5173
   estaba apagado.
6. **Con el tema oscuro puesto:** que las cabeceras de grupo, el punto de color
   y las tarjetas se lean sin texto oscuro sobre fondo oscuro. **Tampoco
   medido.**
7. Todas las tarjetas dirán **«sin plantilla»**: es lo esperado en esta tajada
   —nada crea `VidaItem` hasta la tajada 3—, no un fallo.
8. No hay botón `+` ni «Categorías ›»: llegan en las tajadas 2 y 4.

**Tree state:** sin commitear. 26 archivos de código —5 modificados y 21
nuevos—, **todos** bajo `src/features/vida/`; fuera de ahí solo este dossier,
`BOARD.md` y lo que reescribe `graphify update .`. No se montó ningún arnés
temporal (el 5173 estaba apagado), así que no hay nada que borrar, y no se
sembró ningún dato de prueba.

### Tajada 2 — Crear y editar desde la hoja

**Summary for the reviewer:**
1. El catálogo deja de ser de solo lectura: un **FAB «+»** abre la hoja de
   **nueva actividad** (nombre + píldoras de categoría + «+ nueva» con icono y
   color) y el **«···»** de cada tarjeta abre **la misma hoja** con los datos ya
   puestos. Los dos campos son obligatorios y, si la mutación falla, la hoja
   **no se cierra ni pierde lo escrito**.
2. Código nuevo en `src/features/vida/components/{VidaActivitySheet,CreateVidaCategoryStep}`
   y en `src/shared/ui/ColorPicker/`, adonde **se mudó** `HabitColorPicker` con
   su paleta y su test; hábitos lo importa ahora de shared y
   `habit-colors.ts` se quedó en re-exportador + `pickInitialHabitColor`.
3. **Lo que más probablemente rompí: hábitos.** `HabitColorPicker` ya no existe
   y `habit-colors.ts` no contiene la paleta, solo la re-exporta desde
   `@/shared/ui/ColorPicker/color-palette`. Si alguien tenía una rama abierta
   sobre esos archivos, le va a chocar. Los dos consumidores del repo
   (`HabitWizardStep1`, `HabitEditForm`) están migrados y sus tests siguen
   verdes, pero **el paso de categoría de hábitos —`CreateHabitCategoryStep`—
   sigue con su `<input type="color">`**: no lo toqué (ver «Desviaciones»).
   Segundo sospechoso: `VidaActivityCard` ahora **exige** `onEdit`, así que
   cualquier render de la tarjeta sin esa prop no compila. Tercero: el chunk
   inicial pasa de 833,0 a **839,3 kB**.

**What was built:**

*Creado*

| Archivo | Qué hace |
|---|---|
| `src/shared/ui/ColorPicker/color-palette.ts` | La paleta de 17 tonos en dos niveles, tal cual venía de `habit-colors.ts` (mismos hexadecimales: hay datos guardados con ellos), con `normalizeColor` y `findPaletteColor`. Archivo de datos: aquí no entra React. |
| `src/shared/ui/ColorPicker/ColorPicker.tsx` (+`.module.scss`) | El selector, idéntico al que era `HabitColorPicker`: grupo de radios, flechas, cada muestra con su nombre en español y el color de fuera de la paleta enseñado al principio. Solo cambia el nombre, la variable CSS (`--color-picker-swatch`) y la etiqueta por defecto, que pasa de «Color del hábito» a «Color». |
| `src/shared/ui/ColorPicker/ColorPicker.test.tsx` | El test de `HabitColorPicker`, movido con `git mv` y reapuntado a `./color-palette`. Mismas 6 pruebas, ninguna recortada. |
| `src/shared/ui/ColorPicker/index.ts` | Barril: el componente y la paleta. |
| `src/features/vida/components/CreateVidaCategoryStep/` | «+ nueva» categoría **dentro de la hoja**: nombre + `IconPicker` (el diferido del barril) + `ColorPicker`. Al crear, `onCreated(id)` + `pop()`; si falla, `Alert` y el paso se queda abierto. |
| `src/features/vida/components/VidaActivitySheet/` (+`.test.tsx`) | La hoja: `SteppedModal` con `ds="aura"` y `mobileSheet`, nombre, píldoras de categoría, «+ nueva», validación de los dos campos y `Alert` de fallo. El mismo componente crea y edita. 7 casos de test. |

*Modificado*

| Archivo | Qué |
|---|---|
| `src/features/habits/data/habit-colors.ts` | Deja de contener la paleta: re-exporta `HABIT_COLORS`, `HABIT_CORE_COLORS`, `HABIT_EXTENDED_COLORS`, `findHabitColor`, `normalizeHabitColor` y los tipos desde `@/shared/ui/ColorPicker/color-palette`, y **se queda con `pickInitialHabitColor`**, que es dominio de hábitos. `habit-colors.test.ts` **no se tocó** y sigue verde. |
| `src/features/habits/components/HabitFormModal/HabitWizardStep1.tsx:3,118` | `HabitColorPicker` → `ColorPicker` de `@/shared/ui/ColorPicker`. Ya pasaba `label="Color del hábito"`. |
| `src/features/habits/components/HabitFormModal/HabitEditForm.tsx:4,305` | Ídem, **más `label="Color del hábito"` explícito**: antes lo heredaba del valor por defecto del componente de hábitos, y el de shared es genérico. Sin eso, el `aria-label` del grupo habría cambiado en silencio. |
| `src/shared/ui/index.ts` | Exporta `ColorPicker`. |
| `src/features/vida/hooks/useActivityCategories.ts:12-21,42-44,58-60` | `onError` con toast en crear y actualizar categoría, con el mismo `toErrorMessage` que `useActivities.ts`. |
| `src/features/vida/components/VidaActivityCard/VidaActivityCard.tsx` (+`.module.scss`) | El menú «···»: `Popover` + `IconButton icon="ellipsis"` con una entrada, «Editar», igual que `HabitListCard:138-173`. Prop `onEdit` **obligatoria**. «Archivar» se cuelga aquí en la tajada 4. |
| `src/features/vida/components/VidaCatalogGroup/VidaCatalogGroup.tsx` | Pasa `onEdit` a cada tarjeta. No decide nada: la hoja vive en la página. |
| `src/features/vida/pages/VidaActividadesPage.tsx` (+`.module.scss`) | El FAB «+», el estado de la hoja (`sheetOpen`, `editing`, `sheetSession`) y el montaje de `VidaActivitySheet`. El FAB solo aparece en el catálogo lleno: en los puntos de partida no, como en el render. |
| `src/features/vida/pages/VidaActividadesPage.test.tsx` | El caso «la tajada 1 es de solo lectura» se parte en tres: el FAB abre la hoja vacía, el «···» la abre rellena, y «Categorías ›» sigue sin existir (tajada 4). Los mocks de hooks crecen con las tres mutaciones que usa la hoja. |
| `src/features/vida/components/VidaActivityCard/VidaActivityCard.test.tsx` | `onEdit` en el render base + un caso nuevo para el «···» → «Editar». |

*Borrado*

`src/features/habits/components/HabitColorPicker/` entero (`.tsx`, `.module.scss`,
`index.ts`; el test se movió). No queda ni una referencia en `src/`.

**Why this way:**

- **La hoja se resetea con una `key`, no con un `useEffect`.** La primera
  versión copiaba las props al estado en un efecto al abrir y el linter del
  repositorio lo marcó (`Calling setState synchronously within an effect`, el
  error 15 sobre los 14 de la línea base). La página lleva un contador
  `sheetSession` que sube en cada apertura y se lo pasa como `key`: la hoja se
  remonta y nace limpia —incluido el estado de error de las mutaciones—, y al
  cerrar se queda montada para que la animación de salida se vea. Descartado
  montar/desmontar la hoja con `sheetOpen`: mata la animación de cierre.
- **El estado del formulario vive en `VidaActivitySheet`, no dentro del
  `SteppedModal`.** Es lo que hace que el criterio 14 se cumpla: `SteppedModal`
  **desmonta** el contenido de abajo al apilar un paso (`currentContent =
  current?.content ?? children`), así que un estado que viviera ahí se perdería.
  `HabitCreateWizard` lo resuelve igual, con `values` por encima del modal.
- **El cierre va en el `onSuccess` local del `mutate`, no en el hook**
  (criterio 16). El toast del `onError` del hook avisa, pero no es lo que
  sostiene el criterio: si nadie invoca el `onSuccess` local, la hoja
  sencillamente no se cierra. El test lo comprueba llamando al callback a mano.
- **Un solo componente para crear y editar.** El render dice «editar es la
  misma hoja». Cambia el título, el texto del botón y a qué mutación se llama;
  nada más. Descartado el reparto de hábitos (wizard para crear, formulario
  plano para editar): aquí son dos campos, no hay conversación que tener.
- **La paleta se mudó al submódulo `color-palette.ts` y `habit-colors.ts` la
  re-exporta**, en vez de mover el archivo entero. Así `habit-colors.test.ts`
  —que es quien fija los ΔE en OKLab de los 17 tonos— no se toca ni se mueve, y
  `pickInitialHabitColor` se queda donde pertenece. `habit-colors.ts` importa
  del submódulo y no del barril a propósito: el barril arrastra React.
- **El «···» es un `Popover` con `role="dialog"`**, igual que en hábitos. Efecto
  colateral para quien escriba tests: con el menú abierto hay **dos** elementos
  con ese rol, así que la hoja se busca por nombre
  (`findByRole('dialog', { name: /Editar actividad/ })`).

**Verification:**

```
$ pnpm typecheck
> tsc -b --noEmit
(limpio)

$ pnpm lint
✖ 14 problems (14 errors, 0 warnings)
$ pnpm lint | grep -c "features/vida"      →  0   (tras quitar el useEffect)

$ pnpm test
 Test Files  1 failed | 73 passed (74)
      Tests  2 failed | 589 passed (591)
(los 2 fallos siguen siendo SearchSelect.test.tsx, preexistentes)

$ pnpm vitest run src/features/vida
 Test Files  16 passed (16)
      Tests  171 passed (171)

$ pnpm vitest run src/shared/ui/ColorPicker src/features/habits
 (verde: el test movido y los de hábitos, incluido habit-colors.test.ts)

$ pnpm build
dist/assets/index-DVKiRyR4.js       839.30 kB │ gzip: 257.41 kB
dist/assets/app-icons-DCN7AUFR.js   620.20 kB │ gzip: 193.19 kB
dist/assets/IconPicker-B0YfeKFm.js    4.64 kB │ gzip:   1.81 kB

$ grep -rn "free-solid-svg-icons" src/features/vida/ src/shared/ui/ColorPicker/
(ninguno)
$ grep -rn "HabitColorPicker" src
(solo un comentario de cabecera en ColorPicker.tsx que dice de dónde viene)
```

De 581 tests a **591**: 10 nuevos (7 de la hoja, 1 del menú de la tarjeta, 2 de
la pantalla), ninguno roto, ninguno perdido en la mudanza del `ColorPicker`.

**Arnés temporal** (`src/__t2-feat002.html` + `src/__t2-feat002.tsx`, con
`MemoryRouter`, `AuthBootstrapProvider`, `ThemeProvider`, `ToastProvider` y un
`QueryClient` con `setQueryData` para las tres consultas: 3 categorías —una de
34 caracteres—, 5 actividades —una de 61—, una sin categoría y un `VidaItem`).
Servido por el 5173 del usuario, que esta vez **sí estaba arriba** (`probe.sh`:
HTTP 200). **Borrado antes de reportar**: `git status src` no lo lista. No se
arrancó ni se paró ningún servicio y no se sembró ningún dato: la caché del
`QueryClient` del arnés muere con la pestaña.

**Criteria it closes:**

| # | Estado | Evidencia |
|---|---|---|
| 12 | cerrado | `VidaActivitySheet.test.tsx`: con categoría y sin nombre, `createActivity.mutate` **sin llamadas** y se lee «Ponle un nombre: es cómo la vas a reconocer.»; con el nombre a tres espacios y sin categoría, tampoco envía y se leen **los dos** avisos. En el arnés a 375 px, pulsar «Crear» con la categoría puesta y el nombre vacío pinta solo el aviso del nombre (contraste 6,0:1). |
| 13 | cerrado | Con nombre y categoría, `mutate` se llama **una vez** con `{ title: 'Regar las plantas', categoryId: 'casa' }` y `onClose` **no** se ha llamado todavía; al invocar el `onSuccess` local, `onClose` se llama una vez. El refresco sin recargar lo da `invalidateActivityQueries` del hook de F0, que no se tocó. |
| 14 | cerrado | «+ nueva» apila el paso: cabecera «Nueva categoría», `radiogroup` «Color de la categoría» con **17** radios y el `IconPicker`. Escribiendo «Plantas» y eligiendo Menta, `createActivityCategory` recibe `{ name: 'Plantas', color: '#10b981' }`; al volver, la píldora «Plantas» queda `aria-pressed="true"` y el campo de la hoja **sigue diciendo «Regar las plantas»**. Visto también en el arnés. |
| 15 | cerrado | `VidaActivityCard.test.tsx`: el «···» abre el menú y «Editar» devuelve la actividad. `VidaActividadesPage.test.tsx`: desde el «···» de «Bañarme» la hoja abre con «Editar actividad», el nombre puesto y la píldora «Yo» marcada. `VidaActivitySheet.test.tsx`: al guardar llama a **`useUpdateActivityMutation`** (nunca a la de crear) con `{ id, title, categoryId: 'yo' }`; el cambio de grupo lo hace `groupActivitiesByCategory` al reagrupar tras invalidar. |
| 16 | cerrado | Con `createMutation.isError`, tras pulsar «Crear»: `onClose` **sin llamadas**, `Alert` «No pudimos crear la actividad…», el campo **conserva** «Regar las plantas» y la píldora sigue marcada. El toast del `onError` del hook es aviso, no mecanismo. El paso de «+ nueva» tiene su propio `Alert` y tampoco hace `pop()` si falla. |
| 31 | cerrado — medido | Arnés a 375×812. Catálogo: `scrollWidth === clientWidth === 375`, **0** elementos con `right > innerWidth`, y el «···» de las cinco tarjetas en `right: 344` contra un borde de tarjeta en `359` — **dentro**. Con la hoja abierta: `scrollWidth` sigue en 375 y 0 desbordes; las píldoras envuelven y la más larga acaba en `right: 297`. El paso de «+ nueva» con los 17 colores cabe en tres filas sin desbordar. |
| 32 | cerrado — medido | Nombre de 61 caracteres y categoría de 34: el nombre se recorta con elipsis, el «···» no se mueve (sigue en 344) y no hay scroll horizontal. En la hoja, la píldora de 34 caracteres ocupa su propia línea y no desborda. Más el caso de DOM que ya había en los tests. |
| 33 | cerrado — medido | Arnés en oscuro dentro de `[data-ds='aura']`, contrastes calculados sobre el fondo compuesto: título de la hoja 14,9:1 · descripción y etiquetas 7,9:1 · píldora **elegida** 10,3:1 · píldora sin elegir 6,7:1 · «+ nueva» 4,8:1. En claro, la píldora elegida sale **4,6:1** (`#006c49` sobre `primary@18%` compuesto contra el panel opaco `rgb(244,247,251)`) — pasa AA por poco y queda anotado como el punto más justo de la pantalla. Ningún texto oscuro sobre fondo oscuro. |
| 34 | cerrado | Test de la hoja: el DOM pintado no contiene «pendiente», «prioridad», «vencida», «fallaste», «cancelad» ni «tarea». Las palabras son «Cómo la llamas», «Categoría · le da el icono y el color», «+ nueva», «Crear», «Guardar», «Cancelar», «Editar». |
| 35 | cerrado con matiz | typecheck limpio · lint **14/0**, los mismos de la línea base y ninguno en Vida ni en el `ColorPicker` · tests **2 fallos de 591**, los dos preexistentes · ni un import a pelo del barril de Font Awesome, `app-icons` sigue perezoso en **620,20 kB** e `IconPicker` en 4,64 kB. **El matiz:** el chunk inicial pasa de 833,0 a **839,3 kB** (+6,3). No es por iconos —el criterio habla de iconos y ahí está limpio—, es el código de la hoja; pero el número de `ENVIRONMENT.md` vuelve a quedar viejo. |
| 36 | del usuario | Detrás del login. Los pasos, abajo. |

Los criterios 1-11 son de la tajada 1 (aceptada) y 17-27 de las tajadas 3 y 4.

**Risks:**

- **La mudanza del `ColorPicker` toca hábitos, que es la parte viva del repo.**
  `habit-colors.ts` ya no define la paleta: la re-exporta. Todo lo que importaba
  de ahí sigue compilando y `habit-colors.test.ts` sigue verde sin tocarlo, pero
  cualquier rama abierta sobre ese archivo o sobre `HabitColorPicker/` va a
  chocar al fusionar.
- **`VidaActivityCard` exige `onEdit`.** Se hizo obligatoria a propósito (una
  tarjeta sin menú no es la tarjeta del render), pero es un cambio de contrato
  de un componente de la tajada 1.
- **El `Popover` no se cierra al elegir «Editar»**, igual que en `HabitListCard`.
  Se queda abierto detrás de la hoja. Es el comportamiento de la referencia, no
  lo cambié; si molesta, es un arreglo de `Popover` y afecta a hábitos también.
- **La hoja no avisa de nombres repetidos.** Crear dos actividades con el mismo
  nombre está permitido y nadie lo cuestiona. No lo pide ningún criterio.
- **El FAB es `position: fixed`** y se solapa con el final de la lista si se
  hace scroll hasta abajo del todo. En el arnés no tapa ninguna tarjeta, pero
  con muchas actividades la última puede quedar debajo. Queda dicho.
- **`useActivityCategories` estrena `onError`**: quien ya consumiera esas
  mutaciones en silencio ahora ve un toast. Los únicos consumidores son de esta
  tajada.

**Deviations from the plan:**

1. **No arreglé el `<input type="color">` de `CreateHabitCategoryStep.tsx`.**
   El plan decía que, una vez movido el `ColorPicker`, «cambiar esa línea es de
   un renglón». No lo es: son un `<label>`, un `<input type="color">` y un
   `Input` de texto libre (líneas 71-91) los que habría que quitar, y con ellos
   se va **la posibilidad de escribir un hexadecimal a mano**, que hoy existe
   en hábitos. Además **ningún test cubre ese paso** (`git grep
   CreateHabitCategoryStep -- '*.test.tsx'` → nada), así que el cambio entraría
   sin red. Lo dejo anotado tal cual: **sigue siendo un bug latente** —el paso
   de categoría de hábitos ofrece 16 millones de colores donde el resto de la
   app ofrece 17— y ahora el arreglo es trivial de escribir (`ColorPicker` ya
   está en shared), pero es una decisión de producto sobre hábitos, no un
   detalle de esta tajada.
2. **No unifiqué `normalizeVidaText`.** El revisor de la tajada 1 pedía mirarlo
   al mover el `ColorPicker`, «si es una unificación de un renglón limpia». No
   lo es: son **cuatro** implementaciones con firmas distintas
   (`vida-text.utils.ts:13`, `habits/utils/habit-list.utils.ts:38`,
   `habits/utils/habit-form.utils.ts:285`, `shared/icons/icon-search.ts:8`), dos
   de ellas privadas del archivo, y unificarlas es tocar hábitos y el catálogo
   de iconos en la misma tajada en la que ya estoy moviendo el selector de
   color — justo lo que `ENVIRONMENT.md` avisa que contamina la línea base.
   Sitio propuesto cuando alguien lo haga: `src/shared/utils/text.ts`, y el
   momento natural es la tajada 4, que ya vuelve a tocar hábitos-cero.
3. **`HabitEditForm` recibe `label="Color del hábito"` explícito.** El plan
   hablaba solo de cambiar el import y la etiqueta del componente; hacía falta
   esa línea para que el `aria-label` del grupo de radios no cambiara al pasar
   la etiqueta por defecto de «Color del hábito» a «Color».
4. **El reseteo de la hoja se hace con `key` desde la página.** El plan no decía
   cómo; la vía obvia (`useEffect`) añade un error de lint sobre la línea base.
5. **`VidaActivitySheet.test.tsx` tuvo que usar `findBy*` en el paso apilado.**
   `SteppedModal` mueve la cabecera y el cuerpo con dos `AnimatePresence`
   distintas, así que el título del paso nuevo aparece **antes** que su
   contenido. Quien escriba el test de la tajada 3 se va a encontrar lo mismo.
6. **El recuento «N actividades · M categorías» durante la búsqueda no se
   tocó**, como se pidió: sigue siendo el del catálogo entero. Es el hallazgo
   que dejó el revisor de la tajada 1 y no es de esta tajada.

**Lo que queda para el usuario** (criterio 36, la parte de esta tajada). Con el
5173 arriba y la sesión iniciada:

1. Vida → **Actividades**, con al menos una actividad creada.
2. Pulsa el botón **«+»** de abajo a la derecha. Debe abrirse la hoja **Nueva
   actividad** con «Cómo la llamas» vacío y las píldoras de tus categorías.
3. Pulsa **«Crear»** sin escribir nada: no debe crear nada y debe señalar los
   dos campos que faltan. Escribe un nombre y pulsa otra vez: debe seguir
   pidiendo la categoría.
4. Toca **«+ nueva»**: se apila el paso de categoría con nombre, icono y **17
   colores** (no la rueda del sistema). Crea una. Al volver, esa categoría debe
   quedar **marcada** y el nombre que escribiste **seguir ahí**.
5. Pulsa **«Crear»**: la hoja se cierra y la actividad aparece en su grupo sin
   recargar.
6. Abre el **«···»** de una tarjeta → **«Editar»**: la misma hoja con el nombre
   y la categoría puestos. Cámbiale la categoría y guarda: la tarjeta debe
   **cambiar de grupo**.
7. **Prueba a fallar**: con el móvil en modo avión (o el wifi apagado), pulsa
   «Crear». Debe verse un aviso dentro de la hoja, **la hoja no debe cerrarse** y
   lo escrito debe seguir ahí. Esto es lo único que no pude probar contra el
   servidor de verdad: en los tests se fuerza el fallo a mano.
8. En **móvil** y en **tema oscuro**: la hoja ancla abajo, las píldoras
   envuelven y todo se lee. Medido en el arnés a 375 px; confírmalo en tu
   teléfono.
9. La hoja **todavía no** trae «ponerla en mi plantilla» con sus días: es la
   tajada 3. Ni «Archivar» en el «···»: es la 4.

**Tree state:** sin commitear. 21 archivos de código: 11 modificados, 10 nuevos
y 4 borrados (`HabitColorPicker/`, con su test movido a
`src/shared/ui/ColorPicker/ColorPicker.test.tsx`). Fuera de `src/`, este dossier,
`BOARD.md` y lo que reescribe `graphify update .` (2717 nodos, 2911 aristas). El
arnés temporal está borrado y no se sembró ningún dato.

## 4. Review — feature-reviewer

*(una entrada por tajada)*

### Tajada 1 — El primer minuto y el catálogo

**Veredicto: aceptada.** Los diecinueve criterios que la tajada cierra se
comprobaron uno a uno; los tres que el constructor dejó pendientes (31, 33 y la
mitad visual del 32) se midieron aquí con un arnés a 375 px en los dos temas y
salen bien. No apareció ninguna regresión fuera de `features/vida`.

**Lo que hice para revisar** (el 5173 seguía apagado: `probe.sh` → «APAGADO
(nadie escucha)» en 5173 y 5174). Arranqué uno con `preview_start
{name: "xavi-habits-web"}` —cayó en el **5173**, libre— e iba a pararlo por su
`serverId` al terminar, pero ahí me faltó herramienta: **en esta sesión no tengo
`preview_stop`**, así que el servidor que arranqué **sigue vivo en el 5173** y
lo tiene que parar el usuario (o reutilizarlo tal cual: es el puerto bueno, el
que admite el CORS de la API). Queda dicho, no disimulado. Arnés temporal `src/__rev-feat002.html` +
`src/__rev-feat002.tsx` (MemoryRouter, `ThemeProvider`, `ToastProvider`, datos
sintéticos: 3 categorías —una de 38 caracteres—, 5 actividades —una de 61—, una
sin categoría, un `VidaItem` con L X V), **borrado antes de reportar**: `git
status src` vuelve a ser exactamente el árbol del constructor.

**Criterios, uno a uno** (contra la sección 1, literal):

| # | Veredicto | Cómo lo comprobé |
|---|---|---|
| 1 | cumple | Arnés a 375 px: cuatro `<section>` con su `h2` («CASA · 2 actividades», «MASCOTAS · 1 actividad»…), punto del color de la categoría (`--vida-category-color`) y dentro un `article` por actividad con la cápsula del icono de la categoría, su color al 16 % y el nombre. Más `VidaActividadesPage.test.tsx`. |
| 2 | cumple | En el arnés, la actividad con `categoryId: null` cae en el **último** grupo, «Sin categoría», con icono `circle-dot` y sin punto de color. `groupActivitiesByCategory` además manda ahí las que apuntan a una categoría que ya no está en el catálogo, que es más de lo que pedía el criterio. |
| 3 | cumple **por test de componente** (acordado en la sección 2) | Arnés: la tarjeta con `VidaItem` activo pinta las siete letras `L M X J V S D` con `data-on` en L, X y V; las demás dicen «sin plantilla» y no pintan ninguna casilla. `aria-label` = «En tu plantilla: lunes, miércoles y viernes». La mitad «a mano» sigue pendiente hasta la tajada 3, como se pactó. |
| 4 | cumple, **con un matiz que dejo como hallazgo** | La línea es «N actividades · M categorías», sale del array ya filtrado en cliente (las `cancelled` no cuentan) y «Sin categoría» no suma como categoría. **Matiz:** mientras hay búsqueda escrita la línea sigue diciendo el total del catálogo, no lo que queda en pantalla. Con el criterio en la mano («los números coinciden con lo que se ve»), es discutible; no devuelvo por ello porque el criterio describe la cabecera del catálogo y hábitos se comporta igual, pero queda escrito. |
| 5 | cumple | `filterActivitiesBySearch` normaliza minúsculas y tildes (`banar` → «Bañarme»), los grupos vacíos se caen (`.filter(group => group.activities.length > 0)`) y sin resultados sale «Sin resultados para “…”» con botón «Limpiar búsqueda». Tests de `vida-text.utils`, `activity-filters` y de la pantalla. |
| 6 | cumple | Arnés con `mode=start`: **13 píldoras**, exactamente los 13 nombres del criterio, cada una con su icono, **6 marcadas** (`aria-pressed`), ningún campo de texto en pantalla. La categoría no se lee en la píldora pero va puesta en el dato (`categoryName`) y la línea lo dice: «6 elegidas · con su categoría puesta» — igual que el render aprobado, que tampoco la enseña. |
| 7 | cumple | Botón «Crear las 6» en el arnés; cambia el número al tocar otra. `useCreateStartingActivities.test.tsx`: 3 puntos → 3 `createActivity`, todas con `categoryId`. |
| 8 | cumple | El hook resuelve por **nombre normalizado**: «YO» reutiliza, «Compania» encuentra «Compañía», y dos actividades de «Yo» crean **una** categoría (`collectNeededCategoryNames` deduplica por clave normalizada). Las que faltan se crean con nombre, icono y color. |
| 9 | cumple | Arnés: con 0 marcadas el botón dice «Crear» y está `disabled`; `handleCreate` además corta en seco. |
| 10 | cumple | `isPending` deshabilita el botón y las 13 píldoras, y `handleCreate` vuelve a comprobarlo. Test con la promesa retenida: `createActivity` queda en 1. |
| 11 | cumple | El hook **resuelve**, no lanza: `{ created, failed }`. En la pantalla sale un `Alert` «Algunas no se pudieron crear» que **nombra** cada fallo con su motivo, lo creado se desmarca y lo que falló sigue marcado; el toast dice «Creamos 2 de 3», nunca 6. |
| 28 | cumple | Con `isPending` y `fetchStatus: 'fetching'` se pinta el esqueleto (`aria-busy="true"`) y no hay ni puntos de partida ni vacío. |
| 29 | cumple | `isPending && fetchStatus === 'idle'` → «Entra para ver tus actividades» + enlace a `/auth/login`, sin esqueleto. Es exactamente la condición que pedía la sección 2, y el test la fija. |
| 30 | cumple | `isError` → «No pudimos cargar tus actividades» en lenguaje humano + «Reintentar» que llama a `refetch`. |
| 31 | **cumple — lo medí yo** | Arnés a 375 px, catálogo: `documentElement.scrollWidth === clientWidth === 375`, ni un elemento con `right > innerWidth`, las siete casillas dentro de la tarjeta (`right` máximo 223 px). Puntos de partida a 375: también 375/375 y 0 desbordes. La mitad del «···» **no aplica**: esta tajada no lo pinta. |
| 32 | **cumple — lo medí yo** | Título de 61 caracteres y categoría de 38: los dos se recortan con elipsis (`text-overflow` + `min-width: 0` en cadena), la tarjeta se queda en 343 px de ancho y 71 de alto —la misma que las cortas— y no hay scroll horizontal. |
| 33 | **cumple — lo medí yo** | Arnés con `data-theme="dark"` dentro de `[data-ds='aura']`: nombre `#eef2ff` sobre el vidrio compuesto (≈ rgb(26,32,45)) → **≈14:1**; texto apagado y recuento `#7c8aa5` → **≈4,7:1**; casilla marcada `#4edea3` sobre su propio tinte → **≈6:1**; el icono de la cápsula entra por `color-mix` contra `--color-text` y se aclara solo. Ningún texto oscuro sobre fondo oscuro, y el punto de color de la cabecera se distingue en los dos temas. |
| 34 | cumple | Leí la pantalla pintada en los dos modos: no aparece «pendiente», «prioridad», «vencida», «cancelada», «eliminar», «tarea» ni ninguna palabra de culpa. El texto de los fallos («Lo que sí se creó ya está en tu catálogo») tampoco culpa a nadie. |
| 35 | cumple | Corrido entero por mí, no leído del reporte: `pnpm typecheck` limpio · `pnpm lint` **14 errores / 0 warnings** (los mismos de la línea base; el último sigue siendo el de `src/test/render.tsx`) · `pnpm test` **2 fallos de 581** (`SearchSelect` ×2, preexistentes; 51 tests más que la línea base y ninguno roto). Ni un import a pelo de `@fortawesome/free-solid-svg-icons` en Vida. **El chunk inicial sube a 833,0 kB** (+15,4 sobre 817,6): el criterio dice «no crece **por iconos**» y ahí está limpio (`app-icons` sigue perezoso en 620,20 kB), así que el criterio se cumple — pero el número de la línea base de `ENVIRONMENT.md` ya no es el de hoy y **alguien tiene que actualizarlo** (no lo toco: el protocolo me lo prohíbe). |
| 36 | **del usuario, sigue pendiente** | Está detrás del login y no entro con credenciales. Los pasos están abajo. |

Los criterios 12-27 son de las tajadas 2-4 y no se revisan aquí.

**Qué se rompió alrededor** (cómo busqué, no solo el resultado):

- **El grafo no servía para esto y lo digo:** `graphify explain
  "filterActivitiesBySearch"` devuelve el nodo **ya modificado** (el constructor
  corrió `graphify update .`), con una sola arista saliente a
  `normalizeVidaText`. Para «¿quién dependía de esto **antes**?» lo que vale es
  el árbol de HEAD, así que fui por ahí: `git grep -n
  "filterActivitiesBySearch" be46e91 -- src` → **una sola línea**, su propia
  definición; en HEAD no tenía ni un consumidor de producto, solo sus tests. El
  estrechamiento a `title` no puede romper ninguna pantalla existente. Riesgo
  real: futuro, y está anotado por el constructor.
- **`useActivities` (el `onError` nuevo):** `git grep -ln` sobre HEAD →
  `useActivities.ts` y su test, nada más. Los únicos consumidores nuevos son de
  esta tajada. Ningún consumidor antiguo cambia de comportamiento porque no
  había ninguno.
- **`vida-date.utils.ts`:** solo se **añadió** al final (`VIDA_DAY_ORDER`,
  `VIDA_DAY_SHORT_LABELS`, `VIDA_DAY_LABELS`); leí el diff entero y ninguna
  función anterior cambia. Sus consumidores previos —`useActivityFollowUps.ts`,
  `invalidate-vida-queries.ts`— siguen importando lo de siempre.
- **Las rutas y el cromo:** `vida.routes.test.tsx` es el único archivo tocado
  fuera de las páginas/utilidades del catálogo. Leí el diff: las cuatro rutas se
  siguen comprobando y la aserción «nada más que el título» **no se recortó**,
  se volvió un `it.each` sobre plantilla, hoy y revisión, que es donde sigue
  siendo verdad. `app-nav.config.ts`, `AppLayout`, `routes.tsx` y
  `vida-paths.ts`: intactos (`git status` no los lista). Las píldoras de Vida no
  cambian.
- **Hábitos y `shared/`:** ni un archivo tocado. `git diff --stat -- src` son
  cinco archivos, **los cinco bajo `src/features/vida/`**. Lo que el plan
  dejaba para la tajada 2 —mover `HabitColorPicker` a `shared/ui/ColorPicker`—
  no se adelantó, que era el riesgo grande para hábitos.
- **La suite entera**, no solo la de Vida: 581 tests, los 2 fallos de siempre.
  Si algo de hábitos, `shared` o `layouts` se hubiera movido, ahí se vería.

**Estados que nadie construye:**

- **Vacío, cargando, error y sin sesión:** construidos y comprobados (criterios
  6, 28, 29, 30). Es lo mejor de esta tajada.
- **Móvil 375 y texto largo:** medidos aquí, bien.
- **Tema oscuro:** medido aquí, bien.
- **Sin permisos:** no aplica más allá de «sin sesión»: el módulo no tiene roles.
- **Hallazgo — el cargando a medias de las casillas.** La pantalla decide con
  `useActivitiesQuery`, pero las casillas de plantilla vienen de
  `useVidaItemsQuery`, que va por su cuenta. Si las actividades llegan primero,
  las tarjetas dicen **«sin plantilla»** durante ese hueco aunque la actividad
  sí esté en la plantilla, y luego cambian. El `aria-busy={isVidaItemsPending}`
  lo anuncia a un lector de pantalla, pero visualmente es una afirmación falsa
  breve. Hoy no se nota —nada crea `VidaItem` hasta la tajada 3—, pero en la
  tajada 3 sí: **quien la construya tiene que resolverlo** (o esperar a las dos
  consultas, o no afirmar «sin plantilla» mientras la segunda está en vuelo).
  No devuelvo la tajada por esto: en su alcance actual el estado no es
  observable.
- **Hallazgo menor:** en el `Alert` de fallos, la lista usa `failure.name` como
  `key`; si una categoría y una actividad fallaran con el mismo nombre, React
  avisaría por clave duplicada. Cosmético.

**¿Duplica algo que ya existía?** (contra la sección 2)

- **No se creó ningún documento GraphQL, ningún hook de consulta, ninguna
  `vidaKeys`, nada en `invalidate-vida-queries.ts`.** Verificado en la lista de
  archivos nuevos: todos son componentes, datos, utilidades puras y un
  orquestador. `contracts.test.ts` no se tocó.
- **`useCreateStartingActivities` orquesta sobre `api/activities.api.ts` y
  `api/activity-categories.api.ts`**, tal como autorizó el arquitecto, y su
  comentario de cabecera **dice por qué** se salta los hooks (diez toasts por un
  solo gesto). Es el único sitio que lo hace: comprobado, ningún otro archivo de
  Vida importa `api/` directamente salvo los hooks de F0.
- **Ningún selector de color ni de iconos nuevo**, y `HabitColorPicker` sigue
  donde estaba: el movimiento a `shared/ui/ColorPicker` es de la tajada 2 y no
  se adelantó.
- **Hallazgo — la cuarta copia de «normalizar texto».** `normalizeVidaText`
  (`vida-text.utils.ts:13`) repite el `toLowerCase + NFD + quitar diacríticos`
  que ya está en `habits/utils/habit-list.utils.ts:38`,
  `habits/utils/habit-form.utils.ts:285` y `shared/icons/icon-search.ts:8`. El
  arquitecto lo autorizó explícitamente («imitar la forma, sí; importar, no»)
  para no atar Vida a hábitos, y no devuelvo por ello — pero con cuatro copias
  el sitio que pide esa función a gritos es `src/shared/utils/`, y conviene
  decidirlo cuando se mueva el `ColorPicker` en la tajada 2, no más tarde.
- **`VIDA_DAY_LABELS` fuera del plan:** justificado (el `aria-label` de la fila
  de letras) y vive donde el plan puso las otras dos constantes. No duplica
  nada: no había etiquetas de día de la semana en el repo.

**Lo que no revisé:** el recorrido real con sesión (criterio 36, estructural:
los agentes no entran con credenciales) y el comportamiento con más de 200
actividades (`CATALOG_LIMIT`), que no tengo cómo montar sin datos reales; la
línea «Mostrando las primeras 200…» está escrita y su condición leída, pero no
ejecutada contra un lote grande.

**Veredicto: aceptada** — los criterios de la tajada se cumplen con evidencia,
la línea base no empeora y no hay regresión fuera del módulo. Quedan cuatro
hallazgos anotados (el recuento durante la búsqueda, el «sin plantilla» mientras
`vidaItems` está en vuelo —**a resolver en la tajada 3**—, la cuarta copia del
normalizador y la clave duplicada del `Alert`) y una tarea que no es mía: la
línea base del **paquete** en `ENVIRONMENT.md` pasa de 817,6 kB a **833,0 kB**.

**Para el usuario — los pasos de esta tajada** (criterio 36; con tu 5173 arriba
y sesión iniciada; el 5173 que arranqué sigue arriba —no pude pararlo, ver
arriba—, así que sirve tal cual):

1. Entra en **Vida → Actividades**.
2. Si la cuenta no tiene ninguna actividad verás **13 puntos de partida** con 6
   marcados y el botón **«Crear las 6»**. Toca alguno más y alguno menos: el
   número del botón cambia. Púlsalo → un solo aviso y el catálogo agrupado.
3. Mira la línea bajo el título: **«N actividades · M categorías»**. «Sin
   categoría», si aparece, va al final y no cuenta como categoría.
4. Escribe **«banar»** en el buscador (sin tilde y sin la ñ): debería aparecer
   «Bañarme». Escribe **«zzz»**: «Sin resultados» y un botón para limpiar.
5. Todas las tarjetas dirán **«sin plantilla»**: es lo correcto en esta tajada.
6. No hay botón `+` ni «Categorías ›»: llegan en las tajadas 2 y 4.

---

### Tajada 2 — Crear y editar desde la hoja

**Veredicto: aceptada.** Los cinco criterios propios de la tajada (12, 13, 14,
15, 16) se cumplen, y los cuatro transversales que se vuelven a pedir en cada
tajada (31, 32, 33, 34) los volví a medir yo sobre lo que esta tajada pinta —la
hoja—, no sobre el informe. La mudanza del `ColorPicker` a `shared/ui` no rompió
hábitos. Quedan seis hallazgos anotados, ninguno de ellos motivo de devolución.

**Lo que hice para revisar.** Línea base entera por mi cuenta: `pnpm typecheck`
limpio; `pnpm lint` **14 errores / 0 warnings** (los mismos de
`ENVIRONMENT.md`, ninguno en `features/vida` ni en `shared/ui/ColorPicker`);
`pnpm test` **2 fallos de 591**, los dos de `SearchSelect.test.tsx`,
preexistentes; `pnpm build` → `index` **839,30 kB** (gzip 257,41), `app-icons`
**620,20 kB** perezoso e `IconPicker` **4,64 kB**, idénticos a lo reportado. Y un
**arnés propio** (`src/__rev-t2.{html,tsx}`, borrado: `git status src` no lo
lista) que monta `VidaActivitySheet` con `QueryClientProvider` +
`setQueryData(vidaKeys.categories.list(), …)`, cuatro categorías —una de 44
caracteres— y una variante `?empty=1` sin ninguna.

**Criterios, uno a uno** (contra la sección 1, literal):

| # | Veredicto | Cómo lo comprobé |
|---|---|---|
| 12 | **cumplido** | En el arnés a 375 px, pulsando «Crear» con la hoja vacía se leen **los dos** avisos a la vez: «Ponle un nombre: es cómo la vas a reconocer.» y «Elige una categoría: le da el icono y el color.»; al tocar una píldora el aviso de categoría desaparece. Que no salga nada hacia la API lo fijan los tests (`createActivity.mutate` sin llamadas, también con el nombre a tres espacios). `handleSubmit` (`VidaActivitySheet.tsx:59-77`) valida con `name.trim()` y `!categoryId` **antes** de cualquier `mutate`. |
| 13 | **cumplido** | `createMutation.mutate({title, categoryId}, { onSuccess: onClose })`: el cierre cuelga del `onSuccess` **local**. El refresco sin recargar lo da `invalidateActivityQueries` en el `onSuccess` del hook de F0, que esta tajada no tocó (`useActivities.ts:48-55`). Test: `mutate` una vez, `onClose` aún no; tras invocar el `onSuccess`, `onClose` una vez. |
| 14 | **cumplido, con una comprobación que no pude hacer en el navegador** | El estado (`name`, `categoryId`) vive en `VidaActivitySheet`, **por encima** del `SteppedModal`, así que apilar el paso no lo toca: el reparto es correcto y es lo que sostiene el criterio. El test lo verifica de punta a punta (17 radios en el paso, `createActivityCategory` con `{name:'Plantas', color:'#10b981'}`, al volver la píldora `aria-pressed="true"` y el campo **sigue** con «Regar las plantas»). En mi arnés el paso apilado **no llegó a pintarse**: la cabecera cambió a «←» pero el contenido se quedó en el de abajo. La causa es del entorno, no del código —`document.visibilityState === 'hidden'`, así que las dos `AnimatePresence` del `SteppedModal` no avanzan un solo fotograma; `ENVIRONMENT.md` y el protocolo avisan de esto—. Lo dejo dicho, no disimulado: el paso «+ nueva» lo confirma el usuario en el recorrido (paso 4). |
| 15 | **cumplido en la parte comprobable** | La hoja es la misma: `activity` presente → título «Editar actividad», campos precargados desde las props y `updateMutation` (nunca la de crear) con `{id, title, categoryId}`. El «···» de la tarjeta (`VidaActivityCard.tsx`) solo llama a `onEdit(activity)`: no muta nada. **El «cambia de grupo» lo comprobé por lectura, no ejecutándolo**: depende de que `invalidateActivityQueries` refresque y de que `groupActivitiesByCategory` (tajada 1, con sus tests) reagrupe. Va al recorrido manual. |
| 16 | **cumplido** | Nada cierra la hoja salvo el `onSuccess` local; con `isError` se pinta un `Alert variant="danger"` **dentro** de la hoja y el estado del formulario no se toca (test: `onClose` sin llamadas, el campo conserva el texto, la píldora sigue marcada). El paso de categoría tiene su propio `Alert` y **no hace `pop()`** si la mutación falla (`CreateVidaCategoryStep.tsx:47-58`), así que tampoco se pierde lo escrito ahí. El `onError` con toast nuevo en `useActivityCategories.ts` es aviso, no mecanismo, y está bien colocado: en el hook, como los de `useActivities.ts`. |
| 31 | **cumplido — medido por mí** | Arnés a 375×812: `scrollWidth === clientWidth === 375` con la hoja abierta y **0** elementos con `right > 375` o `left < 0`. La hoja ocupa 8→368. |
| 32 | **cumplido — medido por mí** | Categoría de 44 caracteres: la píldora envuelve a su propia línea y termina en `right: 336`, dentro de la hoja; sin scroll horizontal. `.option` lleva `max-width: 100%` + `text-overflow: ellipsis`, y `.options` `flex-wrap`. |
| 33 | **cumplido — medido por mí** | Tema oscuro, contrastes compuestos sobre el panel: título 14,9:1 · píldora elegida 9,8:1 · píldora sin elegir 7,9:1 · «+ nueva» 4,8:1 · aviso de error 9,8:1. Ningún texto oscuro sobre fondo oscuro. El punto más justo sigue siendo el que anotó el constructor: la píldora elegida en tema **claro**, 4,6:1 — pasa AA, pero es el que primero se rompería si alguien toca `--color-primary`. |
| 34 | **cumplido** | El texto pintado que leí en el navegador es «Nueva actividad», «Dos cosas: cómo la llamas y a qué categoría pertenece», «Cómo la llamas», «Categoría · le da el icono y el color», «+ nueva», «Cancelar», «Crear». Ni culpa ni gestión de proyectos. El test lo fija por lista negra. |
| 35 | **cumplido con el matiz del paquete** | Mis cuatro comandos, arriba. Ni un import a pelo de `@fortawesome/free-solid-svg-icons` en `features/vida` ni en `shared/ui/ColorPicker`; `app-icons` sigue perezoso. El chunk inicial pasa de 833,0 a **839,3 kB** (+6,3): no es por iconos —que es lo que el criterio fija—, es el código de la hoja. La **línea base de `ENVIRONMENT.md` vuelve a quedar vieja**; no la toco (no es mía), queda dicho por segunda vez. |
| 36 | **del usuario** | Estructural: la pantalla está tras el login y los agentes no entran con credenciales. Pasos abajo. |

**Qué rompí buscando romper** (dónde miré, no solo el resultado):

- **El grafo no servía para esta pregunta.** `graphify explain "HabitColorPicker"`
  → «No node matching». El constructor corrió `graphify update .` después de
  mover el archivo, así que el grafo ya refleja el árbol de **después** y la
  pregunta «quién dependía de esto» no tiene a quién preguntársela ahí. La hice
  contra HEAD, que es el estado anterior: `git grep -l HabitColorPicker HEAD -- src`
  → cinco archivos (el propio componente, su índice, su test, `HabitWizardStep1`
  y `HabitEditForm`); `git grep -l habit-colors HEAD -- src` → seis
  (`HabitCreateWizard`, `HabitFormModal.test`, `habit-colors.test.ts`,
  `vida-starting-points.test.ts` y los dos del selector). **Los dos consumidores
  de componente están migrados; los cuatro de la paleta siguen importando de
  `data/habit-colors`, que re-exporta**, y no se tocaron.
- **La paleta es la misma, hexadecimal a hexadecimal.** Comparé los 17 colores
  de `HEAD:habit-colors.ts` con `shared/ui/ColorPicker/color-palette.ts`
  ordenados: **idénticos**. Importaba porque hay hábitos guardados con esos
  valores y `habit-colors.test.ts` fija los ΔE en OKLab: ese test no se tocó y
  pasa.
- **El componente también.** `diff` entre el `HabitColorPicker.tsx` de HEAD y el
  `ColorPicker.tsx` nuevo: solo cambian el nombre, los imports, la variable CSS
  (`--habit-swatch` → `--color-picker-swatch`, renombrada también en el `.scss`)
  y la etiqueta por defecto. El cambio de etiqueta es el único con efecto
  observable y está compensado con el `label="Color del hábito"` explícito en
  `HabitEditForm` — correcto: sin eso el `aria-label` del `radiogroup` habría
  cambiado en silencio.
- **Ningún import cruzado nuevo de `features/vida` a `features/habits`:** grep
  sobre `src/features/vida` y `src/shared/ui/ColorPicker` → solo comentarios de
  procedencia… **salvo uno real, que ya venía de la tajada 1**:
  `src/features/vida/data/vida-starting-points.test.ts:2` importa
  `HABIT_CORE_COLORS` de `@/features/habits/data/habit-colors`. Funciona (es la
  re-exportación) y es un test, pero ahora que la paleta vive en shared ese
  import **debería apuntar a `@/shared/ui/ColorPicker/color-palette`**. Hallazgo,
  no regresión: no lo introdujo esta tajada.
- **Lo que vive al lado en la misma pantalla:** `VidaActivityCard` estrena una
  prop **obligatoria** (`onEdit`) y `VidaCatalogGroup` la encadena. Comprobé que
  no hay ningún otro sitio que renderice la tarjeta (solo el grupo y sus tests),
  así que el cambio de contrato no deja a nadie sin compilar — y `pnpm typecheck`
  lo confirma.
- **Lo que el constructor señaló como más probable roto** era hábitos: es donde
  empecé. `pnpm vitest run src/features/habits src/shared/ui/ColorPicker` entra
  en el total verde de los 589 y `habit-colors.test.ts` sigue intacto en el árbol
  (`git status` no lo lista).
- **Los toasts salen de los hooks, no del api:** ningún componente de esta
  tajada importa de `features/vida/api/`; los únicos que lo hacen son los propios
  hooks y `useCreateStartingActivities`, que **sigue siendo el único** que se
  salta el toast por mutación y da uno agregado (`:144,151`) con su comentario de
  por qué. El `onError` nuevo está solo en las dos mutaciones de categoría que
  estrena la hoja.
- **La plantilla no se adelantó:** grep de `Switch`, «plantilla», `days` y
  `VidaItem` en `VidaActivitySheet/` y `CreateVidaCategoryStep/` → **nada** fuera
  de la línea del comentario que dice que llega en la tajada 3. `useVidaItems.ts`
  no se tocó (sigue sin `onError`, que es de la tajada 3). El FAB no aparece en
  los puntos de partida: se pinta después de los cuatro `return` tempranos
  (`isPending && fetchStatus==='idle'`, `isPending`, `isError`, `activityCount===0`).
- **El FAB es el primero de la app** (`position: fixed`, `z-index: 20`). Miré si
  choca con algo del cromo: `AppLayout` solo tiene una barra **sticky arriba**,
  no hay barra inferior, así que no tapa navegación. Lo que sí puede tapar es la
  última tarjeta al final del scroll, como el propio constructor avisó.

**Estados que nadie construye:**

- **Vacío / cargando / error de las categorías, dentro de la hoja: los tres se
  ven igual y ninguno se explica.** `const { data: categories = [] } = useActivityCategoriesQuery()`
  descarta `isLoading` y `isError`, así que mientras cargan, si fallan o si no
  hay ninguna, la hoja pinta la etiqueta «Categoría» y **solo «+ nueva»**.
  Medido con la variante `?empty=1` del arnés. No devuelvo por esto —los
  criterios 28-30 son de la pantalla y se cerraron en la tajada 1, y la hoja deja
  una salida (crear una categoría)—, pero es el agujero de la tajada: una hoja
  que aparece sin píldoras mientras la consulta está en vuelo parece una hoja
  rota, y con la sesión caída no dice nada. **Hallazgo para la tajada 3**, que
  vuelve a abrir este archivo.
- **Texto largo y móvil:** medidos arriba, bien.
- **Sin permisos:** no aplica por dentro de la hoja (la pantalla entera ya lo
  resuelve con el mensaje de sesión del criterio 29, tajada 1).
- **Error de mutación:** construido y probado (criterio 16). Es el único estado
  de fallo que esta tajada tenía que traer, y está.

**¿Duplica algo que ya existía?** (contra la sección 2) No.
`SteppedModal`, `FormField`, `Input`, `Button`, `Alert`, `Popover`,
`IconButton`, `AppIcon` e `IconPicker` salen todos de `shared/ui` —el
`IconPicker` **del barril**, que es el diferido, no de `IconPicker/IconPicker`—.
Ningún documento GraphQL nuevo, ninguna clave nueva en `vidaKeys`, nada nuevo en
`invalidate-vida-queries.ts`, ninguna paleta nueva: se **movió** la que había,
que es exactamente lo que decía «Where it does NOT go». `pickInitialHabitColor`
se quedó en hábitos, como estaba escrito. Dos cosas se repiten y las anoto sin
devolver por ellas: `toErrorMessage` es ahora **idéntica** en `useActivities.ts`
y `useActivityCategories.ts` (dos copias de tres líneas, candidata al
`src/shared/utils/text.ts` que el constructor propone), y `CreateVidaCategoryStep`
acepta un `initialName` que **nadie le pasa** — o se usa (prellenar la categoría
con lo escrito sería un detalle bonito) o sobra.

**Hallazgos** (ninguno devuelve la tajada):

1. Vacío/cargando/error de categorías dentro de la hoja, indistinguibles (arriba).
2. `vida-starting-points.test.ts:2` debería importar la paleta de shared.
3. `toErrorMessage` duplicada en dos hooks.
4. `initialName` sin ningún llamante en `CreateVidaCategoryStep`.
5. El `<input type="color">` de `CreateHabitCategoryStep.tsx:71-91` **sigue ahí**:
   hábitos ofrece 16 millones de colores donde el resto de la app ofrece 17.
   Doy por buena la desviación del constructor —quitarlo se lleva por delante el
   hexadecimal a mano y no hay ni un test que cubra ese paso—, pero ahora es una
   decisión de producto sobre hábitos que conviene tomar, no olvidar.
6. El `Popover` del «···» no se cierra al elegir «Editar» y se queda abierto
   detrás de la hoja. Es el comportamiento de `HabitListCard`, así que arreglarlo
   es tocar hábitos: no es de esta tajada.

**Lo que no revisé:** el recorrido real con sesión (criterio 36, estructural), el
paso apilado de «+ nueva» **pintado** en un navegador (ventana oculta, sin
fotogramas: solo por test y por lectura), y el «cambia de grupo» del criterio 15
ejecutado contra datos reales.

**Veredicto: aceptada** — los cinco criterios de la tajada se cumplen con
evidencia, los cuatro transversales los volví a medir sobre la hoja, la línea
base no empeora y la mudanza del selector de color no dejó ni un consumidor
roto en hábitos.

**Para el usuario — los pasos de esta tajada** (criterio 36; con tu 5173 arriba
y la sesión iniciada):

1. **Vida → Actividades**, con al menos una actividad en el catálogo.
2. Toca el **«+»** de abajo a la derecha: se abre **Nueva actividad**.
3. Pulsa **«Crear»** con la hoja vacía: no debe crearse nada y deben señalarse
   los dos campos. Escribe un nombre y vuelve a pulsar: debe seguir pidiendo la
   categoría.
4. Toca **«+ nueva»**: se apila el paso de categoría con nombre, icono y **17
   colores**. Créala. Al volver, esa categoría debe quedar **marcada** y el
   nombre que escribiste **seguir ahí**. *(Esto es lo que no pude ver pintado:
   míralo con atención.)*
5. Pulsa **«Crear»**: la hoja se cierra y la actividad aparece en su grupo sin
   recargar.
6. Abre el **«···»** de una tarjeta → **«Editar»**, cámbiale la categoría y
   guarda: la tarjeta debe **cambiar de grupo**. *(Tampoco pude ejecutarlo.)*
7. **Prueba a fallar**: con el wifi apagado, pulsa «Crear». Debe verse el aviso
   dentro de la hoja, **la hoja no debe cerrarse** y lo escrito debe seguir ahí.
8. De paso, en **hábitos**: crea un hábito y edita otro, y mira que el selector
   de color sigue siendo el de siempre. Es lo que esta tajada movió de sitio.
9. Todavía **no** hay «ponerla en mi plantilla» (tajada 3) ni «Archivar»
   (tajada 4).
