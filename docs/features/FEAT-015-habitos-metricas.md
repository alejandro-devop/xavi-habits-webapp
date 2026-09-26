---
id: FEAT-015
title: Las métricas de un hábito — tu récord, dónde se te atraviesa y (luego) a qué hora
status: building
architect: yes    # solo para las tajadas 3 y 4; la 1 y la 2 cuelgan del panel que ya existe
area: features/habits, **API (xavi-platform-node)** en las tajadas 3–4
requested: 2026-09-22
updated: 2026-09-25
---

# FEAT-015 — Las métricas de un hábito

## 1. La petición — feature-analyst

**Resumen para quien venga detrás:** el usuario pide tres métricas al ver un
hábito —máxima racha, días en los que falla más y horarios— y **las dos primeras
ya están construidas y en pantalla**: el panel del hábito
(`HabitPanel`, dentro de `HabitDetailPage`) ya enseña el récord y ya reparte los
días por día de la semana. Lo que falta es más pequeño y más exacto de lo que
parecía: **cifras que el panel calcula y no enseña**, **un «día flojo» que hoy se
elige por cumplimiento y no por fallos** (y por eso puede llamar fallo a un día
sin registro), y **la hora, que no se puede hacer: un `HabitFollowUp` no tiene
hora**. La tajada 1 son las cifras que faltan, sin tocar el API.

**Qué problema resuelve:** el usuario quiere **entender su propio patrón de
fallo para poder actuar sobre él** —no quiere un número más—. Lo dijo él mismo al
ofrecerse a registrar la falla en el momento: lo que persigue es material para
analizar, no un marcador. Hoy el panel le cuenta **cuánto** cumple y **cuándo**
(qué día de la semana); no le cuenta **a qué hora** se le cae, que es donde vive
la mitad de las causas reales (la noche, la hora de comer, el hueco después del
trabajo).

**Para quién es:** para él, mirando un hábito concreto en su pantalla de detalle,
cada pocos días o cada pocas semanas. No es una pantalla de uso diario: es la que
se abre cuando algo no va y se quiere saber por qué.

**Palabras del usuario:**

> «necesito más métricas al ver un hábito: **máxima racha**, **días donde suelo
> fallar más**, **horarios**. Yo trataré de registrar la falla tan pronto la
> cometa para que analicemos patrones».

---

### Lo primero: qué hay ya, qué falta y qué no se puede — léelo antes que nada

Esto reparte la feature en dos mitades muy distintas y **manda sobre el alcance
entero**. Verificado en el código, con línea.

#### (0) Lo que YA está construido y en pantalla

El panel del hábito vive en `src/features/habits/components/HabitPanel/` y lo
monta `HabitDetailPage.tsx:185` con un selector de rango (30 / 90 / 365 días,
`DEFAULT_HABIT_PANEL_RANGE = 90`). Toda su aritmética es **pura y en cliente**,
en `src/features/habits/utils/habit-panel.utils.ts`, sobre los seguimientos que
ya devuelve `habitFollowUpsInDates`. **No hay backend detrás de nada de esto.**

| Lo que pidió el usuario | Estado hoy | Dónde |
|---|---|---|
| **Máxima racha** | **Ya se enseña**, como texto de apoyo de la ficha «Racha actual»: «Tu récord son N días» | `HabitPanelTiles.tsx:35-39`, leyendo `habit.maxStreak` (`habit.types.ts:43`) |
| **Días donde suelo fallar más** | **Ya se enseña**, como reparto por día de la semana con un «día más flojo» señalado | `buildWeekdayBreakdown` (`habit-panel.utils.ts:266`), `getWorstWeekday` (`:292`), `HabitWeekdayChart` |
| **Horarios** | **No se puede**: no existe el dato | — |

Y además, ya construido y no pedido: episodios de racha
(`buildStreakEpisodes`), «veces que volviste» (`countComebacks`), cumplimiento
semanal con tendencia frente al periodo anterior (`buildWeeklyCompliance`,
`composeReading`), serie de dificultad (`buildDifficultySeries`) y cantidad
frente a objetivo (`buildGoalSeries`).

**Consecuencia para quien construya: aquí no se estrena casi nada. Se corrige y
se completa lo que ya hay.** Crear un `habit-metrics.utils.ts` nuevo al lado de
`habit-panel.utils.ts` sería construir por segunda vez lo que ya está probado
(`habit-panel.utils.test.ts`, 11 bloques de `describe`).

#### (1) Lo que falta y SÍ se puede hacer hoy, sin tocar el API

Cuatro huecos reales, todos derivables de lo que ya llega:

1. **El récord no se lee como una cifra.** `maxStreak` es hoy una frase de apoyo
   debajo de otro número. El usuario lo pidió como métrica; hoy tiene el rango
   visual de una nota al pie.
2. **Hay dos «rachas máximas» y pueden discrepar.** `habit.maxStreak` es el
   récord **de toda la vida del hábito** (lo mantiene el servicio de
   sincronización del API junto a `streak` y `days`); `buildStreakEpisodes`
   calcula los episodios **del tramo elegido**. Con el rango en 30 días, el
   episodio más largo del tramo puede ser 6 y el récord 21. **Presentar el
   episodio del tramo como «tu récord» sería mentir**, y es el error más fácil
   de cometer al tocar esto.
3. **Dos cifras que el panel calcula y tira a la basura:**
   `buildRangeSummary` devuelve `lifelines` (`:189`) y no hay ninguna ficha que
   lo enseñe —cuántas veces se usó el salvavidas en el tramo—; y
   `buildWeeklyCompliance` calcula `avgDifficulty` por semana (`:244`) pero
   **no hay dificultad media del tramo** en ninguna parte.
4. **El «día flojo» no es el día donde más se falla.** `getWorstWeekday` elige
   por `percent`, que es `covered / total` (`:200`), donde `covered` =
   cumplidos + salvavidas. Es decir: **un día sin registrar cuenta exactamente
   igual que un día fallado.** Si el usuario se olvidó de marcar tres domingos,
   el panel le señala el domingo como su punto flaco **sin que haya fallado
   ninguno**. `WeekdayStat` ya separa `failed` de `untracked` (`:260-261`): el
   dato está, la elección no lo usa. Esto es, literalmente, lo que el usuario
   pidió —«días donde suelo fallar más»— y hoy el panel contesta otra pregunta.

#### (2) Lo que NO se puede hoy, y manda sobre el alcance: la hora

**Un `HabitFollowUp` tiene `date` y no tiene hora** (`habit.types.ts:63-76`).
Por rápido que el usuario registre la falla, **el sistema no guarda a qué hora la
registró**: se guarda el día y nada más. La promesa del usuario —«registraré la
falla tan pronto la cometa»— **hoy no produce ningún dato nuevo**; el esfuerzo
se perdería entero.

**Falso amigo, y hay que decirlo sin ambigüedad:** el campo **`time` del
seguimiento NO es una hora del reloj**. Es la **duración en minutos** de un
hábito de tipo `time`: viaja junto a `count` como magnitud del día, se compara
contra `timerGoal` / el objetivo diario en `buildGoalSeries`, y su unidad se
imprime como `'min'` (`HabitPanel.tsx:55-58`, `measureUnit`). Quien construya
las tajadas 3–4 **no debe reutilizar `time`, ni ampliarlo, ni interpretarlo**:
es el error que rompería en silencio los hábitos de tiempo ya registrados.

#### (3) El cambio que necesita el API, campo a campo

Repositorio **`xavi-platform-node`**. **El despliegue lo hace el usuario.** Es un
cambio **aditivo**: nada existente cambia de forma ni de comportamiento. Se pide
hoy porque es asíncrono y bloquea las tajadas 3 y 4 (y solo esas).

En el tipo **`HabitFollowUp`** y en los inputs **`HabitFollowUpAddInput`** y
**`HabitFollowUpEditInput`** (los tres ya existen; el cliente los tiene en
`src/features/habits/types/habit.types.ts:63`, `:148` y `:161`):

| Campo | Tipo | Nulo | Qué es |
|---|---|---|---|
| `timeOfDay` | `String` (`"HH:mm"` local, 24 h) | sí, **por defecto `null`** | La hora del reloj a la que ocurrió/se registró ese día. |

**Un solo campo. Ni dos, ni una entidad nueva.**

Seis reglas para quien lo implemente, por orden de lo fácil que es incumplirlas:

1. **No tocar `time` ni reutilizarlo.** Ver el falso amigo de (2): `time` es
   duración en minutos. `timeOfDay` es un reloj de pared. Son cosas distintas y
   conviven en la misma fila.
2. **Sin `DEFAULT` y sin backfill.** La columna nace `NULL` y las filas
   existentes se quedan `NULL`. Un `DEFAULT '00:00'` fabricaría un pico falso a
   medianoche en la métrica y **nadie lo notaría hasta tenerlo pintado**. El
   cliente trata `null` como «sin hora», nunca como medianoche.
3. **Cadena local, sin zona horaria y sin convertir a UTC.** Mismo trato que
   ya reciben en este API `UserSettings.vidaNightBedTime` y el `startTime` de
   `activityFollowUpStart` (FEAT-012 y FEAT-013, ya desplegadas): se guarda y se
   devuelve **la misma cadena**. Si se almacena como `time` de SQL o como
   `varchar(5)` lo decide quien implemente, pero el ida y vuelta tiene que ser
   idéntico.
4. **La única validación es el formato** `HH:mm` entre `00:00` y `23:59`. **No**
   se valida contra la `date` del seguimiento, **no** se rechaza una hora futura
   y **no** se exige que haya `isFailed`: la hora vale para cualquier
   seguimiento (D2).
5. **Aceptarlo también en `HabitFollowUpEditInput`**, para poder corregirlo
   después (D1). `HabitFollowUpAddInput` solo, no basta.
6. **Devolverlo en TODAS las selecciones del seguimiento**, y muy en especial en
   la consulta por fechas. Hoy hay **dos formas distintas** del mismo objeto:
   `FOLLOW_UP_FULL_FIELDS` (`habit-follow-ups.graphql.ts:1-14`) trae los doce
   campos, y el sub-objeto de `habitFollowUpsInDates` trae **una lista recortada,
   sin `story` ni `archived`** (`habit.types.ts:104-118`). **El panel se
   alimenta de la recortada.** Si `timeOfDay` se añade solo a una, la métrica de
   horas saldrá siempre vacía y parecerá un fallo del cliente.

**Lo que NO se pide**, y conviene decirlo para que nadie lo añada de propina:
segundos, zona horaria, una entidad «registro de fallo» aparte, un endpoint de
agregación (la métrica se deriva **en cliente**, como todo el panel), ni una hora
**planeada** en el `Habit` —«a qué hora pensabas hacerlo» es otra feature y otra
conversación—. Y el **servicio de sincronización de rachas** del API (el que
mantiene `streak`, `max_streak` y `days`) **no se toca**: esta feature lo lee, no
lo escribe.

---

**Dónde viven estas métricas:** **en el panel del hábito que ya existe**, dentro
de `HabitDetailPage` (`:185`). **No hay ruta nueva, ni pantalla nueva, ni
entrada en el menú, ni nada en el panel de «Mi Día».** Las cifras nuevas son
fichas más en `HabitPanelTiles`; el reparto por día de la semana es el
`HabitWeekdayChart` que ya está; la lectura de horas será **un gráfico más en la
rejilla de `HabitPanel.tsx:207-219`**, junto a sus hermanos. Reutilizar antes que
inventar, y aquí hay mucho que reutilizar.

**Cuántos datos hacen falta para que una métrica hable:** el panel ya tiene esta
costumbre (`MIN_DAYS_FOR_TREND = 14`, `MIN_DAYS_FOR_PREVIOUS = 7`, y
`getWorstWeekday` devuelve `null` si hay menos de dos días medidos o si todos van
igual). Se extiende con la misma regla dura de Vida —**el sistema no finge un
número: dice cuánto le falta**—:

- **Un día de la semana solo se nombra** si tiene **≥ 4 apariciones con registro**
  en el tramo (≈ cuatro semanas) **y** hay al menos **dos** días de la semana que
  lleguen a ese umbral. Con menos, se dice qué falta: «De los martes hay 2
  registrados; con 4 ya se puede comparar».
- **Una banda horaria solo se nombra** con **≥ 5 seguimientos con hora** en el
  tramo. Con menos, se dice cuántos hay y cuántos faltan.
- **Nunca se rellena un hueco con un cero.** Un día sin registro es «sin
  registro», y se dice así.

**Ni una palabra de reproche — y aquí es más delicado que en Vida**, porque esto
es literalmente una pantalla sobre dónde se falla. La regla vieja del proyecto
(la identidad se gana, no se declara, y **nunca se le recuerda al usuario cuando
falla**) se traduce aquí en tres reglas de redacción:

1. **El número va delante y el adjetivo detrás, o no va.** «De 6 martes,
   salieron 2» es un hecho. «Los martes se te dan mal» es un veredicto. La forma
   permitida es el hecho con su cuenta cruda; si se añade un comparativo, es
   **sobre el día, no sobre la persona**, y siempre acompañado de la cuenta:
   «Los martes es donde menos veces ha salido: 2 de 6».
2. **Se habla del hábito y del día, nunca de quién eres ni de lo que sueles
   hacer.** Nada de «sueles», «siempre», «nunca», «otra vez», «ya van N».
3. **Cero imperativos y cero consejos.** El panel informa; no propone, no
   corrige y no anima. (En Vida sí se proponen cosas, pero eso pasa **al
   planear**, no al mirar atrás.)

**Frases prohibidas, literalmente** (y sirven de lista de comprobación para el
revisor): «sueles fallar», «tu punto flaco», «tu peor día», «incumpliste»,
«fallaste», «no lo lograste», «deberías», «intenta», «ánimo», «llevas N días
sin», «vas peor». **La última ya está escrita en el código**: `composeReading`
dice hoy «**Vas peor** que en el periodo anterior…» (`habit-panel.utils.ts:421`)
y es exactamente el veredicto que la regla prohíbe. Se cambia en la tajada 2 por
la comparación sin juicio, con las dos cifras que ya trae.

**Si esto se conecta con lo que ya sabe hacer Vida:** **la forma sirve de molde,
el código no.** FEAT-007 (`vida-patterns.utils.ts`, `vida-adherence.utils.ts`)
fijó el patrón que aquí aplica: **derivados puros en cliente sobre una ventana de
N semanas, con umbral explícito, que devuelven `null` en vez de inventar, y con
la frase compuesta por reglas**. Eso es lo que se copia. **Lo que no se copia es
el código**: es otro módulo, otro dato (plan frente a real, con horas de
verdad) y **hábitos ya tiene su propio ejemplar de ese molde, más cercano y ya
probado: `habit-panel.utils.ts`.** La referencia a imitar es esa, no Vida.

**Y la premisa que manda sobre todo (docs/vida/PLAN.md, «La premisa que manda
sobre todo lo demás»), que aquí aplica entera:** registrar no puede costar más
que hacerlo, y **una intención, una acción**. El usuario se ofreció a registrar
la falla en el momento. Si para que quede la hora tiene que abrir un
desplegable, elegir «22:15» y confirmar, **eso es un defecto de la feature, no
una salida aceptable**: la hora la pone el sistema en el mismo toque con el que
hoy se marca el fallo, y quien quiera corregirla, la corrige después. Un camino
de dos pasos para el registro de la falla **devuelve la tajada**.

---

**Fuera de alcance:**

- **Comparar hábitos entre sí** o cualquier ranking («tu hábito más flojo»).
  Esto es el panel de **un** hábito.
- **Métricas en «Mi Día», en la lista de hábitos o en un panel global.** No se
  toca `HabitMyDayMetrics` ni `HabitsWidget`.
- **Nada en el módulo Vida**, en ninguna dirección. Ni la hora del hábito
  aparece en la agenda, ni la agenda alimenta estas métricas.
- **Causas del fallo**: no se analizan `notes` ni `story`, no se pide un motivo
  y no se propone ninguno.
- **Correlaciones** entre hábitos, entre dificultad y hora, o entre clima y nada.
- **Predicciones, objetivos, metas sugeridas o rachas proyectadas.**
- **Avisos, recordatorios o notificaciones** salidos de estos patrones. El panel
  no habla fuera del panel.
- **Un mapa de calor hora × día de la semana.** La tajada 4 son bandas horarias;
  cruzar las dos dimensiones necesita mucho más dato y es otra conversación.
- **Exportar o compartir** las métricas.
- **Rellenar la hora de los seguimientos ya guardados** (D4), ni a mano ni
  adivinándola.
- **Editar en masa** seguimientos pasados para ponerles hora.
- **Una hora planeada** en el hábito («a qué hora pensabas hacerlo») y, por
  tanto, cualquier comparación plan/real de hora. Es otra feature.
- **Tocar el servicio de rachas del API.** `maxStreak` se lee tal cual llega.

**Criterios de aceptación:**

*Tajada 1 — las cifras que faltan*

- [ ] 430. En el panel de un hábito, **«Tu récord» es una cifra propia** con el
  mismo peso visual que «Racha actual», no un texto de apoyo. Dice los días y
  **no inventa una fecha**: en ningún sitio se afirma cuándo ocurrió ese récord
  (el dato no existe en el cliente).
- [ ] 431. **El récord y el tramo no se confunden.** Con el rango en 30 días y un
  hábito cuyo `maxStreak` sea mayor que cualquier episodio del tramo, la cifra de
  «Tu récord» sigue siendo `habit.maxStreak` y el gráfico de episodios **no**
  llama «récord» a su episodio más largo. Comprobable con un hábito de
  `maxStreak: 21` y un tramo cuyo mejor episodio sea 6: en pantalla aparecen 21 y
  6, cada uno con su nombre, y ninguno se presenta como el otro.
- [ ] 432. Si `streak` actual **es** el récord (`streak === maxStreak`), no se
  imprimen dos veces los mismos días como si fueran dos logros distintos: se dice
  una vez y se dice que es el mismo.
- [ ] 433. Hay una ficha **«Salvavidas usados»** con `summary.lifelines` del
  tramo y su rango («en los últimos 90 días»). Con cero, dice cero; no se oculta.
- [ ] 434. Hay una cifra de **dificultad media del tramo**, calculada solo sobre
  los días **con** dificultad registrada, y **dice sobre cuántos días se calcula**
  («media de 12 días con dificultad»). Si no hay ninguno, la ficha no aparece
  (misma regla que ya sigue el gráfico de dificultad, `HabitPanel.tsx:187`).
- [ ] 435. Ninguna de las cifras nuevas provoca **una consulta más**: todas salen
  de `buildRangeSummary` / `buildWeeklyCompliance` / `habit`, que ya están en
  memoria. Verificable con espía sobre la API: abrir el panel manda las mismas
  consultas que antes del cambio.
- [ ] 436. Las fichas siguen siendo `StatCard` y siguen en `HabitPanelTiles`:
  **no nace ningún componente de ficha nuevo**.
- [ ] 437. A 375 px las fichas no desbordan ni provocan scroll horizontal, con
  los números más largos posibles (récord de 3 cifras, `days` de 4 cifras).
- [ ] 438. **No nace `habit-metrics.utils.ts` ni ningún `utils` paralelo**: la
  aritmética nueva entra en `habit-panel.utils.ts`, junto a la que ya existe, y
  se prueba en su suite.
- [ ] 439. Los tests existentes de `habit-panel.utils.test.ts` y
  `HabitPanel.test.tsx` **no pierden ni una afirmación** (0 líneas de aserción
  borradas).

*Tajada 2 — dónde se falla, contado como fallos*

- [ ] 440. El reparto por día de la semana distingue, para cada día, **cumplidos
  / fallados / sin registro**, y los tres se pueden leer. Un día sin registrar
  **no se pinta como fallo** en ninguna parte.
- [ ] 441. **El día que se señala es el de más fallos, no el de menos
  cumplimiento.** Caso de prueba obligatorio: un hábito con 6 domingos **sin
  registrar** y 0 fallados, y 6 martes con 4 fallados. El panel señala **el
  martes**. Hoy señala el domingo, y eso es lo que esta tajada corrige.
- [ ] 442. Un día solo se nombra con **≥ 4 apariciones con registro** en el tramo
  y **≥ 2 días** que lleguen a ese umbral. Si no se llega, **no se señala nada** y
  se dice qué falta, con la cifra: «De los martes hay 2 registrados; con 4 ya se
  puede comparar».
- [ ] 443. Si **ningún** día destaca (todos iguales, o todos por debajo del
  umbral) el panel **no señala ninguno** y lo dice; no elige el primero por
  desempate silencioso.
- [ ] 444. La frase que señala el día **contiene la cuenta cruda** («2 de 6») y
  **no contiene** ninguna de las frases prohibidas de la lista de arriba.
  Verificable con un `grep` de esa lista sobre `src/features/habits/`: cero
  resultados.
- [ ] 445. **«Vas peor» desaparece.** `composeReading` compara sin veredicto,
  diciendo las dos cifras que ya calcula. `grep -rn "Vas peor\|Vas mejor"
  src/features/habits/` da **cero**.
- [ ] 446. El texto del panel **no contiene ningún imperativo ni consejo**: ni
  «intenta», ni «deberías», ni «ánimo».
- [ ] 447. Con el hábito recién creado (0 registros) el panel sigue enseñando su
  estado vacío actual y **no aparece ninguna métrica a medias ni ningún 0 %**.
- [ ] 448. Con un solo día registrado, ninguna métrica comparativa aparece; cada
  una dice cuánto le falta, y **ninguna dice «0» donde debería decir «sin
  dato»**.
- [ ] 449. Un hábito **`shouldAvoid`** (de los que se quieren evitar) no se lee al
  revés: hay que comprobar explícitamente qué significa «fallar» en ese tipo y que
  la frase no diga lo contrario de lo que pasó. Si el panel actual ya lo resuelve,
  se declara dónde; si no, se dice y queda escrito.
- [ ] 450. La lectura y el reparto se recalculan al cambiar el rango (30/90/365)
  sin consultas nuevas más allá de las que el panel ya hace por rango.
- [ ] 451. En oscuro, todos los textos nuevos ≥ 4,5:1, medido sobre el fondo real.
- [ ] 452. `HabitWeekdayChart` se **modifica**; no nace un segundo gráfico de días
  de la semana al lado del que ya existe.

*Tajada 3 — la hora se guarda (bloqueada por el API)*

- [ ] 453. Al marcar un hábito como fallado desde donde hoy se marca, **la hora
  del reloj se guarda sola**, en el mismo toque, sin un paso más, sin un
  desplegable y sin una confirmación. **Un segundo paso devuelve la tajada.**
- [ ] 454. Se manda **una** mutación `habitFollowUpAdd` con `timeOfDay` en formato
  `"HH:mm"` y **la hora del momento de pulsar** (no la de abrir la pantalla).
  Verificable con espía: pulsando a las 22:15 viaja `"22:15"`.
- [ ] 455. **La hora se puede corregir después** (D1) desde el registro de ese
  día, y corregirla manda **un** `habitFollowUpEdit` con `timeOfDay` y **nada
  más**: ni el `isFailed`, ni las notas, ni la dificultad se reescriben.
- [ ] 456. La hora se guarda también en los **cumplimientos**, no solo en los
  fallos (D2), por el mismo camino y sin pasos de más.
- [ ] 457. Registrar un día **pasado** (no hoy) **no inventa una hora**: se guarda
  `timeOfDay: null`, no la hora del reloj de hoy. Esta es la trampa de FEAT-013 —
  «la hora del botón» no siempre es la hora real — y aquí se resuelve callando.
- [ ] 458. Un seguimiento **sin** `timeOfDay` (todos los anteriores a esta
  feature) se lee y se pinta exactamente como hoy, en todas las pantallas. Cero
  regresiones en «Mi Día», la vista de semana, el calendario y el panel.
- [ ] 459. `timeOfDay` viaja en **las dos** formas del seguimiento (la completa y
  la recortada de `habitFollowUpsInDates`), verificado leyéndolo desde el panel y
  no solo desde el detalle. Ver regla 6 de la sección (3).
- [ ] 460. El campo **`time` no se toca en ningún sitio**: `grep` del diff no lo
  muestra modificado, y un hábito de tipo `time` sigue guardando y pintando su
  duración igual.
- [ ] 461. Si el API todavía no tiene el campo desplegado, el cliente **no
  revienta**: la mutación no manda `timeOfDay` o el error se contiene, y marcar un
  hábito sigue funcionando. (Criterio de seguridad del despliegue, no de
  funcionalidad.)
- [ ] 462. **Del usuario:** con el API desplegado, marcar un fallo real desde el
  móvil y comprobar que la hora guardada es la del momento, mirando el registro
  del día.

*Tajada 4 — a qué hora*

- [ ] 463. El panel enseña **a qué horas se registran los fallos** del tramo, en
  bandas horarias, como un gráfico más en la rejilla de `HabitPanel`.
- [ ] 464. Solo se nombra una banda con **≥ 5 seguimientos con hora** en el tramo.
  Con menos, el gráfico **no aparece** y en su lugar se dice cuántos hay y
  cuántos faltan: «Hay 2 registros con hora; con 5 se puede leer un patrón».
- [ ] 465. Los seguimientos **sin hora** no cuentan como ninguna hora: no van a
  medianoche, no van a una banda «otros» que engañe, y **el gráfico dice sobre
  cuántos registros está hecho** («sobre 12 de 20 registros»).
- [ ] 466. La frase que acompaña cumple las tres reglas de redacción y no contiene
  ninguna frase prohibida.
- [ ] 467. El gráfico **no aparece** para un hábito sin ningún seguimiento con
  hora; el panel se ve exactamente como antes.
- [ ] 468. Cambiar el rango recalcula las bandas sin consultas nuevas.
- [ ] 469. A 375 px el gráfico no desborda y sus etiquetas no se pisan.
- [ ] 470. En oscuro, ≥ 4,5:1.
- [ ] 471. La aritmética de bandas es **pura**, vive en `habit-panel.utils.ts` y
  tiene su suite.
- [ ] 472. **Del usuario:** tras dos o tres semanas registrando, la lectura de
  horas dice algo que él reconoce como cierto. Si no lo reconoce, el umbral está
  mal y se sube.

*Transversales (aplican a todas las tajadas)*

- [ ] 473. **Todo lo que se enseña es cierto.** Ninguna cifra se presenta como
  otra cosa de la que es, ningún hueco se rellena con un cero, y donde falta dato
  se dice **cuánto** falta.
- [ ] 474. **Ni una palabra de reproche**, en ninguna cadena nueva o modificada.
- [ ] 475. Estados: **vacío** (sin registros), **cargando** (spinner, el que ya
  hay), **error** (la alerta que ya hay) y **texto largo** (nombre de hábito de 60
  caracteres) siguen resueltos y no se rompen con lo nuevo.
- [ ] 476. A 375 px, `scrollWidth === clientWidth` y cero nodos desbordados en el
  panel entero.
- [ ] 477. Línea base no peor: typecheck limpio, lint sin nuevos, los tests que
  ya pasaban siguen pasando, `build` en 0.
- [ ] 478. **Ninguna tajada mete backend salvo la 3 y la 4**, y la 1 y la 2 **no
  tocan un solo archivo de `graphql/` ni de `api/`**. Verificable con
  `git diff --stat`.
- [ ] 479. No nace ninguna **ruta**, ninguna **página** y ninguna entrada de menú.
- [ ] 480. **Del usuario:** todo `/app/*` está detrás del login, así que la
  comprobación final en pantalla real es suya.

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | **Las cifras que faltan.** Tu récord como cifra propia y distinguido del mejor episodio del tramo, salvavidas usados y dificultad media — todo ya calculado, nada nuevo que consultar. Criterios 430–439 y los transversales que apliquen. | pendiente |
| 2 | **Dónde se falla, contado como fallos.** El día de la semana se elige por fallos reales y no por cumplimiento, un día sin registrar deja de parecer un fallo, el umbral se dice en voz alta y desaparece «Vas peor». Criterios 440–452. | in-review |
| 3 | **La hora se guarda**, en el mismo toque con el que hoy se marca, y se puede corregir. Criterios 453–462. **Bloqueada por el API.** | pendiente (**bloqueada por el API**) |
| 4 | **A qué hora.** La lectura de horas en el panel, cuando ya hay registros con hora. Criterios 463–472. | pendiente (depende de la 3 **y de que pase el tiempo**) |

La tajada 1 vale por sí sola: el usuario abre el panel y ve tres cifras que pidió
y que hoy no puede leer, sin esperar a nada ni a nadie. La 2 vale por sí sola:
contesta la pregunta que hizo —dónde se falla— en lugar de una parecida. La 3
vale por sí sola aunque la 4 no exista: el dato empieza a acumularse, que es lo
que el usuario se ofreció a hacer.

**Nota sobre el orden:** la 4 **no se puede construir el mismo día que la 3**.
Necesita semanas de registros con hora. Construirla antes de tener dato es
construir a ciegas una pantalla que nadie puede ver funcionar.

**¿Arquitecto? Sí**, pero **solo para las tajadas 3 y 4**: la hora del
seguimiento es un **concepto nuevo** que cruza el contrato del API, los dos
inputs, las **dos** formas del seguimiento en `graphql/`, los sitios donde hoy se
marca un hábito (que son varios: «Mi Día», la vista de semana, el cajón de
seguimiento) y una lectura nueva en el panel — y la regla de «una intención, una
acción» hay que sostenerla **en todos esos sitios a la vez**, que es exactamente
la clase de decisión que no debe tomarse cuatro veces.

**Las tajadas 1 y 2 no lo necesitan y pueden empezar sin él.** Cuelgan de algo
que ya existe, con su ruta:

- El panel: `src/features/habits/components/HabitPanel/HabitPanel.tsx`, montado
  en `src/features/habits/pages/HabitDetailPage.tsx:185`.
- Las fichas: `src/features/habits/components/HabitPanel/HabitPanelTiles.tsx`.
- El gráfico de días: `src/features/habits/components/HabitPanel/HabitWeekdayChart.tsx`.
- La aritmética, toda: `src/features/habits/utils/habit-panel.utils.ts`
  (`buildRangeSummary:186`, `buildWeeklyCompliance:218`,
  `buildWeekdayBreakdown:266`, `getWorstWeekday:292`, `composeReading:409`) con
  su suite `habit-panel.utils.test.ts`.
- La referencia de forma —derivado puro con umbral que devuelve `null` en vez de
  inventar— es **ese mismo archivo**, no Vida.

**¿Render? Sí.** La regla del proyecto es render aprobado antes de cada pantalla
nueva, y el módulo de hábitos tiene su propia historia de diseño
(`docs/remodel/09-panel-habito.spec.md`). Lo que cada tajada necesita:

- **Tajada 1: sí, render pequeño.** Añade fichas a una fila que ya existe y hay
  que decidir cuántas caben, en qué orden y qué pasa a 375 px cuando son seis.
- **Tajada 2: sí, render.** El gráfico de días de la semana pasa de una barra por
  día a tres magnitudes por día (cumplido / fallado / sin registro): es un cambio
  visible y no trivial.
- **Tajada 3: no.** No hay nada nuevo en pantalla salvo, quizá, dónde se corrige
  la hora — y eso cuelga del cajón de seguimiento que ya existe. Si al plantearlo
  resulta que sí aparece un control nuevo, entonces sí.
- **Tajada 4: sí, render.** Es un gráfico nuevo.

**Decisiones que no son mías:**

- **D1 · Qué hora se guarda, y si se puede corregir (del usuario).** Tres
  caminos:
  - **(a) La del reloj al pulsar, automática y corregible después.**
    Cumple «una intención, una acción»: marcar sigue costando un toque y el dato
    aparece solo. El riesgo es el de FEAT-013 —la hora del botón no siempre es la
    hora real: se falla a las 22:15 y se marca a las 23:40— y por eso lleva
    corrección. **Es la que recomiendo**, y los criterios están escritos sobre
    ella.
  - **(b) La del reloj al pulsar, y punto.** Más barato, pero el dato queda
    sucio para siempre y la métrica de horas mide *cuándo registras*, no *cuándo
    fallas*. Es una diferencia que el usuario no vería hasta tener la pantalla
    delante, y entonces ya no se podría arreglar hacia atrás.
  - **(c) Preguntar la hora al marcar.** Dato limpio, **pero rompe la premisa**:
    convierte un toque en tres y, por la regla del usuario, eso hace que se deje
    de registrar. Descartada salvo que él diga lo contrario.
- **D2 · ¿La hora es solo para los fallos, o para todo seguimiento? (del
  usuario).** Él pidió registrar **la falla** con hora. Si el campo solo se llena
  en los fallos, **nunca se podrá decir a qué hora sí sale el hábito**, que es la
  otra mitad de la respuesta y la única que permite comparar. Recomiendo que la
  hora se guarde en **todos** los seguimientos (el campo vive en el seguimiento,
  no en el fallo) y que la tajada 4 empiece enseñando solo los fallos. Coste:
  ninguno. Beneficio: no hay que volver a pedir un campo dentro de tres semanas.
- **D3 · El despliegue del API (del usuario, BLOQUEANTE para las tajadas 3 y
  4).** Sin `timeOfDay` desplegado en `xavi-platform-node` no se construye la
  tajada 3. El cambio está escrito campo a campo en la sección (3). No bloquea
  las tajadas 1 y 2, que son las que más valor dan por lo poco que cuestan.
- **D4 · Los seguimientos viejos se quedan sin hora (mía, con consecuencia
  suya).** No se rellenan ni se adivinan: una hora inventada envenena la única
  métrica que esta feature quiere construir. **La consecuencia que el usuario
  tiene que aceptar es que la métrica de horas nace vacía** y tarda dos o tres
  semanas en decir algo. Si prefiere otra cosa, es el momento de decirlo.
- **D5 · Los renders (del usuario).** Tres, según el reparto de arriba. Él los
  hace antes de construir cada tajada que los pide.
- **D6 · El umbral (del usuario, revisable).** Propongo 4 apariciones por día de
  la semana y 5 registros con hora. Son números para que el sistema no finja; si
  al usarlo el panel calla demasiado, se suben o se bajan en una línea. El
  criterio 472 es precisamente la prueba de si están bien puestos.

**Lo que quedó sin preguntar:** no se preguntó **qué hará el usuario con el
patrón una vez lo vea**. El dossier asume que verlo basta, y por eso el panel
informa y no propone. Si lo que quiere es que el sistema le **avise** («los
martes ponte una alarma»), eso es otra feature y otra conversación — queda
anotado aquí para que nadie lo dé por incluido.

**Relación con otras features:** toca de refilón a **FEAT-012** (mismo patrón de
petición al API, ya desplegado, y el mismo trato de la hora como cadena local) y
a **FEAT-013** (la lección de que «la hora del botón» no siempre es la hora real,
que aquí resuelven D1 y el criterio 457). **FEAT-007** presta la forma —derivados
puros con umbral— pero **no el código**: otro módulo, otro dato. Ninguna de las
tres se toca.

## 2. El plan — feature-architect

**Resumen para el constructor:** la implementación de referencia es
`src/features/habits/utils/habit-panel.utils.ts` + `HabitPanelTiles.tsx` (tajadas
1–2) y, para la hora, **`src/features/habits/hooks/useHabitFollowUps.ts`: los
cuatro sitios donde hoy se marca un hábito pasan todos por ese hook**, así que la
hora se sella ahí dentro **una vez** y «una intención, una acción» se sostiene en
los cuatro sin tocar ninguno. En el API, `time_of_day` se añade a `habit_logs` y
sale solo por todas las consultas porque el servidor tiene **un único mapeador**
(`mapHabitLog`); las dos formas que hay que tocar a mano son **del cliente**. No
se crea ningún `habit-metrics.utils.ts`, ningún componente de ficha, ningún
gráfico de días de la semana nuevo, ninguna entidad ni endpoint de agregación.

### Lo que ya existe

**Front — la lectura (tajadas 1, 2 y 4):**

- Aritmética entera del panel: `src/features/habits/utils/habit-panel.utils.ts`
  (510 líneas). `buildRangeSummary:186` ya devuelve `lifelines` y `untracked`;
  `buildWeekdayBreakdown:266` ya devuelve por día `total / covered / failed /
  untracked`; `getWorstWeekday:292` **elige por `percent`** (`covered/total`,
  `percentOf:182`), que es el defecto de la tajada 2; `composeReading:409-431`
  contiene literalmente «Vas mejor», «Vas peor», «Vas parecido» y «Donde se te
  cae: …». Suite: `habit-panel.utils.test.ts` (389 líneas).
- Fichas: `HabitPanelTiles.tsx:29-…`, cuatro `StatCard` (`@/shared/ui/StatCard`).
  `Tu récord son N días` está en `:35-39` como `helperText` de «Racha actual».
- Rejilla de gráficos: `HabitPanel.tsx:203-224`. Cada gráfico se envuelve en
  `ChartPanel` (`HabitPanel/ChartPanel.tsx:10-20`), que **exige** una `table`
  oculta con los mismos números — es obligatorio también para el gráfico de horas
  de la tajada 4.
- Dato del panel: `useHabitFollowUpsInDatesQuery` (`hooks/useHabits.ts:65-79`),
  clave **`habitKeys.calendar(from, to)`**, `staleTime` 30 s. El panel la llama
  **dos veces** (tramo y tramo previo, `HabitPanel.tsx:76-83`).
- El remapeo que casi nadie ve: `buildFollowUpsByHabit`
  (`src/features/habits/utils/habit-stats.utils.ts:151-181`) **reconstruye el
  seguimiento campo a campo** (`:164-177`). Un campo que no esté listado ahí
  **no llega al panel aunque el servidor lo devuelva**. Lo consumen cuatro
  pantallas: `HabitPanel.tsx:52`, `HabitsListPage.tsx:77`,
  `HabitMyDayPage.tsx:77`, `HabitPersonaPage.tsx:72`.

**Front — la escritura (tajada 3). Esto es el hallazgo que cambia la forma del
plan:** los **únicos** cuatro sitios que escriben un seguimiento llaman a los
hooks de `src/features/habits/hooks/useHabitFollowUps.ts`:

| Sitio | Archivo | Qué manda |
|---|---|---|
| Círculo de Mi Día | `components/HabitDayRow/HabitDayRow.tsx:110` (`handleToggle`) | `add({habitId, date, isAccomplished:true})` |
| Cajón de registro | `components/HabitFollowUpForm/HabitFollowUpForm.tsx:77-110` (`addFollowUp`/`updateFollowUp`) y `:129-146` (`handleFail`) | add/edit con `difficulty` y `notes` |
| Salvavidas | `hooks/useHabitLifelineAction.ts:31` | `add({habitId, date, isLifeline:true})` |
| Botón de salvavidas | `components/HabitLifelineButton/HabitLifelineButton.tsx:13` | el mismo hook |

**No existe hoy ningún camino de un toque para «fallé»**: fallar es cajón +
`confirm()` (`HabitFollowUpForm.tsx:129`). Eso es información para el criterio
453, abajo.

**API (`~/Developer/xavi-platform-node`) — una sola tabla y un solo mapeador:**

- `habit_logs`. Fila: `HabitLogRow` (`src/services/habit.service.ts:~83`), lista
  de columnas `LOG_RETURNING:95-96`, mapeo **único** `mapHabitLog:142-160`.
- Escritura: `addHabitLog:573-700` — tres sentencias (INSERT de salvavidas
  `:611`, **UPDATE de fusión del día `:655`**, INSERT normal `:679`) — y
  `updateHabitFollowUp:705-744` (UPDATE `:731`).
- Lectura: `listHabitFollowUps:773`, `listHabitFollowUpsInDates:844-866` (que
  **reusa** la anterior: no tiene selección propia), `getHabitWeekView` (`:972`,
  usa `LOG_RETURNING`) y **`getHabitMyDay:868-960`, que sí tiene su propio SELECT
  con columnas a mano (`:894`) y su propio mapeo a mano (`:945`)**.
- SDL: `src/graphql/modules/habit/habit.schema.ts` — `type HabitFollowUp:127-144`,
  `input HabitFollowUpAddInput:310-323`, `input HabitFollowUpEditInput:325-335`.
- Resolvers: `habit.resolvers.ts:41` (`toFollowUp`) y `:121-124` (el resolver de
  campo `date`). Pasan el objeto entero: **no hay lista de campos que tocar ahí**.
- Validadores: `src/validators/schemas/habit.schemas.ts:179-197` (add) y
  `:199-235` (edit, **con un `.refine` que exige al menos un campo**).
- Precedente exacto de «hora local como cadena»: migración
  `068_user_settings_vida_night.sql` (columna `TIME`, nula, sin `DEFAULT`) +
  `formatTime` (`src/services/user-settings.service.ts:26-30`, `slice(0,5)`), que
  está **copiado idéntico** en `vida.service.ts:48`, `activity-day-plan.service.ts:34`
  y `weekly-routine.service.ts:48`. Validador: `timeSchema`
  (`src/validators/schemas/user-settings.schemas.ts:6-9`).

**Dos correcciones a la sección 1**, ambas verificadas en el código:

1. **La regla 6 («devolverlo en TODAS las selecciones») es una regla del
   cliente, no del servidor.** El servidor devuelve `HabitFollowUp` por un solo
   mapeador; en cuanto `time_of_day` entra en `LOG_RETURNING` y en `mapHabitLog`
   sale por `habitFollowUps`, `habitFollowUpsInDates`, `habitWeekView` y las
   mutaciones a la vez. La única excepción del servidor es `getHabitMyDay`, que
   se escribió a mano. **Las «dos formas» que hay que tocar sí a mano son los dos
   conjuntos de selección del cliente**: `FOLLOW_UP_FULL_FIELDS`
   (`graphql/habit-follow-ups.graphql.ts:1-14`) y el sub-objeto de
   `habitFollowUpsInDates` (`graphql/habits.graphql.ts:153-…`) — y, tercera y no
   citada por el analista, **el remapeo de `buildFollowUpsByHabit`**
   (`habit-stats.utils.ts:164-177`). Son **tres** sitios, no dos.
2. **`HabitFollowUpEditInput` del cliente (`habit.types.ts:161-171`) no tiene
   `date` ni `isLifeline`**, y el `.refine` del validador del API rechaza un edit
   que solo traiga `id`. Para el criterio 455 («un `habitFollowUpEdit` con
   `timeOfDay` y nada más») hay que añadir `timeOfDay` **a la lista del
   `.refine`**, o la corrección de hora fallará con un 400 y parecerá un bug del
   cliente.

### Implementación de referencia

**`src/features/habits/utils/habit-panel.utils.ts` + su suite
`habit-panel.utils.test.ts`.** No porque sea la mejor escrita, sino porque es
**la misma figura**: derivados puros en cliente sobre una ventana de N días, con
umbral explícito, que devuelven `null` en vez de inventar
(`getWorstWeekday:292-306` es literalmente eso), y la frase compuesta por reglas
(`composeReading:409`). Está viva, probada y es el archivo que las cuatro tajadas
modifican. **No se imita `vida-patterns.utils.ts`**: presta la forma, no el
código, y aquí la forma ya está en casa.

Para la tajada 3, la referencia es distinta y pequeña:
**`src/features/vida/hooks/useActivityFollowUps.ts:60-90`**, donde una mutación
compone su input en el hook (y no en el componente) antes de mandarlo. Se imita
**el gesto**, no el archivo: allí se invalida clave por clave y aquí ya existe
`invalidateAfterFollowUpChange` (`useHabitFollowUps.ts:16-40`) haciendo lo mismo
para hábitos. Ver la trampa nº 2 de abajo.

Para la migración del API: **`migrations/068_user_settings_vida_night.sql`**
(columna `TIME` nula, sin `DEFAULT`, con el porqué escrito en el propio SQL).
**No** se imita la 070, que lleva `NOT NULL DEFAULT` de propósito: aquí un
`DEFAULT` fabrica el pico falso de medianoche que el dossier prohíbe.

### Dónde va el código nuevo, archivo por archivo

**Tajada 1 — las cifras que faltan** (no toca `graphql/` ni `api/`):

- `src/features/habits/utils/habit-panel.utils.ts` — **modificar**: añadir
  `buildAverageDifficulty(days): { avg: number; daysWithDifficulty: number } | null`
  (`null` si no hay ninguno; reutiliza el recorrido de
  `buildDifficultySeries:441` y `hasAnyDifficulty:462`). Nada más: `lifelines` y
  `maxStreak` ya existen.
- `src/features/habits/utils/habit-panel.utils.test.ts` — **modificar**: un
  `describe` nuevo. **No se borra ninguna aserción** (criterio 439).
- `src/features/habits/components/HabitPanel/HabitPanelTiles.tsx` — **modificar**:
  «Tu récord» sale de `helperText:37` y pasa a `StatCard` propio; fichas nuevas
  «Salvavidas usados» (`summary.lifelines` + `rangeLabel`) y «Dificultad media»
  (solo si el derivado no es `null`). `Props` gana `avgDifficulty`. Criterio 432
  (`streak === maxStreak`) se resuelve **aquí**, en el `helperText` de una de las
  dos, no en el util.
- `src/features/habits/components/HabitPanel/HabitPanel.tsx` — **modificar**: un
  `useMemo` más junto a los de `:97-111` y el prop nuevo a `HabitPanelTiles:198`.
- `src/features/habits/components/HabitPanel/HabitPanel.module.scss` — la rejilla
  `.tiles` pasa de 4 a 6 fichas: es lo que el render de D5 tiene que decidir.
- `HabitStreakEpisodesChart.tsx` — **revisar y, si dice «récord», cambiarlo**
  (criterio 431). No se reescribe el gráfico.
- **Caché persistida:** ningún archivo de `api/`, `graphql/` ni `src/shared/api/`
  cambia → el `buster` de `vite/cache-shape.ts` **no** se mueve, y es correcto:
  la forma guardada es la misma. **Ninguna guarda nueva, ninguna clave nueva.**

**Tajada 2 — dónde se falla, contado como fallos** (no toca `graphql/` ni `api/`):

- `src/features/habits/utils/habit-panel.utils.ts` — **modificar**, tres cosas:
  1. `WeekdayStat` (`:252-264`) gana `tracked` (= `covered + failed`) y
     `failRate` (= `failed / tracked`). `buildWeekdayBreakdown:266-290` la rellena.
  2. `getWorstWeekday:292-306` **se reescribe por fallos**: `MIN_TRACKED_PER_WEEKDAY = 4`
     y `MIN_WEEKDAYS_COMPARABLE = 2` como constantes exportadas junto a
     `MIN_DAYS_FOR_TREND:41`; devuelve `null` si no se llega al umbral o si
     todos empatan (criterios 441, 442, 443). El día sin registro **no entra en
     el denominador**.
  3. `composeReading:409-431` — **mueren las tres frases «Vas …»** y «Donde se te
     cae». Queda la comparación con las dos cifras que ya calcula y, si hay día
     señalado, el hecho con su cuenta cruda («Los martes es donde menos veces ha
     salido: 2 de 6»). Función nueva hermana para el texto de «qué falta» cuando
     el umbral no se alcanza («De los martes hay 2 registrados; con 4 ya se puede
     comparar»).
- `src/features/habits/components/HabitPanel/HabitWeekdayChart.tsx` — **modificar**
  (criterio 452): tres magnitudes por día. Su `table` de `ChartPanel` pasa a tres
  columnas.
- `habit-panel.utils.test.ts` — el caso obligatorio del criterio 441 (6 domingos
  sin registrar / 6 martes con 4 fallados) va aquí, no en el test del componente.
- `src/features/habits/components/HabitPanel/HabitPanel.test.tsx` — **modificar**
  sin borrar aserciones.
- **`shouldAvoid` (criterio 449): resuelto, y aquí está dónde.**
  `getHabitDayStatus` (`utils/habit-progress.utils.ts:106-116`) **no mira
  `shouldAvoid` en ningún sitio**: lee las banderas que ya trae el seguimiento
  (`isLifeline` → `isFailed` → `isAccomplished`). Para un hábito a evitar,
  `isFailed` significa «lo hiciste» y `isAccomplished` «lo evitaste», y la
  aritmética es simétrica: **no hay nada que invertir**. El riesgo es solo de
  redacción — «salir» no describe evitar algo —, así que la frase de
  `composeReading` debe leer bien en los dos casos o partirse en dos según
  `habit.shouldAvoid`. Queda escrito: **el panel no lo leía al revés, y sigue sin
  leerlo al revés.**
- **Caché persistida:** igual que la tajada 1. Nada.

**Tajada 3 — la hora se guarda.** Se parte **en dos despliegues**, y por eso van
en este orden (ver «Recorte de tajadas»):

*3a · el API (repositorio `xavi-platform-node`; el push y el despliegue son del
usuario):*

- `migrations/071_habit_logs_time_of_day.sql` — **crear**. Molde: la 068.
  `ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS time_of_day TIME;` **sin
  `DEFAULT`, sin backfill, sin `NOT NULL`**, con el porqué escrito dentro
  (el `DEFAULT '00:00'` fabricaría un pico falso a medianoche).
- `src/services/habit.service.ts` — `HabitLogRow` (`~:83`) gana
  `time_of_day: string | Date | null`; `LOG_RETURNING:95` gana `time_of_day`;
  `mapHabitLog:142` gana `timeOfDay: formatTime(row.time_of_day)` con un
  `formatTime` local copiado de `user-settings.service.ts:26-30` (es el patrón de
  la casa: cada servicio tiene el suyo; **no** se factoriza ahora, eso es otra
  tarea); los tres INSERT/UPDATE de `addHabitLog:611/:655/:679` y el UPDATE de
  `updateHabitFollowUp:731`; y **el SELECT y el mapeo a mano de
  `getHabitMyDay:894` y `:945`**, que es el único sitio que no pasa por
  `LOG_RETURNING`.
- **Decisión de arquitectura, escrita para que no se decida cuatro veces:** en el
  UPDATE de fusión del día (`:655`) la columna va como
  `time_of_day = COALESCE($n, time_of_day)`, **misma forma que `notes`, `story` y
  `difficulty` en esa misma sentencia**. Consecuencia: en un hábito de cantidad
  con varias sumas en el día, la hora guardada es **la del último toque que
  llevaba hora**. Se elige así por consistencia con la línea de al lado y porque
  el toque que cierra el día (el que cumple la meta o el que falla) es el que
  interesa; la corrección manual (D1) existe para el resto.
- `src/types/services/habit.types.ts` — `HabitLog:47-63` + `AddHabitLogInput:179`
  + `UpdateHabitFollowUpInput:193` ganan `timeOfDay`.
- `src/graphql/modules/habit/habit.schema.ts` — `timeOfDay: String` en
  `type HabitFollowUp:127`, en `HabitFollowUpAddInput:310` y en
  `HabitFollowUpEditInput:325`. **Nullable en los tres. No se toca `time: Int!`.**
- `src/validators/schemas/habit.schemas.ts` — `timeOfDay` con un `timeSchema`
  local (copia de `user-settings.schemas.ts:6-9`) en `:179` y en `:199`, **y en la
  lista del `.refine` de `:209-…`** — sin esto, el criterio 455 devuelve 400.
- **Tests del API:** las suites de hábitos **no compilan hoy** (`habit-streak`
  arrastra al resto; `HabitStreakFields` ganó `habit_type`, `period_days` y
  `restart_count` y los tests no se actualizaron; 3 fallos de 596, 6 suites de 53
  en rojo). Esto **no se arregla en esta tajada** —es otro trabajo y ensucia el
  diff que despliega—, pero significa que **el cambio del servicio se despliega
  sin red de tests**. Se compensa así, y es obligatorio: `npx tsc --noEmit` limpio
  (la línea base es limpia, o sea que aquí sí hay puerta) + una comprobación a
  mano contra la API real después del despliegue, con el espía del criterio 454.
  Queda dicho, no descubierto.
- **Orden de despliegue: el API primero, siempre.** El campo es **anulable y
  aditivo**, así que la ventana entre los dos despliegues es segura en las dos
  direcciones: cliente viejo + API nueva ignora el campo (no lo pide en su
  selección); cliente nuevo + API vieja recibe `null`/error de campo desconocido
  — de ahí el criterio 461, que se cumple **no mandando `timeOfDay` si es
  `null`** (`undefined` no viaja en el JSON de variables). **Esto no es el caso
  del 23: aquel campo era no nulo.**

*3b · el cliente (después del despliegue de 3a):*

- `src/features/habits/utils/habit-time.utils.ts` — **crear** (archivo nuevo,
  pequeño y puro): `nowHHmm(): string` y
  `timeOfDayForDate(date: string, today = todayYmd()): string | null`, que
  devuelve `null` si `date !== today` — **el criterio 457 entero vive en esta
  función**, y por eso es pura y tiene test propio
  (`habit-time.utils.test.ts`). No se mete en `habit-panel.utils.ts`: eso es
  aritmética de lectura, esto es del momento de escribir.
- `src/features/habits/hooks/useHabitFollowUps.ts` — **modificar, y aquí está el
  corazón de la tajada**: en el `mutationFn` de
  `useAddHabitFollowUpMutation:41-54` se sella la hora **antes** de llamar al
  API: `addHabitFollowUp({ ...input, ...(t ? { timeOfDay: t } : {}) })` con
  `t = timeOfDayForDate(input.date)`. **Los cuatro sitios que escriben quedan
  cubiertos sin tocar ni uno** (`HabitDayRow`, `HabitFollowUpForm` ×3 caminos,
  `useHabitLifelineAction`, `HabitLifelineButton`), que es exactamente lo que
  pide «una intención, una acción» y lo que evita tomar la decisión cuatro veces.
  La hora se toma **dentro del `mutationFn`**, o sea al pulsar, no al montar el
  componente (criterio 454).
- `src/features/habits/hooks/useHabitFollowUps.ts` — **añadir**
  `useSetFollowUpTimeOfDayMutation()`: un `useMutation` hermano que manda
  `updateHabitFollowUp({ id, timeOfDay })` **y nada más** (criterio 455). **No se
  reutiliza `HabitFollowUpForm.updateFollowUp:99-112`**, que reescribe
  `difficulty` y `notes` en el mismo edit y por tanto viola el criterio.
- `src/features/habits/types/habit.types.ts` — `timeOfDay: string | null` en
  `HabitFollowUp:63`, en el sub-objeto recortado de
  `HabitFollowUpsDateGroup:104-118`, y `timeOfDay?: string | null` en
  `HabitFollowUpAddInput:148` y `HabitFollowUpEditInput:161`.
- `src/features/habits/graphql/habit-follow-ups.graphql.ts:1-14` — `timeOfDay` en
  `FOLLOW_UP_FULL_FIELDS`.
- `src/features/habits/graphql/habits.graphql.ts:153-…` — `timeOfDay` en la
  selección de `habitFollowUpsInDates` (**la recortada, la que alimenta el
  panel**) y en la del `weekView`/`myDay` si listan campos del seguimiento.
- `src/features/habits/utils/habit-stats.utils.ts:164-177` — `timeOfDay: fu.timeOfDay`
  en el remapeo. **Sin esta línea el criterio 459 falla y parecerá un fallo del
  servidor.**
- **La corrección en pantalla:** un control nuevo en
  `components/HabitFollowUpForm/HabitFollowUpForm.tsx` (junto a «Notas», en el
  bloque `:290-…`), visible **solo si el seguimiento existe y tiene
  `timeOfDay`** — nunca en el camino de marcar. Al aparecer un control nuevo, la
  tajada 3b **sí necesita render** (la sección 1 lo dejó condicionado: «si
  aparece un control nuevo, entonces sí»). **Es una decisión del usuario, D5.**
- **Caché persistida, y esto es de obligado cumplimiento:**
  - El `buster` **se mueve solo**: cambian dos `graphql/*.graphql.ts` y eso lo
    coge la regla 1 por ruta de `vite/cache-shape.ts:28-36`. La caché vieja se
    tira en el primer arranque: no hay que hacer nada ni añadir ninguna lista.
  - **Guarda: sí, una, y es `habitKeys.calendar`.** La regla de la casa es «lleva
    guarda la consulta cuya forma inesperada **tumba** una pantalla». Verificado:
    `buildFollowUpsByHabit` hace `for (const fu of group.followUps)`
    (`habit-stats.utils.ts:158`) **sin red**, así que un grupo cacheado sin
    `followUps` revienta **cuatro** pantallas (panel, Mi Día, lista y Mi Persona)
    antes de pintar. Es **la misma forma** `{ date, followUps[] }` que ya obligó a
    partir la guarda de `vidaKeys.followUps.range`. Entrada nueva en
    `CACHE_GUARDS` (`src/app/providers/query-cache-guards.ts:100-…`), copiando esa
    guarda: `keyPrefix: [...habitKeys.all, 'calendar']`, `porQue: 'el panel, Mi
    Día, la lista y Mi Persona recorren cada grupo y su lista de seguimientos'`,
    `isValid: everyItem(data, g => hasString(g,'date') && Array.isArray(g.followUps))`.
    **Con el riesgo residual de FEAT-021 puesto al día:** el motivo que había
    escrito («sus pantallas degradan a vacío») era falso; esta tajada cierra el
    caso **de la clave que toca**, y deja el resto de `habitKeys` fuera a
    sabiendas.
  - **Lo que NO se hace, y por qué:** **no se añade `habitKeys` a `FABRICAS`**
    (`query-cache-guards.coverage.test.ts:33`). El automatismo recorre **solo
    `vidaKeys`**, así que esta feature **no pone rojo ese test** — lo he
    comprobado leyéndolo, no deduciéndolo — y meter `habitKeys` obligaría a
    decidir y escribir un motivo para las **doce** claves de hábitos: es una
    decisión por clave, es otra tajada y es otro expediente.
    `habitKeys.weekView` (el `days.map` sin red de `HabitDetailPage:197`) **sigue
    siendo riesgo residual aceptado**: esta feature no lee `weekView`.
  - **Trampa:** `SIN_GUARDA_A_PROPOSITO` es **solo de Vida**. El tercer `describe`
    del test de cobertura comprueba que cada camino listado **existe en
    `vidaKeys`**; meter ahí un camino de hábitos pone el test en rojo.

**Tajada 4 — a qué hora** (no toca ni `graphql/` ni `api/`; el dato ya llega
desde la 3):

- `src/features/habits/utils/habit-panel.utils.ts` — **modificar**: `HourBand`,
  `buildHourBands(days): { bands: HourBand[]; withTime: number; total: number }`
  y `MIN_FOLLOW_UPS_WITH_TIME = 5` junto a las otras constantes de umbral
  (`:41-50`). Aritmética **pura** (criterio 471). Los seguimientos sin
  `timeOfDay` **no entran en ninguna banda** y se cuentan aparte para la frase
  «sobre 12 de 20 registros» (criterio 465).
- `src/features/habits/components/HabitPanel/HabitHourBandsChart.tsx` — **crear**,
  copiando la estructura de `HabitWeekdayChart.tsx` (SVG a mano + `ChartPanel`
  con su `table` oculta obligatoria). Es el **único componente nuevo** de toda la
  feature.
- `src/features/habits/components/HabitPanel/HabitPanel.tsx:203-224` — un hijo más
  en la rejilla `.charts`, con la misma guarda de visibilidad que usa
  `showDifficulty:187` (si no llega al umbral, **no aparece**; el texto de «qué
  falta» va donde el render diga).
- `habit-panel.utils.test.ts` y `HabitPanel.test.tsx` — casos del umbral y del
  «sobre N de M».
- **Caché persistida:** nada. No hay consulta nueva ni forma nueva; el campo ya
  entró en la 3.

### Lo que NO se crea

- **`habit-metrics.utils.ts` ni ningún `utils` paralelo** (criterio 438). Toda la
  aritmética nueva de lectura entra en `habit-panel.utils.ts`. La única excepción
  es `habit-time.utils.ts` de la tajada 3b, que **no es aritmética de lectura**:
  es el sello de la hora al escribir, y está aparte para que el criterio 457
  tenga una función pura que probar.
- **Ningún componente de ficha** (criterio 436): `StatCard` de `@/shared/ui/StatCard`.
- **Ningún segundo gráfico de días de la semana** (criterio 452): se modifica
  `HabitWeekdayChart.tsx`.
- **Ninguna consulta nueva, ninguna clave nueva, ningún hook de datos nuevo**
  (criterios 435, 450, 468): todo sale de `habitKeys.calendar` y de `habit`, que
  ya están en memoria.
- **Ninguna entidad «registro de fallo», ningún endpoint de agregación, ninguna
  ruta, ninguna página, ninguna entrada de menú** (criterio 479).
- **No se toca el servicio de rachas** (`src/services/habit-streak.ts`,
  `applyStreakAfterFollowUp`): esta feature lee `maxStreak`, no lo escribe.
- **No se toca `time`** (criterio 460): es duración en minutos y convive en la
  misma fila.

### Dónde NO va

- **En un `timeOfDay` calculado a partir de `created_at`.** Tentador («la fila ya
  tiene la hora de creación») y mentira: `created_at` está en UTC, existe para
  todas las filas viejas y rellenaría la métrica con horas que nadie registró —
  justo el pico falso que D4 prohíbe. La columna nace vacía y se queda vacía
  hacia atrás.
- **En los componentes que marcan.** Sellar la hora en `HabitDayRow`,
  `HabitFollowUpForm` y `useHabitLifelineAction` sería la misma decisión tomada
  cuatro veces y tres oportunidades de que una se olvide. Va en el `mutationFn`
  del hook, que es el embudo real.
- **En un `defaultValue` del formulario de registro.** Convierte un toque en
  tres y devuelve la tajada (criterio 453, D1c descartada por el analista).
- **En `vida-patterns.utils.ts` ni en nada de `features/vida`.** Presta la forma;
  el código es de otro dato.
- **En `habit-progress.utils.ts`.** Es el estado visual de un día y lo comparten
  Mi Día, la semana y el calendario: meter ahí métricas del panel lo convierte en
  un cajón común.
- **En ampliar `FABRICAS` del test de cobertura a `habitKeys`.** Medido: no hace
  falta para esta feature y es una decisión por clave, con su propio expediente.
- **En arreglar las seis suites rotas del API.** Es trabajo real y está nombrado
  arriba como riesgo asumido de la 3a, no como parte de la tajada.

### Trampas de esta casa que aplican aquí

1. **`contracts.test.ts` es solo de Vida** (`src/features/vida/graphql/contracts.test.ts`):
   ningún documento de hábitos está en su lista. Tocar
   `habits.graphql.ts` **no** lo pone rojo — y eso significa que **nada compara el
   documento de hábitos con el SDL**: el ida y vuelta de la tajada 3 se prueba a
   mano contra la API real, no hay red.
2. **`invalidateFollowUpQueries` invalida clave por clave, no por prefijo** — pero
   es de Vida (`src/features/vida/utils/invalidate-vida-queries.ts:23`). El de
   hábitos es `invalidateAfterFollowUpChange` (`useHabitFollowUps.ts:16-40`) y ya
   invalida los cinco prefijos (`myDay`, `detail`, `list`, `weekView`,
   `calendar`). **No hay que añadir nada**: la hora nueva se refresca por
   `calendar`, que es la del panel.
3. **Los `vi.mock` dejan suites verdes por casualidad.** `HabitDayRow.test.tsx:13-15`
   mockea el módulo `useHabitFollowUps` entero con tres hooks. Al añadir
   `useSetFollowUpTimeOfDayMutation`, **hay que buscar y completar todos los
   `vi.mock` de ese módulo aunque estén verdes**.
4. **La pestaña del navegador emula 568 px.** Los criterios 437, 469 y 476 («a
   375 px») exigen un `iframe` del ancho exacto, y ojo con el contenedor `flex`
   que encoge el `iframe` ignorando su `width`. Y con seis fichas en la fila,
   **mide también a 760 px**: es el ancho donde ya apareció un defecto que a 375
   no se veía.
5. **El CSS del build es un testigo.** Si `pnpm build` baja de 279,35 kB sin
   haber borrado estilos a propósito, hay un comentario abierto sin cerrar en un
   `.module.scss`. Aplica a las tajadas 1, 2 y 4, que tocan SCSS.
6. **`/app/*` está tras el login.** Los criterios 462, 472 y 480 son del usuario.
   Lo verificable aquí son los tests y un arnés temporal con datos sintéticos.

### Recorte de tajadas, y por qué

De las cuatro de la sección 1 **se mantienen las cuatro** y **se parte la 3 en
dos**, porque el corte cae justo donde cae un despliegue:

| # | Qué hace | Archivos | Criterios que cierra | Estado |
|---|---|---|---|---|
| 1 | **Las cifras que faltan.** Récord como ficha propia y distinguido del mejor episodio del tramo, salvavidas usados, dificultad media. | `utils/habit-panel.utils.ts` (+ suite), `HabitPanel/HabitPanelTiles.tsx`, `HabitPanel/HabitPanel.tsx`, `HabitPanel/HabitPanel.module.scss`, `HabitPanel/HabitStreakEpisodesChart.tsx` (revisión del rótulo), `HabitPanel/HabitPanel.test.tsx` | 430–439 + 473–480 | **aceptada** (2026-09-24, en segunda vuelta: frase del récord corregida y escritorio remedido) |
| 2 | **Dónde se falla, contado como fallos.** El día se elige por fallos, el umbral se dice en voz alta, muere «Vas peor». | `utils/habit-panel.utils.ts` (+ suite), `HabitPanel/HabitWeekdayChart.tsx`, `HabitPanel/HabitPanel.tsx`, `HabitPanel/HabitPanel.test.tsx` | 440–452 + 473–480 | **aceptada** (2026-09-24, en segunda vuelta: la frase del caso de callar ya cuenta registros y lo dice; mutación y anchos remedidos por el revisor. Pendiente solo el 480 del usuario, y dentro de él la frase en un hábito de los de «evitar») |
| 3a | **El API aprende la hora.** Columna, mapeo, SDL, validadores. **Nada visible; se cierra con el push del usuario y el job de migración.** | `xavi-platform-node`: `migrations/071_habit_logs_time_of_day.sql`, `src/services/habit.service.ts`, `src/types/services/habit.types.ts`, `src/graphql/modules/habit/habit.schema.ts`, `src/validators/schemas/habit.schemas.ts` | ninguno por sí sola (habilita 453–462) | in-review (aceptada el 2026-09-24; reabierta por la corrección del `null`, que decidió el usuario) |
| 3b | **La hora se guarda y se corrige**, en el mismo toque, en los cuatro sitios a la vez. | `hooks/useHabitFollowUps.ts`, `utils/habit-time.utils.ts` (+ suite, nuevo), `types/habit.types.ts`, `graphql/habit-follow-ups.graphql.ts`, `graphql/habits.graphql.ts`, `utils/habit-stats.utils.ts`, `components/HabitFollowUpForm/HabitFollowUpForm.tsx`, `app/providers/query-cache-guards.ts`, los `vi.mock` de `HabitDayRow.test.tsx` | 453–462 | **aceptada** (2026-09-25; 453–461 verificados por el revisor con espía de variables y arnés a 375 px en oscuro. El 461 se cumple por orden de despliegue, no por construcción, y queda escrito en la sección 4. Pendiente solo el 462 del usuario) |
| 4 | **A qué hora.** Bandas horarias en la rejilla del panel. | `utils/habit-panel.utils.ts` (+ suite), `HabitPanel/HabitHourBandsChart.tsx` (nuevo), `HabitPanel/HabitPanel.tsx`, `HabitPanel/charts.module.scss`, `HabitPanel/HabitPanel.test.tsx` | 463–472 | pendiente (**depende de 3b y de que pasen semanas**) |

**Por qué se parte la 3 y por qué 3a no es una tajada horizontal disfrazada.** La
regla de la casa es que una tajada es vertical y alguien puede probarla. 3a **no
lo es**, y por eso **no se presenta como valor para el usuario sino como un
despliegue**: es el mismo corte que FEAT-019 hizo entre lectura y escritura. La
alternativa —una sola tajada 3— pone en el mismo árbol sin commitear el cambio de
dos repositorios, uno de los cuales el constructor **no puede desplegar** (D3, es
del usuario) y el otro no se puede probar hasta que el primero esté arriba: el
constructor quedaría bloqueado a mitad, con el árbol a medias, esperando. Partido,
3a se entrega, el usuario empuja, el job de migración corre, y 3b empieza contra
una API que ya tiene el campo — y el criterio 461 deja de ser una promesa y pasa a
ser comprobable en el orden correcto. **El orden es innegociable: API primero.**

Lo que **no** se recorta: la 1 y la 2 siguen sin arquitecto y pueden ir
inmediatamente; la 4 sigue sin poder construirse el mismo día que la 3b.

### Lo que no pude averiguar

- **Qué ancho tiene la fila de fichas con seis `StatCard`** a 375 y a 760 px. No
  lo medí: `/app/*` está tras el login y medirlo bien pide el arnés + `iframe`.
  Es exactamente lo que el render de D5 (tajada 1) tiene que resolver antes de
  construir.
- **Si `HabitStreakEpisodesChart.tsx` llama «récord» a su episodio más largo**
  (criterio 431). Listé el archivo pero no lo leí entero; queda como primera
  comprobación de la tajada 1.
- **Cómo se comporta `applyStreakAfterFollowUp` con la reapertura de sesiones que
  el API aprendió esta semana** (`activityFollowUpEdit` con `durationMinutes:
  null`, commit `3a3a8be`): lo miré y **es de Vida, no de hábitos** — otra tabla,
  otro servicio. **No sirve ni estorba aquí.** Lo que sí se hereda de esa semana
  es la migración 070, cuyo `NOT NULL DEFAULT` es justamente el patrón que aquí
  **no** se copia.
- **El coste real de arreglar las seis suites rotas del API.** Miré por qué están
  rotas (`HabitStreakFields` con tres campos nuevos) pero no cuántos tests hay que
  tocar. Está fuera de esta feature y dicho como riesgo, no medido.

### D5 · Render de la tajada 3b — aprobado el 2026-09-25

`docs/habits/assets/02-habitos-hora-del-registro.html`, aprobado tal cual. Lo que
fija: **marcar no cambia** (cero píxeles nuevos en ese camino); al reabrir el
registro del día aparece **una línea** entre «Notas» y los botones —«Registrado a
las HH:mm · Corregir»— **solo si el seguimiento tiene `timeOfDay`**; «Corregir»
abre un campo de hora en el sitio con su propio botón «Guardar hora», que manda
`habitFollowUpEdit` con **solo `timeOfDay`**. Un registro **sin** hora (día pasado
o anterior a la feature) **no enseña la línea y no deja añadirla a mano** en esta
tajada: se preguntó y el usuario no pidió lo contrario, así que queda callado
como está dibujado. La 3a está desplegada en Render (comprobado ese día contra el
API real), así que el criterio 461 se prueba en el orden correcto.

## 3. Construcción — feature-builder

### Tajada 3a — el API aprende la hora

**Resumen para el revisor:** el API ya sabe guardar y devolver la hora de reloj
de un seguimiento (`timeOfDay`, «HH:mm» local, **anulable, sin `DEFAULT` y sin
backfill**), en `xavi-platform-node` y **nada más**: no hay un solo cambio
visible ni un solo archivo del front tocado (solo este expediente y mi fila del
`BOARD.md`). Se entrega **sin desplegar**: el push y el job de migración son del
usuario (D3), y hasta que corran, el campo no existe en la base.
**Lo que más probablemente he roto:** la escritura de seguimientos de hábitos —
los tres `INSERT`/`UPDATE` de `addHabitLog` y el `UPDATE` de
`updateHabitFollowUp` cambiaron de número de parámetros ($9→$10, $11→$12), y
**las suites de hábitos del API no compilan desde antes, así que ahí no hay red**.
Si algo se ha desalineado, se verá al marcar un hábito, no al compilar.

**Lo que construí** (todo en `/home/jako/Developer/xavi-platform-node`):

- `migrations/071_habit_logs_time_of_day.sql` — **nuevo**. `ALTER TABLE
  habit_logs ADD COLUMN IF NOT EXISTS time_of_day TIME;` calcado de la 068: sin
  `DEFAULT`, sin `NOT NULL`, sin backfill, con el porqué dentro (el pico falso
  de medianoche y el falso amigo `time`). `DOWN` comentado, como la 068.
- `src/services/habit.service.ts` — `HabitLogRow` gana `time_of_day: string |
  Date | null`; `LOG_RETURNING` gana la columna; `formatTime` local copiado de
  `user-settings.service.ts:26-30`; `mapHabitLog` gana
  `timeOfDay: formatTime(row.time_of_day ?? null)`. Escriben la columna los tres
  caminos de `addHabitLog` (INSERT de salvavidas, UPDATE de fusión del día con
  `time_of_day = COALESCE($9, time_of_day)` —la forma de `notes`, `story` y
  `difficulty` de al lado—, INSERT normal) y el UPDATE de `updateHabitFollowUp`,
  también con `COALESCE`. Y el único sitio escrito a mano, `getHabitMyDay`: su
  tipo de fila, su `SELECT` (`hl.time_of_day`) y su mapeo manual.
- `src/types/services/habit.types.ts` — `HabitLog.timeOfDay: string | null`,
  `AddHabitLogInput.timeOfDay?` y `UpdateHabitFollowUpInput.timeOfDay?`.
- `src/graphql/modules/habit/habit.schema.ts` — `timeOfDay: String` (nulo en los
  tres) en `type HabitFollowUp`, `HabitFollowUpAddInput` y
  `HabitFollowUpEditInput`. **`time: Int!` intacto.**
- `src/validators/schemas/habit.schemas.ts` — `timeOfDaySchema` local, `timeOfDay`
  en el add, en el edit **y en la lista del `.refine`** (la trampa nombrada).
- `src/graphql/modules/habit/habit.resolvers.ts` — **no estaba en el plan y hacía
  falta** (ver «desvíos»): `habitFollowUpAdd` desestructura el input campo a
  campo, así que sin añadir `timeOfDay` ahí la hora se perdía entre el validador
  y el servicio, en silencio. `habitFollowUpEdit` ya pasa `...fields` y no
  necesitó nada.
- `tests/unit/validators/habit.schemas.test.ts` — **nuevo** (ver «desvíos»).

**Por qué así, y qué descarté:**

- **`COALESCE` también en el edit**, no asignación directa. Consecuencia que el
  revisor debe conocer: **por el edit se puede poner y corregir la hora, pero no
  borrarla** (mandar `timeOfDay: null` deja la que había). Lo elegí por
  consistencia con las cuatro columnas de la misma sentencia; ningún criterio
  pide borrarla. Si alguna vez se quiere un «quitar la hora», es un cambio de
  esa línea y hay que decidirlo aparte.
- **`?? null` en `formatTime(row.time_of_day ?? null)`**: hay `SELECT`s de
  `habit_logs` con `*` y con `hl.*` (`:649`, `:733`, `:803`, `:835`) que sí
  traerán la columna, pero con el `?? null` un resultado sin ella devuelve `null`
  en vez de reventar. Es la diferencia entre una ventana de despliegue tranquila
  y una pantalla en blanco.
- **No toqué `type HabitLog` del SDL** (el de `Habit.logs`), solo
  `HabitFollowUp`: es lo que pedía el plan y lo que consume el cliente. El objeto
  que devuelve el servicio sí lleva el campo; GraphQL simplemente no lo expone
  por ahí.
- **No arreglé las seis suites rotas** (`habit-streak` y compañía), como manda el
  plan.

**Desvíos del plan, dichos en voz alta:**

1. **`habit.resolvers.ts` no estaba en la lista de archivos de la tajada.** La
   sección 2 dice «los resolvers pasan el objeto entero: no hay lista de campos
   que tocar ahí» y **eso es cierto para `habitFollowUpEdit` pero falso para
   `habitFollowUpAdd`** (`:361`), que desestructura once campos a mano. Sin ese
   cambio, el criterio 454 fallaría con todo lo demás en verde.
2. **El validador es más estricto que su molde.** `timeSchema` de
   `user-settings.schemas.ts:6-9` acepta `99:99`; el mío exige
   `^([01]\d|2[0-3]):[0-5]\d(:\d{2})?$`, que es literalmente lo que pide la
   regla 4 de la sección (3) («entre 00:00 y 23:59»). Con el molde tal cual, un
   `99:99` pasaría el 400 y moriría como error de Postgres, o sea un 500.
3. **Añadí `tests/unit/validators/habit.schemas.test.ts`** (6 casos), que no
   estaba planificado. El plan renuncia a tests porque las suites de hábitos no
   compilan — cierto del **servicio**, no de los validadores: `tests/unit/validators/`
   está entero en verde y tiene vecinos que imitar. Cubre la trampa del `.refine`
   y el formato. **No arregla la falta de red del servicio**, que sigue intacta.
4. **Las tres descripciones nuevas del SDL van en `"""` de tres líneas**, no en
   una sola como sus vecinas: en una sola línea, prettier marcaba un error nuevo
   por descripción y la regla de este repo es no empeorar el lint de los archivos
   que tocas. Verificado: 6 errores antes y 6 después en `habit.schema.ts`.

**Verificación** (ejecutada en `xavi-platform-node`):

- `npx tsc --noEmit` → `EXIT=0`. **Esta es la puerta real de la tajada**, tal y
  como la dejó escrita el arquitecto.
- `npm test` → `Test Suites: 6 failed, 48 passed, 54 total` / `Tests: 3 failed,
  599 passed, 602 total`. Línea base: 6 de 53 y 3 de 596. **Mismas seis suites y
  los mismos tres fallos** (`syncHabitStreakFromLogs`, `HabitService > addHabitLog
  > creates log when date is available`, `walletExpenseUpdate`); el total sube
  en 6 por la suite nueva. No he empeorado nada y no he arreglado nada.
- `npx eslint` sobre los cinco archivos tocados de `src/`: `habit.service.ts` 5,
  `habit.types.ts` 0, `habit.schema.ts` 6, `habit.schemas.ts` 7,
  `habit.resolvers.ts` 9 — **todos los avisos caen en líneas preexistentes**,
  ninguno en una línea mía (comprobado línea a línea con `-f json`). Sin
  `lint:fix`, ni en un archivo ni a lo ancho. El test nuevo queda fuera de
  `npm run lint`, que solo mira `src`.
- **Sonda propia con `tsx`** (borrada al terminar) sobre el SDL ya compilado y
  los validadores:
  - `HabitFollowUp | timeOfDay: String | time: Int!`
  - `HabitFollowUpAddInput | timeOfDay: String | time: Int`
  - `HabitFollowUpEditInput | timeOfDay: String | time: Int`
  - edit `{id, timeOfDay}` → OK; edit `{id}` → «At least one field is required to
    update»; `99:99`, `24:00`, `7:5` → «Invalid time format (HH:MM)»; add sin
    `timeOfDay` → OK.
  Los mismos casos viven ahora en la suite nueva (6/6 en verde).
- **Sin base de datos.** No sembré ni borré ningún dato: no hay acceso a Neon
  desde aquí y la migración **no se ha ejecutado**.

**Criterios que cierra:** **ninguno por sí sola**, como dice el plan. Habilita
los 453–462, que son de la 3b. Lo que sí deja comprobado del lado del servidor:

- **459 (mitad servidor):** un solo `mapHabitLog` y un solo `LOG_RETURNING` →
  `habitFollowUps`, `habitFollowUpsInDates`, `habitWeekView` y las mutaciones
  devuelven el campo a la vez. El único `SELECT` a mano, `getHabitMyDay`,
  también. **Las tres formas del cliente siguen siendo trabajo de la 3b.**
- **460:** `time: Int!` intacto en el SDL y en el servicio; el `grep` del diff
  solo muestra `time_of_day`, nunca `time` a secas, salvo en las listas de
  columnas donde ya estaba.
- **461 (mitad servidor):** el campo es anulable en los tres sitios; un cliente
  viejo que no lo mande sigue funcionando igual (caso probado en la suite nueva).

**Pendiente de prueba manual (del usuario, y no marcables desde aquí):**

1. **El despliegue (D3).** `git push` a `main` del repo del API → el job
   `xavi-migrate` de Cloud Run corre la 071 contra Neon y solo después despliega.
   Mientras eso no pase, **el campo no existe en la base** y cualquier consulta
   que lo pida dará error de columna.
2. **El ida y vuelta real**, una vez arriba: una mutación `habitFollowUpAdd` con
   `timeOfDay: "22:15"` debe devolver `"22:15"` (no `"22:15:00"`, no
   `"03:15"`), y un `habitFollowUpEdit` con `{id, timeOfDay}` debe devolver 200
   y no 400. **Nada compara el documento del cliente con este SDL**, así que esta
   comprobación no la hace ningún test, ni aquí ni en el front.
3. **Que marcar un hábito sigue funcionando** (Mi Día, el cajón, el salvavidas):
   es lo que tocan los `INSERT`/`UPDATE` renumerados y lo que no cubre ninguna
   suite.

**Riesgos:**

- **El grande: el servicio se despliega sin red de tests.** `habit.service.test.ts`
  es una de las seis suites rotas de antes, así que `addHabitLog` y
  `updateHabitFollowUp` no tienen ninguna prueba que corra. Lo único que sostiene
  los cuatro cambios de SQL es `tsc` (que no mira dentro de una cadena) y la
  lectura. **Asumido y nombrado por el arquitecto; lo repito aquí porque es lo
  que hay que mirar primero.**
- **La fusión del día guarda la hora del último toque que llevaba hora**
  (`COALESCE`). En un hábito de cantidad con varias sumas, esa es la hora que
  queda. Decisión del plan, escrita también en el código.
- **`getHabitMyDay` es el único sitio con columnas y mapeo a mano**: si alguien
  añade otro campo mañana y se olvida de él, saldrá por todas partes menos por
  «Mi Día». Ya pasa hoy; no es mío, pero ahora hay un campo más que mantener.
- **La columna es `TIME` de SQL**, así que Postgres devuelve `"22:15:00"`;
  `formatTime` recorta a cinco caracteres. Si un día alguien lee `time_of_day`
  sin pasar por `mapHabitLog`, verá los segundos.

**Estado del árbol:** **sin commitear**, en dos repositorios:

- `xavi-platform-node`: 5 archivos modificados + 2 nuevos
  (`migrations/071_habit_logs_time_of_day.sql`,
  `tests/unit/validators/habit.schemas.test.ts`). También cambió
  `graphify-out/` por el `graphify update .` obligatorio.
- `xavi-habits-webapp`: **solo este expediente y mi fila del `BOARD.md`**. Lo
  demás que aparezca en `git status` del front es de la sesión que está
  construyendo FEAT-012 en paralelo; **no lo he tocado**.

### Tajada 3a · corrección tras la revisión — `null` ya borra la hora

**Resumen para el revisor:** el API ya no dice que sí y luego no lo hace. En las
dos sentencias que escribían la hora con `COALESCE`, «no vino el campo» y «vino
vacío» eran indistinguibles; ahora se distinguen, con la misma forma que
`durationMinutes` en `activity-follow-up.service.ts:377` (FEAT-022): **ausente =
no la toques, `null` = bórrala**. Lo demás de la tajada —migración 071,
`timeSchema` original, los cuatro SQL ya revisados, el resolver del add— **no se
ha tocado**. **Lo que más probablemente he roto:** la escritura de seguimientos
otra vez, porque los dos `UPDATE` vuelven a renumerarse (ahora `$9` bandera,
`$10` hora, `$11` el `WHERE id`) — pero esta vez **sí hay red**: una suite nueva
de servicio que lee los parámetros de las dos sentencias.

**Lo que cambié** (decisión del usuario, no mía; el revisor la dejó abierta):

- `src/services/habit.service.ts` — en el UPDATE de fusión del día de
  `addHabitLog` y en el de `updateHabitFollowUp`, la columna pasa de
  `time_of_day = COALESCE($9, time_of_day)` a
  `time_of_day = CASE WHEN $9::boolean THEN $10::time ELSE time_of_day END`, con
  `input.timeOfDay !== undefined` como bandera y `input.timeOfDay ?? null` como
  valor. Las dos llevan el porqué escrito encima.
- **Elegí `CASE WHEN` y no una lista de `SET` dinámica** como la del precedente:
  el precedente construye la sentencia entera a trozos y aquí eso obligaba a
  reescribir dos `UPDATE` de nueve columnas que el revisor ya había leído
  parámetro a parámetro. Con `CASE WHEN`, la sentencia sigue siendo fija y el
  cambio se lee en una línea. Misma semántica, menos superficie.
- `src/types/services/habit.types.ts` y la descripción del SDL en
  `habit.schema.ts` — dicen ahora la regla en palabras, para que no haya que
  deducirla del SQL.
- **Los dos `INSERT` no cambian**, y es correcto: en una fila que nace no hay
  hora anterior que conservar, así que ausente y `null` significan lo mismo
  («sin hora», que no es medianoche). Cubierto con dos casos.

**Repaso de las demás columnas del mismo `UPDATE`** (punto 3 del encargo):
`notes`, `story`, `archived`, `difficulty` y `client_id` **se quedan con
`COALESCE` a propósito**. En esas, `null` ha significado siempre «no lo mando»
—el resolver y el servicio las pasan como `?? null` sin que nadie pueda decir
«bórralo»— y cambiarlas sería cambiar un contrato que ya usan el cajón de
registro y la idempotencia por `clientId`. **No las he tocado**, y hay un caso de
test que fija esa asimetría para que se vea que es deliberada y no un olvido.

**Verificación:**

- `npx tsc --noEmit` → `EXIT=0`.
- `npm test` → **3 fallos de 614 en 55 suites**, las mismas seis rotas de
  siempre y los mismos tres fallos. Antes de esta corrección: 3 de 602 en 54. Las
  12 pruebas de más son las mías.
- **Suite nueva `tests/unit/services/habit-follow-up-time-of-day.service.test.ts`
  (10 casos, en verde)** — mockea el pool y lee la sentencia y sus parámetros:
  - edit con `'07:05'` → bandera `true`, valor `'07:05'`;
  - edit **sin** el campo (solo `notes`) → bandera `false`, valor `null`: la hora
    guardada no se toca;
  - edit con `null` → bandera `true`, valor `null`: se borra;
  - `notes`, `story`, `archived` y `difficulty` siguen en `COALESCE`;
  - la vuelta es `'22:15'` y no `'22:15:00'`;
  - y los mismos tres casos en el **add** que fusiona el día, más los dos del
    INSERT del primer seguimiento (`$12` con la hora, o `null`).
  **Es la primera red de tests que corre sobre `addHabitLog`/`updateHabitFollowUp`**
  desde que las suites de hábitos dejaron de compilar; no las arregla ni las toca.
- `tests/unit/validators/habit.schemas.test.ts` → **8 casos**, con los nombres
  corregidos: el de `null` en el add dice «no hay hora anterior que conservar» y
  hay uno nuevo que fija «no vino» frente a «vino vacío» en el edit. El título
  viejo («accepts null as "no time"») decía algo que en el edit era falso.
- `npx eslint` en los ficheros de `src/` tocados: `habit.service.ts` 5,
  `habit.schema.ts` 6, `habit.types.ts` 0 — **los mismos números y las mismas
  líneas preexistentes** que antes de la corrección. Sin `lint:fix`.
- **Sigue sin haber base de datos por medio**: la migración 071 no se ha
  ejecutado y el `CASE WHEN ... ::time` no se ha probado contra Postgres. Es lo
  que hay que mirar en la comprobación a mano de después del push.

**Lo que el revisor encontró y no estaba en mi lista, para la 3b** (no lo he
tocado): **`habitLogAdd` (`habit.resolvers.ts:341`) tiene la misma forma que me
mordió** — ocho campos desestructurados a mano contra el mismo `addHabitLog`.
Hoy no muerde porque `HabitLogAddInput` no tiene `timeOfDay` en el SDL y el
cliente no usa esa mutación, pero **si alguna pantalla acaba marcando por ahí, la
hora se perderá sin error y sin rastro**, igual que habría pasado en
`habitFollowUpAdd`. Si la 3b necesita esa mutación, hay que añadir el campo en
los tres sitios (SDL, validador y resolver) a la vez.

**Riesgo que queda:** el `::time` del `CASE WHEN` obliga a Postgres a castear la
cadena; con una hora válida («07:05», «22:15:00») es lo mismo que hacía antes el
parámetro suelto, pero eso solo lo confirma el primer `habitFollowUpEdit` real
contra la API desplegada.

**Estado del árbol:** **sin commitear**. En `xavi-platform-node`, sobre lo ya
revisado, cambian `src/services/habit.service.ts`,
`src/types/services/habit.types.ts`, `src/graphql/modules/habit/habit.schema.ts`
y `tests/unit/validators/habit.schemas.test.ts`, y aparece
`tests/unit/services/habit-follow-up-time-of-day.service.test.ts`. En el front,
solo este expediente.

### Tajada 1 — las cifras que faltan

**Resumen para el revisor:** el panel del hábito enseña ahora **siete fichas**
—«Tu récord» como ficha propia, «Salvavidas usados» y «Dificultad media», que
entra la última y solo si hay algún día con dificultad anotada—, y el gráfico de
episodios **deja de llamar «récord»** a su tramo más largo: ahora es «mejor
tramo», y cuando el récord de toda la vida no cabe en el tramo lo dice sin
fecha. Todo sale de lo que ya estaba en memoria: ni una consulta más, ni un
archivo de `graphql/`, `api/` o `src/shared/api/` tocado.

**Lo que más probablemente rompí:** el rótulo del gráfico de rachas. Cambié la
palabra «récord» por «mejor tramo» en cuatro sitios de
`HabitStreakEpisodesChart` (leyenda, etiqueta del dibujo, tabla oculta y
tooltip) y **tuve que reescribir el texto esperado de un test que ya existía**
—`rotula el récord y la racha en curso`—; si alguien fuera de este expediente
buscaba la cadena «récord» en ese gráfico, ya no está. El segundo candidato es
el ancho en escritorio: con siete fichas el `auto-fit` reparte **seis columnas a
1024 px** en vez de cuatro anchas, así que **todas las fichas son más estrechas
que antes en pantalla grande** (155 px frente a ~240). Mide bien —no hay
desbordamiento en ningún ancho— pero es un cambio visual que nadie pidió y que
solo se ve en escritorio.

**Lo que se construyó:**

- `src/features/habits/utils/habit-panel.utils.ts` — **modificado**: nace
  `buildAverageDifficulty(days): { average, daysWithDifficulty } | null`, junto a
  `hasAnyDifficulty`, con el mismo recorrido que `buildDifficultySeries`.
  Devuelve `null` sin ningún día anotado. **No nació ningún `utils` paralelo**
  (criterio 438) ni se tocó ninguna función existente.
- `src/features/habits/components/HabitPanel/HabitPanelTiles.tsx` —
  **modificado**: «Tu récord» sale del `helperText` de «Racha actual» y pasa a
  `StatCard` propio con `habit.maxStreak`; fichas nuevas «Salvavidas usados»
  (`summary.lifelines` + «En los últimos 90 días») y «Dificultad media»
  (condicional, **la última de la rejilla**). `Props` gana `rangeScopeLabel` y
  `avgDifficulty`. Todas siguen siendo `StatCard` de `@/shared/ui/StatCard`
  (criterio 436).
- `src/features/habits/components/HabitPanel/HabitPanel.tsx` — **modificado**:
  un `useMemo` más (`buildAverageDifficulty(days)`) junto a los que ya había y
  los props nuevos. **Ni un hook de datos nuevo.**
- `src/features/habits/components/HabitPanel/HabitStreakEpisodesChart.tsx` —
  **modificado**: «récord» → «mejor tramo» en los cuatro sitios donde se
  rotulaba, y dos props opcionales (`lifetimeRecordDays`, `recordIsOngoing`) que
  solo sirven para escribir, debajo del dibujo, «Tu récord de 21 días es de antes
  de este tramo.» cuando el récord no cabe en el tramo y no es la racha viva.
- `habit-panel.utils.test.ts` y `HabitPanel.test.tsx` — **modificados**: 13
  aserciones nuevas en 10 casos nuevos. **Cero líneas de aserción borradas**
  (criterio 439); la única aserción **reescrita** es la del rótulo del gráfico
  («récord» → «mejor tramo»), que es justo lo que pide el criterio 431.
- **`HabitPanel.module.scss` no se tocó.** La rejilla `.tiles` ya era
  `repeat(auto-fit, minmax(9rem, 1fr))` y el render aprobado pide exactamente lo
  que eso da a 375 px: **dos columnas**. Medido antes de decidirlo.

**Por qué así, y qué descarté:**

- **La dificultad se imprime «2,4 de 4», no «2,4/5».** El render dibuja `/5`,
  pero **la escala real del código es 0–4** (`habit-difficulty.utils.ts`, y el
  gráfico de dificultad ya dice «sobre 4»). Escribir `/5` sería la única cifra
  falsa del panel: criterio 473 manda sobre el render en un número. **Es la
  única desviación del render y está aquí para que el usuario la confirme o la
  rechace.**
- **«Días totales» sigue imprimiéndose `1204`, no `1 204`.** El render usa el
  separador de millares para dibujar el número más largo posible, que es un
  argumento de ancho, no de formato; cambiar el formato no lo pedía ningún
  criterio y toca una ficha que no es de esta tajada.
- **La frase del récord vive en el gráfico de episodios, no en un bloque
  nuevo.** El render la dibuja bajo un bloque titulado «Mejor tramo de estos 90
  días»; en la app ese bloque **es** `HabitStreakEpisodesChart`, así que la
  frase entra ahí como `<p>` con el estilo `.subtitle` que ya existe. Descarté
  crear una regla SCSS nueva: con cero SCSS tocado, la trampa del comentario sin
  cerrar no puede morderme y el CSS del build queda **idéntico**.
- **La frase se calla si el récord es la racha viva** (`recordIsOngoing`).
  Decirle «es de antes de este tramo» a alguien cuya racha récord sigue corriendo
  sería falso, y el caso existe en cuanto el rango es más corto que la racha.
- **«Es la racha que llevas ahora» solo con `maxStreak > 0`.** Con un hábito sin
  ninguna racha (0 y 0) la frase sobraría.

**Verificación:**

- `pnpm typecheck` → limpio (línea base: limpio).
- `pnpm lint` → `✖ 14 problems (14 errors, 0 warnings)` (línea base: 14/0). Ni
  uno nuevo, ni uno en los archivos tocados.
- `pnpm test` → `Test Files 1 failed | 129 passed (130)`, `Tests 2 failed | 2197
  passed (2199)`. Los dos fallos son los preexistentes de `SearchSelect`
  (`SearchSelect.test.tsx:40`). Línea base: 2 de 2186 → **2 de 2199**: +13 tests,
  todos verdes. **El flaky de `IconPicker` no apareció** en esta corrida.
- `pnpm build` → en verde. Chunk inicial **1.151,86 kB** (línea base 1.150,90 →
  +0,96 kB de código nuevo) y **CSS 279,51 kB, exactamente la línea base**: no se
  tocó ni un `.scss`, así que no hay bajada que investigar.
- `git diff --name-only` → siete archivos, **ninguno** bajo `graphql/`, `api/` ni
  `src/shared/api/`. **La caché persistida de nadie se tira**: el `buster` de
  `vite/cache-shape.ts` no se mueve (criterio 478, y la promesa del despliegue).
- **Anchos, medidos con arnés temporal** (`harness-feat015.html` +
  `src/harness-feat015.tsx`, **ya borrados**, con los números más largos posibles:
  récord 365, `days` 1204, 12 salvavidas, media 2,4 sobre 128 días). Caja de
  ancho exacto, `scrollWidth` frente a `clientWidth` de la rejilla, de cada ficha
  y de cada párrafo:

  | Ancho | Columnas | ¿Desborda la rejilla? | Fichas desbordadas |
  |---|---|---|---|
  | 320 px | 1 | no (288 = 288) | 0 |
  | **375 px** | **2** (165,5 px) | **no (343 = 343)** | **0** |
  | 414 px | 2 | no (382 = 382) | 0 |
  | 600 px | 3 | no (568 = 568) | 0 |
  | **760 px** | **4** (173 px) | **no (728 = 728)** | **0** |
  | 1024 px | 6 (155 px) | no (992 = 992) | 0 |

**Criterios, uno a uno:**

- **430 — cumplido.** «Tu récord» es un `StatCard` con el mismo molde que «Racha
  actual» (`HabitPanelTiles.tsx`), con `days(habit.maxStreak)` como valor. El
  `helperText` «Tu récord son N días» de «Racha actual» **desapareció** y el test
  `queryByText(/Tu récord son/)` lo vigila. Ninguna cadena nueva nombra una
  fecha del récord.
- **431 — cumplido.** La ficha lee `habit.maxStreak`; el gráfico de episodios ya
  no dice «récord» en ningún sitio (leyenda «Mejor tramo del rango», etiqueta
  «mejor tramo», tabla oculta «mejor tramo», tooltip «· mejor tramo»). El caso
  del criterio está probado: con `lifetimeRecordDays={34}` y un mejor episodio de
  21, el gráfico no contiene «récord» y aparece «Tu récord de 34 días es de antes
  de este tramo.» (`HabitPanel.test.tsx`, dos casos).
- **432 — cumplido.** Con `streak === maxStreak` la ficha del récord añade «Es la
  racha que llevas ahora» y las dos cifras se leen como una sola cosa; el test
  comprueba el texto y que «21 días» aparece exactamente dos veces (una por
  ficha), no una tercera como logro distinto.
- **433 — cumplido.** Ficha «Salvavidas usados» con `summary.lifelines` y «En los
  últimos 90 días» (o «En el último año» con el rango en 365). Con cero, el test
  comprueba que la ficha sigue ahí y dice `0`.
- **434 — cumplido.** `buildAverageDifficulty` promedia **solo** los días con
  dificultad anotada —probado con dos días anotados de cuatro— y la ficha dice
  «Media de 12 días con dificultad». Sin ninguno devuelve `null` y la ficha **no
  se monta** (`queryByText('Dificultad media')` ausente).
- **435 — cumplido.** El `diff` de `HabitPanel.tsx` son doce líneas: un `useMemo`
  sobre `days` —que ya estaba en memoria— y los props. **No hay ninguna llamada a
  hook nueva**; las dos `useHabitFollowUpsInDatesQuery` de siempre siguen siendo
  las únicas. No hice el espía de red porque el panel vive tras el login: la
  evidencia es el diff, y queda como paso manual del usuario.
- **436 — cumplido.** Siete `StatCard` de `@/shared/ui/StatCard` en
  `HabitPanelTiles`. Ningún componente nuevo en el árbol (`git status`: siete
  archivos, todos modificados, ninguno nuevo).
- **437 — cumplido.** Tabla de arriba: a 375 px, dos columnas, `scrollWidth ===
  clientWidth` en la rejilla y **cero fichas desbordadas**, con récord de tres
  cifras (365) y `days` de cuatro (1204). Medido también a 760 px y a cuatro
  anchos más.
- **438 — cumplido.** La aritmética entró en `habit-panel.utils.ts` y se prueba
  en `habit-panel.utils.test.ts`. No hay ningún archivo nuevo.
- **439 — cumplido.** Cero líneas de aserción borradas: los 49 tests que había
  siguen ahí. Un `expect` cambió de texto esperado («récord» → «mejor tramo»)
  porque el criterio 431 lo obliga; el resto son añadidos.
- **473 — cumplido.** Ninguna cifra se presenta como otra: el récord es de toda
  la vida y lo dice, el mejor tramo es del rango y lo dice. El cero de salvavidas
  se imprime porque es cierto; el de dificultad no existe porque no se sabe. La
  media se imprime «de 4», que es la escala real del código.
- **474 — cumplido.** Cadenas nuevas: «Tu récord», «Es la racha que llevas
  ahora», «Salvavidas usados», «En los últimos 90 días», «Dificultad media»,
  «Media de N días con dificultad», «mejor tramo», «Tu récord de N días es de
  antes de este tramo». Ni una nombra un fallo ni un deber. Hay un test que lo
  vigila (`/fallaste|desperdici|deberías/i`).
- **475 — cumplido por no tocarlo.** Las cuatro salidas tempranas de
  `HabitPanel` (sin fecha de inicio, `isLoading`, `isError`, sin registros) no
  cambiaron una línea, y las fichas solo se montan después de ellas. El nombre
  largo del hábito vive en la cabecera de `HabitDetailPage`, fuera de esta
  tajada.
- **476 — cumplido para las fichas**, que es lo que esta tajada toca: a 375 px
  `scrollWidth === clientWidth` y cero nodos desbordados. **El panel entero no
  lo pude medir**: está tras el login y el arnés monta las fichas, no la página.
  Queda como prueba manual del usuario.
- **477 — cumplido.** Ver «Verificación»: typecheck limpio, lint 14/0, tests 2 de
  2199 (los mismos dos), build en 0.
- **478 — cumplido y verificado con `git diff --name-only`:** cero archivos de
  `graphql/`, de `api/` y de `src/shared/api/`. Nadie pierde la caché.
- **479 — cumplido.** Ninguna ruta, ninguna página, ninguna entrada de menú:
  `src/app/router/`, `habits-paths.ts` y `app-nav.config.ts` no aparecen en el
  diff.
- **480 — pendiente de prueba manual (es del usuario).** Pasos: entrar en la app,
  abrir **Mis hábitos → un hábito con historia → pestaña Panel**; con el rango en
  **90 d** comprobar las seis fichas y, si ese hábito tiene días con dificultad,
  la séptima; poner el rango en **30 d** en un hábito cuyo récord sea mayor que
  cualquier racha del mes y comprobar que «Tu récord» no cambia y que bajo «Tus
  rachas, una a una» aparece «Tu récord de N días es de antes de este tramo»; y
  mirarlo en el móvil de verdad a ver si dos columnas se leen bien.

**Riesgos:**

- **El rótulo del gráfico de rachas cambió de palabra.** Cualquier cosa fuera de
  este expediente que buscara «récord» en `HabitStreakEpisodesChart` ya no lo
  encuentra. Busqué en el repositorio y solo lo usaba su propio test.
- **Las fichas son más estrechas en escritorio** (seis columnas a 1024 px en vez
  de cuatro anchas). No desborda nada, pero el rótulo «Cumplimiento 90 d» tiene
  una palabra —«Cumplimiento»— de 105 px que no cabe en los 100 px de caja útil
  de la ficha y se come 5 px del relleno. **Es preexistente**: con cuatro fichas
  ya pasaba exactamente igual a 375 px, donde la ficha medía los mismos 165 px.
  Ahora, además, pasa en escritorio. No lo toqué porque el relleno lo absorbe y
  porque `StatCard` es de `shared/ui` y lo usan otras pantallas.
- **`buildAverageDifficulty` cuenta también la dificultad de días fallados y de
  salvavidas**, no solo la de los cumplidos. Es lo que dice el criterio («los
  días con dificultad registrada») y está probado explícitamente, pero es una
  decisión que se puede leer de otra manera y conviene que alguien la mire.

**Estado del árbol:** **sin commitear**. Siete archivos modificados, ninguno
nuevo. El arnés de medición (`harness-feat015.html`, `src/harness-feat015.tsx`)
**se borró**: `git status` no lo lista. `graphify update .` corrido.

### Tajada 1 · corrección tras la revisión — la frase ya no puede mentir, y el escritorio vuelve a ser ancho

**Resumen para el revisor:** la frase «Tu récord de N días es de antes de este
tramo» **se decide ahora sobre `episodes`** (el tramo entero) y no sobre
`visible` (las doce barras dibujadas), que era el defecto que devolvió la
tajada; hay **cuatro tests nuevos** y tres de ellos montan `HabitPanel`
**entero con el rango en 365**, que era el hueco de fondo señalado. Y `.tiles`
gana un `@media` de tablet para arriba: a 1024 px las fichas vuelven a **4
columnas de 239 px**, exactamente el ancho de `HEAD`.

**Lo que más probablemente rompí esta vez:** el `@media` de `.tiles`, que es el
**único SCSS** que toca esta tajada. Cambia la rejilla **de 768 px para arriba**
—a 768 pasa de 4 columnas de 173 px a 3 de 237— y ese es un ancho que nadie
había medido ni en `HEAD` ni en la revisión: la tabla de abajo lo mide, pero es
el sitio donde miraría primero. Por debajo de 768 px no cambia ni un píxel, y
eso sí está medido a 375 y a 760.

**Lo que se construyó:**

- `HabitStreakEpisodesChart.tsx` — `longest` (la escala de las barras, sobre
  `visible`) y `longestInRange` (la frase, sobre `episodes`) pasan a ser **dos
  cosas distintas y comentadas**. `olderRecordDays` compara contra
  `longestInRange`. Una línea de arreglo y cuatro de comentario diciendo por qué
  no son la misma.
- `HabitPanel.module.scss` — `.tiles` gana
  `@include md { grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); }`.
  Es `auto-fit` a propósito, **no cuatro columnas fijas**: de 1024 px para
  arriba aparece la barra lateral y el contenedor real es más estrecho que la
  ventana, así que una rejilla fija de cuatro daría fichas **más** estrechas que
  las del móvil. `auto-fit` se adapta al contenedor de verdad.
- `HabitPanel.test.tsx` — cuatro casos nuevos:
  1. En el gráfico, 15 rachas con la récord (21 días) fuera de las 12 dibujadas
     y `lifetimeRecordDays={21}`: la frase **no** aparece.
  2. `HabitPanel` **entero**, rango 365, hábito con quince rachas en el año (una
     de 21 días hace 350 y catorce de dos días recientes): el gráfico trunca —el
     `21` no está entre las barras— y la frase **no** aparece.
  3. El mismo panel con `maxStreak: 40`: la frase **sí** aparece, y sin fecha.
  4. El mismo panel: la ficha de salvavidas dice **«En el último año»** y no
     «En los últimos 365 d» — el cableado de `HabitPanel.tsx:207` que, como
     señalaste, no cubría ningún test.
  El módulo `useHabits` se mockea con `vi.mock` para montar el panel sin red.

**La prueba de que los tests nuevos sirven** (un test que pasa con y sin el
arreglo no prueba nada). Con `longestInRange` revertido a `longest`:

```
× con más de 12 rachas, la frase mira el tramo entero y no solo lo dibujado
× no dice que el récord sea «de antes» cuando está dentro del tramo y solo no se dibuja
  Tests  2 failed | 17 passed (19)
```

Con el arreglo puesto, `19 passed (19)`. La fuente quedó restaurada
(`lifetimeRecordDays > longestInRange`).

**Anchos, medidos con el viewport emulado de verdad** (arnés temporal, ya
borrado). Las `@media` se evalúan contra la ventana, así que esta vez la medida
va con `resize_window` y no con una caja de ancho fijo. «Antes» son las 4 fichas
de `HEAD` según la tabla del revisor:

| Ancho | Antes (4 fichas) | Devuelto (7 fichas) | **Ahora** | ¿Desborda? |
|---|---|---|---|---|
| **375 px** | 2 col · 165,5 | 2 col · 165,5 | **2 col · 165,5 · 4 filas** | no (343 = 343, doc 375 = 375) |
| **760 px** | 4 col · 173 | 4 col · 173 | **4 col · 173 · 2 filas** | no (728 = 728) |
| 768 px | 4 col · 173 | 4 col · 173 | **3 col · 237 · 3 filas** | no (736 = 736) |
| **1024 px** | **4 col · 239** | 6 col · 155 | **4 col · 239 · 2 filas** | no (992 = 992) |
| 1440 px | 4 col · 343 | 7 col · 191 | 6 col · 224,7 · 2 filas | no (1408 = 1408) |

A 1024 px **ningún rótulo va a dos líneas** (los siete miden 19,5 px de alto, una
línea), ningún valor se parte (36 px) y **«Cumplimiento 90 d» ya no desborda su
caja**: `scrollWidth - clientWidth = 0` en las siete fichas y en sus párrafos.
La séptima ficha ya no se queda sola: las filas son 4 + 3.

**El SCSS, comprobado por la lista de selectores y no por el tamaño** (regla del
`ENVIRONMENT.md`). Compilando el módulo de `HEAD` y el del árbol con
`sass --style=compressed`:

```
selectores: HEAD 16 / ÁRBOL 18
3a4   > {         (la apertura del tercer bloque @media)
13a15 > .tiles{
```

**No falta ninguno**: los 16 de `HEAD` siguen ahí y aparece uno nuevo, `.tiles`
dentro de un tercer `@media(min-width: 768px)`. El CSS del build **sube** de
279,51 a **279,61 kB**, que son los 92 bytes de esa regla: una subida explicada,
no una bajada que investigar.

**Verificación** (línea base de la devolución: tests 2 de 2199, lint 14/0, chunk
1.151,86 kB, CSS 279,51 kB):

- `pnpm typecheck` → limpio.
- `pnpm lint` → `✖ 14 problems (14 errors, 0 warnings)`. Línea base exacta.
- `pnpm test` → `Test Files 1 failed | 129 passed (130)`, `Tests 2 failed | 2201
  passed (2203)`. Los dos de siempre (`SearchSelect`). **+4 tests**, todos
  verdes. El flaky de `IconPicker` no apareció.
- `pnpm build` → verde. Chunk **1.151,90 kB** (+0,04) y CSS **279,61 kB**
  (+0,10, la regla nueva).
- `git diff --name-only` → sigue sin tocar `graphql/`, `api/` ni
  `src/shared/api/`. **Nadie pierde la caché**: esta corrección no añade ningún
  fichero a la huella que ejecutaste (`f8edc4f3becd` en los dos lados).

**Criterios afectados:**

- **473 — ahora sí cumplido.** La frase solo aparece cuando el récord es mayor
  que **la racha más larga del tramo entero**, dibujada o no, y sigue sin decir
  cuándo fue. Tres tests lo vigilan, dos de ellos sobre el panel completo.
- **437 y 476 — siguen cumplidos, y ahora también en escritorio.** A 375 px no
  se movió nada: mismas dos columnas, mismos 165,5 px, `scrollWidth ===
  clientWidth` en la rejilla y en el documento.
- **477 — cumplido** con la línea base nueva de tests (2 de 2203).
- **480 — sigue pendiente del usuario**, con un paso más, que es el que devolvió
  la tajada: **rango en 1 año, hábito con más de 12 rachas**, comprobar que la
  frase del récord no aparece si el récord está dentro del año.

**Lo que NO toqué, por encargo:** el rótulo «CUMPLIMIENTO 90 D» que desborda su
caja a 375 px. Es preexistente, es del `padding` de `StatCard` (`shared/ui`) y
se midió igual en `HEAD`. Queda escrito aquí y no arreglado aquí. Un dato que
sale de esta medición y ayudará a quien lo coja: **a 1024 px ya no desborda**,
porque la ficha pasa de 155 a 239 px; el defecto solo vive donde la caja útil
baja de unos 106 px.

**Riesgos de esta corrección:**

- **El `@media` cambia la rejilla en la banda 768–1023 px**, que nadie había
  medido. A 768 son 3 columnas de 237 en vez de 4 de 173: más anchas, pero es un
  cambio visual que no pidió ningún criterio. Si se prefiere que 768–1023 se
  quede como estaba, el arreglo es cambiar `@include md` por `@include lg` —una
  palabra— a cambio de que el apretujón de seis columnas reaparezca justo debajo
  de 1024 px.
- **A 1440 px son 6 columnas de 224,7 px** (antes, con cuatro fichas, 4 de 343).
  No desborda nada y los rótulos caben en una línea, pero en pantallas muy
  anchas la rejilla es más densa que antes. En la app real hay barra lateral de
  1024 para arriba, así que el contenedor es más estrecho que la ventana y esto
  se ve menos de lo que dice la tabla.
- **El `vi.mock` de `useHabits` es nuevo en esta suite** y solo declara
  `useHabitFollowUpsInDatesQuery`. Si alguien añade a `HabitPanel` otro hook de
  ese módulo, la suite no fallará con un error claro sino con `undefined is not
  a function`. Es la trampa nº 3 del plan, ahora también aquí.

**Estado del árbol:** **sin commitear**. Ocho archivos modificados (los siete de
antes más `HabitPanel.module.scss`), ninguno nuevo. Arnés de medición borrado
(`git status` no lo lista). `graphify update .` corrido.

### Tajada 2 — dónde se falla, contado como fallos

**Resumen para el revisor:** el reparto por día de la semana **cuenta fallos y
ya no porcentajes de cumplimiento**, cada barra lleva su cuenta encima y debajo
del gráfico hay una frase que **dice el umbral en voz alta** (4 apariciones con
registro por día) tanto cuando señala un día como cuando calla. **«Vas peor»,
«Vas mejor» y «Vas parecido» han muerto**: la lectura de arriba dice las dos
cifras y la diferencia en puntos, sin adjetivo. Ni `graphql/`, ni `api/`, ni
`src/shared/api/`, ni un `.scss`: `git diff --stat` son cuatro archivos de
`features/habits`.

**Lo que más probablemente rompí:** la firma de `composeReading`, que **pierde
su tercer parámetro** (`worst: WeekdayStat | null`). Cualquier llamada de fuera
del panel se rompería en compilación —no la hay, `tsc -b` está limpio—, pero es
el cambio con más alcance. Detrás va la desaparición de `getWorstWeekday`
(ahora `getMostFailedWeekday`, con otra semántica): quien buscara esa función
por nombre ya no la encuentra, y **la tabla oculta del gráfico cambió de
título, de columnas y de orden** (`Día · Fallados · Cumplidos · Sin registro ·
Apariciones con registro`), así que cualquier consulta por el nombre viejo
—«Cumplimiento por día de la semana»— falla. Tercer candidato: los tooltips del
gráfico ahora hablan de fallos y de huecos, no de porcentaje.

**Lo que se construyó:**

- `src/features/habits/utils/habit-panel.utils.ts` — **modificado**:
  - **El umbral vive aquí y solo aquí**: `MIN_TRACKED_PER_WEEKDAY = 4` y
    `MIN_WEEKDAYS_COMPARABLE = 2`, exportadas junto a `MIN_DAYS_FOR_TREND`.
    Bajarlo a 3 es cambiar una línea. Con ellas, `BY_FAR_RATIO` y
    `BY_FAR_MARGIN` (privadas), que deciden si se puede decir «de largo».
  - `WeekdayStat` gana `tracked` (cubiertos + fallados) y `failRate`.
    `buildWeekdayBreakdown` las rellena. **Un día sin registrar no entra en el
    denominador de nada.**
  - `getWorstWeekday` → **`getMostFailedWeekday`**, reescrita: filtra por
    `tracked >= MIN_TRACKED_PER_WEEKDAY` (con `getComparableWeekdays`, también
    exportada), coge el de más `failed` y devuelve `null` si no hay dos días
    comparables, si no hay ningún fallo o si hay empate en la cabeza. **No
    desempata en silencio.**
  - **Nueva `composeWeekdayFailNote(stats, most)`**: la frase de debajo del
    gráfico, con un texto distinto por estado —el hecho con su cuenta cruda, el
    umbral que falta, el único día comparable, el empate, el tramo sin fallos— y
    `null` cuando no hay ni una aparición con registro. `leadsByFar` decide el
    «, de largo».
  - `composeReading` **pierde el tercer parámetro** y los tres veredictos.
    Ahora: «Cumpliste el 80% de los días de este tramo; en el tramo anterior, el
    40%. Son 40 puntos más.» `MEANINGFUL_DELTA_POINTS` sigue decidiendo si la
    diferencia se nombra, pero lo que se nombra es la diferencia, no quien la
    produjo.
- `src/features/habits/components/HabitPanel/HabitWeekdayChart.tsx` —
  **modificado** (criterio 452: es el mismo gráfico, no nace otro). Barras de
  **fallos** con la cuenta encima, escala sobre el máximo de fallos, subtítulo
  «Días fallados, por día de la semana · …», etiqueta «más fallos» en el día
  señalado, días por debajo del umbral **apagados** (opacidad 0,3 frente a 0,6),
  la frase debajo del dibujo y la tabla oculta con las cinco columnas nuevas.
  `Props` pasa de `{stats, worst, rangeLabel}` a `{stats, most, note, rangeLabel}`.
- `src/features/habits/components/HabitPanel/HabitPanel.tsx` — **modificado**:
  dos `useMemo` (`mostFailedWeekday`, `weekdayNote`) donde había uno, y la
  llamada a `composeReading` con dos argumentos. **Ni una consulta nueva.**
- `habit-panel.utils.test.ts` y `HabitPanel.test.tsx` — **modificados**: +14
  tests netos (2203 → 2217 con los mismos 2 fallos de siempre).

**Por qué así, y qué descarté:**

- **El denominador de la frase es `tracked`, no `total`.** «Los viernes fallas 9
  de 13 veces» cuenta **apariciones con registro**, que es lo mismo que mide el
  umbral. Si se usara `total`, un tramo con viernes sin registrar diría «9 de
  13» teniendo solo 10 registrados: el vicio de la tajada 1 —decir una cosa y
  contar otra— con otro disfraz. Por eso **la tabla oculta enseña las dos
  columnas**, `Sin registro` y `Apariciones con registro`, y el test las compara
  celda a celda.
- **«De largo» es condicional.** El render lo dibuja en el caso 9 frente a 6,
  pero escrito fijo sería falso cuando el primero gana por uno. Se dice solo con
  ventaja de **al menos vez y media y dos fallos más** (9 ≥ 6×1,5 y 9−6 = 3: el
  caso del render sale «de largo», como está aprobado). Descartado dejarlo fijo:
  es una afirmación de distancia y el criterio 473 manda.
- **Dos desviaciones del render, las dos por el criterio 444** (grep de frases
  prohibidas = cero) **y las dos declaradas aquí para que el usuario las
  confirme o las rechace**:
  1. El render rotula «Días **que fallaste**, por día de la semana» y lo repite
     en la leyenda. «fallaste» está **literalmente** en la lista de frases
     prohibidas de la sección 1. Se escribe **«Días fallados»**. Es lo único que
     cambia de esos dos rótulos.
  2. La frase del tercer estado. El render dice «Cada día ha aparecido **4 veces
     o menos**… todavía no hay bastante», pero con el umbral en 4 un día de
     exactamente 4 **sí** basta: la frase sería falsa en el borde. Se escribe la
     cifra real del tramo y el objetivo: «Cada día ha aparecido **3 veces o
     menos** en este tramo. Con 4 ya se puede comparar: todavía no hay bastante
     para decir dónde se te cae.» La segunda mitad es literal del render.
  La frase del caso bueno **sí es literal**: «Los martes fallas 4 de 6 veces. Es
  el día donde más se te cae, de largo.»
- **`composeReading` se quedó arriba y la frase del día bajó al gráfico**, como
  en el render. Descartado dejar la coletilla «Donde se te cae: …» en la lectura
  de arriba: repetía en porcentaje lo que el gráfico dice en fallos, que es
  justo la confusión que esta tajada mata.
- **`shouldAvoid` (criterio 449): sigue sin leerse al revés, y ahora hay una
  razón escrita.** El verbo de todas las cadenas nuevas es «fallar», que es el
  que ya usa el módulo y significa lo mismo en los dos tipos (`isFailed` = se
  falló el hábito; en uno a evitar, que se hizo lo que se quería evitar). La
  aritmética es simétrica y **no hay nada que invertir**; queda dicho en el
  comentario de `composeWeekdayFailNote`. No se partió la frase en dos.
- **Ningún `.scss` tocado**, así que la comprobación de selectores compilados no
  aplica: el CSS del build es **279,61 kB, idéntico a la línea base**, que es la
  forma más fuerte de decirlo.

**Verificación:**

*Los tests nuevos prueban algo* (uno que pasa con y sin el arreglo no prueba
nada). Volviendo `getMostFailedWeekday` a la selección por `percent` y
`getComparableWeekdays` a `total > 0`, o sea **el comportamiento de `HEAD`**:

```
× señala el día de más fallos, no el de menos cumplimiento (criterio 441)
× con menos de 4 apariciones no señala nada y dice cuánto falta (criterio 442)
× con un solo día comparable tampoco compara, y lo dice (criterio 442)
× «de largo» solo se dice cuando la ventaja es de verdad
× marca el día de más fallos con una etiqueta, no solo con el color
× dice el umbral en voz alta debajo del gráfico
× con pocas apariciones, calla y dice cuántas hay
× señala el día de más fallos aunque otro día esté entero sin registrar
× con pocas apariciones por día el panel calla y dice qué le falta
      Tests  9 failed | 68 passed (77)
```

Con la fuente restaurada, `77 passed (77)`.

*Línea base, entera:*

| Qué | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 errores / 0 warnings** (los mismos archivos) |
| `pnpm test` | 2 fallos de 2203 | **2 fallos de 2217** (`SearchSelect` ×2, los de siempre; `IconPicker` **no** salió) |
| `pnpm build` | chunk 1.151,90 kB · CSS 279,61 kB | **1.153,05 kB** (+1,15, las cadenas nuevas) · **CSS 279,61 kB, sin mover un byte** |

*Frases prohibidas*, `grep -rniE` de la lista entera sobre
`src/features/habits/` sin los tests: los únicos aciertos son
`intentarlo`/`Reintentar` en ocho errores de red **preexistentes y ajenos al
panel** («intenta» como subcadena). `vas peor`, `vas mejor`, `peor día`,
`fallaste`, `punto flaco`: **cero**, ni en código ni en comentarios —el
comentario que explicaba la muerte de los veredictos está escrito sin citarlos.

*En pantalla*, arnés temporal (`harness-weekday.html` + `src/harness-weekday.tsx`,
**ya borrados**, `git status` limpio de ellos) con los tres estados del render y
el viewport emulado de verdad:

| Ancho | `scrollWidth` / `clientWidth` del documento | Nodos desbordados |
|---|---|---|
| **375 px** | 375 = 375 | **0** (excluida `.srOnly`, que recorta a propósito) |
| **768 px** | 753 = 753 | **0** |
| **1024 px** | 1009 = 1009 | **0** |

La etiqueta «más fallos» es más larga que la «peor día» que sustituye, así que
se midió su caja en unidades del `viewBox` (42,7 de ancho): puesta en el lunes
ocupa de 2,95 a 45,6 y puesta en el domingo de 294,4 a 337,0, dentro de
`0 … 340`. **No se recorta en ninguno de los siete días.**

*Oscuro* (criterio 451), contraste sobre el fondo **compuesto** del panel
(`rgb(19,27,43)`, el `rgba` del vidrio sobre el fondo de página):

| Texto | Color | Ratio |
|---|---|---|
| La frase de debajo y el subtítulo | `rgb(124,138,165)` | **4,97:1** |
| Las cuentas encima de las barras | `rgb(168,179,199)` | **8,18:1** |
| La cuenta del día señalado | `rgb(255,180,171)` | **10,17:1** |
| La leyenda | `rgb(168,179,199)` | **7,88:1** |

**Criterios, uno a uno:**

- **440 · cumplidos / fallados / sin registro, y el hueco no se pinta como
  fallo.** Cumplido. Los tres están en la tabla oculta (`Fallados`,
  `Cumplidos`, `Sin registro`) y en el tooltip; el dibujo solo pinta barra si
  `tracked > 0 && failed > 0`. Test: *un día sin registrar no entra en el
  denominador* (6 viernes → `total 6, tracked 4, covered 2, failed 2,
  untracked 2`) y, en el panel entero, la fila del domingo con `0 · 0 · 13 · 0`.
- **441 · el día que se señala es el de más fallos.** Cumplido, con el caso
  obligatorio montado **dos veces**: en el util (6 domingos sin registrar y 6
  martes con 4 fallados → señala **martes**, y se afirma de paso que el domingo
  está al 0 %, que es por lo que ganaba antes) y **en el panel entero**
  (`HabitPanel` con `range={90}`, 84 días sembrados, domingos sin registro:
  «Los martes fallas 4 de 12 veces»). Los dos tests **fallan** con el código de
  `HEAD`, arriba está la salida.
- **442 · ≥ 4 apariciones con registro y ≥ 2 días comparables, o se dice qué
  falta con la cifra.** Cumplido, y los dos sub-casos tienen test propio: sin
  ningún día comparable («Cada día ha aparecido 3 veces o menos…; con 4 ya se
  puede comparar») y con uno solo («Solo los lunes llegan a 4 apariciones en
  este tramo. Con 2 días ya se puede comparar»). También en el panel entero.
- **443 · si ninguno destaca, no se elige el primero.** Cumplido. Empate arriba
  → `null` + «Ningún día destaca en este tramo: 2 días empatan a 3 fallos».
  Tramo sin fallos → `null` + «En este tramo no hay ningún día fallado».
- **444 · cuenta cruda y cero frases prohibidas.** Cumplido: «4 de 6 veces», «9
  de 13 veces». El `grep` está arriba. Además hay un test que pasa los cinco
  estados de la frase por la lista de prohibidas **y** por «sueles / siempre /
  nunca / otra vez / ya van».
- **445 · «Vas peor» desaparece.** Cumplido. `grep -rn "Vas peor\|Vas mejor"
  src/features/habits/` (fuente) = **cero**, y `composeReading` compara con las
  dos cifras. Test en el panel entero: el texto del `body` entero no casa
  `/vas (peor|mejor|parecido)/i` y sí aparece «Cumpliste el N% de los días de
  este tramo».
- **446 · ni imperativos ni consejos.** Cumplido, mismo test.
- **447 · hábito recién creado.** Cumplido **sin tocar nada**: `HabitPanel`
  corta antes con su `EmptyState` («Todavía no hay nada que medir aquí») cuando
  no hay ni un seguimiento, y el gráfico no llega a montarse. No aparece ningún
  0 %.
- **448 · con un solo día registrado, nada comparativo y ningún «0» por «sin
  dato».** Cumplido: con 1 registro ningún día llega a 4 apariciones →
  `getMostFailedWeekday` es `null` y la frase dice la cifra que hay. El día sin
  ninguna aparición dibuja **«—»**, no «0» (test *cuenta fallos, no
  porcentajes*, que comprueba que «—» está y que no hay ningún «%»).
- **449 · `shouldAvoid` no se lee al revés.** Cumplido y **declarado dónde**:
  `getHabitDayStatus` (`habit-progress.utils.ts:106-116`) no mira `shouldAvoid`,
  y el verbo elegido («fallar») significa lo mismo en los dos tipos. Queda
  escrito en el comentario de `composeWeekdayFailNote`. **Sin test de un hábito
  a evitar**: la aritmética no se bifurca, así que un test sería una copia del
  anterior con otro `habit` que no toca ninguna rama nueva. Dicho, no disimulado.
- **450 · recalcula al cambiar de rango sin consultas nuevas.** Cumplido: los
  dos derivados son `useMemo` sobre `days`; `git diff --stat` no toca ningún
  hook ni ninguna clave.
- **451 · ≥ 4,5:1 en oscuro.** Cumplido, tabla de contraste arriba, mínimo
  **4,97:1**.
- **452 · se modifica `HabitWeekdayChart`.** Cumplido: un solo archivo de
  gráfico tocado, ninguno nuevo.
- **473 · todo lo que se enseña es cierto.** Cumplido, y es lo que gobernó las
  dos desviaciones del render de arriba: el denominador es el que se mide, el
  «de largo» solo con ventaja real, y el «—» donde no hay dato.
- **474 · ni una palabra de reproche.** Cumplido (444 y 446).
- **475 · vacío / cargando / error / texto largo.** Vacío y error: los cortes
  tempranos de `HabitPanel` **no se tocaron** (`Spinner`, `Alert`,
  `EmptyState`), y los tests que ya los cubrían siguen verdes. Texto largo: el
  gráfico **no imprime el nombre del hábito** en ningún sitio, así que un nombre
  de 60 caracteres no le llega.
- **476 · a 375 px, `scrollWidth === clientWidth` y cero desbordados.**
  Cumplido, medido (375 = 375, cero nodos), y además a 768 y 1024.
- **477 · línea base no peor.** Cumplido, tabla arriba.
- **478 · la tajada no toca `graphql/` ni `api/`.** Cumplido:
  `git diff --stat` son `habit-panel.utils.ts`, `habit-panel.utils.test.ts`,
  `HabitWeekdayChart.tsx`, `HabitPanel.tsx`, `HabitPanel.test.tsx` y este
  expediente. **Tampoco `src/shared/api/`**, así que el `buster` de
  `vite/cache-shape.ts` no se mueve y **nadie pierde la caché**.
- **479 · ninguna ruta, página ni entrada de menú.** Cumplido.
- **480 · del usuario.** `/app/habits/:id` está tras el login: **pendiente de
  prueba manual**, pasos abajo.

**Pendiente de prueba manual (criterio 480):** entrar en `/app/habits/:id`, ficha
Panel, de un hábito con al menos tres meses de registros. (1) Con el rango en
**90 d**, comprobar que el gráfico «Dónde se te cae» dibuja **cuentas de fallos**
(números enteros, no porcentajes) y que la frase de debajo nombra el día con su
cuenta cruda. (2) Bajar a **30 d** en un hábito poco registrado: el panel debe
**callar** y decir cuántas apariciones hay. (3) Comprobar que en ningún sitio del
panel aparece «Vas peor», «Vas mejor» ni «peor día». (4) En un hábito de los de
**evitar** (`shouldAvoid`), leer la frase y confirmar que no dice lo contrario de
lo que pasó — es el único punto donde la redacción puede chirriar y no lo puedo
comprobar desde aquí.

**Lo que descubrí y no estaba en el plan:**

- **El render y el criterio 444 se contradicen en dos cadenas.** Está resuelto
  arriba a favor del criterio (que es literal y comprobable con `grep`), pero es
  una decisión de redacción sobre un render que el usuario aprobó hoy: **si
  prefiere las palabras del render, se cambian en dos líneas y el criterio 444
  hay que reescribirlo** — y eso no lo hago yo.
- **El umbral del render tiene un borde mal contado** («4 veces o menos» cuando
  4 ya basta). No es un fallo del umbral, es de la frase.
- **`MEANINGFUL_DELTA_POINTS` ya no significa lo que su nombre dice.** Decidía
  si el veredicto era «mejor», «peor» o «parecido»; ahora decide si la
  diferencia en puntos se nombra. El nombre aguanta, pero está a un paso de
  mentir. **No lo toqué**: renombrar una constante exportada no es de esta
  tajada.
- **`failRate` nace sin ningún consumidor.** Lo pedía el plan del arquitecto y
  lo dejé porque la tabla oculta y un futuro orden por tasa lo van a querer,
  pero hoy **solo lo lee un test**. Si el revisor prefiere que no exista hasta
  que alguien lo use, se borra en una línea.
- **El gráfico de «Cumplimiento semana a semana» sigue diciendo «▼ el bajón»**
  con una flecha y un color de alerta. No es una frase prohibida y no es de esta
  tajada, pero es el sitio del panel que más se parece a un juicio de los que
  acaban de morir. **No lo toqué**; queda apuntado.

**Estado del árbol:** sin commitear. Seis archivos modificados, cero creados,
cero borrados. El arnés temporal se borró antes de escribir esto.

### Tajada 2 · corrección tras la revisión — la frase que calla ya cuenta lo que dice

**Resumen para el revisor:** las **dos cadenas del caso de callar** dicen ahora
«**registros**» donde decían «apariciones», que es lo que de verdad se cuenta;
hay **dos tests nuevos** sembrados sobre el tramo largo con días sin registrar
—63 días, martes que aparecen nueve veces y están registrados tres— que es donde
la mentira se veía; y **`failRate` se ha borrado**. Nada más de la tajada se ha
tocado.

**Lo que más probablemente rompí esta vez:** nada de código, y lo digo con la
medida delante: el diff de fuente son **cuatro líneas de cadena y el borrado de
un campo de `WeekdayStat` que no leía nadie** (`git grep failRate` en `HEAD` y
en el árbol: solo su propia definición y una aserción). Si algo se rompe será
**una expectativa de texto en otra suite**, y la corrida entera (2219) dice que
no. El segundo candidato, y este sí es de mirar: la frase larga **pasa de dos a
tres líneas a 375 px** (de 141 a 143 caracteres), así que el gráfico del caso de
callar es unos 20 px más alto en móvil. Está medido abajo; no desborda.

**Lo que se construyó:**

- `habit-panel.utils.ts` — `composeWeekdayFailNote`, dos cadenas:
  - «Cada día ha aparecido **3 veces o menos**…» → «**De cada día de la semana
    hay 3 registros o menos** en este tramo. Con 4 ya se puede comparar:
    todavía no hay bastante para decir dónde se te cae.» La segunda mitad sigue
    siendo literal del render.
  - «Solo los lunes llegan a 4 **apariciones**…» → «Solo los lunes llegan a 4
    **registros** en este tramo. Con 2 días ya se puede comparar.»
  - Nace `pluralRecords(count)` al lado de `pluralTimes`, con el porqué escrito
    encima: en 63 días los martes aparecen nueve veces aunque solo tres estén
    registrados.
- `habit-panel.utils.ts` — **`failRate` borrado** de `WeekdayStat` y de
  `buildWeekdayBreakdown`. En su hueco queda un comentario en `tracked` que dice
  qué era y por qué se fue: **una tasa sobre `tracked` que alguien iba a leer
  como si fuera sobre `total`**. Si vuelve, vuelve con un consumidor.
- `habit-panel.utils.test.ts` — **dos casos nuevos**, los dos sobre nueve semanas
  con días sin registrar, y los dos afirman **dos cosas**: la frase exacta y que
  **no aparece la palabra «aparic/aparec» ni el 9** (el número de apariciones
  reales, que es la cifra con la que se confundía).
- `habit-panel.utils.test.ts` — **el guardián que se fue sin relevo, devuelto**:
  `expect(note).not.toMatch(/propósito|identidad|recaíd/i)` entra en el test que
  recorre los cinco estados de `composeWeekdayFailNote`. Es la regla de producto
  del módulo, no la lista de frases prohibidas, y ahora vigila la frase que
  heredó el papel de la que la llevaba. (La aserción original sigue viva sobre
  `composeReading`, en `habit-panel.utils.test.ts:466`; el relevo era para la
  frase del día.)
- `HabitPanel.test.tsx` — la cadena esperada del caso de callar, actualizada.

**Lo que NO se tocó**, porque el revisor lo dio por bueno y porque el
coordinador lo dejó decidido: «Días fallados»; el conteo compartido por barra,
frase y umbral; los casos de empate, sin fallos y un solo día comparable; el «,
de largo» condicional; `MEANINGFUL_DELTA_POINTS`; `composeReading` sin el tercer
parámetro. **Y la frase del caso bueno** —«Los viernes fallas 9 de 13 veces… donde
más se te cae»— **se queda tal cual**: el revisor tiene razón en que pone el
sujeto en la persona, pero la aprobó el usuario en el render y dice un dato
concreto. Queda como **inconsistencia conocida, anotada y no arreglada por mi
cuenta**. El `aria-label` del SVG y la columna oculta siguen diciendo
«apariciones **con registro**», que es correcto y era la forma que ya estaba
bien.

**Verificación:**

*Que los dos tests nuevos prueban algo.* Devolviendo las dos cadenas a las de la
primera vuelta —o sea, **al texto que devolvió la tajada**:

```
× con menos de 4 apariciones no señala nada y dice cuánto falta (criterio 442)
× con un solo día comparable tampoco compara, y lo dice (criterio 442)
× al callar cuenta registros, no apariciones en el calendario
× con un solo día comparable tampoco llama apariciones a los registros
× con pocas apariciones, calla y dice cuántas hay
× con pocas apariciones por día el panel calla y dice qué le falta
      Tests  6 failed | 73 passed (79)
```

Con la corrección puesta, `79 passed (79)`. La fuente quedó restaurada.

*El caso que lo destapó, sembrado igual que lo sembró el revisor.* Nueve semanas
(63 días), solo tres martes registrados:

```
stats[1] → { longLabel: 'martes', total: 9, tracked: 3, untracked: 6 }
frase    → «De cada día de la semana hay 3 registros o menos en este tramo.
            Con 4 ya se puede comparar: todavía no hay bastante para decir
            dónde se te cae.»
```

El 9 —las apariciones de verdad— **ya no puede colarse**: el test afirma que la
frase no lo contiene. Y el segundo caso, lunes 6 registros / martes 3 sobre los
mismos 63 días: «Solo los lunes llegan a 4 registros en este tramo. Con 2 días ya
se puede comparar.»

*Anchos, remedidos porque la frase cambió* (arnés temporal con los cuatro
estados, viewport emulado de verdad, ya borrado):

| Ancho | `scrollWidth` / `clientWidth` | Nodos desbordados | La frase larga |
|---|---|---|---|
| **375 px** | 375 = 375 | **0** | 305 px de ancho, **3 líneas** (eran 2) |
| **768 px** | 753 = 753 | **0** | 683 px de ancho, **2 líneas** (era 1) |

Las otras tres frases no cambian de altura en ninguno de los dos anchos (2 y 1
líneas). **Ni un `.scss` tocado**, y la frase reusa la clase `.subtitle` que ya
estaba en pantalla, así que el contraste de oscuro medido en la primera vuelta
(**4,97:1**) sigue valiendo: no hay color nuevo.

*Línea base:*

| Qué | Al devolver | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 / 0 | **14 / 0** |
| `pnpm test` | 2 fallos de 2217 | **2 fallos de 2219** (+2 tests; `SearchSelect` ×2, `IconPicker` no salió) |
| `pnpm build` | chunk 1.153,05 kB · CSS 279,61 kB | **1.153,07 kB** (+0,02) · **CSS 279,61 kB, idéntico** |

**Criterios que esta vuelta cierra:**

- **473 · todo lo que se enseña es cierto.** Cumplido. La cifra que se dice y el
  conjunto que se cuenta son el mismo —registros— en las cinco frases, en el
  `aria-label` y en la tabla oculta. Los dos tests nuevos lo fijan **por el lado
  negativo** (ni «aparic», ni el número de apariciones reales), que es la forma
  de que no vuelva.
- **442 · se dice qué falta, con la cifra.** Cumplido con la forma que el propio
  criterio trae escrita: «De los martes hay 2 **registrados**».
- El resto de los criterios de la tajada siguen como el revisor los dejó; esta
  vuelta no toca su aritmética.

**Lo que dejo anotado y no arreglo:**

- **La frase del caso bueno pone el sujeto en la persona** («fallas», «se te
  cae»), igual que la «fallaste» que se rechazó por la lista de frases
  prohibidas. Es una inconsistencia real del módulo entre lo aprobado en el
  render y la regla escrita en la sección 1. **Decisión del coordinador: se
  queda.** Si el usuario quiere coherencia, se arregla cambiando la frase **o**
  el criterio 444, y eso es una conversación, no un arreglo.
- **El criterio 444 no es comprobable en su literalidad** («grep de esa lista,
  cero resultados»): «intenta» es subcadena de `Reintentar` e `intentarlo`, que
  están en ocho errores de red preexistentes. El revisor lo nombró; lo repito
  aquí para que no se pierda. **No reescribo el criterio.**

**Estado del árbol:** sin commitear. Los mismos cinco archivos de
`src/features/habits` de la primera vuelta —ninguno nuevo—, más este expediente.
El arnés temporal se borró antes de escribir esto.

### Tajada 3b — la hora se guarda y se corrige

**Resumen para el revisor:** marcar un hábito **hoy** guarda ahora la hora del
reloj del momento de pulsar, sin un paso más y sin un píxel nuevo en ese camino;
al reabrir el registro del día aparece **una línea** —«Registrado a las HH:mm ·
Corregir»— **solo si ese seguimiento tiene hora**, y corregirla manda **un**
`habitFollowUpEdit` con `{ id, timeOfDay }` y nada más. El sello vive en el
`mutationFn` de `useAddHabitFollowUpMutation`, que es el embudo por el que pasan
los cuatro sitios que escriben, así que ninguno de ellos se tocó.
**Lo que más probablemente he roto:** la **lectura** de seguimientos en todas las
pantallas, no la escritura. `HabitFollowUp.timeOfDay` es ahora un campo
**obligatorio** del tipo (`string | null`) y `timeOfDay` entró en **cuatro**
selecciones GraphQL (`FOLLOW_UP_FULL_FIELDS`, `FOLLOW_UP_FIELDS` de Mi Día, el
`followUp` de `habitWeekView` y el recortado de `habitFollowUpsInDates`): si la
API que responde no tuviera el campo, **las cuatro consultas fallarían enteras**,
no solo la hora. Está desplegado en Render y comprobado, pero es el punto único
de caída de esta tajada. El segundo candidato es la **guarda de caché nueva**
sobre `habitKeys.calendar`: es la primera guarda de hábitos que existe, y un
predicado mal puesto tira la caché del panel, Mi Día, la lista y Mi Persona en
cada arranque sin que nada se ponga rojo.

**Qué se construyó:**

- `src/features/habits/utils/habit-time.utils.ts` — **nuevo**. `nowHHmm`,
  `isValidHHmm`, `toHHmm` y `timeOfDayForDate(date, today, now)`. El criterio 457
  entero vive en la última: un día que no es hoy devuelve `null`. Suite propia en
  `habit-time.utils.test.ts` (12 casos).
- `src/features/habits/hooks/useHabitFollowUps.ts` — el `mutationFn` de
  `useAddHabitFollowUpMutation` sella la hora **al pulsar**; si sale `null`, la
  clave **no viaja** (criterio 461). Y `useSetFollowUpTimeOfDayMutation()`,
  hermana que manda solo `{ id, timeOfDay }` y avisa con un toast.
- `src/features/habits/components/HabitFollowUpForm/HabitFollowUpForm.tsx` (+ su
  `.module.scss`) — la línea de la hora entre «Notas» y los botones, con
  «Corregir» → `<input type="time">` precargado + «Guardar hora» + «Cancelar», y
  el texto «Ahora dice HH:mm…». Exactamente lo dibujado en el render aprobado.
- `src/features/habits/types/habit.types.ts` — `timeOfDay` en `HabitFollowUp`, en
  el sub-objeto recortado de `HabitFollowUpsDateGroup` y, opcional, en los dos
  inputs.
- `graphql/habit-follow-ups.graphql.ts` y `graphql/habits.graphql.ts` — las
  cuatro selecciones.
- `src/features/habits/utils/habit-stats.utils.ts` — `timeOfDay` en el remapeo de
  `buildFollowUpsByHabit`, sin el cual la hora no llega al panel.
- `src/app/providers/query-cache-guards.ts` — guarda de `habitKeys.calendar`,
  copiando la de `vidaKeys.followUps.range` (misma forma `{date, followUps[]}`).
- Tests: `HabitFollowUpForm.test.tsx` (**nuevo**, 7 casos, mockeando el **API** y
  no los hooks, para cubrir el recorrido completo), tres casos nuevos en
  `habit-stats.utils.test.ts` para el criterio 459, el `vi.mock` de
  `HabitDayRow.test.tsx` completado con el hook nuevo, y `timeOfDay: null` en
  tres fixtures que el tipo obligatorio dejó cojas.

**Por qué así, y qué se descartó:**

- **El sello va en el hook, no en los componentes.** Los cuatro sitios que
  escriben (círculo de Mi Día, los tres caminos del cajón, salvavidas y su botón)
  pasan por el mismo `mutationFn`: una decisión en vez de cuatro. No se tocó
  ninguno de ellos y por eso «marcar» no cambió ni un píxel.
- **No se reutilizó `updateFollowUp` del formulario** para corregir la hora:
  reescribe `difficulty` y `notes` en el mismo edit y eso rompe el criterio 455.
  De ahí la mutación hermana.
- **No se importó nada de `features/vida`.** Busqué primero: `vida-time.utils.ts`
  tiene `isValidHhMm` y `normalizeTimeForDisplay`, y `vida-date.utils.ts` tiene
  `getCurrentLocalDate` — **encajarían**, pero son de otro módulo de features y el
  plan lo descartó explícitamente («presta la forma, no el código»). Lo que sí se
  reutilizó es lo de casa: `getTodayString` de `habit-type.utils.ts`. `nowHHmm` no
  existía en ninguna parte del repositorio.
- **`timeOfDay` obligatorio en el tipo, opcional en los inputs.** Obligatorio
  obliga a que cualquier fixture nueva decida si hay hora o no; opcional en el
  input es lo que permite que «ausente» signifique «sin hora» sin escribir
  `undefined` a mano.

**Verificación (línea base medida hoy, 2026-09-25, en este mismo árbol):**

| Qué | Antes | Después |
|---|---|---|
| `pnpm typecheck` | limpio | limpio |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0** (los mismos) |
| `pnpm test` | 2 fallos de 2302 (`SearchSelect` ×2) | **2 fallos de 2312**, los mismos dos; +10 tests nuevos |
| `pnpm build` | — | **0**; CSS 280,11 → **281,63 kB** (sube: estilos nuevos), chunk inicial 1.154,54 → **1.157,37 kB** |

Arnés temporal (`arnes-3b.html` + `src/arnes-3b.tsx` + una página de `iframe`s),
**ya borrado**, con el componente montado en `iframe` de 375 y 760 px:

- 375 px: `scrollWidth === clientWidth` (360 = 360), **0 nodos desbordados**, con
  la línea cerrada y con el editor abierto (campo 166 px + botón 137 px caben).
- 760 px: 745 = 745, **0 desbordados**.
- Con hora: «Registrado a las 22:15 / la hora en que pulsaste / Corregir». Sin
  hora: el texto de la hoja es **idéntico** al de hoy, sin «sin hora» ni guion.
- Oscuro (`data-theme='dark'`, ámbito `[data-ds='aura']` en un descendiente):
  «22:15» **14,89:1**, «la hora en que pulsaste» y «Cancelar» **7,88:1**,
  «Corregir» **9,76:1**, el `input` **12,59:1**. Todos ≥ 4,5:1.

**Criterios, uno a uno:**

- **453 — marcar no cambia.** Cumplido. `git diff` no toca `HabitDayRow.tsx`,
  `useHabitLifelineAction.ts` ni `HabitLifelineButton.tsx`, y en
  `HabitFollowUpForm` el bloque nuevo está **fuera** del camino de marcar y detrás
  de `followUpTime ?`. Test: «marcar hoy no añade ni un paso» comprueba que antes
  de pulsar no hay ni «¿a qué hora…» ni «Corregir» en el DOM.
- **454 — una mutación con la hora del instante de pulsar.** Cumplido y probado
  con reloj falso: hoja abierta a las 22:15, pulsada a las **22:25**, viaja
  `"22:25"`. Un solo `addHabitFollowUp`.
- **455 — corregir manda solo la hora.** Cumplido.
  `expect(updateHabitFollowUp.mock.calls[0][0]).toEqual({ id: 'log-1', timeOfDay: '21:40' })`
  — `toEqual`, no `toMatchObject`: si se colara `notes` o `difficulty`, el test cae.
- **456 — también en los cumplimientos.** Cumplido: el sello está en el hook, que
  es el mismo para `isAccomplished`, `isFailed`, `isLifeline` y las sumas. El test
  del 454 usa precisamente el botón de **completar**.
- **457 — un día pasado no inventa hora.** Cumplido: `timeOfDayForDate` con su
  suite, y el test de componente comprueba que el input que viaja
  `not.toHaveProperty('timeOfDay')`.
- **458 — un seguimiento sin hora se ve como hoy.** Cumplido en el cajón de
  registro (test + arnés). En Mi Día, semana y calendario **no se pintó nada
  nuevo**: solo se añadió un campo a la consulta. Verificado por los 2312 tests y
  porque ninguna de esas pantallas cambió de archivo.
- **459 — la hora viaja en las dos formas.** Cumplido y con test que lo sujeta:
  las dos selecciones contienen `timeOfDay` y `buildFollowUpsByHabit` conserva la
  hora de la forma recortada (y devuelve `null`, no medianoche, cuando no la hay).
- **460 — `time` no se toca.** Cumplido. `git diff -U0 -- src | grep '\btime\b'`
  sin `timeOfDay` devuelve solo `type="time"` y dos `id`/`aria-labelledby` del
  campo nuevo: ni una línea del campo `time`.
- **461 — el cliente no revienta si el API no tiene el campo.** Cumplido **en la
  mutación**: cuando no hay hora, la clave no aparece en las variables. **Con una
  salvedad honesta que el revisor debe pesar:** las cuatro **selecciones** sí piden
  `timeOfDay` siempre, así que contra un API sin el campo las consultas fallarían.
  El orden de despliegue que el plan fijó (API primero) es lo que lo cubre, y 3a
  está desplegada y comprobada; no es una protección del cliente.
- **462 — del usuario.** Pendiente. Todo `/app/*` está tras el login y los agentes
  no entran. Pasos: abrir «Mi Día» en el móvil, marcar un hábito **de hoy**,
  volver a abrir el registro de ese día y comprobar que dice «Registrado a las»
  con la hora del momento; pulsar «Corregir», cambiar la hora, guardar, y
  comprobar que las notas y la dificultad siguen como estaban.
- **Transversales:** 473 (nada se presenta como lo que no es; sin hora **no se
  dice nada**), 474 (cero frases prohibidas: el `grep` de la lista sobre los
  archivos que toqué da **0**; los 13 de `src/features/habits/` son de HEAD y no
  míos), 475 (estados: el cajón conserva los suyos; el nuevo tiene cargando —
  `isLoading` del botón— y error — toast), 476 (medido arriba), 477 (tabla
  arriba), 478 (**esta tajada sí toca `graphql/`, y le toca**: la 478 dice «salvo
  la 3 y la 4»), 479 (ninguna ruta nueva: `git diff` no toca `router/` ni
  `app-nav.config.ts`).

**Lo que descubrí y no estaba en el plan:**

1. **`<input type="time">` se pinta en el formato del navegador, no en el del
   dato.** En el arnés (navegador en inglés) la hora `22:15` se lee «10:15 PM».
   El **valor** sigue siendo `"22:15"` y es lo que viaja, así que el contrato no
   se rompe; pero el render dibuja «21:4» estilo 24 h y en un dispositivo en
   inglés se verá AM/PM. No lo arreglo —sería un campo a mano y eso encarece la
   corrección— pero queda dicho.
2. **Tres fixtures de test estaban cojas** y el tipo obligatorio las destapó:
   `HabitDayRow.test.tsx`, `HabitListCard.test.tsx` y `habit-panel.utils.test.ts`.
   Se les puso `timeOfDay: null`; ninguna aserción se borró.
3. **`buildFollowUpsByHabit` no tenía ni un test** antes de esta tajada, a pesar
   de ser el remapeo del que comen cuatro pantallas. Ahora tiene tres. No amplío
   más: está fuera de alcance.
4. **`FOLLOW_UP_FIELDS` de Mi Día y el `followUp` de `habitWeekView` no listan
   `habitId`** y sin embargo se tipan como `HabitFollowUp`. Es una mentira de
   tipos preexistente; no la toco.
5. **El arnés en oscuro tiene una trampa que cuesta turnos:** `data-ds='aura'`
   tiene que ir en un **descendiente** de `<html>`, porque el bloque oscuro es
   `[data-theme='dark'] [data-ds='aura']`. Con `data-ds` en el propio `<html>` el
   tema oscuro **no se aplica** y se mide el claro creyendo medir el oscuro.

**Nota de entorno (no la toco, la digo):** la línea base real de `pnpm test` hoy,
medida antes de empezar, es **2 fallos de 2302** —no de 2203 ni de 2219—.

**Estado del árbol:** sin commitear. Queda **un servidor de Vite arrancado por mí
en el 5174** (`preview_start` con `autoPort`; el del usuario sigue en el 5173).
No tengo `preview_stop` en esta sesión: la sesión principal decide si lo para.

## 4. Revisión — feature-reviewer

### Tajada 3a — el API aprende la hora

**Veredicto: aceptada.** No cierra ningún criterio —no le tocaba— y habilita los
453–462 sin dejar deuda de forma. Todo lo comprobado abajo es del repositorio
`xavi-platform-node`; del front esta tajada solo tocó este expediente y su fila
del `BOARD.md`, y eso es exactamente lo que hay en el árbol.

**Criterios, uno a uno.** Los 430–452 son de las tajadas 1 y 2 y siguen
pendientes. De los 453–462 esta tajada **no cierra ninguno** (así estaba escrito
en el plan); lo que sí deja comprobado del lado del servidor:

- **459 (mitad servidor) — cumplido y verificado por mi cuenta, no por el
  resumen.** Todos los caminos de lectura de `habit_logs` que alimentan un
  seguimiento traen ya la columna: `LOG_RETURNING` (que ahora la lista) se usa en
  la idempotencia por `clientId` (`habit.service.ts:603`) y en la semana
  (`:1003`), y los demás son `SELECT *` / `SELECT hl.*` (`:649`, `:733`, `:803`,
  `:835`). El único escrito a mano, `getHabitMyDay`, lista `hl.time_of_day` y lo
  mapea. Y hay una red de tipos real: `HabitLog.timeOfDay` es **obligatorio** en
  la interfaz, así que cualquier sitio que construya un seguimiento a mano sin él
  lo caza `tsc` — y `tsc` está en 0.
- **460 — cumplido.** Compilé el SDL con `tsx` y leí los tipos ya impresos:
  `HabitFollowUp` → `time: Int!` + `timeOfDay: String`; los dos inputs →
  `time: Int` + `timeOfDay: String`; **`HabitLogAddInput` y `type HabitLog` sin
  tocar**. En el servicio, `time`/`mergedTime` no cambian de sitio ni de sentido.
- **461 (mitad servidor) — cumplido.** Anulable en los tres sitios del SDL,
  opcional en los dos validadores, y `input.timeOfDay ?? null` en las cuatro
  sentencias: un cliente que no lo mande se comporta igual que hoy.
- **453–458 y 462: siguen pendientes y son de la 3b** (y el 462, del usuario, con
  el API ya desplegado). No los doy por buenos por simpatía.

**El hallazgo que corrige al arquitecto: confirmado, y era de verdad.**
`habitFollowUpAdd` (`habit.resolvers.ts:359`) desestructura el input campo a
campo y reconstruye el objeto que pasa al servicio; sin añadir `timeOfDay` en las
dos listas, la hora moría entre el validador y el servicio **sin error y sin
rastro**. `habitFollowUpEdit` (`:394`) sí hace `const { id, difficulty,
...fields }`, así que el plan era cierto solo para la mitad que miró.

**Busqué si hay más resolvers con esa forma, y hay uno:** `habitLogAdd`
(`habit.resolvers.ts:341`) desestructura ocho campos a mano y llama al mismo
`addHabitLog`. Hoy **no muerde**: `HabitLogAddInput` no tiene `timeOfDay` en el
SDL y el cliente **no usa esa mutación en ningún sitio** (`grep -rn "habitLogAdd"
src/` en el front: cero). Queda escrito para la 3b: si alguna pantalla acaba
marcando por ahí, la hora se perderá igual de callada. Los demás
(`habitEdit:322`, `habitCategoryEdit:424`, `habitMeasureEdit:452`) usan
`...fields` y no son de este dato.

**Qué busqué alrededor, y cómo:**

- `graphify query` en el repo del API sobre los resolvers de seguimiento y el
  mapeo (`toFollowUp`), y luego abrí los ficheros: `toFollowUp` hace `...log`, o
  sea que el campo sale por las mutaciones sin tocar nada más.
- **Quién más escribe en `habit_logs`: nadie.** `grep -rln "habit_logs" src/`
  devuelve **solo** `habit.service.ts`, y `INSERT/UPDATE INTO habit_logs` fuera de
  ese fichero, cero. El radio de la tajada está contenido.
- **Los cuatro SQL renumerados, leídos parámetro a parámetro** (que es lo que el
  constructor señaló como lo más probable de romper y lo que ninguna suite cubre):
  INSERT de salvavidas 13 columnas / 13 valores con `time_of_day = $8` y
  `input.timeOfDay` en octava posición; UPDATE de fusión con `$9` en el `SET` y
  `$10` en el `WHERE`, array de 10 en ese orden; INSERT normal 13/13 con `$12`
  último; UPDATE de `updateHabitFollowUp` con `$9`/`$10` y su array explícito de
  10. **Los cuatro cuadran.** Es lectura, no ejecución: sin base de datos no hay
  forma de ejecutarlos desde aquí.
- **Línea base del API, medida entera por mí:** `npx tsc --noEmit` → `EXIT=0`;
  `npm test` → **6 suites falladas de 54, 3 tests fallados de 602**, y los tres
  con nombre son los mismos de siempre (`syncHabitStreakFromLogs`, `HabitService >
  addHabitLog > creates log when date is available`, `walletExpenseUpdate`). La
  suite nueva de validadores, aislada: **6/6 en verde**. Lint sobre los cinco
  ficheros tocados: 9/6/5/0/7 avisos, y crucé los números de línea con los rangos
  del `git diff -U0`: **ninguno cae en una línea nueva**. No se ha empeorado nada.
- **Del front no se ha tocado una línea de código.** `git diff --stat` del front
  da solo `docs/`; lo que hay en `src/features/vida/` (VidaDayBudget,
  VidaTemplateDaySummary, las páginas de Vida, `useVidaDayWindow`) es de la sesión
  que construye FEAT-012 en paralelo y **no es de esta tajada**.

**Estados que nadie construye.** Esta tajada no tiene pantalla: vacío, cargando,
texto largo y móvil **no aplican**. Los que sí:

- **Sin dato:** una fila sin hora devuelve `null` —no medianoche— por
  `formatTime(row.time_of_day ?? null)`, y el validador acepta que el campo no
  venga. Probado en la suite nueva.
- **Error:** formato imposible (`99:99`, `24:00`, `7:5`) → 400 del validador con
  «Invalid time format (HH:MM)», no un 500 de Postgres. Probado.
- **Permisos:** `requireAuth` en las dos mutaciones, sin cambios.

**¿Duplica algo que ya existía?** No. `formatTime` es una copia deliberada de la
de `user-settings.service.ts:26` —el constructor lo dice en el comentario— y
factorizarlas es otra tarea; no hay una tercera. `timeOfDaySchema` es local y
**no toca `timeSchema` de `user-settings.schemas.ts`, que sigue intacto**
(comprobado: ese fichero no aparece en el diff, y su regex sigue siendo
`^\d{2}:\d{2}(:\d{2})?$`, el que acepta `99:99`). La versión acotada cubre
**los dos únicos sitios por los que la hora puede entrar** hoy: el add y el edit
de seguimiento. No hay REST de hábitos ni otra ruta de escritura.

**La migración 071.** Formato correcto para `scripts/migrate.ts` (parte por `--
DOWN`, y no hay ningún «down» suelto en los comentarios que lo parta antes);
número libre, va detrás de la 070. `ADD COLUMN IF NOT EXISTS time_of_day TIME`
**sin `NOT NULL` y sin `DEFAULT`**: contra las filas que ya existen es un
`ALTER TABLE` que no las toca —se quedan en `NULL`— y por eso no puede repetir lo
que tumbó Hoy el 23. `DOWN` comentado, igual que la 068. El precedente juega a
favor: la 068 creó `vida_night_bed_time TIME` y ese ida y vuelta lleva
funcionando desde FEAT-012.

**Hallazgos (no devuelven la tajada, pero se escriben):**

1. **`timeOfDay: null` se acepta y se ignora en silencio.** El validador declara
   el campo `.nullable()` —y la suite nueva lo afirma: «accepts null as "no time"»—
   pero el `UPDATE` hace `time_of_day = COALESCE($9, time_of_day)`: mandar `null`
   devuelve 200 y **deja la hora que había**. Aceptar un valor y no hacer nada con
   él es la peor de las tres opciones (honrarlo, rechazarlo o ignorarlo).
   **Mi juicio sobre si es defecto de producto:** hoy **no** lo es, y por eso no
   devuelvo. Ningún criterio pide borrar la hora; quien se equivoque de hora la
   **corrige** poniendo otra (455), y un seguimiento entero que sobre se quita con
   `habitFollowUpRemove`, que se lleva la fila y su hora. Nadie queda atrapado con
   un dato falso **sin salida**. Pasa a ser defecto el día que la 3b enseñe un
   «quitar la hora»: ese control haría un no-op silencioso. **Recomendación: que
   el usuario decida antes del push**, porque después el contrato ya es público —
   arreglarlo es distinguir «no vino» de «vino null» (zod ya lo permite) y cambiar
   esa línea a una asignación condicionada.
2. **La ventana entre despliegues es más estrecha de lo que parece, y el `?? null`
   no la cubre.** `LOG_RETURNING` nombra la columna y la usan las cuatro
   escrituras, la idempotencia por `clientId` y la vista de semana; `getHabitMyDay`
   la nombra en su `SELECT`. Si **Render** termina su auto-despliegue antes de que
   el job `xavi-migrate` de Cloud Run corra la 071 contra la misma base de Neon,
   durante esos minutos **marcar un hábito y «Mi Día» dan error de columna
   inexistente**. Se cura solo en cuanto la migración entra, y es inherente a
   cualquier columna aditiva de este repo (la 068 tuvo la misma ventana), pero
   conviene saberlo antes de pulsar y mirar «Mi Día» un par de minutos después.
3. **Una imprecisión del parte de construcción, para que no se herede.**
   `tests/unit/services/habit.service.test.ts` **no** es una de las seis suites
   rotas: compila, corre y da **6 en verde y 1 en rojo** (el `addHabitLog` de la
   línea base, que revienta dentro de `syncHabitStreakFromLogs` por mocks
   agotados). El fondo del riesgo sigue siendo cierto y lo comprobé: ese test
   **no afirma nada sobre los parámetros del SQL** —el mock de `db.query`
   devuelve lo encolado mire lo que mire— así que **la renumeración no tiene red
   de tests ni tendría por qué haberla fallado**. Lo único que la sostiene es la
   lectura línea a línea de arriba.
4. **`getHabitMyDay` sigue siendo el único sitio con columnas y mapeo a mano.**
   Un campo más que mantener ahí. No es de esta tajada, pero ya son dos avisos.

**Lo que queda sin probar, y no se puede probar desde aquí:**

- **El ida y vuelta real `"22:15"` → `"22:15"`.** Sin base de datos no hay forma
  de ejecutarlo: no hay acceso a Neon desde aquí y **abrir una conexión a la base
  de producción no es algo que yo haga**. Lo que sí puedo decir es por qué debería
  salir bien: la columna es `TIME` (sin zona), **no hay ningún
  `pg.types.setTypeParser` en todo `src/`** (lo busqué), así que `pg` devuelve la
  cadena cruda `"22:15:00"` y `formatTime` recorta a cinco; el desplazamiento por
  zona horaria solo aparecería con `TIMETZ` o `TIMESTAMP`, que no se usan. Y el
  precedente de la 068 con `vida_night_bed_time` ya lleva días funcionando así.
  **Queda como comprobación manual del usuario, la primera después del push.**
- **Que marcar un hábito sigue funcionando** (Mi Día, el cajón, el salvavidas y la
  fusión del día en un hábito de cantidad). Es lo que tocan los cuatro SQL y lo
  que ninguna suite ejecuta.
- **La migración, hasta que el usuario empuje** (D3).

### Tajada 3a · revisión de la corrección — `null` ya borra la hora

**Veredicto: aceptada** (la tajada sigue aceptada; esto no la reabre). Miré solo
la corrección, no rehíce la revisión.

**1 · La distinción funciona en los dos caminos, y la numeración que verifiqué no
se ha movido.** Leí las dos sentencias enteras otra vez:

- Fusión del día (`habit.service.ts:673-695`): `SET` con `$1..$8` **idénticos a
  los que verifiqué** (count, time, notes, story, is_accomplished, is_failed,
  difficulty, client_id), `time_of_day = CASE WHEN $9::boolean THEN $10::time
  ELSE time_of_day END`, `WHERE id = $11`; array de **11** en ese mismo orden,
  con `input.timeOfDay !== undefined` en novena posición y `input.timeOfDay ??
  null` en décima.
- `updateHabitFollowUp` (`:757-779`): igual, con `$1..$8` (count, time, notes,
  story, is_accomplished, is_failed, archived, difficulty), `$9`/`$10` y
  `WHERE id = $11`; array de 11 en ese orden.

**2 · Los dos `INSERT` están intactos**, byte a byte como los leí (`$8` en el del
salvavidas, `$12` en el normal, con `input.timeOfDay ?? null`), y el argumento es
correcto: en una fila que nace no hay hora anterior, así que ausente y `null` son
lo mismo. Nada que discutir ahí.

**3 · La asimetría de las demás columnas: aceptable, porque está escrita.**
`notes`, `story`, `archived`, `difficulty` y `client_id` se quedan con `COALESCE`
y el porqué está en dos sitios: el comentario encima de cada sentencia y un caso
de test que afirma los cuatro `COALESCE` por su número de parámetro. Eso es
exactamente lo que separa una asimetría deliberada de una trampa: quien llegue
mañana y vea `CASE WHEN` en una columna y `COALESCE` en las de al lado encuentra
la razón sin tener que adivinarla.

**4 · La suite nueva: es red de verdad, pero tiene un hueco justo donde más
importa.** `tests/unit/services/habit-follow-up-time-of-day.service.test.ts`
(10 casos, verdes) mockea el pool y **lee la sentencia y sus parámetros**, así
que sí es la primera prueba que corre sobre `addHabitLog`/`updateHabitFollowUp`.
Cubre las tres posiciones de la bandera en los dos `UPDATE`, el `INSERT` del
primer seguimiento del día (`params[11]`), el `null` que no es medianoche, la
asimetría del `COALESCE` y la vuelta `'22:15:00'` → `'22:15'`. Y fija el texto
exacto del `CASE WHEN` con sus `$9`/`$10`, que es lo que ata numeración y array.

Lo que **no** cubre, dicho para que no se lea como más red de la que es:

- **El `WHERE id = $11` no está afirmado en ninguna parte**, ni la longitud del
  array. El mock devuelve la misma fila mire los parámetros que mire, así que un
  `id` en la posición equivocada —que es precisamente lo que puede romper una
  renumeración— pasaría en verde. Dos líneas lo cierran:
  `expect(params).toHaveLength(11)` y `expect(params[10]).toBe(LOG_ID)`.
- **El `INSERT` del salvavidas** (`$8`) sigue sin ningún caso, y era uno de los
  cuatro caminos que marqué.
- La racha, la fusión de cantidades y el resto de `addHabitLog` siguen fuera:
  esta suite mira la hora, no el servicio entero. No es reproche —no era su
  encargo— pero «la primera red sobre `addHabitLog`» es una red de un hilo.

**No toca las seis rotas**: es un fichero nuevo, con su `jest.mock` del pool
acotado a él. Línea base medida por mí después de la corrección: `npx tsc
--noEmit` **EXIT=0**; `npm test` **3 fallos de 614 en 55 suites**, las mismas
seis y los mismos tres nombres. Lint en los ficheros tocados: `habit.service.ts`
5, `habit.schema.ts` 6, `habit.types.ts` 0 — crucé los números de línea con los
rangos de `git diff -U0` y **ninguno cae en línea nueva**.

**5 · El `::time` es la forma correcta.** Un parámetro suelto dentro de un `CASE`
no tiene tipo que Postgres pueda inferir; el cast explícito se lo da, igual que
`$9::boolean`. No cambia el ida y vuelta: sigue siendo una columna `TIME` sin
zona, sin `setTypeParser` en el repo, devuelta como `"22:15:00"` y recortada por
`formatTime`. Un matiz para el cuaderno: el cast fija el tipo del parámetro **en
el `parse`, no en la rama**, así que una cadena inválida en `$10` daría error
aunque la bandera fuera `false`; hoy no puede pasar porque ahí solo llega lo que
aprobó el validador (`HH:mm`) o `null`.

**Lo que sigue pendiente es lo mismo de antes, más una línea:** la 071 no se ha
ejecutado, y el `CASE WHEN ... ::time` **no se ha ejecutado nunca contra
Postgres**. La primera comprobación después del push ya no es una sino dos: que
`"22:15"` vuelve `"22:15"`, y que un `habitFollowUpEdit` con `timeOfDay: null`
devuelve 200 y el seguimiento vuelve **sin hora**.

### Tajada 1 — las cifras que faltan

**Veredicto: devuelta** — una frase nueva puede afirmar algo falso (criterio
473). Todo lo demás está cumplido y medido; el arreglo es de una línea.

**El defecto que la devuelve.** En `HabitStreakEpisodesChart.tsx:52-55`,
`olderRecordDays` se compara contra `longest`, y `longest` se calcula sobre
`visible` —los **últimos 12** episodios— y no sobre `episodes`:

```ts
const visible = truncated ? episodes.slice(-MAX_STREAK_EPISODES) : episodes
const longest = visible.reduce((max, episode) => Math.max(max, episode.length), 1)
…
typeof lifetimeRecordDays === 'number' && !recordIsOngoing && lifetimeRecordDays > longest
```

`MAX_STREAK_EPISODES = 12`. Con el rango en **365 días** —o en 90 en un hábito
que se rompe mucho— un hábito con más de 12 rachas en el tramo **oculta** las
más viejas, y si la racha récord es una de esas, el panel escribe «Tu récord de
N días es de antes de este tramo» cuando el récord **está dentro** del tramo:
solo no se dibuja. Es exactamente el tipo de frase que esta feature existe para
no decir. La ficha «Tu récord» sigue siendo cierta; la frase de debajo no. El
arreglo es calcular `longest` de la frase sobre `episodes` (el tramo entero), no
sobre `visible`, y añadir el caso a la suite: hoy los tres casos nuevos del
gráfico usan 3 episodios y ninguno entra en el truncado.

**Criterios, uno a uno** (contra la sección 1, no contra el resumen):

- **430 — cumplido.** `HabitPanelTiles.tsx:66-71`: «Tu récord» es un `StatCard`
  hermano de «Racha actual», con `days(habit.maxStreak)` como valor y sin
  `helperText` salvo el caso del 432. El viejo `helperText` «Tu récord son N
  días» desapareció y hay test que lo vigila. Ninguna cadena nueva nombra una
  fecha del récord: la única frase que podría, la del gráfico, dice «es de antes
  de este tramo» sin fecha, igual que el render.
- **431 — cumplido.** El gráfico ya no dice «récord» en ninguno de los cuatro
  sitios (leyenda «Mejor tramo del rango», etiqueta del dibujo, tabla oculta,
  tooltip) y la ficha lee `habit.maxStreak`. Verificado leyendo el diff entero
  del componente, no solo el test.
- **432 — cumplido y conforme al render.** Con `streak === maxStreak` el récord
  añade «Es la racha que llevas ahora». Las dos fichas imprimen «21 días», que
  es lo que **dibuja el render aprobado** (dos fichas, y la segunda explica que
  es la misma): el criterio pide que no se lean como dos logros distintos, y no
  se leen.
- **433 — cumplido.** Ficha «Salvavidas usados» con `summary.lifelines` y «En
  los últimos 90 días». El cero se imprime. Sembrado: `lifelines: 0` en el test
  del constructor, y en mi arnés con 12. El rótulo de rango sale de
  `HABIT_PANEL_RANGE_LONG_LABELS` (`30 días` / `90 días`) y del literal «el
  último año» para 365: leído en `HabitPanel.tsx:207` y en
  `habit-panel.utils.ts:32-36`, porque **ese cableado no lo cubre ningún test**
  (los tests pasan el prop ya compuesto). Es la única cadena del panel que
  podría leerse «En los últimos 30 d» y no lo hace.
- **434 — cumplido.** `buildAverageDifficulty` promedia solo los días con
  dificultad anotada, devuelve `null` sin ninguno y la ficha no se monta;
  el `helperText` dice sobre cuántos días. Probado con día anotado a 0 (cuenta)
  y con días sin anotar (no entran en el denominador).
- **435 — cumplido en lo verificable.** El diff de `HabitPanel.tsx` añade un
  `useMemo` sobre `days`, que ya estaba en memoria, y dos props. Ni una llamada
  a hook nueva. El espía de red sobre la pantalla real **queda pendiente del
  usuario**: `/app/*` está tras el login.
- **436 — cumplido.** Siete `StatCard` de `@/shared/ui/StatCard`; ningún
  componente nuevo. `git status` no lista ningún archivo nuevo bajo `src/`.
- **437 — cumplido, medido por mí.** A 375 px (caja de 343): **2 columnas de
  165,5 px**, `scrollWidth === clientWidth` en la rejilla y en el documento, con
  récord de 365 días, `days` 1204, 12 salvavidas y «2,4 de 4». Ver la tabla de
  abajo.
- **438 — cumplido.** Nada fuera de `habit-panel.utils.ts` y su suite.
- **439 — cumplido, y la aserción reescrita es legítima.** Es esta:
  `expect(within(chart).getByText('récord'))` → `getByText('mejor tramo')`, y
  `getByRole('row', { name: /21 días.*récord/ })` → `/21 días.*mejor tramo/`.
  **Mismo matcher, misma dureza, mismo nodo**: cambia la palabra que el producto
  cambió por obligación del 431, no la exigencia. No se aflojó a `queryBy`, ni a
  un regex más ancho, ni se envolvió en un `try`. Y el caso queda **más**
  vigilado que antes: hay un test nuevo que afirma que «récord» **no** está en
  el gráfico. Cero líneas de aserción borradas (comprobado sobre el diff: las
  únicas dos líneas `expect` suprimidas son esas dos, reemplazadas en el sitio).
- **473 — NO cumplido.** Ver el defecto de arriba. El resto del criterio sí: la
  dificultad se imprime «de 4» y **la escala real es 0–4**, confirmado en el
  código y no en el render — `habit-difficulty.utils.ts` define etiquetas 0…4
  («Muy fácil»…«Extremo») y `HabitDifficultyChart.tsx:14-15,67` ya usa
  `MAX_DIFFICULTY = 4` y dice «sobre 4» en su `aria-label`. El «/5» del render
  habría sido la única cifra falsa del panel: **la desviación es correcta**.
- **474 — cumplido.** Ninguna cadena nueva reprocha nada; hay test que lo
  vigila.
- **475 — cumplido por no tocarlo.** Las cuatro salidas tempranas de
  `HabitPanel` (sin `startDate`, `isLoading`, `isError`, sin registros) están
  intactas en `HabitPanel.tsx:140-186` y las fichas se montan después de todas
  ellas: vacío, cargando y error no pueden haber cambiado. Texto largo: el
  nombre del hábito vive en la cabecera de `HabitDetailPage`, fuera de la
  rejilla.
- **476 — cumplido en lo que esta tajada toca, con un matiz medido.** A 375 px
  no hay scroll horizontal (`documentElement.scrollWidth === clientWidth`) ni
  ficha desbordada. Sí hay **un nodo** desbordado: la etiqueta «CUMPLIMIENTO
  90 D» mide 106 px en una caja de 100 — **es preexistente**, lo medí también
  sobre el `HabitPanelTiles` de `HEAD` y da el mismo 106/100, y no se ve porque
  la ficha tiene 32 px de `padding` a cada lado. No es de esta tajada, pero el
  criterio dice «cero nodos desbordados» y no es cierto ni antes ni después.
- **477 — cumplido, corrido entero por mí.** `pnpm typecheck` exit 0 · `pnpm
  lint` `✖ 14 problems (14 errors, 0 warnings)` = línea base · `pnpm test` `Test
  Files 1 failed | 129 passed (130)`, `Tests 2 failed | 2197 passed (2199)`, los
  dos de `SearchSelect`, sin rastro del flaky de `IconPicker` · `pnpm build`
  exit 0, chunk **1.151,86 kB** y CSS **279,51 kB = línea base exacta** (no se
  tocó SCSS, así que no hay bajada que investigar).
- **478 — cumplido, y la promesa de la caché confirmada ejecutando.** Añadí un
  `git worktree` de `HEAD` aparte (borrado después, sin tocar el árbol) y corrí
  `computeCacheShapeId` de `vite/cache-shape.ts` sobre los dos:
  `HEAD f8edc4f3becd / 32 ficheros` y `ÁRBOL f8edc4f3becd / 32 ficheros`. **El
  `buster` no se mueve**: ningún fichero de esta tajada entra en la huella
  (`collectShapeSources` los descarta todos). Nadie pierde su caché.
- **479 — cumplido.** Ni ruta, ni página, ni entrada de menú en el diff.
- **480 — pendiente del usuario.** Correcto: `/app/*` está tras el login.

**Cómo busqué lo que se rompe cerca.** El grafo está actualizado **después** del
cambio (`graphify update .` de hoy 09:15: ya conoce `buildAverageDifficulty`),
así que no sirve para «qué había antes»; sí para «quién cuelga de esto».
`graphify explain` sobre `HabitStreakEpisodesChart`, `HabitPanelTiles`,
`StatCard`, `buildAverageDifficulty` y `formatAmount`: los dos componentes solo
los importan `HabitPanel.tsx` y su test; `formatAmount` lo comparte
`HabitGoalChart` y **no se tocó**. El nodo de `StatCard` sale con una sola
arista (el grafo no infiere ahí sus importadores), así que lo confirmé abriendo
el código: `grep -rln StatCard src/ --include=*.tsx` devuelve **un único
consumidor fuera de su carpeta, `HabitPanelTiles`** — el estrechamiento de las
fichas no puede tocar ninguna otra pantalla. Busqué también la palabra que
cambió: `récord` fuera de `HabitPanel/` solo vive en `habit-identity.utils.ts`
(Mi Persona), con su propia frase y sin relación con el gráfico. Lo que el
constructor señaló como «lo que más probablemente rompí» es justo lo que revisé
primero, y su diagnóstico es correcto en los dos puntos.

**Anchos, medidos yo (no razonados).** Arnés en `iframe` de ancho exacto con
`flex:none`, con el CSS real de `HabitPanel.module.scss` y `StatCard.module.scss`
servido por Vite, tokens de la app y los números más largos posibles. Comparando
**las 4 fichas de `HEAD`** con **las 7 de ahora**:

| Ancho | Antes (4 fichas) | Ahora (7 fichas) | ¿Desborda? |
|---|---|---|---|
| 320 px | 1 col · 288 px | 1 col · 288 px | no |
| **375 px** | 2 col · 165,5 px · 2 filas | **2 col · 165,5 px · 4 filas** | no (343 = 343) |
| 414 px | 2 col · 185 px | 2 col · 185 px | no |
| **760 px** | 4 col · 173 px · 1 fila | **4 col · 173 px · 2 filas** | no (728 = 728) |
| **1024 px** | **4 col · 239 px · 1 fila** | **6 col · 155 px · 2 filas** | no (992 = 992) |
| 1440 px | 4 col · 343 px | 7 col · 191 px · 1 fila | no |

**Mi juicio sobre el escritorio: el panel queda peor que antes a 1024 px**, y no
por poco. Las fichas pasan de 239 px a 155 px, los rótulos («RACHA ACTUAL»,
«CUMPLIMIENTO 90 D») pasan a dos líneas, con números largos el valor también
parte («2,4 de 4» en dos líneas), la etiqueta de «Cumplimiento» pasa de caber a
desbordar 17 px sobre su padding, y **la séptima ficha se queda sola en una
segunda fila** con cinco huecos al lado. Nada se recorta ni se pisa —el `padding`
de 32 px se come el desbordamiento—, así que **no rompe ningún criterio**: el
430–439 solo legisla 375 px y el render aprobado solo decidió el móvil. Queda
como hallazgo, no como motivo de devolución. Un matiz sobre lo que el
constructor supuso: **arreglarlo NO obliga a tocar `shared/ui`**. Quien decide
las columnas es `.tiles` en `HabitPanel.module.scss`, que es de esta feature; lo
que no se puede arreglar desde aquí es el rótulo que desborda (padding de
`StatCard`), que además es preexistente. Un `@media` en `.tiles` que pida
`minmax(12rem, 1fr)` de tablet para arriba devuelve las fichas anchas sin tocar
los 375 px, y cabe en esta tajada o en una nota de deuda: es decisión del
usuario, no mía.

**Estados que nadie construye.** Vacío, cargando y error: **siguen resueltos**,
por las cuatro salidas tempranas intactas. Sin permisos: no aplica (el panel no
tiene permisos propios; la puerta es el login). Texto largo: **no aplica a la
rejilla** —ninguna ficha imprime texto libre del usuario; lo más largo que puede
entrar son los números, y los medí en el peor caso—. Móvil 375: medido, sin
scroll horizontal. **Lo que falta, y va como hallazgo:** el «sin dato» de la
dificultad está probado (la ficha no aparece), pero **no hay ningún test que
monte `HabitPanel` entero** con el rango en 365 para comprobar «En el último
año» ni el truncado del gráfico — el mismo hueco por el que se cuela el defecto
que devuelve la tajada.

**¿Duplica algo que ya existía?** No. Contra la sección 2: no nació
`habit-metrics.utils.ts` ni ningún `utils` paralelo, no nació ningún componente
de ficha —`StatCard` de `@/shared/ui/StatCard` es el que ya estaba y sigue
teniendo un solo consumidor—, y `buildAverageDifficulty` no repite a
`buildDifficultySeries` ni a `hasAnyDifficulty`: recorre lo mismo para otra
cosa y vive a su lado, como pedía el criterio 438. El `git status` confirma que
los seis archivos del diff son **todos modificados**, ninguno nuevo.

**Lo que queda para prueba manual del usuario** (todo `/app/*` está tras el
login, y ahí no entro): abrir **Mis hábitos → un hábito con historia → Panel**;
con el rango en 90 d, ver las seis fichas y la séptima solo si hay dificultad
anotada; con el rango en 30 d en un hábito cuyo récord sea mayor que cualquier
racha del mes, comprobar que «Tu récord» no cambia y que bajo «Tus rachas, una a
una» aparece la frase del récord viejo; y —esto es lo que devuelve la tajada—
**poner el rango en 1 año en un hábito con más de 12 rachas** y comprobar que la
frase no aparece si el récord está dentro de ese año. El espía de red del
criterio 435 también es suyo.

### Tajada 1 · revisión de la corrección — la frase ya no puede mentir, y el escritorio vuelve a ser ancho

**Veredicto: aceptada.** Miré solo lo que cambió desde la devolución: el defecto
del 473, los tests que lo tapan, el `@media` de `.tiles`, el SCSS compilado y
que no se haya movido nada de lo ya dado por bueno. La revisión de la primera
vuelta sigue en pie tal cual.

**1 · El defecto del 473, cerrado, y la red muerde de verdad.** Son dos
cantidades separadas y comentadas: `longest` sobre `visible` (la escala de las
barras, que debe seguir siendo la de lo dibujado) y `longestInRange` sobre
`episodes`, que es contra la que compara la frase. **Lo muté yo**: cambié
`lifetimeRecordDays > longestInRange` por `> longest` y corrí la suite del
panel:

```
× con más de 12 rachas, la frase mira el tramo entero y no solo lo dibujado
× no dice que el récord sea «de antes» cuando está dentro del tramo y solo no se dibuja
Tests  2 failed | 17 passed (19)
```

Y **el segundo de esos dos es el que monta `HabitPanel` entero**, no el gráfico
suelto: la red cubre el camino real por el que se coló la frase falsa, no una
maqueta del componente. Fichero restaurado desde copia y verificado por `md5sum`
(`73948fe8…` antes y después); el árbol quedó exactamente como estaba.

**2 · El hueco que señalé, tapado.** Tres casos nuevos montan `HabitPanel` con
`range={365}` y datos sembrados (21 días seguidos hace 350, más catorce rachas
de dos días más recientes, que es justo lo que fuerza el truncado a 12): el que
comprueba que la frase **no** aparece con el récord dentro del año, el que
comprueba que **sí** aparece —y sin fecha— con `maxStreak: 40`, y el que fija
«En el último año» en la ficha de salvavidas, que era cableado vivo sin un solo
test (`HabitPanel.tsx:207`). Bien visto por su parte: ese rótulo lo verifiqué yo
a mano en la primera vuelta precisamente porque nada lo sujetaba.

**3 · El escritorio. Remedido, y con un matiz de método que importa.** Su
afirmación de que «las media queries miran la ventana, así que el `iframe` no
habría servido» **es falsa**, y conviene que quede escrito para que nadie
abandone el método de `ENVIRONMENT.md`: un `iframe` **es su propio viewport** y
las media queries se evalúan contra él. Lo comprobé de las dos formas y dan el
mismo número: `iframe` de 768 px → 3 col · 237,3 px; viewport emulado de verdad
a 768 px, midiendo en el documento de primer nivel → `matchMedia('(min-width:
768px)')` a `true`, 3 col · **237,3 px**. El `iframe` sigue siendo válido (y es
más barato); lo que no vale es medir sobre la pestaña sin emular, que son 568 px.

Medido con los números más largos posibles, comparando **las 4 fichas de `HEAD`**
con las 7 de la tajada devuelta y con las 7 de ahora:

| Ancho | Antes (`HEAD`, 4 fichas) | Devuelta (7, sin `@media`) | Ahora (7, con `md`) |
|---|---|---|---|
| 375 px | 2 col · 165,5 | 2 col · 165,5 | **2 col · 165,5** |
| 414 px | 2 col · 185 | 2 col · 185 | 2 col · 185 |
| 760 px | 4 col · 173 | 4 col · 173 | 4 col · 173 |
| 767 px | 4 col · 174,8 | 4 col · 174,8 | 4 col · 174,8 |
| **768 px** | 4 col · 175 | 4 col · 175 | **3 col · 237,3** |
| 800 px | 4 col · 183 | 4 col · 183 | 3 col · 248 |
| 900 px | 4 col · 208 | 4 col · 208 | 4 col · 208 |
| **1024 px** | **4 col · 239** | 6 col · 155 | **4 col · 239** |
| 1280 px | 4 col · 303 | 6 col · 198 | 6 col · 198 |
| 1440 px | 4 col · 343 | 7 col · 191 | 6 col · 224,7 |

- **375 px no se movió un píxel**: 2 columnas de 165,5, rejilla 343 = 343,
  documento 375 = 375. La regla entra en `@media (min-width: 768px)`, así que el
  móvil no la ve. El render aprobado sigue cumpliéndose al pie de la letra.
- **1024 px vuelve exactamente a lo de antes**: 4 columnas de 239 px, los mismos
  239 px que tenía `HEAD`. Y ahora **ningún rótulo se parte**: medí las líneas de
  cada etiqueta, 7 de 7 a una sola línea (en la versión devuelta se partían
  cuatro).
- **La banda 768–1023, que nadie había medido nunca: sale ganando, y con qué
  medida lo digo.** A 767 px (que es lo que hacía la versión devuelta en todo el
  escritorio) hay 4 columnas de 174,8 px y **cuatro de los siete rótulos se
  parten en dos líneas** («CUMPLIMIENTO 90 D», «VECES QUE VOLVISTE»,
  «SALVAVIDAS USADOS», «DIFICULTAD MEDIA»). A 768 px con la regla hay 3 columnas
  de 237,3 px y **cero rótulos partidos**. El precio es alto de rejilla: 311 px
  → 404 px (+93 px) por la tercera fila, en un panel que ya se desplaza porque
  debajo hay tres gráficos. Cambio 93 px de scroll por cuatro rótulos que dejan
  de romperse: **mejor**, no igual. **Mi decisión: se queda en `md`, no se
  congela a `lg`.** Congelarlo dejaría los 768–1023 en 4×175 con cuatro rótulos
  partidos, que es el apelotonamiento por el que devolví la tajada, solo que un
  poco menos apretado; y una tablet de 768 es un sitio plausible para esta
  pantalla.
- **Rareza menor, no bloqueante:** entre ~890 y ~1000 px `auto-fit` vuelve a 4
  columnas de ~208 px y dos rótulos vuelven a partirse. Es inherente a
  `auto-fit` con siete fichas y no empeora nada de lo que había; queda anotado.
- Sin desbordamiento de rejilla ni scroll horizontal en ninguno de los diez
  anchos. El único nodo que desborda sigue siendo «CUMPLIMIENTO 90 D» a 375 px
  (106/100), **preexistente y también en `HEAD`**, invisible por los 32 px de
  padding de `StatCard`: deuda de `shared/ui`, no de esta tajada.

**4 · El SCSS, compilado y comparado.** `sass --style=compressed` sobre el
`HabitPanel.module.scss` de `HEAD` y el del árbol, y comparación de la **lista
de selectores**, que es lo único que caza un comentario abierto: listas
**idénticas**, ninguna regla perdida, una sola añadida (`@media (min-width:
768px)` con `.tiles`), y 1.217 → 1.309 bytes = **+92 bytes exactos**, que es lo
que él reportó. El CSS del bundle sube de 279,51 a **279,61 kB**: sube, no baja,
así que no hay nada que investigar.

**5 · Nada de lo ya aceptado se movió.** `git diff --stat` conserva intactos los
recuentos de la primera vuelta en `HabitPanelTiles.tsx` (50), `HabitPanel.tsx`
(12) y `habit-panel.utils.ts` (26); solo crecen el gráfico (37 → 44), los tests
(147 → 254) y el SCSS (9, nuevo). Comprobado en el código: el orden de las siete
fichas es el mismo y la dificultad sigue siendo la séptima y última;
`MAX_DIFFICULTY = 4` y «de 4»; el cero de salvavidas se imprime y el de
dificultad no existe; «Es la racha que llevas ahora»; y la aserción reescrita
sigue siendo `getByText('mejor tramo')` y `/21 días.*mejor tramo/`, con el mismo
matcher de antes. **La promesa de la caché se sostiene**: `computeCacheShapeId`
vuelve a dar **`f8edc4f3becd`** con 32 ficheros de huella y cero ficheros de
esta tajada dentro — el SCSS tampoco entra.

**Puertas, corridas enteras por mí:** `pnpm typecheck` exit 0 · `pnpm lint`
`✖ 14 problems (14 errors, 0 warnings)` = base · `pnpm test` `Tests 2 failed |
2201 passed (2203)`, los dos de `SearchSelect`, sin rastro del flaky de
`IconPicker` · `pnpm build` exit 0, chunk **1.151,90 kB**, CSS **279,61 kB**.
Todo igual a la línea base que él declara.

**Lo que sigue siendo prueba manual del usuario** (`/app/*` está tras el login):
el espía de red del criterio 435; las siete fichas en un hábito con historia; y
mirar el panel en una tablet de verdad alrededor de 768 px, que es la banda que
esta corrección mueve.

### Tajada 2 — dónde se falla, contado como fallos

**Veredicto: devuelta.** Un solo motivo, y es del criterio 473 (y del 442 tal y
como está escrito): **cuando el panel calla, la frase cuenta apariciones *con
registro* y las llama «apariciones» a secas**, así que dice algo falso en el
caso más normal —un tramo largo con días sin registrar—. Es el mismo vicio de
la tajada 1 (decidir una frase contra un conjunto y nombrar otro) con otro
disfraz, y el propio expediente del constructor lo nombra como la razón por la
que el denominador de la frase buena es `tracked`. Todo lo demás de la tajada
está bien y comprobado: el día se elige por fallos, el umbral se dice, los tres
veredictos han muerto y las puertas están en la línea base.

**Cómo lo comprobé (sembrando datos, sin leer su test):** arnés de vitest
propio (`zz-reviewer-slice2.test.ts`, ya borrado) que construye `HabitDayEntry[]`
sobre tramos de 42 y 63 días y pasa cada escenario por
`buildWeekdayBreakdown` → `getMostFailedWeekday` → `composeWeekdayFailNote`,
imprimiendo la frase, el día señalado y las siete barras (`failed`) juntos, que
es la única forma de ver si los tres cuentan lo mismo.

**Las dos cifras falsas, con el dato que las desmiente:**

- Tramo de 63 días, **solo 3 martes registrados** (los martes aparecen **9
  veces** en el tramo; el resto de días, cero registros). La frase sale:
  «**Cada día ha aparecido 3 veces o menos en este tramo.** Con 4 ya se puede
  comparar: todavía no hay bastante para decir dónde se te cae.» Los martes
  aparecieron nueve veces, no tres. Lo que vale 3 son las **apariciones con
  registro**.
- Tramo de 63 días, lunes con 6 registrados (1 fallo) y martes con 3
  registrados: «**Solo los lunes llegan a 4 apariciones en este tramo.** Con 2
  días ya se puede comparar.» Falso igual: los martes aparecieron nueve veces.
- El criterio 442 trae escrita la forma correcta y el constructor no la siguió:
  «De los martes hay **2 registrados**; con 4 ya se puede comparar». Y el propio
  componente ya sabe decirlo bien en los otros dos sitios donde lo dice: la
  columna de la tabla oculta se llama «**Apariciones con registro**» y el
  `aria-label` del SVG dice «4 de 12 **apariciones con registro**». **La única
  cadena visible que se come el matiz es la del caso de callar**, que es
  justamente la que existe para decir la verdad sobre lo que falta.

**Qué hay que cambiar:** dos frases de `composeWeekdayFailNote`
(`habit-panel.utils.ts`), añadiendo el matiz que el resto del componente ya usa
—«con registro» / «registrados»—. Nada más de la tajada se toca. No lo arreglo
yo.

**Criterios, uno a uno** (contra la sección 1, literal):

- **440 · cumplidos / fallados / sin registro y el hueco no se pinta como
  fallo. Cumplido.** Medido: en el escenario de 6 viernes con 2 fallados y 2 sin
  registro, `tracked=4, failed=2, covered=2, untracked=2`; el `<rect>` solo se
  dibuja con `tracked > 0 && failed > 0` y la tabla oculta enseña las tres
  columnas por separado. Un día entero sin registro no dibuja barra y su cuenta
  sale «—», no «0».
- **441 · el día señalado es el de más fallos. Cumplido**, y con el caso
  obligatorio sembrado por mí: 42 días, domingos **sin un solo registro**,
  martes 4 fallos de 6, resto de días registrados → **señala martes**
  («Los martes fallas 4 de 6 veces…»). En `HEAD` ese mismo reparto señalaba el
  domingo (percent 0). Aviso de redacción del criterio, no del código: si el
  tramo **solo** tiene domingos y martes, el 441 y el 442 se contradicen —con un
  único día comparable el panel calla, que es lo que manda el 442—. El código
  hace lo correcto; el criterio 441 está escrito sin su contexto.
- **442 · ≥ 4 apariciones con registro y ≥ 2 días comparables. Cumplido en la
  aritmética, incumplido en la frase.** Borde medido uno a uno con el resto del
  tramo fijo: `tracked = 3` → calla; `tracked = 4` → **habla** («Los martes
  fallas 4 de 4 veces»); `tracked = 5` → habla. El umbral es `>= 4` de verdad.
  Un solo día comparable → calla y lo dice. **Pero la cifra que dice al callar
  está mal nombrada** (arriba).
- **443 · si ninguno destaca, no se elige el primero. Cumplido.** Empate arriba
  → `null` y «Ningún día destaca en este tramo: 2 días empatan a 3 fallos».
  Tramo sin ningún fallo → `null` y «En este tramo no hay ningún día fallado».
  Ningún desempate silencioso: comprobado con dos días idénticos.
- **444 · cuenta cruda y cero frases prohibidas. Cumplido.**
  `grep -rniE` de la lista entera sobre `src/features/habits` sin tests:
  **cero** para «sueles fallar», «tu punto flaco», «tu peor día», «peor día»,
  «incumpliste», «fallaste», «no lo lograste», «deberías», «ánimo», «llevas N
  días sin», «vas peor», «vas mejor», «vas parecido». Lo único que aparece de la
  lista es «intenta» como subcadena de `Reintentar`/`intentarlo` en errores de
  red preexistentes y ajenos al panel: **el criterio, tal y como está escrito
  («cero resultados»), es incomprobable en su literalidad**; queda como hallazgo,
  no como devolución.
- **445 · «Vas peor» desaparece. Cumplido**, y también «Vas mejor» y «Vas
  parecido». `composeReading` sembrada por mí devuelve «Cumpliste el 13% de los
  días de este tramo; en el tramo anterior, el 0%. Son 13 puntos más.», con la
  segunda mitad solo cuando la diferencia llega a `MEANINGFUL_DELTA_POINTS`, y
  `null` sin periodo anterior.
- **446 · ni imperativos ni consejos. Cumplido**: leídas las cinco cadenas de
  `composeWeekdayFailNote` y las dos de `composeReading`, ninguna propone nada.
- **447 · hábito recién creado. Cumplido.** Con cero registros la frase es
  `null` y `HabitPanel` corta antes con su `EmptyState`. Ningún 0 %.
- **448 · con un solo día registrado, nada comparativo y ningún «0» por «sin
  dato». Cumplido en la aritmética** (un registro → ningún día llega a 4 → calla)
  **y en el dibujo** («—» donde `tracked = 0`, «0» solo donde de verdad hubo
  registros y cero fallos). Pero la frase de ese caso es la que devuelve esta
  tajada: «Cada día ha aparecido 1 vez o menos en este tramo».
- **449 · `shouldAvoid` no se lee al revés. Aceptado como está declarado, y
  sigue pendiente de ojo humano.** La aritmética no se bifurca —comprobado:
  `getHabitDayStatus` no mira `shouldAvoid`— así que no hay nada que invertir en
  el código. Lo que no se puede comprobar desde aquí es si «Los martes fallas 4
  de 6 veces» **se lee** bien en un hábito de los de evitar. Va a la prueba
  manual, como él dijo.
- **450 · recalcula al cambiar de rango sin consultas nuevas. Cumplido**: los
  dos derivados son `useMemo` sobre `days`; el diff no toca ningún hook, ninguna
  clave de `habitKeys` ni ningún `.graphql.ts`.
- **451 · ≥ 4,5:1 en oscuro. Cumplido por construcción, no remedido por mí**:
  todas las cadenas nuevas reutilizan clases que ya existían
  (`.subtitle` → `--color-text-muted`, `.valueText`, `.valueTextAlert`,
  `.tagText`); **no se introduce ni un color nuevo** y no se tocó un solo
  `.scss`. Los ratios de su tabla son los de textos que ya estaban en pantalla.
- **452 · se modifica `HabitWeekdayChart`. Cumplido**: `git status` no lista
  ningún archivo nuevo; no hay un segundo gráfico de días de la semana.
- **473 · todo lo que se enseña es cierto. INCUMPLIDO**, por lo de arriba.
- **474 · ni una palabra de reproche. Cumplido.**
- **475 · vacío / cargando / error / texto largo. Cumplido**: los cortes
  tempranos de `HabitPanel` (`Spinner`, `Alert`, `EmptyState`) no aparecen en el
  diff y el gráfico no imprime el nombre del hábito, así que el texto largo no le
  llega.
- **476 · a 375 px, `scrollWidth === clientWidth`. No remedido por mí**, y lo
  digo en vez de firmarlo: acepto su medición (375 = 375, 768, 1024, cero nodos)
  porque el único nodo de bloque nuevo es un `<p>` con la clase `.subtitle` que
  ya se usa en todos los gráficos del panel y el resto vive dentro de un
  `viewBox` fijo; la etiqueta «más fallos» la verifiqué en aritmética de
  `viewBox` (centros 24,29 y 315,71 ± 21,35 → 2,9…337,1 dentro de 0…340). Si la
  segunda vuelta toca la frase, **hay que remedir a 375 y a 768**.
- **477 · línea base no peor. Cumplido, corrido entero por mí**: `pnpm
  typecheck` exit 0 · `pnpm lint` `✖ 14 problems (14 errors, 0 warnings)` ·
  `pnpm test` `Tests 2 failed | 2215 passed (2217)` (los dos de `SearchSelect`;
  el flaky de `IconPicker` no salió) · `pnpm build` exit 0, chunk **1.153,05 kB**
  (+1,15 sobre 1.151,90) y **CSS 279,61 kB, idéntico**. Como el CSS no baja, no
  hay comentario sin cerrar que buscar.
- **478 · ni `graphql/` ni `api/`. Cumplido, ejecutado**: `git diff --stat` sobre
  el árbol da exactamente cinco archivos de `src/features/habits` (utils, su
  suite, `HabitWeekdayChart.tsx`, `HabitPanel.tsx`, `HabitPanel.test.tsx`) más
  documentación y `graphify-out/`. Cero en `graphql/`, cero en `**/api/`, cero en
  `src/shared/api/`, cero `.scss`. **La promesa de la caché se sostiene**: nada
  de lo que firma `vite/cache-shape.ts` se mueve, así que nadie pierde la caché.
- **479 · ninguna ruta, página ni menú. Cumplido.**
- **480 · del usuario. Pendiente**, como debe estar.

**Qué rompió al lado, y cómo lo busqué.** El grafo **no sirvió para esta
pregunta**: el constructor corrió `graphify update .` después de su cambio, así
que `explain "getWorstWeekday"` responde «no node matching» —la función ya no
existe en el grafo— y `query "composeReading"` devuelve la firma nueva. Para
saber **quién dependía de esto antes** hay que preguntarle a `HEAD`, y eso fue
`git grep` contra `HEAD`:

- `getWorstWeekday`, `composeReading`, `buildWeekdayBreakdown`,
  `HabitWeekdayChart`: en `HEAD` **solo** los usan `HabitPanel.tsx` y
  `HabitPanel.test.tsx`. Ningún consumidor fuera del panel, así que la pérdida
  del tercer parámetro de `composeReading` no puede romper a nadie más — y
  `tsc -b` en verde lo confirma.
- `WeekdayStat` **existe también en Vida** (`vida-patterns.utils.ts:523`), pero
  es un tipo **local y propio**, no importado de hábitos: no hay acoplamiento.
  `vida-review.utils.ts:639` solo nombra `composeReading` en un comentario.
- **Lo de la tajada 1, que acaba de entrar:** el diff **no toca**
  `HabitPanelTiles.tsx` ni `HabitStreakEpisodesChart.tsx` ni
  `HabitPanel.module.scss`; las siete fichas, «Tu récord» sin fecha y «mejor
  tramo» siguen donde estaban (comprobado en el código y con la suite entera en
  verde). Lo único que `HabitPanel.tsx` cambia son dos `useMemo` y dos props.
- **Aserciones borradas en las suites:** 13 líneas de `expect`, todas de
  comportamiento que esta tajada mata a propósito («peor día», «Vas peor», el
  `getWorstWeekday`, el tercer argumento de `composeReading`). **Una se fue sin
  relevo y la apunto**: `expect(reading).not.toMatch(/propósito|identidad|recaíd/i)`
  era un guardián de la regla de producto, no del veredicto. Los guardianes
  nuevos (`HabitPanel.test.tsx:222` y `:574`, `habit-panel.utils.test.ts:350`)
  cubren las frases prohibidas pero ya no «propósito» ni «identidad».

**Estados.** Vacío: resuelto (frase `null` + `EmptyState`). Cargando y error: no
se tocaron y siguen en `HabitPanel`. Texto largo: no aplica, el gráfico no
imprime el nombre del hábito. Sin permisos: no aplica, todo el panel ya está tras
el login. Móvil: **no remedido por mí** (ver 476). **El estado que esta tajada
estrena y que sigue cojeando es «no hay bastante dato»**: existe, se dibuja y
dice el umbral —eso está bien construido— pero miente en la cifra.

**¿Duplica algo que ya existía?** No. Contra la sección 2: la aritmética entró en
`habit-panel.utils.ts`, no nació ningún `habit-metrics.utils.ts`, no nació un
segundo gráfico de días de la semana y no se copió nada de
`vida-patterns.utils.ts` (que tiene su propio `findOutlierDay` con otro umbral y
otro dato). `getWorstWeekday` **se sustituyó**, no se dejó viva al lado de
`getMostFailedWeekday`: comprobado, no queda ninguna función muerta.

**Las dos desviaciones del render, juzgadas de forma independiente:**

1. **«Días que fallaste» → «Días fallados»: bien sustituida.** «fallaste» está
   literalmente en la lista del expediente, y «fallados» es el vocabulario que el
   módulo ya usaba (el tooltip de `HEAD` decía «3 fallados» y la tabla decía
   «Fallados»). Dice la verdad: la barra cuenta `failed`. **Pero deja el módulo
   con dos varas de medir**, y esto es para el usuario, no para el constructor:
   la frase aprobada del render —«Los viernes **fallas** 9 de 13 veces… donde más
   **se te cae**»— pone el sujeto en la persona exactamente igual que «fallaste».
   Si la regla es la que dice la sección 1, sobrevive por ser literal del render
   y por no estar en la lista; si lo que importa es el espíritu, la frase buena
   también habría que repensarla. **No es cosa de esta tajada decidirlo**, y el
   constructor hizo lo correcto al no tocar la frase aprobada.
2. **«4 veces o menos» → la cifra real del tramo: bien vista la contradicción,
   mal rematada.** Comprobado en el render (`01-habitos-metricas.html:203`): dice
   «Cada día ha aparecido **4 veces o menos**… Todavía no hay bastante para decir
   dónde se te cae», y con el umbral en `>= 4` un día de exactamente 4 ya habla,
   así que la frase del render es falsa en el borde: **el constructor tiene
   razón**. Su sustitución arregla el borde y **conserva el otro error del
   render**, el de llamar «apariciones» a las apariciones con registro; y ahí es
   donde se le fue. La segunda mitad **sí es literal** del render, comprobado
   carácter a carácter salvo la minúscula inicial. Y la frase del caso bueno
   **también es literal** en su forma: el render dice «Los viernes fallas 9 de 13
   veces. Es el día donde más se te cae, de largo.» y el código produce «Los
   martes fallas 4 de 6 veces. Es el día donde más se te cae, de largo.»; el «, de
   largo» condicional (`>= 1,5×` y `+2` fallos) es un acierto, porque escrito fijo
   afirmaría una distancia inexistente.

**Las tres cosas que declaró y no arregló, juzgadas:**

- **`MEANINGFUL_DELTA_POINTS`: bien dejada escrita, no se cierra ahora.** Sigue
  decidiendo un umbral de «cuándo se nombra la diferencia»; el nombre aguanta y
  renombrar una constante exportada en la misma tajada que mata tres veredictos
  mezcla dos cambios. Que se renombre cuando alguien la toque.
- **`failRate` sin consumidor: hallazgo, y me inclino por borrarla.** Hoy solo la
  lee un test, o sea que **el test prueba que existe, no que sirva**. El plan la
  pedía para ordenar por tasa y eso no ha llegado. No devuelvo la tajada por
  esto, pero si la segunda vuelta la borra, mejor: una cifra pública sin usuario
  es la que acaba usándose mal (contando sobre `tracked` donde alguien esperará
  `total`).
- **`composeReading` pierde un parámetro: correcto y sin riesgo.** El tercer
  argumento era el «punto flaco» y esa lectura se mudó al gráfico. Verificado que
  no hay ningún consumidor fuera del panel ni en `HEAD` ni en el árbol.

**«▼ el bajón»: queda fuera de esta tajada, y con razón.**
`HabitWeeklyComplianceChart.tsx:134` no está en el diff, la cadena no es nueva ni
modificada (el 474 habla de cadenas nuevas o modificadas), el 444 habla de **la
frase que señala el día** —que es la del reparto por día de la semana— y «el
bajón» no está en la lista de prohibidas. Además no es el mismo tipo de frase:
«Vas peor» era un veredicto **sobre la persona**; «▼ el bajón · 40%» rotula **un
punto del dato**. Dicho eso, el constructor tiene razón en que es lo que más se
le parece en ese panel, y **el sitio donde eso se decide es un criterio nuevo,
no esta revisión**: si el usuario lo quiere muerto, pide una tajada 5 o lo mete
en la 4.

**Lo que queda para prueba manual del usuario** (`/app/habits/:id` está tras el
login y desde aquí no se entra): los cuatro pasos que él dejó escritos, y de esos
el que **nadie ha podido ver**, ni él ni yo, es el (4): **la frase en un hábito de
los de «evitar»**. La aritmética está comprobada y no se bifurca; lo que no se
puede comprobar sin ojos es si «Los martes fallas 4 de 6 veces» se entiende al
derecho cuando fallar significa «hiciste lo que querías evitar». Añado uno: mirar
el panel de un hábito **poco registrado** en un rango de 90 días y leer la frase
del caso de callar — es justo la que devuelve esta tajada.

**Lo que no revisé:** no remedí los anchos (376/768) ni el contraste en oscuro;
razoné por qué el riesgo es bajo y lo dejo dicho arriba en vez de firmarlo. No
abrí el navegador en ningún momento: no hacía falta para lo que se devuelve, y no
se tocó ningún estilo.

### Tajada 2 · revisión de la corrección — la frase que calla ya cuenta lo que dice

**Veredicto: aceptada.** El defecto por el que devolví la tajada está cerrado y
lo comprobé sembrando yo el mismo caso, no leyendo su test; los dos añadidos que
pidió el coordinador (`failRate` fuera, guardián de producto) están donde dice; y
nada de lo que ya di por bueno se ha movido. Queda **una prueba manual real** —el
hábito de los de «evitar»— y **tres hallazgos escritos**, ninguno de los cuales
justifica una tercera vuelta.

**1 · El defecto devuelto, cerrado.** Sembrado de nuevo por mí (arnés vitest
propio, borrado), 63 días con **martes que aparecen nueve veces y están
registrados tres**, el resto sin un solo registro:

```
martes → total 9 · tracked 3 · untracked 6
frase  → «De cada día de la semana hay 3 registros o menos en este tramo.
          Con 4 ya se puede comparar: todavía no hay bastante para decir
          dónde se te cae.»   (143 caracteres)
contiene «9»: false · contiene «aparic/aparec»: false
```

Y el segundo, lunes 6 registros / martes 3 sobre los mismos 63 días: «**Solo los
lunes llegan a 4 registros en este tramo.** Con 2 días ya se puede comparar.» —
cierto: los lunes tienen 6 registros y ningún otro día llega a 4. **Las dos
frases dicen ahora exactamente lo que cuentan**, y el 9 no se cuela por ningún
lado: lo comprobé sobre la cadena, no sobre su aserción.

**Mutación, hecha por mí** (devolví las dos cadenas al texto que devolvió la
tajada, corrí las dos suites y restauré el archivo, verificado con `md5sum`):

```
× con menos de 4 apariciones no señala nada y dice cuánto falta (criterio 442)
× con un solo día comparable tampoco compara, y lo dice (criterio 442)
× al callar cuenta registros, no apariciones en el calendario
× con un solo día comparable tampoco llama apariciones a los registros
× con pocas apariciones, calla y dice cuántas hay
× con pocas apariciones por día el panel calla y dice qué le falta
      Tests  6 failed | 73 passed (79)
```

Seis casos, los seis que él declaró. **Los tests nuevos prueban algo.**

**2 · El vocabulario del gráfico, mirando los tres a la vez.** Ahora conviven
cuatro nombres para el mismo conjunto: la frase dice «**registros**», el
`aria-label` dice «**apariciones con registro**», la columna oculta dice
«**Apariciones con registro**», el tooltip dice «**con registro**» y la frase del
caso bueno dice «**veces**». **Ninguno miente** —eso es lo que importaba y es lo
que se arregló—, pero un lector de pantalla oye una palabra y el que mira lee
otra para la misma cifra. **Hallazgo, no devolución**: si alguien vuelve a tocar
este gráfico, que unifique en «registros», que es el más corto y el menos
ambiguo. Y ahí es donde cae la única esquina que queda floja: «Los martes fallas
4 de 6 **veces**» sigue nombrando `tracked` como «veces» aunque los martes hayan
aparecido trece. **No lo devuelvo y no cambio de criterio a mitad**: es literal
del render que aprobó el usuario y ya lo di por bueno en la primera vuelta. Si
algún día el usuario quiere la frase exacta, «4 de 6 registros» la arregla y de
paso unifica.

**3 · `failRate`, borrada y sin huérfanos.** `git grep failRate HEAD` → **cero**
(nació en esta tajada, nunca llegó a `HEAD`). En el árbol solo queda el
comentario de `tracked`, que dice qué era y por qué se fue —una tasa sobre
`tracked` que alguien iba a leer como si fuera sobre `total`—. Y lo confirmé en
el dato: `Object.keys` de un `WeekdayStat` real son `weekday, label, longLabel,
pluralLabel, total, covered, failed, untracked, percent, tracked`. Ningún
consumidor, ninguna aserción huérfana.

**4 · El guardián: su lectura es correcta y la mía de la primera vuelta era
imprecisa. Lo escribo aquí para que no quede a medias.** En `HEAD` había **una
sola** aserción `not.toMatch(/propósito|identidad|recaíd/i)`,
`habit-panel.utils.test.ts:348`, sobre `composeReading`. Su diff la borraba de un
sitio y la reponía en otro: hoy vive en `:504`, sobre `composeReading`, dentro
del test reescrito. **Nunca estuvo desprotegido `composeReading`**; lo que faltaba
era el relevo sobre la frase que heredó el papel, y eso es exactamente lo que
entra ahora en `:400`, dentro del recorrido de los cinco estados de
`composeWeekdayFailNote`. Quedan **dos** guardianes donde antes había uno.

**5 · Anchos, remedidos por mí** con `iframe` del ancho exacto (no dentro de un
`flex`), el gráfico dentro de la rejilla real `.charts` del panel, los cuatro
estados a la vez:

| Ancho | `scrollWidth` / `clientWidth` | Desbordados fuera de `.srOnly` | La frase larga (143 car) |
|---|---|---|---|
| **375 px** | 360 = 360 | **0** (de 80 nodos desbordados, los 80 dentro de `.srOnly`, que recorta a propósito) | 290 px, **3 líneas**, 50 px de alto |
| **768 px** | 753 = 753 | **0** | 393 px, **3 líneas**, 50 px de alto |

Dos apuntes sobre sus cifras, ninguno grave: el ancho útil a 375 es **360**, no
375, porque el `iframe` se queda la barra de scroll vertical —lo que importa,
`scrollWidth === clientWidth`, se cumple igual—; y a **768 px me salen 3 líneas,
no 2**, porque en la rejilla real la frase tiene 393 px y no los 683 que él midió
(su arnés ponía el gráfico a todo lo ancho; en el panel comparte fila con
«Cumplimiento semana a semana»). Es una línea más de la que él reporta, no una
menos.

**¿Empujan algo que importe las tres líneas a 375?** No. La frase es el último
nodo del cuerpo del gráfico, el panel entero es una columna a ese ancho y lo
único que pasa es que la tarjeta mide **358 px en vez de 341** y el gráfico
siguiente baja 17 px. Nada se solapa y nada se recorta. **Lo que sí encontré
midiendo, y va como hallazgo:** el tooltip se coloca con un `top` en **porcentaje
de `.plot`**, y `.plot` ahora incluye la frase —224 px con tres líneas, 208 con
dos, frente a los 162 del `svg`—, así que **el globo aparece más abajo del
extremo de la barra cuanto más larga sea la frase**. Es de ratón, o sea de
escritorio, no rompe nada y ya pasaba antes en pequeño; se arregla el día que
alguien saque la frase de `.plot` o le dé al tooltip un ancla en unidades del
`viewBox`.

**6 · Nada de lo aceptado se ha movido.** Comprobado en el código y en el dato:
«Días fallados» en subtítulo, leyenda, tabla y `aria-label`; la barra sigue sin
dibujarse con `tracked === 0 || failed === 0` y el apagado por umbral sigue en
0,3 / 0,6 / 0,9; `MIN_TRACKED_PER_WEEKDAY = 4`, `MIN_WEEKDAYS_COMPARABLE = 2`,
`BY_FAR_RATIO = 1.5`, `BY_FAR_MARGIN = 2`. Resembrados los bordes: `tracked = 3`
calla, `= 4` habla («Los martes fallas 4 de 4 veces»), `= 5` habla; el caso
obligatorio del 441 sigue señalando **martes** con domingos sin registro; empate
→ «Ningún día destaca…»; sin fallos → «En este tramo no hay ningún día fallado»;
cero registros → `null`. De la tajada 1 no se toca un archivo:
`HabitPanelTiles.tsx`, `HabitStreakEpisodesChart.tsx` y los `.scss` **no aparecen
en `git status`**, así que las siete fichas, «Tu récord» sin fecha y «mejor
tramo» siguen intactos.

**Puertas, corridas enteras por mí:** `pnpm typecheck` exit 0 · `pnpm lint`
`✖ 14 problems (14 errors, 0 warnings)` · `pnpm test` `Tests 2 failed | 2217
passed (2219)` (los dos de `SearchSelect`; `IconPicker` no salió) · `pnpm build`
exit 0, chunk **1.153,07 kB**, **CSS 279,61 kB idéntico** (no baja: nada que
investigar). Igual a la línea base que declara el coordinador. `git diff --stat`
sigue siendo cinco archivos de `src/features/habits`: **cero en `graphql/`, cero
en `**/api/`, cero en `src/shared/api/`, cero `.scss`** — la caché de nadie se
tira.

**Criterios que quedan pendientes y de quién son:** el **480** (del usuario,
`/app/*` tras el login) y, dentro de él, el punto que nadie ha podido ver todavía
—**la frase en un hábito de los de «evitar»**—. La aritmética no se bifurca y
está comprobada; lo que falta es leerla con ojos. Añado el que estrena esta
vuelta: **mirar un hábito poco registrado a 90 días** y comprobar que la frase
dice «hay N registros o menos», que es la que se corrigió.

**Nota de entorno (no la toco, la digo):** la fila de `pnpm test` de
`ENVIRONMENT.md` sigue diciendo «2 fallos de **2203**»; con esta tajada dentro
son **2219**. El número de fallos es el mismo y el que manda; el total lleva dos
tajadas desfasado.

### Tajada 3b — la hora se guarda y se corrige

**Veredicto: aceptada.** Los 453–461 se cumplen, comprobados por mi cuenta y no
leídos del reporte; el 462 sigue siendo del usuario. Línea base igual que la de
`ENVIRONMENT.md`. Hay dos hallazgos escritos abajo que **no** devuelven la
tajada.

**Línea base, medida en el árbol sucio (no leída):**

- `pnpm typecheck` → exit 0, limpio.
- `pnpm lint` → **14 errores / 0 warnings**, los mismos preexistentes.
- `pnpm test` → **2 fallos de 2312** (`SearchSelect` ×2, preexistentes). La base
  dice «2 de 2294»: mismo número de fallos, el total sube por los tests nuevos.
- `pnpm build` **no** lo corrí (lo dejo dicho, no lo disimulo): el `tsc -b` de
  `typecheck` salió limpio y la tajada no añade SCSS que pudiera comerse reglas
  más allá del bloque nuevo, que sí se ve pintado en el arnés.

**Criterios, uno a uno.**

- **453 · marcar no cuesta ni un píxel más. Cumplido.** `git diff --stat` no
  lista `HabitDayRow.tsx` ni ningún otro componente del camino de marcar: el
  único `.tsx` de producto tocado es `HabitFollowUpForm.tsx`, y ahí el bloque
  nuevo está detrás de `followUpTime ? … : null`, que solo es cierto con
  `existingFollowUp.timeOfDay`. Medido en el arnés: con `timeOfDay: null` el
  formulario no pinta ni la línea ni «Corregir» ni la frase «sin hora». Ni
  desplegable, ni confirmación, ni un segundo paso.
- **454 · una mutación con la hora del momento de pulsar. Cumplido.** Espié las
  **variables reales** montando el hook con `graphqlRequest` mockeado (test
  temporal mío, ya borrado): `{"input":{"habitId":"7","date":"2026-09-25",
  "isAccomplished":true,"timeOfDay":"20:15"}}` — una sola llamada, formato
  `HH:mm`. Que la hora es la del **botón** y no la del montaje se ve en el
  código (`nowHHmm()` solo se llama dentro del `mutationFn`; `grep` de
  `new Date()` en `HabitFollowUpForm.tsx` y `HabitDayRow.tsx`: cero) y lo sujeta
  el test del constructor, que corrí: hoja abierta a las 22:15, pulsada a las
  22:25, viaja `"22:25"`.
- **455 · corregir manda solo la hora. Cumplido**, leyendo lo que viaja, no el
  tipo: `{"input":{"id":"l1","timeOfDay":"21:40"}}` sobre
  `mutation HabitFollowUpEdit($input: HabitFollowUpEditInput!)`. Dos claves y
  nada más: ni `isFailed`, ni `notes`, ni `difficulty`. `useSetFollowUpTimeOfDay
  Mutation` no pasa por `HabitFollowUpForm.updateFollowUp`, que sí las
  reescribiría.
- **456 · también en los cumplimientos. Cumplido.** El sello está en el embudo
  (`useAddHabitFollowUpMutation`), por el que pasan los cuatro sitios que
  escriben — comprobado que `useHabitLifelineAction.ts:17` y
  `HabitDayRow.tsx:73` usan ese mismo hook. Mi espía de arriba es precisamente
  un **cumplimiento** (`isAccomplished: true`) y lleva hora.
- **457 · un día pasado no inventa hora. Cumplido.** Variables reales con
  `date: '2026-09-23'`: `{"input":{"habitId":"7","date":"2026-09-23",
  "isFailed":true}}` — la clave **no viaja**. Y «hoy» se decide en local, no en
  UTC: `timeOfDayForDate` → `getTodayString()` → `formatLocalDateToYmd(new
  Date())` (`habit-type.utils.ts:28`). Comprobado además el caso `date`
  ausente: lleva hora, que es lo correcto porque el API lo resuelve como hoy.
- **458 · lo de antes se ve igual. Cumplido.** Ningún componente de «Mi Día»,
  semana, calendario o panel cambia (`git diff --stat`), `timeOfDay` es aditivo
  y `toHHmm(null)` da `null`, que se pinta **callando**. La guarda nueva de
  `query-cache-guards.ts` **no tira caché sana**, y lo verifiqué por separado:
  el prefijo `['habits','calendar']` solo cubre `habitKeys.calendar(from,to)`
  (`useHabits.ts:73`, único uso), cuyo `queryFn` devuelve
  `HabitFollowUpsDateGroup[]` (`habits.api.ts:57-66`) — exactamente `{ date,
  followUps[] }`, que es lo que el predicado exige; no se solapa con ninguna
  otra guarda y las suites `query-cache-guards.*` siguen verdes.
- **459 · la hora en las dos formas. Cumplido, y contra el API real.** En el
  cliente: `timeOfDay` en `FOLLOW_UP_FULL_FIELDS`, en `FOLLOW_UP_FIELDS`, en
  `HABIT_WEEK_VIEW_QUERY`, en `HABIT_FOLLOW_UPS_IN_DATES_QUERY` y conservado en
  el remapeo de `buildFollowUpsByHabit`. Y la forma recortada la validé contra
  `https://xavi-api-9om1.onrender.com/graphql`: la consulta
  `habitFollowUpsInDates{ followUps{ id timeOfDay } }` **pasa la validación** y
  solo devuelve `UNAUTHENTICATED`; `habitFollowUpEdit(input:{timeOfDay:"22:15"})`
  tampoco protesta por el campo.
- **460 · `time` intacto. Cumplido.** `git diff -U0 -- src | grep '\btime\b'`
  sin `timeOfDay`: solo el nombre del archivo nuevo, un `type="time"` del
  `<input>`, un `id` de etiqueta y dos `time: null` en fixtures de test nuevos.
  Ni una línea de la duración en minutos.
- **461 · el cliente no revienta sin el campo. Cumplido, pero por orden de
  despliegue y no por construcción, y así queda escrito.** La mutación no manda
  `timeOfDay` cuando no hay hora, pero **todas las selecciones lo piden
  siempre**: contra un API sin el campo, marcar fallaría por validación. El
  antecedente del criterio ya es falso —3a está desplegada y lo verifiqué yo
  contra el API real, ver 459—, así que la ventana de riesgo está cerrada y el
  criterio se da por cumplido. **Corolario para la tajada 4 y para cualquier
  reversión: si alguna vez se revierte el API, este cliente deja de poder
  marcar.** No es deuda que devuelva la tajada; es una nota de despliegue.
- **462 · del usuario. Pendiente**, como estaba. Todo `/app/*` está tras el
  login y los agentes no entran.

**Transversales que aplican:** 473 (nada se rellena con un cero: sin hora se
calla), 474 (ni una palabra de reproche: «Registrado a las HH:mm · la hora en
que pulsaste» y «¿A qué hora fue de verdad?»), 477 (línea base, arriba), 478
(no aplica: esta tajada sí es de la 3), 479 (ninguna ruta ni entrada de menú
nuevas).

**Qué miré alrededor.** `git diff --stat` primero, para saber qué se tocó de
verdad. Luego, uno por uno: quién más usa `habitKeys.calendar` (`grep` en `src`,
un solo sitio) y qué forma devuelve, porque la guarda nueva era el riesgo más
caro; quién más pasa por `useAddHabitFollowUpMutation` (el salvavidas y el
círculo de Mi Día, los dos intactos); y si `HabitFollowUp.timeOfDay`
**obligatorio** rompía a alguien — `pnpm typecheck` limpio sobre el árbol entero
es la prueba de que los tres fixtures ajenos eran todos los que faltaban, y el
`git diff` de esos tres tests **no borra ni una línea** (`grep -c '^-[^-]'` = 0):
nadie perdió aserciones. Obligatorio es lo correcto: las dos selecciones piden
el campo siempre, así que un seguimiento sin la clave sería un error, no un
caso. El grafo no me servía aquí para «quién dependía antes» —refleja el estado
posterior al `graphify update` del constructor—, así que fui por `grep` y por el
compilador.

**Estados.** Medidos en un arnés temporal en la raíz del repo (ya borrado), con
la hoja dentro de un `iframe` de **375 px** y `data-theme='dark'` en `<html>` +
`data-ds='aura'` en `<body>` (que es lo que pide el selector
`[data-theme='dark'] [data-ds='aura']` de `_theme-variables.scss:251`):

- **Sin dato** (seguimiento sin hora): resuelto callando, como fija D5.
- **375 px**: `scrollWidth === clientWidth === 375` y **cero nodos desbordados**,
  tanto con la línea como con el campo abierto; el `<input type=time>` (189 px)
  y «Guardar hora» (137 px) caben en la fila (borde derecho en 355).
- **Oscuro, contraste** (mínimo **7,88:1**, todos ≥ 4,5): la hora `22:15`
  **14,89:1**, «Registrado a las» y el `small` **7,88:1**, «Corregir» **9,76:1**
  (`rgb(78,222,163)`), «¿A qué hora fue de verdad?» **14,89:1**, el campo
  **12,59:1**, «Cancelar» **7,88:1**. En claro, el mínimo es **6,03:1**.
- **Cargando**: el botón usa `isLoading` y deshabilita campo, «Cancelar» y
  «Guardar hora». Resuelto.
- **Error**: `onError` del hook levanta el toast «Error al guardar la hora» y la
  línea se queda con la hora vieja. Resuelto por el camino que ya existía.
- **Permisos** y **texto largo**: no aplican (una hoja de un hábito propio; la
  línea es de ancho fijo `HH:mm`). Probé aun así con notas de 100 caracteres y
  nombre de hábito largo: nada se desborda.

**¿Duplica algo que ya existía?** No. Contra la sección 2: `habit-time.utils.ts`
es el único archivo nuevo y no repite `habit-panel.utils.ts` (aquella es
aritmética de lectura); no nace un segundo formulario de registro; la corrección
**no** reutiliza `updateFollowUp` justamente porque reescribiría notas y
dificultad, y eso estaba escrito en el plan. La guarda de caché entra por el
registro que ya existe, sin mecanismo nuevo.

**Hallazgos que no devuelven la tajada** (para quien haga la 4):

1. **Los documentos GraphQL de hábitos no tienen test de contrato.**
   `contracts.test.ts` solo existe en `src/features/vida/graphql/`, y no hay SDL
   vendorizado de hábitos: el campo nuevo de las cinco selecciones no lo valida
   nada en CI. Lo cubrí a mano contra el API real, pero es un hueco preexistente
   que esta tajada agranda.
2. **La cabecera de `query-cache-guards.ts` sigue diciendo «Aplicada hoy son
   ocho guardas»**; con la de hábitos son **nueve**. Dos palabras, pero es el
   comentario que le dice al siguiente cuántas hay.
3. **Nota de entorno (no la toco, la digo):** la fila de `pnpm test` de
   `ENVIRONMENT.md` dice «2 fallos de 2294»; en el árbol son **2 de 2312**.
