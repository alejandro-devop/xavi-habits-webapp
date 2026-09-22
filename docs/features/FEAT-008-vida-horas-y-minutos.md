---
id: FEAT-008
title: El tiempo se escribe en horas y minutos, y se ve a qué hora acabas
status: specified
architect: yes    # el control de «Cuánto» es compartido por cinco pantallas (dos fuera de lo pedido) y la hora de fin ya se calcula en dos sitios: decidir dónde vive el cambio es una decisión de código compartido, no de tajada
area: features/vida
requested: 2026-09-22
updated: 2026-09-22
---

# FEAT-008 — El tiempo se escribe en horas y minutos, y se ve a qué hora acabas

## 1. The request — feature-analyst

**Summary for whoever's next:** el campo único «en minutos» de **«Cuánto»** pasa
a ser **dos campos, horas y minutos**, y debajo aparece **la hora a la que acaba**
lo que estás programando («empieza 19:00, dura 1 h 20 → acaba a las 20:20»). La
primera tajada son los dos campos en la plantilla (la hoja del ítem y el panel de
añadir); la hora de fin es la segunda. **El API no se toca**: `durationMinutes`
sigue viajando en minutos y la conversión la hace el cliente.

**What problem it solves:** la plantilla de Vida **es una agenda** —«a esta hora
hago esto, por este tiempo» (`docs/vida/PLAN.md`, decisión 13)— pero el campo con
el que se escribe el tiempo no es de agenda, es de calculadora: pide **minutos**.
Programar «hora y media» obliga a hacer la multiplicación de cabeza y escribir
`90`, un número que después nadie vuelve a leer como hora y media. Y el dato que
de verdad se está decidiendo al poner un bloque en una agenda —**hasta qué hora
te ocupa**— hoy no se ve mientras se decide: se ve después, al armar el día en
Hoy, cuando ya no estás pensando en eso. El usuario no está pidiendo un control
más cómodo: está pidiendo que la pantalla hable el idioma en el que él piensa el
día («de 19:00 a 20:20») en vez del idioma en el que se guarda el dato (`80`).

Por eso son dos cosas y las dos importan: escribir el tiempo como se dice, y
**ver la consecuencia en el reloj mientras la escribes**.

**Who it's for:** el usuario del módulo Vida, **armando o retocando su plantilla**
—la hoja de un ítem y el panel «Añadir a mi Vida» en `/app/vida/plantilla`—, que
es el momento en que se decide a qué hora pasa cada cosa. Es un gesto de pocos
minutos y pocas veces (FEAT-005 lo dice: se entra poco y se sale con la semana
cambiada), así que cada fricción cuenta el doble: no hay costumbre que la absorba.

**User's words:** (verbatim, 2026-09-22)

> «al agregar ítems en la plantilla y seleccionar el tiempo de manera libre, me
> gustaría tener dos campos "horas" y "minutos" y por debajo tú haces la
> conversión, adicional poder ver visualmente la hora en que finaliza la actividad
> que estoy programando, ayuda mucho»

**Lo que ya estaba decidido y manda por encima de esto:** el API no cambia en la
v1 salvo lo ya excepcionado (`PLAN.md`, decisión 3), la plantilla es una agenda
(decisión 13), y las píldoras **15 · 30 · 45 · 1h · libre** son palabras del
usuario al resolver D1 de FEAT-003 («al momento de iniciarla indico con
selectores pre-diseñados el tiempo (15, 30, 45, 1h u opción libre)»): **no se
quitan**. Esto cambia lo que hay detrás de «libre», no las píldoras.

**Out of scope:** (lo que alguien podría dar por incluido y NO lo está)

- **Cambiar el contrato del API.** `VidaItem.durationMinutes` sigue siendo
  **minutos enteros** y `ActivityDayPlanItem` sigue con `startTime`/`endTime`.
  Los dos campos son **de pantalla**; la conversión vive en el cliente. Ni una
  migración, ni un documento GraphQL nuevo.
- **Rediseñar todo lo que tenga minutos en Vida.** Hay **cinco** sitios donde hoy
  se escribe una duración a mano, todos a través del mismo control
  `VidaDurationPills`: la hoja del ítem, el panel de añadir, **«añadir a un
  hueco» en Hoy** (`VidaPlaceInGapSheet`), **«Cuánto duró» al registrar tiempo
  pasado** (`VidaLogSessionSheet`) y **«Cuánto duró» al cerrar una sesión**
  (`VidaFinishSessionModal`). El usuario pidió **la plantilla**: los tres últimos
  son la **tajada 3**, que es la única que se puede tirar entera sin dañar nada.
- **La hora de fin en la tarjeta de la plantilla, en la cuadrícula semanal, en la
  agenda de Hoy o en los chips del hueco.** La tarjeta seguirá diciendo «8:00 ·
  40 min · L M X J V» (FEAT-005, criterio 6). Lo que se pidió es verla **mientras
  programas**, no en todas partes; y una hora de fin repetida en cada tarjeta es
  ruido en una lista que ya se ordena por hora.
- **Avisar de que un bloque se pasa del fin de tu día** (23:00 por defecto,
  ajustes de Vida). Es cierto y sería útil, pero obliga a meter `useVidaDayHours`
  en dos pantallas que hoy no lo conocen y abre la pregunta de qué se hace
  entonces. Se anota, no se construye.
- **Avisar de solapes** («a las 19:00 ya tienes otra cosa»). Sigue como está:
  el panel de añadir ya lo dice a su manera (FEAT-005, criterio 33) y los solapes
  no se bloquean aquí (decisión (f) de FEAT-005). La hora de fin **no** estrena
  detección de choques.
- **Cambiar lo que Hoy hace al armar el día.** Ni el `DEFAULT_BLOCK_MINUTES` de
  30 para los ítems sin duración, ni el recorte a `23:59` de `calculateEndTime`.
  Esta feature **enseña la verdad** sobre eso; no la cambia (ver criterio 123).
- **Segundos, o duraciones con decimales.** El módulo habla `HH:mm` y minutos
  enteros desde F0 y sigue igual.
- **Un selector de duración tipo rueda, un `input type="time"` usado como
  duración, o un desplegable de horas.** El usuario pidió **dos campos** que se
  escriben; y en móvil un `type="time"` abre el reloj del sistema, que es para
  horas del día, no para duraciones.
- **Recordar la última duración usada** o proponer una por defecto. La duración
  sigue siendo **opcional y vacía por defecto**.
- **Tocar el formateador de duración.** `formatDurationMinutes` («1 h 35 min») y
  `formatDurationFromMinutes` («1h 35») ya existen en
  `src/features/vida/utils/vida-time.utils.ts` y **los usa medio módulo**: no se
  escribe un tercero ni se cambia el texto que devuelven.

**Acceptance criteria:** *(siguen la numeración del módulo; FEAT-007 llegó al
106)*

*Dos campos, horas y minutos, en la plantilla (tajada 1)*

- [ ] 107. En **la hoja del ítem** (`VidaActivitySheet`, campo «Cuánto») y en el
  panel **«Añadir a mi Vida»** (`VidaTemplateAddPanel`), lo que hoy es un campo
  único de minutos pasa a ser **dos campos seguidos: horas y minutos**, cada uno
  con su unidad visible («h» y «min»). La etiqueta deja de decir «· opcional, **en
  minutos**» y dice «· opcional»: ya no se pide una unidad concreta.
- [ ] 108. **Las píldoras 15 · 30 · 45 · 1h · libre se quedan y siguen
  funcionando.** Tocar «1h» deja los campos en 1 h y 0 min; volver a tocarla los
  vacía (la duración es opcional y quitarla sigue siendo un toque). Tocar una
  píldora fija estando escrito algo a mano lo reemplaza, como hoy.
- [ ] 109. **Lo ya guardado se abre repartido, nunca vacío:** un ítem de **95
  min** abre **1 h 35 min**; uno de 45, `0 h 45 min` con la píldora «45»
  encendida; uno de 60, con la píldora «1h» encendida (y no «libre» abierto);
  uno **sin duración**, con los dos campos vacíos y ninguna píldora encendida.
- [ ] 110. **Lo que viaja al API no cambia:** `durationMinutes = horas × 60 +
  minutos`, entero. Abrir un ítem de 95 min y guardar **sin tocar la duración**
  manda **exactamente 95**, no 90 ni 96 ni `null`. (Comprobable con un espía
  sobre `vidaItemUpdate`, como se hizo en FEAT-007, criterio 96.)
- [ ] 111. **Vacío sigue siendo vacío, y cero no existe:** los dos campos vacíos
  guardan **`null`**, nunca `0`. «0 h 0 min» escrito a mano también es **sin
  duración**, no un bloque de cero minutos.
- [ ] 112. **Escribir solo minutos funciona y se ordena solo:** con `90` en
  minutos, **mientras se escribe no se pelea** (teclear `9` no salta a `0 h 9`);
  **al salir del campo** se reparte en **1 h 30 min**, sin aviso, sin color y sin
  una palabra de reproche. Guardar sin haber salido del campo guarda **lo mismo**
  (90 minutos): la normalización es de presentación, no de dato.
- [ ] 113. **Nada imposible se guarda a escondidas:** minutos ≥ 60 se reparten
  (300 → 5 h 0 min); un total que pasa de **24 h** queda en **23 h 59 min** y el
  campo lo dice en una línea llana («como mucho 23 h 59 min»); letras y signos no
  entran (`inputMode="numeric"`, y lo que no sea un número se ignora en vez de
  dejar el campo en un estado raro).
- [ ] 114. **Móvil y lector de pantalla:** los dos campos abren **teclado
  numérico** (`inputMode="numeric"`), **no cambian de valor al desplazar la rueda
  del ratón** sobre ellos, y cada uno tiene **su propio nombre accesible**
  («horas» y «minutos»), no uno compartido. El grupo sigue llamándose «Cuánto
  dura».
- [ ] 115. **Tabular no pelea:** `Tab` va de horas → minutos → el siguiente
  control, y `Shift+Tab` al revés. **No hay salto automático de foco** al llenar
  las horas: corregir lo escrito no puede depender de adivinar cuándo se mueve el
  cursor.
- [ ] 116. A **375 px** los dos campos con sus unidades caben **en una línea** sin
  scroll horizontal (medido con `scrollWidth === clientWidth`), cada uno con un
  área tocable de al menos 44 px de alto; en **tema oscuro** los rótulos y las
  unidades llegan a **4,5:1**.
- [ ] 117. **No se duplica la aritmética del tiempo:** el reparto minutos ↔ (h, m)
  vive en **una sola función pura**, en
  `src/features/vida/utils/vida-time.utils.ts`, junto a las que ya están, con sus
  tests; y **no se escribe un tercer formateador** de duración:
  `formatDurationMinutes` y `formatDurationFromMinutes` se quedan como están y
  se siguen usando donde ya se usan.
- [ ] 118. **Los tres sitios que no se pidieron no cambian en esta tajada:**
  `VidaPlaceInGapSheet`, `VidaLogSessionSheet` y `VidaFinishSessionModal` siguen
  con el campo de minutos tal cual, **y sus tests siguen pasando sin tocar ni una
  línea**. Si el cambio en `VidaDurationPills` no puede ser opt-in, eso es un
  hallazgo del arquitecto, no algo que se descubra a mitad de la tajada.

*La hora de fin, visible mientras programas (tajada 2)*

- [ ] 119. En **la hoja del ítem**, con hora de inicio y duración puestas, se lee
  **debajo de «Cuánto»** la hora a la que acaba: **«Acaba a las 20:20»** para
  19:00 + 1 h 20. Es texto, no un campo, y **no guarda nada**.
- [ ] 120. **La misma línea, con las mismas palabras, en el panel «Añadir a mi
  Vida»**: se ve **al añadir**, no solo al editar. Es el momento que el usuario
  nombró («la actividad que estoy programando»).
- [ ] 121. **Se recalcula al momento**, mientras se escribe —no al salir del
  campo— y sobre **el total de verdad**: con `90` sin normalizar todavía en
  minutos, el fin es el de 1 h 30, no el de 90 h ni el de 30 min. **Nunca se
  enseña un fin que no corresponde con lo escrito.**
- [ ] 122. **Sin hora de inicio no hay fin, y no se inventa uno:** se lee
  «**Ponle hora y te digo a qué hora acaba**». Nunca «Acaba a las 1:20» contando
  desde medianoche. **Sin duración tampoco hay línea de fin**, y no se usa el
  `DEFAULT_BLOCK_MINUTES` (30 min) como si fuera lo que el usuario eligió: eso
  lo dice ya la vista previa de Hoy, con sus palabras.
- [ ] 123. **Si cruza la medianoche se dice entero, incluida la parte
  incómoda:** 23:30 + 1 h 20 se lee **«Acaba a las 0:50, ya del día siguiente»**
  y, pegado, lo que Hoy hará de verdad: **«Hoy lo cortará a las 23:59 al armar el
  día»** —que es lo que hace `calculateEndTime`
  (`vida-time.utils.ts:79`, sin `% 24`)—. **Jamás se enseña `23:59` a secas como
  si fuera el fin elegido**, que es la única forma de mentir aquí.
- [ ] 124. **La línea de fin y la línea de FEAT-007 conviven en un orden fijo**
  bajo «Cuánto»: **(1)** los dos campos y las píldoras, **(2)** la hora de fin,
  **(3)** lo que dicen tus semanas (`VidaPatternAdvice` o la nota llana del
  criterio 95). La de fin es **dato de lo que estás escribiendo ahora**; la de
  FEAT-007 es **historia**, y por eso va después. La de fin **no se pinta dentro
  de la caja violeta** ni usa su acento. Con las dos presentes a **375 px** no hay
  solape ni scroll horizontal.
- [ ] 125. **Una sola cuenta de la hora de fin en todo el módulo.** La vista
  previa que ya existe («Así queda en Hoy: lunes, miércoles y viernes **de 9:00 a
  9:45**», `describeTemplatePreview` en `vida-template.utils.ts:484`) **se queda y
  no se duplica**: la línea nueva o sale de ahí, o aquella pasa a apoyarse en lo
  nuevo. Lo que no puede haber son **dos cuentas que puedan discrepar**.
- [ ] 126. **`calculateEndTime` no cambia de comportamiento.** Hoy recorta a
  `23:59` y **eso alimenta el `endTime` que viaja al API**
  (`vida-gap-form.utils.ts:293`). Si hace falta una versión que sepa cruzar
  medianoche para **enseñar**, se añade al lado, con su nombre y sus tests, y la
  vieja se queda intacta.
- [ ] 127. La hora se escribe con el formato del módulo —**«20:20», «0:50», sin
  cero a la izquierda** (`formatTimeForDisplay`)—, y no se estrena un segundo
  formato de hora.
- [ ] 128. **Se anuncia sin dar la lata:** la línea de fin va enlazada a los
  campos (`aria-describedby`) y se anuncia como estado (`aria-live="polite"`),
  **no una vez por tecla**. En oscuro llega a 4,5:1.

*Los demás sitios donde se escribe una duración (tajada 3 — la prescindible)*

- [ ] 129. El mismo par de campos en **«añadir a un hueco» de Hoy**
  (`VidaPlaceInGapSheet`), **respetando el tope que ya existe**: con un hueco de
  40 min, las píldoras que no caben se siguen apagando y «Aquí caben 40 min»
  sigue diciéndose exactamente igual. La regla no cambia: solo cambia cómo se
  escribe el número.
- [ ] 130. El mismo par en **«Cuánto duró»** (`VidaLogSessionSheet` y
  `VidaFinishSessionModal`), con lo ya registrado repartido igual (95 → 1 h 35).
- [ ] 131. **Ninguna de esas tres pantallas cambia lo que guarda**: siguen
  mandando minutos, y sus criterios de FEAT-003 y FEAT-004 siguen cumpliéndose
  (sus tests no pierden afirmaciones; si alguna se deroga, se dice cuál y por qué).

*Transversales, en las tres tajadas*

- [ ] 132. **Ni una palabra de reproche** en nada de lo nuevo: ni «inválido», ni
  «error», ni rojo por escribir 90 minutos. El test de vocabulario del módulo
  cubre los archivos tocados.
- [ ] 133. **Línea base no peor**: typecheck limpio, lint 14/0, los mismos 2
  fallos preexistentes de `SearchSelect`, build exit 0 y el chunk sin crecer más
  de lo que pesen las líneas propias (ninguna de iconos).
- [ ] 134. **Solo lo puede cerrar el usuario** (todo `/app/*` está detrás del
  login y los agentes no entran): con la API despierta, abrir un ítem **de 95
  min** y verlo como **1 h 35**; escribir **90** en minutos y ver cómo se ordena
  al salir; poner **19:00 + 1 h 20** y leer **20:20**; **guardar** y comprobar en
  Hoy que el bloque va de 19:00 a 20:20; probar los dos campos **en el móvil de
  verdad** (teclado numérico y tabulación, que es lo único que ningún agente puede
  comprobar); y poner **23:30 + 1 h 20** para leer lo que dice de la medianoche.

**Slices:** (vertical, cada una usable sola)

| # | What it does | State |
|---|---|---|
| 1 | **Dos campos, horas y minutos, en la plantilla.** «Cuánto» se escribe como se dice, en la hoja del ítem y en el panel de añadir; las píldoras se quedan; lo guardado se abre repartido; 90 se ordena solo al salir del campo; el API recibe lo mismo de siempre. Útil sola: es la mitad del pedido y la que quita la multiplicación de cabeza. | pending |
| 2 | **La hora de fin, mientras programas.** Debajo de «Cuánto», «Acaba a las 20:20», en la hoja **y** en el panel; sin hora dice qué falta; si cruza medianoche lo dice entero, incluido lo que Hoy hará; convive con la línea de FEAT-007 en un orden fijo y **no duplica** la cuenta que ya existe. Útil sola: es el dato que le faltaba a la cara de la agenda. | pending |
| 3 | **Los otros tres sitios donde se escribe una duración**: «añadir a un hueco» en Hoy y los dos «Cuánto duró» de sesión. Coherencia del módulo entero. **Es la única que se puede no construir** sin que 1 y 2 pierdan nada. | pending |

**Por qué este orden:** la 1 es donde está el pedido literal y donde vive el
riesgo (un control compartido por cinco pantallas); la 2 se apoya en ella —la
hora de fin se lee mejor cuando la duración ya se escribe en horas— y es puro
texto derivado, sin una sola escritura nueva; la 3 es repetir lo ya resuelto en
sitios que el usuario **no pidió**, y por eso va al final y se puede caer.

**Architect? yes** porque:

1. **El control es compartido y dos de sus cinco consumidores están fuera del
   alcance pedido.** `VidaDurationPills`
   (`src/features/vida/components/VidaDurationPills/VidaDurationPills.tsx:36`) lo
   usan `VidaActivitySheet:597`, `VidaTemplateAddPanel:311`,
   `VidaPlaceInGapSheet:214`, `VidaLogSessionSheet:283` y
   `VidaFinishSessionModal:157`. Decidir si el cambio es **una prop opt-in**, un
   **componente nuevo al lado**, o **el cambio para todos de una vez** es una
   decisión de código compartido que no se puede tomar a mitad de tajada — y de
   ella depende literalmente si la tajada 3 existe.
2. **La hora de fin ya está calculada en dos sitios y hay que decidir cuál manda,
   una vez.** `describeTemplatePreview` (`vida-template.utils.ts:484`) ya produce
   «de 9:00 a 9:45» en la misma hoja, y `calculateEndTime`
   (`vida-time.utils.ts:79`) recorta a `23:59` **porque su resultado viaja al
   API** como `endTime` (`vida-gap-form.utils.ts:293`). Enseñar el cruce de
   medianoche sin romper eso es exactamente el tipo de decisión que, tomada por
   inercia, se paga en un bloque que aparece de madrugada.
3. **El sitio físico está disputado.** FEAT-007 acaba de poner su línea de
   patrones **justo debajo de «Cuánto»** (`VidaActivitySheet.tsx:603-619`). El
   criterio 124 fija el orden, pero quién envuelve a quién y con qué estilos es
   de quien conoce `VidaPatternAdvice`.

**Lo que ya existe y NO se vuelve a construir** (con su ruta):

- **El control de «Cuánto»:** `components/VidaDurationPills/VidaDurationPills.tsx`
  — las píldoras, el estado de «libre» abierto, el `maxMinutes` que apaga las que
  no caben y el `onChange(minutes | null)`. **El contrato hacia fuera son
  minutos, y así se queda.**
- **La aritmética del tiempo:** `utils/vida-time.utils.ts`
  (`parseTimeToMinutes:41`, `minutesToTime:49`, `calculateEndTime:79`,
  `formatDurationFromMinutes:84`, `formatDurationMinutes:98`,
  `formatTimeForDisplay:110`, `isValidHhMm:59`, `DURATION_PILLS:116`,
  `DEFAULT_BLOCK_MINUTES:119`), con sus tests en `vida-time.utils.test.ts`.
- **La hora de fin como frase:** `utils/vida-template.utils.ts:484`
  (`describeTemplatePreview`, con `rangeText` «de 9:00 a 9:45» y el caso «sin
  hora» y «sin duración» ya escritos y probados).
- **La línea de patrones bajo «Cuánto»:** `components/VidaPatternAdvice/` y su uso
  en `VidaActivitySheet.tsx:603`.
- **Lo que queda libre en un hueco:** `utils/vida-gap-form.utils.ts`
  (`describeLeftovers`, la validación del tramo) — la tajada 3 lo respeta, no lo
  reescribe.
- De `shared/ui`: `Input`, `SteppedModal`, `Button`. El patrón de dos campos
  numéricos seguidos con teclado numérico tiene precedente en
  `features/auth/components/OtpInput/OtpInput.tsx:73` (pero **aquél salta el foco
  solo, y aquí eso está prohibido por el criterio 115**: es un código, no una
  duración que se corrige).

**Hipótesis marcadas, técnicas, para que el arquitecto las confirme o las tire**
(no son del usuario y no las tomo yo):

- **El cambio cabe dentro de `VidaDurationPills` con una prop aditiva**
  (`freeInput: 'minutes' | 'hoursAndMinutes'`, por defecto lo de hoy), porque el
  valor que entra y sale ya es `number | null` en minutos y los cinco llamadores
  pasan exactamente eso. Si es así, la tajada 3 es cambiar **tres props** y las
  tajadas 1 y 2 no tocan Hoy ni las sesiones. **Es lo que hay que verificar
  primero.**
- **El reparto (h, m) es estado de pantalla, no dato.** Guardar el borrador como
  minutos y derivar los dos campos de él evita el bug clásico de los dos campos
  desincronizados; el precio es que normalizar `90 → 1 h 30` en el blur tiene que
  ser un re-render, no una escritura. La alternativa —guardar `{h, m}` en el
  estado— hace lo contrario. Que se decida una vez.
- **La línea de fin puede salir de `describeTemplatePreview` sin tocarla**: ya
  devuelve `rangeText` y `complete`. Lo que **no** sabe hacer es el cruce de
  medianoche (criterio 123), y ahí es donde entra código nuevo.
- **El cruce de medianoche es hoy imposible de representar en el módulo entero**:
  la cabecera de `vida-time.utils.ts` lo dice literalmente («aquí nada cruza
  medianoche: el día acaba en `vidaDayEndTime`»). Por eso el criterio 123 **no
  arregla** el módulo: lo dice en voz alta en el único sitio donde alguien lo
  puede escribir.

**Decisions that aren't mine:** *(resueltas por el analista con el criterio del
módulo. Ninguna cambia el modelo de datos ni toca el API, así que **ninguna
bloquea**; todas se revierten en una línea si el usuario prefiere otra cosa.)*

- **(a) ¿Se cambian también los tres sitios que no se pidieron (el hueco de Hoy y
  los dos «Cuánto duró»)? — resuelta: sí, pero en la tajada 3 y aparte.**
  *A favor de hacerlo:* dejar dos formas de escribir una duración en el mismo
  módulo es la clase de incoherencia que después se lee como un fallo.
  *A favor de no hacerlo:* el usuario pidió la plantilla, y «Cuánto duró» se
  escribe **después** de que la cosa pasó (registrar 20 minutos), donde el campo
  de minutos es igual de bueno. Por eso queda **la última y separable**: si tras
  probar las dos primeras el usuario dice que basta, se cierra la feature en 2/3
  sin deuda.
- **(b) ¿La hora de fin también al añadir, o solo al editar? — resuelta: también
  al añadir** (criterio 120). El usuario dijo «la actividad que **estoy
  programando**», y programar es justo lo que se hace en el panel. Además el panel
  ya tiene los dos datos: no cuesta una consulta más.
- **(c) ¿Cuándo se normaliza 90 → 1 h 30? — resuelta: al salir del campo, nunca al
  teclear** (criterio 112). Normalizar tecla a tecla convierte `9` en `0 h 9` y
  hace imposible escribir 90; normalizar solo al guardar deja al usuario mirando
  un `90` que no sabe si se entendió. El blur es el único momento en que el
  usuario ya terminó de decir lo que quería decir.
- **(d) ¿Qué se hace si cruza la medianoche? — resuelta: se dice la verdad
  entera, y no se bloquea** (criterio 123). Las opciones eran: **(i)** impedir que
  la duración pase de medianoche —cómodo de programar y mentiroso: el usuario
  escribió lo que escribió—; **(ii)** enseñar `23:59` como hoy hace el código
  —peor: parece un fin elegido—; **(iii)** enseñar `0:50` **y** lo que Hoy hará al
  armar el día. La (iii) es la única que cumple «todo lo que se enseñe tiene que
  ser cierto». **Arreglar el recorte de Hoy no entra aquí**: es otra
  conversación, y si el usuario la quiere, es una feature propia.
- **(e) ¿Se quitan las píldoras ahora que se escribe cómodo? — resuelta: no**
  (criterio 108). Son palabras del usuario (D1 de FEAT-003) y quitarlas sería
  trabajo para tener menos.
- **(f) ¿Hora de fin en la tarjeta, en la cuadrícula y en Hoy? — resuelta: no**
  (está en «Out of scope»). Dicho por si la lectura era otra: lo que se pidió es
  verla **al programar**. Si al usarlo el usuario la echa de menos en la tarjeta,
  es una línea de una feature futura y no se reabre esto.

**Sobre el render — mi opinión, escrita, porque es la regla más dura del
proyecto:**

**Mi lectura: esto no necesita un render de pantalla aprobado, pero sí un
fragmento.** La regla del plan (decisión 6) dice «renders **antes de cada
pantalla nueva**». Aquí **no hay pantalla nueva ni cambia la arquitectura de
información de ninguna**: el marco **B** de `docs/vida/assets/06-vida-plantilla.html`
—aprobado el 2026-09-20— ya dibuja «Cuánto» con sus píldoras en su sitio, y la
tajada 1 cambia **lo que hay detrás de «libre»** dentro de ese campo. Eso es un
cambio de control dentro de una pantalla aprobada.

**La tajada 2 sí añade contenido visible que ningún render aprobado dibuja** (una
línea de texto nueva bajo «Cuánto», en un sitio que FEAT-007 acaba de ocupar). Y
ese hueco es exactamente donde la regla existe para evitar sorpresas. Lo honesto
—y barato— es **un fragmento estático**, no una pantalla: el campo «Cuánto»
aislado, con sus cuatro estados (los dos campos vacíos · 1 h 20 con «Acaba a las
20:20» · sin hora de inicio · cruzando medianoche) y la línea de FEAT-007 debajo
para ver que conviven, a 375 px y en escritorio. Son minutos de trabajo y deja la
regla intacta en vez de gastada.

**Y es una opinión, no una decisión mía:** si el usuario dice «tíralo p'alante»,
la feature está lo bastante especificada para construirse sin el fragmento, y en
ese caso pido que se mire **lo primero** en cuanto esté en Vercel.

---

*Escrito por `feature-analyst` el 2026-09-22. Fuentes: la frase del usuario de
ese día, `docs/features/PROTOCOL.md`, `docs/vida/PLAN.md` (decisiones 3, 12 y 13
y las fases F2, F4 y F6), la sección 1 de `FEAT-005-vida-plantilla.md` (criterios
6, 18, 20 y 33, y sus decisiones (d) y (f)), `docs/features/BOARD.md` (FEAT-007
`delivered` 4/4, que deja la numeración en el 106), y el código:
`VidaDurationPills.tsx`, `VidaActivitySheet.tsx:564-664`,
`VidaTemplateAddPanel.tsx:294-321`, `VidaPlaceInGapSheet.tsx:210-293`,
`vida-time.utils.ts` entero, `vida-template.utils.ts:444-539` y
`vida-gap-form.utils.ts:293`. **Sin `Bash`, no se pudo correr `graphify`**: la
exploración fue con `Grep`/`Glob` y lectura por rangos, y los cinco consumidores
de `VidaDurationPills` están contados con un `Grep` sobre `src/`, no estimados.*

## 2. The plan — feature-architect

*(pendiente)*

## 3. Construction — feature-builder

*(pendiente)*

## 4. Review — feature-reviewer

*(pendiente)*
