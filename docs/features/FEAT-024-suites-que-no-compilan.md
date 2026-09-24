---
id: FEAT-024
title: Las suites que no compilan — que la red del API vuelva a avisar antes de tocar los seguimientos
status: delivered
architect: no    # es deuda sobre tests que ya existen en `xavi-platform-node`; no hay concepto nuevo
area: API
requested: 2026-09-24
updated: 2026-09-24
---

# FEAT-024 — Las suites que no compilan

## 1. La petición — sin analista (la escribe el constructor)

**Resumen para quien venga detrás:** en `xavi-platform-node` hay suites que ni
llegan a correr —revientan al compilar con `ts-jest`— y otras que corren y
fallan. La tajada única devuelve la compilación a todas, pone al día las
afirmaciones que envejecieron con el código, y **clasifica** los fallos reales
en «test desfasado» o «defecto del API», dejando rojos los que sean defecto.

**Qué problema resuelve:** la tajada 3b de FEAT-015 va a tocar los seguimientos
de hábito (`addHabitLog`, racha, `habit-streak`) y hoy entraría **sin red**: la
única prueba que corre sobre ese camino es `src/services/habit-streak.test.ts`,
escrita anteayer, que el revisor llamó «una red de un hilo». Las suites que
cubrían ese terreno llevan meses sin compilar y por tanto sin avisar de nada.

**Para quién es:** para quien construya FEAT-015 tajada 3b y para cualquiera que
toque hábitos, sueño o standup en el repo del API.

**Palabras del usuario:** «Lo que quiero, por orden: 1. Que las cuatro suites
que no compilan vuelvan a compilar. Ese es el entregable. 2. Que los tests que
resuciten digan la verdad. […] Un test que pasa afirmando algo que ya no es
cierto es peor que un test roto: al menos el roto avisa. […] 3. Los 3 fallos
reales: mira si son defectos de verdad del producto o tests desfasados. […] si
uno es un defecto real del API, no lo tapes cambiando el test — escríbelo como
hallazgo y déjalo rojo.» Y: «Lo que NO quiero: que pongas la suite en verde a
base de borrar aserciones, relajar expectativas o marcar cosas como `skip`.»

**Fuera de alcance:**

- **Arreglar defectos del producto.** Si un fallo resulta ser un defecto real
  del API, se documenta y se deja rojo; su arreglo es otra feature.
- **El linter del repo del API.** 895 problemas preexistentes; solo se compara
  antes/después en los ficheros tocados. Nunca `lint:fix` a lo ancho.
- **Cobertura nueva.** No se escriben tests de caminos que hoy no tienen; se
  rescata lo que ya existía y se pone al día.
- **El repositorio del front.** Solo estos dos ficheros de documentación (hay
  otra sesión en FEAT-015 tajada 2).
- **Commit y push.** El push a `main` de ese repo despliega **y migra**: es del
  usuario.

**Criterios de aceptación:** (el máximo usado hoy en el tablero es **631**, de
FEAT-023; sigo en **632**)

- [ ] 632. `npm test` en `/home/jako/Developer/xavi-platform-node` termina sin
      ninguna suite que reviente al compilar: la frase literal `Test suite
      failed to run` aparece **cero veces** en la salida.
- [ ] 633. El número de suites en rojo baja de **6** y el total de tests
      ejecutados sube de **614** (las suites que resucitan aportan sus casos).
      Ningún test que hoy pasa se vuelve rojo.
- [ ] 634. `tests/unit/services/habit-streak.test.ts` afirma sobre la API
      **actual** de `src/services/habit-streak.ts` (`habit_type`, `period_days`,
      `restart_count`) y no menciona ni un export que ya no exista. Los casos
      cuyo sujeto desapareció del código se nombran **uno a uno** en el reporte;
      ninguno se borra en silencio.
- [ ] 635. `sleep-follow-up-sync.service.test.ts` y `standup.service.test.ts`
      compilan **y** sus afirmaciones describen lo que el servicio hace hoy. Si
      alguna había envejecido, va en el reporte con su antes y su después.
- [ ] 636. Nada se pone en verde a base de rebajar: en cada fichero de test
      tocado, el número de `expect(` es **mayor o igual** que en `HEAD`, y no
      aparece ni un `.skip(` ni un `.only(` nuevo (`git diff` lo enseña).
- [ ] 637. Cada uno de los **3 fallos reales** de la línea base queda
      clasificado como «test desfasado» o «defecto real del API», con su
      evidencia. Los que sean defecto **siguen rojos** y su motivo está escrito.
      Ni una línea de código de producto cambiada para hacer pasar un test.
- [ ] 638. `npx tsc --noEmit` sigue limpio (exit 0) en el repo del API, y
      `npm run lint` sobre los ficheros tocados no está peor que en `HEAD`.
- [ ] 639. En el repo del front no se toca nada salvo `docs/features/BOARD.md` y
      este dossier (`git status` del front lo enseña).

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | Las suites vuelven a compilar, las afirmaciones se ponen al día y los fallos reales quedan clasificados | **aceptada** (2026-09-24) |

**¿Arquitecto? no** porque no hay concepto nuevo: se trabaja sobre ficheros de
test que ya existen en `xavi-platform-node/tests/unit/` y sobre el mapa de
`docs/features/ENVIRONMENT.md` («El otro repositorio»).

**Decisiones que no son mías:** ninguna pendiente. La que podría haberlo sido
—qué hacer con los dos casos cuyo sujeto ya no existe en el código— se resuelve
por la regla del usuario: no borrar en silencio, nombrarlos en el reporte.

## 3. Construcción — feature-builder

### Tajada 1 — Las suites vuelven a compilar y las afirmaciones se ponen al día

**Resumen para el revisor:** las tres suites que reventaban al compilar vuelven
a correr y las dos que fallaban por mocks desfasados dicen ahora lo que el
código hace hoy: `npm test` pasa de **3 fallos / 6 suites rojas / 614 tests** a
**1 fallo / 1 suite roja / 646 tests**, sin un solo `skip` ni una aserción
borrada. El fallo que queda es **un defecto real del API**, demostrado y dejado
en rojo a propósito: `walletExpenseUpdate` llama al servicio con `id` y `input`
a `undefined`. Lo que más probablemente he roto: los mocks de
`habit.service.test.ts` codifican **la secuencia exacta de siete consultas** de
`addHabitLog`; quien cambie el orden de las consultas de `applyStreakAfterFollowUp`
o de `syncHabitStreakFromLogs` —justo lo que va a tocar FEAT-015 tajada 3b— verá
romperse ese test, y eso es deliberado, no un descuido.

**Primero: el mapa había envejecido.** `docs/features/ENVIRONMENT.md` dice
«cuatro suites ni llegan a correr» y atribuye la causa a `HabitStreakFields`.
Medido hoy (2026-09-24) sobre `HEAD` del repo del API, la realidad era otra:

- Suites que **no compilaban: tres**, no cuatro — `habit-streak`,
  `sleep-follow-up-sync.service` y `standup.service`.
- Suites que compilaban y **fallaban: tres** — `habit.service`,
  `habit-sync-streak` y `expense.resolvers`. 3 + 3 = las 6 en rojo, y los 3
  fallos salen de esas tres últimas: **las cifras sí cuadraban**.
- La causa tampoco era una sola: **solo `habit-streak`** venía de
  `HabitStreakFields`. Las otras dos venían de **`UserSettings`**, que ganó
  `vidaNightBedTime`, `vidaNightWakeTime` y `vidaNightDays` (FEAT-012), y una de
  ellas además de **`Activity`**, que ganó `isWorkout`.
- `habit-streak` **no arrastraba** a las suites de hábitos: `habit.service` y
  `habit-sync-streak` fallaban por su cuenta, con sus propios mocks.
- Y `npx tsc --noEmit` **no ve los tests**: `tsconfig.json` los excluye
  (`"exclude": ["node_modules", "dist", "tests"]`). Por eso los tipos estaban
  limpios mientras tres suites no compilaban. La única puerta que caza esto es
  `npm test`.

**Qué se construyó** (todo en `/home/jako/Developer/xavi-platform-node`, solo
bajo `tests/`; ni una línea de `src/`):

- `tests/unit/services/sleep-follow-up-sync.service.test.ts` — los tres mocks de
  `UserSettings` reciben los tres campos de la noche y el mock de
  `createActivity` recibe `isWorkout: false`. **Nada más**: las 4 afirmaciones
  de la suite pasan tal cual contra el código de hoy.
- `tests/unit/services/standup.service.test.ts` — los dos mocks de
  `UserSettings` reciben los tres campos de la noche. Sus 19 casos pasan sin
  tocar ni una aserción.
- `tests/unit/services/habit-streak.test.ts` — reescrita contra la API actual.
- `tests/unit/services/habit-sync-streak.test.ts` — reescrita contra la
  implementación actual (la racha se calcula en SQL).
- `tests/unit/services/habit.service.test.ts` — el mock de `addHabitLog`
  puesto al día, más un caso nuevo de back-fill.

**Los tests que resucitaron y mentían, uno a uno** (lo que el usuario pidió
nombrar):

1. **`habit-streak.test.ts` › `applyFailedStreak resets streak and extends
   end_date`** — afirmaba que el periodo hasta `end_date` sale de **`days`**
   (pasaba `days: 7` y esperaba `+7`). Hoy sale de **`period_days`**; `days` son
   los días registrados y no influye. Reescrito: pasa `period_days: 7, days: 999`
   y espera `+7`, y se añade un caso que fija lo contrario explícitamente
   (`days: 0` y `days: 400` dan el mismo `end_date`). También se añade la
   aserción que faltaba sobre `restart_count`, que hoy se incrementa.
2. **`habit-streak.test.ts` › `getEffectiveGoal uses timer_goal when is_timer`**
   y los dos de `isFollowUpGoalMet` — afirmaban sobre los flags viejos
   (`is_counter` / `is_timer` / `is_incremental` / `is_decremental`), que ya no
   existen en el tipo. Traducidos a `habit_type: 'boolean' | 'count' | 'time'`,
   y **ampliados**: `isFollowUpGoalMet` es lo único que esta suite cubre y
   ninguna otra, así que ahora tiene un caso por cada uno de los tres tipos
   (antes solo el contador).
3. **`habit-sync-streak.test.ts` › `updates streak, max_streak and days from
   accomplished logs`** — afirmaba que `syncHabitStreakFromLogs` lee **las
   fechas** de los logs (`rows: [{ completed_date }]`) y cuenta la racha en
   JavaScript, y que el UPDATE final recibe **`days` como parámetro**
   (`arrayContaining([2, 2, 5, 10])`). Hoy son tres consultas y el UPDATE recibe
   solo `[streak, max_streak, habitId]`: `days` lo resuelve una subconsulta.
   Reescrita contra eso, con un segundo caso que fija que la racha se cuenta
   desde el último `is_failed` y que `max_streak` histórico no se pierde.
4. **`habit.service.test.ts` › `addHabitLog › creates log when date is
   available`** — devolvía `{ completed_date }` donde el código lee `{ latest }`
   (la consulta de frontera) y se quedaba **una consulta corta**, de ahí el
   `Cannot read properties of undefined (reading 'max_streak')`. Puesto al día a
   las siete consultas reales, y **con aserción nueva**: antes solo comprobaba
   dos campos del log devuelto y no miraba la racha; ahora fija que la séptima
   consulta es el `UPDATE habits` con `[3, 7, HABIT_ID]`.

**Los 3 fallos reales, clasificados:**

| Fallo | Veredicto | Evidencia |
|---|---|---|
| `syncHabitStreakFromLogs › updates streak, max_streak and days…` | **test desfasado** | El test describe una implementación en JavaScript que hoy es SQL. Arreglado. |
| `HabitService › addHabitLog › creates log when date is available` | **test desfasado** | El `rows[0]` que reventaba viene de `SELECT COALESCE(MAX(cnt), 0) AS max_streak …`: un agregado **sin `GROUP BY`**, que en Postgres devuelve siempre exactamente una fila. En producción nunca es `undefined`; solo lo era porque el mock se quedaba corto. Arreglado. |
| `Expense Resolvers › walletExpenseUpdate › should update an expense` | **DEFECTO REAL DEL API — se queda rojo** | Abajo. |

**El defecto real (no tocado, rojo a propósito):**

`walletExpenseUpdate(id: ID!, input: WalletExpenseUpdateInput!)` está roto en
producción. `withValidation` (`src/graphql/utils/validation.ts:38-54`) detecta
que hay args además de `input` y entonces **valida `args` enteros y sustituye
los args del resolver por el resultado de `schema.parse(args)`**. Pero el
esquema que se le pasa es `expenseUpdateSchema`
(`src/validators/schemas/expense.schemas.ts:27`), que es un `z.object` **plano
de los campos del gasto**: no tiene `id` ni `input`, así que zod los **descarta**
(modo `strip`, el de por defecto) y devuelve `{}`. Ejecutado con `tsx` sobre el
esquema real:

```
hasArgsBeyondInput = true
validated = {}
id seen by resolver = undefined | input seen by resolver = undefined
```

El resolver llama entonces a `expenseService.updateExpense(undefined, userId,
undefined)`, y esa función arranca con `getExpenseById(undefined, userId)`:
**ningún gasto se puede editar**. El test estaba en lo cierto y por eso **no se
ha tocado**.

Y no es un despiste del wrapper, sino de **ese** esquema: los hermanos que sí
funcionan validan la forma completa —`updateCreditCardInputSchema` y
`updateCreditCardChargeInputSchema` (`src/validators/schemas/credit-card.schemas.ts:29,59`),
`swUpdateListSchema` y `swUpdateListItemSchema`
(`src/validators/schemas/sweeter-way.schemas.ts:73,91`) declaran los dos `{ id,
input }`—. **`expenseUpdateSchema` es el único de los cuatro que no**. El
arreglo (envolverlo en `z.object({ id: z.string().uuid(), input:
expenseUpdateSchema })`) es de una línea, pero es **código de producto** y toca
gastos, que están fuera del alcance de esta tajada: queda como hallazgo para una
feature propia.

**Por qué así, y qué se descartó:** la alternativa evidente para `habit-streak`
y `habit-sync-streak` era **borrarlas**, porque `src/services/habit-streak.test.ts`
—la suite nueva de anteayer— ya cubre `syncHabitStreakFromLogs` y
`applyFailedStreak`. Se descartó por dos razones: borrar suites es exactamente
lo que el usuario pidió no hacer, y la cobertura **no** es idéntica —
`isFollowUpGoalMet` no la toca nadie más, y era el único hueco entre las dos—.
Lo que sí se aceptó perder son los dos casos de `applyAccomplishedStreak` y
`recalculateStreakFromDates`: **esos exports ya no existen**, su trabajo se
mudó a SQL dentro de `syncHabitStreakFromLogs`, y traducirlos habría sido
inventar un sujeto. Queda escrito en la cabecera del fichero, no en silencio.

**Verificación:**

```
$ npx tsc --noEmit            # antes y después
TSC_EXIT=0

$ npm test                    # antes (HEAD)
Test Suites: 6 failed, 49 passed, 55 total
Tests:       3 failed, 611 passed, 614 total

$ npm test                    # después
Test Suites: 1 failed, 54 passed, 55 total
Tests:       1 failed, 645 passed, 646 total
FAIL tests/unit/graphql/resolvers/expense.resolvers.test.ts

$ grep -c "Test suite failed to run" test-after.txt
0
```

Control negativo del caso nuevo de back-fill (para que no sea una aserción
vacua): copiando el test con la frontera cambiada a `latest: '2024-06-01'`, el
caso **falla** — es decir, detecta de verdad el reinicio indebido. La copia se
borró (`tests/unit/services/zz-control-feat024.test.ts`, eliminada).

**Criterios, uno a uno:**

- **632** ✅ `Test suite failed to run` aparece **0 veces** en la salida de
  `npm test`.
- **633** ✅ suites rojas **6 → 1**; tests ejecutados **614 → 646**. Ningún test
  que pasaba se ha vuelto rojo: el único fallo de después ya fallaba antes.
- **634** ✅ `tests/unit/services/habit-streak.test.ts` importa solo
  `applyFailedStreak`, `getEffectiveGoal`, `isFollowUpGoalMet` y el tipo
  `HabitStreakFields`; los dos casos cuyo sujeto desapareció están nombrados
  arriba y en la cabecera del propio fichero.
- **635** ✅ las dos suites compilan y pasan; ninguna de sus afirmaciones había
  envejecido (solo la **forma de los mocks**), y se dice así arriba en vez de
  atribuirles un mérito que no tienen.
- **636** ✅ `expect(` por fichero, antes → después: `habit-streak` 10 → 12,
  `habit-sync-streak` 1 → 8, `habit.service` 12 → 15, `sleep-follow-up-sync`
  5 → 5, `standup.service` 43 → 43. `git diff -U0 | grep -E '^\+.*\.(skip|only)\('`
  no devuelve nada.
- **637** ✅ los tres clasificados en la tabla de arriba; el defecto real sigue
  rojo y `git status` del repo del API enseña **solo cinco ficheros bajo
  `tests/`** modificados.
- **638** ✅ `npx tsc --noEmit` exit 0. Sobre el linter: `npm run lint` es
  `eslint src --ext .ts` — **no mira `tests/` siquiera**, y no se ha tocado ni un
  fichero de `src/`, así que sus 895 problemas están intactos por construcción.
  (Comprobado además que `npx eslint` sobre esos cinco ficheros da los mismos 5
  errores de «no está en el tsconfig» antes y después: son del `tsconfig`, no
  del código.)
- **639** ✅ en el front solo están tocados `docs/features/BOARD.md` y este
  dossier. Lo demás que aparece en `git status` es de la otra sesión (FEAT-015
  tajada 2) y no se ha rozado.

**Lo que descubrí y no estaba en el plan:**

- El `ENVIRONMENT.md` del front necesita corrección en «El otro repositorio»
  (son 3 suites que no compilan, no 4; la causa no es solo `HabitStreakFields`;
  `habit-streak` no arrastra a nadie). **No lo he editado**: es del usuario.
- **`npx tsc --noEmit` no es puerta para los tests** en ese repo: `tsconfig.json`
  los excluye. Conviene que el mapa lo diga.
- Hay **dos ficheros llamados `habit-streak.test.ts`** —`src/services/` y
  `tests/unit/services/`— y jest corre los dos (`roots` incluye `src`). Se
  prestan a confusión al leer la salida.
- Lo de arriba sobre `expenseUpdateSchema`, que es material para una feature.

**Riesgos:** los mocks de `habit.service.test.ts` y `habit-sync-streak.test.ts`
fijan **la secuencia y la forma exactas** de las consultas de
`applyStreakAfterFollowUp` + `syncHabitStreakFromLogs`. Es red de verdad —es
para lo que se pidió esta tajada— pero significa que FEAT-015 tajada 3b, si
añade o reordena una consulta en ese camino, verá romperse estos tests y tendrá
que actualizarlos a conciencia. Segundo riesgo, menor: las suites de sueño y
standup ponen los tres campos de la noche a `null`; si mañana esos servicios
empiezan a leer `vidaNight*`, el camino nuevo no estará cubierto y las suites
seguirán en verde (comprobado hoy que **ninguno de los dos servicios los lee**).

**Estado del árbol:** sin commit, en los dos repositorios.

## 4. Revisión — feature-reviewer

### Tajada 1 — Las suites vuelven a compilar y las afirmaciones se ponen al día

**Veredicto: aceptada.** El verde es verde de verdad —medido por mí, no leído
del reporte— y el rojo que queda es un defecto real del API, reproducido de
forma independiente. Con ella, la feature queda **entregada**.

**Criterios, uno a uno** (todo medido el 2026-09-24 sobre el árbol sin commitear
de `/home/jako/Developer/xavi-platform-node`):

- **632 ✅** — `npm test` corrido por mí: `grep -c "Test suite failed to run"`
  sobre la salida completa da **0**.
- **633 ✅** — `Test Suites: 1 failed, 54 passed, 55 total` / `Tests: 1 failed,
  645 passed, 646 total`. Suites rojas **6 → 1**, tests **614 → 646**. Ningún
  test que pasaba se ha vuelto rojo: el único fallo posterior
  (`walletExpenseUpdate`) es uno de los 3 de la línea base.
- **634 ✅** — el fichero importa solo `applyFailedStreak`, `getEffectiveGoal`,
  `isFollowUpGoalMet` y el tipo `HabitStreakFields`; leído
  `src/services/habit-streak.ts` entero, los tres existen y la suite afirma
  sobre `habit_type`, `period_days` y `restart_count`. Los dos casos cuyo sujeto
  desapareció (`applyAccomplishedStreak`, `recalculateStreakFromDates`) están
  nombrados en la cabecera y en el reporte. **Tensión literal anotada**: el
  criterio pide «no menciona ni un export que ya no exista» y la cabecera los
  menciona **en prosa** para no borrarlos en silencio, que es la otra mitad del
  mismo criterio. Se resuelve a favor de la segunda mitad: no hay ni un uso ni
  un import de un export inexistente. No reescribo el criterio; lo dejo dicho.
- **635 ✅** — las dos compilan y pasan. Verificado además **por qué** no
  compilaban antes (ver abajo): era la forma de los mocks, no sus afirmaciones,
  y el constructor lo dice así en vez de atribuirse un mérito que no tiene.
- **636 ✅** — contado fichero a fichero contra `HEAD` (`git show HEAD:<f> |
  grep -o 'expect(' | wc -l`): `habit-streak` 10→12, `habit-sync-streak` 1→8,
  `habit.service` 12→15, `sleep-follow-up-sync` 5→5, `standup.service` 43→43.
  `git diff -U0 -- tests src | grep '^+' | grep -E '\.(skip|only|todo)\(|xit\(|xdescribe\(|fit\(|fdescribe\('` **no devuelve nada**.
  Y `git diff --name-only -- src` devuelve **0 ficheros**: ni una línea de
  producto tocada.
- **637 ✅** — los tres clasificados, y he verificado la clasificación de los
  tres (abajo). El defecto real **sigue rojo** y su test está **sin tocar**
  (`git diff --stat` de `expense.resolvers.test.ts`: vacío).
- **638 ✅** — `npx tsc --noEmit` exit 0. El linter: `npm run lint` es
  `eslint src --ext .ts` (leído en `package.json`) y **no mira `tests/`**; como
  `git diff -- src` está vacío, sus 895 problemas son idénticos por
  construcción. No se ha corrido `lint:fix` a lo ancho: el árbol de `src` está
  intacto.
- **639 ✅** — en el front están tocados `docs/features/BOARD.md` (solo la fila
  y el bloque de FEAT-024; la fila de FEAT-015 la cambió la otra sesión y sigue
  ahí, no se ha pisado) y este dossier. `src/features/habits/**` y el dossier de
  FEAT-015 son de la sesión de FEAT-015 tajada 2.

**Que el verde sea verde: cómo lo comprobé.** Además del recuento de `expect(`
y de la ausencia de `skip`/`only`/`todo`, corrí `npm test` entero yo mismo
(salida en `Test Suites: 1 failed, 54 passed, 55 total`). Para saber qué pasaba
**antes** sin revertir nada, materialicé las cinco versiones de `HEAD` como
copias temporales en el mismo directorio (`zzhead-*.test.ts`, mismo nivel de
rutas relativas), las corrí y las borré. Resultado, que es la prueba directa de
los puntos del mapa:

| Suite en `HEAD` | Qué hacía | Error real |
|---|---|---|
| `habit-streak` | **no compila** | `TS2305` por `applyAccomplishedStreak` y `recalculateStreakFromDates`; `TS2353`/`TS2345` por `is_timer`/`is_counter`/`is_incremental`/`is_decremental` |
| `sleep-follow-up-sync.service` | **no compila** | `TS2345` ×3 sobre `UserSettings` y **uno sobre `Activity`** (línea 153, el mock de `createActivity`) |
| `standup.service` | **no compila** | `TS2345` ×2 sobre `UserSettings` |
| `habit.service` | compila, **falla** una aserción | por sus propios mocks |
| `habit-sync-streak` | compila, **falla** una aserción | por sus propios mocks |

**Los tests resucitados, ¿dicen la verdad de hoy?** Contrastado contra el código
fuente, no contra el reporte:

- `applyFailedStreak` (`src/services/habit-streak.ts:44-55`) calcula
  `end_date` con `habit.period_days` y devuelve `restart_count + 1`; `days` no
  aparece en la función. El test nuevo pasa `period_days: 7, days: 999` y espera
  `+7`, más un caso que fija que `days: 0` y `days: 400` dan el mismo
  `end_date`. **Cierto.**
- `syncHabitStreakFromLogs` (`src/services/habit.service.ts:266-325`) son hoy
  **tres consultas**: `COUNT(*)::int AS streak` desde el último `is_failed`, el
  `max_streak` por épocas con `COALESCE(MAX(cnt), 0)`, y un
  `UPDATE habits … max_streak = GREATEST(max_streak, $2), days = (SELECT COUNT(*) …)`
  con parámetros `[streak, max_streak, habitId]`. El test nuevo afirma
  exactamente eso. **Cierto**, y la explicación del `rows[0]` que reventaba
  (agregado sin `GROUP BY`, siempre una fila) también lo es: se lee en el SQL.
- El caso nuevo de back-fill **no es vacuo**: repetí el control negativo por mi
  cuenta (copia con la frontera en `latest: '2024-06-01'`), y el caso **falla**.
  Copia borrada.

**El defecto real, verificado de forma independiente: sí, está roto en
producción.** La cadena, leída entera:

1. El SDL declara `walletExpenseUpdate(id: ID!, input: WalletExpenseUpdateInput!)`
   (`src/graphql/modules/expense/expense.schema.ts:43`).
2. El resolver es `withValidatedResolver(expenseUpdateSchema, async (_, { id, input }, ctx) …)`
   (`src/graphql/modules/expense/expense.resolvers.ts:46-53`).
3. `withValidation` (`src/graphql/utils/validation.ts:30-56`) ve
   `hasArgsBeyondInput === true` y **sustituye los args del resolver** por
   `schema.parse(args)`.
4. `expenseUpdateSchema` (`src/validators/schemas/expense.schemas.ts:27-39`) es
   un `z.object` plano de campos del gasto, todos opcionales: `parse({id, input})`
   en modo `strip` devuelve **`{}`**. Reproducido con `tsx` fuera del test:
   `hasArgsBeyondInput = true / validated = {} / id = undefined | input = undefined`.
5. `expenseService.updateExpense(id, userId, input)`
   (`src/services/expense.service.ts:177`) arranca con
   `this.getExpenseById(undefined, userId)`. **Ningún gasto se puede editar por
   esta mutación.**

Y el test que lo caza está **intacto** y solo mockea el servicio: recorre el
resolver y el validador reales. Su salida lo dice literal:
`Received: undefined, "550e8400-…-440000", undefined`.

Sobre «el único de los cuatro»: **lo confirmo, con un matiz que conviene llevarse
a la feature nueva**. Hay **ocho** resolvers que reciben `{ id, input }`, pero
solo **cuatro** pasan por `withValidation`/`withValidatedResolver` —los dos de
`credit-card`, los dos de `sweeter-way` y el de `expense`, que son cinco: los
cuatro sanos más este—. `updateCreditCardInputSchema`,
`updateCreditCardChargeInputSchema`, `swUpdateListSchema` y `swUpdateListItemSchema`
**declaran los dos campos** (leídos uno a uno); `expenseUpdateSchema` no. Los
otros tres (`walletUpdate`, `walletBudgetUpdate`, `walletExpenseCategoryUpdate`)
usan `withErrorHandling`, que **no sustituye args**, así que están a salvo: no
hay más víctimas de este patrón hoy.

**Qué busqué alrededor y qué encontré.** El grafo del repo del API
(`graphify explain "applyFailedStreak"`, `graphify query "how does
syncHabitStreakFromLogs compute the streak"`) me dio los usuarios de lo tocado:
`habit.service.ts`, `applyStreakAfterFollowUp`, `updateHabitFollowUp`,
`removeHabitFollowUp` y las dos suites. Como **no se ha tocado `src/`** (0
ficheros en `git diff -- src`), no hay regresión posible de producto: el riesgo
de esta tajada es solo de red de pruebas, y la red entera la corrí.
`npx eslint` no aplica a `tests/`. Sin hallazgos de regresión.

**Los cuatro puntos del mapa, confirmados uno a uno** (para que el usuario
reescriba `ENVIRONMENT.md`; **no lo he tocado**):

1. Suites que **no compilaban: tres**, no cuatro — `habit-streak`,
   `sleep-follow-up-sync.service`, `standup.service`. **Confirmado** corriendo
   las copias de `HEAD`.
2. `habit-streak` **no arrastraba a nadie**: `habit.service` y
   `habit-sync-streak` compilaban en `HEAD` y fallaban por sus propios mocks.
   **Confirmado** (las copias de `HEAD` de esas dos corrieron y fallaron una
   aserción cada una).
3. Las causas: **`UserSettings`** con `vidaNightBedTime` / `vidaNightWakeTime` /
   `vidaNightDays` en las dos de sueño y standup, y **`Activity`** (el campo
   `isWorkout`) en `sleep-follow-up-sync`. `HabitStreakFields` solo explica
   `habit-streak`. **Confirmado** con los `TS2345`/`TS2353` literales.
4. `tsconfig.json` del API: `"include": ["src/**/*"]`, `"exclude": ["node_modules",
   "dist", "tests"]` y `"rootDir": "./src"`. **`npx tsc --noEmit` nunca vio los
   tests**, y por eso los tipos salían limpios con tres suites sin compilar.
   **Confirmado leyendo el fichero.** Mi recomendación: **no** meter `tests` en
   ese `tsconfig` (cambiaría `rootDir` y el `outDir` del build); lo que vale es
   **dejarlo escrito en el mapa** —la única puerta que caza esto es `npm test`—
   y, si algún día se quiere puerta de tipos para los tests, añadir un
   `tsconfig.tests.json` aparte con `noEmit` y un script propio. Eso es una
   feature de su tamaño, no un apaño.

**Estados que nadie construye:** no aplica ninguno. Esta tajada no toca
pantalla, ni datos de usuario, ni permisos: es código de pruebas en otro
repositorio. **Confirmo que no necesita prueba manual**, y lo confirmo mirando
el `git diff`, no la palabra del constructor: los cinco ficheros cambiados están
todos bajo `tests/unit/services/`, no hay ni un `.tsx`, ni un `.graphql`, ni un
fichero de `src/`.

**¿Duplica algo que ya existía?** No hay sección 2 (sin arquitecto), así que la
pregunta pesa más. La respuesta honesta es que **hay solape consciente y está
justificado**: `src/services/habit-streak.test.ts` (la suite de anteayer) ya
cubre `syncHabitStreakFromLogs` y `applyFailedStreak`. El solape se acepta
porque `isFollowUpGoalMet` **no lo cubre nadie más** y porque borrar suites era
justo lo prohibido. Lo que sí queda como incomodidad heredada, y no la crea esta
tajada: **dos ficheros llamados `habit-streak.test.ts`** (uno en `src/services/`
y otro en `tests/unit/services/`), ambos corridos por jest. Confunde al leer la
salida.

**Hallazgos (no devuelven la tajada, se anotan):**

1. **La red de FEAT-015 3b está a la altura correcta salvo en tres
   aserciones.** Fijar la **secuencia y los parámetros** de las consultas es
   inevitable con mocks posicionales (`mockResolvedValueOnce`) y es exactamente
   la red que se pidió: si 3b añade o reordena una consulta, romperá, y debe
   romper. Lo que sí está **un nivel demasiado abajo** son las tres aserciones
   que comparan **texto literal de SQL**:
   `expect(updateSql).toContain('days = (SELECT COUNT(*) FROM habit_logs')`,
   `toContain('max_streak = GREATEST(max_streak, $2)')` y las tres de
   `streakSql` en el segundo caso. Un reformateo o un renombrado de parámetros
   sin cambio de conducta las rompe, y romperse por eso enseña a ignorarlas.
   Sugerencia para 3b: al tocar ese camino, conservar las aserciones de
   **orden, número y parámetros** y relajar las de **texto de SQL**.
2. **El segundo caso de `habit-sync-streak` afirma sobre el SQL, no sobre la
   conducta.** «Cuenta la racha desde el último fallo» se comprueba mirando que
   la cadena contiene `is_failed = TRUE`: eso no prueba la semántica, solo que
   la consulta menciona la columna. Es coste bajo y riesgo bajo, pero no vale
   lo que su nombre promete.
3. **El criterio 637 dice «solo cinco ficheros bajo `tests/`»** y `git status`
   del API muestra además `graphify-out/*` modificado — es el `graphify update .`
   que manda `CLAUDE.md`, no código. Vale la pena que el criterio lo prevea la
   próxima vez.
4. **`walletExpenseUpdate` merece feature propia y ya.** El arreglo es envolver
   el esquema (`z.object({ id: z.string().uuid(), input: expenseUpdateSchema })`),
   pero toca gastos en producción y hay que decidir si además se blinda
   `withValidation` para que **avise** cuando el esquema no declara los args que
   va a sustituir —que es la raíz: hoy falla en silencio, devolviendo `{}`—.

**Lo que no revisé:** no he ejecutado nada contra la API desplegada ni contra la
base de Neon; el defecto de `walletExpenseUpdate` está demostrado en el código y
reproducido con `tsx`, no observado en producción. Tampoco he corrido
`npm run lint` entero en el repo del API: me apoyo en que su script solo mira
`src` y en que `src` no tiene ni una línea cambiada.

**Para el usuario:**

Lo que antes no podías hacer y ahora sí: **tocar los seguimientos de hábito con
red**. En el repositorio del API había tres bloques de pruebas que llevaban
meses sin siquiera arrancar —se caían al compilar— y otros dos que corrían
afirmando cosas del código de hace meses. Hoy corren los cincuenta y cinco
bloques: de 614 pruebas has pasado a 646, y de seis bloques en rojo a uno. Ese
que sigue en rojo **está rojo a propósito**: no es una prueba desfasada, es un
fallo de verdad del API que ahora tienes localizado con nombre y apellido.

El fallo es este: **editar un gasto no funciona**. La mutación que actualiza un
gasto pierde por el camino el identificador y los datos nuevos antes de llegar a
la base —el validador los descarta sin avisar— así que ningún gasto se puede
editar desde la app. Está confirmado por dos vías distintas y es el único caso
del repositorio con ese problema; su arreglo es de una línea, pero toca dinero
en producción y merece su propia feature, no un parche de paso.

Para comprobarlo tú mismo, sin entrar en ninguna pantalla:

1. Abre una terminal en `~/Developer/xavi-platform-node`.
2. Corre `npm test`. Al final debe decir **1 fallo de 646, 54 bloques en verde y
   1 en rojo**, y ese rojo debe ser el del gasto (`walletExpenseUpdate`).
3. Corre `npx tsc --noEmit`: termina limpio.
4. Si quieres ver que no hay trampa: `git diff --name-only` no enseña **ningún**
   fichero dentro de `src`; solo cinco dentro de `tests`.

Nada de esto está commiteado, en ninguno de los dos repositorios: el commit y el
push siguen siendo tuyos, y en ese repositorio un push a `main` despliega **y
migra**.
