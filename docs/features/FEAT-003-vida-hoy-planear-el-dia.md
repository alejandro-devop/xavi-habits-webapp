---
id: FEAT-003
title: Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos
status: building
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
| 1 | **La plantilla con hora y duración, y los ajustes de Vida.** Prerrequisito de todo lo demás: SDL recopiado y contratos verdes, tipos y hooks de `vida-items` con `startTime`/`durationMinutes`, la hoja de F1 gana «a qué hora» y «cuánto» (15 · 30 · 45 · 1h · libre), la tarjeta del catálogo los enseña, y una pantalla/hoja de ajustes de Vida con el inicio y el fin del día. Ya es útil sola: la plantilla deja de ser una lista sin orden y pasa a ser un día. | accepted |
| 2 | **La agenda del día, en solo lectura.** El presupuesto (tiempo que queda, barra del día con la marca de «ahora», leyenda y línea de guía), los bloques del `activityDayPlan` ordenados por hora, los huecos con su tamaño y las sugerencias de la plantilla que caben (sin poder ponerlas aún), apertura en «Ahora», el lateral de escritorio, y todos los estados. Primera vez que el usuario ve su día repartido y dónde tiene sitio. | accepted |
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
| 1 | **La plantilla con hora y duración, y los ajustes de Vida.** | `graphql/schema/vida.schema.graphql` · `settings/graphql/schema/user-settings.schema.graphql` (N) · `graphql/contracts.test.ts` · `graphql/vida-items.graphql.ts` · `settings/graphql/user-settings.graphql.ts` · `settings/types/user-settings.types.ts` · `types/vida-item.types.ts` · `utils/vida-time.utils.ts` (N) · `hooks/useSaveVidaItemForActivity.ts` · `hooks/useVidaDayHours.ts` (N) · `components/VidaDurationPills/` (N) · `components/VidaActivitySheet/` · `components/VidaActivityCard/` · `pages/VidaAjustesPage.tsx` (N) · `routes/vida-paths.ts` · `routes/vida.routes.tsx` · `layouts/AppLayout/app-nav.config.ts` | 1–10, y la parte de 53–57 que toca la hoja, la tarjeta y los ajustes | accepted |
| 2 | **La agenda del día, en solo lectura.** | `utils/vida-agenda.utils.ts` (N) · `hooks/useVidaNowMinute.ts` (N) · `hooks/useVidaDayData.ts` (N) · `components/VidaDayBudget/` (N) · `components/VidaAgendaBlock/` (N) · `components/VidaAgendaGap/` (N) · `components/VidaTemplateAside/` (N) · `pages/VidaHoyPage.tsx` | 11–20, 22, 48 (la mitad «Tu plantilla de \<día\>»), 49–56; **21 solo en su mitad de texto** (ver nota) | accepted (2ª entrega) |
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

### Tajada 1 — La plantilla con hora y duración, y los ajustes de Vida

**Resumen para el revisor:**
1. La plantilla de Vida dejó de ser una bolsa de cosas por día: cada `VidaItem`
   puede decir **a qué hora** y **cuánto**, se pone desde la hoja del catálogo
   con las píldoras 15 · 30 · 45 · 1h · libre, se lee en la tarjeta («8:00 ·
   40 min · L M X J V») y hay una pantalla nueva, `/app/vida/ajustes`, con el
   inicio y el fin del día sobre `useUserSettings`.
2. Vive en `src/features/vida/` salvo tres archivos de `src/features/settings/`
   (SDL vendorizado nuevo, dos campos en el documento y dos en el tipo) y una
   entrada `settings` para Vida en `src/layouts/AppLayout/app-nav.config.ts`.
3. **Lo que más probablemente rompí:** `planVidaItemSave` ahora manda
   **siempre** `startTime` y `durationMinutes` en el `update`, y `null` es lo
   que los **limpia** en el API. Cualquier futuro caller que no pase los dos
   campos borrará la hora del ítem sin querer — hoy el único caller es
   `VidaActivitySheet` y sí los pasa, pero es la trampa de este cambio. Segundo
   sospechoso: `UserSettings` ganó dos campos **obligatorios** en el tipo, así
   que todo fixture de ajustes de cualquier feature tiene que traerlos.

**Lo que se construyó**

| Archivo | Qué |
|---|---|
| `src/features/vida/graphql/schema/vida.schema.graphql` | SDL **recopiado literal** del repo hermano (commit `15463da`) con un script, no a mano: se extrae la cadena `gql` de `vidaTypeDefs` y se pega bajo la cabecera, que ahora dice `Copiado: 2026-09-20` y el commit de origen. |
| `src/features/settings/graphql/schema/user-settings.schema.graphql` (N) | Igual, con `userSettingsTypeDefs`. Autocontenido: solo referencia `DateTime` y hace `extend type Query`/`Mutation`. |
| `src/features/vida/graphql/contracts.test.ts` | El esquema combinado pasa de tres SDL a cuatro; los dos documentos de ajustes entran en la lista; tres casos nuevos: hora y duración en el tipo y en los dos inputs, el horario de Vida anulable en `UserSettings`, y «dientes» sobre `UserSettings`. |
| `src/features/vida/graphql/vida-items.graphql.ts` | `startTime` y `durationMinutes` dentro de `VIDA_ITEM_FIELDS`: entran en un sitio y los heredan las cuatro consultas y mutaciones, **incluida** `VIDA_SUGGESTIONS_FOR_DATE_QUERY` (lo que necesita el criterio 18 de la tajada 2). |
| `src/features/settings/graphql/user-settings.graphql.ts`, `types/user-settings.types.ts` | `vidaDayStartTime` / `vidaDayEndTime` en las dos selecciones, en `UserSettings` (obligatorios, `string \| null`) y en `UpdateUserSettingsInput` (opcionales). |
| `src/features/vida/types/vida-item.types.ts` | `startTime: string \| null` y `durationMinutes: number \| null` en `VidaItem`; opcionales en los dos inputs, documentando que **`null` limpia** en update y que la duración es entero > 0. |
| `src/features/vida/utils/vida-time.utils.ts` (+ `.test.ts`, 15 casos) | El rescate de `79bece0` función por función: `normalizeTimeForDisplay/ForApi`, `parseTimeToMinutes`, `minutesToTime`, `isValidHhMm`, `isEndAfterStart`, `calculateEndTime`, `formatDurationFromMinutes`, `formatDurationMinutes`, `formatTimeForDisplay`, y las constantes `DURATION_PILLS`, `DEFAULT_BLOCK_MINUTES`, `MIN_GAP_MINUTES`, `VIDA_DAY_START_FALLBACK`, `VIDA_DAY_END_FALLBACK`. Archivo **hermano** de `vida-date.utils.ts`. |
| `src/features/vida/hooks/useSaveVidaItemForActivity.ts` (+ test, 6 casos nuevos) | `SaveVidaItemForActivityInput` gana los dos campos; se comparan para decidir `nothing`; al **crear** no se manda lo que no hay, al **actualizar** se manda `null` explícito para limpiar. Las tres reglas de FEAT-002 siguen idénticas. |
| `src/features/vida/components/VidaDurationPills/` (N, 8 tests) | 15 · 30 · 45 · 1h · libre; «libre» abre un campo en minutos; `maxMinutes` apaga lo que no cabe y lo dice (lo reutiliza la tajada 3). Volver a tocar la elegida la quita: la duración es opcional. |
| `src/features/vida/components/VidaActivitySheet/` (+ `.module.scss`, 5 tests nuevos) | Dentro del bloque «Ponerla en mi plantilla», tras la fila de días: «A qué hora» (`Input type="time"`) y `VidaDurationPills`. `TemplateDraft` crece a cuatro campos y los cuatro se **derivan** de `vidaItem` —nada de `useEffect`—, con un único `patchTemplate`. |
| `src/features/vida/components/VidaActivityCard/` (+ `.module.scss`, 3 tests nuevos) | «8:00 · 40 min ·» antes de las siete letras. Sin hora: «sin hora» subrayado, que **abre la hoja** (`onEdit`). La línea envuelve con `flex-wrap` y trunca. |
| `src/features/vida/hooks/useVidaDayHours.ts` (+ test, 7 casos) (N) | Envoltorio de lectura sobre `useUserSettingsQuery`: `{ startTime, endTime, isDefault, saved, isPending, isError, isDisabled }` con los respaldos 06:30 / 23:00. **Única fuente** de los criterios 9 y 50. |
| `src/features/vida/pages/VidaAjustesPage.tsx` (+ `.module.scss`, `.test.tsx`, 12 tests) (N) | Dos campos y nada más, validación «fin posterior a inicio», `Alert` de error sin perder lo escrito y la frase de «es el valor por defecto». |
| `src/features/vida/routes/vida-paths.ts`, `routes/vida.routes.tsx` (+ test) | `ajustes: '/app/vida/ajustes'` y su ruta. |
| `src/layouts/AppLayout/app-nav.config.ts` (+ los dos tests de `layouts`) | Bloque `settings` para el módulo `vida` con **una** entrada, «Ajustes de Vida», icono `sliders`. De ahí salen el popover «Ajustes» del módulo y `⌘K`: una sola fuente. |

**Por qué así, y qué se descartó**

- **El SDL se recopió con un script**, extrayendo la cadena `gql` del commit
  `15463da` con una expresión regular, precisamente para no editarlo campo por
  campo: el riesgo conocido de este arnés es que alguien «arregle» el SDL a mano
  para que pase un test.
- **El SDL de ajustes se valida en `contracts.test.ts` de Vida y no en un arnés
  propio de `settings/`**, como mandaba el plan: los bloques base (`type Query`,
  `type Mutation`, escalares) viven solo en `activity.schema.graphql` y un test
  propio tendría que inventárselos. Queda dicho en la cabecera del test.
- **Desviación del plan, pequeña y a propósito:** `vida-time.utils.ts` exporta
  **dos** formateadores de duración, no uno. `formatDurationFromMinutes` es la
  forma corta del render («2h 30», «45m») y la usará la agenda; pero el
  criterio 6 pide literalmente «8:00 · **40 min**» en la tarjeta, así que se
  rescató también `formatDurationMinutes` (la forma larga) para ese sitio. Son
  siete líneas y evitan que la tarjeta contradiga su criterio.
- **Segunda desviación:** el plan no pedía `formatTimeForDisplay`. Existe porque
  los renders de Vida escriben «8:00» y no «08:00», y esa decisión tiene que
  estar en un solo sitio antes de que la tajada 2 pinte cincuenta horas.
- **`planVidaItemSave` recibe los dos campos como obligatorios**, no opcionales.
  Opcionales habrían dejado los tests de FEAT-002 intactos, pero un caller que
  se olvidara de pasarlos **limpiaría** la hora del ítem en silencio. Con el
  tipo obligatorio, el compilador lo caza. El precio es que los `toEqual` de dos
  tests de FEAT-002 crecieron con `startTime: null, durationMinutes: null`: las
  reglas no cambiaron, el payload sí, y está comentado en el test.
- **Apagar el interruptor no limpia la hora ni la duración.** Se quedan donde
  están, igual que los días y la nota (criterio 20 de FEAT-002). Hay un test.
- **`UserSettings` gana los dos campos como obligatorios en el tipo** (`string
  \| null`) porque el documento los pide siempre: hacerlos opcionales habría
  dejado pasar un fixture incompleto sin que nadie se enterara. Eso obligó a
  tocar los fixtures de `VidaItem` de siete archivos de test, todos mecánicos.
- **Los dos tests que afirmaban «Vida no tiene ajustes de módulo»**
  (`app-nav.config.test.ts:126` y `AppLayout.test.tsx:106`) **se invirtieron**:
  ahora comprueban que hay exactamente una entrada y que apunta a
  `vidaPaths.ajustes`. Era una afirmación de F0 que esta tajada deroga por
  criterio 7, no un test que estorbara.
- **`vida.routes.test.tsx` mockea `useUserSettings`** además de
  `useVidaQueryGuard`: la pantalla de ajustes llega al contexto de sesión por
  `useAuthBootstrap`, que ese arnés no monta. Se devuelve la consulta
  deshabilitada, que es el «sin sesión» del resto.
- **Nada de lo prohibido:** ni normalizador de texto nuevo (sigue habiendo
  cuatro copias, hallazgo abierto de FEAT-002, y aquí **no crece**), ni arreglo
  de `Popover`, ni `--color-text-muted` —todo lo nuevo que hay que leer usa
  `--color-text-secondary`—, ni iconos importados a pelo de Font Awesome, ni
  clave de caché nueva, ni hook de ajustes nuevo.

**Verificación**

Línea base (antes de empezar, los tres enteros):

```
pnpm typecheck  → limpio
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)
pnpm test       → Test Files 1 failed | 76 passed (77) · Tests 2 failed | 645 passed (647)
                  (SearchSelect ×2, preexistentes)
```

Al cerrar:

```
pnpm typecheck  → limpio
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)   (los mismos 14)
pnpm test       → Test Files 1 failed | 80 passed (81) · Tests 2 failed | 706 passed (708)
                  (los mismos 2 de SearchSelect; +61 tests nuevos, 0 fallos nuevos)
pnpm build      → index 861,01 kB · app-icons 620,20 kB (perezoso) · IconPicker 4,64 kB
```

El chunk inicial pasa de **853,2 kB a 861,01 kB (+7,8 kB)**: es la pantalla
nueva, el componente de píldoras y las utilidades de hora. **No crece por
iconos** — `app-icons` sigue en 620,20 kB perezoso y `IconPicker` en 4,64 kB,
que es lo que pedía el criterio 57.

Arnés temporal (`src/harness-feat003-t1/`, `.html` + `.tsx`, `MemoryRouter`,
datos sintéticos, **borrado**; `git status` ya no lo lista) servido por el Vite
del usuario en `http://localhost:5173`. Con él, a 375 px:

- La tarjeta con «8:00 · 40 min · L M X J V S D» y otra con un nombre de 63
  caracteres y «sin hora ·»: `document.documentElement.scrollWidth` **375** =
  `clientWidth` **375**, y `scrollWidth - clientWidth` de las dos tarjetas = **0**.
  El nombre largo trunca con elipsis y las casillas bajan de línea.
- La hoja abierta: «A qué hora», las cinco píldoras y el campo de minutos caben,
  y «Guardar» se ve sin hacer scroll dentro de la hoja.
- Los ajustes: los dos campos y la frase «06:30 y 23:00 son el horario por
  defecto: todavía no has elegido el tuyo».

Contrastes medidos en el DOM (componiendo el alfa de cada capa; AA pide 4,5:1):

| Qué | Claro | Oscuro |
|---|---|---|
| Tarjeta «8:00 · 40 min» | 16,38:1 | 17,57:1 |
| Tarjeta «sin hora» | 16,38:1 | 17,57:1 |
| Píldora apagada («15») | 7,34:1 | 6,66:1 |
| Píldora elegida («libre») | 5,45:1 | 11,56:1 |
| Ajustes, «es el valor por defecto» | 7,44:1 | 8,59:1 |

**Criterios que cierra, uno por uno**

- **1 — cerrado.** SDL recopiado de `15463da` con fecha y origen en la cabecera;
  `VIDA_ITEM_FIELDS` pide los dos campos; el SDL de ajustes es nuevo y sus dos
  documentos entran en la lista de `contracts.test.ts`.
  `pnpm test src/features/vida/graphql/contracts.test.ts` → **73 passed**.
- **2 — cerrado.** Tipos con los dos campos; `planVidaItemSave` los propaga al
  crear y al actualizar. Los tres tests de FEAT-002 (no crear un segundo ítem,
  reactivar el desactivado, no llamar si nada cambió) siguen verdes, más
  «misma hora y misma duración: sigue sin haber viaje».
- **3 — cerrado.** Test «con el interruptor encendido aparecen “a qué hora” y
  las píldoras» (`type="time"` + 15 · 30 · 45 · 1h · libre) y «al crear, la hora
  y la duración elegidas llegan al `VidaItem`» (`{ startTime: '08:00',
  durationMinutes: 45 }`). «libre» abre el campo en minutos: test propio del
  componente. **Con una salvedad, abajo en riesgos: el formato que *pinta* un
  `input type="time"` lo decide el navegador, no nosotros.**
- **4 — cerrado.** Test «editando, la hora y la duración vienen puestas y
  actualizan EL MISMO ítem»: `createVidaItem.mutate` no se llama,
  `updateVidaItem.mutate` una vez con `{ id: 'v1', … }`. Lo de «sin recargar» lo
  sostiene la invalidación de F0, que no se tocó.
- **5 — cerrado.** Test «con días y sin hora se guarda igual»: el payload es
  `{ activityId, days }` y no hay error ni campo señalado. Los ítems de F1
  (`startTime: null`) siguen siendo válidos: son los fixtures de todos los demás
  tests.
- **6 — cerrado.** Tres tests de la tarjeta: con hora y duración se lee
  «8:00 · 40 min»; con hora y sin duración **no se inventa** ninguna; sin hora se
  lee «sin hora» y tocarlo llama a `onEdit` (abre la hoja). Visto también en el
  arnés a 375 px.
- **7 — cerrado.** `/app/vida/ajustes`, en el popover «Ajustes» del módulo
  (`app-nav.config.ts`, una sola fuente, también `⌘K`). Test: los dos campos son
  `type="time"` y **no hay ningún otro control** (`textbox`, `switch` y
  `spinbutton` a cero).
- **8 — cerrado en lo que se puede desde aquí.** Test: guardar llama a
  `updateMySettings` con **exactamente** `{ vidaDayStartTime, vidaDayEndTime }`.
  «Al salir y volver se ve lo guardado» lo sostiene
  `useUpdateUserSettingsMutation`, que escribe la respuesta en
  `settingsKeys.my()` y no se tocó; hay un test que simula esa vuelta. **La ida y
  vuelta real contra el API es del criterio 58.**
- **9 — cerrado.** Con los dos nulos se ven 06:30 y 23:00 y se lee «06:30 y 23:00
  son el horario por defecto: todavía no has elegido el tuyo». Con horario
  guardado, el suyo y sin esa frase. Siete tests más en `useVidaDayHours`,
  incluido medio horario guardado y un horario imposible.
- **10 — cerrado.** Fin no posterior al inicio: no se llama a la mutación, sale
  `role="alert"` con el motivo, el campo queda `aria-invalid` y lo escrito sigue
  ahí. Dos horas iguales tampoco valen. Con la mutación en error se ve el `Alert`
  y el valor tecleado no se pierde.
- **53, 54, 55 — cerrados en la parte que toca esta tajada** (hoja, tarjeta y
  ajustes): medidas de arriba. La agenda y la vista de semana no existen todavía.
- **56 — cerrado en esta tajada.** «sin hora» es una invitación con la vía para
  ponérsela, no un reproche; test de la tarjeta y test de la pantalla de ajustes
  contra la lista de palabras.
- **57 — cerrado.** Los cuatro números de arriba, y los dos documentos nuevos en
  la lista de `contracts.test.ts`.

**Lo que NO pude verificar**

- **El recorrido real (criterio 58).** Está detrás del login y **los agentes no
  entran con credenciales**; además el API desplegada en Cloud Run todavía puede
  no llevar `15463da`. Con el SDL recopiado, `pnpm test` está verde mientras una
  consulta real podría fallar con «campo desconocido»: eso no sería un fallo de
  esta tajada, sería el despliegue. Pasos al final de esta entrada.
- **Que `updateMySettings` acepte de verdad los dos campos nuevos.** Se validó
  contra el SDL vendorizado, no contra el servidor.
- **Cómo pinta la hora el navegador del usuario.** Ver riesgos.

**Riesgos — dónde mirar primero**

1. **`planVidaItemSave` manda `null` para limpiar.** El `update` lleva ahora
   siempre los dos campos. Si alguien añade un caller y se olvida de pasarlos,
   el tipo no compila (son obligatorios), pero si los pasa mal —`''`, `0`— se
   normalizan a `null` y **borran** la hora del ítem. Está probado, pero es el
   sitio donde un error se pierde de vista.
2. **`UserSettings` creció con dos campos obligatorios.** Cualquier fixture de
   ajustes en cualquier feature tiene que traerlos; el typecheck lo caza, pero
   si alguien tiene una rama abierta con un fixture de `UserSettings`, chocará.
3. **El formato visible de «a qué hora» lo decide el navegador.** El criterio 3
   dice «HH:mm, 24 h» y el **valor** siempre lo es —es lo que va al API y lo que
   comprueban los tests—, pero un `input type="time"` **pinta** en el formato del
   idioma del navegador: en el navegador de verificación (`en-US`) se lee
   «06:30 AM». Forzar 24 h exigiría un control propio, que no estaba en el plan
   y no lo decido yo. **Queda anotado para el revisor y para el usuario**: si se
   quiere 24 h siempre, es un cambio con su propia decisión.
4. **Los dos tests de `layouts` invertidos.** Si alguien esperaba que Vida no
   tuviera popover de ajustes, ahora lo tiene. Es el criterio 7, pero toca la
   barra, que es compartida con hábitos.
5. **El bloque de plantilla de la hoja creció a cuatro campos derivados.** La
   regla de «derivar, no copiar con `useEffect`» se mantuvo y hay un único
   `patchTemplate`, pero es el código con más historia de FEAT-002 y donde un
   fallo sería sutil: el síntoma sería la hoja mintiendo sobre lo guardado.

**Lo que descubrí y no toqué** (no es de esta tajada)

- **`useUpdateUserSettingsMutation` invalida `habitKeys.all` con
  `refetchType: 'all'`** en cada guardado. Guardar el horario de Vida refresca
  todas las consultas de hábitos sin necesidad. No lo toco: es de
  `features/settings` y lo usa la pantalla de cuenta.
- **El SDL de `UserSettings` tiene 12 campos y el documento pide 8.** Los cuatro
  que faltan (`habitReminderEnabled`, `habitReminderTime`,
  `dayStartReminderEnabled`, `dayStartReminderTime`, `houseworkActivityId`) no
  los usa nadie en la web. Queda anotado, no se piden.
- **`vidaSuggestionsForDate` ya devuelve hora y duración** dentro de `item` sin
  tocar nada más, porque el documento hereda `VIDA_ITEM_FIELDS`. La tajada 2 se
  lo encuentra hecho.

**Pasos del recorrido manual** (usuario, con sesión y **con el API desplegada**)

1. `/app/vida/actividades` → «···» de una actividad que ya esté en la plantilla
   → **Editar**. El interruptor viene encendido y los días marcados.
2. Poner «A qué hora» = `08:00` y tocar la píldora **45**. Guardar.
3. La tarjeta tiene que leerse **«8:00 · 45 min · L M X J V»** sin recargar.
4. Volver a **Editar**: la hora y la duración vienen puestas. Cambiar a
   `09:15` y **libre → 50**. Guardar. La tarjeta dice «9:15 · 50 min».
5. Crear una actividad nueva con el interruptor encendido, **un día y sin hora**:
   tiene que guardarse igual, y la tarjeta leer «sin hora · …».
6. Tocar **«sin hora»** en la tarjeta: abre la hoja.
7. Píldora **«Ajustes»** del módulo Vida (o `⌘K` → «Ajustes de Vida») →
   `/app/vida/ajustes`. La primera vez se lee que 06:30 y 23:00 son el valor por
   defecto.
8. Poner fin **anterior** al inicio y Guardar: no guarda, señala y lo dice.
9. Poner `07:00` / `22:30` y Guardar. Salir a Hoy y volver: siguen puestos y ya
   no aparece la frase del valor por defecto.

**Estado del árbol: sin commitear.** El arnés temporal está borrado. `graphify
update .` corrido (2.821 nodos, 3.041 aristas).

### Tajada 2 — La agenda del día, en solo lectura

**Resumen para el revisor:**
1. `/app/vida/hoy` dejó de ser un cascarón: arriba el **presupuesto** (fecha y
   hora, «te quedan Xh YY hasta las 23:00», la barra del día entero con la marca
   de «ahora», la leyenda con los minutos y una línea de guía compuesta con
   reglas) y debajo la **agenda**: los bloques del `activityDayPlan` ordenados
   por hora y, entre ellos, los **huecos** con su tamaño y las fichas de la
   plantilla que caben. En escritorio, el lateral «Tu plantilla de \<día\>».
2. Todo lo nuevo vive en `src/features/vida/`: un `utils` puro
   (`vida-agenda.utils.ts`), dos hooks, cuatro componentes y la página. Fuera
   del módulo no se toca nada; sí se tocaron **dos tests ajenos**
   (`vida.routes.test.tsx` y `layouts/AppLayout.test.tsx`), y ahí está el aviso.
3. **Lo que más probablemente rompí:** esos dos tests. `AppLayout.test.tsx`
   montaba `vidaRoutes` de verdad y ahora Hoy llega al contexto de sesión por
   `useAuthBootstrap`, que ese arnés no monta: **cualquier test que monte
   `vidaRoutes` sin proveedor de sesión reventará** hasta que mockee
   `useVidaQueryGuard`. Segundo sospechoso: `useVidaDayHours` ganó un `refetch`
   en su tipo de retorno, así que **todo mock de ese hook tiene que traerlo**.
   Tercero, más sutil: la ventana de la barra **se estira** si un bloque cae
   fuera del horario de los ajustes — si algún día la leyenda no cuadra con la
   agenda, es ahí donde hay que mirar.

**Lo que se construyó**

| Archivo | Qué |
|---|---|
| `src/features/vida/utils/vida-agenda.utils.ts` (+ `.test.ts`, 29 casos) (N) | El corazón **puro**: `buildDayAgenda` (bloques ordenados + huecos, con los de antes del primero y después del último), `getDayBudget` (minutos, porcentajes, posición de «ahora», «te quedan»), `buildGuidanceLine` (cinco formas, ninguna con reproche), `findLargestGap`, `formatGapRange`, `fitsInGap`, `suggestionsForGap` y `findNextBlockId`. El «ahora» **se inyecta** como minutos: ni un `new Date()` dentro. |
| `src/features/vida/hooks/useVidaNowMinute.ts` (+ `.test.tsx`, 3 casos) (N) | Rescate de `79bece0:hooks/useCurrentTimeMarker.ts`: tic de 60 s, devuelve `{ minutes, label }` y **no tictaquea** con `enabled: false` (lo que la tajada 4 necesita para el día futuro). |
| `src/features/vida/hooks/useVidaDayData.ts` (N) | Junta `useActivityDayPlanQuery`, `useVidaSuggestionsForDateQuery` y `useVidaDayHours`, y devuelve **el estado de cada una** (`isDisabled`, `isPending`, `isPlanError`, `failed[]`) para que el criterio 52 pueda decir *qué* falta. Ninguna clave de caché nueva. |
| `src/features/vida/components/VidaDayBudget/` (N) | Fecha y hora, «te quedan», barra proporcional con la marca, leyenda **como texto real** (es la «tabla oculta» del gráfico, como en `ChartPanel`) y la línea de guía. La barra es `aria-hidden`: lo que hay que leer está escrito. |
| `src/features/vida/components/VidaAgendaBlock/` (N) | Hora, icono y color de la categoría, nombre, duración y «en N min» en el primero que no ha empezado. Sin un solo control. |
| `src/features/vida/components/VidaAgendaGap/` (N) | «Libre 10:30 – 13:00 · 2h 30» + hasta 3 fichas con su duración («sin duración» las que no la tienen). Los restos de menos de 15 min se pintan finos y sin fichas. |
| `src/features/vida/components/VidaTemplateAside/` (N) | El lateral de escritorio: la plantilla del día con «en el plan» en lo que ya está, marcado **contra el plan por `activityId`**. |
| `src/features/vida/pages/VidaHoyPage.tsx` (+ `.module.scss`, `.test.tsx`, 18 casos) | Sustituye el cascarón de 6 líneas. Compone lo anterior, coloca la marca de «Ahora» y hace `scrollIntoView({ block: 'center' })` **una sola vez** al montar. |
| `src/features/vida/utils/vida-date.utils.ts` (+ 3 casos) | `parseYmdToLocalDate`, `getVidaDayOfWeek` y `formatDayHeading` («Viernes 18»). |
| `src/features/vida/hooks/useVidaDayHours.ts` | Gana `refetch` en su retorno: el «Reintentar» del criterio 52 tiene que poder volver a pedir **las tres** consultas, y los ajustes son una de ellas. |
| `src/features/vida/routes/vida.routes.test.tsx`, `src/layouts/AppLayout/AppLayout.test.tsx` | Los dos afirmaban cosas que esta tajada deroga o rompe. Ver abajo. |

**Por qué así, y qué se descartó**

- **Tres desviaciones del plan, a propósito y dichas:**

  1. **No se pinta «+ otra cosa».** El criterio 18 lo nombra y la sección 2 lo
     ponía en esta tajada, pero abrir la hoja es el criterio 24 —tajada 3—, así
     que aquí sería **un botón muerto**. Es exactamente el mismo recorte que el
     arquitecto dejó escrito para «Armar desde la plantilla» en el criterio 21:
     la mitad que es información cierra en la 2, la que es acción en la 3. **No
     reescribo el criterio: lo parto y lo digo.** Por lo mismo, las fichas son
     `<span>` y no botones.
  2. **El icono y el color del bloque salen de `item.activity.category`**, que
     **ya viaja dentro del plan del día** (`activity-day-plan.graphql.ts`
     selecciona `category { id name color icon }`), en vez del cruce por `Map`
     con `useActivityCategoriesQuery` que hace `VidaActividadesPage:79`. El
     tratamiento visual es el mismo que `VidaActivityCard` —tinte de la
     categoría mezclado con el fondo—, pero sin una consulta que no hace falta.
     El respaldo cuando no hay categoría es `UNCATEGORIZED_GROUP_ICON`, el
     mismo del catálogo.
  3. **Tres utilidades de fecha nuevas** en `vida-date.utils.ts`
     (`parseYmdToLocalDate`, `getVidaDayOfWeek`, `formatDayHeading`), aunque el
     plan decía «ninguna utilidad de fecha nueva». Faltaba ir de un
     `YYYY-MM-DD` al día de la semana, y lo necesitan el encabezado y el
     lateral. Van ahí y no en `vida-agenda.utils.ts`, que es geometría. Van con
     su aviso: `new Date('2026-09-18')` se interpreta **en UTC** y a partir de
     UTC-1 cae en el día anterior (criterio 49); se parte la cadena a mano.

- **La ventana de la barra se estira** cuando un bloque cae fuera del horario de
  los ajustes (alguien planeó a las 5:30 con el día empezando a las 6:30).
  Recortar habría hecho dos daños: un bloque planeado que no se pinta, y una
  leyenda que deja de sumar lo que se ve (criterio 14). En el caso normal la
  ventana es exactamente el horario de los ajustes, que es lo que pide el 13.

- **Los restos de menos de 15 minutos no desaparecen.** Es el matiz que el
  arquitecto confirmó: `MIN_GAP_MINUTES` decide si un hueco **ofrece fichas**,
  no si existe. Un tramo de 10 min se pinta como una línea fina con sus minutos;
  si se tragara, «planeado + libre» dejaría de ser el día entero.

- **La exclusión de las fichas se calcula contra `activityDayPlan(date)`, por
  `activityId` — nunca contra `takenToday`.** Es el error caro que la sección 2
  señala, y tiene un test con nombre propio: una sugerencia con
  `takenToday: true` **sigue apareciendo**. El lateral marca «en el plan» con la
  misma regla.

- **La línea de guía tiene cinco formas, no cuatro.** Las cuatro que pide el
  criterio 15 (sin plan, lleno, terminado y el caso normal) más una quinta que
  apareció mirando el arnés a las 22:59: sin hueco **por delante** no es lo
  mismo que sin hueco **en todo el día**, y decir «el día está completo» en un
  día con la tarde libre habría sido falso.

- **Nada de «vacío».** El criterio 15 escribe el ejemplo «la tarde está vacía de
  13:30 a 19:00»; la frase que se compone dice **«Tu hueco más grande va de
  13:30 – 19:00 · 5h 30»**, porque el criterio 56 manda que un tramo sin nada se
  llame **libre**. Hay un test que pasa las cinco formas por
  `/desperdici|perdiste|fallaste|cancelar|eliminar|vacío|vacía/i`.

- **El tic es de 60 s y el `setState` del primer refresco va por
  `setTimeout(0)`.** Llamarlo en el cuerpo del efecto encadena renders y el
  linter de este repo lo marca (`react-hooks/set-state-in-effect`): era un error
  nuevo sobre la línea base. `useRemainingDayTimer` (tic de 1 s, `DAY_END_TIME`
  dentro del código) **no vuelve**, como mandaba el plan.

- **Dos tests ajenos tocados, los dos por la misma razón y ninguno por
  comodidad:**
  - `vida.routes.test.tsx` afirmaba «`/app/vida/hoy` sigue siendo un cascarón:
    nada más que el título». Era una afirmación de **F0** que el criterio 11
    deroga. Se saca `hoy` de esa lista —`plantilla` y `revision` siguen— y en su
    lugar hay un caso que comprueba lo que ahora sí es verdad: sin sesión, la
    pantalla enseña el título y la vía para entrar (criterio 51).
  - `AppLayout.test.tsx` montaba `vidaRoutes` **de verdad** porque las páginas de
    Vida eran un `<h1>`. Ahora Hoy cruza tres consultas y llega a
    `useAuthBootstrap`, que ese arnés no monta: reventaba con
    «useAuthBootstrap must be used within AuthBootstrapProvider». Se mockean
    `useVidaQueryGuard` (en `false`) y `useUserSettings` (consulta
    deshabilitada), igual que ya hacía `vida.routes.test.tsx` desde la tajada 1.
    **No se cambió ninguna aserción de ese test**: los cuatro casos son los
    mismos.

- **Dos arreglos de contraste hechos con el medidor delante, no de oído:** la
  píldora «Ahora» usaba `--aura-ring-to`, que en tema oscuro se aclara a
  `#a78bfa`, y el texto blanco encima caía a **2,7:1**. Se pinta con violeta
  fijo `#7c3aed` (es un chip opaco: el tema de alrededor no la afecta) → **5,7:1
  en los dos temas**, y sigue siendo inconfundible con el mint de «planeado»
  (criterio 55). `--color-surface` tampoco servía de texto: en Aura es blanco al
  45 %. Y la hora de la marca va en `--color-text`: el violeta sobre el lienzo
  claro se quedaba en 3,7:1.

- **Nada de lo prohibido:** ni normalizador de texto nuevo, ni arreglo de
  `Popover`, ni `--color-text-muted` —todo lo que hay que leer usa
  `--color-text-secondary`—, ni iconos importados a pelo de Font Awesome, ni
  clave de caché nueva, ni mutación nueva, ni un solo componente de `shared/ui`
  creado. Y **ni un control que escriba**: esta pantalla, hoy, no llama a
  ninguna mutación.

**Verificación**

Línea base (antes de empezar, los tres enteros):

```
pnpm typecheck  → limpio
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)
pnpm test       → Test Files 1 failed | 80 passed (81) · Tests 2 failed | 706 passed (708)
                  (SearchSelect ×2, preexistentes)
```

Al cerrar:

```
pnpm typecheck  → limpio
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)   (los mismos 14)
pnpm test       → Test Files 1 failed | 83 passed (84) · Tests 2 failed | 759 passed (761)
                  (los mismos 2 de SearchSelect; +53 tests nuevos, 0 fallos nuevos)
pnpm build      → index 877,89 kB · app-icons 620,20 kB (perezoso) · IconPicker 4,64 kB
```

El chunk inicial pasa de **861,01 kB a 877,89 kB (+16,9 kB)**: la pantalla, los
cuatro componentes y la aritmética. **No crece por iconos** — `app-icons` sigue
en 620,20 kB perezoso y `IconPicker` en 4,64 kB (criterio 57).

Arnés temporal (`src/harness-feat003-t2/`, `.html` + `.tsx`, `MemoryRouter`,
datos sintéticos, **borrado**; `git status` ya no lo lista) servido por el Vite
del usuario en `http://localhost:5173`. Cinco días sintéticos con el reloj
inyectado: con plan a las **9:24**, a las **6:30** (borde izquierdo), a las
**22:59** (borde derecho), **sin plan** y **sin plan ni plantilla**. Un nombre de
63 caracteres («Revisar el correo y contestar lo que quedó pendiente de ayer») y
otro de 54 en una ficha.

- **375 px:** `document.documentElement.scrollWidth` **375** = `clientWidth`
  **375** en toda la página, con los cinco días montados. Lo único que excede su
  caja son los nombres con `text-overflow: ellipsis`, que es como truncan.
- **La marca de «ahora»**, leída del DOM: `left` **0 %** a las 6:30, **17,58 %**
  a las 9:24 y **99,9 %** a las 22:59 (criterio 13).
- **La leyenda cuadra con la agenda:** «planeado 4h 10 · libre 12h 20» = 990 min
  = el día de 6:30 a 23:00.
- **Escritorio (1024 px):** `grid-template-columns: 641px 320px`; el lateral
  marca «en el plan» exactamente en la actividad que está en el plan.

Contrastes medidos en el DOM componiendo el alfa de cada capa (AA pide 4,5:1):

| Qué | Claro | Oscuro |
|---|---|---|
| Leyenda «planeado 4h 10» | 7,58:1 | 9,05:1 |
| «te quedan 13h 36» | 17,85:1 | 17,11:1 |
| Línea de guía | 17,85:1 | 17,11:1 |
| «Libre 6:30 – 7:00» | 7,97:1 | 13,77:1 |
| Tamaño del hueco («30m») | 6,78:1 | 9,94:1 |
| Duración de una ficha | 7,21:1 | 9,05:1 |
| «De tu plantilla de viernes…» | 6,78:1 | 9,94:1 |
| Resto fino («Libre 7:20 – 7:30 · 10m») | 7,58:1 | 9,94:1 |
| Duración del bloque | 7,58:1 | 9,05:1 |
| «· en 36 min» | 8,90:1 | 12,55:1 |
| Píldora «Ahora» | 5,70:1 | 5,70:1 |
| «en el plan» del lateral | — | 12,82:1 |

**Criterios que cierra, uno por uno**

- **11 — cerrado.** `/app/vida/hoy` ya no es `<PageHeader title="Hoy" />`.
  Test: con plan se ven el presupuesto y los bloques, y el primero de la lista
  es el de las 8:00 aunque llegue el segundo en el array. `buildDayAgenda` ordena
  por `startTime` y desempata por `orderIndex`; hay test propio.
- **12 — cerrado.** «Viernes 18 · 9:24» y «te quedan **13h 36** hasta las 23:00»
  con el reloj a las 9:24 y el fin en 23:00. Test con temporizadores falsos:
  al avanzar 60 s pasa a **13h 35** sin recargar y sin volver a montar.
- **13 — cerrado.** Test puro: los anchos de las entradas suman **100 %** con
  diez decimales de tolerancia, y `nowPercent` es **0** a la hora de inicio,
  **100** a la de fin y **50** en el medio exacto. Medido también en el DOM del
  arnés (0 % / 17,58 % / 99,9 %).
- **14 — cerrado.** La leyenda escribe «planeado 2h 15» y «libre 14h 15» como
  **texto**, no en un `title`; `plannedMinutes + freeMinutes === dayMinutes` y
  los dos salen de la **misma** lista que pinta la agenda. Por eso los restos
  de menos de 15 min se siguen pintando.
- **15 — cerrado.** Cinco formas con test cada una: día sin plan, día lleno, día
  terminado, «ya no queda hueco por delante» y el caso normal, que nombra
  «2 bloques · 1h» y «13:30 – 23:00». Ninguna pasa el filtro de palabras de
  reproche.
- **16 — cerrado.** Cada bloque pinta hora, cápsula con el icono y el color de
  la categoría, nombre y `endTime − startTime` («45 min», «1 h»). El primero que
  no ha empezado dice «· en 36 min»; test de `findNextBlockId` para los tres
  casos (antes, en medio, después).
- **17 — cerrado.** Test: con dos bloques salen **tres** huecos —antes del
  primero, entre ellos y después del último— de 90, 75 y 720 min, con la hora de
  inicio y la de fin de los ajustes como bordes. En pantalla, «Libre 10:30 –
  13:00» con «2h 30» al otro lado.
- **18 — cerrado en su parte de contenido; la mitad que es «+ otra cosa» va con
  el criterio 24, en la tajada 3.** Solo se ofrece lo que cabe (una de 4 h no
  entra en 2h 30), se excluye por `activityId` lo que ya está en el plan, se
  ven **como mucho 3** y se dice cuántas quedan fuera. Cinco tests, incluido el
  de que `takenToday` **no** excluye.
- **19 — cerrado.** Una sugerencia sin duración no se filtra por tamaño, va
  **al final** y se lee **«sin duración»**. Lo de «al tocarla abre la hoja» es el
  criterio 25 y llega en la tajada 3, donde la ficha se vuelve pulsable.
- **20 — cerrado.** La marca «Ahora» se pinta una vez, justo antes del primer
  tramo que no ha empezado, y la página hace `scrollIntoView({ block: 'center' })`
  **una sola vez** al montar. Test: se llama con ese argumento y «Bañarme», que
  es de las 8:00 y queda por encima, **sigue en el documento** — no se pliega
  nada.
- **21 — cerrado en su mitad de texto, como dejó escrito el arquitecto.** Sin
  plan: «Aún no hay plan para hoy. Tu plantilla trae 2 cosas los viernes», el
  día entero es un hueco («Libre de 6:30 – 23:00») y no se reprocha nada. Sin
  plantilla y sin plan: no hay fichas vacías, se lee «Tu plantilla todavía no
  trae nada para este día» y hay enlace a `/app/vida/actividades`. **El botón
  «Armar desde la plantilla» no se pinta** y hay un test que lo afirma: llegaría
  muerto. Cierra en la tajada 5.
- **22 — cerrado.** Test que busca «empezar», «terminar», «en marcha», «fuera
  del plan» y «hecho» en toda la pantalla: ninguno aparece, ni como texto ni
  como botón. La pantalla no llama a ninguna mutación.
- **48 — cerrado en su mitad «Tu plantilla de \<día\>».** El lateral lista la
  plantilla del día y marca «en el plan» lo que ya está; test con una que sí y
  una que no. **No** trae el botón de ponerla en el primer hueco (es una
  mutación: tajada 3) ni el bloque «Mañana» (tajada 5) ni «Cómo va el día» (D8).
- **49 — cerrado.** La fecha sale de `getCurrentLocalDate()` y el día de la
  semana de `getVidaDayOfWeek`, que parte la cadena a mano en vez de dejar que
  `new Date` la lea en UTC. Test: `parseYmdToLocalDate('2026-09-18').getDate()`
  es **18**.
- **50 — cerrado.** Con cualquiera de las tres consultas en vuelo se ve el
  esqueleto y **no** aparece «Aún no hay plan» ni ningún «Libre». Con los
  **ajustes** en vuelo tampoco se pinta «te quedan»: dos tests separados.
- **51 — cerrado.** Con las tres deshabilitadas (`isPending` +
  `fetchStatus: 'idle'`) se lee «Entra para ver tu día» con el enlace a
  iniciar sesión, y **no** hay esqueleto. Además, el test de rutas lo comprueba
  con el guard real en `false`.
- **52 — cerrado.** Si falla el plan: «No pudimos cargar tu día» con
  «Reintentar», que llama a `refetch`. Si falla **solo** la plantilla: un aviso
  que **nombra qué falta** («No pudimos cargar lo que trae tu plantilla») y la
  agenda se pinta igual. Dos tests.
- **53 — cerrado en lo que toca esta tajada.** 375 px sin scroll horizontal con
  los cinco días montados. La tira de días y la hoja son de las tajadas 4 y 3.
- **54 — cerrado.** Un nombre de 63 caracteres trunca con elipsis en el bloque,
  en la ficha del hueco y en el lateral, y no produce scroll horizontal.
- **55 — cerrado.** Tabla de contrastes de arriba, en los dos temas, con la
  píldora «Ahora» arreglada. El tramo «planeado» (mint sólido), el tramo
  «libre» (mint al 18 %) y la marca (violeta) se distinguen en claro y en
  oscuro.
- **56 — cerrado.** Test de la pantalla contra
  `/desperdici|perdiste|fallaste|cancelar|eliminar/i` y test de las cinco formas
  de la guía, que además excluye «vacío/vacía». Un tramo sin nada es **libre**;
  un día sin plan se describe, no se reprocha.
- **57 — cerrado.** Los cuatro números de arriba. Ningún documento GraphQL
  nuevo: esta tajada no toca `graphql/`.

**Lo que NO pude verificar**

- **El recorrido real (criterio 58).** Está detrás del login, **los agentes no
  entran con credenciales**, y además el API desplegada en Cloud Run puede no
  llevar `15463da`: sin ella, `vidaSuggestionsForDate` no devuelve
  `durationMinutes` y **todas las fichas de los huecos se leerían «sin
  duración»**. Eso no sería un fallo de esta tajada. Pasos al final.
- **Que `scrollIntoView` deje la marca en el centro de verdad.** En el test es
  un espía y en el arnés la página no tiene el scroll de la app. La llamada y su
  argumento están comprobados; el efecto visual lo ve el usuario.
- **El rendimiento con un día de treinta bloques.** El arnés llegó a siete.
- **El tema del navegador del usuario.** Los contrastes se midieron forzando
  `data-theme` a `light` y a `dark` sobre el arnés, no con la preferencia real
  del sistema.

**Riesgos — dónde mirar primero**

1. **Cualquier test que monte `vidaRoutes` sin proveedor de sesión.** Hoy ya
   consulta, así que `useAuthBootstrap` tiene que existir o estar mockeado. Ya
   pasó dos veces (rutas de Vida en la tajada 1, `AppLayout` en esta). Si
   aparece un tercer arnés, el síntoma es exactamente «useAuthBootstrap must be
   used within AuthBootstrapProvider».
2. **`useVidaDayHours` ganó `refetch`.** Todo mock del hook tiene que traerlo;
   el typecheck lo caza, pero una rama abierta chocará.
3. **La ventana de la barra se estira con bloques fuera del horario.** Es
   deliberado y está probado, pero es la regla menos obvia del archivo: si
   alguna vez la leyenda no cuadra con lo que se ve, empezar por `windowStart` /
   `windowEnd`.
4. **Los porcentajes se calculan con `dayMinutes` del `budget` y los anchos con
   el mismo número en la página.** Son dos sitios; si alguien cambia uno y no el
   otro, la barra deja de sumar 100 % **sin que ningún test puro lo note** (el
   test mide la aritmética, no el `style`).
5. **`suggestionsForGap` se llama una vez por hueco en cada pintado.** Con la
   plantilla de un día normal es trivial, pero no está memorizado: si la tajada 3
   añade estado que repinte a menudo, ahí es donde se nota.
6. **La píldora «Ahora» lleva un color fijo (`#7c3aed`)**, el único valor
   literal de esta tajada. Si algún día la paleta violeta cambia, este sitio no
   se entera solo.

**Lo que descubrí y no toqué** (no es de esta tajada)

- **`ActivityDayPlanItem.activity.category` ya trae icono y color**, así que la
  agenda no necesita `useActivityCategoriesQuery`. El catálogo sí lo necesita
  por otra razón (agrupa por categoría), pero conviene saberlo antes de añadir
  consultas en las tajadas 3 y 4.
- **`vidaSuggestionsForDate` no dice si el ítem tiene actividad archivada.** Se
  filtra por `isActive` del `VidaItem`, que es lo que hay; si alguien archiva la
  actividad sin desactivar el ítem, la ficha seguiría ofreciéndose. No se ha
  visto ocurrir —`useArchiveActivity` desactiva el ítem— pero queda anotado.
- **`ActivityDayPlanItem.completedAt` sigue sin usarse**, como mandaba el
  «fuera de alcance». La agenda lo ignora por completo.
- Sigue abierto, de FEAT-002: cuatro copias del normalizador de texto y
  `--color-text-muted` en 2,39:1. **Aquí ninguna de las dos crece.**

**Pasos del recorrido manual** (usuario, con sesión y **con el API desplegada**)

1. En `/app/vida/actividades`, comprobar que al menos tres cosas de la plantilla
   de **hoy** tengan hora y duración (tajada 1). Si no las tienen, las fichas de
   los huecos dirán «sin duración» — y eso es correcto, no un fallo.
2. Ir a `/app/vida/hoy`. Arriba: la fecha y la hora, «te quedan Xh YY hasta las
   23:00», la barra con la marca de «ahora» en su sitio, la leyenda y una línea
   de guía que nombre números que se puedan comprobar mirando la agenda.
3. Dejar la pantalla abierta **un minuto**: el «te quedan» tiene que bajar solo.
4. Comprobar que la pantalla **abre a la altura de «Ahora»** y que subiendo se
   ve lo de antes.
5. Mirar un hueco: sus horas, su tamaño y hasta tres cosas de la plantilla que
   **quepan** ahí. Lo que ya esté en el plan **no** debe aparecer.
6. Comprobar que **no hay ningún botón de empezar, terminar ni cronómetro**, y
   que ninguna ficha hace nada al tocarla (eso llega en la tajada 3).
7. En escritorio, el lateral «Tu plantilla de \<día\>» con «en el plan» en lo
   que ya está puesto.
8. Un día sin plan (si hoy lo tiene, se ve mejor tras la tajada 4): el día
   entero como un hueco, «Aún no hay plan para hoy» y cuántas cosas trae la
   plantilla. **Sin botón de armar todavía.**
9. A 375 px y en tema oscuro: sin scroll horizontal y todo legible.

**Estado del árbol: sin commitear.** El arnés temporal está borrado.
`graphify update .` corrido (2.882 nodos, 3.130 aristas).

#### Tajada 2 — respuesta a la devolución (2ª entrega)

**Resumen para el revisor:**
1. **El defecto está arreglado donde tenía que estarlo: en la aritmética pura.**
   La marca de «ahora» dejó de decidirse en la página y ahora la coloca
   `buildDayAgenda`, que **parte el hueco que contiene al reloj** y mete una
   entrada `kind: 'now'` en medio. Existe siempre que `dayStart ≤ ahora ≤
   dayEnd`; fuera de esa franja no hay marca, y eso también está dicho en un
   test. Los tres casos que mediste en 0 marcas dan 1, con su `scrollIntoView`.
2. **Los cuatro hallazgos baratos, cerrados**: la barra ya no rebasa el 100 %
   con bloques pisados, un hueco empezado ofrece solo lo que le queda, «en 920
   min» se lee «en 15 h 20 min», y a las 23:30 desapareció el «te quedan 0m».
3. **Lo que más probablemente rompí esta vez:** `AgendaEntry` tiene ahora **tres
   variantes** (`block` · `gap` · `now`), así que cualquier `switch`/ternario que
   asuma dos —el de la barra del presupuesto y el de la agenda ya están
   arreglados— se comerá la marca o la pintará como si fuera un tramo. Y
   `AgendaGap` ganó `trackMinutes` e `isPast`: **todo fixture de hueco tiene que
   traerlos** (el typecheck lo caza, y ya obligó a tocar el `gapOf` del test).

**Qué cambió, archivo por archivo**

| Archivo | Qué |
|---|---|
| `src/features/vida/utils/vida-agenda.utils.ts` | `buildDayAgenda` acepta `nowMinutes` y coloca la marca; `withNowMark` / `makeGap` / `nowMark` privadas; `AgendaNowMark` nuevo y `AgendaEntry` con tres variantes; `AgendaBlock.trackMinutes`, `AgendaGap.trackMinutes` e `isPast`; `DayAgenda.hasNowMark`. `getDayBudget` y `buildGuidanceLine` cuentan con `trackMinutes`. `suggestionsForGap` no ofrece nada en un tramo pasado. |
| `src/features/vida/utils/vida-agenda.utils.test.ts` | **+13 casos** (29 → 42): el bloque entero «la marca de «ahora» (criterio 20)» con los tres casos devueltos, el borde exacto, fuera de horario, dentro de un bloque y «partir no cambia la suma»; más solapes al 100 %, hueco pasado sin fichas y hueco empezado que ofrece por lo que le queda. |
| `src/features/vida/pages/VidaHoyPage.tsx` | Fuera `markerBeforeId`. `nowMinutes` entra en `buildDayAgenda` (y en las dependencias del `useMemo`); la lista pinta `entry.kind === 'now'`. El aviso de plantilla vacía va al primer hueco **no pasado**. |
| `src/features/vida/pages/VidaHoyPage.test.tsx` | **+7 casos** (18 → 25): el bloque «la marca de «Ahora» aguanta todo el día», con las 20:00, el bloque único a las 12:00, hoy sin plan, el hueco partido a las 11:30, las 5:00, las 23:30 y «en 15 h 20 min». Dos aserciones existentes se afinaron porque «9:24» y «Libre de 6:30 – 23:00» ya no son únicos: ahora se busca el encabezado por su `id` y las dos mitades del hueco. |
| `src/features/vida/components/VidaDayBudget/VidaDayBudget.tsx` | La barra usa `trackMinutes` y salta la marca (no es un tramo). Con el día cerrado no escribe «te quedan 0m»: enseña «planeado X de Y». |
| `src/features/vida/components/VidaAgendaGap/VidaAgendaGap.tsx` | Un tramo `isPast` se pinta como el resto fino —con sus minutos, para que la leyenda siga cuadrando— y **sin fichas**. |
| `src/features/vida/components/VidaAgendaBlock/VidaAgendaBlock.tsx` | «en N min» hasta la hora; a partir de ahí, `formatDurationMinutes`. |

**Por qué así**

- **La regla se fue a `vida-agenda.utils.ts` y no se parcheó en la página.** El
  defecto era exactamente lo que pasa cuando una decisión de geometría vive en
  el JSX: no tenía test propio y el único que había (9:24, con tres bloques por
  delante) era el caso en que la regla acertaba. Ahora es una función pura con
  ocho casos, y la página solo pinta lo que le llega.
- **El hueco se parte; el bloque no.** Partir el hueco resuelve el criterio 20 y
  el hallazgo 3 de una vez: la mitad de después es la que ofrece fichas y ya
  llega con el tamaño que de verdad queda. Partir un **bloque** habría sido
  contar lo que está pasando —«llevas 20 de 45 min»—, y eso es F3; con el reloj
  dentro de un bloque la marca va **justo debajo**, como en el render 03.
- **`trackMinutes` en vez de recortar al 100 %.** Recortar habría escondido el
  problema; así cada bloque aporta a la barra lo que no pisaba otro, la tarjeta
  sigue diciendo su duración real, y `planeado + libre = el día` se mantiene
  como identidad (criterio 14) también con solapes. De paso la **guía** pasó a
  contar igual: antes decía «2 bloques · 4h» donde la leyenda decía «planeado
  3h».
- **Los tramos pasados no desaparecen.** Se siguen pintando con sus minutos,
  porque si no la leyenda dejaría de cuadrar con lo que se ve; lo que pierden es
  la oferta de fichas. Es la misma regla que ya tenían los restos de < 15 min.
- **«en N min» solo hasta la hora.** El criterio 16 pide literalmente «en N
  min» y eso es lo que se lee en el caso que describe (el bloque que viene
  ahora). Más allá de 60 min se usa el formateador largo que ya existía. Lo digo
  porque es una lectura del criterio, no un capricho.
- **Los dos violetas (tu hallazgo 1) los dejo como están.** Unificar pide un
  token nuevo (`--aura-now`) en `_theme-variables.scss`, que es tocar el sistema
  de diseño para todo el repositorio: tiene su propia decisión y su propio
  render, y no la tomo dentro de una devolución. Queda anotado.

**Verificación**

```
pnpm typecheck  → limpio
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)   (los mismos 14)
pnpm test       → Test Files 1 failed | 83 passed (84) · Tests 2 failed | 779 passed (781)
                  (los mismos 2 de SearchSelect; +20 tests sobre la 1ª entrega)
pnpm build      → index 878,72 kB · app-icons 620,20 kB (perezoso) · IconPicker 4,64 kB
```

877,89 → **878,72 kB** (+0,8 kB). `app-icons` e `IconPicker` intactos.

Arnés temporal (`src/harness-feat003-t2/`, **borrado**; `git status` no lo
lista) con cinco días sintéticos y el reloj inyectado. Leído del DOM:

| Caso | Marcas «Ahora» | Suma de anchos | Encabezado |
|---|---|---|---|
| Ahora **20:00**, último bloque a las 13:00 | **1** | 100,000 % | «te quedan 3h hasta las 23:00» |
| Ahora **11:30**, en medio de un hueco | **1** | 100,000 % | «te quedan 11h 30 hasta las 23:00» |
| **Hoy sin plan**, ahora 9:24 | **1** | 100,000 % | «te quedan 13h 36 hasta las 23:00» |
| Ahora **23:30** (cerrado) | **0** | 100,000 % | «planeado 2h 5 de 16h 30» — **sin «te quedan 0m»** |
| Bloques pisados 8–10 y 9–11 | 0 (no es hoy) | **100,000 %** (antes 106,06 %) | «planeado 3h de 16h 30» |

Y en el mismo arnés, a 375 px: `scrollWidth` **375** = `clientWidth`; el hueco
de las 11:30 aparece partido en «Libre 9:45 – 11:30 · 1h 45» (sin fichas) y
«Libre 11:30 – 13:00 · 1h 30» (con las que caben en 1h 30). Contraste del tramo
pasado: **7,58:1** en claro y **9,94:1** en oscuro; la píldora «Ahora» sigue en
5,70:1 en los dos temas.

**Los cinco hallazgos, uno por uno**

- **1 — dos violetas en oscuro: NO arreglado, a propósito.** Pide un token nuevo
  en el sistema de diseño; es una decisión con alcance fuera de esta tajada.
- **2 — la barra rebasaba el 100 % con solapes: cerrado.** `trackMinutes`. Test
  puro que comprueba los anchos, la identidad `planeado + libre = día` y que la
  tarjeta sigue diciendo 120 min mientras la barra cuenta 60.
- **3 — el hueco empezado ofrecía de más: cerrado.** Al partirse por «ahora», la
  mitad de después mide lo que queda; y un tramo pasado no ofrece nada. Dos
  tests, uno de ellos con una sugerencia de 2 h que deja de caber en el resto de
  1h 30.
- **4 — «en 920 min»: cerrado.** «en 15 h 20 min», con test de pantalla.
- **5 — «te quedan 0m»: cerrado.** Con el día cerrado se lee «planeado 2h 5 de
  16h 30» y la guía sigue diciendo «Tu día se cerró a las 23:00». Test.

**Lo que descubrí de paso y NO toqué**

- **`formatDurationFromMinutes(125)` da «2h 5», no «2h 05».** Se ve ahora que el
  encabezado enseña totales cualesquiera. Es el formateador de la **tajada 1**,
  ya aceptado y con sus tests; cambiarlo tocaría una tajada cerrada por un
  detalle tipográfico. Queda anotado.
- **`findLargestGap` sigue recortando por «ahora»** aunque con los huecos ya
  partidos el recorte casi nunca haga falta. Lo dejo: es la red por si alguien
  llama a la guía con una agenda construida sin `nowMinutes`.

**Criterio 20 — por qué ahora sí**

La marca ya no depende de que quede algo por empezar: depende solo de que el
reloj caiga dentro del día. Tests puros para ahora **después del último
bloque**, ahora **en medio de un hueco entre bloques**, **hoy sin plan**, ahora
**dentro de un bloque**, los dos **bordes exactos** (`dayStart` y `dayEnd`) y
**fuera del horario** (5:00 y 23:30, sin marca) — más tres tests de pantalla que
comprueban que en los tres casos devueltos se pinta «Ahora» y se llama a
`scrollIntoView({ block: 'center' })`.

**Estado del árbol: sin commitear.** El arnés temporal está borrado.
`graphify update .` corrido (2.890 nodos, 3.144 aristas).

## 4. Revisión — feature-reviewer

### Tajada 1 — La plantilla con hora y duración, y los ajustes de Vida

**Veredicto: `accepted`.** Los diez criterios de la tajada se comprueban contra
la sección 1 literal, no contra el resumen del constructor; la línea base no
empeora; el caso que más podía romper —que editar solo los días borrara la hora
de un ítem que ya la tenía— **no se cumple: la hora y la duración sobreviven**,
y lo comprobé con un arnés propio, no leyendo los tests de quien lo construyó.
Quedan **cuatro hallazgos** anotados abajo (ninguno devuelve la tajada) y el
recorrido real del criterio 58, que sigue siendo del usuario y además necesita
el API desplegada.

**Cómo verifiqué** (todo con el árbol tal como lo dejó el constructor, sin
tocar código de producto):

- `npx vitest run src/features/vida src/features/settings src/layouts` →
  **25 archivos, 299 tests, 0 fallos**.
- `pnpm typecheck` → limpio. `pnpm lint` → **14 errores / 0 warnings** (los
  mismos preexistentes). `pnpm test` → **2 fallos de 708**, los dos de
  `SearchSelect`. Coincide con la línea base del `ENVIRONMENT.md`.
- **Arnés de revisión propio**: `src/revision-feat003-tajada1.test.tsx`
  (7 casos, montando `VidaActivitySheet` de verdad con las mutaciones
  mockeadas). **Los 7 pasaron** y el archivo está **borrado**; su contenido está
  resumido aquí, caso por caso, para que se pueda rehacer.
- **El SDL vendorizado contra su origen real**: extraje la cadena `gql` de
  `git show 15463da:src/graphql/modules/vida/vida.schema.ts` y de
  `…/user-settings/user-settings.schema.ts` en `~/Developer/xavi-platform-node`
  y las comparé carácter a carácter con los dos `.graphql` de este repo
  (ignorando la cabecera de comentarios): **idénticas**. No es «parece copiado»:
  es copiado.

**Criterios, uno por uno**

- **1 — cumplido.** SDL recopiado y **verificado contra el repo hermano**
  (arriba); cabecera con `Copiado: 2026-09-20` y el commit `15463da`.
  `VIDA_ITEM_FIELDS` pide `startTime` y `durationMinutes`; el SDL de ajustes es
  nuevo y sus dos documentos están en la lista de `contracts.test.ts`.
- **2 — cumplido.** `VidaItem` lleva los dos campos; `planVidaItemSave` los
  propaga al crear y al actualizar. Las tres reglas de FEAT-002 siguen vivas y
  las comprobé además de lado: **editar solo el nombre de una actividad cuyo
  ítem ya tenía hora no llama a ninguna mutación de plantilla** (plan
  `nothing`), así que la hora no viaja ni se limpia por un guardado que no la
  tocaba.
- **3 — cumplido, con un hallazgo de formato.** Con el interruptor encendido
  aparecen «A qué hora» (`input type="time"`) y las píldoras 15 · 30 · 45 · 1h ·
  libre; «libre» abre el campo en minutos; lo elegido llega al `VidaItem`. El
  **valor** es siempre `HH:mm` 24 h. Lo que **pinta** el control lo decide el
  idioma del navegador (hallazgo 1).
- **4 — cumplido.** Editando, la hora y la duración vienen puestas y se
  actualiza **el mismo** ítem (`updateVidaItem` una vez con `id: 'v1'`,
  `createVidaItem` ninguna). «Sin recargar» lo sostiene la invalidación de F0,
  que no se tocó.
- **5 — cumplido, y comprobado en los cuatro cruces.** Con días y sin hora se
  guarda (`{ activityId, days }`). **Con hora y sin duración** el payload es
  `{ activityId, days, startTime: '07:10' }` — no se inventa duración ni se
  bloquea. **Con duración y sin hora**, `{ activityId, days, durationMinutes:
  15 }`. Y un ítem de F1 (`startTime: null`) abre la hoja con el campo vacío,
  ninguna píldora pulsada, y al marcar un día más se guarda con `startTime:
  null, durationMinutes: null`: los ítems viejos siguen siendo legales.
- **6 — cumplido.** La tarjeta lee «8:00 · 40 min ·» delante de las siete
  casillas; con hora y sin duración no inventa ninguna; sin hora lee «sin hora»
  como **botón subrayado que llama a `onEdit`**, es decir, abre la hoja. No se
  pinta ninguna hora inventada.
- **7 — cumplido.** `/app/vida/ajustes` con exactamente dos campos (el test
  cuenta `textbox`, `switch` y `spinbutton` a cero), colgando del bloque
  `settings` del módulo `vida` en `app-nav.config.ts` — **una sola fuente**: de
  ahí salen el popover «Ajustes» del módulo (comprobado en `AppLayout.test.tsx`)
  y `⌘K` (`createCommandActions` junta `sections` + `settings`,
  `app-nav.config.ts:163`).
- **8 — cumplido hasta donde llega un agente.** Guardar llama a
  `updateMySettings` con **exactamente** `{ vidaDayStartTime, vidaDayEndTime }`,
  sobre `useUpdateUserSettingsMutation` tal cual; no hay hook ni clave nueva. La
  ida y vuelta real contra el API es del criterio 58.
- **9 — cumplido.** Con los dos nulos se ven 06:30 y 23:00 y se lee «06:30 y
  23:00 son el horario por defecto: todavía no has elegido el tuyo». Con horario
  guardado, el suyo y sin la frase. `useVidaDayHours` además **no se fía de un
  horario roto**: medio horario o un fin anterior al inicio caen al respaldo y
  se declaran respaldo.
- **10 — cumplido.** Fin no posterior al inicio (y dos horas iguales): no se
  llama a la mutación, sale un `role="alert"` con el motivo, los campos quedan
  `aria-invalid` y **lo escrito sigue ahí**. Con la mutación en error se ve un
  `Alert` que dice que lo puesto sigue ahí, y el borrador no se suelta.
- **53, 54 — cumplidos en lo que toca esta tajada, con matiz de método.** La
  medición a 375 px es la del constructor (arnés ya borrado); yo la respaldo
  leyendo el CSS, que es donde estaría el fallo: `flex-wrap` + `min-width: 0` +
  `text-overflow: ellipsis` en la línea de la tarjeta, la hoja en columna, los
  dos campos de ajustes apilados hasta 30rem, y ni un ancho fijo salvo el campo
  de minutos (5,5rem). El test de la tarjeta con un nombre de 60 caracteres está
  y pasa. **No repetí la medida en navegador**: queda dicho, no disimulado.
- **55 — no verificado por mí.** Los contrastes en oscuro son los que midió el
  constructor. Lo que sí comprobé es la regla de la que salen: nada nuevo usa
  `--color-text-muted`; todo lo que hay que leer usa `--color-text-secondary`,
  y las píldoras encendidas usan `--color-primary-hover` con su razón escrita.
- **56 — cumplido.** «sin hora» es una invitación con la vía para ponérsela, no
  un reproche; hay test de lista de palabras en la tarjeta y en la pantalla de
  ajustes.
- **57 — cumplido.** Typecheck limpio, lint 14/0, 2 fallos de 708 (los dos de
  siempre), y los dos documentos nuevos en la lista de `contracts.test.ts`. El
  chunk inicial (861,01 kB, +7,8 kB) es la pantalla nueva y las utilidades: el
  criterio pide que **no crezca por iconos**, y `app-icons` sigue en 620,20 kB
  perezoso.
- **58 — pendiente, y no es de un agente.** Está detrás del login y además
  necesita `15463da` desplegado en Cloud Run. Los pasos están al final de la
  sección 3.

**El contrato tiene dientes de verdad**

El criterio 1 se apoya entero en `contracts.test.ts`, así que comprobé que **no
es un test que pase siempre**: construí el esquema con el SDL vendorizado
**mutilado** —quitando `startTime`/`durationMinutes` de `vida.schema.graphql`, y
`vidaDayStartTime`/`vidaDayEndTime` de `user-settings.schema.graphql`— y validé
contra él los documentos reales del módulo. En los dos casos salieron errores de
validación nombrando los campos que faltaban. Es decir: si mañana alguien recopia
un SDL viejo, los documentos dejan de validar y el test lo canta. (Además, el
test del constructor afirma los campos sobre el texto del SDL, que es la segunda
red.)

**Lo que pudo romperse cerca, y cómo lo busqué**

- **`graphify explain "planVidaItemSave"` y `explain "useSaveVidaItemForActivity"`**:
  el único llamador vivo es `VidaActivitySheet`. Lo confirmé abriendo el árbol
  (`grep -rln` sobre `src/` sin tests): `VidaActivitySheet.tsx` y nada más. El
  riesgo número 1 del constructor —que el `update` manda siempre los dos campos
  y `null` limpia— **existe pero está contenido**: el tipo obliga a pasarlos y el
  único llamador los deriva del propio `vidaItem`. El caso concreto que más me
  preocupaba, **editar solo los días**, lo probé de punta a punta: ítem con
  `08:00` y 45 min, marco «martes», guardo → `{ id: 'v1', days: [...4 días],
  isActive: true, startTime: '08:00', durationMinutes: 45 }`. No se borra nada.
- **`UserSettings` ganó dos campos obligatorios.** Consumidores en `src/`:
  `user-settings.api.ts`, `settings/index.ts`, `SettingsPage.tsx`, y lo nuevo de
  Vida. `pnpm typecheck` limpio dice que ningún fixture ni pantalla se quedó
  corto; `SettingsPage` (la cuenta) no construye el objeto, lo consume. Nada roto.
- **FEAT-002 (catálogo, archivar, categorías).** Los 25 archivos de test de
  `features/vida` pasan, incluidos `VidaActividadesPage`, `VidaArchivadasPage`,
  `VidaCategoriasPage`, `useArchiveActivity` y `vida-catalog.utils`. La tarjeta
  cambió de estructura interna (ahora la hora y los días van dentro de un
  contenedor común) pero conserva `role="img"` con «En tu plantilla: …», que es
  de lo que colgaban los tests de F1/F2.
- **Hábitos y `layouts`.** `app-nav.config.ts` **solo añade** el bloque
  `settings` del módulo `vida`: el de hábitos no se toca. Los tests de `⌘K`
  siguen comprobando que los seis destinos de hábitos están en el mismo orden y
  delante de todo, y pasan. Los **dos tests invertidos** (`app-nav.config.test.ts`
  y `AppLayout.test.tsx`) afirmaban «Vida no tiene ajustes de módulo», que es
  exactamente lo que el **criterio 7 deroga**: la inversión es legítima y ahora
  afirman algo más fuerte (una entrada, y apunta a `vidaPaths.ajustes`).
- **Rutas.** `vida.routes.test.tsx` añade `/app/vida/ajustes` a la tabla de
  títulos y mockea `useUserSettings` porque el arnés no monta `useAuthBootstrap`;
  el mock devuelve la consulta **deshabilitada**, o sea que esa prueba está
  recorriendo el estado «sin sesión» de la pantalla, que es el que pide el
  criterio 51. Las cuatro rutas de F0/F1 siguen renderizando su título.

**Estados**

- **Sin datos / primera vez:** cubierto — es justo el criterio 9 (nulos → 06:30
  y 23:00 dichos como valor por defecto).
- **Cargando:** cubierto en ajustes con esqueleto y **sin pintar las horas por
  defecto** (criterio 50 adelantado). En la hoja, la plantilla en vuelo sigue
  bloqueando el bloque entero, y el de hora y duración vive dentro de esa guarda.
- **Error:** cubierto en los dos sentidos — error al **cargar** (Alert y aun así
  se puede escribir y guardar) y error al **guardar** (Alert, no se pierde lo
  escrito, no se cierra nada).
- **Sin permisos / sin sesión:** cubierto en ajustes con mensaje y botón de
  entrar; nada de spinner eterno.
- **Texto largo:** cubierto en la tarjeta (60 caracteres, truncado).
- **Móvil 375 px:** medido por el constructor, respaldado por mí leyendo el CSS;
  **no repetido en navegador** (hallazgo de método, no de producto).
- **Tema oscuro:** los contrastes son los del constructor; yo solo verifiqué la
  regla de variables. Entra en el recorrido manual.

**¿Duplica algo que ya existía?** (contra la sección 2)

No. Comprobado uno por uno contra «Lo que NO se crea» y «Dónde NO va»: no hay
mutación ni documento nuevo del plan del día; **no hay hook de ajustes nuevo**
(`useVidaDayHours` es lectura sobre `useUserSettingsQuery`) ni clave de caché
nueva; ni invalidación nueva; ni componente de `shared/ui` nuevo; ni quinto
normalizador de texto; ni iconos de Font Awesome a pelo; las utilidades de hora
van en `vida-time.utils.ts` **hermano** de `vida-date.utils.ts`, no dentro; los
ajustes van en `/app/vida/ajustes` y no en `/app/settings` ni en una hoja;
`/app/vida/categorias` no se movió; `Popover` y `--color-text-muted` siguen sin
tocarse. Las dos desviaciones que el constructor declara —dos formateadores de
duración y `formatTimeForDisplay`— son **siete líneas cada una**, están
justificadas por el texto literal del criterio 6 y por los renders, y no
duplican nada vivo: no existía aritmética de tiempo en `src/`.

**Hallazgos (no devuelven la tajada, quedan escritos)**

1. **El formato que pinta «A qué hora» lo decide el navegador.** El criterio 3
   dice «HH:mm, 24 h»; el **valor** siempre lo es, pero un `input type="time"`
   en un navegador `en-US` se lee «06:30 AM». Es el primer `type="time"` del
   repo, así que no hay precedente que seguir. Forzar 24 h siempre sería un
   control propio: **es una decisión del usuario**, no del revisor. Lo mismo
   aplica a los dos campos de `/app/vida/ajustes`.
2. **`useUpdateUserSettingsMutation` invalida `habitKeys.all` con
   `refetchType: 'all'`.** Guardar el horario de Vida refresca todas las
   consultas de hábitos. Lo vio el constructor y no lo tocó, y hace bien: es de
   `features/settings` y lo comparte la pantalla de cuenta. Merece su propio
   dossier si molesta.
3. **El SDL vendorizado de `UserSettings` tiene 12 campos y el documento pide
   8.** Correcto y deliberado: el SDL es copia literal y el documento pide lo que
   usa. No es deuda, es la forma del arnés; queda dicho para que nadie lo
   «arregle».
4. **Mi medición de 375 px y de tema oscuro es de segunda mano.** El arnés del
   constructor ya estaba borrado (como manda el protocolo) y rehacerlo habría
   consumido la revisión entera. Lo digo en vez de firmarlo: el recorrido manual
   del usuario es quien lo cierra de verdad.

**Lo que no revisé**

- El recorrido real con sesión (criterio 58) y la ida y vuelta contra el API
  desplegada: **están fuera del alcance de un agente en este proyecto**.
- La apariencia real en móvil y en oscuro, por lo dicho en el hallazgo 4.
- Las tajadas 2 a 5: no existen todavía.

---

*Revisado por `feature-reviewer` el 2026-09-20. Fuentes: la sección 1 entera y
literal, la sección 2 («Lo que NO se crea» y «Dónde NO va»), la entrada de la
tajada 1 de la sección 3, `docs/features/PROTOCOL.md`,
`docs/features/ENVIRONMENT.md`, el árbol sin commitear, `graphify explain`,
`git show 15463da:…` en `~/Developer/xavi-platform-node`, y un arnés de revisión
propio de 7 casos ya borrado.*


### Tajada 2 — La agenda del día, en solo lectura

**Veredicto: `returned`.** El criterio 20 no se cumple en la mayor parte del
día: la marca «Ahora» —y con ella el `scrollIntoView`— **solo existe si queda
alguna entrada de la agenda que empiece después de ahora**. En cuanto «ahora»
cae dentro de la última entrada (el hueco que sigue al último bloque), no se
pinta ninguna marca y la pantalla no abre en ningún sitio. Medido, no deducido.
Todo lo demás de la tajada está bien hecho y bien probado: lo que se devuelve es
una regla de una línea en `VidaHoyPage.tsx:159-162`, no la tajada entera.

**Criterios, uno por uno** (contra la sección 1, literal)

| # | Estado | Evidencia con la que lo cerré |
|---|---|---|
| 11 | cumplido | `VidaHoyPage.tsx` sustituye el cascarón; `buildDayAgenda` ordena por `startTime` y desempata por `orderIndex` (`vida-agenda.utils.ts:108`), con test propio y test de pantalla. |
| 12 | cumplido | Test con temporizadores falsos (13h 36 → 13h 35 al avanzar 60 s) y `useVidaNowMinute` con tic de 60 s, probado en sus 3 casos. En mi arnés: a las 5:00 «te quedan 18h hasta las 23:00» (antes del inicio, literal correcto) y a las 23:30 «te quedan 0m». |
| 13 | cumplido | Test puro: anchos al 100 % y `nowPercent` 0 / 50 / 100. **Salvedad medida** (hallazgo 2): con bloques solapados los anchos suman 106,06 %. |
| 14 | cumplido | Leyenda como texto real, y `plannedMinutes`/`freeMinutes` salen de la misma lista que pinta la agenda (`getDayBudget:170-189`). Verificado en mi arnés con la ventana estirada: «planeado 1h 35 · libre 16h 45» = 5:30–23:50. |
| 15 | cumplido | Cinco formas, cada una con test; leí las cinco cadenas (`vida-agenda.utils.ts:233-275`): ninguna reprocha, ninguna dice «vacío». La quinta («ya no queda hueco por delante») es correcta y necesaria. |
| 16 | cumplido | Hora, cápsula de categoría, nombre, `endTime − startTime` y «en N min» con `findNextBlockId` probado en los tres casos. Hallazgo 4 sobre la legibilidad de «en 920 min». |
| 17 | cumplido | Test de los tres huecos (antes del primero, entre bloques, después del último) con los bordes del horario. Los restos < 15 min se pintan finos: desviación declarada y coherente con el 14. |
| 18 | cumplido en su mitad de contenido | Filtra por `durationMinutes` del ítem, excluye por `activityId` contra el plan —**no** por `takenToday`, con test con nombre propio— y tope de 3 con el resto contado. «+ otra cosa» se aplaza a la tajada 3: es el mismo recorte que el arquitecto dejó escrito para el 21, y va dicho en la sección 3. Hallazgo 3 sobre el hueco que ya empezó. |
| 19 | cumplido | Sin duración: no se filtra por tamaño, va al final y se lee «sin duración» (test). La mitad «al tocarla abre la hoja» es el criterio 25, tajada 3. |
| **20** | **NO cumplido** | Ver abajo. |
| 21 | cumplido en su mitad de texto | Tests de «Aún no hay plan… Tu plantilla trae 2 cosas los viernes», del día entero como un hueco y del enlace al catálogo sin plantilla. El botón no se pinta, como mandaba el recorte del arquitecto. |
| 22 | cumplido | Test que busca empezar/terminar/en marcha/fuera del plan/hecho; y la pantalla no invoca ninguna mutación (lo comprobé leyendo los cuatro componentes: ninguno importa un hook de mutación). |
| 48 | cumplido en su mitad | `VidaTemplateAside` lista la plantilla del día y marca «en el plan» por `activityId`; sin «Cómo va el día» (D8). |
| 49 | cumplido | `getCurrentLocalDate` + `getVidaDayOfWeek`/`parseYmdToLocalDate`, que parten la cadena a mano; test del día 18. |
| 50 | cumplido | Dos tests separados (cualquier consulta en vuelo, y los ajustes en vuelo): esqueleto y ni «Aún no hay plan» ni «Libre». |
| 51 | cumplido | Test de pantalla con las tres deshabilitadas y test de rutas con el guard **real** en `false`: «Entra para ver tu día» y enlace, sin esqueleto. |
| 52 | cumplido | Error del plan → «No pudimos cargar tu día» + «Reintentar» que llama a `refetch` de las tres; fallo parcial → aviso que nombra qué falta. Dos tests. |
| 53 | **queda en comprobación manual** | No lo volví a medir en un navegador real. Lo que sí hice: revisar los cuatro `.module.scss` y la página — `min-width: 0` en todos los contenedores, `text-overflow: ellipsis` en los tres textos largos, sin un solo ancho fijo en `px` y el lateral solo a partir de `@media (min-width: 64rem)`. Estructuralmente no puede desbordar a 375 px, y coincide con el `scrollWidth 375` que midió el constructor. |
| 54 | cumplido | Mismo razonamiento estructural + la medida del constructor con un nombre de 63 caracteres. |
| 55 | cumplido, con hallazgo | La tabla de contrastes del constructor es creíble y está medida capa a capa. Hallazgo 1: en oscuro la marca de la barra y la píldora «Ahora» acaban siendo **dos violetas distintos**. |
| 56 | cumplido | Tests de pantalla y de las cinco formas de la guía contra `/desperdici\|perdiste\|fallaste\|cancelar\|eliminar\|vacío\|vacía/i`; además leí las cadenas a mano. Un tramo sin nada es **libre**. |
| 57 | cumplido en lo que corrí yo | `pnpm typecheck` limpio · `pnpm lint` **14 errores / 0 warnings** · `pnpm test` **2 fallos de 761** (los dos de `SearchSelect`), corridos enteros por mí. El `pnpm build` **no lo repetí**: me quedo con los 877,89 kB del constructor y con que `app-icons` sigue en 620,20 kB perezoso — ningún archivo nuevo importa de `@fortawesome/free-solid-svg-icons` (lo comprobé). Ningún documento GraphQL nuevo. |
| 58 | **pendiente del usuario** | Detrás del login y además necesita la API desplegada. No se toca. |

**El criterio 20, con el detalle de cómo lo medí**

La marca se decide en `VidaHoyPage.tsx:159-162`:

```tsx
const markerBeforeId =
  nowMinutes === null
    ? null
    : (agenda.entries.find((entry) => entry.startMinutes > nowMinutes)?.id ?? null)
```

Si ninguna entrada **empieza** después de ahora, `markerBeforeId` es `null`: no
se pinta la fila de «Ahora», `nowRef` nunca se asigna y el efecto del
`scrollIntoView` sale por `if (!node) return`. Arnés temporal propio
(`src/features/vida/pages/VidaHoyPage.revisiontmp.test.tsx`, mismos mocks que el
test del constructor, **ya borrado**):

| Caso | Marcas «Ahora» | `scrollIntoView` |
|---|---|---|
| Plan de tres bloques (8:00, 10:00, 13:00), ahora **20:00** | **0** | **0** |
| Un solo bloque 8:00–8:45, ahora **12:00** | **0** | **0** |
| **Hoy sin plan** (criterio 21), ahora 9:24 | **0** | — |
| Plan de tres bloques, ahora 11:30 | 1 | 1 |

El criterio dice «cuando el día mostrado es **hoy** y la hora actual cae
**dentro del día**». A las 20:00 de un día de 6:30 a 23:00 la hora cae dentro
del día y no hay nada que enseñar ni a dónde abrir. No es un borde raro: es
**toda la franja posterior al último bloque** —con el plan del propio test del
constructor, de las 14:00 a las 23:00, nueve horas— y **el día sin plan entero**,
que es justamente el estado que el criterio 21 obliga a cuidar en esta tajada.
El test existente del criterio 20 usa las 9:24 con tres bloques por delante, que
es el único caso en que la regla acierta.

**Resultado esperado:** que la marca exista siempre que `dayStart ≤ ahora ≤
dayEnd`, cayendo **dentro** de la entrada que contiene a «ahora» (partir el
hueco en pasado/futuro, o anclarla dentro del hueco) y no solo antes de la
siguiente. Con el hueco partido se arregla de paso el hallazgo 3. Y un test por
cada uno de los tres casos de la tabla.

**Qué miré alrededor (regresiones)**

- **`git diff --stat HEAD -- src/`**: seis archivos modificados —
  `useVidaDayHours.ts`, `VidaHoyPage.tsx`, `vida.routes.test.tsx`,
  `vida-date.utils.ts(.test)` y `AppLayout.test.tsx` — más las carpetas nuevas.
  **FEAT-002 (catálogo, hoja, tarjeta, `VidaActividadesPage`) y la tajada 1 (la
  hoja con hora y duración, `VidaAjustesPage`, el SDL, `planVidaItemSave`) no se
  tocan**: no hay por dónde romperlos, y sus tests siguen verdes en la corrida
  entera.
- **`graphify explain "useUserSettingsQuery"`** → lo consumen `useVidaDayHours`
  y `SettingsPage`, y nadie más; `AppLayout` **no** lo usa. Por eso el mock
  nuevo de `useUserSettings` en `AppLayout.test.tsx` no puede tapar nada de la
  barra: solo afecta a la página de Vida que ese arnés monta debajo. Abrí el
  diff entero de ese test: **no se borró ni se cambió ninguna aserción**, solo
  se añaden dos `vi.mock` y se corrige un comentario. Los cuatro casos de la
  barra siguen midiendo lo mismo.
- **`vida.routes.test.tsx`**: se saca `hoy` de la lista de «sigue siendo un
  cascarón» —una afirmación de F0 que el criterio 11 deroga— y en su lugar entra
  un caso que comprueba el criterio 51 con el guard **real** en `false`.
  `plantilla` y `revision` siguen cubiertas. Cambio correcto y bien argumentado.
- **`useVidaDayHours` ganó `refetch`**: su único consumidor aparte de la agenda
  es `VidaAjustesPage` (tajada 1); `pnpm typecheck` limpio y sus tests verdes.
- **Hábitos y `layouts`**: el diff no toca una línea de producto fuera de
  `src/features/vida/`; el único archivo compartido tocado es un **test**.
- **El arnés del constructor** (`src/harness-feat003-t2/`) **no existe** en el
  árbol: `git status` no lo lista. Bien borrado.

**Estados**

Cubiertos y probados: **sin datos** (hoy sin plan y sin plan ni plantilla),
**cargando** (con el matiz de los ajustes en vuelo), **error con reintento**
(total y parcial, nombrando qué falta), **sin sesión**, **texto largo**.
**Móvil 375 px y oscuro**: revisados en el código, no vueltos a medir en
navegador (ver criterio 53). **Permisos** no aplica: en este producto solo hay
«con sesión» y «sin sesión», y ese está cubierto.

Hallazgos que **no** motivan la devolución (van escritos, no arreglados):

1. **Dos violetas para la misma idea en tema oscuro.** La marca de la barra usa
   `var(--aura-ring-to, #7c3aed)` (`VidaDayBudget.module.scss:99`), que en
   oscuro vale **`#a78bfa`** (`_theme-variables.scss:270`), mientras la píldora
   «Ahora» lleva `#7c3aed` fijo (`VidaHoyPage.module.scss:94`). El literal está
   justificado —texto blanco encima, 5,7:1— y **no hay hoy un token de violeta
   sólido para fondo con texto blanco**: el sistema solo tiene el par del
   anillo. Aceptable, pero deja la barra y la píldora en tonos distintos en
   oscuro. Lo coherente sería un token nuevo (`--aura-now`) o que la barra use
   el mismo literal. Nota aparte: el render 03 describe la marca como **roja**;
   el violeta es una desviación consciente del dibujo, y me parece bien.
2. **Con bloques solapados la barra rebasa el 100 %.** Medido: dos bloques
   8:00–10:00 y 9:00–11:00 dan anchos de 9,09 + 12,12 + 12,12 + 72,73 =
   **106,06 %**. `buildDayAgenda` los pinta bien (no hay hueco negativo) pero
   `plannedMinutes` los suma dos veces. D4 dice que la web no los crea y la
   sección «fuera de alcance» los excluye, pero el API los acepta y un cliente
   futuro podría meterlos. Basta con recortar el solape al sumar `planned`.
3. **Un hueco que ya empezó se ofrece por su tamaño entero.** A las 11:30, el
   hueco 10:30–13:00 sigue diciendo «2h 30» y ofrece fichas de hasta 2h 30
   cuando solo quedan 1h 30. `findLargestGap` sí recorta por «ahora» para la
   guía; el hueco pintado no. En solo lectura es una imprecisión; en la tajada
   3, cuando la ficha coloque de verdad, sería un bloque puesto en el pasado.
4. **«en 920 min».** El criterio 16 pide «en N min» y eso es lo que hace, pero
   para un bloque lejano se lee mal. Con `formatDurationFromMinutes` ya en casa,
   «en 15h 20» cuesta una línea.
5. **«te quedan 0m hasta las 23:00» a las 23:30**, junto a «Tu día se cerró a
   las 23:00». No reprocha y es literal, pero sobra.

**¿Duplica algo que ya existía?** No. Contra la sección 2: ninguna clave de
caché nueva (`useVidaDayData` compone los hooks que ya hay), ninguna mutación,
ningún componente de `shared/ui`, ningún normalizador de texto, ningún icono
importado a pelo, y `--color-text-muted` sigue sin usarse. Las dos desviaciones
declaradas son razonables: el icono y el color salen de
`item.activity.category`, que **ya viaja en el plan del día** —lo comprobé en
`activity-day-plan.graphql.ts`—, lo que evita una consulta entera; y las tres
utilidades nuevas de `vida-date.utils.ts` son de **fecha**, no de hora, así que
no contradicen la regla de «dónde NO va» (que hablaba de las de hora), aunque sí
la frase «ninguna utilidad de fecha nueva»: son 31 líneas, hacían falta y están
en el sitio correcto.

**Lo que no revisé:** el `pnpm build` (me quedo con la medida del constructor),
el recorrido real (criterio 58, del usuario y con la API desplegada), el efecto
visual del `scrollIntoView` y el rendimiento con treinta bloques.

---

*Revisado por `feature-reviewer` el 2026-09-20. Fuentes: la sección 1 entera y
literal, la sección 2 («Dónde va el código», «Lo que NO se crea», «Dónde NO
va»), la entrada de la tajada 2 de la sección 3, `docs/features/PROTOCOL.md`,
`docs/features/ENVIRONMENT.md` y su sonda, `git diff HEAD`, `graphify explain`,
`docs/vida/assets/03-vida-agenda.html`, la corrida entera de `pnpm typecheck` /
`lint` / `test`, y un arnés de revisión propio de 8 casos bajo
`src/features/vida/pages/`, ya borrado.*

#### Tajada 2 — segunda revisión (tras la devolución)

**Veredicto: `accepted`.** El criterio 20 se cumple, y se cumple **donde tenía
que arreglarse**: la marca dejó de ser un ternario del JSX y es una entrada más
que coloca `buildDayAgenda`. Reproduje mis tres casos y los cuatro hallazgos
baratos con un arnés propio de 9 casos (mismos mocks que el test de pantalla,
ya borrado), y volví a correr la línea base entera.

**Los tres casos devueltos, medidos otra vez**

| Caso | Marcas «Ahora» | `scrollIntoView` | Suma de anchos |
|---|---|---|---|
| Ahora **20:00**, último bloque 13:00–14:00 | **1** | **1** | 100,000 % |
| Ahora **11:30**, en medio del hueco 10:30–13:00 | **1** | **1** | 100,000 % |
| **Hoy sin plan**, ahora 9:24 | **1** | **1** | — |
| Reloj **dentro** de un bloque (8:10, bloque 8:00–8:45) | **1** | **1** | 100,000 % |
| Bordes exactos **6:30** y **23:00** | 1 y 1 | — | — |
| Fuera del horario (**23:30**) | 0 | — | — |

Las filas que devuelve el DOM confirman que el orden no se rompe y que nada
desaparece. A las 20:00: `… 13:00 Cocinar y almorzar · 14:00 Libre 14:00 – 20:00
· 6h · **20:00 Ahora** · 20:00 Libre 20:00 – 23:00 · 3h` con sus fichas — el
tramo de antes sigue ahí, con sus minutos, y sin fichas por pasado. A las 11:30:
el hueco aparece partido en «Libre 10:30 – 11:30 · 1h» (sin fichas) y «Libre
11:30 – 13:00 · 1h 30», que ya solo ofrece lo que cabe en 1h 30 — la de 2 h
desaparece, que era el hallazgo 3. Con el reloj dentro de un bloque, la marca
queda **justo debajo** del bloque y el bloque no se parte: coincide con el
render 03 y deja fuera lo que es F3.

**Los cinco hallazgos**

- **2 — cerrado y comprobado.** Bloques 8:00–10:00 y 9:00–11:00: anchos
  9,09 + 12,12 + 6,06 + 72,73 = **100,000 %** (antes 106,06 %). La leyenda dice
  «planeado 3h · libre 13h 30» = 990 min = el día entero, la guía dice «2
  bloques · 3h» —antes se contradecían— y cada tarjeta sigue diciendo su
  duración real («2 h» las dos). `trackMinutes` es la solución correcta: no
  recorta lo que se lee, recorta lo que se cuenta.
- **3 — cerrado.** Medido arriba. Además un tramo ya pasado no ofrece fichas.
- **4 — cerrado.** «en 15 h 20 min» en un bloque a 920 minutos. La lectura del
  criterio 16 («en N min» para el bloque que viene ahora, formateador largo más
  allá de la hora) me parece la correcta y está declarada.
- **5 — cerrado.** A las 23:30: «planeado 2h 15 de 16h 30», sin «te quedan 0m»,
  con la guía «Tu día se cerró a las 23:00».
- **1 — sigue abierto, y estoy de acuerdo en no tocarlo.** Unificar los dos
  violetas pide un token nuevo en `_theme-variables.scss`, que es el sistema de
  diseño de todo el repositorio: es una decisión de diseño con su render, no
  algo que se decida dentro de una devolución. Queda anotado para quien tome esa
  decisión, junto con que el render 03 describe la marca como roja.

**Criterios re-verificados**

20 **cumplido** (lo de arriba, más ocho casos puros en
`vida-agenda.utils.test.ts` y tres de pantalla). 13 y 14 **cumplidos ahora sin
salvedad**: la identidad `planeado + libre = el día` aguanta también con
solapes, y la guía cuenta con el mismo número que la leyenda. 16, 17, 18 y 12
**siguen cumplidos** con el comportamiento nuevo (el hueco partido no cambia la
suma; el «en N min» del bloque que viene sigue en minutos). 15 y 56: volví a
leer las cinco formas y la frase nueva del día cerrado — ninguna reprocha.
21 sigue cerrado en su mitad de texto: el aviso de plantilla vacía se movió al
primer hueco **no pasado**, que es lo correcto. 50, 51 y 52 intactos.

**Qué miré alrededor (regresiones)**

- **`git diff --stat HEAD -- src/`**: exactamente los mismos seis archivos
  modificados que en la primera entrega (`VidaHoyPage.tsx` pasa de +240 a +243
  líneas) y las mismas carpetas nuevas. **Ni FEAT-002 ni la tajada 1 tienen una
  línea de producto tocada**; sus tests siguen verdes en la corrida entera.
- **Quién usa lo que cambió de forma**: `graphify explain "buildDayAgenda"` y un
  `grep` de `AgendaEntry|AgendaGap|trackMinutes` sobre `src/` → los consumidores
  son `VidaHoyPage.tsx`, `VidaDayBudget.tsx`, `VidaAgendaGap.tsx` y el propio
  test; nada fuera del módulo. La tercera variante de `AgendaEntry` no puede
  colarse en ningún `switch` ajeno porque no hay ninguno.
- **El riesgo que el constructor señaló** (un ternario que asuma dos variantes)
  lo comprobé en los dos sitios: la barra salta la marca —los anchos suman 100 %
  y la marca se pinta con `left`, no como tramo— y la lista pinta `kind === 'now'`
  como fila propia.
- **Línea base, corrida por mí entera**: `pnpm typecheck` limpio · `pnpm lint`
  **14 errores / 0 warnings** · `pnpm test` **2 fallos de 781**, y los dos son
  los de `SearchSelect` (lo confirmé corriendo solo ese archivo: 2 de 2 fallan
  por su cuenta, y es el único archivo rojo de los 84). El `pnpm build` no lo
  repetí: +0,8 kB sobre la primera entrega, con `app-icons` e `IconPicker`
  intactos, es coherente con un cambio que no añade dependencias.

**Hallazgos nuevos, ninguno devuelve la tajada**

1. **Con un bloque planeado antes del inicio del día, la barra enseña la marca y
   la agenda no.** Medido: bloque 5:30–6:00, día de 6:30 a 23:00, reloj a las
   **5:45** → 0 marcas en la lista pero sí la marca en la barra (`nowPercent`
   mira la ventana estirada; `buildDayAgenda` mira el horario de los ajustes).
   Las dos lecturas son defendibles por separado y el criterio 20 habla de
   «dentro del día», así que la lista tiene razón; lo que chirría es que no digan
   lo mismo. Es el reverso exacto del defecto que devolví, en un caso mucho más
   raro.
2. **Con bloques solapados, la marca puede quedar fuera de orden de reloj**:
   bloques 8:00–10:00 y 9:00–11:00 con el reloj a las 9:24 dan «8:00 Uno · 9:24
   Ahora · 9:00 Dos». Los solapes están fuera de alcance (D4) y la barra ya no
   miente; queda anotado por si la tajada 3 los permite alguna vez.
3. **«2h 5» en vez de «2h 05»**, que el propio constructor anotó: es el
   formateador de la tajada 1, ya aceptada. Confirmo que es de allí y que no se
   toca desde aquí.

**Lo que sigue sin verificarse** (igual que en la primera revisión, y dicho sin
disimulo): el recorrido real del criterio 58 —detrás del login y además
necesitado de `15463da` desplegado en Cloud Run—, los 375 px y el tema oscuro en
un navegador de verdad (mi comprobación es estructural más la medida del
constructor), el centrado real del `scrollIntoView` y el rendimiento con treinta
bloques.

---

*Re-revisado por `feature-reviewer` el 2026-09-20. Fuentes: los criterios 11–22,
48–57 de la sección 1, la entrada «2ª entrega» de la sección 3, el código de
`vida-agenda.utils.ts` entero, `git diff HEAD`, `graphify explain`, la corrida
entera de `pnpm typecheck` / `lint` / `test` (+ `SearchSelect` por separado) y
un arnés de revisión propio de 9 casos bajo `src/features/vida/pages/`, ya
borrado.*
