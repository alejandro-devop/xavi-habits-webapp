---
id: FEAT-023
title: Empezar algo — que abrir la hoja no sea remar contra una pared de fichas duplicadas
status: planned
architect: yes    # toca VidaActivityPicker y el modo `start` de VidaLogSessionSheet, compartidos por FEAT-003, FEAT-004, FEAT-011 y FEAT-018 (ya entregadas) y por el modo `edit` de FEAT-013; el propio encargo pide que alguien con Bash mire el terreno antes de construir
area: features/vida
requested: 2026-09-23
updated: 2026-09-23
---

# FEAT-023 — Empezar algo, sin la pared de fichas

## 1. The request — feature-analyst

**Limitación declarada, por instrucción del propio encargo:** este análisis se
hizo **sin `Bash`**, así que no pude correr `graphify query`/`explain`/`path`
como exige `CLAUDE.md` de este repositorio. Todo lo de abajo sale de `Grep` y
`Glob` sobre el código fuente y los dossiers, leído entero, no de la búsqueda
grafo. Lo marco explícitamente en vez de fingir que lo comprobé con la
herramienta que falta — la misma lección que dejó FEAT-019 sobre concluir
«no hay precedentes» sin el grafo.

**Summary for whoever's next:** al abrir «Empezar algo» **sin** una actividad
ya elegida (desde el botón genérico, no desde el «▶ Empezar» de un toque de la
agenda), la sección «Qué» pinta **una ficha por ítem de la plantilla del día**,
no una por actividad — así que una actividad con varios bloques en el día
aparece repetida, a veces de forma indistinguible, y esa pared de fichas
empuja el buscador y el campo de hora fuera de la pantalla visible. La
**tajada 1 ya es útil por sí sola**: que la lista quepa y deje ver el buscador
y la hora sin pared de duplicados. Las tajadas 2 y 3 son más chicas: que la
duración de la ficha no prometa algo que no se va a usar, y que el campo de
hora se lea siempre en 24 horas.

**What problem it solves:** abrir «Empezar algo» para decir qué se va a hacer
debería costar mirar y tocar una vez. Hoy, cuando la plantilla del día tiene
varios ratos (aunque sean de pocas actividades distintas), la lista de
opciones se llena de fichas repetidas y casi idénticas, y las dos cosas que sí
hacen falta para completar la acción —buscar algo que no está en la plantilla,
y decir desde qué hora— quedan fuera de la vista sin hacer scroll. Es
exactamente el tipo de fricción que el módulo existe para evitar: cada
decisión de más (¿cuál de las tres fichas de "Working at lululemon" toco?) es
una razón para posponer registrar.

**Who it's for:** quien abre Hoy y usa la entrada genérica de «Empezar algo»
—el botón de «Lo que viene» cuando lo que toca no es lo que va a hacer, «Ver
otras» o el menú de acciones del día— es decir, cuando **no** sabe de antemano
qué botón de un toque tocar. No es para quien usa «▶ Empezar» directo sobre un
bloque ya identificado de la agenda: ese camino ni siquiera abre esta hoja
(ver "Out of scope").

**User's words:** no me llegó una frase textual del usuario — lo que tengo es
la lectura de una captura de pantalla hecha por quien me encargó esto («lo que
se ve en la captura, contado por mí»). La pego tal cual llegó, sin
reinterpretarla, para que quien construya no dependa de mi resumen:

> 22 fichas para unas 16 actividades distintas. «Working at lululemon»
> aparece tres veces (1h, 4h, 2h). «Salir con sheyko y Layla» tres veces (30m,
> 15m, 30m) — y dos son idénticas: mismo nombre y misma duración,
> indistinguibles. «Desayunar» dos veces (30m, 15m). «Organizar la casa» dos
> veces (15m, 1h). La lista no son sus actividades: son los ratos de su
> plantilla del día, uno por hueco. Cada ficha lleva una duración pegada,
> pero la hoja promete que la duración se dice al terminar. Ese número es lo
> planeado, no lo que se va a registrar. Las 22 fichas empujan el buscador y
> el campo de la hora fuera de la pantalla visible. El campo de hora muestra
> «03:54 PM», formato de 12 horas, cuando el módulo escribe 24 («22:00»,
> «8h 30»).

Y, sobre por qué importa, la razón que se me dio con el encargo (**no
verificada como cita literal**: busqué la frase con «stopper» en
`docs/vida/PLAN.md` con `Grep` y no aparece así — sí hay una idea muy cercana
en la memoria de sesión del usuario, «cada clic de más es una razón para no
registrar»): «entre más clics, entre más acciones tenga que hacer un usuario
normal, más va a posponer… la app debe ser una ayuda, no un stopper». La cito
porque orienta la prioridad, con la salvedad de que no la vi escrita palabra
por palabra en el sitio que se me dijo.

**Verificado en código, no dado por bueno (lo que se me pidió comprobar antes
de escribir criterios):**

- **La lista es una ficha por ítem de plantilla, no por actividad.**
  `VidaActivityPicker` (`src/features/vida/components/VidaActivityPicker/VidaActivityPicker.tsx:96-102`)
  construye `templateOptions` mapeando **cada `VidaSuggestion`** de
  `suggestions` — y `VidaSuggestion` (`src/features/vida/types/vida-item.types.ts:52-55`)
  envuelve **un `VidaItem`**, es decir, un ítem de la plantilla (un hueco con
  su hora y su duración), no una actividad deduplicada. `suggestions` llega de
  `useVidaSuggestionsForDateQuery` (`src/features/vida/hooks/useVidaItems.ts:51-60`),
  que pide `vidaSuggestionsForDate` al API sin deduplicar por actividad. Con
  varios ítems de plantilla sobre la misma actividad, salen varias fichas.
- **La duración de la ficha no se usa al arrancar.** `VidaActivityPicker`
  pasa `templateMinutes` en `onChange(activity, templateMinutes)`
  (línea 128), pero `VidaLogSessionSheet.chooseActivity`
  (`src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx:200-227`)
  la ignora en modo `start`: `if (mode !== 'log' || durationMinutes !== null) return`
  corta antes de tocarla — el modo `start` nunca pide duración (no hay campo
  de duración en su bloque, líneas 403-434). El número que se ve en la ficha
  es **puramente informativo y no viaja a ningún sitio**.
- **Dos fichas idénticas producen el mismo resultado, no dos distintos.**
  `chooseActivity` guarda `activity` (con `id = suggestion.item.activityId`,
  `VidaActivityPicker.tsx:204`) y `handleStart` solo manda
  `onStart(chosen.id, …)` — el `id` de la actividad, no del ítem de plantilla.
  Tocar cualquiera de dos fichas duplicadas de la misma actividad arranca
  exactamente la misma sesión. La duplicación no cambia el dato guardado:
  **solo estorba para elegir**.
- **Hallazgo técnico, marcado como hipótesis para quien construya (no lo
  ejecuté, no tengo navegador para este análisis):** `templateOptions.map`
  usa `key={activity.id}` (`VidaActivityPicker.tsx:120`). Con dos ítems de
  plantilla sobre la misma actividad, dos `<li>` comparten la misma `key` de
  React — no comprobé en ejecución si eso produce un aviso o una
  reconciliación incorrecta; queda para quien mida con el navegador.
- **El campo de hora es un `<input type="time">` nativo, sin envoltorio que
  fuerce 24 horas.** Ni `VidaLogSessionSheet.tsx` (líneas 411-425) ni
  `src/shared/ui/Input` fijan `locale` ni ningún formato: el navegador pinta
  la hora con el formato del sistema operativo, que en el caso reportado es
  de 12 horas. El **mismo patrón** —`<Input type="time">` sin envoltorio— lo
  usa también `VidaStartTimeSheet.tsx:144-158` (corregir el inicio de una
  sesión en marcha, FEAT-013 tajada 2) y los modos `log`/`edit` de esta misma
  hoja: **no es exclusivo de «Empezar algo»**, es un patrón repetido del
  módulo (ver "Out of scope").
- **El «▶ Empezar» de un toque (agenda y «Lo que viene») no abre esta hoja.**
  `VidaUpNextCard` y los botones directos de la agenda llaman a
  `sessionActions.start(activityId)` sin pasar por `VidaLogSessionSheet`
  (documentado y protegido en `docs/features/FEAT-018-vida-que-hice.md`,
  sección "La garantía del «▶ Empezar», y cómo se fija", con un test que
  compara el array completo del mock en `VidaHoyPage.test.tsx`). Lo que se
  abre con «Empezar algo» genérico —`VidaHoyPage.tsx:1209,1232,1233,1442`,
  todas con `mode: 'start'`— es un camino **distinto**: el de esta feature.
  Nada de lo que se pida aquí toca ese botón de un toque.

**Out of scope:**

- El botón «▶ Empezar» de un toque de la agenda y de «Lo que viene» — no abre
  esta hoja y no se toca (criterio 628 lo protege).
- Los modos `log` («Registrar tiempo pasado») y `edit` («Corregir») de la
  misma `VidaLogSessionSheet`, aunque comparten `VidaActivityPicker` con el
  modo `start`. Si la solución que se elija para «Qué» también mejora esos
  dos modos, es una decisión de quien construya, no una obligación de esta
  feature — no hay criterio que lo exija.
- Corregir el formato 12/24 horas en los **demás** campos de hora del módulo
  (`VidaStartTimeSheet`, y los modos `log`/`edit` de esta misma hoja): es el
  mismo patrón repetido en otros sitios y queda anotado como hallazgo para
  decidir aparte — arreglarlo solo aquí sería dejar el resto del módulo
  inconsistente, y arreglarlo en todos a la vez es más feature de la que se
  pidió.
- El buscador en sí (`filterActivitiesBySearch`, el límite de
  `MAX_SEARCH_RESULTS`, la normalización de acentos): no se toca.
- Crear una actividad desde esta hoja: sigue sin poder (criterio 34 de
  FEAT-004, ya cumplido, no se reabre).
- Qué cuenta como "plantilla activa de ese día" (`isActive`,
  `excludeActivityIds`) y de dónde sale `suggestions`: no se cambia la
  consulta ni el contrato con el API.
- La mutación `activityFollowUpStart` ni ningún cambio de API: todo lo
  reportado es de presentación en el cliente.

**Acceptance criteria:** (siguientes libres tras FEAT-022, que llega hasta
615; FEAT-021 usa 596–602 y 616–621 — el máximo usado hoy es 621, así que
empiezo en 622)

- [ ] 622. Al abrir «Empezar algo» sin actividad preseleccionada, en una
      pantalla de 375×667 px (el tamaño mínimo que ya mide el módulo, criterio
      583 de FEAT-019), el campo «Busca otra cosa…» es visible sin hacer
      scroll.
- [ ] 623. Bajo la misma condición, el campo «¿A qué hora empezaste?» es
      visible sin hacer scroll.
- [ ] 624. Ninguna ficha de «Qué» es indistinguible de otra: no puede haber
      dos fichas con el mismo nombre visible y sin ningún otro dato visible
      que las diferencie.
- [ ] 625. Si una ficha muestra una duración, el texto de la ficha o de la
      hoja deja claro que es la duración **planeada** y no la que se va a
      **registrar** (que se sigue preguntando al terminar, como ya dice la
      cabecera de la hoja). Si la decisión tomada es no mostrar duración en
      esta hoja, ninguna ficha la lleva.
- [ ] 626. El buscador «Busca otra cosa…» sigue encontrando y permitiendo
      elegir cualquier actividad no archivada del catálogo, esté o no en la
      plantilla del día — no se pierde alcance respecto de hoy.
- [ ] 627. Elegir cualquier opción —salga de la plantilla o del buscador—
      sigue arrancando la sesión con una sola acción: se pregunta «qué» y, si
      se tocó, «desde qué hora»; nada más.
- [ ] 628. El «▶ Empezar» de un toque de la agenda y de «Lo que viene» no
      cambia de comportamiento: sigue llamando `start(activityId)` sin abrir
      «Empezar algo», y el test que lo fija en `VidaHoyPage.test.tsx`
      (comparación del array completo del mock) sigue en verde sin editarlo.
- [ ] 629. Con la plantilla del día sin ítems activos, la hoja no se rompe:
      se sigue viendo el aviso de que la plantilla no tiene nada más que
      ofrecer, sin fichas, con el buscador disponible.
- [ ] 630. Con el nombre de actividad más largo de los datos de prueba (o uno
      sintético de 60 caracteres si no hay ninguno tan largo), la ficha no
      desborda la grilla ni tapa el contenido de la ficha vecina.
- [ ] 631. El campo de hora de esta hoja («¿A qué hora empezaste?») se lee
      siempre en formato 24 horas (p. ej. «22:00»), sin depender del formato
      del sistema operativo del dispositivo.

**Slices:** (vertical, cada una usable por sí sola)

| # | What it does | State |
|---|---|---|
| 1 | La lista de «Qué» deja de ser una pared de fichas casi iguales y deja ver el buscador y la hora sin scroll (según la Decisión A que tome el usuario) | pending |
| 2 | La ficha deja de prometer una duración que no se va a usar: la aclara o la quita (según la Decisión B) | pending |
| 3 | El campo de hora de esta hoja se lee siempre en 24 horas | pending |

**Architect? yes** porque toca `VidaActivityPicker`
(`src/features/vida/components/VidaActivityPicker/VidaActivityPicker.tsx`) y
el modo `start` de `VidaLogSessionSheet`
(`src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx`),
los dos compartidos por FEAT-003, FEAT-004, FEAT-011 y FEAT-018 (entregadas) y
por el modo `edit` que usa FEAT-013 (entregada) — cualquier cambio a la lista
o a la ficha puede rozar esos flujos, y sin `Bash` no pude comprobar el
alcance real ni correr `graphify`. Además, quien encargó esto lo pidió
explícitamente: que alguien con `Bash` mire el terreno antes de construir.

**Decisions that aren't mine:**

- **Decisión A — qué lista la sección «Qué».**
  1. Una ficha por **actividad** distinta de la plantilla de hoy, sin
     repetir. La más barata: ya no puede haber duplicados exactos, y está
     verificado en código que dos fichas duplicadas de hoy siempre arrancan
     lo mismo (mismo `activityId`), así que deduplicar no pierde información
     que se esté usando. Se pierde la noción de "a qué hora tocaba" cada
     bloque si hay varios en el día.
  2. **Lo que toca ahora** (o está por tocar pronto) destacado arriba, y el
     resto de la plantilla del día debajo — colapsado o en una lista
     secundaria. Exige decidir qué es "ahora" (¿el mismo cálculo que
     `VidaUpNextCard`/`vida-up-next.utils.ts`?) y una segunda jerarquía
     visual; es la opción con más superficie nueva.
  3. Una fuente distinta a la plantilla del día — por ejemplo, actividades
     más usadas o más recientes, sin importar si están en la plantilla de
     hoy. Cambia de dónde sale la lista (hoy es `suggestions`, la plantilla);
     puede sorprender a quien esperaba ver su plantilla.

  Mi recomendación, no vinculante: la opción 1, porque resuelve la pared
  reportada sin inventar un concepto de "ahora" nuevo ni cambiar la fuente de
  datos — pero es justo el tipo de preferencia que no me toca imponer.

- **Decisión B — ¿se ve la duración en la ficha?**
  1. Se muestra, con una aclaración de que es lo **planeado** (p. ej. «45m
     plan.» en vez de «45m» a secas).
  2. Se quita de esta hoja: ya está verificado en código que hoy no se usa
     para nada al arrancar (`chooseActivity` la descarta en modo `start`), y
     mostrar un número que nunca se guarda contradice la frase de la propia
     hoja («cuando termines nos dices cuánto duró»).

  Mi recomendación: la opción 2, por la misma razón que la anterior — sin
  vincular.

- **Decisión C — orden de la lista**, condicionada a la Decisión A: si se
  elige la opción 2 de A, el orden ya queda resuelto (ahora arriba, resto
  debajo). Si se elige 1 o 3, falta decidir entre orden cronológico del día
  (como hoy, por hora de plantilla), alfabético por actividad, o "lo más
  próximo a ahora" primero sin llegar a ser una sección aparte.

## 2. The plan — feature-architect

**Las decisiones del usuario, ya tomadas** (se escriben aquí porque llegaron
después de la sección 1 y mandan sobre las recomendaciones que allí se
dejaron abiertas):

- **Decisión B — cerrada: se quita la duración de la ficha.** Razón del
  usuario y de quien encargó: *hoy es lo planeado, no lo que se registra, y al
  pulsar se ignora — un número que promete algo que no pasa.* Queda verificado
  otra vez con `Bash` (abajo): `chooseActivity` corta antes de mirarla en modo
  `start`. La opción 1 de la Decisión B («45m plan.») queda descartada.
- **Decisión A — respuesta literal del usuario:** «Esa serie de sugerencias no
  es tan útil al ser tan larga... quizá el top 5». **No es la opción 1 de la
  sección 1** (deduplicar las 16 y enseñarlas todas): es **una lista corta, del
  orden de cinco**, y el resto por el buscador, que ya existe en la hoja. El
  problema cambia de «quitar duplicados» a **«elegir cinco»**; deduplicar pasa
  a ser el primer paso de esa elección, no el final.
- **Decisión C — resuelta por la regla de abajo**: el orden es la propia regla
  con la que se eligen los cinco. No queda nada que decidir aparte.

**Summary for the builder:** la implementación de referencia es
`suggestionsForGap` (`src/features/vida/utils/vida-agenda.utils.ts:504`) con su
test (`vida-agenda.utils.test.ts:442`): **una función pura que filtra, ordena y
recorta `VidaSuggestion[]`, y que la página aplica antes de dárselo al
picker** — el picker no aprende ninguna regla nueva. El código nuevo es **un
fichero de utilidades + su test**, un `useMemo` en `VidaHoyPage` y **una prop
opcional** en `VidaActivityPicker`. **No crees**: otro buscador, otro
normalizador de texto, otra consulta al API, ni un concepto de «ahora» nuevo
—`nowMinutes` ya está en la página.

### What already exists

Todo lo de abajo está leído en el árbol de trabajo, no solo consultado al
grafo. **Confirmo con `Bash` lo que la sección 1 dejó marcado como pendiente**
(el analista no tenía la herramienta):

- **La lista es una ficha por ítem de plantilla.** `VidaActivityPicker.tsx:96-102`
  mapea cada `VidaSuggestion`; `:120` usa `key={activity.id}`, así que con dos
  ítems de la misma actividad **hay dos `<li>` con la misma `key`** (la
  hipótesis del analista es cierta por lectura; deduplicar la borra por
  construcción, no hace falta medirla).
- **`templateMinutes` se ignora en `start`.** `VidaLogSessionSheet.tsx:200-205`:
  `if (mode !== 'log' || durationMinutes !== null) return`. Confirmado.
- **El «▶ Empezar» de un toque no pasa por esta hoja.** Confirmado en
  `VidaHoyPage.tsx:1216` — `onStart={() => startWithNote(upNext.blockId,
  upNext.activityId)}`, sin hoja. Lo que sí abre la hoja son la variante
  **vacía** de esa misma tarjeta (`:1209`), «Empezar algo de otra cosa» y «Ver
  las otras N» (`:1232-1233`) y el botón de la cabecera (`:1442`), **todos con
  `mode: 'start'`**. El test intocable de `VidaHoyPage.test.tsx` no está en
  juego.
- **El precedente exacto de «la página filtra, el picker pinta»:**
  `suggestionsForGap` (`vida-agenda.utils.ts:504`), aplicado en
  `VidaHoyPage.tsx:1163-1167` antes de pasárselo a `VidaPlaceInGapSheet`. **El
  picker ya recibe hoy listas recortadas por quien lo monta**: no es un cambio
  de contrato, es usar el que ya hay.
- **El precedente de deduplicar + tope en una función pura:**
  `recentNoteSuggestions` (`vida-notes.utils.ts:69-92`), con su constante
  `VIDA_NOTE_SUGGESTIONS_MAX = 3` (`:39`) y un `options.max` para los tests.
- **El precedente de una regla de orden con su desempate escrito:**
  `pickBlockHints` (`vida-patterns.utils.ts:1098`), `limit = 2` y «empate
  resuelto por el id: dos ejecuciones dan la misma lista».
- **«Sin hora va después» ya está escrito:** `isEarlierStartTime`
  (`vida-notes.utils.ts:111-115`) — **privado del módulo, no exportado**. La
  regla se repite en la función nueva (tres líneas) o se exporta esa; no se
  inventa una tercera lectura de qué pasa con un ítem sin hora.
- **«Lo que más haces» ya existe, y no sirve para esto:**
  `buildActivityPatterns` (`vida-patterns.utils.ts:427`). Su `occurrences` es
  «veces que estuvo **en el plan** de un día cerrado de la ventana»
  (`:280-281`), **por ítem de plantilla**, no «veces que lo hiciste», y
  `usualDurationSamples` solo existe para lo que está en la plantilla.
  `usualDurationsByActivityId` (`:999-1016`) ya hace el salto ítem→actividad
  con su desempate documentado («gana la mediana con más datos, y con empate
  la primera»): **ese es el vocabulario de desempate que se imita**, no la
  fuente de datos.
- **«Qué toca ahora» ya existe:** `buildUpNext` (`vida-up-next.utils.ts:265`),
  pero trabaja sobre **bloques del plan del día** más `execution`/`byBlockId` y
  devuelve **una** propuesta con sus salidas. No es una lista ordenable.
- **El buscador:** `filterActivitiesBySearch` (`activity-filters.ts:44-48`)
  sobre `excludeArchivedActivities(activitiesQuery.data?.activities)`
  (`VidaActivityPicker.tsx:104-109`).
- **No existe nada que elija una lista corta de actividades para empezar.**
  Lo digo explícitamente: lo busqué por nombre (`top`, `max`, `limit`,
  `suggestions`), por forma (las tres funciones puras de arriba) y por el borde
  (quién monta el picker). **Lo que hay son tres precedentes de la *forma*, y
  ninguna implementación de *esto*.**
- **¿Está algo dos veces?** No. El «qué» está escrito **una sola vez** y hay un
  test que lo vigila (`VidaActivityPicker.test.tsx:160-174`, un glob que falla
  si aparece un segundo buscador). El picker lo montan exactamente dos sitios:
  `VidaPlaceInGapSheet.tsx` y `VidaLogSessionSheet.tsx`. Nada que denunciar.

### La regla de los cinco

Una sola regla, y se llama **«lo de ahora, sin repetir, cinco»**:

1. **Candidatos**: los `suggestions` con `item.isActive !== false` (el mismo
   filtro que ya hace el picker en `:97`) y fuera los de `excludeActivityIds`.
2. **Una ficha por actividad**: se deduplica por `item.activityId`. El
   representante es el ítem **más cercano a ahora hacia delante**; si todos los
   de esa actividad ya pasaron, el **más reciente de los pasados**.
3. **Orden por distancia a ahora**: primero los que empiezan a partir de
   `nowMinutes`, de más próximo a más lejano; después los que ya pasaron, del
   más reciente al más antiguo; al final los **sin hora**.
4. **Tope**: `VIDA_START_SUGGESTIONS_MAX = 5`.
5. **Desempate** (mismo `startTime`, o dos sin hora): por `title` con
   `localeCompare('es')` y, si aún empatan, por `activityId`. Dos ejecuciones
   dan la misma lista — es la regla que ya usa `pickBlockHints`.

**Por qué esta y no otra.** La plantilla del día **ya es** la respuesta que el
usuario dio a «qué suelo hacer hoy»: no hay que adivinarla. Lo único que
distingue a unos ítems de otros dentro de ese día es **a qué hora tocaban**, y
eso es exactamente lo que está mirando quien abre la hoja a las 15:40. La regla
es **síncrona y gratis**: usa el mismo array `suggestions` que ya está en la
página y el `nowMinutes` que ya está calculado (`VidaHoyPage.tsx:500,1494`).
Cero consultas nuevas, cero estados de carga nuevos, y la lista **no se
reordena bajo el dedo** después del primer pintado.

**Por qué NO por patrones** (`vida-patterns.utils.ts`), que era el candidato
obvio:

- `useVidaPatterns` está **detrás de una puerta** (`canShowPatterns`,
  `VidaHoyPage.tsx:498-500`) y su coste está medido en el dossier de FEAT-007:
  **de ~13 a ~53 consultas** el peor día. Llega **después** del primer pintado,
  así que la lista se reordenaría sola con la hoja ya abierta: lo peor posible
  en una pantalla cuyo objetivo es «una mirada, un toque».
- Su `occurrences` **no mide lo que se hace**, mide lo que estuvo planeado, y
  va por ítem de plantilla. Para ordenar «lo que más haces» de verdad haría
  falta contar sesiones del histórico — otra feature, con su coste.
- El picker lo monta también `VidaPlaceInGapSheet`, donde los patrones pueden
  no estar cargados: la regla tiene que valer sin ellos.

**Dónde se rompe, y qué pasa:**

| Caso | Qué pasa |
|---|---|
| Usuario nuevo, sin historial | Da igual: la regla **no mira el historial**. Si tiene plantilla, ve su plantilla. |
| Día sin plantilla (o todo `isActive: false`) | `topStartSuggestions` devuelve `[]` y el picker pinta la frase que ya existe (`VidaActivityPicker.tsx:139-142`, «Tu plantilla de {dayLabel} no tiene nada más que ofrecer aquí. Búscalo abajo.»). **Criterio 629 cerrado por construcción, sin código nuevo.** |
| Menos de cinco actividades | Se enseñan las que haya. **No se rellena** con el catálogo: meter en la hoja cosas que no están en el plan de hoy es justo lo que el usuario no pidió, y para eso está el buscador. |
| Empate | Regla 5. Determinista. |
| Todo ya pasó (23:40) | La lista **nunca queda vacía habiendo plantilla**: manda el más reciente de los pasados. A las 23:00 lo probable es retomar lo de las 22:00, no lo de las 7:00. |
| La misma actividad en tres ítems | Una ficha. Como la duración ya no se pinta (Decisión B), **qué ítem gane no tiene ningún efecto visible**; `onChange` sigue mandando su `templateMinutes` y `start` sigue ignorándolo. |

**Cómo se cambia el cinco:** `VIDA_START_SUGGESTIONS_MAX`, en
`src/features/vida/utils/vida-start-suggestions.utils.ts`. **Un sitio.** La
página **no** pasa `max`; el `options.max` existe solo para que el test pueda
probar el recorte con dos. Ningún componente lleva un `5` literal.

### ¿Basta el buscador? (comprobado, no supuesto)

- **Sobre qué busca:** **no** sobre las sugerencias. Sobre
  `useActivitiesQuery({ page: 1, limit: CATALOG_LIMIT })` filtrado por
  `excludeArchivedActivities` (`VidaActivityPicker.tsx:91,104-109`): **cualquier
  actividad no archivada del catálogo**, esté o no en la plantilla de hoy.
  Criterio 626 se cumple por no tocar nada.
- **Por nombre parcial: sí.** `filterActivitiesBySearch` hace `includes` sobre
  el título normalizado (`activity-filters.ts:47`), sin mayúsculas ni tildes
  (`normalizeVidaText`): «lulu» encuentra «Working at lululemon», «banar»
  encuentra «Bañarme».
- **Cuántos toques:** con cinco fichas el campo queda **inmediatamente debajo**
  de la lista, sin scroll (es el mismo `<section>`, `:144-152`). **Un toque en
  el campo, escribir, un toque en el resultado.** Los mismos dos toques que
  hoy, menos el scroll.
- **Sus límites, escritos para que nadie se los encuentre de sorpresa** (los
  dos preexistentes y fuera de alcance): enseña **8 resultados como mucho**
  (`MAX_SEARCH_RESULTS`, `VidaActivityPicker.tsx:28`) y busca **dentro de las
  primeras 100 actividades** del catálogo (`CATALOG_LIMIT = 100`,
  `vida-catalog.utils.ts:24`), porque el filtrado es en cliente sobre la página
  ya traída. Con las ~16 actividades del caso reportado no se roza ninguno de
  los dos. Si algún día alguien pasa de 100, **el buscador dejará de bastar** y
  eso es una feature aparte.

### Reference implementation

**`src/features/vida/utils/vida-agenda.utils.ts:504` — `suggestionsForGap`, con
su test en `src/features/vida/utils/vida-agenda.utils.test.ts:442`.**

Por qué esa y no otra: es **la misma figura**, no una parecida. Recibe
`VidaSuggestion[]`, filtra por `isActive`, excluye por `activityId`, ordena con
una regla escrita en el propio comentario, **recorta por una constante
(`MAX_GAP_SUGGESTIONS`) con `limit` sobreescribible**, y **la página la aplica
antes de montar el picker** (`VidaHoyPage.tsx:1163-1167`). Está viva y es de
este mismo flujo. Imita su forma, sus comentarios y su test.

Segunda referencia, solo para la forma del tope y del `options.max`:
`recentNoteSuggestions` (`vida-notes.utils.ts:69`) con su test
(`vida-notes.utils.test.ts:56-61`, que prueba el tope por defecto **y** el
sobreescrito).

### Where the new code goes

**Se crea:**

- `src/features/vida/utils/vida-start-suggestions.utils.ts` — `export const
  VIDA_START_SUGGESTIONS_MAX = 5` y `export function topStartSuggestions({
  suggestions, nowMinutes, excludeActivityIds?, max? }): VidaSuggestion[]`.
  Devuelve `VidaSuggestion[]` **tal cual** (no un tipo nuevo): así el picker no
  cambia de contrato. Copiar el tono de comentario de `suggestionsForGap`: la
  regla entera escrita arriba, en un sitio.
- `src/features/vida/utils/vida-start-suggestions.utils.test.ts` — modelo:
  `vida-agenda.utils.test.ts:442` (constructor `suggestion(...)` local) y
  `vida-notes.utils.test.ts:56-61` para el tope. Un caso por fila de la tabla
  de «dónde se rompe».

**Se modifica:**

- `src/features/vida/pages/VidaHoyPage.tsx`
  - Junto a los `useMemo` de `usualDurations` (**~:509-520**, misma zona y mismo
    estilo), añadir
    `const startSuggestions = useMemo(() => topStartSuggestions({ suggestions, nowMinutes }), [suggestions, nowMinutes])`.
  - En el bloque `{logSheet ? (<VidaLogSessionSheet …>` (**~:1487**), cambiar
    `suggestions={suggestions}` por
    `suggestions={logSheet.mode === 'start' ? startSuggestions : suggestions}`.
    **Esta línea es toda la separación de modos**: `log` y `edit` siguen
    recibiendo la lista entera, letra por letra. Verificado que dentro de la
    hoja `suggestions` **solo** se usa en `:397` para el picker (grep: `:60`
    tipo, `:144` destructuring, `:397` uso).
  - **Ojo, colisión**: hay otra sesión construyendo FEAT-012 sobre este
    repositorio. **Relee el fichero justo antes de editar**, toca solo esas dos
    zonas y no reescribas el archivo entero desde memoria.
- `src/features/vida/components/VidaActivityPicker/VidaActivityPicker.tsx`
  - Nueva prop `showTemplateDuration?: boolean` con **valor por defecto
    `true`** (en el tipo, `:30-52`, y en el destructuring, `:80-90`), con su
    comentario: «"Empezar algo" la apaga porque ahí la duración no viaja a
    ningún sitio».
  - Envolver el `<span className={styles.optionMeta}>` (**:131-135**) en
    `showTemplateDuration && templateMinutes !== null`.
  - **No se toca `onChange(activity, templateMinutes)`** (`:128`): `log`
    anclado a hueco lo necesita (`proposeLogDuration`), y `VidaPlaceInGapSheet`
    también.
- `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx`
  - En el `<VidaActivityPicker …>` (**:390-399**), añadir
    `showTemplateDuration={mode !== 'start'}`.
  - (Tajada 2) En el `<Input id="vida-log-start" type="time" …>` (**:411-425**),
    añadir `lang="es-ES"`. **Verificado que llega al `<input>`**:
    `src/shared/ui/Input/Input.tsx:10-28` hace `{...props}` sobre el elemento
    nativo, sin lista blanca.
  - (Tajada 2) En la frase de ayuda de `mode === 'start'` (**:426-432**),
    incluir la hora en 24 h con `formatTimeForDisplay(displayedStartTime)` —ya
    importado en `:31-36`, devuelve «8:07»—. Es el **único** modo que se toca.

**Tests que se tocan** (y los que no):

- `VidaActivityPicker.test.tsx` — los de `:92` y `:100` **siguen verdes** porque
  la prop es opt-in y por defecto pinta la duración. Se **añade** uno con
  `showTemplateDuration={false}`.
- `VidaLogSessionSheet.test.tsx` — se añade, en el `describe` de `:104`, que en
  `start` la ficha no lleva duración; y en el de `:235` que en `log` **sí** la
  sigue llevando. Los de `:375` (hueco) y `:498` (costumbre) no se tocan.
- `VidaHoyPage.test.tsx` — se añade el caso de los cinco en el `describe` de
  `:1409`. **Los existentes usan `getByRole('button', { name: /Poner lavadora/ })`**
  (regex, `:1420` y `:1435`), así que quitar la duración no los rompe. Confirma
  que el fixture de sugerencias sigue entrando en los cinco; si no, amplíalo,
  **no bajes el tope**.
- **`VidaHoyPage.test.tsx` — la comparación del array completo del mock del
  «▶ Empezar» (criterio 628) NO se edita.** Si se pone roja, el cambio está
  mal, no el test.

### What NOT to create

- **Otro buscador o un segundo picker.** El «qué» está escrito una vez
  (criterio 38) y hay un glob que lo vigila (`VidaActivityPicker.test.tsx:160`).
- **Otro normalizador de texto.** `normalizeVidaText` ya quita acentos.
- **Un tipo nuevo para la ficha.** `topStartSuggestions` devuelve
  `VidaSuggestion[]`.
- **Una consulta, un campo de GraphQL o un parámetro del API.** Todo es
  presentación en cliente: `vidaSuggestionsForDate` no se toca.
- **Un «ahora» nuevo.** `nowMinutes` ya está en la página y es el mismo que
  usan los patrones y `defaultStartNowTime`.
- **Un estado vacío nuevo.** El de la plantilla sin nada ya está escrito
  (`VidaActivityPicker.tsx:139-142`).
- **Un control de hora propio.** Ver abajo.

### Where it does NOT go

Descartado, con su razón, para que nadie lo reconsidere:

1. **Ordenar por patrones / «lo que más haces»** (`useVidaPatterns`): coste
   medido de ~13 a ~53 consultas, llega después del primer pintado y
   reordenaría la lista con la hoja abierta; y `occurrences` mide plan, no
   ejecución. Detalle arriba.
2. **Deduplicar o recortar dentro de `VidaActivityPicker`**: cambiaría en
   silencio `log`, `edit` y `VidaPlaceInGapSheet` (FEAT-003 y FEAT-011), donde
   la ficha por ítem **sí** significa algo (la duración se preselecciona). Por
   eso la regla vive en la página, como `suggestionsForGap`.
3. **Reutilizar `buildUpNext`**: come bloques del plan y `execution`, devuelve
   una sola propuesta y arrastraría el estado de ejecución a una hoja que hoy
   solo conoce la plantilla.
4. **Un «Ver todas» que despliegue el resto**: vuelve a poner la pared detrás
   de un toque, añade una segunda jerarquía visual (era la opción 2 de la
   Decisión A) y el usuario ya dijo que el resto va por el buscador.
5. **Cambiar `vidaSuggestionsForDate` para que deduplique en el servidor**:
   fuera de alcance por la sección 1, y rompería a los otros tres consumidores
   de `suggestions` en la página (lateral, agenda, hueco).
6. **Arreglar el 12/24 h en `VidaStartTimeSheet` y en los modos `log`/`edit`**:
   fuera de alcance por la sección 1. El criterio 631 nombra **solo** el campo
   de esta hoja. La línea que lo arregla es la misma (`lang`), así que quien lo
   decida después lo tiene a un `git grep 'type="time"'` de distancia.
7. **Un control de hora propio (input enmascarado, selector a mano)**: sería la
   única forma de garantizar 24 h en **todos** los navegadores, y **pierde el
   selector nativo del teléfono**, que es lo que hace que poner la hora cueste
   un gesto. Contradice la razón de ser del módulo. No.

### El 12/24 horas: entra, y así

**Entra en esta feature** (tajada 2), por tres razones: el criterio 631 ya está
escrito y acotado a **este** campo; el arreglo son **dos líneas**; y es
**presentación pura** — `input.value` de un `type="time"` es siempre `HH:mm` por
especificación, así que nada de lo que la hoja valida, manda o guarda cambia
(FEAT-013 y el modo `edit` no se rozan: no se tocan).

Cómo, **sin perder el selector nativo**:

- `lang="es-ES"` en el `<input type="time">`. Chromium (Chrome y Edge, Android
  incluido) elige el formato del control por el idioma **computado del
  elemento**, así que con esto pinta 24 h aunque el sistema esté en inglés, y
  **sigue siendo el control nativo**: el selector del teléfono es el mismo.
- **Lo que esto NO garantiza, y hay que decirlo:** Firefox usa la
  configuración regional del sistema e **ignora `lang`**; Safari/iOS sigue el
  ajuste del sistema. **No pude comprobarlo con el navegador** —lo de dentro de
  `/app/*` está tras el login y un arnés no puedo dejarlo escrito en el
  repositorio con otra sesión construyendo— así que **la confirmación es del
  usuario, en su dispositivo**.
- Por eso, y para que el criterio sea cierto pase lo que pase con el sistema
  operativo, la **segunda línea**: la frase de ayuda que ya hay debajo del
  campo en modo `start` dice la hora en la voz del módulo, 24 h, con
  `formatTimeForDisplay` («Ahora mismo, las 15:54. Cámbialo si llevas un rato
  con ello.»). Es texto del módulo, no del navegador: ahí no hay «PM» posible.
  Redacción final, del constructor; lo que no es opcional es que **la hora se
  lea en 24 h sin depender del sistema**.
- El test automático solo puede comprobar el atributo y la frase: jsdom no
  pinta formatos locales. Escríbelo así en la sección 3 y deja el paso manual.

### Slices, with paths

**Recortadas respecto de la sección 1, de tres a dos, con su razón.** Las
tajadas 1 y 2 de la sección 1 (la lista, y la duración) **se funden**: una vez
deduplicada la lista, la duración que sobreviviría es la de **un ítem
representante elegido por un desempate que nadie ve** —de tres bloques de
«Working at lululemon» se pintaría uno de los tres números—, o sea que entregar
la tajada 1 sola dejaría la hoja **mintiendo más que hoy**, no menos. Y el
cambio que la quita son dos líneas. Fundirlas mantiene la tajada vertical y
evita publicar un estado peor que el de partida. La tajada 3 de la sección 1
pasa a ser la 2, intacta.

| # | What it does | Files | Criteria it closes | State |
|---|---|---|---|---|
| 1 | «Qué» ofrece **cinco fichas como mucho, una por actividad y sin duración**, ordenadas por lo que toca ahora: el buscador y el campo de hora se ven sin scroll | **Crea** `src/features/vida/utils/vida-start-suggestions.utils.ts` y `…utils.test.ts`. **Modifica** `src/features/vida/pages/VidaHoyPage.tsx` (~:509 `useMemo`, ~:1487 `suggestions=`), `src/features/vida/components/VidaActivityPicker/VidaActivityPicker.tsx` (:30-52 prop, :80-90, :131-135), `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx` (:390-399). **Tests**: `VidaActivityPicker.test.tsx`, `VidaLogSessionSheet.test.tsx`, `VidaHoyPage.test.tsx` (:1409) | 622, 623, 624, 625, 626, 627, 629, 630 — y **628 se comprueba sin tocar nada** | pending |
| 2 | El campo «¿A qué hora empezaste?» se lee en 24 h, sin depender del sistema | **Modifica** `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx` (:411-425 `lang`, :426-432 la frase). **Test**: `VidaLogSessionSheet.test.tsx` (`describe` de :104) | 631 | pending |

**Lo que no se toca, dicho para que nadie lo dude:**

- **Modos tocados:** `start`, y solo por dos vías —la lista que la página le
  pasa a la hoja cuando `logSheet.mode === 'start'`, y una prop opt-in del
  picker cuyo valor por defecto es el comportamiento de hoy.
- **Modos NO tocados:** `log` (FEAT-004, FEAT-011), `edit` (FEAT-013 tajada 2),
  `VidaPlaceInGapSheet` (FEAT-003), `VidaStartTimeSheet` (FEAT-013), y el
  buscador entero (FEAT-004/FEAT-018).
- **El «▶ Empezar» de un toque de la agenda y de «Lo que viene» no pasa por
  esta hoja**: lo confirmé con `Bash` en `VidaHoyPage.tsx:1216`
  (`startWithNote(upNext.blockId, upNext.activityId)`). Su test intocable de
  `VidaHoyPage.test.tsx` no está en juego. **Si se pone rojo, el cambio está
  mal.**

**Cómo cerrar cada tajada** (de `ENVIRONMENT.md`, línea base de hoy): `pnpm
typecheck` limpio, `pnpm lint` 14/0, `pnpm test` 2 fallos de 2074 (`SearchSelect`
×2; si sale un tercero de `IconPicker`, córrelo aislado), y `pnpm build` al
terminar —no solo `typecheck`—, vigilando que el CSS **no baje** sin motivo.
Después, `graphify update .`.

**Lo que no pude averiguar:** si `lang="es-ES"` arregla de verdad el «03:54 PM»
**en el dispositivo del usuario**. El navegador del entorno no me deja abrir un
fichero suelto y no voy a dejar un arnés en el repositorio con otra sesión
construyendo. Es un paso manual del usuario al cerrar la tajada 2, y por eso la
frase de ayuda en 24 h va **en la misma tajada**: si el atributo no toma, el
criterio 631 sigue siendo cierto por el texto del módulo.

## 3. Construction — feature-builder

## 4. Review — feature-reviewer
