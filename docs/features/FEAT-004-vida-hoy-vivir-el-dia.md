---
id: FEAT-004
title: Hoy — vivir el día: lo real encima de lo planeado, con cronómetro y registro
status: specified
architect: yes    # concepto nuevo (la sesión viva y su cruce con el plan), superficie global en todo el módulo, y una decisión abierta que puede tocar el API
area: features/vida
requested: 2026-09-20
updated: 2026-09-20
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

*(pendiente)*

## 3. Construction — feature-builder

*(pendiente)*

## 4. Review — feature-reviewer

*(pendiente)*
