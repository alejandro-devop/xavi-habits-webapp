---
id: FEAT-002
title: El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días
status: specified
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

## 3. Construction — feature-builder

## 4. Review — feature-reviewer
