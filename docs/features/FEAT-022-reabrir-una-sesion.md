---
id: FEAT-022
title: Reabrir una sesión cerrada — que el API sepa decir «esto vuelve a estar en marcha»
status: delivered
architect: no    # cuelga de `updateFollowUp` en el repo del API; no hay concepto nuevo
area: API
requested: 2026-09-23
updated: 2026-09-23
---

# FEAT-022 — Reabrir una sesión cerrada

## 1. La petición — feature-builder (no hubo analista ni arquitecto)

**Resumen para quien venga detrás:** el API no sabe **reabrir** una sesión de
actividad ya cerrada; mandar `durationMinutes: null` revienta con «Duration
must be at least 1 minute». Esta feature es **una sola tajada en el repositorio
del API** (`~/Developer/xavi-platform-node`): `null` pasa a significar «esta
sesión vuelve a estar abierta», con la misma regla de «una sola abierta por
usuario» que ya protege el arranque.

**Qué problema resuelve:** hoy **ningún «deshacer» que necesite reabrir se
puede construir en el cliente**. El apaño sería `delete` + `start` + `delete`:
tres escrituras, y si falla una a medias el día se queda con un rato
desaparecido o contado dos veces. Eso ya costó un caso de uso real: en FEAT-013
tajada 3 hubo que **suprimir** el atajo «empezar desde la hora planeada»
mientras algo está en marcha, porque cerraba la sesión viva **en el pasado** y
borraba minutos ya trabajados sin vuelta atrás. El revisor dejó escrito que eso
no era el accidente sino el uso más natural de la idea: «estaba en Trabajar, a
las 12:30 me puse a Comer y se me olvidó pulsar».

**Para quién es:** para el constructor del front, hoy no para el usuario final.
Con el API capaz de reabrir, ese atajo puede volver **con un deshacer de
verdad** — y eso será otra feature del front, no esta.

**Palabras del usuario:**

> «`updateFollowUp` no puede **reabrir** una sesión cerrada. […] En JavaScript
> **`null < 1` es `true`**, así que mandar `durationMinutes: null` —la forma
> natural de decir «esta sesión vuelve a estar abierta»— no reabre: revienta
> con el error de duración mínima.»

> «Con el API capaz de reabrir, ese atajo puede volver con un deshacer de
> verdad. Eso será otra feature del front; tú deja el API listo.»

**El fallo, con su línea, para que no haya que volver a buscarlo:**
`xavi-platform-node/src/services/activity-follow-up.service.ts:367-372` (antes
del cambio):

```ts
if (input.durationMinutes !== undefined) {
  if (input.durationMinutes < 1) {
    throw new BadRequestError('Duration must be at least 1 minute');
  }
```

`null < 1` es `true` porque `null` se convierte a `0` en una comparación
relacional (`undefined < 1` sería `false`, porque `Number(undefined)` es `NaN`).
Es el tipo de fallo que vuelve solo: cualquier guardia `x < N` escrita sobre un
campo que puede ser `null` tiene el mismo agujero al revés — deja pasar `null`
donde quiere números, o lo rechaza donde quiere borrar.

**Fuera de alcance:**

- **Todo el front.** Ni el atajo de FEAT-013, ni un botón de deshacer, ni el
  hook, ni el documento GraphQL. Esta tajada toca **solo** el repositorio del
  API, salvo estos dos ficheros de documentación.
- **La copia vendorizada del SDL** en `graphql/schema/*.schema.graphql` del
  front: se recopia cuando el front use esto, no ahora.
- **Reabrir en lote**, reabrir por `clientId`, o un `activityFollowUpReopen`
  como mutación propia. Se reutiliza la mutación que existe.
- **Deshacer el XP de entrenamiento** al reabrir. Se comprueba que no se
  conceda dos veces al volver a cerrar (criterio 615), pero no se retira nada.
- **Migraciones.** La columna ya admite `NULL`: así se representa hoy una
  sesión en marcha.

**Criterios de aceptación:**

> Numerados desde **603**. Al empezar, el último número escrito era el **599**
> (FEAT-020) y FEAT-021 aún no existía; para cuando fui a escribir, la otra
> sesión ya había publicado FEAT-021 con los criterios **600–602**, así que
> sigo a continuación de los suyos, como se pidió. **Si FEAT-021 añade más
> criterios después de este punto, el choque es con estos números** y los que
> se corrigen son los míos, no los suyos: ellos llegaron antes.

- [x] 603. `activityFollowUpEdit` con `durationMinutes: null` sobre una sesión
  **cerrada** la reabre: devuelve `isOpen: true`, `durationMinutes: null` y
  `endTime` / `endDate` / `endDateTime` a `null`, y la fila queda con
  `duration_minutes IS NULL`. **No** lanza «Duration must be at least 1
  minute».
- [x] 604. **Omitir** `durationMinutes` sigue significando «no la toques»: una
  edición que solo cambia `notes` o `startTime` no mete `duration_minutes` en
  el `SET` del `UPDATE` y deja la fila intacta.
- [x] 605. El camino entero conserva la diferencia entre **campo ausente** y
  **campo a `null`**, y queda escrito **dónde** se conserva cada salto: SDL →
  resolver → validador zod → servicio → SQL. Si en algún punto `null` se vuelve
  `undefined` (o un error de validación), el criterio **no** está cumplido y la
  decisión de diseño cambia.
- [x] 606. `durationMinutes: 0` y los negativos **siguen rechazados** con
  `BadRequestError`. El agujero de `null < 1` no se arregla abriendo la puerta a
  cualquier cosa.
- [x] 607. Reabrir cuando ese usuario **ya tiene otra sesión abierta** falla con
  `BadRequestError` y **no escribe nada**. Nunca dos abiertas del mismo usuario:
  `getOpenFollowUp` devuelve una sola (`ORDER BY created_at DESC LIMIT 1`), así
  que la segunda quedaría invisible y sin forma de cerrarla desde la app.
- [x] 608. Reabrir una sesión **que ya está abierta** con `durationMinutes:
  null` no falla y no cambia nada: es idempotente y **no** se choca contra sí
  misma en la comprobación del 607.
- [x] 609. Reabrir una sesión **de otro usuario** lanza `ForbiddenError` y no
  escribe.
- [x] 610. Un id que no existe lanza `NotFoundError`.
- [x] 611. Existe un test que **falla en HEAD y pasa con el cambio**, dicho por
  su nombre y con la salida literal de las dos corridas.
- [x] 612. `npx tsc --noEmit` limpio y `npm test` **no peor que la línea base**
  del repo del API (3 fallos de 584, 6 suites de 52 en rojo). El linter de ese
  repositorio no es una puerta: se compara **solo en los ficheros tocados**,
  antes y después, y no se corre `lint:fix` a lo ancho.
- [x] 613. El SDL deja dicho **en el propio `input`** que `null` significa
  reabrir y que omitir el campo significa «no la toques». Quien lea el esquema
  no tiene que deducirlo del servicio.
- [x] 614. El dossier deja escrito el `null < 1` con fichero y línea (hecho
  arriba, en «El fallo, con su línea»).
- [x] 615. Reabrir y **volver a cerrar** una sesión de entrenamiento no concede
  XP dos veces, comprobado sobre el código que lo concede.

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | El API reabre una sesión cerrada con `durationMinutes: null`, con la regla de «una sola abierta» y las invariantes de propiedad | accepted |

**¿Arquitecto? no** porque cuelga de algo que ya existe: la mutación
`activityFollowUpEdit` y `activityFollowUpService.updateFollowUp`
(`src/services/activity-follow-up.service.ts:347`). No hay entidad nueva, ni
mutación nueva, ni columna nueva: `duration_minutes` ya es `NULL` cuando una
sesión está en marcha.

**Decisiones que no son mías:** ninguna pendiente. Las dos que había las resolví
con criterio y las dejo argumentadas en la sección 3 («Por qué así»): cómo se
dice «reabre esto» y si la regla de «una sola abierta» vale también aquí.

## 2. El plan — feature-architect

*(no hubo arquitecto: ver «¿Arquitecto? no» arriba)*

## 3. Construcción — feature-builder

### Tajada 1

**Resumen para el revisor:** `durationMinutes: null` en `activityFollowUpEdit`
ahora **reabre** la sesión, con la misma regla de «una sola abierta por
usuario» que protege `startFollowUp`, y `0`/negativos siguen rechazados. Está
todo en el repo del API: el validador zod (que era **la primera puerta que
cerraba el paso**, antes incluso del `null < 1`), el tipo de entrada, el
servicio y el SDL. **Lo que más probablemente he roto:** `updateFollowUp` es el
mismo camino que usa la sincronización de sueño
(`sleep-follow-up-sync.service.ts:136`) y el guardia nuevo mete **una consulta
SQL extra** cuando se reabre — cualquier test que cuente `mockDbPool.query`
llamadas en un camino de reapertura ve un número distinto; y si alguien llegara
a pasar un `durationMinutes` nulo por ese camino (hoy no puede: el tipo de la
fila de sueño es `number`), antes petaba y ahora **reabriría en silencio**.

**Qué se construyó:**

- `src/validators/schemas/activity.schemas.ts` —
  `activityFollowUpEditInputSchema.durationMinutes` pasa de
  `.positive().max(1440).optional()` a `…​.nullable().optional()`. **Este era el
  bloqueo real y no estaba en el diagnóstico:** con el esquema anterior,
  `durationMinutes: null` ni siquiera llegaba al servicio; moría antes en zod
  con «Expected number, received null». El `null < 1` del servicio era la
  **segunda** puerta, la que habría mordido en cuanto se abriera la primera.
- `src/types/services/activity-follow-up.types.ts` —
  `UpdateActivityFollowUpInput.durationMinutes` pasa a `number | null` con el
  comentario de las tres formas (ausente / número / `null`).
- `src/services/activity-follow-up.service.ts`:
  - `assertNoOpenFollowUp(userId, options?)` acepta ahora `exceptFollowUpId` y
    un `message` propio, para poder preguntar «¿hay **otra** abierta?» sin que
    la sesión que se reabre se choque contra sí misma.
  - `updateFollowUp` distingue las tres formas y, en la de `null`, exige que no
    haya otra abierta **solo si la sesión estaba cerrada** (si ya estaba
    abierta, reabrir es un no-op y no se pregunta nada).
- `src/graphql/modules/activity/activity.schema.ts` — descripción en el campo
  `durationMinutes` del `input ActivityFollowUpEditInput`: omitir = no tocar,
  `null` = reabrir, número = cerrar.
- `tests/unit/services/activity-follow-up.service.test.ts` — **siete** tests
  nuevos de `updateFollowUp` (reabrir, otra abierta, idempotencia, duración no
  tocada, cero y negativo, ajeno, inexistente).
- `tests/unit/validators/activity.schemas.test.ts` — **fichero nuevo**, no
  había tests de ese validador. Cubre el salto ausente/`null`/número y que el
  `refine` de «al menos un campo» cuenta `null` como campo presente.

**Por qué así, y qué se descartó:**

1. **Cómo se dice «reabre esto».** `null` sobre el campo que ya existe, no una
   mutación nueva ni un `reopen: Boolean`. Comprobado el camino entero antes de
   decidir, que era la condición:
   - **SDL**: `durationMinutes: Int` (anulable). **No me fié de la
     especificación: lo medí** con una sonda temporal de jest que construye el
     `input` real del SDL y le pasa los dos casos por `coerceInputValue`:

     ```
     ABSENT  -> {"id":"3","notes":"x"}        | has key: false
     NULL    -> {"id":"3","durationMinutes":null} | has key: true
     ```

     Ausente **no aparece** en el objeto coercido; `null` aparece con valor
     `null`. Y ojo con la forma de mandarlo desde el cliente: con
     `$durationMinutes: Int` **omitido del mapa de variables**, el campo se
     trata como ausente; con el valor `null`, como presente-y-nulo.
   - **Resolver**: `withValidation`
     (`src/graphql/utils/validation.ts:30-57`) le pasa al resolver **la salida
     de zod**, no los args crudos (`{ ...args, input: validated }`). Eso hace
     que el validador sea el punto donde la distinción se conserva o se pierde.
   - **zod**: `.optional()` **omite la clave** cuando el campo no viene, y con
     `.nullable()` la conserva con `null` cuando viene nulo. Exactamente las
     dos formas que necesita el servicio. El `.refine()` de «al menos un campo»
     no hizo falta tocarlo: `null !== undefined`.
   - **Servicio → SQL**: se empuja `duration_minutes = $n` con el parámetro
     `null`, en vez de un `duration_minutes = NULL` literal, para no romper el
     contador `i` de marcadores y para que el camino sea el mismo que el de un
     número.

   Descartado un `activityFollowUpReopen(id: ID!)` aparte: haría el contrato más
   explícito, pero duplica propiedad, validación y el guardia de «una sola
   abierta», y deja la mutación que existe con el agujero intacto para quien
   pase `null` por su cuenta.

2. **Qué significa reabrir, más allá de la columna.** Se **mantiene** la regla
   de `startFollowUp`, pero no por simetría: por lo que pasa si no está.
   `getOpenFollowUp` (`:332`) es `ORDER BY created_at DESC LIMIT 1`, así que con
   dos abiertas la app enseña **una** y la otra queda invisible y sin forma de
   cerrarse desde la interfaz — se convierte en una fila huérfana con
   `duration_minutes NULL` que, además, `sumSpentTimeMinutes` (`:175`) ya no
   cuenta nunca. Permitirlo no es «ser más flexible», es fabricar basura que el
   usuario no puede tocar. Ahora bien, **la regla se aplica solo a la
   transición cerrada → abierta**: si la sesión ya estaba abierta, mandar `null`
   no pregunta nada y no escribe — si no, un estado ya roto (dos abiertas por
   lo que sea) haría fallar una llamada que no cambia nada.
3. **Lo que no se puede reabrir.** La propiedad ya estaba resuelta:
   `getOwnedFollowUpOrThrow` (`:143`) es lo primero que hace `updateFollowUp`,
   y lanza `NotFoundError` si no existe y `ForbiddenError` si es de otro. No se
   añadió nada ahí; se añadieron los tests que lo fijan para el camino nuevo
   (criterios 609 y 610), que es lo que faltaba.
4. **Lo que se miró y se dejó como está:** reabrir una sesión **antigua** (de
   hace tres días) queda permitido. Restringirlo por fecha sería inventar una
   regla de producto que nadie ha pedido, y el agujero no es nuevo:
   `startFollowUp` ya acepta una `date` pasada. Queda anotado, no cerrado.

**Verificación:**

*El test que falla hoy y pasa después (criterio 611).* Los tests se escribieron
**antes** del cambio y se corrieron contra el código sin tocar — no se revirtió
nada del árbol (`git stash` y `checkout --` están prohibidos, y hay otra sesión
trabajando). En HEAD **ni compilan**, que es el primer síntoma y el que dice
dónde estaba de verdad cerrada la puerta:

```
$ npx jest tests/unit/services/activity-follow-up.service.test.ts
tests/.../activity-follow-up.service.test.ts:379:9 - error TS2322:
  Type 'null' is not assignable to type 'number | undefined'.
    379         durationMinutes: null,
  src/types/services/activity-follow-up.types.ts:65:3
    65   durationMinutes?: number;
    The expected type comes from property 'durationMinutes' …
Test Suites: 1 failed, 1 total
Tests:       0 total
```

Y el `null < 1` en carne y hueso, con una **sonda temporal** que fuerza el tipo
(`as never`) para llegar al runtime. La sonda se corrió y **se borró en la misma
orden**; no queda en el árbol:

```
$ npx jest tests/unit/services/tmp-null-lt-1-probe.test.ts
  ✕ probe: null reaches the < 1 guard at runtime (3 ms)
    BadRequestError: Duration must be at least 1 minute
      367 |   if (input.durationMinutes !== undefined) {
      368 |     if (input.durationMinutes < 1) {
    > 369 |       throw new BadRequestError('Duration must be at least 1 minute');
      at Object.updateFollowUp (src/services/activity-follow-up.service.ts:369:13)
```

Con el cambio puesto:

```
$ npx jest tests/unit/services/activity-follow-up.service.test.ts
    ✓ updateFollowUp reopens a closed follow-up when durationMinutes is null (2 ms)
    ✓ updateFollowUp rejects reopening when another follow-up is already open
    ✓ updateFollowUp reopening an already open follow-up is a no-op that writes once (1 ms)
    ✓ updateFollowUp leaves duration untouched when durationMinutes is omitted
    ✓ updateFollowUp still rejects zero and negative durations (1 ms)
    ✓ updateFollowUp refuses to reopen a follow-up owned by someone else
    ✓ updateFollowUp throws NotFoundError when the follow-up does not exist (1 ms)
Tests:       20 passed, 20 total

$ npx jest tests/unit/validators/activity.schemas.test.ts
Tests:       5 passed, 5 total
```

*Tipos y suite completa (criterio 612).*

```
$ npx tsc --noEmit ; echo $?
0

$ npm test
Test Suites: 6 failed, 47 passed, 53 total
Tests:       3 failed, 593 passed, 596 total
```

Los tres fallos son **los mismos de la línea base**, comprobados por su nombre:
`walletExpenseUpdate > should update an expense`, `syncHabitStreakFromLogs >
updates streak, max_streak and days…` y `HabitService > addHabitLog > creates
log when date is available`; y las 6 suites en rojo son las 6 de siempre. El
total sube de 584 a 596 (+12: 7 tests de servicio y 5 de validador) y las suites
de 52 a 53 (el fichero nuevo del validador).

*Linter (criterio 612).* Recuento por fichero, **antes y después**, solo en los
ficheros tocados:

| Fichero | Antes | Después |
|---|---|---|
| `src/services/activity-follow-up.service.ts` | 5 | 5 |
| `src/graphql/modules/activity/activity.schema.ts` | 7 | 7 |
| `src/types/services/activity-follow-up.types.ts` | 0 | 0 |
| `src/validators/schemas/activity.schemas.ts` | 0 | 0 |
| `tests/unit/services/activity-follow-up.service.test.ts` | 1 | 1 |
| `tests/unit/validators/activity.schemas.test.ts` | — | 1 |

El «1» de los tests **no es un error de estilo**: es el `Parsing error: ESLint
was configured to run … however that tsconfig does not include this file`, que
sale igual en todos los ficheros de `tests/` de ese repositorio. El fichero
nuevo hereda exactamente el mismo que sus vecinos. No se corrió `--fix` en
ningún sitio.

*XP de entrenamiento (criterio 615).* Leído, no supuesto:
`workout.service.ts:888-895`, dentro de `tryAwardXpForClosedFollowUp`, consulta
`workout_session_xp_awards` por `session_id` y **si ya hay premio lo devuelve
sin volver a conceder**. Reabrir y cerrar otra vez pasa por ahí (el resolver
solo lo llama en la transición abierta → cerrada) y no suma dos veces.

**Criterios que cierra:** 603–615. El detalle, uno a uno, en el reporte de la
sesión. **Ninguno queda pendiente de prueba manual**: esta tajada no toca
pantalla — lo que sí queda sin probar **contra el servidor vivo** es la llamada
GraphQL de punta a punta, porque desde aquí no se entra con credenciales.

**Riesgos:**

- La consulta extra al reabrir cambia el conteo de `mockDbPool.query` de
  cualquier test futuro que pase por ahí.
- `sleep-follow-up-sync.service.ts:136` entra por `updateFollowUp` con un
  `durationMinutes` que hoy es `number` no anulable (`SleepLogSyncRow`,
  `:9-17`). Si alguien lo vuelve anulable, ese camino **reabriría** en vez de
  fallar. Queda dicho aquí porque no se ve desde allí.
- **Trampa que me comí y que no está en ningún mapa:** el SDL de ese
  repositorio vive dentro de una **plantilla de JavaScript** (`gql\`…\``), así
  que una **tilde invertida** dentro de una descripción de GraphQL **cierra la
  cadena** y rompe la compilación (`TS1005: ',' expected`). Escribir
  «`` `null` »` en una descripción tumba el build del API. Por eso la
  descripción nueva dice `null` sin comillas. `npx tsc --noEmit` lo caza, pero
  solo si se corre: el linter no, y el test que importa ese módulo tampoco lo
  diría con claridad.
- El front no cambia nada en esta tajada, pero su SDL vendorizado
  (`graphql/schema/*.schema.graphql`) queda **un comentario por detrás** del
  API. No rompe `contracts.test.ts` —una descripción no cambia la forma— pero
  es la deuda conocida de ese mecanismo.

**Lo que descubrí y no estaba en el encargo:**

1. **El validador zod era la puerta que de verdad estaba cerrada.** El
   diagnóstico apuntaba al `null < 1` del servicio, y es real; pero
   `durationMinutes` no era `.nullable()`, así que un `null` moría en zod antes
   de llegar. Arreglar solo el servicio **no habría reabierto nada** y el fallo
   habría parecido «el API no acepta null» en vez de «falta un `.nullable()`».
2. **Las descripciones del SDL no admiten tildes invertidas** (ver Riesgos).
3. **`updateFollowUp` no toca `updated_at`.** Ni antes ni ahora: el `UPDATE` no
   lo pone y no encontré disparador en la tabla. Una sesión reabierta conserva
   su `updated_at` viejo. No lo he cambiado —sería arreglar algo que no es de
   esta tajada— pero si el front llega a ordenar por ese campo, ahí está.
4. **`ts-node` no arranca en ese repositorio** (`TypeError: Cannot read
   properties of undefined (reading 'fileExists')`). Para ejecutar un TypeScript
   suelto, la vía que funciona es un test de jest temporal bajo `tests/`. Lo
   usé dos veces y borré las dos sondas.

**Datos de prueba sembrados:** ninguno contra la base. Las tres sondas
temporales (`tests/unit/services/tmp-null-lt-1-probe.test.ts`,
`tests/unit/tmp-sdl-parse.test.ts`, `tests/unit/tmp-coerce-probe.test.ts`) se
borraron en la misma orden en que se corrieron; `ls tests/unit | grep tmp` sale
vacío.

**Estado del árbol:** sin commitear, en `~/Developer/xavi-platform-node`. En
`xavi-habits-webapp` solo estos dos ficheros de documentación.

## 4. Revisión — feature-reviewer

### Tajada 1 — **aceptada**

**Veredicto: aceptada.** Los trece criterios (603–615) se cumplen y no encontré
ninguna regresión. Lo comprobé sobre el código y con dos sondas temporales
propias, no sobre el resumen del constructor. Queda sin probar, y se dice
entero abajo, **la llamada real contra el servidor vivo**: está tras el login y
desde aquí no se entra con credenciales.

**Dónde miré (repo del API, `~/Developer/xavi-platform-node`, árbol sin
commitear).** `graphify explain "updateFollowUp"` y `graphify query "who calls
activityFollowUpService.updateFollowUp and assertNoOpenFollowUp"` para el mapa
—el grafo de ese repo está reconstruido por el constructor, así que ya ve el
cambio: sirve para «quién llama», no para «esto ya existía»—, y desde ahí, los
ficheros abiertos uno a uno: servicio, resolver, `withValidation`, validador,
tipos, SDL, `sleep-follow-up-sync.service.ts`, `workout.service.ts` y las
migraciones 010, 025, 031 y 056. Sólo se tocan seis ficheros del API (más
`graphify-out/`); **en el front no hay nada de esta tajada**: los cambios sin
commitear de `src/app/providers/`, `vite.config.ts`, `vite/` y
`query-persist.hydration.test.tsx` son de FEAT-021, de la otra sesión, y no los
toqué.

**Criterios, uno a uno:**

- **603 ✔** `mapFollowUp` (`:58-79`) devuelve `isOpen: true`, `durationMinutes:
  null` y `endTime`/`endDate`/`endDateTime` a `null` en cuanto
  `row.duration_minutes === null`; el `UPDATE` empuja `duration_minutes = $1`
  con el parámetro `null`. Test verde y asertando las cuatro cosas.
- **604 ✔** el `SET` sólo incluye `duration_minutes` si el campo llegó; el test
  comprueba el SQL (`expect(sql).not.toContain('duration_minutes')`).
- **605 ✔ y verificado por mi cuenta en los cuatro saltos.** El del SDL, que
  era el que más pesaba, lo medí con una sonda temporal propia sobre
  `activityTypeDefs` **real** (extrayendo `input ActivityFollowUpEditInput` y
  pasándolo por `buildSchema` + `coerceInputValue`): ausente → la clave **no
  está** en el objeto coercido; `null` → la clave está con valor `null`. De
  paso, que `buildSchema` acepte ese fragmento prueba que la descripción nueva
  no rompe el SDL. En zod lo comprobé **contra la versión de HEAD**: `z.number()
  …​.optional().safeParse(null)` falla. El resolver recibe la salida de zod
  (`graphql/utils/validation.ts:48-53`), y el servicio distingue `undefined` /
  `null` / número antes de comparar.
- **606 ✔** doble puerta: zod (`.positive()`, `.int()`, `.max(1440)`) y el
  `else if (input.durationMinutes < 1)` del servicio. Probado en los dos sitios.
- **607 ✔** `assertNoOpenFollowUp` se ejecuta **antes** del único `db.query` de
  escritura; el test fija que sólo hubo dos consultas (lectura + guardia) al
  fallar. Nada escrito.
- **608 ✔** si `existing.duration_minutes` ya es `null` no se pregunta nada: ni
  choca contra sí misma ni depende de un estado ya roto. Reabrir dos veces la
  misma sesión: la segunda cae por ahí.
- **609 ✔ / 610 ✔** `getOwnedFollowUpOrThrow` (`:143`) es lo primero que hace
  `updateFollowUp`: `NotFoundError` si no hay fila, `ForbiddenError` si el
  `user_id` no es el del contexto. Leído en el código, no en los tests; y el
  test del ajeno fija que sólo hubo **una** consulta.
- **611 ✔ y lo comprobé de verdad, no de memoria.** Sin revertir el árbol:
  copié las versiones de HEAD del servicio y del validador
  (`git show HEAD:…`) a dos ficheros temporales dentro del repo del API, escribí
  un test temporal que las importa y lo corrí. Resultado: **HEAD zod rechaza
  `durationMinutes: null`** y **HEAD servicio lanza `BadRequestError: Duration
  must be at least 1 minute`** con el `null` forzado. Las tres copias temporales
  se borraron en la misma orden; `git status` del API vuelve a mostrar
  exactamente los seis ficheros de la tajada. Hallazgo de propina de esa
  prueba: al compilar la copia de HEAD **contra el tipo nuevo** (`number |
  null`), `tsc` canta `TS18047: 'input.durationMinutes' is possibly 'null'`
  justo en la línea 368 — es decir, **el agujero original era detectable por el
  compilador en cuanto el tipo dijera la verdad**. Eso vale más que el propio
  arreglo: la lección es que el tipo mentía.
- **612 ✔** medido por mí: `npx tsc --noEmit` → exit 0. `npm test` → **3 fallos
  de 596, 6 suites de 53 en rojo**, y los tres fallos son los de la línea base
  por su nombre (`walletExpenseUpdate`, `syncHabitStreakFromLogs`, `HabitService
  > addHabitLog`). Lint por fichero tocado: 5 / 7 / 0 / 0 / 1 / 1, igual que lo
  reportado; el «1» de los tests es el `Parsing error` de `tsconfig` que sale en
  todos los ficheros de `tests/`. No corrí `--fix` en ningún sitio.
- **613 ✔** la descripción vive en el campo del `input`, y está en castellano
  como el resto de descripciones de ese esquema (`"""Subtareas seleccionadas…`,
  `"""UUID v7 del cliente…`): no desentona.
- **614 ✔** el `null < 1` está escrito arriba con fichero y línea.
- **615 ✔ leído en el código.** El resolver sólo llama a
  `tryAwardXpForClosedFollowUp` en la transición `before.isOpen && !updated.isOpen`
  (`activity.resolvers.ts:366-369`), así que **reabrir no premia**; y al volver a
  cerrar, `workout.service.ts:889-895` consulta `workout_session_xp_awards` por
  `session_id` y devuelve el premio existente sin conceder otro. No suma dos
  veces.

**Regresiones: busqué en cuatro sitios y no encontré ninguna.**

1. *El conteo de `mockDbPool.query`* (lo que él marcó como lo más probable).
   Recorrí `tests/unit/services/activity-follow-up.service.test.ts` entero: los
   `toHaveBeenCalledTimes` que existen están en tests **nuevos**, y la consulta
   extra sólo aparece en la transición cerrada → abierta, un camino que antes no
   existía. Ningún test viejo pasa por ahí. Confirmado corriendo la suite: 20/20.
2. *`assertNoOpenFollowUp` con su firma nueva.* El segundo parámetro es
   opcional y con `{}` por defecto: la llamada de `startFollowUp` (`:306`)
   genera **el mismo SQL y los mismos parámetros** que antes (`exceptClause`
   vacío). El test `startFollowUp rejects when open session exists` sigue verde.
3. *El camino del sueño* (`sleep-follow-up-sync.service.ts:136`). Hoy **no**
   puede colarse un `null`: `SleepLogSyncRow.duration_minutes` es `number` y la
   columna es `duration_minutes INTEGER NOT NULL` desde `migrations/010`, sin
   ningún `ALTER` posterior que la haga anulable (busqué `duration_minutes` en
   todas las migraciones). `buildFollowUpInput` la copia tal cual. Lo que sí es
   cierto es el riesgo que él anota, y lo agravo con un dato: **la suite de ese
   servicio es una de las 6 que ni compilan** (`isWorkout` falta en un mock), así
   que si mañana alguien hace anulable ese campo, **no hay test que lo cace**.
   Va como hallazgo, no como devolución.
4. *Quién más pasa por aquí.* Los únicos que llaman a `updateFollowUp` son el
   resolver de `activityFollowUpEdit` y el sync de sueño; nadie más importa el
   tipo `UpdateActivityFollowUpInput`. El front no se tocó.

**La decisión sobre «una sola abierta»: bien puesta, y hay una red debajo que
él no menciona.** `migrations/031_activity_follow_up_open.sql:19-21` crea
`CREATE UNIQUE INDEX idx_activity_follow_ups_one_open_per_user ON
activity_follow_ups (user_id) WHERE duration_minutes IS NULL`. Es decir, la
regla que el guardia expresa **ya la impone la base de datos**, lo que cierra la
pregunta de la carrera: entre el `SELECT` del guardia y el `UPDATE` no hay
transacción —igual que en `startFollowUp`, no es deuda nueva—, pero una
reapertura simultánea con un arranque **no puede** dejar dos abiertas: la
segunda escritura rebota con un `23505`. La pega, y es el hallazgo, es que
`activity-follow-up.service.ts` **no traduce el `23505`** (otros servicios sí lo
hacen: `workout.service.ts:167`), así que esa carrera se vería como un error
interno en vez de como el `BadRequestError` con su mensaje. Es raro y no pierde
datos.

**Hallazgos (no bloquean, se escriben):**

1. **El mensaje del guardia está mal orientado.** Dice «You already have an
   activity in progress. Finish or cancel it before **reopening another**», pero
   quien llama está reabriendo **esta**, y lo que estorba es **la otra**.
   «…before reopening this one.» dice lo que pasa. Es una cadena que acabará
   viendo el usuario a través del front.
2. **La carrera se ve como error interno**, no como `BadRequestError`: falta el
   mapeo de `23505` en este servicio (ver arriba).
3. **`updated_at` sin tocar: aquí no importa, y lo comprobé.** Ninguna consulta
   de follow-ups ordena por `updated_at` (`ORDER BY` de este servicio: por
   `order_index`, `created_at` y `date/start_time`), y el front sólo lo arrastra
   como campo del tipo. Ojo con lo que sí importa y sale bien: `getOpenFollowUp`
   ordena por `created_at DESC`, que **no** cambia al reabrir — la sesión
   reabierta no se «adelanta» a nadie, y con el guardia puesto sólo hay una.
4. **Reabrir algo ya abierto igualmente ejecuta el `UPDATE`** (escribe `null`
   sobre `null`). Inocuo, y el test lo deja dicho; anotado por si alguien cuenta
   escrituras.
5. **Sugerencia para el camino del sueño**, por si el tipo cambia: pasar
   `durationMinutes: input.durationMinutes ?? undefined` desde el sync
   convertiría un futuro `null` en «no la toques» en vez de en «reabre».
6. Sigue en pie lo que él ya anotó: la copia vendorizada del SDL en el front
   queda un comentario por detrás (no rompe `contracts.test.ts`), y reabrir una
   sesión antigua sigue permitido a propósito.

**Estados:** esta tajada **no toca pantalla**, así que vacío, cargando, texto
largo y móvil **no aplican**. Los dos que sí aplican están cubiertos: *sin
permisos* → `ForbiddenError` para la sesión ajena y `NotFoundError` para la
inexistente (criterios 609/610, leídos en el servicio); *error* → las dos
negativas viajan como errores GraphQL por `withValidation` / el manejador del
repo.

**Lo que queda sin probar, dicho entero:** la llamada `activityFollowUpEdit` de
punta a punta **contra el servidor vivo** (Render/Cloud Run) con una sesión de
verdad — está tras el login y los agentes no entran con credenciales; y con ella,
el comportamiento real del índice único de la 031 y el de la base con un `UPDATE
… SET duration_minutes = NULL`. Todo lo verificado aquí es con el pool mockeado.
El push, como siempre en ese repositorio, es del usuario: despliega y migra.
