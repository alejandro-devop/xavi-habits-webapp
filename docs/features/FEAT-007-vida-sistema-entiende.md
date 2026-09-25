---
id: FEAT-007
title: Lo que se repite — adherencia, patrones por actividad y avisos con tus propios datos
status: delivered
architect: yes
area: features/vida
requested: 2026-09-21
updated: 2026-09-22
---

# FEAT-007 — Lo que se repite: adherencia, patrones por actividad y avisos con tus propios datos

## 1. La petición — feature-analyst

**Resumen para quien siga:** una tercera sección dentro de Revisión («Un día» ·
«La semana» · **«Lo que se repite»**) que deriva **en cliente** —de
`activityDayPlan` y `activityFollowUpsInDates` de las **últimas 6 semanas**— la
adherencia semana a semana y el patrón de cada actividad, y los devuelve como
**preguntas con dos salidas** aquí, en Hoy al planear y en la hoja de la
plantilla. **Nada de backend.** La primera tajada es solo la adherencia: la
sección existe, se lee y dice de cuántos datos habla.

**Qué problema resuelve.** El usuario ya planea (F2), ya vive el día (F3), ya
tiene una plantilla (F4) y ya puede mirar atrás un día y una semana (F5). Lo
que no tiene es **la respuesta a «esto que me pasa, ¿me pasa siempre?»**: la
plantilla que escribió hace semanas dice 45 min y la vida dice 1h 10, los
martes nunca desayuna a las 8:30, y todo eso está en sus datos pero solo se ve
mirando quince pantallas de un día cada una. El problema no es «faltan
gráficas»: es que **la plantilla envejece y corregirla a mano exige acordarse
de algo que el sistema ya sabe**. Y el problema hermano: al planear un día,
esa misma información llega tarde — cuando ya se armó el día con los números
viejos.

**Para quién.** Xavi, una vez a la semana o cuando abre Revisión, y —sin
buscarlo— cada mañana que arma el día en Hoy. Es la última fase del módulo
porque **necesita datos**: antes de tener semanas vividas no tiene nada que
decir, y la pantalla está diseñada para decirlo en vez de fingir un número.

**Palabras del usuario** (verbatim, de `docs/vida/PLAN.md`, F6):

> «**Adherencia** semana a semana (plan seguido / plan total), con su
> tendencia. **Patrones por día de la semana**: a qué hora sueles empezar de
> verdad cada actividad frente a la hora planeada; qué actividades se te
> **desbordan** siempre y cuánto. **Al planear** (en F2): avisos con esos datos
> — "esto te suele llevar 40 min más", "los martes nunca empiezas antes de las
> 9:30". Sugerencias, no correcciones. **Criterio:** al planear un día, al
> menos un aviso útil sale de datos propios, y ninguno suena a bronca.»

Y del párrafo de decisiones cerradas tras aprobar el render (2026-09-21):

> «los patrones viven **dentro de Revisión** como tercera sección […] hacen
> falta **3 semanas** para que el sistema hable y con menos lo dice en vez de
> fingir un número; toda cifra va en **fracción** con el porcentaje pequeño al
> lado, nunca solo; **ningún aviso cambia nada por su cuenta** […] una
> actividad cuyo patrón está bien **no propone nada y lo dice**; en Hoy el
> aviso va **pegado al bloque**, en violeta punteado, dos como mucho y
> numerados; el dato también aparece **sin pedir nada** […] todo se deriva **en
> cliente** […] con las consultas que ya existen.»

**La fuente de verdad de la pantalla** es el render aprobado
`docs/vida/assets/08-vida-entiende.html` (marcos A adherencia, B patrones por
actividad, C avisos al planear en Hoy, D avisos en la hoja de la plantilla, E
escritorio, F sin datos suficientes) y, dentro de él, el párrafo final «Lo que
esta pantalla decide», con sus doce puntos. **Nada de eso se re-discute aquí.**

**Relación con otros expedientes.** FEAT-006 (`delivered`) es donde vive esta
sección: el control de secciones, `useVidaWeekPlans`, `useVidaWeekFollowUps`,
`vida-review.utils.ts` y el puente a la plantilla (`VidaReviewBridge`) son sus
padres directos — **el puente es literalmente la primera sugerencia del
módulo**, y esta feature la generaliza. FEAT-003/004 ponen el sitio de los
avisos en Hoy; FEAT-005, la hoja del ítem. Los cinco expedientes se tocan: se
construye **después** de ellos y ninguno se rehace.

### Lo que queda fuera

Lo que alguien podría dar por incluido y **no** lo está:

- **Horas por día en la plantilla.** Un ítem tiene **una** hora. Cuando el
  patrón es de un solo día («los martes a las 9:30»), la única salida es
  **quitar ese día**. Cambiar esto toca el API y es otra feature.
- **Cualquier cosa de backend.** Ni tabla, ni endpoint, ni campo, ni migración,
  ni documento GraphQL nuevo. No se toca `xavi-platform-node`.
- **Que las respuestas viajen entre navegadores.** Se guardan en el aparato, en
  el store que ya existe. En otro navegador no están, y la pantalla lo dice.
- **Historia de más de 6 semanas.** Lo que no cabe en esa ventana no existe
  para esta feature, y la pantalla dice de cuántas semanas habla.
- **Modelos, predicciones o «aprendizaje»** que no sean una regla escrita y
  legible. Nada de «te recomendamos» sin un número detrás.
- **Aplicar sugerencias en lote** («aceptar todas»). Una a una, cada una con su
  número.
- **Cambiar el plan o la plantilla solos**, en ningún caso, ni «al aceptar la
  siguiente vez», ni por inactividad.
- **Reescribir días ya armados.** Cambiar la plantilla desde aquí no toca
  ningún `activityDayPlan` existente, igual que en FEAT-005 y FEAT-006.
- **Notificaciones, correos o recordatorios.** Nada sale de la pantalla.
- **Pestaña propia en la barra de Vida**, ruta nueva o `?d=` nuevo. Es una
  sección de Revisión, estado local.
- **Patrones por categoría**, por hueco o por «tipo de día». Solo por semana,
  por día de la semana y por actividad.
- **Sugerir actividades nuevas** o que el sistema invente bloques.
- **Adherencia del módulo de hábitos.** Esto es Vida y solo Vida.
- **Exportar, imprimir o compartir** nada de esto.
- **La deuda heredada:** el troceado del chunk inicial, `Button
  variant="primary"` a 2,54:1 y `variant="danger"` ilegible en oscuro. Vienen
  de FEAT-003/005, son del sistema de diseño y no se arreglan aquí.

### Criterios de aceptación

Numeración continua del módulo: FEAT-006 terminó en el **63**.

**La sección y la adherencia (tajada 1)**

- [ ] 64. En `/app/vida/revision` hay **tres** secciones —«Un día» · «La
  semana» · «Lo que se repite»— en el mismo control que estrenó la tajada 4 de
  FEAT-006: **estado local**, la URL no se mueve, `vida-paths.ts` no gana
  ningún destino y la barra de Vida sigue con sus cuatro píldoras.
- [ ] 65. Con **2 o más semanas computables**, «Lo que se repite» abre con una
  frase de adherencia de **como mucho dos frases**, del tipo «De cada 10
  bloques que planeas, sigues **8**»; la coletilla «llevas **N semanas
  subiendo**» solo aparece con **3 o más** semanas computables y solo si la
  serie sube en las tres últimas. Con la serie plana o bajando, **no se dice
  nada de tendencia** (y no se dice que baja).
- [ ] 66. Debajo de la frase se lee **siempre** de cuántos datos habla y qué se
  deja fuera, con el número real: «Con **N semanas** de datos. Las semanas con
  menos de 3 días planeados se quedan fuera, para que una semana de viaje no
  arrastre la línea.»
- [ ] 67. «Semana a semana»: una fila por semana con su rango de fechas, la
  barra con **planeado rayado** y **seguido sólido**, y la cifra en
  **fracción** («29/36») con el porcentaje **en pequeño al lado**. En toda la
  sección **no aparece ningún porcentaje sin su fracción** (comprobado sobre
  `container.textContent`).
- [ ] 68. Una semana con **menos de 3 días planeados** no se pinta y no entra
  en ninguna media. La **semana en curso** cuenta **solo hasta hoy** y la
  leyenda lo dice.
- [ ] 69. «Por día de la semana»: siete casillas L–D con su fracción («9/10»).
  Un día con **menos de 3 semanas** con plan **no enseña fracción**: dice «**N
  sem**», y el pie explica que a partir de 3 se puede hablar de él. Un día que
  nunca se ha planeado dice lo mismo, no «0/0».
- [ ] 70. «Seguido» es **exactamente** la definición de FEAT-006
  (`collectDayClosing().followedCount` / `plannedCount`): en el código **no
  existe una segunda definición** de «seguido» ni de «planeado».
- [ ] 71. Con **menos de 2 semanas computables** no se pinta adherencia, ni
  barras a cero, ni una pantalla vacía: se pinta la fila de espera con el
  umbral y lo que falta, con fechas reales — «A partir de **2 semanas**
  completas · te falta **1**, la del 22 al 28 de septiembre».
- [ ] 72. Estados de la sección: **cargando** (esqueletos), **error** con
  «Reintentar» que **no afirma «no tienes datos»** cuando lo que pasó es que
  falló una consulta, **375 px** sin scroll horizontal, **oscuro** legible, y
  un nombre de actividad de **60 caracteres** sin desbordes.
- [ ] 73. En toda la sección **no hay una sola palabra de reproche**: un
  barrido sobre el texto renderizado y sobre los archivos nuevos no encuentra
  «desperdicio», «fallaste», «incumpliste», «deberías», «mal», «perdiste»,
  «racha», «cumplimiento» ni «objetivo incumplido».

**Patrones por actividad y sus salidas (tajada 2)**

- [ ] 74. Cada actividad con datos suficientes tiene **una tarjeta**, y todas
  dicen lo mismo en el mismo orden: cabecera con lo que dice la plantilla («En
  tu plantilla: **L · X · V · 9:00 · 45 min**»), la línea «**Sueles empezar**»
  y la línea «**Suele llevarte**» con su etiqueta de desfase, la **mini-fila L
  M X J V S D** con el desfase de cada día, y el pie con **cuántas veces de
  cuántas** se siguió, en fracción («se siguió **13 de 15** veces»).
- [ ] 75. Una actividad entra en la lista cuando aparece **4 veces o más** en
  el plan de las 6 semanas. Por debajo **no se pinta un promedio**: se dice
  cuántas lleva («llevas 2 de 4») y espera.
- [ ] 76. En la mini-fila, un día que **no está en la plantilla** o sin datos
  muestra «·» y **nunca un 0**.
- [ ] 77. Una actividad cuyo patrón está dentro de tolerancia termina en
  «**Esto pasa como lo planeaste. Aquí no hay nada que proponer.**» y **no
  pinta ningún botón**. Con los datos del marco B, esa tarjeta existe.
- [ ] 78. Cuando hay algo que proponer, la tarjeta termina en **una pregunta
  con dos salidas escritas**: la afirmativa lleva **el número dentro**
  («Ponerlo en 1h 10», «Moverlo a las 19:30», «Quitar el martes») y la segunda
  es «**Dejarlo**». **Ninguna tarjeta tiene una sola salida**, y ninguna salida
  usa `variant="danger"`.
- [ ] 79. La salida afirmativa manda **exactamente un `vidaItemUpdate`** con
  `{ id }` más **solo** el campo que cambia (`durationMinutes`, `startTime` o
  `days`), y **cero** llamadas a las cuatro mutaciones de `activityDayPlan`
  (espías en todo el archivo de test): **los días ya armados no se mueven**.
- [ ] 80. La **consecuencia va escrita antes** de tocar nada, como en el puente
  de FEAT-006: si el ítem está en 5 días, se dice que el cambio se aplica en
  los 5 y se nombran.
- [ ] 81. Cuando el patrón es **de un solo día**, la única salida afirmativa es
  **quitar ese día**, y la tarjeta dice por qué en una línea («tu día empieza
  más tarde ese día»). Quitar el día es un `update` con los días restantes —
  **nunca un `vidaItemDelete`** — y si solo quedara un día, no se ofrece.
- [ ] 82. «**Dejarlo**» no llama a nadie: guarda la respuesta en el store del
  aparato que ya existe (`src/features/vida/store/vida-device-notes.store.ts`,
  clave `xavi.vida.deviceNotes`). **`localStorage.length` no sube**: ninguna
  clave nueva.
- [ ] 83. **Decisión D1, vuelve a las 4 semanas** (ver abajo): una sugerencia
  contestada con «Dejarlo» **no se vuelve a pintar durante 4 semanas** desde la
  fecha de la respuesta, en ninguna de las tres pantallas; pasadas las 4
  semanas **vuelve si el patrón sigue**; y vuelve **antes** si el número
  cambia — el desfase se mueve **10 min o más**, o cambia el día del que habla.
  Con reloj fijo, el test comprueba los tres momentos: al día siguiente no
  está, a las 4 semanas está, y con el número cambiado está aunque no hayan
  pasado las 4 semanas.
- [ ] 84. Con **pocos datos** la sección hace lo del marco F: dice **lo que ya
  se sabe** (la tarjeta de la actividad que sí llegó a 4 apariciones, entera y
  con sus dos salidas) y debajo «**lo que llega después**» con cada umbral
  dicho en claro y **cuánto falta** («A partir de 3 semanas · llevas 9 días de
  21»). **Ni una frase que empuje a planear más**, y la última línea dice que
  esto sale de los días que se viven.
- [ ] 85. Una actividad **desactivada** en la plantilla, o **archivada**, no
  genera sugerencia; si tiene datos, puede seguir apareciendo pero **sin
  pregunta**.
- [ ] 86. Estados de la tajada: cargando, error con «Reintentar», 375 px,
  oscuro, y nombre largo.

**Avisos al planear, en Hoy (tajada 3)**

- [ ] 87. En `/app/vida/hoy`, un bloque planeado del que hay patrón trae su
  aviso **pegado al bloque**, en **violeta punteado** (nota al margen, no
  error), con cabecera «**De tus últimas semanas · 1 de 2**» y **dos salidas
  escritas**: la afirmativa con el número («Sí, 1h 10», «Sí, 19:30») y «**Así
  está bien**».
- [ ] 88. **Dos avisos como mucho por día**, y **nunca dos del mismo bloque**:
  se eligen por número de repeticiones, con un **desfase de más de 10 min** y
  **entre los que no se han contestado**. Con tres candidatos, se pintan dos y
  el tercero **no aparece** (y sigue estando en «Lo que se repite»).
- [ ] 89. La salida afirmativa **cambia solo el día que se ve** —el bloque de
  `activityDayPlan` de esa fecha— y **no la plantilla** (espías de
  `vidaItemUpdate` en cero), y el aviso lo dice antes: «**solo para hoy**».
  *(Ver D2: es el valor por defecto que fijo para no bloquear.)*
- [ ] 90. «**Así está bien**» no llama a nadie, no vuelve a preguntar por ese
  bloque ese día, y entra en la misma regla de las 4 semanas del criterio 83.
- [ ] 91. Los **chips del hueco** ofrecen la duración que **sueles tardar**
  cuando hay 4 datos o más, y lo dicen («Compra semana · **sueles tardar
  55m**»); con menos datos ofrecen **la que pusiste**, **sin etiqueta** y sin
  hueco vacío donde iría.
- [ ] 92. **Sin datos suficientes, Hoy es exactamente el Hoy de FEAT-003/004**:
  ni aviso, ni leyenda nueva, ni espacio reservado. Hay un test que lo afirma.
- [ ] 93. Ningún aviso se lee como alarma: **nada de rojo**, ningún icono de
  error, ninguna palabra de reproche; y el día **se puede armar entero
  ignorándolos todos**, que es lo que pasa si no se toca nada.
- [ ] 94. 375 px sin scroll horizontal con los dos avisos abiertos, oscuro
  legible, y el aviso no tapa ni desplaza fuera de vista el bloque del que
  habla.

**La plantilla y el escritorio (tajada 4)**

- [ ] 95. La hoja del ítem de FEAT-005 suma **una línea de dato debajo del
  campo al que se refiere**: bajo «**A qué hora**», lo que dicen las semanas y
  su salida («Quitar el martes» / «Dejarlo»); bajo «**Cuánto**», una línea que
  **confirma** cuando va bien («Suele llevarte **30 min justos**. Esta hora va
  bien.»). La línea de «Cuánto» aparece **también cuando no hay nada que
  proponer**: no es una señal de alarma.
- [ ] 96. El día del que habla el aviso va **marcado** en la fila de días, y
  **marcado no es tocado**: mientras no se pulse la salida, **guardar la hoja
  manda exactamente el mismo cuerpo que antes de F6** (test sobre las claves de
  la mutación, no sobre la vista).
- [ ] 97. **Sin datos suficientes, la hoja es la de FEAT-005 sin una línea de
  más** ni un hueco reservado.
- [ ] 98. En **escritorio**, «Lo que se repite» se reparte como el marco E:
  adherencia arriba, **patrones en rejilla** debajo, y un **lateral** con «Sin
  contestar», «Contestadas» y «De dónde sale todo esto».
- [ ] 99. «**Sin contestar**» lista **solo** las sugerencias vivas, cada una
  con **las mismas dos salidas** que su tarjeta, y dice que **no caduca ninguna
  y no cambian nada solas**. «**Contestadas**» dice, por cada una, **qué se
  contestó y cuándo**, y **la fecha en la que vuelve** si el patrón sigue —o
  qué cambió y cuándo, si se aplicó—. **Nada desaparece a escondidas.**
- [ ] 100. El panel «**De dónde sale todo esto**» dice las tres cosas: que sale
  del **plan y el registro de las últimas 6 semanas** con las consultas que ya
  existen, que se calcula **en el dispositivo cada vez que abres**, que lo
  único que se guarda es **tu respuesta**, y que **nada cambia solo**. Y dice
  —antes de que sorprenda— que **esas respuestas no están en otro navegador**
  (la deuda del aparato del criterio 63 de FEAT-006).

**Transversales, de toda la feature**

- [ ] 101. **Ni un documento GraphQL nuevo, ni una mutación nueva, ni un tipo
  nuevo de `api/`, ni una ruta, ni una clave de `localStorage`.** `graphql/` y
  `api/` no aparecen en el diff salvo por lectura.
- [ ] 102. **Ninguna clave de caché nueva si se puede evitar**: los
  seguimientos se leen por `vidaKeys.followUps.day` —la misma clave que usan
  Hoy, la revisión y la semana— y los planes por la clave de día que ya existe.
  Si el constructor necesita una clave de rango, **queda escrito por qué** y
  cuál es, y el arquitecto lo decide antes.
- [ ] 103. **El coste de abrir la sección está medido y escrito** en el
  reporte: cuántas consultas en frío y cuántas de caché para las 6 semanas
  (42 días de plan + el rango de seguimientos), y qué pasa al volver a abrir.
  Es el criterio hermano del 53/55 de FEAT-006: **se mide, no se promete**.
- [ ] 104. **Línea base no peor** (`ENVIRONMENT.md`): typecheck limpio, lint
  14/0, tests sin fallos nuevos, `pnpm build` exit 0 y el chunk inicial
  **medido** (crece: queda dicho cuánto, y ninguno de iconos).
- [ ] 105. **Criterio de la fase** (`PLAN.md`, F6), y **lo cierra el usuario**:
  al planear un día, **al menos un aviso útil sale de datos propios y ninguno
  suena a bronca**. Con la API despierta, sobre días suyos de verdad.
- [ ] 106. **El recorrido real, del usuario:** abrir «Lo que se repite» con sus
  semanas y comprobar que los números cuadran con lo que recuerda; contestar
  una sugerencia con la salida afirmativa y **ver la plantilla cambiada y
  ningún día armado movido**; contestar otra con «Dejarlo» y comprobar que
  **no vuelve a preguntar tras recargar**; armar un día en Hoy y ver el aviso
  pegado al bloque; y **375 px y oscuro dentro de `/app/*`**, que es la deuda
  que ningún agente puede cerrar.

### Tajadas

Verticales, cada una usable sola.

| # | Qué hace | Estado |
|---|---|---|
| 1 | **La sección existe y cuenta tu adherencia.** Tercera sección en Revisión («Lo que se repite»), con la frase, las semanas en fracción, los días de la semana con su umbral y la espera con fechas cuando no hay bastante. Solo lectura: ni una sugerencia todavía. Criterios 64–73, 101–104. | **aceptada** |
| 2 | **Los patrones por actividad, con sus dos salidas.** Tarjeta por actividad, la que va bien que no propone nada, la pregunta con el número dentro, el `vidaItemUpdate` que cambia la plantilla sin tocar ningún día armado, «Dejarlo» guardado en el aparato con la regla de las 4 semanas, y el estado de pocos datos del marco F. Criterios 74–86. | **aceptada** |
| 3 | **El aviso llega al planear.** En Hoy, dos avisos como mucho pegados a su bloque, con sus dos salidas, y la duración habitual en los chips del hueco. Criterios 87–94. | **aceptada** |
| 4 | **El dato donde se edita, y el escritorio.** La línea bajo «A qué hora» y bajo «Cuánto» en la hoja de la plantilla, y en escritorio la rejilla con el lateral de «Sin contestar», «Contestadas» y «De dónde sale todo esto». Criterios 95–100. | **aceptada** |

La tajada 1 es lo mínimo que ya sirve: sin ninguna sugerencia, un usuario con
cinco semanas **ya sabe si su plantilla se parece a su vida**, que es la
pregunta que hoy no tiene respuesta en ninguna pantalla.

### ¿Arquitecto? **Sí**

Porque **introduce un concepto que no existe**: una **capa de derivación sobre
una ventana de 42 días** (hoy la lectura más ancha del módulo son 7+7 días, y
la tajada 4 de FEAT-006 ya dejó la peor lectura en ≈21 consultas), y una
**sugerencia con respuesta guardada y fecha de vuelta** que consumen **tres
pantallas distintas** —Revisión, Hoy y la hoja de la plantilla— que hoy no
comparten nada más que utilidades puras. Cómo se lee la ventana sin multiplicar
las consultas, dónde vive el cálculo para que las tres pantallas lo usen sin
duplicarlo, y cómo se generaliza `dismissedBridges` sin estrenar clave de
`localStorage` son decisiones que **no deben tomarse tres veces**, una por
tajada.

**De qué cuelga**, para que el arquitecto no empiece de cero (hipótesis mías,
marcadas como tales; el diseño es suyo):

- La sección y su control: `src/features/vida/pages/VidaRevisionPage.tsx` — el
  estado local `view` que estrenó la tajada 4 de FEAT-006.
- La lectura de varios días: `src/features/vida/hooks/useVidaWeekPlans.ts` y
  `src/features/vida/hooks/useVidaWeekFollowUps.ts` (esta ya reutiliza
  `vidaKeys.followUps.day`, que es lo que pide el criterio 102).
- La aritmética de plan frente a real: `src/features/vida/utils/vida-review.utils.ts`
  y `src/features/vida/utils/vida-execution.utils.ts` — de ahí sale «seguido»
  (criterio 70) y no se reescribe.
- La sugerencia que ya existe: `src/features/vida/components/VidaReviewBridge/`
  — es el patrón literal de «pregunta con dos salidas y la consecuencia escrita
  antes».
- Las respuestas: `src/features/vida/store/vida-device-notes.store.ts`
  (`dismissedBridges`, `dismissedNoData`, clave `xavi.vida.deviceNotes`).
- Los sitios de los avisos: `src/features/vida/pages/VidaHoyPage.tsx` (bloques
  y huecos) y la hoja del ítem de FEAT-005.

### Decisiones

**D1 — «Dejarlo» vuelve a las 4 semanas. Resuelta por el analista, no es
pregunta al usuario.** El plan la dejaba abierta («si una sugerencia contestada
con "Dejarlo" vuelve pasadas unas semanas o no vuelve hasta que el usuario
entre a mirar») y es no bloqueante. **Se fija así:**

> Una sugerencia contestada con «Dejarlo» **deja de aparecer durante 4
> semanas** desde la fecha de la respuesta, en las tres pantallas. Pasadas las
> 4 semanas, **vuelve si el patrón sigue**. Y vuelve **antes de plazo** si el
> número del que habla cambia de forma apreciable: el desfase se mueve **10 min
> o más**, o cambia el día al que se refiere. Cuando vuelve, la fecha de vuelta
> está a la vista en «Contestadas» **desde el momento en que se contesta**.

**Por qué.** «No vuelve nunca hasta que entres a mirar» suena respetuoso y en
realidad es peor de las dos: la sugerencia se apaga justo en la pantalla donde
sirve —al planear, en Hoy—, y el usuario tendría que acordarse de ir a
buscarla, que es exactamente el trabajo que esta feature venía a quitar. Y
«vuelve a las 4 semanas» no es insistir: **cuatro semanas es más que el ciclo
de datos de la propia pantalla** (6 semanas de ventana), así que cuando vuelve
lo hace con **datos casi todos nuevos** — no repite la misma pregunta, hace una
pregunta nueva con el mismo asunto. La excepción del número que cambia es la
que evita el caso tonto: si dijiste «Dejarlo» a «+25 min» y ahora son +70, no
tiene sentido callarse tres semanas más. Y lo que hace que esto no sea
insistencia es el criterio 99: **la fecha de vuelta se ve desde el día en que
contestas**, así que nunca reaparece por sorpresa. Coste: la fecha de la
respuesta se guarda junto al identificador en el store del aparato, que ya
guarda estructuras con clave (el puente de FEAT-006 ya mete el lunes en la
clave). **No hace falta backend.**

**D2 — En Hoy, la salida afirmativa cambia el día, no la plantilla. Valor por
defecto fijado; el usuario puede corregirlo antes de la tajada 3 y no bloquea a
nadie hasta entonces.** El render no lo dice en una línea: el marco C pregunta
«¿lo dejamos en 1h 10?» estando en Hoy, armando el día, y el marco B pregunta
«¿le damos 1h 10 **en tu plantilla**?». Las dos lecturas tienen consecuencias
distintas para quien lo usa:

- **(a, la que fijo)** en Hoy cambia **solo el bloque de ese día** y lo dice
  («solo para hoy»). Consecuencia: el aviso es barato de aceptar —no compromete
  nada— y la plantilla se cambia con calma desde «Lo que se repite». Riesgo:
  hay que aceptarlo muchas veces si el patrón es fijo.
- **(b)** en Hoy cambia **la plantilla** (y con ella los días futuros). Riesgo:
  una decisión grande tomada con un toque mientras se arma el día, y la
  consecuencia («esto se mueve en tus 5 días») es larga de escribir en un aviso
  pegado a un bloque.

Fijo **(a)** porque es la que respeta el punto 6 del render —nada cambia más de
lo que el botón dice— y porque el sitio donde se decide para siempre ya existe
y es la sección de patrones. Si el usuario prefiere (b), es cambiar el criterio
89 antes de la tajada 3.

**D3 — Los umbrales, leídos del render, no son una decisión nueva.** El plan
dice «hacen falta **3 semanas** para que el sistema hable»; el render, que es
posterior y aprobado, lo desglosa en el punto (2): **adherencia con 2 semanas,
su tendencia con 3, un día de la semana con 3 semanas, una actividad con 4
apariciones**. Los criterios usan el desglose del render y el «3 semanas» del
plan se entiende como el titular de cuándo la pantalla habla de verdad. **Si
esta lectura no es la del usuario, se corrige en los criterios 65, 69, 71 y
75** — no cambia ninguna tajada.

## 2. El plan — feature-architect

**Resumen para el constructor:** la implementación de referencia es la tajada 4
de FEAT-006 entera — `src/features/vida/utils/vida-week-review.utils.ts`
(derivado puro sobre varios días) + `src/features/vida/hooks/useVidaWeekPlans.ts`
+ `useVidaWeekFollowUps.ts` (la ventana) + `src/features/vida/components/VidaReviewBridge/`
(la pregunta con dos salidas) + `VidaRevisionPage.tsx:945` (`VidaReviewBridgeSection`,
el sub-componente que **monta sus consultas solo cuando su sección está abierta**).
El código nuevo va en dos `utils` puros (`vida-adherence.utils.ts`,
`vida-patterns.utils.ts`), dos hooks (`useVidaHistoryWindow.ts`,
`useVidaPatterns.ts`) y componentes nuevos por tajada; **no se crea** ninguna
clave de caché, ninguna clave de `localStorage`, ningún documento GraphQL,
ninguna ruta, ni una segunda definición de «seguido».

### Lo que ya existe

Casi todo el andamio existe. Lo que **no** existe es la ventana de 42 días y el
modelo de sugerencia contestable; todo lo demás se reutiliza.

| Lo que hace falta | Lo que ya existe | Dónde |
|---|---|---|
| Leer N días de plan con la clave de día | `useVidaWeekPlans(dates)`: `useQueries` sobre `vidaKeys.dayPlan.byDate(date)`, misma `queryFn` que el día, estado `isPending`/`isError` **por día** | `src/features/vida/hooks/useVidaWeekPlans.ts:56` |
| Leer N días de seguimientos en **una** consulta | `useActivityFollowUpsInDatesQuery(from, to)` → `vidaKeys.followUps.range(from,to)` sobre el documento `activityFollowUpsInDates`, **ya usado para una ventana de 14 días** | `src/features/vida/hooks/useActivityFollowUps.ts:37`; documento en `src/features/vida/graphql/activity-followups.graphql.ts:70`; uso real en `src/features/vida/pages/VidaRevisionPage.tsx:966` |
| «Seguido / planeado» de un día | `collectDayClosing({...}).followedCount / .plannedCount` sobre `buildDayAgenda` + `buildDayExecution` | `src/features/vida/utils/vida-execution.utils.ts:1127` |
| Recorrer varios días aplicando esa aritmética | `buildWeekReview(input)` — el bucle día→agenda→ejecución→cifra, ya escrito y probado | `src/features/vida/utils/vida-week-review.utils.ts:266` |
| Una sugerencia derivada de lo real, con su base, su consecuencia escrita y dos salidas | `buildTemplateBridge()` + `VidaReviewBridge` — **es literalmente la primera sugerencia del módulo** | `src/features/vida/utils/vida-week-review.utils.ts:412` y `src/features/vida/components/VidaReviewBridge/VidaReviewBridge.tsx` |
| Montar consultas caras solo cuando su sección está abierta | `VidaReviewBridgeSection` (A5 de FEAT-006) | `src/features/vida/pages/VidaRevisionPage.tsx:945-1014` |
| Guardar una respuesta «déjalo» en el aparato, con su ámbito en la clave | `dismissedBridges: string[]` + `vidaBridgeKey(weekMonday, itemId)` + `isBridgeDismissed()`, en la **única** clave `xavi.vida.deviceNotes` | `src/features/vida/store/vida-device-notes.store.ts:47,84,95` |
| Un aviso pegado a una fila de la agenda, con dos salidas y respuesta recordada | `VidaAgendaNoData` («¿Qué pasó?» / «Dejarlo así» + `isDismissed`) | `src/features/vida/components/VidaAgendaNoData/VidaAgendaNoData.tsx` |
| Barra plan-rayado / real-sólido | `VidaPlanVsRealBar` (anchos normalizados, texto al lado, sin color de alarma) | `src/features/vida/components/VidaPlanVsRealBar/VidaPlanVsRealBar.tsx` |
| Filas de semana con su fracción y su barra segmentada | `VidaReviewWeek` | `src/features/vida/components/VidaReviewWeek/VidaReviewWeek.tsx` |
| Control de secciones con teclado | `@/shared/ui/Tabs` (`role="tablist"`, ←/→, panel enlazado), envuelto ya una vez en Vida | `src/shared/ui/Tabs/Tabs.tsx`, uso en `src/features/vida/components/VidaTemplateDayTabs/VidaTemplateDayTabs.tsx` |
| Lateral de escritorio | `VidaTemplateAside` + `useMediaQuery(DESKTOP_QUERY)` ya presente en la página | `src/features/vida/components/VidaTemplateAside/` y `src/features/vida/pages/VidaRevisionPage.tsx:172` |
| Barrido de vocabulario sobre el código nuevo | `vida-vocabulary.test.ts` hace `import.meta.glob('./**/*.{ts,tsx}')`: **los archivos nuevos entran solos** | `src/features/vida/vida-vocabulary.test.ts:23` |
| Chips de duración del hueco | `suggestionsForGap()` / `GapSuggestions` (puro) y su pintado en `VidaAgendaGap` | `src/features/vida/utils/vida-agenda.utils.ts:423,473`; `src/features/vida/components/VidaAgendaGap/VidaAgendaGap.tsx:108-150` |
| Hoja del ítem con «A qué hora» y «Cuánto» | `VidaActivitySheet` (prop-driven: recibe `vidaItem`, no monta consultas de plantilla) | `src/features/vida/components/VidaActivitySheet/VidaActivitySheet.tsx:472` (fila de días), `:504` («A qué hora»), `:517` («Cuánto») |

**Lo que NO existe, comprobado:**

- **No hay ninguna consulta de plan por rango.** El SDL vendorizado solo tiene
  `activityDayPlan(date: String!)` (`src/features/vida/graphql/schema/activity-day-plan.schema.graphql:40`).
  No hay `activityDayPlansInDates`. Con el criterio 101 (ni un documento nuevo)
  y sin backend, **42 días de plan son 42 consultas**. Esto manda sobre todo lo
  que sigue.
- **No hay nada de adherencia ni de patrones en el repositorio.** Ni en Vida ni
  en hábitos: `HabitPanel`/`habit-panel.utils.ts` calcula métricas de un hábito
  (rachas y series), no adherencia plan-vs-real, y no se reutiliza. Esta capa
  se escribe desde cero, sobre aritmética que sí existe.
- **No hay control segmentado en `shared/ui`.** Hay `Tabs`; el render pinta
  `.segs` con tres píldoras. Se resuelve con `Tabs` (ver más abajo).
- **No hay `useMediaQuery` en Hoy ni en Plantilla**; en Revisión sí
  (`VidaRevisionPage.tsx:172`).

**Dos cosas que ya están duplicadas y conviene no triplicar:**

1. **`shiftYmd` existe dos veces, privada**: `src/features/vida/utils/vida-window.utils.ts:39`
   y `src/features/vida/pages/VidaRevisionPage.tsx:87`. La ventana nueva la
   necesita. **Se exporta una sola** desde `src/features/vida/utils/vida-date.utils.ts`
   (con su test) y las dos copias pasan a delegar. Es un cambio de seis líneas
   y evita la tercera copia.
2. **El puente de FEAT-006 y las sugerencias de hora de F6 se solapan**: los dos
   proponen mover la hora de un `VidaItem`, uno con 14 días y otro con 42, y hoy
   guardan su respuesta en sitios distintos (`dismissedBridges` vs. el
   `patternAnswers` nuevo). Sin hacer nada, **el usuario recibe la misma
   pregunta dos veces**, una en «La semana» y otra en «Lo que se repite». Se
   resuelve en la tajada 2, sin tocar la regla del puente: ver «Cómo se modela
   la sugerencia», punto 5.

### Implementación de referencia

**`src/features/vida/utils/vida-week-review.utils.ts` (508 líneas) y su trío
—`useVidaWeekPlans.ts` + `useVidaWeekFollowUps.ts` + `VidaReviewBridgeSection`
en `VidaRevisionPage.tsx:945`.** Se imita ese conjunto, no otro, porque es
**la misma figura una escala más grande**: leer N días con las claves de día,
armar cada día con `buildDayAgenda`+`buildDayExecution`, sacar la cifra con
`collectDayClosing`, y ofrecer una pregunta con dos salidas que escribe en la
plantilla y no toca ningún día armado. Está vivo, entregado hace dos días y
revisado.

Cuatro reglas de ese archivo que el constructor **hereda tal cual** (están
escritas en su cabecera, líneas 1-20):

1. **Ni un `new Date()`**: `today` y `nowMinutes` entran por parámetro. Sin esto
   el criterio 83 (los tres momentos con reloj fijo) no se puede probar.
2. **Ninguna regla nueva de emparejamiento ni de «seguido»**: siempre
   `matchSessionsToBlocks` / `collectDayClosing` (criterio 70).
3. **Archivo propio por ventana**: «un archivo que mira siete días no comparte
   ni un tipo con el que mira uno». Por el mismo motivo lo de 42 días no entra
   en `vida-week-review.utils.ts`.
4. **La UI no decide nada**: el componente recibe un objeto ya derivado
   (`TemplateBridge`) y solo devuelve `onMove`/`onDismiss`.

Secundaria, solo para el dibujo del marco B/E:
`src/features/habits/pages/HabitDetailPage.tsx` + `components/HabitPanel/`
(métricas derivadas en cliente, SVG a mano, tabla oculta obligatoria en
`ChartPanel`). Si alguna barra de adherencia se dibuja con SVG, la tabla oculta
es obligatoria ahí también.

### La ventana de 42 días: de dónde sale y a qué cuesta

**La decisión (cierra el criterio 102, que me la delega explícitamente):**

| Dato | Clave | Consultas | Por qué |
|---|---|---|---|
| Plan de cada día | `vidaKeys.dayPlan.byDate(date)` — **existente** | **1 por día, hasta 42** | No hay consulta de rango en el esquema y no se crea documento nuevo (criterio 101). Además cada día comparte caché con Hoy, la revisión, la tira y el puente, y se invalida solo con `invalidateDayPlanQueries(date)`. |
| Seguimientos de la ventana | `vidaKeys.followUps.range(from, to)` — **existente** | **1 en total** | El render lo nombra (`activityFollowUpsInDates`, punto 9) y FEAT-006 ya lo usa así para 14 días (`VidaRevisionPage.tsx:966`). Por día serían **42 consultas más**: 84 en total. |

**Por qué el rango y no `vidaKeys.followUps.day` (lo que el criterio 102 pedía
por defecto):** FEAT-006 rechazó el rango para las **filas de la semana** por
dos razones —falla entero, y no comparte caché con el día— y las dos siguen
siendo ciertas. Aquí no pesan igual: (a) esta sección **no tiene un estado de
error por día** que pintar, su error es global con «Reintentar» (criterio 72),
así que el todo-o-nada no le quita información a nadie; (b) el ahorro no es
marginal, es la mitad del coste total. Y hay precedente idéntico: el puente de
FEAT-006, que mira 14 días, ya lo hace así. **Ninguna clave nueva en
`vidaKeys`.**

Coste que quedará escrito en el reporte (criterio 103), a medir, no a prometer:

- **Ventana:** del lunes de hace 5 semanas hasta hoy → 36 a 42 días (42 el
  domingo). Constante única `VIDA_PATTERN_WEEKS = 6` en `vida-patterns.utils.ts`.
- **Peor caso en frío (abrir «Lo que se repite» sin nada en caché): 43
  consultas** = 42 planes + 1 rango. La peor lectura de hoy —«La semana» con el
  puente montado— son ≈21+1; esta la dobla, y ese es el precio medido de la
  fase.
- **Caso real llegando desde Revisión:** el puente ya trajo los 14 días
  anteriores a hoy y la tira/semana otros 7-14, todos **dentro** de la ventana →
  ≈20 aciertos de caché, **≈22 consultas nuevas**.
- **Volver a abrir la sección:** 0 consultas dentro del `staleTime`.
- **Cómo no empeorar lo que ya arrastramos**, tres medidas obligatorias:
  1. **La ventana se monta solo con su sección abierta**, dentro de un
     sub-componente `VidaPatternsSection` hermano de `VidaReviewBridgeSection`
     (mismo patrón A5). «Un día» y «La semana» cuestan **exactamente lo de hoy**;
     hay test de ello.
  2. **`staleTime` largo para el pasado**: `1000 * 60 * 5` para los días
     anteriores a hoy (un día cerrado no cambia, y una escritura lo invalida
     igual) y `1000 * 30` para hoy, que es el de `useActivityDayPlanQuery`.
     **`gcTime: 1000 * 60 * 30`** en las consultas de la ventana: sin eso, ir a
     Hoy y volver a los seis minutos vuelve a pedir los 42.
  3. **La derivación tolera datos parciales**, como `useVidaWeekPlans`: cada día
     lleva su `isPending`/`isError` y la sección dice «con N semanas de datos»
     con lo que haya llegado (criterio 66). No hay pantalla bloqueada esperando
     42 respuestas.
- **Palanca si la medida sale mal:** bajar `VIDA_PATTERN_WEEKS` a 4 es una
  línea, pero **hay que decirlo en el reporte**: la regla de vuelta de D1 son 4
  semanas y se justifica con que la ventana es más larga que el silencio.
- **En Hoy y en Plantilla la ventana es la misma** (tajadas 3 y 4) y se monta
  **diferida**: `enabled` solo cuando los datos propios de la pantalla ya
  resolvieron y hay algo que mirar. El primer pintado de Hoy no espera a nadie,
  que es justo lo que pide el criterio 92.
- **Una sola ventana para las tres pantallas, no una por pantalla.** Si Hoy
  mirase 4 semanas y Revisión 6, la misma sugerencia tendría dos números y la
  regla de los 10 min del criterio 83 dispararía sola. El ancho es del módulo,
  no de la pantalla.

### Dónde vive el derivado

**Dos `utils` puros, no uno.** Juntar adherencia + patrones + sugerencias pasa
de 1.000 líneas y repite la historia de `vida-execution.utils.ts`; se parten
por **lo que miran**, que es el criterio que usó FEAT-006:

- `src/features/vida/utils/vida-adherence.utils.ts` — **mira el calendario**.
  Semanas y días de la semana. Umbrales `ADHERENCE_MIN_WEEKS = 2`,
  `ADHERENCE_TREND_WEEKS = 3`, `WEEKDAY_MIN_WEEKS = 3`,
  `WEEK_MIN_PLANNED_DAYS = 3`. Exporta `buildAdherence(input)` →
  `{ weeks, weekdays, headline, dataNote, waiting, computableWeeks }`, todas las
  cifras ya compuestas en fracción (el componente no formatea números: así el
  criterio 67 se prueba sobre el `utils`). Molde: `buildWeekReview`
  (`vida-week-review.utils.ts:266`), incluida la forma de `WeekDayInput`.
- `src/features/vida/utils/vida-patterns.utils.ts` — **mira la actividad**.
  `VIDA_PATTERN_WEEKS = 6`, `PATTERN_MIN_OCCURRENCES = 4`,
  `PATTERN_TOLERANCE_MINUTES = 10`, `PATTERN_ANSWER_WEEKS = 4`. Exporta
  `buildActivityPatterns(input)` → `VidaActivityPattern[]` (cabecera de
  plantilla, «sueles empezar», «suele llevarte», mini-fila L-D, fracción del
  pie, y `suggestion: VidaPatternSuggestion | null`), más las tres funciones de
  la sugerencia (abajo) y **`pickBlockHints({ suggestions, blocks, limit: 2 })`**,
  que es la regla del criterio 88 en un sitio probable, no dentro de la página.
  Molde: `buildTemplateBridge` (`vida-week-review.utils.ts:412`), incluidos el
  desempate estable y el «sin base no se inventa el número».

Los dos reciben `days: { date, planItems, followUps }[]`, `items: VidaItem[]`,
`dayHours`, `today`, `nowMinutes`. **Ninguno importa React ni el store.**

**Dos hooks, en `src/features/vida/hooks/`:**

- `useVidaHistoryWindow.ts` — **solo datos**. `({ enabled, today, weeks })` →
  `{ dates, from, to, byDate, isPending, hasError, refetch }`. Es
  `useVidaWeekPlans` + la consulta de rango, combinados; se copia de
  `useVidaWeekFollowUps.ts` (estructura, lectura de `fetchStatus === 'idle'`
  para «deshabilitada ≠ cargando», `refetch` que solo repite las que fallaron).
- `useVidaPatterns.ts` — **el pegamento, y el único punto de entrada de las tres
  pantallas**. Compone `useVidaHistoryWindow` + `useVidaItemsQuery` +
  `useVidaDayHours` + las respuestas del store, y devuelve
  `{ adherence, patterns, liveSuggestions, answered, weeksWithData, isPending, hasError, refetch }`
  con las sugerencias **ya filtradas** por la regla de D1. Molde:
  `src/features/vida/hooks/useVidaDayData.ts:65` (hook que junta consultas y
  derivación y no pinta nada).

### Cómo se modela la «sugerencia con respuesta guardada», una sola vez

1. **Un tipo, en `vida-patterns.utils.ts`:** `VidaPatternSuggestion` con
   `kind: 'duration' | 'start-time' | 'drop-day'`, el `itemId` de la **plantilla**
   (nunca el id de un bloque del día), `offsetMinutes` (el desfase con signo del
   que habla), `dayOfWeek` (solo en `drop-day`), `basis`, `consequence`,
   `affirmativeLabel` con el número dentro, y **dos parches separados**:
   `templatePatch` (`{ durationMinutes } | { startTime } | { days }` — lo que
   manda el `vidaItemUpdate` del criterio 79/81) y `dayPatch` (lo que manda el
   `activityDayPlanItemEdit` de Hoy, criterio 89, D2). Una sugerencia sabe qué
   pedir en cada pantalla; **la pantalla no inventa nada**.
2. **Identidad estable:** `id = kind|itemId` (+ `|dayOfWeek` en `drop-day`).
   El número **no** entra en el id: tiene que poder cambiar sin que la respuesta
   deje de referirse a la misma pregunta (criterio 83).
3. **Dónde se persiste: `src/features/vida/store/vida-device-notes.store.ts`**,
   sin clave nueva de `localStorage` (criterio 82 y 101). Se añade un campo al
   lado de `dismissedBridges`:
   `patternAnswers: Record<string, VidaPatternAnswer>` con
   `VidaPatternAnswer = { answeredOn: 'YYYY-MM-DD'; offsetMinutes: number; dayOfWeek: VidaDayOfWeek | null }`,
   la acción `answerPatternSuggestion(id, answer)` y el helper
   `getPatternAnswer(answers, suggestion)`. Va al `partialize`. **Sin `version`
   ni migración**: el merge superficial de `persist` deja `{}` en un estado
   guardado antes de F6, exactamente como se anotó en A7 para `dismissedBridges`
   (línea 110 del store). Es un `Record` y no un `string[]` porque la respuesta
   lleva fecha y número; el store ya guarda un `Record` (`blockNotes`), así que
   la forma no es nueva.
4. **La regla de D1, en una función pura y en un solo sitio:**
   `isSuggestionSilenced(answer, suggestion, today)` en `vida-patterns.utils.ts`
   → silencia si **y solo si** (a) `today` está a menos de
   `PATTERN_ANSWER_WEEKS * 7` días de `answeredOn`, (b) el desfase no se movió
   `PATTERN_TOLERANCE_MINUTES` o más, y (c) el día del que habla es el mismo. Su
   hermana `suggestionReturnDate(answer)` da la fecha de vuelta para
   «Contestadas» (criterio 99). `useVidaPatterns` las aplica **una vez** y las
   tres pantallas consumen `liveSuggestions`; ninguna vuelve a decidir.
   El test del criterio 83 se escribe contra estas dos funciones con `today`
   inyectado — por eso ni el `utils` ni el hook leen el reloj.
5. **El puente de FEAT-006 y estas sugerencias no pueden preguntar dos veces.**
   `isSuggestionSilenced` recibe también `dismissedBridges` y el lunes en curso:
   una sugerencia `start-time` de un ítem con puente descartado esta semana
   **no se pinta**. Y al revés, en `VidaRevisionPage.tsx:1003`
   (`VidaReviewBridgeSection`) se añade la condición simétrica: si hay un
   `patternAnswer` vivo de `start-time` para ese `itemId`, el puente no se
   pinta. Son dos condiciones de tres líneas, van en la tajada 2 y **no tocan
   `buildTemplateBridge` ni los criterios 54-59**.

### Dónde va el código nuevo, archivo por archivo

**Se crean** (cada componente con su trío `Componente.tsx` +
`Componente.module.scss` + `index.ts`, como todo `src/features/vida/components/*`):

```
src/features/vida/hooks/useVidaHistoryWindow.ts            (+ .test.tsx)
src/features/vida/hooks/useVidaPatterns.ts                 (+ .test.tsx)
src/features/vida/utils/vida-adherence.utils.ts            (+ .test.ts)
src/features/vida/utils/vida-patterns.utils.ts             (+ .test.ts)
src/features/vida/components/VidaAdherenceSummary/         frase + «Con N semanas de datos» + fila de espera
src/features/vida/components/VidaAdherenceWeeks/           filas de semana con barra y fracción
src/features/vida/components/VidaAdherenceWeekdays/        siete casillas L-D
src/features/vida/components/VidaPatternCard/              tarjeta por actividad, con o sin pregunta
src/features/vida/components/VidaBlockHint/                el aviso violeta punteado de Hoy
src/features/vida/components/VidaPatternsAside/            lateral de escritorio (tajada 4)
```

**Se modifican:**

```
src/features/vida/pages/VidaRevisionPage.tsx
  :179  const [view, setView] = useState<'day'|'week'>  →  añade 'patterns'
  :~455 exits(): el control de tres secciones (ver nota de Tabs)
  :~511 if (isWeek) { ... }  →  rama hermana if (isPatterns) { ... }
  :945  junto a VidaReviewBridgeSection, el nuevo VidaPatternsSection
  :1003 la condición simétrica del punto 5
  :87   shiftYmd local → delega en vida-date.utils
src/features/vida/pages/VidaRevisionPage.module.scss
src/features/vida/pages/VidaRevisionPage.test.tsx
src/features/vida/utils/vida-date.utils.ts        exporta shiftYmd (+ su test)
src/features/vida/utils/vida-window.utils.ts:39   delega en el shiftYmd exportado
src/features/vida/store/vida-device-notes.store.ts  patternAnswers (tajada 2)
src/features/vida/vida-vocabulary.test.ts:56      amplía FORBIDDEN (criterio 73)
src/features/vida/pages/VidaHoyPage.tsx:~551      VidaBlockHint junto al VidaAgendaBlock
src/features/vida/pages/VidaHoyPage.module.scss / .test.tsx
src/features/vida/components/VidaAgendaGap/VidaAgendaGap.tsx:111-150   etiqueta «sueles tardar»
src/features/vida/utils/vida-agenda.utils.ts:473  suggestionsForGap recibe un lookup opcional
src/features/vida/components/VidaActivitySheet/VidaActivitySheet.tsx:472,504,517  las dos líneas de dato
src/features/vida/components/VidaActivitySheet/*.module.scss / *.test.tsx
src/features/vida/pages/VidaPlantillaPage.tsx     monta la ventana diferida y pasa el patrón a la hoja
```

**Tres notas que ahorran una discusión cada una:**

- **El control de tres secciones (criterio 64).** Hoy no hay control: hay dos
  `Button variant="ghost"` sueltos («Ver por semana» en `exits()`, «Volver al
  día» en la rama de semana). El render pinta tres píldoras (`.segs`). **Se usa
  `@/shared/ui/Tabs`** —es la regla del `ENVIRONMENT.md`, «no se reescriben
  pestañas a mano»—, envuelto como lo envuelve
  `VidaTemplateDayTabs.tsx`, con el `view` local como `value`. **La URL no se
  mueve y `vida-paths.ts` no se toca.** Los dos botones sueltos se retiran al
  entrar el control.
- **El criterio 73 ya está medio hecho:** `vida-vocabulary.test.ts` recorre
  `./**/*.{ts,tsx}` con `import.meta.glob`, así que los archivos nuevos entran
  sin registrarlos. Solo hay que añadir las palabras que faltan a `FORBIDDEN`
  (`:56`) — y **«mal» necesita frontera de palabra** (`/\bmal\b/i`), o revienta
  con «formal», «normal» y «malla».
- **La hoja del ítem no monta consultas** y debe seguir así: recibe
  `pattern: VidaActivityPattern | null` y `onAnswer` por props desde
  `VidaPlantillaPage`, que es quien monta `useVidaPatterns`. Si la hoja montara
  la ventana, abrir una hoja costaría 43 consultas cada vez.

### Dónde NO va

- **En el backend.** Ni un campo, ni un documento, ni `activityDayPlansInDates`.
  Comprobado que no existe: la alternativa barata a las 42 consultas **es**
  backend, y está fuera de alcance por el criterio 101. Queda anotado como la
  salida natural si la medida del criterio 103 duele.
- **Dentro de `vida-week-review.utils.ts`.** Mira 7 días; su propia cabecera
  explica por qué no se mezclan ventanas. Tampoco en `vida-review.utils.ts`
  (1.149 líneas) ni en `vida-execution.utils.ts` (1.158).
- **En una clave de caché nueva.** Ni `vidaKeys.patterns`, ni
  `dayPlan.range`. Las dos que se usan ya existen y se invalidan solas con
  `invalidateDayPlanQueries` / `invalidateFollowUpQueries`.
- **En una clave de `localStorage` nueva.** Un campo más en
  `xavi.vida.deviceNotes`, como hizo FEAT-006.
- **En una ruta, una píldora o un `?d=`.** `vida-paths.ts` y
  `app-nav.config.ts` no aparecen en el diff.
- **Reescribiendo `VidaReviewBridge` para que sirva a las dos cosas.** Está
  entregado y revisado contra los criterios 54-59; generalizarlo obliga a
  re-revisar FEAT-006. `VidaPatternCard` es su hermano, se le copia el
  esqueleto, y la coexistencia se arregla con las dos condiciones del punto 5.
- **En un caché propio de los patrones derivados** (localStorage, `sessionStorage`
  o un contexto global). El render fija en su punto (9) que se calcula en el
  dispositivo **cada vez que abres**, y lo único que se guarda es la respuesta.
  El caché es el de React Query, y ya está.
- **En `variant="danger"`** para ninguna salida: no se lee en oscuro (deuda
  conocida del sistema de diseño). Las dos salidas son `primary` y `secondary`,
  como en el puente.

### Tajadas, con rutas

Las cuatro de la sección 1 se mantienen: son verticales, cada una se prueba
sola y el orden que ya tenían es el único posible (la 3 y la 4 consumen el
modelo de sugerencia que nace en la 2; la 2 consume la ventana que nace en la
1). No hay recorte que cambiar.

| # | Qué hace | Archivos | Criterios que cierra | Estado |
|---|---|---|---|---|
| 1 | **La sección existe y cuenta tu adherencia.** Ventana de 6 semanas, derivado de adherencia y tercera sección de Revisión, solo lectura. | **Crea:** `hooks/useVidaHistoryWindow.ts` (+test), `utils/vida-adherence.utils.ts` (+test), `components/VidaAdherenceSummary/`, `VidaAdherenceWeeks/`, `VidaAdherenceWeekdays/`. **Modifica:** `pages/VidaRevisionPage.tsx` (:87, :179, :~455 el control con `Tabs`, :~511 la rama, :945 `VidaPatternsSection`), su `.module.scss` y `.test.tsx`, `utils/vida-date.utils.ts` (+test), `utils/vida-window.utils.ts:39`, `vida-vocabulary.test.ts:56` | 64-73, 101-104 | **aceptada** |
| 2 | **Los patrones por actividad, con sus dos salidas.** Tarjeta, pregunta con el número dentro, `vidaItemUpdate`, «Dejarlo» con la regla de las 4 semanas, marco F. | **Crea:** `utils/vida-patterns.utils.ts` (+test), `hooks/useVidaPatterns.ts` (+test), `components/VidaPatternCard/`. **Modifica:** `store/vida-device-notes.store.ts` (`patternAnswers`), `pages/VidaRevisionPage.tsx` (`VidaPatternsSection` + la condición simétrica en :1003), `.module.scss`, `.test.tsx` | 74-86 (+101, 104) | **aceptada** |
| 3 | **El aviso llega al planear.** Dos avisos pegados a su bloque en Hoy y la duración habitual en los chips del hueco. | **Crea:** `components/VidaBlockHint/`. **Modifica:** `pages/VidaHoyPage.tsx:~551` + `.module.scss` + `.test.tsx`, `components/VidaAgendaGap/VidaAgendaGap.tsx:111-150`, `utils/vida-agenda.utils.ts:423,473` (lookup opcional de duración habitual, por defecto vacío para que el criterio 92 sea cierto por construcción), `utils/vida-patterns.utils.ts` (`pickBlockHints`) | 87-94 (+101, 104) | **aceptada** |
| 4 | **El dato donde se edita, y el escritorio.** Líneas bajo «A qué hora» y «Cuánto», y la rejilla con su lateral. | **Crea:** `components/VidaPatternsAside/`. **Modifica:** `components/VidaActivitySheet/VidaActivitySheet.tsx:472,504,517` + `.module.scss` + `.test.tsx`, `pages/VidaPlantillaPage.tsx` (monta la ventana diferida y pasa `pattern` a la hoja), `pages/VidaRevisionPage.tsx` (rejilla + lateral con `isDesktop`, :172) | 95-100 (+101, 104) | **aceptada** |

**Lo que cada tajada tiene que medir además de sus criterios:** el criterio 103
se escribe en la tajada 1 (abrir la sección), y se **vuelve a medir** en la 3
(abrir Hoy, que ahora monta la ventana diferida) y en la 4 (abrir Plantilla).
Si alguna de las dos empeora el primer pintado de su pantalla, la palanca es el
`enabled` diferido, no bajar la ventana.

**Lo que no pude comprobar** y queda para el constructor: **nada de esto está
medido contra el API real** —los agentes no entran con credenciales, y el
coste de 42 consultas paralelas contra Render (plan gratuito, se duerme a los
15 min) es exactamente lo que el criterio 103 manda medir y el 105 lo que el
usuario cierra a mano. Tampoco abrí el marco E del render con detalle
suficiente para fijar la rejilla de escritorio: la fuente de verdad de la
tajada 4 sigue siendo `docs/vida/assets/08-vida-entiende.html`.

## 3. Construcción — feature-builder

### Tajada 1 — La sección existe y cuenta tu adherencia

**Resumen para quien revise.** «Lo que se repite» existe: tercera sección de
Revisión en un control de pestañas de verdad, con la adherencia de las últimas
seis semanas en fracción, sus umbrales dichos en voz alta y la espera con
fechas reales cuando no hay bastante. Todo el derivado es puro y reutiliza
`buildWeekReview`, así que **no hay una segunda definición de «seguido»**.
**Lo que más probablemente he roto: la pantalla de Revisión entera.** Sus
siete ramas de retorno —cargando, sin sesión, plan caído, día futuro, lo
vivido caído, el día y la semana— ahora envuelven su contenido en
`Tabs.Panel`, y los dos botones sueltos («Ver por semana» y «Volver al día»)
**ya no existen**: cualquier flujo o costumbre que dependiera de ellos cambia.
Mirar ahí primero.

**Qué se construyó**

*Se crea:*

- `src/features/vida/utils/vida-adherence.utils.ts` — el derivado puro.
  `buildAdherence(input)` → `{ computableWeeks, plannedDaysInWindow, headline,
  dataNote, weeks, weeksLabel, weekdays, weekdayNote, waiting, waitingNote,
  hasAdherence }`, con las cifras **ya compuestas** (fracción, porcentaje,
  rangos de fecha, frases). Umbrales exportados: `ADHERENCE_MIN_WEEKS = 2`,
  `ADHERENCE_TREND_WEEKS = 3`, `WEEKDAY_MIN_WEEKS = 3`,
  `WEEK_MIN_PLANNED_DAYS = 3`. Ni un `new Date()`.
- `src/features/vida/utils/vida-adherence.utils.test.ts` — 15 casos.
- `src/features/vida/hooks/useVidaHistoryWindow.ts` — la ventana.
  `VIDA_HISTORY_WEEKS = 6`, planes por `vidaKeys.dayPlan.byDate` (uno por día)
  y sesiones por `vidaKeys.followUps.range` (**una**). `staleTime` 5 min en el
  pasado, 30 s en hoy, `gcTime` 30 min. `enabled` por parámetro.
- `src/features/vida/hooks/useVidaHistoryWindow.test.tsx` — 9 casos, y es
  donde vive la medida del criterio 103.
- `src/features/vida/components/VidaAdherenceSummary/` — frase, «Con N
  semanas de datos» y «Lo que llega después» (marco F).
- `src/features/vida/components/VidaAdherenceWeeks/` — filas de semana con la
  barra (planeado rayado, seguido sólido) y la fracción con su porcentaje.
- `src/features/vida/components/VidaAdherenceWeekdays/` — las siete casillas.

*Se modifica:*

- `src/features/vida/pages/VidaRevisionPage.tsx` — `ReviewView` con tres
  valores; `sections()`, el control con `@/shared/ui/Tabs` que envuelve el
  contenido de **todas** las ramas; la rama `isPatterns`, **antes** de la de
  «cargando» (esta sección no mira el día abierto y no espera a su consulta);
  `VidaPatternsSection` al final del archivo, hermano de
  `VidaReviewBridgeSection`; fuera la copia privada de `shiftYmd` y fuera los
  dos botones sueltos.
- `src/features/vida/pages/VidaRevisionPage.module.scss` — `.sections`,
  `.sectionBody`, `.patterns`.
- `src/features/vida/pages/VidaRevisionPage.test.tsx` — `openWeek` ahora pulsa
  la pestaña; ocho casos nuevos para la sección.
- `src/features/vida/utils/vida-date.utils.ts` (+ su test) — `shiftYmd`
  exportado, **una sola vez**.
- `src/features/vida/utils/vida-window.utils.ts` — su copia privada delega.
- `src/features/vida/vida-vocabulary.test.ts` — `FORBIDDEN` suma «incumpl»,
  «deberías», «\bmal\b», «racha» y «cumplimiento» (criterio 73).

**Por qué así, y qué se descartó**

1. **`buildAdherence` no imita `buildWeekReview`: lo usa.** El plan lo daba
   como molde. Llamarlo directamente es más barato y, sobre todo, hace el
   criterio 70 cierto **por construcción**: la cifra de cada día es la de
   `collectDayClosing`, sin una línea de aritmética nueva. Hay un test que
   compara la suma de la adherencia con la de `buildWeekReview` sobre los
   mismos días. Se descartó copiar el bucle: habrían sido dos definiciones.
2. **Solo cuentan los días cerrados.** Un día en vuelo, caído, futuro o el de
   hoy a medias no suma ni en «seguido» ni en «planeado»: es la regla de
   `buildWeekLine` (criterio 52 de FEAT-006). Por eso «la semana en curso
   cuenta hasta hoy» es literalmente cierto, y la leyenda lo dice.
3. **El control va en todas las ramas de la pantalla, también en las de
   error.** Si el plan de un día no carga, se tiene que poder saltar a «Lo que
   se repite», que no depende de ese día. La excepción es la rama **sin
   sesión**: ahí no hay nada que mirar en ninguna de las tres y el control
   ofrecería puertas cerradas.
4. **`VIDA_HISTORY_WEEKS` vive en el hook, no en `vida-patterns.utils.ts`.**
   Ese archivo es de la tajada 2 y no existe todavía; el plan le pone allí un
   `VIDA_PATTERN_WEEKS`. **Que lo importe de aquí**, no que escriba el
   segundo: si Hoy mirase cuatro semanas y Revisión seis, la misma costumbre
   tendría dos números.
5. **No se nombra el día que menos se parece al plan.** El render lo escribe
   («los martes, los que menos»); el pie solo nombra el que **más** se parece,
   y solo si destaca, que es la regla de `buildWeekLine`. Señalar un día flojo
   es la única frase del marco A que se lee como reproche, y la regla de
   producto del módulo manda sobre el render en eso. **Es una desviación
   consciente del render aprobado**: si se quiere tal cual, es una línea.
6. **La frase cambia de forma cuando la proporción redondea a cero.** «De cada
   10 … sigues 0» es un cero en la cara; en ese caso se dice la cuenta
   literal, «Has seguido 2 de 71 bloques en estas 3 semanas». Sigue siendo
   exacto y sigue yendo en fracción.
7. **`gcTime` de 30 min solo en los planes.** La consulta de rango de sesiones
   es `useActivityFollowUpsInDatesQuery`, que ya existe y la comparte el
   puente: tocarle el reposo le cambiaría el coste a FEAT-006. Volver a la
   sección pasado un minuto cuesta **1** consulta, no 43.

**Verificación**

*Línea base entera (`docs/features/ENVIRONMENT.md`), al terminar:*

| Qué | Antes | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos |
| `pnpm test` | 2 fallos de 1439 | **2 fallos de 1479** (los mismos dos de `SearchSelect`; +40 tests nuevos) |
| `pnpm build` | chunk inicial 1.054,0 kB | **1.065,81 kB** (+11,8 kB), `app-icons` **620,20 kB sin tocar**, `IconPicker` 4,64 kB, exit 0 |

*Criterio 103 — el coste de abrir la sección, medido, no prometido*
(`useVidaHistoryWindow.test.tsx`, con `useQueries` de verdad y espías sobre la
API):

- **En frío, un domingo (peor caso): 43 consultas** = **42** planes +
  **1** rango. Test: `expect(getActivityDayPlan).toHaveBeenCalledTimes(42)` y
  `getActivityFollowUpsInDates` **1**, con `('2026-08-10', '2026-09-20')`.
- **Un lunes (mejor caso): 36 días** → 37 consultas.
- **Llegando desde Revisión**, con los 20 días que la tira, la semana y el
  puente ya dejaron en la **misma** clave: **22 consultas nuevas**. Medido
  sembrando 20 entradas de caché.
- **Volver a abrir la sección** dentro del reposo: **0 consultas de plan**
  (desmontar y montar contra el mismo `QueryClient`). La de sesiones sí puede
  repetirse pasado su minuto: **1**.
- **Las otras dos secciones no pagan nada**: con «Un día» y con «La semana»
  abiertas, `useVidaHistoryWindow` **no se monta ni una vez**
  (`expect(historyMounts).toHaveLength(0)` en `VidaRevisionPage.test.tsx`).
- **Contra el API de verdad esto no se ha medido**, y es lo que el criterio
  105 deja al usuario: 42 consultas en paralelo contra Render (plan gratuito,
  duerme a los 15 min) es el número que puede doler. **La palanca, si duele,
  es bajar `VIDA_HISTORY_WEEKS` a 4** —una línea—, con la advertencia del
  plan: la regla de vuelta de D1 son 4 semanas y se justifica con que la
  ventana sea más larga que el silencio.

*En el navegador.* `/app/*` está detrás del login y los agentes no entran con
credenciales. Se montó un **arnés temporal** (`arnes-adherencia.html` +
`src/harness/arnes-adherencia.tsx`) con datos sintéticos, se miró a **375 px**
en claro y en oscuro, y **se borró**: `git status` no lo lista. Lo medido ahí:

- `document.documentElement.scrollWidth === clientWidth === 375`: **sin scroll
  horizontal**, y ningún elemento no absoluto desbordado.
- **Criterio 67 sobre el DOM real**: 5 nodos con «%», y **los 5** conviven con
  una fracción en su misma caja (`pctOk: true`).
- **Oscuro legible**: marco A y marco F, con la barra en mint sobre el rayado
  y las casillas «0 sem» en secundario.

**Criterios que cierra, uno por uno**

- **64 ✅** Tres pestañas, `['Un día', 'La semana', 'Lo que se repite']`, con
  `role="tab"` y las flechas de `shared/ui/Tabs`. La URL no se mueve: el test
  comprueba que solo se pide `2026-09-18` antes y después de cambiar de
  sección, y que volver a «Un día» devuelve el mismo día. `vida-paths.ts` y
  `app-nav.config.ts` no aparecen en el diff.
- **65 ✅** «De cada 10 bloques que planeas, sigues 8.» con 2 semanas; la
  coletilla «Llevas 3 semanas subiendo.» solo con 3+ y serie estrictamente
  ascendente; con la serie plana o bajando, **una sola frase** y ni la palabra
  «baja» (test explícito).
- **66 ✅** «Con 2 semanas de datos. Las semanas con menos de 3 días planeados
  se quedan fuera, para que una semana de viaje no arrastre la línea.», literal
  y con el número real; con cero semanas computables dice «Todavía no hay
  ninguna semana con 3 días planeados o más» y mantiene la explicación.
- **67 ✅** Fila por semana con mes, días, barra (rayado + sólido) y «16/20»
  con «80 %» debajo. Comprobado sobre `container.textContent` en el test de la
  página y sobre el DOM real en el arnés.
- **68 ✅** La semana de 2 días planeados no se pinta y no mueve la frase
  (test); `isCurrent` marca la semana en curso y la leyenda dice «la semana en
  curso cuenta hasta hoy».
- **69 ✅** Siete casillas; con 3+ semanas, fracción; con menos, «2 sem»; un
  día nunca planeado, «0 sem» y **nunca «0/0»** (comprobado sobre el texto).
  El pie explica «a partir de 3 se puede hablar de…».
- **70 ✅** No hay una segunda definición: `buildAdherence` llama a
  `buildWeekReview`. El test compara las dos sumas y son iguales.
- **71 ✅** Con una sola semana computable: ni barras, ni pantalla vacía. «Lo
  que llega después» con «A partir de 2 semanas completas · te falta 1, la del
  14 al 20 de septiembre» y «A partir de 3 semanas · llevas 4 días de 21», más
  la línea «Esto no depende de que planees más ni mejor: sale de los días que
  vives». Y **ni un «%»** en toda la sección en ese estado.
- **72 ⚠️ casi entero.** Cargando (esqueletos, sin cifras a cero), error con
  «Reintentar» que **no** dice «no tienes datos» y sigue contando lo que sí
  llegó, 375 px sin scroll y oscuro legible: comprobados. **Lo que no
  aplica**: «un nombre de actividad de 60 caracteres» — en esta tajada **no se
  pinta ningún nombre de actividad**; llega con las tarjetas de la tajada 2.
- **73 ✅** Barrido sobre el texto renderizado (test de la página) y sobre el
  código nuevo (`vida-vocabulary.test.ts`, que ya recorre los archivos nuevos
  solo y ahora prohíbe cinco palabras más).
- **101 ✅** Ni un documento GraphQL, ni una mutación, ni un tipo de `api/`,
  ni una ruta, ni una clave de `localStorage`. `graphql/`, `api/` y
  `store/` no aparecen en el diff.
- **102 ✅** Ninguna clave nueva en `vidaKeys`: `dayPlan.byDate` y
  `followUps.range`, las dos existentes. La decisión del rango la tomó el
  arquitecto y queda ejercida tal cual.
- **103 ✅** Medido arriba.
- **104 ✅** Tabla de arriba. El chunk crece **11,8 kB** y **ninguno de
  iconos**.

**Pendiente de prueba manual, del usuario** (nadie puede cerrarlo desde aquí):

- **105 y 106**: con la API despierta y sus semanas de verdad. Pasos: entrar
  en `/app/vida/revision`, pulsar «Lo que se repite», comprobar que la frase y
  las fracciones cuadran con lo que recuerda, que las semanas de viaje no
  están, y volver a «Un día» para ver que el día sigue donde estaba. Y
  **medir la espera real de abrir la sección** la primera vez del día, que es
  cuando Render puede estar dormido.
- **Criterio 72 en el aparato real**: 375 px y oscuro **dentro de `/app/*`**,
  que es lo que ningún arnés reproduce del todo.

**Riesgos — dónde mirar si algo se rompió**

1. **Las siete ramas de `VidaRevisionPage`**, que ahora meten un `div` de
   panel entre la raíz y el contenido. Los 60 tests de la página pasan, pero
   el CSS de `.layout` y del lateral de escritorio (`isDesktop`) vive una caja
   más adentro.
2. **Los dos botones que desaparecieron.** Cualquier prueba manual, guion o
   costumbre que dijera «Ver por semana» ya no lo encuentra.
3. **`shiftYmd` compartida.** `vida-window.utils.ts` la usa en la tira, en la
   ventana de planeación y en «copiar de la semana pasada». Es el mismo
   cálculo, con su test nuevo de cambio de hora, pero el radio es todo el
   módulo.
4. **`gcTime` de 30 minutos sobre `dayPlan.byDate`.** React Query se queda con
   el mayor de los observadores: abrir la sección una vez hace que **todos**
   esos días vivan media hora en memoria aunque se vuelva a Hoy. Es querido; el
   coste es memoria, no consultas.
5. **`FORBIDDEN` con `\bmal\b`.** Si alguien escribe «mal» en un literal
   nuevo del módulo, el test del vocabulario falla — y puede parecer que rompió
   otra cosa.

**Estado del árbol:** sin commitear.

**Además, para quien venga detrás** (no se tocó, es alcance de otro):

- **Arranqué un servidor de desarrollo** para el arnés (`preview_start`,
  acabó en el **5174** por `autoPort`) y **no pude pararlo**: esta sesión no
  tiene la herramienta `preview_stop` que nombra `ENVIRONMENT.md`. Queda
  dicho; el del usuario en el 5173 no se tocó.
- `VidaSemanaPage.tsx:39` tiene **otra** copia privada de `shiftYmd`. No entra
  en esta tajada (tocaría una pantalla entregada que no se toca), pero ahora
  que la función está exportada, es un borrado de cinco líneas.

### Tajada 2 — Los patrones por actividad, con sus dos salidas

**Resumen para quien revise.** «Lo que se repite» ya no solo cuenta: **una
tarjeta por actividad** con lo que dice tu plantilla frente a lo que pasa de
verdad, y al final **una pregunta con dos salidas** —o, si el patrón va bien,
una línea que dice que no hay nada que proponer—. Aquí nace el modelo de
**sugerencia con respuesta guardada** (`vida-patterns.utils.ts` +
`useVidaPatterns`), que es lo que consumirán Hoy y la hoja de la plantilla sin
volver a decidir nada. **Lo que más probablemente he roto: el puente de
FEAT-006.** Le he metido una condición nueva —si la sugerencia de hora de ese
ítem ya se contestó aquí, el puente no se pinta— y el store del aparato ha
ganado un campo (`patternAnswers`) que se persiste en la misma clave. Mirar
ahí primero: `VidaRevisionPage.tsx:~1090` y
`store/vida-device-notes.store.ts`.

**Qué se construyó**

*Se crea:*

- `src/features/vida/utils/vida-patterns.utils.ts` — el derivado puro y **el
  modelo de la sugerencia**. `buildActivityPatterns(input)` →
  `{ patterns, waiting, withSuggestion }`, con todas las frases y cifras ya
  compuestas; `VidaPatternSuggestion` con `templatePatch` (lo que manda el
  `vidaItemUpdate`) y `dayPatch` (lo que mandará Hoy en la tajada 3)
  **separados**; `vidaPatternSuggestionId`, `isSuggestionSilenced`,
  `suggestionReturnDate` y `answerNoteFor`. Umbrales exportados:
  `PATTERN_MIN_OCCURRENCES = 4`, `PATTERN_TOLERANCE_MINUTES = 10`,
  `PATTERN_ANSWER_WEEKS = 4`, `PATTERN_MIN_DAY_SAMPLES = 2`,
  `PATTERN_DAY_OUTLIER_MINUTES = 30`. Ni un `new Date()`, ni React, ni store.
- `src/features/vida/utils/vida-patterns.utils.test.ts` — 21 casos.
- `src/features/vida/hooks/useVidaPatterns.ts` — el pegamento y **el único
  punto de entrada de las tres pantallas**: ventana + plantilla + respuestas
  del aparato, y devuelve `{ adherence, patterns, waiting, liveSuggestions,
  answered, patternsLabel, nothingYet, isPending, hasError, refetch,
  answerSuggestion }` con la regla de D1 **ya aplicada**.
- `src/features/vida/hooks/useVidaPatterns.test.tsx` — 4 casos, los del cruce
  con el aparato y con el puente.
- `src/features/vida/components/VidaPatternCard/` — la tarjeta del marco B.

*Se modifica:*

- `src/features/vida/store/vida-device-notes.store.ts` — `patternAnswers:
  Record<string, VidaPatternAnswer>`, la acción `answerPatternSuggestion`, y
  los dos lectores `getPatternAnswer` / `getStartTimeAnswerFor`. Va al
  `partialize`, **sin `version` ni migración** (el merge superficial deja `{}`)
  y **sin clave nueva**: sigue siendo `xavi.vida.deviceNotes`.
- `src/features/vida/pages/VidaRevisionPage.tsx` — `VidaPatternsSection` pasa a
  `useVidaPatterns`, pinta las tarjetas y hace el `vidaItemUpdate`; y
  `VidaReviewBridgeSection` gana **la condición simétrica** del punto 5 del
  plan.
- `src/features/vida/pages/VidaRevisionPage.module.scss` — `.patternList` y las
  tres clases de la lista de espera.
- `src/features/vida/pages/VidaRevisionPage.test.tsx` — 9 casos nuevos y
  `patternAnswers: {}` en el `beforeEach` (sin eso, un «Dejarlo» de un test
  callaba la pregunta del siguiente).
- `src/features/vida/components/VidaAdherenceSummary/` — un `children`
  opcional, que es donde entra «lo que ya se sabe» del marco F (criterio 84).

**Por qué así, y qué se descartó**

1. **La tarjeta habla de una sola dimensión a la vez.** La mini-fila enseña el
   desfase **de la duración** o **de la hora**, la que se aparta más, y el pie
   dice cuál es («Minutos frente a los 45m planeados»). Enseñar las dos en una
   casilla de 30 px no se lee, y el render tampoco lo hace: su primera tarjeta
   son minutos de más y la segunda minutos más tarde.
2. **La mediana, no la media.** Una noche que se fue a las 23:00 no debe mover
   la propuesta. Es la misma elección que hizo `buildTemplateBridge` (D6 de
   FEAT-006), y por eso la hora se redondea igual, **al cuarto**; la duración,
   a **cinco minutos**, que es el grano con el que se escriben las duraciones
   en la plantilla.
3. **Una sola pregunta por tarjeta y un orden fijo:** primero el día que se
   sale de la cuenta —mover la hora de todos por un martes sería cambiar lo
   que va bien—, luego lo que más se aparta entre duración y hora. Dos
   preguntas a la vez en la misma tarjeta serían dos decisiones disfrazadas de
   una.
4. **«Si solo quedara un día, no se ofrece» se ha leído en estricto**
   (criterio 81): con un ítem de dos días donde uno se sale, **no se propone
   nada** —ni quitar el día ni mover la hora—, porque la mediana de la hora
   está arrastrada por ese mismo día y el número mentiría. La tarjeta sí
   enseña el dato («Los martes · 9:40 · +70 min»). Es la lectura más
   conservadora de las dos posibles: la otra —«no se ofrece solo si el ítem se
   quedaría sin días»— ofrecería más y no la he tomado.
5. **Las actividades por debajo del umbral no ocupan una tarjeta.** El
   criterio 75 pide que se diga «llevas 2 de 4»; el render lo resuelve con una
   línea al pie («las demás esperan»). Se pintan como **lista compacta** con
   su cuenta, no como tarjetas a medias: con quince actividades, quince
   tarjetas vacías serían la pantalla entera.
6. **El violeta del render no está.** No hay token semántico de violeta fuera
   de `[data-ds='aura']` (`--aura-ring-to`), y un color literal no se lee en
   oscuro. Las etiquetas de desfase van en `--color-primary`, que es lo que
   hizo la tajada 1 con la barra. **Desviación consciente del render**: si se
   quiere el violeta, es un token nuevo en `_theme-variables.scss`, no un
   literal aquí.
7. **`VIDA_PATTERN_WEEKS` no existe.** El plan lo ponía en este archivo; la
   tajada 1 dejó `VIDA_HISTORY_WEEKS` en el hook y escribió por qué. Se importa
   de allí y **no se escribe un segundo número** (el hook lo usa; este archivo
   no necesita la constante).
8. **Lo aplicado se recuerda en la pantalla, no en el aparato.** Con la
   plantilla fresca la regla ya no propone lo mismo; entre la respuesta del
   API y la lista nueva hay un parpadeo, y en ese hueco no se vuelve a
   preguntar. Es literalmente lo que hace el puente con `updateItem.isSuccess`.

**Verificación**

*Línea base entera (`docs/features/ENVIRONMENT.md`), al terminar:*

| Qué | Línea base escrita | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio**, exit 0 |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos |
| `pnpm test` | 2 fallos de 1479 | **2 fallos de 1513** (los mismos dos de `SearchSelect`; **+34 tests**) |
| `pnpm build` | chunk inicial 1.065,85 kB | **1.079,47 kB** (+13,62 kB), `app-icons` **620,20 kB sin tocar**, `IconPicker` 4,64 kB, exit 0 |

*Criterio 103, vuelto a medir para esta tajada.* La sección no estrena ninguna
consulta de red **salvo una**: la plantilla, `vidaKeys.items.list(true)` — la
**misma clave** que ya piden Plantilla, Actividades y Archivadas, así que
llegando desde cualquiera de ellas es un acierto de caché. En frío el peor caso
pasa de **43** a **44** (42 planes + 1 rango + 1 plantilla). Las respuestas no
cuestan red: son `localStorage`. Y sigue sin montarse nada con «Un día» o «La
semana» abiertas (el test de la tajada 1 lo afirma y sigue en verde).

*En el navegador.* `/app/*` está detrás del login y los agentes no entran con
credenciales. Se montó un **arnés temporal** (`arnes-patrones.html` +
`src/harness/arnes-patrones.tsx`) con tres tarjetas —la de quitar el martes, la
del nombre de 60 caracteres y la que no propone nada—, **servido por el
servidor del propio usuario en el 5173** (no arranqué ninguno) y **borrado
antes de reportar**: `git status` no lo lista. Lo medido ahí, a 375 px:

- `document.documentElement.scrollWidth === clientWidth === 375` y **ni un
  elemento desbordado** (barrido sobre `getBoundingClientRect()` de todos los
  nodos).
- **Nombre de 60 caracteres** (criterio 72, el trozo que la tajada 1 no pudo):
  parte en dos líneas dentro de su caja y no empuja nada.
- **Ni un «%» en el texto renderizado**: los seis nodos con «%» son etiquetas
  `<style>`, no contenido.
- **Oscuro legible** (`[data-theme=dark]` sobre el ámbito `[data-ds='aura']`):
  captura hecha; texto claro sobre vidrio oscuro, las etiquetas de desfase se
  leen y las dos salidas también.

**Criterios que cierra, uno por uno**

- **74 ✅** Las tarjetas dicen lo mismo en el mismo orden: «En tu plantilla:
  L X V · 9:00 · 45m», «Sueles empezar 9:06», «Suele llevarte 1h 10 +25 min»,
  la mini-fila L M X J V S D y el pie «se siguió 5 de 5 veces». Test de la
  página y del `utils`.
- **75 ✅** Con dos apariciones no hay tarjeta ni promedio: «llevas 2 de 4»
  (test puro y test de la página).
- **76 ✅** Los días que no están en la plantilla o sin dato son «·», y hay un
  `expect(...).not.toBe('0')` sobre cada uno.
- **77 ✅** Con todo dentro de tolerancia: «Esto pasa como lo planeaste. Aquí
  no hay nada que proponer.» y **ni un botón** (`queryByRole('button')` en
  cero). Con los datos del marco B esa tarjeta existe (la de «Bañarme» en el
  arnés).
- **78 ✅** «Ponerlo en 1h 10» / «Dejarlo», «Moverlo a las 19:30» / «Dejarlo»,
  «Quitar el martes» / «Dejarlo». Ninguna tarjeta con una sola salida —o hay
  dos o no hay ninguna— y **ninguna es `danger`**: `primary` + `secondary`.
- **79 ✅** `expect(updateVidaItem).toHaveBeenCalledTimes(1)` con
  `{ id: 'i9', durationMinutes: 70 }` y `planMutationsCalled() === 0` (las
  cuatro mutaciones del plan están espiadas en todo el archivo desde
  FEAT-006).
- **80 ✅** «En tu plantilla está 3 días (L X V): se cambia en todos. Los días
  que ya tienes armados se quedan como están.», **en la tarjeta**, antes de
  tocar nada.
- **81 ✅** El patrón de un solo día sale por «Quitar el martes», con
  `templatePatch: { days: ['monday','wednesday','thursday','friday'] }` —un
  `update`, **nunca un `vidaItemDelete`**— y la tarjeta dice por qué. Con dos
  días, no se ofrece.
- **82 ✅** «Dejarlo» no llama a nadie (`updateVidaItem` sin llamadas,
  `planMutationsCalled() === 0`) y escribe en `xavi.vida.deviceNotes`:
  `Object.keys(localStorage)` **no gana ninguna clave de Vida**.
- **83 ✅** Los tres momentos, con reloj inyectado: al día siguiente calla, el
  **19 de octubre** vuelve (28 días exactos), y con el desfase movido ≥10 min
  vuelve antes de plazo; si cambia el día del que habla, también. Y la fecha
  de vuelta se ve **desde que se contesta** («Lo dejaste el 21 de septiembre.
  Vuelve el 19 de octubre si el patrón sigue igual.»).
- **84 ✅** Con una sola semana computable: primero «Lo que ya se sabe» con la
  tarjeta entera y sus dos salidas, y **debajo** «Lo que llega después» con los
  umbrales y lo que falta. El test compara los índices en el texto.
- **85 ✅** Ítem desactivado y actividad archivada (`status === 'cancelled'`):
  la tarjeta sigue, con su dato, y **sin pregunta**; dice por qué en una línea.
- **86 ⚠️ casi entero.** Cargando (esqueletos), error con «Reintentar» que no
  afirma «no tienes datos», 375 px sin scroll, oscuro y nombre largo:
  comprobados (los dos primeros heredados de la tajada 1, ahora también con
  `itemsQuery` en la cuenta). **Lo que falta es dentro de `/app/*`**, que es
  el límite del repositorio.
- **101 ✅** Ni un documento GraphQL, ni una mutación nueva, ni un tipo de
  `api/`, ni una ruta, **ni una clave de `localStorage`**: `graphql/`, `api/` y
  `routes/` no aparecen en el diff.
- **104 ✅** Tabla de arriba.

**Pendiente de prueba manual, del usuario**

- **105 y 106**: con la API despierta y sus semanas. Pasos: abrir «Lo que se
  repite», comprobar que las tarjetas hablan de actividades suyas y los
  números cuadran; pulsar la salida afirmativa de una y **comprobar en la
  plantilla que cambió solo ese campo y que ningún día ya armado se movió**;
  contestar otra con «Dejarlo», **recargar** y ver que no vuelve a preguntar y
  que dice cuándo vuelve.
- **El cruce con el puente, a mano**: dejar el puente «como está» en «La
  semana» y comprobar que la sugerencia de hora de ese mismo ítem **no
  aparece** en «Lo que se repite», y al revés.
- **86 en el aparato real**: 375 px y oscuro dentro de `/app/*`.

**Riesgos — dónde mirar si algo se rompió**

1. **El puente de FEAT-006.** Ahora tiene una condición más. Si alguien
   contesta una sugerencia de hora en «Lo que se repite», el puente de ese ítem
   **desaparece durante cuatro semanas**. Es querido (criterio 83 dice «en
   ninguna de las tres pantallas»), pero cambia el comportamiento de una
   feature entregada y los criterios 54-59 no lo decían.
2. **`patternAnswers` en el store.** Un estado guardado antes de hoy no lo
   trae; el merge superficial lo deja en `{}`. Si alguien serializa el store
   entero en otro sitio, ahora hay un campo más.
3. **`useVidaItemsQuery(true)` en Revisión.** La sección pide la plantilla
   **con los desactivados**, que es otra entrada de caché distinta de la que
   pide el puente (`false`). Comparten servidor, no entrada: en frío es una
   consulta más.
4. **El umbral del día suelto (30 min y 2 muestras) es mío**, no del render ni
   de los criterios. Con datos reales puede que señale días que no deberían o
   que calle alguno: es una constante y se mueve en una línea.
5. **`VidaAdherenceSummary` acepta `children`.** Es un componente de la tajada
   1 ya revisado; el cambio es aditivo y sin él no se puede cumplir el orden
   del marco F.

**Estado del árbol:** sin commitear.

**Además, para quien venga detrás** (no se tocó, es alcance de otro):

- **No arranqué ningún servidor**: el arnés se sirvió desde el **5173 del
  usuario** (`preview_start` con URL abre una pestaña, no levanta nada). El
  **5174** del constructor de la tajada 1 sigue como quedó dicho en su
  reporte; esta sesión tampoco tiene `preview_stop`.
- **`ENVIRONMENT.md` sigue con la línea base vieja** (2 de 1439, 1.054,0 kB).
  Hoy son **1513 tests** y **1.079,47 kB**. No lo he tocado —es la regla—,
  pero cada tajada lo deja más viejo.
- El render pinta las etiquetas de desfase **en violeta**; aquí van en el
  color primario por falta de token (punto 6). Es cosa del sistema de diseño,
  no de esta feature.


#### Tajada 2 · corrección tras la devolución

**Resumen para quien revise.** La tarjeta que mentía ya no existe: **«sin dato»
no es «sin desfase»**. Una actividad planeada varias veces y nunca registrada
pinta sus dos líneas con «—/sin dato» y termina en «De estas 5 veces no hay
ninguna registrada: sin dato no se puede decir cómo te sale», nunca en la frase
del criterio 77. De paso, **ninguna rama puede terminar muda**: hay un campo
nuevo, `closingLabel`, y un test que recorre cinco caminos y exige que todos
digan algo. **Lo que más probablemente he roto ahora: el puente, otra vez** —su
condición de silencio ya no son cuatro semanas a ciegas sino las tres
condiciones de D1, así que un puente que antes se callaba puede volver a
aparecer— y **`useVidaItemsQuery`, que ha ganado un parámetro** y lo usan seis
pantallas.

**Lo que devolvía la tajada, arreglado**

- `src/features/vida/utils/vida-patterns.utils.ts`
  - **`startLine` y `durationLine` dejan de ser anulables.** Se pintan
    **siempre** —que es lo que dice el criterio 74— y sin sesiones dicen
    `valueLabel: '—'` y `offsetLabel: 'sin dato'`. **«Sin dato» es la palabra
    que el módulo ya usa** para el pasado que no se sabe (`VidaAgendaNoData`,
    `VidaReviewWeek`, el punto 10 del render): no había que inventar ninguna.
    Nunca un «0», que sería afirmar que empezó a su hora.
  - **Los dos `?? 0` de `isSettled`, fuera.** Ahora exige `hasAnyData` y trata
    cada desfase por separado: `null` ya no cuenta como «dentro de tolerancia»,
    cuenta como «no se sabe». La frase del criterio 77 vuelve a significar lo
    que el analista escribió: **un patrón dentro de tolerancia**.
  - **`closingLabel`**, el final honrado de los caminos que no preguntan y
    tampoco pueden confirmar nada, con cuatro formas: sin ninguna vez
    registrada; el día suelto que no se puede quitar porque dejaría la
    plantilla en un día (**el hallazgo 1 del revisor**, misma causa y mismo
    arreglo); un ítem sin hora en la plantilla; y el resto. `VidaPatternCard`
    la pinta con el mismo peso visual que la de «no hay nada que proponer».
- `src/features/vida/components/VidaPatternCard/VidaPatternCard.tsx` — pinta
  `closingLabel` y lo dice en su cabecera.

**Los hallazgos, resueltos en el mismo paso**

- **Hallazgo 2 — la promesa de `enabled` ahora es verdad.**
  `useVidaItemsQuery(includeInactive, enabled = true)`: el parámetro es
  **aditivo y por defecto `true`**, así que las seis llamadas que ya existían
  se comportan exactamente igual (`enabled: guard && enabled`).
  `useVidaPatterns` le pasa su `enabled`, así que con la sección cerrada —o con
  la ventana diferida de las tajadas 3 y 4— **no se pide nada, tampoco la
  plantilla**. Era una línea y cierra por adelantado el riesgo del criterio 92.
- **Hallazgos 3 y 4 — la dirección puente → patrón, con test y con la
  excepción de D1.** La condición de `VidaRevisionPage.tsx` pasa por
  `isBridgeSilencedByAnswer(...)`, función pura con **las mismas tres
  condiciones**: dentro de las cuatro semanas, el desfase sin moverse diez
  minutos o más, y sin día concreto. El desfase del puente es lo que propone
  mover (`propuesta − actual`); el de la sugerencia es la mediana menos la
  plantilla: no son el mismo número al minuto y la comparación lleva su margen
  de diez, que es justamente el de D1. Cuatro casos en el `utils` y **dos en la
  página**: con una respuesta de −55 el puente de −60 no se pinta; con una de
  −5, sí.
- **Hallazgo 5 — «Contestadas» ya no esconde la respuesta del puente.**
  `VidaAnsweredSuggestion` gana `source: 'pattern' | 'bridge'` y `answer` pasa
  a ser anulable: un «Dejarlo como está» dado en «La semana» **aparece en la
  lista** con su frase y su fecha de vuelta («Lo dejaste como estaba en la
  semana del 21 de septiembre. Vuelve el 28 de septiembre…», que es la regla
  del puente: vuelve la semana siguiente). Y la **tarjeta** también lo dice, no
  solo el lateral de la tajada 4. Test en el hook.
- **Hallazgo 6 — el umbral del día suelto, escrito como decisión mía.**
  `PATTERN_DAY_OUTLIER_MINUTES = 30` y `PATTERN_MIN_DAY_SAMPLES = 2`: **no
  salen del render ni de ningún criterio, los puse yo.** La razón: treinta
  minutos es el triple de la tolerancia, lo bastante para que nadie llame
  «patrón» a un cuarto de hora de margen, y por debajo de eso el martes del
  render (+70) y una mañana floja se parecerían demasiado; y dos muestras es el
  mínimo para no señalar un día por **una** vez que se torció, que sería
  exactamente el reproche que el módulo no hace. Los dos están exportados y se
  mueven en una línea; **los cierra el usuario con datos suyos** (criterio 105).

**Qué NO he tocado**, porque no era de la devolución: el modelo de la
sugerencia, los dos parches, la regla de D1, el `vidaItemUpdate`, la lista de
espera, el marco F y la hoja de estilos. El diff de esta corrección son
**cinco archivos de `src/`** más los tres de test.

**Verificación, línea base entera otra vez**

| Qué | `ENVIRONMENT.md` | Antes de la devolución | **Ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **limpio**, exit 0 |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 / 0**, los mismos |
| `pnpm test` | 2 de 1479 | 2 de 1513 | **2 fallos de 1526** (los mismos dos de `SearchSelect`; **+13 tests** sobre la entrega devuelta) |
| `pnpm build` | 1.065,85 kB | 1.079,47 kB | **1.080,83 kB** (+1,36 kB por el arreglo), `app-icons` **620,20 kB sin tocar**, exit 0 |

Los trece tests nuevos: nueve en `vida-patterns.utils.test.ts` (las dos líneas
con «sin dato», la frase que ya no sale, el caso de sesiones abiertas —hora sí,
duración no—, **la matriz de cinco caminos que exige que ninguna tarjeta
termine muda**, y los cinco del puente), dos en `VidaRevisionPage.test.tsx` (la
tarjeta sin sesiones pintada de verdad, y las dos direcciones del cruce) y uno
en `useVidaPatterns.test.tsx` («Contestadas» con la respuesta del puente).

**Criterios que esto vuelve a poner en pie**

- **74 ✅** Las dos líneas están en **todas** las tarjetas, también en la que no
  tiene ni una sesión: test puro (`toEqual` sobre las dos líneas) y test de la
  página (`getAllByText('sin dato').length === 2` sobre el DOM real).
- **77 ✅** «Esto pasa como lo planeaste…» **solo** con datos y dentro de
  tolerancia. Con cero sesiones el texto renderizado **no la contiene** y dice
  lo que hay; y sigue sin pintar ningún botón. Comprobado sobre
  `container.textContent`.
- **86 ✅ (lo de antes, más esto)** El estado «sin dato» es un estado más de la
  tarjeta y ya está construido y probado; la línea nueva usa la misma clase que
  la de «no hay nada que proponer», que se miró a 375 px y en oscuro en el
  arnés de la entrega anterior.

**Lo que sigue pendiente y de quién es**

- **105 y 106, del usuario**, igual que antes. Y con esto se añade un paso
  fácil de comprobar: **planea algo y no lo registres**; la tarjeta debe decir
  «no hay ninguna registrada», nunca «pasa como lo planeaste».
- **No he vuelto a abrir el navegador** en esta corrección: la evidencia de lo
  que pinta la tarjeta nueva es el test de la página sobre el DOM real, y la
  caja y los colores no han cambiado (misma clase `.settled`). El arnés de la
  entrega anterior está borrado y **no he arrancado ningún servidor**.

**Riesgos nuevos — dónde mirar**

1. **El puente puede volver a aparecer donde antes callaba.** Con una respuesta
   vieja de otro número, la condición ya no lo silencia. Es lo que pide D1 y lo
   que hace simétrica la regla, pero cambia el comportamiento respecto a lo que
   se entregó ayer.
2. **`useVidaItemsQuery` tiene un parámetro más.** Aditivo y con valor por
   defecto; las seis llamadas existentes están sin tocar y la suite entera pasa,
   pero el radio es el módulo entero.
3. **`startLine` y `durationLine` ya no son anulables.** Cualquier consumidor
   futuro que hiciera `pattern.startLine ? …` sigue funcionando, pero el tipo
   cambió; hoy el único consumidor es `VidaPatternCard`.
4. **`VidaAnsweredSuggestion.answer` ahora puede ser `null`.** Lo consumirá la
   tajada 4: quien pinte «Contestadas» tiene que mirar `source`, no asumir que
   hay número.

**Estado del árbol:** sin commitear.

### Tajada 3 — El aviso llega al planear

**Resumen para quien revise.** Hoy ya no espera a que vayas a buscar el dato:
un bloque planeado del que hay costumbre trae **su aviso pegado debajo**, en
violeta punteado, numerado «1 de 2», con las dos salidas escritas y la
consecuencia antes de los botones — **«solo para hoy: tu plantilla se queda
como está»** (D2) —; y los chips del hueco ofrecen ya **la duración que sueles
tardar** y lo dicen. **Lo que más probablemente he roto: el coste de abrir
Hoy**, que es la pantalla más usada del módulo y que ahora monta la ventana de
seis semanas (diferida, y solo cuando puede servir de algo). Lo segundo,
`suggestionsForGap`, que es de FEAT-003 y ahora decide con **la duración
habitual** también para saber si algo cabe en el hueco. Mirar ahí primero:
`VidaHoyPage.tsx:~430` (el interruptor `canShowPatterns`) y
`vida-agenda.utils.ts:~500` (`offeredFor`).

**Qué se construyó**

*Se crea:*

- `src/features/vida/components/VidaBlockHint/` (`.tsx` + `.module.scss` +
  `index.ts`) — el aviso del marco C. Es un `<li>` propio, **hermano del bloque
  y debajo de él**, igual que `VidaAgendaNoData`, que era la referencia que el
  encargo señalaba. Así no toco `VidaAgendaBlock` —entregado y revisado en
  FEAT-004— y el bloque del que habla **no se tapa ni se empuja fuera de
  vista** (criterio 94).

*Se modifica:*

- `src/features/vida/utils/vida-patterns.utils.ts` — **`pickBlockHints()`**, la
  regla del criterio 88 entera en un sitio puro y probado; el tipo
  `VidaBlockHint` con la cuenta, las dos etiquetas, la nota de alcance y el
  `dayPatch`; **`usualDurationsByItemId()`**; y dos campos nuevos en
  `VidaActivityPattern`: `usualDurationMinutes` y `usualDurationSamples`.
- `src/features/vida/utils/vida-agenda.utils.ts` — `suggestionsForGap` recibe
  `usualDurations` (**por defecto `{}`**) y `GapSuggestion` gana `isUsual`.
- `src/features/vida/components/VidaAgendaGap/VidaAgendaGap.tsx` — «sueles
  tardar 55m» en el chip y en su `aria-label`, y la línea del pie del render
  («la que sueles tardar, no la que pusiste») **solo si hay alguna**.
- `src/features/vida/pages/VidaHoyPage.tsx` — monta `useVidaPatterns`
  **diferido**, elige los avisos con `pickBlockHints`, los pinta pegados a su
  bloque, aplica con `activityDayPlanItemEdit` y contesta con
  `answerSuggestion`.
- `src/features/vida/hooks/useVidaHistoryWindow.ts` — `PAST_STALE_TIME` pasa de
  cinco minutos a **no caduca** (ver «el coste», abajo).
- Tests: `vida-patterns.utils.test.ts` (+13), `vida-agenda.utils.test.ts` (+4),
  `VidaHoyPage.test.tsx` (+8), `useVidaHistoryWindow.test.tsx` (+2), y **los 97
  casos que Hoy ya tenía, sin tocar ni uno**.

**Lo que NO se ha creado**, porque ya estaba: ni un documento GraphQL, ni una
mutación, ni una ruta, ni una clave de caché, ni una de `localStorage`. La
respuesta se guarda con `answerSuggestion` del hook de la tajada 2, que escribe
en `patternAnswers` dentro de `xavi.vida.deviceNotes`.

**El coste: medido, y qué se ha hecho para contenerlo (criterio 103)**

Esto era lo delicado de la tajada y va con número.

| Momento | Consultas de plan | Total nuevas |
|---|---|---|
| Abrir Hoy **antes** de esta tajada | 1 (el día) + 6 (la tira, sin repetir el día) + 1 (la misma fecha de la semana pasada, `VidaDayActions`) | ≈ **11** con las de sesiones, plantilla, ajustes y sesión abierta |
| Abrir Hoy **en frío**, domingo, con plan | + **39** planes + **1** rango + **1** plantilla `items.list(true)` | ≈ **52** |
| Abrir Hoy **en frío**, lunes | + 33 planes + 1 rango + 1 plantilla | ≈ **46** |
| Llegar a Hoy **desde Revisión** (caché caliente) | **0** planes, **0** rango (misma clave `followUps.range(from,to)`, que se calcula desde hoy y es la misma en las dos pantallas), 0 plantilla | ≈ **11**, lo de siempre |
| **Volver** a Hoy dentro de la misma sesión | **1** (solo la de hoy, que sí cambia) | ≈ 11 |
| Un día **pasado**, o sin plan y sin plantilla | **0** | lo de siempre |

Las dos primeras filas de la ventana están medidas en
`useVidaHistoryWindow.test.tsx` con espías sobre la API (39 = 42 − los 3 días de
la tira que caen dentro de la ventana; 43 en la vuelta = 42 + la de hoy). Las
cuentas de la propia pantalla salen de leer sus hooks, no de un espía: dentro de
`/app/*` no entro.

**Lo que he decidido para que abrir Hoy no dispare 43 consultas sin más**, con
su razón:

1. **La ventana no se monta en el primer pintado y no siempre se monta.** Cuatro
   condiciones (`VidaHoyPage.tsx`, `canShowPatterns`): el día **se puede
   planear** —un día pasado paga cero—, **los datos propios ya resolvieron** —el
   primer pintado no espera a nadie, criterio 92—, **hay plan o hay plantilla**
   —sin ninguna de las dos no hay bloque al que pegar un aviso ni ficha a la que
   ponerle duración— y hay sesión. Con la corrección de la tajada 2
   (`useVidaItemsQuery(includeInactive, enabled)`) el interruptor apaga
   **también** la plantilla: no se pide ni una consulta antes de tiempo.
2. **La ventana se paga una vez por sesión, no una por apertura.** Los días
   cerrados pasan de `staleTime` cinco minutos a **infinito**. Es seguro y no es
   un atajo: lo único que cambia el plan de un día pasado es una escritura de
   esta misma aplicación, y **todas** pasan por `invalidateDayPlanQueries(date)`,
   que lo caduca igual. El techo real sigue siendo `gcTime` (media hora sin
   nadie mirando y la entrada se tira). Con los cinco minutos de antes, un
   recorrido normal —Hoy, Plantilla, Hoy, Revisión— podía pagar la ventana
   **cuatro veces**; ahora la paga una.
3. **Lo que NO he hecho, y por qué:** no he acortado la ventana en Hoy. El plan
   lo prohíbe con un argumento que sigue siendo bueno —«si Hoy mirase 4 semanas
   y Revisión 6, la misma sugerencia tendría dos números y la regla de los 10
   min de D1 dispararía sola»— y bajar `VIDA_HISTORY_WEEKS` a 4 para todos
   rompería la justificación de D1 (el silencio de cuatro semanas se sostiene
   en que la ventana es más larga). Tampoco he metido los avisos detrás de un
   toque: el render fija que el dato aparece **sin pedir nada**.

**La salida natural, si esto duele con datos reales:** una consulta de rango de
planes en el API (`activityDayPlansInDates`). No existe, está fuera de alcance
por el criterio 101, y convertiría las 39 en **una**. Queda anotado aquí y no
en una conversación.

**Por qué así, y qué se descartó**

1. **El aviso es un `<li>` hermano, no un trozo de `VidaAgendaBlock`.** El
   bloque está entregado y revisado desde FEAT-004 y ya tiene seis
   responsabilidades; meterle una séptima habría obligado a re-revisar FEAT-004.
   La referencia que el encargo señalaba —`VidaAgendaNoData`— hace exactamente
   esto. Debajo y no encima: así se cumple el criterio 94 por construcción.
2. **Un aviso que al aceptarlo no cabe, no se pinta.** `pickBlockHints` recibe
   de cada bloque el hueco que tiene alrededor (`getBlockEditWindow`) y descarta
   el cambio que se comería el bloque siguiente. La alternativa era pintarlo y
   dejar que el API lo rechazara con un «no pudimos cambiar ese bloque»: una
   salida que no lleva a ninguna parte es peor que no ofrecerla, y el criterio
   88 ya acepta que un candidato se quede en «Lo que se repite».
3. **«Quitar el martes» no llega a Hoy.** Es la única de las tres formas sin
   `dayPatch`, porque **un día armado no se des-planea desde un aviso** —eso ya
   lo decía el tipo desde la tajada 2—. Se queda en la sección de patrones, que
   es donde cambiar la plantilla tiene su consecuencia escrita entera.
4. **Un bloque que ya terminó o que ya tiene sesión no recibe aviso.** «Al
   planear» es antes, no después; cambiarle la hora a toro pasado no es una
   sugerencia, es llegar tarde. Es decisión mía, no sale de ningún criterio.
5. **El aviso desaparece solo al aceptarlo.** No hay bandera nueva: si el bloque
   ya tiene el número que se propone, `appliesTo` devuelve `false` y no hay
   aviso. El mismo mecanismo tapa el caso del día armado desde una plantilla ya
   corregida.
6. **«Sueles empezarlo 22 min más tarde», no «los domingos…».** El render dice
   «Los domingos sueles salir sobre las 19:22», pero **la mediana es de todos
   los días**, no de los domingos: decir «los domingos» sería afirmar algo que
   el número no dice. Lo que sí es por día de la semana es `drop-day`, y esa no
   llega aquí. **Desviación consciente del render**, y va en la dirección de no
   fingir.
7. **El violeta sí está, y el `#7C3AED` a pelo sigue sin estar.** La tajada 2
   escribió que no había token de violeta; lo hay: **`--aura-ring-to`**
   (`_theme-variables.scss:203` y `:270`, `#7c3aed` en claro y `#a78bfa` en
   oscuro), que ya usan medio módulo de hábitos y el propio `VidaDayBudget` de
   Vida. El aviso lo usa con `var(--color-primary)` de respaldo: **ni un color
   literal**. Con esto el criterio 87 («violeta punteado») se cumple de verdad y
   la desviación que la tajada 2 declaró se puede cerrar también allí, si se
   quiere, en una línea.
8. **Los chips: la costumbre manda también para saber si cabe.** Ofrecer 55 min
   en un hueco de 40 porque la plantilla dice 30 sería colocar algo que no
   entra. En cambio **un ítem sin duración en la plantilla sigue sin ella**: la
   costumbre no le inventa una, porque el criterio 19 de FEAT-003 dice que eso
   no se coloca a ciegas y no me toca a mí cambiarlo. Queda como hallazgo.
9. **El umbral del chip son cuatro *datos registrados*, no cuatro apariciones.**
   El criterio 91 dice «cuando hay 4 datos o más»; una actividad puede estar
   ocho veces en el plan y tener dos sesiones. `usualDurationSamples` lo cuenta
   aparte y está exportado.

**Los tres hallazgos abiertos de la tajada 2**

- **(a) Los dos desfases del puente** (`propuesta − actual` frente a
  `mediana − plantilla`). **No me estorba y no lo he tocado**: vive en el cruce
  puente↔patrón, que es de Revisión y no pasa por Hoy. Sigue abierto, con la
  misma redacción del revisor.
- **(b) `VidaAnsweredSuggestion.answer` puede ser `null`.** No me estorba: esta
  tajada **no consume `answered`** —solo `patterns` y `answerSuggestion`—. Sigue
  abierto **para la tajada 4**, que es quien pinta «Contestadas»: `source`
  manda, y hay dos formas de frase, no una.
- **(c) Una tarjeta desactivada y a la vez dentro de tolerancia imprime dos
  líneas de cierre.** No me estorba —es la tarjeta de Revisión, y una
  desactivada nunca llega aquí porque `mutedReason` ya le quitó la sugerencia en
  la tajada 2—. Sigue abierto.

**Verificación**

*Línea base entera (`docs/features/ENVIRONMENT.md`), al terminar:*

| Qué | Línea base del encargo | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio**, exit 0 |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos |
| `pnpm test` | 2 fallos de 1526 | **2 fallos de 1554** (los mismos dos de `SearchSelect`; **+28 tests**) |
| `pnpm build` | chunk inicial 1.080,83 kB | **1.085,17 kB** (+4,34 kB), `app-icons` **620,20 kB sin tocar**, `IconPicker` 4,64 kB, exit 0 |

*En el navegador, que es lo que faltaba en las dos entregas anteriores.*
`/app/*` está detrás del login y los agentes no entran con credenciales, así que
monté un **arnés temporal** (`arnes-avisos.html` + `src/harness/arnes-avisos.tsx`)
con los dos avisos —uno de duración y uno de hora, el segundo con un nombre de
60 caracteres— y el hueco con sus chips, **servido por el 5173 del propio
usuario**: no arranqué ningún servidor, `preview_start` con URL abre una
pestaña. El arnés está **borrado** y `git status` no lo lista. Lo visto, a
375 px:

- **El aviso se pinta como el marco C**: caja de trazo **violeta punteado**,
  cabecera «DE TUS ÚLTIMAS SEMANAS» en violeta, la píldora «1 de 2» / «2 de 2»,
  la frase con el número en negrita, la línea de alcance y **las dos salidas**.
  Captura tomada.
- **Va pegado y debajo** de su bloque, sin tapar nada, con la canaleta de la
  hora vacía para que no parezca otra cosa de la agenda.
- **Sin desbordes**: `scrollWidth === clientWidth === 375` y **ni un nodo** con
  `getBoundingClientRect().right > 375`. El nombre de 60 caracteres parte en
  tres líneas dentro de su caja.
- **Ni un «%»** en el texto renderizado.
- **Oscuro legible** (`data-theme=dark`): el violeta pasa a `#a78bfa`, el trazo
  punteado se lee y las dos salidas también. Captura tomada.
- **El chip dice «Compra semana · sueles tardar 55m»** y el de al lado, sin
  datos, sigue diciendo «20m» a secas, sin hueco reservado.

**Criterios que cierra, uno por uno**

- **87 ✅** Aviso pegado al bloque, violeta punteado, cabecera «De tus últimas
  semanas» + «1 de 2», y las dos salidas escritas con el número dentro
  («Sí, 1h», «Sí, 19:30») y «Así está bien». Test de la página sobre el DOM
  (`VidaHoyPage.test.tsx`, «el aviso va pegado a SU bloque») **y** visto en el
  navegador.
- **88 ✅** `pickBlockHints`: dos como mucho, nunca dos del mismo bloque ni dos
  de la misma sugerencia, ordenados **por veces repetidas** y solo con desfase
  **de más de** 10 min y **sin contestar** (llegan ya filtradas por D1 desde
  `useVidaPatterns`). Con tres candidatos se pintan dos y el tercero **no
  aparece**: test puro y test de la página.
- **89 ✅** La salida afirmativa manda **un** `activityDayPlanItemEdit` con
  `{ itemId: 'b2', startTime: '10:00', endTime: '11:00' }` y **cero**
  `vidaItemUpdate` —espía puesto en el mock de `useVidaItems`, que hoy la página
  ni importa— y cero de las otras tres del plan. Y **lo dice antes**: «Esto
  cambia solo para hoy: tu plantilla se queda como está.»
- **90 ✅** «Así está bien» no llama a ninguna mutación y escribe la respuesta
  con `answerSuggestion`, que es la misma de la tajada 2: entra en la regla de
  las cuatro semanas del criterio 83 y calla la pregunta **en las tres
  pantallas**. Test de la página.
- **91 ✅** Los chips ofrecen la duración habitual con **cuatro datos
  registrados o más** y lo dicen; con menos ofrecen la que pusiste **sin
  etiqueta y sin hueco**. Cuatro tests en `vida-agenda.utils.test.ts`, dos en el
  `utils` de patrones y uno de la página; visto en el navegador.
- **92 ✅** Los **97 casos que Hoy ya tenía pasan sin tocar ni uno**, y hay un
  test explícito que afirma que sin patrones no aparecen ni «De tus últimas
  semanas», ni «Así está bien», ni «sueles tardar», ni la línea del pie. Además
  es cierto **por construcción**: `usualDurations` por defecto es `{}` y
  `pickBlockHints([])` devuelve `[]`.
- **93 ✅** Ni rojo, ni icono de error, ni `role="alert"` (aserción en el test),
  ni una palabra de la lista de reproche (barrido sobre el texto renderizado del
  aviso y sobre el `utils`). Y **el día se arma entero ignorándolos**: sin tocar
  nada no se llama a ninguna mutación, también afirmado.
- **94 ✅ en lo que se puede aquí.** 375 px sin scroll horizontal con los dos
  avisos abiertos, oscuro legible y el aviso **debajo** del bloque: medido en el
  arnés con `getBoundingClientRect()` sobre todos los nodos. **Dentro de
  `/app/*` lo cierra el usuario**, que es el límite del repositorio.
- **101 ✅** El diff no toca `graphql/`, `api/` ni `routes/`, y no hay clave de
  `localStorage` nueva: la respuesta va al `patternAnswers` que ya existía.
- **103 ✅** Tabla de arriba, con la medida y con las dos decisiones de
  contención escritas.
- **104 ✅** Tabla de la línea base.

**Pendiente de prueba manual, del usuario**

- **105 y 106**, con la API despierta y sus semanas. Pasos nuevos de esta
  tajada: abrir **Hoy** en un día con plan y comprobar que aparece **como mucho
  un par de avisos** pegados a su bloque; pulsar la salida afirmativa de uno y
  comprobar que **cambia ese bloque de ese día y la plantilla sigue igual**;
  contestar el otro con «Así está bien», **recargar**, y ver que no vuelve a
  preguntar —ni aquí ni en «Lo que se repite»—; y mirar un hueco para ver
  «sueles tardar N» en una ficha con cuatro registros o más.
- **La otra mitad del criterio 94**: 375 px y oscuro **dentro de `/app/*`**.
- **El coste contra el API real.** Está medido en consultas, no en segundos:
  39 peticiones en paralelo contra Render (plan gratuito, se duerme a los 15
  min) es exactamente lo que nadie puede cronometrar desde aquí. Si al abrir Hoy
  en frío se nota, la palanca escrita es la consulta de rango en el backend.

**Riesgos — dónde mirar si algo se rompió**

1. **El coste de Hoy.** Es el riesgo principal y está medido, no prometido. Si
   algo va lento al abrir Hoy, es esto; el interruptor está en una línea
   (`canShowPatterns`) y apagarlo devuelve Hoy a lo que costaba ayer.
2. **`PAST_STALE_TIME` ahora es infinito**, y eso es de la tajada 1: afecta
   **también a «Lo que se repite»**. Un día pasado cambiado desde **otro
   navegador** no se ve hasta que la entrada caduca por `gcTime` (media hora) o
   hasta una escritura local. Antes la ventana eran cinco minutos.
3. **`suggestionsForGap` decide con la duración habitual.** Es de FEAT-003 y la
   usan las fichas de todos los huecos: si la costumbre es más larga que la
   plantilla, una ficha que antes cabía **puede dejar de ofrecerse**. Es
   correcto —no cabría— pero es un cambio de comportamiento en una pantalla
   entregada.
4. **Un segundo `useEditDayPlanItemMutation` en la página.** La hoja ya usaba
   uno; ahora hay dos instancias del mismo hook. Comparten clave e invalidación,
   pero `isPending` es independiente: el aviso se deshabilita solo cuando el
   cambio es suyo.
5. **`VidaActivityPattern` tiene dos campos más.** Aditivos; el único consumidor
   nuevo es `usualDurationsByItemId`. `VidaPatternCard` no los mira.
6. **La cuenta «1 de 2» se escribe al final**, después de filtrar: si alguien
   añade un filtro posterior en la página, la cuenta mentiría. Por eso el filtro
   entero vive dentro de `pickBlockHints`.

**Además, para quien venga detrás** (no se tocó, es alcance de otro):

- **No arranqué ningún servidor.** El arnés se sirvió desde el **5173 del
  usuario**; la pestaña del navegador que abrí es
  `preview-local_e4cefb6f-76b2-4e58-b5c2-1431d439087a` y no levanta nada. El
  **5174** del constructor de la tajada 1 sigue como quedó dicho en su reporte.
- **`ENVIRONMENT.md` sigue con la línea base vieja** (2 de 1479, chunk
  1.065,85 kB). Hoy son **1554 tests** y **1.085,17 kB**. **No lo he tocado**
  —es la regla—, pero ya va cuatro tajadas por detrás.
- **Hallazgo nuevo, no es mío:** una ficha **sin duración en la plantilla** pero
  con cuatro registros propios podría ofrecerse con la duración habitual en vez
  de abrir la hoja vacía. No lo he hecho porque cambiaría el criterio 19 de
  FEAT-003, que está entregado; lo decide el usuario.
- **Para la tajada 2, si alguien la vuelve a tocar:** el violeta del render
  **sí** tiene token (`--aura-ring-to`). La desviación que declaró su punto 6 se
  puede cerrar cambiando `--color-primary` por
  `var(--aura-ring-to, var(--color-primary))` en las etiquetas de desfase.

**Estado del árbol:** sin commitear.

### Tajada 4 — El dato donde se edita, y el escritorio

**Resumen para quien revise.** La hoja del ítem de la plantilla dice ahora **lo
que dicen tus semanas debajo del campo del que hablan** —bajo «A qué hora», con
su salida y el día marcado; bajo «Cuánto», una línea que **confirma también
cuando va bien**—, y en escritorio «Lo que se repite» se reparte como el marco
E: patrones en rejilla y un lateral con «Sin contestar», «Contestadas» y «De
dónde sale todo esto». **Lo que más probablemente he roto: la hoja del ítem**,
que es la pantalla más compartida del módulo —la abren Plantilla, Actividades y
Archivadas— y que ahora tiene tres props más y un camino nuevo que **escribe en
su borrador** (la salida afirmativa). Lo segundo, `VidaPlantillaPage`, que monta
la ventana de seis semanas al abrir la primera hoja. Mirar ahí primero:
`VidaActivitySheet.tsx` (`applyAdvice`) y `VidaPlantillaPage.tsx:~120`.

**Qué se construyó**

*Se crea:*

- `src/features/vida/components/VidaPatternAdvice/` (`.tsx` + `.module.scss` +
  `index.ts`) — **la caja de «lo que dicen tus semanas»**: trazo violeta
  punteado, cabecera en violeta, la frase, la consecuencia y las dos salidas
  cuando hay algo que proponer. La usan **la hoja** (marco D) y **el lateral**
  (marco E), que en el render son el mismo dibujo dos veces (`.advice` y
  `.sugg`).
- `src/features/vida/components/VidaPatternsAside/` — el lateral de escritorio,
  con sus tres paneles, y **`VidaPatternsSource` exportado aparte** para poder
  pintarlo suelto en móvil.

*Se modifica:*

- `src/features/vida/utils/vida-patterns.utils.ts` — **`buildTemplateSheetAdvice(pattern)`**
  → `{ header, timeText, timeSuggestion, flaggedDay, durationText, durationSuggestion }`,
  o **`null`** sin una sola sesión registrada. Puro, sin reloj y sin React,
  como todo el archivo. La hoja no compone ninguna frase ni decide qué campo
  lleva la pregunta.
- `src/features/vida/components/VidaActivitySheet/VidaActivitySheet.tsx` — tres
  props **aditivas** (`pattern`, `patternAnswerNote`, `onPatternDismiss`), la
  línea bajo «A qué hora», la línea bajo «Cuánto», el día marcado en la fila de
  días y `applyAdvice`. Su `.module.scss` gana `.dayFlagged`, `.patternNote` y
  `.patternDone`.
- `src/features/vida/pages/VidaPlantillaPage.tsx` — monta `useVidaPatterns`
  **diferido** y pasa el patrón de **ese** ítem a la hoja.
- `src/features/vida/pages/VidaRevisionPage.tsx` — `isDesktop` en
  `VidaPatternsSection`, la rejilla con su lateral, y `applied` pasa de ser una
  lista de ids a guardar **qué cambió** (criterio 99). Su `.module.scss` gana
  `.patternsLayout` / `.patternsMain` y convierte `.patternList` en rejilla.
- **Los arreglos de lo que dejaron las tajadas anteriores**, abajo.
- Tests: `vida-patterns.utils.test.ts` (+4), `VidaActivitySheet.test.tsx` (+7),
  `VidaRevisionPage.test.tsx` (+4), `VidaPlantillaPage.test.tsx` (+1).

**Lo que NO se ha creado**, porque ya estaba: ni un documento GraphQL, ni una
mutación, ni una ruta, ni una clave de caché, ni una de `localStorage`. La
ventana es `useVidaHistoryWindow` (tajada 1), el derivado y el modelo de
sugerencia son los de la tajada 2, y la respuesta va al `patternAnswers` que ya
existía.

**Por qué así, y qué se descartó**

1. **`VidaBlockHint` no sirve tal cual, y lo miré antes de escribir nada.** Es
   un `<li>` con **la canaleta de la hora** de la agenda, se numera «1 de 2» y
   su parche es el del día (`dayPatch`). En la hoja no hay lista, ni hora, ni
   cuenta, y lo que se toca es **la plantilla**. Lo que sí comparten —y se ha
   compartido— es el **lenguaje visual** y el token del violeta. Por eso
   `VidaPatternAdvice` nace como **un** componente para los **dos** sitios
   nuevos (hoja y lateral) en vez de dos: el render los dibuja igual, y
   escribirlo dos veces era la duplicación que el plan prohíbe. **Es la única
   desviación de la lista de archivos del plan** (que solo preveía
   `VidaPatternsAside/`).
2. **En la hoja, la salida afirmativa escribe en el borrador, no en el API.**
   Es la lectura literal del criterio 96 —«mientras no se pulse la salida,
   guardar manda exactamente el mismo cuerpo»—, que implica que **pulsarla sí
   cambia el cuerpo**. Y evita el caso feo: un `vidaItemUpdate` suelto mientras
   la hoja tiene un borrador abierto dejaría dos versiones de los días
   compitiendo, y la última en guardar —la hoja— devolvería el martes que
   acabas de quitar. Se dice en pantalla: «Se guarda cuando pulses **Guardar**».
   **Es distinto de la tarjeta de Revisión** (criterio 79, un `vidaItemUpdate`),
   y tiene que serlo: allí no hay formulario.
3. **La línea de «Cuánto» sin caja cuando solo confirma.** Con caja punteada,
   «esta duración va bien» se leería como un aviso; el render la pinta como
   `pfoot`, texto al pie del campo. La caja aparece **solo cuando hay pregunta**.
4. **«De dónde sale todo esto» también en móvil.** El criterio 98 pone el
   lateral en escritorio y el 100 no dice dónde vive el panel. Pintarlo solo en
   pantallas grandes dejaría al teléfono —que es el aparato— sin la única
   explicación de dónde salen los números y de que **las respuestas no están en
   otro navegador**. Va al final de la sección en móvil y dentro del lateral en
   escritorio. **Desviación consciente del marco E**, en la dirección de
   explicarse.
5. **«Sin contestar» no se pinta en móvil.** Serían las mismas preguntas que
   las tarjetas, con los mismos botones, a dos pantallazos de distancia. Hay
   test de que en móvil la pregunta sale **una sola vez** y en escritorio dos.
6. **La ventana de Plantilla se monta al abrir la primera hoja**, no al entrar.
   Lo único que la consume es la hoja; con el `enabled` de `useVidaPatterns`
   —que apaga **también** la consulta de plantilla— entrar en Plantilla cuesta
   **exactamente lo de ayer**. Hay test.
7. **Lo aplicado se cuenta en «Contestadas» desde la pantalla, no desde el
   aparato.** Guardar «lo que apliqué» en `localStorage` habría sido un campo
   nuevo en el store para algo que **la propia plantilla ya dice**: tras
   recargar, el patrón ya no propone nada porque el número coincide. Queda la
   arista escrita en los riesgos.

**Lo que cierro de lo que dejaron las tajadas anteriores**

- **El violeta (desviación de la tajada 2, punto 6).** Cerrada: `.tag` y las
  casillas de la mini-fila de `VidaPatternCard.module.scss` pasan de
  `--color-primary` a **`var(--aura-ring-to, var(--color-primary))`**, que es el
  token que existía desde siempre (`_theme-variables.scss:203/:270`). El
  comentario que afirmaba que no había token está corregido en el propio
  archivo. **La barra de adherencia se queda en mint a propósito**: en el render
  (`.wrow .wb`, `.wrow .wb i`) es `var(--mint)`, no violeta — el violeta es de
  los desfases y de los avisos.
- **`VidaAnsweredSuggestion.answer` puede ser `null` (hallazgo 2 de la revisión
  de la tajada 2, reservado «para la tajada 4»).** «Contestadas» mira **`source`**
  antes que `answer`: la respuesta dada en el puente se pinta con su frase y su
  fecha de vuelta y además dice **dónde se contestó** («Lo contestaste en «La
  semana»»). Ni una lectura de `answer` sin mirar `source`.
- **Las dos líneas de cierre en una tarjeta desactivada (hallazgo 3).**
  Arreglado en `VidaPatternCard.tsx`: con `mutedReason` no se pinta
  `settledLabel`. Manda la que explica **por qué** no se pregunta.
- **El fondo violeta que pisaba `.agenda[data-tone='plan']` (hallazgo 1 de la
  revisión de la tajada 3).** Arreglado: el aviso lleva `data-kind="hint"` y la
  regla del trazo suave lo excluye. Una línea en cada archivo, sin tocar el
  componente por dentro.

**Lo que dejo escrito y NO he tocado, con su razón**

- **Si la ventana falla, en Hoy no se dice nada** (hallazgo 3 de la tajada 3).
  **No cabía aquí y no lo he forzado.** Hoy no es de esta tajada, tiene 97 casos
  entregados y el criterio 92 exige que sin datos la pantalla sea idéntica a la
  de FEAT-003/004: meterle un mensaje de error mientras armas el día toca
  justo eso y necesita su propio criterio. **La forma que propongo**, si el
  usuario la quiere: una línea del tamaño de `.readOnly`, **sin `role="alert"`
  y sin rojo**, debajo de la agenda y solo cuando `patterns.hasError` y el día
  **se puede planear** — «De estas semanas falta algún día: hoy no te digo lo
  que sueles tardar». Sitio: `VidaHoyPage.tsx`, junto al bloque que ya pinta
  `readOnly`.
- **El aviso de Hoy repite el nombre entero de la actividad** (hallazgo 4).
  Cambiarlo es tocar las frases de `pickBlockHints` y sus trece tests, en una
  pantalla entregada, por una preferencia de redacción. **Propuesta concreta:**
  en `blockHintText`, sustituir el nombre por «Esto» cuando el aviso cuelga del
  bloque que ya lo dice —el nombre sigue en el bloque de encima y en el
  `aria-label` del aviso—.
- **`PAST_STALE_TIME` infinito** (hallazgo 5): es el precio escrito de la
  contención del coste, y con esta tajada **vale todavía más** —Plantilla es la
  tercera pantalla que reutiliza la misma ventana—. Sigue siendo cierto que un
  día pasado cambiado **desde otro navegador** no se ve hasta que caduque por
  `gcTime`. No lo toco.
- **El criterio 18 de FEAT-003 queda derogado en parte por el 91** (hallazgo 2
  de la tajada 3). Es documentación de otro expediente; **la anoto aquí como
  deuda de FEAT-007 entera**, abajo.
- **Los dos desfases del puente** (`propuesta − actual` frente a
  `mediana − plantilla`): sigue abierto, no me estorba, no lo toco.
- **El umbral del día suelto** (30 min, 2 muestras): sigue siendo del
  constructor de la tajada 2 y lo cierra el usuario con datos suyos.

**El coste, medido (criterio 103)**

| Momento | Consultas nuevas |
|---|---|
| **Entrar en Plantilla** (sin abrir ninguna hoja) | **0**. El interruptor apaga la ventana **y** la plantilla del hook; la lista sigue pagando su `items.list(true)` de siempre. Hay test (`patternsEnabled` todo `false` hasta el primer clic). |
| **Abrir la primera hoja, en frío** | 36–42 planes + 1 rango. **0 de plantilla**: `useVidaItemsQuery(true)` es la misma clave que la página ya pidió. |
| **Abrir la primera hoja llegando de Hoy o de Revisión** | **0**: misma clave por día y el mismo `followUps.range`, con `PAST_STALE_TIME` infinito. |
| **Abrir la segunda, la tercera… hoja** | **0** |
| **Abrir «Lo que se repite» en escritorio** | **0 más que en móvil**: el lateral consume `liveSuggestions` y `answered`, que ya estaban derivados. La rejilla es CSS. |

**Verificación**

*Línea base entera (`docs/features/ENVIRONMENT.md`), corrida al terminar:*

| Qué | Línea base del encargo | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio**, exit 0 |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos |
| `pnpm test` | 2 fallos de 1554 | **2 fallos de 1570** (los mismos dos de `SearchSelect`; **+16 tests**) |
| `pnpm build` | chunk inicial 1.085,17 kB | **1.092,02 kB** (+6,85 kB), `app-icons` **620,20 kB sin tocar**, `IconPicker` 4,64 kB, exit 0 |

*En el navegador.* `/app/*` está detrás del login y los agentes no entran con
credenciales. Monté un **arnés temporal** (`arnes-t4.html` +
`src/harness/arnes-t4.tsx`) con la fila de días y los dos campos de la hoja
usando **las clases reales** de `VidaActivitySheet.module.scss`, el
`VidaPatternAdvice` de verdad, el `VidaPatternsAside` de verdad y la rejilla
con las clases reales de `VidaRevisionPage.module.scss`. **Servido por el 5173
del propio usuario** —no arranqué ningún servidor; `preview_start` con URL abre
una pestaña— y **borrado antes de reportar**: `git status` no lo lista. Lo
visto:

- **375 px, claro:** `scrollWidth === clientWidth === 375`, **ni un nodo** con
  `right > 375`, y **ni un «%»** en el texto renderizado. El martes va marcado
  en **violeta punteado** entre los días encendidos en mint; el aviso se lee
  como nota al margen, con sus dos salidas (`primary` + `secondary`, ninguna
  `danger`); la línea de «Cuánto» va **sin caja** y confirma. Un nombre de 55+
  caracteres parte en dos líneas dentro de su caja.
- **375 px, oscuro** (`data-theme=dark`): el violeta pasa a `#a78bfa`, el trazo
  punteado se lee, las dos salidas también, y los tres paneles del lateral —
  «Contestadas» con las dos formas de frase (con número y del puente) y «De
  dónde sale todo esto»— son legibles.
- **1280 px:** `patternsLayout` mide **885 px + 336 px** y `patternList` va a
  **dos columnas de 419,5 px**. Es el reparto del marco E.

**Criterios que cierra, uno por uno**

- **95 ✅** Bajo «A qué hora», lo que dicen las semanas y su salida («Quitar el
  martes» / «Dejarlo»); bajo «Cuánto», «Suele llevarte 30 min justos. Esta
  duración va bien.» **y esa línea aparece también sin nada que proponer** —hay
  test puro sobre `buildTemplateSheetAdvice` y test de la hoja que además
  comprueba que entonces **no hay ni un botón nuevo**—. Visto en el navegador.
- **96 ✅** El día marcado lleva su clase y su `aria-label` («martes · el día
  del que habla el aviso») y sigue `aria-pressed="true"`, **sin tocar nada**. El
  test compara **el cuerpo de la mutación con patrón contra el cuerpo sin
  patrón**: son idénticos (`toEqual`), y solo al pulsar «Quitar el martes» el
  cuerpo pasa a `days: ['monday','wednesday']`. Y pulsarla **no manda ninguna
  mutación**: escribe en la hoja.
- **97 ✅** Sin patrón, `buildTemplateSheetAdvice` devuelve `null` y la hoja no
  pinta «De tus últimas semanas», ni «Suele llevarte», ni «Sueles empezar», ni
  un hueco reservado (las dos líneas van dentro de su `.field`, que es un flex
  en columna: sin hijo no hay espacio). Dos tests.
- **98 ✅** En escritorio, adherencia arriba, **patrones en rejilla** (dos
  columnas medidas en el navegador) y **lateral** con los tres paneles. En móvil
  no hay lateral. Test con `matchMedia` en las dos direcciones.
- **99 ✅** «Sin contestar» lista **solo `liveSuggestions`**, cada una con **las
  mismas dos salidas** que su tarjeta (test: con la tarjeta y el lateral hay
  **dos** «Ponerlo en 1h 10» y **dos** «Dejarlo»), y dice que no caduca ninguna
  y que no cambian nada solas. «Contestadas» dice qué se contestó y **la fecha
  de vuelta desde el momento en que se contesta** (test: al pulsar «Dejarlo»
  aparece «Vuelve el 17 de octubre si el patrón sigue igual» y la pregunta
  desaparece de «Sin contestar»); lo aplicado dice **qué cambió y cuándo**
  (««Ponerlo en 1h 10», hecho el 19 de septiembre…», test propio); y la
  contestada **en el puente** se pinta mirando `source`, con `answer: null`, y
  dice dónde se contestó.
- **100 ✅** El panel dice las cuatro cosas: plan y registro de las **últimas 6
  semanas** con las consultas que ya existen, **calculado en este dispositivo
  cada vez que abres**, lo único que se guarda es **tu respuesta**, y **nada
  cambia solo**. Y dice —antes de que sorprenda— que esa respuesta **vive en
  este navegador y en otro no está**. Está en escritorio **y en móvil**.
- **101 ✅** El diff no toca `graphql/`, `api/` ni `routes/`; ninguna clave de
  `localStorage` nueva y ninguna de caché nueva.
- **103 ✅** Tabla de arriba, con el test que afirma la parte medible.
- **104 ✅** Tabla de la línea base.

**Pendiente de prueba manual, del usuario** — y esto es también lo que cierra
la fase F6 y el módulo Vida entero:

1. **Criterio 105 (el criterio de la fase).** Con la API despierta y días
   suyos: abrir **Hoy** y comprobar que **al menos un aviso útil sale de datos
   propios y ninguno suena a bronca**.
2. **Criterio 106, el recorrido entero:**
   - «Lo que se repite» con sus semanas: que los números cuadren con lo que
     recuerda, y que las tarjetas hablen de actividades suyas.
   - Contestar una con la salida afirmativa → **la plantilla cambiada y ningún
     día ya armado movido**.
   - Contestar otra con «Dejarlo», **recargar**, y ver que no vuelve a
     preguntar y que dice **cuándo vuelve** (en móvil, en la tarjeta; en
     escritorio, además, en «Contestadas»).
   - **Lo nuevo de esta tajada:** abrir la **hoja de un ítem** en Plantilla y
     ver la línea bajo «A qué hora» y la de «Cuánto»; comprobar que **el día
     marcado no cambia nada** si guarda sin tocarlo; pulsar la salida
     afirmativa y ver que **solo cambia al pulsar Guardar**; y que una
     actividad sin datos abre **la hoja de siempre, sin una línea de más**.
   - **Escritorio:** abrir «Lo que se repite» en pantalla grande y ver la
     rejilla y el lateral con las tres cajas.
3. **375 px y oscuro dentro de `/app/*`**, en las tres pantallas. Es lo que
   **ningún agente puede ver nunca** en este repositorio: lo de arriba está
   medido en un arnés con los componentes y las hojas de estilo reales, no
   dentro de la aplicación con sesión.
4. **El cronómetro.** Abrir **Hoy** y **la primera hoja de Plantilla** en frío,
   la primera vez del día, contra Render dormido. Está medido **en consultas,
   no en segundos**: 36–42 peticiones en paralelo es lo único que no se puede
   cronometrar desde aquí. Si duele, las dos palancas están escritas y son de
   una línea (`canShowPatterns` en Hoy, el `enabled` de Plantilla).

**Riesgos — dónde mirar si algo se rompió**

1. **La hoja del ítem.** Es la pantalla más compartida del módulo (Plantilla,
   Actividades, Archivadas). Las tres props son aditivas y **solo Plantilla las
   pasa**, pero el camino de `applyAdvice` escribe en el mismo borrador que los
   campos: si algo guarda un cuerpo raro, es ahí.
2. **`VidaPlantillaPage` monta la ventana.** Al abrir la primera hoja se
   disparan hasta 42 consultas **mientras la hoja se está abriendo**. El primer
   pintado de la hoja no las espera —el patrón llega después y la línea aparece
   sola—, pero es una pantalla entregada que antes no pedía nada ahí.
3. **`VidaPatternsSection` ahora mira `matchMedia`.** Si un test o un navegador
   viejo no lo tiene, `useMediaQuery` decide «móvil» y el lateral no sale. Es el
   mismo riesgo que ya tenía la sección «Un día».
4. **Lo aplicado en «Contestadas» es de la visita, no del aparato.** Si se
   recarga, esa línea desaparece —no porque se esconda, sino porque el cambio
   ya está en la plantilla y el patrón dejó de proponer nada—. Es la lectura más
   conservadora; la otra sería un campo nuevo en el store.
5. **`VidaPatternCard` ya no pinta `settledLabel` con `mutedReason`.** Es el
   arreglo del hallazgo 3, pero cambia lo que ve una tarjeta desactivada que va
   clavada: ahora dice una sola cosa.
6. **`data-kind="hint"` en `VidaBlockHint`.** Si alguien cambia el selector de
   `VidaHoyPage.module.scss` sin mirar, el aviso vuelve a perder su fondo.

**Deuda que queda de FEAT-007 entera** (para cerrar la fase):

- **La consulta de rango de planes en el backend** (`activityDayPlansInDates`):
  convertiría 42 consultas en 1 en las **tres** pantallas. Fuera de alcance por
  el criterio 101; es la salida natural si la medida duele.
- **El criterio 18 de FEAT-003 está derogado en parte por el 91**: el filtro
  del hueco usa la duración **habitual**, no la de la plantilla. Nadie lo ha
  escrito en el dossier de FEAT-003.
- **Una ficha sin duración en la plantilla pero con cuatro registros** sigue sin
  ofrecerse con su duración habitual (lo decide el usuario; cambiaría el
  criterio 19 de FEAT-003).
- **Los dos desfases del puente** y **el umbral del día suelto** (30 min, 2
  muestras), los dos abiertos desde la tajada 2.
- **Si la ventana falla, en Hoy no se dice nada**, y **el aviso de Hoy repite el
  nombre entero**: los dos con su arreglo propuesto arriba.
- **`PAST_STALE_TIME` infinito** y **las respuestas que no viajan entre
  navegadores** (deuda del aparato, criterio 63 de FEAT-006): las dos están
  dichas en pantalla, no escondidas.
- **El troceado del chunk inicial** (1.092,02 kB) y **`Button variant="danger"`
  ilegible en oscuro**: heredadas, del sistema de diseño.

**Además, para quien venga detrás** (no se tocó, es alcance de otro):

- **No arranqué ningún servidor.** El arnés se sirvió desde el **5173 del
  usuario**; la pestaña abierta es
  `preview-local_e4cefb6f-76b2-4e58-b5c2-1431d439087a` y no levanta nada. El
  5174 sigue apagado.
- **`ENVIRONMENT.md` vuelve a quedarse corto**: hoy son **1570 tests** y
  **1.092,02 kB**. **No lo he tocado** —es la regla—.

**Estado del árbol:** sin commitear.

## 4. Revisión — feature-reviewer

### Tajada 1 — La sección existe y cuenta tu adherencia

**Veredicto: `accepted`** — los diez criterios de la tajada (64–73) y los cuatro
transversales (101–104) se cumplen con evidencia que he vuelto a correr yo, y no
he encontrado ninguna regresión en «Un día», «La semana» ni el puente. Las tres
desviaciones que el constructor declara quedan **verificadas y bien resueltas**.
Lo que queda pendiente es lo que ningún agente puede cerrar (105, 106 y el 72
dentro de `/app/*`), más cinco hallazgos que **no** devuelven la tajada.

**Criterios, uno por uno** (contra la sección 1, no contra el resumen)

| # | Estado | Evidencia que he comprobado yo |
|---|---|---|
| 64 | **cumplido** | `VidaRevisionPage.tsx:~470` monta `@/shared/ui/Tabs` con `['Un día','La semana','Lo que se repite']`; el estado es `useState<ReviewView>` local. `git diff --stat` **solo toca 7 archivos**: ni `vida-paths.ts`, ni `vida.routes.tsx`, ni `app-nav.config.ts`. El test «la pantalla tiene tres secciones…» afirma `new Set(askedDates) === {'2026-09-18'}` antes y después de cambiar de sección: la URL no se mueve y el día no se recarga. |
| 65 | **cumplido** | `headlineFor` + el bloque de tendencia en `vida-adherence.utils.ts:361-366`: la coletilla exige `computableWeeks >= 3` **y** `risingRun >= 3`, y `risingRun` corta en `current <= previous` (serie plana **también** calla). No hay ninguna rama que diga que baja. Máximo dos frases por construcción (`headline` es un array al que solo se empuja una vez). |
| 66 | **cumplido** | `dataNote` se compone en las **dos** ramas (`:292-295`) y `VidaAdherenceSummary` lo pinta siempre, también en la de espera. Con cero semanas dice «Todavía no hay ninguna semana con 3 días planeados o más» y **mantiene** la explicación del viaje. |
| 67 | **cumplido** | `AdherenceWeek` lleva `fractionLabel` y `percentLabel` y el componente los pinta **en la misma caja** (`.figures`). El test barre `container.querySelectorAll('*')`: 2 nodos con «%», los 2 con una fracción en su `parentElement`. La barra es `aria-hidden` y el ancho va por `style`, no por texto. |
| 68 | **cumplido** | `computableBuckets` filtra `plannedDays >= 3 && planned > 0` **antes** de las medias, y `buildAdherence` solo suma filas con `row.status === 'closed'`, que es la regla de `buildWeekLine`: por eso «la semana en curso cuenta hasta hoy» es cierto por construcción y no una promesa de copy. La leyenda solo aparece si `hasCurrent`. |
| 69 | **cumplido** | `weekdays` recorre los siete `VIDA_DAY_ORDER`; `hasEnough = weeksWithPlan >= 3`; por debajo, `fractionLabel = null` y `waitingLabel = 'N sem'`. **Nunca se compone «0/0»**: con `weeksWithPlan === 0` el label es «0 sem» (test: `container.textContent` no contiene `0/0`). El pie explica el umbral **siempre** (`buildWeekdayNote` nunca devuelve `[]`: si no hay días cortos dice «Cada casilla habla desde 3 semanas con plan»). |
| 70 | **cumplido, y es la desviación que mejor sale** | Ver abajo. |
| 71 | **cumplido** | Rama `!hasAdherence` (`:297-333`): no hay `weeks`, no hay `weekdays`, y sí dos filas de espera con `thresholdLabel` + `missingLabel`. `missingWeeks()` nombra semanas **con fecha real** (`formatWeekSpan`) saltándose las que ya cuentan. El test afirma «A partir de 2 semanas completas · te falta 1, la del 14 al 20 de septiembre» y que `container.textContent` **no contiene ni un «%»**. |
| 72 | **cumplido en lo que aplica; el resto, prueba manual** | Cargando: `nothingYet` solo cuando **todos** los días están en vuelo → esqueletos, y el test afirma que no hay «De cada 10 bloques». Error: «Falta algún día de estas semanas» + «Reintentar» (`history.refetch`, que repite **solo lo caído**), y el test afirma que el texto **no** dice «no tienes datos» y que lo que sí llegó se sigue contando. 375 px y oscuro: los tres `.module.scss` nuevos usan **solo tokens** (`--color-text`, `--color-text-secondary`, `--color-primary`, `--color-glass-border`), `min-width: 0` en toda la cadena y `grid-template-columns: repeat(7, minmax(0,1fr))` con `overflow:hidden` + `text-overflow: ellipsis` en la casilla — no hay ni un ancho fijo que pueda desbordar. **La comprobación dentro de `/app/*` sigue pendiente del usuario** (límite estructural del repositorio). El trozo del nombre de 60 caracteres: ver abajo. |
| 73 | **cumplido** | Dos barridos, y los dos los he leído: el del DOM (nueve palabras sobre `container.textContent`, incluida `\bmal\b`) y el de los fuentes (`vida-vocabulary.test.ts` usa `import.meta.glob('./**/*.{ts,tsx}')`, así que **los archivos nuevos entran solos**, sin lista que mantener). Las cinco reglas nuevas son correctas y la frontera de palabra en «mal» está bien puesta. |
| 101 | **cumplido** | `git diff --stat` + los untracked: **ni un archivo** bajo `graphql/`, `api/`, `store/` ni `routes/`. Ninguna clave de `localStorage` nueva. |
| 102 | **cumplido** | `useVidaHistoryWindow` usa `vidaKeys.dayPlan.byDate(date)` y, vía `useActivityFollowUpsInDatesQuery`, `vidaKeys.followUps.range(from,to)`. Las dos existían. |
| 103 | **cumplido, y verificado por mí** | Ver abajo. |
| 104 | **cumplido, línea base corrida entera por mí** | Ver abajo. |
| 105, 106 | **pendientes del usuario** | Con la API despierta y sus semanas de verdad. No los aprueba nadie desde aquí. |

**Las tres desviaciones conscientes, juzgadas**

1. **«`buildWeekReview` no se imita, se usa» — es verdad y no arrastra nada.**
   `buildAdherence` (`vida-adherence.utils.ts:248`) llama a `buildWeekReview` con
   los días de la ventana y **solo suma**: `row.followedCount` y
   `row.plannedCount`, que salen de `collectDayClosing` (`vida-week-review.utils.ts:185,233`).
   Busqué aritmética paralela en el archivo nuevo y **no hay ninguna**: ni un
   recuento de `followUps`, ni un `planItems.length` usado como «planeado». El
   único filtro propio es `row.status === 'closed'`, que es la misma regla que
   `buildWeekReview` aplica en su propio resumen (`:292`), no una segunda
   definición. Lo que sí arrastra, y es correcto que lo haga, es el trato de
   `isPending`/`isError`: `buildWeekReview` ya los devuelve como filas `pending`
   y `error` con cifras a cero, y el filtro `closed` las descarta antes de sumar
   — un día caído **no** se cuenta como cero seguidos. Criterio 70: cierto por
   construcción, sin efecto colateral.

2. **La frase que nombra el día que menos se parece: la omisión está bien
   resuelta, y no deja hueco mudo.** Abrí el render (`docs/vida/assets/08-vida-entiende.html:333`):
   dice «Los **miércoles** son los que más se parecen a tu plan; **los martes,
   los que menos**. De **sábado y domingo** hay 2 semanas con plan: a partir de 3
   se puede hablar de ellos, y mientras tanto se dice así.» Lo que se ha quitado
   es **exactamente** la oración subordinada «los martes, los que menos», y nada
   más: el resto del pie está literal en `buildWeekdayNote`. El pie **nunca queda
   vacío** —lo comprobé sobre las tres ramas de la función: o dice el día que más
   destaca, o dice qué días esperan y desde cuándo, o dice «Cada casilla habla
   desde 3 semanas con plan»—, y el dato que la frase borrada daba **sigue a la
   vista**: la casilla de cada día lleva su fracción y su `sr-only` con el número
   entero. Es decir, el usuario puede ver que el martes va flojo; lo que la
   pantalla no hace es **señalárselo**. Eso es justamente la regla dura del
   módulo, y el criterio 73 la manda por encima del render. Aprobado. Queda como
   **hallazgo para el usuario**, que es quien aprobó ese render: si la quiere
   tal cual, es una línea en `buildWeekdayNote`.

3. **El nombre de 60 caracteres del criterio 72 no aplica: confirmado.** Recorrí
   los tres componentes nuevos y el tipo `VidaAdherence` entero: lo único que se
   pinta son letras de día, meses de tres letras, rangos de números, fracciones,
   porcentajes y frases fijas. **No hay un solo campo de texto libre del usuario
   en toda la superficie de la tajada** — `AdherenceWeek`, `AdherenceWeekday` y
   `AdherenceWaitingRow` no tienen ningún `name` ni `title` que venga de una
   actividad (`row.title` de la espera es literal: «Adherencia semana a semana»).
   El trozo del criterio llega con las tarjetas de la tajada 2, y ahí habrá que
   cobrárselo.

**El coste (criterio 103): comprobado de verdad, y por dos vías**

El número que importaba era el «0 mientras la sección está cerrada», y está
sujetado por los dos extremos, no por uno:

- **Por montaje** (`VidaRevisionPage.test.tsx`): `VidaPatternsSection` solo se
  instancia dentro de la rama `isPatterns`, así que con «Un día» o «La semana»
  abiertas el hook **ni siquiera existe**. El test lo afirma con un espía sobre
  el módulo: `expect(historyMounts).toHaveLength(0)` en el primer pintado **y**
  después de abrir «La semana»; solo al pulsar la tercera pestaña pasa a
  `{ enabled: true, today: '2026-09-19' }`. Esto es más fuerte que un `enabled:
  false`: no hay observador, no hay caché tocada, no hay nada.
- **Por consulta** (`useVidaHistoryWindow.test.tsx`, con `useQueries` de verdad y
  espías sobre la API): con `enabled: false`, `getActivityDayPlan` y
  `getActivityFollowUpsInDates` **no se llaman ni una vez** —y el hook devuelve
  `isPending: false`, así que una sección cerrada tampoco se queda girando—.
  En frío un domingo, **42 + 1 = 43**, con el rango exacto `('2026-08-10',
  '2026-09-20')`. Un lunes, 36 + 1. Llegando desde Revisión con 20 días
  sembrados, **22**. Desmontar y volver a montar contra el mismo `QueryClient`:
  `toHaveBeenCalledTimes(42)` sigue siendo 42, es decir **0 planes nuevos**.
  El `enabled` del rango de sesiones lo apaga el propio hook pasando `''`
  (`useActivityFollowUps.ts:39`: `guard && Boolean(from) && Boolean(to)`).

Las cifras del reporte son las que miden los tests. **Contra el API real no está
medido y así queda dicho**: 42 consultas en paralelo contra Render dormido es lo
que el criterio 105 deja al usuario.

**`shiftYmd`: una sola exportación, y las copias de la tajada retiradas**

`grep -rn "shiftYmd" src/` sobre el árbol actual: la **única** definición de los
archivos tocados es `vida-date.utils.ts:142`. `vida-window.utils.ts` la importa
(su copia privada de la línea 39 está borrada en el diff) y `VidaRevisionPage.tsx`
también. Queda la tercera en `VidaSemanaPage.tsx:39`, **que no era de esta
tajada** y no se ha tocado: correcto, esa pantalla está entregada. Las tres
implementaciones son idénticas (`parseYmdToLocalDate` + `setDate` +
`formatDateToYmd`), así que la delegación no cambia ningún resultado, y el test
nuevo de `vida-date.utils.test.ts` cubre el cambio de hora.

**Lo que se rompió cerca: cómo busqué**

Revisión es de hace dos días y esta tajada le cambia la página entera, así que
empecé por donde el constructor dijo que mirase:

- **`graphify explain "VidaRevisionPage"`** (grado 18): hacia fuera llama a sus
  nueve hooks y a sus tres funciones locales; **hacia dentro solo la contiene su
  propio archivo**. Nadie importa la página salvo el router, así que el radio de
  la refactorización es la propia pantalla. (El grafo es de antes del cambio,
  que para «quién dependía de esto» es justo lo que hace falta.)
- **Las siete ramas de retorno, leídas una a una en el diff.** El envoltorio en
  `sections(...)` es **re-indentación pura**: comparé el contenido de cada rama
  antes y después y no cambia ni un literal, ni una condición, ni un `prop`. El
  puente (`VidaReviewBridgeSection`) sigue **exactamente donde estaba**, dentro
  de la rama de semana y detrás de `isWeekPending`, así que su coste diferido
  (A5 de FEAT-006) no se ha movido. La rama **sin sesión** (`isDisabled`) se
  queda fuera del control, y está bien razonado: tres puertas cerradas.
- **`git diff --numstat` del test de la página: 242 añadidas, 3 borradas.** Las
  tres son el `click` del helper `openWeek`, el `click` de «Volver al día» y el
  título de un `it`. **Ninguna afirmación de FEAT-006 se ha relajado ni
  borrado**, que era el riesgo real de una refactorización así.
- **Los dos botones que desaparecen:** `grep -rn "Ver por semana\|Volver al día"`
  sobre `src/` y `docs/`. En `src/` no queda ninguna referencia viva salvo la de
  `VidaPlantillaPage.tsx:332`, que es **otro** «Volver al día» (el de la
  cuadrícula de la plantilla, FEAT-005 criterio 48) y **no se ha tocado**.
- **La suite entera**, corrida por mí: 107 archivos pasan, incluidos los 60+
  casos de `VidaRevisionPage.test.tsx`, los de `VidaSemanaPage`, los de
  `VidaHoyPage` y `vida-window.utils.test.ts` (que es quien paga el cambio de
  `shiftYmd`).

**No he encontrado ninguna regresión funcional.** Lo único que se pierde es la
**etiqueta** «Ver por semana», y va como hallazgo, no como devolución: el
criterio 45 de FEAT-006 pide «pasar a la semana y volver, sin salir de la
píldora y sin ruta nueva», y eso se sigue cumpliendo —mejor, con `role="tablist"`
y flechas— pero el guion de prueba manual de aquel dossier
(`FEAT-006-vida-revision.md:1848`) nombra el botón por su texto y ya no lo
encontrará.

**Estados que nadie construye**

| Estado | Cómo queda |
|---|---|
| **Sin datos** | Construido, y es lo mejor de la tajada: la espera con fechas reales en vez de barras a cero. Con cero semanas computables, `dataNote` cambia de forma y sigue explicando el filtro. |
| **Cargando** | Construido. Esqueletos solo si **nada** ha llegado; con parte de los días dentro se pinta lo que hay en vez de bloquear la sección tras 43 respuestas. Buena decisión. |
| **Error** | Construido, y distingue «falló una consulta» de «no tienes datos», que es literalmente lo que pedía el criterio 72. «Reintentar» repite solo lo caído. |
| **Sin permisos** | No aplica: toda la ruta vive tras `/app/*` y la rama `isDisabled` (sin sesión) no ofrece el control. |
| **Texto largo** | **No aplica en esta tajada** — no se pinta ningún texto del usuario. Se cobra en la tajada 2. |
| **Móvil 375 px** | Verificado por código (tokens, `min-width:0`, `minmax(0,1fr)`, elipsis en la casilla) y por el arnés del constructor. **Dentro de `/app/*` lo cierra el usuario.** |
| **Oscuro** | Igual: ni un color literal en los tres `.scss` nuevos. **Lo cierra el usuario.** |

**¿Duplica algo que ya existía?** (contra la sección 2)

No. Lo comprobé sobre «lo que NO hay que crear» del plan: las pestañas son
`@/shared/ui/Tabs`, no unas escritas a mano; el derivado del día es
`buildWeekReview`, no un bucle nuevo; las claves de caché son las dos que ya
existían; y `VIDA_HISTORY_WEEKS` se deja en el hook **para que la tajada 2 lo
importe en vez de escribir un segundo número** — la desviación del punto 4 del
constructor es correcta y evita justo la duplicación que el arquitecto temía. El
único archivo con lógica de fechas que se ha movido, `shiftYmd`, se ha movido
**hacia** la única definición, no hacia una más.

**Línea base, corrida entera por mí** (no la del constructor)

| Qué | `ENVIRONMENT.md` | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos (`Tabs.tsx` ×4, `toast.context` , `render.tsx`, …) |
| `pnpm test` | 2 de 1439 | 2 de 1479 | **2 fallidos de 1479**, 107 archivos en verde; los dos son `SearchSelect` |
| `pnpm build` | 1.054,0 kB | 1.065,81 kB | **exit 0**, `index` **1.065,85 kB**, `app-icons` **620,20 kB sin tocar**, `IconPicker` 4,64 kB |

Nadie la ha empeorado. Los 40 gramos de diferencia con el número del constructor
(1.065,85 frente a 1.065,81) son ruido de compilación, no un cambio.

**Hallazgos — se anotan, no devuelven la tajada**

1. **La frase del día flojo del render no está.** Decisión de producto correcta,
   pero **el render lo aprobó el usuario**: que lo sepa y decida.
2. **La etiqueta «Ver por semana» desapareció** y el guion manual de FEAT-006 la
   nombra. Conviene tocar ese guion cuando alguien pase por ahí.
3. **`HEREDADOS` en `vida-vocabulary.test.ts` exime a cuatro archivos de *todas*
   las palabras prohibidas**, y ahora también de las cinco nuevas. La lista se
   escribió para «cancelar»/«eliminar» del catálogo; con las de FEAT-007 dentro,
   esos cuatro archivos podrían decir «racha» o «cumplimiento» sin que nadie se
   entere. No es de esta tajada, pero el filtro debería ser por palabra.
4. **`ENVIRONMENT.md` tiene la línea base vieja** (2 de **1439**, chunk
   **1.054,0 kB**, fecha 2026-09-19). Hoy son 1479 tests y 1.065,85 kB. **No lo
   he tocado** —es la regla—, pero alguien tendría que actualizarlo o el próximo
   agente comparará contra un mapa viejo.
5. **Hay un servidor de desarrollo del constructor vivo en el 5174**, que él dijo
   no poder parar. Yo tampoco arranco ni paro nada: queda dicho para el usuario.
   Recordatorio de `ENVIRONMENT.md`: el 5174 abre la app pero la API responde
   CORS, así que no sirve para probar nada real.

**Lo que no he podido revisar**, y lo digo en vez de aprobarlo por simpatía: el
recorrido real dentro de `/app/vida/revision` con datos del usuario —los
criterios **105** y **106**, y el trozo de **375 px y oscuro dentro de `/app/*`**
del **72**—. Es el límite estructural del repositorio (los agentes no entran con
credenciales), no un descuido de esta revisión.


### Tajada 2 — Los patrones por actividad, con sus dos salidas

**Veredicto: `returned`** — no por lo que el constructor midió, que está bien
medido y lo he vuelto a correr entero, sino por **una tarjeta que afirma algo
que no es verdad**: una actividad planeada cuatro veces o más y **nunca
registrada** pinta la línea «**Esto pasa como lo planeaste. Aquí no hay nada que
proponer.**» justo debajo de «**se siguió 0 de 5 veces**», y sin las dos líneas
que el criterio 74 exige en todas las tarjetas. Es el caso más común que le
queda a este módulo —planear algo y no llegar a registrarlo— y es literalmente
lo que el analista pidió evitar: decirlo en vez de fingir. Con eso, **74 y 77 no
se cumplen tal como están escritos**. Todo lo demás (75, 76, 78–86, 101, 104)
sí, con evidencia propia.

**Lo que devuelve la tajada, comprobado por mí**

`buildActivityPatterns` con cinco días planeados y **cero sesiones** (probado
con un test temporal sobre el `utils`, borrado después):

| Campo | Valor |
|---|---|
| `followedLabel` | `se siguió 0 de 5 veces` |
| `startLine` | **`null`** |
| `durationLine` | **`null`** |
| `weekdayCells` | los siete, `·` |
| `suggestion` | `null` |
| `settledLabel` | **`Esto pasa como lo planeaste. Aquí no hay nada que proponer.`** |

El camino es `buildPattern` (`vida-patterns.utils.ts:629`):

```ts
const isSettled =
  !suggestion &&
  Math.abs(startOffset ?? 0) < PATTERN_TOLERANCE_MINUTES &&
  Math.abs(durationOffset ?? 0) < PATTERN_TOLERANCE_MINUTES
```

**`startOffset` y `durationOffset` son `null` cuando no hay ni una sesión**, y
el `?? 0` los convierte en «desfase cero», es decir, en «esto va clavado». No
hay ninguna prueba que cubra ese caso: los 21 casos del `utils` y los 9 de la
página siempre tienen sesiones.

- **Criterio 74 — no cumplido.** «Todas dicen lo mismo en el mismo orden […] la
  línea **Sueles empezar** y la línea **Suele llevarte** con su etiqueta de
  desfase». Esta tarjeta no tiene ninguna de las dos.
- **Criterio 77 — no cumplido como está escrito.** La frase está reservada a
  «una actividad **cuyo patrón está dentro de tolerancia**». Aquí no hay patrón
  del que hablar: hay un plan y ningún dato. La frase no es un reproche —eso se
  respeta— pero **es falsa**, que es la otra mitad de la regla del módulo («lo
  dice en vez de fingir un número», sección 1).

**Cómo se arregla, sin rediseñar nada** (es del constructor, no mío): distinguir
«sin desfase» de «sin dato» —los dos `?? 0` de `isSettled`— y dar a esa tarjeta
su propio final, del tipo «De estas 5 veces no hay ninguna registrada: todavía
no se puede decir cómo te sale». Y un caso en el test del `utils` y otro en el
de la página, que es lo que faltaba para cazarlo.

**Criterios, uno por uno** (contra la sección 1, no contra el resumen)

| # | Estado | Evidencia que he comprobado yo |
|---|---|---|
| 74 | **NO cumplido** | En el caso normal la tarjeta lleva cabecera, las dos líneas, la mini-fila L M X J V S D y el pie en fracción, y el test de la página lo afirma con texto literal. **Falla en la tarjeta sin sesiones** (arriba). |
| 75 | **cumplido** | `occurrences.length < PATTERN_MIN_OCCURRENCES` → `waiting` con «llevas 2 de 4»; nunca una media. Test puro (`:157`) y de la página («llevas 2 de 4» y `queryByText('1h 10')` en cero). |
| 76 | **cumplido** | `weekdayCells`: sin dato → `offsetLabel: '·'`. El `0` solo aparece con dato y desfase real de cero. Test `:133`. |
| 77 | **NO cumplido como está escrito** | La frase sale también sin datos (arriba). Con patrón dentro de tolerancia sí es correcta y **no pinta ni un botón** (`queryByRole('button')` en cero). |
| 78 | **cumplido** | Las tres formas llevan el número dentro (`Ponerlo en 1h 10`, `Moverlo a las 19:30`, `Quitar el martes`) y la segunda es «Dejarlo». `VidaPatternCard` pinta las dos salidas **en el mismo bloque**: no hay forma de que salga una sola. `variant` `primary` + `secondary`, ninguna `danger`. |
| 79 | **cumplido, y es lo que más he mirado** | `applySuggestion` (`VidaRevisionPage.tsx:1147`) hace `updateItem.mutate({ id: suggestion.itemId, ...suggestion.templatePatch })` y nada más. Test: `updateVidaItem` **1 llamada**, `{ id: 'i9', durationMinutes: 70 }` exacto, `planMutationsCalled() === 0` —los espías de las **cuatro** mutaciones del plan están puestos en todo el archivo desde FEAT-006 (`:50-57`)— y `createFollowUp` sin llamadas. Espiado, no leído del texto. |
| 80 | **cumplido** | `consequenceFor()` nombra cuántos días y cuáles («En tu plantilla está 3 días (L X V): se cambia en todos. Los días que ya tienes armados se quedan como están.»), y el componente la pinta **antes** de los botones. |
| 81 | **cumplido** | `templatePatch: { days: remaining }`; **no existe `vidaItemDelete` en el archivo ni en la página**. Con `remaining.length < 2` no se ofrece (test `:256`). |
| 82 | **cumplido** | Verificado con mi propio test: sembrando un `xavi.vida.deviceNotes` de FEAT-006 y contestando, `Object.keys(localStorage)` sigue siendo **una** clave. «Dejarlo» no llama a `updateVidaItem` ni a ninguna del plan. |
| 83 | **cumplido** | Las tres ramas están probadas con reloj inyectado (`:356`, `:360`, `:366`, `:373`) y la regla vive **en una sola función pura**, aplicada **una vez** en `useVidaPatterns`. Vuelta a los 28 días exactos (`suggestionReturnDate`). **Sobrevive a recargar**: la respuesta va a `localStorage` con su fecha y su número, y el test del hook lo comprueba montando el hook **de nuevo** contra el store ya escrito. La fecha se ve desde que se contesta («Lo dejaste el 21 de septiembre. Vuelve el 19 de octubre si el patrón sigue igual.»). |
| 84 | **cumplido** | Con una sola semana computable, «Lo que ya se sabe» con la tarjeta entera **y sus dos salidas** va **antes** de «Lo que llega después» (el test compara índices sobre el texto), y la última línea sigue siendo «sale de los días que vives». |
| 85 | **cumplido** | `mutedReasonFor()`: ítem desactivado o actividad `cancelled` → `suggestion: null` y una línea que dice por qué. La tarjeta sigue con su dato. Dos tests puros. |
| 86 | **cumplido en lo que se puede aquí** | Cargando (esqueletos, ninguna cifra a cero) y error con «Reintentar» que no dice «no tienes datos», ahora contando también `itemsQuery`. Nombre de 60 caracteres: test de la página + `VidaPatternCard.module.scss` con `overflow-wrap: anywhere` y `min-width: 0` en toda la cadena; el único `white-space: nowrap` está en la casilla de la mini-fila («+70»), con `text-overflow: ellipsis`. 375 px: `grid-template-columns: repeat(7, minmax(0,1fr))`, ni un ancho fijo. Oscuro: **ni un color literal** en las 231 líneas de `.scss` —solo `--color-text`, `--color-text-secondary`, `--color-primary` y `color-mix`—. **Dentro de `/app/*` lo cierra el usuario.** |
| 101 | **cumplido** | Diff + untracked: **ni un archivo** bajo `graphql/`, `api/` ni `routes/`. `patternAnswers` es un campo más en `xavi.vida.deviceNotes`; **`localStorage.length` no sube** (comprobado con estado viejo sembrado). |
| 104 | **cumplido, línea base corrida entera por mí** | Ver abajo. |
| 105, 106 | **pendientes del usuario** | Con la API despierta y sus semanas. Nadie los cierra desde aquí. |

**Línea base, corrida entera por mí** (no la del constructor)

| Qué | `ENVIRONMENT.md` | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1479 | 2 de 1513 | **2 fallidos de 1513**, 109 archivos de 110 en verde; los dos son `SearchSelect`, preexistentes |
| `pnpm build` | 1.065,85 kB | 1.079,47 kB | **exit 0**, `index` **1.079,47 kB**, `app-icons` **620,20 kB sin tocar**, `IconPicker` 4,64 kB |

**El crecimiento de +13,62 kB está justificado**: son 825 líneas de derivado
puro, 228 de hook y 144+231 de la tarjeta y su hoja de estilos, todo código
propio y **ninguno de iconos** (`app-icons` no se mueve ni un byte). Es el mismo
orden que la tajada 1 (+11,8 kB por 3 componentes y 2 archivos). Lo que sigue
siendo deuda es que todo eso caiga en el chunk inicial, y eso viene de
FEAT-003/005 y está declarado fuera de alcance.

**Lo que se rompió cerca: cómo busqué**

El constructor apuntó al puente de FEAT-006 y al store. Fui por ahí, y por lo
que cuelga de ellos:

- **`graphify explain "vida-device-notes.store"`**: el grafo es de antes del
  cambio, que para «quién dependía de esto» es justo lo que hace falta; devuelve
  poco más que su propio test, así que crucé con `grep -rn "patternAnswers\|
  getStartTimeAnswerFor" src/`: los consumidores del campo nuevo son **tres**
  (`useVidaPatterns.ts`, `VidaRevisionPage.tsx:1096` y los tests). Nada más del
  módulo lee el store entero.
- **`buildTemplateBridge` no se tocó**, confirmado por el diff: `git diff
  --stat` toca **5 archivos de `src/`** y `vida-week-review.utils.ts` **no está
  entre ellos**. La regla del puente (criterios 55 y 56) es byte a byte la de
  hace dos días.
- **Criterios 54–59 de FEAT-006, leídos literales en su dossier y contrastados
  con el código.** 54 (como mucho un aviso), 55 (la regla mínima), 56 (mediana
  de lo real), 57 (`vidaItemUpdate` y nunca el plan), 59 (sin base no se pinta):
  intactos, nada de eso pasa por el código nuevo. El **58** es el único que
  cambia de contorno: el puente ahora tampoco se pinta si la sugerencia de hora
  de ese ítem ya se contestó en «Lo que se repite» (`VidaRevisionPage.tsx:1096`,
  tres líneas). Es **lo que el criterio 83 manda** («en ninguna de las tres
  pantallas») y va en la dirección de callar, no de insistir: **no lo considero
  regresión**.
- **`git diff --numstat` del test de la página: 201 añadidas, 0 borradas.**
  Ninguna afirmación de FEAT-006 se ha relajado; los `describe` del puente
  (`:1070`) y de la semana siguen enteros y en verde.
- **La suite entera, corrida por mí**: 1.511 pasan, los 2 de siempre fallan.
  Incluye `VidaRevisionPage.test.tsx` completo (puente, semana, día), los de
  `VidaSemanaPage`, `VidaHoyPage` y `vida-device-notes.store.test.ts`.
- **El `deviceNotes` de un usuario que ya tiene datos de FEAT-006** (lo que
  preguntaba el encargo): lo sembré antes de importar el store —`blockNotes`,
  `dismissedNoData`, `dismissedBridges`, **sin `patternAnswers`**— y rehidrata
  sin romper: conserva los tres campos viejos, deja `patternAnswers` en `{}` y,
  al contestar, **guarda lo nuevo sin perder lo viejo y sin estrenar clave**. El
  merge superficial de `persist` hace lo que el plan decía; no hace falta
  migración.
- **«0 consultas con la sección cerrada»**: sigue sujeto por montaje —el test de
  la tajada 1 (`historyMounts` en cero con «Un día» y con «La semana») sigue en
  verde— y la consulta nueva de plantilla vive **dentro** de
  `VidaPatternsSection`, así que no se monta antes. La otra
  `useVidaItemsQuery()` de la página (`:1039`) es la del puente, `false`, y no
  se ha tocado. **El 43 → 44 del constructor es correcto** y la clave
  `items.list(true)` ya existía.

**Las tres desviaciones declaradas, juzgadas**

1. **El violeta en `--color-primary`: correcta.** Comprobé la hoja de la
   tarjeta entera: **ni un color literal**, solo tokens y `color-mix`. En el
   sistema de diseño no hay token semántico de violeta fuera de
   `[data-ds='aura']`, y meter un `#7C3AED` a pelo habría sido ilegible en
   oscuro —exactamente la deuda de `Button variant="danger"` que
   `ENVIRONMENT.md` avisa—. Queda como **hallazgo para el usuario**, que aprobó
   el render: si quiere el violeta del marco B, es un token nuevo en
   `_theme-variables.scss`, no un literal aquí.
2. **La lectura estricta del criterio 81: aceptable, pero deja una tarjeta
   muda.** Que un ítem de dos días con uno descolocado no proponga **nada** —ni
   quitar el día ni mover la hora— está bien razonado (la mediana de la hora la
   arrastra ese mismo día, y proponer un número arrastrado sería inventarlo).
   Pero entonces la tarjeta termina en el pie, sin pregunta y **sin la línea que
   diga por qué no la hay**: ni `settledLabel`, ni `mutedReason`. Son dos casos
   distintos —este y el de arriba— con la misma causa de fondo: **el final de la
   tarjeta no está cubierto para todos los caminos**. Va como hallazgo 1; el que
   devuelve la tajada es el de la frase falsa.
3. **El coste 43 → 44: verificado.** Una consulta más, `vidaKeys.items.list(true)`,
   clave existente, acierto de caché llegando de Plantilla o Actividades. Y las
   otras dos secciones siguen costando cero.

**Estados que nadie construye**

| Estado | Cómo queda |
|---|---|
| **Sin datos** | Dos agujeros. El de «planeada y nunca registrada» **devuelve la tajada**; el de «un día se sale y solo quedaría uno» deja la tarjeta sin frase de cierre. Lo demás (por debajo de 4 apariciones) sí está: lista compacta con «llevas 2 de 4». |
| **Cargando** | Construido y heredado de la tajada 1, ahora con `itemsQuery` dentro de la cuenta. Esqueletos solo si **nada** ha llegado. |
| **Error** | Construido: «Falta algún día de estas semanas» + «Reintentar», que ahora también reintenta la plantilla si fue ella la que cayó. No afirma «no tienes datos». |
| **Sin permisos** | No aplica: la rama sin sesión de la página no ofrece el control de secciones. |
| **Texto largo** | **Cobrado aquí**, que era lo que la tajada 1 no pudo: nombre de 60 caracteres, test de la página + `overflow-wrap: anywhere` con `min-width: 0` en toda la cadena. |
| **Móvil 375 px** | Verificado por código y por test; la rejilla de la mini-fila es `minmax(0,1fr)` y no hay anchos fijos. **El arnés del constructor ya no existe** (lo borró, correctamente), así que **yo no lo he visto pintado**: lo digo en vez de heredarlo. Dentro de `/app/*` lo cierra el usuario. |
| **Oscuro** | Igual: solo tokens, ni un literal. Lo cierra el usuario. |

**¿Duplica algo que ya existía?** (contra la sección 2)

No. La sugerencia **no** reescribe `VidaReviewBridge` —que era la tentación que
el plan prohibía—, sino que le copia el esqueleto en un componente hermano y
resuelve la coexistencia con dos condiciones de tres líneas. La cuenta de
«seguido» no se redefine: el pie usa el emparejamiento de
`matchSessionsToBlocks`, que es lo mismo que `collectDayClosing().followedCount`
(`vida-execution.utils.ts:1138`, `Object.keys(execution.byBlockId).length`).
`VIDA_PATTERN_WEEKS` **no se ha escrito**: se usa el `VIDA_HISTORY_WEEKS` de la
tajada 1, que es justo lo que el arquitecto quería evitar duplicar. Ni claves de
caché, ni de `localStorage`, ni documentos GraphQL.

**Hallazgos — se anotan, no devuelven la tajada**

1. **La tarjeta sin frase de cierre.** Cuando un día se sale y al quitarlo
   quedaría uno solo, la tarjeta enseña «Los martes · 9:40 · +70 min» y termina
   ahí. El propio encabezado del archivo dice «o hay pregunta con dos salidas, o
   se dice en voz alta que no hay nada que proponer»: este camino no hace
   ninguna de las dos. Se arregla junto con lo que devuelve la tajada.
2. **`useVidaPatterns` promete algo que no cumple para las tajadas 3 y 4.** Su
   cabecera dice «con `enabled: false` no pide nada», pero `useVidaItemsQuery(true)`
   **no pasa por `enabled`**: se monta siempre que el hook se monte. En Revisión
   da igual (el hook solo existe con la sección abierta), pero en Hoy y en la
   Plantilla, donde el plan manda montar la ventana **diferida**, esa consulta se
   dispararía en el primer pintado. Es una línea y es de la tajada 3, pero la
   frase de la cabecera hay que corregirla ya o alguien confiará en ella.
3. **La dirección puente → patrón no tiene test.** La condición de
   `VidaRevisionPage.tsx:1096` está escrita y es correcta de leer, pero **ningún
   test la ejecuta**: el cruce probado es el contrario (puente descartado →
   sugerencia callada). Es la mitad de «en las dos direcciones» que el
   constructor declara.
4. **Esa misma condición ignora la excepción de D1.** El puente se calla las
   cuatro semanas enteras aunque el desfase se mueva ≥10 min o cambie el día,
   casos en los que la sugerencia de «Lo que se repite» **sí** vuelve. Queda
   asimétrico: la pregunta vuelve en una pantalla y no en la otra.
5. **La misma pregunta se puede contestar en dos campos distintos**
   (`dismissedBridges` si se contesta en «La semana», `patternAnswers` si se
   contesta aquí). No se pregunta dos veces —cada lado lee los dos—, pero
   «Contestadas» (criterio 99, tajada 4) se construye **solo** con
   `patternAnswers`: un «Dejarlo como está» dado en el puente silenciará una
   sugerencia **sin aparecer en la lista de contestadas ni decir cuándo vuelve**.
   Hay que resolverlo en la tajada 4 o el criterio 99 no se podrá cumplir.
6. **El umbral del día suelto (30 min, 2 muestras) es del constructor**, como él
   mismo dice: no sale del render ni de ningún criterio. No lo devuelvo —es una
   constante y está exportada—, pero conviene que el usuario lo mire con datos
   suyos.
7. **`ENVIRONMENT.md` sigue con la línea base vieja** (2 de 1479, chunk
   1.065,85 kB, 2026-09-21). Con esta tajada son **1513 tests** y **1.079,47 kB**.
   **No lo he tocado** —es la regla—, pero ya va dos tajadas por detrás.
8. **El servidor del constructor de la tajada 1 sigue vivo en el 5174.** Yo no
   he arrancado ni parado nada, y **no he abierto el navegador en esta
   revisión**: lo que digo de 375 px y oscuro sale del código y de los tests.

**Lo que no he podido revisar**, y lo digo en vez de aprobarlo por simpatía: el
recorrido real dentro de `/app/vida/revision` —criterios **105** y **106**, y el
trozo de **375 px y oscuro dentro de `/app/*`** del **86**—, y la pantalla
pintada de verdad, porque el arnés del constructor ya no existe. Es el límite
estructural del repositorio (los agentes no entran con credenciales).

**Para el constructor, en orden:** (1) el final de la tarjeta sin sesiones —los
dos `?? 0` de `isSettled`— y su caso de test; (2) el final de la tarjeta del día
suelto; (3) la cabecera de `useVidaPatterns` y, si se quiere cerrar ya, el
`enabled` de la plantilla; (4) un test de la dirección puente → patrón. Nada de
esto toca el modelo de la sugerencia, que está bien donde está.

#### Tajada 2 · re-revisión tras la corrección

**Veredicto: `accepted`** — lo que devolvía la tajada está arreglado de raíz y
no de fachada: «sin dato» ya no es «sin desfase», los criterios **74 y 77**
vuelven a cumplirse, y el final de la tarjeta pasó de «cuatro caminos que casi
siempre dicen algo» a **una función total**. Los cinco hallazgos que dejé
abiertos están cerrados o escritos como decisión. Línea base corrida entera de
nuevo por mí y no peor. Lo pendiente sigue siendo lo de siempre: 105, 106 y la
pantalla dentro de `/app/*`.

**Lo que devolvía la tajada: comprobado por mí, no heredado**

Volví a correr mi propio probe sobre el `utils` (test temporal, borrado
después), el mismo escenario con el que devolví: cinco días planeados, **cero
sesiones**.

| Antes (devuelto) | Ahora |
|---|---|
| `startLine: null` · `durationLine: null` | `{ label: 'Sueles empezar', valueLabel: '—', offsetLabel: 'sin dato' }` y su gemela de duración |
| `settledLabel: 'Esto pasa como lo planeaste…'` | **`null`** |
| final de la tarjeta: esa frase falsa | `closingLabel: 'De estas 5 veces no hay ninguna registrada: sin dato no se puede decir cómo te sale.'` |

El arreglo es el bueno: **fuera los dos `?? 0`**, `hasAnyData` exigido, y cada
desfase tratado por separado (`startOffset === null || Math.abs(...) < …`), de
modo que una sesión abierta —hora sí, duración no— **sigue pudiendo confirmar
la hora** sin que la duración inexistente cuente como cero. Eso último tiene su
propio test y me parece el detalle que demuestra que se entendió el fondo y no
solo el síntoma.

- **Criterio 74 — cumplido.** Las dos líneas están en **todas** las tarjetas.
  Verificado en el `utils` con mi probe y en el DOM con el test de la página
  (`getAllByText('sin dato').length === 2`).
- **Criterio 77 — cumplido.** La frase queda reservada a un patrón con datos y
  dentro de tolerancia; con cero sesiones el texto renderizado **no la
  contiene** (aserción explícita) y no hay ni un botón.
- **La frase nueva no afirma lo que no sabe y no reprocha.** Dice «no hay
  ninguna **registrada**» —que es cierto: lo que falta son sesiones, no
  necesariamente la vida— y no «no lo hiciste». «Sin dato» es la palabra que el
  módulo ya usa para el pasado que no se sabe (`VidaAgendaNoData`,
  `VidaReviewWeek`), así que tampoco estrena vocabulario. Pasa el barrido de las
  nueve palabras en el test de la página. **Aprobado también por el fondo**, que
  era lo delicado: es una tarjeta que le dice al usuario que cinco veces no
  registró nada, y lo dice sin apuntar con el dedo.

**`closingLabel`: busqué la sexta rama y no la hay**

El test del constructor recorre cinco caminos. Yo probé **ocho combinaciones
más raras** con un probe propio, y en todas hay final y las dos líneas:
sin sesiones + desactivada, sin sesiones + archivada, sin sesiones + ítem sin
hora, ítem sin hora con desfase de hora, el martes suelto con plantilla de dos
días (mi hallazgo 1), una duración que redondea a lo que ya hay, un ítem de un
solo día, y sesiones abiertas sin duración.

Y lo comprobé también **por construcción**, que es lo que de verdad cierra la
pregunta: `closingLabelFor` **no tiene rama sin `return`** —su último caso es el
`return` por defecto— y se llama **siempre** que no haya `suggestion`, ni
`isSettled`, ni `mutedReason` (`vida-patterns.utils.ts:708`). En la vista, el
único camino que añade el hook es la sugerencia **callada**, y ahí `answerNote`
se rellena en las dos formas posibles: con la respuesta guardada, o —si el
silencio viene del puente y no hay respuesta propia— con
`bridgeAnswerNoteFor(weekMonday)`. Esa era exactamente la sexta rama que iba a
buscar, y está tapada.

**El riesgo que él mismo declara: ¿puede volver a aparecer un puente?**

Sí, y **está bien**. La clave es contra qué se mide:

- **Contra lo entregado en `main`** (FEAT-006), el código nuevo **solo añade una
  condición que oculta** el puente; no hay ni una que lo muestre donde antes no
  salía. `patternAnswers` no existe en `main`, así que para un usuario de hoy el
  puente se comporta igual salvo que conteste una sugerencia de hora en «Lo que
  se repite» —y entonces calla, que es lo que manda el criterio 83—.
- **Contra la entrega que devolví**, sí cambia: antes callaba cuatro semanas a
  ciegas y ahora respeta las tres condiciones de D1. Es lo que yo mismo pedí en
  el hallazgo 4 y es la lectura correcta del analista: si el número se mueve
  diez minutos o más, la pregunta vuelve **en las dos pantallas**, no en una
  sola.
- **El criterio 58 de FEAT-006 sigue en pie, y lo verifiqué por orden de
  código**: `isBridgeDismissed(...)` se evalúa **antes**
  (`VidaRevisionPage.tsx:1090`) y no se ha tocado; la condición nueva va
  **después** y solo puede quitar, nunca devolver, un puente que el 58 haya
  cerrado esa semana. Los criterios 54, 55, 56, 57 y 59 no pasan por nada de
  esto: `buildTemplateBridge` **sigue fuera del diff**.
- **Una arista, que anoto sin devolver:** el desfase del puente es
  `propuesta − actual` y el de la sugerencia es `mediana − plantilla`. No son el
  mismo número al minuto; la comparación lleva el margen de diez de D1, que lo
  absorbe en la práctica, pero son dos magnitudes distintas comparadas como si
  fueran una. Queda escrito por si algún día el usuario ve volver un puente que
  creía callado.

**«Contestadas» con `source`: la respuesta invisible ya no lo es**

`VidaAnsweredSuggestion` gana `source: 'pattern' | 'bridge'` y `answer` pasa a
ser anulable. Un «Dejarlo como está» dado en el puente **aparece en la lista**
—con su frase y su fecha de vuelta, la semana siguiente, que es la regla del
puente— y **la tarjeta dice lo mismo**, que es lo que evita la tarjeta muda.
Test en el hook, leído: `answered[0]` con `source: 'bridge'`, `answer: null` y
la nota completa, más `patterns[0].answerNote`. El hallazgo 5 queda cerrado; lo
que la tajada 4 tiene que recordar es que **`answer` puede ser `null`** y hay
que mirar `source` antes de asumir que hay número.

**`useVidaItemsQuery(includeInactive, enabled = true)`: aditivo de verdad**

Confirmado a mano: `enabled: guard && enabled` con `enabled` por defecto `true`,
y las **seis** llamadas existentes —`VidaTemplateAside:248`,
`VidaActividadesPage:78`, `VidaArchivadasPage:41`, `VidaSemanaPage:97`,
`VidaPlantillaPage:93`, `VidaRevisionPage:1039` (la del puente)— **no pasan el
segundo argumento**, así que se comportan exactamente igual; ninguna pasaba ya
un segundo parámetro posicional que pudiera cambiar de significado. La única que
lo usa es `useVidaPatterns`. Con esto el hallazgo 2 queda cerrado y, de paso, el
criterio **92** de la tajada 3 se vuelve más fácil de cumplir. La suite entera
sigue verde, incluidos `useVidaItems.test.tsx`, Plantilla, Actividades y
Archivadas.

**`isBridgeSilencedByAnswer`: las tres condiciones, no cuatro semanas a ciegas**

Leída entera (`vida-patterns.utils.ts:236`): sin respuesta no calla; pasada la
fecha de vuelta no calla; con el desfase movido ≥10 min no calla; y exige
`answer.dayOfWeek === null`, que es la tercera condición de D1 traducida a este
lado (un puente no habla de un día concreto). Cuatro casos en el `utils` y
**dos en la página** —con una respuesta de −55 el puente de −60 no se pinta; con
una de −5, sí—, que es la dirección que en la entrega anterior no tenía ni un
test. Hallazgo 3 cerrado.

**Línea base, corrida entera por mí** (no la del constructor)

| Qué | `ENVIRONMENT.md` | Entrega devuelta | Constructor (corrección) | **Medido ahora** |
|---|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1479 | 2 de 1513 | 2 de 1526 | **2 fallidos de 1526**, 109 archivos de 110 en verde; los dos de `SearchSelect` |
| `pnpm build` | 1.065,85 kB | 1.079,47 kB | 1.080,83 kB | **exit 0**, `index` **1.080,83 kB** (+1,36), `app-icons` **620,20 kB sin tocar**, `IconPicker` 4,64 kB |

**+1,36 kB por el arreglo está bien**: son las cuatro frases de `closingLabel`,
las dos líneas que ahora se componen siempre y `isBridgeSilencedByAnswer`.
Ninguno de iconos.

**Lo que volví a mirar de cerca, y lo que no**

No repito la revisión entera: los criterios 75, 76, 78–85, 101 y 104 los
verifiqué en la primera pasada y la corrección no toca su código (el modelo de
la sugerencia, los dos parches, el `vidaItemUpdate`, la lista de espera y el
marco F están intactos). Lo que sí volví a correr: **la suite entera**, la
línea base completa, el orden de las condiciones del puente, las seis llamadas
de `useVidaItemsQuery` y mis dos probes sobre el `utils`.

**Lo que no se ha verificado en el navegador, y lo digo sin heredarlo:** el
constructor **no abrió el navegador** en la corrección —su evidencia de lo que
pinta la tarjeta es el test de la página sobre el DOM— y **yo tampoco**. La
clase de la línea nueva es la misma `.settled` que ya existía, así que la caja y
el color no cambian, pero **nadie ha visto esta tarjeta pintada a 375 px ni en
oscuro**. Va como está: verificado por test y por hoja de estilos, no por
píxeles.

**Hallazgos que siguen abiertos** (ninguno devuelve la tajada)

1. **La arista de los dos desfases del puente** (arriba): magnitudes distintas
   comparadas con el margen de diez.
2. **`VidaAnsweredSuggestion.answer` puede ser `null`.** Para la tajada 4:
   `source` manda, y «Contestadas» tiene dos formas de frase, no una.
3. **Una tarjeta desactivada y a la vez dentro de tolerancia pinta las dos
   líneas** (`settledLabel` y `mutedReason`). No es mudez ni contradicción, pero
   dice dos veces que no hay nada que proponer.
4. **El umbral del día suelto** (30 min, 2 muestras) queda **escrito como
   decisión del constructor** con su razón, que era lo que pedía el hallazgo: lo
   cierra el usuario con datos suyos (criterio 105).
5. **`ENVIRONMENT.md` sigue con la línea base vieja** (2 de 1479, chunk
   1.065,85 kB). Hoy son **1526 tests** y **1.080,83 kB**. **No lo he tocado**
   —es la regla—, pero ya va tres tajadas por detrás y el próximo agente
   comparará contra un mapa viejo.
6. **El servidor del constructor de la tajada 1 sigue vivo en el 5174.** Ni él
   ni yo arrancamos o paramos nada en esta corrección.

**Lo que no he podido revisar**: el recorrido real dentro de
`/app/vida/revision` —criterios **105** y **106**, y **375 px y oscuro dentro de
`/app/*`** del **86**—, con el paso nuevo que el propio constructor apunta y que
es el más fácil de probar: **planear algo y no registrarlo**; la tarjeta tiene
que decir «no hay ninguna registrada», nunca «pasa como lo planeaste». Es el
límite estructural del repositorio, no un descuido.

### Tajada 3 — El aviso llega al planear

**Veredicto: `accepted`** — los ocho criterios de la tajada (87–94) y los tres
transversales (101, 103, 104) se cumplen con evidencia que he vuelto a producir
yo, **incluida la del navegador: esta vez sí he visto la pantalla**, a 375 px, en
claro y en oscuro. El coste —que es lo serio de esta tajada— está medido, no
prometido, y **me parece defendible**, con una condición que escribo abajo y que
le toca cerrar al usuario. Hoy no se ha roto: sus 97 casos pasan sin que se haya
tocado ni uno.

**El juicio sobre el coste, que es lo que se me pedía**

Los números, verificados por mí corriendo sus tests con espías sobre la API
(`useVidaHistoryWindow.test.tsx`): abrir Hoy en frío el peor día añade **39
planes + 1 rango + 1 plantilla** a las ~11 que ya hacía; llegando desde Revisión
**0 nuevas** (misma clave `dayPlan.byDate` y **el mismo** `followUps.range`,
porque la ventana se calcula desde el **hoy de verdad** en las dos pantallas, no
desde el día que se mira); **volver a Hoy dentro de la sesión: 1**, la de hoy;
**un día pasado: 0**, porque `canPlan` apaga el interruptor antes de montar nada.

**Me parece defendible, y estas son las cuatro razones**, en orden de peso:

1. **El primer pintado no lo paga nadie.** El interruptor exige que los datos
   propios de la pantalla ya hayan resuelto, así que Hoy aparece cuando aparecía
   ayer y los avisos llegan después. Eso no es una promesa: es el criterio 92, y
   está probado.
2. **La alternativa barata estaba prohibida con un buen argumento.** Acortar la
   ventana en Hoy rompe «una sola ventana para las tres pantallas» (la misma
   costumbre tendría dos números y la regla de los diez minutos de D1 dispararía
   sola), y acortarla para todos deja a D1 sin su justificación. El constructor
   podía haberlo hecho en una línea y ha preferido no mentirle al modelo.
3. **Lo que sí podía hacer, lo ha hecho**: no montar la ventana en días pasados
   ni sin plan ni sin plantilla, apagar también la consulta de plantilla con el
   mismo interruptor (gracias al `enabled` que nació en la corrección de la
   tajada 2) y **dejar de caducar los días cerrados**, que es lo que convierte
   «una vez por apertura» en «una vez por sesión».
4. **El arreglo de verdad está escrito y es de backend**
   (`activityDayPlansInDates`, 39 → 1), fuera de alcance por el criterio 101 y
   anotado en el dossier en vez de en una conversación.

**Y la condición, dicha sin adornos:** esto está medido **en consultas, no en
segundos**, y 39 peticiones en paralelo contra Render gratuito —que duerme a los
15 minutos— es justo el escenario que puede hacer que Hoy *parezca* rota en un
móvil aunque el primer pintado sea instantáneo. **Eso no lo puede cerrar ningún
agente**: va al criterio 105 como paso explícito —abrir Hoy en frío la primera
vez del día y mirar si algo se atasca— y la palanca, si duele, es **una línea**
(`canShowPatterns`), que devuelve Hoy a lo que costaba ayer sin tocar nada más.
No devuelvo la tajada por esto: el aviso es el corazón del criterio de la fase
(«al planear un día, al menos un aviso útil sale de datos propios») y el coste
está contenido por donde se podía.

**Criterios, uno por uno** (contra la sección 1)

| # | Estado | Evidencia que he comprobado yo |
|---|---|---|
| 87 | **cumplido** | **Visto en el navegador**: caja de trazo **violeta punteado** (`border-style: dashed`, `rgb(124,58,237)/0.45` medido con `getComputedStyle`), cabecera «DE TUS ÚLTIMAS SEMANAS» en violeta con la píldora «1 de 2» / «2 de 2», y las dos salidas con el número dentro («Sí, 1h 10», «Sí, 19:30») más «Así está bien». En el DOM lo afirma además el test de la página. |
| 88 | **cumplido** | `pickBlockHints` leído entero: solo sugerencias con `dayPatch`, desfase **estricto** `> 10 min`, bloque existente, no terminado, que no tenga ya el número, y que **quepa** en su hueco; `usedBlockIds` impide dos del mismo bloque; orden por repeticiones, luego desfase, luego id. `limit = 2` y la cuenta se escribe **después** de filtrar. Test de la página con tres candidatos: se pintan dos y el tercero no aparece. Busqué el caso de «dos del mismo bloque» y no se puede dar: el `find` descarta los ya usados. |
| 89 | **cumplido, espiado** | `applyBlockHint` manda **un** `editMutation.mutate({ itemId, ...toDayPlanTimes(...) })` y nada más. El test afirma **una** llamada, `updateItemMutation.mutate` **sin llamadas** y las otras tres del plan (`add`, `remove`, `set`) tampoco. La consecuencia va **antes de los botones** y la leí en pantalla: «Esto cambia solo para hoy: tu plantilla se queda como está.» |
| 90 | **cumplido** | «Así está bien» llama a `patterns.answerSuggestion` y a **ninguna** mutación (aserción sobre las cinco). Como la respuesta va al `patternAnswers` de la tajada 2, entra en la regla de las cuatro semanas del 83 y calla también en «Lo que se repite». |
| 91 | **cumplido** | `usualDurationMinutes` sale de la **mediana de las sesiones reales** (no de la plantilla), redondeada a cinco minutos y **solo con cuatro sesiones registradas o más** —que es lo que el criterio dice, «4 datos», y no cuatro apariciones—. Sin dato, `usualDurations` no trae la clave, el chip dice la duración de siempre **sin etiqueta** y la frase del pie no se pinta (`suggestions.visible.some(isUsual)`). |
| 92 | **cumplido, y por construcción** | `usualDurations` por defecto `{}` y `pickBlockHints([])` → `[]`: sin patrones, `suggestionsForGap` devuelve exactamente lo de antes. El test explícito afirma que no aparece «De tus últimas semanas», ni «Así está bien», ni «sueles tardar», ni la línea del pie. Y los **97 casos que Hoy ya tenía pasan sin tocar ni uno** (0 líneas borradas en su test, comprobado con `--numstat`). |
| 93 | **cumplido** | Ni rojo ni icono de alarma: lo miré en pantalla y con `getComputedStyle`; no hay ningún `role="alert"` en el documento (aserción propia en el navegador y test en la página). El día se arma entero ignorándolos: sin tocar nada no se llama a ninguna mutación. Ni una palabra de la lista de reproche en las frases nuevas («te suele llevar 25 min más», «sueles empezarlo 22 min más tarde»). |
| 94 | **cumplido en lo que se puede aquí** | **Medido por mí en el navegador**, a 375 px: `scrollWidth === clientWidth === 375` y **ni un nodo** con `right > 375`; el orden de la lista es `block, hint, block, hint` —el aviso va **debajo** y no tapa ni desplaza su bloque—; el nombre de 60 caracteres parte dentro de la caja. Oscuro: el violeta pasa a `#a78bfa`, el cuerpo a `#eef2ff` y la nota de alcance a `#a8b3c7`; todo legible. **Dentro de `/app/*` sigue siendo del usuario.** |
| 101 | **cumplido** | El diff no toca `graphql/`, `api/` ni `routes/`, y no hay clave de `localStorage` nueva: la respuesta va al `patternAnswers` que ya existía. |
| 103 | **cumplido, y verificado** | Las dos medidas nuevas corren con espías sobre la API y pasan: 39 + 1 llegando con la tira sembrada, y **43 tras volver** (42 + la de hoy) diez minutos después, es decir **0 planes nuevos**. Las cuentas de la pantalla salen de leer sus hooks, y eso queda dicho en el reporte en vez de disfrazado de medida. |
| 104 | **cumplido, línea base corrida entera por mí** | Ver abajo. |
| 105, 106 | **pendientes del usuario** | Con la API despierta. Esta tajada añade dos pasos: **cronometrar** la primera apertura de Hoy en frío, y comprobar que aceptar un aviso cambia el bloque **y no la plantilla**. |

**En el navegador, por mí** (lo que las dos tajadas anteriores no tuvieron)

El 5173 del usuario estaba arriba (`probe.sh`), así que **no arranqué ningún
servidor**: monté un arnés temporal propio (`arnes-revisor.html` +
`src/harness/arnes-revisor.tsx`) que pinta los dos avisos **dentro de la lista
real de la agenda** (`VidaHoyPage.module.scss`, con `data-tone='plan'`), lo
serví desde ese 5173 y **lo borré**: `git status` no lo lista. Los avisos los
generó `pickBlockHints` de verdad, no los escribí a mano.

Lo medido ahí está en la tabla. Y una cosa que solo se ve mirando:

- **En un día solo planeado, el fondo violeta del aviso no se ve.** La regla
  `.agenda[data-tone='plan'] > li > :is(article, section)` de
  `VidaHoyPage.module.scss:68` gana por especificidad y sustituye el
  `color-mix(--aura-ring-to 7%)` de la tarjeta por el vidrio de la agenda
  (medido: `color(srgb 1 1 1 / 0.38)`). **El trazo punteado violeta y la
  cabecera violeta sí quedan**, así que el criterio 87 se cumple igual y no
  devuelvo nada por esto; pero el aviso se lee un punto más apagado justo en el
  estado —«al planear»— para el que está hecho. Hallazgo 1.

**El violeta: el token existía, y eso reabre lo de la tajada 2**

Comprobado: `--aura-ring-to` (`src/app/styles/_theme-variables.scss:203` y
`:270`) y **ya lo usaban `VidaDayBudget`, `VidaAgendaSession`,
`VidaAgendaBlock`, `VidaReviewWeek` y la propia `VidaHoyPage`**. Es decir: la
desviación que la tajada 2 declaró —«no hay token semántico de violeta»— **se
apoyaba en una premisa falsa, y yo la di por buena en su revisión**. Queda
corregido aquí: esta tajada usa `var(--aura-ring-to, var(--color-primary))` sin
un solo color literal, y **cerrar aquello es una línea** en
`VidaPatternCard.module.scss`. Lo dejo como hallazgo para el usuario, no lo
arreglo yo: no toco código de producto.

**Lo que se rompió cerca: cómo busqué**

- **`grep` de los seis consumidores de lo que se ha tocado.** `suggestionsForGap`
  se usa **solo** en `VidaHoyPage` (el hueco); `GapSuggestion.isUsual` es
  aditivo; `VidaActivityPattern` gana dos campos que solo lee
  `usualDurationsByItemId`; `VidaAgendaBlock` **no se ha tocado** y el aviso es
  un `<li>` hermano, no un trozo suyo.
- **Los 97 casos de `VidaHoyPage.test.tsx`: `git diff --numstat` da 210 añadidas
  y 0 borradas.** Ninguna afirmación de FEAT-003/004 se ha relajado. La suite
  entera, corrida por mí: 1.552 pasan.
- **La suite del módulo** (Plantilla, Revisión, Semana, Actividades,
  Archivadas): verde. `PAST_STALE_TIME` infinito afecta también a «Lo que se
  repite» y sus tests siguen pasando.
- **El reloj del día que no es hoy:** `useVidaNowMinute(isToday)` devuelve
  `null` fuera de hoy, así que el `isDone` por hora no marca bloques de un día
  futuro. Lo verifiqué porque era el sitio natural de un fallo silencioso.
- **Días pasados:** `canPlan` los deja fuera del interruptor; hay test propio.

**Una decisión que supera un criterio entregado, y hay que decirlo**

`suggestionsForGap` ahora filtra por **la duración habitual**, no por la de la
plantilla. El criterio **18 de FEAT-003** dice literal: «sugerencias cuyo
`durationMinutes` **de su ítem de plantilla** es ≤ el tamaño del hueco». Con la
costumbre por medio esa frase ya no describe el código. **No es una regresión**
—su intención, «solo lo que cabe», se cumple mejor: ofrecer 55 min en un hueco
de 40 porque la plantilla dice 30 sería colocar algo que no entra—, pero **el
criterio 91 de esta feature deroga en parte el 18 de aquella**, y eso queda
escrito aquí para que nadie lo descubra leyendo el dossier viejo. Hallazgo 2.

**Estados que nadie construye**

| Estado | Cómo queda |
|---|---|
| **Sin datos** | El mejor de esta tajada: sin patrones no hay aviso, ni leyenda, ni hueco reservado —criterio 92, cierto por construcción y con test—. |
| **Cargando** | El aviso no tiene estado de carga **y está bien**: la ventana es diferida y lo que no ha llegado simplemente no se pinta. Hoy no espera a nadie. |
| **Error** | Si la ventana cae, `patterns.hasError` no se pinta en Hoy: **no hay aviso y no hay mensaje**. Es defendible —un aviso que no llegó no es un fallo que contarle a nadie mientras armas el día— y ningún criterio de esta tajada pide lo contrario (el 72 es de la sección de Revisión). Lo anoto por si el usuario lo prefiere de otra forma. Hallazgo 3. |
| **Sin permisos** | No aplica: `/app/*` y el interruptor exige sesión. |
| **Texto largo** | Visto: el nombre de 60 caracteres **se repite entero dentro del aviso** («Organizar la casa… sueles empezarlo 22 min más tarde»), justo debajo del bloque que ya lo dice. Cabe, no desborda y no rompe nada, pero el aviso se vuelve un párrafo. Hallazgo 4. |
| **Móvil 375 px** | Verificado por mí en el navegador, con los dos avisos abiertos. |
| **Oscuro** | Verificado por mí. |

**Línea base, corrida entera por mí**

| Qué | Referencia del encargo | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1526 | 2 de 1554 | **2 fallidos de 1554**, 109 archivos de 110 en verde; los dos de `SearchSelect` |
| `pnpm build` | 1.080,83 kB | 1.085,17 kB | **exit 0**, `index` **1.085,17 kB** (+4,34), `app-icons` **620,20 kB sin tocar**, `IconPicker` 4,64 kB |

**Hallazgos — se anotan, no devuelven la tajada**

1. **El fondo violeta del aviso lo pisa la agenda en modo «plan»** (medido
   arriba). Una línea de especificidad lo arreglaría; decide el usuario si le
   importa, porque el trazo y la cabecera sí son violetas.
2. **El criterio 18 de FEAT-003 queda derogado en parte** por el 91 de esta
   feature: el filtro del hueco usa la costumbre, no la plantilla.
3. **Si la ventana falla, en Hoy no se dice nada.** Silencio deliberado; queda
   escrito por si se prefiere otra cosa.
4. **El aviso repite el nombre entero de la actividad**, que ya está en el
   bloque justo encima. Con nombres largos el aviso se lee como un párrafo.
5. **`PAST_STALE_TIME` infinito**: un día pasado cambiado **desde otro
   navegador** no se ve hasta que la entrada caduque por `gcTime` (media hora)
   o hasta una escritura local. Afecta también a «Lo que se repite». Es el
   precio escrito de la contención del coste y me parece bien pagado.
6. **Sigue abierto de la tajada 2:** los dos desfases del puente
   (`propuesta − actual` frente a `mediana − plantilla`), y
   `VidaAnsweredSuggestion.answer` anulable, que la **tajada 4** tiene que mirar
   por `source`. La tercera —dos líneas de cierre en una tarjeta desactivada—
   sigue igual.
7. **El violeta de la tajada 2 se puede cerrar en una línea**, ahora que se sabe
   que el token existe (arriba). No lo toco yo.
8. **`ENVIRONMENT.md` ya está al día** (2 de 1526, chunk 1.080,83 kB): alguien lo
   actualizó y con esta tajada vuelve a quedarse corto (**1554** y **1.085,17
   kB**). **No lo he tocado.** El **5174** que arrastrábamos desde la tajada 1
   ya no responde: la sonda lo da apagado.

**Lo que no he podido revisar:** el recorrido real dentro de `/app/vida/hoy`
—criterios **105** y **106**, y **375 px y oscuro dentro de `/app/*`** del
**94**—, y sobre todo **cuánto tarda de verdad** la primera apertura de Hoy en
frío contra Render dormido, que es la única pregunta abierta que importa de esta
tajada. Lo demás lo he visto con mis ojos y lo he medido con mis manos.

### Tajada 4 — El dato donde se edita, y el escritorio

**Veredicto: `accepted`** — los seis criterios de la tajada (95–100) y los tres
transversales (101, 103, 104) se cumplen con evidencia que he producido yo,
**con el navegador abierto** a 375 px, en oscuro y a 1280 px. Las dos
desviaciones declaradas me parecen bien resueltas, y **los cuatro arreglos de lo
que dejaron las tajadas anteriores están hechos de verdad**, comprobados uno a
uno. Con esto la feature queda **entregada** y el módulo Vida, cerrado.

**Criterios, uno por uno** (contra la sección 1)

| # | Estado | Evidencia que he comprobado yo |
|---|---|---|
| 95 | **cumplido** | **Visto en pantalla**: bajo «A qué hora», la caja violeta punteada con la frase, la consecuencia **antes** de los botones y las dos salidas («Quitar el martes» / «Dejarlo», `primary` + `secondary`); bajo «Cuánto», «Suele llevarte 30 min justos. Esta duración va bien.» **sin caja** y **sin un solo botón**, también cuando no hay nada que proponer (test propio del componente y del `utils`). |
| 96 | **cumplido, y es el test que había que escribir** | El test compara **el cuerpo de la mutación con patrón contra el cuerpo sin patrón** con `toEqual`: idénticos. El día marcado conserva `aria-pressed="true"` y suma un `aria-label` («martes · el día del que habla el aviso») —medido en el navegador—, y el chip se pinta en violeta punteado entre los mint, así que **marcado se ve y no toca nada**. Mi juicio sobre dónde escribe la salida afirmativa, abajo. |
| 97 | **cumplido** | Sin patrón, el derivado devuelve `null` y no se pinta nada: ni cabecera, ni «Suele llevarte», ni «Sueles empezar», **ni un hueco** —las dos líneas son hijas condicionales del `.field`, que es un flex en columna: sin hijo no hay `gap`—. Dos tests, y lo verifiqué leyendo el JSX: no hay ningún contenedor vacío reservado. |
| 98 | **cumplido, medido** | A **1280 px**: `patternsLayout` es `grid` con columnas **893 px + 336 px** y `patternList` va a **dos columnas de 440,5 px** (el constructor midió 885 + 336 y 419,5 en su viewport; es el mismo reparto). A 375 px es una columna y **no hay lateral**. Test con `matchMedia` en las dos direcciones. |
| 99 | **cumplido** | «Sin contestar» lista solo `liveSuggestions`, con **las mismas dos salidas** que la tarjeta, y dice «no caduca ninguna y no cambian nada solas». «Contestadas» las pinté con las **tres** formas y las vi: la aplicada («**«Ponerlo en 1h 10», hecho el 22 de septiembre**…»), la contestada aquí («Vuelve el 19 de octubre si el patrón sigue igual») y **la contestada en el puente**, que se resuelve mirando `source` y no `answer`. Nada desaparece a escondidas. |
| 100 | **cumplido** | El panel dice las cuatro cosas, leídas literales en pantalla: plan y registro de **las últimas 6 semanas con las consultas que ya existen**, calculado **en este dispositivo cada vez que abres**, lo único que se guarda es **tu respuesta**, y **nada cambia por su cuenta**. Y avisa de que la respuesta **vive en este navegador y en otro no está** (la deuda del criterio 63 de FEAT-006). |
| 101 | **cumplido** | El diff no toca `graphql/`, `api/` ni `routes/`; ninguna clave de `localStorage` ni de caché nueva. |
| 103 | **cumplido** | Entrar en Plantilla: **0 consultas nuevas**, con test (`patternsEnabled` todo `false` hasta el primer clic y `true` después). La ventana se paga al abrir **la primera** hoja y, llegando de Hoy o de Revisión, es **0** por la caché compartida. El escritorio **no cuesta nada más** que el móvil: el lateral consume lo ya derivado y la rejilla es CSS. |
| 104 | **cumplido, línea base corrida entera por mí** | Ver abajo. |
| 105, 106 | **pendientes del usuario** | La nota de cierre, al final. |

**El criterio 96 y dónde escribe la salida afirmativa: mi juicio**

El criterio solo obliga en un sentido —«**mientras no se pulse** la salida,
guardar manda exactamente el mismo cuerpo»— y eso está probado con el test que
el propio criterio pedía (sobre las claves de la mutación, no sobre la vista).
Qué hace **al pulsarla** lo deja abierto, y escribir en el borrador **es la
lectura correcta**: la hoja es un formulario con su propio `days` en curso; un
`vidaItemUpdate` suelto por el mismo ítem mientras hay borrador abierto dejaría
dos versiones compitiendo y la última en guardar —la hoja— devolvería el martes
que acabas de quitar. Es exactamente el tipo de fallo que no se ve en un test y
se ve en la cara del usuario.

**Dicho eso, aquí está la arista, que el encargo pedía nombrar:** si se acepta
la sugerencia y se **cierra la hoja sin guardar, el cambio se pierde**. No lo
considero motivo de devolución por dos razones: **(a)** pasa exactamente igual
con cualquier campo de la hoja desde FEAT-005 —cambiar la hora a mano y cerrar
también se pierde: la hoja **no tiene guarda de cambios sin guardar**, y eso es
deuda de aquella feature, no de esta—; y **(b)** no es silencioso *antes*:
en cuanto se pulsa aparece «**«Quitar el martes», hecho aquí. Se guarda cuando
pulses Guardar**» con `role="status"`. Lo que no hay es aviso **al cerrar**, y
eso es lo que anoto como hallazgo: la guarda le toca a la hoja entera, no a la
línea nueva.

**Las dos desviaciones, juzgadas**

1. **`VidaPatternAdvice`, un componente para dos sitios en vez de dos:
   correcta.** Comprobé que `VidaBlockHint` no servía: es un `<li>` con la
   canaleta de la hora de la agenda, se numera «1 de 2» y su parche es el del
   día (`dayPatch`); en la hoja no hay lista, ni hora, ni cuenta, y lo que se
   toca es la plantilla. Y el render dibuja `.advice` y `.sugg` **iguales**, así
   que escribir dos componentes habría sido la duplicación que el plan prohíbe.
   Lo que comparten —el violeta desde el token y el lenguaje de «nota al
   margen»— se comparte de verdad. **Es la única desviación de la lista de
   archivos del plan y está bien argumentada.**
2. **«De dónde sale todo esto» también en móvil: correcta, y me parece la mejor
   decisión de la tajada.** El criterio 98 coloca el **lateral** en escritorio;
   el 100 **no dice dónde vive el panel**, dice qué tiene que decir. El teléfono
   es el aparato donde se usa esto, y es justo donde importa saber que las
   respuestas **no están en otro navegador**. Lo vi pintado a 375 px, al final
   de la sección, sin lateral y sin duplicarse. Un sistema que solo explica sus
   números en pantalla grande no explica nada: suscribo la frase.
   Y la hermana —**«Sin contestar» no se pinta en móvil**— también es correcta:
   serían las mismas preguntas con los mismos botones a dos pantallazos, y hay
   test de que en móvil la pregunta sale **una sola vez**.

**Los cuatro arreglos de las tajadas anteriores: verificados uno a uno**

- **El violeta desde `--aura-ring-to`:** hecho en `.tag` y en las casillas de la
  mini-fila, con `--color-primary` de respaldo y **ni un color literal**; el
  comentario que afirmaba que no había token —la premisa falsa que **yo di por
  buena** en la revisión de la tajada 2— está corregido en el propio archivo.
  La barra de adherencia se queda en mint, y es lo que hace el render. Cerrado.
- **«Contestadas» mira `source` antes que `answer`:** leído en el componente y
  **visto pintado** con las tres formas, incluida la del puente con
  `answer: null`. Cerrado.
- **La tarjeta desactivada y en tolerancia ya no imprime dos cierres:** ahora
  manda `mutedReason`, que es la que explica **por qué** no se pregunta.
  Cerrado.
- **`.agenda[data-tone='plan']` ya no se come el fondo del aviso de Hoy:** la
  regla excluye `[data-kind='hint']` y el aviso lo lleva. Cerrado. (Lo confirmé
  en el código; el fondo violeta del aviso lo medí en la revisión anterior, y la
  regla que lo pisaba ya no lo alcanza.)

**Lo que NO arregló, y si me parece bien dejarlo**

- **Hoy sigue mudo si la ventana falla: bien dejado.** Tocar Hoy para meterle un
  mensaje de error roza justo el criterio 92 —«sin datos suficientes, Hoy es
  **exactamente** el Hoy de FEAT-003/004»— en una pantalla entregada con 97
  casos, y por una situación en la que lo que falta es un aviso, no el día. Que
  deje **escrita la forma concreta** del arreglo (sin `role="alert"`, sin rojo,
  solo con el día planeable) es más útil que haberlo improvisado aquí. Deuda,
  no defecto.
- **El aviso de Hoy repite el nombre entero: bien dejado, y es el más flojo de
  los dos.** Es una preferencia de redacción que cuesta tocar trece tests de una
  pantalla entregada. Lo vi con un nombre de 60 caracteres en la revisión
  anterior: cabe, no desborda, solo se lee largo. La propuesta que deja
  —«Esto» cuando el aviso cuelga del bloque que ya lo dice— es de una línea y la
  puede pedir el usuario cuando lo vea con sus datos.

**En el navegador, por mí**

El 5173 del usuario estaba arriba, así que **no arranqué ningún servidor**:
monté un arnés propio con **los componentes y las hojas de estilo reales** —la
fila de días y los dos campos con las clases de la hoja, el `VidaPatternAdvice`
de verdad, el `VidaPatternsAside` de verdad y la rejilla con las clases de
Revisión—, lo serví desde ese 5173 y **lo borré**: `git status` no lo lista.
Medido ahí:

- **375 px, claro:** `scrollWidth === clientWidth === 375`, **0 nodos** con
  `right > 375`, **ni un «%»** en el texto. El martes va en **violeta punteado**
  (`dashed`, `rgb(124,58,237)/0.55`) entre los días en mint, con
  `aria-pressed="true"` intacto. La caja del aviso: `dashed`
  `rgb(124,58,237)/0.45` sobre fondo violeta al 7 %.
- **375 px, oscuro:** el violeta pasa a `#a78bfa` en el trazo, en la cabecera y
  en el día marcado; el texto del panel queda en `#eef2ff` y las notas en
  `#a8b3c7`. Todo legible.
- **1280 px:** `grid` de **893 px + 336 px**, tarjetas en **dos columnas de
  440,5 px**, y los tres paneles del lateral pintados. Es el reparto del marco E.

**Lo que se rompió cerca: cómo busqué**

- **La hoja del ítem es la pantalla más compartida del módulo** —Plantilla,
  Actividades y Archivadas—. Las tres props son **opcionales con valor por
  defecto** y **solo Plantilla las pasa** (comprobado con `grep` sobre los tres
  llamadores): para los otros dos la hoja es byte a byte la de FEAT-005, y sus
  suites siguen verdes.
- **`git diff --numstat` de los cuatro archivos de test: 367 añadidas y 1
  borrada**, y esa una es **una línea de `import`** que se amplía. Ninguna
  afirmación de FEAT-005 ni de FEAT-006 se ha relajado.
- **Hoy:** lo único que se le toca es **un selector de su SCSS**, y es el
  arreglo que yo mismo pedí. Sus 97 casos siguen pasando.
- **La suite entera, corrida por mí:** 1.568 pasan, los dos de `SearchSelect`
  fallan como siempre. Incluye el arreglo de producción de `CATALOG_LIMIT`
  (`e492e50`), que está en `main` y no es de esta tajada: no lo he revisado como
  tal, y nada de lo que corrí lo roza.
- **`VidaPatternsSection` ahora mira `matchMedia`:** el mismo riesgo que ya
  tenía la sección «Un día» de FEAT-006, con test en las dos direcciones.

**Línea base, corrida entera por mí**

| Qué | Referencia del encargo | Constructor | **Medido ahora** |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **exit 0, limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings**, los mismos |
| `pnpm test` | 2 de 1554 | 2 de 1570 | **2 fallidos de 1570**, 109 archivos de 110 en verde |
| `pnpm build` | 1.085,17 kB | 1.092,02 kB | **exit 0**, `index` **1.092,02 kB** (+6,85), `app-icons` **620,20 kB sin tocar**, `IconPicker` 4,64 kB |

**Hallazgos — se anotan, no devuelven la tajada**

1. **La hoja no tiene guarda de cambios sin guardar** (deuda de FEAT-005, ahora
   más visible): aceptar la sugerencia y cerrar sin guardar pierde el cambio,
   igual que cualquier campo editado a mano. Se avisa al pulsar, no al cerrar.
2. **La pregunta sigue en pantalla después de aceptarla en la hoja**, junto a la
   línea de «hecho aquí». Pulsarla otra vez es inocuo (el mismo parche), pero se
   lee raro.
3. **Lo aplicado en «Contestadas» es de la visita, no del aparato**: al recargar
   esa línea desaparece —el patrón ya no propone nada porque el número
   coincide—. Es la lectura conservadora y está escrita; la otra sería un campo
   nuevo en el store para algo que la plantilla ya dice.
4. **La deuda que queda de FEAT-007 entera** está en el reporte del constructor
   y la suscribo: la consulta de rango en el backend, el criterio 18 de FEAT-003
   derogado en parte por el 91, la ficha sin duración con registros propios, los
   dos desfases del puente, el umbral del día suelto, Hoy mudo si falla la
   ventana, el nombre repetido en el aviso, `PAST_STALE_TIME` infinito, las
   respuestas que no viajan entre navegadores, el troceado del chunk y
   `Button variant="danger"` en oscuro.
5. **`ENVIRONMENT.md` vuelve a quedarse corto** (hoy **1570** tests y **1.092,02
   kB**). **No lo he tocado** — es la regla.

### Cierre de la feature — nota para el usuario

**FEAT-007 queda `delivered`, y con ella se cierra el módulo Vida** (F0 a F6).
Lo que sigue es lo que la persona lee; el resto del expediente es el dossier.

---

**Lo que puedes hacer ahora y antes no podías.** Vida ya no solo te deja
planear el día, vivirlo y mirar atrás: ahora **te dice lo que se repite en tus
propias semanas**. En Revisión hay una tercera sección, «Lo que se repite», que
mira tus últimas seis semanas y te cuenta cuánto se parece tu plantilla a tu
vida —siempre en fracción, «29 de 36», nunca un porcentaje suelto— y, actividad
por actividad, a qué hora sueles empezarla de verdad y cuánto suele llevarte.
Cuando hay algo que proponer, lo pregunta con el número dentro del botón
(«Ponerlo en 1h 10», «Quitar el martes») y con la consecuencia escrita **antes**
de que toques nada; cuando no lo hay, lo dice en voz alta en vez de inventarse
un número; y cuando todavía no tiene datos, te dice cuánto le falta. Nada cambia
solo: hace falta que pulses el botón que dice la cifra.

**Y ese dato ya no vive solo en una pantalla.** Al armar el día, en Hoy,
aparecen **como mucho dos avisos** pegados al bloque del que hablan, en violeta
punteado, con dos salidas: la que acepta el número **solo para hoy** —tu
plantilla no se entera— y «Así está bien», que es una respuesta de pleno
derecho: se guarda y no vuelve a preguntártelo **en cuatro semanas**, y cuando
vuelva ya sabías la fecha. Los huecos del día te ofrecen además la duración que
**sueles** tardar, no la que pusiste. Y en la plantilla, al abrir la hoja de una
actividad, tienes el dato **justo debajo del campo del que habla**: bajo «A qué
hora», con su salida y el día señalado; bajo «Cuánto», una línea que te confirma
cuando ya va bien. Si no tienes historia, todo esto no existe: ni una línea de
más, ni un hueco reservado. Y hay un panel que te dice de dónde sale todo, que
se calcula en tu dispositivo cada vez que abres, que lo único que se guarda es
tu respuesta y que esa respuesta **vive en este navegador**: en otro, las
preguntas vuelven.

---

**Lo que solo puedes comprobar tú, con tus manos y tus datos.** Ningún agente
entra a `/app/*` con tu sesión, así que esto no lo ha visto nadie dentro de la
aplicación de verdad:

1. **El criterio de la fase.** Abre **Hoy** en un día con plan y mira si **al
   menos un aviso útil sale de tus datos y ninguno suena a bronca**. Es la
   pregunta que cierra F6.
2. **El recorrido entero.** En Revisión, «Lo que se repite»: ¿los números
   cuadran con lo que recuerdas? Contesta una sugerencia con la salida
   afirmativa y comprueba en la plantilla que **cambió solo ese campo** y que
   **ningún día ya armado se movió**. Contesta otra con «Dejarlo», **recarga**,
   y mira que no vuelve a preguntar y que dice **cuándo vuelve**.
3. **La hoja de la plantilla.** Abre la de una actividad con historia: mira la
   línea bajo «A qué hora» y la de «Cuánto», comprueba que **el día señalado no
   cambia nada** si guardas sin tocarlo, y que al pulsar la salida afirmativa
   **el cambio solo se aplica cuando pulsas Guardar** (si cierras sin guardar,
   se pierde, igual que cualquier campo de esa hoja). Y abre la de una actividad
   **sin** historia: tiene que ser la hoja de siempre, sin una línea de más.
4. **El escritorio.** Abre «Lo que se repite» en pantalla grande: rejilla de
   tarjetas y un lateral con «Sin contestar», «Contestadas» y «De dónde sale
   todo esto».
5. **375 px y oscuro dentro de la aplicación**, en las tres pantallas. Está
   medido con los componentes y las hojas de estilo reales en un arnés, pero
   **nadie lo ha visto con tu sesión abierta**.
6. **El cronómetro, que es lo único que nadie ha medido en segundos.** Abre
   **Hoy** y **la primera hoja de la plantilla** en frío, la primera vez del
   día, con la API dormida. Está medido **en consultas** —hasta 42 peticiones en
   paralelo—, no en tiempo. Si se nota lento, hay **dos palancas de una línea**
   escritas en el dossier, y el arreglo de fondo (una consulta de rango en el
   servidor) queda anotado como la siguiente cosa que pedirle al backend.
7. **Los dos umbrales que puso el constructor y no salen de ningún criterio:**
   cuándo se considera que un día «se sale de la cuenta» (30 minutos y dos
   muestras). Con tus datos verás si señala días que no debía o si calla
   alguno.

---

### Derogaciones posteriores — FEAT-010, tajada 3 (2026-09-25)

**El criterio 91 no se reescribe: queda derogado por la mitad.** Decía que el
hueco ofreciera «la duración que sueles tardar» en su ficha —«sueles tardar
55m»— y que lo dijera. Las fichas del hueco se retiraron enteras (FEAT-010,
criterio 381), así que **esa mitad muere con ellas**.

**La otra mitad está viva y tiene dueño nuevo:** lo que la costumbre mide se
dice ahora en la tarjeta de «Lo que viene», con las palabras del **criterio 372
de FEAT-010** («suele durarte N», y manda la costumbre sobre la plantilla
cuando difieren). La aritmética es la misma y no se duplicó: se pasó de
`usualDurationsByItemId` —retirada, sin consumidores— a
`usualDurationsByActivityId`, que ya existía desde FEAT-011.

Los dos casos que probaban el criterio 91 **no se borraron**: siguen en
`src/features/vida/utils/vida-patterns.utils.test.ts`, midiendo lo mismo por la
puerta que queda. El criterio **92** («sin cuatro datos, ni etiqueta ni hueco
reservado») sigue vigente tal cual.
