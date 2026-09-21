---
id: FEAT-005
title: La plantilla Vida — tu semana tipo, con hora y duración por ítem
status: building
architect: yes    # pantalla nueva sin hermana (la cuadrícula semanal por horas), y hay que generalizar la hoja del catálogo de «el ítem de esta actividad» a «este ítem», que es código compartido
area: features/vida
requested: 2026-09-20
updated: 2026-09-20   # tajada 3 `accepted`: «Añadir a mi Vida» y el primer minuto (el 39 queda del usuario)
---

# FEAT-005 — La plantilla Vida — tu semana tipo, con hora y duración por ítem

## 1. The request — feature-analyst

**Summary for whoever's next:** F4 del plan de Vida. `/app/vida/plantilla` deja
de ser un cascarón y pasa a ser **la semana tipo como agenda**: cada cosa con su
hora y su duración, el orden lo da la hora y no se arrastra nada. La primera
tajada es **verla**: pestañas de día, la agenda del día ordenada por hora, el
cajón de las que no tienen hora y el resumen de cuánto hay puesto. **El API no
se toca**: lo que pide el render cabe entero en `VidaItem` tal como está.

**What problem it solves:** hoy la plantilla existe en el API y se edita **de
una en una desde el catálogo** — abres «Bañarme», le pones días, hora y
duración, cierras, abres la siguiente. Eso sirve para retocar, no para **armar
una semana**: el usuario no tiene dónde ver su día tipo entero, ni dónde
descubrir que el martes por la mañana está vacío, que puso dos cosas a la misma
hora, o que tres ítems se quedaron **sin hora** y por eso «Armar desde la
plantilla» se los encadena al final del día. El problema no es «falta una
pantalla de plantilla»: es que **la plantilla es la fuente de la que vive Hoy**
(los huecos ofrecen lo que cabe, «Armar» copia hora y duración) y ahora mismo
solo se puede alimentar a ciegas, ítem a ítem, sin ver nunca el resultado. Y hay
un segundo problema, el del primer día: una plantilla vacía no se llena si la
pantalla pide «crea tu semana»; se llena si pide **tu mañana**.

**Who it's for:** el usuario del módulo Vida, **fuera del día** — el domingo por
la noche o cuando algo deja de funcionar («no me está dando hacer ejercicio en
las mañanas»). No es una pantalla de uso diario: se entra pocas veces y se sale
con la semana cambiada. Por eso el criterio de la fase es de **velocidad
armando**, no de permanencia.

**User's words:** el pedido original del módulo, del 2026-09-18, es el que
enmarca la fase:

> «Como siempre me soñé el módulo de actividades y follow-ups: **es más como una
> plantilla de mi vida**, donde planeo día a día lo que voy a hacer y puedo
> seguir la plantilla o registrar lo que se sale, y al final del día evaluar cómo
> me va. Con el tiempo el sistema entiende y me ayuda mejor a planear.»

Y, al decidir que la plantilla lleva hora (FEAT-003, D6):

> «Prefiero hacer una actividad a un tiempo más tarde de lo que estaba porque me
> levanté tarde o porque empecé tarde, o antes si tengo tiempo. **La planeación
> no es una regla rígida**, es una plantilla de lo que quiero que sea mi día,
> pero también quiero ver el vs de lo planeado con lo ejecutado».

**No hay una frase nueva del usuario para esta fase**, y queda dicho en vez de
inventado: lo que hay es el **render aprobado hoy**,
`docs/vida/assets/06-vida-plantilla.html` (se abre en
`http://localhost:5173/docs/vida/assets/06-vida-plantilla.html`). **Sus cuatro
marcos y sus notas al pie son parte de la spec** y no se reabren: A (la semana
tipo en el móvil, un día a la vez), B (la hoja de un ítem), C (escritorio, los
siete días a la vez con el lateral «Añadir a mi Vida») y D (el primer minuto).
Lo que el render decide, se especifica tal cual.

**Lo que manda por encima del render**, porque ya estaba decidido: la plantilla
**es una agenda** —hora y duración por ítem, el orden lo da la hora— y **no hay
arrastrar y soltar** (`docs/vida/PLAN.md`, decisiones 3, 5 y 13).

**Out of scope:** (lo que alguien podría dar por incluido y NO lo está)

- **Arrastrar y soltar.** Ni para reordenar, ni para mover un bloque de hora, ni
  para llevarlo de un día a otro. No hay `dnd-kit` en el repo y no vuelve por
  esto (decisión 5 del plan). La hora se edita escribiéndola.
- **Bloquear o resolver los solapes.** Dos cosas a la misma hora **se ven** y se
  guardan igual. Quien los resuelve es «Armar desde la plantilla» en Hoy, que
  corre detrás lo que se pisaría (nota «Lo que esta pantalla decide», punto 5).
- **Reescribir días que ya están armados.** Cambiar la plantilla **nunca** toca
  un `activityDayPlan` existente, ni hoy ni mañana. Lo único inmediato es lo que
  se **deriva** de la plantilla: las fichas de los huecos, «Armar» y el lateral
  de Hoy.
- **Crear una actividad desde cero con nombre y categoría**, y crear o editar
  **categorías**. Eso sigue siendo del catálogo (`/app/vida/actividades`,
  FEAT-002). Aquí se **traen** actividades que ya existen — con una sola
  excepción, los puntos de partida del primer minuto (criterio 37), que crean la
  actividad y su ítem de un toque.
- **Cambiar el nombre o la categoría de una actividad.** La hoja abierta desde
  la plantilla los **enseña** en la cabecera y no los pide; se cambian donde se
  cambiaban.
- **Archivar una actividad.** Se archiva en el catálogo (`activityEdit` con
  `status: 'cancelled'`) y nunca se borra. Desde aquí solo se quita **el ítem de
  la plantilla**, y la actividad se queda en el catálogo.
- **Repeticiones que el API no modela:** cada dos semanas, «un día al mes»,
  excepciones por fecha, festivos, vacaciones, plantillas por temporada o más de
  una plantilla. El modelo es **actividad × días de la semana × una hora**, y
  hacer la misma cosa dos veces en un día son **dos ítems** (criterio 35).
- **Recordatorios, notificaciones y alarmas** a la hora de un ítem.
- **Cualquier cifra de cumplimiento.** Ni «sigues tu plantilla 4 de 5 días», ni
  «sueles tardar 55 min», ni horas sugeridas desde el historial: eso es F5 y F6,
  y el render no lo dibuja a propósito.
- **`vidaTakenToday` / `vidaMarkTakenToday`.** Existen en el API desde F0 y
  **siguen sin usarse**: «hecho» se deriva de la sesión (FEAT-004, D7).
- **`orderIndex` como orden manual.** El campo existe y se queda quieto: el
  orden lo da la hora, y dos ítems a la misma hora se ordenan por nombre.
- **El horario del día** (6:30 → 23:00). Se lee de los ajustes de Vida
  (`/app/vida/ajustes`, FEAT-003) y desde aquí **no se cambia**; como mucho se
  enlaza.
- **Rutas nuevas.** Todo cae en `/app/vida/plantilla`, que ya existe desde F0.
  Ni píldora nueva ni destinos añadidos a mano (`app-nav.config.ts` es la fuente
  única).
- **Uso sin conexión.** `clientId` admite idempotencia y **no se usa**.
- **Cambios en el API.** Ninguno. Lo que el render pide cabe en `VidaItem`
  (comprobado: ver «Hipótesis marcadas»).

**Acceptance criteria:**

*La plantilla se ve: el día tipo, ordenado por hora (tajada 1)*

- [ ] 1. `/app/vida/plantilla` deja de ser un cascarón: enseña **«Tu plantilla»**
  con la línea «Cómo quieres que sea tu semana. Hoy la sigue — o no.». La ruta,
  la píldora del módulo y el `⌘K` **no cambian**.
- [ ] 2. Arriba, **siete pestañas de día** (L M X J V S D) con la cuenta de cosas
  de ese día debajo. Al entrar se abre **el día de hoy**. La pestaña activa se
  distingue por algo más que el color (borde y peso) y se puede cambiar con el
  teclado.
- [ ] 3. Cada pestaña lleva un **punto rayado** si ese día tiene algo y uno
  apagado si no, con la misma lectura que la tira de Hoy.
- [ ] 4. Debajo, el resumen del día: **«Viernes · 3h 40 puestas de 16h 30»**,
  donde 16h 30 sale del horario de Vida de los ajustes, y una **barra del día
  entero** con los tramos puestos; los anchos **suman el 100 %** aunque dos
  ítems se pisen.
- [ ] 5. Una frase compuesta con reglas, no inventada: «Seis cosas con hora y
  **una sin ella**. Tu viernes está lleno por la mañana y libre de 14:00 a
  19:00». Si no hay un hueco grande que nombrar, **no se afirma uno**.
- [ ] 6. La agenda del día: una tarjeta por ítem, **ordenada por hora
  ascendente**, con la hora a la izquierda, el icono y el color de su categoría,
  el nombre, y la meta **«45 min · L M X J V»** (los días del propio ítem).
  **No hay asas de arrastre ni flechas de reordenar**: la hora es el orden.
- [ ] 7. Un ítem **sin duración** se lee «sin duración», nunca «0 min» ni una
  duración inventada.
- [ ] 8. Un ítem **desactivado** no desaparece: se queda en su hora, en trazo
  suave, con la etiqueta **«desactivada · no sale en Hoy»**. (El botón
  «Activar» llega en la tajada 2, criterio 26; en la 1 no se pinta un botón
  muerto.)
- [ ] 9. Los ítems **sin hora** van en un **cajón al final** —no escondidos y no
  mezclados—, con el rótulo «Sin hora», su cuenta, y la explicación literal:
  «Hoy las pone **al final del día**, una detrás de otra. Con hora quedan en su
  sitio.» (El botón «Ponerle hora» llega en la tajada 2, criterio 25.)
- [ ] 10. **Plantilla vacía del todo:** el texto del marco D —«Tu plantilla es tu
  semana contada por horas: *a esta hora hago esto, por este tiempo*» y «No hace
  falta llenarla entera. **Empieza por tu mañana**»—, la salida **«Traer de tus
  actividades»** con la cuenta real del catálogo («11 en tu catálogo · 3 ya con
  días puestos»), y la línea que quita la presión: «Un día sin plantilla se vive
  igual: se registra sobre la marcha.» **Los seis puntos de partida son de la
  tajada 3** (criterio 37): este criterio se parte y queda dicho.
- [ ] 11. **Un día concreto vacío** con otros días llenos: se dice sin reproche
  («El viernes no tienes nada puesto») y con la salida para poner algo.
- [ ] 12. **Cargando** se ven esqueletos con la forma de las tarjetas, no un
  salto ni una plantilla vacía fingida. **Si la consulta falla** se lee «No
  pudimos cargar tu plantilla» con **«Reintentar»**, y en ningún caso se afirma
  que no hay nada.
- [ ] 13. Un nombre de **60 caracteres** no rompe la tarjeta, no tapa la hora y
  no provoca scroll horizontal.
- [ ] 14. A **375 px** no hay scroll horizontal y en **tema oscuro** los rótulos
  llegan a 4,5:1.
- [ ] 15. En toda la pantalla **no aparece vocabulario de culpa** («cancelar»,
  «eliminar», «desperdiciado», «fallaste»); el test de vocabulario del módulo
  cubre los archivos nuevos.

*La plantilla se edita desde aquí: la hoja del ítem (tajada 2)*

- [ ] 16. Tocar una tarjeta (o su «···») abre **la misma hoja que el catálogo**
  —`VidaActivitySheet`—, con los mismos campos en el mismo orden. **No se
  escribe una segunda forma de editar un ítem.**
- [ ] 17. La hoja edita **ese ítem, por su id**, no «el ítem de esa actividad»:
  con dos ítems de «Pasear a las mascotas» (7:30 y 19:00), abrir el de las 19:00
  y guardar **no toca** el de las 7:30.
- [ ] 18. Los campos son: **qué días** (L…D), **a qué hora** (24 h, admite
  vaciarla), **cuánto** con las píldoras **15 · 30 · 45 · 1h · libre** y minutos
  a mano, y la **nota** en texto plano. La cabecera enseña el nombre, el icono y
  la categoría, y **no los pide**.
- [ ] 19. El **interruptor «Activa en mi plantilla»** con su explicación:
  «Desactivada se queda aquí guardada con sus días y su hora, y deja de salir en
  Hoy.»
- [ ] 20. **Vista previa de cómo queda en Hoy**, calculada de lo que hay elegido:
  «Así queda en **Hoy**: lunes, miércoles y viernes de **9:00 a 9:45**», más
  «Los días que ya tienes armados **no se reescriben solos**». Sin hora o sin
  duración, dice qué le falta en vez de enseñar un rango falso.
- [ ] 21. **«Quitar de la plantilla»** quita **ese ítem** (`vidaItemDelete`), con
  una confirmación que dice que **la actividad se queda en tu catálogo** y cuya
  salida es **«Volver»**. Nunca «eliminar» ni «cancelar».
- [ ] 22. **Un ítem de varios días se quita de los varios**, y la pantalla lo
  avisa antes: quitando «Organizar la casa» desde el viernes, la confirmación
  dice «también está los lunes y los miércoles» y ofrece las dos salidas —
  **«Quitarlo solo del viernes»** (se le resta el día) y **«Quitarlo de los tres
  días»**—. Con un solo día, una sola salida.
- [ ] 23. El API exige **al menos un día**: quitar el último no se puede guardar
  y se dice en el campo («déjale al menos un día, o desactívala»), no con un
  error del servidor.
- [ ] 24. Guardar cierra la hoja y la pantalla se actualiza **sin recargar**:
  cambiar la hora **reordena** la tarjeta en su día, vaciarla la manda al cajón
  «Sin hora» y ponérsela la saca de él. Si la mutación **falla**, la hoja **no
  se cierra ni pierde lo escrito** y lo dice dentro.
- [ ] 25. **«Ponerle hora»** en una tarjeta del cajón abre la misma hoja con la
  hora lista para escribirse.
- [ ] 26. **«Activar»** en un ítem desactivado lo reactiva **de un toque**, sin
  abrir la hoja, conservando sus días, su hora y su nota, y lo confirma.
- [ ] 27. **Hoy lo ve al instante**: con Hoy abierto en otra pestaña o al volver,
  cambiar aquí la hora de un ítem cambia lo que ofrecen los huecos y lo que
  copiaría «Armar desde la plantilla», **sin recargar**. Y un día **ya armado**
  sigue exactamente como estaba: nada se reescribe.
- [ ] 28. A 375 px la hoja no provoca scroll horizontal y su botón de guardar se
  ve sin salir de ella; en oscuro se lee; con un nombre de 60 caracteres la
  cabecera no desborda.

*Añadir a mi Vida, sin salir de la pantalla, y el primer minuto (tajada 3)*

- [ ] 29. Hay una forma de **añadir** desde la propia pantalla: en móvil un botón
  flotante **«+»**, en escritorio el panel **«Añadir a mi Vida»**. Ninguno
  navega a `/app/vida/actividades`.
- [ ] 30. El panel busca en **tus actividades** por nombre, **sin tildes**
  («banar» encuentra «Bañarme») reutilizando el filtro que ya existe, y las
  enseña **agrupadas por categoría** con su color. Las **archivadas no salen**.
- [ ] 31. Cada actividad dice **en qué estado está**: «aún no está» con
  **«+ Añadir»**, o «en tu plantilla · V · sin hora» con **«Ponerle hora»**.
- [ ] 32. Al elegir una, **en el mismo panel** se le ponen **días, hora y
  duración** y se guarda con «Añadir a mi Vida». Al guardar aparece en el día
  que toque, sin recargar y sin salir de la pantalla.
- [ ] 33. El panel dice **si cabe**, sin bloquear: «a las 18:00 no tienes nada» o
  «a las 18:00 ya tienes *Pasear a las mascotas*». Se puede guardar igual: los
  solapes no se bloquean aquí (los resuelve «Armar» en Hoy).
- [ ] 34. Una actividad que **ya está** en la plantilla se puede añadir **otra
  vez a otra hora** —son **dos ítems**— y la pantalla lo dice antes: «*Pasear a
  las mascotas* ya está a las 7:30 · esto le añade otra hora». Es lo que sostiene
  el ejemplo del propio render (pasear a las 7:30 y a las 19:00).
- [ ] 35. **La consecuencia en el catálogo queda dicha, no escondida:** la
  tarjeta y la hoja de `/app/vida/actividades` siguen enseñando **un** ítem por
  actividad —el activo, y si hay varios el de la hora más temprana—, así que la
  hoja del catálogo avisa con una línea: «esta actividad tiene **2 horas** en tu
  plantilla · las dos se cambian en **Plantilla**», con enlace. Nunca enseña una
  hora como si fuera la única.
- [ ] 36. **El primer minuto** (marco D), con la plantilla vacía: seis **puntos
  de partida con hora y duración ya propuestas** (7:00 Bañarme 15m · 7:30 Pasear
  a las mascotas 40m · 8:30 Desayunar con calma 30m · 9:00 Organizar la casa 45m
  · 13:00 Cocinar y almorzar 1h · 21:30 Leer un rato 30m), **tres marcados** de
  salida, un selector de días **de lunes a viernes** por defecto, el contador
  «3 elegidas · de lunes a viernes» y el botón **«Ponerlas en mi plantilla»**.
  Debajo, la línea «Horas de partida · las ajustas en un toque después».
- [ ] 37. Ese botón crea, de una vez, **las actividades que no existan** y **sus
  ítems con hora y duración**; una actividad que **ya esté en el catálogo no se
  duplica** (se reutiliza la que hay). Al terminar, la pantalla ya enseña el día
  armado.
- [ ] 38. Si esa creación **falla a medias**, se dice qué quedó puesto y qué no
  («Pusimos 2 de 3; *Leer un rato* no se pudo»), lo elegido **no se pierde** y se
  puede reintentar solo lo que faltó.
- [ ] 39. **Criterio de la fase:** partiendo de una plantilla vacía se deja **un
  día entero puesto** (cinco o seis cosas con su hora) **sin salir de
  `/app/vida/plantilla`** ni una sola vez.
- [ ] 40. El panel tiene sus estados: **cargando** (esqueletos), **catálogo
  vacío** («todavía no tienes actividades», con la salida a crearlas), **sin
  resultados** de la búsqueda («Nada con ese nombre»), y **error de carga** que
  se distingue del vacío («No pudimos cargar tus actividades · Reintentar»).
- [ ] 41. A 375 px el panel y sus campos no provocan scroll horizontal, y en
  oscuro se leen.

*La semana entera y copiar un día (tajada 4)*

- [ ] 42. En **escritorio** la pantalla enseña **los siete días a la vez**: una
  columna por día, cada ítem **a su hora** y con el alto proporcional a su
  duración, sobre una escala horaria que va del **inicio al fin del día** de los
  ajustes de Vida.
- [ ] 43. Cada columna lleva su cabecera con el día y **«6 · 3h 40»** (cuántas
  cosas y cuánto tiempo), y **el día de hoy queda marcado**.
- [ ] 44. **Debajo de cada columna**, los **sin hora** de ese día, como píldoras
  punteadas; una columna sin ellos no pinta nada.
- [ ] 45. **Leyenda**: un color por categoría de las que aparecen, más «trazo
  punteado = **desactivada · no sale en Hoy**».
- [ ] 46. Arriba, el total de la semana: «**43 cosas puestas · 26h 35 a la semana
  de 115h 30 · tu día va de 6:30 a 23:00**», con los números calculados.
- [ ] 47. **Dos ítems que se pisan se ven los dos** —ninguno se oculta ni se
  recorta hasta desaparecer— y **no se bloquea nada**: ni error, ni aviso rojo.
- [ ] 48. En **móvil** la cuadrícula se alcanza con **«Ver la semana entera»**
  desde el resumen del día: la misma vista, desplazable en horizontal, **sin
  cambiar de ruta** y con vuelta al día.
- [ ] 49. **«Copiar este día a otros»**: se parte del día que se está viendo, se
  marcan los días destino, se dice cuántos son y se confirma con **«Copiar a 3
  días»**. La salida del diálogo es **«Volver»**.
- [ ] 50. Copiar **añade lo que falta y no pisa nada**: un ítem cuya actividad ya
  esté en el día destino **a cualquier hora** no se copia, y el resumen lo dice
  («*Pasear a las mascotas* ya estaba el sábado, se quedó como estaba»).
  **Copiar no borra nunca nada.**
- [ ] 51. **La consecuencia de copiar queda dicha**: un día copiado comparte el
  mismo ítem, así que cambiarle después la hora **cambia los días a la vez**. La
  hoja lo enseña siempre («está los viernes y los sábados») y el criterio 22 da
  la salida para separarlos.
- [ ] 52. Si copiar **falla en parte**, se lee cuántos días quedaron y cuáles no;
  **nunca «copiado»** cuando no lo está. Los ítems desactivados **no se copian**.
- [ ] 53. Después de copiar, las cuentas de las pestañas, el resumen y la
  cuadrícula se actualizan **sin recargar**, y Hoy ve la plantilla nueva.
- [ ] 54. La cuadrícula tiene sus estados: **semana vacía** (el texto del
  criterio 10, no siete columnas mudas), **cargando** y **error** con
  «Reintentar»; a 375 px el contenedor se desplaza sin romper la página y en
  oscuro se lee.

*Solo lo puede cerrar el usuario*

- [ ] 55. **El recorrido real, con su cuenta y la API despierta** (Render se
  duerme a los 15 min): entrar en Plantilla → moverse por las pestañas de día →
  abrir un ítem, cambiarle la hora y ver cómo se reordena → quitarle la hora y
  verlo caer al cajón → ponerle hora desde el cajón → desactivar uno y volver a
  activarlo → **quitar uno de un solo día** y comprobar que la actividad sigue en
  el catálogo → añadir una actividad desde «Añadir a mi Vida» con días, hora y
  duración → **añadirle una segunda hora a una que ya estaba** → mirar la semana
  entera y **copiar un día a otros tres** → volver a **Hoy** y comprobar que los
  huecos y «Armar desde la plantilla» ya ven todo lo cambiado, y que **un día ya
  armado no se movió**. Todo `/app/*` está detrás del login y **los agentes no
  entran**: queda dicho, no disimulado.

**Slices:** (vertical, cada una usable sola)

| # | What it does | State |
|---|---|---|
| 1 | **La plantilla se ve.** `/app/vida/plantilla` deja de ser un cascarón: pestañas de día con su cuenta y su punto, el resumen («3h 40 puestas de 16h 30») con la barra del día, la agenda del día **ordenada por hora** con sus tarjetas, el cajón «Sin hora» con su explicación, los desactivados en trazo suave, y los estados vacío · cargando · error · texto largo · 375 px · oscuro. **Solo lectura.** Ya es útil sola: es la primera vez que el usuario ve su día tipo entero y descubre qué tiene sin hora. | in-review |
| 2 | **La plantilla se edita desde aquí.** La hoja del ítem —la misma del catálogo— abierta **por ítem**: días, hora, duración, nota, interruptor, vista previa de cómo queda en Hoy, «Quitar de la plantilla» (con la salida de quitarlo de un solo día) y «Activar» de un toque. Arreglar la plantilla deja de exigir dar la vuelta por el catálogo, y Hoy lo ve al instante. | in-review |
| 3 | **Añadir a mi Vida, y el primer minuto.** El «+» de móvil y el panel de escritorio: buscar una actividad del catálogo y ponerle días, hora y duración **sin salir de la pantalla**, incluida una **segunda hora** para algo que ya está; y la plantilla vacía con los **seis puntos de partida con hora**. Cierra el criterio de la fase (39). | in-review |
| 4 | **La semana entera y copiar un día.** Los siete días a la vez con cada bloque a su hora, los sin hora debajo de su columna, la leyenda, el total de la semana, y **«Copiar este día a otros»** — que añade lo que falta, no pisa nada y lo cuenta. Es el atajo que sustituye al arrastrar. | pending |

**Por qué este orden:** la 1 es lectura pura sobre datos que **ya existen**
(`vidaItems` trae la semana entera de una vez), así que se ve con un arnés y se
prueba en Vercel sin haber escrito nada todavía. La 2 escribe sobre lo que la 1
ya pinta y **reutiliza** una hoja construida, así que su riesgo está en un solo
sitio: generalizarla a «este ítem». La 3 es la que trae el catálogo dentro y es
la que **cierra la fase**, y necesita que editar ya funcione (se añade, y lo
primero que se hace después es retocar la hora). La 4 es la vista de conjunto y
el lote: se apoya en todo lo anterior y es la única que toca varios ítems de una
vez, que es lo que más puede salir mal. **Cada tajada se puede probar entera en
Vercel** sin la siguiente.

**Architect? yes** porque:

1. **Es una pantalla sin hermana.** La **cuadrícula semanal por horas** (siete
   columnas, bloques posicionados y con alto proporcional) **no existe en el
   repo**: la agenda de Hoy es una lista vertical de entradas, no un lienzo. Y
   `VidaSemanaPage` (FEAT-003) es «una línea por día», otra cosa. Decidir si
   esto vive en un componente nuevo con aritmética propia o se deriva de
   `vida-agenda.utils.ts` se hace **una vez**, no a mitad de tajada.
2. **Hay que tocar código compartido.** `VidaActivitySheet` y
   `useSaveVidaItemForActivity` están escritos alrededor de «**el** `VidaItem`
   de esta actividad» (`findVidaItemForActivity`,
   `buildVidaItemsByActivity`, `planVidaItemSave`). Esta feature necesita «**este**
   ítem, por id» y además **crear un segundo ítem para una actividad que ya
   tiene uno** — que es justo lo que `planVidaItemSave` hoy convierte en un
   `update`. Es el punto donde se puede romper el catálogo de FEAT-002 sin
   darse cuenta.
3. **«Copiar un día» es un lote de mutaciones con una regla de omisión** que
   escribe sobre la plantilla entera. Cómo se agrupa, qué se invalida y qué pasa
   si una falla a medias tiene precedente (`useBuildWeekFromTemplate`) y hay que
   decidir si se reutiliza.
4. **Hay que decidir de dónde sale la plantilla en esta pantalla**: es la primera
   que necesita `vidaItems(includeInactive: true)` para **pintar** (no solo para
   la hoja), y conviven con ella las claves de FEAT-003 que Hoy ya invalida.

**Lo que ya existe y NO se vuelve a construir** (con su ruta, para que nadie lo
escriba dos veces):

- **La hoja del ítem:** `src/features/vida/components/VidaActivitySheet/` —
  días, «a qué hora», `VidaDurationPills` (15 · 30 · 45 · 1h · libre), nota e
  interruptor de plantilla, sobre `SteppedModal` con `mobileSheet`. **Es
  literalmente el marco B.**
- **El guardado de un ítem:** `hooks/useSaveVidaItemForActivity.ts` con
  `planVidaItemSave` (puro y probado) y `hooks/useVidaItems.ts`
  (`useCreateVidaItemMutation`, `useUpdateVidaItemMutation`, y **el borrado, que
  está y no lo usa nadie**).
- **La capa de datos:** `graphql/vida-items.graphql.ts`,
  `types/vida-item.types.ts`, `api/`, `vidaKeys`, `utils/invalidate-vida-queries.ts`,
  y el SDL vendorizado `graphql/schema/vida.schema.graphql` con su
  `contracts.test.ts` (**si se añade un documento, entra en la lista del test**).
- **El tiempo:** `utils/vida-time.utils.ts` (`parseTimeToMinutes`,
  `minutesToTime`, `calculateEndTime`, `formatDurationFromMinutes`,
  `normalizeTimeForDisplay`, `DURATION_PILLS`, `DEFAULT_BLOCK_MINUTES`) y
  `utils/vida-date.utils.ts` (`VIDA_DAY_ORDER`, `VIDA_DAY_LABELS`,
  `VIDA_DAY_SHORT_LABELS`).
- **El horario del día:** `hooks/useVidaDayHours.ts` (inicio y fin de Vida) y
  `pages/VidaAjustesPage.tsx`.
- **El catálogo y su búsqueda:** `pages/VidaActividadesPage.tsx`,
  `hooks/useActivities.ts`, `utils/activity-filters.ts`
  (`filterActivitiesBySearch` — **no se escribe un quinto normalizador de
  texto**), `utils/vida-catalog.utils.ts` (`excludeArchivedActivities`,
  agrupación por categoría), `components/VidaCatalogGroup/`,
  `components/VidaActivityCard/`.
- **Los puntos de partida:** `data/vida-starting-points.ts`,
  `components/VidaStartingPoints/`, `hooks/useCreateStartingActivities.ts`
  (FEAT-002). El marco D es **esto más hora y duración**.
- **La barra del día y sus tramos:** `utils/vida-agenda.utils.ts` (`getDayBudget`,
  `buildGuidanceLine`) y `components/VidaDayBudget/` — la forma de contar «X de
  Y» y de que los anchos sumen 100 % ya está resuelta y probada.
- **Lo que lee la plantilla desde Hoy**, que esta feature **alimenta y no
  reescribe**: `utils/vida-build-day.utils.ts` (`buildDayFromTemplate`),
  `hooks/useBuildDayFromTemplate.ts`, `useBuildWeekFromTemplate.ts`,
  `components/VidaTemplateAside/`.
- De `shared/ui`: `SteppedModal`, `ConfirmDialog`, `Popover`, `Alert`, `Toast`,
  `Switch`, `Button`, `Card`, `Badge`, `Skeleton`, `AppIcon`, `PageHeader`.

**Hipótesis marcadas, técnicas, para que el arquitecto las confirme o las tire**
(no son del usuario y no las tomo yo):

- **El API admite dos `VidaItem` de la misma actividad — comprobado, no
  supuesto.** `migrations/058_vida_items.sql` del repo hermano crea índices por
  `user_id`, `(user_id, is_active)` y `activity_id`, y el **único índice único es
  el de `client_id`**; `vida.service.ts` inserta sin `ON CONFLICT`. Así que el
  criterio 34 cabe **sin tocar el API**. Lo que **nadie ha probado contra el
  servidor** es el camino entero: la tajada 3 es donde se ve.
- **`planVidaItemSave` no sirve tal cual** para la tajada 3: con un ítem ya
  existente devuelve `update`, y aquí hace falta poder pedir **create** con la
  actividad ya usada. Probablemente sea un parámetro más («ítem objetivo» en vez
  de «ítem de la actividad»), y su test puro es el sitio donde se sostiene.
- **`vidaItemDelete` existe y no lo usa nadie**: FEAT-002 decidió que apagar el
  interruptor **no borra** (criterio 20 de aquel dossier). «Quitar de la
  plantilla» (criterio 21) es su **primer uso**, y no contradice aquello: son dos
  gestos distintos, y el render lo dice («Desactivar ≠ quitar»).
- **La semana entera cabe en una consulta**: `vidaItems(includeInactive: true)`
  trae todos los ítems con sus días; las pestañas, la cuadrícula y las cuentas
  se derivan en cliente. No hace falta una consulta por día ni una clave nueva.
- **La escala de la cuadrícula** sale de `useVidaDayHours` (6:30 → 23:00). Un
  ítem con hora **fuera** de esa franja tiene que verse igual: es un borde real
  (Hoy ya tuvo el suyo) y conviene decidirlo al planificar, no al construir.
- **Los puntos de partida necesitan hora y duración**, que hoy no están en
  `data/vida-starting-points.ts`: es dato nuevo en un archivo que ya existe, no
  un mecanismo nuevo.
- **Invalidación:** todo lo que se escriba aquí tiene que dejar al día las claves
  que Hoy ya usa (`vidaKeys` de plantilla y sugerencias). `invalidate-vida-queries.ts`
  es el sitio; que el criterio 27 se cumpla sin recargar depende de esto.

**Decisions that aren't mine:** *(las seis preguntas del render, **resueltas por
el analista** con lo que el render enseña, que es lo que el usuario aprobó. Ninguna
cambia el modelo de datos, el alcance ni toca otro repositorio, así que **ninguna
bloquea**. Se listan para que se puedan revertir en una línea si al verlas en
Vercel el usuario prefiere otra cosa.)*

- **(a) En móvil, ¿pestañas de día o una lista de los siete? — resuelta:
  pestañas**, como el marco A. Es lo que hace que el día tipo se lea **igual que
  Hoy** (misma escalera de horas, mismas tarjetas), que es la razón entera de la
  pantalla. La semana entera sigue alcanzable (criterio 48).
- **(b) ¿Se queda el interruptor activa/desactivada? — resuelta: se queda.** El
  catálogo ya lo tiene desde FEAT-002 y quitarlo sería **quitar algo construido**;
  además hace falta para que «desactivar ≠ quitar» (criterios 8, 19, 26) tenga
  sentido: quitarle los días no es posible —el API exige al menos uno— así que
  sin interruptor la única salida sería borrar.
- **(c) La misma actividad dos veces al día — resuelta: dos ítems a dos horas, y
  el API lo permite.** Verificado en el repo hermano (ver la primera hipótesis).
  **Lo que no se puede** queda escrito: el catálogo sigue siendo «una actividad,
  un ítem» en su tarjeta y su hoja, y por eso el criterio 35 obliga a que **lo
  diga** en vez de enseñar una hora como si fuera la única. Arreglar el catálogo
  entero para que liste varias horas **no entra**: sería reabrir FEAT-002.
- **(d) ¿«Copiar un día a otros»? — resuelta: entra**, en la tajada 4. Es el
  sustituto del arrastre que el propio render propone y lo único que hace
  «armar la semana» algo más que repetir el mismo gesto siete veces. **Mi lectura
  del render, dicha por si no es la suya:** no se copia lo que ya está en el día
  destino **a cualquier hora** (no solo a la misma), porque copiar el paseo de
  las 7:30 sobre un sábado que ya pasea a las 8:30 dejaría dos paseos que nadie
  pidió. Nada se borra en ninguna de las dos lecturas.
- **(e) ¿Las notas por ítem? — resuelta: se quedan.** Ya existen en la hoja
  (FEAT-002) y en el modelo; quitarlas sería trabajo para tener menos.
- **(f) ¿Se avisa de los solapes aquí? — resuelta: no se bloquean ni se avisan
  en rojo.** Se **ven** (criterio 47) y el panel de añadir **dice** lo que hay a
  esa hora sin impedir nada (criterio 33). Quien los resuelve es «Armar» en Hoy,
  que corre detrás lo que se pisa — es la decisión 5 de las notas del render y no
  se reabre.

**Lo que sí habría que preguntar si algún día se reabre** (y hoy **no** bloquea
nada, porque la feature entera funciona sin ello): si el usuario acaba usando
dos y tres horas por actividad, la tarjeta del catálogo se queda corta y
FEAT-002 tendría que enseñar varias. Se anota aquí y no se construye.

---

*Escrito por `feature-analyst` el 2026-09-20. Fuentes:
`docs/vida/assets/06-vida-plantilla.html` (**render aprobado por el usuario ese
día**: marcos A, B, C y D y sus seis notas al pie, incluidas «Lo que esta
pantalla decide» y «Para saber si estamos alineados»), `docs/vida/PLAN.md` (F4 y
las decisiones 3, 5, 12 y 13), `docs/features/PROTOCOL.md`,
`docs/features/ENVIRONMENT.md`, las secciones 1 de `FEAT-002`, `FEAT-003` y
`FEAT-004`, el código de `src/features/vida/` (`VidaActivitySheet`,
`useSaveVidaItemForActivity`, `vida-catalog.utils.ts`, `vida-items.graphql.ts`,
el SDL vendorizado y `routes/vida.routes.tsx`) y, para la pregunta (c) del
render, el repo hermano `~/Developer/xavi-platform-node`
(`migrations/058_vida_items.sql`, `066_vida_items_schedule.sql` y
`src/services/vida.service.ts`). **Sin `Bash`, no se pudo correr `graphify`**: la
exploración fue con `Grep`/`Glob` y lectura por rangos.*

## 2. The plan — feature-architect

**Summary for the builder:** la implementación de referencia es
**`src/features/vida/pages/VidaSemanaPage.tsx`** (FEAT-003, tajada 5): es la
única pantalla del repo que ya vive de **una sola consulta de plantilla para
los siete días** (`useVidaItemsQuery` + `useVidaDayHours` + `templateItemsForDate`)
con sus estados y su lote. El código nuevo entra casi todo en
`src/features/vida/pages/VidaPlantillaPage.tsx` (hoy un cascarón de 6 líneas),
en un util puro nuevo `src/features/vida/utils/vida-template.utils.ts` y en
cinco componentes nuevos bajo `src/features/vida/components/`. **No se escribe
una segunda hoja de ítem** (`VidaActivitySheet` se extiende con props
aditivas), **no se escribe un segundo buscador de actividades**
(`filterActivitiesBySearch` + `groupActivitiesByCategory`), **no se escribe un
segundo orquestador de lotes** (`useBuildWeekFromTemplate` es el molde) y **no
se toca el API**.

### Lo que ya existe (y dónde)

Confirmado abriendo los archivos, no solo con el grafo.

**La hoja del ítem — existe entera y es el marco B.**
`src/features/vida/components/VidaActivitySheet/VidaActivitySheet.tsx:86`
(props en `:34`): días L…D, «a qué hora» (`input type="time"`),
`VidaDurationPills` (15 · 30 · 45 · 1h · libre, en
`src/features/vida/components/VidaDurationPills/VidaDurationPills.tsx:36`),
nota, interruptor `Switch` y `SteppedModal` con `mobileSheet`. Derivada de las
props sin `useEffect`, montada con una `key` por apertura, y el cierre en el
`onSuccess` local del `mutate` (si la mutación falla, la hoja no se cierra ni
pierde lo escrito — criterio 24 sale gratis de ahí).

**El guardado de un ítem — existe y no necesita lógica nueva, solo contrato
nuevo.** `planVidaItemSave`
(`src/features/vida/hooks/useSaveVidaItemForActivity.ts:87`) ya devuelve
`create` cuando `item` es `null` y `update` cuando llega un ítem. El aviso del
analista («hoy convierte en `update` lo que la tajada 3 necesita que sea
`create`») es cierto **del llamador, no de la función**: quien llama hoy
resuelve `item` con `findVidaItemForActivity`, que siempre encuentra el ítem de
esa actividad. Con el parámetro entendido como «**el ítem sobre el que se
escribe**» en vez de «el ítem de esta actividad», las dos tajadas caben sin
tocar el cuerpo. Ver decisión **A3**.

**El borrado — existe y nunca se ha llamado.**
`useDeleteVidaItemMutation` (`src/features/vida/hooks/useVidaItems.ts:95`),
`VIDA_ITEM_DELETE_MUTATION` (`src/features/vida/graphql/vida-items.graphql.ts:91`),
`deleteVidaItem` (`src/features/vida/api/vida-items.api.ts:93`) y su entrada en
la lista de `graphql/contracts.test.ts:96`. **El documento ya está en el test de
contratos**, así que la tajada 2 no añade ninguno. Lo único que le falta es
`onError`: el hook lo omite a propósito («nadie la llama», JSDoc en `:25`).

**La aritmética del día — existe, pero sobre el plan del día, no sobre la
plantilla.** `src/features/vida/utils/vida-agenda.utils.ts`: `AgendaBlock`
(`:36`, con el truco de `trackMinutes` que hace que los anchos sumen 100 %
aunque dos bloques se pisen), `buildDayAgenda` (`:152`, estira la ventana si
algo cae fuera del horario), `getDayBudget` (`:304`), `findLargestGap` (`:339`),
`buildGuidanceLine` (`:371`). **Todo eso entra por `ActivityDayPlanItem`**, que
tiene `startTime` y `endTime` obligatorios; un `VidaItem` los tiene los dos
opcionales. Ver **A1**.

**La barra del día y su lectura:**
`src/features/vida/components/VidaDayBudget/VidaDayBudget.tsx` — el molde de
«la aritmética vive en el util, aquí solo se traducen minutos a `width`, la
barra es `aria-hidden` y la leyenda escribe los minutos como texto real».

**La tarjeta de un bloque:**
`src/features/vida/components/VidaAgendaBlock/VidaAgendaBlock.tsx` — icono y
color salen de `item.activity.category`, **sin consulta extra ni cruce por
`Map`**, y todas las acciones entran por **props opcionales** («todo esto es
aditivo», `:38-62`). Es el patrón que la tajada 2 repite sobre la tarjeta nueva.

**La plantilla como dato:** `useVidaItemsQuery(includeInactive)`
(`src/features/vida/hooks/useVidaItems.ts:36`), `VIDA_ITEMS_QUERY`
(`graphql/vida-items.graphql.ts:44`) que **ya selecciona
`activity { id title description status category { id name color icon } }`**
(`:21-33`), `templateItemsForDate` y `usableTemplateItems`
(`utils/vida-build-day.utils.ts:78` y `:63`), e `invalidateVidaItemQueries`
(`utils/invalidate-vida-queries.ts:77`), que invalida `vidaKeys.items.all()` —
prefijo de `suggestions(*)` y `takenToday(*)`, así que **el criterio 27 sale de
usar los hooks de mutación que ya existen**, sin invalidación nueva.

**El horario del día:** `hooks/useVidaDayHours.ts:46`, con `isDefault`,
`isPending`, `isDisabled` y `refetch` ya distinguidos.

**El tiempo y los días:** `utils/vida-time.utils.ts`
(`parseTimeToMinutes:41`, `minutesToTime:49`, `calculateEndTime:79`,
`formatDurationFromMinutes:84`, `formatDurationMinutes:98`,
`formatTimeForDisplay:110`, `normalizeTimeForDisplay:25`, `DURATION_PILLS:116`,
`DEFAULT_BLOCK_MINUTES:119`) y `utils/vida-date.utils.ts`
(`VIDA_DAY_ORDER:57`, `VIDA_DAY_SHORT_LABELS:68`, `VIDA_DAY_LABELS:79`,
`getVidaDayOfWeek:108`, `pluralDayLabel:123`, `formatDayHeading:128`).

**El catálogo y su búsqueda:** `filterActivitiesBySearch`
(`utils/activity-filters.ts:44`, sin tildes), `excludeArchivedActivities`
(`utils/vida-catalog.utils.ts:44`), `groupActivitiesByCategory` (`:87`),
`CATALOG_LIMIT` (`:18`), `VidaCatalogGroup`, y el patrón de montar la hoja con
`key` por apertura en `pages/VidaActividadesPage.tsx:44-60`.

**Los lotes con fallo parcial — hay dos precedentes y el plan manda imitarlos:**
`hooks/useCreateStartingActivities.ts:100` (orquesta sobre `api/`, un solo
toast, una sola invalidación, **resuelve** `{created, failed}` en vez de lanzar)
y `hooks/useBuildWeekFromTemplate.ts:59` (lo mismo, en serie, con `{done,
failed, empty}` y los fallos **por su nombre**).

**Los puntos de partida:** `data/vida-starting-points.ts:54`
(`VIDA_STARTING_POINTS`, `getRecommendedStartingPointIds:117`,
`findStartingCategory:121`), `components/VidaStartingPoints/VidaStartingPoints.tsx:20`
(sin props, con su propio estado de selección y su reintento de lo que falló).

**Pestañas con teclado — existen y nadie en Vida las usa:**
`src/shared/ui/Tabs/Tabs.tsx` (`role="tablist"`, flechas ←/→, roving
`tabIndex`, `aria-selected`, panel enlazado por `aria-controls`), hoy usado solo
por `src/features/habits/pages/HabitDetailPage.tsx`. El criterio 2 («se puede
cambiar con el teclado») se cierra usándolo, no escribiéndolo.

**La ruta ya está cableada:** `routes/vida.routes.tsx:47-50` y
`routes/vida-paths.ts:4`. No se toca `app-nav.config.ts`.

### Lo que NO existe — dicho explícitamente

- **La cuadrícula semanal por horas no tiene hermana en el repo.** Confirmado:
  no hay ningún componente con posicionamiento absoluto por hora ni rail de
  horas. `VidaSemanaPage` es **una línea por día**; la agenda de Hoy es una
  **lista vertical** (`buildDayAgenda` intercala bloques y huecos en orden de
  reloj, no los posiciona). El marco C es pieza nueva.
- **No existe ninguna vista que pinte `VidaItem` en forma de agenda.** Lo más
  cerca es `components/VidaTemplateAside/VidaTemplateAside.tsx`, que los lista
  como fichas para colocarlos en un hueco de Hoy. No es lo mismo y no se
  reutiliza.
- **No existe ninguna pantalla que edite un `VidaItem` por su id.** Las dos que
  lo escriben (la hoja del catálogo y el interruptor de la tarjeta) lo resuelven
  siempre **desde la actividad**.
- **No existe deduplicación de actividades por nombre.**
  `useCreateStartingActivities` deduplica **categorías** por nombre normalizado
  (`resolveCategoryIds`, `:60-98`) pero **crea las actividades sin mirar el
  catálogo** (`:122-133`). El criterio 37 pide lo contrario. Es trabajo nuevo,
  pequeño, y el mecanismo (`normalizeVidaText`) ya está al lado.
- **Nada está construido dos veces** en lo que toca esta feature. El único
  parecido cercano que encontré y que conviene no perder de vista: la barra del
  día vive en `VidaDayBudget` y la tajada 1 pinta otra barra parecida — ver
  **A2**, donde se decide por qué no se reutiliza y qué se comparte igualmente.

### Hipótesis del analista: confirmadas, corregidas o pendientes

| # | Hipótesis (sección 1) | Veredicto |
|---|---|---|
| 1 | El API admite dos `VidaItem` de la misma actividad | **Confirmada en el código de este repo**: nada en `api/`, `graphql/` ni `types/` asume unicidad por actividad; `buildVidaItemsByActivity` (`utils/vida-catalog.utils.ts:49`) **elige uno** cuando hay varios, lo que prueba que el caso ya estaba previsto. **Contra el servidor vivo sigue sin probarse** y desde aquí no se puede (todo `/app/*` está tras el login). La tajada 3 es donde se ve. |
| 2 | `planVidaItemSave` no sirve tal cual | **Corregida**: sí sirve; lo que no sirve es el **contrato** del parámetro `item`. Ver **A3**. No hace falta lógica nueva ni un `mode`. |
| 3 | `vidaItemDelete` existe y no lo usa nadie | **Confirmada**, con su documento ya en el test de contratos. Le falta `onError`. |
| 4 | La semana entera cabe en una consulta | **Confirmada**: `VidaSemanaPage.tsx:97` ya lo hace para siete días; aquí se pide con `includeInactive: true` (criterio 8). |
| 5 | La escala sale de `useVidaDayHours`; un ítem fuera de la franja es un borde real | **Confirmada y resuelta**: `buildDayAgenda` ya estira la ventana en ese caso (`vida-agenda.utils.ts:120-129`) y el util nuevo copia esa regla. Decisión escrita en **A5**. |
| 6 | Los puntos de partida necesitan hora y duración | **Confirmada**: `VidaStartingPoint` (`data/vida-starting-points.ts:24-37`) no tiene ninguno de los dos campos. |
| 7 | La invalidación se sostiene en `invalidate-vida-queries.ts` | **Confirmada y ya resuelta**: `invalidateVidaItemQueries` invalida por prefijo `items.all()`. **No se escribe invalidación nueva en ninguna tajada.** |

**Una hipótesis que el analista no marcó y que sí importa:**
`VidaItem.activity` es un `ActivityFollowUpActivityRef`
(`types/activity-followup.types.ts:3`), **no un `Activity`**: trae `id`,
`title`, `description`, `status` y `category`, y **no trae `categoryId`**, que
es justo lo que `VidaActivitySheet` lee en `:106`. Abrir la hoja desde la
plantilla con lo que trae el ítem **no compila** tal cual. Se resuelve en
**A4**, sin consultas nuevas.

### Implementación de referencia

**`src/features/vida/pages/VidaSemanaPage.tsx`** (421 líneas, FEAT-003 tajada 5,
entregada y en uso).

Por qué esa y no otra:

- Es la **única** pantalla que ya vive de la misma pareja de consultas que
  necesita esta feature: `useVidaItemsQuery()` + `useVidaDayHours()`, y deriva
  los siete días en cliente con `templateItemsForDate` (`:97-100`, `:107-120`).
- Ya resuelve los tres estados que los criterios 12 y 54 piden **distinguidos y
  no confundidos**: `isDisabled` (sin sesión) ≠ `isPending` (cargando) ≠
  `isError` (y su comentario de `:112-118` explica por qué un día que falló no
  es un día vacío: exactamente el criterio 12).
- Ya usa el precedente de lote con fallo parcial (`useBuildWeekFromTemplate`) y
  `useConfirmDialog`, que es lo que la tajada 4 repite.
- Y **no está siendo tocada** por el constructor de FEAT-004, que trabaja sobre
  `VidaHoyPage`, `VidaAgendaBlock`, `VidaDayBudget`, `vida-execution.utils`,
  `VidaBlockOutcomes` y `VidaAgendaNoData`. `VidaHoyPage` sería la otra
  candidata por forma, pero copiar de un archivo que va a cambiar bajo los pies
  es cómo se heredan conflictos.

Referencias secundarias, por si hace falta abrir una sola cosa:

| Para | Abrir |
|---|---|
| El util puro (forma, tipos, comentarios que explican el porqué) | `src/features/vida/utils/vida-agenda.utils.ts` |
| La tarjeta con acciones aditivas | `src/features/vida/components/VidaAgendaBlock/VidaAgendaBlock.tsx` |
| La barra que no es el único modo de leer el dato | `src/features/vida/components/VidaDayBudget/VidaDayBudget.tsx` |
| La hoja montada con `key` por apertura | `src/features/vida/pages/VidaActividadesPage.tsx:44-60` |
| El lote con fallo parcial | `src/features/vida/hooks/useBuildWeekFromTemplate.ts` |
| Las pestañas con teclado | `src/shared/ui/Tabs/Tabs.tsx` + `src/features/habits/pages/HabitDetailPage.tsx` |

### Decisiones de arquitectura

**A1 · La aritmética de la plantilla va en un util nuevo, `vida-template.utils.ts`,
y NO se generaliza `buildDayAgenda`.**
`AgendaBlock.item` es un `ActivityDayPlanItem` con `startTime`/`endTime`
**obligatorios**; el `VidaItem` los tiene opcionales y además la plantilla tiene
un concepto que el plan no tiene (el cajón «sin hora») y le falta uno que el
plan sí tiene (el «ahora»). Generalizar `buildDayAgenda` obligaría a tocar
`vida-agenda.utils.ts`, `VidaAgendaBlock` y `VidaDayBudget` —dos de los tres
están abiertos ahora mismo por el constructor de FEAT-004— para que la
plantilla pinte algo que no necesita la mitad de lo que hay dentro. **Lo que sí
se copia es la técnica, y se dice de dónde sale en el comentario**: el
`trackMinutes` que hace que los anchos sumen 100 % con solapes
(`vida-agenda.utils.ts:41-52`) y el estirado de ventana (`:120-129`).
*Lo que se descarta:* adaptar `VidaItem` a un `ActivityDayPlanItem` falso para
poder llamar a `buildDayAgenda`. Daría bloques con `date: ''` y `id` inventado,
y arrastraría a `VidaAgendaBlock`, que pinta «Empezar», «···» y plan-vs-real:
cosas que en una plantilla no existen.

**A2 · La barra del resumen es un componente nuevo, no `VidaDayBudget`.**
`VidaDayBudget` está atado a `DayAgenda` + `DayBudget` + `ExecutedBudget`, dice
«te quedan 3h 40 **hasta las 23:00**» y lleva el reloj de «ahora»: en una
plantilla no hay ni ahora ni tiempo restante, hay «puestas de». Además es uno de
los archivos que FEAT-004 tiene abiertos. **La duplicación queda acotada al
JSX**: la aritmética (minutos puestos, minutos del día, tramos con
`trackMinutes`, porcentajes) vive una sola vez en `vida-template.utils.ts`, y el
componente nuevo hereda las dos reglas de `VidaDayBudget`: la barra es
`aria-hidden` y **la leyenda escribe los minutos como texto real**.

**A3 · `planVidaItemSave` cambia de contrato, no de lógica.** El parámetro `item`
pasa a significar **«el ítem sobre el que se escribe»** —se renombra a
`targetItem` y se reescribe su JSDoc— en vez de «el ítem de esta actividad».
Con eso:
- el catálogo sigue pasando lo que encuentra `findVidaItemForActivity` → se
  comporta **exactamente igual** (criterios 17/19/20 de FEAT-002 intactos);
- la plantilla pasa **el ítem que se está editando, por su id** → `update` sobre
  ese y no sobre el de las 7:30 (criterio 17);
- «añadir otra hora» pasa `targetItem: null` con el `activityId` de una
  actividad que ya tiene ítem → `create` (criterio 34).
El cuerpo de la función no cambia. Lo que cambia es el test: se añaden los dos
casos nuevos en `useSaveVidaItemForActivity.test.tsx`, que es donde esto se
sostiene.
*Lo que se descarta:* un `mode: 'create' | 'update'`. Sería un segundo
interruptor para decir lo que el propio parámetro ya dice, y dos fuentes de
verdad sobre la misma decisión.

**A4 · La hoja abierta desde la plantilla NO pide la actividad entera.** Se le
añade una prop aditiva `activityRef?: ActivityFollowUpActivityRef | null` (lo
que ya viaja dentro del `VidaItem`) y `lockActivity?: boolean`. Con
`lockActivity`, la hoja **pinta la cabecera** (nombre, icono y color de la
categoría — criterio 18: «los enseña y no los pide»), **no monta los campos de
nombre y categoría** y **se salta el primer paso del guardado** (la mutación de
actividad), así que nunca lee `activity.categoryId`, que es el campo que el ítem
no trae. Cero consultas nuevas, cero cambios en el documento GraphQL, cero
cambios en `contracts.test.ts`.
*Lo que se descarta:* (a) añadir `categoryId` a `VIDA_ITEM_ACTIVITY_FIELDS` —
tocaría el documento, el SDL vendorizado y el test de contratos para un dato que
con `lockActivity` nadie mira; (b) cruzar `activityId → Activity` con
`useActivitiesQuery` **solo para la hoja** — traería una dependencia de
`CATALOG_LIMIT: 200` a una pantalla que no la necesita hasta la tajada 3.

**A5 · La escala del día y lo que cae fuera.** `useVidaDayHours` da la ventana
(6:30 → 23:00 por defecto). Un ítem con hora fuera de esa franja **estira la
ventana**, exactamente como hace `buildDayAgenda` (`:120-129`): un bloque que no
se pinta es un bloque perdido y además la barra dejaría de sumar. En la
cuadrícula (tajada 4) la ventana estirada es la de **la semana entera**, una
sola para las siete columnas, o las columnas no serían comparables.

**A6 · El día elegido vive en el estado local, no en la URL.** Un día de
plantilla es un **día de la semana**, no una fecha: meterlo en `?d=` crearía un
segundo vocabulario de URL al lado del `?d=YYYY-MM-DD` de Hoy y de Semana, y
`vida-paths.ts` dejaría de tener un solo significado para ese parámetro. Se
arranca en `getVidaDayOfWeek(getCurrentLocalDate())` (criterio 2). *Coste de
revertir:* una línea en `vida-paths.ts` y un `useSearchParams`, si al verlo en
Vercel el usuario echa de menos el «atrás».

**A7 · «Copiar este día a otros» NO crea ítems: añade días al ítem que ya
existe.** Es lo único que hace verdad al criterio 51 («un día copiado **comparte
el mismo ítem**, así que cambiarle la hora cambia los dos días»), y es también
lo que hace que el criterio 22 («quitarlo solo del viernes») sea su salida
natural. Así que copiar es **un `vidaItemUpdate` por ítem** con
`days: [...los suyos, ...los destinos que le falten]`, no un `vidaItemCreate`
por día. Regla de omisión (criterio 50): un ítem **no se toca** si en el día
destino ya hay **otro** ítem de la misma actividad, a cualquier hora; los
desactivados no se copian (criterio 52); nada se borra nunca. La decisión de
qué se copia y qué se omite es **pura** (`planCopyDay`), y el orquestador imita
`useBuildWeekFromTemplate` línea por línea: en serie, sobre `api/`, un solo
toast, una sola invalidación al final, y **resuelve** `{done, skipped, failed}`
en vez de lanzar.

**A8 · Los ítems de actividades archivadas no se pintan.**
`usableTemplateItems` ya los excluye de «Armar», así que pintarlos en la
plantilla sería enseñar algo que Hoy nunca va a ofrecer. Se excluyen del
recuento de las pestañas y del resumen, **pero no se excluyen los
desactivados**, que sí se pintan (criterio 8). El filtro de la plantilla es por
tanto **el de `usableTemplateItems` menos la regla de `isActive`**: se escribe
una vez en `vida-template.utils.ts` y se dice por qué.

### Dónde va el código nuevo, archivo por archivo

#### Tajada 1 — la plantilla se ve (criterios 1–15)

**Se crea:**

- `src/features/vida/utils/vida-template.utils.ts` — **todo lo puro de la
  feature**, y crece con cada tajada. En la 1:
  - `templateItemsForDay(items, day)` — los ítems de ese día de la semana,
    **incluidos los desactivados**, sin los de actividades archivadas (A8).
  - `buildTemplateDay({ items, day, dayStart, dayEnd })` → `{ timed, untimed,
    plannedMinutes, dayMinutes, windowStart, windowEnd, segments }`. `timed`
    ordenado por hora ascendente y, a igual hora, **por nombre** (así lo dice el
    alcance de la sección 1). `segments` lleva `trackMinutes` (A1) para el
    criterio 4.
  - `buildTemplateGuidance(day)` → la frase del criterio 5, compuesta con
    reglas, imitando `buildGuidanceLine` y `findLargestGap`. **Si no hay un
    hueco que nombrar, la frase se queda sin esa mitad**: no se afirma uno.
  - `countTemplateByDay(items)` → `Record<VidaDayOfWeek, { count, minutes,
    untimedCount, hasAny }>`, que alimenta las pestañas (criterios 2 y 3) y, en
    la tajada 4, el total de la semana (criterio 46).
  - `describeItemMeta(item)` → «45 min · L M X J V» y **«sin duración»**
    (criterio 7), sobre `formatDurationFromMinutes` y `VIDA_DAY_SHORT_LABELS`.
- `src/features/vida/utils/vida-template.utils.test.ts` — el sitio donde se
  sostienen los criterios 4, 5, 6 y 7 sin montar React.
- `src/features/vida/components/VidaTemplateDayTabs/` (`.tsx`, `.module.scss`,
  `index.ts`) — envuelve `@/shared/ui/Tabs`; cada pestaña lleva la letra, la
  cuenta y el punto rayado/apagado (criterios 2 y 3). El punto es decorativo y
  lo que se oye va en el `aria-label`, **como en `VidaDayStrip.tsx:60-68`**.
- `src/features/vida/components/VidaTemplateDaySummary/` — título «Viernes · 3h
  40 puestas de 16h 30», la barra (`aria-hidden`, anchos desde `segments`), la
  leyenda en texto real y la frase de guía (criterios 4 y 5). Molde:
  `VidaDayBudget.tsx`.
- `src/features/vida/components/VidaTemplateItemCard/` — la tarjeta: hora a la
  izquierda, icono y color desde `item.activity.category` (**sin consulta
  extra**, como `VidaAgendaBlock`), nombre, meta, trazo suave y etiqueta
  «desactivada · no sale en Hoy» cuando `!isActive` (criterio 8). **Todas las
  acciones entran como props opcionales y en la tajada 1 no se pasa ninguna**
  (criterio 8: «en la 1 no se pinta un botón muerto»).
- `src/features/vida/components/VidaTemplateNoTimeDrawer/` — el cajón «Sin
  hora» con su cuenta y la explicación literal del criterio 9.
- `src/features/vida/pages/VidaPlantillaPage.module.scss`
- `src/features/vida/pages/VidaPlantillaPage.test.tsx`

**Se modifica:**

- `src/features/vida/pages/VidaPlantillaPage.tsx` — **se reescribe entero**
  (hoy son 6 líneas de cascarón). `useVidaItemsQuery(true)` + `useVidaDayHours()`
  + `useActivitiesQuery({ page: 1, limit: CATALOG_LIMIT })` (esta última **solo
  para la cuenta del vacío**, criterio 10: «11 en tu catálogo · 3 ya con días
  puestos»). Estados calcados de `VidaSemanaPage.tsx:102-106`: `isDisabled` /
  `isPending` / `isError` distinguidos, `Skeleton` con la forma de las tarjetas
  y `Reintentar` con `refetch` (criterio 12). El vacío de la plantilla entera
  (criterio 10) lleva de salida un `Button` a `vidaPaths.actividades`; **la
  tajada 3 lo sustituye por el panel** y los seis puntos de partida.

**No se toca:** `routes/vida.routes.tsx`, `vida-paths.ts`,
`app-nav.config.ts`, `graphql/`, `api/`, `types/`.

#### Tajada 2 — la hoja del ítem (criterios 16–28)

**Se modifica:**

- `src/features/vida/hooks/useSaveVidaItemForActivity.ts` — `item` → `targetItem`
  y JSDoc nuevo (A3). **Sin cambios en el cuerpo.** Actualizar el único llamador
  vivo, `VidaActivitySheet.tsx`.
- `src/features/vida/hooks/useSaveVidaItemForActivity.test.tsx` — dos casos
  nuevos: (a) con dos ítems de la misma actividad, pasar el de las 19:00
  devuelve `update` con **ese** id; (b) `targetItem: null` con un `activityId`
  que ya tiene ítem devuelve `create`.
- `src/features/vida/components/VidaActivitySheet/VidaActivitySheet.tsx` —
  props **aditivas**, con el mismo comentario de frontera que
  `VidaAgendaBlock.tsx:38-45` («sin ninguna de estas props la hoja se pinta
  exactamente como la dejó FEAT-002»):
  `activityRef`, `lockActivity` (A4), `onRemoveFromTemplate?: (item: VidaItem)
  => void` (pinta «Quitar de la plantilla», criterio 21) y
  `multipleItemsNote?: string | null` (criterio 35). La **vista previa** del
  criterio 20 se pinta dentro, con `describeTemplatePreview` (util puro nuevo,
  abajo). El criterio 23 usa el `daysError` que ya está en el archivo.
- `src/features/vida/components/VidaActivitySheet/VidaActivitySheet.test.tsx`
- `src/features/vida/hooks/useVidaItems.ts:95-105` — añadir `onError` con
  `toErrorMessage` a `useDeleteVidaItemMutation` y corregir el JSDoc de `:25`,
  que dice que nadie la llama. **El toast de éxito ya dice «Quitado de tu
  plantilla»**, que es el vocabulario correcto.
- `src/features/vida/utils/vida-template.utils.ts` — se añaden:
  `describeTemplatePreview({ days, startTime, durationMinutes })` → «Así queda
  en **Hoy**: lunes, miércoles y viernes de 9:00 a 9:45», y **qué le falta**
  cuando no hay hora o no hay duración (criterio 20, sobre `calculateEndTime`);
  `describeOtherDays(item, day)` → «también está los lunes y los miércoles»
  (criterio 22); `daysWithout(item, day)` → los días que quedan al quitar uno.
- `src/features/vida/components/VidaTemplateItemCard/` — se le pasan ahora las
  props de acción: abrir la hoja, «Ponerle hora» (criterio 25) y «Activar»
  (criterio 26, un `vidaItemUpdate` con `isActive: true`, **sin abrir la hoja**).
- `src/features/vida/pages/VidaPlantillaPage.tsx` — monta `VidaActivitySheet`
  con `key` por apertura (copiar `VidaActividadesPage.tsx:44-60`), guarda el
  ítem abierto en estado y cablea el borrado.

**Se crea:**

- `src/features/vida/components/VidaTemplateRemoveDialog/` — la confirmación del
  criterio 22, que tiene **dos salidas afirmativas** («Quitarlo solo del
  viernes» = `vidaItemUpdate` con un día menos; «Quitarlo de los tres días» =
  `vidaItemDelete`) más «Volver». **Comprobar primero si `useConfirmDialog`
  (`@/shared/ui/ConfirmDialog`) admite dos acciones**: no lo verifiqué. Si solo
  admite confirmar/cancelar, este componente es un `Modal` corto; si las admite,
  este archivo no se crea y se usa el hook. Con un solo día, una sola salida y
  entonces `useConfirmDialog` basta seguro.

#### Tajada 3 — «Añadir a mi Vida» y el primer minuto (criterios 29–41)

**Se crea:**

- `src/features/vida/components/VidaTemplateAddPanel/` — el panel del marco C y,
  en móvil, el contenido de la hoja que abre el «+». **Una sola
  implementación, dos envoltorios**: en escritorio va suelto en el aside, en
  móvil dentro de `SteppedModal` con `mobileSheet` (como `VidaActivitySheet`).
  Reutiliza `filterActivitiesBySearch`, `excludeArchivedActivities` y
  `groupActivitiesByCategory`; el estado por actividad (criterio 31) sale del
  mapa nuevo de abajo; los avisos de los criterios 33 y 34 salen de
  `vida-template.utils.ts`. Guarda con `useSaveVidaItemForActivity` pasando
  `targetItem: null` (A3). Sus estados (criterio 40) se calcan de
  `VidaActividadesPage`.
- `src/features/vida/components/VidaTemplateFab/` — el «+» flotante (criterio
  29). Si sale de tres líneas, vive dentro de `VidaPlantillaPage.module.scss` y
  este archivo no existe.

**Se modifica:**

- `src/features/vida/utils/vida-catalog.utils.ts` — se añade
  `buildVidaItemsByActivityAll(items): Map<string, VidaItem[]>`. **No se toca
  `buildVidaItemsByActivity` (`:49`) ni `findVidaItemForActivity` (`:66`)**: son
  el «un ítem por actividad» del catálogo y el criterio 35 dice explícitamente
  que eso se queda como está.
- `src/features/vida/utils/vida-template.utils.ts` — `whatIsAt(dayItems,
  minutes)` (criterio 33: «a las 18:00 ya tienes *Pasear a las mascotas*», sin
  bloquear) y `describeExistingHours(items)` (criterio 34 y criterio 35: «esta
  actividad tiene **2 horas** en tu plantilla»).
- `src/features/vida/components/VidaActivitySheet/VidaActivitySheet.tsx` —
  criterio 35: cuando la actividad tiene más de un ítem, la línea de aviso con
  enlace a `vidaPaths.plantilla`. Es la prop `multipleItemsNote` de la tajada 2;
  aquí se **cablea desde el catálogo**, que es donde se ve el problema.
- `src/features/vida/pages/VidaActividadesPage.tsx` — pasa esa línea a la hoja
  usando el mapa nuevo. **Es el único cambio de esta feature en el catálogo**, y
  es el que impide que el catálogo enseñe una hora como si fuera la única.
- `src/features/vida/data/vida-starting-points.ts` — `VidaStartingPoint` gana
  `startTime?: string` y `durationMinutes?: number`, y los seis del criterio 36
  los reciben (7:00/15 · 7:30/40 · 8:30/30 · 9:00/45 · 13:00/60 · 21:30/30).
  **Dato nuevo en un archivo que ya existe, no un mecanismo nuevo.**
- `src/features/vida/data/vida-starting-points.test.ts`
- `src/features/vida/hooks/useCreateStartingActivities.ts` — tres cambios:
  (a) la entrada pasa a ser `{ points, schedule?: { days: VidaDayOfWeek[] } }`;
  (b) **reutiliza la actividad que ya exista** buscándola por
  `normalizeVidaText(title)` en el catálogo fresco, igual que ya hace con las
  categorías en `:60-98` (criterio 37 — hoy **no** lo hace, ver «lo que NO
  existe»); (c) con `schedule`, crea el `VidaItem` de cada punto con sus días,
  su hora y su duración, y lo cuenta en `failed` si esa parte falla (criterio
  38). Se añade `invalidateVidaItemQueries` a su `onSuccess`.
- `src/features/vida/hooks/useCreateStartingActivities.test.tsx`
- `src/features/vida/components/VidaStartingPoints/VidaStartingPoints.tsx` — prop
  `schedule?: { defaultDays }`: con ella pinta el selector de días, el contador
  «3 elegidas · de lunes a viernes», el botón **«Ponerlas en mi plantilla»** y la
  línea «Horas de partida · las ajustas en un toque después». **Sin ella se
  comporta exactamente como hoy** en el catálogo (es su único otro llamador,
  `VidaActividadesPage`).
- `src/features/vida/pages/VidaPlantillaPage.tsx` — el aside en escritorio, el
  «+» en móvil, y el vacío total pasa a montar `VidaStartingPoints` con
  `schedule` (criterio 36) en vez del botón de la tajada 1.

**Ojo con el efecto de rebote de (b):** deduplicar actividades por nombre
**también cambia el primer minuto del catálogo** (FEAT-002). Es a mejor —crear
dos «Bañarme» nunca fue lo querido— pero es un cambio en algo entregado y va
dicho en el reporte de la tajada, con su caso en el test.

#### Tajada 4 — la semana entera y copiar un día (criterios 42–54)

**Se crea:**

- `src/features/vida/components/VidaWeekGrid/` — la pieza nueva sin hermana: el
  rail de horas y las siete columnas, cada bloque en `top`/`height` **en
  porcentaje** sobre la ventana común (A5), con `data-` para el día de hoy
  (criterio 43) y trazo punteado para las desactivadas (criterio 45). Los
  «sin hora» de cada día van **debajo de su columna** como píldoras punteadas
  (criterio 44). **Toda la geometría llega calculada desde el util**: aquí solo
  se traducen números a estilos, como en `VidaDayBudget`. La cuadrícula es
  `aria-hidden` y debajo va la lectura en texto —o cada bloque es un botón con
  `aria-label` completo—: **un lienzo no se lee**, y esa es la regla que el
  repositorio ya aplica en `ChartPanel` y en la barra de Hoy.
- `src/features/vida/components/VidaTemplateCopyDay/` — el diálogo del criterio
  49, con «Copiar a 3 días» y «Volver».
- `src/features/vida/hooks/useCopyTemplateDay.ts` — el lote (A7). **Molde
  literal: `useBuildWeekFromTemplate.ts:59-95`.**
- `src/features/vida/hooks/useCopyTemplateDay.test.tsx`

**Se modifica:**

- `src/features/vida/utils/vida-template.utils.ts` — `buildTemplateWeekGrid({
  items, dayStart, dayEnd })` (las siete columnas, la ventana común, los
  **carriles** para que dos que se pisan se vean los dos — criterio 47),
  `buildWeekTotals(items, dayHours)` (criterio 46) y **`planCopyDay(items,
  fromDay, toDays)`** → `{ updates: VidaItemUpdateInput[], skipped: {title,
  day}[] }` (criterios 50 y 52). Los tres, puros y con test.
- `src/features/vida/pages/VidaPlantillaPage.tsx` — la cuadrícula en
  escritorio, «Ver la semana entera» en móvil **sin cambiar de ruta** (criterio
  48: un estado más de la misma página, no una ruta; `vida-paths.ts` no se
  toca), y el botón de copiar.

### Lo que NO se crea

- **Una segunda hoja de ítem.** `VidaActivitySheet` se extiende (A4). El render
  dice que es la misma y el criterio 16 lo exige.
- **Una segunda forma de guardar un ítem.** `useSaveVidaItemForActivity` +
  `planVidaItemSave` (A3).
- **Un documento GraphQL, un tipo, un `api/` o una clave de caché.** Todo lo que
  esta feature escribe ya tiene su mutación, su documento y su entrada en
  `graphql/contracts.test.ts`. **Si acabas añadiendo un documento, párate**:
  significa que algo se salió del plan.
- **Invalidación nueva.** `invalidateVidaItemQueries` ya cubre lista +
  sugerencias + tomado-hoy por prefijo (criterio 27).
- **Un quinto normalizador de texto ni un segundo buscador.**
  `filterActivitiesBySearch` y `normalizeVidaText`.
- **Un componente de pestañas.** `@/shared/ui/Tabs` ya tiene el teclado.
- **Un selector de duración.** `VidaDurationPills`.
- **Otro orquestador de lotes.** `useCreateStartingActivities` y
  `useBuildWeekFromTemplate` son los dos precedentes; la tajada 4 imita el
  segundo.
- **Nada en `localStorage`**, ninguna ruta, ninguna entrada en
  `app-nav.config.ts`, ningún `import` a pelo de
  `@fortawesome/free-solid-svg-icons` (iconos por `AppIcon`; si hiciera falta
  elegir uno, `IconPickerLazy` **desde `@/shared/ui/IconPicker`**).

### Dónde NO va

- **No va en `vida-agenda.utils.ts`** (A1) ni en `VidaDayBudget` (A2) ni en
  `VidaAgendaBlock`: son del plan del día, tienen dueño ahora mismo (FEAT-004) y
  la plantilla no necesita la mitad de lo que llevan dentro.
- **No va en `vida-build-day.utils.ts`.** Ese archivo es el volcado
  plantilla → plan y **esta feature lo alimenta, no lo reescribe**. Cambiarle
  algo cambia «Armar desde la plantilla», que está entregado.
- **No va en el API.** Ninguna de las 55 exigencias lo necesita: las dos horas
  para una misma actividad caben porque no hay unicidad por usuario+actividad, y
  copiar es `vidaItemUpdate` (A7). Si aparece algo que de verdad lo pida, **se
  para y se pregunta**; no se da por hecho.
- **No va en la URL** el día elegido (A6), ni la vista de semana como ruta nueva
  (criterio 48 dice «sin cambiar de ruta»).
- **No va en `VidaActividadesPage` la lista de varias horas por actividad.** El
  criterio 35 pide **decirlo**, no arreglarlo; arreglarlo es reabrir FEAT-002.
- **No entra `dnd-kit` ni ninguna librería.** Decisión 5 del plan de Vida.
- **No se toca `findVidaItemForActivity` ni `buildVidaItemsByActivity`**: son el
  contrato del catálogo, y romperlos es la forma exacta en que esta feature
  puede estropear FEAT-002 sin que se note.

### Tajadas, con sus archivos

Las cuatro de la sección 1 **se mantienen tal cual**: son verticales, cada una se
prueba sola en Vercel y el orden es el correcto —la 2 escribe sobre lo que la 1
pinta, la 3 necesita que editar funcione, la 4 se apoya en todo—. No hay nada
que recortar.

| # | Qué hace | Archivos | Criterios que cierra | Estado |
|---|---|---|---|---|
| 1 | **La plantilla se ve.** Pestañas de día con cuenta y punto, resumen con barra, agenda del día ordenada por hora, cajón «Sin hora», desactivados en trazo suave, y los estados. Solo lectura. | **Crea:** `utils/vida-template.utils.ts` (+`.test.ts`), `components/VidaTemplateDayTabs/`, `components/VidaTemplateDaySummary/`, `components/VidaTemplateItemCard/`, `components/VidaTemplateNoTimeDrawer/`, `pages/VidaPlantillaPage.module.scss`, `pages/VidaPlantillaPage.test.tsx`. **Modifica:** `pages/VidaPlantillaPage.tsx` (reescritura del cascarón). | 1–15 (el 10, su mitad: el texto y la salida al catálogo; los seis puntos de partida son de la 3) | **accepted** (2026-09-20) |
| 2 | **La plantilla se edita desde aquí.** La misma hoja, abierta **por ítem**: días, hora, duración, nota, interruptor, vista previa de Hoy, «Quitar de la plantilla» con la salida de un solo día, «Ponerle hora» y «Activar». | **Modifica:** `hooks/useSaveVidaItemForActivity.ts` (+ test), `components/VidaActivitySheet/VidaActivitySheet.tsx` (+ test), `hooks/useVidaItems.ts:95` (`onError`), `utils/vida-template.utils.ts`, `components/VidaTemplateItemCard/`, `pages/VidaPlantillaPage.tsx`. **Crea (si `useConfirmDialog` no admite dos salidas):** `components/VidaTemplateRemoveDialog/`. | 16–28 | **accepted** (2026-09-20; el 27 solo lo cierra el usuario, con la API) |
| 3 | **Añadir a mi Vida, y el primer minuto.** Panel de escritorio y «+» de móvil: buscar, poner días/hora/duración y guardar sin salir; segunda hora para lo que ya está; y los seis puntos de partida **con hora**. | **Crea:** `components/VidaTemplateAddPanel/`. **Modifica:** `utils/vida-catalog.utils.ts` (mapa de *varios* ítems), `utils/vida-template.utils.ts`, `data/vida-starting-points.ts` (+ test), `hooks/useCreateStartingActivities.ts` (+ test), `components/VidaStartingPoints/VidaStartingPoints.tsx`, `components/VidaActivitySheet/VidaActivitySheet.tsx` (criterio 35), `pages/VidaActividadesPage.tsx` (cablea el aviso), `pages/VidaPlantillaPage.tsx`. | 29–41 (y el 39, el criterio de la fase) | **accepted** (2026-09-20; el 39 lo cierra el usuario) |
| 4 | **La semana entera y copiar un día.** Siete columnas con cada bloque a su hora y su alto, los sin hora debajo, leyenda, total de la semana, y «Copiar este día a otros» que añade lo que falta y no pisa nada. | **Crea:** `components/VidaWeekGrid/`, `components/VidaTemplateCopyDay/`, `hooks/useCopyTemplateDay.ts` (+ test). **Modifica:** `utils/vida-template.utils.ts` (+ test), `pages/VidaPlantillaPage.tsx`. | 42–54 | pending |

El criterio **55** lo cierra el usuario, con la API despierta y la sesión
iniciada: **los agentes no entran a `/app/*`** y eso queda dicho, no disimulado.

### Cómo se verifica cada tajada

Antes de empezar y al terminar, los tres de `ENVIRONMENT.md` enteros
(`pnpm typecheck`, `pnpm lint`, `pnpm test`) y **`pnpm build` al cerrar** — no
solo `typecheck`: son el mismo `tsc -b`, pero el incremental ya dejó pasar un
`TS2783` en FEAT-003. Regla: **no peor que la línea base** (14 errores de lint,
2 fallos de test preexistentes). Después, `graphify update .`.

- **Lo puro se prueba con vitest, y es donde vive casi todo.** Los criterios 4,
  5, 6, 7, 20, 22, 46, 50 y 52 se cierran en
  `utils/vida-template.utils.test.ts` y en
  `hooks/useSaveVidaItemForActivity.test.tsx`, sin navegador y sin sesión. Es lo
  que hace que estas tajadas sean verificables pese al login.
- **La pantalla, con Testing Library**, como `VidaSemanaPage.test.tsx` y
  `VidaHoyPage.test.tsx`: estados vacío · cargando · error · sin sesión, el
  reordenado al cambiar la hora (criterio 24), la caída al cajón y la vuelta, y
  el nombre de 60 caracteres (criterio 13).
- **El vocabulario** lo comprueba solo `src/features/vida/vida-vocabulary.test.ts`
  sobre todo el módulo (criterio 15): los archivos nuevos entran en su `glob` sin
  hacer nada. **Dos avisos**: «cancelar» y «eliminar» están prohibidas, y ese
  test además **afirma que los cuatro archivos de `HEREDADOS` siguen diciéndolas**
  — así que no «arregles de paso» el botón «Cancelar» de `VidaActivitySheet` sin
  quitarlo de la lista.
- **Lo visual, con un arnés temporal** (`.html` + `.tsx` bajo `src/` con datos
  sintéticos y `MemoryRouter`), que es la vía que ya funcionó tres veces en este
  repo: es la única forma de mirar la cuadrícula de la tajada 4 a 375 px y en
  oscuro sin entrar con credenciales. **Se borra antes de reportar.**
- **El render** se abre en
  `http://localhost:5173/docs/vida/assets/06-vida-plantilla.html` sin sesión,
  para comparar.
- **Lo que solo se puede ver con datos reales** —que el API acepte dos ítems de
  la misma actividad (tajada 3) y que Hoy vea el cambio sin recargar (criterio
  27)— se entrega como **pasos manuales** para el usuario, no como «verificado».

### Lo que no pude averiguar

- **Si `useConfirmDialog` admite dos salidas afirmativas.** No abrí
  `src/shared/ui/ConfirmDialog/`. Afecta a un archivo de la tajada 2 y está
  escrito como bifurcación, no como supuesto.
- **Si el servidor de verdad acepta dos `VidaItem` de la misma actividad.** El
  análisis del repo hermano dice que sí y en este repo nada asume lo contrario,
  pero **contra el servidor vivo no se ha probado nunca** y desde aquí no se
  puede (login). Es el riesgo concentrado de la tajada 3 y por eso conviene que
  sea lo primero que el usuario toque al probarla.
- **Cuántos ítems por actividad tiene hoy la cuenta real**, que es lo que dirá si
  el criterio 35 se ve o se queda teórico.

---

*Escrito por `feature-architect` el 2026-09-20 sobre HEAD `5026236`. Fuentes:
`graphify query` sobre `VidaActivitySheet` / `planVidaItemSave` /
`useSaveVidaItemForActivity`, y después lectura directa de
`pages/VidaSemanaPage.tsx`, `pages/VidaActividadesPage.tsx`,
`pages/VidaPlantillaPage.tsx`, `components/VidaActivitySheet/`,
`components/VidaAgendaBlock/`, `components/VidaDayBudget/`,
`components/VidaDayStrip/`, `components/VidaStartingPoints/`,
`components/VidaTemplateAside/`, `hooks/useSaveVidaItemForActivity.ts`,
`hooks/useVidaItems.ts`, `hooks/useVidaDayHours.ts`,
`hooks/useCreateStartingActivities.ts`, `hooks/useBuildWeekFromTemplate.ts`,
`utils/vida-agenda.utils.ts`, `utils/vida-build-day.utils.ts`,
`utils/vida-catalog.utils.ts`, `utils/invalidate-vida-queries.ts`,
`graphql/vida-items.graphql.ts`, `graphql/contracts.test.ts`,
`types/vida-item.types.ts`, `types/activity.types.ts`,
`types/activity-followup.types.ts`, `routes/vida.routes.tsx`,
`vida-vocabulary.test.ts`, `src/shared/ui/Tabs/Tabs.tsx`, el render aprobado
`docs/vida/assets/06-vida-plantilla.html` (marcos C y D leídos en el fuente) y
`docs/features/ENVIRONMENT.md`. **No se escribió código de producto.***

## 3. Construction — feature-builder

### Tajada 1 — la plantilla se ve (criterios 1–15)

**Resumen para quien revise, en tres líneas:**

1. `/app/vida/plantilla` **dejó de ser un cascarón**: siete pestañas de día con
   su cuenta y su punto, el resumen «Viernes · 4h 5 puestas de 16h 30» con la
   barra del día entero, la agenda del día **ordenada por hora** con sus
   tarjetas (icono y color de la categoría, «45 min · L M X J V», «sin
   duración», el desactivado en trazo suave con «desactivada · no sale en
   Hoy»), el cajón **«Sin hora»** con su explicación literal, y los cinco
   estados —sin sesión · cargando · falló · plantilla vacía · día vacío—.
   **Todo es lectura**: cero botones en la pantalla fuera de las pestañas.
2. **Nada del API, ningún documento GraphQL, ninguna clave de caché, ningún
   `localStorage`, ninguna ruta.** Solo `useVidaItemsQuery(true)`,
   `useVidaDayHours()` y —**solo para la cuenta del vacío**—
   `useActivitiesQuery`.
3. **Lo que más probable haya roto:** el título de la pantalla pasó de
   «Plantilla» a **«Tu plantilla»** (criterio 1) y eso tumbó **tres
   afirmaciones ajenas** que tuve que tocar —dos en
   `routes/vida.routes.test.tsx` y una en `layouts/AppLayout/AppLayout.test.tsx`—;
   además **ajusté el relleno de las pestañas compartidas por selector de
   atributo** (`.root [role='tab']`) dentro de mi módulo: no toqué
   `src/shared/ui/Tabs/`, pero si alguien cambia allí el cromo, esta pantalla lo
   nota. Y `VidaPlantillaPage` **ya no monta sin proveedores**: necesita
   `QueryClient` y el contexto de `AuthBootstrap` (antes eran seis líneas).

**Archivos.** Creados: `src/features/vida/utils/vida-template.utils.ts` y su
`.test.ts`; `components/VidaTemplateDayTabs/`, `components/VidaTemplateDaySummary/`,
`components/VidaTemplateItemCard/`, `components/VidaTemplateNoTimeDrawer/` (los
cuatro con `.tsx` + `.module.scss` + `index.ts`);
`pages/VidaPlantillaPage.module.scss` y `pages/VidaPlantillaPage.test.tsx`.
Modificados: `pages/VidaPlantillaPage.tsx` (reescrito), y **dos tests ajenos**:
`routes/vida.routes.test.tsx` y `layouts/AppLayout/AppLayout.test.tsx`. Es
exactamente la tabla del arquitecto, más los dos tests derogados.

**Criterio por criterio, con la evidencia:**

| # | Estado | Evidencia |
|---|---|---|
| 1 | cumplido | `PageHeader title="Tu plantilla"` + «Cómo quieres que sea tu semana. Hoy la sigue — o no.», los dos con test (`VidaPlantillaPage.test.tsx`). **Ni ruta, ni píldora, ni `⌘K` tocados**: `routes/vida.routes.tsx`, `vida-paths.ts` y `app-nav.config.ts` están sin un carácter de diferencia (`git status`). |
| 2 | cumplido | Siete `role="tab"` con letra y cuenta, envolviendo `@/shared/ui/Tabs` (no se reescribieron pestañas). **Al entrar se abre hoy**: con el reloj en viernes 18-09-2026 la pestaña «V» es la `aria-selected`; en el arnés, con hoy domingo, se abrió la «D». **Teclado**: un `ArrowRight` sobre el `tablist` pasa a sábado (test). Distinción por **algo más que el color**: `aria-selected` + el subrayado de `Tabs` + el peso de la letra. |
| 3 | cumplido | `data-state="some" \| "none"` con rayado o apagado, **decorativo**, y lo que se oye va en el texto oculto de la pestaña —«viernes, hoy · 1 cosa» / «jueves · nada puesto todavía»—, misma lectura que `VidaDayStrip`. Visto en pantalla (arnés, 375 px). |
| 4 | cumplido | «4h 5 puestas de 16h 30» en pantalla, y la aritmética probada: los `segments` **suman el día entero** (990 min con el horario por defecto) y **siguen sumando el 100 % con dos ítems pisados** —60 + 30, no 60 + 60— gracias a `trackMinutes`, copiado de `vida-agenda.utils.ts:41-52`. La barra es `aria-hidden` y la leyenda escribe los minutos como texto («puesto 4h 5 · libre 12h 25»), que es la regla que hereda de `VidaDayBudget`. |
| 5 | cumplido | `buildTemplateGuidance` da, con los datos del render, **la frase del render palabra por palabra**: «Seis cosas con hora y una sin ella. Tu viernes está lleno por la mañana y libre de 14:00 a 19:00.» Y **no se afirma un hueco que no hay**: con el día apretado la frase se queda en «Tres cosas con hora.», y un hueco de menos de 90 min no se nombra. Dos reglas mías, dichas abajo. |
| 6 | cumplido | Una tarjeta por ítem, **orden por hora y, a igual hora, por nombre** (test puro y test de pantalla: correr 6:45 → bañarme 7:00 → cocinar 13:00 → pasear 19:00). Icono y color salen de `item.activity.category`, **sin consulta extra**. «45 min · L M X J V» con los días **del propio ítem**, y «todos los días» con los siete. **Ni asas de arrastre ni flechas**: no existe ningún control de orden en el DOM. |
| 7 | cumplido | «sin duración» en la tarjeta; `0` y los negativos cuentan como «sin duración» y **no aportan minutos** a la barra. El test busca «0 min» con `(?<!\d)0 min` para que no case con «30 min». |
| 8 | cumplido | El desactivado **se queda en su hora**, con tarjeta de trazo discontinuo, nombre en tono secundario y la etiqueta «desactivada · no sale en Hoy». La consulta se pide con `includeInactive: true` (afirmado en un test). **No se pinta «Activar»** (es el criterio 26). |
| 9 | cumplido | Cajón al final, rótulo «Sin hora», su cuenta, y la explicación **literal**: «Hoy las pone al final del día, una detrás de otra. Con hora quedan en su sitio.» Un día sin ítems sin hora **no pinta el cajón** (test). **No se pinta «Ponerle hora»** (criterio 25). |
| 10 | cumplido **en su mitad**, como repartió el plan | El texto del marco D, «Empieza por tu mañana», el botón **«Traer de tus actividades»**, la cuenta real del catálogo (**sin las archivadas**: 2 de 3 en el test) y «Un día sin plantilla se vive igual: se registra sobre la marcha.». **Los seis puntos de partida son de la tajada 3** (criterio 36). Una desviación pequeña, abajo: «· N ya con días puestos» solo se escribe si N > 0. |
| 11 | cumplido | Con solo lunes lleno, el viernes se lee **«El viernes no tienes nada puesto.»** (la frase del resumen) y debajo la salida «Traer de tus actividades». Las siete pestañas siguen ahí, así que el día que sí tiene algo está a un toque. |
| 12 | cumplido | Los tres estados **distinguidos**, calcados de `VidaSemanaPage:102-106`: sin sesión → «Entra para ver tu plantilla» + «Iniciar sesión»; cargando → esqueletos **con la forma de lo que llega** (tira, resumen y cuatro tarjetas) con `aria-busy`; error → «No pudimos cargar tu plantilla» + **«Reintentar»** (llama a `refetch`, comprobado) y **ni pestañas, ni el texto del primer minuto**: no se afirma que no hay nada. |
| 13 | cumplido | Medido en el navegador a 375 px con un nombre de **60 caracteres**: la tarjeta sigue midiendo **una fila** (67 px, igual que la de nombre corto), el nombre se recorta con puntos suspensivos y **la hora sigue visible** (`8:00` a 25 px del borde). |
| 14 | cumplido | Medido en el navegador, **no deducido**: a 375 px `scrollWidth` 375 = `clientWidth` y **cero elementos** rebasando el borde, en el caso lleno y en el de nombres largos. **Oscuro**: lo peor de lo nuevo es **9,5:1** (letras y cuentas de las pestañas, horas, leyenda, meta de la tarjeta, «Sin hora» y su explicación, la etiqueta «desactivada»); los nombres y la frase de guía, 19,29:1. En claro, lo peor 8,38:1. |
| 15 | cumplido | `vida-vocabulary.test.ts` pasa con los archivos nuevos dentro de su `glob` (no hace falta tocarlo) y **no toqué el «Cancelar» de `VidaActivitySheet`**, que sigue en la lista de `HEREDADOS`. Además, el test del util afirma que la frase de guía no dice «vacío», «desperdicio», «fallaste» ni «perdiste». |

**Lo que no se puede cerrar desde aquí, y no lo disimulo:** **ninguna llamada
real al API**. Todo `/app/*` está detrás del login y los agentes no entran: lo
que se ve arriba está medido con **tests** (`vitest` + Testing Library) y con un
**arnés temporal** (`src/harness-plantilla.html` + `.tsx`, con `QueryClient`
precargado y datos sintéticos) que **ya está borrado**. Nunca vi esta pantalla
dentro de `/app/vida/plantilla` con datos de verdad.

**Decisiones mías, fuera de lo que decía el plan, todas revertibles:**

1. **El umbral del «hueco que se puede nombrar» son 90 minutos**
   (`TEMPLATE_NAMEABLE_GAP_MINUTES`). El criterio 5 exige no afirmar un hueco
   que no lo sea y no da número; 90 min es lo que hace que la frase del render
   salga exacta y que «libre de 13:00 a 13:20» no se escriba nunca. Una
   constante con nombre, a una línea de cambiarse.
2. **«Está lleno por la mañana» pide más de la mitad del tiempo puesto**, con
   `>` y no `>=`: con 60 min por la mañana y 60 por la noche **no se dice que
   ninguna parte esté llena**, porque elegir una sería elegirla por el orden en
   que se miran. Los tramos son mañana (hasta 12:00), tarde (hasta 18:00) y
   noche.
3. **La frase de guía no describe la forma de un día que no tiene hora**: con
   todo en el cajón se lee «Todavía nada con hora y dos sin ellas.» y ahí se
   corta. «Tu jueves está libre de 6:30 a 23:00» era cierto y no aportaba.
4. **«· N ya con días puestos» solo aparece si N > 0.** En la plantilla vacía
   del todo ese número es **necesariamente 0**, así que el «11 en tu catálogo ·
   3 ya con días puestos» del render no puede darse en ese estado: escribir «· 0
   ya con días puestos» sería ruido. La mitad que sí se puede afirmar se afirma.
5. **El día vacío no repite la frase dos veces.** La dice el resumen («El
   viernes no tienes nada puesto.») y la tarjeta de debajo pone **solo la
   salida** («Ponle algo cuando quieras» + «Traer de tus actividades»).
6. **El relleno de las siete pestañas se ajusta desde mi módulo, por selector de
   atributo** (`.root [role='tablist']` y `.root [role='tab']`). El de
   `@/shared/ui/Tabs` está pensado para dos o tres pestañas de palabra y con
   siete **dejaba el domingo fuera de la vista, con barra de desplazamiento
   propia** — y el domingo puede ser justo el día que se abre al entrar. **No
   toqué el componente compartido** (lo usa `HabitDetailPage`), pero el acople
   por atributo queda dicho.
7. **Un ítem desactivado cuenta en la pestaña y en la frase** («Siete cosas con
   hora» incluye a «Salir a correr», desactivada). Es coherente con que **se
   pinta** (criterio 8); si al verlo se prefiere que no cuente, es un filtro de
   una línea en `countTemplateByDay` y en `buildTemplateGuidance`.

**Lo que descubrí y no estaba en el plan:**

- **`VidaItem.activity` no trae `categoryId`** —el aviso del arquitecto (A4)— y
  **aquí no molesta**: la tarjeta solo lee `category { icon color }`, que sí
  viaja. El problema es entero de la tajada 2.
- **El arnés no arranca solo con `QueryClient`**: `useVidaQueryGuard` llama a
  `useAuthBootstrap`, que **lanza** sin su proveedor. Con el contexto puesto a
  `{ status: 'ready' }` y la caché precargada, la pantalla se pinta sin tocar el
  API ni el `localStorage` del 5173. Queda escrito para quien monte el próximo
  arnés.
- **Dos afirmaciones de F0 quedaron derogadas, no borradas**:
  `/app/vida/plantilla` ya no es «nada más que el título», así que salió de esa
  lista —`revision` sigue dentro y se sigue comprobando— y en su lugar hay un
  test nuevo, calcado del que estrenó Hoy: sin sesión enseña la vía para entrar.
- **Aviso para la tajada 4:** `buildTemplateDay` **estira la ventana** por día
  (A5). Para la cuadrícula la ventana tiene que ser **una sola para las siete
  columnas**, o las columnas no serán comparables: hoy eso no existe todavía.
- Sin tocar: `usableTemplateItems`, `buildVidaItemsByActivity`,
  `findVidaItemForActivity`, `vida-agenda.utils.ts`, `VidaDayBudget`,
  `VidaAgendaBlock`, `vida-build-day.utils.ts`, `graphql/`, `api/`, `types/`.

**La línea base, corrida entera al terminar:**

| Qué | Antes | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** (exit 0) |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos |
| `pnpm test` | 2 fallos de 1153 | **2 fallos de 1200** (los dos de `SearchSelect`; **+47 tests**, 1 archivo rojo de 101) |
| `pnpm build` | inicial 964,7 kB · `app-icons` 620,20 · `IconPicker` 4,64 | **exit 0**, inicial **976,49 kB** (+11,8 kB, **ninguno de iconos**), `app-icons` **620,20** e `IconPicker` **4,64** clavados; CSS 207,06 kB |

`graphify update .`: **3319 nodos, 3821 aristas, 471 comunidades**.

**El recorrido manual, para el usuario** (con la API despierta —Render tarda
~1 min— y la sesión iniciada; es lo único que ningún agente puede hacer):

1. Entra en **Vida → Plantilla**. Comprueba que se abre **el día de hoy** y que
   la píldora «Plantilla» sigue encendida.
2. Mira las siete pestañas: la letra, **la cuenta** y el punto rayado en los días
   que tienen algo. Muévete con las **flechas ←/→** del teclado.
3. En un día con cosas, comprueba que la agenda está **ordenada por hora** y que
   cada tarjeta dice «45 min · L M X J V» con **sus** días.
4. Busca un ítem **sin duración**: tiene que leerse **«sin duración»**, nunca
   «0 min».
5. Si tienes alguno **desactivado**, comprueba que **sigue en su hora**, en
   trazo suave y con «desactivada · no sale en Hoy» — y que **no** hay ningún
   botón para activarlo todavía (llega en la tajada 2).
6. Baja al cajón **«Sin hora»**: su cuenta y la línea «Hoy las pone al final del
   día…».
7. Lee el resumen: **«… puestas de 16h 30»** tiene que cuadrar con tu horario de
   `/app/vida/ajustes`, y la frase de abajo tiene que nombrar **un hueco que de
   verdad tengas** (o no nombrar ninguno).
8. Entra en un día **que no tengas puesto**: se dice sin reproche y ofrece ir al
   catálogo.
9. En el **móvil de verdad** (no el emulador): comprueba que no hay scroll
   horizontal y, en **tema oscuro**, que todo se lee.
10. Si tienes forma de hacerlo, **apaga la red un momento y recarga**: tiene que
    decir «No pudimos cargar tu plantilla» con **Reintentar**, y **nunca**
    «todavía no tienes nada».


### Tajada 2 — la hoja del ítem (criterios 16–28)

**Resumen para quien revise, en tres líneas:**

1. **La plantilla ya se edita desde la plantilla.** Tocar una tarjeta abre **la
   misma hoja del catálogo** —`VidaActivitySheet`, con props aditivas— pero
   **por el ítem que se tocó, por su id**: días, hora, cuánto, **la nota**, el
   interruptor «Activa en mi plantilla» con su explicación y la **vista previa
   de cómo queda en Hoy**. Debajo, **«Ponerle hora»** en el cajón y
   **«Activar»** de un toque sin abrir nada; y en la hoja, **«Quitar de la
   plantilla»**, que abre una confirmación con **dos salidas afirmativas**
   —«Quitarlo solo del viernes» y «Quitarlo de los 3 días»— más **«Volver»**.
2. **Ni un documento GraphQL, ni una clave de caché, ni una ruta, ni un
   `localStorage`, ni un icono a pelo.** Las tres mutaciones ya existían
   (`vidaItemUpdate`, `vidaItemDelete` —**primer uso**— y `vidaItemCreate`) y
   las tres invalidan `vidaKeys.items.all()`, que es **prefijo** de las
   sugerencias: el criterio 27 sale de ahí y no de invalidación nueva.
3. **Lo que más probable haya roto:** la hoja del catálogo **estrena un campo
   de nota** —el criterio 18 lo pide y **no existía**, aunque el analista dijera
   que sí—, así que **`planVidaItemSave` sí cambió de cuerpo** (el arquitecto
   escribió «sin cambios en el cuerpo») y **cuatro expectativas de tests de
   FEAT-002 cambiaron**: ahora sus `update` llevan `notes`. El cinturón está
   puesto —`notes: undefined` significa «no se toca» y entonces el campo **no
   viaja**—, pero si algo se rompe en el catálogo, es ahí.

**Archivos.** Creado: `components/VidaTemplateRemoveDialog/` (`.tsx`,
`.module.scss`, `index.ts`). Modificados:
`hooks/useSaveVidaItemForActivity.ts` (+ su test),
`components/VidaActivitySheet/VidaActivitySheet.tsx` y `.module.scss` (+ su
test), `hooks/useVidaItems.ts`, `utils/vida-template.utils.ts` (+ su test),
`components/VidaTemplateItemCard/` (`.tsx` y `.module.scss`),
`components/VidaTemplateNoTimeDrawer/VidaTemplateNoTimeDrawer.tsx`,
`pages/VidaPlantillaPage.tsx` (+ su test). Es la tabla del arquitecto, más el
`.module.scss` de la hoja y el de la tarjeta. **Nada fuera de
`src/features/vida/`.**

**Criterio por criterio, con la evidencia:**

| # | Estado | Evidencia |
|---|---|---|
| 16 | cumplido | Tocar la tarjeta abre `VidaActivitySheet` —**el mismo componente**, no una copia: `grep` sobre `src/` da un solo archivo de hoja de ítem—. La tarjeta es un `<button>` de verdad (`aria-label="Abrir Organizar la casa"`), así que el teclado llega gratis. Test: la hoja abierta enseña el nombre y **no pinta** el campo «Cómo la llamas». |
| 17 | cumplido | Con **dos ítems de «Pasear a las mascotas»** (7:30 y 19:00), abrir el de las 19:00 y guardar llama a `vidaItemUpdate` con **`id: 't'`** (test de pantalla), y el plan puro lo sostiene aparte: `planVidaItemSave` con `targetItem` = el de las 19:00 devuelve `update` sobre **ese** id y el JSON del plan **no contiene** el id del otro. Es la decisión **A3**: `item` → `targetItem`, contrato nuevo, y los dos casos que pidió el arquitecto están escritos. |
| 18 | cumplido, **con un hallazgo** | Los campos son los del render: días (`role="group"` «Días de la plantilla»), «A qué hora» (`input type="time"`, 24 h, se puede vaciar), «Cuánto» con **15 · 30 · 45 · 1h · libre** y minutos a mano (`VidaDurationPills`, sin tocar) y **la nota en texto plano**. La cabecera enseña **nombre** (título del modal), **icono** y **categoría** y **no los pide**. **El hallazgo:** la nota **no existía en la hoja** —la sección 1 la daba por hecha («ya existen en la hoja»)— y la he tenido que añadir; ver «decisiones mías». |
| 19 | cumplido | Interruptor **«Activa en mi plantilla»** con la explicación **literal** del criterio, y apagarlo guarda `{ id, isActive: false }` y **nada más**: ni días, ni hora, ni nota (test). Desde el catálogo el interruptor **sigue diciendo lo de FEAT-002** («Ponerla en mi plantilla»): el texto nuevo va atado a `lockActivity`, y por eso ninguna afirmación de FEAT-002 cambió por esto. |
| 20 | cumplido | `describeTemplatePreview` (puro, 7 casos): con los datos del render da **«Así queda en Hoy: lunes, miércoles y viernes de 9:00 a 9:45.»**, y en pantalla se recalcula **de lo elegido** —quitar la duración borra el rango y aparece «Sin cuánto dura, Hoy le pone 30 min al armar el día»; cambiar la hora a 07:15 da «de 7:15 a 7:45»—. **Sin hora** dice lo que Hoy hace de verdad («la pone al final del día, una detrás de otra»), y **sin ningún día** no se afirma nada. La línea «Los días que ya tienes armados **no se reescriben solos**» va siempre. Ninguna variante trae una palabra de culpa (barridas seis). |
| 21 | cumplido | «Quitar de la plantilla» **solo existe si quien abre la hoja la cablea** (sin `onRemoveFromTemplate` no se pinta: test), **no borra desde la hoja** —avisa a la página— y la confirmación dice **«La actividad se queda en tu catálogo»**. «Quitarlo» llama a `vidaItemDelete` con su id (**primer uso** de la mutación). La salida es **«Volver»**, y pulsarla **no llama a ninguna de las dos mutaciones** (test). Ni «eliminar» ni «cancelar» en ninguna parte de lo nuevo. |
| 22 | cumplido | Con «Organizar la casa» los lunes, miércoles y viernes, quitándolo **desde el viernes**, la confirmación dice **«también está los lunes y los miércoles»** y ofrece **«Quitarlo solo del viernes»** (`vidaItemUpdate` con `days: ['monday','wednesday']`, comprobado) y **«Quitarlo de los 3 días»** (`vidaItemDelete`). **Con un solo día hay una sola salida** afirmativa («Quitarlo»), no se dice «también está» y no se inventa plural (test). |
| 23 | cumplido | Quitar el último día y pulsar «Guardar» **no manda nada al API** (las dos mutaciones sin llamar) y se lee en el campo: **«Déjale al menos un día, o desactívala con el interruptor.»** Es el `daysError` que ya estaba; el texto nuevo va atado a `lockActivity` para no derogar la afirmación de FEAT-002. |
| 24 | cumplido **en sus dos mitades, y medido distinto cada una** | *La hoja cierra en el `onSuccess` de la mutación*: el test comprueba que tras «Guardar» `onClose` **todavía no se ha llamado** y que solo se llama al correr el `onSuccess` — si la mutación falla, la hoja se queda abierta con lo escrito, que es lo que ya hacía FEAT-002. *La pantalla se actualiza sin recargar*: **la pantalla se dibuja de la consulta, no de estado local**, y eso está probado cambiando lo que devuelve la consulta y volviendo a pintar: la casa pasa de las 9:00 a las 21:00 y **se reordena**, y el paseo sin hora **cae al cajón «Sin hora»**. Lo que no puedo ver desde aquí es el viaje de verdad (invalidación → refetch → API). |
| 25 | cumplido | «Ponerle hora» en el cajón abre **la misma hoja** con la hora **vacía y lista para escribirse** (test: `toHaveValue('')`), no con una hora inventada. |
| 26 | cumplido | «Activar» en un desactivado llama a `vidaItemUpdate` con **`{ id, isActive: true }` y nada más** —sus días, su hora y su nota se quedan, porque omitir un campo lo deja igual— y **no abre la hoja** (`queryByRole('dialog')` vacío). Lo confirma el toast que ya existía («Plantilla actualizada») y el botón se apaga con «Activando…» mientras viaja. |
| 27 | **no lo puedo cerrar yo**; hecho lo que lo sostiene | Las tres mutaciones invalidan `vidaKeys.items.all()` por `invalidateVidaItemQueries`, que es **prefijo** de `items.suggestions(*)` y `items.takenToday(*)` (`invalidate-vida-queries.ts:71-79`): con eso las fichas de los huecos y «Armar desde la plantilla» de Hoy releen solos. **No escribí invalidación nueva**, como mandaba el plan. Pero que Hoy lo vea **sin recargar** solo se ve con el API vivo y una sesión: va en los pasos manuales. Lo que **sí** puedo afirmar: **no se toca ningún `activityDayPlan`** —ni una de sus cuatro mutaciones aparece en lo nuevo—, así que un día ya armado no se reescribe. |
| 28 | cumplido, **medido en el navegador** | Arnés borrado, 375×812, tema oscuro: `scrollWidth` **375 = clientWidth** y **cero elementos** desbordando, con la hoja abierta y con la confirmación abierta. **«Guardar» y «Quitar de la plantilla» se ven sin desplazar la hoja** (`Guardar` en y 748–787 de 812) — y esto **no salía gratis**: mis dos bloques nuevos dejaban el panel en 820 px contra 746 de alto útil y empujaban «Guardar» fuera; se arregló recortando el alto de la nota, juntando la vista previa en un párrafo y bajando el icono de la cabecera. En **oscuro**, lo nuevo va de **7,88:1** (la línea «En tu plantilla · Casa · …» y la categoría) a **18,67:1** (la vista previa), con la nota en 14,89:1 y las tarjetas y el cajón en 9,88:1. Un nombre de **60 caracteres** sigue en **una fila**, recortado con puntos y sin tapar la hora. |

**Lo que no se puede cerrar desde aquí, y no lo disimulo:** **ninguna llamada
real al API**. Todo `/app/*` está detrás del login y los agentes no entran: no
he visto nunca esta pantalla con datos de verdad, ni he visto a
`vidaItemDelete` responder —**es su primer uso en la vida del proyecto**—, ni he
visto Hoy actualizarse tras guardar. Lo de arriba está medido con **tests**
(`vitest` + Testing Library) y con un **arnés temporal**
(`src/harness-f5t2.tsx` + `harness-f5t2.html`, **ya borrados**) que montaba las
piezas nuevas con `AuthBootstrapContext` a `{ status: 'ready' }` y datos
sintéticos.

**Decisiones mías, fuera de lo que decía el plan, todas revertibles:**

1. **La nota no existía y la he añadido** (criterio 18). La sección 1 decía «ya
   existen en la hoja (FEAT-002)» y **no es cierto**: `VidaItem.notes` está en
   el modelo y en los dos inputs desde F0, pero **ninguna pantalla la pedía**.
   Como el criterio la lista entre los campos y el render la dibuja, entra.
   **Consecuencia, y es la que hay que mirar:** `planVidaItemSave` **sí cambió
   de cuerpo**, contra lo que escribió el arquitecto. El cinturón: `notes`
   entra como **opcional**, `undefined` significa **«no se toca»** y entonces
   el campo **no viaja en el `update`** (omitir deja la que hubiera); solo
   `null`/`''` la limpian, y eso solo lo manda quien pinta el campo. Cuatro
   expectativas de tests de FEAT-002 cambiaron por esto —ahora su `update`
   lleva `notes: 'Con calma'`, que es **la misma nota que traía el ítem**—.
2. **La hoja se monta solo después de la primera apertura**
   (`sheetSession > 0`). `VidaActivitySheet` pide las categorías al montarse y
   en esta pantalla **no hacen falta** —con `lockActivity` ni se pintan—: dejarla
   montada siempre habría añadido una consulta a cada entrada en la plantilla.
3. **El texto nuevo del interruptor y del error de días va atado a
   `lockActivity`.** Desde el catálogo la hoja dice **exactamente lo mismo que
   decía**, así que ninguna afirmación de FEAT-002 se deroga por vocabulario.
   Si se prefiere una sola redacción para las dos, es borrar el ternario.
4. **`VidaTemplateRemoveDialog` es un `Modal`, no `useConfirmDialog`** — la
   bifurcación que el arquitecto dejó abierta, **resuelta mirando el código**:
   `ConfirmDialogProvider` resuelve una `Promise<boolean>` y pinta **dos**
   botones (`ConfirmDialogProvider.tsx:87-104`), así que **no admite dos salidas
   afirmativas** y el criterio 22 pide tres botones.
5. **Las dos salidas afirmativas no son rojas.** `Button variant="danger"` pinta
   texto blanco sobre `rgb(255,180,171)` en **tema oscuro**: lo medí, **1,7:1**,
   ilegible. Como el render de esta pantalla no tiene rojo en ninguna parte y el
   criterio 22 quiere **las dos salidas ofrecidas**, las dos van `secondary` y
   «Volver» va `ghost`. **Es un hallazgo que va más allá de esta tajada**: todas
   las confirmaciones de Vida que usan `useConfirmDialog` con `variant: 'danger'`
   (FEAT-003 «Vaciar y rehacer», FEAT-004 «Quitar del registro») tienen ese
   mismo 1,7:1 en oscuro. **No lo arreglo**: vive en `src/shared/ui/Button` y lo
   usa hábitos entero.
6. **«Quitarlo de los 3 días» escribe el número en cifra**, no «los tres días»
   como el criterio: con 2, 4 o 7 días la palabra habría que declinarla y la
   cifra no miente nunca.
7. **La tarjeta entera abre la hoja, y no hay «···».** El criterio 16 dice
   «tocar una tarjeta (o su «···»)»: con dos acciones sueltas —«Ponerle hora» y
   «Activar»— y la hoja detrás de la tarjeta, un menú de tres puntos con una sola
   entrada sería un paso de más. Si al verlo se echa de menos, es aditivo.

**Lo que descubrí y no estaba en el plan (y no toqué):**

- **La nota no existía en la hoja** (arriba). Es el único punto donde la sección
  1 describía algo que no estaba construido.
- **`Button variant="danger"` es ilegible en oscuro** (1,7:1). Afecta a todas
  las confirmaciones de Vida, no solo a esta. Es de `shared/ui` y no lo toco.
- **La descripción del `Switch` compartido se queda en 4,79:1** en oscuro —es el
  peor número de la hoja entera, y es de FEAT-002/`shared/ui`, no de lo nuevo;
  lo nuevo empieza en 7,88:1—.
- **`useConfirmDialog` no admite dos salidas afirmativas** (cerrada la duda del
  arquitecto).
- Sin tocar: `findVidaItemForActivity`, `buildVidaItemsByActivity`,
  `usableTemplateItems`, `vida-agenda.utils.ts`, `vida-build-day.utils.ts`,
  `VidaDayBudget`, `VidaAgendaBlock`, `graphql/`, `api/`, `types/`,
  `routes/`, `app-nav.config.ts`, `src/shared/ui/`.

**Un test de la tajada 1 quedó derogado, no borrado.** El que decía «**no se
pinta ni un botón muerto**: en la tajada 1 la pantalla solo lee» afirmaba **cero
botones**, y los criterios 16, 25 y 26 son justo lo contrario. En su lugar
afirma lo que **sigue valiendo**: que no se pinta nada de las tajadas 3 y 4 —ni
«+», ni «Ver la semana entera», ni «Copiar este día a otros»—.

**La línea base, corrida entera al terminar:**

| Qué | Antes (tajada 1) | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** (exit 0) |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos |
| `pnpm test` | 2 fallos de 1200 | **2 fallos de 1230** (los dos de `SearchSelect`; **+30 tests**, 1 archivo rojo de 101). `src/features/vida`: **810/810** |
| `pnpm build` | inicial 976,49 kB · `app-icons` 620,20 · `IconPicker` 4,64 | **exit 0**, inicial **982,95 kB** (+6,46 kB, **ninguno de iconos**), `app-icons` **620,20** e `IconPicker` **4,64** clavados; CSS 208,82 kB |

`graphify update .`: **3357 nodos, 3871 aristas, 471 comunidades**.

**El recorrido manual, para el usuario** (con la API despierta —Render tarda
~1 min— y la sesión iniciada; es lo único que ningún agente puede hacer, y aquí
**por primera vez se borra de verdad**):

1. Entra en **Vida → Plantilla** y toca una tarjeta. Comprueba que se abre la
   hoja **de esa cosa**, con su nombre, su icono y su categoría arriba, y que
   **no te pide** el nombre ni la categoría.
2. Cámbiale **la hora** y guarda: la tarjeta tiene que **reordenarse sola** en
   ese día, sin recargar.
3. **Vacíale la hora** y guarda: tiene que caer al cajón **«Sin hora»**. Desde
   ahí, **«Ponerle hora»**, pónsela y comprueba que vuelve a su sitio.
4. Escríbele una **nota**, guarda, vuelve a abrirla: la nota tiene que seguir
   ahí. *(Es campo nuevo: si algo del API no la acepta, se ve aquí.)*
5. Mira la **vista previa**: «Así queda en Hoy: … de 9:00 a 9:45». Quítale la
   duración y comprueba que **deja de enseñar un rango** y dice qué falta.
6. **Desactiva** una con el interruptor y guarda: se queda en su hora, en trazo
   suave. Después pulsa **«Activar»** y comprueba que vuelve **con sus días, su
   hora y su nota**.
7. Quítale **todos los días** a una: no tiene que dejarte guardar, y el mensaje
   tiene que salir **en el campo**, no como error del servidor.
8. En una que esté en **varios días**, pulsa **«Quitar de la plantilla»** desde
   uno de ellos: comprueba que la confirmación **nombra los otros días**, que
   **«Volver»** no hace nada, y prueba **«Quitarlo solo del \<día\>»** — tiene
   que quedarse en los demás.
9. Ahora sí, **«Quitarlo de los N días»** en una que te sobre: **es la primera
   vez que este proyecto borra un ítem de plantilla**. Comprueba que la
   actividad **sigue en `/app/vida/actividades`**.
10. Vete a **Hoy** (`/app/vida/hoy`) **sin recargar**: las fichas de los huecos
    y «Armar desde la plantilla» tienen que ver ya lo cambiado — y un día **ya
    armado** tiene que seguir **exactamente igual**.
11. En el **móvil de verdad** y en **tema oscuro**: abre la hoja y comprueba que
    llegas a «Guardar» sin pelearte con el desplazamiento.

### Tajada 3 — «Añadir a mi Vida» y el primer minuto (criterios 29–41)

**Resumen para quien revise, en tres líneas:**

1. **La plantilla ya se llena desde la plantilla.** En escritorio, el panel
   **«Añadir a mi Vida»** al lado (aside pegajoso); en móvil, **el «+»
   flotante** abre **el mismo panel** dentro de la hoja inferior. Se busca en el
   catálogo sin tildes, se ve **en qué estado está cada actividad**, y al elegir
   una se le ponen **días, hora y cuánto en el mismo panel** — incluida una
   **segunda hora** para algo que ya está (dos `VidaItem`). Y con la plantilla
   vacía, **el primer minuto**: los **seis puntos de partida con hora**, los días
   de una vez y **«Ponerlas en mi plantilla»**.
2. **Ni un documento GraphQL, ni una clave de caché, ni una ruta, ni un
   `localStorage`, ni un icono a pelo.** Se guarda por
   `useSaveVidaItemForActivity` con **`targetItem: null`** (A3) y los puntos de
   partida por `api/` como ya hacía `useCreateStartingActivities`; la
   invalidación sale de `invalidateVidaItemQueries`, que ya existía.
3. **Lo que más probable haya roto:** `useCreateStartingActivities` **cambió de
   contrato y de comportamiento** —`mutate({ points, schedule? })` en vez de
   `mutate(points)`, y ahora **reutiliza la actividad que ya exista por nombre
   normalizado** (criterio 37)—, y ese hook **lo estrena el catálogo de
   FEAT-002**. Si algo se rompe en el primer minuto del catálogo, es ahí. Y
   detrás de eso: **«Cocinar» pasó a llamarse «Cocinar y almorzar»** en los datos
   de los puntos de partida, porque el criterio 36 y el render lo nombran así.

**Archivos.** Creado: `components/VidaTemplateAddPanel/` (`VidaTemplateAddPanel.tsx`,
`VidaTemplateAddSheet.tsx`, `.module.scss`, `index.ts`). Modificados:
`utils/vida-catalog.utils.ts` (+ `buildVidaItemsByActivityAll`),
`utils/vida-template.utils.ts` (+ su test), `data/vida-starting-points.ts`
(+ su test), `hooks/useCreateStartingActivities.ts` (+ su test),
`components/VidaStartingPoints/VidaStartingPoints.tsx`, `.module.scss` y su test,
`components/VidaActivitySheet/VidaActivitySheet.tsx` y `.module.scss`,
`pages/VidaActividadesPage.tsx`, `pages/VidaPlantillaPage.tsx`, `.module.scss` y
su test. Es la tabla del arquitecto, más los dos `.module.scss` y los tests.
**Nada fuera de `src/features/vida/`.**

**Criterio por criterio, con la evidencia:**

| # | Estado | Evidencia |
|---|---|---|
| 29 | cumplido | En la pantalla hay **las dos puertas y ninguna navega**: el `<button>` flotante «+» (`aria-label="Añadir a mi Vida"`, **sin `href`**, comprobado en el test) y el aside con el panel; la media query de `VidaPlantillaPage.module.scss` enseña el aside a partir de **60rem** y **apaga el «+»** ahí, para que no haya dos puertas a lo mismo en la misma vista. `vidaPaths.actividades` **no aparece** en ninguna de las dos rutas de añadir. |
| 30 | cumplido | El panel usa **`filterActivitiesBySearch`** tal cual (no hay un quinto normalizador): escribir **«banar»** deja «Bañarme» y quita «Pasear a las mascotas» (test, midiendo **dentro del panel**, porque el paseo también está en la agenda). Agrupa con **`groupActivitiesByCategory`** y pinta el icono del grupo; las **archivadas** quedan fuera por `excludeArchivedActivities` (test: «Salir a correr», `cancelled`, no aparece). |
| 31 | cumplido | Cada fila dice su estado: **«aún no está»** con **«+ Añadir»**, o **«en tu plantilla · V · 7:30»** —los días en corto y la hora, o «sin hora»— con **«Ponerle hora»** cuando lo que le falta es la hora (y entonces abre **la misma hoja** del ítem, la de la tajada 2). Con varias horas añade «· N horas». Los dos textos, en el test. |
| 32 | cumplido | Al elegir una, el panel **cambia a su mini-formulario** —«Qué días» (arranca en **el día que se está viendo**), «A qué hora» (`input type="time"`) y `VidaDurationPills`— y guarda con **«Añadir a mi Vida»**. Al guardar, el panel vuelve a la lista y **la pantalla se repinta de la consulta**, que es lo que ya sostenía el criterio 24. **Sin salir de la pantalla y sin recargar**: ni una navegación en todo el camino. |
| 33 | cumplido | `whatIsAt` + `describeFitAt`, puros y con 6 casos: a las 19:00 **«Cabe: a las 19:00 no tienes nada»**; a las 7:45, **«Cabe: a las 7:45 ya tienes Pasear a las mascotas»** — y **se puede guardar igual**, no hay ni una rama que bloquee por solape (medido también en el navegador con el formulario abierto). Un ítem **sin duración** ocupa solo su minuto: no se le inventan 30 para decir que estorba. |
| 34 | cumplido | Con «Pasear a las mascotas» ya a las 7:30, el botón dice **«+ Otra hora»** y, antes de guardar, la línea **«Pasear a las mascotas ya está a las 7:30 · esto le añade otra hora.»** (`describeExistingHours`, con sus casos de una, dos y tres horas). Y lo que sale al API es un **`create`**: el test comprueba que `vidaItemCreate` se llama con `{ activityId, days, startTime, durationMinutes }`, que **`vidaItemUpdate` no se llama** y que el cuerpo **no contiene ninguna clave `id`** — es `targetItem: null` (A3) haciendo exactamente lo que el arquitecto escribió. |
| 35 | cumplido, con una desviación de forma | La hoja **del catálogo** recibe ahora `multipleItemsNote` desde `VidaActividadesPage` con el mapa nuevo: **«Esta actividad tiene 2 horas en tu plantilla · las dos se cambian en Plantilla.»** (`describeMultipleItemsNote`, `null` con uno o ninguno, «3 horas · las 3…» con tres, «2 veces» cuando ninguna tiene hora). **`buildVidaItemsByActivity` y `findVidaItemForActivity` están sin tocar**, como manda el plan. *La desviación:* el enlace no puede ir dentro de un `string`, así que la hoja pinta la línea **y a su lado un enlace «Ir a Plantilla»**. |
| 36 | cumplido | Con la plantilla vacía del todo, `VidaStartingPoints` con `schedule` pinta **los seis del render en orden de reloj** —7:00 Bañarme 15 min · 7:30 Pasear a las mascotas 40 min · 8:30 Desayunar con calma 30 min · 9:00 Organizar la casa 45 min · 13:00 Cocinar y almorzar 1 h · 21:30 Leer un rato 30 min—, **tres marcados** (los de la mañana), el selector de días **de lunes a viernes**, el contador **«3 elegidas · de lunes a viernes»**, el botón **«Ponerlas en mi plantilla»** y la línea **«Horas de partida · las ajustas en un toque después»**. Debajo, «Traer de tus actividades» y **la línea que quita presión**. Todo comprobado en test de datos, en test de pantalla y **en el navegador**. |
| 37 | cumplido en lo que se puede medir sin API | El hook pide **el catálogo fresco** y busca por **`normalizeVidaText(title)`**: con un «bañarme» ya existente, `activityCreate` **solo se llama para la otra** y el punto cuenta como hecho igual (test). Una **archivada no se reutiliza** —sería poner algo que la plantilla no pinta— y se crea una nueva (test). Con `schedule`, cada punto crea su `VidaItem` con **días, hora y duración** (test sobre `createVidaItem`). **Lo que no puedo ver: que el API acepte todo eso de verdad.** |
| 38 | cumplido | Si el ítem de un punto falla, el resultado trae `done: ['banarme','pasear']` y `failed: [{ name: 'Leer un rato', … }]`, el toast dice **«Pusimos 2 de 3; Leer un rato no se pudo.»** y **lo elegido no se pierde**: el componente desmarca **solo lo hecho** (por id de punto, no por título) y deja marcado lo que falló, con su `Alert` **«Algunas no se pudieron poner»** y el motivo. Volver a pulsar reintenta **solo eso**. |
| 39 | **cumplido en el cableado; el recorrido real es del usuario** | Todo lo que hace falta para armar un día entero está **en la misma pantalla y sin navegar**: el primer minuto pone seis de golpe, el panel añade una a una y la hoja de la tajada 2 retoca. Ni un `Link` a `/app/vida/actividades` en el camino, salvo la salida explícita del catálogo vacío. **Que se pueda de verdad, de punta a punta con datos reales, solo lo cierra el usuario**: los agentes no entran a `/app/*`. |
| 40 | cumplido | Los cuatro estados, distinguidos y con su test: **cargando** (esqueletos + «Cargando tus actividades…»), **error** («No pudimos cargar tus actividades» + «Reintentar», y **no dice «todavía no tienes actividades»**), **catálogo vacío** («Todavía no tienes actividades», con la salida a crearlas) y **sin resultados** («Nada con ese nombre. Prueba con otra palabra.»). |
| 41 | cumplido, **medido en el navegador** | Arnés borrado, **375×812**, tema oscuro: `scrollWidth` **375 = clientWidth** y **cero elementos desbordando**, con la lista y **con el mini-formulario abierto**, incluso con un nombre de **50 caracteres**. Contraste en oscuro (compuesto sobre el fondo real, no sobre el token): el título **18,78:1**, la línea del criterio 34 y la del «Cabe» **9,94:1**, el contador y «Horas de partida» **5,5:1**, y lo peor de lo nuevo **5,01:1** — las píldoras de día y las filas **no elegidas**, que usan `--color-text-muted` sobre vidrio, el mismo tratamiento que ya tenían las píldoras de `VidaStartingPoints` desde FEAT-002. Pasa AA de texto normal, pero **es el número más bajo de esta tajada y va dicho**. |

**Lo que no se puede cerrar desde aquí, y no lo disimulo:** **ninguna llamada
real al API**. En particular, **el riesgo concentrado de esta tajada**: que el
servidor acepte **dos `VidaItem` de la misma actividad**. El análisis del repo
hermano dice que sí (no hay índice único por usuario+actividad) y en este repo
nada asume lo contrario, pero **nunca se ha probado contra el servidor vivo** y
por eso es **el primer paso del recorrido manual**. Tampoco he visto nunca
`vidaItemCreate` responder desde esta pantalla, ni la deduplicación del criterio
37 contra un catálogo real, ni Hoy releyendo la plantilla después de añadir.

**Decisiones mías, fuera de lo que decía el plan, todas revertibles:**

1. **`VidaStartingPoint` gana un tercer campo, `scheduleRecommended`.** El plan
   decía dos (`startTime`, `durationMinutes`), pero el catálogo marca **seis** de
   salida y el primer minuto de la plantilla marca **tres** (criterio 36). Va
   explícito en los datos, y no «los tres primeros por hora», para que añadir un
   punto más temprano no cambie el arranque sin que nadie lo pida.
2. **«Cocinar» pasa a llamarse «Cocinar y almorzar».** Lo nombran así el criterio
   36, el marco D y la agenda del marco A. **Es un cambio en datos de FEAT-002**:
   el catálogo también lo enseñará así. Si se prefiere el nombre corto, es una
   línea — pero entonces el criterio 36 deja de cumplirse al pie de la letra.
3. **El resultado del hook crece a `{ created, reused, done, failed }`.** Con la
   deduplicación, «creadas» dejó de ser la medida de «qué quedó hecho»: una
   reutilizada cuenta igual. `done` va **por id de punto**, que es lo que el
   componente necesita para desmarcar. Y el catálogo, cuando **todas ya
   existían**, dice **«Ya las tenías en tu catálogo»** en vez de «Ya tienes 0
   actividades».
4. **La hora del mini-formulario arranca vacía**, no en las 18:00 del render.
   Poner una hora por defecto sería inventarle un plan al usuario; en cuanto
   escribe una, aparece la línea del criterio 33. Si se prefiere una sugerencia,
   es una línea.
5. **«Volver» dentro del mini-formulario** (vuelve a la lista sin guardar), con
   el vocabulario de la casa: ni «cancelar» ni «descartar».
6. **El enlace del criterio 35 va al lado de la línea, no dentro.**
   `multipleItemsNote` es un `string` —así lo dejó la tajada 2— y meterle un
   enlace dentro obligaría a partir la frase en dos props. La hoja pinta la línea
   literal **y** un enlace «Ir a Plantilla».
7. **En escritorio el «+» se apaga** (la media query). Con el panel al lado sería
   una segunda puerta a lo mismo.
8. **La frase «No hace falta llenarla entera. Empieza por tu mañana» la pone la
   página**, no `VidaStartingPoints`: si no, se leía dos veces en la plantilla
   vacía. En el catálogo el cartel sigue diciendo su frase de siempre.

**Lo que descubrí y no estaba en el plan (y no toqué):**

- **`useCreateStartingActivities` nunca miraba el catálogo**, así que el primer
  minuto **del catálogo** podía crear un segundo «Bañarme». Queda arreglado, y es
  el «efecto de rebote» que el propio arquitecto avisó: **es un cambio en algo
  entregado**.
- **El panel sin sesión diría «Todavía no tienes actividades»** si alguien lo
  montara suelto: la consulta queda `idle` y no hay forma de distinguirlo del
  vacío. Hoy **no pasa**, porque la página corta antes con su estado «Entra para
  ver tu plantilla». Lo dejo dicho, no lo arreglo.
- **`pnpm typecheck` volvió a dejar pasar lo que `pnpm build` cazó** (un
  `ActivityPriority` en un test). Es exactamente la trampa que el
  `ENVIRONMENT.md` describe; el build es el que manda.
- **El servidor de dev del usuario arrastraba errores de HMR** de los archivos que
  fui tocando (500 y «Failed to reload»). Se resolvió recargando la pestaña; si
  vuelve a verse, es el servidor viejo, no el código.
- Sin tocar: `findVidaItemForActivity`, `buildVidaItemsByActivity`,
  `usableTemplateItems`, `vida-agenda.utils.ts`, `vida-build-day.utils.ts`,
  `VidaDayBudget`, `VidaAgendaBlock`, `graphql/`, `api/`, `types/`, `routes/`,
  `app-nav.config.ts`, `src/shared/ui/`.

**Tres afirmaciones de tests anteriores quedaron derogadas, no borradas:** la de
«no se pinta ni un botón de las tajadas 3 y 4» (ahora afirma solo lo de la
tajada 4), la de que el día vacío ofrece **un enlace** al catálogo (ahora abre el
panel **sin salir**) y la del mock de `VidaStartingPoints`, que pasó al contrato
nuevo del hook. Ninguna afirmación de producto de FEAT-002 se debilitó: el cartel
**sin `schedule`** sigue pintando los trece puntos, con «Crear las 6» y sin días.

**La línea base, corrida entera al terminar:**

| Qué | Antes (tajada 2) | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** (exit 0) |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos archivos |
| `pnpm test` | 2 fallos de 1230 | **2 fallos de 1259** (los dos de `SearchSelect`; **+29 tests**, 1 archivo rojo de 101) |
| `pnpm build` | inicial 982,95 kB · `app-icons` 620,20 · `IconPicker` 4,64 | **exit 0**, inicial **994,33 kB** (+11,38 kB, **ninguno de iconos**), `app-icons` **620,20** e `IconPicker` **4,64** clavados; CSS 214,66 kB |

`graphify update .`: **3380 nodos, 3918 aristas, 479 comunidades**.

**El recorrido manual, para el usuario** (con la API despierta —Render tarda
~1 min— y la sesión iniciada). **El primer paso es el que más importa: es lo
único de esta tajada que nunca se ha probado contra el servidor.**

1. En **Vida → Plantilla**, con una actividad que **ya esté** en tu plantilla:
   ábrela en «Añadir a mi Vida» («**+ Otra hora**»), ponle **otra hora** y guarda.
   **Tienen que quedar las dos** —la de siempre y la nueva— en su día. Si el API
   se queja, para aquí y dímelo: es el riesgo de la tajada.
2. Abre **la primera** y cámbiale la hora: la otra **no se tiene que mover**.
3. Busca **«banar»** (sin tilde) y comprueba que encuentra «Bañarme»; busca algo
   que no exista y lee **«Nada con ese nombre»**.
4. Añade una que **no estaba**: días, hora y cuánto, **«Añadir a mi Vida»**.
   Tiene que aparecer en el día sin recargar.
5. Mira la línea **«Cabe: …»** con una hora ocupada y con una libre: tiene que
   **decirlo y dejarte guardar igual**.
6. En una actividad que **tenga dos horas**, entra en **`/app/vida/actividades`**
   y ábrela: la hoja tiene que avisar **«tiene 2 horas en tu plantilla»** con el
   enlace a Plantilla.
7. En **móvil**: el **«+»** de abajo a la derecha abre el mismo panel; en
   escritorio no está y el panel va al lado.
8. **El primer minuto** (hace falta una cuenta con la plantilla vacía, o quitar
   todo lo que haya): comprueba los **seis puntos con hora**, los **tres
   marcados**, los días **de lunes a viernes** y **«Ponerlas en mi plantilla»**.
   Al terminar, el día tiene que verse armado.
9. Y dentro de eso, **lo del criterio 37**: si ya tenías una actividad llamada
   igual que un punto de partida (por ejemplo «Bañarme»), **no se tiene que
   duplicar** — mira `/app/vida/actividades` después.
10. Vete a **Hoy** sin recargar: los huecos y «Armar desde la plantilla» tienen
    que ver lo añadido, y un día **ya armado** tiene que seguir igual.

## 4. Review — feature-reviewer

### Tajada 1 — la plantilla se ve (criterios 1–15)

**Veredicto: `accepted`.** Los quince criterios se cumplen; **no encontré
ninguna regresión**; la línea base la corrí entera yo; y las siete decisiones que
el constructor tomó fuera del plan me parecen las correctas —las dejo escritas
una a una abajo, con la única que el usuario podría querer del revés señalada—.
Lo que **no** puedo cerrar desde aquí es lo de siempre y lo digo sin adornos:
`/app/*` está detrás del login (`ENVIRONMENT.md`) y **nadie ha visto esta
pantalla con datos de verdad**.

**Cómo lo comprobé, y qué es de segunda mano.** Mi medida propia fue **la capa
pura**, con un arnés de tests que escribí y borré
(`src/features/vida/utils/zz-rev-f5.test.ts`, 8 casos): ahí están el 100 % de la
barra, el orden, «sin duración», las cuentas y la frase de guía. Lo de
**pantalla** —las siete pestañas, el teclado, los esqueletos, el cajón— lo
verifiqué **leyendo el código de la página y los tests del constructor**, que
corren **en verde en mi propia corrida entera** (101 archivos, el único rojo es
`SearchSelect`). Los **375 px y el tema oscuro** son medida del constructor en
un arnés de navegador que ya borró: **yo no los volví a medir**, y así queda.

| # | Veredicto del revisor | Cómo lo comprobé |
|---|---|---|
| 1 | cumplido | `PageHeader title="Tu plantilla"` con su línea. **Y lo que importa de verdad aquí**: `git diff --name-only` sobre `app-nav.config.ts`, `vida.routes.tsx`, `vida-paths.ts` y `src/shared/ui/Tabs/` devuelve **cero archivos**. La píldora del módulo sigue diciendo «Plantilla» y el `⌘K` sale de ahí: **no se rompe**. |
| 2 | cumplido | El día que se abre es **hoy** por construcción: `useState(getVidaDayOfWeek(getCurrentLocalDate()))`, leído en la página. Siete `role="tab"` sobre `@/shared/ui/Tabs` (no se reescribieron pestañas), con `aria-selected`, subrayado y peso —tres señales, no solo color— y el teclado es el del componente compartido, con su test. |
| 3 | cumplido | El punto es `data-state="some" \| "none"`, **decorativo**, y lo que se lee en voz alta va en el texto oculto de la pestaña, como en `VidaDayStrip`. |
| 4 | cumplido, **medido por mí** | Los tramos suman **el día entero (990 min)** con el horario por defecto, y **con dos ítems pisados** (09:00+60 y 09:30+60) lo «puesto» son **90 min, no 120**: el mismo `trackMinutes` que salvó a FEAT-003. La barra es `aria-hidden` y los minutos se leen como texto. |
| 5 | cumplido, **medido por mí** | Con los datos del render sale **la frase del render**. Un hueco de **40 min no se nombra** («Dos cosas con hora. Tu viernes está lleno por la tarde.») y uno de verdad sí («libre de 12:00 a 19:00»). Ninguna variante trae palabra de culpa (barrí seis). Con todo en el cajón: «Todavía nada con hora y dos sin ellas.» Con el día vacío: «El viernes no tienes nada puesto.» |
| 6 | cumplido, **medido por mí** | Orden **por hora y, a igual hora, por nombre**: Bañarme 07:00 → Correr 07:00 → Pasear 19:00. Icono y color salen de la categoría que ya viaja en el ítem, **sin consulta extra**. En el DOM **no hay ningún control de orden**. |
| 7 | cumplido, **medido por mí** | `durationMinutes` a **0 y a −30** no aportan un solo minuto a la barra y la meta se lee «sin duración · L X». Nunca «0 min». |
| 8 | cumplido | El desactivado se pide (`includeInactive: true`), **se queda en su hora** en trazo suave con «desactivada · no sale en Hoy», y **no se pinta «Activar»** (eso es el criterio 26). Comprobé además que una actividad **archivada** sí desaparece: coherente con que «Armar desde la plantilla» tampoco la ofrece. |
| 9 | cumplido | Cajón al final con su rótulo, su cuenta y la explicación **literal** del criterio; sin ítems sin hora, **no se pinta**. Sin «Ponerle hora» (criterio 25). |
| 10 | cumplido **en la mitad que reparte el plan** | El texto del marco D, «Empieza por tu mañana», «Traer de tus actividades» con la cuenta real **sin archivadas**, y la línea que quita la presión. Los seis puntos de partida son de la tajada 3 y **no los doy por cerrados**. |
| 11 | cumplido | El día vacío se dice sin reproche y ofrece salida, y las siete pestañas siguen ahí. |
| 12 | cumplido | Leído en la página, y es lo que pedía el encargo: los estados están **en orden y separados** —sin sesión → esqueletos con `aria-busy` → **`itemsQuery.isError` corta antes de pintar nada** y enseña «No pudimos cargar tu plantilla» con «Reintentar» que llama a `refetch`—. **El fallo de los ítems no puede disfrazarse de plantilla vacía**: la rama de error devuelve antes. Y el fallo de **las horas de Vida** no rompe nada: `useVidaDayHours` cae a **06:30/23:00** con `isDefault`, que la pantalla usa para decirlo. |
| 13 · 14 | cumplidos **de segunda mano** | Medidos por el constructor en el navegador (375 px sin desbordes, nombre de 60 caracteres en una fila con la hora visible, y 9,5:1 en lo peor del oscuro). **No los volví a medir**: lo digo como lo que es. |
| 15 | cumplido | `vida-vocabulary.test.ts` verde en mi corrida entera —el `glob` ya cubre los archivos nuevos—, y las frases de guía las barrí yo mismo buscando culpa. |

**Los puntos de ojo del encargo, uno a uno**

- **El acople con `Tabs`: lo doy por bueno.** El ajuste vive en
  `VidaTemplateDayTabs.module.scss` bajo `.root [role='tablist']` y
  `.root [role='tab']`, o sea **dentro de una clase de CSS-module** que solo
  existe en esta pantalla: no puede alcanzar a `HabitDetailPage`, que es el otro
  —y único— consumidor de `Tabs`. `src/shared/ui/Tabs/` está **sin tocar**
  (cero archivos en el diff). El acople es real en la otra dirección —si alguien
  cambia el cromo compartido, esta pantalla lo nota— y está escrito donde se ve.
  Con siete pestañas y 375 px, la alternativa era cambiar el componente
  compartido para todos: esto es menos invasivo.
- **Los dos tests ajenos: acotados, no borrados.** En `vida.routes.test.tsx` la
  lista de cascarones **conserva `revision`** y `plantilla` sale de ella con un
  comentario que dice por qué, **y entra un test nuevo** en su lugar (sin sesión,
  la vía para entrar). En `AppLayout.test.tsx` **la afirmación de la píldora
  sigue intacta** («Plantilla» en el nav) y solo cambia el título de la pantalla.
  Es exactamente lo que se hizo con Hoy en FEAT-003.
- **Las tres reglas de una línea, contrastadas: las tres valen.** *Hueco
  nombrable desde 90 min*: el criterio 5 exige no afirmar un hueco que no lo sea
  y no da número; con 90 sale la frase del render y no se escribe «libre de 13:00
  a 13:20» — **lo medí**. *«Lleno por la mañana» pide más de la mitad, con `>`*:
  con 60 y 60 no se afirma ninguna parte, que es lo correcto cuando elegir sería
  elegir por el orden de lectura. *El desactivado cuenta en la pestaña y en la
  frase*: es coherente con que **se pinta** (criterio 8) — y es la única de las
  tres que el usuario podría querer del revés; queda dicha como filtro de una
  línea.
- **La ventana por día, anotada para la tajada 4.** Confirmado en mi arnés: con
  un ítem a las 05:00 y el día de Vida empezando a las 06:30, la ventana se
  estira a **5:00–23:00** y el resumen pasa a decir **«de 18h»** en vez de «de
  16h 30». La aritmética sigue cuadrando (suma exacta de la ventana), pero **dos
  días pueden tener ventanas distintas**: para la cuadrícula de la tajada 4 hace
  falta **una sola ventana para las siete columnas**, o las columnas no se podrán
  comparar. Queda como el aviso número uno para esa tajada.

**Las otras decisiones del constructor, juzgadas:** «· N ya con días puestos»
solo si N > 0 (correcto: en una plantilla vacía ese número es necesariamente 0 y
escribirlo sería ruido); la frase de guía que no describe la forma de un día sin
ninguna hora (correcto: «libre de 6:30 a 23:00» es cierto y no aporta); y el día
vacío que no repite la misma frase dos veces (correcto). Ninguna toca un
criterio.

**Regresiones: qué miré y cómo.** El diff **no sale de `src/features/vida/`**
salvo el test de `AppLayout`, y los cuatro componentes nuevos solo los monta
`VidaPlantillaPage` (grep sobre `src/`). No se duplicó nada: `trackMinutes` es
el patrón de `vida-agenda.utils.ts` aplicado a otro dominio, no una copia de
`buildDayAgenda`; `usableTemplateItems`, `buildVidaItemsByActivity`,
`vida-build-day.utils.ts`, `graphql/`, `api/` y `types/` están **sin un
carácter** de diferencia. **Ningún documento GraphQL, ninguna clave de caché,
ninguna ruta, ningún `localStorage`** (cero coincidencias en el diff de `src/`) y
**ni un `free-solid-svg-icons` a pelo** en lo nuevo: el build lo confirma, con
`app-icons` e `IconPicker` **idénticos**.

**Línea base, corrida entera por mí**

| Qué | Resultado |
|---|---|
| `pnpm typecheck` | **exit 0**, limpio |
| `pnpm lint` | **14 errores / 0 warnings**, los preexistentes |
| `pnpm test` | **2 fallos de 1200** (los dos de `SearchSelect`; **1 archivo rojo de 101**) |
| `pnpm build` | **exit 0** · chunk inicial **976,49 kB** · `app-icons` **620,20 kB** · `IconPicker` **4,64 kB** · CSS 207,06 kB |

**Un tropiezo mío, dicho:** mi primera corrida de `pnpm build` salió en rojo
**por mi propio arnés** (un `import` de `node:fs` en un `.test.ts`, que `tsc -b`
sí mira). Borré el arnés y volví a correr typecheck y build enteros: los dos en
verde, con los números de la tabla. **No hay nada del constructor en ese fallo**
— me pasó lo mismo revisando FEAT-004 y lo repito aquí para que quede el
aprendizaje: un arnés de revisión bajo `src/` **entra en el build**.

**Hallazgos anotados, ninguno devuelve**

1. **La ventana se estira por día** (arriba): el «de 16h 30» del criterio 4 deja
   de ser constante en un día con algo fuera del horario. Correcto en aritmética,
   **problema de comparabilidad para la tajada 4**.
2. **Si falla solo la consulta de los ajustes de Vida**, la pantalla se pinta con
   06:30–23:00 y lo dice como «horario por defecto», pero **no dice que no se
   pudo leer el tuyo**. Es mejor que romperse; se leería mejor con un aviso.
3. **El desactivado cuenta en la cuenta de la pestaña**: decisión del
   constructor, a una línea de cambiarse cuando el usuario la vea.
4. **El acople por atributo con `Tabs`**: contenido y escrito, pero es un punto
   que se puede romper desde fuera sin que nadie lo note hasta verlo.

**Lo que no revisé, y no lo disimulo:** ni una llamada real al API, la pantalla
dentro de `/app/vida/plantilla` con datos de verdad, y los **375 px** y el **tema
oscuro** en un navegador —medidos por el constructor, no por mí—. El recorrido
manual de los diez pasos, al final de la sección 3, sigue siendo del usuario.

### Tajada 2 — la hoja del ítem (criterios 16–28)

**Veredicto: `accepted`.** La parte delicada de esta tajada no es la hoja: es que
**`planVidaItemSave` cambió de cuerpo** y esa función la comparte el catálogo de
FEAT-002, que está entregado. **La medí yo, caso por caso, con un arnés de tests
propio** (`src/features/vida/hooks/zz-rev-f5t2.test.ts`, 8 casos, **ya borrado**,
sin un solo `import` de `node:*`) y **el catálogo sin nota produce exactamente
las mismas mutaciones que antes**. Lo demás encaja, la línea base no empeora y no
encontré ninguna regresión.

**El punto 1 del encargo, que era el riesgo: medido**

| Qué comprobé | Resultado |
|---|---|
| **Crear** con el interruptor encendido y sin nota | `{ activityId, days }` **y nada más** — igual que antes. Con el campo pintado pero **vacío**, tampoco viaja `notes`. |
| **Apagar** el interruptor (con o sin nota guardada) | `{ id, isActive: false }` **y nada más**: la nota, la hora y los días se quedan donde estaban. Igual que antes. |
| **Editar sin pintar el campo** (`notes: undefined`) | El cuerpo **no lleva la clave `notes`**: lo verifiqué sobre las claves del objeto, no de vista. |
| **Guardar otra cosa con la nota cargada** | Viaja `notes: 'Con calma'` —el mismo valor que ya tenía—, así que **no se pierde nada**. |
| **Vaciar el campo a propósito** | `notes: null`: limpia, que es lo que se pide al vaciarlo. |
| **Sin tocar nada** | `nothing`, con y sin campo de nota: ni viaje ni toast de mentira. |

**Y aquí está la pieza que sostiene todo eso, que conviene que quede escrita:** la
hoja arranca el campo con `templateDraft?.notes ?? vidaItem?.notes ?? ''`, o sea
**precarga la nota del ítem**, y `notes` **sí está en la selección** de
`graphql/vida-items.graphql.ts`. Si algún día un documento dejara de pedir
`notes`, la hoja se abriría vacía y **guardar borraría la nota sin decirlo**. Hoy
no pasa; lo dejo como el punto frágil de esta decisión, no como un defecto.

**Las cuatro expectativas de FEAT-002 que cambiaron: justificadas.** Miré **todas
las líneas borradas** del diff (`git diff 8fe0b19 -- src/ | grep '^-'`): lo único
que se toca en los tests heredados es el **renombrado `item:` → `targetItem:`**,
que es el cambio de contrato de A3, y **no hay una sola afirmación de
comportamiento eliminada ni debilitada**. Ningún `expect` de payload desapareció.

| # | Veredicto del revisor | Cómo lo comprobé |
|---|---|---|
| 16 | cumplido | La tarjeta abre **la misma** `VidaActivitySheet` con props **aditivas** (`targetItem`, `multipleItemsNote`, las de la plantilla): no hay una segunda forma de editar un ítem en el repo. |
| 17 | cumplido, **medido por mí** | Con «Pasear» a las 7:30 y a las 19:00, guardar el de las 19:00 da `update` con **`id: 'i-tarde'`** y el `JSON` del plan **no contiene** el id del de la mañana. Y `targetItem: null` sobre una actividad que **ya tiene** ítem da **`create`** (lo que necesitará el criterio 34). |
| 18 | cumplido, **con la desviación dicha** | Días, hora, píldoras, minutos a mano, **nota** e interruptor. La nota **no existía** y por eso `planVidaItemSave` cambió de cuerpo contra el «sin cambios» del arquitecto: la desviación está escrita, es aditiva y **`notes: undefined` = «no se toca»** la hace inocua para quien no pinta el campo. |
| 19 · 20 | cumplidos | El interruptor con su explicación y la vista previa derivada de lo elegido («de 9:00 a 9:45», «Sin cuánto dura…», «no se reescriben solos»), con tests de pantalla. |
| 21 | cumplido | «Quitar de la plantilla» llama a **`useDeleteVidaItemMutation`** (`vidaItemDelete`, su primer uso) y **en ninguna ruta de la plantilla se nombra `activityRemove`**: la actividad se queda en el catálogo, y la confirmación lo dice. |
| 22 · 23 | cumplidos | El diálogo ofrece **«Quitarlo solo del viernes»** —que **no borra nada**: es `update` con los días restantes— y «Quitarlo de los N días» —`delete`—. Con un solo día queda **una sola salida** («Quitarlo»), y `removeDay` **corta en seco** si no quedan días: el mínimo del API no se toca desde aquí. |
| 24 | cumplido | Guardar cierra en el `onSuccess` local y el fallo deja la hoja abierta con lo escrito (mismo patrón que las hojas de FEAT-004). |
| 25 · 26 | cumplidos | «Ponerle hora» en el cajón abre la hoja; **«Activar» manda solo `{ id, isActive: true }`**, así que días, hora y nota se quedan como estaban — leído en la página. |
| 27 | **no se puede cerrar aquí** | La invalidación por prefijo de `items.all()` es lo correcto, pero que **Hoy lo vea sin recargar** solo se comprueba con el API despierta y sesión: queda para el usuario, y así lo dice el constructor. |
| 28 | cumplido **de segunda mano** | 375×812 con «Guardar» visible sin salir de la hoja: medido por el constructor en su arnés, **no por mí**. |

**Los otros puntos de ojo**

- **El diálogo de dos salidas afirmativas.** `useConfirmDialog` no admite dos, así
  que se usa `Modal` con tres botones. Es la razón correcta y el vocabulario
  aguanta: **«Volver»** (que no llama a ninguna mutación), «Quitarlo solo del
  \<día\>» y «Quitarlo de los N días». **Ni «cancelar», ni «eliminar», ni
  «borrar»** en toda la superficie nueva.
- **`multipleItemsNote`**: la prop existe, entra por defecto en `null` y solo
  pinta una línea; no rompe la hoja del catálogo. El aviso de verdad es el
  criterio 35, **tajada 3**, y **no lo doy por cerrado**.
- **El test de la tajada 1 quedó derogado y acotado, no borrado**: el mismo caso
  —«no se pinta nada que no funcione»— conserva las siete pestañas y cambia
  «cero botones» por «ni «+», ni «Ver la semana entera», ni «Copiar este día»»,
  con el porqué escrito encima. Es exactamente lo que se hizo con Hoy en
  FEAT-003.
- **`variant="danger"` ilegible en oscuro**: lo anoto como **hallazgo
  transversal** (abajo). Aquí se evitó usando `secondary`.

**Línea base, corrida entera por mí**

| Qué | Resultado |
|---|---|
| `pnpm typecheck` | **exit 0**, limpio |
| `pnpm lint` | **14 errores / 0 warnings** |
| `pnpm test` | **2 fallos de 1230** (los dos de `SearchSelect`; **1 archivo rojo de 101**) |
| `pnpm build` | **exit 0** · chunk inicial **982,95 kB** · `app-icons` **620,20 kB** · `IconPicker` **4,64 kB** · CSS 208,82 kB |

Sin `localStorage` nuevo (cero coincidencias en el diff de `src/`), sin Font
Awesome a pelo, y sin nada duplicado: la hoja es **la misma**, el orquestador es
**el mismo**, y `vidaItemDelete` es una mutación que ya existía sin estrenar.

**Hallazgos anotados, ninguno devuelve**

1. **Transversal: `Button variant="danger"` no se lee en tema oscuro** (1,7:1
   medido por el constructor). Aquí se esquivó con `secondary`, pero **ya está
   en pantalla en FEAT-003 («Vaciar y rehacer») y en FEAT-004 («Quitar del
   registro»)**: es un arreglo del sistema de diseño, con su propio alcance, no
   de esta tajada.
2. **La nota depende de que `notes` siga en la selección GraphQL** (arriba). Si
   un día deja de pedirse, guardar la borraría en silencio.
3. **El catálogo manda ahora `notes` en el `update`** aunque no haya cambiado
   —con el mismo valor que ya tenía—: inocuo y medido, pero el cuerpo de la
   mutación ya no es idéntico al de FEAT-002 y conviene saberlo si alguien lo
   compara contra un log del servidor.
4. **El criterio 27 queda al usuario**: es el único de la tajada que ningún
   agente puede cerrar.

**Lo que no revisé, y no lo disimulo:** ni una llamada real al API —ni un
`vidaItemDelete` de verdad—, los **375 px** y el **tema oscuro** en un navegador,
y la pantalla dentro de `/app/vida/plantilla` con datos reales. Sigue siendo el
límite del login.

### Tajada 3 — «Añadir a mi Vida» y el primer minuto (criterios 29–41)

**Veredicto: `accepted`.** El riesgo número uno era real —`useCreateStartingActivities`
lo comparte el catálogo de FEAT-002, que está **entregado**— y **lo medí yo con
un arnés propio** (`src/features/vida/hooks/zz-rev-f5t3.test.tsx`, 9 casos, **ya
borrado**, sin `node:*`), montando el hook con las tres APIs simuladas. **El
camino del catálogo no cambió de comportamiento**, la deduplicación nueva hace lo
que promete, y las afirmaciones ajenas que se tocaron están **acotadas con su
porqué**, no borradas.

**El riesgo nº 1, medido caso por caso**

| Qué comprobé (sin `schedule`, que es como llama el catálogo) | Resultado |
|---|---|
| Catálogo vacío | `createActivity({ title, categoryId })` y **`createVidaItem` no se llama ni una vez**: el catálogo sigue creando actividades y nada más. |
| Categoría que ya existe («Yo») | **No se crea otra**: el dedupe de categorías de FEAT-002 sigue intacto. |
| La actividad **ya existe** («bañarme», en minúsculas) | **No se crea un duplicado y no se modifica nada**: cero llamadas de creación y cero de actualización —el hook no tiene camino de update—, y la actividad aparece en `reused`. |
| La existente está **archivada** | **No se reutiliza**: se crea. Es lo correcto, porque un ítem de plantilla sobre una archivada no lo pinta nadie. |
| El catálogo **no se puede leer** | Se crea igual y **no se apunta ningún fallo**: como mucho nace una repetida, que es mejor que no poner nada. |

Y con `schedule` (lo nuevo): crea la actividad **y** su ítem con
`{ activityId, days, startTime, durationMinutes }`; si la actividad ya existía,
el ítem va **sobre la que había**; y si el ítem falla, **el punto cuenta como
fallido** aunque la actividad quedara creada, que es lo que sostiene el criterio
38.

**Los tests de FEAT-002 que cambiaron: acotados, no borrados.** Miré **todas las
líneas borradas del diff**: son el cambio de firma `mutate(points)` →
`mutate({ points })`, el renombrado de «Cocinar» y **dos afirmaciones de la
propia FEAT-005** —el «+» que la tajada 2 exigía ausente y el enlace «Traer de
tus actividades»—, las dos **derogadas con su comentario y reemplazadas por algo
más fuerte**: ahora se afirma que el enlace al catálogo **ya no está** y que el
botón «Añadir a mi Vida» **sí**, que es literalmente el criterio 29 («ninguno
navega a `/app/vida/actividades`»). Ninguna afirmación de comportamiento se
eliminó.

| # | Veredicto del revisor | Cómo lo comprobé |
|---|---|---|
| 29 | cumplido | El panel en el aside y el «+» flotante con la misma pieza dentro; en escritorio el «+» se apaga. **Nada navega al catálogo**: lo afirma el test que sustituyó al viejo. |
| 30 · 31 | cumplidos | Busca con el filtro que ya existía (sin tildes), agrupa por categoría, **excluye archivadas**, y cada actividad dice su estado con su acción. |
| 32 · 34 | cumplidos | Días, hora y duración **en el mismo panel**, y `targetItem: null` → **`create`** (medido en la tajada 2: el cuerpo no lleva `id`), que es lo que permite la segunda hora de «Pasear». |
| 33 | cumplido | `describeFitAt` **solo escribe una línea** —«a las 18:00 no tienes nada» / «…ya tienes X»— y el botón de guardar solo se inhabilita **mientras la mutación vuela**: el solape **no bloquea**, que es lo que pide el criterio. |
| 35 | cumplido | **`buildVidaItemsByActivity` y `findVidaItemForActivity` están sin tocar** (el diff de `vida-catalog.utils.ts` es **solo** la función nueva `buildVidaItemsByActivityAll`), y el catálogo pasa `multipleItemsNote` con su «Ir a Plantilla». |
| 36 | cumplido, **medido por mí** | Los **seis** puntos con hora son exactamente los del criterio y del render: Bañarme 07:00/15 · Pasear 07:30/40 · Desayunar con calma 08:30/30 · Organizar la casa 09:00/45 · Cocinar y almorzar 13:00/60 · Leer un rato 21:30/30. **Tres** llevan `scheduleRecommended`. |
| 37 | cumplido, **medido por mí** | La tabla de arriba: lo que ya existe **se reutiliza**, no se duplica. |
| 38 | cumplido | Comprobado en el arnés: el ítem que falla deja el punto fuera de `done` y dentro de `failed` con su motivo, para que la pantalla diga «Pusimos 2 de 3». |
| 39 | **del usuario** | Es el criterio de fase: dejar un día entero puesto sin salir de la pantalla. No lo doy por cerrado. |
| 40 | cumplido | Los cuatro estados están **separados** en el panel: esqueletos, **error con «Reintentar»** —y con el comentario de que no se dice «todavía no tienes actividades» sin saberlo—, «Nada con ese nombre» y catálogo vacío. |
| 41 | cumplido **de segunda mano** | 375 px y oscuro los midió el constructor; **yo no**. |
| 3 del encargo | cumplido | `scheduleRecommended` es **aditivo**: la lista sigue teniendo **13 puntos** y **seis `recommended`**, que es lo que pinta el catálogo. Su forma no cambió. |

**El punto 2 del encargo: «Cocinar» → «Cocinar y almorzar».** Es **correcto**:
lo pide el criterio 36 con esas palabras y es lo que dice el render. **Pero tiene
una consecuencia que hay que escribir**: como el dedupe compara **nombres
normalizados**, un usuario que ya hubiera estrenado el primer minuto **del
catálogo** antes de este cambio tiene «Cocinar» guardada, y desde ahora recibiría
**una segunda actividad** llamada «Cocinar y almorzar» en vez de reutilizar la
suya. **Alcance:** solo usuarios que ya usaron los puntos de partida de FEAT-002;
el efecto es **una actividad de más con otro nombre** —ni pérdida de datos, ni
duplicado exacto— y se arregla archivando una. No devuelve, y queda como
hallazgo con su alcance.

**Línea base, corrida entera por mí**

| Qué | Resultado |
|---|---|
| `pnpm typecheck` | **exit 0**, limpio |
| `pnpm lint` | **14 errores / 0 warnings** |
| `pnpm test` | **2 fallos de 1259** (los dos de `SearchSelect`; **1 archivo rojo de 101**) |
| `pnpm build` | **exit 0** · chunk inicial **994,33 kB** · `app-icons` **620,20 kB** · `IconPicker` **4,64 kB** · CSS 214,66 kB |

Sin `localStorage` nuevo (cero en el diff de `src/`), sin Font Awesome a pelo en
lo nuevo, y sin nada duplicado: el filtro de búsqueda, el hook de guardar y el de
los puntos de partida son **los que ya había**.

**Hallazgos anotados, ninguno devuelve**

1. **El renombrado de «Cocinar»** y su consecuencia para quien ya la tenía
   (arriba, con su alcance).
2. **Una consulta más en cada guardado de puntos de partida**: `loadCatalogByTitle`
   pide el catálogo fresco también en el camino del catálogo. Es lo que hace
   posible no duplicar; es un viaje más.
3. **Sin sesión, el panel diría «todavía no tienes actividades»** —lo dejó dicho
   el constructor—: la consulta deshabilitada se lee como catálogo vacío. No
   ocurre hoy porque la pantalla entera tiene su estado «sin sesión» delante,
   pero el panel solo no lo distingue.
4. **Heredado de FEAT-002:** las píldoras **no elegidas** quedan en **5,01:1** en
   oscuro. Pasa el mínimo, pero es el suelo de la pantalla.
5. Sigue abierto el **transversal de la tajada 2**: `Button variant="danger"` no
   se lee en oscuro.

**Lo que no revisé, y no lo disimulo:** ninguna llamada real al API —ni una
actividad creada de verdad, ni un ítem—, los **375 px** y el **tema oscuro** en
un navegador, y el **criterio 39**, que es del usuario: dejar un día entero
puesto sin salir de `/app/vida/plantilla`.
