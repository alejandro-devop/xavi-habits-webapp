---
id: FEAT-003
title: Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos
status: specified
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

*(pendiente)*

## 3. Construcción — feature-builder

*(pendiente)*

## 4. Revisión — feature-reviewer

*(pendiente)*
