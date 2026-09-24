---
id: FEAT-023
title: Empezar algo — que abrir la hoja no sea remar contra una pared de fichas duplicadas
status: delivered
architect: yes    # toca VidaActivityPicker y el modo `start` de VidaLogSessionSheet, compartidos por FEAT-003, FEAT-004, FEAT-011 y FEAT-018 (ya entregadas) y por el modo `edit` de FEAT-013; el propio encargo pide que alguien con Bash mire el terreno antes de construir
area: features/vida
requested: 2026-09-23
updated: 2026-09-24
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
| 1 | «Qué» ofrece **cinco fichas como mucho, una por actividad y sin duración**, ordenadas por lo que toca ahora: el buscador y el campo de hora se ven sin scroll | **Crea** `src/features/vida/utils/vida-start-suggestions.utils.ts` y `…utils.test.ts`. **Modifica** `src/features/vida/pages/VidaHoyPage.tsx` (~:509 `useMemo`, ~:1487 `suggestions=`), `src/features/vida/components/VidaActivityPicker/VidaActivityPicker.tsx` (:30-52 prop, :80-90, :131-135), `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx` (:390-399). **Tests**: `VidaActivityPicker.test.tsx`, `VidaLogSessionSheet.test.tsx`, `VidaHoyPage.test.tsx` (:1409) | 622, 623, 624, 625, 626, 627, 629, 630 — y **628 se comprueba sin tocar nada** | accepted |
| 2 | El campo «¿A qué hora empezaste?» se lee en 24 h, sin depender del sistema | **Modifica** `src/features/vida/components/VidaLogSessionSheet/VidaLogSessionSheet.tsx` (:411-425 `lang`, :426-432 la frase). **Test**: `VidaLogSessionSheet.test.tsx` (`describe` de :104) | 631 | accepted |

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

### Tajada 1 — «Qué» ofrece cinco fichas, una por actividad y sin duración

**Summary for the reviewer:**
1. «Empezar algo» (modo `start`) ya no pinta un ítem de plantilla por ficha:
   la página recorta la lista con `topStartSuggestions` —una por `activityId`,
   ordenada por distancia a `nowMinutes`, tope `VIDA_START_SUGGESTIONS_MAX = 5`—
   y el picker apaga la duración con una prop nueva opt-in.
2. Medido en el navegador a 375×667: el buscador y el campo de hora quedan
   dentro de la pantalla (antes el campo de hora caía a 772 px, 105 px por
   debajo del borde).
3. **Lo que más probablemente he roto:** el orden de las fichas en «Empezar
   algo» — quien esperaba ver su plantilla en orden cronológico ahora ve
   primero lo más cercano a ahora, y **la actividad que representa a tres
   bloques cambia según la hora del día**. Y, en segundo lugar, el modo `log`:
   comparte componente y solo lo separa **una** expresión en `VidaHoyPage.tsx`
   y **una** prop en la hoja; si esas dos líneas están mal, «Registrar tiempo
   pasado» pierde fichas o duraciones sin que salte nada más.

**What was built:**

- **Se crea** `src/features/vida/utils/vida-start-suggestions.utils.ts`:
  `VIDA_START_SUGGESTIONS_MAX = 5` (**el cinco vive solo aquí**; ningún
  componente lleva un literal) y `topStartSuggestions({ suggestions,
  nowMinutes, excludeActivityIds?, max? })`, que devuelve `VidaSuggestion[]`
  tal cual. La regla «lo de ahora, sin repetir, cinco» está escrita entera en
  el comentario de cabecera, con el porqué de no ordenar por patrones.
  Deduplicar y ordenar son **una sola pasada**: ordenado ya, el primero de
  cada `activityId` es su representante (el más cercano hacia delante o, si
  todos pasaron, el más reciente).
- **Se crea** `…/vida-start-suggestions.utils.test.ts` — 14 casos, uno por fila
  de la tabla «dónde se rompe» de la sección 2, más el tope sobreescrito
  (modelo `vida-notes.utils.test.ts`) y el determinismo del desempate
  (dos corridas con el array al derecho y al revés dan la misma lista).
- **Se modifica** `src/features/vida/pages/VidaHoyPage.tsx`: el import, y en el
  montaje de `VidaLogSessionSheet` (~:1495) `suggestions={logSheet.mode ===
  'start' ? topStartSuggestions({ suggestions, nowMinutes }) : suggestions}`.
  **Esa expresión es toda la separación de modos.**
- **Se modifica** `VidaActivityPicker.tsx`: prop `showTemplateDuration?:
  boolean` con **valor por defecto `true`** (comportamiento de hoy) y el
  `<span className={styles.optionMeta}>` envuelto en `showTemplateDuration &&
  templateMinutes !== null`. **`onChange(activity, templateMinutes)` no se
  toca**: sigue avisando con los minutos, y hay un test que lo fija.
- **Se modifica** `VidaLogSessionSheet.tsx`: `showTemplateDuration={mode !==
  'start'}` en el picker. Una línea, dentro del `else` que ya distinguía
  `edit`.
- **Tests añadidos**: `VidaActivityPicker.test.tsx` (con la prop apagada no hay
  duración, y `onChange` sigue llevando los 20 min), `VidaLogSessionSheet.test.tsx`
  (en `start` la ficha es «Poner lavadora» pelada; en `log` sigue siendo
  «Poner lavadora20m»), `VidaHoyPage.test.tsx` (el caso de los cinco con tres
  bloques de «Working at lululemon», el de plantilla vacía y uno que fija que
  «Registrar tiempo pasado» **sigue viendo la plantilla entera con duraciones**).

**Why this way (y qué se descartó sobre la marcha):**

- **Desvío del plan, dicho en voz alta: no hay `useMemo`.** El plan pedía
  `const startSuggestions = useMemo(…)` junto a `usualDurations`. Escrito así,
  `pnpm lint` daba un **error nuevo** (15 en vez de 14):
  `react-hooks/preserve-manual-memoization` — *«Compilation Skipped: Existing
  memoization could not be preserved… `suggestions`: This dependency may be
  modified later»*. En vez de silenciar la regla, la llamada se hace **en el
  sitio del montaje**, exactamente como `suggestionsForGap` unas líneas más
  arriba (`:1176`), que tampoco está memoizada. El compilador de React
  memoiza igual, solo se calcula cuando hay hoja abierta, y de paso la
  separación de modos queda en **un** punto en vez de dos.
- **Segundo desvío: `nowMinutes` es `number | null`.** `useVidaNowMinute`
  devuelve `null` cuando el día que se mira no es hoy, así que la firma lo
  acepta y sin «ahora» manda el orden del día (medianoche como origen). El
  plan asumía `number`; con `number` el `pnpm typecheck` fallaba
  (`TS2322` en `VidaHoyPage.tsx`). Hay un test para ese caso.
- **No se tocó `onChange`**, ni la consulta, ni el buscador, ni
  `VidaPlaceInGapSheet`, ni `VidaStartTimeSheet`, ni el SCSS (cero cambios de
  estilo: la ficha sin duración usa las clases de siempre).

**Verification:**

| Comprobación | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 errores / 0 warnings** (los mismos ficheros: `HabitDifficultyPicker`, `CommandPalette*`, `ConfirmDialogProvider`, `IconPicker`, `SteppedModal`, `Tabs`, `toast.context`, `test/render`) |
| `pnpm test` | 2 fallos de 2141 (`SearchSelect` ×2) | **2 fallos de 2160** — los mismos dos de `SearchSelect`; +19 tests nuevos. Sin `IconPicker` flaky esta vez |
| `pnpm build` | chunk 1.148,03 kB · CSS 279,35 kB | chunk **1.148,97 kB** (+0,94 kB, el módulo nuevo) · CSS **279,35 kB** *(idéntico: no se tocó ni un `.scss`)* |
| Caché (FEAT-021) | — | **Nadie pierde la caché.** Ningún fichero tocado está en `graphql/`, `api/` ni `src/shared/api/`, y ninguno nombra `setQueryData`/`setQueriesData`/`setQueryState` (comprobado con `grep -l` sobre los cuatro). `pnpm vitest run vite/` → 18 de 18 |

**Medido en el navegador, no razonado.** `/app/*` está tras el login, así que
se montó un **arnés temporal** (`src/harness-feat023.tsx` + `harness-feat023.html`
+ un envoltorio en `public/`) que renderiza `VidaLogSessionSheet` en modo
`start` con `AppProviders`, 14 ítems de plantilla sobre 10 actividades (tres
bloques de «Working at lululemon», dos de «Salir con sheyko y Layla», dos de
«Desayunar», dos de «Organizar la casa», uno sin hora y un título de 60
caracteres) y **las 15:40** como «ahora» — la hora de la captura del usuario.
La pantalla se midió **dentro de un `iframe` del ancho exacto**, no en la
pestaña (que emula 568 px). **Los tres ficheros del arnés están borrados**
(`git status` solo muestra los dos ficheros nuevos de `utils/` y los seis
modificados).

```
375×667, con la regla puesta   → 5 fichas · buscador 413–454 px · hora 514–559 px
375×667, con la lista de hoy   → 14 fichas · buscador 626–666 px · hora 726–772 px (FUERA)
   (y el caso real del usuario eran 22 fichas, no 14: peor que esto)
panel: scrollHeight−clientHeight = 39 px con la regla · 251 px sin ella
568×667 y 760×667 → mismas 5 fichas, sin desbordes; «Empezar» visible sin scroll
```

**Criteria it closes:**

- **622 — buscador visible sin scroll a 375×667: SÍ.** Medido: el
  `input[type="search"]` va de 413 a 454 px en una ventana de 667. Antes,
  626–666 px (pegado al borde con 14 fichas; con las 22 de la captura, fuera).
- **623 — campo «¿A qué hora empezaste?» visible sin scroll: SÍ.** Medido:
  514–559 px. Antes: 726–772 px, es decir **105 px por debajo del borde**.
- **624 — ninguna ficha indistinguible de otra: SÍ.** Por construcción: una
  ficha por `activityId`. Test en `VidaHoyPage.test.tsx` («Working at
  lululemon» en tres bloques → `getAllByRole(…)` devuelve **1**) y en el
  arnés se vio una sola ficha de cada una.
- **625 — ninguna ficha lleva duración en esta hoja: SÍ** (es la opción 2 de la
  Decisión B, la que cerró el usuario). Tests en el picker, en la hoja y a
  ojo en el arnés: «Working at lululemon», no «Working at lululemon4h».
- **626 — el buscador no pierde alcance: SÍ, por no tocarlo.** Sigue siendo
  `filterActivitiesBySearch(excludeArchivedActivities(activitiesQuery.data…))`
  sobre el catálogo (`CATALOG_LIMIT = 100`), no sobre las sugerencias: ni una
  línea cambiada en `VidaActivityPicker` fuera del `<span>` de la duración.
  Sus dos límites preexistentes siguen donde estaban (8 resultados, 100
  actividades traídas).
- **627 — elegir sigue siendo una sola acción: SÍ.** `onStart(activityId,
  startTime?)` no cambia; los tests de los criterios 330, 331b y 332 siguen en
  verde sin tocarlos.
- **629 — plantilla vacía: SÍ.** Sin ítems activos la función devuelve `[]` y
  el picker pinta la frase que ya existía. Test nuevo en `VidaHoyPage.test.tsx`.
- **630 — nombre largo: SÍ.** Con un título de 60 caracteres, medido a 375,
  568 y 760 px: `scrollWidth − clientWidth = 0` en las cinco fichas y ningún
  rectángulo invade el de la ficha vecina (a 568 y 760 la grilla pone dos por
  fila y la larga ocupa su fila entera). El texto se recorta con puntos
  suspensivos, como ya hacía.
- **628 — no está en juego, y se comprueba sin tocarlo:** el test de
  `VidaHoyPage.test.tsx` que compara el array completo del mock del «▶
  Empezar» **no se editó** y sigue verde (la suite entera pasa: 129 tests del
  fichero).

**Lo que queda para prueba manual del usuario** (no se puede desde aquí,
`/app/*` está tras el login):

1. Abrir Hoy con sesión y pulsar «Empezar algo» en el teléfono: ver **cinco
   fichas como mucho**, cada actividad una sola vez, **sin el número de
   minutos**, y el buscador y «¿A qué hora empezaste?» **sin desplazar**.
2. Comprobar que las cinco son las que tocan **a esa hora** (lo más próximo por
   delante primero) y que a última hora de la noche sale lo último que tocaba,
   no lo de las 7:00.
3. Escribir «lulu» en «Busca otra cosa…» y comprobar que sigue apareciendo
   «Working at lululemon» aunque ya no esté entre las cinco.
4. Abrir «Registrar tiempo pasado» y confirmar que **ahí sigue todo igual**:
   la plantilla entera, con sus duraciones, y la duración que viene puesta al
   elegir.

**Risks:**

- **El orden cambia para el mismo día según la hora.** Es la regla elegida,
  pero es un cambio de comportamiento visible: la lista ya no es la plantilla
  en orden cronológico.
- **`log` y `edit` cuelgan de dos líneas.** `logSheet.mode === 'start' ? … :
  suggestions` y `showTemplateDuration={mode !== 'start'}`. Hay un test para
  cada una, pero es ahí donde miraría primero.
- **Cuatro ficheros llaman al picker con la prop por defecto** (`VidaPlaceInGapSheet`
  y los otros modos): si alguien invierte el valor por defecto de
  `showTemplateDuration`, se apagan duraciones que sí significan algo.
- **Lo que no se pudo medir:** el comportamiento real en el teléfono del
  usuario (tamaño de fuente del sistema, densidad). Las medidas son de
  Chromium a 375, 568 y 760 px con la fuente por defecto.

**Lo que encontré y no estaba en el plan** (anotado, **no tocado**):

- El panel de la hoja **todavía desborda 39 px** a 375×667: el botón «Empezar»
  queda 7 px por debajo del borde y pide un empujón de scroll. No lo pide
  ningún criterio (el 622 y el 623 hablan del buscador y de la hora) y tocar
  el alto del pie es cambiar la hoja para los tres modos. Antes de esta tajada
  el desborde era de 251 px.
- En el arnés se ve que el campo de hora pinta **«03:40 PM»**: es exactamente
  lo que arregla la **tajada 2** (`lang="es-ES"` + la frase en 24 h). No se
  tocó.
- `VidaActivityPicker` sigue usando `key={activity.id}`. Con la lista
  deduplicada de `start` ya no puede haber dos `<li>` con la misma clave, pero
  en `log`/`edit` y en `VidaPlaceInGapSheet` **la colisión de `key` sigue ahí**
  tal cual (una plantilla con dos bloques de la misma actividad). Fuera de
  alcance: cambiarlo tocaría los modos que esta feature no toca.

**Tree state:** sin commitear. Dos ficheros nuevos
(`vida-start-suggestions.utils.ts` y su test) y seis modificados —cuatro de
código y test, más `BOARD.md` y este dossier—. Nada del arnés queda en el
árbol.

### Tajada 2 — el campo «¿A qué hora empezaste?» y las 24 horas

**Summary for the reviewer:**
1. «Empezar algo» le **pide** 24 h al navegador (`lang="es-ES"` en el
   `<input type="time">`, solo en modo `start`) y, sobre todo, **dice la hora
   en la voz del módulo debajo del campo**: «Ahora mismo, las 15:54. Cámbialo
   si llevas un rato.» y, al tocarla, «Empieza contando desde las 21:00 y
   sigue en marcha.»
2. **Medido, y contradice al plan: el atributo no basta ni en Chromium.** Con
   el navegador en `en-US` y `lang="es-ES"` en el campo, sigue pintando
   «03:54 PM» (captura en el arnés, ya borrado). **La red es lo único que de
   verdad cumple el criterio**, y por eso está cuidada al milímetro.
3. **Lo que más probablemente he roto:** el alto de la hoja. La frase lleva
   ahora una hora dentro y a 375 px el pie de esta hoja ya rozaba el borde
   (hallazgo 1 del revisor en la tajada 1). Con la redacción del plan —«…si
   llevas un rato **con ello**»— la frase pasaba de una línea a dos y el botón
   «Empezar» se iba 18 px más abajo; **medido y evitado** quitando dos
   palabras. Si alguien alarga esa frase, el pie se va. Segundo sitio donde
   miraría: el `key` del picker, que aprovecho para arreglar y que toca
   `log`, `edit` y «Poner en el hueco» —solo en cómo React reconcilia, no en
   lo que se pinta—.

**What was built:**

- **`VidaLogSessionSheet.tsx`**, tres cambios y **solo en el modo `start`**:
  - `lang={mode === 'start' ? 'es-ES' : undefined}` en el
    `<Input id="vida-log-start" type="time">`. **Condicionado al modo**, que es
    un desvío del plan: la línea del plan lo ponía suelto y ese `<Input>` es el
    mismo elemento para los tres modos, así que sin la condición cambiaba
    también `log` (FEAT-004/FEAT-011) y `edit` (FEAT-013), justo lo que la
    sección 1 y el punto 6 de «Where it does NOT go» dejan **fuera de alcance**.
    Ponerlo para todos es borrar `mode === 'start' ? … : undefined`.
  - **La frase de ayuda escribe la hora con `formatTimeForDisplay`**, la misma
    que dice «22:00» en la agenda: `Ahora mismo, las 15:54. Cámbialo si llevas
    un rato.` sin tocar, y `Empieza contando desde las 21:00 y sigue en
    marcha.` al tocarla. **Con el campo vacío no se inventa ninguna hora**
    (`isValidHhMm`): vuelven las frases de siempre, porque «las 0:00» sería
    mentir.
  - El comentario del campo dice **lo que se midió**, no lo que se esperaba.
- **`VidaActivityPicker.tsx`** — el `key` que el revisor dejó anotado: el
  `map` lleva ahora `key: suggestion.item.id` (el ítem de plantilla) y el
  `<li>` usa esa. **Dos líneas y nada que se vea**: las fichas se pintan
  igual; lo único que cambia es que dos bloques de la misma actividad dejan de
  compartir clave en `log`, `edit` y `VidaPlaceInGapSheet`.
- **Tests** (`VidaLogSessionSheet.test.tsx`, `VidaActivityPicker.test.tsx`):
  el campo lleva `lang="es-ES"` y **sigue siendo `type="time"`** (el control
  nativo, que es lo que no se podía perder); la frase dice «las 15:40» con el
  campo en «15:40» y **no aparece ningún «PM»**; con el campo vacío no sale
  «las 0:00»; en `log` y en `edit` el campo **no lleva `lang`** y no hay frase;
  y dos bloques de la misma actividad dan dos fichas **sin el aviso de clave
  repetida** de React.
- **Un test existente cambia de literal**: el del criterio 330 comparaba la
  frase entera. Ahora espera «Ahora mismo, las 8:54. …». Es el texto que esta
  tajada cambia a propósito; el test intocable del «▶ Empezar»
  (`VidaHoyPage.test.tsx`) **no se ha abierto siquiera**.

**Why this way (y qué se descartó):**

- **Un control de hora propio: no.** Es lo único que garantizaría 24 h en
  todos los navegadores y **pierde el selector nativo del teléfono**; en una
  hoja que existe para que registrar cueste un gesto, eso es peor que el
  formato. Estaba descartado en la sección 2 y el encargo lo repitió.
- **La frase no afirma nada del campo.** No dice «el campo está en 24 h» —eso
  no se sabe desde aquí—: dice **la misma hora** en la voz de la casa. Por eso
  no se pelean en pantalla aunque el campo pinte «03:54 PM»: se lee «03:54 PM»
  y, justo debajo, «Ahora mismo, las 15:54».
- **La redacción se acortó por una medida, no por gusto** («…si llevas un
  rato», sin «con ello»). Ver el número abajo.

**Verification:**

| Comprobación | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | **limpio** |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos ficheros |
| `pnpm test` | 2 fallos de 2160 (`SearchSelect` ×2) | **2 fallos de 2165** — los mismos dos; +5 tests. Sin `IconPicker` flaky |
| `pnpm build` | chunk 1.148,97 kB · CSS 279,35 kB | chunk **1.149,18 kB** (+0,21 kB) · CSS **279,35 kB** *(idéntico: ni un `.scss` tocado)* |
| Caché (FEAT-021) | buster `f8edc4f3becd` | **nadie la pierde**: `collectShapeSources('.')` da 32 ficheros y **ninguno de los tocados está**; `isShapeSourceByPath` y `writesCacheByHand` dan `false` en los cuatro. Buster **idéntico**. `pnpm vitest run vite/` → 18/18 |

**Medido en el navegador, no razonado.** Arnés temporal
(`harness-feat023b.html` + `src/harness-feat023b.tsx`) con la hoja en modo
`start`, «ahora» a las 15:54 y cinco fichas, **dentro de un `iframe` del ancho
exacto** (la pestaña emula 568 px). **Los dos ficheros están borrados**
(`git status` no los muestra).

```
El atributo, en Chromium (navegador en en-US, <html lang="es">):
  input sin lang              → 03:54 PM
  input lang="es-ES"          → 03:54 PM   ← NO TOMA
  input lang="en-US"          → 03:54 PM
  input lang="es-ES" dentro de div lang="en-US" → 03:54 PM
  (o sea: el formato lo elige el idioma del navegador, no el del elemento)

La hoja a 375×667, contenido de 292 px de ancho:
  campo «03:54 PM»  ·  frase «Ahora mismo, las 15:54. Cámbialo si llevas un rato.»
  frase = 18 px (UNA línea)      · botón «Empezar» 606–647 · desborde del panel 13 px
  con la frase de antes          → 18 px · 606–647 · 13 px   (idéntico: no empeora)
  con la redacción del plan      → 35 px · 624–664 · 31 px   (DOS líneas, 18 px peor)
  tocada: campo «09:00 PM» · «Empieza contando desde las 21:00 y sigue en marcha.»
          35 px, igual que la frase de antes (también dos líneas): no empeora
  568 y 760 px → la frase cabe en una línea en los dos estados, sin desborde,
                 botón «Empezar» dentro, scroll horizontal 0
```

**Criteria it closes:**

- **631 — «El campo de hora de esta hoja se lee siempre en formato 24 horas,
  sin depender del formato del sistema operativo».** **Cumplido en la hoja,
  NO en el control nativo.** Lo digo separado porque el criterio dice «el
  campo» y no quiero darlo por bueno de más:
  - **La hora se lee en 24 h sin depender del sistema: SÍ.** La escribe el
    módulo con `formatTimeForDisplay`, pegada debajo del campo, en los dos
    estados (sin tocar y tocada), y se mueve con el campo. Medido en el
    navegador y fijado con tres tests.
  - **El `<input type="time">` en sí: NO se puede garantizar.** Medido: con
    `lang="es-ES"` este Chromium **sigue pintando «03:54 PM»**, y el
    arquitecto ya dejó dicho que Firefox y Safari/iOS tampoco hacen caso. La
    única forma de garantizarlo era un control propio, **descartado por el
    usuario y por la sección 2** (se perdería el selector del teléfono). El
    atributo se deja puesto porque no cuesta nada y hay Chromium que sí lo
    honra.
  - **Prueba final: del usuario, en su iPhone.** Ahí es donde se ve si el
    campo obedece o no; lo que no depende del teléfono es la frase.

**Lo que queda para prueba manual** (`/app/*` está tras el login y los agentes
no entran; **la prueba final es suya en su iPhone**):

1. Abrir Hoy, pulsar «Empezar algo» y mirar **debajo del campo**: tiene que
   leerse «Ahora mismo, las HH:MM. Cámbialo si llevas un rato.» en 24 h, aunque
   el campo ponga «PM».
2. Tocar el campo, elegir una hora de la tarde con el selector del teléfono
   —**que tiene que seguir siendo el de siempre**— y comprobar que la frase
   pasa a «Empieza contando desde las 21:00 y sigue en marcha.», con la misma
   hora que se eligió.
3. Borrar la hora: la frase no debe decir ninguna («…desde esa hora…»).
4. Abrir «Registrar tiempo pasado» y «Corregir»: **ahí no cambia nada**, ni el
   formato del campo ni la frase (no la hay).
5. Decir si el campo del iPhone sigue en «03:54 PM» o no: es el dato que
   ningún agente puede medir, y con él se decide si el 12/24 h del resto del
   módulo (`VidaStartTimeSheet`, `log`, `edit`) merece una feature aparte.

**Risks:**

- **El alto de la hoja.** La frase con hora es más larga; a 375 px está **a
  dos palabras** de saltar a dos líneas y empujar el pie, que ya rozaba el
  borde antes de esta tajada. Medido que hoy no lo hace; quien la reescriba
  tiene que volver a medirla.
- **El literal del test del criterio 330** cambió con la copia. Si alguien
  vuelve a la frase vieja, ese test lo dice.
- **El `key` del picker** toca los tres modos y «Poner en el hueco». No cambia
  lo que se pinta (mismas fichas, mismo orden, mismo `onChange`), pero sí cómo
  React reconcilia la lista: si algún día una ficha guardara estado propio,
  ahí se notaría. Suites de los tres sitios en verde.
- **`lang` condicionado al modo** deja la hoja con dos comportamientos según
  el modo. Es deliberado (los otros dos están fuera de alcance), pero es una
  inconsistencia que conviene cerrar cuando se decida el resto del módulo.

**Lo que encontré y no estaba en el plan:**

- **El `lang` no toma en Chromium** (arriba). El plan lo daba por bueno; está
  medido que no. No cambia el criterio, cambia quién lo cumple.
- **El desborde del panel a 375×667 sigue ahí** (13 px sin tocar la hora, 31 px
  con la frase de dos líneas del estado tocado). Es el hallazgo 1 del revisor
  de la tajada 1 y **sigue fuera de alcance**: lo limita
  `SteppedModal.module.scss:46` (`max-height: 92vh`) y tocarlo cambia el molde
  de todos los modales.
- **El mismo `type="time"` sin envoltorio está en `VidaStartTimeSheet` y en los
  modos `log`/`edit`** — un `git grep 'type="time"'` los enseña. Anotado, **no
  tocado**.

**Tree state:** sin commitear. Cuatro ficheros de código y test modificados,
más `BOARD.md` y este dossier. Del arnés no queda nada. En el árbol hay además
cambios de otra sesión (`docs/features/FEAT-015-habitos-metricas.md` y un
fichero de `graphify-out/memory/`) que **no son míos y no he tocado**.

## 4. Review — feature-reviewer

### Tajada 1 — revisión

**Veredicto: `accepted`.** Los ocho criterios de la tajada (622, 623, 624,
625, 626, 627, 629, 630) se cumplen medidos, y el 628 sigue verde sin editar
el test. Dos hallazgos quedan escritos abajo, ninguno bloquea: el botón
«Empezar» **sí** se va por debajo del borde a 375×667 **cuando una de las
cinco fichas ocupa fila entera** (medido: 17 px), y a media tarde la lista no
ofrece el bloque **en curso**.

**Criterios, uno a uno** (medidos en un arnés temporal, ya borrado, dentro de
un `iframe` de ancho exacto; plantilla sintética de 22 ítems sobre 17
actividades, la forma de la captura del usuario):

| # | Veredicto | Evidencia |
|---|---|---|
| 622 buscador sin scroll | **cumple** | 375×667: `input[type=search]` en 386–427 px con cinco fichas cortas y 423–464 px con una ficha de fila entera. Sin la regla: 722–763 px (fuera) |
| 623 hora sin scroll | **cumple** | 475–532 px según el caso; sin la regla, 823–868 px (fuera) |
| 624 ninguna ficha indistinguible | **cumple** | Una ficha por `activityId` por construcción; con 22 ítems y 17 actividades salen 5 títulos distintos. Test propio en `VidaHoyPage.test.tsx` |
| 625 sin duración en la ficha | **cumple** | Las cinco fichas del arnés en `start` son «Trabajar en graphify», «Comprar mercado»… sin minutos; en `log` siguen siendo «Working at lululemon1h» |
| 626 el buscador no pierde alcance | **cumple** | `filterActivitiesBySearch` (`activity-filters.ts:44-48`) sin tocar: `includes` sobre el título normalizado del catálogo (`CATALOG_LIMIT = 100`, no las sugerencias). El diff no toca ni esa función ni el bloque de búsqueda del picker |
| 627 una sola acción | **cumple** | `onStart(activityId, startTime?)` intacto; las suites de los criterios 330/331b/332 pasan sin editarse |
| 629 plantilla vacía | **cumple** | `topStartSuggestions` devuelve `[]` y el picker pinta «Tu plantilla de … no tiene nada más que ofrecer aquí». Test nuevo, verde |
| 630 nombre largo | **cumple** | Título de 53 caracteres entre las cinco, a 375 y 760 px: `scrollWidth − clientWidth = 0` en las cinco fichas, cero solapes entre rectángulos, `hScroll = 0` |
| 628 «▶ Empezar» de un toque | **cumple, sin tocar nada** | `git diff` de `VidaHoyPage.test.tsx`: **90 líneas añadidas, 0 borradas**. La comparación del array completo del mock no se editó y la suite entera pasa |

**La regla, probada a distintas horas** (ejecutando `topStartSuggestions`
sobre la plantilla sintética):

```
sin «ahora» (otro día) → 07:00 · 08:00 · 08:30 · 09:00 · 14:00   (orden del día, no vacía)
06:30 → 07:00 · 08:00 · 08:30 · 09:00 · 14:00
12:40 → 14:00 · 14:45 · 15:00 · 15:30 · 16:30
15:40 → 16:30 · 18:00 · 19:00 · 21:00 · 21:30
20:10 → 21:00 · 21:30 · 22:00 · 23:00 · 19:00 (el de las 19:00, en curso, cierra la lista)
23:40 → 23:00 · 22:00 · 21:30 · 21:00 · 19:00 (lo último que tocaba, no lo de las 7:00)
```

De noche y a primera hora la lista es la que una persona esperaría. **El punto
flojo está a media tarde**: a las 15:40, con el bloque de las 15:30 todavía en
marcha, ese bloque **no sale** entre las cinco —cae al cajón «ya pasó» detrás
de cinco futuros—. Se queda como hallazgo y no como devolución porque lo que
está en curso tiene su propio camino de un toque («Lo que viene» y el «▶
Empezar» de la agenda), y quien abre «Empezar algo» suele estar diciendo
justamente «eso no».

**Los dos desvíos declarados, comprobados:**

- **Sin `useMemo`:** la llamada vive dentro del bloque `logSheet ? (…)`, así
  que solo se ejecuta con la hoja abierta, y su coste es un `map`+`sort` sobre
  la plantilla de un día (22 ítems en el peor caso medido). La comparación con
  `suggestionsForGap` se sostiene: está llamada en línea en el mismo montaje
  (`VidaHoyPage.tsx:1166`) y tampoco está memoizada.
- **`nowMinutes: number | null`:** con `null` (un día que no es hoy) la lista
  sale en el orden del día, cinco fichas, ni vacía ni aleatoria. Medido arriba.

**Qué se rompió cerca, y cómo lo busqué:**

- `graphify explain "VidaActivityPicker"` → cinco conexiones, ninguna que la
  tajada toque salvo el propio componente. Abierto el fichero para confirmarlo.
- Quién monta el picker: **dos sitios**, `VidaLogSessionSheet` y
  `VidaPlaceInGapSheet`. El segundo **no pasa** `showTemplateDuration`, y el
  valor por defecto es `true`: comportamiento de hoy, letra por letra.
- Dentro de la hoja, `suggestions` se usa **una sola vez** (`:397`, el picker);
  la separación de modos es una expresión ternaria y una prop.
- Medido en el navegador, no razonado: en `mode="log"` con los mismos 22 ítems
  salen **las 22 fichas con sus duraciones** («Working at lululemon1h»,
  «Dormir8h»…). `edit`, `VidaPlaceInGapSheet` y `VidaStartTimeSheet` no
  aparecen en el diff.
- `pnpm vitest run` de los cuatro ficheros tocados + `vite/`: **293 de 293**.
  `pnpm lint`: **14 errores / 0 warnings**, la línea base exacta.
- **Nadie pierde la caché, comprobado ejecutando la huella**, no por grep:
  `collectShapeSources('.')` devuelve **32 ficheros** y **ninguno de los cinco
  de código tocados está en la lista** (`buster` actual `f8edc4f3becd`). Ni por
  ruta (`graphql/`, `api/`, `src/shared/api/`) ni por contenido
  (`setQueryData`…). La tajada **no cuesta una apertura fría**.
- Ningún `.scss` tocado (`git status`), así que la cifra de CSS no puede haber
  bajado: la trampa del comentario sin cerrar no aplica aquí.

**El precio del «top 5», medido:** llegar a algo que antes estaba a la vista
cuesta **un toque más y escribir**: tocar «Busca otra cosa…» (visible sin
desplazar en todos los casos medidos), teclear un trozo de palabra («lulu»,
sin tildes ni mayúsculas) y tocar el resultado. Dos toques en vez de uno. Los
límites preexistentes siguen donde estaban: 8 resultados y las primeras 100
actividades del catálogo.

**Estados:** vacío (629) **cubierto y probado**; carga y error del catálogo
**no cambian** (el esqueleto y la lista de resultados solo aparecen al
escribir, y el diff no los toca); permisos **no aplica** (toda la hoja está
tras el login y no hay roles); texto largo (630) **cubierto y medido**; móvil
a 375 px **medido**, sin scroll horizontal.

**¿Duplica algo que ya existía?** No. Contra la sección 2: no hay segundo
buscador (el glob de `VidaActivityPicker.test.tsx:160` sigue verde), no hay
normalizador nuevo, no hay tipo nuevo —`topStartSuggestions` devuelve
`VidaSuggestion[]`—, no hay consulta nueva y el «ahora» es el `nowMinutes` que
ya estaba. La función nueva imita a `suggestionsForGap`, que es justo la forma
que el arquitecto señaló.

**Hallazgos que no devuelven la tajada** (del usuario es la decisión):

1. **El botón «Empezar» por debajo del borde a 375×667, confirmado y acotado.**
   Con cinco fichas cortas el panel desborda **11 px** y el botón queda
   **entero dentro** (606–647 en una ventana de 667). Con una de las cinco
   ocupando fila entera (título largo) el desborde sube a **49 px** y el botón
   cae en **644–684: 17 px fuera**. O sea: es real, pero **depende del reparto
   de filas**, no pasa siempre. **No es barato**: el panel lo limita
   `SteppedModal.module.scss:46` (`max-height: 92vh`) y el pie va dentro del
   área que desborda; fijar el pie o recortar el alto toca el molde que
   comparten los tres modos de esta hoja y el resto de modales de la app. Por
   eso queda aquí y no en una devolución. Antes de la tajada el desborde era
   de **348 px** medido con los mismos datos.
2. **A media tarde no se ofrece el bloque en curso** (arriba).
3. **`key={activity.id}`** sigue colisionando en `log`/`edit` y en
   `VidaPlaceInGapSheet` cuando la plantilla repite actividad. Ya lo anotó el
   constructor; sigue fuera de alcance.

**Lo que queda para prueba manual del usuario** (`/app/*` está tras el login y
los agentes no entran): abrir Hoy con sesión, pulsar «Empezar algo» y
confirmar las cinco fichas sin minutos, con el buscador y la hora a la vista;
mirar a media tarde y de noche si las cinco son las que espera; escribir
«lulu» y comprobar que sigue apareciendo; y abrir «Registrar tiempo pasado»
para ver que ahí sigue la plantilla entera con sus duraciones.

### Tajada 2 — revisión

**Verdicto: aceptada.** El criterio 631 se cumple **por la frase**, que es lo
que el constructor dice y lo que yo he vuelto a medir por mi cuenta. Ninguna
regresión. Dos hallazgos, ninguno bloqueante.

**El hallazgo que desmonta el plan: confirmado, medido por mí.** Arnés propio
(`harness-feat023r.html` + `src/harness-feat023r.tsx` + una página de
`iframe`s de ancho exacto; **los tres borrados**, `git status` limpio de
ellos), servido por el 5173 del usuario, Chromium con `navigator.language =
en-US` y `<html lang="es">`, campo en `15:54`:

```
input type="time" sin lang                        → 03:54 PM
input type="time" lang="es-ES"                    → 03:54 PM   ← NO TOMA
input type="time" lang="es-ES" dentro de div lang="en-US" → 03:54 PM
clon del campo real de la hoja (lang="es-ES")     → 03:54 PM
```

El formato lo elige el idioma del navegador, no el del elemento. El plan daba
por bueno que Chromium honraba `lang` y **no es cierto en este Chromium**.
Hallazgo 1 (no bloqueante): **el atributo no hace nada y un test lo fija**
(`criterio 631 — el campo pide 24 h al navegador`). Mi juicio: **quitarlo**, y
con él esa aserción, o re-justificarlo como semántica de idioma (`lang` sobre
contenido en español) y ponerlo **en los tres modos** — hoy solo va en `start`,
que es justo lo que delata que está ahí por el formato y no por semántica. Se
queda como deuda anotada porque el comentario del código dice la verdad
medida, no la esperada: quien venga detrás no se engaña.

**Criterios, uno a uno:**

| # | Estado | Evidencia |
|---|---|---|
| 631 — el campo se lee siempre en 24 h sin depender del sistema | **cumple por la frase; el `<input>` nativo NO se puede garantizar** | La frase la escribe el módulo con `formatTimeForDisplay` y se lee «Ahora mismo, las 15:54. Cámbialo si llevas un rato.» en el arnés, con el campo pintando «03:54 PM» justo encima. Tocada: «Empieza contando desde las 21:00…». Vacía: ninguna hora inventada (test verde). El control sigue siendo `type="time"` nativo |
| 631, en el `<input>` | **pendiente de prueba manual** | Medido que `lang` no toma en Chromium; Firefox y Safari/iOS tampoco lo honran. **La prueba final es del usuario en su iPhone.** No lo apruebo por simpatía: lo que acepto es el criterio cumplido por el texto del módulo |
| 622–630 (tajada 1) | sin tocar | `VidaHoyPage.test.tsx` no aparece en `git status`; la suite entera pasa |

**La frase, juzgada con la regla del módulo.** No afirma lo que no sabe: no
dice que el campo esté en 24 h, dice **qué hora es** la que el campo lleva —lo
único que el módulo sí sabe—. No regaña: «Cámbialo si llevas un rato» invita,
no reprocha. Con el campo vacío calla en vez de inventar «las 0:00». **El
riesgo de que se pelee con el campo es real y queda acotado:** «03:54 PM» y
«las 15:54» son el mismo instante en dos notaciones, y cada frase se ancla
explícitamente a lo que el campo tiene («Ahora mismo…», «Empieza contando
desde…»), así que se leen como una aclaración, no como dos horas. Es la mejor
red posible sin perder el selector nativo, que estaba descartado por el usuario
y por la sección 2. Quien lo cierra es el iPhone.

**Lo medido por mí (no el resumen del constructor).** Mismo arnés, `iframe` de
ancho exacto (la pestaña emula 568 px), cinco fichas, una de 53 caracteres:

```
375 px (contenido 294 px):
  frase nueva sin tocar   18 px (UNA línea) · botón «Empezar» 598–639 · desborde 3 px
  frase vieja sin tocar   18 px             · 598–639 · 3 px   ← IDÉNTICO: no empuja el pie
  redacción del plan      35 px (DOS líneas)· 616–656 · 21 px  ← +18 px, confirmado
  frase nueva tocada      35 px             · 616–656 · 21 px
  frase vieja tocada      35 px             · 616–656 · 21 px  ← IDÉNTICO
760 px: todas en una línea, sin desborde, botón dentro, scroll horizontal 0
Título sintético de 59 caracteres en las cinco fichas: la frase sigue en 18 px,
  `scrollWidth − clientWidth = 0` en las cinco, scroll horizontal 0; el alto que
  crece lo aportan las fichas, no esta tajada (desborde del panel, hallazgo 1 de
  la tajada 1, sigue fuera de alcance)
```

Mis cifras absolutas no coinciden con las suyas (598–639 y 3 px frente a
606–647 y 13 px) porque el arnés no es el mismo; **las diferencias sí**, que
es lo que se estaba afirmando: la frase nueva deja la hoja igual que la vieja
y la del plan la empeoraba 18 px. Hallazgo 2 (no bloqueante): el comentario
del código dice «325 px de contenido a 375 px de pantalla» y el dossier dice
292 px; yo mido 294. El número del comentario está mal.

**What broke nearby (cómo busqué).** `graphify query` sobre la caché y
`graphify explain "VidaActivityPicker"`, y después abriendo los ficheros:
- **Solo dos consumidores del picker**, `VidaLogSessionSheet.tsx:426` y
  `VidaPlaceInGapSheet.tsx:193`. El `key` nuevo (`suggestion.item.id`) es
  único en los dos: las sugerencias son ítems de plantilla reales, y el
  deduplicador de la tajada 1 (`vida-start-suggestions.utils.ts`) **devuelve
  los objetos originales**, no clones, así que no puede repetir `item.id`.
- **El `lang` y la frase solo entran en `start`**: el diff los condiciona a
  `mode === 'start'` y hay tests nuevos que fijan que en `log` y en `edit` el
  campo **no** lleva `lang` y no hay frase. `VidaStartTimeSheet` no aparece en
  el diff.
- **El test intocable del «▶ Empezar»**: `VidaHoyPage.test.tsx` no está en
  `git status`, ni modificado ni tocado. Verificado en el diff, no de oídas.
- **El `key`, comprobado de verdad**: monté un test temporal (ya borrado) con
  dos `<li>` de la misma clave y **React sí deja un `console.error` con «same
  key»** que el espía del test nuevo captura. Con la clave vieja los dos
  bloques de la misma actividad la compartían, así que el test nuevo **habría
  fallado**. No cambia nada visible (mismas fichas, mismo orden, mismo
  `onChange`) y el foco solo puede mejorar: claves repetidas son precisamente
  el caso en que React puede destruir y recrear el nodo enfocado.
- **Nadie pierde la caché, ejecutado y no grepeado**: `collectShapeSources('.')`
  → 32 ficheros, **ninguno de los cuatro tocados**; `isShapeSourceByPath` y
  `writesCacheByHand` dan `false` en los cuatro; `computeCacheShapeId('.')` =
  **`f8edc4f3becd`**, el mismo de siempre.
- **Líneas base, corridas enteras por mí**: `pnpm test` **2 fallos de 2165**
  (los dos de `SearchSelect`, sin `IconPicker` flaky); `pnpm lint` **14/0**;
  `pnpm build` chunk **1.149,18 kB** (+0,21) y CSS **279,35 kB** *idéntico*
  —no baja, así que no hay comentario SCSS abierto—.
- **Lo de esta semana**: FEAT-019, FEAT-020, FEAT-013, FEAT-010/2, FEAT-021,
  FEAT-022, FEAT-012/1 y FEAT-023/1 viven en suites que entran en esos 2165 y
  ninguna se ha puesto roja; el diff no sale de cuatro ficheros de Vida.

**States left unbuilt:** «sin datos» (plantilla vacía) y «texto largo» los
cubre la tajada 1 y siguen verdes; **vacío del propio campo**, cubierto y
medido (la frase no inventa hora). **Móvil 375 px**, medido arriba, sin scroll
horizontal. **Carga, error y permisos no aplican**: la frase es texto local, no
pide nada a nadie, y la hoja entera vive tras el login.

**¿Duplica algo que ya existía?** No. Reusa `formatTimeForDisplay` e
`isValidHhMm` de `vida-time.utils`, no crea control de hora propio (lo que la
sección 2 prohíbe explícitamente) y no añade ni un `.scss`.

**Verdict: accepted** — el criterio 631 está cumplido por la frase, con la
parte del `<input>` nativo declarada como pendiente del iPhone del usuario en
vez de dada por buena; no hay regresión en las cuatro puertas ni en los
vecinos del picker.
