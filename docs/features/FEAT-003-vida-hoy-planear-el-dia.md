---
id: FEAT-003
title: Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos
status: delivered
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
| 3 | **Poner algo en un hueco.** Un toque en una ficha lo coloca al principio del hueco; «+ otra cosa» abre la hoja de tres preguntas (qué · cuánto · cuándo) con lo que no cabe apagado y el «queda libre después»; quitar un bloque y cambiarle hora o duración. Errores de mutación visibles. | accepted |
| 4 | **Cualquier día, no solo hoy.** La tira de 7 días con el punto de «tiene plan», el día en la URL, la ventana de esta semana y la siguiente, el día futuro en trazo suave, el día pasado en solo lectura, «copiar del mismo día pasado» y «vaciar y rehacer». Aquí ya se planea mañana a mano. | accepted |
| 5 | **La semana y armar desde la plantilla.** La vista de semana con una línea por día, «Armar» en los vacíos copiando hora y duración de cada ítem (con el trato explícito de los solapes y de los ítems sin hora) y «Armar toda la semana» sin pisar lo que ya existe. Cierra el criterio de fase. | accepted (2ª entrega) |

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
| 3 | **Poner algo en un hueco.** | `utils/vida-gap-form.utils.ts` (N) · `components/VidaPlaceInGapSheet/` (N) · `components/VidaAgendaGap/` · `components/VidaAgendaBlock/` · `pages/VidaHoyPage.tsx` | 23–30, y 29/52/56 sobre las mutaciones | accepted |
| 4 | **Cualquier día, no solo hoy.** | `utils/vida-window.utils.ts` (N) · `hooks/useVidaWeekPlans.ts` (N) · `components/VidaDayStrip/` (N) · `components/VidaDayActions/` (N) · `pages/VidaHoyPage.tsx` · `routes/vida-paths.ts` | 31–38 | accepted |
| 5 | **La semana y armar desde la plantilla.** | `utils/vida-build-day.utils.ts` (N) · `hooks/useBuildDayFromTemplate.ts` (N) · `hooks/useBuildWeekFromTemplate.ts` (N) · `pages/VidaSemanaPage.tsx` (N) · `components/VidaTemplateAside/` · `components/VidaAgendaGap/` · `routes/vida-paths.ts` · `routes/vida.routes.tsx` | 39–46, 48 (la mitad «Mañana»), y **la mitad de 21 que es el botón**; 47 lo cronometra el usuario | **accepted** (2ª entrega: criterio 48 con su botón, y el día en error fuera del lote — verificados en la segunda revisión) |

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

### Tajada 3 — Poner algo en un hueco

**Resumen para el revisor:**
1. La agenda de Hoy **ya escribe**: un toque en una ficha de un hueco la coloca
   al principio de ese hueco con su duración (`activityDayPlanItemAdd`), **«+
   otra cosa»** abre la hoja **«Poner algo a las HH:MM»** con las tres preguntas
   —qué (plantilla primero, luego buscador sin tildes), cuánto (15 · 30 · 45 ·
   1h · libre, apagando lo que no cabe) y cuándo (horas dentro del hueco más
   «otra hora»)— diciendo cuánto queda libre después; y el «···» de un bloque lo
   **quita del plan** o le **cambia la hora o la duración**.
2. Todo lo nuevo vive en `src/features/vida/`: un `utils` puro
   (`vida-gap-form.utils.ts`), la hoja `VidaPlaceInGapSheet/`, y los cambios en
   `VidaAgendaGap`, `VidaAgendaBlock`, `VidaHoyPage` y los hooks del plan del
   día. Fuera del módulo no se toca nada.
3. **Lo que más probablemente rompí:** (a) **`VidaAgendaGap` cambió de forma**:
   la ficha pasó de ser el `<li>` a ser un `<button>` dentro de él, y eso ya
   produjo scroll horizontal a 375 px hasta que el `li` ganó `min-width: 0`
   —cualquier test o arnés que consultara `li.chip` ahora falla—. (b)
   **`VidaAgendaBlock` ya no es puro**: llama a `useRemoveDayPlanItemMutation` y
   a `useConfirmDialog`, así que **montarlo sin `QueryClient` ni
   `ConfirmDialogProvider` revienta**, y quien mockee
   `@/features/vida/hooks/useActivityDayPlan` tiene que devolver **las cuatro**
   funciones (le pasó a `VidaHoyPage.test.tsx`). (c) Los cuatro hooks del plan
   del día ganaron `onError` con toast: un test que cuente toasts verá uno más
   cuando una mutación falle.

**Lo que se construyó**

| Archivo | Qué |
|---|---|
| `src/features/vida/utils/vida-gap-form.utils.ts` (+ `.test.ts`, 38 casos) (N) | El encaje, **puro**: `GapWindow` (el espacio libre donde algo tiene que caber), `gapToWindow`, `getBlockEditWindow` (el bloque **más lo libre de cada lado**, para editarlo sin pisar al vecino), `isStartTimeInsideWindow`, `getMaxDurationForStartTime`, `durationPillsForWindow`, `fitsInWindow`, `buildStartTimeOptions`, `validatePlacement`, `getPlacementLeftovers` / `describeLeftovers`, `describeWindow` y `toDayPlanTimes`. Rescate de `79bece0:activity-time.utils.ts:399-437` con los mensajes reescritos al criterio 56. |
| `src/features/vida/components/VidaPlaceInGapSheet/` (`.tsx`, `.module.scss`, `index.ts`, `.test.tsx`, 17 casos) (N) | La hoja de tres preguntas. Molde de `VidaActivitySheet`: `SteppedModal` `ds="aura"` + `mobileSheet`, estado arriba, **`key` por apertura** y cierre en el `onSuccess` **local** del `mutate`. Hace de hoja de **poner** (`ItemAdd`) y de **cambiar hora o duración** (`ItemEdit`), que solo se diferencian en que «qué» no se pregunta. |
| `src/features/vida/components/VidaAgendaGap/` (M) | Las fichas son botones: con duración colocan, **sin duración abren la hoja** (criterio 19). Y aparece **«+ otra cosa»**, también cuando el hueco no tiene nada que ofrecer —un hueco sigue siendo sitio—. Sin `onPlaceSuggestion` las fichas vuelven a ser texto: es lo que deja pintar un día pasado en solo lectura (tajada 4). |
| `src/features/vida/components/VidaAgendaBlock/` (M) | El «···» con «Cambiar hora o duración» y «Quitar del plan», copiando el `Popover` + `IconButton` + `useConfirmDialog` de `VidaActivityCard`. La salida del diálogo es **«Volver»**, nunca «Cancelar». Sin `date` no se pinta el menú. |
| `src/features/vida/pages/VidaHoyPage.tsx` (+ `.test.tsx`, +7 casos) (M) | Cablea las dos vías: `placeSuggestion` (ficha → `ItemAdd` al principio del hueco) y `editBlock` (bloque → hoja con `getBlockEditWindow`). El estado de la hoja es **una sola variable** (`SheetState`), para que no exista «editando un bloque dentro del hueco de otro». |
| `src/features/vida/hooks/useActivityDayPlan.ts` (M) | `onError` con `toErrorMessage` en las cuatro mutaciones, igual que `useActivities`. Sin él, colocar desde una ficha —que no abre ninguna hoja— fallaba **en silencio**. |

**Por qué así, y qué se descartó**

- **Una sola hoja para poner y para editar, y no dos.** El criterio 30 pide
  cambiar hora o duración «con las mismas restricciones de encaje»: son
  literalmente las preguntas «cuánto» y «cuándo» de la hoja de poner sobre otra
  ventana. Dos componentes habrían sido dos sitios donde equivocarse con D4. La
  diferencia está en un `editing` opcional: con él no se pregunta «qué» y se
  guarda con `ItemEdit`.
- **`GapWindow` es el único guardián de D4**, y por eso la ventana de edición
  **se lee de la agenda ya construida** (`getBlockEditWindow`) en vez de
  recalcularse: el reparto que valida es exactamente el que se está viendo. Si
  algo cabe en la ventana, no pisa a nadie ni se sale del día, porque los huecos
  salen de `buildDayAgenda` entre los bordes del horario de los ajustes.
- **Un hueco que ya empezó ofrece desde ahora sin ninguna regla nueva**: la
  tajada 2 ya parte el hueco que contiene al reloj, así que la mitad que se
  puede usar **empieza en «ahora»** y `buildStartTimeOptions` la etiqueta «ahora
  mismo». Los tramos `isPast` no ofrecen nada, que ya era así.
- **«+ otra cosa» también aparece cuando no hay fichas.** El criterio 18 lo
  nombra junto a las sugerencias, pero un hueco cuya plantilla ya está entera en
  el plan seguiría siendo sitio libre; dejarlo sin salida habría sido un hueco
  que no se puede usar.
- **Las duraciones que no caben se apagan, no desaparecen** (criterio 26), y el
  campo de «libre» lleva `max` con lo que cabe y lo dice en texto («Aquí caben
  40 min»). `VidaDurationPills` ya tenía la prop `maxMinutes` desde la tajada 1:
  no hizo falta tocarlo.
- **Tres desviaciones del plan, dichas:**
  1. **`durationPillsForWindow` existe pero la hoja no la usa**: las píldoras las
     apaga `VidaDurationPills` con `maxMinutes`, que ya estaba hecho. La función
     se queda porque es la que prueba el criterio 26 sin pintar nada, y la
     tajada 5 la necesita para decidir qué cabe al armar.
  2. **`onError` en `useActivityDayPlan.ts`**, que el plan no pedía. Sin toast de
     error, el camino «un toque en una ficha» no tiene **dónde** enseñar un
     fallo: no abre hoja. Es el patrón del propio módulo (`useActivities`), no
     uno nuevo.
  3. **La hoja excluye de «qué» lo que ya está en el plan**, igual que las
     fichas del hueco. El criterio 25 no lo pide; se hace por coherencia con el
     18 y porque repetir una actividad el mismo día es raro. **El buscador no lo
     excluye**: quien quiera ponerla dos veces, la encuentra.
- **El buscador es `Input` + `filterActivitiesBySearch`**, con la misma clave de
  caché que el catálogo (`{ page: 1, limit: CATALOG_LIMIT }`). **No se usa
  `SearchSelect`** (dos tests rojos en la línea base) ni se añade ningún
  normalizador: `normalizeVidaText` ya quita las tildes.
- **Nada de lo prohibido:** ni mutación nueva, ni documento GraphQL, ni clave de
  caché, ni invalidación nueva (`invalidateDayPlanQueries` por fecha ya refresca
  agenda, huecos y presupuesto), ni componente de `shared/ui`, ni arreglo de
  `Popover`, ni `--color-text-muted`, ni un icono importado a pelo.

**Verificación**

Línea base (antes de empezar, los tres enteros):

```
pnpm typecheck  → limpio
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)
pnpm test       → Test Files 1 failed | 83 passed (84) · Tests 2 failed | 779 passed (781)
                  (SearchSelect ×2, preexistentes)
```

Al cerrar:

```
pnpm typecheck  → limpio
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)   (los mismos 14)
pnpm test       → Test Files 1 failed | 85 passed (86) · Tests 2 failed | 841 passed (843)
                  (los mismos 2 de `SearchSelect`; +62 tests nuevos, 0 fallos nuevos)
pnpm build      → index 892,42 kB · app-icons 620,20 kB (perezoso) · IconPicker 4,64 kB
```

**Arnés temporal** (`src/harness-feat003-t3/`, `.html` + `.tsx`, `MemoryRouter`,
datos sintéticos, **borrado**; `git status` ya no lo lista), servido por el Vite
del usuario en `http://localhost:5173`, a **375 px** y en los dos temas, con un
nombre de 60 caracteres («Revisar el correo y contestar lo que quedó pendiente
de ayer») en una ficha:

- **375 px:** `document.documentElement.scrollWidth` **375** = `clientWidth`
  **375**, con la hoja abierta y con el menú del bloque desplegado. **Antes de
  arreglarlo eran 491 px**: la ficha dejó de ser el `li` y el `li` crecía con el
  nombre. Es el defecto que encontró este arnés y está arreglado con
  `min-width: 0` en `.chips > li` y `.options > li`.
- **La hoja entera cabe sin scroll interno**: «Volver» y «Poner» se ven a 375 px
  sin desplazar nada dentro de la hoja (criterio 53).
- **Las tres preguntas, vistas**: «Qué» con las tres fichas de la plantilla y el
  buscador, «Cuánto» con `15 · 30 · 45 · 1h · libre` y «Aquí caben 2 h 30 min»,
  «Cuándo» con `10:30 · al principio del hueco`, `11:00`, `11:30`, `12:00` y
  «otra hora».
- **Elegido todo**, la hoja dice «Poner lavadora · 10:30 · 20m» y «Queda libre 2h
  10 antes de Cocinar y almorzar».
- **Editando** «Leer un rato» (10:00–10:30), la ventana es de **8:45 a 13:00**
  —el bloque más lo libre de cada lado—, «Qué» no se pregunta, la duración viene
  en 30 y se lee «Queda libre 2h 30 antes de Cocinar y almorzar, y 1h 15 antes
  de empezar».
- **El «···»** despliega «Cambiar hora o duración» y «Quitar del plan».

Contrastes medidos en el DOM componiendo el alfa de cada capa (AA pide 4,5:1):

| Qué | Claro | Oscuro |
|---|---|---|
| «Qué» / «Cuánto» / «Cuándo» | 7,05:1 | 7,88:1 |
| Ficha elegida en «qué» | 8,28:1 | 10,93:1 |
| Píldora de hora sin elegir | 7,34:1 | 6,66:1 |
| Píldora elegida y su pista («· al principio del hueco») | 8,28:1 | 10,93:1 |
| «Queda libre …» | 7,34:1 | 6,66:1 |
| La línea de la previsualización | 17,29:1 | 12,59:1 |
| «Aquí caben 2 h 30 min» | 7,05:1 | 7,88:1 |
| «+ otra cosa» | 6,96:1 | 9,94:1 |
| Duración de una ficha del hueco | 7,30:1 | 9,05:1 |

Las píldoras **apagadas** se distinguen por opacidad 0,5 sobre la encendida, que
es el mismo tratamiento que ya usan los días de la hoja del catálogo; no es texto
que haya que leer para decidir, es un control deshabilitado.

**Criterios que cierra, uno por uno**

- **23 — cerrado.** Test de página: un toque en la ficha «Poner lavadora» llama
  a `ItemAdd` **una vez** con `{ date: '2026-09-18', activityId: 'a-s1',
  startTime: '10:30', endTime: '10:50' }`. Y en el hueco que ya empezó, con el
  reloj a las 9:24, sale `startTime: '09:24'`: nunca una hora del pasado. La
  agenda, los huecos y el presupuesto se rehacen con
  `invalidateDayPlanQueries(date)` del propio hook — **sin recargar** y sin
  estado duplicado.
- **24 — cerrado.** «+ otra cosa» abre «Poner algo a las 10:30» con el subtítulo
  «Hueco de 2h 30 · hasta las 13:00 «Cocinar y almorzar»», y con el hueco final
  del día, «Hueco de 2h 30 · hasta el final del día». Tests de hoja y de página,
  más el arnés.
- **25 — cerrado.** Tres `heading`: «Qué», «Cuánto», «Cuándo». «Poner» nace
  deshabilitado y se habilita al resolver las tres. La duración de la plantilla
  viene **preseleccionada** (`aria-pressed=true` en la píldora de 45) y se puede
  cambiar. El buscador encuentra «Bañarme» escribiendo **«banar»**.
- **26 — cerrado.** En un hueco de 40 min, `15` y `30` quedan habilitadas y `45`
  y `1h` **deshabilitadas**; «libre» lleva `max=40`, dice «Aquí caben 40 min» y,
  tecleando 90, «Poner» sigue apagado y se lee «Desde las 10:00 caben 40 min.
  Elige menos tiempo o empieza antes». Más 9 casos puros de
  `durationPillsForWindow` y `getMaxDurationForStartTime`.
- **27 — cerrado.** «Cuándo» ofrece `10:30 · al principio del hueco`, `11:00`,
  `11:30`, `12:00` y «otra hora»; el test puro comprueba que **todas** las horas
  ofrecidas caen dentro de la ventana y que en un hueco corto no se ofrece una
  hora donde ya no cabría nada. «Otra hora» lleva `min=10:30` / `max=12:59` y,
  tecleando las 19:00, «Poner» se apaga, se lee «Esa hora se sale de este rato
  libre. Aquí cabe algo entre las 10:30 y las 13:00» y **`ItemAdd` no se llama**.
- **28 — cerrado.** «Queda libre 1h 45 antes de Cocinar y almorzar» bajo la
  previsualización «Bañarme · 10:30 · 45m». Cinco casos puros: con bloque
  después, sin él («antes del final del día»), con resto por delante, y llenando
  el hueco entero («Con esto el rato queda completo»).
- **29 — cerrado en lo que se puede comprobar sin API.** Con la mutación en
  error: `onClose` **no** se llama, se lee «No pudimos ponerlo en tu día. Vuelve
  a intentarlo; lo que elegiste sigue aquí», la actividad y la duración **siguen
  elegidas** y `mutate` salió **una sola vez** (nada de un segundo bloque). El
  bloque fantasma no puede existir porque **no hay actualización optimista**: la
  agenda solo cambia cuando la invalidación trae el plan del servidor. El toast
  de error lo añaden los hooks. **Contra el API real lo cierra el usuario**
  (criterio 58).
- **30 — cerrado.** El «···» da «Quitar del plan» (con confirmación que nombra la
  actividad y salida «Volver»; la mutación **no** sale hasta confirmar) y
  «Cambiar hora o duración», que abre la hoja sin «qué», con la ventana del
  bloque, y guarda con `ItemEdit` `{ itemId, startTime, endTime }` — nunca con
  `ItemAdd`. Test puro: mover el bloque dentro de su ventana llega justo hasta el
  vecino y **un minuto más ya no cabe** (D4). En pantalla no aparece «cancelar»
  ni «eliminar».
- **52 (la parte de mutaciones) — cerrado.** Los cuatro hooks del plan del día
  avisan por toast cuando fallan, con `toErrorMessage`, que es el mismo mensaje
  humano que usa el resto de Vida.
- **53 — cerrado a 375 px** con el arnés: `scrollWidth` 375 = `clientWidth`, y
  «Poner» visible sin scroll dentro de la hoja. **En un teléfono de verdad lo
  mira el usuario** (criterio 58).
- **54 — cerrado.** Un nombre de 60 caracteres trunca con puntos suspensivos en
  la ficha del hueco y en la de la hoja, sin desbordar.
- **55 — cerrado** con los contrastes de arriba, medidos en los dos temas.
- **56 — cerrado.** Test que pasa los tres mensajes de `validatePlacement` y el
  DOM entero de la hoja por `/desperdici|perdiste|fallaste|vací|cancelar|
  eliminar/i`. La salida se llama «Volver»; quitar un bloque es «Quitar del
  plan».
- **57 — cerrado** con los números de arriba.
- **58 — no cerrado, y no se puede desde aquí.** Está detrás del login y además
  **el API desplegado todavía no lleva `15463da`**: sin él, las fichas de los
  huecos se leen «sin duración» y colocar desde una ficha no tendrá duración que
  copiar. Los pasos del recorrido están al final de esta entrada.

**Riesgos**

- **`VidaAgendaGap` y `VidaAgendaBlock` cambiaron de forma**, y el segundo dejó
  de ser puro: necesita `QueryClient` y `ConfirmDialogProvider`. Cualquier arnés
  o test que los monte a pelo se cae.
- **El solape lo sostiene entero el cliente.** Si alguien llama a `ItemAdd` sin
  pasar por `validatePlacement` —o si el plan llega con bloques pisados, que el
  API acepta—, la ventana que se calcule será la que enseñe la agenda, no la
  «verdadera». `getBlockEditWindow` se comporta bien en ese caso (se queda en el
  bloque), pero no lo arregla.
- **Dos toques rápidos en dos fichas distintas** colocan las dos: `isPlacing`
  apaga las fichas mientras hay una en vuelo, pero entre el `click` y el
  `isPending` hay un render. Lo peor que pasa es que las dos caben al principio
  del mismo hueco y **se pisan** hasta el siguiente refresco.
- **`describeWindow` llama «hueco» también a la ventana de edición**, que incluye
  el propio bloque («Hueco de 4h 15» al editar uno de 30 min dentro de un rato
  libre de 4h 15). Es cierto como espacio disponible, pero la palabra puede
  chirriar; se deja así para no inventar un segundo texto.
- **La hoja pide `useActivitiesQuery` siempre**, aunque no se busque nada. Es la
  misma clave que el catálogo y `staleTime` de 30 s, así que normalmente es un
  acierto de caché; en frío es una consulta más al abrir la hoja.

**Lo que descubrí y no estaba en el plan** (anotado, no tocado)

- El `Popover` de este repositorio **no se cierra desde su contenido**: al elegir
  «Cambiar hora o duración» el menú se queda pintado detrás de la hoja. Es el
  hallazgo abierto de FEAT-002 y se imita el comportamiento que ya hay.
- Un `input type="time"` **pinta** «10:00 AM» o «10:00» según el idioma del
  navegador, aunque el valor sea `HH:mm` 24 h. Hallazgo abierto de la tajada 1;
  se ve igual en «otra hora».

**Recorrido manual pendiente (criterio 58, con el API desplegada)**

1. `/app/vida/hoy` con plan: toca una ficha de un hueco → el bloque aparece a la
   hora del hueco, el presupuesto baja y la ficha desaparece de ese hueco.
2. Toca una ficha **sin duración** → abre la hoja con esa actividad puesta y sin
   duración elegida.
3. «+ otra cosa» → elige algo del buscador, una duración que no quepa (tiene que
   estar apagada), una hora con «otra hora» fuera del hueco (tiene que negarse) y
   una dentro → «Poner».
4. En el bloque nuevo, «···» → «Cambiar hora o duración»: alárgalo hasta pisar el
   siguiente (tiene que negarse) y hasta justo antes (tiene que dejar).
5. «···» → «Quitar del plan» → confirma y comprueba que el rato vuelve a estar
   libre.
6. Con el avión activado o sin red, repite el paso 3: la hoja **no** se cierra,
   se lee el aviso dentro y sale un toast.

**Estado del árbol:** sin commitear.


*Nota sobre el build:* `pnpm typecheck` (`tsc -b --noEmit`) pasó con un
`TS2783` que **solo** salió en `pnpm build` (`tsc -b`) —dos claves repetidas en
un ayudante del test de la hoja—. Arreglado y vuelto a construir; queda anotado
porque significa que **el typecheck de este repo no es equivalente al del
build**, y confiar solo en el primero deja pasar errores.

El chunk inicial pasa de **878,72 kB a 892,42 kB (+13,7 kB)**: la hoja, la
aritmética del encaje y los dos menús. **No crece por iconos** — `app-icons`
sigue en 620,20 kB perezoso y `IconPicker` en 4,64 kB (criterio 57).

### Tajada 4 — Cualquier día, no solo hoy

**Resumen para el revisor:**
1. `/app/vida/hoy` dejó de ser solo hoy: arriba hay una **tira de siete días**
   con un punto rayado en los que tienen plan, el día visto viaja en la URL
   (`?d=YYYY-MM-DD`), un **día futuro** enseña la misma agenda contando
   «planeado 4h 20 de 16h 30» sin marca de «ahora» ni «te quedan», y un **día
   pasado** es **solo lectura**: sin fichas, sin «+ otra cosa», sin «···», y con
   una línea que lo dice sin reprochar nada. En los días que sí se planean
   aparecen los dos atajos: **«Copiar del \<día\> pasado»** y **«Vaciar y
   rehacer»**, los dos con `activityDayPlanSet`.
2. Lo nuevo vive todo en `src/features/vida/`: `utils/vida-window.utils.ts`,
   `hooks/useVidaWeekPlans.ts`, `components/VidaDayStrip/`,
   `components/VidaDayActions/`, más `pages/VidaHoyPage.tsx` y
   `routes/vida-paths.ts`. **Ninguna mutación, ninguna clave de caché, ninguna
   invalidación y ningún componente de `shared/ui` nuevos.**
3. **Lo que más probablemente rompí:** (a) **`VidaHoyPage` ya no monta sin
   router**: usa `useSearchParams`, así que un test que la renderice sin
   `MemoryRouter` revienta —y quien mockee `@/features/vida/hooks/useActivityDayPlan`
   tiene que devolver también `useSetActivityDayPlanMutation` **y** hacer que
   `useActivityDayPlanQuery` responda **por fecha**, porque ahora se pide un
   segundo día (el de la semana pasada)—. (b) **Siete consultas más al abrir la
   pantalla**: los puntos de la tira son siete `dayPlan.byDate`; comparten caché
   con la agenda, pero el coste real contra el API **no está medido**. (c) La
   página decide `canPlan` **una vez** y de ahí cuelgan las fichas, el «···», la
   hoja y los dos atajos: si `canPlan` se calculara mal, un día pasado pasaría a
   ser editable de golpe en cuatro sitios a la vez.

**Lo que se construyó**

| Archivo | Qué |
|---|---|
| `src/features/vida/utils/vida-window.utils.ts` (+ `.test.ts`, 24 casos) (N) | El calendario de la tajada, **puro y con el «hoy» inyectado**: `getPlanningWindow` (D5), `isInPlanningWindow`, `clampToPlanningWindow`, `isEditableDate` (D3), `sameWeekdayLastWeek` (D7), `buildDayStrip` (siete días desde dos antes, recortados a la ventana), `planItemsToSetItems` (copiar un día en la forma de `activityDayPlanSet`) y `describePlanningWindowEdge` (la frase del borde). |
| `src/features/vida/hooks/useVidaWeekPlans.ts` (+ `.test.tsx`, 5 casos) (N) | Los puntos de la tira con `useQueries`, **misma clave y misma `queryFn`** que `useActivityDayPlanQuery`. El día abierto es un acierto de caché —lo prueba un test— y por eso `invalidateDayPlanQueries(date)` refresca a la vez la agenda y su punto: es la misma entrada. |
| `src/features/vida/components/VidaDayStrip/` (`.tsx`, `.module.scss`, `index.ts`) (N) | La tira. Cada día es un **`Link`** a `?d=…`, no un botón: el «atrás», recargar y abrir en otra pestaña salen gratis. El punto es decorativo y lo que se oye es el `aria-label` («sábado 19 · con plan, 2 bloques»). Scroll horizontal **propio** si aprieta el ancho. |
| `src/features/vida/components/VidaDayActions/` (`.tsx`, `.module.scss`, `index.ts`) (N) | «Copiar del \<día\> pasado» (solo en días sin plan, apagado y explicado si aquel día no tuvo) y «Vaciar y rehacer» (solo si hay bloques, con `useConfirmDialog` nombrando cuántos). Las dos con `useSetActivityDayPlanMutation`, que ya avisa por toast al ir bien y al fallar. |
| `src/features/vida/pages/VidaHoyPage.tsx` (+ `.module.scss`, + `.test.tsx` con 13 casos nuevos) (M) | El día sale de `useSearchParams()`, recortado a la ventana; `canPlan` decide fichas, «···», hoja y atajos; el día que no es hoy va en **trazo suave**; el subtítulo y el texto de «sin plan» cambian con el día; el auto-scroll a «Ahora» se recuerda **por fecha**. |
| `src/features/vida/routes/vida-paths.ts` (M) | `hoyForDate(date)`. **Un solo sitio** construye `?d=`. |

**Por qué así, y qué se descartó**

- **La ventana va de lunes de esta semana a domingo de la siguiente, y no de
  hoy en adelante. Es la única desviación del plan, y es deliberada.** El
  arquitecto escribió `getPlanningWindow()` → `{ from: hoy, … }`. Con ese
  `from`, **ningún día pasado sería alcanzable** y el criterio 38 —«un día
  pasado es solo lectura»— no tendría cómo cumplirse: el render del marco C
  enseña el jueves 17 en la tira con hoy en el viernes 18. D5 dice «esta semana
  y la que viene», que es un rango de días, no «de hoy en adelante». Así que la
  **ventana** (dónde se puede *mirar*) empieza el lunes, y **planear** lo
  limita `isEditableDate`, que sigue siendo `date >= hoy`. Los criterios 35, 37
  y 38 quedan los tres en pie.
- **La tira contra el borde se desliza, no encoge.** Mirando el lunes 14 salen
  lunes→domingo; mirando el domingo 27 salen los siete anteriores a él. Nunca
  hay un día pintado al que no se pueda ir, y **no hay flechas de semana
  anterior/siguiente**: el borde se explica con una línea («Se planea esta
  semana y la que viene: hasta el domingo 27»), que es lo que pide el criterio
  35 en vez de un botón muerto.
- **Un día de fuera de la ventana se recorta, no se rechaza.** Entrar con
  `?d=2026-11-30` deja ver el domingo 27 con su frase, en vez de una pantalla
  vacía o un error. Lo que no tiene forma de fecha cae en hoy.
- **«Copiar» solo en días sin plan (D7) porque `activityDayPlanSet` reemplaza el
  día entero**: ofrecerlo sobre un día ya armado sería borrar lo hecho sin
  decirlo. Y por lo mismo, **«Vaciar y rehacer» solo aparece si hay bloques**:
  vaciar un día vacío no es nada.
- **La confirmación de vaciar dice «Vaciar el día», no «Vaciar y rehacer».** Es
  el nombre del botón el que lleva el vocabulario del render; repetirlo dentro
  del diálogo dejaba **dos controles con el mismo nombre** en la pantalla a la
  vez. Ni «eliminar» ni «cancelar» en ninguno de los dos: la salida es
  **«Volver»** (criterios 30 y 56).
- **En un día pasado el hueco no ofrece nada, ni siquiera como texto.** La
  tajada 3 dejó `VidaAgendaGap` pintando las fichas como `<span>` cuando no hay
  `onPlaceSuggestion`; para el criterio 38 eso seguía siendo «fichas en los
  huecos», así que la página le pasa una lista de sugerencias **vacía**
  (`NO_SUGGESTIONS`) y apaga el aviso de plantilla. El componente no cambió.
- **El lateral «Tu plantilla de \<día\>» sigue apareciendo en un día pasado**:
  es lectura y en esta tajada no tiene ningún botón. **Ojo para la tajada 5**:
  cuando gane «ponerla en el primer hueco donde cabe» tendrá que esconderse (o
  perder el botón) en días pasados, o romperá el criterio 38.
- **El «trazo suave» del criterio 33 se hace con el borde, nunca con el texto**:
  `.agenda[data-tone='plan']` pone las tarjetas en `dashed` y baja el relleno;
  los contrastes de lo que se lee no se tocan (criterio 55).
- **El auto-scroll a «Ahora» se recuerda por fecha** y no una vez por montaje:
  al ir a otro día y volver a hoy, la marca vuelve a existir y hay que volver a
  ella. Antes de este cambio, volver dejaba la agenda arriba del todo.
- **Nada de lo prohibido:** ninguna mutación nueva, ningún documento GraphQL,
  **ninguna clave de caché nueva** (los siete días son `vidaKeys.dayPlan.byDate`),
  ninguna invalidación nueva, ningún componente de `shared/ui`, ningún icono
  importado a pelo, y el día visto **no** entró como segmento de ruta.

**Verificación**

Línea base (antes de empezar, los tres enteros):

```
pnpm typecheck  → limpio
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)
pnpm test       → Test Files 1 failed | 85 passed (86) · Tests 2 failed | 841 passed (843)
                  (SearchSelect ×2, preexistentes)
```

Al cerrar:

```
pnpm typecheck  → limpio
pnpm lint       → ✖ 14 problems (14 errors, 0 warnings)   (los mismos 14)
pnpm test       → Test Files 1 failed | 87 passed (88) · Tests 2 failed | 883 passed (885)
                  (los mismos 2 de `SearchSelect`; +42 tests nuevos, 0 fallos nuevos)
pnpm build      → index 901,19 kB · app-icons 620,20 kB (perezoso) · IconPicker 4,64 kB
```

El chunk inicial pasa de **892,42 kB a 901,19 kB (+8,8 kB)**: la tira, los dos
atajos y el calendario. **No crece por iconos** — `app-icons` y `IconPicker`
siguen clavados (criterio 57).

**Arnés temporal** (`src/harness-feat003-t4/`, `.html` + `.tsx`, `MemoryRouter`,
datos sintéticos, **borrado**; `git status` ya no lo lista), servido por el Vite
del usuario en `http://localhost:5173`, a **375 px** y en los dos temas, con la
tira, un día futuro con plan, un día futuro vacío y un día pasado, y un nombre
de 60 caracteres («Revisar el correo y contestar lo que quedó pendiente de
ayer») en un bloque y en una ficha:

- **375 px:** `document.documentElement.scrollWidth` **375** = `clientWidth`
  **375**, con la tira, los tres días y el diálogo de vaciar abierto. Los siete
  días caben sin tener que desplazar nada.
- **La tira, leída del DOM:** `JUE 17 · HOY 18 · SÁB 19 · DOM 20 · LUN 21 · MAR
  22 · MIÉ 23`, con `data-state` = `plan, plan, plan, empty, empty, empty,
  empty` — los tres primeros son los que el arnés dio por planeados (criterio
  32) —, el sábado 19 con `aria-current="page"` y la línea «Se planea esta
  semana y la que viene: hasta el domingo 27.»
- **Día futuro con plan:** «SÁBADO 19 · planeado 1h 40 de 16h 30», leyenda
  «planeado 1h 40 / libre 14h 50», **sin** «te quedan», **sin** «Ahora» y
  **sin** «en N min» (criterio 33). Las tarjetas del día salen con borde
  `dashed` — medido con `getComputedStyle(...).borderStyle` — y el texto con su
  contraste de siempre.
- **Día pasado:** la agenda entera **no tiene ni un `<button>`**
  (`ol[data-tone] button` → **0**), no aparece «+ otra cosa» ni ninguna ficha, y
  se lee «Este día ya pasó: aquí queda como lo planeaste, para mirarlo. Los días
  de atrás no se cambian.» (criterios 38 y 56).
- **Vaciar y rehacer:** el diálogo dice «¿Vaciar el plan de este día?» y «Se van
  2 bloques y el día queda libre para rehacerlo. Tus actividades y tu plantilla
  siguen donde estaban.», con botones **«Volver»** y **«Vaciar el día»**. Ni
  «eliminar» ni «cancelar» en toda la pantalla.
- **Tema oscuro:** el número del día seleccionado da **19,3:1** sobre su fondo,
  la línea del borde de la ventana **9,5:1**, y el punto rayado sigue
  distinguiéndose del punto vacío (gradiente contra relleno plano al 12 %).
- **Lo que el arnés NO pudo enseñar:** «Copiar del \<día\> pasado» **con datos**.
  El botón lee el plan de la semana pasada con la consulta real, que está detrás
  del guard de sesión; **no se tocó el store de auth** para falsearla, porque
  escribe en el `localStorage` del 5173 y ahí vive la sesión del usuario. En el
  arnés se vio su estado de espera («Mirando qué tenías ese día…», apagado); el
  estado con datos, el apagado con motivo y el `mutate` exacto se comprueban en
  los tests de página.

**Criterios que cierra, uno por uno**

- **31 — la tira de 7 días, con hoy marcado y un toque que cambia de día.**
  `vida-window.utils.test.ts` («son siete días y empiezan dos antes del que se
  mira», «marca hoy, el seleccionado y los pasados por separado», «pinta las
  etiquetas del render») + `VidaHoyPage.test.tsx` («la tira trae siete días…»,
  con `aria-current` en el que se ve, y «un toque en otro día cambia lo que
  muestra la agenda», que navega de verdad dentro del `MemoryRouter`). Visto en
  el arnés.
- **32 — el punto: rayado con plan, vacío sin él.** `useVidaWeekPlans.test.tsx`
  («marca con plan solo los días que traen bloques, y cuenta cuántos») +
  `VidaHoyPage.test.tsx`, que lee los `data-state` y comprueba que el nombre
  accesible dice «con plan, 1 bloque» / «sin plan todavía». En el arnés,
  `plan, plan, plan, empty, empty, empty, empty`.
- **33 — un día futuro cuenta planeado frente a libre, sin «ahora».**
  `VidaHoyPage.test.tsx` («criterio 33 — …»): el presupuesto dice «planeado 30m
  de 16h 30», no hay «te quedan», no hay «Ahora», no hay «en N min» y el
  encabezado no trae la hora. El trazo suave, medido en el arnés.
- **34 — el día visto va en la URL.** `VidaHoyPage.test.tsx` monta
  `/app/vida/hoy?d=2026-09-19` y sale el sábado 19 con su plan. Recargar es ese
  mismo montaje; el «atrás» funciona porque la tira son `Link`, no `onClick`
  —**esto último no se probó con un `history.back()` real**: queda en el
  recorrido manual.
- **35 — la ventana es esta semana y la que viene, y el borde se explica.**
  `vida-window.utils.test.ts` (ventana, recorte por los dos lados, la tira
  deslizándose contra el borde) + `VidaHoyPage.test.tsx`, que entra con
  `?d=2026-11-30`, ve el domingo 27, lee la frase del borde y comprueba que
  **no hay ningún botón** de «anterior/siguiente».
- **36 — «Copiar del \<día\> pasado».** Tres tests de página: trae los bloques
  del mismo día de la semana anterior con sus horas («Trae 2 bloques, con sus
  horas.» y el `mutate` exacto con `orderIndex` renumerado), **apagado y con
  motivo** si aquel día no tuvo plan, y **no se ofrece** en un día que ya tiene
  plan (D7). La conversión, en `vida-window.utils.test.ts`.
- **37 — «Vaciar y rehacer» con confirmación nombrando cuántos bloques.** Test
  de página: aparece el diálogo con «Se van 3 bloques», la mutación **no** ha
  salido todavía, y al confirmar sale **una sola** llamada
  `{ date, items: [] }`. Segundo test para el vocabulario («Volver», nunca
  «Cancelar» ni «eliminar»). Solo está en hoy y futuros: en el día pasado el
  test comprueba que no existe.
- **38 — un día pasado es solo lectura.** Test de página: ni fichas ni «+ otra
  cosa» dentro de la agenda, ni «Más opciones» (el «···»), ni «Copiar», ni
  «Vaciar»; y la frase que lo dice sin reproche, con el DOM comprobado contra
  `desperdici|perdiste|fallaste|no cumpliste`. En el arnés, **cero botones** en
  la agenda de ese día.
- **53, 55, 56 (lo que esta tajada añade)** — 375 px sin scroll horizontal, tema
  oscuro medido y vocabulario sin reproche: arriba, en el arnés.
- **57 — línea base no empeorada:** arriba. El chunk crece 8,8 kB de código
  propio, no de iconos.

**Lo que queda pendiente de prueba manual** (los agentes no entran con
credenciales, y el API desplegada **sigue sin llevar `15463da`**):

1. Entrar en `/app/vida/hoy` y ver la tira con los puntos de los días que de
   verdad tienen plan.
2. Tocar el día de mañana: la agenda cambia, la URL queda en
   `/app/vida/hoy?d=<mañana>` y la píldora «Hoy» sigue encendida.
3. **Recargar** ahí: se ve el mismo día. Pulsar **«atrás»**: vuelve al día
   anterior de la tira (esto es lo único del criterio 34 que no se probó).
4. En un día futuro **sin plan**, «Copiar del \<día\> pasado»: comprobar que
   dice cuántos bloques trae, que al tocarlo aparecen con sus horas, y que el
   punto de ese día en la tira **se llena sin recargar**.
5. En un día futuro **con plan**, «Vaciar y rehacer» → «Vaciar el día»: el día
   queda libre y su punto se vacía.
6. Ir a un día pasado (por la tira): comprobar que no hay nada que tocar.
7. Escribir a mano `?d=2027-01-01`: tiene que verse el domingo del borde con su
   frase, no una pantalla rota.

**Riesgos**

- **Siete consultas al abrir.** Comparten caché con la agenda y llevan
  `staleTime` de 30 s, pero el coste real **no está medido** contra el API. La
  salida, si se nota, es pedir solo el día visto y llenar los puntos
  perezosamente: `useVidaWeekPlans` cambiaría por dentro sin tocar a quien
  llama.
- **Quien monte `VidaHoyPage` necesita router y los mocks nuevos** (ver el punto
  3 del resumen). Ya le pasó a `VidaHoyPage.test.tsx` en esta misma tajada.
- **`VidaDayActions` llama a `useActivityDayPlanQuery` de un día que puede estar
  fuera de la ventana** (la semana pasada). Es una lectura y el API la admite,
  pero es la única consulta del módulo que se sale del rango que la pantalla
  deja navegar.
- **El lateral de plantilla en días pasados** (ver arriba): hoy es inocuo,
  en la tajada 5 dejará de serlo.

**Estado del árbol:** sin commitear.

### Tajada 5 — La semana y armar desde la plantilla

**Resumen para el revisor:**
1. **Planear dejó de hacerse a mano.** Un día vacío que se pueda planear ofrece
   **«Armar desde la plantilla (N cosas)»**: copia la hora y la duración de cada
   ítem, corre detrás lo que se pisaría, encadena al final lo que no tiene hora
   y lo **dice** en un aviso dentro de la agenda, con la vía al catálogo. El
   lateral de escritorio gana **«Mañana, \<día\>»** con «Armar mañana desde la
   plantilla» (o «Ver mañana» si ya tiene plan), y existe **`/app/vida/semana`**:
   una línea por día, «Armar» en los vacíos editables y **«Armar toda la semana
   desde la plantilla»** con confirmación que dice cuántos días y cuántos no se
   tocan.
2. Lo nuevo: `utils/vida-build-day.utils.ts` (+ test, 17 casos),
   `hooks/useBuildDayFromTemplate.ts`, `hooks/useBuildWeekFromTemplate.ts`,
   `pages/VidaSemanaPage.tsx` (+ `.module.scss` + test, 13 casos). Tocados:
   `components/VidaTemplateAside/`, `pages/VidaHoyPage.tsx` (+ `.module.scss` y
   su test), `hooks/useVidaWeekPlans.ts`, `routes/vida-paths.ts`,
   `routes/vida.routes.tsx`, `graphql/vida-items.graphql.ts` y
   `types/activity-followup.types.ts`.
3. **Lo que más probablemente rompí:** (a) **`VidaTemplateAside` dejó de ser un
   componente tonto**: ahora monta tres consultas (`dayPlan.byDate(mañana)`,
   `items.list`, ajustes) y una mutación, así que **cualquier test que lo
   renderice —directa o indirectamente, como `VidaHoyPage.test.tsx`— necesita
   `useVidaItemsQuery` en el mock de `@/features/vida/hooks/useVidaItems`**; sin
   él revienta al montar. (b) **`VIDA_ITEM_ACTIVITY_FIELDS` pide ahora
   `status`**: si el API desplegado no lo aceptara, **las cuatro consultas y las
   tres mutaciones de `vida-items` fallarían a la vez** —el catálogo, la hoja,
   las sugerencias de los huecos y la plantilla—, no solo armar. El contrato lo
   valida contra el SDL vendorizado, pero eso es el SDL, no Render. (c) **Armar
   es `activityDayPlanSet`, que reemplaza el día entero**: el único muro contra
   borrar un día ya planeado son las tres condiciones que apagan el botón
   (`canPlan && !hasPlan && templateCount > 0`, y `canBuild` en la semana). Si
   alguna se calculara mal, el gesto pasaría de «armar» a «machacar».

**Lo que se construyó**

| Archivo | Qué |
|---|---|
| `src/features/vida/utils/vida-build-day.utils.ts` (+ `.test.ts`, 17 casos) (N) | La pieza central, **pura**: `buildDayFromTemplate(items, { dayStart, dayEnd })` → `{ items, placedCount, totalCount, movedCount, withoutTimeCount, droppedTitles, usedDefaultDuration }`. Además `usableTemplateItems` (quita el ítem desactivado y la actividad archivada), `templateItemsForDate` (los de ese día de la semana), `describeBuildDay` (las frases sueltas, para poder meter el enlace dentro de la de «sin hora») y `plannedMinutesOf`. |
| `src/features/vida/hooks/useBuildDayFromTemplate.ts` (N) | Un día: calcula, manda **una sola** `activityDayPlanSet` con `useSetActivityDayPlanMutation` —ninguna mutación nueva— y guarda el resumen en `lastBuild` **solo si la mutación fue bien**. Con la plantilla vacía **no llama al API**: `Set` vaciaría el día. |
| `src/features/vida/hooks/useBuildWeekFromTemplate.ts` (N) | La semana: orquesta sobre `api/` en serie, **un solo toast** y **una invalidación por día armado** al final. Resuelve con `{ done, failed, empty }`; no aborta al primer fallo. Mismo patrón que `useCreateStartingActivities` de FEAT-002. |
| `src/features/vida/pages/VidaSemanaPage.tsx` (+ `.module.scss`, + `.test.tsx` con 13 casos) (N) | Una línea por día con «Planeado · N bloques · Xh YY» y su barrita, «Ver» a `hoyForDate`, «Armar» en los vacíos editables, y abajo «Armar toda la semana» con `useConfirmDialog`. El resultado se pinta **día por día** en un `Alert`. |
| `src/features/vida/components/VidaTemplateAside/` (M) | Gana `VidaTomorrowBlock`: «Mañana, \<día\> N» con «Armar mañana desde la plantilla», «Ver mañana» si ya tiene plan, y el resumen de lo ajustado con el enlace al catálogo. |
| `src/features/vida/pages/VidaHoyPage.tsx` (+ `.module.scss`, + 4 casos en su test) (M) | «Armar desde la plantilla (N cosas)» en el día vacío editable, el `Alert` con lo ajustado, el enlace «Ver la semana» junto a la tira, y **el lateral escondido en días pasados**. |
| `src/features/vida/hooks/useVidaWeekPlans.ts` (M) | `VidaDayPlanDot` gana `items`: la semana resume con ellos sin pedir nada más. |
| `src/features/vida/graphql/vida-items.graphql.ts` · `types/activity-followup.types.ts` (M) | `status` en la selección de `activity` de los documentos de `vida-items`, y `status?: ActivityStatus` en `ActivityFollowUpActivityRef` (opcional: los otros documentos no lo piden). |
| `src/features/vida/routes/vida-paths.ts` · `routes/vida.routes.tsx` (M) | `semana` y `semanaForDate(date)` + la ruta. **No** entra en `app-nav.config.ts`. |

**Por qué así, y qué se descartó**

- **Los dos avisos de los revisores, atendidos.** (a) El lateral «Tu plantilla de
  \<día\>» **ya no se pinta en un día pasado**: desde que lleva «Armar mañana»
  dejó de ser lectura, y el criterio 38 dice que un día pasado no se toca. La
  página lo decide con el mismo `canPlan` del que cuelgan las fichas y el «···»,
  así que es una sola condición y no una cuarta regla suelta. (b) **Armar no
  pone actividades archivadas.** Copiar (tajada 4) no puede saberlo porque
  `ActivityDayPlanItem` no trae `status`; armar sí, porque el `VidaItem` trae su
  actividad — **pero el documento no pedía `status`**, así que hubo que añadirlo
  a `VIDA_ITEM_ACTIVITY_FIELDS`. `usableTemplateItems` deja fuera la actividad
  `cancelled` **y** el `VidaItem` con `isActive: false`. `status` `undefined` se
  trata como «no se sabe» y **no descarta nada**: los documentos que no lo piden
  no cambian de comportamiento.
- **La semana lee la plantilla con `vidaItems`, no con siete
  `vidaSuggestionsForDate`.** El arquitecto dejó las sugerencias como fuente para
  las fichas de los huecos, y ahí siguen; pero la semana necesita los siete días
  a la vez, y `vidaItems` ya trae `days` y la actividad. Son **una** consulta en
  vez de siete, con una clave que ya existía (`vidaKeys.items.list`). Los dos
  caminos acaban en los mismos `VidaItem`, y por eso `buildDayFromTemplate` recibe
  `VidaItem[]` y no `VidaSuggestion[]`: quien tiene sugerencias mapea `.item`.
- **Armar un día usa el hook de mutación; armar la semana no.** Un día es un
  gesto y un toast («Plan del día guardado»); siete días por el mismo hook serían
  **siete toasts** encima del mismo gesto. Por eso la semana orquesta sobre
  `api/` con un solo aviso e invalidando al final, que es exactamente lo que hace
  `useCreateStartingActivities` —el único precedente de lote en Vida, y el que el
  plan manda imitar—. **Es una desviación del plan**, que decía «llama a
  `useSetActivityDayPlanMutation`» también para la semana.
- **El aviso de lo ajustado no cabe en un toast**, porque el criterio 44 pide un
  **enlace al catálogo**. Por eso `useBuildDayFromTemplate` guarda el resumen y
  la pantalla lo pinta en un `Alert` dentro de la agenda —y el lateral, en su
  bloque—. El resumen solo se guarda **en el `onSuccess` de la mutación**: si
  falla, no hay nada que anunciar y el toast de error del hook lo cuenta.
- **Lo que no cabe antes del fin del día no se pone, pero se nombra.** Un bloque
  que se saliera del horario rompería la barra del presupuesto (que va de
  `dayStart` a `dayEnd`) y la leyenda dejaría de cuadrar. Se descarta y se dice
  por su nombre: «Maratón no cabía antes de que termine tu día». El plan no
  decidía esto; lo dejaba como «si algo no cabe, se dice».
- **Un ítem cuya hora cae antes del inicio del día cuenta como movido**: se
  coloca en `dayStart` y entra en el «N de M no cabían a su hora». Su hora no se
  respetó, y callarlo sería justo lo que el criterio 43 prohíbe.
- **La ventana de la semana no tiene flechas mudas**: dos enlaces («Ver la semana
  que viene» / «Volver a esta semana») y una línea que dice hasta dónde se
  planea, igual que hizo la tira en la tajada 4. Una fecha fuera de la ventana se
  **recorta**, no se rechaza.
- **`/app/vida/semana` no entra en `app-nav.config.ts`**, como mandaba el plan:
  se llega desde el enlace «Ver la semana» junto a la tira de Hoy, y así la
  píldora encendida del módulo sigue siendo «Hoy» y la barra no gana un destino
  que F4 quiere para «Plantilla».
- **Sin `useMemo` para las siete fechas de la semana**: el compilador de React lo
  marca como memoización que no puede preservar (error de lint). `useQueries` se
  apoya en las claves, que son estables.
- **Nada de lo prohibido:** ninguna mutación nueva, ninguna clave de caché nueva,
  ninguna invalidación nueva, ningún componente de `shared/ui`, ningún icono a
  pelo, y **ningún documento GraphQL nuevo** (solo un campo más en una selección
  que ya existía, cubierto por `contracts.test.ts`).

**Verificación**

*Comprobaciones, corridas enteras al empezar y al terminar:*

```
pnpm typecheck  → limpio
pnpm lint       → 14 errores / 0 warnings (los mismos de la línea base;
                  ninguno en Vida)
pnpm test       → 2 fallos de 918 — los dos de `SearchSelect`, preexistentes
                  (línea base: 2 de 885; +33 tests nuevos)
pnpm build      → chunk inicial 914,52 kB (línea base 901,2 → +13,3 kB),
                  `app-icons` 620,20 kB perezoso, `IconPicker` 4,64 kB
                  (ninguno crece: nada de iconos entró al arranque)
```

*Tests nuevos:* `vida-build-day.utils.test.ts` (17 casos: copia exacta, orden,
dos que se pisan, cadena de desplazamientos, hora antes del inicio del día, los
sin hora al final con y sin duración, lo que no cabe, los plurales de las frases
y que ninguna reprocha), `VidaSemanaPage.test.tsx` (13 casos: las dos formas de
línea, el día pasado descrito por lo planeado y sin «Armar», armar un día,
la confirmación de la semana, «Volver» y no «Cancelar», **un día que falla al
segundo** y el resumen «Armamos 1 de 2 días», el aviso de lo ajustado con su
enlace, las dos semanas de la ventana y el recorte) y 4 casos nuevos en
`VidaHoyPage.test.tsx`.

*Test ajeno derogado, y queda dicho:* `VidaHoyPage.test.tsx` tenía
«"Armar desde la plantilla" NO se pinta todavía: llegaría muerto (tajada 5)»,
escrito por la tajada 2 **precisamente para esta tajada**. Se sustituye por su
contrario. Ninguna otra aserción se tocó; sí se añadió `useVidaItemsQuery` al
mock de `useVidaItems` (lo necesita el lateral) y `itemsQuery = ready([])` al
`beforeEach`.

*Arnés temporal* (`src/arnes-t5/` + `arnes-t5.html`, **borrados antes de
reportar**), con `MemoryRouter`, datos sintéticos y la caché de React Query
sembrada por clave — sin tocar el store de auth ni `localStorage`: el contexto de
`AuthBootstrap` se proveyó a mano y las consultas quedan deshabilitadas leyendo
de la caché sembrada.

- **La semana, esta y la que viene:** las siete líneas, «Planeado · 1 bloque ·
  1h» con su barrita, «Sin plan todavía» + «Tu plantilla trae 3 cosas los
  lunes», «Armar» solo en los vacíos **editables** (en la semana en curso, con
  hoy en domingo, **cero** «Armar» y el pie dice «No hay ningún día de esta
  semana que se pueda armar»; en la siguiente, **5** «Armar» y «5 días están
  libres… Los 2 que ya tienen plan no se tocan»).
- **La confirmación** (criterio 45), leída del DOM: «Se armarán 5 días, copiando
  la hora y la duración de cada cosa de tu plantilla. 2 ya tienen plan y no se
  tocan.» con «Volver» y «Armar 5 días».
- **Hoy en un día vacío editable:** «Armar desde la plantilla (3 cosas)» con su
  línea de apoyo, y el lateral con «Mañana, Lunes 21 · Tu plantilla trae 3 cosas
  los lunes · Armar mañana desde la plantilla».
- **Móvil 375 px y tema oscuro** sobre la semana: `scrollWidth` 375 =
  `clientWidth` 375 (**sin scroll horizontal**, criterio 53), las líneas se
  apilan, los nombres largos no empujan la fila, y el contraste aguanta
  (captura mirada).

**Criterios que cierra, uno por uno**

- **21 (su mitad de botón, la que la tajada 2 dejó partida)** — cerrado. «Armar
  desde la plantilla (3 cosas)» aparece en el día sin plan que se puede planear,
  dice cuántas cosas trae la plantilla y **funciona**. Test + arnés.
- **39** — cerrado. Línea por día con día de la semana y número; con plan,
  «Planeado · N bloques · Xh YY» + barrita + «Ver»; sin plan, «Sin plan todavía»
  + «Tu plantilla trae N cosas los \<día\>» + «Armar». Tres tests y arnés.
- **40** — cerrado. Los días pasados se describen por lo **planeado**; el DOM no
  contiene «seguiste» y no hay barritas de seguido/de más/fuera del plan. Test.
- **41** — cerrado. `buildDayFromTemplate` copia `startTime` y
  `durationMinutes`; no encadena, no reparte por franjas, no propone otra hora.
  Test puro + el test de la página que comprueba el payload literal de la
  mutación.
- **42** — cerrado. `setMutation.mutate` / `setActivityDayPlan` llamados **una
  vez** por día, con la fecha y los ítems; la invalidación por fecha repinta la
  línea y el punto de la tira sin recargar (misma clave, probado en la tajada 4).
- **43** — cerrado. El segundo se coloca justo detrás conservando su duración y
  se cuenta: «1 de 3 no cabían a su hora y quedaron después». Cuatro tests puros
  (incluida la cadena de tres) + el aviso leído en la pantalla.
- **44** — cerrado. Los sin hora van al final encadenados, con su duración o con
  `DEFAULT_BLOCK_MINUTES`, y se lee «1 cosa sin hora, puesta al final — ponles
  una hora en tu plantilla» con enlace a `/app/vida/actividades`. Tests puros +
  el `Alert` comprobado en `VidaHoyPage.test.tsx` y en `VidaSemanaPage.test.tsx`.
- **45** — cerrado. Solo los días sin plan y editables; la confirmación dice
  cuántos se arman y cuántos no se tocan; test del payload y arnés del diálogo.
- **46** — cerrado. Con el segundo día fallando: el `Alert` dice **«Armamos 1 de
  2 días»** —nunca «semana armada»—, nombra el día que falló con su razón y dice
  «Sigue sin plan»; el primero queda armado. Test.
- **48 (su mitad «Mañana»)** — cerrado. «Mañana, \<día\> N» con «Armar mañana
  desde la plantilla», «Ver mañana» cuando ya tiene plan, y sin «Cómo va el día»
  (D8). Arnés; **no hay test de componente propio del lateral** (ver riesgos).
- **38 (el aviso del revisor)** — cerrado en lo que faltaba: el lateral **no se
  pinta** en un día pasado. Cubierto por el test de la tajada 4 que comprueba que
  un día pasado no tiene nada que tocar, y visto en el arnés.
- **53, 54, 55, 56** en lo que toca a la semana y a lo nuevo — cerrados: 375 px
  sin scroll horizontal (medido), texto largo con `overflow-wrap: anywhere` y
  `min-width: 0`, oscuro legible (captura), y el test de lenguaje sobre el DOM
  entero de la semana más el de las frases del resumen.
- **57** — cerrado: ver los cuatro números de arriba.

**Pendiente de prueba manual — no marcado como cumplido**

- **47 (criterio de fase).** Lo cronometra el usuario: **armar mañana en menos de
  un minuto** y **la semana en menos de cinco**. Pasos: (1) `/app/vida/hoy` en
  escritorio → lateral → «Armar mañana desde la plantilla» → leer el aviso →
  «Ver mañana». (2) `/app/vida/hoy` → «Ver la semana» → «Ver la semana que
  viene» → «Armar toda la semana desde la plantilla» → confirmar → leer el
  resumen día por día.
- **58 (el recorrido entero con su cuenta).** Todo `/app/*` está detrás del login
  y **los agentes no entran con credenciales**: lo de aquí se cierra con tests y
  arnés. Falta, con la API de Render ya desplegada: armar un día con solapes de
  verdad y comprobar que el plan queda como dice el aviso; armar la semana con
  algún día ya planeado y verificar que **no se pisa**; y —lo más importante—
  que **`status` en la selección de `vida-items` no rompe nada**: abrir el
  catálogo, la hoja de actividad y las sugerencias de un hueco.

**Riesgos**

- **`status` en `VIDA_ITEM_ACTIVITY_FIELDS` afecta a todo `vida-items`**, no
  solo a armar. El SDL vendorizado lo admite (`Activity.status: ActivityStatus!`)
  y `contracts.test.ts` está verde, pero eso valida contra la copia, no contra
  Render. Es el riesgo número uno de esta tajada.
- **`VidaTemplateAside` ya no es tonto**: monta consultas y una mutación. Quien
  lo renderice en un test necesita los mocks; y en escritorio son **tres
  consultas más** por pintado de Hoy (el plan de mañana comparte clave con su
  agenda y con su punto de la tira, así que en la práctica es una).
- **Armar machaca si se ofrece donde no debe.** `canPlan && !hasPlan &&
  templateCount > 0` en Hoy y `canBuild` en la semana son lo único que separa
  «armar» de «borrar un día planeado». Merecen una mirada del revisor.
- **`templateCount` en Hoy cuenta sugerencias activas, pero no descarta las
  archivadas**; el botón puede decir «(3 cosas)» y armar 2 si una actividad está
  archivada. No es una mentira peligrosa —el aviso posterior dice cuántos
  bloques quedaron— pero el número del botón y el resultado pueden no coincidir.
  Se anota, no se arregla: tocarlo es cambiar también el texto de «sin plan» que
  la tajada 2 dejó probado.
- **El resumen de armar no sobrevive a un cambio de día ni a una recarga**: vive
  en estado de React. Es deliberado (es un aviso de lo que acaba de pasar), pero
  quien arme y recargue no vuelve a verlo.

**Lo que descubrí y no toqué**

- **«los sábado», «los domingo».** `VIDA_DAY_LABELS` da el día en singular y
  media docena de sitios lo escriben tras «los». Viene de las tajadas 2 y 4 y lo
  repiten la semana y el bloque «Mañana»: preferí ser consistente antes que
  arreglarlo en tres sitios y dejarlo mal en otros cuatro. Es un plural, no un
  bug, y sale barato en una pasada propia.
- **El bloque «Mañana» se pinta también cuando el día mirado ya es mañana**: dice
  «Mañana, Lunes 21» estando en el lunes 21. No es falso —mañana sigue siendo el
  21— pero se lee raro. No lo arreglé porque esconderlo es una regla más de las
  que la página ya tiene demasiadas.
- **El criterio 48 pide, en su primera mitad, «el botón de ponerla en el primer
  hueco donde cabe»** en el lateral. No está: la tajada 2 no lo construyó y la
  revisión lo aceptó así. No entra en el alcance de esta tajada; queda dicho para
  que no se dé por cerrado sin mirarlo.

**Estado del árbol:** sin commitear.

### Tajada 5 — respuesta a la devolución (2ª entrega)

**Resumen para el revisor:**
1. **Los dos motivos, cerrados.** El lateral trae ahora, en cada cosa que no
   está en el plan, **«Ponerla HH:MM»** —el primer hueco del día donde cabe, con
   `activityDayPlanItemAdd`— y, si no cabe en ninguno, el botón queda **apagado
   diciendo por qué**. Y la semana **ya no puede machacar un plan**:
   `useVidaWeekPlans` expone `isError` por día, un día en error se pinta «No
   pudimos cargar este día» con «Reintentar», **no ofrece «Armar»** y **queda
   fuera del lote**; el punto de la tira de Hoy tampoco afirma «sin plan» sin
   saberlo.
2. Los ocho hallazgos baratos, cerrados también: contadores una sola vez por
   ítem, `durationMinutes: 0` tratado como sin duración, la bandera de duración
   por defecto **pintada** («1 cosa sin duración, puesta a 30 min»), «(N cosas)»
   sin archivadas, los días `empty` nombrados en el resumen, el `<p>` vacío
   fuera, «los sábados» y el bloque «Mañana» escondido cuando el día visto ya es
   mañana.
3. **Lo que más probablemente rompí esta vez:** (a) **`VidaTemplateAside` gana
   dos props obligatorias, `date` y `agenda`**, y una mutación: quien lo monte
   fuera de `VidaHoyPage` no compila, y el botón coloca **sobre el día visto**,
   así que si `agenda` no fuera la del mismo `date` pondría el bloque en el día
   equivocado. (b) **`hasPlan` de `useVidaWeekPlans` ahora es `false` también
   cuando la consulta falla**: la tira pinta el punto como «error», no como
   «vacío» — si alguien leyera `hasPlan` sin mirar `isError`, seguiría viendo un
   día en error como día libre. (c) **`pluralDayLabel` toca cuatro pantallas**
   (agenda, lateral, Hoy, semana): es un `+ 's'` sobre `VIDA_DAY_LABELS`, pero
   cualquier test que buscara «los sábado» deja de encontrarlo.

**Lo que se cambió**

| Archivo | Qué |
|---|---|
| `components/VidaTemplateAside/VidaTemplateAside.tsx` (+ `.module.scss`) | **`PlaceInFirstGapButton`** por cada ítem que no está en el plan: busca en `agenda.gaps` el primero vivo donde cabe, coloca con `useAddDayPlanItemMutation` (`isPending` apaga los botones contra el doble clic, y el toast y la invalidación por fecha los pone el hook). Sin hueco, botón apagado + «No queda un rato de 20m en este día». El `aria-label` dice **«en el primer hueco donde cabe»**, para que no se confunda con la ficha del criterio 23. Y el bloque «Mañana» no se pinta si el día visto ya es mañana. |
| `utils/vida-agenda.utils.ts` | `findFirstFittingGap(gaps, minutes)`: el primero que no ha pasado, no es `sliver` y admite esos minutos. Reusa `fitsInGap`. El hueco que contiene al reloj ya viene partido por `buildDayAgenda`, así que uno empezado ofrece **desde ahora**, como en la tajada 3. |
| `hooks/useVidaWeekPlans.ts` | `VidaDayPlanDot` gana **`isError`**; `hasPlan` pasa a ser `false` cuando la consulta falló (nunca «tiene plan» sobre datos que no llegaron); `VidaWeekPlans` gana `hasError` y `refetch()`, que vuelve a pedir **solo las que fallaron**. |
| `pages/VidaSemanaPage.tsx` (+ `.module.scss`) | Fila en error con su texto y «Reintentar»; `canBuild` exige `!isError && !isPending`; el botón de la semana se apaga también con `weekPlans.isPending`; el pie dice cuántos días quedaron fuera; el resumen nombra los días **`empty`**. |
| `components/VidaDayStrip/` (`.tsx` + `.module.scss`) | Cuarto estado del punto: `error`, con su `aria-label` («no pudimos cargar su plan»). Cierra el hallazgo 1 de la revisión de la tajada 4. |
| `utils/vida-build-day.utils.ts` | Contadores **después** de comprobar el encaje (cada ítem en una sola categoría); `durationOf()` trata `0` y negativos como sin duración; `usedDefaultDuration` → **`defaultDurationCount`**, con su frase en `describeBuildDay`. |
| `pages/VidaHoyPage.tsx` | `templateCount` sale de `usableTemplateItems` (sin archivadas) y es lo que se arma; el `Alert` ya no pinta un `<p>` vacío; el lateral recibe `date` y `agenda`. |
| `utils/vida-date.utils.ts` | `pluralDayLabel(label)`: «sábado» → «sábados», «lunes» → «lunes». Usado en la agenda, el lateral, Hoy y la semana. |

**Por qué así**

- **El botón del criterio 48 busca el hueco en la agenda ya construida**, no en
  una lista de huecos propia: es el mismo reparto que se está pintando, así que
  lo que el botón promete («Ponerla 13:53») es literalmente lo que se va a ver.
  Y por eso el lateral necesita `agenda`: pedirle que la calculara otra vez sería
  tener dos verdades sobre el mismo día.
- **Se le puso hora al botón** («Ponerla 13:53») en vez de un «Ponerla» a secas:
  el criterio pide colocar «en el primer hueco donde cabe», y decir cuál es antes
  de tocar evita la sorpresa de encontrárselo en otro sitio.
- **Sin hueco, el botón se apaga; no desaparece.** Que algo no quepa hoy es
  información —y es la señal de que el día está lleno—, no un error que haya que
  esconder.
- **Un día en error no es un día vacío, y ahora el tipo lo dice.** El arreglo va
  en `useVidaWeekPlans` y no en la página, porque el mismo hook alimenta la tira
  de Hoy: las dos superficies se curan con el mismo campo, y quien lo lea a
  partir de ahora tiene que decidir qué hace con él.
- **Los contadores se suben al final del bucle, no al principio.** Era el
  defecto que hacía que un ítem apareciera a la vez en «no cabían a su hora» y en
  «se quedó fuera del plan». Ahora cada ítem acaba en **una** categoría: movido,
  sin hora, con duración por defecto, o descartado.
- **`defaultDurationCount` se pinta en las tres superficies** (Hoy, el lateral y
  la semana) o se habría quitado: una bandera calculada que nadie enseña es
  trabajo muerto.

**Verificación**

```
pnpm typecheck  → limpio
pnpm lint       → 14 errores / 0 warnings (línea base, ninguno en Vida)
pnpm test       → 2 fallos de 931 — los dos de `SearchSelect`, preexistentes
                  (1ª entrega: 2 de 918; +13 tests)
pnpm build      → chunk inicial 916,95 kB (línea base 901,2 → +15,7 kB;
                  1ª entrega 914,52 → +2,4 kB), `app-icons` 620,20 kB e
                  `IconPicker` 4,64 kB **idénticos**: nada de iconos al arranque
```

*Tests nuevos (13):*

- **Criterio 48, cinco casos en `VidaHoyPage.test.tsx`:** coloca con el payload
  literal (`09:24 → 09:44` con el hueco empezado, que es «desde ahora» y no
  desde las 9:00); sin duración en la plantilla usa 30 min; lo que ya está en el
  plan enseña «en el plan» y **no** el botón; con el día entero ocupado el botón
  está **`disabled`** y se lee «No queda un rato de 20m en este día», sin
  mutación; y en un día pasado no hay lateral, así que no hay dónde poner.
- **El día en error, tres casos en `VidaSemanaPage.test.tsx`:** no dice «Sin plan
  todavía», no ofrece «Armar» y «Reintentar» llama al `refetch`; **queda fuera
  del lote** —un día con plan real cuya consulta falla **no** entra en las
  llamadas a `activityDayPlanSet`, que es el motivo 2 de la devolución—; y con
  días en vuelo la pantalla es esqueleto y no hay ningún «Armar».
- **Los contadores y el cero, cuatro casos puros:** lo que se movería y luego no
  cabe se cuenta **solo** como descartado (`movedCount` 0, `describeBuildDay`
  sin la frase); lo sin hora que no cabe no se cuenta como «puesta al final»;
  `durationMinutes: 0` da `08:00–08:30` y suma a `defaultDurationCount`; una
  duración negativa, igual.
- **Un día del lote sin nada que poner** sale nombrado en el resumen.

*Arnés temporal* (`src/arnes-t5b/` + `arnes-t5b.html`, **borrado antes de
reportar**; misma técnica que la 1ª entrega: caché sembrada por clave y contexto
de `AuthBootstrap` a mano, sin tocar el store de auth ni `localStorage`):

- **El lateral con el botón**, leído del DOM: tres filas con «Ponerla 13:53»
  —las tres al primer hueco vivo, que empieza en «ahora»— y «Armar mañana desde
  la plantilla» debajo.
- **375 px y tema oscuro, medidos esta vez en el lateral y en la semana:**
  `scrollWidth` 375 = `clientWidth` 375 en las dos (**sin scroll horizontal**);
  el lateral cae debajo de la agenda con 343 px de ancho, los nombres largos
  truncan sin empujar el botón, y «Ponerla 13:53» se lee en oscuro (captura).
  Esto responde al «no lo medí yo» del criterio 53 de la revisión.
- **La semana en la semana que viene:** «Tu plantilla trae 3 cosas los
  **domingos**» — el plural, arreglado y visto.

**Lo que sigue pendiente de prueba manual** — sin cambios respecto a la 1ª
entrega: el **criterio 47** (cronómetro: mañana en menos de un minuto, la semana
en menos de cinco) y el **58** (el recorrido entero con su cuenta), los dos
detrás del login. Al recorrido conviene añadirle ahora **el botón «Ponerla» del
lateral** —colocar tres cosas seguidas y ver que cada una cae en el primer hueco
que queda— y, si se puede provocar, **un día de la semana que no cargue**, para
ver que se lee «No pudimos cargar este día» y que no se ofrece armarlo.

**Riesgos que quedan**

- **`VidaTemplateAside` coloca sobre `date` usando `agenda`**: las dos vienen de
  la misma página y del mismo día, pero son dos props sueltas y nada las ata.
- **El botón «Ponerla» no reacciona al minuto que pasa** más que cuando la
  página se repinta (una vez por minuto, por `useVidaNowMinute`): entre tic y
  tic puede ofrecer una hora un pelo vieja. El API acepta la hora que se le
  manda, así que el bloque quedaría un minuto atrás, no mal.
- **`hasError` se calcula por día pero la semana solo ofrece un `refetch`
  global** (de las que fallaron). Es suficiente y no inventa nada, pero el botón
  de una fila reintenta también las otras que fallaron.

**Estado del árbol:** sin commitear.

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

### Tajada 3 — Poner algo en un hueco

**Veredicto: `accepted`.** Los ocho criterios de la tajada (23–30) se cumplen, y
las partes de 52–57 que le tocan también. Lo comprobé contra la sección 1
literal, no contra el resumen: corrí la línea base entera yo mismo, escribí un
arnés de encaje propio con los bordes que no estaban en los 38 casos del
constructor, y monté la hoja en el navegador del usuario a 375 px y en oscuro.
Cambiar hora y duración **no es alcance añadido**: el criterio 30 lo pide con
`activityDayPlanItemEdit` y la fila de la tajada en las dos tablas cierra 23–30.

**Criterios, uno por uno**

- **23 — cumplido.** El test de página fija `{ date, activityId, startTime:
  '10:30', endTime: '10:50' }` con una sola llamada, y el hueco que ya empezó
  coloca a las `09:24`. La actualización es por invalidación
  (`vidaKeys.dayPlan.byDate`, ya probada en `useActivityDayPlan.test.tsx`), y
  agenda, huecos y presupuesto salen todos del mismo `useVidaDayData`: no hay
  estado duplicado que pueda quedarse viejo.
- **24 — cumplido.** Visto en el navegador, no solo en test: «Poner algo a las
  10:30» con «Hueco de 2h 30 · hasta las 13:00 «Cocinar y almorzar»». La
  variante «hasta el final del día» está en `describeWindow` y en su test.
- **25 — cumplido.** Los tres `heading` («Qué», «Cuánto», «Cuándo») y «Poner»
  deshabilitado hasta tener las tres: lo medí en vivo —con actividad elegida,
  11:00 y 45 min el botón se habilita; sin actividad, con hora y duración
  válidas, sigue apagado—. El buscador es `Input` + `filterActivitiesBySearch`.
- **26 — cumplido, y las píldoras están deshabilitadas de verdad, no atenuadas.**
  En el DOM, con la hora en 12:50 dentro del hueco de 10:30–13:00: `15:OFF
  30:OFF 45:OFF 1h:OFF`, atributo `disabled` en el `<button>`
  (`VidaDurationPills.tsx:62`), «Aquí caben 10 min» y el aviso «Desde las 12:50
  caben 10 min. Elige menos tiempo o empieza antes». El campo «libre» lleva
  `max` y `Number.parseInt`, así que 0, negativo y no entero no llegan al API:
  se vuelven `null`.
- **27 — cumplido.** «Cuándo» ofreció `10:30 · al principio del hueco`, `11:00`,
  `11:30`, `12:00` y «otra hora», con `min=10:30` y `max=12:59` en el
  `input type="time"`. En mi arnés de encaje, todas las horas ofrecidas de un
  hueco ya empezado (9:24–10:00) validan, y la primera trae «ahora mismo».
- **28 — cumplido.** En vivo: «Poner lavadora · 11:00 · 45m» y «Queda libre 1h
  15 antes de Cocinar y almorzar, y 30m antes de empezar».
- **29 — cumplido en lo comprobable sin API.** El cierre cuelga del `onSuccess`
  **local** del `mutate` (`VidaPlaceInGapSheet.tsx:171-174`), el `Alert` vive
  dentro de la hoja y no hay actualización optimista en ninguno de los cuatro
  hooks, así que un bloque fantasma no tiene por dónde aparecer. **Con el API
  real lo cierra el usuario** (criterio 58).
- **30 — cumplido.** «···» → «Quitar del plan» (confirmación que nombra la
  actividad, salida «Volver», la mutación no sale hasta confirmar) y «Cambiar
  hora o duración» → la misma hoja sin «Qué», con `getBlockEditWindow` y
  guardando con `ItemEdit`. **Sobre el «¿valida contra los otros bloques o solo
  contra el hueco?»:** valida contra la ventana, y la ventana **se deriva de la
  agenda ya pintada** —el bloque más el hueco pegado a cada lado, cortada por el
  bloque vecino (`vida-gap-form.utils.ts:74-107`)—, así que es lo mismo que
  validar contra los vecinos. Con dos bloques pisados llegados del API la
  ventana se encoge al propio bloque: no arregla el solape, pero tampoco lo
  propaga.
- **52 (mutaciones) — cumplido.** Los cuatro hooks avisan por toast con
  `toErrorMessage`. La desviación está bien traída: colocar desde una ficha no
  abre ninguna hoja donde leer un fallo.
- **53 — cumplido, medido por mí.** Arnés propio bajo `src/revision-t3/`
  (borrado) servido por el Vite del usuario, viewport 375×812: `scrollWidth`
  375 = `clientWidth` 375 con la hoja abierta, **cero elementos** con borde
  derecho más allá de 376 px, y «Poner» en `bottom` 768/787 de 812, visible sin
  desplazar dentro de la hoja. Con un nombre de 60 caracteres en un bloque, en
  una ficha del hueco y en una opción de la hoja a la vez.
- **54 — cumplido** en esa misma medida.
- **55 — cumplido.** Con `data-theme="dark"` y la hoja abierta: «Cuánto» /
  «Cuándo» / «Aquí caben» 7,88:1 y la línea de previsualización 13,72:1,
  coincidiendo con la tabla del constructor. Sin scroll horizontal en oscuro.
- **56 — cumplido.** Ni «cancelar» ni «eliminar» en pantalla; «Quitar del plan»
  y «Volver»; los tres mensajes de `validatePlacement` dicen qué **sí** cabe.
- **57 — cumplido, corrido entero por mí:** `pnpm typecheck` limpio (dos veces),
  `pnpm lint` **14 errores / 0 warnings** (los mismos), `pnpm test` **2 fallos
  de 843** (`SearchSelect` ×2, preexistentes), `pnpm build` **index 892,42 kB**
  con `app-icons` 620,20 kB perezoso e `IconPicker` 4,64 kB: **el crecimiento no
  es por iconos**. Ningún documento GraphQL nuevo.
- **58 — sigue abierto y no se puede cerrar desde aquí.** Login y además
  `15463da` en Cloud Run. Los pasos están en la sección 3.

**El encaje, con los bordes que faltaban** (arnés propio de 8 casos bajo
`src/features/vida/utils/`, ya borrado):

| Caso | Resultado |
|---|---|
| hora = inicio del hueco, duración = hueco entero (10:30 + 150 en 10:30–13:00) | cabe |
| hora = fin − duración (12:30 + 30) | cabe |
| un minuto más (12:30 + 31) | no cabe, «Desde las 12:30 caben 30 min…» |
| 10:29 y 13:00 | fuera; 12:59 + 1 sí |
| duración 0, negativa y `null` | no cabe, sin reproche |
| hueco empezado 9:24–10:00 con reloj en 9:24 | `9:24 · ahora mismo`, `9:30`, `9:45`; las tres validan; máximo 36 min |
| `toDayPlanTimes('22:30', 30)` | `22:30 → 23:00` |
| cruce de medianoche forzado (`23:30` + 60) | se recorta a `23:59`; y por validación no se llega ahí, porque la ventana acaba en el fin del día |

**Qué rompí buscando, y qué encontré**

- **`graphify explain "useActivityDayPlan"` y `graphify query` sobre las tres
  mutaciones:** 72 nodos, y fuera de `VidaHoyPage`, `VidaAgendaBlock`,
  `VidaPlaceInGapSheet` y su propio test **no hay nadie**. Confirmado a mano con
  `grep -rn "VidaAgendaBlock\|VidaAgendaGap" src/`: solo `VidaHoyPage` los monta.
  El grafo ya incluye la hoja nueva (el constructor corrió `graphify update .`),
  así que para «¿quién dependía de esto antes?» lo contrasté además con
  `git diff HEAD`.
- **Lo que el constructor marcó como más probable:** los tres. (a) `li.chip`
  dejó de existir: ningún test ajeno lo consulta. (b) `VidaAgendaBlock` ya no es
  puro: el único montaje fuera de su propio test es `VidaHoyPage.test.tsx`, que
  ya mockea las cuatro funciones; mi arnés lo confirmó al reventar hasta que
  puse `QueryClient` + `ConfirmDialogProvider` (y `AuthBootstrapProvider`, que
  arrastra `useActivitiesQuery`). (c) Nadie cuenta toasts en los tests del
  módulo.
- **Tajadas 1 y 2:** la corrida entera de `pnpm test` pasa sus 841; la agenda de
  solo lectura, la marca de «Ahora» y el presupuesto siguen saliendo de
  `buildDayAgenda`/`getDayBudget`, que no se tocaron (`git diff HEAD` no los
  lista). FEAT-002 tampoco: fuera de `src/features/vida/` no hay ni un archivo
  cambiado.
- **Regresión encontrada: ninguna.**

**Estados**

Comprobados: hueco sin fichas (sigue ofreciendo «+ otra cosa»), plantilla vacía
(el aviso con el enlace al catálogo **más** «+ otra cosa»), buscador sin
resultados («Nada con ese nombre. Puedes crearla en Actividades.»), error de
mutación (`Alert` dentro + toast, sin cerrar), móvil 375 px y oscuro con la hoja
abierta. Sin sesión lo sostiene la tajada 2 —la pantalla no llega a pintar la
agenda— y no cambió.

Lo que queda como hallazgo, sin devolver nada:

1. **Si `useActivitiesQuery` falla**, el buscador de «qué» dice «Nada con ese
   nombre» en vez de decir que la búsqueda no se pudo cargar. Es la esquina del
   criterio 52 que nadie pidió para la hoja.
2. **Elegir una segunda actividad no trae su duración de plantilla** si ya había
   una puesta (`chooseActivity` solo preselecciona con `durationMinutes ===
   null`). Defendible —no pisa una elección a mano— pero el criterio 25 se lee
   como que la duración acompaña a lo elegido.
3. **Una píldora puede quedar «elegida y apagada» a la vez** (`aria-pressed` y
   `disabled`) al mover la hora a un sitio donde ya no cabe. El aviso lo explica
   y «Poner» está apagado, así que nadie guarda nada imposible.
4. **`durationPillsForWindow` no la usa ningún componente**: hoy solo vive en
   sus tests. El constructor lo declaró y la reserva para la tajada 5.
5. **Dos toques muy rápidos en dos fichas distintas** pueden colar dos bloques
   que se pisen hasta el siguiente refresco; `isPlacing` los apaga, pero entre
   el `click` y el `isPending` hay un render. Ya está en los riesgos de la
   sección 3.
6. **`pnpm typecheck` no es equivalente a `pnpm build`.** Los dos son `tsc -b`
   sobre las mismas referencias y el único cambio es `--noEmit`; en mi corrida
   los dos salieron limpios, así que el `TS2783` que se coló era estado
   incremental (`.tsbuildinfo`), no cobertura distinta. **Va para
   `ENVIRONMENT.md`, que no toco:** el cierre de una tajada se hace con `pnpm
   build`, no solo con `pnpm typecheck`.

**¿Duplica algo que ya existía?** No. Contra «Lo que NO se crea» de la sección 2:
ninguna mutación, `api` ni documento GraphQL nuevo; ninguna clave de caché ni
invalidación nueva; ningún componente de `shared/ui` (reutiliza `SteppedModal`,
`Input`, `Alert`, `Skeleton`, `Button`, `Popover`, `IconButton`,
`ConfirmDialog`, `AppIcon`); ningún normalizador ni buscador nuevo
(`filterActivitiesBySearch`); ninguna utilidad de fecha nueva; ningún icono a
pelo de Font Awesome. Y contra «Dónde NO va»: no se usa `SearchSelect`, no se
arregla `Popover`, no se toca `--color-text-muted`, no se restaura
`activity-time.utils.ts` —de él se rescatan tres funciones reescritas, que es lo
que el plan pedía— y no se pinta nada de ejecutado. `VidaDurationPills` se
reutiliza con `maxMinutes`, que ya existía.

**Lo que sigue sin verificarse, dicho sin disimulo:** el recorrido real del
criterio 58 (login + `15463da` en Cloud Run), el comportamiento en un teléfono
de verdad —mi medida es un viewport emulado de 375×812—, el fallo de red de
verdad (paso 6 del recorrido) y qué hace el API si dos bloques llegan pisados.

---

*Revisado por `feature-reviewer` el 2026-09-20. Fuentes: los criterios 23–30 y
52–58 de la sección 1 literales, D1 y D4, «Lo que NO se crea» y «Dónde NO va»
de la sección 2, la entrada de la tajada 3 de la sección 3, `git diff HEAD`,
`graphify explain` / `query` sobre los hooks del plan del día, la corrida entera
de `pnpm typecheck` ×2 / `lint` / `test` / `build`, un arnés de encaje de 8
casos bajo `src/features/vida/utils/` y un arnés de navegador bajo
`src/revision-t3/` a 375 px en claro y oscuro. **Los dos arneses están
borrados** y `git status` no los lista.*

### Tajada 4 — Cualquier día, no solo hoy

**Veredicto: `accepted`.** Los ocho criterios de la tajada (31–38) se cumplen
como los escribió el analista, y la parte de 53, 55, 56 y 57 que esta tajada
toca también. No encontré ninguna regresión en las tajadas 1–3 ni en FEAT-002.
Cinco hallazgos, ninguno de ellos motivo de devolución; el más serio es el punto
de la tira cuando **falla** una de las siete consultas, que afirma «sin plan
todavía» sin saberlo.

**Criterios, uno por uno** (contra la sección 1 literal, no contra el resumen
del constructor; mi propio arnés de tests bajo `src/`, **borrado**, 17 casos,
15 verdes y 2 reescritos en un segundo archivo por los `fakeTimers`):

- **31 — la tira de 7 días, hoy marcado, el visto resaltado, un toque cambia de
  día.** Cumplido. Con el reloj en el viernes 18 y `?d=2026-09-19`, la tira sale
  `Jue 17 · Hoy 18 · Sáb 19 · Dom 20 · Lun 21 · Mar 22 · Mié 23`: siete, dos
  antes del visto, la etiqueta **«Hoy»** en el 18 aunque el resaltado esté en el
  19, y `aria-current="page"` en el 19. Un toque en el domingo 20 cambia el
  encabezado, el plan y el resaltado (verificado en `MemoryRouter`, no solo en
  el DOM).
- **32 — el punto: rayado con plan, vacío sin él.** Cumplido. Con el hook real
  y un `QueryClient` de verdad, un día con bloques da `hasPlan: true` y su
  `data-state="plan"`; los vacíos, `empty`. El punto es decorativo y el nombre
  accesible dice «con plan, 3 bloques» / «sin plan todavía»: **se lee sin
  color**. Y viene del **plan del día**, no de la plantilla — el hook solo pide
  `dayPlan.byDate`, no mira sugerencias.
- **33 — día futuro: planeado frente a libre, sin «ahora».** Cumplido. En
  `?d=2026-09-19` el presupuesto dice «planeado 30m de 16h 30», el encabezado no
  trae la hora, no hay «te quedan», ni «Ahora», ni «en N min»
  (`useVidaNowMinute(isToday)` devuelve `null` y `budget.remainingMinutes` cae a
  `null`). El trazo suave es `.agenda[data-tone='plan']` sobre el **borde**, no
  sobre el texto.
- **34 — el día visto va en la URL; recargar y el «atrás».** Cumplido en lo que
  se puede comprobar sin navegador de verdad. `?d=YYYY-MM-DD` pinta ese día
  (recargar es ese mismo montaje) y, con un `Probe` que llama `navigate(-1)` y
  `navigate(+1)` dentro del `MemoryRouter`, el **atrás** vuelve del domingo 20 a
  hoy —URL, encabezado y `aria-current` de la tira, los tres— y el **adelante**
  regresa al 20. Como son `Link`, el historial es real. **Pendiente del
  recorrido manual:** el `history.back()` del navegador de verdad.
- **35 — la ventana es esta semana y la que viene; el borde se explica.**
  Cumplido, **con la desviación del plan aceptada**: la ventana va del **lunes
  de esta semana** al domingo de la siguiente. Leído contra el criterio literal
  —«la ventana de planeación es esta semana y la que viene»— el lunes es lo que
  el criterio dice; con el `from: hoy` que escribió el arquitecto, el criterio
  **38** sería inalcanzable (ningún día pasado se podría abrir). Planear sigue
  limitado a hoy y futuros por `isEditableDate`. Comprobado por mi lado:
  `?d=2026-09-31`, `?d=2026-13-45` y `?d=2027-…` caen en **Domingo 27** con la
  frase «Se planea esta semana y la que viene: hasta el domingo 27.»;
  `?d=0001-01-01` cae en **Lunes 14**; no hay botones de semana anterior o
  siguiente.
- **36 — «Copiar del \<día\> pasado».** Cumplido. El origen es el **mismo día de
  la semana anterior exacto** (`sameWeekdayLastWeek` = −7 días, probado también
  cruzando el cambio de mes). Con dos bloques el 13, el botón del día 20 dice
  «Trae 2 bloques, con sus horas.» y el `mutate` sale **exactamente**
  `{ date: '2026-09-20', items: [{activityId, startTime, endTime, orderIndex}
  ×2] }`: sin `id`, sin `completedAt`, sin `date` por bloque, ordenado por hora,
  `orderIndex` renumerado 0,1 y el `07:00:00` viejo normalizado a `07:00`. Si
  aquel día no tuvo plan, el botón queda **apagado** y dice «Ese domingo no
  tuviste plan, así que no hay nada que traer». En un día que ya tiene plan, el
  botón **no existe** (D7iii).
- **37 — «Vaciar y rehacer» con confirmación que nombra cuántos bloques.**
  Cumplido. Solo se pinta si el día **tiene** bloques y solo en días editables;
  el diálogo dice «Se van N bloques…», la mutación no sale hasta confirmar y al
  confirmar es una sola llamada `{ date, items: [] }` —`activityDayPlanSet` con
  lista vacía, ninguna mutación nueva—. Vocabulario: **«Volver»** y «Vaciar el
  día»; ni «eliminar» ni «cancelar» en ninguna de las dos acciones (criterios 30
  y 56).
- **38 — un día pasado es solo lectura.** Cumplido. En `?d=2026-09-16` con
  plan: **cero `<button>` dentro del `<ol>` de la agenda**, ninguna ficha
  (la página pasa `NO_SUGGESTIONS`), ningún «+ otra cosa», ningún «···», ni
  «Copiar» ni «Vaciar», y la línea «Este día ya pasó: aquí queda como lo
  planeaste, para mirarlo.» sin `desperdici|perdiste|fallaste|no cumpliste` en
  todo el documento. `isEditableDate` lo decide con **fecha local**
  (`getCurrentLocalDate`): a las 23:59:30 del 18, el 18 es editable y el 17 no;
  a las 00:00:30 del 19, el 18 ya no lo es y el 19 sí. Sin corrimiento UTC.
- **53 (lo que añade esta tajada) — 375 px.** Cumplido, medido por mí en el
  navegador del usuario con un arnés propio (`src/revision-t4/`, **borrado**):
  `documentElement.scrollWidth` **375** = `clientWidth`, ni un elemento con
  `right > 375`, los siete días **caben** (`ul.scrollWidth` 343 =
  `clientWidth` 343) y la tira lleva su **propio** `overflow-x: auto` para
  cuando no quepan.
- **55 — oscuro.** Cumplido a la vista y con el DOM: en oscuro se distinguen el
  día seleccionado (fondo mint al 14 % + borde), la etiqueta «HOY» en mint, el
  número, la frase del borde y las dos notas de los atajos. (Mis proporciones de
  contraste numéricas no son fiables porque las variables salen en `oklab()` y
  `color(srgb …)`; lo que sostengo es la lectura del render en los dos temas.)
- **56 — lenguaje.** Cumplido: «libre», «Volver», «Vaciar el día», «Ese sábado
  no tuviste plan, así que no hay nada que traer», «Este día ya pasó… Los días
  de atrás no se cambian». Nada de reproche en el día pasado ni en el día sin
  plan.
- **57 — línea base.** Cumplido, corrido entero por mí: `pnpm lint` → **14
  errores / 0 warnings** (los mismos); `pnpm test` → **2 fallos de 885**
  (`SearchSelect` ×2, preexistentes); `pnpm build` → `index` **901,19 kB**,
  `app-icons` **620,20 kB**, `IconPicker` **4,64 kB** —los dos últimos clavados
  en la línea base: **el chunk no crece por iconos**—. Ningún documento GraphQL
  nuevo, así que `contracts.test.ts` no cambia.
- **58 — el recorrido con la cuenta real:** sigue **pendiente**, como manda
  `ENVIRONMENT.md`. Los siete pasos del constructor valen; añado dos abajo.

**Qué miré alrededor** (y cómo):

- `graphify explain "VidaHoyPage"`, `"VidaAgendaGap"` y `"vidaPaths"` sobre el
  grafo — que aquí **ya está actualizado al árbol sucio**, así que sirve para
  «quién depende de esto» y no para «¿duplicó algo?».
- **Quién más usa lo que se tocó.** `vidaPaths` lo importan ocho archivos
  (páginas de Vida, `app-nav.config.ts` y sus tests): `hoyForDate` es **nuevo y
  lo usa solo la tira**, y `hoy` **no se duplicó** —sigue siendo una sola
  entrada y `app-nav.config.ts:104,108` la única fuente de destinos—. Como
  `?d=` es *search*, no *pathname*, la píldora «Hoy» del módulo se enciende
  igual (`NavLink` compara ruta, no consulta); `AppLayout.test.tsx` y
  `app-nav.config.test.ts` siguen verdes.
- **Lo que vive al lado en la misma pantalla.** `VidaAgendaBlock` y
  `VidaAgendaGap` **no se tocaron** (`git status` lo confirma) y no los usa
  nadie más que `VidaHoyPage`: el día pasado se apaga desde la página pasando
  `date={null}`, `onEdit`/`onPlaceSuggestion`/`onOpenSheet` sin definir y
  `NO_SUGGESTIONS` — los tres prop ya eran opcionales desde la tajada 3, así que
  no hubo cambio de contrato.
- **Lo que el constructor señaló como «lo que más probablemente rompí».** (a)
  `VidaHoyPage` sin router: los 88 archivos de test pasan, y el único que la
  monta es `VidaHoyPage.test.tsx`, que ya trae `MemoryRouter` por
  `renderWithProviders`. (b) Las siete consultas: **medidas**. Con el hook real,
  abrir la tira son **7** llamadas y moverse un día es **1 más (8)**, no 14: la
  clave `vidaKeys.dayPlan.byDate` y el `staleTime` de 30 s hacen que los seis
  días compartidos sean acierto de caché. (c) `canPlan`: los cuatro sitios que
  cuelgan de él los comprobé a la vez en el día pasado (cero botones en la
  agenda, sin «···», sin atajos, hoja apagada con `sheet && canPlan`).
- **La agenda de hoy (tajadas 2 y 3) sigue igual**: `data-tone` solo se pone
  cuando el día **no** es hoy, y los 42 tests de las tajadas 2 y 3 de
  `VidaHoyPage.test.tsx` pasan sin tocarse. Hábitos y FEAT-002: ni un archivo
  modificado fuera de `src/features/vida/`.

**Estados que nadie construye:**

- **Sin datos** — cubierto: día sin plan con texto propio para hoy, para un
  futuro y para un pasado; la tira con todos los puntos vacíos.
- **Cargando** — parcial, **hallazgo**: la página pinta la tira también en el
  esqueleto (bien), pero el punto en `pending` es un círculo al **8 %** de
  opacidad frente al **12 %** del vacío, sin movimiento: a la vista es el mismo
  punto. Solo el `aria-label` («cargando su plan») distingue. No lo pide ningún
  criterio —el 50 habla de la pantalla del día—, pero mientras carga la tira
  **parece afirmar** «sin plan».
- **Error** — **hallazgo, el más serio.** Si una de las siete consultas falla,
  `useVidaWeekPlans` la da por `hasPlan: false` e `isPending: false`: el punto
  queda vacío y el nombre accesible dice «sin plan todavía» de un día que sí
  puede tener plan. Medido con el hook real y una promesa rechazada. El criterio
  52 cubre las consultas del día visto, no las de la tira, así que no devuelvo
  por esto; pero es una afirmación falsa y conviene un tercer estado
  («no se pudo mirar»).
- **Sin permisos / sin sesión** — cubierto: el guard deshabilita las siete
  consultas y el hook las trata aparte (`isPending` + `fetchStatus: 'idle'`), así
  que los puntos se quedan quietos en vez de girar para siempre; la pantalla
  sigue dando el mensaje de entrar (criterio 51, test de la tajada 2, verde).
- **Texto largo** — cubierto: un título de 60 caracteres en el arnés a 375 px no
  produce scroll horizontal.
- **Móvil** — cubierto arriba (criterio 53).

**¿Duplica algo que ya existía?** No. Contra «Lo que NO se crea» y «Dónde NO
va» de la sección 2: ninguna mutación ni documento GraphQL nuevos (los dos
atajos usan `useSetActivityDayPlanMutation`, que ya existía); **ninguna clave de
caché nueva** —comprobado con el hook real: los siete días escriben en
`vidaKeys.dayPlan.byDate`, la misma entrada que la agenda—; ninguna invalidación
nueva (`invalidateDayPlanQueries(date)` del `onSuccess` de la mutación refresca
agenda, presupuesto y punto a la vez); ningún componente de `shared/ui` nuevo
(usa `Button` y `useConfirmDialog`); ninguna utilidad de fecha duplicada
(`vida-window.utils.ts` importa `vida-date.utils.ts` y `vida-time.utils.ts`, no
al revés); ningún icono a pelo de Font Awesome; y el día visto **no** entró como
segmento de ruta.

**Hallazgos (no devuelven la tajada, quedan escritos):**

1. **El punto de un día cuya consulta falló dice «sin plan todavía».** Ver
   arriba. Falta un estado «no se pudo mirar» en `VidaDayPlanDot`.
2. **El punto `pending` no se distingue del vacío a simple vista** (8 % vs
   12 %, sin animación).
3. **Copiar no mira si la actividad está archivada.** `ActivityDayPlanItem` no
   trae el `status` de la actividad, así que `planItemsToSetItems` manda el
   `activityId` tal cual y **quien decide es el backend**. No lo pide el
   criterio 36 y no hay forma de saberlo en cliente sin una consulta más, pero
   **nadie lo decidió**: va al recorrido manual (paso 9) y, si el API lo
   rechaza, es una decisión para la tajada 5 o un dossier propio.
4. **`?d=` igual a hoy se queda en la URL** (`/app/vida/hoy?d=2026-09-18`), no
   se limpia. Es inocuo —la píldora sigue encendida y la pantalla es la misma—;
   lo anoto porque cambia lo que el usuario copia y pega.
5. **Formas raras de `?d=` caen en hoy en silencio**: `?d=manana`,
   `?d=2026-9-18` (sin el cero) o `?d=` vacío. Es lo que decidió el
   constructor y no rompe nada; queda dicho para que nadie lo lea como un bug.
   Confirmo además el aviso del constructor: **el lateral «Tu plantilla de
   \<día\>» sigue apareciendo en días pasados** —hoy solo lleva un enlace al
   catálogo, así que no rompe el 38, pero **en la tajada 5 hay que esconderlo o
   quitarle el botón**.

**Lo que no revisé:** el «atrás» de un navegador real (lo hice con
`MemoryRouter`); «Copiar» contra el API de verdad; y cualquier cosa detrás del
login, que en este proyecto es estructural. Pasos manuales que añado a los siete
del constructor:

8. Con la tira abierta, **cortar la red un segundo** y recargar: mirar qué
   pintan los puntos (hallazgo 1).
9. Archivar una actividad que estaba en el plan de la semana pasada y usar
   **«Copiar del \<día\> pasado»** en el mismo día de esta: ver si el API lo
   admite o lo rechaza (hallazgo 3).

---

*Revisado por `feature-reviewer` el 2026-09-20. Fuentes: los criterios 31–38 y
53–58 de la sección 1 literales, D3, D5 y D7, «Lo que NO se crea» y «Dónde NO
va» de la sección 2, la entrada de la tajada 4 de la sección 3, `git diff HEAD`,
`graphify explain` sobre `VidaHoyPage` / `VidaAgendaGap` / `vidaPaths`, la
corrida entera de `pnpm lint` / `pnpm test` / `pnpm build`, un arnés de tests de
17 casos bajo `src/features/vida/` y un arnés de navegador bajo
`src/revision-t4/` a 375 px en claro y oscuro. **Los dos arneses están
borrados** y `git status` no los lista.*

### Tajada 5 — La semana y armar desde la plantilla

**Veredicto: `returned`.** Lo construido funciona y está bien hecho: armar copia
hora y duración, corre detrás lo que se pisa, encadena al final lo sin hora y lo
dice; la semana no pisa ningún día con plan; la línea base no empeora. Devuelvo
por **dos cosas**, y ninguna es de estilo:

1. **El criterio 48 no se cumple.** Pide, literal, que el lateral traiga «cada
   cosa de la plantilla de ese día, marcando las que ya están en el plan **y con
   el botón de ponerla en el primer hueco donde cabe**». Ese botón **no existe**
   en ninguna parte del árbol. No lo cierra ninguna otra vía: el toque en una
   ficha de la tajada 3 (criterio 23) es otra superficie —la ficha dentro del
   hueco— y otro comportamiento —el principio de **ese** hueco, no el primero
   donde cabe—. Como esta es la **última tajada**, aceptarla dejaría la feature
   en `delivered` con un criterio explícito sin cumplir. El dossier enseña el
   recorrido del botón: la tajada 2 lo aplazó («es una mutación: tajada 3»), la 3
   no lo hizo, el constructor de la 4 avisó «ojo para la tajada 5» y la 5 lo
   declara fuera de alcance. Nadie lo construyó.
2. **La vista de semana puede machacar un plan si falla una de las siete
   consultas de día.** `useVidaWeekPlans` no expone `isError`: una consulta que
   falla devuelve `data: undefined` → `items: []` → `hasPlan: false` →
   `canBuild: true`. Ese día se lee «Sin plan todavía», enseña «Armar» y entra en
   `buildable`, y armar es `activityDayPlanSet`, que **reemplaza el día entero**.
   Un fallo de red en un día ya planeado se convierte en borrarlo. Es el riesgo
   que el propio constructor marcó («armar machaca si se ofrece donde no debe»);
   el revisor de la tajada 4 ya lo vio en el punto de la tira, donde solo
   mentía, y aquí escribe. Hoy no tiene el agujero: `useVidaDayData` distingue
   el error y el botón cuelga de `!hasPlan` con el plan cargado.

**Criterios, uno por uno** (contra la sección 1 literal; el núcleo puro lo medí
con un arnés de tests propio bajo `src/features/vida/utils/`, **borrado**, 11
casos que no repiten los 17 del constructor):

- **21, su mitad de botón — cumplido.** «Armar desde la plantilla (2 cosas)» se
  pinta en el día vacío y editable, dice cuántas cosas trae y manda **una sola**
  `activityDayPlanSet` con el payload literal. Visto en `VidaHoyPage.test.tsx` y
  en el diff. El test de la tajada 2 que afirmaba lo contrario está derogado a
  propósito y así queda dicho; es legítimo: lo escribió la tajada 2 para esto.
- **39 — cumplido, con una desviación anotada.** Línea por día con día de la
  semana y número, «Planeado · N bloques · Xh YY» + barrita + «Ver», y en los
  vacíos «Sin plan todavía» + «Tu plantilla trae N cosas los \<día\>». La
  desviación: el «Armar» **no** aparece si ese día la plantilla no trae nada (ni
  en días pasados, que es el criterio 38). Un botón muerto sería peor; lo
  registro como decisión, no como incumplimiento.
- **40 — cumplido.** Los días pasados se describen por lo **planeado**, con la
  misma línea que los futuros; no hay «seguiste», ni tramos de seguido / de más
  / fuera del plan. Leído en `VidaSemanaPage.tsx` y en su test.
- **41 — cumplido.** `buildDayFromTemplate` copia `startTime` y
  `durationMinutes` tal cual: dos ítems a las 8:00 y 12:00 salen exactamente a
  las 8:00 y 12:00, con `orderIndex` renumerado 0, 1 por orden de hora.
- **42 — cumplido.** Una llamada por día (`mutate` una sola vez), y la
  invalidación por fecha es la misma entrada de caché que la agenda y que el
  punto de la tira, así que la línea y el punto se repintan sin recargar.
- **43 — cumplido en el comportamiento, con un recuento que se contradice.**
  Dos a la misma hora: `08:00–09:00` y `09:00–09:30`, con «1 de 2 no cabían a su
  hora y quedaron después». Solape parcial (8:00–9:00 y 8:30): el segundo va a
  `09:00–09:45`, **conservando su duración**. El defecto: los contadores se
  suben **antes** de comprobar que el bloque cabe, así que un ítem que se mueve y
  después se descarta se cuenta como movido *y* como descartado. Medido:
  `22:00 +50` y `22:10 +30` con fin 23:00 → «1 de 2 no cabían a su hora y
  quedaron después» **y** «Ab no cabía antes de que termine tu día y se quedó
  fuera del plan», sobre el mismo ítem. No se pierde nada en silencio, pero se
  afirma algo que no está en el plan.
- **44 — cumplido, con la misma contradicción.** Sin hora y con duración: al
  final, encadenado (`09:00–09:45`). Sin hora y sin duración: `DEFAULT_BLOCK_
  MINUTES` (30 min), y el bloque enseña su duración en la agenda. La frase «1
  cosa sin hora, puesta al final — ponles una hora en tu plantilla» lleva el
  enlace a `/app/vida/actividades` en las tres superficies. Contradicción: un
  ítem sin hora que **no cabe** se cuenta como «puesta al final» y a la vez se
  nombra como descartado. Y `usedDefaultDuration` se calcula y **no se usa en
  ninguna pantalla**: si la duración por defecto tiene que ser «visible» como
  algo más que los 30 min pintados en el bloque, falta decirlo; si no, sobra la
  bandera.
- **45 — cumplido.** `canBuild = isEditableDate && sin plan && plantilla > 0`, y
  la confirmación dice «Se armarán N días, copiando la hora y la duración de cada
  cosa de tu plantilla. M ya tienen plan y no se tocan», con salida «Volver». Los
  días con plan no entran en el lote. **Con la salvedad del punto 2 del
  veredicto**: «sin plan» se decide sobre una consulta que puede haber fallado.
- **46 — cumplido.** `useBuildWeekFromTemplate` no aborta al primer fallo,
  acumula `{ done, failed, empty }`, invalida solo los días armados y la pantalla
  titula «Armamos 1 de 2 días» nombrando el que falló con su razón y «Sigue sin
  plan». Nunca «semana armada». Un hueco: los días que acaban en `empty` —los
  que se prometieron en la confirmación pero no dejaron ningún bloque— **no
  salen en el resumen**; se prometieron 3 y se lee «Armamos 2 días» sin decir qué
  pasó con el tercero.
- **47 — pendiente de prueba manual.** Lo cronometra el usuario; no lo doy por
  cumplido.
- **48 — NO cumplido.** Su mitad «Mañana» sí: «Mañana, \<día\> N» con «Armar
  mañana desde la plantilla», «Ver mañana» si ya tiene plan, y sin «Cómo va el
  día» (D8). Falta el botón «ponerla en el primer hueco donde cabe» (punto 1 del
  veredicto).
- **53, 54, 55 — comprobados por estructura, no medidos en un navegador real.**
  En `VidaSemanaPage.module.scss` y en lo nuevo del lateral no hay un solo ancho
  fijo en `px`, hay `min-width: 0` en todos los contenedores, `overflow-wrap:
  anywhere` en los dos textos largos, `flex-wrap: wrap` en las filas, y los
  colores salen de `--color-text`, `--color-text-secondary`, `--color-primary` y
  `--color-glass-border` —nunca de `--color-text-muted`, el token de bajo
  contraste que la sección 2 prohíbe—. No puede desbordar a 375 px, y coincide
  con el `scrollWidth 375 = clientWidth 375` que midió el constructor. **No lo
  medí yo en el navegador**: la pantalla está detrás del login y montar un arnés
  de `VidaSemanaPage` pedía sembrar cuatro proveedores; con la devolución ya
  decidida, no gasté el turno. Queda dicho, no disimulado.
- **56 — cumplido** en lo nuevo. Ninguna frase reprocha: «Sin plan todavía»,
  «libre», «ponles una hora en tu plantilla», «Volver» en vez de «Cancelar». Ni
  «desperdiciado», ni «perdiste», ni «fallaste», ni «eliminar» sobre un bloque.
- **57 — cumplido, verificado entero por mí, no leído del reporte:**
  `pnpm build` **exit 0** (el mismo `tsc -b`) con chunk inicial **914,52 kB**
  (línea base 901,2 → +13,3 kB), `app-icons` **620,20 kB** y `IconPicker`
  **4,64 kB** — los dos **idénticos** a la línea base: nada de iconos entró al
  arranque. `pnpm lint` → **14 errores / 0 warnings**. `pnpm test` → **2 fallos
  de 918**, los dos de `SearchSelect`, preexistentes. Ningún documento GraphQL
  nuevo: solo `status` dentro de `VIDA_ITEM_ACTIVITY_FIELDS`, que
  `contracts.test.ts` ya valida.
- **58 — pendiente de prueba manual**, y lo seguirá estando: está detrás del
  login y los agentes no entran con credenciales.

**Lo que se rompió cerca — cómo miré**

- **`graphify explain "VidaTemplateAside"` y `graphify explain
  "useVidaWeekPlans"`.** El lateral solo lo monta `VidaHoyPage` (por su
  `index.ts`); el hook de la semana lo llaman `VidaHoyPage` y `VidaSemanaPage`,
  las dos de esta feature. `VIDA_ITEM_ACTIVITY_FIELDS` no es un nodo del grafo
  (es una plantilla de cadena), así que ese lo seguí a mano.
- **El cambio de `VIDA_ITEM_ACTIVITY_FIELDS`, que es lo que el constructor marcó
  como «lo que más probablemente rompí».** Es **aditivo**: un campo más en una
  selección que ya existía, heredado por las cuatro consultas y las tres
  mutaciones de `vida-items` (catálogo, hoja, plantilla y sugerencias de los
  huecos). En el tipo, `status?: ActivityStatus` es **opcional**, así que ningún
  consumidor deja de compilar ni cambia de comportamiento: `undefined` es «no se
  sabe» y `usableTemplateItems` no descarta por él. `contracts.test.ts` verde
  contra el SDL vendorizado y la suite entera verde. El riesgo que queda es el
  API real, y **no es mío de comprobar**: el usuario ya confirmó contra Render
  que el esquema admite la selección.
- **El lateral dejó de pintarse en días pasados.** Es exactamente lo que pidió la
  revisión de la tajada 4; no rompe el criterio 48, que no habla de días pasados.
  En móvil el lateral sigue montándose debajo de la agenda (no hay `media query`
  que lo oculte), así que «Mañana» y sus tres consultas también viven ahí: no es
  un fallo —el bloque es útil en móvil— pero no estaba dicho.
- **`useVidaWeekPlans` ganó `items`**: campo añadido, nadie deja de compilar, y
  la tira sigue usando `hasPlan`/`blockCount`. Sin regresión.
- **FEAT-002 y hábitos.** No hay un solo archivo tocado fuera de
  `src/features/vida/` (`git diff --stat HEAD`): `app-nav.config.ts` intacto —la
  semana no entra en la barra, como mandaba el plan—, `shared/` intacto, hábitos
  intacto. El catálogo y la hoja solo cambian por el campo GraphQL de arriba, y
  sus tests pasan.
- **`/app/vida/semana` en el navegador** (5173 del usuario, sin sesión): la ruta
  existe y redirige a `/auth/login` sin romper el router ni la portada.

**Estados**

- **Vacío:** los tres cubiertos —Hoy no pinta el botón sin plantilla, la semana
  dice «Tu plantilla todavía no trae nada para los \<día\>», el lateral dice
  «Mañana tu plantilla no trae nada que armar»—. Y con la plantilla vacía **no se
  llama al API**, que con `Set` habría vaciado el día: bien visto.
- **Cargando:** esqueleto de siete líneas en la semana, «Mirando cómo viene
  mañana…» en el lateral.
- **Error:** el de `vidaItems` en la semana está resuelto (aviso + «Reintentar»);
  **el de los siete planes del día, no** (punto 2 del veredicto).
- **Sin sesión:** la semana enseña «Entra para ver tu semana» con la vía a
  entrar, no un spinner eterno (criterio 51).
- **Texto largo y móvil 375 px y oscuro:** estructuralmente sanos; sin medición
  propia en navegador (ver criterio 53).

**¿Duplica algo que ya existía?** No. Contra la sección 2: ninguna mutación
nueva (`activityDayPlanSet` es la de siempre), ninguna clave de caché nueva
(`vidaKeys.dayPlan.byDate`, `vidaKeys.items.list`, `settingsKeys.my`), ninguna
invalidación nueva (`invalidateDayPlanQueries` por fecha), ningún componente de
`shared/ui`, ningún icono a pelo, ningún documento GraphQL nuevo y ninguna
utilidad de fecha nueva. La desviación del plan —la semana lee `vidaItems` una
vez en vez de siete `vidaSuggestionsForDate`, y orquesta sobre `api/` como
`useCreateStartingActivities` en vez de disparar siete veces el hook de
mutación— está escrita, razonada y **va en la dirección que el plan quería**
(menos consultas, un solo aviso): la doy por buena.

**Hallazgos que no son motivo de devolución, pero se arreglan de paso**

1. **Los contadores antes de la comprobación de encaje** (criterios 43 y 44):
   subirlos después de decidir que el bloque cabe quita las dos frases
   contradictorias.
2. **`usedDefaultDuration` no se pinta en ninguna parte.** O se dice («le pusimos
   30 min») o se quita la bandera.
3. **`templateCount` en Hoy no descarta las archivadas**: el botón puede decir
   «(3 cosas)» y dejar 2 bloques. La semana ya lo resuelve con
   `templateItemsForDate`; en Hoy es la misma función.
4. **`durationMinutes: 0` da un bloque de longitud cero** (`08:00–08:00`):
   `?? DEFAULT_BLOCK_MINUTES` no atrapa el `0`. El API valida `> 0` al crear el
   ítem, así que hoy no llega; queda dicho.
5. **En Hoy, el `Alert` del resumen pinta un `<p>` vacío** cuando no hubo nada
   que ajustar (`{null} {null}`).
6. **Los días `empty` del lote no salen en el resumen de la semana** (criterio
   46): se prometieron 3 y se leen 2, sin decir qué pasó con el tercero.
7. **«los sábado», «los domingo»** (`VIDA_DAY_LABELS` en singular tras «los»):
   heredado de las tajadas 2 y 4, y esta tajada lo repite en dos sitios más —la
   línea de la semana y el bloque «Mañana»—. Sigue mereciendo una pasada propia.
8. **El bloque «Mañana» se pinta estando ya en mañana.** Confirmado leyendo el
   componente: `tomorrowOf(today)` no mira el día visto.

**Lo que no revisé:** nada detrás del login (estructural en este proyecto); el
API real de Render; la medición propia a 375 px y en oscuro de la semana y del
lateral; y el cronómetro del criterio 47.

---

*Revisado por `feature-reviewer` el 2026-09-20. Fuentes: los criterios 1–58 de
la sección 1 literales —con 21, 39–48 y 53–58 palabra por palabra—, D6 y D8,
«Lo que NO se crea» y «Dónde NO va» de la sección 2 y su tabla de tajadas, la
entrada de la tajada 5 de la sección 3, `git diff HEAD` de los diez archivos,
`graphify explain` sobre `VidaTemplateAside` y `useVidaWeekPlans`, un arnés de
11 tests bajo `src/features/vida/utils/` (**borrado**; `git status` no lo
lista), la corrida entera de `pnpm lint`, `pnpm test` y `pnpm build`, y una
pestaña en el 5173 del usuario sobre `/app/vida/semana`.*

#### Tajada 5 — segunda revisión (tras la devolución)

**Veredicto: `accepted`.** Los dos motivos de la devolución están cerrados, y no
de palabra: reproduje los dos con arnés y con la suite. Con esto **la feature se
entrega**: quedan del usuario el criterio 47 (el cronómetro) y el 58 (el
recorrido con su cuenta), que son suyos por definición.

**Los dos motivos, comprobados por mí**

- **Criterio 48 — cumplido.** `findFirstFittingGap` busca sobre
  `agenda.gaps`, la **misma** lista que pinta la pantalla, saltando `isPast` y
  `isSliver`. Y el hueco que contiene al reloj **sí viene partido**: lo hace
  `withNowMark` en `vida-agenda.utils.ts:239-271`, que emite
  `makeGap(inicio, ahora)` + la marca + `makeGap(ahora, fin)`. Medido con arnés
  propio (11 casos, **borrado**), día con un bloque de 10:30 a 11:00 y el reloj
  en 9:24: los huecos son `06:30-09:24 (pasado)`, `09:24-10:30` y `11:00-23:00`,
  y el primero que ofrece es **09:24** — desde ahora, no desde el inicio del
  día. **Tres «Ponerla» seguidas**, rehaciendo la agenda entre una y otra como
  hace la invalidación: `09:24→09:39`, luego `10:00→10:15`, y a la tercera **no
  queda hueco** (el resto son restos por debajo del mínimo) y el botón se apaga.
  **Día lleno** (un bloque de 06:30 a 23:00): `null` → botón `disabled` con «No
  queda un rato de 20 min en este día». El `aria-label` dice «en el primer hueco
  donde cabe», distinto del «Poner X a las HH:MM» del criterio 23: son dos
  superficies y ahora se distinguen también para quien escucha.
- **Motivo 2 — cerrado.** `useVidaWeekPlans` expone `isError` por día y
  `hasPlan` es `!failed && items.length > 0`: **nunca afirma sobre datos que no
  llegaron**. En `VidaSemanaPage`, `canBuild` exige `!isError && !isPending`, la
  fila en error se lee «No pudimos cargar este día · Hasta saber qué tiene, no
  se arma: armar reemplaza el día entero» con «Reintentar», y `buildable` es lo
  único que entra en el lote. Mi escenario está reproducido literalmente en su
  test: un lunes **con plan real** cuya consulta falla no aparece en las fechas
  de `setActivityDayPlan`. El botón de la semana se apaga además con
  `weekPlans.isPending`, y la tira de Hoy gana el cuarto estado del punto
  (`error`, con su `aria-label`), que cierra de paso el hallazgo 1 de la
  revisión de la tajada 4.

**Los ocho hallazgos, verificados uno a uno** (arnés propio, no el del
constructor):

1. **Contadores tras el encaje — arreglado.** `22:00 +50` y `22:10 +30` con fin
   23:00: `movedCount: 0`, `droppedTitles: ['Ab']`, y `describeBuildDay` ya
   **no** dice «1 de 2 no cabían a su hora» sobre un bloque que no está. Igual
   con el sin hora que no cabe: `withoutTimeCount: 0`, solo descartado. Cada
   ítem acaba en **una** categoría.
2. **`durationMinutes: 0` y negativo — arreglado.** Los dos dan bloques de 30
   min y suman a `defaultDurationCount`.
3. **La duración por defecto se pinta**: «2 cosas sin duración, puestas a 30
   min.», en las tres superficies. Esto es lo que faltaba para leer el criterio
   44 entero («con una por defecto **visible**»).
4. **«(N cosas)» sin archivadas:** `templateCount` sale de `usableTemplateItems`
   y es exactamente lo que se arma.
5. **Los días `empty` salen en el resumen** del lote.
6. **El `<p>` vacío del `Alert`, fuera.**
7. **«los sábados»:** `pluralDayLabel` en `vida-date.utils.ts`, invariable de
   lunes a viernes, usado en las cuatro pantallas.
8. **El bloque «Mañana» no se pinta estando ya en mañana** (`viewedDate ===
   tomorrow`).

Y el caso sano no cambió: dos a las 8:00 y uno sin hora dan
`08:00-09:00`, `09:00-09:30`, `09:30-10:15` con «1 de 3 no cabían a su hora» y
«1 cosa sin hora, puesta al final», con su enlace.

**Criterios de la tajada**: 21 (mitad botón), 39–46 y **48 entero** cumplidos;
47 y 58 **siguen en prueba manual** y no los doy por cerrados. 53, 54 y 55: el
constructor los midió esta vez en navegador (375 px sin scroll horizontal en el
lateral y en la semana, oscuro con captura) y la estructura que revisé lo
respalda —sin anchos fijos salvo un `max-width` de aviso, `min-width: 0`,
`overflow-wrap: anywhere`, y ningún `--color-text-muted`—; el `.noRoomNote` a
0,625 rem es el texto más pequeño de la pantalla y merece una mirada en el
recorrido. 56 y 57, cumplidos.

**Qué miré para las regresiones** (y cómo): `git diff HEAD` de los dieciséis
archivos; `grep` de `hasPlan` y de `byDate[` por todo `src/` —los únicos
consumidores del hook son `VidaDayStrip` y `VidaSemanaPage`, los dos
actualizados; `VidaDayActions` y el lateral usan su propio `planItems.length`,
que no pasa por el hook—; `grep` de `pluralDayLabel` (cuatro pantallas, todo
aditivo: de lunes a viernes no cambia ni un carácter); y las dos props nuevas
del lateral, que el `tsc -b` del build garantiza que nadie más le pasa mal
—`VidaHoyPage` le da `date` y `agenda`, y `agenda` se construye de `planItems`,
que es el plan **de ese `date`** (`VidaHoyPage.tsx:125-134`)—. Nada fuera de
`src/features/vida/`: `app-nav.config.ts`, `shared/` y hábitos intactos.

**Línea base, corrida entera por mí:** `pnpm build` **exit 0** (el mismo
`tsc -b`) con chunk inicial **916,95 kB** (línea base 901,2 → +15,7 kB) y
`app-icons` **620,20 kB** e `IconPicker` **4,64 kB** *idénticos* a la línea base
—nada de iconos entró al arranque—; `pnpm lint` **14 errores / 0 warnings**;
`pnpm test` **2 fallos de 931**, los dos de `SearchSelect`, preexistentes.

**Lo que queda anotado, sin devolver:** el lateral coloca sobre `date` usando
`agenda` y nada ata las dos props entre sí (hoy correcto en el único sitio que
lo monta); «Ponerla HH:MM» solo refresca la hora al tic del minuto; el
`refetch` de una fila reintenta todas las que fallaron; un hueco por debajo del
mínimo (15 min) nunca se ofrece, aunque la cosa midiera 10 min —es la misma
regla que el resto de la agenda—; y el pie de la semana dice «día(s)», el único
plural de la feature resuelto con paréntesis.

**Lo que no revisé:** nada detrás del login (estructural en este proyecto), el
API real de Render, y la medida de 375 px y oscuro la tomó el constructor, no
yo: la respaldo por estructura, no por haberla visto.

**Para el usuario**

Ya no hace falta que montes el día a mano. Tu plantilla —lo que sueles hacer
cada día de la semana, con su hora y su duración— se vuelca al plan de un día
vacío de un solo toque: **«Armar desde la plantilla»** copia cada cosa a su hora
tal como la tienes, y cuando dos se pisan corre la segunda justo detrás en vez
de descartarla, pone al final lo que no tiene hora y te dice, con nombre y
apellido, lo que hubo que ajustar o lo que no cupo antes de que acabe tu día.
Desde el lateral del escritorio dejas **mañana** armado sin cambiar de pantalla,
y cada cosa de tu plantilla que todavía no esté en el plan trae un botón que la
mete **en el primer rato libre donde cabe**, diciéndote la hora antes de que
toques; si el día está lleno, el botón se apaga y te dice cuánto rato haría
falta.

Y hay una pantalla nueva, **tu semana**: una línea por día con lo que tiene
planeado —cuántos bloques y cuánto suman— y, en los que están vacíos, el botón
de armarlos. Abajo, **«Armar toda la semana desde la plantilla»** te dice antes
de hacer nada cuántos días va a armar y cuántos ya tienen plan y no se tocan; si
alguno falla, los demás se quedan armados y la pantalla te nombra el que no
pudo. Un día cuyo plan no se pudo cargar **no se arma**: se lee «No pudimos
cargar este día» con un «Reintentar», porque armar reemplaza el día entero y
nadie va a hacer eso a ciegas.

**Para probarlo a mano** (con tu cuenta y la API despierta):

1. En **Vida → Actividades**, ponles hora y duración a tres o cuatro cosas de tu
   plantilla, y deja alguna **sin hora** a propósito.
2. En **Ajustes de Vida**, fija a qué hora empieza y termina tu día.
3. En **Hoy**, si el día está vacío, toca **«Armar desde la plantilla (N
   cosas)»** y lee el aviso: tiene que cuadrar con lo que ves en la agenda.
4. En el lateral (en escritorio), toca **«Ponerla»** en tres cosas seguidas: cada
   una debe caer en el primer rato libre que quede, nunca encima de otra. Si el
   día se llena, el botón se apaga y dice por qué.
5. En el lateral, **«Armar mañana desde la plantilla»** y luego «Ver mañana».
   **Crónometra**: tiene que salirte en menos de un minuto (criterio 47).
6. Toca **«Ver la semana»**, mira las siete líneas, arma un día suelto y después
   **«Armar toda la semana»**: lee la confirmación antes de aceptar. Cronometra:
   menos de cinco minutos.
7. Si puedes, **corta la red un segundo y recarga la semana**: un día que no
   cargue tiene que leerse «No pudimos cargar este día» y **no** ofrecer
   «Armar».

---

*Segunda revisión por `feature-reviewer` el 2026-09-20. Fuentes: los criterios
21, 39–48 y 53–58 de la sección 1 literales, la entrada «2ª entrega» de la
sección 3, `git diff HEAD`, `vida-agenda.utils.ts:239-271` (el partido del hueco
del reloj), un arnés de 11 tests bajo `src/features/vida/utils/` (**borrado**;
`git status` no lo lista) y la corrida entera de `pnpm test`, `pnpm build` y
`pnpm lint`.*

---

### Derogaciones posteriores — FEAT-010, tajada 3 (2026-09-25)

**No se reescribe ningún criterio de arriba**: quedan como se escribieron y como
se aceptaron. Lo que cambia es que **cuatro de ellos ya no describen la
pantalla**, y quien los lea tiene que saberlo antes de buscar lo que dicen:

| Criterio | Qué decía | Estado | Dónde está escrito |
|---|---|---|---|
| **18** | Hasta 3 fichas de plantilla en el hueco, con «+N más» | **Derogado en su parte de fichas.** Lo que sobrevive es el hueco con su franja y su tamaño | FEAT-010, criterio 381 |
| **19** | La ficha sin duración se lee «sin duración» y abre la hoja para elegir cuánto | **Derogado entero** | FEAT-010, criterio 381 |
| **23** | Un toque en una ficha con duración la coloca al principio del hueco | **Derogado entero** | FEAT-010, criterio 381 |
| **48** | El lateral «Tu plantilla de \<día\>» marcando lo que ya está en el plan, con «Ponerla en el primer hueco donde cabe» · y «Mañana · Armar mañana desde la plantilla» | **Derogada su primera mitad** (el panel y «Ponerla»). **La segunda sigue viva** y no se tocó: «Mañana» se mudó a `components/VidaTomorrowAside/` | FEAT-010, criterio 383 |

**Por qué**, en palabras del usuario: «no me resultan útiles, para mí no es
intuitivo qué hacen» y «esto se reemplaza con lo de "que viene"». Las dos
superficies escribían el plan **al primer toque y sin confirmación**, con dos
reglas distintas que ninguna decía.

**Los criterios 24 y 25 siguen enteros y son ahora el único camino para planear
en un hueco:** «+ otra cosa» abre la hoja «Poner algo a las HH:MM» con el
subtítulo del hueco. Y el **21** («Armar desde la plantilla») tampoco se toca.
Lo comprueban, uno por camino, los cuatro casos del criterio 384 de FEAT-010 en
`src/features/vida/pages/VidaHoyPage.test.tsx`.
