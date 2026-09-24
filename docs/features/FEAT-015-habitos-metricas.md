---
id: FEAT-015
title: Las métricas de un hábito — tu récord, dónde se te atraviesa y (luego) a qué hora
status: planned
architect: yes    # solo para las tajadas 3 y 4; la 1 y la 2 cuelgan del panel que ya existe
area: features/habits, **API (xavi-platform-node)** en las tajadas 3–4
requested: 2026-09-22
updated: 2026-09-24
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
| 2 | **Dónde se falla, contado como fallos.** El día de la semana se elige por fallos reales y no por cumplimiento, un día sin registrar deja de parecer un fallo, el umbral se dice en voz alta y desaparece «Vas peor». Criterios 440–452. | pendiente |
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
| 1 | **Las cifras que faltan.** Récord como ficha propia y distinguido del mejor episodio del tramo, salvavidas usados, dificultad media. | `utils/habit-panel.utils.ts` (+ suite), `HabitPanel/HabitPanelTiles.tsx`, `HabitPanel/HabitPanel.tsx`, `HabitPanel/HabitPanel.module.scss`, `HabitPanel/HabitStreakEpisodesChart.tsx` (revisión del rótulo), `HabitPanel/HabitPanel.test.tsx` | 430–439 + 473–480 | pendiente (**render D5 primero**) |
| 2 | **Dónde se falla, contado como fallos.** El día se elige por fallos, el umbral se dice en voz alta, muere «Vas peor». | `utils/habit-panel.utils.ts` (+ suite), `HabitPanel/HabitWeekdayChart.tsx`, `HabitPanel/HabitPanel.tsx`, `HabitPanel/HabitPanel.test.tsx` | 440–452 + 473–480 | pendiente (**render D5 primero**) |
| 3a | **El API aprende la hora.** Columna, mapeo, SDL, validadores. **Nada visible; se cierra con el push del usuario y el job de migración.** | `xavi-platform-node`: `migrations/071_habit_logs_time_of_day.sql`, `src/services/habit.service.ts`, `src/types/services/habit.types.ts`, `src/graphql/modules/habit/habit.schema.ts`, `src/validators/schemas/habit.schemas.ts` | ninguno por sí sola (habilita 453–462) | pendiente (**D3: despliegue del usuario**) |
| 3b | **La hora se guarda y se corrige**, en el mismo toque, en los cuatro sitios a la vez. | `hooks/useHabitFollowUps.ts`, `utils/habit-time.utils.ts` (+ suite, nuevo), `types/habit.types.ts`, `graphql/habit-follow-ups.graphql.ts`, `graphql/habits.graphql.ts`, `utils/habit-stats.utils.ts`, `components/HabitFollowUpForm/HabitFollowUpForm.tsx`, `app/providers/query-cache-guards.ts`, los `vi.mock` de `HabitDayRow.test.tsx` | 453–462 | pendiente (**bloqueada por 3a**) |
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

## 3. Construcción — feature-builder

*(pendiente)*

## 4. Revisión — feature-reviewer

*(pendiente)*
