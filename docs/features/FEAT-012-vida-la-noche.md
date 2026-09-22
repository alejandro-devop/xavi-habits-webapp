---
id: FEAT-012
title: La noche — dormir deja de ser un agujero y pasa a ser el borde del día
status: specified
architect: yes
area: features/vida, features/settings, **API (xavi-platform-node)**
requested: 2026-09-22
updated: 2026-09-22
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
| 1 | **Tu noche existe y se ve en la plantilla.** «Tu noche» en Ajustes (las dos horas + qué noches, guardadas en el API) y las dos franjas en la plantilla, fuera de la lista y fuera del presupuesto. Criterios 260–277 y los transversales que apliquen. | **bloqueada por el API** |
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

*(pendiente)*

## 3. Construcción — feature-builder

*(pendiente)*

## 4. Revisión — feature-reviewer

*(pendiente)*
