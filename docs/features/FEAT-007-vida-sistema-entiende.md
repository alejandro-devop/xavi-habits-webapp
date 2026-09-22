---
id: FEAT-007
title: Lo que se repite — adherencia, patrones por actividad y avisos con tus propios datos
status: specified
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

*(pendiente)*

## 3. Construcción — feature-builder

*(pendiente)*

## 4. Revisión — feature-reviewer

*(pendiente)*
