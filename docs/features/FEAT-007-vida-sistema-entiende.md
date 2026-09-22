---
id: FEAT-007
title: Lo que se repite — adherencia, patrones por actividad y avisos con tus propios datos
status: planned
architect: yes
area: features/vida
requested: 2026-09-21
updated: 2026-09-21
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
| 1 | **La sección existe y cuenta tu adherencia.** Tercera sección en Revisión («Lo que se repite»), con la frase, las semanas en fracción, los días de la semana con su umbral y la espera con fechas cuando no hay bastante. Solo lectura: ni una sugerencia todavía. Criterios 64–73, 101–104. | pending |
| 2 | **Los patrones por actividad, con sus dos salidas.** Tarjeta por actividad, la que va bien que no propone nada, la pregunta con el número dentro, el `vidaItemUpdate` que cambia la plantilla sin tocar ningún día armado, «Dejarlo» guardado en el aparato con la regla de las 4 semanas, y el estado de pocos datos del marco F. Criterios 74–86. | pending |
| 3 | **El aviso llega al planear.** En Hoy, dos avisos como mucho pegados a su bloque, con sus dos salidas, y la duración habitual en los chips del hueco. Criterios 87–94. | pending |
| 4 | **El dato donde se edita, y el escritorio.** La línea bajo «A qué hora» y bajo «Cuánto» en la hoja de la plantilla, y en escritorio la rejilla con el lateral de «Sin contestar», «Contestadas» y «De dónde sale todo esto». Criterios 95–100. | pending |

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
| 1 | **La sección existe y cuenta tu adherencia.** Ventana de 6 semanas, derivado de adherencia y tercera sección de Revisión, solo lectura. | **Crea:** `hooks/useVidaHistoryWindow.ts` (+test), `utils/vida-adherence.utils.ts` (+test), `components/VidaAdherenceSummary/`, `VidaAdherenceWeeks/`, `VidaAdherenceWeekdays/`. **Modifica:** `pages/VidaRevisionPage.tsx` (:87, :179, :~455 el control con `Tabs`, :~511 la rama, :945 `VidaPatternsSection`), su `.module.scss` y `.test.tsx`, `utils/vida-date.utils.ts` (+test), `utils/vida-window.utils.ts:39`, `vida-vocabulary.test.ts:56` | 64-73, 101-104 | pending |
| 2 | **Los patrones por actividad, con sus dos salidas.** Tarjeta, pregunta con el número dentro, `vidaItemUpdate`, «Dejarlo» con la regla de las 4 semanas, marco F. | **Crea:** `utils/vida-patterns.utils.ts` (+test), `hooks/useVidaPatterns.ts` (+test), `components/VidaPatternCard/`. **Modifica:** `store/vida-device-notes.store.ts` (`patternAnswers`), `pages/VidaRevisionPage.tsx` (`VidaPatternsSection` + la condición simétrica en :1003), `.module.scss`, `.test.tsx` | 74-86 (+101, 104) | pending |
| 3 | **El aviso llega al planear.** Dos avisos pegados a su bloque en Hoy y la duración habitual en los chips del hueco. | **Crea:** `components/VidaBlockHint/`. **Modifica:** `pages/VidaHoyPage.tsx:~551` + `.module.scss` + `.test.tsx`, `components/VidaAgendaGap/VidaAgendaGap.tsx:111-150`, `utils/vida-agenda.utils.ts:423,473` (lookup opcional de duración habitual, por defecto vacío para que el criterio 92 sea cierto por construcción), `utils/vida-patterns.utils.ts` (`pickBlockHints`) | 87-94 (+101, 104) | pending |
| 4 | **El dato donde se edita, y el escritorio.** Líneas bajo «A qué hora» y «Cuánto», y la rejilla con su lateral. | **Crea:** `components/VidaPatternsAside/`. **Modifica:** `components/VidaActivitySheet/VidaActivitySheet.tsx:472,504,517` + `.module.scss` + `.test.tsx`, `pages/VidaPlantillaPage.tsx` (monta la ventana diferida y pasa `pattern` a la hoja), `pages/VidaRevisionPage.tsx` (rejilla + lateral con `isDesktop`, :172) | 95-100 (+101, 104) | pending |

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

*(pendiente)*

## 4. Revisión — feature-reviewer

*(pendiente)*
