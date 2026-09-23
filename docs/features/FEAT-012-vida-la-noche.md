---
id: FEAT-012
title: La noche — dormir deja de ser un agujero y pasa a ser el borde del día
status: building
architect: yes
area: features/vida, features/settings, **API (xavi-platform-node)**
requested: 2026-09-22
updated: 2026-09-23
---

# FEAT-012 — La noche: dormir deja de ser un agujero y pasa a ser el borde del día

## 1. La petición — feature-analyst

**Resumen para quien venga detrás:** la noche se pone **una vez y aparte** (a qué
hora te acuestas, a qué hora te levantas y qué noches), se pinta como **una
franja arriba y otra abajo** de cada día —fuera de la lista y fuera del
presupuesto— y define **la ventana del día**, de modo que ningún hueco te ofrezca
un rato en el que estabas durmiendo. Lo de Ajustes es **lo planeado**; lo que
dormiste de verdad va **encima** y se confirma o se corrige, igual que un bloque
en FEAT-004. **La primera tajada es la primera cosa del módulo que necesita un
cambio en el API, y hasta que ese cambio esté desplegado no se puede construir
nada de esta feature.**

**Qué problema resuelve**

El usuario quiso poner sus horas de sueño en la plantilla —martes a las 23:00,
seis horas— y preguntó qué vería el miércoles. **Hoy no funciona, y lo he
verificado en el código:**

- `calculateEndTime` (`src/features/vida/utils/vida-time.utils.ts:79`) suma la
  duración a la hora de inicio y **no hace `% 24`**.
- `minutesToTime` (`:49`) recorta con `Math.min(MINUTES_PER_DAY - 1, …)`, o sea
  **a las 23:59**, y está hecho **a propósito** (la cabecera del archivo lo dice:
  «aquí nada cruza medianoche: el día acaba en `vidaDayEndTime`»), para no pintar
  bloques fantasma de madrugada.

Así que 23:00 + 6 h se guarda y se ve como **59 minutos**, y el miércoles no se
entera de nada. El miércoles cree que su día empieza vacío a las 5:00 (o a las
6:30 por defecto) cuando en realidad estabas durmiendo: **el hueco de su mañana,
su presupuesto y su adherencia cuentan mal**, y la app ofrece llenar un rato en
el que estás dormido. El problema no es «falta un ítem de dormir»: es que **el
módulo no sabe dónde empieza y dónde acaba el día de verdad**.

La otra mitad del problema la puso el propio usuario al aprobar: una noche fija
en Ajustes sería otra mentira, porque casi ninguna noche sale como la planeaste.

**Para quién es:** para el usuario del módulo Vida, cada día, en dos momentos
—una sola vez al configurarla, y **una vez cada mañana** para decir en un toque
si la noche fue como decía—. Y, de rebote, para todo lo que ya lee la ventana del
día: Hoy, la plantilla y la revisión.

**Palabras del usuario** (literales):

> «quiero registrar las horas de dormir en la plantilla, pero si pongo hoy martes
> a las 23:00 y pongo seis horas, ¿cómo se verá en la app? Al ver el miércoles,
> ¿veo ese tiempo ya marcado?»

Y al aprobar el render:

> «acepto tu recomendación… con una condición» — que sea **flexible**: que lo de
> Ajustes sea lo planeado y lo que durmió de verdad se pueda confirmar o
> corregir.

**De dónde sale esto (y qué no se re-discute):** render **aprobado**
`docs/vida/assets/13-vida-dormir.html`, **propuesta A** con sus seis marcos.
La propuesta B (dormir como una actividad más y el módulo entero aprendiendo a
cruzar la medianoche) queda **descartada** — y sigue siendo la respuesta correcta
el día que haya que poner un vuelo o un turno de noche. El plan lo recoge en
`docs/vida/PLAN.md`, sección «Después del módulo».

---

### Lo que toca el API — léelo antes que nada

Hasta aquí la regla del módulo era «nada de backend» (`PLAN.md`, decisión 3).
**Esta feature la rompe, y es la única razón por la que puede pararse.**

#### (1) Qué se puede hacer sin tocar el API

Todo menos guardar la noche planeada. En concreto, se puede construir y probar
con una noche inyectada a mano:

- **La aritmética de la noche**: si cruza la medianoche o no (cruza ⟺
  `bedTime > wakeTime`), cuánto dura, a qué día pertenece, y la diferencia con lo
  planeado. Es un `utils` puro y nuevo, y **no toca `vida-time.utils.ts`**.
- **El pintado** de las dos franjas en la plantilla y en Hoy.
- **La ventana del día derivada de una noche dada**, con sus huecos y su
  presupuesto.
- **Lo real**: la pregunta de la mañana, la hoja «¿Cómo dormiste?», «No sé a qué
  hora», y su guardado — que **no va al API** en esta versión: va al store del
  aparato que ya existe (`src/features/vida/store/vida-device-notes.store.ts`,
  clave `xavi.vida.deviceNotes`), **sin clave nueva**, exactamente como FEAT-004
  guardó «No se pudo» y FEAT-006 «Dejarlo como está».

#### (2) El cambio mínimo que necesita el backend, campo a campo

Repositorio **`xavi-platform-node`**. **El despliegue lo hace el usuario.** Es un
cambio aditivo: nada existente cambia de forma ni de comportamiento.

En el tipo `UserSettings` y en el input `UpdateUserSettingsInput` (los dos ya
existen; el cliente los tiene en
`src/features/settings/types/user-settings.types.ts` y
`src/features/settings/graphql/schema/user-settings.schema.graphql`):

| Campo | Tipo | Nulo | Qué es |
|---|---|---|---|
| `vidaNightBedTime` | `String` (`"HH:mm"` local) | sí, **por defecto `null`** | A qué hora te acuestas. |
| `vidaNightWakeTime` | `String` (`"HH:mm"` local) | sí, **por defecto `null`** | A qué hora te levantas. |
| `vidaNightDays` | `[String!]` | sí / lista vacía | Qué noches. **Los mismos valores que ya usa `VidaItem.days`** (`monday` … `sunday`): se reutiliza ese tipo, no se inventa un segundo vocabulario de días. |

Y **tres reglas para quien lo implemente**, por orden de importancia:

1. **NO validar que `vidaNightWakeTime` sea posterior a `vidaNightBedTime`.**
   `23:00 → 5:00` es una noche que cruza la medianoche y `1:00 → 6:40` es una
   noche entera dentro del mismo día: **las dos son legales**. La única
   validación es el formato `HH:mm` (00:00–23:59) y que las dos horas no sean
   **iguales**. Esta es la regla que más fácil se incumple por inercia, porque
   el cliente ya tiene `isEndAfterStart` para la ventana del día y **ahí sí**
   exige fin > inicio (`vida-time.utils.ts:69`, usada por
   `useVidaDayHours.ts:54`).
2. **Sin mutación nueva y sin entidad nueva.** `updateMySettings` ya recibe
   `UpdateUserSettingsInput`: bastan los tres campos opcionales. No hace falta
   `VidaNightLog` ni nada por fecha: **el sueño real no viaja al API en esta
   versión** (D8).
3. **Sin migración de datos y sin tocar `vidaDayStartTime` / `vidaDayEndTime`**,
   que se quedan como están y siguen sirviendo a los días sin noche.

Lo que **no** se pide y conviene decir para que nadie lo añada de propina:
calidad del sueño, despertares, siestas, ni un campo por día de la semana.
Y ojo con un falso amigo: **`UserSettings.sleepActivityCategoryId` ya existe** en
el API y **no tiene nada que ver con esto** — es un id de categoría del catálogo
viejo, no una hora, y esta feature no lo lee ni lo escribe.

#### (3) Qué queda bloqueado hasta que eso esté desplegado

- **La tajada 1 entera**, porque es la que guarda y lee la noche.
- Y, por dependencia, **las tajadas 2, 3 y 4**: todas se apoyan en que exista una
  noche planeada. **Sin el despliegue no se entrega nada de esta feature.**
- Lo único que se puede adelantar sin el API es el `utils` puro de la aritmética
  de la noche (con sus tests), si se quiere ir ganando tiempo. No es una tajada:
  no es usable por nadie solo.

**Lo que hay que pedirle a `xavi-platform-node`, en una frase:** «añade
`vidaNightBedTime`, `vidaNightWakeTime` y `vidaNightDays` a `UserSettings` y a
`UpdateUserSettingsInput`, nulos por defecto, **sin validar que la hora de
levantarse sea posterior a la de acostarse**, y despliégalo».

---

**Qué queda fuera** (lo que alguien puede dar por incluido y **no** lo está)

- **Cualquier cosa que no sea dormir cruzando la medianoche**: un vuelo, un turno
  de noche, una fiesta. Eso es la propuesta B, descartada hoy. Sigue sin poderse
  y está dicho en el render.
- **Que los bloques aprendan a cruzar la medianoche.** `calculateEndTime` y
  `minutesToTime` **no se tocan**: siguen recortando a 23:59. Esta feature no
  arregla ese recorte, lo **rodea** sacando la noche de la lista.
- **Siestas** y cualquier sueño que no sea *la* noche. Una noche por día, y ni
  siquiera todos los días.
- **Varias noches distintas**: hay una sola noche con sus días marcados. Si el
  usuario quiere acostarse a otra hora los domingos, hoy no cabe.
- **La noche en la revisión y en los patrones de FEAT-007** (adherencia del
  sueño, «sueles levantarte 40 min más tarde», «los martes duermes menos»).
  Dormir tiene patrones como cualquier cosa, pero no en esta feature: hacen falta
  semanas de datos que hoy no existen. **Candidata a FEAT-013** (D6). Lo único
  que sí cambia en la revisión es la ventana del día (criterio 285), porque si no
  seguiría contando el sueño como «sin registrar».
- **Recordatorios y notificaciones** («es hora de acostarte»). No hay
  notificaciones en el módulo y esta no las estrena.
- **Calidad del sueño, despertares, ánimo al levantarse.** Dos horas y ya.
- **Sincronizar con el móvil, el reloj o Health.**
- **Que el sueño real viaje entre dispositivos.** Se queda en este aparato (D8),
  con la deuda escrita y dicha en pantalla.
- **Mover la plantilla sola** porque hayas dormido distinto. Eso es el puente de
  FEAT-006 / FEAT-007 y aquí no se estrena nada parecido.
- **Un `VidaNightLog` en el API.** Se nombra en (2) sólo para decir que **no** se
  pide.

**Criterios de aceptación**

La numeración del módulo la dejó FEAT-011 en el 251 y el usuario reserva hasta el
259: **esta feature empieza en el 260**.

*Tu noche, en Ajustes (tajada 1)*

- [ ] 260. En los ajustes de Vida (`src/features/vida/pages/VidaAjustesPage.tsx`)
  hay una sección **«Tu noche»**, aparte de «Tu día», con tres cosas y ninguna
  más: **hora de acostarse**, **hora de levantarse** y **qué noches**. No es un
  ítem de la plantilla, no aparece en el catálogo y no crea ninguna actividad.
- [ ] 261. Debajo de las dos horas se lee la duración calculada («Son **6 h** de
  sueño») y **qué clase de noche es**: con `23:00 / 5:00`, «Cruza la medianoche, y
  eso está bien: la noche del martes es la madrugada del miércoles»; con
  `1:00 / 6:40`, «Esta noche no cruza la medianoche: empieza y acaba el mismo
  día». Comprobable con esos dos pares exactos.
- [ ] 262. **Acostarse después de levantarse es válido y se guarda.** Ninguna
  validación del tipo `isEndAfterStart` se aplica a estas dos horas. Se afirma en
  test que `23:00 / 5:00` se guarda sin error y sin señalar ningún campo.
- [ ] 263. **Iguales no vale:** con la misma hora en los dos campos no se guarda y
  se señala el campo. Una noche de cero minutos no es una noche.
- [ ] 264. «Qué noches» son siete casillas (L M X J V S D) que se marcan por **la
  noche en la que te acuestas**: marcar «viernes» es la noche del viernes al
  sábado. La pantalla lo dice con esas palabras, no se deduce (D3).
- [ ] 265. **Ninguna noche marcada** se guarda igual y equivale a no tener noche:
  el módulo se comporta como en el criterio 310.
- [ ] 266. Se guarda con `updateMySettings` **reutilizando**
  `src/features/settings/hooks/useUserSettings.ts`, con **exactamente**
  `{ vidaNightBedTime, vidaNightWakeTime, vidaNightDays }` en el cuerpo: ningún
  otro campo de ajustes viaja en esa mutación (espía sobre el cuerpo). Al salir y
  volver se ve lo guardado.
- [ ] 267. Si la mutación falla: error visible en lenguaje humano, **no se pierde
  lo escrito** y la noche anterior sigue vigente.
- [ ] 268. Con los tres campos nulos —el estado de todo el mundo el primer día— la
  sección se lee como una invitación, **no** como un error y **no** con horas ya
  rellenadas que parezcan una elección del usuario. No se propone ninguna hora
  por defecto.
- [ ] 269. «Tu día» y «Tu noche» conviven y la pantalla dice **cuál manda** en una
  línea: con noche puesta, el día empieza y acaba donde dice la noche (D1).
- [ ] 270. **Quitar la noche es posible**: vaciarla deja los tres campos nulos, no
  deja ninguna franja huérfana ni ningún sueño real colgando, y el módulo vuelve
  al comportamiento del criterio 310.

*La franja en la plantilla (tajada 1)*

- [ ] 271. En la plantilla, un día con noche pinta **dos franjas**: arriba
  «Duermes hasta las 5:00 · Vienes de anoche · 6 h», abajo «23:00 · te acuestas ·
  Duermes 6 h y te levantas el miércoles a las 5:00».
- [ ] 272. Las dos franjas **no son filas de la lista**: no llevan hora en la
  canaleta, no abren la hoja del ítem, no se editan desde ahí y **no cuentan en
  ningún recuento de ítems del día**.
- [ ] 273. **No entran en el presupuesto.** La cifra «2h puestas de 17h» es
  **exactamente la misma** con noche y sin ella: afirmado en test con los dos
  casos y el mismo número.
- [ ] 274. El color de las franjas **no es el de ninguna categoría ni el de ningún
  estado de bloque**: es propio de la noche y sale de los tokens del proyecto (no
  un violeta fijo escrito a mano).
- [ ] 275. Un día **sin noche** (ese día no está marcado) **no pinta ninguna
  franja**: ni arriba, ni abajo, ni vacía, ni con texto de relleno.
- [ ] 276. La franja de arriba sólo aparece si la noche anterior **llega** a ese
  día. Si la noche de un día **no cruza** la medianoche (`1:00 → 6:40`), su franja
  se pinta **arriba de ese mismo día** y abajo no hay nada que anunciar. Nada en
  el código asume que la noche parte el día en dos.
- [ ] 277. La cabecera del día dice la ventana con la noche: «**Tu día · 5:00 →
  23:00 · duermes 6 h**».

*Hoy cuenta bien: la ventana del día sale de la noche (tajada 2)*

- [ ] 278. En Hoy, un día con noche pinta la franja de arriba y la de abajo, con
  el mismo aspecto que en la plantilla y en el mismo sitio relativo (lo primero y
  lo último de la agenda).
- [ ] 279. **La ventana del día sale de la noche**: el inicio es la hora de
  levantarse de la noche que termina ese día y el fin es la hora de acostarse de
  la noche que empieza ese día. Con noche puesta, `vidaDayStartTime` /
  `vidaDayEndTime` **no se usan** para esos días — y **no se borran**.
- [ ] 280. Un día **sin noche** usa `vidaDayStartTime` / `vidaDayEndTime`
  exactamente como hoy, con su respaldo 06:30 / 23:00 y su `isDefault` dicho en
  pantalla: **el criterio 9 de FEAT-003 sigue cumpliéndose sin cambios**.
- [ ] 281. **Ningún hueco ofrece un rato en el que estabas durmiendo.** El primer
  hueco del día empieza en la hora de levantarse y el último acaba en la de
  acostarse. Test con noche `23:00 → 5:00` y un único bloque a las 9:00: no hay
  ningún hueco antes de las 5:00.
- [ ] 282. El presupuesto («te quedan Xh YY hasta las HH:MM») cuenta hasta la
  **hora de acostarse** de ese día y lo dice con esa hora (D1). **No es un número
  nuevo**: es el del criterio 12 de FEAT-003, que ahora es cierto. No se añade
  ninguna cuenta atrás aparte (D7).
- [ ] 283. Cuando la noche de un día **no cruza** la medianoche, ese día no tiene
  hora de acostarse que cierre la tarde: la ventana termina en `vidaDayEndTime` (o
  su respaldo, dicho como tal) y la franja de esa noche va **al principio** del
  día. Afirmado con `1:00 → 6:40`.
- [ ] 284. **El sueño no es tiempo del día**: sus minutos no aparecen en ningún
  tramo de la barra del presupuesto ni en la leyenda — ni como «planeado», ni como
  «libre», ni como «sin dato».
- [ ] 285. La revisión de un día (FEAT-006) usa **la misma ventana**, así que
  «Sin registrar · de las Xh de tu día» **deja de incluir las horas de sueño**: la
  cifra baja, sigue llamándose igual y sigue sin una palabra de reproche.
- [ ] 286. **Ajustes en vuelo:** mientras `mySettings` carga no se pinta ninguna
  franja ni ningún presupuesto con una ventana que luego salte (criterio 50 de
  FEAT-003, extendido a la noche).
- [ ] 287. **`vida-time.utils.ts` no cambia de comportamiento.**
  `calculateEndTime` y `minutesToTime` siguen recortando a 23:59 y ningún bloque
  cruza la medianoche; sus tests actuales siguen verdes sin tocarse. La aritmética
  de la noche vive en su propio archivo.

*Lo real encima de lo planeado: la condición del usuario (tajada 3)*

- [ ] 288. Con noche puesta y el sueño de esa noche **sin registrar**, Hoy enseña
  **una vez al día** la pregunta: «¿Dormiste 23:00 → 5:00?», con «**Sí, así fue**»
  y «**Fue distinto**» al lado, y la línea «Es tu noche de siempre. Si fue así, un
  toque y listo».
- [ ] 289. La pregunta sale **por la mañana** y **sólo en el día de hoy**: nunca en
  un día futuro y nunca por su cuenta en un día pasado (criterio 307).
- [ ] 290. «**Sí, así fue**» es **un toque**: guarda lo planeado como real y
  **confirmado**, la pregunta desaparece y **no vuelve ese día** (tampoco tras
  recargar).
- [ ] 291. «**Fue distinto**» abre la hoja «¿Cómo dormiste?» con las dos horas
  **prellenadas con lo planeado** y el titular de la noche: «Noche del martes al
  miércoles · tu noche dice 23:00 → 5:00».
- [ ] 292. La hoja dice la duración y la diferencia con lo planeado en palabras
  neutras: «Dormiste **5 h 40** · **20 min menos** que tu noche». **Ni «poco», ni
  «mal», ni «deberías», y no se pregunta ningún porqué.**
- [ ] 293. La hoja acepta una noche que **no cruzó** la medianoche (`1:00 → 6:40`)
  y **lo dice**: «Esta noche no cruzó la medianoche: empezó y acabó el miércoles».
  El usuario no hace ninguna cuenta.
- [ ] 294. Lo guardado pertenece **al día en que te levantas**, aunque te
  acostaras la víspera: afirmado guardando `23:20 → 5:40` y leyéndolo en el
  miércoles.
- [ ] 295. **Ignorar la pregunta es válido.** Al acabar el día el sueño de esa
  noche queda **«sin confirmar»**, la franja lo dice con esa palabra y **nada lo
  cuenta como confirmado**.
- [ ] 296. **«Sin confirmar», «confirmado» y «sin dato» son tres estados
  distintos**, se distinguen en pantalla y se distinguen en el dato guardado.
  Ninguna pantalla los mezcla.
- [ ] 297. Con el sueño confirmado, la franja de arriba dice **lo real**:
  «Dormiste 1:00 → 6:40 · 5 h 40 · 20 min menos que tu noche · **confirmado**».
- [ ] 298. Un sueño ya confirmado **se puede volver a corregir** sin límite: se
  toca la franja y abre la misma hoja con lo guardado dentro.
- [ ] 299. Lo real se guarda **en este aparato**, en
  `src/features/vida/store/vida-device-notes.store.ts` —clave
  `xavi.vida.deviceNotes`, **sin clave nueva de `localStorage`**— y se dice en
  pantalla igual que ya se dice en FEAT-004: no viaja a otro dispositivo
  (`localStorage.length` sigue en 1, afirmado).

*Lo que no se sabe se dice, y lo pasado no se pierde (tajada 4)*

- [ ] 300. Con el sueño **confirmado**, la ventana del día empieza en la hora
  **real** de levantarse: «**Tu día · 6:40 → 23:00**», no 5:00.
- [ ] 301. Los huecos y el presupuesto se recalculan con esa hora **sin
  recargar**: con la noche real acabando a las 6:40 no queda ningún hueco antes de
  las 6:40.
- [ ] 302. Con el sueño **sin confirmar**, la ventana sigue siendo **la planeada**
  y **ninguna pantalla afirma «dormiste»**: dice «tu noche dice 23:00 → 5:00 ·
  sin confirmar». Lo no confirmado **no se usa para nada más que para preguntar**
  (D4).
- [ ] 303. «**No sé a qué hora**» existe en la hoja y guarda **lo que sí se
  sabe**: si falta la hora de acostarse, se guarda la de levantarse y la otra
  queda **sin dato**; si faltan las dos, la noche entera queda sin dato. **No se
  inventa ninguna hora, ni se rellena con la planeada para cuadrar.**
- [ ] 304. Con la hora de levantarse **sin dato**, la ventana del día cae a la
  **planeada** (o a `vidaDayStartTime` si no hay noche) y la pantalla dice que eso
  es lo planeado, no un dato real.
- [ ] 305. Una noche con horas sin dato **no produce ninguna duración**: se lee
  «—», nunca «0 h» ni una cifra estimada.
- [ ] 306. Un día pasado cuyo sueño quedó sin confirmar **se puede confirmar a
  posteriori**: se abre ese día en Hoy, la franja sigue ahí con «sin confirmar» y
  su salida abre la misma hoja. **No se pierde para siempre** (D5).
- [ ] 307. Un día pasado **no pregunta por su cuenta**: la pregunta de la mañana es
  sólo del día de hoy. En los pasados hay **salida**, no interrupción.
- [ ] 308. Confirmar un día pasado recalcula **su** ventana y **su** revisión
  igual que si se hubiera confirmado ese día.
- [ ] 309. **No se puede guardar sueño de un día futuro**: la franja del futuro es
  siempre lo planeado y no ofrece confirmar ni corregir.

*Transversales (aplican a todas las tajadas)*

- [ ] 310. **Sin noche configurada** —el estado de todo el mundo hasta que la
  ponga— la pantalla **no se llena de franjas vacías**: cero franjas en Hoy y en
  la plantilla, cero preguntas de la mañana, cero cambios en la ventana, y el
  resto del módulo se comporta **exactamente como antes** de esta feature.
- [ ] 311. **Cargando:** con los ajustes en vuelo no se pinta ninguna franja ni
  ninguna pregunta (nada que luego salte).
- [ ] 312. **Error:** si los ajustes no cargan se dice, con «Reintentar»; **no** se
  pinta una noche inventada y **no** se afirma «no tienes noche».
- [ ] 313. **Texto y números raros:** una noche de 12 h, una de 3 h, una hora real
  muy distinta de la planeada y un «sin dato» caben en la franja a 375 px sin
  desbordar ni cortar la palabra clave.
- [ ] 314. **Móvil a 375 px:** ni las franjas, ni la hoja, ni la sección de Ajustes
  producen scroll horizontal (`scrollWidth === clientWidth === 375`, cero nodos
  desbordados).
- [ ] 315. **Oscuro:** las franjas y su texto se leen en tema oscuro; el color de
  la noche cambia con el tema.
- [ ] 316. **Ni una palabra de reproche** en ninguna pantalla nueva: barrido
  literal del texto buscando «poco», «mal», «deberías», «apenas», «desperdicio»,
  «tarde», «¿por qué». La diferencia con lo planeado se dice en **minutos y
  dirección** («20 min menos que tu noche»), nunca en juicio, y **no se pregunta
  por qué dormiste distinto**.
- [ ] 317. **Todo lo que se enseña es cierto:** ninguna cifra de sueño sale de una
  hora inventada, y donde no hay dato se lee «—».
- [ ] 318. **Coste:** la noche **no añade ninguna consulta**. Sale de
  `mySettings`, que Vida ya pide a través de `useVidaDayHours`
  (`useUserSettingsQuery`). Afirmado con espía sobre la API.
- [ ] 319. **Del usuario** (nadie más puede cerrarlo, con la API desplegada):
  guardar la noche y verla al volver a entrar; verla en la plantilla y en Hoy a
  375 px y en oscuro dentro de `/app/*`; confirmar una mañana en un toque;
  corregir otra con horas distintas; y comprobar que **el hueco de la mañana ya no
  le ofrece las 5:30**.

**Tajadas**

| # | Qué hace | Estado |
|---|---|---|
| 1 | **Tu noche existe y se ve en la plantilla.** «Tu noche» en Ajustes (las dos horas + qué noches, guardadas en el API) y las dos franjas en la plantilla, fuera de la lista y fuera del presupuesto. Criterios 260–268 y 270–276 (el **269 pasa a la tajada 2**, con el 277) y los transversales que apliquen. | **aceptada** (2026-09-23, revisor) |
| 2 | **Hoy cuenta bien.** Las franjas en Hoy y la ventana del día derivada de la noche: huecos que no ofrecen ratos de sueño y presupuesto que cuenta hasta la hora de acostarse. Criterios 278–287. | pendiente (tras la 1) |
| 3 | **Lo real encima de lo planeado.** La pregunta de la mañana una vez al día, «Sí, así fue» en un toque, «Fue distinto» con su hoja, y «sin confirmar» si se ignora. Criterios 288–299. | pendiente |
| 4 | **Lo real manda y lo que no se sabe se dice.** La ventana desde la hora real de levantarse, «No sé a qué hora» → sin dato, y los días pasados confirmables a posteriori. Criterios 300–309. | pendiente |

Cada tajada es usable sola: con la 1 el usuario ya puede **poner sus horas de
dormir y verlas**, que es lo que pidió; con la 2 el módulo deja de contar mal;
con la 3 la noche se vuelve flexible; con la 4 deja de mentir cuando no se sabe.

**¿Arquitecto? Sí**, por tres razones y cualquiera bastaría:

1. **«La noche» es un concepto nuevo**: no es un `VidaItem`, no es un bloque del
   plan, no es un `activityFollowUp`. Nadie ha decidido dónde vive su aritmética
   ni su tipo, y decidirlo mal significa meterla en `vida-time.utils.ts`, que es
   justo el archivo que FEAT-008 está editando y que tiene escrito «aquí nada
   cruza medianoche».
2. **Cambia la ventana del día, que ya leen tres pantallas** a través de
   `src/features/vida/hooks/useVidaDayHours.ts` (Hoy, la plantilla y la revisión).
   Esa función hoy exige `isEndAfterStart` y devuelve **una** ventana; ahora la
   ventana pasa a depender **del día** y de si hay sueño real confirmado. Eso se
   decide una vez, no en tres sitios.
3. **Es la primera cosa del módulo que amplía el contrato del API**, y hay que
   dejar escrito cómo entran los tres campos en `graphql/`, `types/` y las dos
   selecciones de `user-settings.graphql.ts` sin romper nada.

**Decisiones**

- **D1 · La hora de acostarse manda sobre `vidaDayEndTime`** los días con noche
  (**resuelta por mí; valor por defecto, no bloqueante**). La alternativa era
  dejar `vidaDayEndTime` como fin del día y la franja como adorno, pero entonces
  habría **dos finales de día compitiendo** y el presupuesto seguiría contando
  hasta una hora en la que ya estás en la cama. Consecuencia: quien tenga «Tu día»
  acabando a las 22:00 y se acueste a las 23:00 verá el día acabar a las 23:00.
  Si el usuario prefiere lo contrario, se corrige **antes de la tajada 2** y sólo
  cambia el criterio 282.
- **D2 · El despliegue del API (del usuario, BLOQUEANTE).** No es de diseño: sin
  los tres campos desplegados en `xavi-platform-node` no se construye la tajada 1
  y, con ella, ninguna. Es lo único que puede parar esta feature.
- **D3 · «Qué noches» se marca por el día en que te acuestas** (resuelta por mí,
  desde el render: «viernes y sábado los dejas fuera: esas noches ya te las
  apañas tú»). Lo contrario —marcar el día en que te levantas— es defendible pero
  obliga a traducir mentalmente cada vez.
- **D4 · Lo real sin confirmar no se usa para nada** más que para preguntar
  (resuelta por mí). Ni mueve la ventana, ni alimenta la revisión, ni cuenta como
  sueño. Lo planeado sí es un dato —lo dijiste tú—, pero nunca se enseña como si
  hubiera pasado.
- **D5 · Los días pasados se confirman a posteriori desde su día en Hoy**
  (resuelta por mí). No se pierden para siempre y **no persiguen**: la pregunta de
  la mañana es de hoy, en los pasados hay una salida y punto.
- **D6 · La noche no entra en la revisión ni en los patrones de FEAT-007**
  (resuelta por mí). Lo único que cambia en la revisión es la ventana del día
  (285), porque si no el sueño se contaría como «sin registrar» y eso sería una
  mentira nueva. Los patrones del sueño son una feature aparte, cuando haya
  semanas de datos.
- **D7 · La cuenta atrás de A2/A3 no es un número nuevo** (resuelta por mí): es el
  presupuesto que ya existe desde FEAT-003, contando hasta la hora de acostarse.
  La franja de abajo dice la hora y la duración; el «quedan 15 h 50» lo pone quien
  ya lo ponía.
- **D8 · El sueño real se queda en este aparato en esta versión** (resuelta por
  mí; **el usuario puede revertirla, y cuesta un segundo cambio de API**). Va al
  store que ya existe, con el precedente de FEAT-004, FEAT-006 y FEAT-007. Si el
  usuario quiere que su sueño viaje entre dispositivos —y con el tiempo lo va a
  querer, porque es un histórico— hace falta una entidad por fecha en
  `xavi-platform-node` y eso es **otra feature**, no ésta.

**Con qué choca y en qué orden va**

- **FEAT-008** (construyéndose) edita `vida-time.utils.ts` y
  `VidaDurationPills`. Esta feature **no toca ese archivo** (criterio 287), pero
  lo lee entero. **Que FEAT-008 termine primero**, para no leer una línea base en
  movimiento.
- **FEAT-009** (los huecos llegan a la plantilla) cambia **dónde empieza y acaba
  el primer y el último hueco de la plantilla**, que es exactamente lo que el
  criterio 281 mueve. **FEAT-009 antes**, y FEAT-012 se apoya en sus huecos.
- **FEAT-010** (qué toca ahora) pone una tarjeta **arriba de Hoy**, que es donde
  van la franja del amanecer y la pregunta de la mañana. **Es el choque más
  fuerte: tres cosas compitiendo por el mismo sitio.** FEAT-010 antes, y esta
  coloca la franja respecto a lo que aquélla deje.
- **FEAT-011** (registrar en el hueco) también toca `VidaHoyPage` y los huecos
  pasados; sus huecos heredan la ventana nueva. **Antes que ésta.**

**Orden recomendado: FEAT-008 → FEAT-009 → FEAT-010 → FEAT-011 → FEAT-012.**
Pero **el cambio del API conviene pedirlo hoy**: es asíncrono, no depende de
ninguna de las otras y es lo único que puede dejar esta feature parada.

## 2. El plan — feature-architect

**Resumen para el constructor:** **el API ya está hecho y desplegado** — los tres
campos viajan en `mySettings` desde el commit `73e3c44` del repo hermano y la
migración 068 corrió en verde, así que **D2 ya no bloquea nada y no se toca
`xavi-platform-node`**. El molde es la vertical de FEAT-019 en
`src/features/vida/pages/VidaAjustesPage.tsx` (sección de ajustes + fila de días
+ `updateMySettings`), y las hojas se copian de
`src/features/vida/components/VidaStartTimeSheet/`. **No crees**: ni mutación, ni
consulta, ni clave de caché, ni clave de `localStorage`, ni un sexto componente
de «siete botones de día», ni una línea en `vida-time.utils.ts`.

### Lo que ya existe

**El API entero, y desplegado.** Esto es lo que más cambia respecto a la sección 1,
escrita cuando aún no existía:

| Qué | Dónde (`xavi-platform-node`, commit `73e3c44`) |
|---|---|
| Columnas | `migrations/068_user_settings_vida_night.sql` — **ya corrió** (`ENVIRONMENT.md`: viajó en `73e3c44` y el workflow terminó en verde el 2026-09-22). No hay migración pendiente. |
| SDL | `src/graphql/modules/user-settings/user-settings.schema.ts:37-48` (`UserSettings`) y `:93-102` (`UpdateUserSettingsInput`). `vidaNightDays: [VidaDayOfWeek!]`, el **mismo enum** que `VidaItem.days`. |
| Lectura/escritura | `src/services/user-settings.service.ts:47-49` (`formatTime` recorta a `HH:mm`) y `:164-178` (el `UPDATE` parcial, campo a campo). |
| Validación | `src/validators/schemas/user-settings.schemas.ts:21-47`. |

**Y dos cosas del API que obligan al cliente y no estaban previstas:**

1. **`vidaNightDays: []` lo rechaza el servidor.** `nightDaysArray` lleva
   `.min(1, 'At least one night is required')`
   (`user-settings.schemas.ts:22-29`) y es `.nullable()`. O sea: el criterio 265
   («ninguna noche marcada se guarda igual») se cumple mandando
   **`vidaNightDays: null`**, nunca `[]`. Es la misma lección que ya se aprendió
   con el CHECK de `vida_goals`: el cliente lo dice antes con sus palabras
   (`VidaAjustesPage.tsx:95-106`).
2. **La igualdad de horas NO la valida el servidor.** El comentario del validador
   dice «y que no sean la misma hora», pero **no hay ningún `refine` que lo
   compruebe** (revisado `user-settings.schemas.ts` entero y la migración: tampoco
   hay CHECK). El **criterio 263 es del cliente**, y su test va aquí.
   Lo que sí es cierto y verificado: **no hay ninguna validación de orden**, así
   que `23:00 / 5:00` se guarda (criterio 262) — el `TIME` de Postgres y el
   `timeSchema` solo miran formato.

**En el front, lo que ya resuelve medio problema:**

- **La fila de siete botones de día ya está escrita cinco veces**, y la quinta
  está **en el mismo archivo y con las mismas clases** que necesita «Tu noche»:
  `VidaAjustesPage.tsx:212-233` (días de las metas, FEAT-019), con `.days`,
  `.day` y `.dayOn` en `VidaAjustesPage.module.scss` y con
  `VIDA_DAY_ORDER` / `VIDA_DAY_LABELS` / `VIDA_DAY_SHORT_LABELS` de
  `src/features/vida/utils/vida-date.utils.ts`. Las otras cuatro:
  `VidaStartingPoints.tsx:161-175`, `VidaTemplateAddPanel.tsx:343-356`,
  `VidaActivitySheet.tsx:565-592` y `VidaActivityCard.tsx:145` (solo lectura).
  **Decidido: no se extrae un componente compartido en esta feature** — se
  reutilizan las clases y las constantes de la propia página, así que **no
  aparece una sexta copia**. Extraer `VidaDayPicker` sigue siendo deuda a
  propósito y es otra tarea, con su expediente.
- **El guardado de ajustes** ya existe entero:
  `src/features/settings/hooks/useUserSettings.ts:25-34`
  (`useUpdateUserSettingsMutation` ya hace `setQueryData(settingsKeys.my())`, así
  que al volver se ve lo guardado sin pedir nada — criterio 266).
- **La única lectura de `mySettings` en Vida** es
  `src/features/vida/hooks/useVidaDayHours.ts:46-69`: un envoltorio sobre
  `useUserSettingsQuery`, con `isDefault` / `isPending` / `isError` /
  `isDisabled` / `refetch`. **Ese es el patrón exacto** del hook de la noche, y
  es lo que hace cierto el criterio 318 (ninguna consulta nueva).
- **La geometría del día** ya está entera y es pura:
  `src/features/vida/utils/vida-agenda.utils.ts` — `buildDayAgenda` (`:167`,
  recibe `dayStart`/`dayEnd` en `HH:mm`) y `getDayBudget` (`:319`, cuenta
  `remainingMinutes` hasta `dayEnd`). **La ventana del día es un par de cadenas
  que entra por parámetro**: mover la ventana es cambiar quién calcula ese par,
  no tocar la agenda.
- **Las hojas cortas**: `VidaStartTimeSheet.tsx` (FEAT-013) — `SteppedModal` con
  `ds="aura"` + `mobileSheet` + `size="md"`, estado dentro, `key` por apertura
  que pone quien la monta, el fallo leído dentro sin perder lo escrito y
  `onSave` que **resuelve, no lanza**.
- **La pregunta de una vez en Hoy**: `VidaGoalPrompt` (FEAT-016), montada en
  `VidaHoyPage.tsx:1340`.
- **El store del aparato** con su precedente de campo añadido sin migración:
  `src/features/vida/store/vida-device-notes.store.ts:154-221` — `patternAnswers`
  (un `Record`) entró en FEAT-007 sin `version` ni `migrate`, apoyándose en el
  merge superficial de `persist`, y se añadió a `partialize` (`:214-220`).
- **Los tokens de Aura**: `src/app/styles/_theme-variables.scss:155-237`
  (`[data-ds='aura']`) y `:239-277` (`[data-theme='dark'] [data-ds='aura']`).
  **No hay ningún token de noche**: hay que declararlo ahí (criterios 274 y 315).

**Lo que NO existe — y lo digo explícitamente porque buscarlo cuesta:**

- **No hay nada que cruce la medianoche.** Ni una función, ni un tipo, ni un
  test. `vida-time.utils.ts` lo prohíbe a propósito en su cabecera y
  `minutesToTime` recorta a 23:59. La aritmética de la noche **se escribe de
  cero**.
- **No hay ninguna franja fuera de la lista** en ninguna pantalla del módulo:
  todo lo que se pinta en la agenda es `AgendaBlock`, `AgendaGap`, `AgendaNowMark`
  o `VidaAgendaNoData`, y los cuatro salen de `buildDayAgenda`. La franja de la
  noche es la primera cosa que se pinta **sin pasar por la agenda**.
- **No hay sueño real guardado en ningún sitio**, ni en el API ni en el aparato.
- **No hay nada duplicado**: no encontré dos implementaciones de lo mismo en este
  terreno.

**Dos falsos amigos, para no perder media hora:**

- `src/features/vida/utils/vida-window.utils.ts` **no es la ventana del día**: es
  la ventana de **planeación** (qué fechas son alcanzables, la tira de días). Ahí
  no va nada de la noche.
- `UserSettings.sleepActivityCategoryId` y la suite rota
  `sleep-follow-up-sync.service` del repo hermano **no tienen nada que ver**
  (ya lo avisó la sección 1; lo confirmo).

### Implementación de referencia

**`src/features/vida/pages/VidaAjustesPage.tsx` + `useVidaDayHours.ts`** — la
vertical de días de FEAT-019, entera y viva.

Por qué esa y no otra: es lo **más parecido en forma** a lo que hay que
construir, capa por capa. Una cosa que se pone **una vez** en ajustes
(`goalsSection()`, `:181-247`), se guarda con una mutación existente sin crear
consulta, se lee después **por día de la semana** para decidir si aplica
(`buildGoalArcs` filtra por `activeDays`) y se pinta en Hoy y en la plantilla.
Esa es exactamente la figura de la noche. Además ya resolvió los dos problemas
que la noche se va a encontrar: el borrador que no pisa lo guardado y el
«quedarse en cero no llega al servidor».

Moldes secundarios, uno por pieza, para no buscarlos:

| Pieza nueva | Molde | Ruta |
|---|---|---|
| Hook de lectura sobre `mySettings` | `useVidaDayHours` | `src/features/vida/hooks/useVidaDayHours.ts` |
| `utils` puro con tests | `vida-agenda.utils.ts` | `src/features/vida/utils/vida-agenda.utils.ts` |
| Hoja corta con hora | `VidaStartTimeSheet` | `src/features/vida/components/VidaStartTimeSheet/` |
| Pregunta de un toque en Hoy | `VidaGoalPrompt` | `src/features/vida/components/VidaGoalPrompt/` |
| Campo nuevo en el store del aparato | `patternAnswers` | `src/features/vida/store/vida-device-notes.store.ts:154-221` |
| Franja con dos líneas y color propio | `VidaAgendaNoData` | `src/features/vida/components/VidaAgendaNoData/` |

### Dónde va el código nuevo

**Capa de datos (tajada 1, y la única que toca `features/settings`)**

1. `src/features/settings/types/user-settings.types.ts` — tres campos en
   `UserSettings` (`:12-13` es el sitio, junto a `vidaDay*`) y tres opcionales en
   `UpdateUserSettingsInput` (`:23-24`). Tipos: `string | null`, `string | null`,
   `string[] | null`.
2. `src/features/settings/graphql/user-settings.graphql.ts` — los tres campos en
   **las dos** selecciones (`:8-9` y `:23-24`). No hay documento nuevo.
3. `src/features/settings/graphql/schema/user-settings.schema.graphql` — **volver
   a copiar** el SDL desde
   `xavi-platform-node/src/graphql/modules/user-settings/user-settings.schema.ts`
   (commit `73e3c44`) y actualizar la cabecera (`:8-9`: hoy dice «Copiado
   2026-09-20, commit 15463da»). El enum `VidaDayOfWeek` **no se copia aquí**: ya
   lo aporta `src/features/vida/graphql/schema/vida.schema.graphql:22`, que es
   parte del mismo esquema combinado.
4. `src/features/vida/hooks/useVidaNight.ts` + `useVidaNight.test.tsx` — **nuevo**.
   Envoltorio de lectura sobre `useUserSettingsQuery`, calcado de
   `useVidaDayHours`: devuelve `{ night: VidaNight | null, isPending, isError,
   isDisabled, refetch }`, lee con `settings?.campo ?? null` y **lo que llegue
   roto cae a `null`** (criterios 310, 311, 312, 317, 318).

**Aritmética (tajada 1, y la base de las cuatro)**

5. `src/features/vida/utils/vida-night.utils.ts` + `vida-night.utils.test.ts` —
   **nuevo y puro**. Lo que tiene que saber decir, con los criterios que cierra:
   `crossesMidnight` (`bedTime > wakeTime`, 261/276), `nightDurationMinutes`
   (261, y **`null` cuando falta una hora** — criterio 305, nunca `0 h`),
   `nightForWeekday` / `nightEndingOn(date)` / `nightStartingOn(date)` (271, 276,
   294), `nightWindowForDate` → `{ startTime | null, endTime | null }` (279, 283),
   `describeNightKind` (261, 293) y `diffToPlannedMinutes` (292, 297: minutos y
   dirección, nunca juicio).
   **No importa `minutesToTime`** de `vida-time.utils.ts` para nada que pase de
   medianoche: recorta a 23:59 y devolvería 23:59 en silencio. Las horas se
   manejan en minutos absolutos y se formatean aquí.

**Ajustes y franjas (tajada 1)**

6. `src/features/vida/pages/VidaAjustesPage.tsx` — una función `nightSection()`
   hermana de `goalsSection()` (`:181`), montada dentro de `shell()` (`:163-176`),
   entre la tarjeta de «Tu día» y la de las metas. Reutiliza `styles.days/.day/
   .dayOn` y las constantes de días. Guarda con `updateMutation.mutate({
   vidaNightBedTime, vidaNightWakeTime, vidaNightDays })` y **nada más en el
   cuerpo** (266). Cero noches → `vidaNightDays: null` (265, y el `.min(1)` del
   servidor). Horas iguales → no se manda y se señala el campo (263). Sin noche
   → invitación, campos vacíos, **ninguna hora propuesta** (268). Vaciar → los
   tres a `null` (270). Una línea que diga cuál manda (269).
7. `src/features/vida/pages/VidaAjustesPage.module.scss` — solo lo que falte
   (`.night*`); `.days` ya está.
8. `src/features/vida/components/VidaNightBand/` — **nuevo**: `VidaNightBand.tsx`,
   `VidaNightBand.module.scss`, `index.ts`, `VidaNightBand.test.tsx`. Props
   `variant: 'dawn' | 'dusk'` y el estado de la noche. Del render aprobado
   `docs/vida/assets/13-vida-dormir.html:56-61` (las clases `.night` / `.night.dawn`)
   y `:174-184` (los textos). **No lleva hora en canaleta, no abre nada en la
   tajada 1** (272).
9. `src/app/styles/_theme-variables.scss` — tokens `--aura-night-*` en
   `[data-ds='aura']` (`:155-237`) **y en el bloque oscuro** (`:239-277`).
   Criterio 274: nada de `#4F46E5` escrito a mano en el `.module.scss`.
10. `src/features/vida/pages/VidaPlantillaPage.tsx` — la franja del amanecer
    **antes** de `templateDay.rows.map(...)` (`:506`) y la del anochecer después,
    **fuera del contenedor de filas**, para que no sea una fila ni entre en
    ningún recuento (272, 275).

**La ventana del día (tajada 2)**

11. `src/features/vida/hooks/useVidaDayWindow.ts` + test — **nuevo**. Recibe la
    fecha, compone `useVidaDayHours()` + `useVidaNight()` y devuelve **la misma
    forma que `VidaDayHours`** más `{ night, source: 'night' | 'settings' |
    'fallback' }`. Así los llamantes cambian una línea y todo lo demás
    (`buildDayAgenda`, `getDayBudget`, `VidaDayBudget`) sigue recibiendo
    `HH:mm`. Criterios 279, 280, 283, 286.
    **`useVidaDayHours` no se toca**: sigue siendo el lector crudo de los ajustes
    y lo llaman siete sitios, dos de ellos sin fecha.
12. `src/features/vida/pages/VidaHoyPage.tsx` — cambiar `dayHours` por el nuevo
    hook en `:331-337` (`buildDayAgenda` + `getDayBudget`), `:397`, `:429`,
    `:436-437`, `:551-554` (marca de «ahora»), `:578`, `:1296-1297`
    (`VidaDayBudget`) y `:1418-1419`. Las franjas van **alrededor** del
    `<ol className={styles.agenda}>` (`:1261`), no dentro (272, 278).
13. `src/features/vida/pages/VidaRevisionPage.tsx` — la misma ventana (285); la
    cadena está descrita en su cabecera (`:140`).
14. `src/features/vida/components/VidaDayBudget/VidaDayBudget.tsx:108,210` y
    `src/features/vida/components/VidaTemplateDaySummary/VidaTemplateDaySummary.tsx:99`
    — la línea «Tu día · 5:00 → 23:00 · duermes 6 h» (277) y la hora del
    presupuesto (282). **Reciben la noche por props**: son componentes de pintar
    y no llaman hooks.
15. `src/features/vida/routes/VidaModuleLayout.tsx:53,162` — el aviso de sesión
    vieja usa `dayHours.endTime`. **Recomendación:** pasarle la ventana de **hoy**
    (con noche, la hora de acostarse). Es un cambio de una línea y evita que dos
    pantallas digan dos finales de día distintos (D1).

**Lo real (tajadas 3 y 4)**

16. `src/features/vida/store/vida-device-notes.store.ts` — un campo más,
    **misma clave** `xavi.vida.deviceNotes` (299): `nightLogs: Record<string,
    VidaNightLog>` con la clave **= fecha en que te levantas** (`YYYY-MM-DD`,
    criterio 294) y `VidaNightLog = { bedTime: string | null; wakeTime: string |
    null; confirmedAt: string }`. Más `setNightLog` / `clearNightLog` /
    `getNightLog`, y el campo en `partialize` (`:214-220`). **Sin `version` ni
    `migrate`**: el merge superficial de `persist` lo deja en `{}` para quien
    guardó antes, igual que `dismissedBridges` y `patternAnswers` (`:158-165`).
    Los **tres estados del criterio 296** salen de ahí sin inventar nada:
    *sin confirmar* = hay noche planeada ese día y **no hay entrada**;
    *confirmado* = hay entrada; *sin dato* = hay entrada con alguna hora en
    `null` (303, 305).
17. `src/features/vida/components/VidaNightPrompt/` — **nuevo**, molde
    `VidaGoalPrompt`, montado en `VidaHoyPage.tsx` junto al otro (`:1340`).
    Criterios 288-290, y **solo en el día de hoy** (289, 307).
18. `src/features/vida/components/VidaNightSheet/` — **nuevo** («¿Cómo
    dormiste?»), molde `VidaStartTimeSheet` carácter a carácter. Dos `Input
    type="time"`, «No sé a qué hora» (303), la duración y la diferencia en
    palabras neutras (292, 316), y el aviso de que se queda en este aparato
    (299). Criterios 291-293, 298, 303.
19. `useVidaDayWindow.ts` (tajada 4) — el sueño **confirmado** manda sobre la
    hora de levantarse (300, 301); **lo no confirmado no se usa** (302, D4); sin
    dato, cae a lo planeado y se dice (304).

### Lo que NO hay que crear

- **Nada en `xavi-platform-node`.** Ni migración, ni campo, ni mutación, ni
  resolver. Está hecho y desplegado. (Si alguien abre ese repo para esta feature,
  se ha equivocado de tarea.)
- **Ninguna consulta ni clave de caché nueva** (318): la noche sale de
  `mySettings`, que Vida ya pide.
- **Ninguna clave de `localStorage` nueva** (299).
- **Ningún componente nuevo de «siete botones de día»** (ya hay cinco).
- **Ninguna guarda en `src/app/providers/query-cache-guards.ts` ni ninguna
  entrada en `SIN_GUARDA_A_PROPOSITO`.** La regla de la casa — lleva guarda lo
  que **tumba** una pantalla, no lo que la **vacía** — deja esto fuera, y el
  archivo ya lo dice con este caso concreto (`:56-59`: `settingsKeys.my()` no
  lleva guarda porque se lee con `?.` y cae a su respaldo). Además el test de
  cobertura recorre **`vidaKeys`**, y aquí no aparece ninguna clave de `vidaKeys`
  nueva: **no se pondrá rojo**. La condición para que eso siga siendo cierto es
  que `useVidaNight` lea con `?.` y degrade a `null`, como hace `useVidaDayHours`.
- **Ninguna entrada nueva en la lista de `contracts.test.ts`**: los dos
  documentos de ajustes ya están (`:109-110`).
- **Ninguna cuenta atrás nueva** (D7): el presupuesto es el que ya existe.
- **Ninguna entrada nueva en `buildDayAgenda`**: la noche no es un bloque ni un
  hueco (272, 284).

### Dónde NO va

- **En `src/features/vida/utils/vida-time.utils.ts`** — criterio 287, y además
  FEAT-008 lo está editando. La noche tiene su archivo.
- **En `vida-window.utils.ts`** — es el calendario de planeación, no las horas.
- **Dentro de `useVidaDayHours`** — lo llaman siete sitios y dos no tienen fecha
  (`VidaModuleLayout.tsx:53`, `VidaTemplateAside.tsx:246`). Meter ahí la
  dependencia del día convertiría un lector de ajustes en un hook con parámetro
  obligatorio y rompería a todos.
- **Como un `VidaItem` o un `ActivityDayPlanItem`** — es la propuesta B,
  descartada; exigiría que los bloques cruzaran la medianoche.
- **En `/app/settings`** — eso es la cuenta. La sección va en `/app/vida/ajustes`.
- **En el API como `VidaNightLog`** — D8. El sueño real se queda en el aparato.

### Trampas que ya han mordido aquí

1. **`contracts.test.ts` se pondrá rojo** en cuanto los documentos pidan los tres
   campos y **hasta que se recopie el SDL vendorizado**. No es un fallo del
   documento: es el aviso de que falta el paso 3. La lista de nombres **no** hay
   que editarla esta vez.
2. **`vidaNightDays: []` lo rechaza el servidor** (`.min(1)`): se manda `null`.
3. **La igualdad de horas no la valida nadie más que tú** (criterio 263).
4. **Los tres campos son propiedades obligatorias de `UserSettings`** (aunque su
   valor sea `null`): hay **16 sitios en 7 archivos de test** que construyen ese
   objeto (`useVidaDayHours.test.tsx`, `VidaAjustesPage.test.tsx`,
   `VidaSemanaPage.test.tsx`, `VidaPlantillaPage.test.tsx`,
   `VidaRevisionPage.test.tsx`, `VidaHoyPage.test.tsx` —la `SETTINGS` de
   `:314`— y `contracts.test.ts`). `pnpm typecheck` los caza a todos de golpe:
   córrelo **antes** de tocar pantallas.
5. **`vi.mock` de `useActivityCategories`**: `VidaAjustesPage.test.tsx` y
   `VidaPlantillaPage.test.tsx` lo mockean por módulo y siguen verdes por
   casualidad cuando ese módulo cambia de forma. Al añadir la sección de la
   noche a esa página, **mira esos mocks aunque estén en verde**.
6. **El invalidador por forma se disparará solo** al tocar
   `user-settings.graphql.ts`: la regla 1 de `vite/cache-shape.ts` coge cualquier
   `graphql/*.graphql.ts`, el `buster` cambia y **todo el mundo pierde la caché
   persistida una vez** al abrir la app. Es benigno y aquí es **deseado**: es lo
   que evita que un `UserSettings` viejo sin campos de noche se rehidrate. Y como
   el API **ya está desplegado**, no hay ventana de despliegue: no existe el caso
   de «el front pide un campo que el servidor no sirve» que tumbó Hoy el 23.
7. **`invalidateFollowUpQueries` invalida clave por clave, no por prefijo**
   (`src/features/vida/utils/invalidate-vida-queries.ts:23`). Aquí no hace falta
   tocarlo porque **no hay clave nueva**; si alguna tajada acaba creando una,
   hay que nombrarla ahí a mano o no se refrescará.
8. **`minutesToTime` recorta a 23:59** y `calculateEndTime` no hace `% 24`
   (`vida-time.utils.ts:49` y `:79`). Usarlas para la noche devuelve 23:59 **sin
   avisar**. Es el defecto original de esta feature: no lo repitas al arreglarlo.
9. **El CSS del build es una puerta**: línea base **277,96 kB**. Un `.module.scss`
   nuevo tiene que **subirla**. Si baja, busca un comentario de bloque sin cerrar
   antes de seguir.
10. **Nada de `/app/*` se puede ver sin sesión**: las franjas y la hoja se
    verifican con tests y arnés, y el recorrido real lo hace el usuario
    (criterio 319).

### Sobre el corte de las tajadas

**Siguen siendo cuatro y en el mismo orden**, con dos cambios y sus razones:

- **Ninguna tajada está bloqueada.** La tajada 1 deja de estar «bloqueada por el
  API»: el despliegue ya ocurrió. Y **ninguna tajada necesita un despliegue del
  usuario para poder verse**, así que no hay que separar lectura de escritura
  como en FEAT-019: las cuatro son de front y se cierran con `pnpm test` + el
  paso a mano del usuario.
- **El criterio 277 se mueve de la tajada 1 a la tajada 2.** Es la cabecera «Tu
  día · 5:00 → 23:00 · duermes 6 h» de la plantilla, o sea **la ventana derivada
  de la noche**, que es justo lo que define la tajada 2 (criterio 279). Dejarlo
  en la 1 obliga a construir la derivación dos veces —una para la cabecera y otra
  para todo lo demás— y, peor, **choca con el criterio 273**: si la ventana de la
  plantilla pasa de 06:30–23:00 a 5:00–23:00, el «de 17h» del presupuesto cambia
  de número, y el 273 exige que la cifra sea «exactamente la misma con noche y
  sin ella». Con el 277 en la tajada 2, la tajada 1 es **puramente aditiva**: la
  ventana no se mueve, el 273 se cumple solo y las franjas se pueden pintar y
  revisar sin tocar ninguna cuenta.
  **Queda una ambigüedad que no me toca resolver y que aviso:** a partir de la
  tajada 2, con la ventana saliendo de la noche, el **denominador** del
  presupuesto sí cambia (es el tamaño de la ventana) aunque los minutos de sueño
  no se cuenten nunca como puestos ni como libres. La parte del 273 que se puede
  afirmar en test **siempre** es `plannedMinutes` / «2h puestas»; el «de 17h» es
  la ventana. Si el usuario quería literalmente el mismo denominador, eso
  contradice el 277/279 y hay que decidirlo antes de la tajada 2.

**Tajadas, con rutas:**

| # | Qué hace | Archivos | Criterios que cierra | Estado |
|---|---|---|---|---|
| 1 | **Tu noche existe y se ve en la plantilla.** Los tres campos en la capa de datos, `useVidaNight`, la aritmética pura, la sección «Tu noche» en Ajustes y las dos franjas en la plantilla — sin mover ninguna ventana ni ninguna cuenta. | `settings/types/user-settings.types.ts`, `settings/graphql/user-settings.graphql.ts`, `settings/graphql/schema/user-settings.schema.graphql` (recopiar), **nuevos** `vida/utils/vida-night.utils.ts`(+test), `vida/hooks/useVidaNight.ts`(+test), `vida/components/VidaNightBand/`; `vida/pages/VidaAjustesPage.tsx`(+`.module.scss`,+test), `vida/pages/VidaPlantillaPage.tsx:506`, `app/styles/_theme-variables.scss:155,239` | 260–268 y 270–276 (el 269 pasa a la tajada 2); y de los transversales 310, 311, 312, 313, 314, 315, 316, 317, 318 en lo que aplique a Ajustes y a la plantilla | **aceptada** (2026-09-23; 313, 314 y 315 medidos por el revisor) |
| 2 | **Hoy cuenta bien.** La ventana del día sale de la noche, en Hoy, en la plantilla y en la revisión; las franjas en Hoy; huecos y presupuesto ciertos. | **nuevo** `vida/hooks/useVidaDayWindow.ts`(+test); `vida/pages/VidaHoyPage.tsx:331-337,397,429,436-437,551-554,578,1261,1296-1297,1418-1419`, `vida/pages/VidaRevisionPage.tsx`, `vida/components/VidaDayBudget/VidaDayBudget.tsx:108,210`, `vida/components/VidaTemplateDaySummary/VidaTemplateDaySummary.tsx:99`, `vida/routes/VidaModuleLayout.tsx:53,162` | 269 y 277 (movidos de la 1), 278–287 | pendiente |
| 3 | **Lo real encima de lo planeado.** La pregunta de la mañana, «Sí, así fue» en un toque, la hoja «¿Cómo dormiste?» y «sin confirmar» si se ignora. | `vida/store/vida-device-notes.store.ts:154-221`, **nuevos** `vida/components/VidaNightPrompt/`, `vida/components/VidaNightSheet/`; `vida/pages/VidaHoyPage.tsx:1340` y el montaje de la hoja; `vida/components/VidaNightBand/` (estado confirmado) | 288–299 | pendiente |
| 4 | **Lo real manda y lo que no se sabe se dice.** La ventana desde la hora real, «No sé a qué hora» → sin dato, y los días pasados confirmables. | `vida/hooks/useVidaDayWindow.ts`, `vida/utils/vida-night.utils.ts`, `vida/components/VidaNightSheet/`, `vida/components/VidaNightBand/`, `vida/pages/VidaHoyPage.tsx`, `vida/pages/VidaRevisionPage.tsx` | 300–309 | pendiente |

**Dos decisiones pequeñas que dejo recomendadas, no cerradas** (no están en los
criterios y no son mías de cerrar):

- **Cuándo deja de preguntar la mañana.** El criterio 288 dice «una vez al día» y
  el 295 dice que ignorarla es válido. Recomiendo: la pregunta se pinta mientras
  el día mirado es **hoy** y no hay sueño guardado, sin más puerta que ésa —así
  «ignorar» significa literalmente no tocarla, y no hace falta ningún campo de
  «descartada» en el store. Si el usuario la quiere callada a partir de una hora,
  es un `if` en `VidaNightPrompt` y no cambia ningún dato.
- **El aviso de sesión vieja** (`VidaModuleLayout.tsx:162`) usa hoy
  `vidaDayEndTime`. Recomiendo pasarle la ventana de hoy en la tajada 2 (D1).

## 3. Construcción — feature-builder

### Tajada 1 — Tu noche existe y se ve en la plantilla

**Resumen para el revisor:**
1. Los tres campos de la noche viajan ya en `mySettings`, hay una sección **«Tu
   noche»** en `/app/vida/ajustes` (dos horas + siete noches, guardadas con
   `updateMySettings`) y la plantilla pinta **dos franjas**, arriba y abajo,
   fuera de la lista y fuera de toda cuenta.
2. Todo lo nuevo vive en archivos nuevos (`vida-night.utils.ts`,
   `useVidaNight.ts`, `VidaNightBand/`) más tres archivos de `features/settings`
   y dos páginas de Vida. **`vida-time.utils.ts` no se ha tocado.**
3. **Lo que más probablemente he roto:** el **`buster` de la caché persistida**.
   Al tocar `src/features/settings/graphql/user-settings.graphql.ts` la regla 1
   de `vite/cache-shape.ts` cambia el identificador y **todo el mundo pierde la
   caché persistida una vez** al abrir la app. El arquitecto lo daba por
   deseado (trampa 6) y lo confirmo, pero es el efecto de mayor alcance de la
   tajada y es lo primero que hay que mirar. Lo segundo: **la sección nueva
   añade un segundo `role="group"` a la página de ajustes**, y eso ya rompió una
   aserción de FEAT-019 que contaba grupos sin nombrarlos (la he acotado, no
   borrado). Lo tercero: `VidaPlantillaPage` monta un hook más, y aunque no
   estrena consulta, cualquier suite que cuente hooks de consulta lo notará.

**Qué se construyó**

*Capa de datos (los tres campos, sin mutación ni consulta ni clave nuevas)*

- `src/features/settings/types/user-settings.types.ts` — `vidaNightBedTime`,
  `vidaNightWakeTime` (`string | null`) y `vidaNightDays` (`string[] | null`)
  en `UserSettings`, y los tres opcionales en `UpdateUserSettingsInput`. El
  comentario dice las dos cosas que se olvidan: que despertarse antes de
  acostarse es legal y que `[]` lo rechaza el servidor.
- `src/features/settings/graphql/user-settings.graphql.ts` — los tres campos en
  **las dos** selecciones. Ningún documento nuevo.
- `src/features/settings/graphql/schema/user-settings.schema.graphql` —
  **recopiado entero** desde `xavi-platform-node` (commit `73e3c44`), con la
  cabecera actualizada. `contracts.test.ts` pasa sin tocar su lista.
- `src/features/vida/hooks/useVidaNight.ts` (+ `useVidaNight.test.tsx`, 11
  casos) — envoltorio de lectura sobre `useUserSettingsQuery`, calcado de
  `useVidaDayHours`. Lee con `?.`, degrada a `null` y **no aplica
  `isEndAfterStart`**.

*Aritmética pura*

- `src/features/vida/utils/vida-night.utils.ts` (+ test, 24 casos) —
  `crossesMidnight`, `nightDurationMinutes` (→ `null`, nunca `0`),
  `formatNightDuration` (→ `«—»` sin dato), `describeNightKind`,
  `nightStartingOn(Weekday)`, `nightEndingOn(Weekday)`,
  **`nightBandsForWeekday`**, `nightWindowForDate`, `diffToPlannedMinutes`,
  `describeDiffToPlanned`, `describeNightDays`, `normalizeNightDays`.
  Minutos absolutos, sin `minutesToTime` ni `calculateEndTime`.

*Ajustes*

- `src/features/vida/pages/VidaAjustesPage.tsx` — `nightSection()`, hermana de
  `goalsSection()`, montada entre «Tu día» y las metas. **Reutiliza
  `styles.days/.day/.dayOn`** y `VIDA_DAY_ORDER/LABELS/SHORT_LABELS`: no hay
  sexta copia de la fila de siete botones.
- `src/features/vida/pages/VidaAjustesPage.module.scss` — solo `.nightRead`,
  `.nightDuration` y `.nightDays`.
- `src/features/vida/pages/VidaAjustesPage.test.tsx` — 16 casos nuevos.

*Franjas*

- `src/features/vida/components/VidaNightBand/` — `.tsx`, `.module.scss`,
  `index.ts`, `.test.tsx` (7 casos).
- `src/app/styles/_theme-variables.scss` — `--aura-night-dusk-bg`,
  `--aura-night-dawn-bg`, `--aura-night-border` y `--aura-night-text` en
  `[data-ds='aura']` **y** en el bloque oscuro.
- `src/features/vida/pages/VidaPlantillaPage.tsx` — `useVidaNight()` +
  `nightBandsForWeekday`, y las dos franjas **fuera** del `<ol>` de la agenda y
  fuera de la tarjeta del día vacío.
- `src/features/vida/pages/VidaPlantillaPage.test.tsx` — 8 casos nuevos.

*Arrastre inevitable*

- Los tres campos son obligatorios en `UserSettings`: se añadieron a las
  fixtures de `useVidaDayHours.test.tsx`, `VidaAjustesPage.test.tsx` y
  `VidaHoyPage.test.tsx` (las otras cuatro suites usan objetos con `as unknown
  as UserSettings` y no se enteran).

**Por qué así, y qué se descartó**

- **Dos instancias de `useUpdateUserSettingsMutation`**, una para «Tu día» y
  otra para «Tu noche». No es una mutación nueva: `useMutation` da un estado por
  llamada, y compartir una sola haría que un fallo al guardar la noche pintara
  un error en «Tu día» (criterio 267). *Consecuencia para el revisor:* en los
  tests el `vi.mock` devuelve **el mismo objeto** a las dos llamadas, así que
  ahí sí se comportan como una; en producción no.
- **Un botón «Guardar mi noche», no un guardado por toque.** Las metas guardan
  al tocar un día porque cada meta es independiente; aquí los tres campos viajan
  en la misma mutación y el toque suelto mandaría una noche a medias. Es la
  misma forma que «Tu día», justo encima.
- **`nightBandsForWeekday` en el `utils` y no en la página.** La regla del
  criterio 276 —una noche que no cruza **no anuncia nada abajo**— tiene que
  decir lo mismo en la plantilla, en Hoy y en la revisión. La alternativa (un
  `if` en cada página) es la que produce tres verdades distintas.
- **La franja va por día de la semana, no por fecha.** La plantilla es una
  semana tipo y no tiene fechas; Hoy sacará el día con `getVidaDayOfWeek`. Las
  variantes por fecha existen igualmente y delegan.
- **Descartado: un componente `VidaDayPicker` compartido.** Lo prohíbe la
  sección 2 y sigue siendo deuda a propósito.

**Desvíos de lo que dejó escrito el arquitecto** (ninguno de fondo, los dos de
forma):

1. **`nightBandsForWeekday` no estaba en la lista de funciones.** Salió de un
   test en rojo: con `1:00 → 6:40` la página pintaba **dos** franjas, porque
   «la noche que empieza este día» es cierta y la de abajo no debería existir.
   La regla estaba en `nightWindowForDate` pero no en la selección de franjas.
2. **`VidaNightBand` recibe `day: VidaDayOfWeek`, no `date: string`.** Con
   `date` la plantilla no podía montarla: no tiene fechas.

**Verificación**

| Qué | Antes (línea base) | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos (`SteppedModal`, `Tabs`, `toast.context`, `test/render`). Ninguno mío. |
| `pnpm test` | 2 fallos de 2074 | **2 fallos de 2141** (`SearchSelect` ×2, preexistentes). +67 tests, todos verdes. |
| `pnpm build` — chunk | 1.141,22 kB | **1.148,03 kB** (+6,81) |
| `pnpm build` — CSS | 277,96 kB | **279,35 kB** (+1,39 — sube, que es lo que tiene que hacer un `.module.scss` nuevo) |

**Un test que se puso rojo y era un aviso de verdad:**
`vite/cache-shape.test.ts > recoge los documentos y la capa api de verdad` pasó
a 33 fuentes en vez de 32. La causa no era una consulta nueva: un **comentario**
mío en `VidaAjustesPage.tsx` mencionaba `setQueryData` literalmente, la regla 2
mira texto y metió **una página** en el conjunto de la forma de la caché — a
partir de ahí, cada retoque cosmético de esa página habría caducado la caché de
todo el mundo en silencio. Reescrito el comentario; el test vuelve a 32 y a
`ningún /pages/`. **No se tocó el test ni el umbral.**

**Sobre las guardas de caché** (lo que pedía la nota del encargo): esta tajada
**no añade ninguna consulta persistida ni ninguna clave de `vidaKeys`**, así que
el test de cobertura de `src/app/providers/query-cache-guards.ts` **no se puso
rojo** y no hay nada que decidir. La condición que lo sostiene está escrita en
la cabecera de `useVidaNight`: lee con `?.` y degrada a `null`, así que un
`UserSettings` viejo rehidratado **vacía** la noche, no **tumba** ninguna
pantalla. Lo que sí cambia es el `buster` (ver el resumen, punto 3).

**Comprobación del SCSS por lista de selectores** (no por tamaño), como manda
`ENVIRONMENT.md`:

```
HEAD=20 ARBOL=23   (VidaAjustesPage.module.scss)
> .nightDays
> .nightDuration
> .nightRead
```

Nada perdido; tres reglas añadidas. Y en el CSS compilado del build aparecen los
ocho tokens, cuatro por tema:

```
--aura-night-dusk-bg:linear-gradient(135deg, #4f46e524, #7c3aed1a)   claro
--aura-night-text:#3730a3                                            claro
--aura-night-dusk-bg:linear-gradient(135deg, #6366f138, #7c3aed29)   oscuro
--aura-night-text:#c7d2fe                                            oscuro
_band_ylpbg_9{border:1px solid var(--aura-night-border);background:var(--aura-night-dusk-bg);…}
```

**Criterios, uno por uno**

| # | Estado | Evidencia |
|---|---|---|
| 260 | cumplido | `VidaAjustesPage.test.tsx` → «son tres cosas y ninguna más»: hay `heading «Tu noche»`, dos `input[type=time]` y un `group «Qué noches»`; cero `textbox`, `switch` y `spinbutton`. |
| 261 | cumplido | Con `23:00 / 5:00` se lee «6 h» y «Cruza la medianoche, y eso está bien: la noche del martes es la madrugada del miércoles.»; con `1:00 / 6:40`, «5 h 40» y «Esta noche no cruza la medianoche: empieza y acaba el mismo día.» Dos tests con esos pares exactos. |
| 262 | cumplido | `23:00 / 5:00` llega a `mutate` con los tres campos, sin `alert` y sin `aria-invalid` en ninguno de los dos campos. No hay ninguna llamada a `isEndAfterStart` en la sección. |
| 263 | cumplido | Con la misma hora, `mutate` **no se llama**, sale un `role="alert"` y los dos campos quedan con `aria-invalid="true"`. Es del cliente: el servidor no lo mira. |
| 264 | cumplido | Siete botones en el grupo, «V» para el viernes, y la pantalla dice literalmente «marcar «viernes» es la noche del viernes al sábado». Cada botón se nombra «La noche del \<día\>». |
| 265 | cumplido | Desmarcando la última noche, el cuerpo sale con `vidaNightDays: null` — **nunca `[]`**. |
| 266 | cumplido | Espía sobre el cuerpo: `Object.keys(body).sort()` es exactamente `['vidaNightBedTime','vidaNightDays','vidaNightWakeTime']`. Y con la noche guardada en `mySettings`, al montar la página se ven las dos horas y los días marcados. |
| 267 | cumplido | Con `isError`, se lee «No pudimos guardar tu noche… lo que pusiste sigue aquí y tu noche de antes sigue vigente», y los dos campos conservan lo escrito. |
| 268 | cumplido | Con los tres nulos: campos vacíos (`toHaveValue('')`), texto de invitación, **cero `alert`** y los siete botones en `aria-pressed="false"`. Ninguna hora propuesta. |
| 269 | **cumplido con una salvedad que hay que leer** | La línea existe y dice «Manda tu noche: los días que marques, el día empezará y acabará donde diga ella». **Está en futuro a propósito: la derivación de la ventana es la tajada 2** (criterio 279). Hasta que esa tajada entre, la frase describe la decisión D1, no lo que la app ya hace. Si al revisor le parece que eso es afirmar lo que no se sabe, la corrección natural es moverla a la tajada 2 junto con el 277 —no reescribir el criterio—. |
| 270 | cumplido | «Quitar mi noche» manda los tres a `null`. El botón solo aparece si hay noche guardada. |
| 271 | cumplido | En la plantilla, viernes con noche `23:00 → 5:00` marcada jueves y viernes: arriba «Duermes hasta las 5:00 / Vienes de anoche · 6 h», abajo «23:00 · te acuestas / Duermes 6 h y te levantas el sábado a las 5:00». |
| 272 | cumplido | Test: ninguna franja está dentro del `<ol>` de la agenda (`agenda.contains(band) === false`), ninguna tiene `<li>` antecesor, ni `<button>`, ni `<time>`; y el recuento de filas de la lista sigue siendo **1**. |
| 273 | cumplido | Mismo día, mismos ítems, con noche y sin noche: «puestas de …» y «1h 30» son **la misma cadena**, comparada literal. Y con noche las dos franjas están pintadas, así que la cifra no cambia *aunque* se pinten. |
| 274 | **cumplido en lo comprobable aquí** | Los cuatro tokens existen en los dos temas y `_band_` los usa (ver el CSS compilado arriba). El test del componente afirma lo que el DOM puede afirmar: **ningún `style` en línea**. El contraste real en pantalla va con el 315, abajo. |
| 275 | cumplido | Noche marcada solo el lunes, día abierto viernes: **cero** elementos `[data-variant]`. Ni vacía ni con texto de relleno. |
| 276 | cumplido | Con `1:00 → 6:40` el viernes: **una sola** franja, arriba, que dice «Duermes hasta las 6:40» y **no** dice «Vienes de anoche»; `[data-variant="dusk"]` no existe. Y en el `utils`, `nightBandsForWeekday` lo afirma para los tres días. |
| 277 | — | **Movido a la tajada 2** por la sección 2. No construido aquí. |
| 310 | cumplido | Sin noche configurada: cero franjas en la plantilla y el resto de la pantalla idéntico (las 75 aserciones previas de esa suite siguen verdes sin tocarse). |
| 311 | cumplido | Con `mySettings` en vuelo: ninguna franja en la plantilla y ninguna sección «Tu noche» en ajustes. |
| 312 | cumplido | Con error: en ajustes se lee «No pudimos cargar tu noche» con «Reintentar», **no** se pintan los campos y **no** se dice «no tienes noche». |
| 313 | **pendiente de prueba manual** | Hay test de que una noche de 12 h y otra de 3 h se dicen enteras, y el CSS no tiene anchos fijos ni `white-space: nowrap` (`min-width: 0` + `overflow-wrap: anywhere` + `grid 1fr`). **Pero no está medido**: ver «lo que no pude comprobar». |
| 314 | **pendiente de prueba manual** | Igual: no medido. |
| 315 | **pendiente de prueba manual** | Los tokens oscuros existen y son distintos (`#c7d2fe` sobre `#6366f138`), pero el contraste real no está medido. |
| 316 | cumplido | Barrido literal sobre el texto pintado de las tres franjas y de la sección de ajustes: ni «poco», ni «mal», ni «deberías», ni «apenas», ni «desperdicio», ni «tarde», ni «¿por qué». |
| 317 | cumplido | `formatNightDuration(null)` → «—»; `nightDurationMinutes` devuelve `null` con una hora que falta, con una rota y con las dos iguales. Ninguna cifra sale de una hora inventada. |
| 318 | cumplido | Espía de hooks de consulta en la plantilla: el conjunto sigue siendo `{vidaItems, userSettings, activities, vidaPatterns}`. `useVidaNight` es un segundo llamante de `useUserSettingsQuery`, misma clave. |
| 319 | **del usuario** | Con la API desplegada: guardar la noche y verla al volver a entrar, y verla en la plantilla a 375 px y en oscuro. Pasos abajo. |

**Lo que no pude comprobar, y por qué** (criterios 313, 314 y 315)

`/app/*` está detrás de un login en el que no entro. Monté el arnés que manda
`ENVIRONMENT.md` (`public/__harness-night.html` + `src/__harness/night.tsx`,
cuatro franjas con el caso largo `20:05 → 08:55`) y **el panel del navegador no
me dejó abrir ninguna pestaña**: «Tab cap reached», y las abiertas no son mías
para cerrarlas. **El arnés está borrado** (`rm -rf src/__harness
public/__harness-night.html`, comprobado con `git status`) y no queda nada
sembrado.

Así que 313, 314 y 315 **no se marcan cumplidos**: quedan pendientes de medida,
y no los sustituyo por el razonamiento sobre el CSS. Quien los cierre:

1. `/app/vida/ajustes` → poner `20:05` / `08:55`, marcar las siete noches,
   guardar.
2. `/app/vida/plantilla`, en un día marcado. A **375 px** y a **760 px**
   (dentro de un `iframe` del ancho exacto que **no** cuelgue de un contenedor
   `flex`, que lo encoge):
   `document.documentElement.scrollWidth === clientWidth` y cero nodos
   desbordados; la palabra clave de cada franja («Duermes hasta las 8:55»,
   «20:05 · te acuestas») entera y sin cortar.
3. Cambiar a tema oscuro y volver a mirar las dos franjas: el fondo y el texto
   tienen que cambiar y leerse.
4. Y el 319 entero: guardar, salir, volver y ver lo guardado; poner
   `23:00 / 5:00`; poner `1:00 / 6:40` y comprobar que ese día pinta **una sola**
   franja, arriba.

**Riesgos**

- **El `buster` de la caché.** Explicado en el resumen. Todo el mundo pierde una
  vez la caché persistida al abrir la app tras desplegar. Es lo que evita
  rehidratar un `UserSettings` sin campos de noche, y el API ya está desplegado,
  así que no existe la ventana de «el front pide un campo que el servidor no
  sirve».
- **La aserción de FEAT-019 que conté grupos.** La acoté a `group «Días de …»`
  en vez de contar todos; si el revisor cree que eso afloja el criterio 582, la
  alternativa es que la fila de la noche no lleve `role="group"`, y entonces
  pierde su nombre accesible.
- **Los `vi.mock` de `useActivityCategories`** (trampa 5): los miré en las dos
  suites. No cambiaron de forma en esta tajada, siguen completos y verdes, y no
  toqué ese módulo.
- **`VidaPlantillaPage` monta un hook más.** No estrena consulta, pero cualquier
  suite futura que cuente montajes lo verá.
- **Lo que NO toqué y conviene confirmar de un vistazo:** `vida-time.utils.ts`
  (criterio 287) — `git status` no lo lista.

**Lo que descubrí y no estaba en el plan** (anotado, no tocado)

- **La regla 2 de `vite/cache-shape.ts` se dispara con comentarios.** Un
  `setQueryData` escrito en prosa dentro de un `.tsx` de `pages/` mete esa
  página en la forma de la caché. Hoy lo caza el total fijado en el test, pero
  lo caza **después** de haberlo hecho, y el mensaje («33 en vez de 32») no dice
  quién entró. Un `expect(...).not.toContain('/pages/')` **antes** del total
  daría el nombre. Fuera del alcance de esta tajada.
- **`useVidaDayHours` descarta con `isEndAfterStart`** una ventana `23:00 →
  06:30` y cae al respaldo 06:30/23:00 diciéndolo. A partir de la tajada 2, con
  la ventana saliendo de la noche, ese descarte y la noche que cruza conviven en
  la misma pantalla: no es un choque hoy, pero hay que mirarlo al escribir
  `useVidaDayWindow`.
- **La ambigüedad del denominador del presupuesto** que dejó avisada la sección
  2 (criterio 273 frente a 277/279) **sigue abierta** y es del usuario. Esta
  tajada no la toca: aquí la ventana no se mueve.

**Estado del árbol:** sin commitear.

## 4. Revisión — feature-reviewer

### Tajada 1 — Tu noche existe y se ve en la plantilla

**Veredicto: aceptada**, con el criterio **269 movido a la tajada 2** (junto al
277) y cuatro hallazgos anotados abajo. Los tres criterios que el constructor
dejó pendientes de medida —**313, 314 y 315**— los he medido yo y **pasan**.

**Criterios, uno por uno** (contra la sección 1, no contra el resumen)

| # | Veredicto | Cómo lo comprobé |
|---|---|---|
| 260–268, 270 | cumplidos | Montados de verdad, no leídos: arnés temporal (`public/__rev-night.html` + `src/__rev/night.tsx`, ya borrados) con la **`VidaAjustesPage` real** dentro de `QueryClientProvider` + `AuthBootstrapProvider` + `ToastProvider`, sembrando `settingsKeys.my()` con `20:05 / 08:55` y las siete noches. En pantalla: «Tu noche», los **dos** `input[type=time]` con lo sembrado, «Son 12 h 50 de sueño», «Cruza la medianoche…», un único `role="group"` «Qué noches» con **siete** botones y la frase «marcar «viernes» es la noche del viernes al sábado». Lo que no se ve en un render —el cuerpo exacto de la mutación (266), el fallo al guardar (267), vaciar la noche (270)— queda respaldado por los tests de la suite, que he corrido enteros. |
| **269** | **no cumplido aquí — movido a la tajada 2** | La línea dice «los días que marques, el día empezará y acabará donde diga ella», y hoy **no lo hace**: `VidaPlantillaPage` sigue calculando con `dayHours.startTime/endTime` y la ventana derivada es la tajada 2. La regla del módulo es que nada afirme lo que no sabe, y una promesa en futuro sobre el propio producto es una afirmación. Acepto la salida que propuso el constructor: **el criterio viaja a la tajada 2**, con el 277, y se cierra cuando la frase sea cierta. No reescribo el criterio. |
| 271, 272, 274, 275, 276 | cumplidos | Las cuatro franjas montadas en el arnés (`dawn`/`dusk`, `20:05 → 08:55` y `1:00 → 4:00`) dan exactamente los textos del render. `nightBandsForWeekday` la interrogué yo con ocho casos sembrados a mano, desde el iframe, importando el módulo real: cruza marcada jueves → jueves `dusk`, viernes `dawn`; **no cruza** `1:00 → 6:40` marcada viernes → viernes **solo `dawn`**, sábado **ninguna**; `days: []` → ninguna; `night: null` → ninguna; todas marcadas → las dos. Colocación fuera del `<ol>`: se lee en `VidaPlantillaPage.tsx:503` y `:580`, fuera de la agenda y fuera de la tarjeta del día vacío. |
| **273** | cumplido | No por su test: por el flujo del dato. `buildTemplateDay({ items, day, dayStart, dayEnd })` y `buildTemplateGuidance(templateDay, dayLabel)` (`VidaPlantillaPage.tsx:405-426`) **no reciben la noche**, y `nightState` no aparece en ninguna otra línea de la página (`nightState` → `usableNight` → `nightBandsForWeekday` → las dos franjas, y nada más). La cifra «puestas de …» es la misma cadena con noche y sin ella porque la noche **no es una entrada** de la cuenta. *Límite de mi comprobación:* no llegué a sembrar la plantilla entera con ítems en el arnés; lo afirmo por flujo de datos y por la colocación fuera de la lista, no por medición de la cifra en pantalla. |
| 277 | — | Movido a la tajada 2 por la sección 2. Correcto, no construido aquí. |
| 310, 311, 312, 316, 317, 318 | cumplidos | 310/311/312 quedan respaldados por el código que los sostiene y por la suite: `usableNight = isPending || isError ? null : night` (`VidaPlantillaPage.tsx:424`) hace imposible pintar una franja en vuelo o con error. 317 lo verifiqué sembrando: con las dos horas iguales `nightDurationMinutes` → `null` y `formatNightDuration` → «—», nunca «0 h». 318: la noche entra por `useUserSettingsQuery`, la misma clave `settingsKeys.my()` que ya pide `useVidaDayHours` — en el arnés **una sola** siembra alimentó a los dos. |
| **313** | **cumplido (medido)** | Iframes de **375** y **760** px exactos, colgando de un `div` normal (no `flex`, que los encoge). Noche larga `20:05 → 08:55` (12 h 50) y corta `1:00 → 4:00` (3 h): los cuatro textos salen **enteros** —«Duermes hasta las 8:55 · Vienes de anoche · 12 h 50», «20:05 · te acuestas · Duermes 12 h 50 y te levantas el sábado a las 8:55»— y **cero** nodos con `scrollWidth > clientWidth` en los dos anchos: ninguna palabra clave cortada. |
| **314** | **cumplido (medido)** | En los dos iframes: `documentElement.scrollWidth === clientWidth === 375` (y `=== 760`), `body.scrollWidth === 375`, y **cero** nodos que sobresalgan de la caja. Cubre las franjas **y** la sección de Ajustes (la fila de las siete noches ocupa `25→350` px a 375 y `25→735` a 760, **en una sola línea** en los dos anchos: `wrap === 1`). La **hoja** del criterio no existe todavía: es de la tajada 3. |
| **315** | **cumplido (medido)** | Tercer iframe a 375 px con `data-theme="dark"`. El fondo de la franja cambia (`rgba(79,70,229,.1)…` claro → `rgba(99,102,241,.18)…` oscuro) y el texto cambia con él: `rgb(55,48,163)` (#3730a3) en claro → `rgb(199,210,254)` (#c7d2fe) en oscuro. El color de la noche **cambia con el tema**, como pide el criterio. |
| 319 | del usuario | Sigue siendo suyo: `/app/*` está detrás del login. Pasos abajo. |

**Lo que rompí buscando, y cómo busqué**

- **El `buster` de la caché persistida** (el riesgo que el constructor puso el
  primero). Confirmado en `dist/`, con valor: `git worktree` aparte en `HEAD`
  —sin tocar el árbol— y `computeCacheShapeId` de `vite/cache-shape.ts` sobre
  las dos raíces: **HEAD `c354b9032f97` → árbol `f8edc4f3becd`**. Y el paquete
  construido lo lleva literal: `buster:` `` `v${appVersion}-f8edc4f3becd` `` en
  `dist/assets/index-BWoyEfUa.js`. **Sí: al desplegar esto, todo el mundo abre
  una vez en frío.** Las fuentes de la forma siguen siendo **32** (las mismas,
  ni una de más ni de menos) y **ninguna es de `/pages/`**: el comentario que se
  coló y disparó el test está bien corregido.
- **El grafo refleja `HEAD`**, así que para «¿quién dependía de esto?» sirve y
  para «¿duplicó algo?» no: `graphify explain "vida-night.utils…"` no encuentra
  nodo, que es lo esperable en código sin commitear.
- **Suite entera**: `pnpm test` → **2 fallos de 2141**, y los dos son
  `SearchSelect.test.tsx` (preexistentes, línea base). Ninguna suite de
  FEAT-019, 020, 013, 010/2, 021 ni 022 se ha puesto roja. `pnpm lint` → **14
  errores / 0 warnings**, los de siempre. `pnpm build` → chunk **1.148,03 kB** y
  CSS **279,35 kB**, exactamente lo que reportó el constructor (y el mismo hash
  de `index-BWoyEfUa.js`, o sea reproducible). El CSS **sube**, que es lo que
  tiene que hacer un `.module.scss` nuevo: la alarma de `ENVIRONMENT.md` es la
  bajada, y no la hay.
- **La aserción de FEAT-019 que se acotó**: la miré entera. Era `queryAllByRole('group')).toHaveLength(0)` dentro de «sin ninguna meta no se pinta ninguna fila (criterio 582)», y ahora es `queryByRole('group', { name: /^Días de/ })`. **No afloja el criterio**: lo hace más específico y el resto de la prueba (el título «Los días de tus metas» y el botón de meta) sigue igual. Correcto.
- **Quién más usa lo tocado**: `user-settings.graphql.ts` y `user-settings.types.ts` los leen `useUserSettings` y, a través de él, `useVidaDayHours` (y sus suites, que el constructor completó con los tres campos). Los `vi.mock` de `useActivityCategories` (la trampa recurrente) no cambiaron de forma aquí.
- **Lo que convive en la misma pantalla**: en Ajustes, «Tu día» y la sección de metas de FEAT-019 (las vi renderizadas al lado de la noche, intactas); en la plantilla, la cabecera del día, el resumen y la agenda, que no cambian de sitio porque las franjas se pintan fuera.

**Estados que nadie construye**

- **Sin dato / primer día** (310): cubierto y comprobado; con los tres campos
  nulos no hay ni franjas ni horas propuestas.
- **Cargando** (311) y **error** (312): cubiertos en el código y en la suite.
- **Sin permisos**: no aplica — es una app de un solo usuario tras login.
- **Texto largo** (313) y **móvil 375** (314): medidos aquí, pasan. Añado
  **760 px** porque es donde esta semana se escondió un defecto: también pasa.
- **Oscuro** (315): medido, pasa.
- **Lo que queda sin estado** y no es de esta tajada: la **hoja** de «¿Cómo
  dormiste?» (tajada 3) y la ventana derivada (tajada 2).

**¿Duplica algo que ya existía?** No. La fila de siete botones **no** tiene una
sexta copia: la sección de la noche usa `styles.days/.day/.dayOn` y
`VIDA_DAY_ORDER/VIDA_DAY_SHORT_LABELS` de la propia página
(`VidaAjustesPage.tsx:398-411`, los mismos que `:516-529` usa para las metas), y
sigue sin existir `VidaDayPicker`, que es lo que la sección 2 prohibía. Ninguna
consulta, mutación ni clave de caché nuevas; el SDL se recopió, no se inventó.

**Hallazgos (no devuelven la tajada, pero se escriben)**

1. **La guarda de las dos horas iguales vive en el hook, no en la aritmética.**
   `nightBandsForWeekday({bedTime:'03:00',wakeTime:'03:00'}, …)` devuelve una
   franja `dawn` con duración «—» («Duermes hasta las 3:00 · Empezó esta
   madrugada, a la 3:00 · —»). Hoy es inalcanzable porque `useVidaNight`
   descarta las horas iguales antes, y el servidor **no valida** el caso (solo
   hay un comentario que lo afirma). Quien escriba las tajadas 2 y 3 debe seguir
   entrando por `useVidaNight` y no por el `utils` a pelo.
2. **`vite/cache-shape.test.ts` debería nombrar al culpable.** La sugerencia del
   constructor es buena y barata: un `expect(fuentes.filter(f => f.includes('/pages/'))).toEqual([])`
   **antes** de la comparación del total convierte «33 en vez de 32» en «entró
   `VidaAjustesPage.tsx`». Merece la pena —el fallo ya ocurrió una vez esta
   semana— pero **va aparte**, no aquí: es un cambio en la red de FEAT-021 y
   tocarlo dentro de esta tajada mezclaría dos cosas que se revisan distinto.
3. **La frase de Ajustes seguirá en pantalla hasta la tajada 2.** Mover el 269
   no borra la línea: si la tajada 1 se desplegara sola y la 2 tardara, la
   pantalla promete una ventana que la app todavía no deriva. No es motivo para
   devolver —la tajada 2 es la siguiente— pero si el orden cambia, la frase hay
   que ajustarla.
4. **Un ruido de medición que no supe reproducir:** en una lectura intermedia
   del log del build vi otros dos artefactos (CSS 276,96 kB / chunk 1.137,96 kB,
   con hashes distintos). El build final da 279,35 / 1.148,03 con el mismo hash
   que el `dist/` del constructor. Lo dejo anotado por si alguien más estaba
   construyendo sobre el mismo árbol: dos constructores a la vez contaminan la
   medida (`ENVIRONMENT.md` lo avisa).

**Lo que queda para prueba manual del usuario** (criterio 319, y nada más):
todo lo que vive dentro de `/app/*` con sesión real y API real — guardar la
noche y verla al volver, verla en la plantilla, y comprobar que `1:00 → 6:40`
pinta **una sola** franja, arriba.

