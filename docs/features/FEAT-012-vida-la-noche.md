---
id: FEAT-012
title: La noche — dormir deja de ser un agujero y pasa a ser el borde del día
status: delivered
architect: yes
area: features/vida, features/settings, **API (xavi-platform-node)**
requested: 2026-09-22
updated: 2026-09-25
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

  > **SUPERADO EN PARTE por decisión del usuario del 2026-09-24 (tajada 2).**
  > No se borra —se cumplió, se revisó y se aceptó en la tajada 1, donde la
  > ventana no se movía—, pero desde la tajada 2 **el denominador sí cambia**:
  > el usuario contestó «**sí, sale del presupuesto del día**» (D9), así que con
  > noche puesta el día se mide de la hora de levantarse a la de acostarse y el
  > «de 17h» pasa a decir otro número. Lo que **sigue vigente del 273, y es su
  > mitad de fondo**: los minutos de sueño **no son tiempo puesto**. No aparecen
  > como «puesto», ni como «libre», ni como ningún tramo de la barra, y
  > `plannedMinutes` —el «2h puestas»— **es exactamente el mismo** con noche y
  > sin ella. Lo que cambia es contra qué se mide, no qué se cuenta. La parte
  > afirmable en test a partir de aquí es `plannedMinutes`; el «de 17h» es la
  > ventana y la dicta la noche (criterios 277 y 279).
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
| 2 | **Hoy cuenta bien.** Las franjas en Hoy y la ventana del día derivada de la noche: huecos que no ofrecen ratos de sueño y presupuesto que cuenta hasta la hora de acostarse. Criterios 278–287. | **aceptada** (2026-09-24, revisor) |
| 3 | **Lo real encima de lo planeado.** La pregunta de la mañana una vez al día, «Sí, así fue» en un toque, «Fue distinto» con su hoja, y «sin confirmar» si se ignora. Criterios 288–299. | **aceptada** (2026-09-25) |
| 4 | **Lo real manda y lo que no se sabe se dice.** La ventana desde la hora real de levantarse, «No sé a qué hora» → sin dato, y los días pasados confirmables a posteriori. Criterios 300–309. | **aceptada** (2026-09-25, revisor) — **última: la feature queda `delivered`**, con el 319 abierto para el usuario |

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
- **D9 · El presupuesto del día se mide contra la ventana de la noche**
  (**resuelta por el usuario el 2026-09-24**, y era la que bloqueaba la tajada
  2). Sus palabras, literales:

  > «sí, sale del presupuesto del día»

  O sea: **el día se encoge**. Con una noche de 23:00 a 5:00 el día se mide de
  5:00 a 23:00 y el presupuesto se calcula sobre esas **18 horas**, no sobre 24.
  Lo que planeas se mide contra el tiempo que **realmente tienes despierto**.
  Esto resuelve la contradicción que dejaron avisada la sección 2 y la tajada 1:
  el criterio **273 leído literal decía lo contrario** y queda **superado en su
  mitad del denominador** (ver la nota bajo el propio criterio); los criterios
  **277 y 279 mandan**.

  Consecuencia que hay que cuidar, y es la razón de que esto se preguntara: la
  cifra del presupuesto es algo que el usuario **ya conoce y mira a diario**
  («puestas de 16h 30») y **va a cambiar de valor** en cuanto tenga noche
  configurada. Por eso el cambio tiene que poder explicarse mirando la pantalla:
  la línea del horario dice «**Tu día · 5:00 → 23:00 · duermes 6 h**» (criterio
  277) y Ajustes lo dice con palabras antes de que pase. Y **sin noche
  configurada no se mueve nada** respecto de hoy (criterio 310).

  Lo que esta decisión **no** dice: que dormir sea tiempo puesto. No lo es, y no
  aparece en ningún tramo ni en ninguna leyenda (criterio 284). El módulo no
  juzga cuánto duermes.

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
| 2 | **Hoy cuenta bien.** La ventana del día sale de la noche, en Hoy, en la plantilla y en la revisión; las franjas en Hoy; huecos y presupuesto ciertos. | **nuevo** `vida/hooks/useVidaDayWindow.ts`(+test); `vida/pages/VidaHoyPage.tsx:331-337,397,429,436-437,551-554,578,1261,1296-1297,1418-1419`, `vida/pages/VidaRevisionPage.tsx`, `vida/components/VidaDayBudget/VidaDayBudget.tsx:108,210`, `vida/components/VidaTemplateDaySummary/VidaTemplateDaySummary.tsx:99`, `vida/routes/VidaModuleLayout.tsx:53,162` | 269 y 277 (movidos de la 1), 278–287 | **aceptada** (2026-09-24, revisor) |
| 3 | **Lo real encima de lo planeado.** La pregunta de la mañana, «Sí, así fue» en un toque, la hoja «¿Cómo dormiste?» y «sin confirmar» si se ignora. | `vida/store/vida-device-notes.store.ts:154-221`, **nuevos** `vida/components/VidaNightPrompt/`, `vida/components/VidaNightSheet/`; `vida/pages/VidaHoyPage.tsx:1340` y el montaje de la hoja; `vida/components/VidaNightBand/` (estado confirmado) | 288–299 | **aceptada** (2026-09-25) · re-revisada y **aceptada de nuevo** (2026-09-25, segundo revisor): los hallazgos 1 y 2 están cerrados y nada de 288–299 se deshizo |
| 4 | **Lo real manda y lo que no se sabe se dice.** La ventana desde la hora real, «No sé a qué hora» → sin dato, y los días pasados confirmables. | `vida/hooks/useVidaDayWindow.ts`, `vida/utils/vida-night.utils.ts`, `vida/components/VidaNightSheet/`, `vida/components/VidaNightBand/`, `vida/pages/VidaHoyPage.tsx`, `vida/pages/VidaRevisionPage.tsx` | 300–309 | **aceptada** (2026-09-25, revisor) |

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

### Tajada 2 — Hoy cuenta bien: la ventana del día sale de la noche

**Resumen para el revisor:**
1. Con noche puesta, **el día se encoge**: Hoy, la plantilla y la revisión miden
   de la hora de levantarse a la de acostarse. Los huecos ya no ofrecen ratos de
   sueño, el presupuesto cuenta hasta que te acuestas y las dos franjas están
   también en Hoy. Todo entra por un hook nuevo, `useVidaDayWindow`.
2. Lo nuevo es un archivo (`hooks/useVidaDayWindow.ts` + test) y una función en
   `vida-night.utils.ts`; el resto son cambios de una línea en cinco pantallas y
   dos props opcionales en dos componentes de pintar. **`vida-time.utils.ts` no
   se ha tocado** (criterio 287) y **`useVidaDayHours` tampoco**.
3. **Lo que más probablemente he roto: la cifra del presupuesto cambia de valor
   para quien tenga noche configurada.** Es la decisión D9 del usuario y está
   escrita, pero es el efecto de mayor alcance: «puestas de 16h 30» pasa a decir
   «de 18h», y con ello se mueven `dayMinutes`, `freeMinutes`,
   `remainingMinutes`, el semáforo de los arcos de FEAT-019 (que mide contra el
   final del día) y la cifra «de las Xh de tu día» de la revisión. Lo segundo:
   **`VidaModuleLayout` monta ahora `useVidaNight`**, y eso puso 22 pruebas en
   rojo por un `vi.mock` que faltaba —lo he completado, pero cualquier suite que
   monte ese layout suelto necesita el mismo mock—. Lo tercero: la línea de
   Ajustes del criterio 269 **cambió de futuro a presente**.

**Qué se construyó**

*La aritmética que faltaba*

- `src/features/vida/utils/vida-night.utils.ts` — **una función nueva**,
  `nightWindowForWeekday`, y `nightWindowForDate` pasa a delegar en ella. Además
  la ventana se saca ahora de `nightBandsForWeekday`, o sea **de las mismas dos
  franjas que se pintan**: antes `nightWindowForDate` repetía la regla del
  criterio 283 por su cuenta, y dos copias de la misma regla es como se acaba
  pintando una franja abajo y cerrando el día en otro sitio. Nada más cambió en
  ese archivo; sus 24 casos siguen verdes sin tocarse.

*El hook, que es donde vive toda la decisión*

- `src/features/vida/hooks/useVidaDayWindow.ts` (+ test, 13 casos) — **nuevo**.
  `resolveVidaDayWindow(hours, night, day)` es puro y es lo que se prueba;
  encima van `useVidaDayWindow(fecha)` y `useVidaWeekdayWindow(día)`. Devuelve
  **la misma forma que `VidaDayHours`** —por eso `buildDayAgenda`,
  `getDayBudget` y `VidaDayBudget` no se enteran de que existe la noche— más
  `night`, `nightEnding`, `nightStarting`, `startSource`, `endSource`,
  `sleepLabel` y `defaultScheduleNote`.

  Tres guardas, y ninguna es adorno: **en vuelo o con error no hay noche** (286,
  311, 312); **una ventana que no avanza se cae entera a los ajustes** (ver los
  desvíos); y **las franjas y la ventana salen de la misma llamada**, así que lo
  que se pinta y lo que se cuenta no pueden discrepar.

*Las cinco pantallas*

- `src/features/vida/pages/VidaHoyPage.tsx` — `dayWindow` sustituye a
  `dayHours` en los 23 sitios de geometría (agenda, presupuesto, ejecución,
  arcos, guía, marca de «ahora», tarjeta de «lo que viene», armar desde la
  plantilla y la hora de arranque de la hoja). Las **dos franjas** van alrededor
  del `<ol>`, en un fragmento: la de arriba antes, la de abajo después.
  `dayHours` **sigue vivo** y solo alimenta a `useVidaPatterns`, que mira **hoy**
  y no el día abierto.
- `src/features/vida/pages/VidaPlantillaPage.tsx` — `useVidaWeekdayWindow(day)`
  alimenta `buildTemplateDay` y el resumen. `useVidaNight` y
  `nightBandsForWeekday` desaparecen de la página: las franjas salen ya del
  hook. **La cuadrícula de la semana (`buildTemplateWeekGrid`) se queda con
  `dayHours`** a propósito: es una sola escala para los siete días (A5), y siete
  ventanas distintas no se pueden comparar.
- `src/features/vida/pages/VidaRevisionPage.tsx` — la vista de **día** usa la
  ventana del día abierto (285); la de **semana** se queda con `dayHours`, por
  lo mismo que la cuadrícula. Y **qué día se abre** se decide con la ventana de
  **hoy**, no con la del día abierto: si no, habría circularidad.
- `src/features/vida/routes/VidaModuleLayout.tsx` — el aviso de sesión vieja
  recibe el final de **hoy** (la recomendación de la sección 2, D1): dos
  pantallas no pueden decir dos finales de día distintos.
- `src/features/vida/pages/VidaAjustesPage.tsx` — la línea del criterio 269
  pasa a **presente** («tu día empieza cuando te levantas y acaba cuando te
  acuestas»), que es cuando se ha vuelto cierta, y se le añade **una segunda
  línea** que anuncia la consecuencia antes de que ocurra: «Como el día es más
  corto, el tiempo que puedes repartir también».

*Los dos componentes de pintar (props opcionales, nada obligatorio)*

- `VidaDayBudget.tsx` y `VidaTemplateDaySummary.tsx` — `sleepLabel` («duermes
  6 h», criterio 277) y `defaultScheduleNote`. Sin esas props el componente es
  **exactamente** el de antes. Más `.scheduleSleep` en los dos `.module.scss`,
  con el token `--aura-night-text` y su respaldo: ni un color escrito a mano
  (274) y cambia con el tema (315).

**Por qué así, y qué se descartó**

- **Un hook nuevo y `useVidaDayHours` intacto.** Lo llaman siete sitios y dos no
  tienen fecha (`VidaTemplateAside`, `VidaSemanaPage`): meterle la dependencia
  del día habría convertido un lector de ajustes en un hook con parámetro
  obligatorio y roto a todos. Es lo que mandaba la sección 2.
- **No componer la ventana dentro de `useVidaDayData`**, que era lo más corto de
  escribir. Ese hook devuelve `dayHours` **y lo consume `useVidaPatterns`**, que
  mira hoy y no el día abierto: la misma costumbre habría tenido un número
  distinto en cada pantalla. El hook nuevo se monta al lado y `dayHours` se
  queda para lo que de verdad es de los ajustes.
- **La semana no se encoge por día.** Ni la cuadrícula de la plantilla ni las
  filas de la revisión: una sola escala para los siete días. Encogerlas por día
  no lo pide ningún criterio y rompería la comparación, que es su razón de ser.
- **`sleepLabel` es una cadena y no la noche entera.** Los dos componentes son
  de pintar y no llaman hooks (lo dice la sección 2); pasarles `VidaNight` les
  obligaría a saber de aritmética.

**Desvíos de lo que dejó escrito el arquitecto** (dos, los dos de forma)

1. **`source` se partió en `startSource` y `endSource`.** La sección 2 pedía un
   `source: 'night' | 'settings' | 'fallback'`, y **no cabe en uno**: el caso
   del criterio 283 (`1:00 → 6:40`) tiene el inicio en la noche y el final en
   `vidaDayEndTime`. Con un solo campo habría que mentir en uno de los dos
   bordes, y de ahí sale `defaultScheduleNote`: «el final es el horario por
   defecto» en vez de «el horario por defecto», que es lo que pide el 283
   cuando dice «dicho como tal».
2. **Una guarda que no estaba en el plan: la ventana que no avanza.** Con
   configuraciones raras —levantarse a las 23:30 y «Tu día» acabando a las
   23:00, o una noche marcada solo el martes que cierre a la 1:00— la ventana
   compuesta saldría del revés y dejaría la agenda sin geometría. En ese caso
   se cae **entera** a los ajustes, igual que `useVidaDayHours` hace con un dato
   roto, y la noche no mueve nada. Salió de pensar el caso, no de un test en
   rojo; tiene el suyo.

**Verificación**

| Qué | Antes (línea base) | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos. Ninguno mío. |
| `pnpm test` | 2 fallos de 2165 | **2 fallos de 2186** (`SearchSelect` ×2, preexistentes). +21 tests, todos verdes. |
| `pnpm build` — chunk | 1.149,14 kB | **1.150,90 kB** (+1,76) |
| `pnpm build` — CSS | 279,35 kB | **279,51 kB** (+0,16 — **sube**, que es lo que tiene que hacer una regla nueva) |

**Comprobación del SCSS por lista de selectores** (no por tamaño):

```
VidaDayBudget.module.scss          HEAD=18 ARBOL=19   > .scheduleSleep
VidaTemplateDaySummary.module.scss HEAD=14 ARBOL=15   > .scheduleSleep
```

Nada perdido. Y en el CSS del build las dos reglas usan el token, no un color:

```
scheduleSleep_1ov66_241{color:var(--aura-night-text,var(--color-text-secondary))}
scheduleSleep_za1ox_139{color:var(--aura-night-text,var(--color-text-secondary))}
```

**Medido en el navegador** (arnés temporal, ya borrado: `src/__harness/` +
`public/__harness-window.html`, `git status` no los lista). Iframes de **375** y
**760** px exactos colgando de un `div` normal, con el caso largo `8:55 → 20:05`
+ «duermes 12 h 50» + la nota del respaldo + «Cambiarlo»:

| Ancho / tema | `scrollWidth` / `clientWidth` | Nodos desbordados | La línea |
|---|---|---|---|
| 375, claro | 375 / 375 (body 375) | **0** | «Tu día · 5:00 → 23:00 · duermes 6 h» en **una sola línea**; la larga envuelve en tres, sin cortar palabra |
| 760, claro | 760 / 760 | **0** | la larga envuelve en dos |
| 375, oscuro | 375 / 375 | **0** | el color del «duermes …» pasa de `rgb(55,48,163)` a `rgb(199,210,254)` |

**Un aviso que hay que dar en voz alta: el dev server del 5173 estaba apagado**
cuando empecé (la sonda: «APAGADO, nadie escucha»). Arranqué uno propio con
`preview_start {name}` —que cayó en el 5173— solo para el arnés, y lo paro al
terminar. No maté ni reinicié nada del usuario porque no había nada que matar.

**Criterios, uno por uno**

| # | Estado | Evidencia |
|---|---|---|
| 269 | cumplido | La línea ya no promete: dice «los días que marques, **tu día empieza** cuando te levantas y acaba cuando te acuestas», y eso es lo que la app hace desde esta tajada (279). Se le suma la línea que anuncia el cambio de la cifra. |
| 277 | cumplido | `VidaHoyPage.test.tsx`: la línea dice «5:00 → 23:00» y «duermes 6 h». En la plantilla, el mismo test del 273 lo afirma. Y medido en pantalla en los dos anchos. |
| 278 | cumplido | Test: dos franjas, `dawn` primero y `dusk` después, **fuera** del `<ol>` (`agenda.contains(band) === false`), sin `<li>` antecesor y sin `<button>`; y la de arriba precede a la lista y la de abajo la sigue (`compareDocumentPosition`). Mismo componente y mismos textos que en la plantilla. |
| 279 | cumplido | `useVidaDayWindow.test.tsx`: con `23:00 → 5:00` la ventana es `5:00 → 23:00` aunque `vidaDayStartTime/EndTime` digan `06:30 / 22:00`, y **esos dos siguen en `saved`, sin borrar**. |
| 280 | cumplido | Sin noche, `07:00 / 22:00` tal cual y `isDefault: false`; sin ajustes, `06:30 / 23:00` con `isDefault: true` y «el horario por defecto». El criterio 9 de FEAT-003 sigue verde sin tocarse (su test no cambió). |
| 281 | cumplido | Test en el hook (`agenda.gaps[0].startMinutes === 300`, o sea las 5:00, y **ninguno** antes) y en la pantalla: con noche y un bloque a las 9:00, la primera fila de la agenda empieza a las 5:00 y **en ninguna fila aparecen las 6:30**. |
| 282 | cumplido | Con noche `23:00 → 5:00` y `vidaDayEndTime: '22:00'`, el presupuesto dice «hasta las **23:00**» y **no** «hasta las 22:00». No hay cuenta atrás nueva: es la línea de FEAT-003. |
| 283 | cumplido | Con `1:00 → 6:40`: ventana `6:40 → 22:00`, `endSource: 'fallback'`, la nota dice «**el final** es el horario por defecto» y se pinta **una sola** franja, arriba. Afirmado en el hook y en Hoy. |
| 284 | cumplido | Con noche y una hora puesta, la barra dice «planeado 1h» y «libre 17h» —18 h de ventana menos 1 h— y **las 6 h de sueño no aparecen en ningún tramo ni en la leyenda**: barrido literal sobre el texto entero de la sección del presupuesto. La noche no es una entrada de `buildDayAgenda`. |
| 285 | cumplido | `VidaRevisionPage.test.tsx`: con la noche puesta, «de las **18h** de tu día» y ya **no** «de las 16h 30». La cifra baja, la frase es la misma palabra por palabra y sigue sin reproche. |
| 286 | cumplido | Con los ajustes en vuelo: `night`, `nightEnding`, `nightStarting` y `sleepLabel` en `null`, y la ventana es la de siempre. La guarda está en el hook, así que vale para las tres pantallas a la vez. |
| 287 | cumplido | `vida-time.utils.ts` **no aparece en `git status`**. `calculateEndTime` y `minutesToTime` siguen recortando a 23:59 y sus tests siguen verdes sin tocarse. |
| 273 (superado) | ver la nota del criterio | `plannedMinutes` es **el mismo** con noche y sin ella (afirmado en Hoy y en la plantilla); el denominador cambia de `16h 30` a `18h`, que es lo que decidió el usuario (D9). El test de la tajada 1 se reescribió para afirmar **las dos mitades por separado**, no se borró. |
| 310–312, 315 | cumplidos | Sin noche: cero franjas y la ventana intacta («6:30 → 23:00», sin «duermes»). En vuelo y con error, la guarda del hook. Oscuro: medido, el color del «duermes …» cambia. |
| 313, 314 | cumplidos (medidos) | La tabla de arriba: 375 y 760 px, cero nodos desbordados, `scrollWidth === clientWidth`, ninguna palabra cortada con la noche de 12 h 50. |
| 316 | cumplido | Lo único que se estrena en texto es «duermes 6 h», «el final es el horario por defecto» y las dos líneas de Ajustes. Ni «poco», ni «mal», ni «deberías», ni «apenas», ni «desperdicio», ni «tarde», ni «¿por qué». |
| 317 | cumplido | `sleepLabel` sale de `formatNightDuration`, que da «—» sin dato; y sin noche usable no hay etiqueta, no una cifra por defecto. |
| 318 | cumplido | `useVidaDayWindow` son **dos envoltorios de lectura sobre la misma `useUserSettingsQuery`**, deduplicada por React Query. En los tests un único `settingsQuery` alimenta a los dos. Ninguna clave nueva, ninguna consulta nueva. |
| 319 | **del usuario** | `/app/*` está tras el login y ahí no entro. Pasos abajo. |

**Lo que queda para prueba manual del usuario**

1. `/app/vida/ajustes` con una noche `23:00 / 5:00` y todas las noches marcadas.
2. `/app/vida/hoy`: la franja de arriba y la de abajo, **el primer hueco a las
   5:00** (ya no a las 6:30) y «te quedan … **hasta las 23:00**».
3. La línea de abajo: «Tu día · 5:00 → 23:00 · **duermes 6 h**». **Aquí es donde
   hay que mirar si el cambio de la cifra se entiende**: el «puestas de …» de la
   plantilla habrá cambiado de número y esta línea es su explicación.
4. `/app/vida/plantilla` en un día marcado, y `/app/vida/revision` del mismo
   día: la cifra «de las Xh de tu día» tiene que haber bajado.
5. Poner `1:00 / 6:40` y comprobar que ese día pinta **una sola** franja, arriba,
   y que la tarde sigue cerrando donde dice «Tu día».
6. **Quitar la noche** y comprobar que todo vuelve exactamente a como estaba.

**Riesgos**

- **La cifra del presupuesto cambia de valor** para quien tenga noche. Es lo
  decidido (D9) y está anunciado en Ajustes y explicado en la línea del horario,
  pero es lo primero que hay que mirar: si el usuario abre y no entiende de
  dónde sale el número nuevo, el problema es de esta tajada.
- **El semáforo de los arcos de FEAT-019 mide contra el final del día** y ese
  final ahora puede ser otro (la hora de acostarse). Con `vidaDayEndTime` a las
  22:00 y acostándose a las 23:00, una meta que salía en rojo puede pasar a
  ámbar. Es coherente —el día de verdad acaba a las 23:00— pero no lo pedía
  ningún criterio de esta feature.
- **`VidaModuleLayout` lee la noche.** Su suite necesitó un `vi.mock` de
  `useVidaNight` (22 pruebas en rojo por `useAuthBootstrap must be used within
  AuthBootstrapProvider`). Cualquier suite futura que monte ese layout suelto
  necesitará el mismo mock: es la trampa de siempre, ahora en otro hook.
- **Ninguna clave ni documento GraphQL nuevo**, así que el `buster` de la caché
  **no cambia en esta tajada**: `vite/cache-shape.ts` coge `graphql/*.graphql.ts`
  y la capa `api`, y aquí no se tocó ninguno. **Nadie pierde la caché por esta
  tajada** (la de la tajada 1 sigue pendiente de desplegar, y esa sí). Y cuidado
  con lo de siempre: ningún comentario mío menciona `setQueryData`; lo comprobé
  y la suite de `cache-shape` sigue en 32 fuentes y sin `/pages/`.
- **Lo que NO toqué y conviene confirmar de un vistazo:** `vida-time.utils.ts`
  (287), `useVidaDayHours.ts`, `vida-agenda.utils.ts`, `vida-template.utils.ts`
  y `query-cache-guards.ts`. `git status` no lista ninguno.

**Lo que descubrí y no estaba en el plan** (anotado, no tocado)

- **`nightWindowForDate` repetía la regla del 283 por su cuenta.** Ahora delega
  en `nightBandsForWeekday`. Era una segunda copia de la misma verdad y es
  exactamente la forma en que, dos tajadas más adelante, la franja de abajo y el
  final del día acaban diciendo cosas distintas.
- **El hallazgo 1 del revisor sigue en pie y esta tajada lo respeta:** todo
  entra por `useVidaNight` (a través de `useVidaDayWindow`), nunca por el
  `utils` a pelo, así que las horas iguales se siguen descartando antes de
  llegar a la aritmética. El servidor sigue sin validarlo.
- **Tres expedientes ajenos aparecen modificados en el árbol**
  (`FEAT-015`, `FEAT-017` y un `graphify-out/memory/…` de FEAT-017): **no son
  míos**. Hay otra sesión trabajando sobre el mismo árbol, y eso contamina las
  medidas de `pnpm build` (`ENVIRONMENT.md` lo avisa). Las mías salieron
  estables y reproducibles, pero conviene saberlo.
- **La ventana de planeación de la hoja de registrar** (`gapWindow`,
  `defaultStartNowTime`) ya hereda la ventana nueva porque sale de la misma
  variable. No lo pedía ningún criterio; se apunta porque es un efecto de
  arrastre real y deseable.

**Estado del árbol:** sin commitear.

### Tajada 3 — Lo real encima de lo planeado

**Resumen para el revisor:**
1. Hoy **pregunta por la noche que acaba de pasar** y confirmarla es **un
   toque**: «Sí, así fue» guarda lo planeado como real y la pregunta se va para
   siempre ese día. «Fue distinto» abre «¿Cómo dormiste?», con las dos horas
   puestas, la duración, la diferencia y el «No sé a qué hora». Ignorarla no
   escribe nada y la franja acaba diciendo **«sin confirmar»**.
2. Lo nuevo son dos componentes (`VidaNightPrompt/`, `VidaNightSheet/`), un
   campo en el store del aparato y seis funciones puras en `vida-night.utils.ts`;
   en Hoy son quince líneas. **Ni una consulta, ni una clave de `localStorage`,
   ni una línea del API.**
3. **Lo que más probablemente he roto: la franja de arriba de Hoy ya no dice lo
   mismo.** Hasta ayer decía siempre «Duermes hasta las 5:00 · Vienes de anoche
   · 6 h»; ahora, en un día con pasado, **su sitio lo ocupa la pregunta** hasta
   que se conteste, y después cuenta lo real. Eso movió **dos aserciones de la
   tajada 2** (las he adaptado, no borrado, y lo explico abajo). Lo segundo:
   **la franja de arriba es ahora un `<button>`** cuando el día es real —lo pide
   el criterio 298— y hasta ayer no se podía tocar nada. Lo tercero: cualquier
   suite que monte Hoy y no limpie `nightLogs` se contamina entre pruebas; lo he
   añadido al `beforeEach` de `VidaHoyPage.test.tsx`.

**Qué se construyó**

*El dato del aparato*

- `src/features/vida/store/vida-device-notes.store.ts` — un campo más,
  `nightLogs: Record<string, VidaNightLog>`, **en la misma clave**
  `xavi.vida.deviceNotes` (criterio 299), con `setNightLog` / `clearNightLog` /
  `getNightLog` y su línea en `partialize`. **Sin `version` y sin `migrate`**:
  el merge superficial de `persist` lo deja en `{}` para quien guardó antes,
  igual que `dismissedBridges` y `patternAnswers`. La clave es **la fecha en que
  te levantas** (criterio 294).

*La aritmética (todo puro, todo en su archivo)*

- `src/features/vida/utils/vida-night.utils.ts` — el tipo `VidaNightLog` y seis
  funciones: `nightLogState` (los tres estados del criterio 296),
  `VIDA_NIGHT_STATE_WORD`, `nightLogDurationMinutes`, `describeNightSpan` («la
  noche del martes al miércoles»), `describeLoggedNightKind` (criterio 293),
  `nightLogCrosses` y **`describeNightBandLog`**, que es la que dice qué cuenta
  la franja en cada estado. `vida-time.utils.ts` **no se ha tocado** (criterio
  287) y la aritmética sigue en minutos absolutos.

*Las dos piezas nuevas*

- `src/features/vida/components/VidaNightPrompt/` (`.tsx`, `.module.scss`,
  `index.ts`, `.test.tsx` con 5 casos) — molde `VidaGoalPrompt`, **con la forma
  de la franja de arriba**, que es lo que dibuja el render aprobado (momento
  A4). Dos botones y ninguno más.
- `src/features/vida/components/VidaNightSheet/` (`.tsx`, `.module.scss`,
  `index.ts`, `.test.tsx` con 11 casos) — molde `VidaStartTimeSheet` carácter a
  carácter: `SteppedModal` `ds="aura"` + `mobileSheet` + `size="md"`, estado
  dentro, `key` por apertura que pone quien la monta, `onSave` recibido y no
  mutación propia. Dos `Input type="time"`, la duración y la diferencia en
  palabras neutras, el aviso de si cruzó la medianoche o no, dos «No sé a qué
  hora» y la línea de que esto se queda en el aparato.

*Las dos piezas que ya existían y ganan estado*

- `src/features/vida/components/VidaNightBand/` — tres props **opcionales**:
  `realDay`, `log` y `onEdit`. Sin ellas el componente es **exactamente** el de
  antes, que es lo que sigue montando la plantilla. Con ellas, la franja de
  **arriba** cuenta lo real y, si hay `onEdit`, **la franja entera es el botón**
  (así no mete ningún control dentro y sigue sin ser una fila: criterio 272).
- `src/features/vida/pages/VidaHoyPage.tsx` — lee `nightLogs` del store, decide
  si toca preguntar, monta la pregunta **en el sitio de la franja de arriba**,
  pasa `realDay` / `log` / `onEdit` a la franja y monta la hoja al final, junto
  a las otras dos.

**La decisión que el arquitecto dejó abierta: cuándo deja de preguntar**

Criterio 288 («una vez al día») frente a criterio 295 («al acabar el día queda
sin confirmar»). **Decidido así, y está escrito en el código**
(`VidaHoyPage.tsx`, junto a `nightPromptOpen`):

> La pregunta se pinta **solo en el día de hoy**, **solo si esa noche llega
> hasta aquí**, **solo mientras nadie haya contestado** y **hasta la hora de
> acostarte** —el final de la ventana de este día—. Pasada esa hora ya no es «la
> mañana siguiente»: la pregunta se calla y la franja dice «sin confirmar».

Por qué así y no de otra forma:

- **Ignorar sigue siendo gratis**: no hay ninguna bandera de «descartada» en el
  aparato, así que ignorar la pregunta es literalmente no tocarla y **no escribe
  ni un byte**. Es lo que recomendaba la sección 2.
- **Pero no se queda colgada toda la noche.** Con la recomendación tal cual
  —sin ninguna puerta más que «es hoy y no hay dato»—, a las 23:30 la pantalla
  seguiría preguntando «¿Dormiste 23:00 → 5:00?» por una noche de hace veinte
  horas, y **la palabra «sin confirmar» del criterio 295 no se leería nunca en
  el día de hoy**. Con el corte, el criterio 295 es cierto literalmente («al
  acabar el día … la franja lo dice con esa palabra»).
- **La hora del corte no es un número inventado**: sale de `dayWindow.endTime`,
  o sea de la hora a la que el usuario dice que se acuesta (o de su «Tu día»).
  No hay ningún `12:00` ni ningún `18:00` escrito a mano.

No es bloqueante y no cambia ningún dato: si el usuario la quiere callada antes
—por ejemplo a mediodía— es cambiar una comparación en esa misma expresión.

**Por qué así, y qué se descartó**

- **La pregunta ocupa el sitio de la franja de arriba, no se suma a ella.** Es
  lo que dibuja el render aprobado (A4: hay pregunta *o* franja, nunca las dos),
  y es lo que evita que la pantalla diga dos veces lo mismo. La alternativa
  —franja + pregunta debajo— no rompía ninguna prueba vieja, y **ese era
  justamente su único mérito**: dejaba la pantalla peor para no tener que tocar
  dos aserciones.
- **La franja **es** el botón, no lleva un botón dentro.** Así el criterio 272
  («no es una fila, no entra en ningún recuento») sigue siendo cierto tal cual y
  la aserción de la tajada 2 `band.querySelector('button') === null` **sigue
  verde sin tocarla**. Lleva «Corregir» en voz baja para que se sepa que se
  puede tocar; sin ninguna señal, la puerta del criterio 298 no la encuentra
  nadie.
- **«Sin confirmar» solo en días con fecha** (`realDay`). La plantilla es una
  semana tipo: allí no existe «la noche del martes pasado», y decir «sin
  confirmar» de una semana tipo sería una afirmación falsa. Por eso la prop es
  opcional y la plantilla no la pasa.
- **Ni «sin confirmar» ni «confirmado» en un día futuro.** De mañana no hay nada
  que confirmar; la franja de un día futuro sigue contando lo planeado.
- **La franja de abajo no habla de confirmar.** Habla de la noche que todavía no
  ha pasado.
- **Sin contestar, la franja no afirma nada nuevo**: sigue diciendo lo planeado
  y **añade** la palabra. La otra opción era cambiar el texto a «Tu noche dice
  23:00 → 5:00 · sin confirmar», que es literalmente lo que pide el **criterio
  302** — pero ese es de la **tajada 4** y cambiarlo aquí habría movido tres
  pruebas más sin cerrar nada. **Queda dicho para quien construya la 4: ese
  cambio de etiqueta le toca a ella.**
- **Dos «No sé a qué hora», uno por hora, y no uno solo.** El render dibuja una
  sola píldora, pero su propia línea dice «se guarda lo que sí sabes y lo otro
  queda sin dato»: con una sola píldora no hay forma de decir *cuál* no sabes.
- **Con las dos horas sin dato no se guarda nada**, y se dice dentro: una noche
  sin ninguna hora no es una noche confirmada ni corregida, es la que ya tienes
  sin contestar.

**Desvíos de lo que dejó escrito el arquitecto** (tres, y los tres de forma)

1. **`VidaNightLog` vive en `vida-night.utils.ts`, no en el store.** La sección 2
   lo ponía en el store, pero entonces las funciones puras que lo leen tendrían
   que importar de `zustand` hacia arriba. Es exactamente el precedente que ya
   hay: el store importa `VidaPatternAnswer` de `vida-patterns.utils`. El campo
   `nightLogs` sí está donde decía la sección 2.
2. **`VidaNightBand` gana `realDay` además de `log`.** Con solo `log` no se
   puede distinguir «día real sin contestar» de «plantilla», y las dos
   necesitan textos distintos.
3. **El criterio 303 («No sé a qué hora») se construye aquí**, como pedía la
   sección 2 al describir la hoja, aunque el criterio sea de la tajada 4. Sin él
   el estado «sin dato» del criterio 296 no se podría crear desde la pantalla.
   Lo que **no** se ha hecho aquí es lo demás de la 4: el sueño confirmado
   **no** mueve todavía la ventana del día (criterios 300 y 301).

**Verificación**

| Qué | Antes (línea base) | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos (`SteppedModal`, `Tabs`, `toast.context`, `test/render`). Ninguno mío. |
| `pnpm test` | 2 fallos de 2219 | **2 fallos de 2270** (`SearchSelect` ×2, preexistentes). +51 tests, todos verdes. El `IconPicker` flaky no apareció. |
| `pnpm build` — chunk | 1.153,07 kB | **1.159,55 kB** (+6,48) |
| `pnpm build` — CSS | 279,61 kB | **282,61 kB** (+3,00 — **sube**, que es lo que tienen que hacer dos `.module.scss` nuevos) |

**Comprobación del SCSS por lista de selectores** (no por tamaño), como manda
`ENVIRONMENT.md`:

```
VidaNightBand.module.scss   HEAD=5 ARBOL=8
> button.band
> button.band:focus-visible
> .edit
VidaNightPrompt.module.scss  (nuevo)  .root .mark .question .why .actions .actions>* + button
VidaNightSheet.module.scss   (nuevo)  .form .inputs .field .lbl .hint .kind .unknown .chips
                                      .chip .chip[aria-pressed=true] .chip:focus-visible
                                      .error .device .footer + @media(min-width: 30rem)
```

Nada perdido, y los dos archivos nuevos compilan con **todas** sus reglas (o
sea: no hay ningún comentario de bloque sin cerrar).

**Medido en el navegador** (arnés temporal, ya borrado: `src/__harness/` +
`public/__harness-night3.html`; `git status` no los lista). `iframe`s de **375**
y **768** px exactos colgando de un `div` normal, con el caso largo `20:05 →
08:55` (12 h 50):

| Ancho | `scrollWidth` / `clientWidth` | Nodos desbordados | Los dos botones |
|---|---|---|---|
| 375 | 375 / 375 | **0** | 159 × 32 px cada uno, repartidos a partes iguales |
| 768 | 768 / 768 | **0** | 356 × 32 px |

Y el tema oscuro, medido en el mismo arnés: la pregunta pasa de
`rgb(55,48,163)` a `rgb(199,210,254)` y el fondo de
`rgba(79,70,229,.1)` a `rgba(99,102,241,.18)`. Ni un color escrito a mano: todo
sale de `--aura-night-*`.

**Un defecto que solo apareció midiendo** (y por eso se mide): los dos botones
de la pregunta salían de **91 y 108 px** en vez de repartirse el ancho, porque
el `Button` compartido **no es el hijo directo** del contenedor —viene envuelto
en un `span`—, así que el `flex` se lo llevaba el envoltorio y el botón se
quedaba con su ancho de contenido. Arreglado en el `.module.scss` con su
comentario; «Sí, así fue» es justo el blanco que no puede ser pequeño.

**Criterios, uno por uno**

| # | Estado | Evidencia |
|---|---|---|
| 288 | cumplido | `VidaHoyPage.test.tsx`: con noche y sin registrar se lee «¿Dormiste 23:00 → 5:00?», «Es tu noche de siempre. Si fue así, un toque y listo.» y los dos botones. **Una sola vez** (`getAllByText(...)` tiene longitud 1) y **en el sitio de la franja de arriba** (`[data-variant="dawn"]` no existe mientras está). |
| 289 | cumplido | Tres pruebas: **hoy** sí; **día futuro** (2026-09-19) no pregunta y su franja no dice «confirm» nada; **día pasado** (2026-09-17) no pregunta por su cuenta y la franja dice «sin confirmar». |
| 290 | cumplido | Un `click` en «Sí, así fue»: la pregunta desaparece, la franja pasa a «Dormiste 23:00 → 5:00 … confirmado» y el store guarda `{bedTime:'23:00', wakeTime:'05:00'}`. **«Tampoco tras recargar»**: se desmonta la pantalla y se vuelve a montar (que es lo que pasa al recargar con el aparato ya escrito) y no vuelve a preguntar. |
| 291 | cumplido | «Fue distinto» abre «¿Cómo dormiste?» con «Noche del jueves al viernes · tu noche dice 23:00 → 5:00» y los dos campos en `23:00` / `05:00`. Y **abrirla no guarda nada**: `nightLogs` sigue vacío. |
| 292 | cumplido | Con `1:00 / 6:40` la hoja dice exactamente «Dormiste 5 h 40 · 20 min menos que tu noche». Barrido literal: ni «poco», ni «mal», ni «deberías», ni «apenas», ni «desperdicio», ni «por qué». |
| 293 | cumplido | Con `1:00 / 6:40` y fecha miércoles: «Esta noche no cruzó la medianoche: empezó y acabó el miércoles.» Con `23:20 / 5:40`: «Esta noche cruzó la medianoche: empezó el martes y acabó el miércoles.» El usuario no hace ninguna cuenta. |
| 294 | cumplido | Guardando desde el viernes 18, `Object.keys(nightLogs)` es exactamente `['2026-09-18']` —el día en que te levantas— y el jueves 17 no tiene nada. En el store, el mismo caso con `23:20 → 5:40` del martes al miércoles. |
| 295 | cumplido | Pasada la hora de acostarse (23:10), la pregunta no está, la franja dice «Duermes hasta las 5:00 · Vienes de anoche · 6 h · **sin confirmar**» y **`nightLogs` está vacío**: ignorar no escribió nada. Y en un día pasado, lo mismo. |
| 296 | cumplido | Los tres estados salen del dato (`nightLogState`, 5 casos) y se distinguen en pantalla **y** en el DOM: `data-state` es `unconfirmed` / `confirmed` / `no-data`. En Hoy, con una hora sin dato la franja dice «Te levantaste a las 6:40 · A qué hora te acostaste, sin dato» y **no** dice ni «confirmado» ni «sin confirmar». |
| 297 | cumplido | `describeNightBandLog` devuelve literalmente «Dormiste 1:00 → 6:40» + «5 h 40 · 20 min menos que tu noche · confirmado», y la franja lo pinta. |
| 298 | cumplido | La franja de un día real es un `<button>` (`franja.tagName === 'BUTTON'`), tocarla abre la misma hoja **con lo guardado dentro** (`01:00` / `06:40`, no lo planeado), y el store deja sobreescribir sin límite (3 respuestas seguidas, una sola clave, la última manda). |
| 299 | cumplido | Todo va en `xavi.vida.deviceNotes`: en el test del store `localStorage.length === 1` y la clave es esa; en Hoy —donde React Query también persiste— se afirma que **no aparece ninguna clave nueva** con «night» y que el dato está dentro de la de siempre. La hoja lo dice en pantalla: «Esto se queda en este dispositivo: no viaja a otro». |
| 303 | **construido aquí, se cierra en la tajada 4** | «No sé a qué hora» deja ese lado en `null` y guarda lo que sí se sabe (`{bedTime: null, wakeTime: '05:00'}`); con las dos sin dato no se guarda nada y se dice. Lo que falta para el 303 entero —que la ventana del día lo tenga en cuenta— es de la tajada 4. |
| 316 | cumplido | Barrido literal sobre la pregunta, la hoja, las tres franjas y la pantalla entera de Hoy: ni «poco», ni «mal», ni «deberías», ni «apenas», ni «desperdicio», ni «por qué», ni «dormiste poco». |
| 318 | cumplido | **Ninguna consulta nueva**: lo real sale del store del aparato, no del API. `VidaHoyPage` no monta ni un hook de consulta más. |
| 319 | **del usuario** | `/app/*` está tras el login y ahí no entro. Pasos abajo. |

**Lo que queda para prueba manual del usuario**

1. `/app/vida/ajustes` con una noche `23:00 / 5:00` y todas las noches marcadas.
2. `/app/vida/hoy` **por la mañana**: arriba tiene que salir «¿Dormiste 23:00 →
   5:00?» con «Sí, así fue» y «Fue distinto».
3. Tocar «**Sí, así fue**». Comprobar que **no pide nada más**, que la franja
   pasa a «Dormiste 23:00 → 5:00 · 6 h · igual que tu noche · confirmado» y que
   **al recargar la página no vuelve a preguntar**.
4. Tocar la franja → se abre «¿Cómo dormiste?» con lo guardado. Cambiar a
   `23:20 / 5:40`, guardar, y ver «6 h 20 · 20 min más que tu noche».
5. Probar «No sé a qué hora me acosté» y guardar: la franja tiene que decir «Te
   levantaste a las 5:40 · A qué hora te acostaste, sin dato».
6. **Ignorarla**: en un día nuevo, no tocar nada. Por la noche (pasada tu hora de
   acostarte) la pregunta tiene que haberse callado y la franja decir «sin
   confirmar». **Aquí es donde hay que mirar si el corte se entiende.**
7. Mirar un **día pasado** y un **día futuro**: en el pasado, franja con «sin
   confirmar» y tocable; en el futuro, la franja de siempre y **ninguna**
   pregunta.
8. A **375 px** y en **oscuro**, que los dos botones se lean y se toquen bien.

**Riesgos**

- **La franja de arriba de Hoy cambió de texto** para quien tenga noche. Es el
  efecto de mayor alcance y es lo primero que hay que mirar.
- **Dos aserciones de la tajada 2, adaptadas y no borradas**: la de las dos
  franjas y la de `1:00 → 6:40` ahora siembran una noche **confirmada** (un
  helper de tres líneas, `nocheConfirmada()`), porque sin contestar el sitio de
  la franja de arriba lo ocupa la pregunta. Lo que afirmaban —dónde va cada
  franja, que no son filas, que no llevan botón dentro, que con `1:00 → 6:40`
  solo hay una— **se afirma igual**. Si al revisor le parece que eso afloja el
  criterio 278, la alternativa es pintar franja **y** pregunta a la vez, que es
  lo que el render descarta.
- **`VidaHoyPage.test.tsx` limpia `nightLogs` en su `beforeEach`.** Sin eso, una
  prueba que confirma la noche deja a la siguiente sin pregunta. Es la trampa de
  siempre del estado fuera de React, ahora con un campo más.
- **La trampa del `vi.mock`, mirada a propósito:** esta tajada **no añade ningún
  hook nuevo a ninguna página** —lo real sale del store, que ya estaba mockeado
  en ningún sitio porque es estado real—, así que no hay ninguna suite vecina
  que necesite un mock nuevo. Miré los `vi.mock` de `useActivityCategories` de
  `VidaAjustesPage.test.tsx` y `VidaPlantillaPage.test.tsx`: no cambian de forma
  y siguen verdes. `VidaModuleLayout` no se ha tocado.
- **El `buster` de la caché no cambia**: no se ha tocado `graphql/`, ni `api/`,
  ni `src/shared/api/`. **Nadie pierde la caché por esta tajada** (la de la
  tajada 1 sigue pendiente de desplegar, y esa sí). Comprobado además que
  ninguno de mis comentarios menciona `setQueryData`: la suite de
  `vite/cache-shape.ts` sigue verde, en 32 fuentes y sin `/pages/`.
- **Lo que NO toqué y conviene confirmar de un vistazo:** `vida-time.utils.ts`
  (criterio 287), `useVidaDayWindow.ts`, `useVidaNight.ts`,
  `VidaPlantillaPage.tsx`, `VidaRevisionPage.tsx` y `query-cache-guards.ts`.
  `git status` no lista ninguno. **La ventana del día no se mueve en esta
  tajada**: confirmar la noche todavía no cambia ni un hueco (eso es la 4).

**Lo que descubrí y no estaba en el plan** (anotado, no tocado)

- **En Hoy, `localStorage` tiene dos claves, no una.** La segunda es la caché
  persistida de React Query. El criterio 299 dice «`localStorage.length` sigue
  en 1» y eso **solo es cierto en el test del store aislado**; en la pantalla
  real lo comprobable —y lo que el criterio protege— es que **la noche no
  estrena ninguna clave**. Está afirmado así, con su comentario. No he
  reescrito el criterio.
- **El hallazgo 1 del revisor sigue en pie y esta tajada lo respeta:** la noche
  planeada entra por `useVidaNight` a través de `useVidaDayWindow`, nunca por el
  `utils` a pelo, así que las horas iguales se siguen descartando antes. Lo
  guardado en el aparato **no** pasa por esa puerta —no viene del servidor—,
  pero tampoco lo valida nadie más: la hoja solo acepta `HH:mm` válidos o
  `null`.
- **`describeDiffToPlanned` empieza en mayúscula** («Igual que tu noche») y se
  usa en medio de dos frases. Lo he bajado a minúscula en los dos sitios donde
  va embebido, en vez de cambiar la función, que la tajada 1 ya usa en Ajustes
  al principio de una línea. Si algún día hay un tercer sitio, la función debería
  devolver las dos formas.
- **Los botones de la pregunta miden 32 px de alto** (es el `size="sm"` del
  `Button` compartido, el mismo de todo el módulo). Para un blanco de un toque
  en el móvil es corto —la recomendación habitual son 44—, pero es **deuda del
  sistema de diseño**, no de esta feature: cambiarlo aquí dejaría esta pregunta
  distinta de todas las demás de Vida.

**Estado del árbol:** sin commitear.

#### Tajada 3 · cierre de los hallazgos 1 y 2 del revisor (2026-09-25)

Aceptada la tajada, el usuario pidió cerrar **aquí** dos de los cinco hallazgos.
Los otros tres se quedan escritos y sin tocar (el 299 no comprobable como está
redactado, los 32 px de alto de los botones y la lectura del 278).

**1 · La pregunta ya tiene suelo, no solo techo.**

- `src/features/vida/utils/vida-night.utils.ts` — **`nightEndedByNow(night,
  nowMinutes)`**, pura y con su porqué escrito. **El borde, que no es obvio:** la
  noche cruza la medianoche, pero la que *termina* en este día termina siempre a
  su `wakeTime` leído en el reloj **de este día**, cruce o no cruce — su
  comienzo es de ayer y aquí no pinta nada, porque de qué día es cada noche ya
  lo decide `nightEndingOnWeekday`. Por eso **no** se compara contra `bedTime` ni
  se suman 24 h en ningún sitio, y `1:00 → 6:40` no necesita un caso aparte. Sin
  reloj (un día que no es hoy) la respuesta es «sí»: ese día ya terminó entero.
- `src/features/vida/pages/VidaHoyPage.tsx` — `nightStillRunning` y el suelo en
  `nightPromptOpen`. A las 3:00 **no se pregunta**, así que ya no hay ningún
  toque que pueda guardar una hora de levantarse que no ha ocurrido.
- **Y lo que se ve entre medias, que era la otra mitad del encargo:** la franja
  sigue ahí y dice «Duermes hasta las 5:00 · Vienes de anoche · 6 h · **aún no
  ha terminado**». Ni hueco mudo, ni «sin confirmar» — que a las 3:00 sería
  reprochar un silencio que todavía no existe. **El estado del dato no cambia**
  (`data-state="unconfirmed"`, no hay entrada): lo único que cambia es la
  palabra, así que el criterio 296 sigue midiendo tres estados y no cuatro.
- **La franja no se puede tocar mientras la noche pasa** (`onEdit` sin pasar,
  sigue siendo un `div`): no hay nada que corregir todavía, y por esa puerta se
  habrían podido guardar horas que no han llegado. En cuanto la noche termina,
  vuelve a ser el botón del criterio 298.

**2 · La hoja rechaza las dos horas iguales, con la regla de Ajustes.**

- `src/features/vida/utils/vida-night.utils.ts` — **`isSameNightTime`** y
  **`VIDA_NIGHT_SAME_TIME_ERROR`**: la regla del criterio 263 y su mensaje,
  escritos **una sola vez**.
- `src/features/vida/pages/VidaAjustesPage.tsx` — su `if (bedTime === wakeTime)`
  pasa a llamar a la función compartida. **Mismo mensaje, palabra por palabra**,
  así que sus pruebas siguen verdes sin tocarlas.
- `src/features/vida/components/VidaNightSheet/VidaNightSheet.tsx` — la misma
  llamada tras las dos comprobaciones de formato. Con `23:00 / 23:00` no se
  guarda nada, se lee el mismo texto que en Ajustes y **no se pinta ninguna
  cifra** de una noche que no dura nada. Un lado en «No sé a qué hora» no es «la
  misma hora» y sigue guardándose.
- Detalle medido y anotado: `isValidHhMm` exige **dos dígitos**, así que `5:00`
  no llega a la comparación — se cae antes por inválido. La comparación va en
  minutos, como todo el archivo.

**Verificación de este cierre**

| Qué | Antes (revisor) | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 / 0 | **14 / 0**, los mismos archivos |
| `pnpm test` | 2 fallos de 2270 | **2 fallos de 2283** (`SearchSelect` ×2, preexistentes). +13 tests, todos verdes |
| `pnpm build` — chunk | 1.159,55 kB | **1.159,88 kB** (+0,33) |
| `pnpm build` — CSS | 282,61 kB | **282,61 kB** — **el mismo archivo** (`index-DBh9uCr-.css`, mismo hash): este cierre **no toca ni una regla de SCSS**, así que no hay nada que comparar por lista de selectores y, sobre todo, **no baja** |
| `buster` de la caché | `f8edc4f3becd` | **`f8edc4f3becd`**, 32 fuentes de forma, **0 de `/pages/`** — ejecutado (`computeCacheShapeId` sobre el árbol), no razonado. **Nadie pierde la caché por esta tajada** |

**Medido otra vez en el navegador** (arnés temporal **en la raíz del
repositorio**, que es donde Vite lo transforma —en `public/` no lleva el
preámbulo de `@vitejs/plugin-react` y la página muere—; borrado antes de
reportar, `git status` no lo lista). `iframe`s de **375** y **768** px exactos,
con el caso largo `20:05 → 08:55` y las tres franjas a la vez:

| Ancho | `scrollWidth` / `clientWidth` | Nodos desbordados | Los dos botones |
|---|---|---|---|
| 375 | 375 / 375 | **0** | 159 × 32 px cada uno |
| 768 | 768 / 768 | **0** | 356 × 32 px |

Y las tres franjas, leídas del DOM en los dos anchos: `DIV/unconfirmed` «… 12 h
50 · aún no ha terminado», `DIV/unconfirmed` «… 12 h 50 · sin confirmar» y
`BUTTON/confirmed` «Dormiste 20:05 → 9:15 · 13 h 10 · 20 min más que tu noche ·
confirmado · Corregir».

**Lo que no toqué, de lo que el revisor midió por su cuenta:** el toque único y
las cero escrituras al ignorar, que «No sé a qué hora» nunca guarda la hora
planeada, la resolución del 288 frente al 295 (el techo sigue siendo la hora de
acostarte), las dos aserciones adaptadas de la tajada 2 y el arreglo del ancho,
que sigue viviendo solo en `VidaNightPrompt.module.scss`.

**Riesgo nuevo que introduce este cierre:** de madrugada la franja dice una
frase que antes no existía, y **quien abra Hoy entre medianoche y su hora de
levantarse ya no ve la pregunta**. Es lo pedido, pero es un cambio de lo que se
ve: si alguien madruga de verdad y quiere confirmar a las 4:00, tendrá que
esperar a su hora de levantarse o corregirlo después. Queda dicho.

**Estado del árbol:** sin commitear.

### Tajada 4 — Lo real manda y lo que no se sabe se dice

**Resumen para el revisor:**
1. **La hora a la que te levantaste de verdad manda sobre la que planeaste**:
   confirmada la noche, el día empieza ahí, y los huecos y el presupuesto se
   recalculan **en el mismo montaje**. Lo que no se sabe no se rellena: sin
   hora real la ventana vuelve a lo planeado **y la línea del día lo dice**.
2. Lo nuevo son tres cosas puras en `vida-night.utils.ts`
   (`resolveRealDayStart`, `VIDA_MIN_AWAKE_MINUTES`, `VIDA_REAL_START_NOTE`),
   el hilo de lo real dentro de `useVidaDayWindow` y una coletilla en la línea
   «Tu día ·». **Ni una consulta, ni una clave, ni una regla de SCSS.**
3. **Lo que más probablemente he roto: la franja de arriba vuelve a cambiar de
   texto.** Sin contestar ya no dice «Duermes hasta las 5:00 · Vienes de anoche
   · 6 h · sin confirmar», dice «**Tu noche dice 23:00 → 5:00 · 6 h · sin
   confirmar**» — es el criterio 302 literal, y la tajada 3 dejó escrito que
   esa etiqueta le tocaba a ésta. Movió **tres aserciones** (dos de la tajada 3
   y una del `utils`), adaptadas y no borradas. Y lo segundo, de más alcance:
   **`useVidaDayWindow` ahora se suscribe al store del aparato**, así que
   cualquier pantalla que lea la ventana —Hoy, la revisión y el aviso de sesión
   vieja del layout— se vuelve a pintar cuando se confirma una noche. Es lo que
   hace ciertos los criterios 301 y 308, pero es un cambio de dependencias en
   un hook que ya tenía tres llamantes.

**Qué se construyó**

*La aritmética (pura, en su archivo, con su porqué escrito)*

- `src/features/vida/utils/vida-night.utils.ts` — **`resolveRealDayStart(log,
  plannedEndTime)`**, que devuelve `{ startTime, reason }` con cuatro razones:
  `unconfirmed` (nadie contestó: manda lo planeado, D4), `real` (criterio 300),
  `no-data` (criterio 303) y **`out-of-window`**, que es el hueco que avisó el
  revisor de la tajada 3. La regla, escrita en la cabecera de la función:

  > La ventana real **nunca empieza después del final del día menos
  > `VIDA_MIN_AWAKE_MINUTES`** (30 min). Si el dato guardado lo viola —una
  > noche degenerada `23:00 → 23:30`, o una corrección absurda— **se trata como
  > sin dato y se dice**.

  Se descartaron las otras dos salidas y está dicho por qué: **recortar** la
  hora enseñaría una que nadie ha dicho, y **dejarla pasar** daría una ventana
  de cero o negativa, sin huecos y sin presupuesto. Y quedarse callado usando
  lo planeado sin avisar sería la pantalla afirmando lo planeado como si fuera
  real (criterio 317).
- **`VIDA_REAL_START_NOTE`** — cómo se dice cada razón en pantalla, en un solo
  sitio. `null` en `unconfirmed` y en `real`: ahí no hay nada que aclarar.
- **`describeNightBandLog`**, rama «sin contestar» — el cambio de etiqueta del
  criterio 302.

*La ventana*

- `src/features/vida/hooks/useVidaDayWindow.ts` — `resolveVidaDayWindow` gana
  un cuarto parámetro **opcional** (`log`), así que quien no lo pase —la
  plantilla— se comporta **exactamente** como en la tajada 2. Devuelve dos
  campos nuevos: `realStartReason` y `plannedStartNote`. `startSource` estrena
  el valor `night-real`, y `sleepLabel` pasa a decir «**dormiste 5 h 40**»
  cuando la hora es real: decir «duermes 6 h» al lado de un día que empieza a
  las 6:40 serían dos datos que no casan.
  `useVidaDayWindow(date)` lee `nightLogs` del store **y descarta lo que tenga
  fecha futura** (criterio 309): si otro aparato o un reloj movido dejaran una
  entrada de mañana, no movería ninguna ventana. `useVidaWeekdayWindow` **no
  lee nada de lo real**, y está dicho por qué: en una semana tipo no existe «la
  noche del martes pasado».

*Lo que se ve*

- `src/features/vida/components/VidaDayBudget/VidaDayBudget.tsx` — una prop
  más, `plannedStartNote`, que se pinta con la clase de nota que ya existía:
  «Tu día · 5:00 → 23:00 **(lo planeado: de tu hora de levantarte no quedó
  dato)** · duermes 6 h» (criterio 304).
- `src/features/vida/pages/VidaHoyPage.tsx` — dos líneas: pasarle esa nota. La
  ventana ya venía del hook, así que **los huecos, el presupuesto, la marca de
  «ahora» y la revisión se recalculan sin tocar nada más**.

**Por qué así, y qué se descartó**

- **Lo real se lee en el hook, no en cada pantalla.** La alternativa era que
  Hoy le pasara su `nightLog` al hook y que la revisión hiciera lo suyo por su
  cuenta; eso es la misma regla escrita dos veces, y el criterio 308 —«recalcula
  su ventana **y** su revisión»— acabaría siendo cierto en una pantalla y no en
  la otra. Leerlo dentro cuesta una suscripción a `zustand` y **ninguna
  consulta** (criterio 318).
- **El techo y el suelo de la pregunta de la mañana no se han tocado.** Se
  aceptaron hoy y esta tajada no los relitiga. Lo que sí cierra es el hueco
  teórico que quedaba **debajo** de ellos: una noche degenerada ya no puede
  producir una ventana imposible, porque la hora real no se usa si no deja día.
- **Lo no confirmado sigue sin usarse para nada** (D4): la ventana no se mueve
  y ninguna pantalla habla en pasado.
- **«Sin dato» no se convierte en una cifra.** Con media noche guardada la
  línea del día sigue diciendo lo que dice **tu noche** («duermes 6 h») y
  aclara que las horas son lo planeado. La franja dice «sin dato» con palabras;
  el «—» del criterio 305 es lo que devuelve `formatNightDuration` allí donde
  hay un hueco de duración que rellenar (la hoja), y **en ningún estado aparece
  «0 h»**, afirmado.
- **El día futuro se descarta en dos sitios y a propósito** (criterio 309): en
  la página, que no le da ni pregunta ni `onEdit`, y en el hook, que ni lee su
  entrada. Una sola de las dos bastaría hoy; las dos juntas hacen que ninguna
  pantalla futura lo herede mal.

**Desvíos de lo que dejó escrito el arquitecto:** ninguno de fondo. La sección 2
decía «`useVidaDayWindow.ts` (tajada 4) — el sueño confirmado manda sobre la
hora de levantarse», y es exactamente lo que hay. Lo único que añado sobre lo
escrito es **de dónde** sale el `log`: lo lee el propio hook, por la razón de
arriba.

**Verificación**

| Qué | Antes (línea base) | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos. Ninguno mío. |
| `pnpm test` | 2 fallos de 2283 | **2 fallos de 2304** (`SearchSelect` ×2, preexistentes; 131 ficheros verdes, el flaky de `IconPicker` no salió). **+21 pruebas**, todas verdes |
| `pnpm build` — chunk | 1.159,88 kB | **1.160,84 kB** (+0,96) |
| `pnpm build` — CSS | 282,61 kB | **282,61 kB**, y **`index-DBh9uCr-.css`: el mismo nombre de fichero con hash de contenido** que la línea base, o sea el mismo CSS byte a byte. Esta tajada **no toca ni una regla de SCSS**, así que no hay lista de selectores que comparar y, sobre todo, **no baja** |

**Medido en el navegador** (arnés temporal **en la raíz del repositorio**,
borrado antes de reportar: `git status` no lo lista). `iframe`s de **375** y
**768** px exactos, con el caso largo `20:05 → 08:55` (12 h 50) y las tres
franjas de un día real a la vez:

| Ancho | `scrollWidth` / `clientWidth` | Nodos desbordados | Las tres franjas |
|---|---|---|---|
| 375 | **375 / 375** | **0** | 359 × 79 px cada una |
| 768 | **768 / 768** | **0** | 752 × 79 px |

Texto leído del DOM en los dos anchos: `BUTTON/unconfirmed` «🌅 Tu noche dice
20:05 → 8:55 · 12 h 50 · sin confirmar · Corregir», `BUTTON/no-data` «Te
levantaste a las 9:15 · A qué hora te acostaste, sin dato» y `BUTTON/confirmed`
«Dormiste 20:05 → 9:15 · 13 h 10 · 20 min más que tu noche · confirmado».
**La etiqueta nueva es la más larga de las tres y no desborda.**

**Oscuro (315):** en el mismo arnés, el rótulo de la franja pasa de
`rgb(55, 48, 163)` a `rgb(199, 210, 254)` al poner `data-theme="dark"` — los
mismos dos valores que midió el revisor de la tajada 3, o sea que sigue saliendo
de `--aura-night-*` y no de ningún color escrito a mano. Cero desbordes también
en oscuro.

**Criterios, uno por uno**

| # | Estado | Evidencia |
|---|---|---|
| 300 | cumplido | `useVidaDayWindow.test.tsx`: con la noche confirmada `1:00 → 6:40`, `startTime === '06:40'`, `startSource === 'night-real'` y la línea dice «dormiste 5 h 40». En Hoy, `Tu día · 6:40 → 23:00` y **no** «5:00 →». |
| 301 | cumplido | **Sin recargar**: en el mismo montaje se contesta «Fue distinto» con `01:00 / 06:40` y el primer tramo de la agenda pasa a las **6:40**; ninguna fila menciona las 5:00. Y en el hook, `agenda.gaps[0].startMinutes === 400` con todos los huecos ≥ 400. |
| 302 | cumplido | Sin contestar: `startTime === '05:00'`, `realStartReason === 'unconfirmed'`, la línea dice «duermes 6 h» y **no** «dormiste». La franja dice «**Tu noche dice 23:00 → 5:00 · 6 h · sin confirmar**» y no contiene «Dormiste» ni «Vienes de anoche». |
| 303 | cumplido | «No sé a qué hora» ya guardaba lo que se sabe (tajada 3); lo que faltaba —que la ventana lo tenga en cuenta— está: con `{bedTime:'23:20', wakeTime:null}` la ventana **no se mueve** y no se inventa ninguna hora. |
| 304 | cumplido | Con la hora de levantarse sin dato, `startTime` vuelve a `'05:00'` (o a `vidaDayStartTime` si no hay noche, afirmado aparte) y la pantalla dice «(**lo planeado**: de tu hora de levantarte no quedó dato)» en la línea «Tu día ·». |
| 305 | cumplido | `nightLogDurationMinutes` de media noche es `null` y `formatNightDuration(null)` es «**—**». En Hoy, la franja de ese estado dice «sin dato» y **no contiene «0 h»**, afirmado literalmente. |
| 306 | cumplido | Día pasado (2026-09-17) con la noche sin confirmar: la franja sigue ahí, dice «sin confirmar», es un `BUTTON` y tocarla abre «¿Cómo dormiste?». No se pierde. |
| 307 | cumplido | Ese mismo día **no pregunta por su cuenta**: `¿Dormiste 23:00 → 5:00?` no está. Hay salida, no interrupción. |
| 308 | cumplido | Dos pruebas: en Hoy, corregir el día pasado deja `Tu día · 7:15 → 23:00` **en ese día** y hoy sigue en `5:00 → 23:00`, con una sola clave guardada (`['2026-09-17']`). Y en `VidaRevisionPage.test.tsx`, con la noche del viernes confirmada a las 7:00 la revisión pasa de «de las 18h de tu día» a «**de las 16h de tu día**». |
| 309 | cumplido | Día futuro (2026-09-19): no pregunta, la franja es un `DIV` que dice lo planeado y no habla de confirmar, y la ventana sigue en `5:00 → 23:00` **aunque se siembre una entrada con esa fecha** en el aparato: el hook la descarta. |
| 313 / 314 / 315 | cumplido | Medidos arriba: 375/375 y 768/768 sin desbordes con el caso largo, y el color cambia con el tema. |
| 316 | cumplido | Barrido literal sobre lo que esta tajada estrena: «deberías», «desperdicio», «apenas», «dormiste poco» — cero. Las dos notas nuevas dicen **qué pasó con el dato**, no qué hiciste mal. |
| 317 | cumplido | Es el corazón de la tajada: ninguna cifra sale de una hora inventada, la hora que no deja día se trata como sin dato en vez de recortarse, y donde no hay duración no se pinta ninguna. |
| 318 | cumplido | **Ninguna consulta nueva**: lo real sale del store del aparato. El hook sigue componiendo `useVidaDayHours` + `useVidaNight` sobre la misma `useUserSettingsQuery`. |
| 319 | **del usuario** | `/app/*` está tras el login y ahí no entro. Pasos abajo. |

**Lo que queda para prueba manual del usuario** (criterio 319)

1. `/app/vida/ajustes` con la noche `23:00 / 5:00` y todas las noches marcadas.
2. `/app/vida/hoy` por la mañana → «Fue distinto» → poner `1:00 / 6:40` y
   guardar. **La línea del día tiene que pasar a «Tu día · 6:40 → 23:00 ·
   dormiste 5 h 40» y el primer hueco de la mañana ya no puede ofrecerte las
   5:30.** Es el criterio 319 entero en un paso.
3. En esa misma hoja, «**No sé a qué hora me levanté**» y guardar: la línea del
   día vuelve a «5:00 → 23:00» **y dice entre paréntesis que eso es lo
   planeado**.
4. Abrir un **día pasado** sin confirmar: la franja dice «sin confirmar», se
   toca, se corrige, y **la cifra de su revisión** («de las Xh de tu día»)
   cambia con ella.
5. Un **día futuro**: franja de siempre, sin pregunta y sin poder tocarla.
6. A **375 px** y en **oscuro**, que la franja «Tu noche dice …» se lea entera.

**Riesgos**

- **El texto de la franja sin confirmar cambió** para quien tenga noche. Es lo
  que pide el criterio 302, pero es lo primero que se nota.
- **`useVidaDayWindow` se suscribe al store del aparato.** Tres llamantes (Hoy,
  la revisión y `VidaModuleLayout`) se vuelven a pintar al confirmar una noche.
  Es deseado; si alguna vez ese store cambia mucho de forma, esto lo nota.
- **`VidaRevisionPage.test.tsx` no limpiaba `nightLogs` en su `beforeEach`**;
  se lo he añadido junto a `patternAnswers`. Sin eso, una noche confirmada en
  una prueba le movía la ventana a la siguiente. Es la trampa de siempre del
  estado fuera de React.
- **Tres aserciones adaptadas, ninguna borrada**, y las tres por el mismo
  cambio de etiqueta: una en `vida-night.utils.test.ts`, una en
  `VidaNightBand.test.tsx` y una en `VidaHoyPage.test.tsx`. Lo que afirmaban
  —que sin contestar no se afirma nada de lo que pasó y se lee «sin confirmar»—
  **se sigue afirmando**, con una comprobación de más: que no aparece
  «Dormiste» ni «Vienes de anoche».
- **Lo que NO toqué:** `vida-time.utils.ts` (criterio 287), `useVidaNight.ts`,
  `useVidaDayHours.ts`, `VidaNightPrompt`, `VidaNightSheet`, la plantilla,
  Ajustes, el store y cualquier `.module.scss`. `git status` no los lista.

**Lo que descubrí y no estaba en el plan** (anotado, no tocado)

- **El servidor del 5173 estaba apagado al empezar** (la sonda: «nadie
  escucha»). Lo arranqué con `preview_start {name}` —que es lo que
  `ENVIRONMENT.md` manda hacer cuando no hay nada arriba— para medir el arnés,
  y **no he podido pararlo: en esta sesión no existe la herramienta
  `preview_stop`**. Queda dicho: hay un Vite en el 5173 que arranqué yo.
- **El criterio 305 pide que «se lea —»**, y en la franja no se lee «—» sino
  «sin dato» con palabras, que es mejor y es lo que pide el 296. El «—» vive
  donde hay un hueco de duración que rellenar. No he reescrito el criterio; lo
  afirmable y afirmado es que **nunca aparece «0 h» ni una cifra estimada**.
- **`VidaDayBudget` empieza a tener muchas coletillas** en la misma línea:
  ventana, nota de respaldo, «duermes 6 h», y ahora la nota de lo planeado. En
  el peor caso —día por defecto **y** sin dato— se leen dos paréntesis
  seguidos. No lo he tocado porque ese caso no es de esta tajada, pero si
  alguna vez se junta con otro aviso, esa línea necesita una forma y no un
  paréntesis más.
- **Hallazgos 3, 4 y 5 del revisor de la tajada 3** (el 299 no comprobable como
  está redactado, los 32 px de alto de los botones y la lectura del 278)
  **siguen escritos y sin tocar**.

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


### Tajada 2 — Hoy cuenta bien: la ventana del día sale de la noche

**Veredicto: aceptada.** Los diez criterios de la tajada (269, 277, 278–287) se
cumplen, los transversales que aplican también, y la cifra que cambia —«de 18h»
en vez de «de 16h 30»— se explica en la misma pantalla. No encontré ninguna
regresión. Lo que sí hay son cuatro hallazgos, uno de ellos sobre el semáforo,
y van escritos abajo con números.

**Cómo verifiqué** (no leyendo su suite): monté un banco de pruebas temporal en
la raíz (`__review_feat012_slice2.test.ts`, **ya borrado**) que llama a
`resolveVidaDayWindow`, `buildDayAgenda`, `getDayBudget` y `buildGoalArcs`
**directamente**, con datos sembrados por mí y los mismos fixtures que usan las
suites del módulo. Salida literal:

```
SIN NOCHE              06:30 23:00  isDefault=true   sleepLabel=null  «el horario por defecto»
NOCHE CRUZA 23:00→5:00 05:00 23:00  «duermes 6 h»    saved={"startTime":"06:30","endTime":"22:00"}
NO CRUZA    1:00→6:40  06:40 23:00  «duermes 5 h 40» «el final es el horario por defecto»  dusk=null
NO AVANZA   23:00→23:30 06:30 23:00 sleepLabel=null  dawn=null dusk=null
EN VUELO               06:30 23:00  sin noche, sin franjas
ERROR                  06:30 23:00  sin noche, sin franjas
SOLO MARTES / miércoles 05:00 23:00 «duermes 6 h» «el final es el horario por defecto»
SOLO MARTES / martes    06:30 23:00 «duermes 6 h» «el comienzo es el horario por defecto»
huecos  sin noche [[390,540],[600,1380]]   con noche [[300,540],[600,1380]]
plannedMinutes sin/con = 60 / 60 · dayMinutes 990 → 1080 · free 930 → 1020
```

**Criterios, uno por uno**

| # | Veredicto | Evidencia mía |
|---|---|---|
| 269 | **cumplido** | La línea de Ajustes está en presente y dice cuál manda; se le suma «Como el día es más corto, el tiempo que puedes repartir también». Es cierto desde esta tajada (279), así que ya no promete. |
| 277 | **cumplido** | `VidaDayBudget.tsx:223-229`: «Tu día · 5:00 → 23:00» + `sleepLabel` como tercer segmento. Con `23:00 → 5:00` mi banco devuelve exactamente `05:00`, `23:00` y «duermes 6 h». |
| 278 | **cumplido** | `VidaHoyPage.tsx`: las dos `VidaNightBand` van **fuera** del `<ol>`, `dawn` antes y `dusk` después, mismo componente que la plantilla. Leído en el diff, no solo en su test. |
| 279 | **cumplido** | La ventana sale `5:00 → 23:00` con `vidaDayStartTime/EndTime = 06:30 / 22:00`, y esos dos **siguen intactos en `saved`** (línea `NOCHE CRUZA` de arriba). No se borran. |
| 280 | **cumplido** | Sin noche la ventana es carácter por carácter la de antes: `06:30 / 23:00`, `isDefault: true`, «el horario por defecto», y los huecos idénticos (`[[390,540],[600,1380]]`). |
| 281 | **cumplido** | Con noche y un bloque a las 9:00, el primer hueco empieza en el minuto **300** (5:00) y **no hay ninguno antes**. Sin noche empezaba en 390 (6:30). |
| 282 | **cumplido** | `getDayBudget` recibe `dayWindow.endTime`; con `vidaDayEndTime: 22:00` y acostarse a las 23:00, el final es 23:00. Ninguna cuenta atrás nueva: es la línea de FEAT-003. |
| 283 | **cumplido** | `1:00 → 6:40` → ventana `6:40 → 23:00`, **una sola franja** (`dusk = null`) y la nota dice «**el final** es el horario por defecto», no «el horario por defecto». |
| 284 | **cumplido** | `plannedMinutes = 60` con noche y sin ella. Los 360 min de sueño no aparecen en ningún tramo: lo que cambia es `dayMinutes` (990 → 1080) y `freeMinutes` (930 → 1020), que es el denominador, no un tramo nuevo. |
| 285 | **cumplido** | `VidaRevisionPage.tsx`: la vista de día pasa `dayWindow.startTime/endTime` a `buildDayAgenda` y a la revisión. Misma ventana que Hoy, por el mismo hook. |
| 286 | **cumplido** | En vuelo y con error: `night`, `nightEnding`, `nightStarting` y `sleepLabel` en `null` y la ventana es la de siempre (líneas `EN VUELO` y `ERROR`). La guarda está en el hook, así que vale para las tres pantallas. |
| 287 | **cumplido** | `vida-time.utils.ts` no aparece en `git status`. Confirmado contra `HEAD`. |
| 273 (mitad vigente) | **cumplido** | `plannedMinutes` **no cambia ni un minuto**. Medido arriba: 60 y 60. |
| 310 | **cumplido** | Sin noche no se mueve absolutamente nada: misma ventana, mismos huecos, mismo `isDefault`, cero franjas, `sleepLabel` nulo. |
| 311, 312 | **cumplidos** | Ver 286. El «Reintentar» es el de FEAT-003, que sigue colgando del mismo `refetch`. |
| 313, 314, 315 | **no re-medidos por mí** | Los midió el constructor a 375 y 760 px, claro y oscuro, con el caso largo «8:55 → 20:05 · duermes 12 h 50». El cambio de esta tajada en pintado es **un `<span>` más en una línea que ya existía** y una regla de color; acepto su medición y lo digo así en vez de fingir que la repetí. |
| 316 | **cumplido** | Barrido sobre el texto nuevo: «duermes …», «el final/comienzo es el horario por defecto» y las dos frases de Ajustes. Ni «poco», ni «mal», ni «deberías», ni «apenas», ni «tarde». |
| 317 | **cumplido** | Sin noche usable no hay etiqueta; la duración sale de `formatNightDuration`. |
| 318 | **cumplido** | `useVidaDayWindow` compone `useVidaDayHours` + `useVidaNight`, los dos sobre `useUserSettingsQuery`. Ninguna clave ni documento nuevo — y el `buster` lo confirma (abajo). |
| 319 | **del usuario** | `/app/*` está tras el login. Pasos abajo. |

**El número nuevo: ¿se explica solo?** Sí, y por poco. En Hoy, «planeado 1h **de
18h**» y «Tu día · 5:00 → 23:00 · **duermes 6 h**» están en la misma tarjeta, a
tres líneas: quien vea el 18 tiene delante de dónde sale (de 5:00 a 23:00) y por
qué cambió (duermes 6 h). Lo mismo en la plantilla. Y en Ajustes la segunda
frase lo anuncia **antes** de que pase. Lo que **no** se explica solo es el día
en que el usuario ve el número por primera vez sin haber pasado por Ajustes
—porque la noche se guarda una vez y el número cambia para siempre—; ahí la
línea de abajo es toda la explicación que hay, y me parece suficiente porque es
literal y está pegada al número. Queda como cosa a mirar en la prueba manual.

**Qué busqué alrededor (y cómo)**

- **`graphify explain "useVidaDayWindow"`** dio los tres llamantes y las dos
  dependencias: `VidaHoyPage`, `VidaRevisionPage`, `VidaModuleLayout` →
  `useVidaDayHours` + `useVidaNight` + `resolveVidaDayWindow`. Confirmado
  abriendo los cuatro ficheros; **no hay ningún cuarto llamante** ni queda
  ningún sitio que mezcle las dos fuentes.
- **Quién más usa lo tocado.** `VidaDayBudget` y `VidaTemplateDaySummary`
  ganaron dos props **opcionales** con valor por defecto igual al literal de
  antes (`'el horario por defecto'`, `null`): cualquier otro llamante que no las
  pase sigue pintando exactamente lo mismo. Verificado en el diff, no supuesto.
- **`useVidaDayHours` no se tocó** y sigue alimentando a `useVidaPatterns`, a
  `VidaTemplateAside`, a la cuadrícula de la semana y a las filas de la
  revisión: los siete llamantes siguen vivos.
- **Lo que el constructor señaló como «lo que más probablemente he roto»**: la
  cifra del presupuesto. Ahí fui primero, con el banco de pruebas, y está
  medido arriba.
- **El `vi.mock` de `VidaModuleLayout`**: el mock nuevo lista `night`, `saved`,
  `isPending`, `isError`, `isDisabled` y `refetch` — **la forma entera** de
  `VidaNightState` (`useVidaNight.ts:6-19`), ni un campo de menos. No deja la
  suite verde por casualidad **en lo que hoy usa la página**; ver el hallazgo 2.
- **El `buster`**: ejecutado, no razonado. `collectShapeSources` +
  `computeCacheShapeId` sobre el árbol y sobre un `git archive` de `HEAD`:
  **32 fuentes y `f8edc4f3becd` en los dos**. Idéntico. **Nadie pierde la caché
  por esta tajada.** (La de la tajada 1 sí la cambió y sigue sin desplegar.)
- **Lo entregado esta semana**: `pnpm test` completo, **2 fallos de 2186**
  (`SearchSelect` ×2, los de la línea base) — o sea las suites de FEAT-019,
  FEAT-020, FEAT-013, FEAT-010/2, FEAT-021, FEAT-023 y la tajada 1 en verde.
  Una primera corrida dio 5 fallos; era **mía**: tenía dos procesos de vitest a
  la vez (el banco y la suite completa) y tres pruebas se fueron por tiempo. La
  corrida limpia, con el banco ya borrado, da la línea base exacta.

**El desvío de `source` → `startSource` / `endSource`: necesario.** Con
`1:00 → 6:40` el inicio lo pone la noche y el final los ajustes: un solo campo
tendría que mentir en un borde, y de ese campo cuelga la frase que el criterio
283 exige «dicha como tal». La partición **no es cosmética**, y de hecho
descubre un cuarto caso que con un campo único no se podía nombrar: una noche
marcada **solo el martes** deja el miércoles con «el final es el horario por
defecto» y el martes con «el comienzo es el horario por defecto». Verificado en
el banco (las dos últimas líneas de `SOLO MARTES`). Bien resuelto.

**Estados**

- **Sin dato / sin noche** (310): comprobado, no se mueve nada.
- **Cargando** (311) y **error** (312): comprobados en el hook, con salida
  literal.
- **Sin permisos:** no aplica (un solo usuario, tras login).
- **Texto largo** (313) y **móvil 375 px / 760 px** (314) y **oscuro** (315):
  medidos por el constructor; yo no los repetí y lo digo arriba.
- **El borde declarado** (ventana que no avanza, levantarse a las 23:30): lo
  sembré y **se cae entera a los ajustes**, sin franjas y sin etiqueta. Tal como
  lo describió.

**¿Duplica algo que ya existía?** No. La sección 2 pedía no tocar
`useVidaDayHours` ni `vida-time.utils.ts` y no se tocaron; la aritmética de la
noche sigue en su archivo y `nightWindowForDate` **dejó de tener una segunda
copia** de la regla del 283 (ahora delega en `nightBandsForWeekday`), que es lo
contrario de duplicar. No hay hook, consulta, clave de caché ni componente
nuevos más allá de `useVidaDayWindow`, que la sección 2 pedía por su nombre.

**Hallazgos (no devuelven la tajada; se escriben)**

5. **El semáforo de los arcos: juzgado con casos, y no es un defecto.** Es el
   hallazgo que más miré. El color sale de `toFitLevel`
   (`vida-goals.utils.ts:433-444`) y depende **solo del final del día**, que es
   justo lo que esta tajada puede mover. Medido con meta de 8 h, 4 h/5 h 30/6 h
   30 hechas y «ahora» a las 19:00 y 20:00:

   ```
   final 23:00 (era el de antes)  →  tight 0 · ok 90 · ok 150 · ok 120
   final 22:00                    →  tight −60 · tight 30 · ok 90 · tight 60
   final 21:30                    →  tight −90 · tight 0 · tight 60 · tight 30
   ```

   Tres cosas que se leen ahí. **(a) En el caso canónico no se mueve nada:**
   acostarse a las 23:00 con el respaldo de las 23:00 da exactamente el mismo
   color que ayer — y el inicio del día no entra en esta cuenta, así que
   levantarse antes no la toca. **(b) Cuando la noche cierra el día *antes* de
   lo que decía «Tu día», el ámbar llega antes, y el rojo también puede**: con
   4 h de 8 h a las 19:00, lo mejor posible pasa de 480 a 390 min; si la noche
   cerrase a las 21:00 caería a 360, por debajo del 80 % de 8 h (384), y sería
   **rojo sin que el usuario haya trabajado menos**. **(c) Y aun así el rojo
   sigue siendo cierto**, que es la regla que ese semáforo protege: si estás en
   la cama a las 21:00, el día de verdad **va** a acabar por debajo del 80 %, y
   decirlo a las 19:00 es cuando todavía hay algo que decidir. El semáforo
   antiguo no era más amable: era menos cierto, porque proyectaba sobre dos
   horas en las que el usuario ya había dicho que estaría durmiendo. **No lo
   devuelvo.** Lo que sí conviene es que el usuario lo sepa antes de verlo: la
   frase de Ajustes anuncia el cambio del presupuesto, no el del color.
6. **`VidaModuleLayout` no tiene ninguna prueba con noche puesta.** Su `vi.mock`
   está completo, pero devuelve `night: null` siempre, así que las 22 pruebas
   verifican el criterio 310 y nada más: que el aviso de sesión vieja diga «hasta
   las 23:00» en vez de «hasta las 22:00» cuando hay noche **no lo afirma
   ninguna prueba**. Es la recomendación D1 de la sección 2, no un criterio, y el
   código es de una línea — pero es exactamente la forma de trampa que
   `ENVIRONMENT.md` describe: verde porque no recorre el camino nuevo.
7. **La semana y el día miden con escalas distintas, a propósito.** En la
   revisión, la vista de día usa la ventana (18 h) y las filas de la semana
   siguen con `dayHours` (16 h 30). Está razonado —siete ventanas no se
   comparan— y no lo pide ningún criterio, pero un usuario que mire las dos
   pestañas verá dos denominadores. Si alguna vez chirría, se decide entonces;
   no ahora.
8. **Una ventana degenerada sigue siendo posible.** La guarda 2 caza el inicio
   posterior al fin, pero no un día de 20 minutos: `wakeTime 00:10` y
   `bedTime 00:30` dan una ventana `00:10 → 00:30` que pasa `isEndAfterStart`.
   Es una noche de 23 h 50 que nadie va a configurar y el servidor la admite
   (solo prohíbe las dos horas iguales). Se apunta junto al hallazgo 1 de la
   tajada 1: la aritmética confía en que alguien filtre antes.

**Lo que queda para prueba manual** (criterio 319; `/app/*` está tras el login y
ahí no entro):

1. En `/app/vida/ajustes`, poner la noche `23:00 / 5:00` con todas las noches
   marcadas y guardar.
2. Abrir `/app/vida/hoy`: mirar **primero** el número de «planeado … de 18h» y
   luego la línea de abajo. La pregunta que hay que contestar es si el 18 se
   entiende sin pensar.
3. En esa misma pantalla: la franja de arriba, la de abajo, el primer hueco a
   las **5:00** (ya no a las 6:30) y «te quedan … **hasta las 23:00**».
4. `/app/vida/plantilla` en un día marcado y `/app/vida/revision` del mismo día:
   la cifra «de las Xh de tu día» tiene que haber **bajado**.
5. Si hay metas con arco: mirar el color antes y después de guardar la noche.
   Debería no moverse si te acuestas a las 23:00; si te acuestas antes, el ámbar
   llega antes y eso es correcto.
6. Poner `1:00 / 6:40`: ese día pinta **una sola** franja, arriba, y la tarde
   cierra donde diga «Tu día».
7. Quitar la noche: todo vuelve exactamente a como estaba.

**Veredicto: aceptada** — los criterios 269, 277, 278–287 y los transversales
que aplican se cumplen con evidencia sembrada por mí; `plannedMinutes` no se
mueve; el `buster` es idéntico al de `HEAD`; la suite vuelve a la línea base
exacta (2 de 2186) y no encontré ninguna regresión en lo entregado esta semana.

### Tajada 3 — Lo real encima de lo planeado

**Veredicto: aceptada.** Los doce criterios de la tajada (288–299, 316, 318) se
cumplen, medidos por mi cuenta y no leyendo sus pruebas; la línea base no
empeora; el `buster` de la caché es **el mismo byte a byte**; y las dos
aserciones de la tajada 2 están **adaptadas porque el producto cambió**, no
aflojadas. Cinco hallazgos anotados, ninguno bloqueante, y uno de ellos —la
pregunta de madrugada— conviene mirarlo en la tajada 4.

**Criterios, uno por uno** (sembrando, no leyendo sus tests: escribí un fichero
de pruebas propio, `src/features/vida/__review-t3.test.tsx`, con 17 casos sobre
`VidaNightPrompt`, `VidaNightSheet`, `VidaNightBand` y el store; **borrado
antes de reportar**, `git status` no lo lista):

| # | Estado | Cómo lo comprobé yo |
|---|---|---|
| 288 | cumplido | La pregunta se pinta con sus dos botones y **ninguno más**: `getAllByRole('button')` dentro de la pregunta devuelve exactamente `['Sí, así fue', 'Fue distinto']`. Ocupa el sitio de la franja de arriba (no hay `[data-variant="dawn"]` mientras está), así que la pantalla no dice dos veces lo mismo. |
| 289 | cumplido | Por código y por sus tres pruebas: `nightPromptOpen` exige `isToday`; futuro y pasado no preguntan. **Matiz mío abajo** (hallazgo 1): «por la mañana» no tiene suelo, solo techo. |
| 290 | cumplido | **Un toque de verdad**: un `click` en «Sí, así fue» llama a `onConfirm` **una vez**, no abre nada, no pide confirmación y no llama a la otra salida. Lo guardado es exactamente lo planeado; el «tampoco tras recargar» lo sostiene `persist`. |
| 291 | cumplido | La hoja abre con `23:00` / `05:00` prellenados y el titular «Noche del jueves al viernes · tu noche dice 23:00 → 5:00». Abrirla **no escribe nada**. |
| 292 | cumplido | **Cada cifra nombrada es la que se calcula**, comprobado con cinco noches cruzando la comparación contra `nightDurationMinutes` en vez de contra una constante: `23:00→05:00` = «6 h · igual que tu noche»; `01:00→06:40` = «5 h 40 · 20 min menos»; `20:05→08:55` = «12 h 50»; `23:30→00:15` = «45 min · 5 h 15 menos»; `22:00→05:00` = «7 h · 1 h más». La franja dice **lo mismo** que la hoja en los cinco. Sin juicio: barrido propio de «poco», «mal», «deberías», «apenas», «desperdicio», «por qué» y «tarde» sobre la pregunta + la hoja + la franja: **cero**. |
| 293 | cumplido | `1:00 → 6:40` → «Esta noche no cruzó la medianoche: empezó y acabó el miércoles.»; `23:20 → 5:40` → la frase con los dos días. El usuario no hace ninguna cuenta. |
| 294 | cumplido | La clave es el día en que te levantas: `Object.keys(nightLogs) === ['2026-09-18']` guardando desde el viernes, y `getNightLog(logs, '2026-09-17')` es `null`. |
| 295 | cumplido | **Ignorar no cuesta nada y no deja la pantalla peor**: con `log = null` la franja **no dice «Dormiste»**, dice lo planeado + «sin confirmar», el store queda `{}` y `localStorage.length` es **0**. No hay bandera de «descartada» que escribir. |
| 296 | cumplido | Los tres estados salen del dato y se distinguen en pantalla y en el DOM (`data-state` = `unconfirmed` / `confirmed` / `no-data`). Medido en el navegador, las tres franjas a la vez: «… sin confirmar», «… confirmado», «Te levantaste a las 6:40 · A qué hora te acostaste, sin dato». Ninguna mezcla dos palabras. |
| 297 | cumplido | En el navegador, la franja real: «Dormiste 20:05 → 8:55 · 12 h 50 · igual que tu noche · confirmado». Con `1:00 → 6:40`, «5 h 40 · 20 min menos que tu noche · confirmado». |
| 298 | cumplido | La franja de un día real es `tagName === 'BUTTON'`, abre la misma hoja con **lo guardado** dentro (no lo planeado) y el store deja sobreescribir sin límite: tres respuestas seguidas dejan **una sola clave** con la última. |
| 299 | cumplido, con el matiz que él mismo anotó | En el store aislado, `Object.keys(localStorage)` es **exactamente** `['xavi.vida.deviceNotes']`. En Hoy hay **dos** claves porque React Query persiste su caché, así que «`localStorage.length` sigue en 1» **no es comprobable tal y como está escrito**; lo afirmable —y lo que el criterio protege— es que **la noche no estrena ninguna clave**, y eso es cierto. No reescribo el criterio: queda aquí. |
| 316 | cumplido | Barrido propio, más amplio que el suyo (siete palabras, incluidas «poco», «mal» y «tarde», que su prueba de página no mira): cero en las tres superficies nuevas. La diferencia se dice en minutos y dirección. |
| 318 | cumplido | `VidaHoyPage` no monta **ni un hook de consulta más**: el diff solo añade dos selectores del store de zustand. Lo real no sale del API. |

**Lo que rompió cerca, y cómo lo busqué**

- `graphify explain "VidaNightPrompt sleep confirmation"` no devuelve nada y
  `graphify query "VidaNightBand franja de la noche en Hoy"` **sí** trae el
  subgrafo… pero el constructor ya corrió `graphify update .`, así que el grafo
  refleja el árbol **con** la tajada dentro: sirvió para ver quién llama a
  `describeNightBandLog` y a `VidaNightBand`, no para saber qué había antes. Lo
  de «antes» salió del diff y de `git archive HEAD`.
- **Quien más usa lo tocado:** `VidaNightBand` lo montan Hoy y la plantilla. Las
  tres props nuevas son **opcionales con valor por defecto**, así que la
  plantilla renderiza el `div` de siempre: verificado en el navegador (la franja
  sin `onEdit` sigue siendo `DIV`) y con la suite completa en verde.
- **El `Button` compartido (`shared/ui`) no se ha tocado**: el arreglo del
  reparto del ancho vive **dentro** de `VidaNightPrompt.module.scss`, en
  `.actions > *` y `.actions button`, y `.actions` es una clase de módulo
  hasheada — no puede alcanzar a ningún otro botón del proyecto. `git status` no
  lista nada de `src/shared/`. El diagnóstico es correcto: `Button` envuelve en
  `motion.span` (`Button.tsx:102` y `:129`), por eso el `flex` se lo llevaba el
  envoltorio.
- **Las dos aserciones de la tajada 2, miradas con lupa:** en la de las dos
  franjas solo cambia el texto esperado (`'Duermes hasta las 5:00'` →
  `'Dormiste 23:00 → 5:00'`) y se siembra la noche confirmada; **siguen
  intactas** las que sostenían el criterio: dos franjas, `dawn` primero y `dusk`
  después, ninguna dentro del `<ol>`, ninguna en un `<li>`, ningún botón
  **dentro** y el orden relativo a la agenda. En la de `1:00 → 6:40` la siembra
  es **inerte** para lo que afirma (la ventana sigue saliendo de lo planeado en
  esta tajada) y se conservan `6:40 → 22:00`, una sola franja y que es la de
  arriba. **Adaptadas porque el producto cambió, no aflojadas.** Lo que sí se
  perdió de camino es la cobertura del caso «hoy sin contestar» en esa prueba —
  pero lo recogen dos pruebas nuevas (la pregunta en su sitio, y el día pasado
  con «sin confirmar»).
- **La promesa de la caché, ejecutada, no razonada:** exporté `HEAD` con `git
  archive` a un árbol aparte y corrí `computeCacheShapeId` sobre los dos.
  `HEAD = f8edc4f3becd`, árbol `= f8edc4f3becd`, **iguales**; 32 fuentes de
  forma en los dos y **ninguna nueva**. Nadie pierde la caché por esta tajada.
- **Línea base, corrida entera por mí:** `pnpm test` **2 fallos de 2270**
  (`SearchSelect` ×2, preexistentes; el `IconPicker` flaky no salió),
  `pnpm lint` **14 / 0**, `pnpm build` chunk **1.159,55 kB** y CSS **282,61 kB**
  — el CSS **sube**, que es lo que tienen que hacer dos `.module.scss` nuevos.
  Las cinco cifras coinciden con las suyas.
- **Lo demás entregado:** la suite completa cubre FEAT-015 (tajadas 1 y 2),
  019/020/021/023 y las tajadas 1 y 2 de esta feature; 131 ficheros de prueba en
  verde y el único rojo es el de siempre.

**Medido en el navegador** (arnés temporal propio, `iframe`s de 375 y 768 px
exactos colgando de un `div` normal; **borrado antes de reportar**). Ojo para
quien venga: un `.html` en `public/` **no** lleva el preámbulo de
`@vitejs/plugin-react` y la página muere con «can't detect preamble» — tiene que
estar en la **raíz** del repositorio para que Vite lo transforme.

| Ancho | `scrollWidth` / `clientWidth` | Nodos desbordados | Los dos botones |
|---|---|---|---|
| 375 | 375 / 375 | **0** | **159 × 32 px cada uno**, repartidos por igual |
| 768 | 768 / 768 | **0** | **356 × 32 px** |

Con el caso largo (`20:05 → 08:55`, 12 h 50) y con la hoja abierta encima. Los
números coinciden con los suyos, incluido el arreglo del reparto.

**Estados que nadie construye**

- **Sin datos / primera vez:** cubierto — sin noche marcada no hay pregunta ni
  franja (criterio 275/310, verificado).
- **Sin respuesta:** cubierto, y es el estado central de la tajada.
- **Cargando y error:** **no son de esta tajada** (311 y 312, cerrados en la 2
  para las franjas). La pregunta cuelga de `dayWindow`, que ya espera a
  `mySettings`, así que no parpadea; no hay petición nueva que pueda fallar.
- **Permisos:** no aplica, el dato es del aparato.
- **Texto largo y móvil:** medidos arriba, cero desbordes a 375 y 768.
- **Oscuro (315):** **no lo he vuelto a medir yo**; es transversal y el
  constructor lo midió (`--aura-night-*`, sin color a mano). Lo verifiqué solo
  leyendo el SCSS: no hay ni un color literal en los dos módulos nuevos.

**¿Duplica algo que ya existía?** No. Contra la sección 2: la hoja calca
`VidaStartTimeSheet` en vez de inventar otro modal, la pregunta calca
`VidaGoalPrompt`, el dato entra en la clave de `vida-device-notes.store` que ya
existía y la aritmética va a `vida-night.utils.ts`, que ya era su sitio.
`vida-time.utils.ts` no se ha tocado (criterio 287). Los tres desvíos que él
declara son de forma y están justificados.

**La decisión que el arquitecto dejó abierta (288 vs 295): resolución correcta.**
Preguntar **hasta la hora de acostarte**, sacada de `dayWindow.endTime`, no es
un número inventado, no escribe nada al ignorar y hace que «sin confirmar» se
lea de verdad en el día de hoy — lo comprobé: a las 23:10 la pregunta se ha
callado, la franja dice «sin confirmar» y `nightLogs` sigue vacío. Con la
recomendación original esa palabra no aparecería nunca antes de medianoche.

**Hallazgos** (anotados, no devueltos)

1. **La pregunta no tiene suelo, solo techo.** `nightPromptOpen` solo compara
   con el final de la ventana, así que a las 3:00 de la madrugada Hoy pregunta
   «¿Dormiste 23:00 → 5:00?» por una noche **que todavía no ha terminado**, y un
   toque en «Sí, así fue» guardaría como real una hora de levantarse que aún no
   ha pasado. Un suelo en la hora de levantarse (`nowMinutes >= startTime`) lo
   cierra. Para la tajada 4, que es la que mueve la ventana con lo real.
2. **La hoja acepta las dos horas iguales** (`23:00 / 23:00`): se guarda como
   **confirmado** y la franja queda «Dormiste 23:00 → 23:00 · — · confirmado».
   No inventa ninguna cifra, pero Ajustes sí rechaza ese caso (criterio 263) y
   aquí no. Una línea en `handleSave`.
3. **Criterio 299 no es comprobable como está escrito** (ver arriba). Es
   hallazgo, no licencia: el criterio se queda tal cual y lo afirmable queda
   dicho.
4. **Los botones de la pregunta miden 32 px de alto**, medido: por debajo de los
   44 recomendados para un blanco de un toque en el móvil. Es deuda del
   `Button` compartido, como él dice, no de esta feature.
5. **El criterio 278 decía «con el mismo aspecto que en la plantilla»** y en Hoy
   la franja de arriba ya no es igual: es un `<button>` con «Corregir» y cuenta
   lo real. Lo piden los criterios 297 y 298, así que 278 hay que leerlo como
   «el mismo lenguaje visual», no «el mismo texto». Queda dicho para que nadie
   lo lea como una regresión.

**Lo que queda para prueba manual del usuario** (`/app/*` está tras el login y
ahí no entro; todo lo de arriba está medido fuera de sesión, con arneses y
tests): los ocho pasos que dejó el constructor siguen siendo los buenos. Los dos
que más valor tienen son el **3** (confirmar en un toque y recargar: no puede
volver a preguntar) y el **6** (ignorarla un día entero y mirar por la noche que
la pregunta se ha callado y la franja dice «sin confirmar»). Y si alguna vez
abre Hoy de madrugada, que mire el hallazgo 1.

#### Tajada 3 · revisión del cierre de los hallazgos 1 y 2 (2026-09-25)

**Confirmado: el cierre está bien y la tajada sigue aceptada.** Miré solo esto,
sembrando otra vez (fichero propio `src/features/vida/__review-t3b.test.tsx`,
17 casos, borrado antes de reportar).

**1 · El suelo, y el borde contraintuitivo: el razonamiento es correcto.**
Sembrados los diez casos, incluidos los dos bordes exactos:

| Noche | Reloj | `nightEndedByNow` |
|---|---|---|
| `23:00 → 5:00` | 3:00 | **false** — no pregunta |
| `23:00 → 5:00` | 4:59 | **false** |
| `23:00 → 5:00` | **5:00 en punto** | **true** — pregunta |
| `23:00 → 5:00` | 9:24 / 23:10 | true |
| `1:00 → 6:40` | 2:00 | **false** |
| `1:00 → 6:40` | 6:39 | **false** |
| `1:00 → 6:40` | **6:40 en punto** | **true** |
| `1:00 → 6:40` | 20:00 | true |
| cualquiera | sin reloj (día que no es hoy) | true |

La regla se sostiene: la noche que **termina** en este día termina a su
`wakeTime` leído en el reloj de este día, cruce o no cruce, porque de qué día es
cada noche lo decide `nightEndingOnWeekday` antes de llegar aquí. No comparar
contra `bedTime` ni sumar 24 h es **lo correcto**, no un atajo: sumar 24 h daría
falso en todo el día para la noche que cruza, y comparar con `bedTime` mezclaría
el comienzo, que es de ayer. La no-cruzada no necesita caso aparte y lo he
verificado en vez de creerlo. El suelo está en la página (`nightStillRunning` en
`nightPromptOpen`), y sin reloj —día pasado o futuro— no cambia nada de lo que
ya estaba aceptado.

**2 · No queda hueco entre medias, y no hay cuarto estado.** Medido en el
navegador a 375 y 768 px, con la noche larga (`20:05 → 08:55`): la franja de
madrugada es **`DIV`** (no se puede tocar: sin `onEdit`, sin ningún `<button>`
dentro y sin «Corregir»), `data-state="unconfirmed"`, y dice «Duermes hasta las
8:55 · Vienes de anoche · 12 h 50 · **aún no ha terminado**» — sin «sin
confirmar», sin «Dormiste» y con el store **vacío**. Los estados del dato siguen
siendo **tres** (`unconfirmed`, `confirmed`, `no-data`): lo comprobé recorriendo
los cuatro caminos de `describeNightBandLog` y quedándome con el conjunto. En
cuanto la noche termina, la franja vuelve a ser el `BUTTON` del criterio 298.
Cero desbordes: 375/375 y 768/768, y los dos botones siguen en 159 × 32 y
356 × 32 px.

**3 · Es una sola regla, no dos que coinciden hoy.** `isSameNightTime` y
`VIDA_NIGHT_SAME_TIME_ERROR` están **declarados una vez** e **importados** por
`VidaAjustesPage.tsx` y `VidaNightSheet.tsx`; ninguno de los dos repite el texto.
El mensaje que pinta la hoja lo comparé **contra la constante**, no contra una
cadena copiada. Y no cambia el comportamiento de Ajustes: allí el formato se
valida **antes** (`isValidHhMm` en `handleNightSubmit`), así que a la
comparación llegan las mismas entradas que llegaban al `===` de antes; su suite
pasa entera sin tocarla (35 pruebas, verdes en mi corrida). En la hoja,
`23:00/23:00` no guarda, enseña ese mismo texto y **no pinta ninguna cifra**;
«No sé a qué hora» en un lado **no** es «la misma hora» y sigue guardando
(`{bedTime: null, wakeTime: '05:00'}`), y una corrección normal sigue guardando.

**4 · El riesgo nuevo: sí, es el precio correcto — con una salida futura.**
Con el diseño de un toque, «Sí, así fue» escribe **la hora planeada de
levantarse**; ofrecerlo a las 4:00 es ofrecer guardar un hecho que todavía no ha
ocurrido, que es justo lo prohibido. Además el coste es **aplazamiento, no
pérdida**: a la hora de levantarse la pregunta aparece, y un día pasado se puede
confirmar después (criterio 306). Quien madruga pierde minutos, no datos.
Se pueden tener las dos cosas, pero **no** reabriendo la franja tal cual: la
hoja se prellena con lo planeado y guardarla sin tocar nada reintroduce el mismo
problema en dos toques. La forma que sí funciona, para quien construya la tajada
4 si el usuario lo pide: mientras la noche pasa, dejar la franja tocable pero
que la hoja abra **sin prellenar la hora de levantarse** (o con «No sé a qué
hora me levanté» ya marcado), de modo que solo se guarde lo que la persona
afirma. Hasta entonces, cerrado está mejor que abierto.

**5 · No se ha movido nada de lo que medí.** Franja de madrugada aparte, las
tres franjas y la pregunta dicen lo mismo y miden lo mismo; el arreglo del ancho
sigue viviendo solo en `VidaNightPrompt.module.scss`; `shared/ui` intacto. Los
otros tres hallazgos (el 299 no comprobable como está redactado, los 32 px de
alto y la lectura del 278) **siguen escritos y sin tocar**.

**Líneas base, corridas por mí:** `pnpm test` **2 fallos de 2283**
(`SearchSelect` ×2, preexistentes; 131 ficheros verdes), `pnpm lint` **14 / 0**,
chunk **1.159,88 kB**, CSS **282,61 kB** en `index-DBh9uCr-.css` — **el mismo
nombre de fichero que en mi build anterior**, o sea el mismo contenido byte a
byte: ninguna regla de SCSS se movió, ni hacia arriba ni hacia abajo. Y el
invalidador, ejecutado sobre `HEAD` exportado con `git archive` y sobre el
árbol: **`f8edc4f3becd` en los dos**, 32 fuentes de forma, ninguna de `/pages/`.
**Nadie pierde la caché con esta tajada**; se le puede prometer al usuario.

#### Tajada 3 · segunda re-revisión, con `23d072b` en la mano (2026-09-25)

**Veredicto: aceptada.** Revisor distinto del que escribió los hallazgos y del
que firmó la primera re-revisión. Reproduje lo que denunciaba cada hallazgo
**sembrando mis propios casos** (dos ficheros temporales, `__review-t3c.test.tsx`
—10 casos— y `__review-t3d.test.tsx` —2 casos—, **borrados antes de reportar**;
`git status` vuelve a estar limpio), no leyendo sus pruebas. La línea base la
corrí entera yo y clava las cuatro cifras.

**Aviso de método, porque cambia lo que se puede afirmar:** el arreglo **no
tiene commit propio**. `23d072b` trae la tajada 3 **entera** —construcción,
cierre de los dos hallazgos, las dos entradas de revisión anteriores y hasta el
grafo regenerado—, así que «el diff del arreglo» no existe como tal y el «antes»
de los hallazgos no es recuperable del historial. Lo que sí se puede afirmar es
el estado de ahora, y eso es lo que medí.

**Hallazgo 1 — la pregunta sin suelo: cerrado.**

- `nightEndedByNow` con mis propios bordes, doce casos, sin reutilizar sus
  constantes: `23:00 → 5:00` es `false` a 0:00, 3:00 y **4:59**, y `true` a
  **5:00 en punto**, 5:01 y 23:10; `1:00 → 6:40` es `false` a 1:00, 2:00 y
  **6:39**, y `true` a **6:40** y 20:00; sin reloj (`null`), `true`.
- La puerta está en la página y es la correcta: `nightPromptOpen` exige ahora
  `!nightStillRunning` (`VidaHoyPage.tsx:392-400`), con `nightStillRunning`
  atado a `isToday`. Techo y suelo salen los dos del dato del usuario
  (`dayWindow.endTime` y `wakeTime`), ninguno es un número inventado.
- **La otra puerta para guardar una hora que no ha llegado también está
  cerrada**, y esto es lo que hace que el arreglo no sea cosmético: la franja de
  madrugada recibe `onEdit` sólo si `!nightStillRunning` (`:1401`). Sembrado por
  mi cuenta: con `stillRunning` la franja es **`DIV`**, cero `<button>` dentro,
  dice «aún no ha terminado», **no** dice «sin confirmar» ni «Dormiste», y su
  `data-state` sigue siendo `unconfirmed`. Sin `stillRunning` vuelve a ser
  `BUTTON` y un clic llama a `onEdit` una vez.

**Hallazgo 2 — las dos horas iguales en la hoja: cerrado.**

- Sembrado: `23:00 / 23:00` en «¿Cómo dormiste?» **no llama a `onSave`**, no
  cierra la hoja, pinta el error en el `role="alert"` y **no aparece ninguna
  cifra** de duración.
- Y comprobé que no rompió lo que sí tiene que guardar: una corrección normal
  guarda `{bedTime:'23:20', wakeTime:'05:40'}` y cierra; «No sé a qué hora me
  acosté» guarda `{bedTime:null, wakeTime:'05:00'}` — «sin dato» en un lado no
  se confunde con «la misma hora».
- **Es una sola regla, no dos copias:** `isSameNightTime` y
  `VIDA_NIGHT_SAME_TIME_ERROR` se declaran una vez (`vida-night.utils.ts:120` y
  `:136`) y los importan los dos sitios; un `grep` por el texto del mensaje no
  devuelve ninguna cadena repetida.
- **Y no cambia Ajustes.** El diff sustituye `bedTime === wakeTime` por
  `isSameNightTime(bedTime, wakeTime)` **después** de `isValidHhMm` en los dos
  campos (`VidaAjustesPage.tsx:236-245`): sobre `HH:mm` canónico la igualdad de
  cadenas y la de minutos son la misma función, así que Ajustes recibe
  exactamente las mismas entradas y da las mismas salidas. Su suite pasa entera
  sin tocarla.

**Que el arreglo no deshizo nada de 288–299.** Las cuatro suites pedidas más las
dos vecinas, corridas por mí: `VidaNightPrompt`, `VidaNightSheet`,
`VidaNightBand`, `VidaHoyPage`, `vida-night.utils` y `VidaAjustesPage` +
`vida-device-notes.store` → **7 ficheros, 369 pruebas, todas verdes**. Y
sembrado aparte: la pregunta tiene **exactamente** dos botones («Sí, así fue»,
«Fue distinto») con su línea «Es tu noche de siempre…», confirmar llama a
`onConfirm` **una vez** y no abre nada (288, 290); la hoja abre prellenada con
`23:00 / 05:00` y el titular «tu noche dice 23:00 → 5:00» (291); con la noche
terminada y sin respuesta la franja dice «sin confirmar» (295); en la plantilla
(`realDay` ausente) no dice ni «confirmado» ni «sin confirmar» (296); y
recorriendo los cuatro caminos de `describeNightBandLog` el conjunto de estados
del dato sigue siendo **tres** (`confirmed`, `no-data`, `unconfirmed`) — «aún no
ha terminado» es una forma de decir `unconfirmed`, no un cuarto estado.

**Alcance del commit, mirado entero.** Fuera de `docs/` y de `graphify-out/`
toca **14 ficheros y todos son de la tajada**: los tres componentes de la noche
(+ sus `.module.scss` y tests), `vida-night.utils.ts`(+test),
`vida-device-notes.store.ts`(+test), `VidaHoyPage.tsx`(+test) y las 8 líneas de
`VidaAjustesPage.tsx`. **`src/shared/` no aparece**: el reparto del ancho de los
dos botones vive en `VidaNightPrompt.module.scss`, una clase de módulo hasheada
que no puede alcanzar a ningún otro botón. Busqué a los vecinos con
`graphify query "quién usa isSameNightTime y VIDA_NIGHT_SAME_TIME_ERROR"` (51
nodos) y confirmé abriendo los ficheros con `grep -rn` sobre `src/`: los únicos
consumidores de los tres símbolos nuevos son `VidaNightSheet`, `VidaAjustesPage`
y `VidaHoyPage`. **Ojo con el grafo aquí:** `23d072b` lo regeneró, así que
refleja el árbol **con** la tajada dentro — sirve para «quién llama a esto
ahora», no para «qué había antes».

**Línea base, corrida entera por mí sobre el árbol limpio:** `pnpm typecheck`
**limpio** (exit 0); `pnpm lint` **14 errores / 0 warnings**; `pnpm test`
**2 fallos de 2283** (`SearchSelect` ×2, preexistentes; 131 ficheros verdes, el
flaky de `IconPicker` no salió); `pnpm build` chunk inicial **1.159,88 kB** y
CSS **282,61 kB** en `index-DBh9uCr-.css`. Las cuatro cifras son **las de
`ENVIRONMENT.md`**, y el CSS **no baja**: no hay ninguna regla comida por un
comentario abierto, así que no hizo falta comparar listas de selectores.

**Las dos decisiones que el arquitecto dejó recomendadas y no cerradas**

- **Cuándo deja de preguntar la mañana.** Recomendaba «mientras sea hoy y no
  haya sueño guardado, sin más puerta». El constructor puso **dos**: techo en tu
  hora de acostarte y suelo en tu hora de levantarte. **Razonable, y mejor que
  lo recomendado**, por dos razones que se pueden comprobar: sin techo, «sin
  confirmar» no se leería nunca antes de medianoche (la pregunta taparía la
  franja todo el día), y sin suelo un toque de madrugada guardaría como real una
  hora de levantarse que no ha ocurrido — justo lo que el criterio 317 prohíbe.
  Ninguna de las dos puertas inventa un número y ninguna escribe nada, así que
  «ignorar» sigue siendo literalmente no tocarla (295). El precio está dicho en
  el commit: quien abre Hoy de madrugada ve la pregunta más tarde; se aplaza, no
  se pierde, y un día pasado se confirma después (306).
- **El aviso de sesión vieja** (`VidaModuleLayout.tsx`). Recomendaba pasarle la
  ventana de hoy en la tajada 2, y **eso es lo que hay**: el layout llama a
  `useVidaDayWindow(getCurrentLocalDate())` y le da `dayWindow.endTime` a
  `VidaStaleSessionPrompt`, con el comentario explicando que el aviso y el
  presupuesto de Hoy no pueden decir dos finales de día distintos. Hecho en la
  tajada 2, no en ésta; lo dejo confirmado porque nadie lo había afirmado
  mirando el fichero.

**Estados.** Sin datos y sin respuesta: cubiertos (y el segundo es el centro de
la tajada). Cargando y error: **no son de esta tajada** (311 y 312 se cerraron
en la 2) y el arreglo no añade ninguna petición. Permisos: no aplica, el dato es
del aparato. Texto largo y móvil a 375 px: **no los volví a medir en el
navegador**, y no hace falta para lo que cambió — el CSS compilado es
`index-DBh9uCr-.css`, **el mismo nombre de fichero con hash de contenido** que
reportó la medición anterior, o sea el mismo CSS byte a byte; ninguna regla se
ha movido desde que se midió 375/375 y 768/768 sin desbordes.

**¿Duplica algo?** No, y el cierre de los hallazgos va en la dirección
contraria: quitó la segunda vara que la hoja tenía para el mismo dato.

**Hallazgos nuevos** (anotados, no devueltos)

6. **El arreglo no tiene commit propio.** Construcción, revisión y cierre de
   hallazgos viajan en `23d072b` junto con 103.000 líneas de grafo regenerado.
   Funciona, pero deja sin historia el «antes» de cualquier hallazgo futuro: el
   siguiente revisor no puede ver qué cambió al cerrarlo. Si vuelve a pasar,
   que el cierre sea su propio commit.
7. **`ENVIRONMENT.md` se modificó dentro de esa misma tanda** (la nota del arnés
   en `public/` y la actualización de las cifras de tests y paquete). El
   contenido es correcto —lo he verificado: 2283 y 1.159,88 kB son lo que mide
   hoy—, pero el protocolo dice que los agentes de la cadena **no** lo tocan.
   Queda dicho; no lo he revertido ni editado.
8. **Un hueco teórico en la ventana de la pregunta:** si alguna vez la hora de
   levantarse cayera **después** del final de la ventana del día (una «noche»
   degenerada del tipo `23:00 → 23:30`, que no cruza), suelo y techo se cruzan y
   la pregunta no saldría nunca ese día. No es ninguna de las noches del render
   ni de los criterios, y la franja seguiría diciendo «sin confirmar», así que
   no se pierde dato. Para quien construya la tajada 4, que es la que mueve la
   ventana con lo real.

Los cinco hallazgos anteriores (el 299 no comprobable como está redactado, los
32 px de alto de los botones, la lectura del criterio 278, y los dos ya
cerrados) **siguen escritos y sin tocar**.

**Lo que no pude revisar.** Nada de `/app/*`: está tras el login y ahí no entro,
así que la pregunta de la mañana **en la app real** sigue siendo prueba manual
del usuario —y con el suelo nuevo hay un paso que sólo él puede hacer: abrir Hoy
**antes** de su hora de levantarse y ver que no pregunta, y volver después y ver
que sí. Tampoco repetí las mediciones de ancho en el navegador (justificado
arriba por el hash del CSS) ni el tema oscuro.

---

### Tajada 4 — Lo real manda y lo que no se sabe se dice

**Veredicto: aceptada.** Es la última: la feature pasa a `delivered` con el
criterio 319 abierto —y sólo él— para el usuario.

**Cómo la revisé.** No con las pruebas del constructor: escribí **22 casos
propios** en dos archivos temporales (`src/features/vida/__rev4-utils.test.ts`
y una copia del arnés de Hoy con mi propio `describe`), los corrí y los **borré
antes de reportar** (`git status` no los lista). Todo lo demás —línea base,
suites de los consumidores— corrido por mí de cero.

**Criterios, uno por uno**

| # | Estado | Lo que comprobé yo |
|---|---|---|
| 300 | **cumplido** | Mi caso, no el suyo: noche `23:00 → 5:00` y corrección `02:15 / 07:50` en Hoy → la línea pasa a «Tu día · **7:50 → 23:00** · dormiste 5 h 35». |
| 301 | **cumplido** | **En el mismo montaje**, sin remontar: tras guardar, la primera fila de la agenda empieza a las 7:50 y **ninguna** fila menciona 5:00 ni 6:3x. El presupuesto se recalculó con ella. |
| 302 | **cumplido** | Día pasado sin contestar: la franja dice «**Tu noche dice 23:00 → 5:00**», «6 h · sin confirmar», y **no** contiene «dormiste» ni «Vienes de anoche». La ventana sigue en 5:00 → 23:00. En el día de hoy el sitio de la franja lo ocupa la pregunta (criterio 288), así que el 302 se lee en los pasados. |
| 303 | **cumplido** | Con `{bedTime: null, wakeTime: '06:10'}` se usa lo que sí se sabe y no se inventa la otra; con `{bedTime:'23:20', wakeTime: null}` la ventana **no se mueve**. |
| 304 | **cumplido** | Sin hora de levantarse, «Tu día · 5:00 → 23:00 (**lo planeado: de tu hora de levantarte no quedó dato**)». |
| 305 | **cumplido con desvío aceptado** | Ninguna duración inventada y **«0 h» no aparece en ninguna parte de la pantalla**, afirmado sobre el `body` entero en tres estados. **Pero el «—» literal que pide el criterio no se lee en ningún sitio** con media noche: la franja dice «sin dato» con palabras y la hoja no pinta duración. Lo acepto: es lo que manda el 296, es mejor de leer, y lo que el 305 protege —que no salga una cifra estimada ni un «0 h»— se cumple. Queda escrito como desvío, no reescribo el criterio. |
| 306 | **cumplido** | Otro día pasado distinto del suyo (lunes 15): la franja sigue ahí, es `BUTTON`, abre «¿Cómo dormiste?», se corrige a 8:05 y su línea pasa a «8:05 → 23:00», con **una sola clave** guardada (`['2026-09-15']`). |
| 307 | **cumplido** | Ese mismo día no pinta «¿Dormiste 23:00 → 5:00?». Salida, no interrupción. |
| 308 | **cumplido** | Su ventana cambia y la de hoy no (comprobado con dos montajes). Y la revisión: con la noche del viernes a las 7:00 la cifra pasa de «de las 18h» a «de las 16h de tu día» — suite verde corrida por mí. |
| 309 | **cumplido, y por los dos caminos** | Lectura: sembré una entrada con fecha de mañana y la ventana no se movió. **Escritura**: pulsé la franja del futuro y **no abre la hoja**; `nightLogs` sigue vacío. La franja es un `DIV`. |
| 310–312 | **cumplido** | Sin noche, `log` no se mira siquiera (`realStart` sólo se calcula si hay franja de arriba) y `resolveVidaDayWindow` se comporta idéntico a la tajada 2. Las guardas de en vuelo / error no se tocaron. |
| 313 / 314 / 315 | **cumplido (medida heredada, con razón)** | `pnpm build` me da **`index-DBh9uCr-.css`, 282,61 kB**: el mismo nombre con hash de contenido que la línea base, o sea **el mismo CSS byte a byte**. Acepto las medidas del constructor a 375 y 768 y en oscuro. Lo único nuevo en el DOM es un `<span class=scheduleNote>` dentro del `<p>` de la línea del día, y esa clase sólo declara `color`: no hay ancho fijo ni `nowrap` que pueda desbordar. |
| 316 | **cumplido** | Barrido mío sobre el `body` entero en el estado nuevo: ni «deberías», ni «desperdicio», ni «apenas», ni «dormiste poco», ni «por qué». Las dos notas dicen qué pasó con el dato. |
| 317 | **cumplido, con un matiz que dejo como hallazgo** (abajo, nº 2) | Ninguna cifra sale de una hora inventada; la hora que no deja día se declara en vez de recortarse. |
| 318 | **cumplido** | Ni una consulta nueva: lo real sale del store del aparato (`zustand`), no del API. Ninguna clave de caché nueva. |
| 319 | **del usuario, y es lo único que queda abierto** | `/app/*` está tras el login y ahí no entro. Los seis pasos, abajo. |

**La regla nueva del hueco teórico, comprobada en sus bordes**

`VIDA_MIN_AWAKE_MINUTES = 30`, y la miré donde duele:

| Caso | Resultado | Bien |
|---|---|---|
| Levantarse **exactamente 30 min** antes del final (22:30 con día que acaba a 23:00) | `real`, ventana **22:30 → 23:00** | sí: el suelo es inclusivo y está dicho así |
| **29 min** (22:31) | `out-of-window` → lo planeado | sí |
| **31 min** (22:29) | `real` | sí |
| Noche degenerada **23:00 → 23:30** con hora real 23:30 | `out-of-window`; la ventana conserva geometría (inicio ≠ fin) y la agenda sigue teniendo filas | sí |
| Corrección absurda 23:59 | `out-of-window` | sí |
| Hora rota (`25:99`) | `no-data`, no se usa | sí |
| Final de día roto | el tope cae al día entero y el dato **no se pierde** | sí |

Y **la UI lo nombra**: con 22:31 la línea del día dice «(**lo planeado: la hora
que guardaste no deja día**)». No lo esconde, que era la duda.

**Qué rompe cerca, y cómo lo busqué**

`graphify explain "useVidaDayWindow"` da los tres llamantes (`VidaHoyPage`,
`VidaRevisionPage`, `VidaModuleLayout`) y confirmé con `grep` literal —el grafo
es de antes del cambio, que para «quién dependía de esto» es justo lo que
quiero—. Luego **abrí cada llamante**:

- **`VidaModuleLayout.tsx:167`** consume **sólo `dayWindow.endTime`**. Y esta
  tajada no toca `endTime` (sigue siendo `dusk?.bedTime ?? hours.endTime`):
  la suscripción nueva al store le hace repintar, pero **no puede cambiarle lo
  que enseña**. Riesgo declarado por el constructor, inerte en la práctica.
- **`VidaRevisionPage.tsx:185`** (`todayWindow`) también consume **sólo
  `endTime`**: intacto. El que cambia es el de la línea 241, el del día que se
  revisa, y es el criterio 308.
- **`VidaPlantillaPage.tsx:122`** usa `useVidaWeekdayWindow`, que no lee nada de
  lo real y deja `log` en su valor por defecto `null`; con `log = null` y noche
  puesta, `realStart` es `unconfirmed` y todo —`startTime`, `startSource`,
  `sleepLabel`, `plannedStartNote`— sale **idéntico** a la tajada 2.
- **`VidaDayBudget`** tiene **un solo** llamante (`VidaHoyPage:1445`) y la prop
  nueva es opcional con `null` por defecto.
- Suites de los vecinos, corridas por mí: `VidaModuleLayout`,
  `VidaPlantillaPage`, `VidaRevisionPage`, `VidaHoyPage`, `VidaNightBand`,
  `VidaNightPrompt`, `VidaNightSheet`, `VidaDayBudget`,
  `VidaTemplateDaySummary`, `useVidaDayWindow`, `vida-night.utils` → **9
  ficheros, 528 pruebas, todas verdes**.

**Las puertas de la tajada 3, intactas.** El `git diff` de `VidaHoyPage.tsx` son
**siete líneas y cinco de comentario**: pasar `plannedStartNote`. El techo y el
suelo de la pregunta de la mañana no se tocan, y las suites de `VidaNightPrompt`
y `VidaNightBand` están verdes.

**Línea base, corrida entera por mí**

| Qué | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 / 0 | **14 / 0**, los mismos seis archivos preexistentes |
| `pnpm test` | 2 de 2283 | **2 de 2304** — `SearchSelect` ×2, los de siempre. 131 ficheros verdes, **el flaky de `IconPicker` no salió** |
| `pnpm build` — chunk | 1.159,88 kB | **1.160,84 kB** (+0,96) |
| `pnpm build` — CSS | 282,61 kB | **282,61 kB**, `index-DBh9uCr-.css`: **mismo hash de contenido** que la línea base. Confirmado, y por eso no hay lista de selectores que comparar |

**Los desvíos declarados, revisados uno a uno**

1. **El `beforeEach` de `VidaRevisionPage.test.tsx` limpiando `nightLogs`:
   arregla una fuga real, no tapa nada.** El store vive fuera de React y no se
   limpia solo; la línea entra en el **mismo** `setState` que ya devolvía
   `patternAnswers` por la misma razón (FEAT-007), y `{}` es exactamente el
   estado de un aparato recién estrenado. Sin ella, la noche confirmada de la
   prueba nueva del 308 le movería la ventana a la siguiente prueba del fichero:
   un fallo en cascada, no un fallo tapado. Comprobado además que ninguna
   aserción de esa suite dependía de que hubiera noche guardada.
2. **«sin dato» en vez de «—»:** aceptado, con el matiz de la tabla de arriba.
3. **Los paréntesis de `VidaDayBudget`: medido, y los dos seguidos no pueden
   pasar hoy.** `plannedStartNote` sólo existe cuando hay franja de arriba, y
   entonces `startSource` es `night` o `night-real` y nunca `fallback`, así que
   `defaultScheduleNote` es `null`. Lo afirmé con una prueba que cuenta los
   paréntesis de la línea: **menos de dos**, y ningún `) (`. La advertencia del
   constructor sigue siendo buena para el día que llegue una tercera coletilla.

**Estados que nadie construye**

- **Vacío** (sin noche), **cargando** y **error**: cubiertos por las guardas de
  la tajada 2, que esta no toca; comprobado que sin franja de arriba la rama de
  lo real ni se evalúa.
- **Sin permisos**: no aplica, todo el módulo es del dueño de la sesión.
- **Texto largo / móvil / oscuro**: CSS idéntico byte a byte; medida heredada
  con razón escrita.
- **Lo que sí falta y no pedía ningún criterio**: nada bloqueante.

**¿Duplica algo que ya existía?** No. Contra la sección 2: `resolveRealDayStart`
y `VIDA_REAL_START_NOTE` son nuevos y no había nada que hiciera eso;
`vida-time.utils.ts` sigue sin tocarse (criterio 287); la nota se pinta con
`styles.scheduleNote`, que **ya existía**, en vez de estrenar una regla; y no
hay ninguna clave de `localStorage` ni consulta nueva. El `log` se lee en **un
solo sitio**, que es justo lo contrario de duplicar la regla en dos pantallas.

**Hallazgos (no devuelven la tajada; quedan escritos)**

1. **El «—» del criterio 305 no se lee en ninguna pantalla** con media noche.
   Decidido arriba: se acepta «sin dato».
2. **Media noche con la hora de levantarse conocida enseña la ventana real al
   lado de la duración planeada, sin decir que es la planeada.** Con
   `{bedTime: null, wakeTime: '06:10'}` la línea dice «Tu día · **6:10** →
   23:00 · **duermes 6 h**»: el inicio es real, la cifra es la de tu noche, y
   ahí `plannedStartNote` es `null` porque la razón es `real`. Son **los dos
   datos que no casan** que el propio comentario del código dice querer evitar
   (23:00 + 6 h ≠ 6:10). No devuelvo por esto —ninguna cifra es inventada, la
   franja dice «sin dato» y ningún criterio del 300 al 309 lo prohíbe—, pero si
   alguna vez se retoca esa línea, es lo primero que arreglar.
3. Una **línea en blanco doble** colada en `VidaRevisionPage.test.tsx` tras la
   prueba nueva. Cosmética, el linter no la mira.
4. Siguen abiertos, sin tocar, los **hallazgos 3, 4 y 5 del revisor de la
   tajada 3**.
5. **`ENVIRONMENT.md` no lo he modificado** (no me toca), pero le falta algo que
   ya ha costado turnos a dos agentes: **no existe `preview_stop` en todas las
   sesiones**, así que «si arrancaste algo, páralo por su `serverId`» no siempre
   se puede cumplir. Hay un Vite en el 5173 que arrancó el constructor de esta
   tajada y sigue vivo.

**Lo que no pude comprobar**

`/app/*` está tras el login y ahí no entro: **el recorrido real con datos
reales es del usuario**, y es exactamente el criterio 319. Tampoco volví a medir
anchos ni el tema oscuro en el navegador — justificado por el hash del CSS.

**Para el usuario**

Hasta ahora tu día empezaba a la hora que **planeaste** levantarte, dijeras lo
que dijeras por la mañana. Desde ahora manda **la hora a la que te levantaste de
verdad**: en cuanto confirmas o corriges tu noche, la línea del día, los huecos
y el presupuesto se rehacen al momento, sin recargar nada. Si te levantaste a
las 6:40, la app deja de ofrecerte un rato libre a las 5:30 y te dice «dormiste
5 h 40» en vez de repetirte lo que tenías planeado.

Y cuando no se sabe algo, la app **lo dice en vez de rellenarlo**: si marcas «No
sé a qué hora», la ventana vuelve a lo planeado con un paréntesis que lo aclara,
y nunca verás un «0 h» ni una cifra inventada. Los días pasados que dejaste sin
contestar no se pierden: los abres, la franja sigue diciendo «sin confirmar», la
tocas y los cuentas —y eso recalcula **su** día y **su** revisión, no los de
hoy—. Un día futuro, en cambio, no se puede tocar: ahí sólo hay lo planeado.

**Los seis pasos para probarlo a mano** (criterio 319, con la API desplegada):

1. Entra en **Vida · Ajustes** y deja tu noche en **23:00 / 5:00**, con todas
   las noches marcadas.
2. Abre **Vida · Hoy** por la mañana, responde «**Fue distinto**», pon
   `1:00 / 6:40` y guarda: la línea tiene que pasar a «Tu día · **6:40 → 23:00**
   · dormiste 5 h 40» y **el primer hueco de la mañana ya no puede ofrecerte las
   5:30**.
3. En esa misma hoja, pulsa «**No sé a qué hora me levanté**» y guarda: la línea
   vuelve a «5:00 → 23:00» **y dice entre paréntesis que eso es lo planeado**.
4. Abre un **día pasado** sin confirmar: la franja de arriba dice «sin
   confirmar», la tocas, la corriges, y la cifra de su **Revisión** («de las Xh
   de tu día») cambia con ella.
5. Abre un **día futuro**: franja de siempre, sin pregunta y sin poder tocarla.
6. Mira la franja «**Tu noche dice …**» en el **móvil** y en **tema oscuro**:
   tiene que leerse entera y cambiar de color con el tema.
