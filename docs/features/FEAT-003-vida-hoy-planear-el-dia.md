---
id: FEAT-003
title: Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos
status: planned
architect: yes    # pantalla nueva sin hermana (agenda con geometría de tiempo), el SDL de Vida cambia, y los ajustes de Vida tocan otra feature
area: features/vida
requested: 2026-09-20
updated: 2026-09-20
---

# FEAT-003 — Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos

## 1. The request — feature-analyst

**Summary for whoever's next:** F2 del plan de Vida. Dos mitades: primero **la
plantilla aprende la hora** —cada ítem de Vida pasa a decir «a esta hora hago
esto, este tiempo»— y aparecen los **ajustes de Vida** (a qué hora empieza y
termina tu día); después `/app/vida/hoy` deja de ser un cascarón y pasa a ser
**la agenda del día con presupuesto de tiempo**: arriba cuánto queda y cómo está
repartido, debajo los bloques del `activityDayPlan` y, entre ellos, los **huecos
libres** que ofrecen de la plantilla solo lo que cabe. La primera tajada es la
plantilla con hora y duración más los ajustes: sin eso, «armar desde la
plantilla» no sabe a qué hora poner nada.

**⚠️ Esta feature depende de un cambio de backend que se está construyendo en
paralelo.** Está detallado abajo, en «Dependencia externa».

**What problem it solves:** el usuario ya tiene nombradas las cosas que hace
(FEAT-002) y los días en que le tocan, pero **no tiene dónde decidir a qué hora
va cada una**. El problema no es «falta un calendario»: es que una lista de
cosas «para la mañana» no se lee como un día —se lee como un montón—, y a las
10:30 de un viernes no se sabe *cuánto tiempo queda de verdad* ni *qué de lo
suyo cabe en el rato libre*. De ahí que la plantilla tenga hora y que la guía
viva en los huecos: la pantalla tiene que enseñar **dónde hay sitio y qué encaja
ahí** sin que haya que preguntárselo. Y el segundo problema, gemelo: **planear
cuesta**, así que si armar mañana desde la plantilla no se hace en menos de un
minuto, no se hace ninguna noche.

**Who it's for:** el usuario del módulo Vida en dos momentos del día. (a) Por la
mañana o a media mañana, mirando cómo viene el día y rellenando un hueco que le
apareció. (b) Por la noche, armando el día siguiente desde la plantilla — y, una
vez por semana, dejando la semana entera lista. Es la pantalla que más se abre
del módulo: es el índice de Vida (`/app/vida` redirige aquí).

**User's words:**

> «Vamos con F2, Hoy: planear el día.»

Y, al decidir cómo funciona la plantilla —esto es lo que cambió el modelo—:

> «quiero poder decir "A esta hora hago esto x tiempo" porque ya probé en el
> pasado aplicaciones que me dejan poner varias actividades "para hacer en la
> mañana" y todo lo que ve mi cerebro al otro día es una lista de items
> abrumadora, no ve orden, no ve estructura. Prefiero hacer una actividad a un
> tiempo más tarde de lo que estaba porque me levanté tarde o porque empecé
> tarde, o antes si tengo tiempo. La planeación no es una regla rígida, es una
> plantilla de lo que quiero que sea mi día, pero también quiero ver el vs de lo
> planeado con lo ejecutado para posteriormente evaluar qué puedo cambiar;
> ejemplo: no me está dando hacer ejercicio en las mañanas porque necesito dormir
> más».

Y sobre lo que se hace de improviso:

> «al momento de iniciarla indico con selectores pre-diseñados el tiempo (15,
> 30, 45, 1h u opción libre)»

Y el pedido original del módulo, del 2026-09-18, que enmarca todo:

> «Como siempre me soñé el módulo de actividades y follow-ups: es más como una
> plantilla de mi vida, donde planeo día a día lo que voy a hacer y puedo seguir
> la plantilla o registrar lo que se sale, y al final del día evaluar cómo me
> va. Con el tiempo el sistema entiende y me ayuda mejor a planear.»

Los renders aprobados en dirección son `docs/vida/assets/03-vida-agenda.html`
(agenda + presupuesto + hoja de rellenar un hueco + escritorio) y
`docs/vida/assets/04-vida-planeado-ejecutado.html`, **marcos A y C**: el día
futuro ya planeado y la vista de semana. **El marco B (ejecutado con
variaciones) es F3 y no entra aquí.** Se abren en
`http://localhost:5173/docs/vida/assets/03-vida-agenda.html` y `…/04-vida-planeado-ejecutado.html`.
Las notas al pie de los dos renders son parte de la spec. **Dos cosas del render
quedan desactualizadas por D6/D1** y mandan estas líneas, no el dibujo: la
duración de una sugerencia sale de su ítem de plantilla (no de «sueles tardar
55 min»), y «armar desde la plantilla» copia la hora del ítem (no la propone).

**Dependencia externa — el API cambia, y no desde aquí**

El plan de Vida decía «backend intocable en la v1»; **el usuario lo cambió** al
resolver D6. El cambio se está construyendo **en `~/Developer/xavi-platform-node`
por otro agente**, y desde este repositorio **no se toca**:

| Dónde | Qué gana |
|---|---|
| `VidaItem` | `startTime: String` (HH:mm, **opcional**) y `durationMinutes: Int` (**opcional**) |
| `VidaItemCreateInput`, `VidaItemUpdateInput` | los dos mismos campos |
| `vidaSuggestionsForDate` | los devuelve dentro de `item` |
| `UserSettings` | `vidaDayStartTime` y `vidaDayEndTime` (HH:mm, **nulos** por defecto), por `mySettings` / `updateMySettings`, que ya existen |

Consecuencia para quien verifique: **los tests de contrato validan contra el SDL
vendorizado en `src/features/vida/graphql/schema/`, no contra el servidor**. Con
el SDL recopiado, `pnpm test` puede estar verde mientras la API desplegada en
Cloud Run todavía rechaza los campos nuevos. Si una consulta real falla con
«campo desconocido», **no es un fallo del constructor**: es que el despliegue no
ha llegado. El **recorrido real del usuario (criterio 57) no se puede hacer
hasta que el API desplegada lleve el cambio**, y eso es de él, no de un agente.

**Out of scope:** (lo que alguien podría dar por incluido y NO lo está)

- **Todo F3 — vivir el día.** Empezar un bloque, el cronómetro, terminar, la
  sesión abierta fija abajo, registrar tiempo pasado, registrar algo fuera del
  plan, «Lo hice», «¿qué pasó?», y las etiquetas *calcado · +N min · empezó +N ·
  −N min · no hecho · fuera del plan · sin dato · movido*. En F2 **ningún bloque
  tiene botón de empezar** y el presupuesto **no** tiene los colores *hecho · en
  marcha · seguido · de más · fuera del plan · sin dato*: solo **planeado** y
  **libre**. El marco B del render 04 y los tramos ejecutados del render 03 son
  F3, aunque estén dibujados. El «ver el vs de lo planeado con lo ejecutado» que
  pide el usuario **es exactamente F3 + F5**: F2 construye la mitad *planeado* de
  esa comparación.
- **`completedAt` / `isCompleted`.** El API los tiene (`ActivityDayPlanItem`,
  `ActivityDayPlanItemEditInput`) y **no se usan en F2**.
- **El panel «Cómo va el día»** del escritorio (plan frente a real): es F3/F5
  (D8, resuelta).
- **La revisión del día (F5) y «el sistema entiende» (F6).** Las etiquetas
  derivadas del historial que aparecen en los renders —«sueles tardar 55 min»,
  «a tu ritmo real», «movido aquí · antes 8:30», «4 de 5 días», «los jueves son
  tu mejor día», el «seguiste N de M» de la semana— **no entran en F2**. D1 lo
  cierra: **nada se deriva del historial en esta feature**.
- **La pantalla de plantilla completa sigue siendo F4.** Aquí el `VidaItem` gana
  hora y duración **desde la hoja del catálogo** que ya existe. La vista de
  semana tipo, el orden, las notas del ítem y la gestión general de la plantilla
  (`/app/vida/plantilla`) siguen fuera.
- **Los ajustes de Vida son dos campos y nada más:** a qué hora empieza y a qué
  hora termina tu día. Ni duración por defecto, ni franjas, ni notificaciones, ni
  tocar el resto de `UserSettings`.
- **Más cambios de backend.** Los cuatro campos de la tabla de arriba y se
  acabó. Cualquier otro hueco del API se anota, no se pide.
- **El catálogo no se toca** más allá de la hoja y la tarjeta: crear una
  actividad nueva desde la hoja de «poner algo en un hueco» no entra; se elige
  entre las que ya existen y, si no hay ninguna, se enlaza a
  `/app/vida/actividades`.
- **Arrastrar y soltar** (decisión 5 del plan). Las horas se eligen, no se
  arrastran. Tampoco una cuadrícula de horas fijas: la agenda es una lista
  ordenada por hora.
- **Repeticiones dentro del día.** El «Pasear a las mascotas ×2» del render no
  existe en el API: en la plantilla son **dos ítems** con sus dos horas, y en el
  plan **dos bloques**.
- **Bloques solapados** (D4, resuelta: no los hay).
- **Notificaciones, recordatorios, alarmas y sincronización con calendarios
  externos.** Nada de eso está en el API ni entra.
- **Deshacer.** Ni pila de deshacer ni papelera de bloques: lo que se quita del
  plan se quita, y por eso «Vaciar y rehacer» pide confirmación.

**Acceptance criteria:**

*La plantilla con hora y duración, y los ajustes de Vida (tajada 1)*

- [ ] 1. El SDL de Vida se **vuelve a copiar** del repo hermano a
  `src/features/vida/graphql/schema/vida.schema.graphql` con `startTime` y
  `durationMinutes` en `VidaItem`, `VidaItemCreateInput` y `VidaItemUpdateInput`,
  actualizando fecha y origen de la cabecera. Los documentos de
  `graphql/vida-items.graphql.ts` piden los dos campos nuevos y
  `graphql/contracts.test.ts` pasa; si aparece un documento nuevo (ajustes),
  entra en la lista de ese test.
- [ ] 2. `VidaItem` en `types/vida-item.types.ts` lleva
  `startTime: string | null` y `durationMinutes: number | null`, y
  `planVidaItemSave` (`hooks/useSaveVidaItemForActivity.ts`) los propaga al
  crear y al actualizar **sin perder** lo que ya hace: no crear un segundo ítem,
  reactivar el desactivado, y no tocar nada si no cambió nada.
- [ ] 3. En la hoja del catálogo (`components/VidaActivitySheet/`), con «ponerla
  en mi plantilla» encendido aparecen **«a qué hora»** (HH:mm, 24 h) y
  **«cuánto»** con las píldoras **15 · 30 · 45 · 1h · libre**; «libre» abre un
  campo en minutos. Al guardar, el `VidaItem` queda con esa hora y esa duración.
- [ ] 4. Editando una actividad que **ya** está en la plantilla, la hora y la
  duración vienen puestas; cambiarlas actualiza **el mismo** `VidaItem` (no crea
  otro) y la tarjeta lo refleja sin recargar.
- [ ] 5. Hora y duración son **opcionales**: se puede guardar un ítem con días y
  sin hora, y el guardado no se bloquea por eso — los ítems creados en F1 siguen
  siendo válidos. Lo que pasa con ellos al armar un día está en el criterio 44.
- [ ] 6. La tarjeta del catálogo (`components/VidaActivityCard/`) muestra la hora
  y la duración junto a las casillas de los días («8:00 · 40 min · L M X J V»).
  Si el ítem no tiene hora, se lee **«sin hora»** de forma discreta, con la vía
  para ponérsela (abre la hoja). No se inventa una hora para pintarla.
- [ ] 7. Hay una vía visible a **ajustes de Vida** desde el módulo (pantalla u
  hoja; dónde vive lo decide el arquitecto) con exactamente dos campos:
  **empieza mi día** y **termina mi día**, en HH:mm.
- [ ] 8. Esos dos campos se guardan con `updateMySettings` en
  `vidaDayStartTime` / `vidaDayEndTime` **reutilizando**
  `src/features/settings/hooks/useUserSettings.ts`; al salir y volver, lo que se
  ve es lo guardado.
- [ ] 9. Con los dos valores **nulos**, el cliente usa **06:30 y 23:00** y en la
  pantalla se lee que son el valor por defecto, no una elección del usuario.
- [ ] 10. La hora de fin tiene que ser **posterior** a la de inicio: si no, no se
  guarda y se señala el campo. Si la mutación falla, se ve un error visible y no
  se pierde lo escrito.

*La agenda del día, en solo lectura (tajada 2)*

- [ ] 11. `/app/vida/hoy` deja de ser un cascarón: con plan del día muestra el
  **presupuesto** arriba y la **agenda** debajo, con los bloques del
  `activityDayPlan` ordenados por `startTime` ascendente.
- [ ] 12. El presupuesto dice la fecha y la hora («Viernes 18 · 9:24») y **«te
  quedan Xh YY hasta las 23:00»** contando desde ahora hasta la **hora de fin de
  los ajustes** (criterio 9). El número se actualiza solo al menos una vez por
  minuto, sin recargar.
- [ ] 13. La **barra del día** representa el día entero (de la hora de inicio a
  la de fin de los ajustes) de izquierda a derecha: los anchos de los tramos son
  proporcionales a sus minutos y suman el 100%; la **marca de «ahora»** cae en la
  posición de la hora actual (a la hora de inicio, pegada a la izquierda; a la de
  fin, a la derecha).
- [ ] 14. La **leyenda** da los minutos de cada tramo — en F2, **planeado** y
  **libre** — y esos números coinciden con la suma de las duraciones de los
  bloques y de los huecos que se ven en la agenda.
- [ ] 15. La **línea de guía** se compone con reglas y nombra números reales:
  cuántos bloques quedan del plan y cuánto suman, y el hueco más grande con sus
  horas («la tarde está vacía de 13:30 a 19:00»). Tiene una frase distinta para:
  día sin plan, día lleno (sin huecos) y día ya terminado. Ninguna reprocha nada.
- [ ] 16. Cada bloque pinta la **hora de inicio**, el **icono y el color de la
  categoría** de su actividad, el **nombre** y su **duración en minutos**
  (`endTime` − `startTime`). El primer bloque que aún no ha empezado dice **«en
  N min»**.
- [ ] 17. Entre bloques se pinta un **hueco** por cada tramo libre de al menos el
  mínimo (hipótesis: 15 min) con **sus horas y su tamaño** («Libre 10:30 – 13:00
  · 2h 30»). También se calculan el hueco entre la hora de inicio del día y el
  primer bloque, y entre el último bloque y la hora de fin.
- [ ] 18. Cada hueco ofrece, de `vidaSuggestionsForDate(<día>)`, **solo lo que
  cabe**: sugerencias cuyo `durationMinutes` **de su ítem de plantilla** es ≤ el
  tamaño del hueco, excluyendo las actividades que ya están en el plan de ese
  día; como mucho 3 visibles, cada una con su duración, más **«+ otra cosa»**.
- [ ] 19. Una sugerencia **sin duración** (ítem de F1) no se filtra por tamaño ni
  se le inventa una: aparece al final, se lee **«sin duración»** y al tocarla
  abre la hoja para elegir cuánto en vez de colocarla a ciegas.
- [ ] 20. Cuando el día mostrado es **hoy** y la hora actual cae dentro del día,
  la agenda **abre a la altura de «Ahora»** sin que lo anterior desaparezca.
- [ ] 21. **Hoy sin plan** (`activityDayPlan` vacío): la pantalla no se ve rota —
  el día entero es un hueco, se lee que aún no hay plan sin reprochar nada, y
  «Armar desde la plantilla» está a un toque diciendo cuántas cosas trae la
  plantilla ese día. **Sin plantilla y sin plan**: el hueco no enseña fichas
  vacías; se lee que no hay nada en la plantilla para ese día y hay un enlace al
  catálogo (`/app/vida/actividades`).
- [ ] 22. En toda la pantalla **no hay nada de vivir el día**: ni «Empezar», ni
  cronómetro, ni «Terminar», ni barra de sesión, ni etiquetas de ejecutado.

*Poner algo en un hueco (tajada 3)*

- [ ] 23. Un toque en una ficha de sugerencia con duración crea el bloque
  (`activityDayPlanItemAdd`) **al principio del hueco** con esa duración; la
  agenda, los huecos y el presupuesto se actualizan **sin recargar**.
- [ ] 24. **«+ otra cosa»** abre la hoja **«Poner algo a las HH:MM»** con el
  subtítulo del hueco: «Hueco de 2h 30 · hasta las 13:00 "Cocinar y almorzar"»
  (o «hasta el final del día» si no hay bloque después).
- [ ] 25. La hoja son **tres preguntas**: **qué** (primero las de la plantilla de
  ese día, luego un buscador sobre las actividades no archivadas), **cuánto**
  (píldoras **15 · 30 · 45 · 1h · libre**, y «libre» es un campo en minutos),
  **cuándo**. El botón **«Poner»** solo se habilita con las tres resueltas. Si lo
  elegido en «qué» tiene duración en la plantilla, viene **preseleccionada** y se
  puede cambiar.
- [ ] 26. Las duraciones que **no caben** en el hueco salen **apagadas** y no se
  pueden elegir; «libre» no admite más minutos de los que caben y lo dice en vez
  de guardar algo imposible.
- [ ] 27. En **cuándo** se ofrece el principio del hueco («10:30 · ahora que
  termine») y al menos dos horas dentro de él, más **«otra hora»**, que **no
  admite** una hora fuera del hueco ni fuera del día.
- [ ] 28. Elegido todo, la hoja dice **cuánto queda libre después** («Queda libre
  1h 30 antes de almorzar») y la previsualización refleja la elección.
- [ ] 29. Si la mutación falla, se ve un **error visible**, la hoja **no se
  cierra ni pierde lo elegido**, y en la agenda **no queda un bloque fantasma**.
- [ ] 30. Un bloque del plan se puede **quitar del plan**
  (`activityDayPlanItemRemove`) y se le puede **cambiar la hora o la duración**
  (`activityDayPlanItemEdit`) con las mismas restricciones de encaje y sin pisar
  otro bloque (D4). En pantalla se lee **«Quitar del plan»**: nunca «cancelar» ni
  «eliminar» (heredado de FEAT-002, criterio 25).

*Cualquier día, no solo hoy (tajada 4)*

- [ ] 31. Arriba hay una **tira de 7 días** con su día de la semana y su número;
  hoy está marcado, el día que se ve va resaltado, y un toque cambia el día que
  muestra la agenda.
- [ ] 32. Bajo cada día de la tira hay un **punto**: rayado si ese día **tiene
  plan**, vacío si no. Se lee de un vistazo, sin abrir día por día.
- [ ] 33. Un **día futuro** muestra la misma agenda en trazo suave y el
  presupuesto cuenta **planeado frente a libre** («planeado 4h 20 de 16h 30»): no
  aparece la marca de «ahora», ni el «en N min», ni «te quedan».
- [ ] 34. **El día visto va en la URL** (la forma la elige el arquitecto):
  recargando se ve el mismo día, y el «atrás» del navegador vuelve al anterior.
- [ ] 35. La **ventana de planeación es esta semana y la que viene** (D5): no se
  navega fuera de ella, y el borde se explica en vez de dejar un botón muerto.
- [ ] 36. **«Copiar del <mismo día> pasado»** trae los bloques del **mismo día de
  la semana anterior** con sus horas y duraciones, y **solo aparece en días sin
  plan** (D7); antes de hacerlo dice **cuántos bloques** va a traer. Si ese día
  no tuvo plan, el botón está apagado y dice por qué.
- [ ] 37. **«Vaciar y rehacer»** pide confirmación nombrando **cuántos bloques**
  se van; al confirmar, ese día queda sin plan. Solo está en hoy y en días
  futuros.
- [ ] 38. Un **día pasado** es **solo lectura** (D3): no hay poner, ni fichas en
  los huecos, ni vaciar, ni copiar hacia él, ni quitar.

*La semana y armar desde la plantilla (tajada 5)*

- [ ] 39. La **vista de semana** da una línea por día: día de la semana y número;
  los días **con plan** dicen «Planeado · N bloques · Xh YY» con una barrita
  proporcional y un **«Ver»** que lleva a ese día; los días **sin plan** dicen
  «Sin plan todavía» + «Tu plantilla trae N cosas los <día>» y llevan **«Armar»**.
- [ ] 40. Los días **pasados** de la semana se describen por **lo que tuvieron
  planeado**, no por lo que se cumplió: el «Seguiste N de M» y las barritas de
  *seguido · de más · fuera del plan · sin dato* del render son F3/F5 y **no
  aparecen** en F2.
- [ ] 41. **«Armar»** coloca cada ítem de la plantilla de ese día **a la hora del
  ítem y con la duración del ítem** (D6). No se encadena, no se reparte por
  franjas y no se propone otra hora: lo que dice la plantilla es lo que queda en
  el plan.
- [ ] 42. Armar es **una sola operación** (`activityDayPlanSet`); al terminar, la
  línea del día pasa a «Planeado · N bloques» **sin recargar** y el punto de ese
  día en la tira se llena.
- [ ] 43. Si dos ítems de la plantilla **se pisarían** (D4: en el plan no hay
  solapes), el segundo se coloca **justo detrás** del primero conservando su
  duración, y al terminar se dice cuántos se movieron: «2 de 7 no cabían a su
  hora y quedaron después». No se descarta ninguno en silencio.
- [ ] 44. Los ítems **sin hora** (los de F1) se colocan **al final, encadenados**
  detrás del último bloque con hora, con su duración o, si tampoco tiene, con una
  por defecto visible; y el día lo dice: «3 cosas sin hora, puestas al final —
  ponles una hora en tu plantilla», con enlace al catálogo. **Nada se pierde en
  silencio.**
- [ ] 45. **«Armar toda la semana desde la plantilla»** hace lo mismo para **los
  días sin plan** de la semana mostrada, **sin pisar** ninguno que ya lo tenga, y
  lo dice antes de hacerlo: «se armarán 3 días; 2 ya tienen plan y no se tocan».
- [ ] 46. Si armar falla a mitad, se ve un error que **nombra qué día falló**,
  los días ya armados **siguen armados**, y la pantalla enseña exactamente lo que
  quedó (no se anuncia «semana armada» si fueron 3 de 5).
- [ ] 47. **Criterio de fase, cronometrado a mano:** desde `/app/vida/hoy`, dejar
  **el plan de mañana** armado desde la plantilla y revisado en **menos de un
  minuto**, y **la semana entera** en **menos de cinco**.

*El escritorio (tajadas 2 y 5)*

- [ ] 48. En escritorio, el lateral trae **«Tu plantilla de <día>»** —cada cosa
  de la plantilla de ese día, marcando las que ya están en el plan y con el botón
  de ponerla en el primer hueco donde cabe— y **«Mañana»** con «Armar mañana
  desde la plantilla». **No** trae «Cómo va el día» (D8).

*Estados — los que no se piden y siempre hacen falta*

- [ ] 49. **La fecha es local.** Lo que se le pide al API es el `YYYY-MM-DD`
  local (`getCurrentLocalDate`, `formatDateToYmd`), nunca un UTC: a las 23:30
  sigue siendo hoy, y el día de la semana de la plantilla es el local.
- [ ] 50. **Cargando:** esqueleto o indicador mientras las consultas del día
  están en vuelo; **nunca** se enseña «no tienes plan», ni los huecos, ni las
  fichas, mientras aún se carga. Con los **ajustes** aún en vuelo no se pinta un
  presupuesto con horas por defecto que luego salte.
- [ ] 51. **Sin sesión:** con las consultas deshabilitadas por
  `useVidaQueryGuard` (`isPending` + `fetchStatus: 'idle'`), la pantalla **no
  pinta un spinner eterno**: mensaje breve con la vía para entrar. Comprobable en
  test con un `QueryClient` y el guard en `false`.
- [ ] 52. **Error de carga:** mensaje en lenguaje humano y un botón que vuelve a
  pedir los datos; al reintentar con éxito, la pantalla se pinta. Si falla una de
  las consultas (plan, sugerencias, actividades, ajustes) y las otras no, se dice
  qué falta en vez de dejar la pantalla a medias sin explicación.
- [ ] 53. **Móvil a 375 px:** sin scroll horizontal en la agenda, la hoja, los
  ajustes ni la semana; la tira de días cabe o hace scroll horizontal **ella
  sola**; en la hoja el botón «Poner» se ve sin hacer scroll dentro de la hoja.
- [ ] 54. **Texto largo:** un nombre de actividad de ~60 caracteres no rompe el
  bloque, ni la ficha de un hueco, ni la tarjeta del catálogo con hora y
  duración, ni la línea de la semana, y no produce scroll horizontal.
- [ ] 55. **Tema oscuro:** ajustes, presupuesto, barra del día, bloques, huecos,
  hoja y vista de semana mantienen contraste legible; la marca de «ahora», el
  tramo «planeado» y las duraciones apagadas se siguen distinguiendo.
- [ ] 56. **Lenguaje:** ni «desperdiciado», ni «perdiste», ni «fallaste», ni
  «vacío» como reproche; un tramo sin nada es **libre**. Un día sin plan no se
  reprocha, y un ítem sin hora tampoco: se ofrece ponérsela. Nada de «cancelar»
  ni «eliminar» refiriéndose a un bloque (criterio 30).
- [ ] 57. **Línea base no empeorada** (`docs/features/ENVIRONMENT.md`):
  `pnpm typecheck` limpio, `pnpm lint` no peor que 14 errores / 0 warnings,
  `pnpm test` sin fallos nuevos sobre los 2 preexistentes, el chunk inicial no
  crece por iconos, y **todo documento GraphQL nuevo entra en la lista de**
  `src/features/vida/graphql/contracts.test.ts`.
- [ ] 58. **Solo el usuario puede cerrarlo, y solo con el API desplegada** (está
  detrás del login y los agentes no entran con credenciales; además el cambio de
  backend tiene que estar en Cloud Run): el recorrido real entero con su cuenta —
  ponerle hora y duración a tres cosas de la plantilla → fijar el inicio y el fin
  de su día → hoy con plan → poner algo en un hueco desde una ficha → ponerlo
  desde la hoja → quitar un bloque → ir a mañana por la tira → armar mañana desde
  la plantilla → vista de semana → armar la semana — más el cronómetro del
  criterio 47. Los agentes verifican con tests y arneses; esto queda dicho, no
  disimulado.

**Slices:**

| # | What it does | State |
|---|---|---|
| 1 | **La plantilla con hora y duración, y los ajustes de Vida.** Prerrequisito de todo lo demás: SDL recopiado y contratos verdes, tipos y hooks de `vida-items` con `startTime`/`durationMinutes`, la hoja de F1 gana «a qué hora» y «cuánto» (15 · 30 · 45 · 1h · libre), la tarjeta del catálogo los enseña, y una pantalla/hoja de ajustes de Vida con el inicio y el fin del día. Ya es útil sola: la plantilla deja de ser una lista sin orden y pasa a ser un día. | pending |
| 2 | **La agenda del día, en solo lectura.** El presupuesto (tiempo que queda, barra del día con la marca de «ahora», leyenda y línea de guía), los bloques del `activityDayPlan` ordenados por hora, los huecos con su tamaño y las sugerencias de la plantilla que caben (sin poder ponerlas aún), apertura en «Ahora», el lateral de escritorio, y todos los estados. Primera vez que el usuario ve su día repartido y dónde tiene sitio. | pending |
| 3 | **Poner algo en un hueco.** Un toque en una ficha lo coloca al principio del hueco; «+ otra cosa» abre la hoja de tres preguntas (qué · cuánto · cuándo) con lo que no cabe apagado y el «queda libre después»; quitar un bloque y cambiarle hora o duración. Errores de mutación visibles. | pending |
| 4 | **Cualquier día, no solo hoy.** La tira de 7 días con el punto de «tiene plan», el día en la URL, la ventana de esta semana y la siguiente, el día futuro en trazo suave, el día pasado en solo lectura, «copiar del mismo día pasado» y «vaciar y rehacer». Aquí ya se planea mañana a mano. | pending |
| 5 | **La semana y armar desde la plantilla.** La vista de semana con una línea por día, «Armar» en los vacíos copiando hora y duración de cada ítem (con el trato explícito de los solapes y de los ítems sin hora) y «Armar toda la semana» sin pisar lo que ya existe. Cierra el criterio de fase. | pending |

Cada tajada se revisa sola. La 1 se cierra con tests y con el catálogo, que ya
existe; la 2 se puede ver entera con un arnés y datos sintéticos; la 3 es la
primera que escribe plan en el API; la 4 no toca lo anterior salvo de dónde sale
la fecha; la 5 es una pantalla aparte más una operación por lotes.

**Son cinco y no cuatro** porque el cambio de modelo (D6) metió un prerrequisito
que antes no existía. Si al arquitecto le parece que 1 y 2 son dos features
distintas, que lo diga antes de planificar: aquí van juntas porque sin la hora en
la plantilla la agenda no puede armarse, y una plantilla con horas que no se
puede volcar a un día no sirve de nada.

**Architect? yes** porque la agenda **no tiene hermana en este repositorio**: es
la primera pantalla del proyecto con **geometría de tiempo** (posiciones y anchos
derivados de horas, marca de «ahora», huecos calculados entre bloques). Además:

1. **El SDL vendorizado cambia** y con él los documentos, los tipos y
   `planVidaItemSave`, que ya está probado. Decidir cómo entra eso sin romper lo
   entregado en FEAT-002 es trabajo de arquitecto.
2. **Los ajustes de Vida tocan otra feature**: `src/features/settings/` ya tiene
   `useUserSettingsQuery` / `useUpdateUserSettingsMutation` y su documento
   GraphQL. Hay que decidir si Vida los **consume tal cual**, si el documento se
   amplía allí, y **dónde vive la pantalla** (¿`/app/vida/ajustes`? ¿una hoja
   desde Hoy? ¿una sección en `/app/settings`?). Eso no lo decide un constructor
   a mitad de tajada, y `app-nav.config.ts` es **una sola fuente** de destinos.
3. Hay **aritmética pura que ya se escribió una vez y está en git**:
   `activity-time.utils.ts` (494 líneas: huecos libres, alturas de timeline,
   validaciones de tramo) en
   `git show 79bece0:src/features/activities/utils/activity-time.utils.ts`, más
   `useRemainingDayTimer` y `useCurrentTimeMarker`. Qué se rescata, qué se
   reescribe y dónde vive se decide una vez.
4. Una pantalla cruza **cuatro consultas por día** (`activityDayPlan(date)`,
   `vidaSuggestionsForDate(date)`, las actividades del catálogo para el buscador
   y los ajustes) y la tira de días necesita saber de **siete días a la vez** sin
   hacer siete consultas mal cacheadas. Claves e invalidaciones, antes de la
   primera tajada.
5. Hay **dos pantallas nuevas** (día y semana) que comparten presupuesto y estado
   de fecha, y `/app/vida/hoy` tiene que aprender a llevar **un día cualquiera**
   sin duplicarse en `vida-paths.ts`.

Lo que **ya existe y no se vuelve a construir**:

- `src/features/vida/hooks/useActivityDayPlan.ts` —
  `useActivityDayPlanQuery(date)`, `useSetActivityDayPlanMutation`,
  `useAddDayPlanItemMutation`, `useEditDayPlanItemMutation`,
  `useRemoveDayPlanItemMutation`. Con sus tests.
- `src/features/vida/hooks/useVidaItems.ts` (`useVidaItemsQuery(includeInactive)`)
  y `src/features/vida/hooks/useActivities.ts` (`useActivitiesQuery`).
- `src/features/vida/hooks/useSaveVidaItemForActivity.ts` — `planVidaItemSave`,
  `sortVidaDays`, con su test. **Se amplía, no se reescribe.**
- `src/features/vida/components/VidaActivitySheet/` (el bloque «Ponerla en mi
  plantilla», con su lógica de no pisar un `VidaItem` en vuelo — leer los
  comentarios de cabecera antes de tocarlo) y
  `src/features/vida/components/VidaActivityCard/` (de ahí salen el icono y el
  color de la categoría; un bloque de la agenda usa lo mismo).
- `src/features/settings/hooks/useUserSettings.ts`,
  `graphql/user-settings.graphql.ts`, `api/user-settings.api.ts`,
  `types/user-settings.types.ts`, y `src/pages/app/SettingsPage/SettingsPage.tsx`
  como referencia de formulario de ajustes.
- `src/features/vida/utils/vida-date.utils.ts` — `formatDateToYmd`,
  `getCurrentLocalDate`, `getMondayOfWeek`, `getCurrentWeekRange`,
  `isFutureDate`, `isToday`, `VIDA_DAY_ORDER`, `VIDA_DAY_SHORT_LABELS`,
  `VIDA_DAY_LABELS`. Las utilidades de **hora** nuevas van aquí o en un archivo
  hermano: lo decide el arquitecto.
- `src/features/vida/utils/vida-catalog.utils.ts`, `utils/vida-error.utils.ts`,
  `utils/invalidate-vida-queries.ts`, `hooks/useVidaQueryGuard.ts`, `vidaKeys` en
  `src/shared/api/query-keys.ts`.
- `src/features/vida/pages/VidaHoyPage.tsx` (el cascarón que se sustituye),
  `routes/vida-paths.ts`, `routes/vida.routes.tsx` y
  `src/layouts/AppLayout/app-nav.config.ts`.

**Hipótesis marcadas, para que el arquitecto las confirme o las tire** (son
técnicas, no del usuario, y no las tomo yo):

- **`vidaSuggestionsForDate` es la fuente de las fichas de un hueco**, no
  `vidaItems` filtrado en cliente: da el `takenToday` y, con el cambio, la hora y
  la duración dentro de `item`. Confirmar que `takenToday` se comporta como hace
  falta en un día futuro.
- El **hueco mínimo** que se pinta con fichas: 15 min.
- La **duración por defecto** del criterio 44 (ítem sin hora ni duración): 30
  min, y visible.
- La **tira de siete días** empieza dos días antes del día visto (como el
  render), y la semana usa `getMondayOfWeek` / `getCurrentWeekRange`.
- **El API no valida solapes** (nada en el SDL lo sugiere): la restricción de D4
  la pone el cliente, y hay que asumir que el API acepta lo que le manden.
- `activityDayPlanSet` **reemplaza el día entero**: sirve para «armar» y para
  «vaciar» (lista vacía), pero **no** para añadir un bloque suelto sin riesgo de
  pisar algo — para eso está `ItemAdd`.
- Los ajustes se consultan **una vez por sesión** y se cachean: el presupuesto
  los necesita en cada pintado y no puede pedirlos cada vez.

**Decisions that aren't mine:** *(las ocho, resueltas por el usuario el
2026-09-20; ninguna queda abierta)*

- **D1 — ¿De dónde sale la duración de una actividad? — resuelta.** De **su ítem
  de plantilla** (`durationMinutes`). Para lo de improviso, en sus palabras: «al
  momento de iniciarla indico con selectores pre-diseñados el tiempo (15, 30, 45,
  1h u opción libre)» → píldoras **15 · 30 · 45 · 1h · libre** en la hoja.
  **Descartado para F2**: derivarla del historial de sesiones o de lo que se
  suele planear. Eso vuelve, si vuelve, en F6.
- **D2 — La hora en que empieza y termina tu día — resuelta.** Entran los
  **ajustes de Vida en F2**: `UserSettings.vidaDayStartTime` /
  `vidaDayEndTime` por `mySettings` / `updateMySettings`, nulos por defecto y
  **06:30 / 23:00** como valores del cliente mientras lo estén. Criterios 7–10.
- **D3 — ¿Se puede cambiar el plan de un día pasado? — resuelta: no.** Un día
  pasado se mira y no se toca (criterio 38). Lo que no se registró se arregla en
  F3 con «Lo hice» y «¿qué pasó?».
- **D4 — ¿Dos cosas a la vez? — resuelta: no hay solapes.** Las horas ocupadas se
  apagan y los huecos son exactos. Al armar desde la plantilla, lo que se pisaría
  se corre detrás y se dice (criterio 43).
- **D5 — ¿Hasta dónde se puede planear? — resuelta:** **esta semana y la que
  viene**. Sin selector de fecha abierto.
- **D6 — «Armar desde la plantilla»: ¿a qué hora coloca cada cosa? — resuelta, y
  cambió el modelo.** La plantilla **es una agenda**: cada ítem dice «a esta hora
  hago esto, este tiempo», y armar **copia esa hora y esa duración**. Nada de
  encadenar ni de franjas ni de proponer horas. Para conseguirlo, el usuario
  **abrió el backend**, que el plan de Vida daba por intocable: `VidaItem` gana
  `startTime` y `durationMinutes` (ver «Dependencia externa»). Su razón, literal,
  está arriba en «User's words» — y conviene leerla entera antes de diseñar esta
  pantalla, porque explica por qué una lista sin horas no le sirve y por qué la
  plantilla **no es una regla rígida**: es lo que quiere que sea su día, y lo que
  luego se compara con lo que pasó.
- **D7 — «Copiar del <mismo día> pasado» — resuelta:** el **mismo día de la
  semana anterior**, y el botón **solo en días sin plan** (criterio 36).
- **D8 — El lateral de escritorio — resuelta:** entran **«Tu plantilla de <día>»**
  y **«Mañana»**; **no** entra «Cómo va el día», que es F3/F5 (criterio 48).

---

*Escrito por `feature-analyst` el 2026-09-20 y actualizado el mismo día con las
respuestas del usuario a D1…D8 (D6 cambió el modelo y abrió el backend; la
feature pasó de cuatro tajadas a cinco). Fuentes: `docs/vida/PLAN.md` (F2 y
«Decisiones ya tomadas» — **la decisión 3, «backend intocable en la v1», queda
superada por D6**), `docs/vida/assets/03-vida-agenda.html`,
`docs/vida/assets/04-vida-planeado-ejecutado.html` (marcos A y C),
`docs/features/FEAT-001-vida-cimientos.md`,
`docs/features/FEAT-002-vida-catalogo-actividades.md`,
`docs/features/ENVIRONMENT.md` y los SDL de
`src/features/vida/graphql/schema/`.*

## 2. El plan — feature-architect

**Resumen para el constructor:** la referencia es el propio módulo Vida de
FEAT-002 —`src/features/vida/pages/VidaActividadesPage.tsx` +
`components/VidaActivitySheet/`— para páginas, hojas y estados; y
`src/features/habits/components/HabitPanel/` + `utils/habit-panel.utils.ts`
**solo** para la figura «aritmética pura en un `utils` + geometría pintada a
mano + tabla oculta accesible», que es lo único parecido a la barra del día que
hay vivo en el repo. Todo lo nuevo de esta feature cae dentro de
`src/features/vida/` salvo cuatro archivos de `src/features/settings/` (dos
campos más en el documento, el tipo y el SDL vendorizado) y una entrada
`settings` para el módulo Vida en `src/layouts/AppLayout/app-nav.config.ts`.
**No se crea capa de datos del plan del día ni de la plantilla: ya existen
enteras y con tests** (`hooks/useActivityDayPlan.ts`, `hooks/useVidaItems.ts`,
`hooks/useSaveVidaItemForActivity.ts`, `vidaKeys` y las invalidaciones).

### Lo que ya existe

| Qué | Dónde | Qué significa para esta feature |
|---|---|---|
| Las cinco operaciones del plan del día | `src/features/vida/hooks/useActivityDayPlan.ts:26,35,48,66,81` (+`.test.tsx`) | `useActivityDayPlanQuery(date)` ya consulta **fechas futuras a propósito**, y `Set`/`ItemAdd`/`ItemEdit`/`ItemRemove` ya invalidan y dan toast. **Ninguna mutación nueva.** |
| La plantilla | `hooks/useVidaItems.ts`, `hooks/useSaveVidaItemForActivity.ts:64` (`planVidaItemSave`, puro y probado) | Se **amplía** con dos campos; no se reescribe. |
| Claves de caché | `src/shared/api/query-keys.ts:44-70` (`vidaKeys.dayPlan.byDate`, `items.suggestions(date)`, `items.list`) y `:150` (`settingsKeys.my()`) | **Cubren las cuatro consultas por día y los siete días de la tira.** No hace falta ninguna clave nueva (ver «Dónde NO va»). |
| Invalidaciones | `src/features/vida/utils/invalidate-vida-queries.ts:64,76` | `invalidateDayPlanQueries` ya invalida **solo esa fecha**, que es exactamente lo que pide la tira. |
| Ajustes | `src/features/settings/hooks/useUserSettings.ts:16,27` + `graphql/user-settings.graphql.ts` + `types/user-settings.types.ts` + `api/user-settings.api.ts`, exportados en `src/features/settings/index.ts:3` | `useUserSettingsQuery` tiene `staleTime: 5 min` y clave propia: **la hipótesis «los ajustes se consultan una vez por sesión» ya está resuelta**, no se toca. El documento pide 5 de los 12 campos del API: añadir 2 es barato. |
| Guardas de sesión | `hooks/useVidaQueryGuard.ts` | Es lo que sostiene el criterio 51; se usa tal cual. |
| Fechas locales | `utils/vida-date.utils.ts` (`formatDateToYmd`, `getCurrentLocalDate`, `getMondayOfWeek`, `getCurrentWeekRange`, `isFutureDate`, `isToday`, `VIDA_DAY_*`) | Criterio 49 resuelto de fábrica. **Le falta todo lo de `HH:mm`.** |
| Texto para buscar | `utils/vida-text.utils.ts`, `utils/activity-filters.ts` (`filterActivitiesBySearch`) | El buscador de «qué» (criterio 25) reutiliza `filterActivitiesBySearch`. **No se escribe un quinto normalizador** (ya hay cuatro copias: hallazgo abierto de FEAT-002). |
| Contratos GraphQL | `src/features/vida/graphql/contracts.test.ts` | Es el **único** arnés de contrato del repo. `activity.schema.graphql` aporta los bloques base (`type Query`, `type Mutation`, escalares); los demás SDL son `extend`. |
| La hoja con pasos y la tarjeta | `components/VidaActivitySheet/VidaActivitySheet.tsx` (410 líneas, con la lógica de «no pisar un `VidaItem` en vuelo» en los comentarios de cabecera y en `:95-110`) y `components/VidaActivityCard/` | Se amplían. **Leer la cabecera antes de tocar la hoja**: el `templateDraft` se *deriva*, no se copia con `useEffect`. |
| Geometría de tiempo | **no existe nada en `src/`** | Confirmado: ni un componente pinta posiciones derivadas de horas. Lo más parecido vivo es `HabitPanel` (SVG a mano + `habit-panel.utils.ts` puro). |
| Aritmética de tiempo borrada | `git show 79bece0:src/features/activities/utils/activity-time.utils.ts` (494 líneas), `…/activity-day-metrics.utils.ts`, `…/activity-free-slot-form.ts`, `…/hooks/useCurrentTimeMarker.ts`, `…/hooks/useRemainingDayTimer.ts` | Se rescata **por función**, no por archivo. Tabla abajo. |

**Nada existe dos veces** en lo que toca esta feature, salvo el normalizador de
texto (cuatro copias, hallazgo ya anotado en FEAT-002 y que aquí **no crece**).

### Qué se rescata de `79bece0`, función por función

| De dónde | Qué | Dónde va | Por qué |
|---|---|---|---|
| `activity-time.utils.ts:130-160` | `parseTimeToMinutes`/`timeToMinutes`, `minutesToTime`, `normalizeTimeForDisplay`, `normalizeTimeForApi` | `src/features/vida/utils/vida-time.utils.ts` (nuevo) | Es la base de todo. Copiar el cuerpo, quitar `normalizeTimeToSeconds` (el plan del día habla `HH:mm`, no `HH:mm:ss`). |
| `activity-time.utils.ts:196-207` | `formatDurationMinutes` | ídem | «40 min» / «2 h 30». El render usa la forma corta de `activity-day-metrics.utils.ts:78` (`formatDurationFromMinutes`: «2h 30», «45m»): **se rescata esa**, que es la que dibuja el render. |
| `activity-time.utils.ts:268-274` | `calculateEndTime(startTime, durationMinutes)` | ídem | Es lo que convierte «hora + duración» en el `endTime` que pide `ActivityDayPlanItemAddInput`. Quitar el `_date` muerto y el `% 24` (aquí nada cruza medianoche: el día acaba en `vidaDayEndTime`). |
| `activity-time.utils.ts:339-383` | la forma de `getFreeSlotsBetweenFollowUps` | `utils/vida-agenda.utils.ts` (nuevo, tajada 2) | **Se reescribe, no se copia**: aquélla solo daba huecos *entre* registros (`if (dayFollowUps.length < 2) return []`) y aquí hacen falta también el de antes del primer bloque y el de después del último (criterio 17), y los bordes son `vidaDayStartTime`/`vidaDayEndTime`, no `00:00`/`24:00`. Se conserva la idea del cursor y del `id` derivado de las horas. |
| `activity-time.utils.ts:399-437` | `isStartTimeInsideSlot`, `getMaxDurationForStartTime`, `validateFollowUpInsideSlot` | `utils/vida-gap-form.utils.ts` (nuevo, tajada 3) | Son literalmente los criterios 26 y 27. Se rescatan casi tal cual, cambiando los mensajes al lenguaje del criterio 56. |
| `activity-free-slot-form.ts` | la forma del formulario de hueco | ídem | Molde para «qué · cuánto · cuándo»; el contenido cambia (tres preguntas, no un registro). |
| `hooks/useCurrentTimeMarker.ts` | entero (14 líneas) | `hooks/useVidaNowMinute.ts` (nuevo) | Ya tictaquea **cada 60 s**, que es justo el criterio 12. Devuelve minutos desde medianoche además de la etiqueta, porque la barra y la marca lo necesitan como número. |
| `hooks/useRemainingDayTimer.ts` | **la idea, no el código** | ídem | Tictaquea **cada segundo** (era un cronómetro) y depende de `DAY_END_TIME = '23:00:00'` *hardcodeado* y de una ventana «23:00 de ayer → 23:00 de hoy» que aquí no vale: la ventana es `vidaDayStartTime → vidaDayEndTime` de los ajustes. Un intervalo de 1 s repintando el presupuesto entero es coste sin criterio que lo pida. |
| `activity-day-metrics.utils.ts` | `formatDurationFromMinutes` y la idea de `getDayUsageMetrics` | `utils/vida-agenda.utils.ts` | **Se tira** `wasteMinutes`/`wastePercentage`: es «desperdicio», prohibido por el criterio 56 y por la regla de producto del `ENVIRONMENT.md`. En F2 los tramos son **planeado** y **libre** y nada más. |
| todo lo demás del archivo (mes, timeline con alturas en px, `buildTimelineItems`, ISO↔local, `formatElapsedHHMMSS`) | — | **no se rescata** | Alturas proporcionales en píxeles = cuadrícula de horas, descartada (decisión 5 del plan). Lo de ISO y cronómetro es F3. |

### Hipótesis del analista: confirmadas y tiradas

| Hipótesis | Veredicto | Evidencia |
|---|---|---|
| `vidaSuggestionsForDate` es la fuente de las fichas | **Confirmada**, con una corrección importante | `xavi-platform-node/src/services/vida.service.ts:279-295`: filtra por el día de la semana de la fecha y sirve **cualquier fecha**. Pero `takenToday` sale de `vidaTakenToday`, que es el «ya lo tomé hoy» de F1 — en un día futuro es **siempre `false`** y **no dice si la actividad está en el plan**. Por tanto **la exclusión del criterio 18 se calcula contra `activityDayPlan(date)`** (por `activityId`), nunca contra `takenToday`. Confundirlos es el error caro de esta feature. |
| Hueco mínimo 15 min | **Confirmada, con matiz** | `MIN_GAP_MINUTES = 15` para pintar la **tarjeta** de hueco con fichas. Los restos de menos de 15 min **no desaparecen**: se pintan como una línea fina con sus minutos, porque si no, la leyenda (criterio 14) dejaría de cuadrar con lo que se ve. |
| Duración por defecto 30 min (criterio 44) | **Confirmada** | `DEFAULT_BLOCK_MINUTES = 30`, exportada de `vida-time.utils.ts` y **nombrada en pantalla** («30 min por defecto»). |
| Tira de 7 días empezando dos días antes | **Confirmada, recortada a la ventana** | Es lo que dibuja el render 04 (JUE 17 … MIÉ 23 con el 18 elegido). Pero D5 manda: la ventana es de **hoy** al **domingo de la semana que viene**, así que la tira se recorta contra ese borde en vez de ofrecer días que no se pueden abrir (criterio 35). El pasado de la tira es navegable en solo lectura (criterio 38). |
| El API no valida solapes | **Confirmada** | `grep -niE "overlap|solap|conflict"` en `xavi-platform-node/src/services/activity-day-plan.service.ts` y `src/validators/schemas/activity-day-plan.schemas.ts`: **cero coincidencias**. D4 la sostiene **el cliente**, entera. |
| `activityDayPlanSet` reemplaza el día entero | **Confirmada** | Está en el SDL vendorizado: `src/features/vida/graphql/schema/activity-day-plan.schema.graphql:44` («Reemplaza (atómicamente) el plan del día»). Sirve para armar y para vaciar; añadir un bloque suelto va por `ItemAdd`. |
| Los ajustes se cachean una vez por sesión | **Confirmada y ya hecha** | `useUserSettingsQuery` con `staleTime: 5 min` sobre `settingsKeys.my()`. No se toca. |

### Implementación de referencia

**`src/features/vida/pages/VidaActividadesPage.tsx` (271 líneas) con
`src/features/vida/components/VidaActivitySheet/` y
`components/VidaActivityCard/`.** No por ser el mejor código del repo, sino
porque es **la misma figura** y está vivo y probado: una página que cruza tres
consultas y resuelve el cruce en un `Map` (`:78-84`), componentes tontos que no
mutan, los cuatro estados separados de verdad (cargando / sin sesión / error con
reintento / vacío), una hoja `SteppedModal` con `ds="aura"` + `mobileSheet`
—que es literalmente la hoja inferior del render— montada con una **`key` por
apertura** (`:47,52-58`) y con el `onSuccess` **local** para que un fallo de
mutación no cierre la hoja. Los criterios 29, 50, 51, 52 y 53 se cierran
imitándola; los tests `VidaActividadesPage.test.tsx` y
`VidaActivitySheet.test.tsx` son el molde.

**Referencia secundaria, solo para la geometría:**
`src/features/habits/components/HabitPanel/` + `utils/habit-panel.utils.ts`.
Es lo único vivo que pinta números derivados: toda la aritmética en un `utils`
puro con su test y el dibujo a mano, con **tabla oculta obligatoria** en
`ChartPanel` para que lo que se ve en una barra también se pueda leer. La barra
del día (criterios 13 y 14) se hace así: porcentajes calculados en
`vida-agenda.utils.ts`, `<div>`s con `width: %`, y la leyenda con los minutos
como texto real —no `title`— para que sea la «tabla» del gráfico.

**Para lo de tiempo, la referencia es `79bece0`** con la tabla de arriba; no es
código vivo y por eso se rescata por función, con test propio, no se restaura.

### Dónde va el código nuevo, archivo por archivo

*Tajada 1 — la plantilla con hora y duración, y los ajustes de Vida*

| Archivo | Nuevo/Modificado | Qué |
|---|---|---|
| `src/features/vida/graphql/schema/vida.schema.graphql` | M | **Recopiar literal** la cadena `gql` de `~/Developer/xavi-platform-node/src/graphql/modules/vida/vida.schema.ts` (commit `15463da`). Cabecera: `Copiado: 2026-09-20` y el commit de origen. No editar a mano campo por campo. |
| `src/features/settings/graphql/schema/user-settings.schema.graphql` | **N** | Copia literal de `userSettingsTypeDefs` (mismo commit). Es autocontenido: solo referencia `DateTime` y hace `extend type Query`/`Mutation`. |
| `src/features/vida/graphql/contracts.test.ts` | M | Añadir el SDL de ajustes a `buildSchema([...])` (`:31`) y los dos documentos de `@/features/settings/graphql/user-settings.graphql` a la lista de `:50-84`, con `MY_SETTINGS_QUERY` y `UPDATE_MY_SETTINGS_MUTATION` en el `toEqual`. **Aquí y no en un arnés nuevo en `settings/`**: los bloques base (`type Query`, `type Mutation`, escalares) viven solo en `activity.schema.graphql`; un test propio para ajustes tendría que inventárselos. Añadir también un caso «con dientes» sobre `UserSettings`. |
| `src/features/vida/graphql/vida-items.graphql.ts` | M | `startTime` y `durationMinutes` dentro de `VIDA_ITEM_FIELDS` (`:1-11`): entra solo en un sitio y lo heredan las cuatro consultas y mutaciones, incluida `VIDA_SUGGESTIONS_FOR_DATE_QUERY` (criterio 18). |
| `src/features/settings/graphql/user-settings.graphql.ts` | M | `vidaDayStartTime` y `vidaDayEndTime` en las dos selecciones. |
| `src/features/settings/types/user-settings.types.ts` | M | Los dos campos en `UserSettings` (`string \| null`) y en `UpdateUserSettingsInput` (`?: string \| null`). |
| `src/features/vida/types/vida-item.types.ts` | M | `startTime: string \| null` y `durationMinutes: number \| null` en `VidaItem`; opcionales en `VidaItemCreateInput` y `VidaItemUpdateInput`, documentando que **`null` limpia** en update y que `durationMinutes` es entero > 0 (lo valida el API: `vida.service.ts:217-220`). |
| `src/features/vida/utils/vida-time.utils.ts` (+ `.test.ts`) | **N** | El rescate de `79bece0`: `parseTimeToMinutes`, `minutesToTime`, `normalizeTimeForDisplay/ForApi`, `calculateEndTime`, `formatDurationFromMinutes`, `isValidHhMm`, `isEndAfterStart`, y las constantes `DURATION_PILLS = [15, 30, 45, 60]`, `DEFAULT_BLOCK_MINUTES = 30`, `MIN_GAP_MINUTES = 15`, `VIDA_DAY_START_FALLBACK = '06:30'`, `VIDA_DAY_END_FALLBACK = '23:00'`. **Archivo hermano de `vida-date.utils.ts`, no dentro de él** (ver «Dónde NO va»). |
| `src/features/vida/hooks/useSaveVidaItemForActivity.ts` (+ `.test.tsx`) | M | `SaveVidaItemForActivityInput` gana `startTime: string \| null` y `durationMinutes: number \| null`; `planVidaItemSave` los compara para decidir `nothing` y los manda en `create` y en `update`. Las tres reglas de FEAT-002 (no crear un segundo ítem, reactivar el desactivado, no llamar si nada cambió) **siguen siendo las mismas y sus tests no se tocan**: se añaden casos. |
| `src/features/vida/components/VidaDurationPills/` (`.tsx`, `.module.scss`, `index.ts`, `.test.tsx`) | **N** | Las píldoras **15 · 30 · 45 · 1h · libre** con «libre» abriendo un campo en minutos. Sale a componente desde el primer día porque la tajada 3 la reutiliza **con píldoras apagadas** (criterio 26): prop `maxMinutes` opcional. |
| `src/features/vida/components/VidaActivitySheet/VidaActivitySheet.tsx` (+ `.module.scss`, `.test.tsx`) | M | Dentro del bloque `styles.template` (`:277-325`), tras la fila de días: «a qué hora» (`Input type="time"`, 24 h) y `VidaDurationPills`. Se **derivan** de `vidaItem` igual que `days`, ampliando `TemplateDraft` (`:24-27`) — **no** con `useEffect`. Los dos son opcionales (criterio 5): guardar sin ellos no se bloquea. |
| `src/features/vida/components/VidaActivityCard/VidaActivityCard.tsx` (+ `.module.scss`, `.test.tsx`) | M | En el bloque de `vidaItem` (`:110-134`): «8:00 · 40 min ·» antes de las siete letras, y «sin hora» discreto con la vía a la hoja cuando `startTime` es `null`. Ojo al criterio 54: la línea tiene que poder truncar. |
| `src/features/vida/hooks/useVidaDayHours.ts` (+ `.test.tsx`) | **N** | Envuelve `useUserSettingsQuery` y devuelve `{ startTime, endTime, isDefault, isPending, isError }` aplicando los respaldos 06:30 / 23:00. **Única fuente** de los criterios 9 y 50: nadie más lee los ajustes. |
| `src/features/vida/pages/VidaAjustesPage.tsx` (+ `.module.scss`, `.test.tsx`) | **N** | Dos campos `HH:mm`, validación «fin posterior a inicio» (criterio 10), `Alert` de error sin perder lo escrito, y la frase de «esto es el valor por defecto» cuando vienen nulos. Molde: `src/pages/app/SettingsPage/SettingsPage.tsx`. Guarda con `useUpdateUserSettingsMutation` tal cual. |
| `src/features/vida/routes/vida-paths.ts` | M | `ajustes: '/app/vida/ajustes'`. |
| `src/features/vida/routes/vida.routes.tsx` (+ `vida.routes.test.tsx`) | M | La ruta `ajustes`. |
| `src/layouts/AppLayout/app-nav.config.ts` | M | Bloque `settings: [...]` para el módulo `vida` (`:100-135`) con **una** entrada: «Ajustes de Vida», icono `sliders`/`gear`, keywords `['vida','ajustes','horario','día']`. Es **una sola fuente**: de ahí salen el popover «Ajustes» del módulo y `⌘K`. |

*Tajada 2 — la agenda del día, en solo lectura*

| Archivo | Nuevo/Modificado | Qué |
|---|---|---|
| `src/features/vida/utils/vida-agenda.utils.ts` (+ `.test.ts`) | **N** | El corazón puro: `buildDayAgenda({ planItems, dayStart, dayEnd, now })` → lista ordenada de `{ kind: 'block' \| 'gap' \| 'sliver' \| 'now' }` con sus minutos; `getDayBudget(...)` → `{ plannedMinutes, freeMinutes, plannedPercent, freePercent, nowPercent, remainingMinutes }`; `buildGuidanceLine(...)` (criterio 15, con sus cuatro variantes y **ninguna palabra de reproche**); `fitsInGap(gap, minutes)` y `suggestionsForGap(suggestions, gap, planItems)` (excluye por `activityId` presente en el plan y ordena las **sin duración** al final, criterios 18 y 19). Todo con `Date` inyectable para poder probarlo. |
| `src/features/vida/hooks/useVidaNowMinute.ts` | **N** | Rescate de `useCurrentTimeMarker`: tic de 60 s, devuelve `{ minutes, label }`, y **no tictaquea** si el día mostrado no es hoy (criterio 33). |
| `src/features/vida/hooks/useVidaDayData.ts` (+ `.test.tsx`) | **N** | Junta `useActivityDayPlanQuery(date)`, `useVidaSuggestionsForDateQuery(date)` y `useVidaDayHours()`, y devuelve un estado por consulta para que el criterio 52 pueda decir **qué falta** en vez de dejar la pantalla a medias. Usa las claves que ya existen; **no crea ninguna**. |
| `src/features/vida/components/VidaDayBudget/` (`.tsx`, `.module.scss`, `index.ts`, `.test.tsx`) | **N** | Fecha y hora, «te quedan Xh YY hasta las 23:00», barra proporcional con la marca de «ahora», leyenda con minutos (**texto real**, es la tabla del gráfico) y la línea de guía. |
| `src/features/vida/components/VidaAgendaBlock/` | **N** | Hora, icono y color de la categoría —**el mismo cruce por `Map` que hace `VidaActividadesPage:79`**—, nombre, duración y «en N min» en el primero que no ha empezado. Sin nada de vivir el día (criterio 22). |
| `src/features/vida/components/VidaAgendaGap/` | **N** | «Libre 10:30 – 13:00 · 2h 30» + hasta 3 fichas + «+ otra cosa» (en la tajada 2 las fichas **no colocan nada**: son lectura). |
| `src/features/vida/components/VidaTemplateAside/` | **N** | El lateral de escritorio: «Tu plantilla de \<día\>» marcando lo que ya está en el plan (criterio 48). «Mañana» llega en la tajada 5. |
| `src/features/vida/pages/VidaHoyPage.tsx` (+ `.module.scss`, `.test.tsx`) | M (sustituye el cascarón de 6 líneas) | Compone lo anterior. Criterio 20: `ref` en la marca de «ahora» + `scrollIntoView({ block: 'center' })` una sola vez al montar, **sin** ocultar lo anterior. |

*Tajada 3 — poner algo en un hueco*

| Archivo | Nuevo/Modificado | Qué |
|---|---|---|
| `src/features/vida/utils/vida-gap-form.utils.ts` (+ `.test.ts`) | **N** | Rescate de `79bece0:activity-time.utils.ts:399-437`: duraciones posibles en un hueco (criterio 26), horas ofrecidas dentro del hueco (criterio 27), «queda libre después» (criterio 28) y el `endTime` que se manda al API. |
| `src/features/vida/components/VidaPlaceInGapSheet/` (`.tsx`, `.module.scss`, `index.ts`, `.test.tsx`) | **N** | La hoja de tres preguntas. Mismo molde que `VidaActivitySheet`: `SteppedModal` `ds="aura"` + `mobileSheet`, `key` por apertura, `onSuccess` local (criterio 29). «Qué» = plantilla del día primero + buscador con `filterActivitiesBySearch` sobre `useActivitiesQuery` sin archivadas. |
| `src/features/vida/components/VidaAgendaGap/` | M | Un toque en una ficha llama a `useAddDayPlanItemMutation` con `startTime` = inicio del hueco (criterio 23). |
| `src/features/vida/components/VidaAgendaBlock/` | M | El «···» (`Popover` + `IconButton icon="ellipsis"`, igual que `VidaActivityCard:137-143`) con «Quitar del plan» (`useRemoveDayPlanItemMutation`, con `useConfirmDialog` y botón de salida «Volver», nunca «Cancelar») y «Cambiar hora o duración» (`useEditDayPlanItemMutation`, reusando `vida-gap-form.utils.ts` con el hueco **ampliado** al espacio del propio bloque). |
| `src/features/vida/pages/VidaHoyPage.tsx` | M | Cablea la hoja y el hueco elegido. |

*Tajada 4 — cualquier día, no solo hoy*

| Archivo | Nuevo/Modificado | Qué |
|---|---|---|
| `src/features/vida/utils/vida-window.utils.ts` (+ `.test.ts`) | **N** | La ventana de D5 (`getPlanningWindow()` → `{ from: hoy, to: domingo de la semana siguiente }`, sobre `getMondayOfWeek`), `buildDayStrip(selectedDate)` (7 días desde dos antes, recortados a la ventana), `isEditableDate(date)` (criterio 38) y `sameWeekdayLastWeek(date)` (criterio 36). |
| `src/features/vida/hooks/useVidaWeekPlans.ts` (+ `.test.tsx`) | **N** | Los puntos de la tira: `useQueries` con **`vidaKeys.dayPlan.byDate(d)` para cada día**, la misma clave y la misma `queryFn` que `useActivityDayPlanQuery`. Así el día abierto es un acierto de caché, `invalidateDayPlanQueries` sigue valiendo para los dos y **no se inventa ninguna clave de rango**. |
| `src/features/vida/components/VidaDayStrip/` | **N** | La tira con el punto rayado / vacío y el borde explicado (criterio 35). |
| `src/features/vida/pages/VidaHoyPage.tsx` | M | El día visto sale de `useSearchParams()`: **`/app/vida/hoy?d=YYYY-MM-DD`** (sin parámetro = hoy). Recarga y «atrás» salen gratis; la píldora «Hoy» sigue encendida porque la ruta no cambia. |
| `src/features/vida/routes/vida-paths.ts` | M | `hoyForDate(date)` → `/app/vida/hoy?d=<date>` — un solo sitio construye la URL. |
| `src/features/vida/components/VidaDayActions/` | **N** | «Copiar del \<mismo día\> pasado» (lee `vidaKeys.dayPlan.byDate(date - 7)` y escribe con `useSetActivityDayPlanMutation`; apagado y explicado si aquel día no tuvo plan) y «Vaciar y rehacer» (`useConfirmDialog` nombrando cuántos bloques; `activityDayPlanSet` con `items: []`). Solo en hoy y futuros. |

*Tajada 5 — la semana y armar desde la plantilla*

| Archivo | Nuevo/Modificado | Qué |
|---|---|---|
| `src/features/vida/utils/vida-build-day.utils.ts` (+ `.test.ts`) | **N** | La pieza central, **pura**: `buildDayFromTemplate(suggestions, { dayStart, dayEnd })` → `{ items: ActivityDayPlanSetItemInput[], movedCount, withoutTimeCount, droppedCount }`. Copia hora y duración del ítem (criterio 41), corre detrás lo que se pisaría conservando su duración y lo cuenta (criterio 43), y encadena al final los que no tienen hora con su duración o con `DEFAULT_BLOCK_MINUTES` (criterio 44). Si algo no cabe antes de `dayEnd`, **se dice**, no se descarta en silencio. |
| `src/features/vida/hooks/useBuildDayFromTemplate.ts` (+ `.test.tsx`) | **N** | Un día: lee `vidaSuggestionsForDate(date)`, llama a `useSetActivityDayPlanMutation` **una sola vez** (criterio 42) y devuelve el resumen para el mensaje. |
| `src/features/vida/hooks/useBuildWeekFromTemplate.ts` (+ `.test.tsx`) | **N** | La semana: solo los días **sin plan**, en serie, acumulando `{ done[], failed[] }` para el criterio 46. No aborta al primer fallo y **no anuncia lo que no pasó**. |
| `src/features/vida/pages/VidaSemanaPage.tsx` (+ `.module.scss`, `.test.tsx`) | **N** | Una línea por día (criterio 39), «Ver» → `vidaPaths.hoyForDate(d)`, «Armar» en los vacíos, y «Armar toda la semana» con el aviso previo (criterio 45). Los días pasados se describen por lo **planeado** (criterio 40). |
| `src/features/vida/routes/vida-paths.ts`, `routes/vida.routes.tsx` | M | `semana: '/app/vida/semana'` + su ruta. **No** entra como píldora en la barra: se llega desde la tira de Hoy. La barra la define F4 con «Plantilla». |
| `src/features/vida/components/VidaTemplateAside/` | M | Gana el bloque «Mañana» con «Armar mañana desde la plantilla» (criterio 48). |
| `src/features/vida/components/VidaAgendaGap/`, `VidaHoyPage.tsx` | M | El día sin plan gana el botón «Armar desde la plantilla» (ver la nota de recorte del criterio 21 más abajo). |

### Lo que NO se crea

- **Ninguna mutación, `api` ni documento GraphQL del plan del día**: los cinco
  existen en `graphql/activity-day-plan.graphql.ts`, `api/activity-day-plan.api.ts`
  y `hooks/useActivityDayPlan.ts`, con tests.
- **Ningún hook de ajustes nuevo ni clave de caché de ajustes**:
  `useUserSettingsQuery` / `useUpdateUserSettingsMutation` y `settingsKeys.my()`
  se usan tal cual (criterio 8). `useVidaDayHours` es un envoltorio de lectura,
  no otra consulta.
- **Ninguna clave nueva en `query-keys.ts`.** Las tres consultas por día y los
  siete días de la tira caben en `vidaKeys.dayPlan.byDate`,
  `vidaKeys.items.suggestions`, `vidaKeys.activities.list` y `settingsKeys.my`.
- **Ninguna invalidación nueva**: `invalidateDayPlanQueries` (por fecha) e
  `invalidateVidaItemQueries` (por prefijo, arrastra las sugerencias de
  cualquier fecha) ya cubren todo lo que esta feature escribe.
- **Ningún componente de `shared/ui`**: `SteppedModal`, `Popover`, `IconButton`,
  `ConfirmDialog`, `Alert`, `Skeleton`, `EmptyState`, `Input`, `FormField`,
  `Switch`, `Button`, `Card`, `AppIcon`, `Badge` ya están.
- **Ningún normalizador de texto ni buscador nuevo**: `filterActivitiesBySearch`
  y `normalizeVidaText`. (Y no se añade la quinta copia del normalizador.)
- **Ningún icono nuevo importado a pelo de Font Awesome**: los del cromo entran
  de uno en uno por `@/shared/icons`.
- **Ninguna utilidad de fecha nueva**: `vida-date.utils.ts` ya da todo lo de
  `YYYY-MM-DD`, lunes de la semana y día de la semana.

### Dónde NO va

- **Las utilidades de hora NO van dentro de `vida-date.utils.ts`.** Ese archivo
  lo importa la capa de datos entera (hooks, invalidaciones, la hoja, la
  tarjeta); meterle 200 líneas de geometría de pantalla lo convierte en un
  cajón. Van en `utils/vida-time.utils.ts` (formato y aritmética de `HH:mm`) y
  `utils/vida-agenda.utils.ts` (huecos, presupuesto y guía), que importan de
  `vida-date.utils.ts` y no al revés.
- **El día visto NO va como segmento de ruta** (`/app/vida/hoy/:date`).
  Obligaría a una segunda entrada en `vida.routes.tsx` y a decidir qué hace la
  píldora de `app-nav.config.ts` —que es **una sola fuente** de destinos— con
  una URL que no está en la lista. Con `?d=` la ruta sigue siendo una,
  `vidaPaths.hoy` no se duplica y la píldora se enciende igual.
- **Los ajustes de Vida NO van en `/app/settings`** (es la cuenta, no el
  módulo) **ni en una hoja desde Hoy** (se abrirían y cerrarían para dos campos
  que casi nunca cambian, y no tendrían URL). Van en `/app/vida/ajustes`, en el
  popover «Ajustes» del módulo, **exactamente como Categorías/Medidas/Mi
  Persona en hábitos** (`app-nav.config.ts:73-95`).
- **`/app/vida/categorias` NO se mueve** al popover de ajustes en esta feature
  aunque «encajaría»: hoy se llega desde el pie del catálogo
  (`VidaActividadesPage.tsx:217`) y cambiarlo es tocar FEAT-002 sin criterio que
  lo pida. Se anota, no se hace.
- **NO se usa `SearchSelect`** para el buscador de «qué»: tiene **2 tests
  fallando en la línea base** y arrastrarlo mete ruido en el criterio 57. Un
  `Input` + `filterActivitiesBySearch`, como el catálogo.
- **NO se arregla `Popover`** (no se cierra desde su contenido; queda pintado
  sobre el `ConfirmDialog`; `role="dialog"` sin nombre). Es un hallazgo abierto
  de FEAT-002, afecta también a hábitos, y arreglarlo es **otra tarea con su
  propio dossier**. Aquí se imita el comportamiento que ya hay.
- **NO se toca `--color-text-muted`** (2,39:1 en claro, hallazgo abierto de
  FEAT-002). Lo nuevo usa `--color-text-secondary` para lo que tenga que leerse,
  como ya hizo la tajada 3 de FEAT-002.
- **NO se restaura `activity-time.utils.ts` entero** ni sus tipos
  `activity-timeline.types.ts`: alturas en píxeles proporcionales a minutos son
  una cuadrícula de horas, descartada por la decisión 5 del plan de Vida. La
  agenda es una **lista ordenada por hora**.
- **NO se deriva nada del historial** (D1): ni «sueles tardar 55 min», ni «a tu
  ritmo real», ni «movido aquí», ni «4 de 5 días», ni el «seguiste N de M» de la
  semana. Están dibujados en los renders y son F5/F6.
- **NO se pinta ningún tramo de ejecutado** ni los colores *hecho · en marcha ·
  seguido · de más · fuera del plan · sin dato*: en F2 la leyenda tiene dos
  tramos, **planeado** y **libre** (criterios 14 y 22).

### Las tajadas, con sus archivos

| # | Qué hace | Archivos | Criterios que cierra | Estado |
|---|---|---|---|---|
| 1 | **La plantilla con hora y duración, y los ajustes de Vida.** | `graphql/schema/vida.schema.graphql` · `settings/graphql/schema/user-settings.schema.graphql` (N) · `graphql/contracts.test.ts` · `graphql/vida-items.graphql.ts` · `settings/graphql/user-settings.graphql.ts` · `settings/types/user-settings.types.ts` · `types/vida-item.types.ts` · `utils/vida-time.utils.ts` (N) · `hooks/useSaveVidaItemForActivity.ts` · `hooks/useVidaDayHours.ts` (N) · `components/VidaDurationPills/` (N) · `components/VidaActivitySheet/` · `components/VidaActivityCard/` · `pages/VidaAjustesPage.tsx` (N) · `routes/vida-paths.ts` · `routes/vida.routes.tsx` · `layouts/AppLayout/app-nav.config.ts` | 1–10, y la parte de 53–57 que toca la hoja, la tarjeta y los ajustes | pending |
| 2 | **La agenda del día, en solo lectura.** | `utils/vida-agenda.utils.ts` (N) · `hooks/useVidaNowMinute.ts` (N) · `hooks/useVidaDayData.ts` (N) · `components/VidaDayBudget/` (N) · `components/VidaAgendaBlock/` (N) · `components/VidaAgendaGap/` (N) · `components/VidaTemplateAside/` (N) · `pages/VidaHoyPage.tsx` | 11–20, 22, 48 (la mitad «Tu plantilla de \<día\>»), 49–56; **21 solo en su mitad de texto** (ver nota) | pending |
| 3 | **Poner algo en un hueco.** | `utils/vida-gap-form.utils.ts` (N) · `components/VidaPlaceInGapSheet/` (N) · `components/VidaAgendaGap/` · `components/VidaAgendaBlock/` · `pages/VidaHoyPage.tsx` | 23–30, y 29/52/56 sobre las mutaciones | pending |
| 4 | **Cualquier día, no solo hoy.** | `utils/vida-window.utils.ts` (N) · `hooks/useVidaWeekPlans.ts` (N) · `components/VidaDayStrip/` (N) · `components/VidaDayActions/` (N) · `pages/VidaHoyPage.tsx` · `routes/vida-paths.ts` | 31–38 | pending |
| 5 | **La semana y armar desde la plantilla.** | `utils/vida-build-day.utils.ts` (N) · `hooks/useBuildDayFromTemplate.ts` (N) · `hooks/useBuildWeekFromTemplate.ts` (N) · `pages/VidaSemanaPage.tsx` (N) · `components/VidaTemplateAside/` · `components/VidaAgendaGap/` · `routes/vida-paths.ts` · `routes/vida.routes.tsx` | 39–46, 48 (la mitad «Mañana»), y **la mitad de 21 que es el botón**; 47 lo cronometra el usuario | pending |

**Las cinco tajadas se quedan como las cortó el analista.** Miradas contra el
código, el corte aguanta: la 1 no depende de ninguna pantalla nueva, la 2 se ve
entera con datos sintéticos, la 3 es la primera que escribe plan, la 4 solo
cambia de dónde sale la fecha y la 5 es una pantalla más una operación por
lotes. **Un solo recorte, y queda escrito:**

> **El criterio 21 se parte entre la tajada 2 y la 5.** En la 2, «hoy sin plan»
> se lee entero —el día es un hueco, se dice cuántas cosas trae la plantilla ese
> día y, si no hay plantilla, se enlaza al catálogo— pero **el botón «Armar
> desde la plantilla» no puede funcionar**: armar es `vida-build-day.utils.ts` +
> `activityDayPlanSet`, que son la tajada 5. Pintar un botón muerto en la 2
> sería peor que no pintarlo. La mitad que es texto cierra en la 2; el botón
> cierra en la 5 junto a los criterios 41–44. No reescribo el criterio: lo parto
> y lo digo.

### Cómo se verifica cada tajada

Los agentes **no entran con credenciales** (`docs/features/ENVIRONMENT.md`), así
que todo lo de `/app/*` se comprueba con **tests + arnés temporal**, y el
recorrido real es del usuario (criterio 58) **y además necesita el API
desplegada**. Escrito así, sin disimular.

- **Siempre, en toda tajada:** `pnpm typecheck` (limpio), `pnpm lint` (no peor
  que 14 errores / 0 warnings), `pnpm test` (sin fallos nuevos sobre los 2 de
  `SearchSelect`), y `pnpm build` al cerrar (el chunk inicial no crece por
  iconos). `graphify update .` después de tocar código.
- **Tajada 1:** `pnpm test src/features/vida/graphql/contracts.test.ts` es el
  juez de los criterios 1 y 57 — y **es el único sitio donde se entera de que el
  SDL cambió**. Tests de `planVidaItemSave` (2, 4, 5), de la hoja (3, 5) y de la
  tarjeta (6). Los ajustes (7–10) con test de página + arnés. **Aviso:** con el
  SDL recopiado, `pnpm test` puede estar verde mientras Cloud Run rechaza los
  campos nuevos; eso **no es un fallo del constructor**.
- **Tajada 2:** el grueso son tests puros de `vida-agenda.utils.ts` (13, 14, 15,
  17, 18, 19) — ahí se cierran los números sin pintar nada. Luego tests de
  componente para 11, 12, 16, 20, 21, 22 y **arnés temporal** (`.html` + `.tsx`
  bajo `src/`, `MemoryRouter`, datos sintéticos, **borrado antes de reportar**)
  para 53 (375 px), 54 (nombre de ~60 caracteres), 55 (tema oscuro, contrastes
  medidos) y 56 (el DOM no contiene «desperdici», «perdiste», «fallaste»,
  «vacío» como reproche, «cancelar», «eliminar»). Con la ventana oculta:
  `document.getAnimations().forEach(a => a.finish())` y `dispatchEvent(new
  Event('scroll'))` tras `scrollTo`.
- **Tajada 3:** tests puros de `vida-gap-form.utils.ts` (26, 27, 28) y tests de
  la hoja con `QueryClient` y mutación que falla (29: la hoja no se cierra, no
  pierde lo elegido, y la agenda no queda con un bloque fantasma). 30 con el
  test del «···».
- **Tajada 4:** tests puros de `vida-window.utils.ts` (31, 35, 36, 38) con
  `Date` inyectada, y test de página con `MemoryRouter` en
  `/app/vida/hoy?d=…` (34). 32 y 33 con `useQueries` mockeado.
- **Tajada 5:** `vida-build-day.utils.ts` es todo test puro (41, 43, 44) —
  incluido el caso de dos ítems que se pisan y el de tres sin hora. 45 y 46 con
  mutación que falla al tercer día: se comprueba que **no** se anuncia «semana
  armada». 47 y 58 **los cronometra y los recorre el usuario**.
- **Renders como referencia visual:** `http://localhost:5173/docs/vida/assets/03-vida-agenda.html`
  y `…/04-vida-planeado-ejecutado.html` (marcos **A** y **C**; el **B** es F3).

### Lo que no pude averiguar

- **Si la API desplegada ya lleva `15463da`.** Leí el commit en el repo hermano
  (SDL, resolvers, servicio y validadores: `startTime` sale siempre `HH:mm`,
  `null` limpia en update, `durationMinutes > 0` se valida en
  `vida.service.ts:217-220`), pero **no probé una consulta real**: está detrás
  del login. El criterio 58 sigue siendo del usuario.
- **El comportamiento de `takenToday` en un día futuro lo deduje del código del
  servicio**, no de una respuesta real. La conclusión —que no sirve para saber
  si algo está en el plan— es firme igualmente: sale de `vidaTakenToday`, que es
  otra tabla.
- **El coste real de siete `useActivityDayPlanQuery` a la vez** (tira de días)
  no está medido: son siete consultas pequeñas con `staleTime: 30 s` y caché
  compartida con el día abierto, pero si en la tajada 4 se nota, la alternativa
  es pedir solo el día visto y llenar los puntos perezosamente. Queda anotado.

---

*Escrito por `feature-architect` el 2026-09-20. Fuentes: la sección 1 entera,
`docs/features/PROTOCOL.md`, `docs/features/ENVIRONMENT.md`, `docs/vida/PLAN.md`
(F2 y las decisiones 3, 5, 8, 9, 10, 12 y 13), las secciones 2–4 de
`FEAT-001` y `FEAT-002`, los renders 03 y 04 abiertos en el navegador, el código
vivo de `src/features/vida/`, `src/features/settings/` y `src/shared/api/`,
`git show 79bece0:…` para lo de tiempo, y el commit `15463da` de
`~/Developer/xavi-platform-node`.*

## 3. Construcción — feature-builder

*(pendiente)*

## 4. Revisión — feature-reviewer

*(pendiente)*
