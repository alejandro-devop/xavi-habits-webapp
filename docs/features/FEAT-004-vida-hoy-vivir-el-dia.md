---
id: FEAT-004
title: Hoy — vivir el día: lo real encima de lo planeado, con cronómetro y registro
status: building
architect: yes    # concepto nuevo (la sesión viva y su cruce con el plan), superficie global en todo el módulo, y una decisión abierta que puede tocar el API
area: features/vida
requested: 2026-09-20
updated: 2026-09-20   # tajada 3 `in-review`: registrar lo que se sale
---

# FEAT-004 — Hoy — vivir el día: lo real encima de lo planeado, con cronómetro y registro

## 1. The request — feature-analyst

**Summary for whoever's next:** F3 del plan de Vida, sobre la misma pantalla que
dejó FEAT-003. `/app/vida/hoy` deja de ser solo el plan y pasa a enseñar **lo
que pasó encima de lo que se planeó**: empezar un bloque abre una **sesión con
cronómetro** visible desde cualquier pantalla del módulo, terminarla la
registra, y cada bloque planeado cuenta lo suyo (*calcado · +N min · empezó +N ·
−N min · no hecho · fuera del plan · sin dato · movido*), y un bloque que no se
hizo ofrece **tres salidas**: «Lo hice», «Hice otra cosa» y «No se pudo». La
primera tajada es **empezar y terminar un bloque**: con eso solo, el día ya queda
registrado. **Las diez decisiones están respondidas y el API no se toca.**

**What problem it solves:** el usuario ya puede decir a qué hora quiere hacer
cada cosa (FEAT-003), pero **su día no se parece nunca del todo a eso** — se
levanta tarde, le entra una llamada, el paseo de las 19:00 cae a las 19:40 — y
hoy no tiene dónde dejar constancia de lo que sí pasó. El problema no es «falta
un cronómetro»: es que **cuadrar lo vivido con lo planeado, a mano, cuesta más
que vivirlo**, y cualquier herramienta que le obligue a *encajar* la realidad en
el plan (mover el bloque, borrarlo, fingir que lo hizo a su hora) acaba
abandonada. Lo que hace falta es que el plan se quede quieto en su hora y lo real
se pinte encima, incluido lo que no estaba y lo que no se hizo, **sin que nada de
eso suene a reproche**. Y hay un segundo problema, del que depende todo lo que
viene después: sin registro no hay comparación, y sin comparación F5 («revisar»)
y F6 («el sistema entiende») no tienen de qué hablar.

**Who it's for:** el usuario del módulo Vida, **durante el día** (empezar una
cosa, ver el cronómetro mientras la hace, terminarla; registrar de una sentada la
media tarde que se le fue en otra cosa) y **al final del día o al día siguiente**
(rellenar lo que no registró con «Lo hice» y «¿qué pasó?», y leer de un vistazo
qué se siguió y qué no). Es la misma pantalla que más abre del módulo.

**User's words:** el pedido original del módulo, del 2026-09-18, es el que
enmarca esta fase entera:

> «Como siempre me soñé el módulo de actividades y follow-ups: es más como una
> plantilla de mi vida, donde planeo día a día lo que voy a hacer y **puedo
> seguir la plantilla o registrar lo que se sale**, y al final del día evaluar
> cómo me va. Con el tiempo el sistema entiende y me ayuda mejor a planear.»

Y, al decidir cómo funciona la plantilla (FEAT-003, D6), dijo exactamente para
qué quiere esto:

> «Prefiero hacer una actividad a un tiempo más tarde de lo que estaba porque me
> levanté tarde o porque empecé tarde, o antes si tengo tiempo. **La planeación
> no es una regla rígida**, es una plantilla de lo que quiero que sea mi día,
> pero también quiero **ver el vs de lo planeado con lo ejecutado** para
> posteriormente evaluar qué puedo cambiar; ejemplo: no me está dando hacer
> ejercicio en las mañanas porque necesito dormir más».

**No hay una frase nueva del usuario para esta fase**, y queda dicho en vez de
inventada: lo que hay es el **render aprobado**. El 2026-09-20 volvió a ver
`docs/vida/assets/04-vida-planeado-ejecutado.html`, **marco B («Hoy, casi
terminado»)**, y confirmó que así es como quiere ver su día vivido. Ese marco y
sus notas al pie **son parte de la spec**; el **marco A** y el render
`03-vida-agenda.html` (agenda base, sesión en marcha con «Terminar» y cronómetro,
leyenda *hecho · en marcha · planeado · libre*) siguen mandando en lo que ya
construyó F2. Se abren en
`http://localhost:5173/docs/vida/assets/04-vida-planeado-ejecutado.html` y
`…/03-vida-agenda.html`.

**Dos cosas del render no entran, aunque estén dibujadas**, por decisiones ya
tomadas: las etiquetas que salen del historial («4 de 5 días», «a tu ritmo
real», «sueles tardar 55 min») son **F6** (FEAT-003, D1), y el marco C —la
semana con «Seguiste N de M» por día— es **F5**.

**Out of scope:** (lo que alguien podría dar por incluido y NO lo está)

- **Revisar el día (F5).** `/app/vida/revision` sigue siendo un cascarón: ni
  plan frente a real por categoría, ni la historia del día en prosa, ni el
  resumen de la semana con «Seguiste N de M» en `/app/vida/semana` (que hoy dice
  lo **planeado**, criterio 40 de FEAT-003, y se queda así). F3 **registra y
  enseña el día**; leerlo como balance es F5.
- **«El sistema entiende» (F6).** Nada se deriva del historial de otras semanas:
  ni «sueles tardar N», ni «a tu ritmo real», ni «4 de 5 días», ni avisos al
  planear.
- **El panel «Cómo va el día» del lateral de escritorio.** FEAT-003 lo mandó a
  «F3/F5» (su D8) y **aquí no entra**: el presupuesto de arriba ya cuenta el día
  vivido (tajada 2) y un segundo panel con las mismas cifras es trabajo doble.
  Se anota para F5.
- **Ejercicio, tareas y standup.** `linkedTodoId` existe en el API y **no se
  usa**; ningún enlace a entrenamiento. Es «lo que se enlaza después» del plan.
- **Crear o gestionar subtareas.** Si una sesión trae `sessionSubtasks` se
  marcan y se desmarcan; **no se crean** desde aquí, ni se pinta una sección
  vacía cuando no hay. El catálogo (F1) dejó las subtareas fuera a propósito, así
  que hoy es un caso que casi no ocurre.
- **Cambiar el plan para que cuadre con lo real.** Ni mover automáticamente un
  bloque a la hora en que se hizo, ni borrarlo porque no se hizo, ni «aceptar el
  cambio». El plan se queda quieto y lo real se pinta encima: es justo lo que
  pide el usuario.
- **Editar el plan de un día pasado.** FEAT-003 (D3) lo cerró y sigue cerrado:
  en un día pasado se **registra** (esta feature), no se planea.
- **Plegar la mañana en una línea** («Mañana temprano · 3 hechas», nota del
  render 03). La agenda sigue abriendo en «Ahora» como la dejó F2 y no se pliega
  nada.
- **Pausar y reanudar una sesión.** El API no lo modela (una sesión es
  `startTime` + `durationMinutes`, y abierta significa `durationMinutes = null`).
  No se simula en cliente.
- **Dos sesiones a la vez.** `activityOpenFollowUp` devuelve **una**; qué pasa al
  empezar otra es D4, pero en ningún caso habrá dos cronómetros.
- **Notificaciones, alarmas, sonidos y recordatorios** al pasarse del tiempo
  planeado. El bloque lo dice; nada interrumpe.
- **Uso sin conexión.** Los inputs del API admiten `clientId` para idempotencia
  offline; **no se usa** en esta feature.
- **Nuevas pantallas.** Todo cae en `/app/vida/hoy` (y la barra de sesión, que se
  ve en las demás pantallas del módulo). No hay ruta nueva.
- **Métricas de tiempo por categoría** y cualquier cifra agregada de la semana.
- **Deshacer general.** Lo que se pueda deshacer se dice en su criterio (el
  «Lo hice», la sesión empezada por error); no hay pila de deshacer.

**Acceptance criteria:**

*Empezar, el cronómetro y la sesión abierta (tajada 1)*

- [ ] 1. En el día de **hoy**, un bloque del plan que no está en marcha ni
  registrado trae **«▶ Empezar»**. En un **día futuro** no lo trae (no se empieza
  lo que no ha llegado) y en un **día pasado** tampoco: ahí se registra
  (tajada 4).
- [ ] 2. «Empezar» crea la sesión con `activityFollowUpStart` (`activityId` del
  bloque, `date` = la fecha **local** del día, `startTime` = la hora actual en
  `HH:mm`) y la pantalla pasa a «en marcha» **sin recargar**.
- [ ] 3. El bloque en marcha se lee **«planeado 45 min · en marcha»** con el
  **cronómetro** al lado. El cronómetro cuenta desde el `startTime` de la sesión
  —no desde que se montó el componente—: **recargar la página no lo reinicia**, y
  volver de otra pestaña enseña el tiempo real transcurrido (se calcula con
  `Date.now()` contra la hora de inicio, no acumulando tics).
- [ ] 4. El cronómetro avanza **al menos una vez por segundo** mientras se ve, y
  al desmontarse **no deja ningún intervalo vivo**.
- [ ] 5. **«Terminar» es un solo toque** (D2): cierra la sesión con los minutos
  del cronómetro (`activityFollowUpEdit` con `durationMinutes`, mínimo 1 — el API
  rechaza menos), el bloque deja de estar en marcha, y **no se pregunta nada**.
  El toast que confirma trae **«añadir una nota»**, que abre el cierre completo
  del criterio 6 sobre la sesión recién cerrada.
- [ ] 6. **El cierre completo** (D2) vive en el **«···»** del bloque —en marcha o
  ya cerrado— y en la barra de sesión: **duración ajustable**, **notas en texto
  plano** (sin editor enriquecido; no vuelve tiptap) y las **subtareas** si las
  hay. Es el mismo sitio al que lleva el «añadir una nota» del toast. Guardar usa
  `activityFollowUpEdit`.
- [ ] 7. **La sesión abierta se ve desde cualquier pantalla del módulo Vida**
  (Hoy, Actividades, Categorías, Semana, Ajustes): una barra fija con el nombre
  de la actividad, el cronómetro y «Terminar»; un toque en el nombre lleva a Hoy,
  al bloque. **Fuera del módulo Vida** (hábitos, ajustes de cuenta, portada) no se
  pinta nada.
- [ ] 8. Esa barra sale de **una sola** consulta `activityOpenFollowUp`
  (`vidaKeys.followUps.open()`, ya cacheada): no se pide una vez por pantalla. Al
  cerrar la sesión desaparece sin recargar.
- [ ] 9. Cuando la sesión **se pasa del tiempo planeado**, el bloque y la barra
  lo dicen sin interrumpir («llevas 52 min · planeado 45»): ni modal, ni alarma,
  ni sonido, ni color de alarma. Nadie corta el trabajo.
- [ ] 10. Si tiene **subtareas** (`sessionSubtasks`), se ven en la sesión abierta
  y se marcan y desmarcan con `activityFollowUpSubtaskEdit`, con su cuenta
  («2 de 5»). Si no tiene, **no se pinta ninguna sección de subtareas**.
- [ ] 11. Empezar y terminar dejan la agenda y el presupuesto al día **sin
  recargar**, con las invalidaciones que ya existen
  (`invalidateFollowUpQueries`).
- [ ] 12. Si `activityFollowUpStart` falla, se ve el error, el bloque **no se
  queda en marcha** y se puede reintentar. Si falla el cierre, el modal **no se
  cierra ni pierde las notas** y la sesión **sigue abierta**: no se pierde el
  registro.
- [ ] 13. Tocar «Empezar» dos veces seguidas **no crea dos sesiones** (el botón
  queda inhabilitado mientras la mutación está en vuelo).
- [ ] 14. Una sesión **empezada por error** se puede descartar desde el propio
  cierre con un texto sin culpa («No era esto — no guardarla»), con
  `activityFollowUpRemove`. Los toasts heredados **«Actividad cancelada»** y
  **«Registro eliminado»** (`useDeleteActivityFollowUpMutation`) se reescriben:
  en Vida no se usa «cancelar» ni «eliminar» (criterio 46).
- [ ] 15. **Empezar algo con otra cosa en marcha** (D4): se **cierra la
  anterior** a la hora en que empieza la nueva —`durationMinutes` = los minutos
  entre su inicio y ese momento— y **se dice** («Terminamos "Organizar la casa" a
  las 10:08»). Si el cierre de la anterior **falla**, la nueva **no se empieza** y
  se explica: nunca quedan dos abiertas ni se pierde la primera.
- [ ] 16. **Sesión que quedó abierta de otro día** (D3): al entrar en cualquier
  pantalla del módulo **no se pinta un cronómetro corriendo desde ayer**; se
  pregunta **«Dejaste "Organizar la casa" en marcha ayer a las 21:00 · ¿hasta qué
  hora la hiciste?»**, con la hora a mano para escribirla y una salida **«No sé»**
  que registra algo razonable **y lo dice** (hipótesis del arquitecto, nombrada en
  una constante: hasta la hora de fin del día de aquel día, o la duración
  planeada del bloque si lo tenía). Nunca aparece «cancelar» y **nunca se pierde
  en silencio**. Mientras no se responda no se puede empezar otra cosa —el API
  solo admite una sesión abierta— y **la pregunta lo explica**.
- [ ] 17. La hora que se guarda al empezar es **la del reloj en ese momento**, no
  la hora planeada del bloque: empezar a las 9:05 un bloque de las 9:00 registra
  9:05.

*Lo real encima de lo planeado, y el presupuesto por colores (tajada 2)*

- [ ] 18. En un día ya vivido (hoy o pasado), cada bloque planeado **se queda en
  su hora** y enseña encima lo que pasó; la agenda sigue ordenada por hora.
- [ ] 19. **El cruce entre lo real y lo planeado se hace en el cliente** (D1),
  sin tocar el API: una sesión es «de» un bloque si comparten `activityId` y su
  hora de inicio cae a menos de `VIDA_MOVED_THRESHOLD_MINUTES` de la planeada.
  Cada sesión se asigna **como mucho a un bloque** y cada bloque **como mucho a
  una sesión**; con **dos bloques de la misma actividad el mismo día**, la sesión
  va al **más cercano en hora que todavía no tenga una asignada**. Lo que sobre
  se pinta fuera del plan (criterio 22). El cruce es una función **pura** y se
  prueba con casos, incluido el de los dos bloques iguales.
- [ ] 20. **Los dos umbrales son constantes con nombre** (D6), en un solo sitio:
  `VIDA_ON_PLAN_TOLERANCE_MINUTES = 5` y `VIDA_MOVED_THRESHOLD_MINUTES = 60`. Un
  bloque es **✓ calcado** si el inicio y la duración caen dentro de ±5 min; si
  no, se leen **«empezó +N»** / **«empezó −N»** y **«+N min»** / **«−N min»** con
  los minutos reales, y al lado las **horas reales** («7:31 – 8:12»).
- [ ] 21. Cuando plan y real difieren, debajo del bloque va la **barrita plan
  frente a real** con su texto («plan 30 · real 41»): el número se lee como
  **texto real**, no solo como color ni en un `title`.
- [ ] 22. Una sesión que **no corresponde a ningún bloque** del plan se pinta en
  su hora como **fuera del plan** (punteado), con su actividad, sus horas y su
  duración. **No se descarta ni se encaja a la fuerza** en un bloque.
- [ ] 23. El **movido**: una sesión de la misma actividad a **más de 60 min** de
  su hora planeada deja el bloque como **sombra en la hora planeada** con «→ hecho
  a las 19:40», y lo real se pinta **donde ocurrió** con «40 min tarde». Es **una
  sola cosa contada una vez**: no suma dos veces ni en la leyenda ni en el «N de
  M».
- [ ] 24. **El presupuesto tiene dos formas** (D5), y no se mezclan: mientras el
  día está **en marcha**, los tramos son *hecho · en marcha · planeado · libre*
  (render 03); cuando el día ya **terminó** —pasada la hora de fin de los ajustes
  de Vida, o en cualquier día pasado— son *seguido · de más · fuera del plan ·
  sin dato* (render 04-B). Cada tramo con **sus minutos** en la leyenda.
- [ ] 25. **El cambio de una forma a la otra se explica**: cuando el día se
  cierra, una línea lo dice («tu día ya terminó: esto es lo que pasó»). La barra
  no cambia de colores en silencio.
- [ ] 26. Los anchos de la barra **suman el 100 %** también con ejecutado encima
  (es el fallo que ya se cazó en FEAT-003 con bloques solapados), y la leyenda,
  la barra y lo que se ve en la agenda **dicen los mismos minutos**.
- [ ] 27. En un día de **hoy** sigue la marca de «ahora» donde la dejó FEAT-003;
  en un **día pasado** no hay marca, y en un **día futuro** no se pinta **nada**
  de ejecutado.
- [ ] 28. Lo real sale de **`activityDayFollowUps(date)`** del día mostrado
  (`useActivityDayFollowUpsQuery`, que ya está deshabilitada en días futuros).
  Ninguna consulta nueva por bloque.
- [ ] 29. **Ningún número de ejecutado sale del historial de otras semanas**:
  «4 de 5 días», «a tu ritmo real» y «sueles tardar N min» siguen siendo F6,
  aunque estén dibujados en el render. Y un día **con plan y nada registrado** se
  ve exactamente como lo dejó F2 —bloques, huecos, sin etiquetas de ejecutado— y
  la leyenda **no inventa tramos de cero**.

*Registrar lo que se sale (tajada 3)*

- [ ] 30. Desde Hoy hay **«Empezar algo»** que no está en el plan: se elige qué
  —primero la plantilla de ese día, luego un buscador sobre las actividades no
  archivadas, **el mismo molde de la hoja de FEAT-003**— y arranca la sesión
  ahora mismo. **No pide duración**: una sesión abierta no la tiene.
- [ ] 31. **«Registrar tiempo pasado»**: qué, a qué hora empezó y cuánto duró
  (píldoras **15 · 30 · 45 · 1h · libre**, reutilizando `VidaDurationPills`), con
  `activityFollowUpAdd`.
- [ ] 32. **Se registra en cualquier día que se pueda abrir en la tira** (D10):
  desde el **lunes de esta semana** hasta el borde de la ventana de FEAT-003,
  **incluidos los días pasados**, aunque el **plan** de esos días siga sin poder
  editarse (FEAT-003, D3). En un día pasado hay «Registrar tiempo pasado» y **no**
  hay «Empezar algo» (no se empieza en el pasado); en un día futuro, ninguno de
  los dos.
- [ ] 33. Lo registrado aparece en la agenda **en su hora** —como «fuera del
  plan» si no corresponde a ningún bloque— y el presupuesto se actualiza sin
  recargar.
- [ ] 34. Registrar **no exige** que la actividad esté en el plan ni en la
  plantilla: vale cualquiera del catálogo que no esté archivada. Si no existe,
  **no se crea desde aquí**: se enlaza a `/app/vida/actividades` (igual que hizo
  FEAT-003).
- [ ] 35. Una sesión registrada se puede **corregir** (hora, duración, notas) con
  `activityFollowUpEdit` y **quitar del registro** con `activityFollowUpRemove`,
  con confirmación que nombra qué se quita y salida **«Volver»**. En pantalla,
  nunca «cancelar» ni «eliminar».
- [ ] 36. Si la mutación falla, se ve el error, la hoja **no se cierra ni pierde
  lo elegido** y en la agenda **no queda una sesión fantasma**.
- [ ] 37. **Registrar no toca el plan**: no crea, no mueve y no quita ningún
  bloque del `activityDayPlan`. Lo real va encima; el plan se queda quieto.
- [ ] 38. **La hoja de «qué» se escribe una vez**: la misma que usan «Empezar
  algo», «Registrar tiempo pasado» y, en la tajada 4, «Hice otra cosa» y el
  «¿Qué pasó?» de un tramo sin dato. No hay dos buscadores de actividad.

*Lo que falta: pendiente, las tres salidas, sin dato y la frase de cierre (tajada 4)*

- [ ] 39. **Dos momentos, no uno** (D9): un bloque sin sesión pasa a **«pendiente»**
  al pasar su hora de fin —sin reproche, sin color de alarma— y solo se lee **«no
  hecho»** cuando **el día se cierra** (la hora de fin de los ajustes de Vida) o
  en cualquier día pasado.
- [ ] 40. Un bloque **pendiente o no hecho** ofrece **tres salidas**, las tres a
  un toque, ninguna obligatoria y ninguna con más peso visual que otra:
  **«Lo hice»**, **«Hice otra cosa»** y **«No se pudo»**.
- [ ] 41. **«Lo hice»** (D7) crea la sesión con **la hora y la duración
  planeadas** (`activityFollowUpAdd`) y el bloque pasa a hecho **sin recargar**.
  Como la hora puede no haber sido esa, queda **ajustable** desde el «···» (hora,
  duración, notas, criterio 6) y **se puede deshacer** desde el mismo sitio, lo
  que quita esa sesión y devuelve el bloque a no hecho.
- [ ] 42. **«Hice otra cosa»** (D7) abre la hoja de «qué» (criterio 38) y
  **registra esa otra actividad en el tramo del bloque** —su hora y su duración,
  ajustables antes de guardar—. El bloque planeado **queda como no hecho pero
  explicado**: en su sitio se lee **«en su lugar, Llamada con el banco»**, con la
  vía a la sesión que sí ocurrió. **Ni se borra el bloque ni se reescribe el
  plan.**
- [ ] 43. **«No se pudo»** (D7) deja el bloque **no hecho, explicado y sin
  reproche**, con una **razón opcional en texto plano** («me quedé dormido») que
  se lee en una línea corta bajo el bloque y **se puede cambiar o quitar**
  después. No pedir la razón es una respuesta válida.
- [ ] 44. **Dónde se guarda esa razón:** el API **no tiene campo para ella**
  (`ActivityDayPlanItem` solo lleva `completedAt`), así que se guarda **en el
  aparato**, igual que D8, y **la pantalla lo dice** en una línea discreta la
  primera vez («esta nota se queda en este dispositivo»). **No se inventa un
  campo en el API** ni se mete la razón en las notas de otra sesión.
- [ ] 45. Las tres salidas se distinguen en la agenda **de un vistazo y por
  texto**, no solo por color: hecho, «en su lugar, X», y «no se pudo» con o sin
  razón. Un lector que no construyó esto sabe cuál es cuál sin preguntar.
- [ ] 46. Las tres salidas **funcionan en un día pasado** (D10) aunque el plan de
  ese día no se pueda editar: en un día pasado hay botones de **registro** y
  **ninguno** de plan.
- [ ] 47. **Sin dato:** los tramos ya pasados sin plan y sin sesión se pintan con
  sus horas y sus minutos y se llaman **«sin dato»** — nunca «desperdiciado»,
  «perdido», «vacío» ni «libre» (libre es el futuro; sin dato es el pasado del
  que no se sabe).
- [ ] 48. Un tramo sin dato de al menos **30 min** (hipótesis) ofrece **«¿Qué
  pasó?»**, con dos salidas igual de válidas: **registrar** lo que se hizo (la
  hoja de la tajada 3, con la hora y la duración del tramo **ya puestas**) o
  **«dejarlo así»**.
- [ ] 49. **Se pregunta una vez** (D8): tras «dejarlo así», ese tramo **no vuelve
  a preguntar** ese día en **ese aparato** —se recuerda en el navegador, por día
  y tramo—, y el tramo **sigue siendo «sin dato»**: no cambia de color ni
  desaparece. En otro dispositivo **volverá a preguntar**, y eso es conocido y
  aceptado (ver «Deuda de portabilidad»).
- [ ] 50. El tiempo del día que **aún no ha llegado** no se pregunta ni se llama
  «sin dato»: es planeado o libre.
- [ ] 51. **La frase de cierre del día:** en un día terminado (o pasado), el
  presupuesto lo resume con **números reales** y **sin reproche**, al estilo del
  render: «Seguiste 6 de 7. La casa se te fue 18 min, la tarde se llenó de cosas
  que no estaban, y queda leer antes de cerrar.» **Lo explicado se nombra como
  explicado**: los bloques con «en su lugar…» y los de «no se pudo» cuentan como
  no hechos **con explicación** y la frase lo dice así («el desayuno no se pudo, y
  en su lugar hiciste la llamada»). Tiene variante propia para: día sin nada
  registrado, día sin plan pero con sesiones, y día en el que se siguió todo.
  Ninguna usa una palabra de culpa, y toda cifra que hable de fallo lleva al lado
  la que habla de vuelta.
- [ ] 52. **Criterio de fase, y lo comprueba el usuario:** un día vivido a medias
  —tres bloques seguidos, uno movido, uno que no se pudo, uno en el que se hizo
  otra cosa, dos cosas fuera del plan y un tramo sin dato— **queda registrado sin
  tener que encajar nada** (sin mover ni quitar un solo bloque del plan), y al
  final la pantalla dice **de un vistazo** qué se siguió, qué no, y qué pasó en su
  lugar.

*Estados — los que no se piden y siempre hacen falta*

- [ ] 53. **Día sin plan pero con sesiones:** la agenda enseña las sesiones en su
  hora, el presupuesto las cuenta, y el texto de «aún no hay plan» **no se lee
  como reproche** ni tapa lo que sí se hizo.
- [ ] 54. **Sesión abierta desde ayer:** criterio 16, y además: no se pinta un
  cronómetro de 14 horas como si fuera normal, se dice **de qué día es**, y lo
  único que la pregunta bloquea es **empezar otra cosa** — el resto de la pantalla
  se puede usar.
- [ ] 55. **Bloque en marcha que se pasa del plan:** criterio 9, y además el
  bloque **no se mueve de su hora** ni empuja a los siguientes mientras dura.
- [ ] 56. **Día pasado:** se registra (criterios 32 y 46) y **no** se planea: cero
  botones de plan, como dejó FEAT-003.
- [ ] 57. **Cargando:** mientras las consultas del día están en vuelo **no se
  afirma nada**: ni «pendiente», ni «no hecho», ni «sin dato», ni «fuera del
  plan». Esqueleto o indicador, como en F2.
- [ ] 58. **Error de carga de lo real:** si falla `activityDayFollowUps` y el plan
  sí carga, se dice **que falta lo vivido** y el plan se sigue viendo; **no se
  afirma «no hecho»** de lo que no se pudo comprobar (es el hallazgo que ya
  devolvió una tajada de FEAT-003: nada afirma lo que no sabe). Botón de
  reintentar.
- [ ] 59. **Lenguaje:** en ninguna pantalla aparecen «desperdiciado», «perdiste»,
  «fallaste», «desperdicio», ni «vacío» como reproche; ni «cancelar» o «eliminar»
  referidos a una sesión o a un bloque — **incluidos los toasts heredados** de
  `useDeleteActivityFollowUpMutation` (criterio 14). «Pendiente», «no hecho»,
  «no se pudo» y «sin dato» son descripciones, y **todas tienen salida**.
- [ ] 60. **Móvil a 375 px:** sin scroll horizontal con la sesión abierta; la
  barra fija **no tapa** el último bloque de la agenda ni los botones de una hoja
  abierta (hay hueco reservado abajo), y el cronómetro no empuja el nombre fuera
  de la tarjeta. Las tres salidas del criterio 40 caben en un bloque de 375 px
  sin desbordar.
- [ ] 61. **Texto largo:** un nombre de ~60 caracteres no rompe la barra de
  sesión, el bloque en marcha, la sombra del movido, el «en su lugar, X» ni el
  modal de cierre, y no produce scroll horizontal. Una razón de «no se pudo» de
  tres líneas tampoco.
- [ ] 62. **Tema oscuro:** los tramos de las **dos** leyendas (hecho · en marcha ·
  planeado · libre, y seguido · de más · fuera del plan · sin dato) se distinguen
  **entre sí** y del fondo, y el violeta de «en marcha» **se distingue de la marca
  de "ahora"** (hallazgo abierto de FEAT-003: hay dos violetas distintos en
  oscuro; si hace falta un token nuevo, se anota, no se improvisa).
- [ ] 63. **Fecha y hora locales:** lo que se manda al API es el `YYYY-MM-DD`
  local y `HH:mm` de 24 h. Una sesión empezada a las 23:50 y terminada a las
  00:10 **no se registra en el día equivocado ni con duración negativa**: se
  cierra con la duración real y se ve en pantalla en qué día quedó.
- [ ] 64. **Sin sesión de usuario:** con las consultas deshabilitadas por
  `useVidaQueryGuard`, ni la barra de sesión ni la agenda **pintan un spinner
  eterno**.
- [ ] 65. **Línea base no empeorada** (`docs/features/ENVIRONMENT.md`):
  `pnpm typecheck` limpio, `pnpm lint` no peor que 14 errores / 0 warnings,
  `pnpm test` sin fallos nuevos sobre los 2 preexistentes, el chunk inicial no
  crece por iconos, se cierra con **`pnpm build`** (no solo `typecheck`), y
  **todo documento GraphQL nuevo o modificado entra en la lista de**
  `src/features/vida/graphql/contracts.test.ts`.
- [ ] 66. **Solo el usuario puede cerrarlo, con la API despierta** (Render se
  duerme a los 15 min y tarda ~1 min en despertar): el recorrido real entero con
  su cuenta — empezar un bloque → ver el cronómetro en otra pantalla del módulo →
  pasarse del tiempo → terminar de un toque y añadir la nota desde el toast →
  empezar algo con la anterior en marcha → dejar un bloque sin hacer y probar las
  **tres salidas** («Lo hice», «Hice otra cosa», «No se pudo» con razón) →
  responder «¿qué pasó?» en un tramo sin dato y volver a entrar para comprobar
  que **no vuelve a preguntar** → registrar un rato pasado en un día de atrás →
  leer el día entero al final. Los agentes verifican con tests y arneses; esto
  queda dicho, no disimulado.

**Slices:** (vertical, cada una usable sola)

| # | What it does | State |
|---|---|---|
| 1 | **Empezar y terminar un bloque, con cronómetro y la sesión visible en el módulo.** «▶ Empezar» en un bloque de hoy → sesión abierta (`activityFollowUpStart`) con cronómetro que sobrevive a una recarga; **«Terminar» de un toque** y el cierre completo (duración, notas en texto plano, subtareas) desde el «···»; barra fija con la sesión en marcha en todas las pantallas de Vida; el aviso de «te pasaste» sin interrumpir; empezar otra cosa cierra la anterior y lo dice; la sesión que quedó abierta de ayer se pregunta; descartar una empezada por error. **Ya es útil sola:** el día empieza a quedar registrado aunque la agenda todavía no lo pinte como comparación. | pending |
| 2 | **Lo real encima de lo planeado, y el presupuesto por colores.** El cruce en cliente (D1), cada bloque con lo suyo (calcado · +N · −N · empezó +N) y su barrita plan-frente-a-real, lo que no estaba en el plan en su hora como «fuera del plan», el movido con su sombra, y el presupuesto con sus **dos formas** (día en marcha / día terminado) y sus minutos. Primera vez que el usuario **ve** el día vivido contra el planeado. | pending |
| 3 | **Registrar lo que se sale.** «Empezar algo» que no está en el plan, «Registrar tiempo pasado» con las píldoras de duración en cualquier día de la tira (D10), corregir y quitar un registro. Aquí nace **la hoja de «qué»** que la tajada 4 reutiliza entera. | pending |
| 4 | **Lo que falta: pendiente, las tres salidas, sin dato y la frase de cierre.** «Pendiente» al pasar la hora y «no hecho» al cerrar el día (D9); las tres salidas de un bloque no hecho —«Lo hice», «Hice otra cosa», «No se pudo» (D7)—; los tramos «sin dato» con su «¿qué pasó?» que se pregunta una vez (D8); y la frase que resume el día sin reproche. Cierra el criterio de fase. | pending |

**Por qué este orden, y por qué cambió:** la 1 no necesita nada de la
comparación (una sesión se empieza y se cierra aunque la agenda todavía no sepa
pintarla) y trae la pieza que no existe en el repo, el cronómetro; la 2 es **solo
lectura** sobre lo que la 1 ya escribe, así que se ve entera con un arnés y datos
sintéticos. **La 3 y la 4 están cambiadas respecto a la primera versión de este
dossier**, y es por la respuesta del usuario a D7: «Hice otra cosa» necesita
**elegir otra actividad y registrarla**, que es exactamente la hoja de «Registrar
tiempo pasado». Con el orden anterior, la tajada de rescate habría tenido que
construir la hoja de la siguiente. Ahora la 3 la escribe y la 4 la usa cuatro
veces (las tres salidas y el «¿qué pasó?»). **Si el arquitecto ve que la barra de
sesión global (criterio 7) arrastra el layout del módulo más de lo previsto, que
lo diga antes de planificar**: es lo único de la tajada 1 que sale de
`src/features/vida/pages/VidaHoyPage.tsx`.

**Architect? yes** porque esto **introduce un concepto que no existe en la web
hoy: la sesión viva**, y con ella tres cosas que no son «un campo más en un
formulario»:

1. **La capa de follow-ups está escrita (F0) y no la usa ni una pantalla.**
   `hooks/useActivityFollowUps.ts`, `api/activity-followups.api.ts`,
   `graphql/activity-followups.graphql.ts` y
   `types/activity-followup.types.ts` existen desde FEAT-001 y **están sin
   estrenar**: hay que comprobar documento por documento que piden lo que esta
   feature necesita (`isOpen`, `endTime`, `sessionSubtasks`,
   `sessionSubtasksCount`) y meterlos en `contracts.test.ts` si cambian.
2. **Hay una superficie global**: la barra de sesión en **todas** las pantallas
   del módulo (criterio 7) toca el layout de Vida, no una página. Dónde vive
   —`AppLayout`, un layout propio de `/app/vida`, o un portal— es decisión de
   arquitecto, con `app-nav.config.ts` como **fuente única** de los destinos del
   módulo.
3. **El cruce real ↔ planeado es aritmética nueva y delicada**, y además
   depende de **D1**. `utils/vida-agenda.utils.ts` ya construye la agenda con
   tres variantes (`block · gap · now`); esta feature le añade lo ejecutado, lo
   fuera del plan, el movido y los tramos sin dato. Decidir si eso crece dentro
   de ese archivo o vive en uno hermano (`vida-execution.utils.ts`) se hace una
   vez, no a mitad de tajada.
4. **Hay material rescatable de `79bece0`** que el `ENVIRONMENT.md` y el plan
   nombran, y que **no se restaura entero**: `useElapsedTimer` (el cronómetro
   correcto, con `Date.now()` y no acumulado), los **modales de sesión**
   (iniciar, finalizar, registrar pasado, editar, desde hueco, ~800 líneas) y
   `activity-day-metrics.utils.ts` (**sin** `wasteMinutes`/`wastePercentage`:
   eso es «desperdicio» y está prohibido). Qué se rescata función por función lo
   decide el arquitecto, como hizo en FEAT-003.
5. **Puede haber cambio de API** (D1, D8): el backend ya se tocó una vez con
   permiso expreso y `ENVIRONMENT.md` explica cómo se despliega. Eso no se
   improvisa.

**Lo que ya existe y no se vuelve a construir** (con su ruta, para que nadie lo
escriba dos veces):

- `src/features/vida/hooks/useActivityFollowUps.ts` —
  `useActivityOpenFollowUpQuery`, `useActivityDayFollowUpsQuery(date)` (ya
  deshabilitada en días futuros), `useActivityFollowUpsInDatesQuery`,
  `useStartActivityFollowUpMutation`, `useCreateActivityFollowUpMutation`,
  `useUpdateActivityFollowUpMutation`, `useDeleteActivityFollowUpMutation`. Las
  invalidaciones (`invalidateFollowUpQueries`) y las claves
  (`vidaKeys.followUps.open/day/range`) ya están. **Sus dos toasts usan palabras
  prohibidas** (criterio 14).
- `src/features/vida/api/activity-followups.api.ts`,
  `graphql/activity-followups.graphql.ts`,
  `types/activity-followup.types.ts`.
- **Toda la agenda de F2/F3 de FEAT-003**: `utils/vida-agenda.utils.ts`
  (`buildDayAgenda`, `AgendaEntry` = `block | gap | now`, `getDayBudget`,
  `buildGuidanceLine`, `suggestionsForGap`, `findNextBlockId`,
  `MAX_GAP_SUGGESTIONS`), `utils/vida-time.utils.ts` (`parseTimeToMinutes`,
  `minutesToTime`, `calculateEndTime`, `formatDurationFromMinutes`,
  `DURATION_PILLS`, `DEFAULT_BLOCK_MINUTES`, `MIN_GAP_MINUTES`),
  `utils/vida-gap-form.utils.ts`, `utils/vida-window.utils.ts`,
  `hooks/useVidaDayData.ts`, `hooks/useVidaNowMinute.ts` (tic de 60 s),
  `hooks/useVidaDayHours.ts`, `hooks/useVidaWeekPlans.ts`,
  `components/VidaDayBudget/`, `VidaAgendaBlock/`, `VidaAgendaGap/`,
  `VidaDayStrip/`, `VidaDayActions/`, `VidaTemplateAside/`,
  `VidaDurationPills/`, `VidaPlaceInGapSheet/`, `pages/VidaHoyPage.tsx`,
  `pages/VidaSemanaPage.tsx`.
- La hoja y el buscador para «qué»: `components/VidaPlaceInGapSheet/` y
  `utils/activity-filters.ts` (`filterActivitiesBySearch`). **No se escribe un
  quinto normalizador de texto** (hallazgo abierto desde FEAT-002).
- `hooks/useVidaQueryGuard.ts`, `utils/vida-date.utils.ts`,
  `utils/vida-error.utils.ts`, `utils/invalidate-vida-queries.ts`, y de
  `shared/ui`: `SteppedModal`, `Popover`, `ConfirmDialog`, `Alert`, `Toast`,
  `IconButton`, `Button`, `Card`, `Badge`, `AppIcon`.

**Hipótesis marcadas, técnicas, para que el arquitecto las confirme o las tire**
(no son del usuario y no las tomo yo):

- **«Sesión abierta» = `durationMinutes === null`.** Está así en el servidor
  (`~/Developer/xavi-platform-node/src/services/activity-follow-up.service.ts:61`:
  `const isOpen = row.duration_minutes === null`), y por eso **«Terminar» es
  `activityFollowUpEdit` con `durationMinutes`**, no una mutación propia:
  `useUpdateActivityFollowUpMutation` ya limpia
  `vidaKeys.followUps.open()` cuando la respuesta vuelve con `isOpen: false`.
  Confirmar que el API **impide** dos sesiones abiertas a la vez, y qué error
  devuelve si se intenta (lo necesita D4).
- **`isCompleted` del plan del día escribe `completed_at`** y es reversible:
  `activity-day-plan.service.ts:227-228` hace `completed_at = NOW()` con `true` y
  `completed_at = NULL` con `false`, desde
  `ActivityDayPlanItemEditInput.isCompleted`. Con **D7 resuelto**, «hecho» se
  deriva **de la sesión**, no de esta marca, así que **esta feature puede no
  usarla**; el arquitecto decide si además la escribe (sería un segundo sitio con
  la misma verdad, y dos sitios se contradicen) o la deja quieta. Lo que **sí**
  necesita es un sitio para «no se pudo» y «en su lugar», y **para eso el API no
  tiene nada**: de ahí el criterio 44.
- **No hay nada en el API que ligue una sesión a un bloque del plan**:
  `ActivityFollowUp` tiene `activityId`, no `dayPlanItemId`. Con **D1 resuelto
  (a)**, todo el cruce de la tajada 2 es cliente y **puro**: merece su propio
  archivo de `utils` con su test, y ahí viven los dos umbrales del criterio 20 y
  la regla de desempate del criterio 19.
- El **mínimo de un tramo sin dato** para preguntar «¿qué pasó?»: 30 min (el
  render pregunta por uno de 2h 40).
- La **barra de sesión** se monta una vez en el layout del módulo y lee la
  consulta cacheada; no la monta cada página.
- `activityFollowUpAdd` exige `durationMinutes: Int!` (no admite 0), y
  `activityFollowUpEdit` rechaza `durationMinutes < 1`
  (`activity-follow-up.service.ts:367-372`): un registro de menos de un minuto
  hay que redondearlo o impedirlo, y decirlo.

**Decisions that aren't mine:** *(las diez, **resueltas por el usuario el
2026-09-20**; ninguna queda abierta. **El API no se toca en esta feature**: ni
D1 ni D8 lo pidieron.)*

- **D1 — ¿Cómo sabemos que esta sesión es "ese" bloque del plan? — resuelta:
  (a) cruce en el cliente**, por actividad y cercanía de horas, **sin tocar el
  API**. Si coinciden `activityId` y la sesión cae a menos de 60 min de la hora
  planeada, es ese bloque; más lejos, es un **movido**; si la actividad no está
  en el plan, es **fuera del plan** (criterios 19, 22 y 23).
  **Limitación conocida, escrita y no disimulada:** con **dos bloques de la misma
  actividad el mismo día** (el «Pasear a las mascotas ×2» que el propio plan
  menciona) el cruce **adivina**. La regla de desempate que propongo y que va en
  el criterio 19: la sesión se asigna al **bloque más cercano en hora que aún no
  tenga sesión asignada**, en un solo pase de izquierda a derecha, y ningún
  bloque recibe dos. Puede equivocarse cuando las dos sesiones caen entre los dos
  bloques; cuando eso pase, lo que se ve sigue siendo verdad en minutos —las dos
  sesiones existen y suman lo mismo—, solo puede estar cambiada la pareja.
  **Consecuencia aceptada:** lo registrado ahora **no gana un enlace
  retroactivo** si algún día se decide tocar el API.
- **D2 — ¿Qué pregunta «Terminar»? — resuelta: (c).** Un toque cierra la sesión
  con los minutos del cronómetro y el toast ofrece **«añadir una nota»**; el
  **cierre completo** —duración ajustable, notas en texto plano, subtareas— vive
  en el **«···»** (criterios 5 y 6).
- **D3 — La sesión que quedó abierta de otro día — resuelta: (a).** Al abrir, se
  pregunta **hasta qué hora la hiciste**, con la hora a mano y salida **«No sé»**
  que registra algo razonable y lo dice. **Nunca «cancelar», nunca perderla en
  silencio** (criterios 16 y 54).
- **D4 — Empezar algo con otra cosa en marcha — resuelta: (a).** Se **cierra la
  anterior** a la hora en que empieza la nueva y **se dice** (criterio 15).
- **D5 — ¿Cuántos colores tiene el presupuesto? — resuelta: (b), dos formas.**
  Día **en marcha**: *hecho · en marcha · planeado · libre* (render 03). Día
  **terminado**: *seguido · de más · fuera del plan · sin dato* (render 04-B). El
  cambio **se explica en pantalla** (criterios 24 y 25).
- **D6 — Los umbrales — resuelta:** **calcado ±5 min**, **movido > 60 min**, en
  **constantes con nombre** y en un solo sitio (criterio 20).
- **D7 — Qué pasa con un bloque que no se hizo — resuelta y *ampliada por el
  usuario*.** Sus palabras:
  > «también se debe contemplar la posibilidad de que la actividad no se haya
  > podido realizar o yo haya hecho otra cosa, entonces no es solo crear la
  > sesión con lo planeado, es poder decir qué otra cosa se hizo»

  Así que no es una salida, son **tres**, y ninguna es la principal (criterios
  40–45): **«Lo hice»** (crea la sesión con la hora y la duración planeadas,
  ajustable desde el «···»), **«Hice otra cosa»** (elige otra actividad con la
  hoja de la tajada 3 y la registra en ese tramo; el bloque queda **no hecho pero
  explicado**: «en su lugar, Llamada con el banco») y **«No se pudo»** (no hecho,
  con **razón opcional** en texto plano y sin reproche). **Esto reordenó las
  tajadas**: ver «Por qué este orden, y por qué cambió».
- **D8 — Dónde se recuerda el «dejarlo así» — resuelta: (a), en el navegador de
  ese aparato**, por día y tramo (criterio 49).
- **D9 — ¿Cuándo se dice «no hecho»? — resuelta: (c).** **«Pendiente»** al pasar
  la hora de fin del bloque; **«no hecho»** solo al cerrarse el día, con la hora
  de fin de los ajustes de Vida (criterio 39).
- **D10 — ¿Hasta qué día atrás se registra? — resuelta: (a).** **Cualquier día
  visible en la tira**, desde el **lunes de esta semana**; el **plan** de los días
  pasados sigue sin tocarse (criterios 32 y 46).

**Deuda de portabilidad (la web es el piloto, Flutter viene después):** dos cosas
de esta feature **se guardan en el aparato y no viajan**, y las dos están dichas
en pantalla, no escondidas — el «dejarlo así» de un tramo sin dato (D8, criterio
49) y la **razón** de un «No se pudo» mientras el API no tenga campo (D7,
criterio 44). En Flutter eso es almacenamiento local equivalente, así que la
pantalla se porta **sin rehacerse**; lo que no se porta es **el dato**: quien
abra el módulo en el móvil volverá a ver la pregunta y no verá las razones que
escribió en el portátil. Es el precio de no tocar el API en esta fase y queda
anotado aquí para que la conversación de «llevar esto al backend» —si llega—
empiece con las dos cosas juntas y no con una suelta.

---

*Escrito por `feature-analyst` el 2026-09-20 y **actualizado el mismo día con las
respuestas del usuario a D1…D10**. Ninguna decisión queda abierta y **el API no
se toca**; D7 se amplió (de «Lo hice» a **tres salidas**) y por eso las tajadas 3
y 4 **intercambiaron el orden**: la hoja de elegir actividad se escribe antes de
que la necesiten las tres salidas. Los criterios se renumeraron con ese orden —
son 66 y nadie los reescribe a partir de aquí. Fuentes: `docs/vida/PLAN.md` (F3,
«Decisiones ya tomadas» 8, 9, 11, 12 y 13, «La regla que se hereda de hábitos» y
«Lo que se enlaza después, no ahora»), `docs/vida/assets/04-vida-planeado-ejecutado.html`
(**marco B**, revisado y confirmado por el usuario el 2026-09-20) y
`docs/vida/assets/03-vida-agenda.html`, `docs/features/FEAT-003-vida-hoy-planear-el-dia.md`
(secciones 1 y 2 enteras, y los avisos de sus cinco tajadas),
`docs/features/FEAT-002-vida-catalogo-actividades.md`,
`docs/features/ENVIRONMENT.md`, los SDL de `src/features/vida/graphql/schema/`
y, para las dos hipótesis marcadas del servidor,
`~/Developer/xavi-platform-node/src/services/activity-follow-up.service.ts` y
`…/activity-day-plan.service.ts`. **Sin `Bash`, no se pudo correr `graphify`**:
la exploración fue con `Grep`/`Glob` y lectura por rangos.*

## 2. The plan — feature-architect

**Resumen para el constructor:** la referencia es **la propia pantalla que hay
que ampliar** —`src/features/vida/pages/VidaHoyPage.tsx` + `components/VidaAgendaBlock/`
+ `utils/vida-agenda.utils.ts` + `hooks/useVidaDayData.ts`, lo que dejó FEAT-003—,
con `components/VidaPlaceInGapSheet/` como molde de hoja y
`hooks/useCreateStartingActivities.ts` como molde de orquestación para el
«cierra la anterior y empieza la nueva» de D4. Todo lo nuevo cae dentro de
`src/features/vida/` **salvo un archivo de `shared/ui`** (`Toast` gana una
acción opcional, que es lo que sostiene el criterio 5). **No se crea capa de
datos de follow-ups: existe entera** (`api/activity-followups.api.ts`,
`graphql/activity-followups.graphql.ts`, `hooks/useActivityFollowUps.ts`,
`vidaKeys.followUps.*`, `invalidateFollowUpQueries`); lo único que le falta es
**un documento** (subtareas de sesión) y **arreglarle el vocabulario**.
`buildDayAgenda` **no gana una cuarta variante**: lo ejecutado vive en un
archivo hermano, `utils/vida-execution.utils.ts`.

### Lo que ya existe

| Qué | Dónde | Qué significa para esta feature |
|---|---|---|
| Las siete operaciones de follow-ups | `hooks/useActivityFollowUps.ts:14,26,38,48,61,75,91` (+ `.test.tsx`) | `open()` con `staleTime: 15 s` y `refetchOnWindowFocus`, `day(date)` **ya deshabilitada en futuro** (`:29`), `range`, `Start`, `Create`, `Update`, `Delete`. **Ninguna consulta ni mutación nueva**, salvo subtareas de sesión. |
| Las invalidaciones | `utils/invalidate-vida-queries.ts:22` (`invalidateFollowUpQueries`) | Ya invalida `followUps.day(date)`, `followUps.range(semana)`, `followUps.open()` y las actividades. **Cubre entero el criterio 11.** No invalida `dayPlan.byDate` y **está bien**: registrar no toca el plan (criterio 37). |
| Las claves | `src/shared/api/query-keys.ts:44-50` (`followUps.open/day/range`) y `:52-54` (`dayPlan.byDate`) | **No hace falta ninguna clave nueva.** El cruce sesión↔bloque es cliente: dos consultas ya cacheadas del mismo día, cruzadas en un `useMemo` de la página. |
| La agenda del plan | `utils/vida-agenda.utils.ts` (`buildDayAgenda`, `AgendaEntry` = `block\|gap\|now`, `getDayBudget`, `trackMinutes` — que ya es quien evita que los anchos pasen del 100 %, `:44-50`) | Se **usa tal cual**; lo ejecutado se calcula **encima** de su salida. Ver «Dónde NO va». |
| Aritmética de `HH:mm` | `utils/vida-time.utils.ts` (`parseTimeToMinutes`, `minutesToTime`, `calculateEndTime`, `formatDurationFromMinutes`, `formatTimeForDisplay`, `DURATION_PILLS`, `DEFAULT_BLOCK_MINUTES`) | Base de todo. **Le falta lo de instantes** (`fecha + HH:mm → Date`) y los formatos de cronómetro: eso es el rescate de la tajada 1. |
| El tic de un minuto | `hooks/useVidaNowMinute.ts` | Sigue siendo quien mueve la marca de «ahora» y el «pendiente» del criterio 39. **No sirve de cronómetro** (60 s ≠ criterio 4): el cronómetro es un hook aparte. |
| Hoja de tres pasos con buscador | `components/VidaPlaceInGapSheet/VidaPlaceInGapSheet.tsx` (`SteppedModal` `ds="aura"` + `mobileSheet`, `key` por apertura, `onSuccess` **local**, `filterActivitiesBySearch` sobre `useActivitiesQuery` sin archivadas) | El paso «qué» se **extrae** a un componente y lo comparten las cuatro entradas del criterio 38. La hoja actual pasa a usarlo: no se copia. |
| Píldoras de duración | `components/VidaDurationPills/` | Las reutiliza «Registrar tiempo pasado» (criterio 31) y el ajuste de duración del cierre (criterio 6). |
| Las tres consultas del día | `hooks/useVidaDayData.ts` con su `failed: string[]` | **Es exactamente lo que pide el criterio 58**: se le añade la cuarta consulta y una entrada más en `failed`. No se escribe otro hook de día. |
| Guarda de sesión, fechas, errores | `hooks/useVidaQueryGuard.ts`, `utils/vida-date.utils.ts`, `utils/vida-error.utils.ts` | Criterios 63 y 64 de fábrica. |
| `localStorage` con `try/catch` | `src/shared/lib/storage.ts` + el molde vivo `src/features/habits/store/habit-identity.store.ts` (zustand `persist` sobre `storage`, con la limitación «no viaja entre dispositivos» **escrita en la cabecera**) | Es el patrón de D7 y D8. **No se escribe otro envoltorio de `localStorage`.** |
| Contratos GraphQL | `graphql/contracts.test.ts` + `graphql/schema/activity.schema.graphql:71-103,184,192-196,266-292` | El SDL **ya trae** `ActivityFollowUpSubtask`, `sessionSubtasks`, `activityFollowUpSubtaskEdit` y `ActivityFollowUpSubtaskEditInput`: **no hay que recopiar SDL ni tocar el API**. Solo falta el documento del cliente. |
| El layout del módulo | `routes/vida.routes.tsx` (el `path: 'vida'` **no tiene `element`**, solo `children`) y `layouts/AppLayout/app-nav.config.ts:101-142` | Ahí cuelga la barra de sesión. Ver la decisión de abajo. |

**Nada de esto existe dos veces.** Dos deudas heredadas que esta feature **no
agranda**: el normalizador de texto (cuatro copias, hallazgo de FEAT-002) y
`Popover` sin cierre desde su contenido (hallazgo de FEAT-002).

**Lo que existe y está mal, y hay que corregirlo aquí** (criterios 14 y 59):
`hooks/useActivityFollowUps.ts:108` dice **«Actividad cancelada»** y
**«Registro eliminado»**. Las dos palabras están prohibidas en Vida. Se
reescriben a **«No la guardamos»** (era una sesión abierta) y **«Lo quitamos del
registro»**. De paso, `:56` dice «Actividad iniciada» → **«En marcha»**, que es
la palabra del render.

### Las dos hipótesis del servidor: confirmadas

| Hipótesis | Veredicto | Evidencia en `~/Developer/xavi-platform-node` |
|---|---|---|
| Sesión abierta = `duration_minutes === null` | **Confirmada** | `src/services/activity-follow-up.service.ts:61` (`const isOpen = row.duration_minutes === null`), `:47` (`CLOSED_FOLLOW_UP_FILTER`), `:332-345` (`getOpenFollowUp` filtra por `duration_minutes IS NULL`). Por eso **«Terminar» es `activityFollowUpEdit` con `durationMinutes`**, y `useUpdateActivityFollowUpMutation:80` ya limpia `followUps.open()` cuando vuelve `isOpen: false`. |
| `isCompleted` escribe `completed_at` | **Confirmada y se deja quieta** | `activity-day-plan.service.ts:227-228` (`completed_at = NOW()` / `= NULL`). **Esta feature NO la escribe**: con D7 resuelto, «hecho» se deriva de la sesión, y escribir las dos cosas sería **dos sitios con la misma verdad**, que es como nacen las contradicciones. Queda anotado para F5. |
| ¿El API impide dos sesiones abiertas? | **Sí, y devuelve 400** | `activity-follow-up.service.ts:154-167` (`assertNoOpenFollowUp`) se llama **solo en `start`** (`:296`) y lanza `BadRequestError('You already have an activity in progress. Finish or cancel it before starting another.')` — **en inglés**: si ese mensaje llega a pantalla, se lee horrible. Por eso D4 se orquesta **cerrar → empezar, en serie** y el fallo del cierre aborta el empezar (criterio 15), y el mensaje crudo **no se enseña**: se traduce en `useVidaSessionActions`. |
| ¿`activityFollowUpAdd` exige que no haya sesión abierta? | **No** | `assertNoOpenFollowUp` no se llama en `add`. **Registrar tiempo pasado y «Lo hice» funcionan con una sesión en marcha.** Es lo que permite que las tajadas 3 y 4 no dependan del estado de la 1. |
| Mínimo de un minuto | **Confirmada** | `:367-372` (`Duration must be at least 1 minute` en `edit`) y `ActivityFollowUpAddInput.durationMinutes: Int!`. Todo cálculo de duración se cierra con `Math.max(1, …)`. |
| Medianoche (criterio 63) | **Resuelta por el servidor, con una trampa para el cliente** | `src/shared/utils/activity-follow-up-time.ts:34-48`: el fin se calcula con `dayOffset`, así que una sesión de 23:50 + 20 min queda con `date` = el día de inicio y `endDate` = el siguiente. **La trampa es del cliente:** la duración **no** se puede calcular como «minutos de ahora desde medianoche − `startMinutes`» (da negativo a las 00:10). Se calcula **entre instantes**, desde `date + startTime` local. Eso es `sessionStartInstant` en la tajada 1. |
| Mientras está abierta, `endTime`/`endDate`/`endDateTime` vienen `null` | **Confirmada** | `:63-79`. El cronómetro **no puede** salir de `endDateTime`: sale de `date` + `startTime`. |
| `startTime` puede volver `HH:mm:ss` | **Confirmada** | `formatStartTimeForApi` (`:51-59`) devuelve 8 caracteres. Todo lo que lo lea pasa por `normalizeTimeForDisplay`, que ya existe (`vida-time.utils.ts:25`). |

### La hipótesis abierta, resuelta: qué registra el «No sé» (criterio 16)

**Decisión: la duración planeada de ese bloque, y si no la hay, 30 minutos.
Nunca «hasta el fin del día».**

Una sesión que quedó abierta ayer a las 21:00 con el día acabando a las 23:00
daría **120 minutos** que nadie vivió; una abierta a las 9:00 daría **catorce
horas**. Ese número no es «algo razonable»: es tiempo inventado, entra en el
presupuesto, infla el tramo «de más» y se queda ahí para siempre — justo lo
contrario de la regla del plan de Vida («el sistema no adivina»). La duración
planeada, en cambio, **es un número que el propio usuario escribió**.

En `utils/vida-session.utils.ts`, puro y con test:

```
VIDA_UNKNOWN_SESSION_MINUTES = 30          // = DEFAULT_BLOCK_MINUTES, y se dice en pantalla
resolveUnknownEndMinutes({ session, plannedMinutes, dayEndTime }): { minutes, reason }
```

1. `plannedMinutes` (la duración del bloque de ese día con el mismo `activityId`;
   si hay **varios**, no se adivina: se cae al paso 2) → `reason: 'planned'`.
2. `VIDA_UNKNOWN_SESSION_MINUTES` → `reason: 'default'`.
3. En los dos casos se **recorta** para no pasar del `dayEndTime` de ese día, y
   nunca baja de 1 (mínimo del API).

Y **se dice**, que es la mitad del criterio: «No lo sabíamos, así que anotamos
**45 min** —lo que tenías planeado—. Puedes cambiarlo cuando quieras.» / «…
anotamos **30 min**. Puedes cambiarlo cuando quieras.» **La razón no se escribe
en las notas de la sesión** (es dato del usuario, no del sistema): se dice en
pantalla en ese momento y la sesión queda editable desde el «···».

### Implementación de referencia

**`src/features/vida/pages/VidaHoyPage.tsx` (con `components/VidaAgendaBlock/`,
`utils/vida-agenda.utils.ts` y `hooks/useVidaDayData.ts`).** No es una figura
parecida: **es la misma pantalla**, viva, entregada hace un día y con sus tests.
Ahí está resuelto lo que esta feature vuelve a necesitar: los cuatro estados
separados de verdad (sin sesión / cargando / error con reintento / día sin
plan), el día que sale de `?d=`, la aritmética pura en un `utils` con `Date`
inyectada y **cero `new Date()` escondido**, y la regla de que un componente de
agenda es tonto salvo para la mutación que es suya. Se imita eso, no se
reinventa.

**Tres referencias secundarias, cada una para una cosa concreta:**

- **Hojas:** `components/VidaPlaceInGapSheet/VidaPlaceInGapSheet.tsx` —
  `SteppedModal` con `ds="aura"` + `mobileSheet`, estado arriba, **`key` por
  apertura** puesta por quien abre, y el cierre en el `onSuccess` **local** del
  `mutate` (es lo que sostiene los criterios 12 y 36: la hoja no se cierra ni
  pierde lo escrito si la mutación falla).
- **Orquestación de dos mutaciones en serie:**
  `hooks/useCreateStartingActivities.ts` — **no lanza, resuelve** con
  `{ created, failed }`, invalida una vez y deja **un solo mensaje**. Es
  literalmente la forma del criterio 15 (cerrar la anterior → empezar la nueva,
  y si la primera falla **no se hace la segunda** y se explica).
- **Barra con tramos y leyenda legible:** `components/VidaDayBudget/` —
  aritmética en el `utils`, `<div>`s con `width: %`, barra `aria-hidden` y la
  leyenda con **los minutos como texto real**, que es la «tabla» del gráfico.
  Las dos formas de D5 se hacen así.

**El cronómetro se rescata de `79bece0`**, con la tabla de abajo. No es código
vivo: se rescata por función, con test propio.

### Qué se rescata de `79bece0`, función por función

| De dónde | Qué | Dónde va | Veredicto |
|---|---|---|---|
| `hooks/useElapsedTimer.ts` (33 líneas) | **el hook entero, adaptado** | `hooks/useVidaElapsed.ts` (N) | **Se rescata.** Ya hace lo correcto: `Date.now() − inicio` en cada tic (**no acumula**, criterio 3), limpia el intervalo al desmontar (criterio 4) y tiene su `.test.ts`. Dos cambios: recibe **`Date`** (el instante que da `sessionStartInstant`) en vez de una cadena ISO —el API no manda ISO de inicio—, y sigue con `1000 ms` para `hhmmss` y `60_000` para `compact`. |
| `utils/activity-time.utils.ts:186-201` | `formatElapsedHHMMSS`, `formatElapsedCompact` | `utils/vida-session.utils.ts` (N) | **Se rescatan literales.** Son diez líneas puras y ya probadas. |
| `utils/activity-time.utils.ts:237-251` | `localDateTimeToIso` | ídem, como **`sessionStartInstant(date, startTime): Date`** | **Se rescata la idea, devolviendo `Date`.** Volver a ISO para volver a parsear es un rodeo; y el respaldo `new Date().toISOString()` cuando algo no se entiende **se tira**: una fecha rota que se hace pasar por «ahora» es peor que un `null`. |
| `utils/activity-time.utils.ts:262-267` | `calculateDurationMinutes` | ídem, como **`elapsedMinutes(startInstant, now)`** | **Se rescata.** Ya trae el `Math.max(1, …)` que pide el API (criterio 5) y el `round`. |
| `utils/activity-time.utils.ts:253-256` | `isFutureDateTime` | ídem | **Se rescata** (tajada 3: no se registra en el futuro, criterio 32). |
| `utils/activity-followup-form.ts:58-77` | `validateLogPastActivityForm` y `logPastDurationTotal` | `utils/vida-session.utils.ts` (tajada 3) | **Se rescata la forma, con otros mensajes.** Son los criterios 32 y 36. Las horas/minutos separados se tiran: aquí manda `VidaDurationPills`. |
| `utils/activity-followup-form.ts` (`finishOpenFollowUpToEditInput`, `startFormToFollowUpStartInput`) | la idea | ídem (`closeSessionInput`, `startSessionInput`) | **Se rescata la idea.** Con `normalizeTimeForApi`, que ya existe; **no** vuelve `normalizeTimeToSeconds` (el API acepta `HH:mm`). |
| `hooks/useRunningSessionFinishActions.ts` | **la forma del «terminar y seguir»** | `hooks/useVidaSessionActions.ts` (N) | **Se rescata la forma, no el código.** Tiene el encadenado correcto (cerrar → en su `onSuccess`, empezar), que es el criterio 15. Se tira todo lo que arrastra: `todos`, `weekly-routine`, el `ConfirmDialog` de la tarea enlazada. |
| `components/RunningActivityTimer/` | **la maqueta** | `components/VidaSessionBar/` (N) | **Se reescribe.** La estructura (icono con color de categoría, título, cronómetro `aria-live="polite"`, hora de inicio, acciones) vale; el `Card` centrado no —aquí es una **barra fija** del módulo— y el botón **«Cancelar» desaparece**: en Vida no se cancela (criterios 14 y 59). Se tira `SessionLinkedTodo`. |
| `components/FinishActivityModal/`, `StartActivityModal/`, `LogPastActivityModal/`, `EditFollowUpModal/`, `CreateFollowUpFromFreeSlotModal/` (~800 líneas) | — | **no se rescatan** | Son cinco modales con cinco formularios distintos sobre el mismo dato, y **el criterio 38 dice justo lo contrario**: una sola hoja de «qué», reutilizada. Además son pre-Aura y no usan `SteppedModal`. Lo que se mira de ellos es **qué preguntan**, y eso ya está en los criterios. |
| `components/ActivityBitacoraModal/` | — | **no se rescata** | Dependía de tiptap. Las notas son **texto plano** (decisión 4 del plan, criterio 6). |
| `utils/activity-day-metrics.utils.ts:118-175` (`getDayUsageMetrics`) | **la idea de repartir el día en tramos con porcentajes que suman 100** | `utils/vida-execution.utils.ts` (tajada 2) | **Se rescata la idea, se tira el código.** `wasteMinutes` y `wastePercentage` (`:121,126,145,162`) son **«desperdicio»: prohibido** (criterio 59 y la regla del `ENVIRONMENT.md`). Aquí el tramo del pasado sin registro se llama **«sin dato»** y **tiene salida** (criterio 48). También se tira `DAY_END_TIME = '23:00:00'` (`:10`): el fin del día sale de los ajustes, vía `useVidaDayHours`. |
| `utils/activity-day-metrics.utils.ts:86-99` (`getUsedMinutesFromFollowUps`) | — | **no se rescata** | Suma duraciones sin mirar solapes, y aquí dos sesiones solapadas harían que la barra pasara del 100 % (criterio 26). Se usa el mismo truco que ya resolvió el caso en el plan: `trackMinutes` sobre un cursor. |
| `hooks/useRemainingDayTimer.ts`, `useCurrentTimeMarker.ts` | — | **ya rescatados en FEAT-003** | `useVidaNowMinute` existe. No se toca. |
| `components/ActivityFollowUpCard/`, `ActivityFollowUpTimelineEntry/`, `SessionLinkedTodo/`, `hooks/useStandup.ts`, `utils/invalidate-follow-up-queries.ts` | — | **no se rescatan** | Timeline con alturas en píxeles (descartada, decisión 5), tareas enlazadas (fuera de alcance), standup (otro producto) y la invalidación duplicada que **ya se unificó** en `utils/invalidate-vida-queries.ts`. |
| **Subtareas de sesión** | — | **no hay nada que rescatar** | Lo busqué: en `79bece0` no hay ni un componente ni un hook de `sessionSubtasks`; la web borrada **nunca las estrenó**. El criterio 10 se escribe de cero, y es pequeño (una lista de casillas y una mutación). |

### Las cuatro decisiones de arquitectura

**1. Dónde vive el estado de la sesión abierta.** En `useActivityOpenFollowUpQuery`
**tal como está**: `vidaKeys.followUps.open()`, `staleTime: 15 s`,
`refetchOnWindowFocus: true`. **Sin `refetchInterval` y sin polling por minuto.**
El valor solo lo cambia este cliente, y las tres mutaciones ya lo escriben en
caché (`setQueryData` al empezar, `null` al cerrar, y `invalidateFollowUpQueries`
detrás): un sondeo por minuto serían ~60 peticiones/hora contra una instancia
Render que se duerme, para leer un dato que acabamos de escribir. **Sobrevive a
la recarga** porque la verdad está en el servidor y la consulta se rehace al
montar; **sobrevive a volver de otra pestaña** por `refetchOnWindowFocus`.
Lo único que tictaquea es el **cronómetro**, y tictaquea **en el cliente**
(`useVidaElapsed`, 1 s, `Date.now()` contra el instante de inicio): no pide
nada. *Limitación aceptada y escrita:* una sesión empezada en otro aparato
tarda en verse lo que tarde el primer foco de ventana.

**2. Dónde vive la barra de sesión (criterio 7).** En un **elemento de ruta del
módulo**: `routes/VidaModuleLayout.tsx`, que pasa a ser el `element` del
`path: 'vida'` de `routes/vida.routes.tsx` (hoy ese nodo solo tiene `children`).
Renderiza `<VidaSessionBar />`, `<VidaStaleSessionPrompt />`, el hueco reservado
de abajo (criterio 60) y `<Outlet />`.

**No va en `AppLayout`** aunque `AppLayout.tsx:90` ya sepa cuál es el módulo
activo: obligaría a `layouts/` a montar un componente de `features/vida` con una
condición que hay que mantener, y la condición **se equivoca justo donde
importa** — `/app/vida/semana` y `/app/vida/actividades/archivadas` **no están en
`app-nav.config.ts`** a propósito. El subárbol de rutas es la frontera exacta que
pide el criterio 7 («todas las pantallas del módulo», «fuera del módulo nada»),
sale gratis y no se puede desincronizar. **Tampoco va un portal por página**: se
montaría una vez por pantalla y rompería el criterio 8.

**3. Cómo gana `buildDayAgenda` la capa real.** **Ni cuarta variante de
`AgendaEntry`, ni campos nuevos en `AgendaBlock`.** `buildDayAgenda` describe
**el plan**, es puro, está probado y lo usan además `vida-gap-form.utils.ts`,
`VidaAgendaGap` y `VidaTemplateAside`: meterle lo ejecutado lo convierte en el
cajón del módulo y arrastra a tres consumidores que no quieren saber nada de
esto. Lo ejecutado es **un segundo pase puro**, en un archivo hermano:

```
buildDayExecution({ agenda, followUps, nowMinutes, dayEnd, isPastDay }) → DayExecution
  byBlockId:    Record<string, BlockExecution>   // la superposición de cada bloque planeado
  looseSessions: LooseSession[]                  // lo que no es de ningún bloque (criterios 22 y 23)
  noDataSlices:  NoDataSlice[]                   // pasado sin plan y sin sesión (criterio 47)
  entries:       ExecutionEntry[]                // agenda + sesiones sueltas + tramos sin dato, en orden de reloj
  budget:        ExecutionBudget                 // las dos formas de D5, con sus minutos
  isDayClosed:   boolean
```

`VidaAgendaBlock` gana **una prop opcional** `execution?: BlockExecution`, que es
aditivo: sin ella se pinta exactamente como hoy y **el día futuro y el día sin
nada registrado no cambian una línea** (criterios 27 y 29).

**4. Dónde vive el cruce de D1.** En `utils/vida-execution.utils.ts`, **puro y
con test**, junto a los dos umbrales del criterio 20:

```
VIDA_ON_PLAN_TOLERANCE_MINUTES = 5
VIDA_MOVED_THRESHOLD_MINUTES  = 60
matchSessionsToBlocks({ blocks, sessions }) → { byBlockId, unmatched }
```

Un solo pase: para cada sesión ordenada por hora, el bloque **libre** con el
mismo `activityId` y **menor** `|inicio real − inicio planeado|`; si esa
distancia supera `VIDA_MOVED_THRESHOLD_MINUTES` la pareja **sigue siendo pareja
pero es un movido** (criterio 23); si no hay bloque libre con esa actividad, la
sesión queda `unmatched` y se pinta fuera del plan (criterio 22). Ningún bloque
recibe dos, ninguna sesión va a dos. El caso de **dos bloques de la misma
actividad el mismo día** entra en el test con nombre propio, y la limitación de
D1 se repite en la cabecera del archivo.

**5. El almacenamiento del aparato (D7 y D8).** Un **store de zustand con
`persist`**, calcado de `src/features/habits/store/habit-identity.store.ts`
(que ya envuelve `src/shared/lib/storage.ts`, tolerante a fallos y a modo
privado): `src/features/vida/store/vida-device-notes.store.ts`, clave
`xavi.vida.device`. Zustand y no un `util` suelto **porque escribir tiene que
repintar**: una razón que se escribe y no aparece hasta recargar no cierra el
criterio 43. Dos mapas:

```
blockedReasons:  Record<`${date}:${dayPlanItemId}`, string>   // D7, criterio 44
dismissedSlices: Record<`${date}:${startMinutes}-${endMinutes}`, true>  // D8, criterio 49
```

La cabecera del archivo escribe la limitación, como hizo la de hábitos, y
apunta a la **«Deuda de portabilidad»** de la sección 1. **No se inventa un
campo en el API ni se meten estos datos en las notas de una sesión.**

**6. Cómo se reutiliza el «qué» sin duplicarlo (criterio 38).** El paso «qué» de
`VidaPlaceInGapSheet` (plantilla del día primero + `Input` + `filterActivitiesBySearch`
sobre `useActivitiesQuery` sin archivadas + la vía a `/app/vida/actividades`)
**se extrae** a `components/VidaActivityPicker/` en la tajada 3, y
`VidaPlaceInGapSheet` pasa a usarlo **en la misma tajada**. Extraer y que el
dueño original lo estrene el mismo día es lo que impide que acaben siendo dos.
Lo usan: «Empezar algo» y «Registrar tiempo pasado» (tajada 3), «Hice otra cosa»
y el «¿Qué pasó?» de un tramo sin dato (tajada 4). **No se escribe un quinto
normalizador de texto.**

**7. El toast con acción (criterio 5).** `shared/ui/Toast` **no tiene acciones
hoy** (`toast.types.ts` es `{ message, duration }` y `ToastViewport.tsx:46`
solo pinta el mensaje y la ✕). El criterio pide que el toast del «Terminar»
traiga **«añadir una nota»**. Se añade `action?: { label: string; onClick: () => void }`
a `ToastInput`/`ToastItem` y un `<button>` en el viewport: **aditivo**, ningún
llamante actual cambia. Y como el `onClick` es un cierre de quien conoce la
sesión, **el toast del cierre lo lanza el llamante, no el hook**:
`useUpdateActivityFollowUpMutation` gana `options?: { silent?: boolean }` (hoy
**no lo llama ninguna pantalla**, así que cambiar su firma es gratis).

### Dónde va el código nuevo, archivo por archivo

*Tajada 1 — empezar, el cronómetro y la sesión abierta*

| Archivo | N/M | Qué |
|---|---|---|
| `src/features/vida/utils/vida-session.utils.ts` (+ `.test.ts`) | **N** | El rescate puro: `sessionStartInstant(date, startTime): Date \| null`, `elapsedMinutes(start, now)`, `formatElapsedHHMMSS`, `formatElapsedCompact`, `isSessionFromAnotherDay(session, today)`, `startSessionInput(...)`, `closeSessionInput(session, at)` (con `Math.max(1, …)`), `VIDA_UNKNOWN_SESSION_MINUTES = 30` y `resolveUnknownEndMinutes(...)`. **Todo con `now` inyectado**: ni un `new Date()` escondido. Aquí vive la trampa de medianoche del criterio 63. |
| `src/features/vida/hooks/useVidaElapsed.ts` (+ `.test.ts`) | **N** | Rescate de `79bece0:useElapsedTimer`: tic de **1 s**, `Date.now() − inicio` en cada tic, `clearInterval` al desmontar, `enabled` para no tictaquear sin sesión. Devuelve `{ label, minutes }`. |
| `src/features/vida/hooks/useVidaOpenSession.ts` (+ `.test.tsx`) | **N** | Envuelve `useActivityOpenFollowUpQuery` (sin tocarla) y deriva `{ session, startInstant, isFromAnotherDay, isDisabled }`. **Una sola consulta para todo el módulo** (criterio 8). |
| `src/features/vida/hooks/useVidaSessionActions.ts` (+ `.test.tsx`) | **N** | La orquestación, molde `useCreateStartingActivities`: `start({ activityId, date })` → si hay abierta, **cierra primero** con los minutos hasta ahora y **solo en su `onSuccess`** empieza la nueva; si el cierre falla, **no empieza** y devuelve el motivo (criterio 15). `finishNow()` (criterio 5, lanza el toast con acción), `finishWith(values)` (criterio 6), `discard()` (criterio 14), `resolveStale({ minutes })` (criterio 16). Traduce el `BadRequestError` en inglés del API. No lanza: **resuelve**. |
| `src/features/vida/components/VidaSessionBar/` (`.tsx`, `.module.scss`, `index.ts`, `.test.tsx`) | **N** | Barra fija: icono y color de la categoría, nombre (truncable, criterio 61), cronómetro `aria-live="polite"`, «llevas 52 min · planeado 45» sin color de alarma (criterio 9), **«Terminar»** y «···». Un toque en el nombre → `vidaPaths.hoy`. Sin «Cancelar». |
| `src/features/vida/components/VidaFinishSessionModal/` (4 archivos) | **N** | El cierre completo: duración con `VidaDurationPills` + libre, notas **texto plano** (`textarea`), subtareas si las hay con su «2 de 5», y **«No era esto — no guardarla»**. Molde `VidaPlaceInGapSheet`: `SteppedModal` `ds="aura"` + `mobileSheet`, `key` por apertura, `onSuccess` **local** (criterio 12). |
| `src/features/vida/components/VidaStaleSessionPrompt/` (4 archivos) | **N** | La pregunta de D3: «Dejaste "X" en marcha **ayer** a las 21:00 · ¿hasta qué hora la hiciste?», `Input type="time"`, **«No sé»** con su explicación, y la línea de por qué no se puede empezar otra cosa. **No bloquea el resto de la pantalla** (criterio 54). |
| `src/features/vida/routes/VidaModuleLayout.tsx` (+ `.test.tsx`) | **N** | `<VidaSessionBar/>` + `<VidaStaleSessionPrompt/>` + hueco inferior + `<Outlet/>`. |
| `src/features/vida/routes/vida.routes.tsx` (+ `vida.routes.test.tsx`) | M | `element: <VidaModuleLayout/>` en el nodo `path: 'vida'`. **Las URL no cambian.** |
| `src/features/vida/graphql/activity-followups.graphql.ts` | M | `sessionSubtasks { id followUpId activitySubtaskId title isCompleted orderIndex }` **solo en `ACTIVITY_OPEN_FOLLOW_UP_QUERY`** (en el documento del día serían N×subtareas para nada) + `ACTIVITY_FOLLOW_UP_SUBTASK_EDIT_MUTATION`. |
| `src/features/vida/api/activity-followups.api.ts` | M | `editActivityFollowUpSubtask(input)`. |
| `src/features/vida/types/activity-followup.types.ts` | M | `ActivityFollowUpSubtaskEditInput { followUpId, sessionSubtaskId, isCompleted }`. |
| `src/features/vida/hooks/useActivityFollowUps.ts` (+ `.test.tsx`) | M | `useEditFollowUpSubtaskMutation` (criterio 10); **los tres toasts reescritos** (criterio 14); `{ silent }` en `useUpdateActivityFollowUpMutation`. |
| `src/features/vida/graphql/contracts.test.ts` | M | El documento nuevo en la lista y en el `toEqual`. **El SDL no se recopia: ya trae todo** (`activity.schema.graphql:184,192-196`). |
| `src/shared/ui/Toast/toast.types.ts`, `toast.context.tsx`, `ToastViewport.tsx` (+ test) | M | `action?: { label, onClick }`, aditivo. |
| `src/features/vida/components/VidaAgendaBlock/` (+ `.module.scss`, `.test.tsx`) | M | **«▶ Empezar»** (solo hoy, solo si no está en marcha), el estado «planeado 45 min · en marcha» con cronómetro, el aviso de pasarse, y el «···» con «Terminar y añadir nota» / «No era esto». Inhabilitado mientras la mutación vuela (criterio 13). |
| `src/features/vida/pages/VidaHoyPage.tsx` (+ `.test.tsx`) | M | Cablea `useVidaOpenSession` + `useVidaSessionActions` a los bloques. |

*Tajada 2 — lo real encima de lo planeado, y el presupuesto por colores*

| Archivo | N/M | Qué |
|---|---|---|
| `src/features/vida/utils/vida-execution.utils.ts` (+ `.test.ts`) | **N** | Los dos umbrales, `matchSessionsToBlocks`, `describeBlockExecution` (`on-plan` · `longer` · `shorter` · `shifted` · `moved` · `running`), `buildDayExecution`, `getExecutedBudget` (las dos formas de D5, con `trackMinutes` sobre cursor para que sumen 100 %, criterio 26) e `isDayClosed(nowMinutes, dayEnd, isPastDay)`. **Puro, `now` inyectado.** |
| `src/features/vida/hooks/useVidaDayData.ts` (+ `.test.tsx`) | M | Cuarta consulta: `useActivityDayFollowUpsQuery(date)` (ya existe y ya se apaga en futuros). Devuelve `followUps`, `isFollowUpsError`, y `failed` gana **«lo que viviste»** — que es, literal, el criterio 58. |
| `src/features/vida/components/VidaAgendaBlock/` | M | Prop `execution?: BlockExecution`: «✓ calcado», «+11 min», «empezó +5», las **horas reales** y la sombra del movido. |
| `src/features/vida/components/VidaPlanVsRealBar/` (4 archivos) | **N** | La barrita del criterio 21, con «plan 30 · real 41» como **texto real**. |
| `src/features/vida/components/VidaAgendaSession/` (4 archivos) | **N** | Una sesión que no es de ningún bloque: punteado, «fuera del plan» / «40 min tarde», sus horas y su duración. |
| `src/features/vida/components/VidaDayBudget/` (+ `.module.scss`, `.test.tsx`) | M | Las **dos formas** con sus minutos y la línea que **explica el cambio** (criterio 25). |
| `src/features/vida/pages/VidaHoyPage.tsx` | M | Recorre `execution.entries` en vez de `agenda.entries`. |

*Tajada 3 — registrar lo que se sale*

| Archivo | N/M | Qué |
|---|---|---|
| `src/features/vida/components/VidaActivityPicker/` (4 archivos) | **N** | **Extraído** del paso «qué» de `VidaPlaceInGapSheet` (criterio 38). |
| `src/features/vida/components/VidaPlaceInGapSheet/VidaPlaceInGapSheet.tsx` | M | Pasa a usar `VidaActivityPicker`. **Mismo día, o son dos.** |
| `src/features/vida/components/VidaLogSessionSheet/` (4 archivos) | **N** | «Registrar tiempo pasado» (qué · a qué hora · cuánto, con `VidaDurationPills`) y «Empezar algo» (solo «qué», **sin duración**), y la **corrección** de una sesión ya registrada (criterio 35). Una hoja, tres modos. |
| `src/features/vida/utils/vida-session.utils.ts` (+ `.test.ts`) | M | `validateLogPast(...)` (rescate), `logSessionInput(...)`. |
| `src/features/vida/components/VidaDayActions/` (+ `.test.tsx`) | M | «Empezar algo» (solo hoy) y «Registrar tiempo pasado» (hoy y pasados; **ninguno en futuros**, criterio 32). |
| `src/features/vida/components/VidaAgendaSession/` | M | El «···»: corregir y **«Quitar del registro»** con `ConfirmDialog` y salida **«Volver»**. |
| `src/features/vida/pages/VidaHoyPage.tsx` | M | Cablea la hoja. |

*Tajada 4 — pendiente, las tres salidas, sin dato y la frase de cierre*

| Archivo | N/M | Qué |
|---|---|---|
| `src/features/vida/store/vida-device-notes.store.ts` (+ `.test.ts`) | **N** | D7 y D8, molde `habit-identity.store.ts`. |
| `src/features/vida/utils/vida-execution.utils.ts` (+ `.test.ts`) | M | `pending` / `not-done` según D9, `noDataSlices` con su mínimo `VIDA_NO_DATA_MIN_MINUTES = 30` (criterio 48) y **`buildDayClosingLine(...)`** con sus cuatro variantes del criterio 51 — puro, y es donde se prueba que **ninguna** usa una palabra de culpa. |
| `src/features/vida/components/VidaBlockOutcomes/` (4 archivos) | **N** | Las tres salidas, **mismo peso visual**, y el campo de razón de «No se pudo». |
| `src/features/vida/components/VidaAgendaNoData/` (4 archivos) | **N** | El tramo «sin dato» con sus horas y «¿Qué pasó?» → `VidaLogSessionSheet` con hora y duración **ya puestas**, o «dejarlo así». |
| `src/features/vida/components/VidaAgendaBlock/` | M | «pendiente» / «no hecho», «en su lugar, X» con su vía, y la razón en una línea corta. |
| `src/features/vida/components/VidaDayBudget/` | M | La frase de cierre. |
| `src/features/vida/pages/VidaHoyPage.tsx` | M | Cablea las salidas y el store. |

### Lo que NO se crea

- **Ninguna consulta ni mutación de follow-ups**, salvo el documento de
  subtareas de sesión: las siete existen con sus tests.
- **Ninguna clave en `query-keys.ts` y ninguna invalidación nueva.**
  `followUps.open/day/range` e `invalidateFollowUpQueries` cubren los criterios
  8 y 11 enteros.
- **Nada de SDL**: `activity.schema.graphql` ya trae subtareas de sesión y su
  mutación. **El API no se toca** (confirmado en las dos direcciones).
- **Ningún hook de día nuevo**: `useVidaDayData` se amplía.
- **Ningún `buildDayAgenda` paralelo**, ni cuarta variante de `AgendaEntry`.
- **Ningún envoltorio de `localStorage`**: `shared/lib/storage.ts` + zustand
  `persist`.
- **Ningún buscador ni normalizador de texto nuevo**: `VidaActivityPicker` es
  una **extracción**, no una copia.
- **Ningún componente de `shared/ui` nuevo**: `SteppedModal`, `Popover`,
  `ConfirmDialog`, `Alert`, `Toast`, `IconButton`, `Button`, `Card`, `Badge`,
  `AppIcon`, `Skeleton`, `Input` ya están. A `Toast` se le **añade** una prop.
- **Ningún icono importado a pelo de `@fortawesome/free-solid-svg-icons`.**
- **Ninguna ruta nueva** (criterio «sin pantallas nuevas»): `VidaModuleLayout`
  es un `element` sobre la ruta que ya existe.

### Dónde NO va

- **La barra de sesión NO va en `AppLayout`.** Razones arriba; la corta es que
  `app-nav.config.ts` no conoce `/app/vida/semana` ni las archivadas, y el
  criterio 7 sí.
- **Lo ejecutado NO entra en `utils/vida-agenda.utils.ts`.** Ese archivo
  describe el plan y lo importan `vida-gap-form.utils.ts`, `VidaAgendaGap` y
  `VidaTemplateAside`, a los que esto no les incumbe.
- **La sesión abierta NO se guarda en `localStorage` ni en un store de
  cliente.** La verdad es del servidor (`duration_minutes IS NULL`) y duplicarla
  en el aparato es el segundo sitio que se contradice — justo el error que el
  criterio 3 quiere evitar. Lo que sí es del aparato son **las dos cosas de D7 y
  D8**, y porque el API no tiene dónde ponerlas.
- **El cronómetro NO sale de `useVidaNowMinute`** (tictaquea a 60 s; el criterio
  4 pide un segundo) ni acumula tics: `Date.now()` contra el instante de inicio.
- **«Hecho» NO se escribe en `ActivityDayPlanItem.isCompleted`.** Se deriva de
  la sesión (D7). Escribir las dos es dos verdades.
- **La razón de «No se pudo» NO va en `notes` de ninguna sesión** ni en un campo
  inventado del API (criterio 44).
- **`durationMinutes` NO se calcula restando minutos desde medianoche.** A las
  00:10 daría negativo (criterio 63): se calcula entre instantes.
- **NO se toca `SearchSelect`** (2 tests rojos en la línea base) ni se arregla
  `Popover` ni `--color-text-muted`: hallazgos abiertos de FEAT-002, cada uno
  con su propia tarea.
- **NO se deriva nada del historial de otras semanas** (F6): «4 de 5 días», «a
  tu ritmo real» y «sueles tardar N» están dibujados en el render 04-B y **no
  entran** (criterio 29).
- **NO se restauran los cinco modales de `79bece0`**: el criterio 38 pide una
  hoja, no cinco.
- **NO se usa `clientId`** (idempotencia offline): explícitamente fuera de
  alcance.

### Las tajadas, con sus archivos

| # | Qué hace | Archivos | Criterios que cierra | Estado |
|---|---|---|---|---|
| 1 | **Empezar y terminar un bloque, con cronómetro y la sesión visible en el módulo.** | `utils/vida-session.utils.ts` (N) · `hooks/useVidaElapsed.ts` (N) · `hooks/useVidaOpenSession.ts` (N) · `hooks/useVidaSessionActions.ts` (N) · `components/VidaSessionBar/` (N) · `components/VidaFinishSessionModal/` (N) · `components/VidaStaleSessionPrompt/` (N) · `routes/VidaModuleLayout.tsx` (N) · `routes/vida.routes.tsx` · `graphql/activity-followups.graphql.ts` · `api/activity-followups.api.ts` · `types/activity-followup.types.ts` · `hooks/useActivityFollowUps.ts` · `graphql/contracts.test.ts` · `shared/ui/Toast/` · `components/VidaAgendaBlock/` · `pages/VidaHoyPage.tsx` | 2–17, **1 a medias** (ver el recorte), 54, 59 (los tres toasts), 64, y la parte de 60/61/63 que toca la barra y el cierre | **accepted** (2026-09-20; 10 y 66 quedan en el recorrido manual) |
| 2 | **Lo real encima de lo planeado, y el presupuesto por colores.** | `utils/vida-execution.utils.ts` (N) · `hooks/useVidaDayData.ts` · `components/VidaAgendaBlock/` · `components/VidaPlanVsRealBar/` (N) · `components/VidaAgendaSession/` (N) · `components/VidaDayBudget/` · `pages/VidaHoyPage.tsx` | **la otra mitad de 1**, 18–29, 53, 55, 57, 58, 62 | **accepted** (2026-09-20, en la **segunda** revisión: devuelta por el cruce de D1, re-entregada con los dos pases y comprobada con arnés propio) |
| 3 | **Registrar lo que se sale.** | `components/VidaActivityPicker/` (N) · `components/VidaPlaceInGapSheet/` · `components/VidaLogSessionSheet/` (N) · `utils/vida-session.utils.ts` · `components/VidaDayActions/` · `components/VidaAgendaSession/` · `pages/VidaHoyPage.tsx` | 30–38, 56 | **accepted** (2026-09-20; el criterio 35 queda **recortado a las sesiones sueltas** y el «···» de la emparejada es obligatorio en la tajada 4) |
| 4 | **Lo que falta: pendiente, las tres salidas, sin dato y la frase de cierre.** | `store/vida-device-notes.store.ts` (N) · `utils/vida-execution.utils.ts` · `components/VidaBlockOutcomes/` (N) · `components/VidaAgendaNoData/` (N) · `components/VidaAgendaBlock/` · `components/VidaDayBudget/` · `pages/VidaHoyPage.tsx` | 39–52, 60, 61, 65; **66 lo cierra el usuario** | pending |

**Las cuatro tajadas se quedan como las cortó el analista.** Miradas contra el
código, el corte aguanta y el reordenado de D7 era el correcto: la 1 no necesita
el cruce, la 2 es solo lectura sobre lo que la 1 escribe, la 3 escribe la hoja y
la 4 la usa cuatro veces. **Dos recortes, y quedan escritos:**

> **El criterio 1 se parte entre la tajada 1 y la 2.** «Un bloque que no está
> **en marcha**» se puede saber en la 1 con `activityOpenFollowUp` y el
> `activityId` del bloque. «Ni **registrado**» **no**: saber que ese bloque ya
> tiene su sesión cerrada **es el cruce de D1**, que es la tajada 2. En la 1,
> «▶ Empezar» se esconde en el bloque en marcha y en los días futuros y pasados;
> en la 2 se esconde también en el que ya tiene sesión. **La mitad de los días
> (hoy / futuro / pasado) cierra en la 1; la mitad de «registrado» cierra en la
> 2.** No reescribo el criterio: lo parto y lo digo.

> **El criterio 16 no usa el cruce completo.** La sesión de otro día necesita la
> duración planeada de aquel día para el «No sé», y el cruce de D1 llega en la
> 2. En la tajada 1 se resuelve con lo mínimo y **sin adivinar**:
> `useActivityDayPlanQuery(session.date)` —clave que ya existe— y el bloque con
> el mismo `activityId`; **si hay más de uno, no se elige**: cae a los 30
> minutos. Cuando la 2 traiga `matchSessionsToBlocks`, esto no cambia: la
> función que decide (`resolveUnknownEndMinutes`) ya recibe `plannedMinutes`
> desde fuera.

### Cómo se verifica cada tajada

Los agentes **no entran con credenciales** (`docs/features/ENVIRONMENT.md`): todo
lo de `/app/*` se comprueba con **tests + arnés temporal**, y el recorrido real
es del usuario (criterio 66) **con la API despierta**. Escrito así, sin
disimular.

- **Siempre, en toda tajada:** `pnpm typecheck` limpio, `pnpm lint` no peor que
  **14 errores / 0 warnings**, `pnpm test` sin fallos nuevos sobre los **2** de
  `SearchSelect`, y **`pnpm build`** al cerrar (no solo `typecheck`: es la
  lección de la tajada 3 de FEAT-003, y el chunk inicial no crece por iconos).
  `graphify update .` después de tocar código.
- **El cronómetro, con temporizadores falsos.** `vi.useFakeTimers()` +
  `vi.setSystemTime(...)`: criterio 3 (se monta 40 min después del inicio y
  marca 40:00, **no** 00:00), criterio 4 (avanzar 1 s repinta; desmontar deja
  `vi.getTimerCount()` en 0), criterio 63 (inicio 23:50, `setSystemTime` 00:10
  del día siguiente → **20 min**, positivo, y la fecha que se manda es la del
  inicio).
- **Tajada 1:** el grueso son tests puros de `vida-session.utils.ts` (3, 5, 15,
  16, 17, 63) — ahí se cierra el «No sé» con sus tres casos (planeado / varios
  bloques / ninguno) y el recorte contra el fin del día.
  `useVidaSessionActions.test.tsx` con `QueryClient` y **mutación que falla**:
  el cierre falla → **no se empieza** la nueva y no quedan dos abiertas
  (criterio 15); `start` dos veces seguidas → **una** llamada (criterio 13).
  `pnpm test src/features/vida/graphql/contracts.test.ts` es el juez del
  documento nuevo. Los toasts prohibidos, con un test que busca «cancelad»,
  «elimin» en el módulo entero (criterios 14 y 59). Arnés temporal para la barra
  a **375 px** con un nombre de ~60 caracteres (criterios 60 y 61), comprobando
  que el último bloque de la agenda **no queda tapado**.
- **Tajada 2:** casi todo test puro de `vida-execution.utils.ts` (19, 20, 22,
  23, 24, 26), con **caso con nombre** para los dos bloques de la misma
  actividad y para dos sesiones solapadas (los anchos suman 100). Tests de
  componente para 18, 21, 25, 27, 29 y **58** (falla solo `activityDayFollowUps`
  → se lee «falta lo que viviste», el plan se sigue viendo y **no se afirma «no
  hecho»**). Arnés para 62 (tema oscuro: las **dos** leyendas y el violeta de
  «en marcha» frente a la marca de «ahora» — si hace falta un token nuevo **se
  anota, no se improvisa**).
- **Tajada 3:** tests puros de `validateLogPast` (32, 36) y test de hoja con
  mutación que falla (36: no se cierra, no pierde lo elegido, y en la agenda
  **no queda una sesión fantasma**). El criterio 38 se comprueba **por
  estructura**: un test que afirma que `VidaPlaceInGapSheet` y
  `VidaLogSessionSheet` importan **el mismo** `VidaActivityPicker`. Y 37 con un
  espía: registrar **no llama** a ninguna mutación de `activityDayPlan`.
- **Tajada 4:** test puro de `buildDayClosingLine` con sus cuatro variantes
  (51), incluida la comprobación de que **ninguna** contiene «desperdici»,
  «perdiste», «fallaste» ni «vacío»; `noDataSlices` con el mínimo de 30 (48) y
  con el futuro **excluido** (50). El store con `localStorage` simulado **y con
  `localStorage` que lanza** (49: no se rompe nada). D9 con `setSystemTime` a
  tres horas distintas (39).
- **Renders como referencia visual:**
  `http://localhost:5173/docs/vida/assets/04-vida-planeado-ejecutado.html`
  (**marco B**) y `…/03-vida-agenda.html`. Con la ventana oculta:
  `document.getAnimations().forEach(a => a.finish())` y
  `dispatchEvent(new Event('scroll'))` tras `scrollTo`.

### Lo que no pude averiguar, y un aviso

- **No probé ni una llamada real.** Todo lo del servidor sale de leer
  `~/Developer/xavi-platform-node` (servicio, SDL y utilidades de tiempo), no de
  una respuesta. Las cuatro confirmaciones de arriba son firmes como lectura de
  código; el recorrido real sigue siendo el criterio 66, del usuario.
- **Aviso sobre el render y el criterio 24.** El **marco B** está fechado a las
  **21:40** con el día acabando a las **23:00** —o sea, **día aún en marcha**— y
  sin embargo pinta la leyenda de día terminado (*seguido · de más · fuera del
  plan · sin dato*) **y además** «te queda 1h 20». El criterio 24 dice que esa
  leyenda aparece **cuando el día se cierra**. **No reescribo el criterio: manda
  él**, y la línea «te queda …» se conserva en las dos formas (no estorba a
  ninguna). Pero la diferencia es real y la decide el usuario si al verlo no le
  cuadra: o el render adelanta el cambio de forma, o el criterio 24 manda y el
  marco B se lee como «el día ya terminó».
- **El coste de la cuarta consulta por día** (`activityDayFollowUps` dentro de
  `useVidaDayData`) no está medido. Es una consulta pequeña con `staleTime: 30 s`
  y la misma clave que usa la barra: no debería notarse, pero queda anotado.
- **No hay `graphify-out/reflections/LESSONS.md`** en este repositorio: no había
  memoria previa que leer. `graphify query` sobre los términos de la feature
  devolvió sobre todo documentación (`docs/activities-domain.md`) y tipos; la
  exploración útil fue `git ls-tree` sobre `79bece0` y lectura por rangos.

---

*Escrito por `feature-architect` el 2026-09-20. Fuentes: la sección 1 entera,
`docs/features/PROTOCOL.md`, `docs/features/ENVIRONMENT.md`, la sección 2 de
`FEAT-002` y de `FEAT-003` (y las secciones 3 y 4 de sus cinco tajadas),
`docs/vida/PLAN.md` (F3 y las decisiones 4, 8, 9, 11, 12 y 13), los renders 03 y
04-B, el código vivo de `src/features/vida/`, `src/shared/ui/Toast/` y
`src/features/habits/store/`, `git show 79bece0:…` función por función, y
`~/Developer/xavi-platform-node` (`activity-follow-up.service.ts`,
`activity-day-plan.service.ts`, `shared/utils/activity-follow-up-time.ts`).*

## 3. Construction — feature-builder

### Tajada 1 — empezar y terminar un bloque, con cronómetro y la sesión visible en el módulo

**Resumen para el revisor:**
1. `/app/vida/hoy` ya deja **empezar un bloque de hoy**, ver el **cronómetro** (que
   sobrevive a una recarga porque cuenta contra el `startTime` del servidor) y
   **terminarlo de un toque**, con el cierre completo —duración, notas en texto
   plano, subtareas— en el «···»; la sesión en marcha se ve en **todas** las
   pantallas de Vida desde un elemento de ruta nuevo, `routes/VidaModuleLayout.tsx`.
2. Lo escrito: 8 archivos nuevos de código + 3 de test, 14 modificados, uno de
   ellos fuera de Vida (`shared/ui/Toast`, prop `action` **aditiva**).
3. **Lo que más probablemente rompí, en orden:** (a) **`vidaRoutes` ahora tiene
   `element`** — todas las pantallas del módulo pasan por un componente que
   monta tres hooks; si `VidaModuleLayout` fallara, **cae el módulo entero**, no
   una pantalla; (b) **el layout de `VidaAgendaBlock`**: le puse
   `flex-wrap: wrap` y `flex: 1 1 8rem` al cuerpo para que el cronómetro no
   aplastara el nombre a «O…» en 375 px — eso toca **todos** los bloques, también
   los que no tienen sesión; (c) **`useUpdateActivityFollowUpMutation` y
   `useStartActivityFollowUpMutation` cambiaron de firma** (parámetro `options`
   opcional) y **los tres toasts de sesión cambiaron de texto**: si algún test
   ajeno los leía, se entera.

**Qué se construyó**

*Lo puro y los hooks*

- `src/features/vida/utils/vida-session.utils.ts` (**N**, + `.test.ts` con 35
  casos). El rescate de `79bece0`: `sessionStartInstant`, `followUpStartInstant`,
  `elapsedMinutes`, `formatElapsedHHMMSS` / `formatElapsedCompact` (literales),
  `isSessionFromAnotherDay`, `describeOverPlan`, `startSessionInput`,
  `closeSessionInput`, `minutesUntilEndTime`, `translateSessionError`,
  `VIDA_UNKNOWN_SESSION_MINUTES = 30` y `resolveUnknownEndMinutes`. **`now`
  siempre inyectado**; ni un `new Date()` escondido. Aquí vive la trampa de
  medianoche: todo se calcula **entre instantes**.
- `src/features/vida/hooks/useVidaElapsed.ts` (**N**, + `.test.tsx`). El
  cronómetro: tic de 1 s, `Date.now() − inicio` en cada tic, `clearInterval` al
  desmontar, y **sin intervalo** cuando no hay sesión.
- `src/features/vida/hooks/useVidaOpenSession.ts` (**N**). Envuelve
  `useActivityOpenFollowUpQuery` **sin tocarla** y deriva
  `{ session, startInstant, isFromAnotherDay, isDisabled, isPending }`. Exporta
  además `useVidaSessionPlannedMinutes` (ver desviaciones).
- `src/features/vida/hooks/useVidaSessionActions.ts` (**N**, + `.test.tsx` con 12
  casos). La orquestación, molde `useCreateStartingActivities`: **no lanza,
  resuelve**. `start` cierra la anterior y **solo en el éxito** empieza la nueva;
  `finishNow`, `finishWith`, `discard`, `resolveStale`.
- `src/features/vida/hooks/useVidaSessionUi.ts` (**N**, no estaba en el plan; ver
  desviaciones). El contexto que deja al bloque de la agenda abrir el modal que
  monta el layout.

*Lo que se ve*

- `src/features/vida/components/VidaSessionBar/` (**N**, 3 archivos). Barra fija
  abajo: icono con el color de la categoría, nombre truncable que enlaza a Hoy,
  cronómetro `aria-live="polite"`, «llevas 52 min · planeado 45» **sin color de
  alarma**, «Terminar» y «···». **Sin «Cancelar».**
- `src/features/vida/components/VidaFinishSessionModal/` (**N**, 3 archivos). El
  cierre completo: `VidaDurationPills` + `textarea` + subtareas con «1 de 2», y
  «No era esto — no guardarla» con `ConfirmDialog` cuya salida es «Volver».
- `src/features/vida/components/VidaStaleSessionPrompt/` (**N**, 3 archivos). La
  pregunta de D3, **tarjeta y no modal**.
- `src/features/vida/routes/VidaModuleLayout.tsx` (**N**, + `.test.tsx` con 9
  casos) y `VidaModuleLayout.module.scss`: barra + pregunta + modal + hueco
  reservado abajo + `Outlet`.
- `src/features/vida/components/VidaAgendaBlock/` (**M**): «▶ Empezar», el estado
  «planeado 45 min · en marcha» con cronómetro, el aviso de pasarse, y
  «Terminar y añadir una nota» en el «···». Todo detrás de props opcionales.
- `src/features/vida/pages/VidaHoyPage.tsx` (**M**, + 7 tests nuevos en su
  `.test.tsx`): cablea la sesión a los bloques.

*La capa de datos y el vocabulario*

- `graphql/activity-followups.graphql.ts`, `api/…`, `types/…`,
  `hooks/useActivityFollowUps.ts` (**M**): `sessionSubtasks` **solo** en
  `ACTIVITY_OPEN_FOLLOW_UP_QUERY`, `ACTIVITY_FOLLOW_UP_SUBTASK_EDIT_MUTATION`,
  `editActivityFollowUpSubtask`, `useEditFollowUpSubtaskMutation`, `options.silent`
  en `start` y `update`, y **los tres toasts reescritos**: «Actividad iniciada» →
  **«En marcha»**, «Actividad cancelada» → **«No la guardamos»**, «Registro
  eliminado» → **«Lo quitamos del registro»**.
- `graphql/contracts.test.ts` (**M**): el documento nuevo en la lista. **Ningún
  SDL recopiado**: `activity.schema.graphql` ya traía todo.
- `src/features/vida/vida-vocabulary.test.ts` (**N**, no estaba en el plan): lee
  el módulo entero con `import.meta.glob(?raw)`, **le quita los comentarios** y
  comprueba que no queda ninguna palabra de culpa ni «cancelar»/«eliminar».
- `src/shared/ui/Toast/` (**M**, 4 archivos): `action?: { label, onClick }`,
  aditivo. Ningún llamante actual cambia.

**Por qué así, y qué se descartó**

- **La barra en un elemento de ruta y no en `AppLayout`**, como mandaba el plan.
  La frontera del criterio 7 es el subárbol de rutas y no se puede
  desincronizar; `app-nav.config.ts` no conoce `/app/vida/semana`.
- **La sesión abierta no se guarda en el cliente.** La verdad es
  `duration_minutes IS NULL` en el servidor; el cronómetro tictaquea en el
  cliente contra `Date.now()` y **no pide nada**. Sin `refetchInterval`.
- **«Terminar» no pregunta nada** (D2) y el toast lleva la acción. Para eso los
  hooks ganaron `silent` y el toast lo lanza `useVidaSessionActions`, que sí
  conoce la sesión. Descartado: que el hook genérico supiera de notas.
- **El «No sé» anota la duración planeada, o 30 min.** Descartado «hasta el fin
  del día»: en una sesión abierta a las 9:00 habrían sido **catorce horas** que
  nadie vivió. Está probado con ese caso.
- **El cierre→empezar es en serie y aborta**. Descartado empezar primero: el API
  devuelve 400 y quedaría la primera sin cerrar.
- **El mensaje del API en inglés no llega a pantalla.** Traducido en una función
  pura; lo que no conocemos cae en el texto nuestro, que sí está en el
  vocabulario del módulo.

**Desviaciones del plan, dichas**

1. **Dos archivos que el plan no listaba.** `hooks/useVidaSessionUi.ts` (contexto
   con `openFinishModal`) y `vida-vocabulary.test.ts`. El primero existe porque
   entre el layout del módulo y el bloque de la agenda hay un `Outlet`: sin él
   habría **dos** `VidaFinishSessionModal` montados —uno en el layout y otro en la
   página—, que son dos estados que se contradicen. El segundo es el test que el
   plan pedía «que busque "cancelad" y "elimin" en el módulo entero»; lo que no
   dijo es dónde vive.
2. **`useVidaSessionPlannedMinutes` vive dentro de `useVidaOpenSession.ts`**, no
   en un archivo propio. Es el recorte del criterio 16 que el arquitecto ya
   escribió (el bloque de ese día con el mismo `activityId`; con más de uno,
   `null`), y lo usan los criterios 9 y 16. No abre ninguna consulta nueva.
3. **`useStartActivityFollowUpMutation` también ganó `{ silent }`**; el plan solo
   lo pedía para `update`. Sin eso, «empezar con otra en marcha» dejaría **dos**
   toasts sobre un solo gesto, y el criterio 15 pide que se diga **una** cosa.
4. **El «···» de la barra es un `IconButton` directo, no un `Popover`.** Con un
   solo destino —el cierre completo—, un menú de un ítem es un clic de más. La
   etiqueta accesible dice a dónde lleva.
5. **`VidaAgendaBlock` cambió su layout para todos los bloques**, no solo para el
   que está en marcha: `flex-wrap: wrap` en `.card` y `flex: 1 1 8rem` en `.body`.
   Medido en el arnés a 375 px: sin eso el nombre se leía «O…» y «planeado 45
   min» se apilaba palabra a palabra. Sin sesión no hay nada que envolver y la
   tarjeta se ve igual que antes.
6. **Un test de FEAT-003 quedó derogado**, como pasó con el de F0 en la tajada 2
   de aquella feature: `VidaHoyPage.test.tsx` afirmaba «no hay nada de vivir el
   día (criterio 22)» y los criterios 1, 2, 3 y 5 de **esta** piden lo contrario.
   Se reescribió a lo que **sí** sigue siendo cierto —no hay etiquetas de
   ejecutado, que son la tajada 2— con la derogación explicada encima. **No se
   borró: se acotó.**
7. **El violeta de «en marcha» usa `--aura-ring-to`**, el mismo token que la
   marca de «Ahora» de FEAT-003, y no un token nuevo. El hallazgo abierto de
   FEAT-003 sobre los dos violetas en oscuro **sigue abierto**: se mira en la
   tajada 2, que es donde está el criterio 62 con las dos leyendas delante.

**Verificación**

Línea base, antes y después (`docs/features/ENVIRONMENT.md`):

| Qué | Antes | Después |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 errores / 0 warnings** (mismos archivos) |
| `pnpm test` | 2 fallos de 931 | **2 fallos de 1005** (los mismos `SearchSelect`; **+74 tests**) |
| `pnpm build` | chunk inicial 917,0 kB | **934,79 kB** (+17,8 kB; `app-icons` sigue en 620,20 kB y `IconPicker` en 4,64 kB: **ninguno de iconos**) |

Los tres nuevos ficheros de test y lo que cierran:

- `vida-session.utils.test.ts` — 35 casos. Criterio 3 (una fecha rota da `null`,
  no «ahora»), 5 (`Math.max(1, …)`), **63** (23:50 → 00:10 son **20 min**, en
  positivo, y `closeSessionInput` **no toca `date`**), 17 (empezar a las 9:05 un
  bloque de las 9:00 registra **9:05**), 16 (los tres casos del «No sé»:
  planeado / por defecto / recortado al fin del día, más «una sesión de las 9:00
  **no** anota 840 min»), 9 y 59 (ningún texto con palabra de culpa).
- `useVidaElapsed.test.tsx` — temporizadores falsos. Criterio 3 (se monta 40 min
  después y marca **40:00**, no 00:00; y con el reloj movido media hora y **un
  solo tic** marca 00:30:01, no 00:00:01 → **no acumula**), criterio 4 (avanzar
  1 s repinta; al desmontar `vi.getTimerCount()` vuelve a su valor de antes),
  criterio 63.
- `useVidaSessionActions.test.tsx` — `QueryClient` de verdad y el `api` mockeado.
  Criterio 15 en sus dos mitades (**cierra la anterior con 38 min y deja un solo
  mensaje**, «Terminamos «Organizar la casa» a las 10:08. En marcha: Leer un
  rato»; y **si el cierre falla, `activityFollowUpStart` no se llama** y la
  sesión sigue en caché), criterio 13 (`start` dos veces en el mismo tic →
  **una** llamada), 16 (con una de otro día no se empieza nada), 5 (el toast
  lleva acción), 12 (`finishWith` **resuelve** el fallo en vez de lanzarlo).
- `VidaModuleLayout.test.tsx` — 9 casos: criterios 7, 8, 9, 14, 16, 54, 60, 64.
- `VidaHoyPage.test.tsx` — 7 casos nuevos: criterios 1 (hoy sí, futuro no, pasado
  no), 2, 3, 5, 9, 16.
- `vida-vocabulary.test.ts` — 8 casos sobre el módulo entero.
- `contracts.test.ts` — 75 casos, con el documento nuevo dentro.

**Mirado en el navegador** (arnés temporal `arnes-sesion-vida.html` +
`src/arnes-sesion-vida.tsx`, **ya borrado**, con `MemoryRouter` y datos
sintéticos), a **375 px y en tema oscuro**, con un nombre de **56 caracteres**:

- La barra de sesión: nombre recortado con puntos suspensivos, cronómetro
  `00:52:04` corriendo, «Terminar» y «···» enteros. `document.documentElement.scrollWidth === clientWidth === 375`:
  **cero scroll horizontal** (criterios 60 y 61).
- El bloque en marcha: «planeado 45 min · **en marcha**» en violeta, «llevas 52
  min · planeado 45» en el tono de dato, y el cronómetro con «Terminar» bajando a
  su propia línea. **Sin el arreglo de `flex-wrap` esto se leía «O…»**: es la
  desviación 5.
- El cierre completo: «CUÁNTO DURÓ» con las píldoras, «NOTAS», «SUBTAREAS 1 de
  2» con sus dos casillas, «No era esto — no guardarla» a la izquierda y
  «Volver»/«Guardar» a la derecha, sin desbordar.
- La pregunta de otro día: «Dejaste «…» en marcha el jueves 17 a las 21:00 ·
  ¿Hasta qué hora la hiciste?», el campo de hora, «Guardar», «No sé», y las dos
  líneas que explican **qué se va a anotar** («anotamos 45 min —lo que tenías
  planeado—») y **qué bloquea**. Ninguna palabra prohibida en todo el nodo.

**Criterios, uno a uno**

| # | Estado | Evidencia |
|---|---|---|
| 1 | **a medias, como dijo el plan** | La mitad de los días cierra: hoy sí, futuro no, pasado no (3 tests en `VidaHoyPage.test.tsx`). La mitad de «ni registrado» **necesita el cruce de D1** y es la tajada 2. |
| 2 | ✅ | `startSessionInput` + test de la página: `start('a-b2')` sin recargar. |
| 3 | ✅ | `useVidaElapsed.test.tsx` (40:00 al montar; no acumula) y el test de la página (00:24:00). |
| 4 | ✅ | `vi.getTimerCount()` vuelve a su valor al desmontar; 1 s repinta. |
| 5 | ✅ | `finishNow` cierra con los minutos del cronómetro sin diálogo, y el toast lleva «añadir una nota» (`hasAction: true`). |
| 6 | ✅ | `VidaFinishSessionModal`, visto en el arnés; se llega desde el «···» de la barra, el del bloque y el toast. |
| 7 | ✅ | `VidaModuleLayout` es el `element` de `path: 'vida'`: **todas** sus pantallas, incluidas `semana` y `actividades/archivadas`. Fuera del módulo no se monta. |
| 8 | ✅ | Una sola `useActivityOpenFollowUpQuery` (misma clave, deduplicada); al cerrar, `setQueryData(open, null)` la quita sin recargar. |
| 9 | ✅ | «llevas 84 min · planeado 30» en el bloque y en la barra, sin `dialog`, sin `alert`, sin color de alarma. |
| 10 | ⚠️ **parcial** | El documento, el tipo, el `api`, la mutación y la lista con «1 de 2» están y se ven en el arnés. **No se pudo probar con datos reales** (ver abajo). |
| 11 | ✅ | `invalidateFollowUpQueries` ya lo cubría; no se añadió ninguna invalidación. |
| 12 | ✅ | `finishWith` resuelve `{ ok: false, message }`, el modal pinta el `Alert` y **no se cierra**; `start` que falla deja la sesión en caché. |
| 13 | ✅ | Guardia con `ref` **síncrona**: dos toques en el mismo tic → una llamada. |
| 14 | ✅ | «No era esto — no guardarla» con salida «Volver»; los dos toasts heredados reescritos y comprobados. |
| 15 | ✅ | Los dos tests del cierre→empezar, con el mensaje único. |
| 16 | ✅ | `VidaStaleSessionPrompt` + `resolveUnknownEndMinutes` con sus tres casos; nunca «hasta el fin del día». |
| 17 | ✅ | `startSessionInput` con `now` inyectado. |
| 54 | ✅ | Tarjeta, no modal (`queryByRole('dialog')` vacío); dice de qué día es y qué bloquea. |
| 59 | ✅ (lo de esta tajada) | `vida-vocabulary.test.ts`. **Con cuatro excepciones nombradas** (ver hallazgos). |
| 60, 61, 63 | ✅ en lo que toca a la barra y el cierre | Arnés a 375 px, nombre de 56 caracteres, cero scroll horizontal; medianoche probada en puro. |
| 64 | ✅ | `isDisabled` no pinta barra ni pregunta ni `aria-busy`. |
| 65 | ✅ | La tabla de la línea base. |
| 66 | **pendiente del usuario** | Ver abajo. |

**Lo que no pude comprobar, sin disimular**

- **Ni una llamada real al API.** Los agentes no entran con credenciales
  (`ENVIRONMENT.md`) y todo `/app/*` está detrás del login. Lo del servidor está
  probado contra el `api` mockeado y contra el SDL vendorizado, no contra una
  respuesta. Durante esta sesión la sonda dio la API de Render **OCUPADO**
  (dormida): tampoco habría servido.
- **Las subtareas de sesión (criterio 10) no se han visto con datos del
  servidor.** El SDL las tiene, el contrato valida y la lista se pinta en el
  arnés; que `activityFollowUpSubtaskEdit` devuelva lo que esperamos **está sin
  comprobar**. Es lo más frágil de la tajada. Además, el catálogo (F1) no crea
  subtareas, así que es un caso que casi no ocurre hoy.
- **El toast con acción no se ha tocado con el dedo**: está probado por unidad
  (`hasAction`) y el botón existe en el viewport, pero nadie ha pulsado «añadir
  una nota» sobre una sesión real.
- **Recarga de verdad**: el criterio 3 está probado con temporizadores falsos y
  por construcción (la verdad es del servidor), no recargando el navegador con
  sesión.

**Recorrido manual, para el usuario** (criterio 66, con la API despierta):

1. En `/app/vida/hoy`, un bloque de hoy → **▶ Empezar**. Aparece la barra abajo y
   el bloque dice «planeado N min · en marcha» con el cronómetro.
2. Ve a `/app/vida/plantilla`, a `/app/vida/actividades` y a `/app/vida/semana`:
   **la barra sigue ahí**. Entra en `/app/habits/my-day`: **no está**.
3. **Recarga** la página: el cronómetro **no vuelve a cero**.
4. Deja pasar el tiempo planeado: el bloque y la barra dicen «llevas N min ·
   planeado M». **Nada interrumpe.**
5. **Terminar** de un toque → toast «Anotado: N min…» con **«añadir una nota»**.
   Púlsalo: se abre el cierre completo sobre esa misma sesión; escribe una nota y
   guarda.
6. Empieza un bloque y, **sin terminarlo**, empieza otro: un solo aviso que dice
   «Terminamos «X» a las HH:MM. En marcha: Y».
7. Empieza algo y, desde el «···» de la barra, usa **«No era esto — no
   guardarla»**: el diálogo sale con «Volver» y nunca dice «cancelar».
8. **Lo de ayer:** deja una sesión abierta y vuelve al día siguiente. Tiene que
   salir la pregunta arriba del módulo —**no un cronómetro de catorce horas**— y
   el «No sé» tiene que decir **antes** cuántos minutos va a anotar.
9. A 375 px y en oscuro, comprueba que la barra **no tapa** el último bloque de
   la agenda.

**Hallazgos, sin tocarlos**

- **Cuatro «cancelar»/«eliminar» anteriores a esta feature siguen en el módulo** y
  están nombrados en `vida-vocabulary.test.ts`: el botón «Cancelar» de
  `VidaActivitySheet` y de `CreateVidaCategoryStep`, y los toasts «Actividad
  eliminada» (`useActivities`) y «Categoría eliminada» (`useActivityCategories`).
  El criterio 59 habla de **la sesión y el bloque**, así que quedan fuera de esta
  tajada; si el vocabulario de Vida manda también en el catálogo, es una tarea
  aparte. El test lo dice en voz alta y **falla si alguien los arregla y olvida
  quitar la excepción**.
- **`useVidaSessionPlannedMinutes` pide `activityDayPlan` del día de la sesión.**
  Para hoy es la misma consulta que ya pide la pantalla (gratis); para una sesión
  **de otro día** es una consulta más, y solo mientras la pregunta esté en
  pantalla. Anotado por si en la tajada 2 conviene moverla.
- **El chunk inicial creció 17,8 kB** y ninguno es de iconos. El módulo Vida no
  está en `lazy`, así que todo lo nuevo entra en el arranque; si el paquete
  empieza a preocupar, el corte natural es el módulo entero, no esta tajada.
- **Un detalle del cronómetro al cambiar de sesión:** `useVidaElapsed` guarda los
  milisegundos en estado y el primer tic llega dentro del efecto, así que al
  saltar de una sesión a otra puede haber **un fotograma** con el valor de la
  anterior. No se ve a simple vista y no toca ningún criterio; queda escrito.

**Estado del árbol:** sin commitear. 14 archivos modificados y 11 nuevos bajo
`src/`, más este dossier y `BOARD.md`. El arnés temporal está **borrado**
(`arnes-sesion-vida.html` y `src/arnes-sesion-vida.tsx`). `graphify update .`
corrido: 3117 nodos, 3512 aristas.

### Tajada 2 — lo real encima de lo planeado, y el presupuesto en dos formas

**Resumen para el revisor:**
1. `/app/vida/hoy` ya **cruza lo vivido con el plan**: cada bloque se queda en su
   hora y enseña «✓ calcado» / «empezó +N» / «+N min» / «−N min» con sus **horas
   reales** y su barrita **plan frente a real**; lo que no es de ningún bloque se
   pinta **fuera del plan** punteado en su hora; el **movido** deja sombra («→
   hecho a las 20:40») y lo real donde ocurrió («100 min tarde»); y el
   presupuesto tiene **dos formas** —*hecho · en marcha · planeado · libre* con
   el día en marcha, *seguido · de más · fuera del plan · sin dato* con el día
   cerrado— que suman el 100 % y dicen sus minutos.
2. Lo escrito: **3 archivos nuevos de código + 1 de test**
   (`utils/vida-execution.utils.ts`, `components/VidaPlanVsRealBar/`,
   `components/VidaAgendaSession/`), **9 modificados**, ninguno fuera de
   `features/vida`.
3. **Lo que más probablemente rompí, en orden:** (a) **`VidaHoyPage` ya no
   recorre `agenda.entries` sino `execution.entries`**, y esa lista **parte los
   huecos** alrededor de una sesión suelta — cambia las ventanas que se ofrecen
   para colocar en un día con algo registrado, que es lo que usan las fichas de
   plantilla y «+ otra cosa» de FEAT-003; (b) **`useVidaDayData` tiene una cuarta
   consulta** y entra en su `isPending`: si `activityDayFollowUps` va lenta, la
   pantalla entera espera (antes no); (c) **«en marcha» ya no lo decide el
   `activityId` sino el cruce**, así que depende de que la sesión abierta esté en
   la lista del día — la uno a mano en la página, y si el API cambiara de forma
   ahí es donde se nota.

**Qué se construyó**

*Lo puro*

- `src/features/vida/utils/vida-execution.utils.ts` (**N**, + `.test.ts` con 37
  casos). El archivo **hermano** que pedía la decisión 3 del plan:
  `buildDayAgenda` no gana una cuarta variante ni `AgendaBlock` un campo nuevo.
  Contiene los dos umbrales (`VIDA_ON_PLAN_TOLERANCE_MINUTES = 5`,
  `VIDA_MOVED_THRESHOLD_MINUTES = 60`), `toSessionSpans`,
  `matchSessionsToBlocks`, `describeBlockExecution`, `getExecutedBudget`,
  `isDayClosed` y `buildDayExecution`. **Puro y con `now` inyectado**: ni un
  `new Date()` dentro.
- **El cruce (D1)**: un solo pase sobre las sesiones ordenadas por hora; cada una
  va al bloque **libre** de su actividad más cercano en hora, el empate lo gana
  el más temprano, ningún bloque recibe dos y ninguna sesión va a dos. Lo que
  sobra queda `unmatched` y se pinta fuera del plan.
- **El 100 % (criterio 26)**: no se suman duraciones. El día se **parte por los
  bordes** de todo lo que hay (ventana, bloques, sesiones) y cada trocito se
  clasifica **una vez**, con prioridad. Por eso dos sesiones solapadas, o una
  sesión encima de su bloque, no cuentan dos veces. Es también el motivo por el
  que **no se rescató** `getUsedMinutesFromFollowUps` de `79bece0`, como decía el
  plan.

*Lo que se ve*

- `components/VidaPlanVsRealBar/` (**N**, 3 archivos): la barrita del criterio 21
  con «plan 30 · real 41» **como texto real**, no en un `title`. Sin rojo: durar
  más no es un fallo.
- `components/VidaAgendaSession/` (**N**, 3 archivos): la sesión que no es de
  ningún bloque, o lo real de un movido. Mismo esqueleto que el bloque y el
  hueco, trazo **punteado**, con su actividad, sus horas, su duración y su
  etiqueta («fuera del plan» · «100 min tarde» · «120 min antes»).
- `components/VidaAgendaBlock/` (M): prop **opcional** `execution`. Sin ella el
  bloque se pinta **exactamente** como lo dejó FEAT-003 (criterios 27 y 29). Con
  ella: las etiquetas, las horas reales en vez de la duración planeada, la
  barrita, y la **sombra** del movido (trazo discontinuo + «→ hecho a las
  20:40»).
- `components/VidaDayBudget/` (M): prop **opcional** `executed` con las **dos
  formas** de D5 y la línea que explica el cambio («Tu día ya terminó: esto es lo
  que pasó.»). La forma `planned` es, literal, la barra de FEAT-003.
- `pages/VidaHoyPage.tsx` (M): recorre `execution.entries`, cablea
  `execution.byBlockId` a cada bloque y pasa `executed` al presupuesto. Y cierra
  **la otra mitad del criterio 1**: un bloque que ya tiene sesión no ofrece
  «▶ Empezar».
- `hooks/useVidaDayData.ts` (M): la cuarta consulta,
  `useActivityDayFollowUpsQuery(date)` —que ya existía y ya está apagada en los
  días futuros—, con `followUps`, `isFollowUpsError` y **«lo que viviste»** en
  `failed`, que es el criterio 58 literal.
- `hooks/useVidaOpenSession.ts` + `routes/VidaModuleLayout.tsx` (M): el
  **hallazgo 1** de la revisión de la tajada 1. La consulta expone `isError` y
  `refetch`, y el layout pinta «No pudimos saber si tienes algo en marcha» con
  «Reintentar» en vez de callar y parecer que no hay nada.

**Por qué así, y qué se descartó**

- **Dónde vive lo ejecutado.** En el archivo hermano, como mandó el arquitecto.
  Se descartó meterlo en `vida-agenda.utils.ts`: lo importan
  `vida-gap-form.utils.ts`, `VidaAgendaGap` y `VidaTemplateAside`, a los que esto
  no les incumbe.
- **El movido sigue emparejado con su bloque.** El criterio 19 dice «a menos de
  60 min» y el 23 pide la sombra: si se cortara la pareja a los 60, el 23 no
  tendría de dónde sacarla. Se hace como resolvió la decisión 4 del plan —pareja
  marcada como movida— y queda escrito en la cabecera del archivo.
- **Los huecos se parten alrededor de una sesión suelta.** La alternativa era
  dejar el hueco entero y pintar la sesión al lado, pero entonces la agenda diría
  «Libre 19:30 – 21:30 · 2h» encima de una sesión de 32 min que ocurrió dentro:
  la agenda y la leyenda dejarían de decir los mismos minutos (criterio 26).
- **Tres formas de presupuesto, no dos.** El criterio 24 nombra dos; el 29 pide
  que un día **con plan y nada registrado** se vea como lo dejó F2. Con dos
  formas, un día pasado sin registro habría estrenado «sin dato 16h 30», que es
  justo el tramo inventado que el 29 prohíbe. Por eso `form: 'planned'` existe y
  es la de FEAT-003. **No reescribo el criterio: lo digo.**
- **«Sin dato» es el resto de la forma cerrada.** El criterio 24 fija cuatro
  tramos y el 26 fija el 100 %: todo minuto que ninguna sesión cubre —incluido un
  bloque planeado que no se hizo— cae ahí. La tajada 4 es la que sabe llamar a
  eso «no hecho», y lo hará **en la agenda**, que es donde se lee con su nombre.
  Está escrito en la cabecera de `getExecutedBudget`.
- **La sesión abierta se une a la lista del día antes de cruzar.**
  `activityDayFollowUps` es la fuente de lo vivido, pero **nadie ha podido
  comprobar contra el API real** si incluye la que sigue abierta; si no la
  trajera, el bloque en marcha habría dejado de estarlo en cuanto la tajada 2
  pasó a decidirlo por el cruce. Se une por `id`, sin duplicar, y la de otro día
  no entra. **Es una desviación del plan** (el plan solo nombraba
  `activityDayFollowUps`) y está comentada en `VidaHoyPage.tsx`.
- **Desviación 2: `useVidaOpenSession` y `VidaModuleLayout` no están en la fila
  2 de la tabla del arquitecto.** Se tocan porque el revisor asignó
  explícitamente a esta tajada el hallazgo 1 («el error de la consulta de la
  sesión abierta no se ve por ninguna parte»). Son 12 líneas y no cambian ningún
  contrato: `isError` y `refetch` son **aditivos**.
- **Desviación 3: `data-form` en la barra y la leyenda.** Medido en oscuro,
  «hecho» y «planeado» salían **del mismo mint** y el criterio 62 pide que los
  cuatro tramos se distingan entre sí. Con el día en marcha, lo que queda por
  delante baja al 55 %. La forma de F2 no cambia.
- **El violeta de «en marcha» va rayado.** Es lo que lo separa de la marca de
  «ahora», que es una línea violeta lisa: el hallazgo abierto de FEAT-003 sobre
  los dos violetas en oscuro se cierra **sin inventar un token nuevo**, que es lo
  que pedía el criterio 62.

**Verificación**

*Las comprobaciones del `ENVIRONMENT.md`, enteras, antes y después*

| Qué | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos |
| `pnpm test` | 2 fallos de 1005 (`SearchSelect` ×2) | **2 fallos de 1054**, los dos de `SearchSelect` (`filters options by search query`, `selects an option`). **+49 tests**, ninguno nuevo en rojo |
| `pnpm build` | inicial 934,79 kB · `app-icons` 620,20 · `IconPicker` 4,64 | **945,13 kB** · `app-icons` **620,20** · `IconPicker` **4,64** — **+10,3 kB, y no de iconos** |

*Los tests puros, caso por caso* (`vida-execution.utils.test.ts`, 37):
calcado (±5 en inicio y duración, y los dos bordes: 09:05 sí, 09:06 no), «+11
min», «−8 min», «empezó +20» dentro del umbral, **movido** (20:00 todavía no,
20:01 sí) con su sombra y su «100 min tarde» / «120 min antes», **fuera del
plan**, **dos bloques de la misma actividad** con una sesión (va al más cercano)
y con dos (una cada uno, ninguno con dos), tres sesiones y dos bloques (la que
sobra queda fuera del plan), **sesión en marcha** (no se compara nada todavía),
**sesión que cruza el fin del día** (22:40 + 120 min se lee «22:40 – 23:59» y
«+90 min», sin dar la vuelta ni salirse de la barra), día cerrado por la hora de
fin, día sin plan con sesiones, y **seis combinaciones distintas comprobando que
segmentos y leyenda suman exactamente los minutos del día**.

*Los tests de pantalla* (`VidaHoyPage.test.tsx`, 10 nuevos): «✓ calcado» con sus
horas reales y el bloque todavía a las 8:00; «+18 min» con «plan 45 · real 63»;
«empezó +30»; «fuera del plan» en su hora sin tocar el plan; el movido con
sombra y su real contados **una vez**; las dos leyendas; el criterio 29; la otra
mitad del criterio 1; y el criterio 58. En `VidaModuleLayout.test.tsx`, 2 más
para el aviso del hallazgo 1 y su ausencia sin sesión de usuario.

*Lo que miré en el navegador* (arnés temporal `src/arnes-ejecutado.html` +
`src/arnes-ejecutado.tsx`, **ya borrados**; `MemoryRouter`, datos sintéticos, sin
`localStorage` —el tema se fija en `data-theme` a mano, no con `ThemeProvider`,
que persiste— y un día vivido a medias: calcado, +11, empezó +10 / −8, fuera del
plan, movido y una sesión en marcha, en las **dos** formas del presupuesto):

- **Los anchos suman el 100 %, medido:** día en marcha **100,0000 %** en 21
  tramos; día cerrado **99,9999 %** en 19 (redondeo de coma flotante al sumar
  porcentajes; los **minutos** suman exacto, y eso lo fija el test puro).
- **La leyenda cuadra con el día:** en marcha, `3h17 + 10m + 1h2 + 12h1 = 990
  min = 16h 30`; cerrado, `1h41 + 40m + 57m + 13h12 = 990`.
- **375 px:** `scrollWidth === clientWidth === 375` — **cero scroll horizontal**,
  con el bloque en marcha, la sesión suelta y la barrita en pantalla.
- **Texto largo:** un nombre de 51 caracteres se recorta en **una línea**
  (216,6 × 22,5 px) y no empuja la tarjeta ni en el bloque ni en la sesión
  suelta.
- **Tema oscuro, medido y no deducido:** los cuatro tramos de cada leyenda salen
  con **fondos distintos** —`rgb(78,222,163)` / violeta rayado / mint 55 % / mint
  18 % en la forma en marcha; mint / mint 45 % / violeta 70 % / gris 25 % en la
  cerrada—. Antes del arreglo, «hecho» y «planeado» eran **el mismo color**: lo
  cacé aquí. La marca de «ahora» es `rgb(167,139,250)` **lisa** y el tramo «en
  marcha» es el mismo violeta **rayado**, así que se distinguen.
- Leído en pantalla, en oscuro y en 375: «✓ calcado», «+11 min · plan 30 · real
  41», «empezó +10 · −8 min», «fuera del plan», «planeado 30 min · → hecho a las
  20:40», «100 min tarde», «Tu día ya terminó: esto es lo que pasó.» y los dos
  huecos partidos alrededor del movido («Libre 19:30 – 20:40 · 1h 10» y «Libre
  21:12 – 21:30 · 18m»).
- Contrastado con los renders: `docs/vida/assets/03-vida-agenda.html` («hecho 1h
  25 · en marcha 24m · planeado 3h 20 · libre 10h 16» — la misma leyenda) y el
  **marco B** de `04-vida-planeado-ejecutado.html` («✓ calcado», «+11 min», «plan
  30 · real 41», «empezó +5», «−8 min», «fuera del plan», «→ hecho a las 19:40»,
  «40 min tarde»). **Donde el render y el criterio no coinciden manda el
  criterio** (criterio 24): el marco B dibuja la leyenda cerrada a las 21:40 con
  el día todavía abierto, y aquí eso es la forma *en marcha*.

**Criterios que cierra**

| # | Cómo queda | Evidencia |
|---|---|---|
| 1 (su otra mitad) | cerrado | Un bloque con sesión —abierta o cerrada— no recibe `onStart`, así que no pinta «▶ Empezar». Test de pantalla con los tres bloques y solo dos botones. |
| 18 | cumplido | Los bloques salen de `agenda.entries` y **no se reordenan**: el cruce solo les cuelga datos. Las sesiones sueltas entran por hora de inicio. Test: el bloque sigue a las 8:00 con su sesión de las 8:02. |
| 19 | cumplido | `matchSessionsToBlocks`, pura, con seis casos entre ellos los dos de «dos bloques de la misma actividad». Ningún bloque con dos, ninguna sesión en dos, un solo pase. |
| 20 | cumplido | Las dos constantes con nombre en un solo sitio, y los cuatro bordes probados (±5 y ±60). «✓ calcado», «empezó +N», «+N min», «−N min» y las horas reales, todo como texto. |
| 21 | cumplido | `VidaPlanVsRealBar` con «plan 30 · real 41» en un `<span>` de verdad; la barrita es `aria-hidden`. Visto en el arnés y en el test de pantalla. |
| 22 | cumplido | `VidaAgendaSession` punteado, en su hora, con actividad, horas y duración. El plan **no se toca**: los tres bloques siguen. |
| 23 | cumplido | Sombra con «→ hecho a las 20:40» + lo real con «100 min tarde», y el presupuesto lo cuenta **una vez** (el movido va a «fuera del plan», no a «seguido» ni a «de más»). Test: `getAllByText('11:40 – 12:12 · 32m')` devuelve **1**. |
| 24 | cumplido | Las dos formas, sin mezclarse, cada tramo con sus minutos. `isDayClosed` probado en los tres casos (día pasado, 22:59, 23:00). |
| 25 | cumplido | «Tu día ya terminó: esto es lo que pasó.» al cerrarse; «Tu día está en marcha: esto llevas y esto queda.» mientras dura. |
| 26 | cumplido | Medido en el navegador (100,0000 % / 99,9999 %) y fijado en el test puro con seis combinaciones, incluidas **dos sesiones solapadas** y una que cruza el fin del día. |
| 27 | cumplido | En un día futuro `useActivityDayFollowUpsQuery` está apagada → `followUps` vacía → `hasExecution` falso → ni una etiqueta. La marca de «ahora» la sigue poniendo `buildDayAgenda`, sin tocar. |
| 28 | cumplido | Una sola consulta más, la que ya existía. **Ninguna por bloque** y ninguna clave nueva en `query-keys.ts`. |
| 29 | cumplido | Con `spans.length === 0` el presupuesto devuelve `form: 'planned'` y `entries` es **`agenda.entries` idéntico** (`toEqual` en el test puro). La leyenda omite los tramos de cero. Ningún número sale del historial de otras semanas. |
| 53 | cumplido | Un día sin plan con sesiones: la agenda las pinta en su hora, el presupuesto las cuenta (test puro: «fuera del plan 45m») y el texto añade «Lo que hiciste está abajo, en su hora.» antes de hablar de la plantilla. |
| 55 | cumplido | El bloque en marcha no cambia de posición ni de hora: `execution` no toca `startMinutes`. Visto en el arnés con la sesión abierta encima del bloque de las 21:30. |
| 57 | cumplido | `isPending` de `useVidaDayData` incluye la cuarta consulta y la pantalla devuelve el esqueleto antes de afirmar nada. |
| 58 | cumplido | `failed` gana «lo que viviste», el plan se sigue viendo, hay «Reintentar» y **no se pinta ninguna etiqueta de ejecutado** con lo vivido caído. Test de pantalla. |
| 62 | cumplido **en el arnés**, pendiente de verlo dentro de la app | Los ocho fondos medidos en oscuro, distintos dentro de cada forma; el violeta rayado de «en marcha» frente a la marca de «ahora» lisa. Lo que **no** pude mirar es la pantalla real de `/app/vida/hoy` en oscuro: está detrás del login. |
| 65 | cumplido, medido | La tabla de arriba. |

**Riesgos**

1. **La lista de la agenda cambió de fuente.** `execution.entries` **parte los
   huecos** alrededor de una sesión suelta, así que en un día con algo registrado
   las ventanas que ofrecen las fichas de plantilla y «+ otra cosa» son más
   pequeñas. Es más correcto —no se ofrece colocar en un rato ya ocupado— pero es
   un cambio de comportamiento de FEAT-003 que nadie pidió por escrito.
2. **Una cuarta consulta en el `isPending` de la pantalla.** Si
   `activityDayFollowUps` va lenta, ahora espera la pantalla entera. Es coherente
   con lo que ya hacían las otras tres (y lo que pide el criterio 57), pero
   empeora el peor caso.
3. **La sesión abierta se une a mano a la lista del día.** Si el API sí la
   devolviera en `activityDayFollowUps`, no pasa nada (se deduplica por `id`);
   pero es una suposición sobre el API que **nadie ha podido comprobar** y vive en
   la página.
4. **«Sin dato» absorbe los bloques no hechos** en la forma cerrada. Hasta la
   tajada 4, un día con bloques sin sesión los cuenta ahí. No es culpa ni
   reproche, pero un revisor puede leerlo como que falta información.
5. **El presupuesto se recalcula cada minuto** junto con la agenda. Es aritmética
   sobre unas decenas de bordes, pero ahora son dos pases en vez de uno.
6. **`VidaDayBudget` y `VidaAgendaBlock` ganaron props opcionales.** Quien los
   monte sin ellas se pinta igual que antes; lo comprobé con los tests de F2, que
   pasan sin tocarse.

**Lo que no pude verificar, y no lo disimulo**

- **Ni una llamada real al API**: `/app/*` está detrás del login y los agentes no
  entran con credenciales (`ENVIRONMENT.md`). En particular, **si
  `activityDayFollowUps(date)` incluye la sesión abierta** sigue sin
  comprobarse: es la suposición que sostiene el riesgo 3.
- **El tema oscuro dentro de la aplicación** (criterio 62): medido en el arnés,
  no en `/app/vida/hoy`.
- **Un día de verdad vivido a medias**: el criterio 52 y el 66 son del usuario.

**Recorrido manual para el usuario** (con la API despierta; Render tarda ~1 min):
1. Empieza un bloque de hoy y **termínalo enseguida**: el bloque tiene que pasar
   a enseñar sus **horas reales** y «✓ calcado», y dejar de ofrecer «▶ Empezar».
2. Empieza otro y **pásate del tiempo planeado** antes de terminar: al cerrar
   tiene que leerse «+N min» con «plan X · real Y» debajo.
3. **Empieza algo que no esté en el plan** (por ahora, desde otro bloque de una
   actividad que no tenga bloque hoy) y termínalo: tiene que aparecer **punteado,
   en su hora**, con «fuera del plan», y el plan quedarse quieto.
4. **Registra un rato de una actividad planeada más de una hora después de su
   bloque** (llega en la tajada 3; hoy solo se puede empezando y terminando a esa
   hora): el bloque tiene que quedar de **sombra** con «→ hecho a las HH:MM» y lo
   real aparecer abajo con «N min tarde».
5. Mira el presupuesto **antes** de las 23:00 (o de tu hora de fin): tiene que
   decir *hecho · en marcha · planeado · libre*. Vuelve a entrar **después** y
   tiene que decir *seguido · de más · fuera del plan · sin dato* con la línea
   «Tu día ya terminó: esto es lo que pasó.».
6. Abre **un día pasado** desde la tira: lo mismo, sin botones de plan.
7. Si tienes **dos bloques de la misma actividad el mismo día**, empieza uno:
   solo **ese** tiene que ponerse en marcha (era el hallazgo 2 de la tajada 1).
8. Ponlo en **tema oscuro** y comprueba que los cuatro tramos de cada leyenda se
   distinguen y que el «en marcha» no se confunde con la marca de «ahora».
9. En **móvil**, comprueba que nada se sale a lo ancho con el día ya vivido.

**Hallazgos que dejo escritos, ninguno de esta tajada**

1. **La línea de guía de FEAT-003 no sabe nada de lo vivido.** En un día cerrado
   sigue diciendo «Tienes puestos 6 bloques · 3h. Tu hueco más grande va de 10:30
   – 19:00». La frase que resume el día es el **criterio 51, tajada 4**; lo anoto
   para que no se quede sin cambiar.
2. **El «···» de una sesión suelta todavía no existe**: corregir y quitar del
   registro son el criterio 35, **tajada 3**. Hoy una sesión fuera del plan se
   mira y no se toca.
3. **Un bloque movido sigue ofreciendo «Quitar del plan» y «Cambiar hora o
   duración»** en su «···», que es lo correcto (el plan se puede seguir
   editando), pero no hay ninguna vía **desde la sombra hasta lo real**. El
   criterio 23 no la pide; se leería mejor con ella.
4. **`toSessionSpans` filtra por `date`**: una sesión que empezó ayer a las 23:50
   y terminó hoy no aparece en el día de hoy. Es lo que hace el API
   (`activityDayFollowUps` va por `date` de inicio) y lo que dice el criterio 63
   —se ve en qué día quedó—, pero conviene mirarlo con datos reales.
5. **El tramo «sin dato» de un día cerrado puede ser enorme** (13h 12 en el
   arnés) porque incluye todo lo que no se registró. Con el «¿Qué pasó?» de la
   tajada 4 tendrá salida; hasta entonces es solo un número grande.

**Estado del árbol:** sin commitear. 9 archivos modificados y 5 nuevos bajo
`src/`, más este dossier y `BOARD.md`. El arnés temporal está **borrado**
(`src/arnes-ejecutado.html` y `src/arnes-ejecutado.tsx`). `graphify update .`
corrido: 3167 nodos, 3591 aristas.

---

#### Vuelta de la tajada 2 — el cruce ahora mira el umbral (2026-09-20)

**Resumen para el revisor:**
1. Arreglado **lo que devolvió la tajada**: `matchSessionsToBlocks` hace ahora
   **dos pases** —primero las parejas que cumplen la condición del criterio 19,
   después las movidas del 23 con los bloques que queden libres— así que una
   sesión lejana **ya no le roba el bloque** a la que cayó en su hora.
2. Tocado: `src/features/vida/utils/vida-execution.utils.ts` (la función y las
   dos cabeceras que la explicaban) + `.test.ts` (**+2 casos**, uno con el nombre
   que pidió el revisor). De paso, **dos hallazgos triviales cerrados**: el 3
   (`isFollowUpsError` que no usaba nadie) y el 6 (el aviso de la plantilla vacía
   que desaparecía al partirse el hueco).
3. **Lo que más probablemente rompí con esto:** el emparejamiento **ya no
   depende del orden del reloj sino de la distancia**, así que un día con varias
   sesiones de la misma actividad puede repartirlas distinto que antes — es el
   punto del arreglo, pero es un cambio de resultado, y **un test existente
   cambió de expectativa** (el de «tres sesiones y dos bloques»): ahora el bloque
   de la tarde se lo queda la de las 19:05 y sobra la de las 12:00, no al revés.

**El arreglo, en concreto**

`matchSessionsToBlocks` pasa de «cada sesión, por hora, al bloque libre más
cercano» a **dos pases sobre un mismo ayudante**, `assignClosestPairs`, que
recorre **todas** las parejas candidatas ordenadas **por distancia** —no por la
hora de la sesión— y las va fijando mientras haya bloque y sesión libres:

1. `pass(VIDA_MOVED_THRESHOLD_MINUTES)` — solo las parejas que cumplen la
   condición literal del criterio 19. Si varias sesiones compiten por el mismo
   bloque, **gana la más cercana**.
2. `pass(null)` — con los bloques que sobren, las sesiones que sobren se
   emparejan sin tope: esas son las **movidas** del criterio 23, y solo ocurren
   cuando al bloque **no le queda más remedio**.

Los desempates quedan escritos y son estables (distancia → sesión más temprana →
bloque más temprano → `id`), así que los mismos datos dan siempre el mismo
reparto. Lo que sobra al final sigue saliendo `unmatched` y se pinta fuera del
plan (criterio 22), y las dos garantías que el revisor ya había comprobado
—ningún bloque con dos, ninguna sesión en dos— las sostiene ahora el par
`takenBlockIds` / `assignedSpanIds`.

**El caso que devolvió la tajada, como test**

`vida-execution.utils.test.ts` gana los dos que pidió el revisor:

- **«un bloque, dos sesiones de la misma actividad, la lejana primero: el bloque
  es de la cercana»** — plan: «Pasear» 19:00–19:30; vivido: 07:30 (30 min) y
  19:05 (28 min). Ahora `byBlockId.tarde` es la de las **19:05**,
  `unmatched` es la de las **7:30**, y `describeBlockExecution` devuelve
  `status: 'on-plan'` con `movedToLabel` en `null`: el bloque se lee **«✓
  calcado»**, no «→ hecho a las 7:30».
- **«el mismo caso, con el día cerrado, deja de decir "seguido 0"»** — el
  presupuesto pasa a `seguido 25 min` (19:05–19:33 contra un bloque de 19:00 a
  19:30) y `fuera del plan 30 min`, y la única sesión suelta es
  `['off-plan', 'fuera del plan']`: la de la mañana, en su hora, **no** como
  movida. Antes: `seguido 0`, `fuera del plan 58`.

**Un test existente cambió de expectativa, y lo digo**

«tres sesiones y dos bloques de la misma actividad» (07:31, 12:00, 19:05 contra
bloques a las 7:30 y a las 19:00): antes el bloque de la tarde se lo quedaba la
de las **12:00** —porque llegaba antes en el reloj— y sobraba la de las 19:05.
Ahora se lo queda la de las **19:05**, que es la que cumple el criterio 19, y
sobra la de las 12:00. **La expectativa vieja describía el defecto**; la nueva
lleva el porqué escrito al lado.

**Dos hallazgos triviales cerrados de paso**

- **Hallazgo 3 — `isFollowUpsError` no lo usaba nadie.** Se **quita** de
  `useVidaDayData`. El criterio 58 lo sostiene `failed` («lo que viviste») más el
  hecho de que, con lo vivido caído, `followUps` llega vacía y **no se pinta ni
  una etiqueta de ejecutado**. En la cabecera del hook queda escrito por qué no
  está y cuándo tendrá que volver: en la **tajada 4**, que es la primera que
  necesita distinguir «no hecho» de «no lo sé», y con quien lo use delante.
- **Hallazgo 6 — el aviso de «tu plantilla está vacía» podía desaparecer.**
  `firstRealGapId` salía de `agenda.gaps`, y un hueco partido por una sesión
  estrena `id`: en un día con registros el aviso se quedaba sin dueño. Ahora sale
  de `execution.entries`, que es la lista que de verdad se pinta. **Es una
  regresión que introdujo esta tajada**, así que se cierra aquí.

Los **otros siete** hallazgos del revisor (la sesión fuera de la ventana del día
que no entra en la barra, el movido que además está en marcha, la barrita que le
falta al movido, «▶ Empezar» apagándose por actividad, «Cambiar hora» validando
solo contra el plan, y los cinco del constructor) **quedan donde estaban**:
ninguno es de una línea y tres de ellos tienen dueño en las tajadas 3 y 4.

**Verificación de la vuelta**

| Qué | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos |
| `pnpm test` | 2 fallos de 1005 (`SearchSelect` ×2) | **2 fallos de 1056** — los dos de `SearchSelect`, **1 archivo rojo de 96**. `vida-execution.utils.test.ts`: **39 casos en verde**; `src/features/vida` entero: **636 de 636** |
| `pnpm build` | inicial 934,79 kB | **945,56 kB** · `app-icons` **620,20** · `IconPicker` **4,64** — intactos: el crecimiento sigue sin ser de iconos |

`graphify update .` corrido tras el arreglo: **3171 nodos, 3595 aristas**.

**Lo que no volví a mirar en el navegador.** El arreglo es **aritmética pura** y
no toca una sola línea de pintura: ni un componente, ni un SCSS, ni la página
—salvo el `firstRealGapId`, que solo cambia **dónde** sale un aviso que ya
existía—. Lo visual sigue verificado como decía arriba: el arnés temporal de la
primera entrega, con las dos formas del presupuesto medidas a 375 px y en tema
oscuro, ya **está borrado** y no lo volví a levantar. Sigue en pie que el
criterio 62 **no se ha visto nunca dentro de `/app/vida/hoy`**: eso está detrás
del login y es del recorrido manual.

**Estado del árbol:** sin commitear. 10 archivos modificados y 5 nuevos bajo
`src/`, más este dossier y `BOARD.md`. Ningún arnés vivo.

### Tajada 3 — registrar lo que se sale

**Resumen para el revisor:**
1. `/app/vida/hoy` ya **registra lo que no estaba en el plan**: **«Empezar algo»**
   (solo hoy, arranca ahora mismo y **sin pedir duración**) y **«Registrar tiempo
   pasado»** (qué · a qué hora empezó · cuánto, con las píldoras 15 · 30 · 45 ·
   1h · libre) en **hoy y en los días de atrás**, aunque su plan siga sin
   tocarse; lo registrado sale en la agenda en su hora y se puede **corregir** o
   **«Quitar del registro»** desde su «···». La hoja de «qué» **se extrajo**
   —`VidaActivityPicker`— y la usan **las dos** hojas: `VidaPlaceInGapSheet`
   estrena la extracción el mismo día.
2. Lo escrito: **2 componentes nuevos** (`VidaActivityPicker/`,
   `VidaLogSessionSheet/`, 4 archivos cada uno contando su test) y **8
   modificados**, ninguno fuera de `src/features/vida/`.
3. **Lo que más probablemente rompí, en orden:** (a) **`VidaPlaceInGapSheet` ya
   no tiene buscador propio** —el paso «qué» es ahora otro componente con su
   propio `.module.scss`, y le quité a la hoja las clases que se llevó: si algo
   de FEAT-003 se ve distinto, es ahí—; (b) **`VidaDayActions` se pinta en días
   pasados**, donde antes no existía, y su mitad de plan salió a un componente
   interno (`PlanShortcuts`) para que un día pasado no pida el plan de la semana
   pasada; (c) **`VidaAgendaSession` dejó de ser puro**: usa
   `useDeleteActivityFollowUpMutation` y `useConfirmDialog`, así que montarlo
   pide `QueryClient` y `ConfirmDialogProvider`, y quien mockee
   `useActivityFollowUps` tiene que devolver **tres** mutaciones más.

**Qué se construyó**

*Lo nuevo*

- `components/VidaActivityPicker/` (**N**, 4 archivos). **El «qué», escrito una
  vez** (criterio 38). Es el paso «qué» que vivía dentro de
  `VidaPlaceInGapSheet`, **extraído** —no copiado—: la plantilla del día primero,
  el buscador (`filterActivitiesBySearch` sobre `useActivitiesQuery` sin
  archivadas) después, y la vía al catálogo cuando no hay nada con ese nombre.
  `VidaPlaceInGapSheet` pasa a usarlo **en esta misma tajada**, que es lo que
  impide que acaben siendo dos.
- `components/VidaLogSessionSheet/` (**N**, 4 archivos). **Una hoja, tres
  modos**: `start` («Empezar algo», solo «qué»), `log` («Registrar tiempo
  pasado», qué · hora · cuánto con `VidaDurationPills`) y `edit` (corregir hora,
  duración y notas de algo ya registrado). Molde `VidaPlaceInGapSheet`:
  `SteppedModal` `ds="aura"` + `mobileSheet`, estado arriba, **`key` por
  apertura** puesta por la página y el cierre en el `onSuccess` **local** del
  `mutate`.
- `utils/vida-session.utils.ts` (M): `isFutureDateTime` (rescatado de
  `79bece0:activity-time.utils.ts:253`), **`validateLogPast`** (la forma de
  `activity-followup-form.ts:58`, con otros mensajes), `logSessionInput` y
  `editSessionInput`. Puros, con `now` inyectado, **+16 casos** de test.

*Lo que cambió de sitio o de forma*

- `components/VidaPlaceInGapSheet/` (M): monta `VidaActivityPicker` y pierde su
  buscador, su consulta de actividades y sus dos ayudantes (`toChosen`,
  `fromActivity`). El `.module.scss` pierde las clases que se llevó el picker y
  **conserva `.optionName`**, que sigue usando el nombre del bloque que se edita.
- `components/VidaDayActions/` (M): además de los dos atajos de plan, las dos
  entradas de registro. La mitad de plan salió a `PlanShortcuts`, un componente
  interno, **por una razón de datos**: `VidaDayActions` se pinta ahora también en
  días pasados y `useActivityDayPlanQuery(sameWeekdayLastWeek(date))` no puede
  colgar de un día donde no se planea.
- `components/VidaAgendaSession/` (M): el «···» con **«Corregir»** y **«Quitar
  del registro»** (`ConfirmDialog`, salida «Volver»), mismo `Popover` +
  `IconButton` que el bloque. Una sesión **en marcha** no lo pinta: ahí se
  termina, no se corrige.
- `pages/VidaHoyPage.tsx` (M): cablea la hoja nueva, decide **quién puede qué**
  (`canStart` para «Empezar algo», `canLogPast = isToday || isPast` para el
  resto) y pinta `VidaDayActions` **siempre**, pasándole `canPlan`.

**Por qué así, y qué se descartó**

- **La extracción del «qué» va entera, con su SCSS.** La alternativa —dejar las
  clases en la hoja y pasarlas por props— habría atado el picker a un
  `.module.scss` ajeno. Lo que sí viaja de fuera es **una** clase, la del
  contenedor (`className`), para que el separador `.block + .block` de la hoja
  siga cayendo entre «Qué» y «Cuánto».
- **Tres modos en una hoja, no tres hojas.** El criterio 38 pide una hoja de
  «qué» reutilizada, y el 35 pide corregir lo registrado: partirlas habría
  devuelto los cinco modales de `79bece0` por la puerta de atrás.
- **El «qué» no se cambia al corregir.** `activityFollowUpEdit` no admite
  `activityId`: fingir que sí sería quitar la sesión y crear otra sin decirlo.
  Queda escrito en la cabecera del componente.
- **«Empezar algo» no llama a ninguna mutación**: delega en
  `useVidaSessionActions.start`, que es quien ya sabe **cerrar lo anterior y
  empezar lo nuevo** (D4, criterio 15). Una hoja que empezara por su cuenta se
  saltaría esa regla.
- **Desviación, dicha: `validateLogPast` no deja registrar un rato que acabaría
  después de ahora.** El criterio 32 solo prohíbe el día futuro; esto prohíbe
  además «de 15:00 a 16:00» cuando son las 15:30, porque pintaría en la agenda
  media hora que nadie ha vivido y el presupuesto la contaría. Es una regla que
  **añadí yo**, tiene su test y su mensaje sin culpa («Ese rato no ha pasado
  entero todavía. Ajusta cuánto duró.»). **Consecuencia que también digo:**
  corregir una sesión de hoy usa la misma validación, así que una sesión ya
  registrada con hora futura —que no debería existir— no se podría corregir sin
  bajarle la duración.
- **`VidaDayActions` se pinta en días pasados.** El criterio 32 lo obliga
  («en un día pasado hay "Registrar tiempo pasado"»), y el 56 sigue cumpliéndose
  porque los atajos de plan siguen atados a `canPlan`.

**Verificación**

*Las comprobaciones del `ENVIRONMENT.md`, enteras, al terminar*

| Qué | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos |
| `pnpm test` | 2 fallos de 1056 (`SearchSelect` ×2) | **2 fallos de 1100** — los dos de `SearchSelect`, **1 archivo rojo de 98**. **+44 tests**, ninguno nuevo en rojo |
| `pnpm build` | inicial 945,56 kB · `app-icons` 620,20 · `IconPicker` 4,64 | **953,93 kB** · `app-icons` **620,20** · `IconPicker` **4,64** — **+8,4 kB, y no de iconos** (CSS 195,68 kB) |

*Criterio por criterio*

| # | Cómo queda | Evidencia |
|---|---|---|
| 30 | cumplido | «Empezar algo» en la fila del día (solo hoy) abre la hoja con **solo** el paso «qué» y llama a `sessionActions.start(activityId)`, que arranca con la hora del reloj. Tests: `VidaHoyPage.test.tsx` («pregunta solo qué y arranca ahora mismo»: `startSession` recibe `a-s1`, y **no hay** «Cuánto duró» ni el grupo de píldoras) y `VidaLogSessionSheet.test.tsx`. |
| 31 | cumplido | «Registrar tiempo pasado» pregunta **qué · a qué hora empezó · cuánto**, con `VidaDurationPills` (15 · 30 · 45 · 1h · libre, comprobadas una a una en el test de pantalla) y escribe con `activityFollowUpAdd`: `createFollowUpMutation.mutate` recibe `{ activityId, date, startTime: '08:00', durationMinutes: 45, notes: null }`. |
| 32 | cumplido | Tres tests de pantalla: **hoy** trae los dos botones; un **día pasado** trae solo «Registrar tiempo pasado»; un **día futuro**, ninguno. Y en lo puro, `validateLogPast` rechaza el día futuro («Ese día todavía no ha llegado»), la hora que aún no llegó y el rato que no ha pasado entero; un **día pasado** admite cualquier hora, incluida la noche. |
| 33 | cumplido | Lo registrado ya entraba en la agenda por el cruce de la tajada 2 (`toSessionSpans` → «fuera del plan» en su hora) y el presupuesto se refresca con `invalidateFollowUpQueries`, que ya existía. Test: la sesión de las 11:40 se lee con su nombre, su «fuera del plan» y **ahora** con su «···». |
| 34 | cumplido | El picker busca sobre `excludeArchivedActivities(useActivitiesQuery(...))`: una archivada no sale (test con `status: 'cancelled'`). Lo que no existe **no se crea aquí**: `«Nada con ese nombre.»` + enlace a `/app/vida/actividades` (comprobado el `href`). |
| 35 | cumplido | El «···» de una sesión lleva a **«Corregir»** —la hoja abre con su hora (`08:10`), su duración y sus notas, y `activityFollowUpEdit` recibe `{ id, startTime, durationMinutes, notes }`— y a **«Quitar del registro»**, con diálogo «¿Quitar «X» del registro?», salida **«Volver»** y `activityFollowUpRemove` con su `id`, `date` y `activityId`. Ni «cancelar» ni «eliminar» en pantalla (comprobado con `queryByRole(/cancelar|eliminar/i)`). |
| 36 | cumplido | `VidaLogSessionSheet.test.tsx`: con `isError`, `onClose` **no** se llama, lo elegido sigue `aria-pressed="true"` (actividad y píldora), `mutate` salió **una sola vez** y se lee «No pudimos registrarlo…». **No hay sesión fantasma porque no hay escritura optimista**: la agenda solo pinta lo que devuelve la consulta del día. Lo mismo en el modo `start` con `{ ok: false }`. |
| 37 | cumplido, con espía | En el test de pantalla, tras registrar: `addMutation`, `editMutation`, `removeMutation` y `setMutation` —**las cuatro** de `activityDayPlan`— siguen sin llamarse. Y en lo puro, `logSessionInput` devuelve exactamente cinco claves, ninguna del plan. |
| 38 | cumplido, por estructura | `VidaActivityPicker.test.tsx` lee los fuentes de **las dos** hojas con `import.meta.glob(..., '?raw')` y afirma que las dos importan y montan `VidaActivityPicker`, y que **ninguna** vuelve a nombrar `filterActivitiesBySearch` ni `useActivitiesQuery`. Más seis casos de comportamiento del picker. |
| 56 | cumplido | El día pasado registra y **no** planea: «Registrar tiempo pasado» sí; «Empezar algo», «Copiar del \<día\> pasado» y «Vaciar y rehacer», no. Los tests de FEAT-003 que afirman «cero botones de plan» siguen verdes sin tocarse. |
| 59 | cumplido | `vida-vocabulary.test.ts` **8 de 8** en la corrida entera. Los textos nuevos —«Registrar tiempo pasado», «Quitar del registro», «Corregir», «Ese rato no ha pasado entero todavía», «Se apunta encima de tu día. Tu plan se queda como está.»— no usan ninguna palabra prohibida, y hay un test propio que lo afirma sobre los cinco mensajes de `validateLogPast`. |
| 65 | cumplido, medido | La tabla de arriba. |

*Lo que miré en el navegador* (arnés temporal `src/arnes-registrar.html` +
`src/arnes-registrar.tsx`, **ya borrados**): la hoja `log` a **375 px** con tres
fichas de plantilla y un nombre de **47 caracteres**.
`scrollWidth === clientWidth === 375` y **cero elementos desbordando**. Se lee,
en orden: «Registrar tiempo pasado» · «Algo que ya hiciste el viernes 18, esté o
no en tu plan.» · **Qué** (las tres fichas, la larga **truncada con puntos
suspensivos en una línea** y las duraciones «20m» / «4h» al lado) · el buscador ·
**A qué hora empezó** con `08:54` · **Cuánto duró** con `15 30 45 1h libre` · y
el pie **«Volver» / «Registrar»**.

**Riesgos**

1. **La extracción toca una hoja entregada.** `VidaPlaceInGapSheet` es de
   FEAT-003 y está aceptada; su paso «qué» ahora vive fuera. El marcado es el
   mismo carácter a carácter y el SCSS también, pero es un cambio en código que
   ya funcionaba.
2. **`VidaDayActions` aparece donde no aparecía.** En un día pasado la fila
   existe por primera vez. Si algún test o alguna medida de FEAT-003 contaba con
   que ahí no había nada, se nota ahí.
3. **`VidaAgendaSession` ya no es puro.** Pide `QueryClient` y
   `ConfirmDialogProvider`, y el mock de `useActivityFollowUps` necesita tres
   funciones más. Los tests de la tajada 2 siguen verdes porque el mock de la
   página se amplió aquí.
4. **La validación del futuro dentro del día es mía, no del criterio.** Ver la
   desviación de arriba.
5. **Dos sesiones registradas a la misma hora no se avisan.** Registrar no valida
   solapes —el plan sí lo hace con `validatePlacement`—, porque **lo real puede
   solaparse de verdad**. El presupuesto ya cuenta cada minuto una sola vez
   (criterio 26), así que la barra no miente; pero nadie avisa.
6. **El «···» de una sesión de un bloque sigue sin existir.** El criterio 35
   habla de «una sesión registrada» y la tabla del arquitecto puso el «···» en
   `VidaAgendaSession`: lo que se corrige es lo que se pinta suelto (fuera del
   plan y el real de un movido). La sesión **emparejada con su bloque** todavía
   no se corrige ni se quita desde la agenda, y quien la necesite está en el
   criterio 41 (tajada 4). **Lo digo en vez de darlo por cerrado.**

**Lo que no pude verificar, y no lo disimulo**

- **Ni una llamada real al API.** `/app/*` está detrás del login y los agentes no
  entran con credenciales (`ENVIRONMENT.md`). En particular no se ha visto nunca
  un `activityFollowUpAdd` ni un `activityFollowUpRemove` de verdad: lo que se
  comprueba es qué entra en `mutate`.
- **La pantalla `/app/vida/hoy` entera con la hoja abierta**: lo medido en el
  navegador es la hoja **sola**, en un arnés. El tema oscuro **dentro** de la
  aplicación sigue sin verlo nadie (criterio 62, de la tajada 2).
- **Los criterios 52 y 66 son del usuario.**

**Recorrido manual para el usuario** (con la API despierta; Render tarda ~1 min):
1. En **hoy**, toca **«Empezar algo»**, elige algo de tu plantilla y dale a
   «Empezar»: tiene que arrancar el cronómetro **sin preguntarte cuánto va a
   durar**, y si ya tenías algo en marcha, el aviso tiene que decir que
   terminamos lo anterior.
2. Termínalo y mira la agenda: si eso no estaba en el plan, tiene que aparecer
   **punteado en su hora** con «fuera del plan», y **tu plan no puede haberse
   movido ni un bloque**.
3. Toca **«Registrar tiempo pasado»**, elige algo, pon una hora de **esta
   mañana** y una duración: tiene que aparecer en su hora y el presupuesto
   cambiar **sin recargar**.
4. Prueba a poner una hora **que aún no ha llegado**: tiene que decírtelo y no
   registrar nada.
5. En el **«···»** de lo que registraste: **«Corregir»** (cámbiale la hora y
   añade una nota) y **«Quitar del registro»** (léete la confirmación: la salida
   es «Volver»).
6. Abre un **día de atrás** en la tira: tiene que haber **«Registrar tiempo
   pasado»** y **ninguno** de los botones de plan, ni «Empezar algo». Registra un
   rato de aquel día y compruébalo en su hora.
7. Abre un **día futuro**: no puede haber ni «Empezar algo» ni «Registrar tiempo
   pasado».
8. En **móvil**, con la hoja abierta y una actividad de nombre largo: que no se
   salga nada a lo ancho y que «Registrar» se alcance sin scroll dentro de la
   hoja.
9. Busca una actividad que **no exista** («zzz»): tiene que ofrecerte
   **«Crearla en Actividades»**, no crearla ahí.

**Hallazgos que dejo escritos, ninguno de esta tajada**

1. **Una sesión emparejada con su bloque no se corrige desde la agenda** (riesgo
   6). Tiene dueño natural en la tajada 4 (criterio 41).
2. **El buscador del picker no dice cuándo la consulta de actividades falla**:
   sigue leyéndose «Nada con ese nombre». Es el hallazgo que ya dejó la tajada 3
   de FEAT-003 y **no lo agrandé ni lo arreglé**: el picker se extrajo tal cual.
3. **Registrar no mira solapes** (riesgo 5).
4. **La hoja de registrar no ofrece notas en el modo `log`**, solo al corregir.
   El criterio 31 pide tres preguntas y no las nombra; se pueden añadir después
   desde «Corregir».
5. **Siguen abiertos los hallazgos de las tajadas 1 y 2** que no eran míos: la
   sesión fuera del horario del día que no entra en la barra, el movido que
   además está en marcha, la barrita que le falta al movido, «▶ Empezar»
   apagándose por actividad, «Cambiar hora o duración» validando solo contra el
   plan, y la línea de guía que no sabe nada de lo vivido.

**Estado del árbol:** sin commitear. 8 archivos modificados y 8 nuevos bajo
`src/`, más este dossier y `BOARD.md`. El arnés temporal está **borrado**
(`src/arnes-registrar.html` y `src/arnes-registrar.tsx`) y no queda ningún dato
de prueba: todo lo que se escribió fueron mutaciones **simuladas** en tests.

---

## 4. Review — feature-reviewer

### Tajada 1 — empezar y terminar un bloque, con cronómetro y la sesión visible en el módulo

**Veredicto: `accepted`.** Los criterios que la tajada 1 tenía asignados en la
tabla del arquitecto (2–17, la mitad de días del 1, 54, 59 en sus tres toasts,
64 y la parte de 60/61/63 que toca la barra y el cierre) están cumplidos con
evidencia; **no encontré ninguna regresión**; y lo que queda pendiente es lo que
**estructuralmente** no puede hacer un agente en este repositorio (`ENVIRONMENT.md`:
todo `/app/*` está detrás del login) más el criterio 66, que es del usuario. Se
acepta con **siete hallazgos escritos**, ninguno de los cuales incumple un
criterio de esta tajada; **dos de ellos los tiene que cerrar la tajada 2** y van
nombrados como tales.

**Criterios, uno a uno** (contra la sección 1, no contra el resumen del constructor)

| # | Veredicto del revisor | Cómo lo comprobé |
|---|---|---|
| 1 | **cumplido a medias, y así lo repartió el plan** | `canStart = isToday && …` en `VidaHoyPage.tsx`, y sin `onStart` el bloque no pinta el botón: tres tests de la página (hoy sí, futuro no, pasado no). La otra mitad —«ni registrado»— la tabla de la sección 2 se la da explícitamente a la tajada 2 («la otra mitad de 1»). **No la doy por cerrada.** |
| 2 | cumplido | `startSessionInput(activityId, now)` manda `activityId`, `date` local y `HH:mm`; la página llama `start(block.item.activityId)` y el repintado sale de `setQueryData(followUps.open())`, sin recarga. |
| 3 | cumplido | Leído en el código, no solo en el test: `useVidaElapsed` recibe el **instante** de `sessionStartInstant(session.date, session.startTime)` —dato del servidor— y cada tic es `Date.now() − startMs`, nunca un acumulador. La sesión **no** se guarda en cliente (`useVidaOpenSession`), así que remontar tras una recarga la vuelve a pedir y el cronómetro parte del mismo instante. El primer tic es síncrono dentro del efecto: montarse 40 min después marca 40:00. |
| 4 | cumplido | `window.setInterval(tick, 1000)` con `clearInterval` en el retorno del efecto, y `startMs === null` → **no se monta intervalo** (los bloques que no están en marcha pasan `null`). |
| 5 | cumplido | `finishNow` cierra con `elapsedMinutes` (mínimo 1) sin diálogo de por medio, y lanza el toast con `action: { label: 'añadir una nota' }` que abre `VidaFinishSessionModal` sobre la sesión **ya cerrada** (`onAddNote(closed)`, con el `ActivityFollowUp` que devuelve el propio `edit`). Como es el mismo `id`, **edita, no crea otra**. Ver el hallazgo 2 sobre el redondeo y el 3 sobre los 4 s del toast. |
| 6 | cumplido | `VidaFinishSessionModal`: `VidaDurationPills` + libre, `textarea` (texto plano, no vuelve tiptap), subtareas con «N de M» si las hay, y **validación de duración**: `durationMinutes === null || < 1` → «Dinos cuánto duró: como mínimo un minuto», sin llamar al API. Tres puertas al mismo modal montado **una vez** (barra, «···» del bloque, toast). |
| 7 | cumplido | `vida.routes.tsx`: `element: <VidaModuleLayout />` en el nodo `path: 'vida'`, con `hoy`, `semana`, `plantilla`, `revision`, `actividades`, `actividades/archivadas`, `categorias` y `ajustes` como hijas — las ocho, incluidas las dos que `app-nav.config.ts` no conoce. Fuera del subárbol no se monta nada: ninguna ruta de hábitos lo toca. El índice sigue siendo `Navigate to="hoy"` y **ninguna URL cambió**. |
| 8 | cumplido | Una sola `useActivityOpenFollowUpQuery` envuelta en `useVidaOpenSession`, misma clave `vidaKeys.followUps.open()` y mismo `staleTime`: React Query deduplica la del layout y la de la página. Al cerrar, `useUpdateActivityFollowUpMutation` hace `setQueryData(open, null)` y la barra desaparece sin recargar. |
| 9 | cumplido | `describeOverPlan` devuelve «llevas 52 min · planeado 45» y nada más: sin `dialog`, sin `role="alert"`, y `.overPlan` usa `--color-text-secondary`, **no** un color de alarma. Visto en el arnés (abajo) y en el test de la página. |
| 10 | **construido, sin confirmar contra el API** | El documento `sessionSubtasks` está **solo** en `ACTIVITY_OPEN_FOLLOW_UP_QUERY`, el `contracts.test.ts` valida la mutación nueva contra el SDL vendorizado, el modal pinta la lista con «N de M» y **no pinta sección si no hay**. Lo que nadie ha visto es una respuesta real de `activityFollowUpSubtaskEdit`. **Se queda en el recorrido manual del criterio 66**, no lo apruebo por simpatía. |
| 11 | cumplido | Ninguna invalidación nueva: `invalidateFollowUpQueries(queryClient, { date, activityId })` en `start`, `update` y `delete`, como ya estaba. |
| 12 | cumplido | `finishWith` **resuelve** `{ ok:false, message }` y el modal pinta el `Alert` sin cerrarse ni vaciar el `textarea` (el estado vive arriba del `SteppedModal`); en el fallo no se toca la caché, así que la sesión sigue abierta. En `start` fallido tampoco hay `setQueryData`: el bloque no se queda «en marcha». |
| 13 | cumplido | Doble guardia en `useVidaSessionActions`: `busyRef` (síncrona, cierra la puerta en el mismo tic) + `isBusy` de estado, que llega al `disabled` de «▶ Empezar» y «Terminar» por `isSessionBusy`. |
| 14 | cumplido | «No era esto — no guardarla» en el pie del cierre, `ConfirmDialog` con `cancelLabel: 'Volver'` y `confirmLabel: 'No guardarla'`; los dos toasts heredados dicen ahora «No la guardamos» / «Lo quitamos del registro». |
| 15 | cumplido | Leído en `start`: si hay `session`, `await closeMutation` **primero**; el `catch` del cierre hace `return` **antes** de `startMutation`, así que un cierre fallido no empieza nada; y el único toast que se emite es el compuesto («Terminamos «X» a las 10:08. En marcha: Y»), porque las dos mutaciones van en `silent`. |
| 16 y 54 | cumplido | `isSessionFromAnotherDay(session, getCurrentLocalDate())` compara el `date` local que el propio cliente escribió al empezar; con él, `hasBar` es falso y `hasPrompt` verdadero: **no hay cronómetro de catorce horas**. `VidaStaleSessionPrompt` es una `section`, no un `dialog`: el resto de la pantalla se usa. Dice de qué día es («ayer» / «el jueves 17»), **dice antes cuántos minutos anota el «No sé»**, dice qué bloquea, y no tiene ninguna salida de «cancelar» ni de descartar. `resolveUnknownEndMinutes` → planeada, si no 30, recortado al fin del día y nunca < 1; `useVidaSessionPlannedMinutes` cruza **por actividad y por el día de la sesión** y con más de un bloque candidato devuelve `null` (cae a 30) en vez de adivinar. Y `start` con una sesión de otro día devuelve `{ ok:false }` sin llamar al API. |
| 17 | cumplido | La hora sale de `now`, no del bloque; el bloque solo aporta el `activityId`. |
| 59 (lo de esta tajada) | cumplido | Los tres toasts reescritos, y `vida-vocabulary.test.ts` **tiene dientes**: falla si el glob se queda corto (`> 40` archivos), quita comentarios antes de mirar, y el test de los cuatro heredados **falla si alguien los arregla y olvida borrar la excepción**. Nada nuevo dice «cancelar» ni «eliminar». |
| 64 | cumplido | `isDisabled = isPending && fetchStatus === 'idle'`: sin sesión de usuario no se pinta barra, ni pregunta, ni hueco reservado, ni esqueleto eterno. |
| 60, 61, 63 (su parte) | cumplido | Medido, no deducido: ver «lo que miré en el navegador». Medianoche está probada en puro y `closeSessionInput` no toca `date`. |
| 65 | cumplido, **medido por mí** | `pnpm test`: **2 fallos de 1005**, los dos de `SearchSelect` (preexistentes). `pnpm lint`: **14 errores / 0 warnings**, los mismos archivos de la línea base. `pnpm build`: **934,79 kB** el chunk inicial, `app-icons` **620,20 kB** y `IconPicker` **4,64 kB** — **intactos: el crecimiento no es de iconos**. El build pasa, así que `tsc -b` está limpio. |
| 66 | **pendiente del usuario**, como estaba | Nadie entró con credenciales y la API de Render estaba dormida. Queda en el recorrido de abajo. |

**Qué miré para ver si rompí algo cerca** (cómo busqué, no solo el resultado)

1. **El grafo primero**, sabiendo lo que puede y lo que no: `graphify explain
   "VidaAgendaBlock"` da sus nueve aristas y `query` sobre quién lo importa;
   como el constructor corrió `graphify update .`, el grafo refleja **el árbol
   de ahora**, así que para «¿quién dependía de esto antes?» lo confirmé con
   `grep -rln VidaAgendaBlock src/` y abriendo el archivo. Resultado: **el único
   que lo renderiza es `VidaHoyPage.tsx`**. Esto acota mucho el riesgo de la
   desviación 5 (el `flex-wrap` para todos los bloques): no lo usan ni la semana,
   ni la plantilla, ni el lateral.
2. **Lo que el constructor marcó como «lo que más probablemente rompí»**, en su
   orden. (a) `vidaRoutes` con `element`: abrí `vida.routes.tsx` entero y
   comprobé que las ocho hijas siguen colgando del mismo nodo, que el índice
   sigue redirigiendo a `hoy` y que ninguna URL cambia; los 1005 tests incluyen
   los de rutas de FEAT-001/003 y pasan. (b) El layout del bloque: medido en el
   navegador (abajo). (c) Las firmas de `useStartActivityFollowUpMutation` /
   `useUpdateActivityFollowUpMutation`: el parámetro es opcional con valor por
   defecto `{}` — `git grep` da como únicos llamantes `useVidaSessionActions` y
   los tests; nadie más los pasaba.
3. **`shared/ui/Toast`, que es lo único fuera de Vida.** Leí el diff entero: la
   prop es opcional en `ToastInput`/`ToastItem` y el `<button>` del viewport va
   detrás de `toast.action ? … : null`. Los llamantes de hábitos
   (`useHabits`, `useHabitFollowUps`, `useHabitCategories`, `useHabitMeasures`,
   `useHabitPurposes`, `useHabitIdentityClaim`) no pasan `action` y se pintan
   exactamente igual; la suite de `Toast` pasa.
4. **Lo que convive en la misma pantalla:** el «···» del bloque (quitar del plan
   y cambiar hora, FEAT-003, tajadas 2 y 5) sigue ahí y solo gana un ítem
   **cuando el bloque está en marcha**; el «en N min» del siguiente bloque, la
   marca de «ahora» y los huecos no se tocaron (el `<>…</>` nuevo solo envuelve
   la línea de meta).

**Lo que miré en el navegador** (arnés temporal `arnes-revision-bloques.html` +
`src/arnes-revision-bloques.tsx`, míos, **ya borrados**; `MemoryRouter`, datos
sintéticos, seis bloques: plano, plano con «···», nombre de 58 caracteres,
«▶ Empezar», en marcha y en marcha con nombre largo):

- **375 px, con el contenedor a lo que mide la agenda de verdad (343 px):**
  `document.documentElement.scrollWidth === clientWidth === 375` — **cero scroll
  horizontal**. Los bloques **sin sesión** miden **67 px de alto y una sola
  fila**, igual que antes del cambio; el de «▶ Empezar» sube a 106 px porque el
  botón baja a su línea, y el que está en marcha a 127 px. El nombre **nunca
  pasa de una línea** (23 px) ni con 58 caracteres: se recorta con puntos
  suspensivos, que es justo lo que la desviación 5 vino a arreglar.
- **Escritorio (contenedor de 720 px):** los cuatro bloques sin sesión y el de
  «▶ Empezar» miden **67 px, una fila**; los de en marcha, 88 px por la línea de
  «llevas … · planeado …». Es decir, **el `flex-wrap` no se activa nunca en un
  bloque de FEAT-003**: no hay regresión visual en las tajadas 2–5.
- Leído en pantalla: «planeado 30 min · **en marcha**», «llevas 52 min · planeado
  30», el cronómetro corriendo en `00:52:xx` y «Terminar» — sin nada rojo ni
  ningún diálogo.

**Estados: los que apliquen a esta tajada y los que faltan**

- **Sin datos (no hay sesión):** construido. No se pinta barra, ni pregunta, ni
  hueco; los bloques quedan como los dejó FEAT-003 con su «▶ Empezar».
- **Cargando la sesión abierta:** `useVidaOpenSession` **deriva** `isPending`,
  pero `VidaModuleLayout` **no lo usa**: mientras la consulta vuela no se pinta
  nada. No afirma nada falso (no dice «no hay nada en marcha»), así que no
  incumple ningún criterio de esta tajada; el criterio 57 es de la tajada 2.
  **Queda como hallazgo** por si en la 2 conviene un hueco reservado.
- **Error al cargar la sesión abierta:** **es el estado que falta** (hallazgo 1).
- **Error al terminar:** construido y comprobado en el código: la barra **no
  desaparece** (no se toca la caché) y el mensaje va traducido al español.
- **Sin permisos / sin sesión de usuario:** construido (criterio 64).
- **Texto largo:** medido, 58 caracteres, una línea, sin desbordar.
- **Móvil 375 px:** medido, sin scroll horizontal.
- **Tema oscuro:** **no lo revisé yo.** El arnés no reproduce fielmente los
  tokens de Aura fuera de la página, y el criterio que manda aquí (62, las dos
  leyendas y los dos violetas) es de la tajada 2. Queda dicho, no disimulado.

**¿Duplica algo que ya existía?** (contra la sección 2)

No. Lo comprobé pieza a pieza contra «Lo que NO se crea» y «Dónde NO va»:
ninguna consulta ni mutación de follow-ups nueva salvo el documento de subtareas
que el plan sí pedía; ninguna clave de `query-keys.ts` ni invalidación nueva;
cero SDL recopiado; ningún `buildDayAgenda` paralelo ni cuarta variante de
`AgendaEntry` (la agenda no se tocó); ningún componente nuevo de `shared/ui` —a
`Toast` se le **añadió** una prop, que es lo que el plan autorizaba—; ningún
icono importado a pelo; ninguna ruta nueva; la sesión abierta **no** se guarda en
`localStorage` ni en un store; el cronómetro **no** sale de `useVidaNowMinute`;
`isCompleted` no se escribe. Los dos archivos que el plan no listaba
(`useVidaSessionUi.ts` y `vida-vocabulary.test.ts`) **no duplican nada**: el
primero es un contexto de 20 líneas que existe justo para que el modal **no** se
monte dos veces, y el segundo es el test que el plan pedía sin decir dónde vivía.

**Hallazgos, ninguno bloqueante de esta tajada**

1. **El error de la consulta de la sesión abierta no se ve por ninguna parte.**
   Si `activityOpenFollowUp` falla, `session` es `null`: no hay barra, no hay
   pregunta y no hay aviso. La persona puede tocar «▶ Empezar» y comerse el 400
   del API, que `translateSessionError` traduce a «Ya tenías algo en marcha.
   Termínalo y vuelve a empezar.» — un callejón sin salida, porque **no hay
   ninguna barra que permita terminarla**. Ningún criterio de la tajada 1 lo
   pide (el 58 es de la 2 y habla de `activityDayFollowUps`), pero es el hueco
   más real que encontré. **Para la tajada 2.**
2. **Dos bloques de la misma actividad el mismo día se pintan los dos «en
   marcha»**, con dos cronómetros y dos «Terminar», porque `isRunning` compara
   solo `activityId`. Es el «Pasear a las mascotas ×2» que D1 ya nombra, y el
   cruce que lo arregla (`matchSessionsToBlocks`) **es de la tajada 2**: queda
   escrito aquí para que no se cierre la 2 sin mirarlo.
3. **El toast con «añadir una nota» dura 4 s** (`DEFAULT_DURATION`), que es poco
   para una acción que hay que decidir; `finishNow` no pasa `duration`. Cuesta un
   parámetro y no toca ningún criterio.
4. **El cronómetro trunca y el guardado redondea.** `useVidaElapsed.minutes` es
   `Math.floor` y `elapsedMinutes` (lo que se manda) es `Math.round`: con
   00:45:40 en pantalla se anotan 46 min. El toast dice el número que se guardó,
   así que no engaña, pero son dos reglas para el mismo minuto.
5. **La hora escrita a mano en la pregunta de otro día no tiene tope.**
   `minutesUntilEndTime` interpreta cualquier hora anterior al inicio como cruce
   de medianoche: quien empezó a las 21:00 y teclea `2:00` en vez de `22:00`
   anota **5 horas** sin que nada lo avise. El «No sé» sí está recortado al fin
   del día; la vía tecleada no. El criterio 16 no lo exige.
6. **El modal abierto desde el toast se titula «Terminar «X»»** aunque la sesión
   ya esté cerrada y lo que se vaya a hacer sea añadir una nota. Es solo el
   texto del encabezado.
7. **Subtareas en una sesión ya cerrada:** `useEditFollowUpSubtaskMutation`
   invalida `followUps.open()`, que para una sesión cerrada ya es `null`; además
   el `ActivityFollowUp` que devuelve `edit` no trae `sessionSubtasks`, así que
   por ahí la sección no se pinta. No rompe nada hoy (el catálogo no crea
   subtareas), pero es el segundo flanco del criterio 10 sin confirmar.

Y quedan en pie, dichos por el constructor y confirmados por mí: los **cuatro
«cancelar»/«eliminar» heredados del catálogo** (fuera del criterio 59, que habla
de la sesión y el bloque), la **consulta extra** de `useVidaSessionPlannedMinutes`
cuando la sesión es de otro día, los **17,8 kB** de chunk inicial y el fotograma
del cronómetro al saltar de una sesión a otra.

**Lo que no revisé, y no lo disimulo:** ni una llamada real al API (el login es
el límite estructural de este repositorio, `ENVIRONMENT.md`), las subtareas de
sesión contra datos de verdad, el toast pulsado con el dedo sobre una sesión
real, una recarga de navegador con sesión iniciada, y el tema oscuro de la barra
y el modal dentro de la aplicación. Los cinco están en el recorrido manual.

**Recorrido manual que le queda al usuario** (criterio 66, con la API despierta;
Render tarda ~1 min en despertar): el que escribió el constructor en la sección
3, sus nueve pasos, y **dos que añado yo**: (10) en el paso 5, fíjate en si te da
tiempo a pulsar «añadir una nota» antes de que el aviso se vaya; (11) si tienes
dos bloques de la misma actividad el mismo día, mira si al empezar uno se ponen
**los dos** en marcha — está anotado como hallazgo 2 y lo cierra la tajada 2.


### Tajada 2 — lo real encima de lo planeado, y el presupuesto en dos formas

**Veredicto: `returned`**, y por **una sola cosa**: el cruce de D1 **no aplica el
umbral del criterio 19** al emparejar, así que una sesión lejana puede **robarle
el bloque** a la que cayó justo en su hora. El resultado no es «la pareja
cambiada» —la limitación que el analista sí aceptó por escrito—: es que **un día
seguido se lee como un día no seguido**. Todo lo demás de la tajada está bien
construido y bien probado, la línea base no empeora (la corrí entera) y no
encontré ninguna regresión fuera de los hallazgos que dejo anotados. El arreglo
es pequeño y vive en un solo sitio, `matchSessionsToBlocks`.

**El motivo de la devolución, con pasos**

Archivo: `src/features/vida/utils/vida-execution.utils.ts`, función
`matchSessionsToBlocks` (L162–188). El pase recorre las sesiones **por hora** y
cada una se queda con el bloque libre de su actividad **más cercano**, sin mirar
`VIDA_MOVED_THRESHOLD_MINUTES`. El criterio 19 sí lo mira: «una sesión es "de" un
bloque si comparten `activityId` **y su hora de inicio cae a menos de
`VIDA_MOVED_THRESHOLD_MINUTES` de la planeada**»; el 23 solo añade qué pasa
cuando a un bloque **no le queda** más remedio que quedarse con una lejana.

Reproducido con un arnés de tests propio (`src/features/vida/utils/zz-review-t2.test.ts`,
**ya borrado**), datos sintéticos, día 06:30–23:00:

- Plan: **un** bloque, «Pasear» 19:00–19:30.
- Vivido: una sesión de «Pasear» a las **07:30** (30 min, el paseo de más) y otra
  a las **19:05** (28 min, justo la planeada).
- Lo que sale hoy: el bloque de las 19:00 queda **`moved`** emparejado con la de
  las 7:30 y se lee «planeado 30 min · **→ hecho a las 7:30**»; esa sesión se
  pinta «**690 min antes**»; y la de las **19:05 se pinta «fuera del plan»**.
  El presupuesto del día cerrado dice `fuera del plan 58m` · `sin dato 932m`,
  con **`seguido` en cero**.
- Lo que piden los criterios: la de las 19:05 es «de» ese bloque (dista 5 min),
  el bloque se lee «**✓ calcado**», y la de las 7:30 —que no corresponde a
  ningún bloque— va **fuera del plan** (criterio 22). En la barra, `seguido`
  ≈ 28 min.

El mismo defecto con cualquier par: bloque «Leer» 21:00, sesiones a las 08:00 y
a las 21:00 → el bloque dice «→ hecho a las 8:00» y la lectura de las 21:00 sale
«fuera del plan». **No hace falta tener dos bloques de la misma actividad**: basta
con dos sesiones de la misma actividad, y ese es justo el día que el usuario
describe (algo que se hace dos veces y solo está planeado una).

**Lo que hay que cambiar** (y es una regla, no un rediseño): al buscar el bloque
de una sesión, **preferir los candidatos dentro del umbral**; solo si no hay
ninguno a menos de `VIDA_MOVED_THRESHOLD_MINUTES` se cae al más cercano lejano
—que es el movido del criterio 23—. Dicho de otro modo: dos pases (primero los
que casan, después los movidos) en vez de uno solo por hora. Y un caso de test
con nombre propio: **un bloque, dos sesiones de la misma actividad, la lejana
primero**. La suite actual (37 casos) cubre «dos bloques y una sesión» y «dos
bloques y dos sesiones», pero no esta.

**Criterios, uno a uno** (contra la sección 1, no contra el resumen del constructor)

| # | Veredicto del revisor | Cómo lo comprobé |
|---|---|---|
| 1 (su otra mitad) | cumplido | `onStart` solo se pasa si `!execution.byBlockId[entry.id]`: un bloque con sesión, abierta o cerrada, no pinta «▶ Empezar». Leído en `VidaHoyPage.tsx` L433–437 y cubierto por el test de pantalla. *(Con una salvedad anotada en los hallazgos: sigue en pie el `entry.item.activityId !== runningActivityId`, que apaga el botón de **otro** bloque de la misma actividad.)* |
| 18 | cumplido | `buildDayExecution` recorre `agenda.entries` sin reordenar y solo cuelga datos; las sesiones sueltas se cuelan por hora de inicio. Arnés propio: el bloque de las 9:00 sigue a las 9:00 con su sesión encima. |
| 19 | **NO cumplido** | El motivo de la devolución. La segunda mitad —«cada sesión a un bloque como mucho, cada bloque a una sesión como mucho»— **sí** se cumple (lo comprobé: `taken` impide el doble, y ninguna sesión sale a la vez en `byBlockId` y en `unmatched`). Lo que falla es la **condición de emparejamiento**. |
| 20 | cumplido en lo suyo | Las dos constantes con nombre, en un solo sitio y con los valores 5 y 60 (test propio). Las etiquetas salen como texto: «✓ calcado», «empezó +N», «+N min», «−N min» y las horas reales en el `<p>` de la tarjeta. **Queda tocado por el 19**: en el caso de arriba el bloque que debía leerse «✓ calcado» no lo lee. |
| 21 | cumplido | `VidaPlanVsRealBar` pone «plan 30 · real 41» en un `<span>` real y la barrita es `aria-hidden`. *(Hallazgo: en el movido no se pinta ninguna barrita.)* |
| 22 | cumplido en el caso normal | `VidaAgendaSession` punteado, en su hora, con actividad, horas, duración y etiqueta; el plan no se toca. **Tocado por el 19**: una sesión que sí corresponde a un bloque puede acabar aquí. |
| 23 | cumplido | Arnés propio: una sesión a 150 min de su bloque sale **una sola vez** como `moved` y el bloque queda de sombra con «→ hecho a las HH:MM». En el presupuesto el movido se cuenta **solo** en «fuera del plan» (`offPlanSpanIds` no lo borra), nunca además en «seguido» ni en «de más». |
| 24 | cumplido, **con una tercera forma declarada** | `isDayClosed` correcto en los tres casos. Las dos formas no se mezclan. Sobre la tercera, ver abajo: **la doy por buena**. |
| 25 | cumplido | «Tu día ya terminó: esto es lo que pasó.» solo en la forma cerrada; «Tu día está en marcha…» con el día vivo. Con la forma `planned` no hay nota **y no hace falta**: la barra no ha cambiado de colores. |
| 26 | cumplido **salvo un borde** | Medido por mí en cuatro configuraciones (sesiones solapadas, sesión encima de su bloque, sesión que cruza el fin del día, día en marcha): los tramos suman **exactamente 990 min** = la ventana, y la leyenda también. **El borde**: una sesión **fuera de la ventana del día** (a las 5:00 con el día desde las 6:30, o a las 23:10 con el día hasta las 23:00) se pinta en la agenda con sus 40 min y **aporta 0 a la barra** — la agenda y la leyenda dejan de decir los mismos minutos. `buildDayAgenda` estira la ventana por un **bloque** fuera de horario; `getExecutedBudget` no la estira por una **sesión**. Hallazgo, no motivo de devolución. |
| 27 | cumplido | En día futuro `useActivityDayFollowUpsQuery` está apagada, `followUps` llega vacía, `hasExecution` es falso y no se pinta una sola etiqueta; la marca de «ahora» la sigue poniendo `buildDayAgenda`, intacta. |
| 28 | cumplido | Una sola consulta más —la que ya existía— dentro de `useVidaDayData`; ninguna clave nueva en `query-keys.ts` (revisado el diff entero: no se toca). |
| 29 | cumplido | Arnés propio: sin sesiones, `execution.entries` es **`toEqual(agenda.entries)`**, `form: 'planned'` y la leyenda solo trae planeado y libre, sin tramos de cero. |
| 53 | cumplido | Día sin plan con sesiones: salen en su hora, el presupuesto las cuenta y la página añade «Lo que hiciste está abajo, en su hora.» antes de hablar de la plantilla. Sin una palabra de reproche. |
| 55 | cumplido | `execution` no toca `startMinutes` de ningún bloque; el bloque en marcha se queda en su hora y no empuja a los siguientes. |
| 57 | cumplido | La cuarta consulta entra en el `isPending` de `useVidaDayData` con el mismo trato de «deshabilitada» que las otras tres: sin sesión no hay esqueleto eterno (criterio 64 intacto). |
| 58 | cumplido | `failed` gana «lo que viviste» y la página pinta el `Alert` con «Reintentar» siempre que `failed.length > 0`; con lo vivido caído `followUps` está vacía y **no se afirma nada** de ejecutado. *(Hallazgo: `isFollowUpsError` se expone y **no lo usa nadie**; el aviso funciona por `failed`.)* |
| 62 | **queda en comprobación de segunda mano** | Los ocho fondos los midió el constructor en su arnés, que ya borró; yo no volví a medirlos y **dentro de `/app/vida/hoy` no se puede mirar**: está detrás del login (`ENVIRONMENT.md`). El razonamiento del «violeta rayado» frente a la marca lisa lo leí en el SCSS y es correcto, pero **eso no es haberlo visto**. Lo dejo como pendiente de ojo humano, en el recorrido manual. |
| 65 | cumplido, **medido por mí** | `pnpm typecheck` exit 0 · `pnpm lint` **14 errores / 0 warnings** (los mismos archivos) · `pnpm test` **2 fallos de 1054**, y los dos son los de `SearchSelect` (1 archivo rojo de 96) · `pnpm build` exit 0, chunk inicial **945,13 kB**, `app-icons` **620,20 kB** y `IconPicker` **4,64 kB** idénticos: **el crecimiento no es de iconos**. Ningún documento GraphQL nuevo. |

**Sobre la tercera forma del presupuesto: la doy por buena, y queda anotada.**
El criterio 24 nombra dos formas y el 29 exige que un día **con plan y nada
registrado** se vea *exactamente* como lo dejó F2. Con solo dos formas, un día
pasado sin un solo registro estrenaría «sin dato 16h 30» — el tramo inventado
que el 29 prohíbe de forma literal. `form: 'planned'` es la salida correcta a esa
contradicción y **no inventa nada**: comprobado en el arnés, con el día en marcha
y sin sesiones la forma `planned` y la forma `running` producen **los mismos
segmentos y la misma leyenda** (los tramos de cero se filtran), así que la
tercera forma solo se nota en el día **cerrado sin registro**, que es justo el
caso del criterio 29. No reescribo el criterio 24: queda dicho aquí.

**Qué miré alrededor, y cómo** (regresiones)

- **Quién más monta lo que se tocó.** `graphify explain "VidaAgendaBlock"` y
  `graphify explain "useVidaDayData"` (el grafo está **actualizado por el
  constructor**, así que para «quién dependía de esto» no sirve como foto previa:
  lo confirmé con `grep` sobre `src/`). Resultado: `VidaAgendaBlock`,
  `VidaDayBudget`, `VidaAgendaSession`, `VidaPlanVsRealBar` y `useVidaDayData`
  **solo los monta `VidaHoyPage`**. Fuera de `src/features/vida/` no hay un solo
  archivo tocado (`git diff ad9eb7f --stat`), así que hábitos, `AppLayout` y
  `shared/ui` no pueden haberse movido.
- **Las props nuevas son opcionales**: `execution` en el bloque y `executed` en
  el presupuesto tienen valor por defecto `null`, y con `null` el `render` es el
  de FEAT-003 rama por rama (leído en el diff). Los tests de F2/F3 pasan sin
  tocarse: en mi corrida, **un solo archivo rojo de 96** y es `SearchSelect`.
- **Lo que el constructor señaló como «lo que más probablemente rompí»**, que es
  por donde empecé:
  1. **Los huecos partidos alrededor de una sesión suelta.** Comprobado en el
     arnés: con una sesión de 14:00 a 14:30 dentro del hueco de 10:00–23:00, la
     lista sale `gap 10:00–14:00` · `sesión` · `gap 14:30–20:00` · `gap 20:00–23:00`
     (la marca de «ahora» parte el último), **ningún hueco pisa la sesión** y la
     suma de `trackMinutes` de la agenda sigue siendo **990 = el día entero**.
  2. **Las fichas de FEAT-003 en un día con registros.** No se rompen y además
     son coherentes: la página recalcula `suggestionsForGap({ gap: entry })` y
     `gapToWindow(gap)` **sobre el trozo**, no sobre el hueco original, así que
     una ficha no se ofrece para un rato ya ocupado ni se coloca encima de una
     sesión. Es un cambio de comportamiento de FEAT-003, **a mejor**, y así lo
     dijo el constructor.
  3. **«En marcha» decidido por el cruce.** Comprobado: dos bloques de la misma
     actividad y **una** sesión abierta a las 19:05 → **exactamente un** bloque
     con `isRunning` (el de las 19:00), el otro sin nada. **El hallazgo 2 de la
     tajada 1 queda cerrado.**
- **El hallazgo 1 de la tajada 1** (el error de la sesión abierta) también queda
  cerrado: `useVidaOpenSession` expone `isError` y `refetch` —aditivos, ningún
  contrato cambiado— y `VidaModuleLayout` pinta el aviso con «Reintentar», con
  dos tests nuevos. Leído en el diff; la superficie está en todo el módulo pero
  el único que consume el hook es el layout.
- **Nada nuevo en el aparato ni en el arranque**: `git diff ad9eb7f -- src/`
  no añade una sola línea con `localStorage` ni `sessionStorage`, y no hay un
  solo `from '@fortawesome/free-solid-svg-icons'` en `src/features/vida/`. El
  build lo confirma: `app-icons` y `IconPicker` **byte a byte iguales**.
- **Vocabulario sin culpa**: `pnpm test src/features/vida/vida-vocabulary.test.ts`
  → **8 de 8 en verde**. Los textos nuevos que leí («fuera del plan», «sin dato»,
  «Tu día ya terminó: esto es lo que pasó.», «Lo que hiciste está abajo, en su
  hora.», «N min tarde») no usan ninguna palabra prohibida.

**Estados** (los que aplican a esta tajada)

- **Sin datos** (criterio 29) ✔ y **día sin plan con sesiones** (53) ✔,
  comprobados arriba.
- **Cargando** (57) ✔ · **Error** (58) ✔ · **Sin sesión de usuario** (64) ✔,
  intacto.
- **Texto largo** (61) y **móvil a 375 px** (60): **de segunda mano**. El
  constructor los midió en un arnés que ya borró (51 caracteres en una línea,
  `scrollWidth === clientWidth === 375`); yo **no los volví a medir** — la tabla
  del arquitecto asigna 60 y 61 a las tajadas 1 y 4, no a esta. Queda dicho.
- **Tema oscuro** (62): ver la tabla. Medido por el constructor, **no por mí**, y
  nunca dentro de la aplicación.
- **Sin permisos:** no aplica; el módulo entero está detrás del guard y eso lo
  cubre el 64.

**¿Duplica algo que ya existía?** No. Contra la sección 2: lo ejecutado vive en
el **archivo hermano** que mandó la decisión 3 (`vida-execution.utils.ts`),
`buildDayAgenda` **no gana una cuarta variante** ni `AgendaBlock` un campo, no
hay hook de día nuevo (se amplía `useVidaDayData`), ni clave ni invalidación ni
consulta ni SDL nuevos, ningún componente de `shared/ui`, ningún normalizador de
texto y ningún envoltorio de `localStorage`. `getUsedMinutesFromFollowUps` de
`79bece0` **no se rescató**, y es lo correcto: sumaba duraciones sin mirar
solapes, que es justo el fallo que el criterio 26 prohíbe. Lo único que crece es
`VidaHoyPage`, que ya era el sitio.

**Hallazgos anotados, ninguno motivo de devolución**

1. **Una sesión fuera del horario del día no entra en la barra** (criterio 26,
   borde): a las 23:10 con el día hasta las 23:00, la agenda la enseña con sus
   40 min y la leyenda dice `sin dato 990` y nada más. Arreglo natural: estirar
   la ventana con las sesiones, como `buildDayAgenda` ya hace con los bloques.
2. **Un bloque `moved` que además está `en marcha` se pinta dos veces**: el
   bloque dice «en marcha» y abajo aparece su tarjeta punteada «N min antes».
   Pasa al empezar un bloque con más de una hora de adelanto. El criterio 23
   habla de sesiones cerradas; no lo incumple, pero se lee raro.
3. **`isFollowUpsError` no lo usa nadie.** `useVidaDayData` lo expone y
   `VidaHoyPage` no lo destructura: el aviso del criterio 58 funciona por
   `failed`. O se usa, o sobra.
4. **El movido no lleva barrita plan-frente-a-real** (`comparisonLabel` es `null`
   cuando `isMoved`). El criterio 21 dice «cuando plan y real difieren»; un
   movido difiere. Se leería mejor con ella.
5. **«▶ Empezar» sigue apagándose por actividad, no solo por bloque**: la
   condición conserva `entry.item.activityId !== runningActivityId`, así que con
   dos bloques de la misma actividad, empezar uno esconde el botón del otro. Es
   conservador y defendible (el API no admite dos sesiones abiertas), pero el
   criterio 1 habla del **bloque**.
6. **El aviso «tu plantilla está vacía» puede desaparecer**: `firstRealGapId`
   sale de `agenda.gaps`, y si ese hueco se parte, el trozo estrena `id` y
   `showTemplateHint` no encuentra a nadie.
7. **«Cambiar hora o duración» de un bloque sigue validando solo contra el
   plan** (`getBlockEditWindow(agenda, …)`, sin las sesiones): se puede mover un
   bloque encima de un rato ya registrado. Es coherente con FEAT-003 —lo real no
   es el plan— pero conviene decidirlo, no heredarlo.
8. Siguen en pie los **cinco hallazgos que dejó el constructor** (la línea de
   guía que no sabe nada de lo vivido, el «···» de una sesión suelta, la vía de
   la sombra a lo real, `toSessionSpans` filtrando por `date`, y el tramo «sin
   dato» enorme), todos con dueño en las tajadas 3 y 4.

**Lo que no revisé, y no lo disimulo:** ni una llamada real al API —el login es
el límite estructural de este repositorio (`ENVIRONMENT.md`) y no entro con
credenciales—, así que sigue sin comprobarse si `activityDayFollowUps(date)`
devuelve la sesión abierta (el riesgo 3 del constructor); **no volví a medir los
375 px ni el tema oscuro** en un navegador, ni dentro de la aplicación, que es
donde el criterio 62 se cierra de verdad; y el criterio 52 y el 66 son del
usuario. Mi arnés fue **de tests puros** (`zz-review-t2.test.ts`, 14 casos,
borrado), no de pantalla.

### Tajada 2 — segunda revisión (tras la devolución)

**Veredicto: `accepted`.** El motivo de la devolución está cerrado **de verdad**,
comprobado con arnés propio y no de palabra, y **ninguno de los casos que ya
medía se rompió**. La línea base la corrí otra vez entera. Los siete hallazgos
que no devolvían siguen anotados; dos de ellos (el 3 y el 6) los cerró el
constructor de paso y lo verifiqué.

**El motivo de la devolución, comprobado** (arnés propio de tests puros,
`src/features/vida/utils/zz-review-t2b.test.ts`, 13 casos, **ya borrado**):

- **El caso exacto que devolví** — un bloque «Pasear» 19:00–19:30, sesiones a las
  **07:30** (30 min) y a las **19:05** (28 min), día pasado: el bloque se lleva
  **la de las 19:05** y se lee **`on-plan`** («✓ calcado»), con `movedToLabel`
  en `null`; la de la mañana sale **«fuera del plan»**. El presupuesto cerrado
  dice `seguido 25m · de más 3m · fuera del plan 30m · sin dato 932m` y **suma
  990 = el día entero**. (Los 3 min de «de más» son los que la sesión se pasa del
  final del bloque: correcto.) Antes decía `seguido 0`.
- **El segundo caso que puse en el informe** —«Leer» 21:00 con sesiones a las
  08:00 y a las 21:00— también: `seguido 30m · fuera del plan 30m`.
- **Los bordes del umbral**: a **60 min** exactos la sesión **casa** (`changed`,
  no movido) y a **61** es **movido**. Coherente con el criterio 23, que habla de
  «**más de** 60 min». *(Nota fina: el criterio 19 dice «a menos de» y el 23 «a
  más de», así que los 60 exactos caen en la costura entre los dos; el código
  resuelve igual que el 23 y `describeBlockExecution` usa el mismo `>`, así que
  al menos es una sola regla en los dos sitios.)*
- **El movido no desapareció**: con una sola sesión de «Organizar la casa» a las
  12:30 y su bloque a las 10:00, el bloque sigue siendo `moved` con «150 min
  tarde», contado **una sola vez** (`fuera del plan 40m`). El segundo pase hace
  lo que pide el criterio 23 **solo cuando al bloque no le queda más remedio**,
  que es lo que decía el arquitecto.

**Lo que ya medía, vuelto a medir** (todo verde, mismos números que en la primera
revisión): dos bloques de la misma actividad con **una** sesión de la mañana (va
al de la mañana, el de la tarde se queda sin ella) · dos bloques y una sesión
**en marcha** → **exactamente un** bloque en marcha · **sesiones solapadas**
990 = 990 · **sesión que cruza el fin del día** 990 = 990 y forma `closed` ·
**día en marcha** 990 = 990 y forma `running` · **día sin registro**
`entries` `toEqual(agenda.entries)` y forma `planned` · **huecos partidos** sin
pisar la sesión y con la agenda sumando 990. Añadí dos comprobaciones nuevas:
con **cinco sesiones y tres bloques** mezclando calcado, movido y fuera del plan,
**ningún bloque recibe dos**, **ninguna sesión se pinta dos veces** y la barra
sigue sumando 990; y el cruce es **determinista** —invertir el orden de bloques y
sesiones da el mismo resultado—, que es lo que sostienen los cuatro desempates.

**El cambio de expectativa del test viejo es legítimo.** «Tres sesiones y dos
bloques de la misma actividad» (`vida-execution.utils.test.ts` L187–209) ahora
espera que el bloque de las 19:00 sea de **s3 (19:05)** y que sobre **s2
(12:00)**. Antes esperaba lo contrario, y lo contrario **era el defecto**: s2
dista **420 min** del bloque, así que por el criterio 19 no es «de» él, y s3
dista 5. El nombre del test —«la que sobra queda fuera del plan»— sigue
describiendo lo que hace. Lo reproduje con mi propio arnés antes de leer el suyo.

**Los dos hallazgos que cerró de paso**, verificados: `isFollowUpsError` ya no
existe en `useVidaDayData` (el aviso del criterio 58 va por `failed`, y queda un
comentario diciendo por qué no hay un `isError` aparte); y `firstRealGapId` sale
de `execution.entries`, así que el aviso de «tu plantilla está vacía» **no se
pierde** cuando una sesión parte el primer hueco.

**Regresiones:** el cambio de esta segunda entrega vive en **una función pura**
(`assignClosestPairs` + `matchSessionsToBlocks`) y en dos líneas de
`VidaHoyPage`/`useVidaDayData`; `git diff ad9eb7f --stat` no saca un solo archivo
fuera de `src/features/vida/` y los consumidores siguen siendo los de siempre
(`VidaHoyPage` es el único que monta lo tocado). La suite entera no empeora.

**Línea base, corrida entera por el revisor** (ninguna se toma del reporte):

| Qué | Resultado |
|---|---|
| `pnpm typecheck` | **exit 0**, limpio |
| `pnpm lint` | **14 errores / 0 warnings**, los preexistentes |
| `pnpm test` | **2 fallos de 1056** (`SearchSelect` ×2; **1 archivo rojo de 96**; +2 tests sobre la entrega anterior) |
| `pnpm build` | **exit 0** · chunk inicial **945,56 kB** · `app-icons` **620,20 kB** · `IconPicker` **4,64 kB** · CSS 193,23 kB |

**Sigue sin revisarse, y no lo disimulo:** ni una llamada real al API (el login es
el límite de este repositorio), los **375 px** y el **tema oscuro** dentro de
`/app/vida/hoy` —el criterio 62 se cierra con ojo humano—, y los criterios 52 y
66, que son del usuario. Los **siete hallazgos** de la primera revisión que no
devolvían siguen abiertos menos el 3 y el 6; el más sustancioso es que **una
sesión fuera del horario del día no entra en la barra** (borde del criterio 26).
Siguiente: la tajada 3, registrar lo que se sale.

### Tajada 3 — registrar lo que se sale

**Veredicto: `accepted`**, con **un recorte escrito y con dueño**: el «···» de
una sesión **emparejada con su bloque** no existe todavía, así que el criterio 35
queda cerrado **solo para lo que se pinta suelto**. No devuelvo por eso porque el
reparto es el del arquitecto —la tabla de la sección 2 le da a esta tajada
`components/VidaAgendaSession/`, y el **criterio 41** (tajada 4) pide
explícitamente que la sesión de un bloque sea «ajustable desde el "···" (hora,
duración, notas, criterio 6)» y deshacible—, pero **lo dejo dicho aquí para que
nadie cierre la tajada 4 sin eso**: si la 4 solo lo da a las sesiones nacidas de
«Lo hice», el criterio 35 se quedará sin cumplir para una sesión empezada y
terminada sobre su bloque, que es el camino más común de todos.

**Criterios, uno a uno** (contra la sección 1, no contra el resumen del constructor)

| # | Veredicto del revisor | Cómo lo comprobé |
|---|---|---|
| 30 | cumplido | «Empezar algo» solo llega con `onStartSomething` cuando `canStart` (hoy, con sesión y sin la pregunta de otro día). La hoja en modo `start` no monta `VidaDurationPills` ni pregunta «cuánto», y **no llama a ninguna mutación**: `onStart` → `sessionActions.start`, que es quien cierra la anterior (D4). Leído en `VidaHoyPage.tsx` y en `VidaLogSessionSheet.tsx`. El molde es el de FEAT-003 (`SteppedModal` `ds="aura"` + `mobileSheet`). |
| 31 | cumplido | Modo `log` con los tres pasos y `VidaDurationPills`; escribe con `useCreateActivityFollowUpMutation` (`activityFollowUpAdd`) y `logSessionInput`, que devuelve exactamente `activityId · date · startTime · durationMinutes · notes`. |
| 32 | cumplido, **medido por mí** | Arnés propio (`src/features/vida/components/zz-rev-t3.test.tsx`, 9 casos, **borrado**): **hoy** pinta los dos botones; **día pasado** pinta **un solo botón** en toda la fila —«Registrar tiempo pasado»—, sin «Empezar algo», sin «Copiar del \<día\> pasado» y sin «Vaciar y rehacer»; **día futuro**, ninguno de los dos. `canLogPast = isToday \|\| isPast` en la página. |
| 33 | cumplido | Lo registrado entra por el cruce de la tajada 2 (nada nuevo que pintar) y el refresco va por `invalidateFollowUpQueries`, que ya existía. |
| 34 | cumplido | El picker filtra con `excludeArchivedActivities` sobre `useActivitiesQuery`; lo que no existe no se crea aquí, se enlaza al catálogo. |
| 35 | **cumplido para las sesiones sueltas; recortado para las emparejadas** | Medido en mi arnés con proveedores de verdad: el «···» de una sesión suelta abre **«Corregir»** y **«Quitar del registro»**, el diálogo dice «¿Quitar «Llamada con el banco» del registro?» con salida **«Volver»**, pulsar «Volver» **no llama a la mutación**, y no hay ni un control que diga «cancelar», «eliminar» o «borrar». Una sesión **en marcha** no ofrece el menú, y sin `onEdit` (día futuro) tampoco. Lo que **no** existe: el «···» de la sesión que casó con su bloque — el bloque solo ofrece el cierre completo `isRunning && onOpenFinishModal`. |
| 36 | cumplido | El `mutate` cierra la hoja en su `onSuccess` **local**: con error, `onClose` no se llama y el estado sigue en el componente (la `key` es por apertura, así que no se remonta). No hay escritura optimista en ninguna de las dos mutaciones, así que no puede quedar una sesión fantasma en la agenda. |
| 37 | cumplido | La hoja no importa ni nombra nada de `activityDayPlan` (solo en un comentario), y `logSessionInput`/`editSessionInput` no tienen una sola clave del plan. |
| 38 | cumplido, **verificado por estructura** | `filterActivitiesBySearch` solo aparece en `VidaActivityPicker`, en `activity-filters.ts` y en `VidaActividadesPage` (que ya era suyo); `useActivitiesQuery` ya **no** está en `VidaPlaceInGapSheet`. Las dos hojas importan y montan `VidaActivityPicker`. No hay dos buscadores. |
| 56 | cumplido | Ver el 32: en un día pasado la fila tiene **un** botón y es de registro. Los tests de FEAT-003 que afirman «cero botones de plan» siguen verdes sin tocarse. |
| 59 | cumplido | `pnpm test src/features/vida/vida-vocabulary.test.ts` → **8 de 8**. Los cinco mensajes de `validateLogPast` los leí uno a uno: describen, no reprochan. |
| 65 | cumplido, **medido por mí** | typecheck **exit 0** · lint **14/0** · `pnpm test` **2 fallos de 1101** (los dos de `SearchSelect`; **1 archivo rojo de 98**) · `pnpm build` **exit 0**, chunk inicial **953,93 kB**, `app-icons` **620,20 kB**, `IconPicker` **4,64 kB** (CSS 195,68 kB): **+8,4 kB y ninguno de iconos**. |

**La desviación de `validateLogPast`: razonable, y queda escrita.** Rechazar un
rato que **terminaría después de ahora** («de 15:00 a 16:00» a las 15:30) no lo
pide el criterio 32, pero es coherente con el resto: pintaría en la agenda media
hora que nadie ha vivido y el presupuesto la contaría como vivida, justo lo que
el criterio 50 prohíbe para el tiempo que aún no ha llegado. El mensaje —«Ese
rato no ha pasado entero todavía. Ajusta cuánto duró.»— describe y ofrece salida,
sin una palabra de culpa. **Un aviso para la tajada 4:** «Lo hice» (criterio 41)
crea la sesión con **la hora y la duración planeadas**, así que un bloque de
14:00 a 15:00 marcado a las 14:50 nacerá terminando en el futuro y **no se podrá
corregir** con esta validación hasta bajarle la duración. O se exceptúa ahí, o se
vive con ello sabiéndolo.

**Qué miré alrededor, y cómo** (regresiones)

- **Quién monta lo que se tocó**: `VidaAgendaSession` solo lo monta
  `VidaHoyPage` (`grep` sobre `src/`, tres archivos: el componente, su barril y
  la página), así que **que haya dejado de ser puro no puede romper a nadie más**;
  en mi arnés lo monté con `QueryClient` + `ConfirmDialogProvider` reales y
  funciona. `VidaDayActions` y `VidaPlaceInGapSheet` tampoco salen de la página.
- **La extracción del «qué»** (riesgo 1 del constructor): comprobado que la hoja
  de FEAT-003 **usa** el picker y ya no tiene buscador propio ni consulta de
  actividades; su test sigue verde en la corrida entera.
- **`VidaDayActions` donde no aparecía** (riesgo 2): medido arriba. En un día
  pasado **no se monta `PlanShortcuts`**, así que tampoco se pide el plan de la
  semana anterior: la razón del componente interno se sostiene.
- **Nada nuevo en el aparato ni en el arranque**: `git diff dda6caf -- src/` no
  añade una línea con `localStorage`/`sessionStorage`, no hay `free-solid-svg-icons`
  a pelo en el módulo, y `app-icons`/`IconPicker` salen **idénticos** del build.
- **Nada duplicado** (sección 2): ni mutación, ni clave, ni invalidación, ni SDL,
  ni componente de `shared/ui`, ni un quinto normalizador de texto. `VidaDurationPills`
  se reutiliza, `VidaActivityPicker` es **extracción** y no copia, y los cinco
  modales de `79bece0` no han vuelto: son tres modos de una hoja.

**Estados**

- **Sin datos** (catálogo vacío / nada con ese nombre) ✔ con vía al catálogo ·
  **Error de escritura** (36) ✔ · **Día pasado** (56) ✔ · **Día futuro** ✔.
- **Cargando el catálogo dentro del picker** y **el fallo de esa consulta** siguen
  sin distinguirse («Nada con ese nombre»): es el hallazgo heredado de FEAT-003,
  **no agrandado**, y sigue abierto.
- **375 px y tema oscuro de la hoja nueva**: medidos por el **constructor** en un
  arnés que ya borró (375 = `scrollWidth` = `clientWidth`, nombre de 47
  caracteres truncado en una línea). **Yo no los volví a medir**: mi arnés fue de
  comportamiento, en jsdom, que no tiene disposición. Queda como medida de
  segunda mano, igual que el criterio 62 de la tajada 2.

**Hallazgos anotados, ninguno devuelve**

1. **El «···» de una sesión emparejada con su bloque** (el recorte de arriba):
   **obligatorio en la tajada 4**, junto al criterio 41.
2. **Corregir no puede cambiar el «qué»** (`activityFollowUpEdit` no admite
   `activityId`): está dicho en el componente; si alguien registra la actividad
   equivocada, hay que quitarla y registrarla otra vez. Ninguna pantalla lo
   explica.
3. **Registrar no avisa de solapes** (riesgo 5 del constructor): correcto que lo
   real se solape, pero nadie lo dice.
4. **El modo `log` no ofrece notas**, solo el modo `edit`. El criterio 31 no las
   pide; se añaden después desde «Corregir».
5. Siguen abiertos los de las tajadas 1 y 2: la sesión fuera del horario del día
   que no entra en la barra, el movido que además está en marcha, la barrita que
   le falta al movido, «▶ Empezar» apagándose por actividad, «Cambiar hora o
   duración» validando solo contra el plan, la línea de guía que no sabe nada de
   lo vivido y el buscador que no distingue fallo de vacío.

**Lo que no revisé, y no lo disimulo:** ni una llamada real al API —ni un
`activityFollowUpAdd` ni un `activityFollowUpRemove` de verdad—, los 375 px y el
tema oscuro en un navegador, y los criterios 52 y 66, que son del usuario.
Siguiente: la tajada 4, **la última**: pendiente, las tres salidas, «sin dato» y
la frase de cierre — **más el «···» de la sesión de un bloque**.
