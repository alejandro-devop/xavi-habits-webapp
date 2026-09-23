---
id: FEAT-021
title: La caché guardada caduca cuando cambia la forma de los datos
status: in-review
architect: no    # cuelga de algo que ya existe: `queryPersistBuster` en `src/app/providers/query-persist.ts:70`, que ya está cableado en `AppProviders`. No hay concepto nuevo: hay un invalidador que nunca cambia de valor
area: app/providers, shared/api
requested: 2026-09-23
updated: 2026-09-23
---

# FEAT-021 — La caché guardada caduca cuando cambia la forma de los datos

## 1. La petición — feature-analyst

**Resumen para quien venga detrás:** la caché de react-query se persiste en
`localStorage` y su invalidador (`queryPersistBuster = env.appVersion`) vale
`0.0.0` desde el primer commit, así que **nunca se ha ejecutado**: un despliegue
que cambia la forma de las respuestas hidrata datos con la forma vieja y tumba la
pantalla. La tajada 1 ata el invalidador a la **forma** de los datos —un hash de
los documentos GraphQL, la capa `*.api.ts` y el espacio de claves, calculado en
build— para que caduque cuando la forma cambia y **solo** entonces.

**Qué problema resuelve:** esta mañana, en producción, **Hoy entero se cayó** en
el iPhone del usuario con «Unexpected Application Error — undefined is not an
object (evaluating 'e.includes')» y la pantalla de React Router, sin nada
pintado. No fue un fallo de la API ni de la red: fue la caché del propio
navegador devolviendo metas guardadas **antes** del despliegue de FEAT-019, sin
el campo `activeDays` que el código nuevo da por seguro.

**Para quién es:** para cualquier usuario que ya tenga la app abierta cuando se
despliega un cambio de forma. Es decir, para el único usuario que hay, en el
único dispositivo donde vive el módulo Vida.

**Palabras del usuario:**
> «Esta mañana, en producción, **Hoy entero se cayó** en el iPhone del usuario»
>
> «existe un invalidador […] pero `VITE_APP_VERSION` vale `0.0.0` en `.env`,
> `.env.example` y `.env.local.example`, y `package.json` sigue en `0.0.0` desde
> el primer commit. Nunca cambia. **Esa protección no se ha ejecutado jamás.**»
>
> «**Lo que NO quiero:** que la solución sea "borrar la caché al arrancar
> siempre". Eso arregla el fallo matando la función.»

**Lo ya diagnosticado (no se vuelve a investigar):**

- La caché se persiste en `localStorage` bajo `REACT_QUERY_OFFLINE_CACHE`
  (`src/app/providers/AppProviders.tsx:16-25` con `PersistQueryClientProvider`,
  `src/app/providers/query-persist.ts`).
- FEAT-019 añadió `activeDays` (no nulo) a las metas. Al rehidratar metas
  anteriores al despliegue, `activeDays.includes(...)` reventó antes del primer
  pintado.
- El sitio exacto ya está taponado (commit `1887d62`: `countsOn` tolera la lista
  ausente, `src/features/vida/utils/vida-goals.utils.ts:94`). **Ese parche se
  queda.** Esta feature no lo toca ni lo deshace.
- El invalidador existe y está cableado; lo que falla es su **valor**.

**Fuera de alcance:**

- **Versionar la app de verdad** (mover `package.json` de `0.0.0`, publicar
  `VITE_APP_VERSION` por despliegue). Es una decisión de proceso del usuario, no
  de un agente, y además no arregla esto por sí sola: seguiría dependiendo de que
  alguien se acuerde.
- Deshacer o «limpiar» el parche de `countsOn`.
- Tocar el repositorio del API (`xavi-platform-node`). Hay otra sesión allí.
- Cambiar el mecanismo de persistencia (pasar a IndexedDB, dejar de persistir,
  persistir solo algunas claves). Es otra conversación.
- Añadir zod al front como validación general de respuestas. Se evalúa en el
  criterio 601 y se dice qué se hace; construirlo no está dentro salvo que
  compense, y no compensa (ver más abajo).

**Criterios de aceptación:**

- [ ] 596. Con una caché persistida escrita con la **forma vieja** (una meta sin
  `activeDays`) bajo `REACT_QUERY_OFFLINE_CACHE`, al arrancar con el código
  actual esa caché **no se hidrata**: la consulta arranca vacía, la pantalla se
  pinta en su estado de carga y **no** aparece ninguna pantalla de error.
  Demostrado rehidratando una caché fabricada a mano, **no** con un test unitario
  del `buster`.
- [ ] 597. La caché **sí** se conserva cuando la forma **no** cambió: una caché
  escrita por el mismo build (mismo invalidador y misma forma) se hidrata y los
  datos están en el primer render, sin pedirlos a la API. Esto es lo que descarta
  «borrar la caché al arrancar siempre».
- [ ] 598. Que esa misma caché de forma vieja **sí** reventaría la pantalla si el
  invalidador no hubiese cambiado: escrita con el invalidador **actual** y la
  forma vieja, aparece la pantalla de error. Es el control que demuestra que lo
  que salva el criterio 596 es el invalidador y no otra cosa.
- [ ] 599. El invalidador cambia cuando cambia la **forma** y no cuando cambia
  solo la **presentación**: al cambiar el contenido de un documento GraphQL, de
  un `*.api.ts` o del espacio de claves, el valor calculado cambia; al cambiar un
  `.module.scss`, una página o un componente, no. Medido sobre la función que lo
  calcula, y comprobado además contra los ficheros reales del repositorio (qué
  entra y qué no entra en el cálculo).
- [ ] 600. El invalidador tiene un valor en **cualquier** build —Vercel, local,
  test— sin depender de ninguna variable que Vercel pueda no exponer al cliente;
  y si el valor faltara, la app arranca igual (leer el invalidador no puede
  lanzar).
- [ ] 601. Está escrito, con argumento, si validar lo que entra con **zod** en el
  front compensa o es sobreingeniería aquí, y qué se hace en su lugar. Si no
  compensa, **no se construye**.
- [ ] 602. `maxAge` del persister y `gcTime` del `QueryClient` siguen coherentes
  entre sí a la luz de lo decidido, y está escrito por qué se dejan como están o
  por qué cambian.

**Tajadas:** (verticales, cada una usable sola)

| # | Qué hace | Criterios | Estado |
|---|---|---|---|
| 1 | El invalidador deja de ser una versión que nadie sube y pasa a ser un hash de la forma de los datos: un despliegue que cambia la forma tira la caché vieja, y uno que solo cambia la pintura la conserva | 596, 597, 598, 599, 600, 601, 602 | **accepted** (2.ª vuelta también aceptada) |
| 2 | La red de abajo: si aun así la hidratación revienta al pintar, se tira la caché y se recarga una vez en vez de dejar la pantalla de error | — (propuesta; ver «Decisiones que no son mías») | pending |

**¿Arquitecto? no** porque cuelga de algo que ya existe y está cableado:
`queryPersistBuster` (`src/app/providers/query-persist.ts:70`), consumido en
`src/app/providers/AppProviders.tsx:20`. No hay entidad nueva, ni pantalla, ni
capa que hoy no se hable con otra: cambia **de dónde sale el valor** de una
constante que ya existe.

**Decisiones que no son mías:**

1. **Versionar la app de verdad.** Si el usuario quiere que `VITE_APP_VERSION`
   signifique algo, eso se decide fuera. La tajada 1 **conserva** su aportación
   al invalidador (si algún día sube, sigue invalidando), pero no depende de
   ella. Sin respuesta: no se toca ningún `.env` ni `package.json`.
2. **La tajada 2 (la red de abajo).** Un *error boundary* en la raíz que, ante un
   fallo de render con caché persistida presente, la borra y recarga **una vez**
   por sesión. **No es validación de datos**, es recuperación. Compensa por un
   motivo concreto: el invalidador de la tajada 1 solo ve cambios del **front**,
   y en este proyecto **la API se despliega por su cuenta desde otro
   repositorio** — un cambio de forma que llegue solo del servidor no lo caza
   nadie. Coste: cualquier fallo de render de la app pasa a provocar una recarga
   (una, y solo si hay caché persistida). Es una decisión con alcance: se deja
   propuesta, no construida.

   **Reserva del revisor, para cuando esto se decida** (sección 4, «La tajada 2
   propuesta»): «borrar y recargar una vez» es **recuperación a ciegas** —no
   distingue «la caché estaba envenenada» de «hay un bug en un componente», y una
   recarga que no arregla nada solo se corta por el «una vez por sesión»—. Su
   alternativa, más estrecha y contra el mismo hueco: **validar al hidratar**, en
   el `deserialize` del persister, donde se puede descartar la caché sin recargar
   la página ni tocar el árbol de React. Hay por tanto **dos opciones sobre la
   mesa**, y la elección es del usuario.

## 2. El plan — feature-architect

*(no hubo arquitecto)*

## 3. Construcción — feature-builder

### Tajada 1 — el invalidador atado a la forma

**Resumen para el revisor:** el `buster` de la caché persistida deja de ser
`env.appVersion` (que valía `0.0.0` y no cambió nunca) y pasa a ser
`` `v${appVersion}-${hashDeLaForma}` ``, donde el hash lo calcula Vite en build a
partir del contenido de los documentos GraphQL, la capa `*.api.ts` y
`query-keys.ts`. Se demuestra con el caso real: la caché de ayer, el código de
hoy, y la pantalla de pie. **Lo que más probablemente he roto:** `AppProviders`
ya no escribe sus `persistOptions` en línea —las importa de `query-persist.ts`—,
así que si alguien tenía un test o un mock apuntando a `queryPersister` /
`queryPersistBuster` desde `AppProviders`, ahí es donde va a chillar; y el
`define` de Vite es un global nuevo (`__QUERY_CACHE_SHAPE__`) que solo existe si
el código pasa por Vite: cualquier herramienta que compile `src/` por su cuenta
(Storybook, un script de node) verá el valor de reserva.

**Qué se construyó:**

- **`vite/cache-shape.ts`** (nuevo). `isShapeSource`, `collectShapeSources` y
  `computeCacheShapeId`: recorre `src/`, se queda con los `*.graphql.ts` de
  carpetas `graphql/`, los `*.api.ts` de carpetas `api/` y
  `src/shared/api/query-keys.ts`, ordena, y hashea ruta + contenido a 12 hex.
  Sin fuentes, devuelve `sin-fuentes-<timestamp>`: falla hacia invalidar.
- **`vite/cache-shape.test.ts`** (nuevo). Sensibilidad del hash sobre un
  repositorio de mentira, y qué entra y qué no sobre los ficheros reales.
- **`vite.config.ts`**. Calcula el id al arrancar y lo inyecta como
  `define: { __QUERY_CACHE_SHAPE__ }`.
- **`tsconfig.node.json`**. `include` pasa a cubrir `vite/**/*.ts`.
- **`src/vite-env.d.ts`**. Declara `__QUERY_CACHE_SHAPE__: string | undefined`
  (`| undefined` a propósito: obliga a leerlo con red).
- **`src/app/providers/query-persist.ts`**. `QUERY_PERSIST_SHAPE_ID` (lectura con
  `typeof` y reserva `'sin-forma'`), `queryPersistBuster` nuevo, y
  `queryPersistOptions` —las opciones exactas que monta la app, extraídas aquí
  para que un test pueda montar **esa** configuración y no una copia.
- **`src/app/providers/AppProviders.tsx`**. Consume `queryPersistOptions` en vez
  de escribirlas en línea. Ningún otro cambio.
- **`src/app/providers/query-persist.hydration.test.tsx`** (nuevo). El arnés: una
  caché fabricada con `dehydrate` real, la app montada con `queryPersistOptions`,
  y un *error boundary* que hace de pantalla de React Router.

**Por qué así, y qué se descartó:**

- **Descartado: el commit del despliegue** (`VERCEL_GIT_COMMIT_SHA`). Cambia en
  cada push a `main`, así que tiraría la caché también en los despliegues que
  solo tocan estilos y se perdería el «abrir con datos al instante», que es la
  razón de persistirla. Medido sobre commits reales: con el hash de forma,
  `68dac8b` (FEAT-020, puro SCSS), `1887d62` (el parche de `countsOn`) y
  `bd8cdf1` (FEAT-013 tajada 3) **conservan la caché**, y el de commit la habría
  tirado tres veces. Además **no me apoyo en ella y por eso no hizo falta
  comprobar que Vercel la expone**: Vite solo publica al cliente las `VITE_*`, de
  modo que una variable de sistema de Vercel habría necesitado igualmente un
  puente por `define` en `vite.config.ts`, y en un build local no existiría.
- **Descartado: subir `VITE_APP_VERSION` a mano.** Es la que ya falló, y por el
  mismo motivo por el que fallaría otra vez: depende de que alguien se acuerde.
  Se conserva como primer componente del invalidador por si algún día se versiona
  de verdad, pero la protección ya no descansa en ella.
- **Descartado: borrar la caché al arrancar.** Explícitamente fuera. El criterio
  597 es la prueba de que no se hizo.
- **Por qué entra `*.api.ts` y no solo el GraphQL:** lo que se cachea no es la
  respuesta, es lo que devuelve la capa `api` después de mapearla. Un cambio de
  forma hecho solo en el mapeador sería invisible mirando los documentos.
- **Por qué NO entran los `hooks/`, `utils/` ni el SDL vendorizado de
  `graphql/schema/`:** los hooks consumen la forma, no la definen, y cambian en
  casi cada tajada de Vida —meterlos convertiría esto en un invalidador por
  build—; el SDL es copia del repositorio hermano y se recopia a mano.
  **CORREGIDO en la segunda vuelta:** «los hooks consumen la forma, no la
  definen» **es falso para dos de ellos**, que la fabrican con `setQueryData`
  (hallazgo 1 del revisor). Sigue siendo cierto que `hooks/` entero no entra,
  pero ya no por esa razón sino por una regla por contenido. Ver la entrada de la
  segunda vuelta.
- **Desviación de la implementación de referencia:** no hay ninguna. El repo no
  tenía código de build propio; `vite/` es carpeta nueva y por eso se declara
  aquí en vez de pasar por alto.

**Verificación:**

- **Criterio 596** — `src/app/providers/query-persist.hydration.test.tsx`, caso
  «una caché con la forma vieja no se hidrata»: caché sembrada con una meta
  **sin** `activeDays` y el invalidador de ayer; en pantalla queda «Cargando tu
  día…», **no** aparece «Unexpected Application Error», y
  `localStorage.getItem('REACT_QUERY_OFFLINE_CACHE')` queda a `null` (la caché
  envenenada no sobrevive al arranque). Verde.
- **Criterio 597** — mismo fichero, caso «con la misma forma la caché se
  conserva»: caché sembrada con `activeDays` y el invalidador **actual**; la
  pantalla pinta «hoy cuenta» sin que el `queryFn` (que nunca resuelve) llegue a
  hacer falta. Verde. Esto es lo que descarta «borrar siempre».
- **Criterio 598** — mismo fichero, control: forma vieja + invalidador **actual**
  → aparece «Unexpected Application Error». Verde. Es decir: el arnés sí sabe
  reproducir el fallo, y lo que lo evita en el 596 es el invalidador.
- **Criterio 599** — `vite/cache-shape.test.ts`, 9 casos verdes: cambia con el
  documento GraphQL, con el `*.api.ts`, con `query-keys.ts` y con un documento
  nuevo; **no** cambia al reescribir una página, un `.module.scss` o un test. Y
  sobre los ficheros reales: la lista contiene
  `src/features/vida/graphql/vida-goals.graphql.ts`,
  `src/features/vida/api/vida-goals.api.ts`,
  `src/features/habits/api/habits.api.ts` y `src/shared/api/query-keys.ts`, y no
  contiene nada de `/pages/`, `/components/`, `.scss`, `.test.` ni `/schema/`.
  Verificado además contra la historia de verdad, con `git archive` a un
  directorio temporal:

  ```
  17e69be «el arco solo los días que la meta cuenta» (FEAT-019, el que añadió activeDays)
    antes:   aae207567bd7
    después: b60eac114deb   → CAMBIA: aquel despliegue habría tirado la caché
  68dac8b (FEAT-020, solo SCSS)     c4e2522f5cb9 → c4e2522f5cb9   MISMO
  1887d62 (el parche de countsOn)   c4e2522f5cb9 → c4e2522f5cb9   MISMO
  bd8cdf1 (FEAT-013 tajada 3)       c4e2522f5cb9 → c4e2522f5cb9   MISMO
  ```

  Dicho de otro modo: **el despliegue que tumbó Hoy esta mañana sí habría
  caducado la caché**, y los tres despliegues siguientes la habrían conservado.
- **Criterio 600** — el valor sale del `define`, que corre en `dev`, en `build` y
  en `vitest` por igual, sin ninguna variable de entorno de por medio. Verificado
  **en el artefacto**, no en el fuente: `pnpm build` y `grep` en
  `dist/assets/index-BKbZIiBX.js` da una única ocurrencia,
  `` {persister:aT,buster:`v${Df.appVersion}-c4e2522f5cb9`,maxAge:1e3*60*60*24} ``.
  El test de ese fichero comprueba además que `queryPersistBuster` casa con
  `/^v\d+\.\d+\.\d+-[0-9a-f]{12}$/`. La red del `typeof` **no está medida**:
  con el `define` aplicado, esbuild sustituye el identificador y la rama de
  reserva desaparece del bundle; queda apoyada en que `typeof x` sobre un
  identificador no declarado no lanza en JS, que es la razón de escribirla así.
- **Criterio 601 — el veredicto sobre zod. No compensa, y además apunta a la
  puerta equivocada.** En el front **no hay zod** (cero apariciones en
  `package.json`); el que usa el repositorio es el del API. Tres razones:
  **(a) la puerta está mal elegida** — los datos que tumbaron Hoy no venían de la
  API, venían de `localStorage`; un validador en `graphqlRequest`
  (`src/shared/api/graphql-client.ts:20`, embudo único de todo GraphQL) no habría
  visto pasar ese objeto; **(b) el tamaño** — son **63 documentos** entre
  `query` y `mutation`, cada uno con su esquema a mano, duplicando un SDL que
  `src/features/vida/graphql/contracts.test.ts` ya valida contra el esquema
  vendorizado; **(c) el coste** — dependencia nueva en un chunk inicial que ya va
  por 1,14 MB, a cambio de proteger lo que ya está protegido. **Lo que se hace en
  su lugar:** nada en esta tajada, y se deja **propuesta la tajada 2**, que es la
  red que sí ataca la puerta real (recuperación al hidratar, no validación al
  recibir) y que además cubre el único hueco que este invalidador no puede cubrir
  —que la forma cambie **en el servidor**, que aquí se despliega solo, desde otro
  repositorio—. No se ha construido: es una decisión con alcance (cualquier fallo
  de render pasaría a provocar una recarga) y no es mía.
- **Criterio 602** — `maxAge` (24 h) y `gcTime` (24 h) se dejan **como estaban** y
  siguen siendo iguales. El porqué está escrito en `query-persist.ts`: subir
  `maxAge` por encima del `gcTime` hidrataría queries que la caché en memoria ya
  considera descartables. Lo que sí cambia es el papel de esas 24 h: antes la
  caché nunca caducaba por invalidador, así que el `maxAge` era el único techo;
  ahora sigue siéndolo para los despliegues que no cambian la forma, que es
  precisamente cuando la caché sobrevive. 24 h de datos de un día es lo que pide
  el módulo Vida, que es un módulo de hoy.

**Línea base (antes → después):**

| Qué | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | limpio |
| `pnpm lint` | 14 errores / 0 warnings | **14 / 0**, los mismos |
| `pnpm test` | 2 fallos de 2023 | **2 fallos de 2038** — los mismos dos de `SearchSelect`; los 15 nuevos son míos |
| `pnpm build` chunk inicial | 1.138,72 kB | **1.138,74 kB** (+0,02 kB: la plantilla del invalidador) |
| `pnpm build` CSS | 277,96 kB | **277,96 kB**, idéntico (no se tocó SCSS) |

**Lo que queda para prueba manual (no se puede comprobar desde aquí):** todo
`/app/*` está tras un login que un agente no pasa. El recorrido real es: con la
app abierta y datos ya cacheados, desplegar esta tajada y **abrir
`/app/vida/hoy` en el iPhone**; debe aparecer el estado de carga y luego los
datos, nunca la pantalla de error. Y el reverso, que es el que de verdad
importa comprobar: desplegar después algo que **no** toque la capa de datos y
confirmar que al abrir la app los datos siguen apareciendo al instante, sin
parpadeo de carga.

**Riesgos:**

- `AppProviders` ya no declara sus `persistOptions` en línea. Un test o un mock
  que apuntara ahí se rompe; no encontré ninguno, pero es el punto frágil.
- `__QUERY_CACHE_SHAPE__` solo existe si el código pasa por Vite. Con el valor de
  reserva `'sin-forma'` la app arranca, pero **sin** protección: si alguien añade
  una herramienta que compile `src/` por su cuenta, hay que llevarle el `define`.
- El invalidador solo ve cambios del **front**. Un cambio de forma que llegue del
  API sin despliegue de web no lo caza nadie hoy; es lo que cubriría la tajada 2.
  **CORREGIDO en la segunda vuelta:** se quedaba corto —tampoco veía todos los
  del front—. Lo que ve y lo que no, escrito, está en la entrada de la segunda
  vuelta y en la cabecera de `vite/cache-shape.ts`.
- En `dev`, el id se calcula al arrancar Vite: editar un `*.api.ts` no lo
  recalcula hasta reiniciar el servidor. Documentado en `vite.config.ts`.
- La primera vez que esto llegue a producción, **la caché de todos los
  navegadores caduca una vez** (el invalidador cambia de `0.0.0` a
  `v0.0.0-<hash>`). Es una apertura fría, y es lo correcto.

**Qué descubrí y no estaba en el plan:**

- Escribiendo `vite/cache-shape.ts` metí `*/graphql/` dentro de un bloque
  `/** */` y **cerré el comentario a media frase**: el resto del bloque pasó a ser
  código y Vite murió con `ReferenceError: graphql is not defined`. Es el mismo
  accidente que `ENVIRONMENT.md` documenta para SCSS, en TypeScript. Aquí sí lo
  cazó el arranque, en el acto.
- **No se ha tocado ningún `.env*` ni `package.json`.** El usuario **no tiene que
  cambiar nada en Vercel** para que esto funcione: el invalidador se calcula en
  build a partir del propio código.
- Nada para la caché de mutaciones: `dehydrate` persiste también `mutations`, y
  el mismo invalidador las cubre. No requiere trabajo aparte.

**Estado del árbol:** sin commitear.

### Tajada 1 — segunda vuelta: los puntos ciegos del hallazgo 1

**Resumen para el revisor:** la selección de ficheros deja de ser «tres rutas» y
pasa a ser **dos reglas que se aplican solas** —por ruta (todo
`src/shared/api/*.ts`, que mete tu embudo único) y por contenido (quien llame a
`setQueryData`/`setQueriesData`/`setQueryState`, que mete los dos hooks que
fabrican el objeto cacheado)—, y los tres huecos que señalaste están escritos en
la cabecera de `vite/cache-shape.ts`, incluida la sensibilidad al byte. **Lo que
más probablemente he roto:** `collectShapeSources` ahora **lee el contenido** de
los `.ts`/`.tsx` de `src/` que la regla de ruta no coge (~670 ficheros, una vez
al arrancar Vite), así que si alguien mete un fichero enorme o un binario con
extensión `.ts` ahí se nota; y `isShapeSource` **ya no existe** con ese nombre
—se partió en `isShapeSourceByPath` y `writesCacheByHand`—, cosa que solo usaba
su propio test. **No toqué nada de lo que diste por bueno:** el arnés de
hidratación, el veredicto sobre zod y `query-persist.ts` están **byte a byte**
como los revisaste.

**Qué se construyó (solo `vite/cache-shape.ts` y su test):**

- **Regla 1, por ruta.** `src/shared/api/query-keys.ts` se sustituye por **toda
  la carpeta** `src/shared/api/*.ts`. Entra `graphql-client.ts` —tu hallazgo
  1a— y entran de paso `rest-client.ts`, `api-error.ts` y `rest.types.ts`.
  **Por qué la carpeta y no el fichero:** porque el entregable que pediste es
  «que el siguiente sepa qué añadir», y la respuesta más barata de recordar es
  *no tener que acordarse de nada*. Con una lista de ficheros, el transporte
  nuevo que alguien escriba mañana se queda fuera y nadie se entera; con la
  carpeta, entra solo. El coste es que `api-error.ts` y `rest.types.ts` caducan
  la caché al cambiar sin definir forma estrictamente —son 4 ficheros que
  prácticamente no se tocan; en los cuatro despliegues medidos, ninguno—.
- **Regla 2, por contenido.** Cualquier fichero de `src/` (no test) cuyo texto
  contenga `setQueryData`, `setQueriesData` o `setQueryState` entra. Hoy son
  exactamente dos: `src/features/vida/hooks/useActivityFollowUps.ts` (el híbrido
  `{ ...open, ...data, activity: …, sessionSubtasks: … }`) y
  `src/features/settings/hooks/useUserSettings.ts` —**ojo, `settings`, no `auth`**;
  tu nota y la del coordinador dicen `src/features/auth/hooks/useUserSettings.ts`
  y ese fichero no existe—.
  **Por qué por contenido y no por lista:** es la única forma de que un hook
  entre **el día que escribe la llamada**, sin que nadie tenga que acordarse de
  tocar `cache-shape.ts`. Un hash que hay que actualizar a mano es
  `VITE_APP_VERSION=0.0.0` con otra cara, y eso lo dijiste tú antes que yo.
  Lo único que queda a mano es la lista `CACHE_WRITE_MARKERS`, y solo si
  react-query saca una vía nueva de escribir en la caché: está exportada y
  nombrada para que se vea.
- **Y `hooks/` entero sigue fuera**, como pediste. El test lo fija: sobre los
  ficheros reales, los ficheros de `/hooks/` seleccionados son **exactamente 2**.
  Si un día son 5, será porque hay 5 hooks escribiendo en la caché.
- **Documentación en la cabecera de `vite/cache-shape.ts`**, no en el dossier,
  porque es donde mira quien va a crear el fichero: las dos reglas, la respuesta
  literal a «si creas un fichero nuevo, ¿tienes que hacer algo?» (no), los tres
  **puntos ciegos que quedan** y el **coste de los falsos positivos**.

**Los puntos ciegos, ahora escritos (lo que ve y lo que no):**

| | ¿Lo caza? |
|---|---|
| Documento GraphQL, `*.api.ts`, claves | **sí** (regla 1) |
| El embudo `graphqlRequest` y el resto del transporte | **sí** (regla 1, nuevo) |
| Un hook que fabrica el objeto cacheado | **sí** (regla 2, nuevo) |
| Un hook que solo consume la forma | no, y es lo correcto |
| Forma cambiada **en el servidor** (el API se despliega solo) | **no** — sigue siendo el hueco de la tajada 2 |
| Escribir en la caché por una vía fuera de `CACHE_WRITE_MARKERS` | **no** — hay que añadirla a esa lista |
| `initialData` sembrada desde un componente | **no** |

**El coste de los falsos positivos (tu hallazgo 2), ahora documentado.** El hash
es del contenido crudo: un comentario, reordenar imports, renombrar una variable
local o **un espacio al final de `query-keys.ts`** cambian el identificador y
cuestan **una apertura fría a todo el mundo** aunque la forma sea idéntica. Tus
dos mediciones (`3cc620c3f302` y `f5148e2ad97c`) están citadas literalmente en la
cabecera del fichero, con la frase que importa: no es un defecto, es el lado
correcto en el que fallar —un falso positivo cuesta una apertura fría, un falso
negativo cuesta una pantalla en blanco—. Hay además un caso de prueba nuevo que
**fija** ese comportamiento (`el hash es sensible al byte: un espacio al final ya
lo cambia`), para que nadie lo «arregle» sin darse cuenta de lo que está
cambiando.

**Verificación:**

- **Los dos huecos, cerrados y medidos como los mediste tú** (copia de `HEAD` con
  `git archive`, tocar el fichero, recalcular con la regla nueva):

  ```
  HEAD con la regla nueva      : c354b9032f97   (32 ficheros, antes 26)
  tocando graphql-client.ts    : 22b07d3c1495   CAMBIA  (hallazgo 1a cerrado)
  tocando useActivityFollowUps : 52af0343b24f   CAMBIA  (hallazgo 1b cerrado)
  tocando VidaHoyPage.tsx      : c354b9032f97   MISMO   (sin falsos positivos nuevos)
  ```

- **La historia, vuelta a medir con la regla nueva.** La propiedad se mantiene
  entera; lo que cambia son los valores (más ficheros en el hash) y el recuento:

  ```
  17e69be  5609fae5cfe2 (30)  ->  918c5294af29 (30)  CAMBIA  (caché se tira)
  68dac8b  cc0d1c23fc92 (32)  ->  cc0d1c23fc92 (32)  MISMO   (caché sobrevive)
  1887d62  c354b9032f97 (32)  ->  c354b9032f97 (32)  MISMO
  bd8cdf1  c354b9032f97 (32)  ->  c354b9032f97 (32)  MISMO
  árbol de trabajo            ->  c354b9032f97 (32)
  ```

  El despliegue que tumbó Hoy **sigue caducando** la caché y los tres siguientes
  **siguen conservándola**. Ninguno de los seis ficheros nuevos aparece en el
  `--stat` de esos cuatro commits, que es por lo que la propiedad no se movía.
- **En el artefacto**, no en el fuente: `pnpm build` y una única ocurrencia en
  `dist/assets/index-BNPAtax8.js` →
  `` {persister:aT,buster:`v${Df.appVersion}-c354b9032f97`,maxAge:1e3*60*60*24} ``.
  `sin-forma` no aparece (0 ocurrencias).
- **`vite/cache-shape.test.ts`: 18 casos verdes** (antes 11). Los siete nuevos:
  las tres formas de escribir en la caché reconocidas, quien solo lee no; el
  embudo cambia el hash; el hook que fabrica cambia el hash; el hook que solo
  consume **no**; un hook entra **el día que escribe en la caché** sin tocar
  `cache-shape.ts`; y la sensibilidad al byte. Más las aserciones sobre ficheros
  reales: entran `graphql-client.ts`, `useActivityFollowUps.ts` y
  `useUserSettings.ts`, y los de `/hooks/` son exactamente 2.
- **No toqué lo aceptado.** `git diff --stat` de esta vuelta: solo
  `vite/cache-shape.ts`, `vite/cache-shape.test.ts` y el dossier.
  `query-persist.ts`, `query-persist.hydration.test.tsx`, `AppProviders.tsx`,
  `vite.config.ts`, `vite-env.d.ts` y `tsconfig.node.json` quedan como los
  revisaste.

**Línea base (la tuya → ahora):**

| Qué | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | limpio |
| `pnpm lint` | 14 / 0 | **14 / 0** |
| `pnpm test` | 2 fallos de 2038 | **2 fallos de 2045** — los mismos de `SearchSelect`; +7 casos míos |
| chunk inicial | 1.138,74 kB | **1.138,74 kB**, idéntico |
| CSS | 277,96 kB | **277,96 kB**, idéntico |

**Riesgos de esta vuelta:**

- **El escaneo de contenido.** `collectShapeSources` lee ahora los `.ts`/`.tsx`
  de `src/` que la regla de ruta no coge. Es una vez al arrancar Vite y no se
  nota en el build (3,20 s frente a 3,32 s de la vuelta anterior: ruido), pero es
  trabajo que antes no se hacía.
- **Falsos positivos por subcadena.** La regla 2 mira texto, no AST: un fichero
  que mencione `setQueryData` **en un comentario** entra. Falla hacia invalidar,
  que es el lado bueno, pero es una imprecisión consciente.
- **Cuatro ficheros de `src/shared/api/` entran sin definir forma estrictamente**
  (`api-error.ts`, `rest-client.ts`, `rest.types.ts` y los que vengan). Cambiarlos
  caduca la caché. Es el precio de que la carpeta entre sola.
- **El primer despliegue caduca la caché de todos igual**, y ahora además el valor
  es otro (`c354b9032f97`, no `c4e2522f5cb9`): si ya habías desplegado la primera
  vuelta, esto es una segunda apertura fría.

**No construido, a propósito:** la tajada 2 sigue sin tocar. Tu reserva sobre
«borrar y recargar una vez» frente a **validar en el `deserialize`** está copiada
a la sección 1, junto a la decisión, para que el usuario elija con las dos
opciones delante.

**Estado del árbol:** sin commitear.


## 4. Revisión — feature-reviewer

### Tajada 1 — el invalidador atado a la forma

**Veredicto: `accepted`.** Los siete criterios se cumplen con prueba, la
afirmación histórica la he repetido yo y **sale exactamente igual**, el control
del arnés **de verdad falla cuando tiene que fallar** (lo comprobé mutándolo), y
las cuatro líneas base se mantienen. Lo que me llevo como hallazgos —dos huecos
de cobertura reales del invalidador y la sensibilidad del hash— **no incumple
ningún criterio tal y como está escrito**, pero está aquí abajo y pesa para la
tajada 2.

#### La afirmación central, repetida desde cero

No me fié de la tabla: reimplementé el cálculo de `computeCacheShapeId` en un
script aparte (misma regla de selección, mismo `sha256` de ruta + contenido,
mismos 12 hex) y lo corrí sobre `git archive` de los ocho árboles. Números
idénticos a los suyos, y el recuento de ficheros de propina:

```
17e69be^  aae207567bd7 (24 ficheros)   17e69be   b60eac114deb (24)  → CAMBIA
68dac8b^  c4e2522f5cb9 (26)            68dac8b   c4e2522f5cb9 (26)  → MISMO
1887d62^  c4e2522f5cb9 (26)            1887d62   c4e2522f5cb9 (26)  → MISMO
bd8cdf1^  c4e2522f5cb9 (26)            bd8cdf1   c4e2522f5cb9 (26)  → MISMO
árbol de trabajo                       c4e2522f5cb9 (26)
```

El despliegue que tumbó Hoy **sí** habría caducado la caché; los tres siguientes
la habrían conservado. La prueba se sostiene.

#### Criterios

| # | Estado | Cómo lo comprobé |
|---|---|---|
| 596 | **cumplido** | `query-persist.hydration.test.tsx`, corrido aquí: verde. Caché de forma vieja + invalidador de ayer → «Cargando tu día…», sin pantalla de error, y `localStorage` limpio. |
| 597 | **cumplido** | Mismo fichero, verde. Con el invalidador actual y la forma nueva la caché se hidrata y pinta «hoy cuenta» sin que el `queryFn` (que nunca resuelve) haga falta. Esto es lo que descarta «borrar siempre». |
| 598 | **cumplido, y no es vacuo** | Ver abajo: copié el arnés a un fichero temporal y le cambié **solo** la forma sembrada (vieja → nueva) dejando la misma aserción; **falló** con «Unable to find… Unexpected Application Error». Es decir: la pantalla de error del 598 la provoca la forma vieja hidratada y nada más. El temporal está borrado. |
| 599 | **cumplido** | 9 casos verdes + la medición histórica de arriba. Sobre los ficheros reales: 26 entran; ninguno de `/pages/`, `/components/`, `.scss`, `.test.` ni `/schema/`. Ojo a los dos hallazgos de cobertura. |
| 600 | **cumplido, y mejor medido que en su reporte** | `dist/assets/index-BKbZIiBX.js` tiene una única ocurrencia, `` buster:`v${Df.appVersion}-c4e2522f5cb9` ``, y `sin-forma` **no aparece** en el bundle. Y lo que él dio por no medido —`dev`— lo medí: arranqué un Vite efímero en el 5199 (no toqué el 5173 del usuario) y evalué el módulo en el navegador: `{buster: 'v0.0.0-c4e2522f5cb9', shape: 'c4e2522f5cb9'}`. El `define` **sí** se aplica en dev. |
| 601 | **cumplido** | Es un veredicto escrito y con argumento. Lo juzgo abajo: se sostiene. |
| 602 | **cumplido** | `maxAge` 24 h y `gcTime` 24 h siguen iguales y el porqué está escrito en `query-persist.ts`, con el matiz nuevo (ahora las 24 h son el único techo cuando la forma no cambia). Correcto. |

#### Hallazgo 1 — falsos negativos: dos ficheros que deciden la forma y no entran

Es lo más importante que me llevo. El invalidador solo sirve si el conjunto de
ficheros cubre **todo** lo que puede cambiar la forma de lo que se guarda, y hay
dos huecos dentro del propio front (no solo el del servidor, que ya está
documentado). Los dos los medí, no los supuse: copié `HEAD` con `git archive`,
toqué el fichero y recalculé.

1. **`src/shared/api/graphql-client.ts` — el embudo único.** Toda respuesta
   GraphQL pasa por `graphqlRequest` y sale de ahí como `json.data`. Un cambio
   ahí —devolver el sobre entero, quitar `__typename`, normalizar, envolver en
   `{data, meta}`— **reforma el 100 % de lo que se cachea** y el hash **no se
   mueve**: medido, `c4e2522f5cb9` → `c4e2522f5cb9`. Es un fichero de una sola
   línea de cambio con alcance total, y el propio reporte lo llama «embudo único
   de todo GraphQL» al argumentar lo de zod: sabe que es el centro y aun así se
   queda fuera.
2. **Los `setQueryData` que escriben forma desde los hooks.**
   `src/features/vida/hooks/useActivityFollowUps.ts:109-129` no guarda la
   respuesta: **fabrica** el objeto cacheado
   (`{ ...open, ...data, activity: data.activity ?? open.activity, sessionSubtasks: … }`),
   un híbrido que no es ni lo que devuelve el documento ni lo que devuelve el
   `*.api.ts`. Lo mismo, más simple, en `useUserSettings.ts:30`. La razón escrita
   para excluir `hooks/` —«los hooks consumen la forma, no la definen»— **es
   falsa para este hook**. Medido: tocarlo deja el hash igual.

No devuelvo por esto: el criterio 599 enumera literalmente los tres sitios que
debían entrar y entran. Pero la frase del reporte «el invalidador solo ve cambios
del **front**» se queda corta: **tampoco ve todos los del front**. Lo barato
sería añadir `src/shared/api/graphql-client.ts` a `isShapeSource` (es un fichero,
cambia poco) y escribir en `cache-shape.ts` que los `setQueryData` de los hooks
son un punto ciego consciente.

#### Hallazgo 2 — falsos positivos: el hash es sensible al byte

El hash es del **contenido crudo**, así que cualquier cosa que cambie un byte de
los 26 ficheros tira la caché de todo el mundo. Medido sobre `HEAD`:

- añadir un comentario a `habits.api.ts`: `c4e2522f5cb9` → `3cc620c3f302`.
- **un solo espacio al final de `query-keys.ts`**: → `f5148e2ad97c`.

Un `pnpm format`, reordenar imports o renombrar una variable local caducan la
caché sin que la forma haya cambiado. El coste de cada falso positivo es **una
apertura fría**, que es el lado correcto en el que fallar, y el conjunto es
pequeño y estable (26 ficheros que casi nadie reformatea). Me parece un precio
razonable, pero **no está escrito en el dossier** y debería: quien vea un día la
caché caer tras un cambio cosmético merece encontrar la explicación aquí.

#### Hallazgo 3 — el arnés prueba el mecanismo, no la pantalla

`ArcoDeHoy` es una pantalla de mentira escrita para el test, no `VidaHoyPage`.
Está bien así (el criterio 596 pide rehidratar una caché fabricada, y `/app/*`
está tras el login), y reproduce el gesto exacto que reventó
(`activeDays.includes` sin red). Pero que el arnés quede verde **no** dice que
Hoy de verdad sobreviva: dice que el invalidador hace su trabajo. Esa parte se
queda en prueba manual, y está bien declarada.

#### El veredicto sobre zod (601): se sostiene

El argumento (a) es el bueno y es correcto: los datos que tumbaron Hoy salieron
de `localStorage`, no de la red; un validador en `graphqlRequest` **no los
habría visto pasar**, porque en un arranque con caché hidratada `graphqlRequest`
no llega a ejecutarse antes del primer pintado. Lo comprobé en el propio arnés:
el `queryFn` nunca resuelve y la pantalla se cae igual. Un zod en la puerta de
red solo cerraría esa puerta el día que la API cambie la forma **y** el usuario
esté online **y** la petición gane al render, que no es el caso que se investiga.
(b) y (c) son de coste y también valen, aunque son accesorios. El sitio donde zod
sí tendría sentido —validar **al hidratar**, no al recibir— no está en el
alcance, y la tajada 2 ataca el mismo hueco más barato.

#### La tajada 2 propuesta: el hueco es real, la forma es discutible

El hueco es real y lo confirmo por dos caminos distintos: el invalidador se
calcula del código del front, y la API se despliega **sola** desde
`xavi-platform-node` (`ENVIRONMENT.md`: un push a `main` de ese repo despliega y
migra). Un cambio de forma que llegue solo del servidor no lo caza nadie hoy. Y
a eso hay que sumarle el hallazgo 1: hay cambios **del front** que tampoco caza.

Sobre la forma de taparlo tengo una reserva que dejo escrita para cuando el
usuario decida: «borrar la caché y recargar una vez» convierte **cualquier**
fallo de render en una recarga, y una recarga que no arregla nada es un bucle que
solo se corta por el «una vez por sesión». Es recuperación a ciegas: no distingue
«la caché estaba envenenada» de «hay un bug en un componente». Una alternativa
más estrecha —y que ataca lo mismo— es **validar al hidratar** en vez de al
recibir: el persister ya pasa por `deserialize`, y ahí se puede descartar la
caché sin recargar la página ni tocar el árbol de React. No la construyo ni la
decido: queda apuntada junto a la propuesta.

#### Regresiones: dónde busqué

`graphify` primero (`explain "queryPersistBuster"` no devuelve nodo —el grafo es
de antes del cambio y la constante no era un nodo propio—; `query` sobre
`AppProviders`/`query-persist` sí), y después confirmando fichero a fichero:

- **Quién importa `query-persist`:** solo `AppProviders.tsx` (ahora
  `queryPersistOptions`) y `src/features/auth/hooks/useLogoutMutation.ts`, que
  importa `queryPersister` — **sigue exportado e intacto**. Sin regresión.
- **Quién importa `AppProviders`:** solo `src/main.tsx`. Nada lo mockea.
- **Lo que él señaló como «lo que más probablemente he roto»** (un test o mock
  apuntando a `queryPersistBuster`/`queryPersister` desde `AppProviders`): fui a
  mirarlo primero. `src/app/providers/query-persist.test.ts` **no se ha tocado**
  y sigue verde: persiste con su propio `buster: 'test'`, no depende del valor
  real. No hay otros.
- **El accidente del comentario a media frase:** conté `/*` contra `*/` en los
  siete ficheros tocados y salen parejos en todos (5/5, 2/2, 1/1, 6/6, 1/1, 1/1,
  5/5). No queda ningún `*/` dentro de una cadena ni de una expresión regular en
  `vite/cache-shape.ts`. Como el fichero es TypeScript, además el build lo caza:
  no es el agujero ciego del SCSS.
- **El arranque:** dev server nuevo con esta configuración arranca (439 ms, HTTP
  200) y `pnpm build` sale en verde. Hay un detalle del entorno que conviene
  saber: **el servidor del usuario en el 5173 se arrancó a las 06:10 y la
  configuración cambió a las 12:33**, así que ese proceso corre con el `vite.config.ts`
  **viejo** y su `buster` es `v0.0.0-sin-forma`. No es un fallo de la tajada —y
  de hecho demuestra en vivo que la red del `typeof` mantiene la app en pie— pero
  el usuario tiene que **reiniciar el 5173** para ver el invalidador de verdad.

#### Estados

No hay pantalla nueva, así que la mayoría no aplican: **sin datos**, **permisos**,
**texto largo** y **móvil** no tienen superficie donde fallar (cero cambios de
UI; el CSS sale idéntico, 277,96 kB). Los dos que sí aplican están cubiertos:
**carga** es exactamente lo que prueba el criterio 596, y **error** es lo que el
598 demuestra que se evita. El estado que queda sin cubrir es el que se va a la
tajada 2: **la hidratación revienta igual** (forma cambiada en el servidor).

#### Línea base verificada por mí

| Qué | Línea base | Él reporta | Yo mido |
|---|---|---|---|
| `pnpm typecheck` | limpio | limpio | **limpio** |
| `pnpm lint` | 14 / 0 | 14 / 0 | **14 errores / 0 warnings** |
| `pnpm test` | 2 fallos de 2023 | 2 de 2038 | **2 fallos de 2038**, los dos de `SearchSelect`. Sin `IconPicker` flaky esta vez |
| chunk inicial | 1.138,72 kB | 1.138,74 kB | **1.138,74 kB** |
| CSS | 277,96 kB | 277,96 kB | **277,96 kB**, idéntico |

#### Lo que queda para prueba manual

Todo `/app/*` está tras un login que un agente no pasa; lo digo sin disimulo. El
recorrido que solo puede hacer el usuario, y por este orden:

1. **Reiniciar el dev server del 5173** (el que corre ahora es de antes de este
   cambio) y abrir la app: debe cargar normal.
2. Desplegar esta tajada con la app ya abierta y datos cacheados en el iPhone, y
   abrir `/app/vida/hoy`: estado de carga y luego los datos. **Nunca** la
   pantalla de error. Esta primera vez la caché caduca para todos: es la apertura
   fría esperada.
3. El reverso, que es el que de verdad prueba que no se ha matado la función:
   desplegar después algo que **no** toque la capa de datos y confirmar que al
   abrir la app los datos aparecen al instante, sin parpadeo de carga.

#### Lo que no toqué

No modifiqué ni una línea de producto, no commiteé nada y no edité
`ENVIRONMENT.md`. El fichero temporal de la prueba de no vacuidad
(`src/app/providers/__rev-tmp-vacuidad.test.tsx`) está borrado; el Vite efímero
del 5199 está parado y el 5173 del usuario sigue arriba. `ENVIRONMENT.md` no
necesita corrección por esta tajada, salvo un detalle que el usuario decidirá si
anota: **ahora hay código de build propio en `vite/`, y sus tests corren con
`vitest` aunque estén fuera de `src/`**.

### Tajada 1 — segunda vuelta (revisión del cierre del hallazgo 1)

**Veredicto: `accepted`.** Las dos reglas cierran los dos huecos que señalé, la
historia se mantiene con los valores nuevos (la repetí entera otra vez) y **lo
que acepté en la primera vuelta está byte a byte igual**. Encontré **una forma
plausible de evadir la regla 2** y **un falso positivo con cola**; ninguno
incumple criterio y los dos están abajo.

**Que no tocó lo aceptado — comprobado, no creído.** Las mtimes lo dicen solas:
`query-persist.ts` y `AppProviders.tsx` 12:34:02, `vite-env.d.ts` 12:33:40,
`vite.config.ts` y `tsconfig.node.json` 12:33:23, el arnés 12:34:54 — todas de la
primera vuelta. Solo se movieron `vite/cache-shape.ts` (12:53), su test (12:54) y
el dossier. Y el `git diff` de los cinco versionados sigue midiendo 13/58/9/2/12
líneas, lo mismo que revisé.

**La historia, repetida con la regla nueva.** Reimplementé otra vez el cálculo
(las dos reglas, `SCANNABLE`, la exclusión de tests) y lo corrí sobre los mismos
ocho `git archive`. **Sus ocho valores, clavados:**

```
17e69be^ 5609fae5cfe2 (30)   17e69be 918c5294af29 (30)   CAMBIA
68dac8b^ cc0d1c23fc92 (32)   68dac8b cc0d1c23fc92 (32)   MISMO
1887d62^ c354b9032f97 (32)   1887d62 c354b9032f97 (32)   MISMO
bd8cdf1^ c354b9032f97 (32)   bd8cdf1 c354b9032f97 (32)   MISMO
árbol de trabajo             c354b9032f97 (32)
```

La propiedad se mantiene. Y ojo al detalle que su tabla sí dice bien y el resumen
que me llegó decía mal: **`68dac8b` vale `cc0d1c23fc92`, no `c354b9032f97`** —
conserva la caché (antes = después), pero con otro valor, porque entre medias
`77beea7` (FEAT-013 tajada 2) tocó `useActivityFollowUps.ts`. Eso es un regalo
inesperado: **la regla 2 habría caducado la caché en aquel despliegue**, que es
justamente el que cambió la forma del híbrido cacheado (la hora de inicio). Con
la regla vieja habría pasado desapercibido.

Sus tres mediciones de cierre, repetidas: tocar `graphql-client.ts` **cambia**
(yo `262a12ef67be`, él `22b07d3c1495`), tocar `useActivityFollowUps.ts` **cambia**
(yo `65686c9dff18`, él `52af0343b24f`), tocar `VidaHoyPage.tsx` **no cambia**
(`c354b9032f97`). Los valores difieren del suyo porque cada uno pegó un comentario
distinto; lo que se compara es cambia/no cambia, y coincide en los tres.

#### Hallazgo A — sí hay una evasión plausible de la regla 2, y no es rebuscada

Probé las que se me ocurrieron sobre una copia de `HEAD`. Las dos obvias **no
funcionan, y eso es bueno**: `const { setQueryData } = queryClient` y
`const { setQueryData: escribir } = queryClient` conservan el literal y entran
igual. La que sí funciona es **separar quien escribe de quien compone**:

```
fichero nuevo que FABRICA el objeto cacheado, sin mencionar ningún marcador
  → c354b9032f97 (32 ficheros)   MISMO: invisible
```

Creé `src/features/vida/hooks/compose-open-follow-up.ts` con exactamente el
híbrido que la cabecera cita como motivo de la regla 2
(`{ ...open, ...data, activity: …, sessionSubtasks: …, minutosDerivados: 0 }`) y
el hash no se movió. **Y no es hipotético en este repositorio:** las operaciones
de caché ya están factorizadas fuera de los hooks —`invalidateFollowUpQueries`
vive en `src/features/vida/utils/invalidate-vida-queries.ts`—, así que el día que
alguien haga lo mismo con la escritura (`patchOpenFollowUp(queryClient, updater)`
en un util, y el `updater` compuesto en el hook o en la página) el util entra por
el marcador y **el fichero que decide la forma se queda fuera**. Es la misma clase
de agujero que cerramos, más estrecho: ya no es «todos los hooks», es «el que
componga a distancia».

Secundaria y rebuscada, pero la dejo escrita: `(qc as any)['setQuery'+'Data'](…)`
tampoco entra (medido, `c354b9032f97`). Y hay una vía real de react-query que no
está en `CACHE_WRITE_MARKERS`: `queryClient.getQueryCache().find(...)?.setData(...)`
sobre el objeto `Query`. Hoy no se usa —`getQueryCache()` aparece solo en
`useConnectionStatus.ts` y `useRetryStatus.ts`, y ninguno escribe—, pero es una
API pública y el punto ciego que él declara («una vía fuera de los marcadores»)
tiene ya un nombre concreto que merece estar en la lista de ejemplos.

No devuelvo por esto: cerrar del todo exige AST o un lint, y el criterio 599 no lo
pide. Pero **el punto ciego 2 de su cabecera está redactado como «si react-query
saca una vía nueva», y el caso real es otro**: que la vía existente se use desde
dos ficheros y solo uno lo cante.

#### Hallazgo B — el falso positivo de la regla 2 tiene cola

Que la regla mire texto y no AST lo declara él como imprecisión consciente, y el
lado en el que falla es el bueno. Lo que no está dicho es que **no cuesta una
apertura fría, cuesta todas las siguientes**. Medido:

```
añadir a VidaHoyPage.tsx el comentario «aquí no uses setQueryData»
  → e1b4febe330b, 33 ficheros (antes 32)
```

Esa página entra en el conjunto **y se queda**: a partir de ahí, cada retoque
cosmético de `VidaHoyPage.tsx` —la página que más se toca del módulo— caduca la
caché de todo el mundo, y nada lo avisa. Un `toHaveLength(2)` sobre `/hooks/`
protege la mitad del mapa; una página no lo cazaría. Sugerencia para quien siga,
no exigencia: fijar también el **total** (hoy 32) en el test, para que un fichero
que entra sin querer salte en rojo en vez de en silencio.

#### Lo que sí queda bien cerrado

- **Regla 1.** `src/shared/api/*.ts` entero: entra `graphql-client.ts`, mi hallazgo
  1a. La decisión de meter la carpeta y no el fichero es la correcta por el
  argumento que él da —una lista es `VITE_APP_VERSION` con otra cara— y el coste
  real es nulo: los cuatro ficheros de transporte no aparecen en el `--stat` de
  ninguno de los cuatro despliegues medidos.
- **Regla 2, y su estrechez.** Hoy coge **exactamente 2** ficheros, y lo verifiqué
  contra el árbol real: los marcadores aparecen en 8 ficheros de `src/`, y **6 son
  tests** (`useVidaHistoryWindow`, `useVidaSessionActions`, `useVidaWeekFollowUps`,
  `useVidaWeekPlans`, `useActivityFollowUps.test` y mi arnés de hidratación), todos
  correctamente excluidos por `isTest`. Sin esa exclusión el conjunto sería de 38 y
  cualquier retoque de un test caducaría la caché de todos: la exclusión no es
  decorativa. De 554 ficheros no-test, 2. El número es correcto.
- **Los tres puntos ciegos declarados** están bien identificados (servidor, vía
  fuera de los marcadores, `initialData`). Añadiría dos: **`placeholderData`**,
  hermano de `initialData` y con el mismo efecto; y el matiz del hallazgo A.
- **Dónde está escrito.** La cabecera de `cache-shape.ts` es el sitio correcto
  para **quien depura** («¿por qué ha caducado la caché?»), y el rastro existe y
  funciona: `buster` → `query-persist.ts` → `vite/cache-shape.ts`. Para **quien
  crea un fichero** el argumento no se sostiene —nadie que escriba un hook abre la
  carpeta de build—, pero da igual, porque la respuesta para esa persona es «no
  tienes que hacer nada» y las dos reglas se lo garantizan. Lo que sí queda sin
  rastro es `ENVIRONMENT.md`, que es lo primero que lee un agente y no menciona
  que existe `vite/` ni que hay tests fuera de `src/`. **No lo edito: es del
  usuario.**

#### Línea base, medida por mí

| Qué | Dice | Mido |
|---|---|---|
| `pnpm test` | 2 fallos de 2045 | **2 de 2045**, los dos de `SearchSelect` |
| `pnpm lint` | 14 / 0 | **14 errores / 0 warnings** |
| chunk inicial | 1.138,74 kB | **1.138,74 kB**, idéntico |
| CSS | 277,96 kB | **277,96 kB**, idéntico |
| `vite/cache-shape.test.ts` | 18 verdes | **18 de 18** |
| buster en el artefacto | `c354b9032f97` | `` buster:`v${Df.appVersion}-c354b9032f97` `` en `dist/assets/index-BNPAtax8.js`, `sin-forma` 0 veces |

Acepto además sus dos correcciones: el segundo hook es
`src/features/settings/hooks/useUserSettings.ts` (mi nota decía solo el nombre del
fichero y el resumen le puso `auth/`, que no existe), y lo de la segunda apertura
fría es cierto y no aplica, porque la primera vuelta no se desplegó.

**Prueba manual:** la misma de la primera vuelta, sin cambios. Y sigue en pie el
aviso de entorno: **el dev server del 5173 es de antes de todo esto** (`buster` =
`v0.0.0-sin-forma`); es del usuario y no se reinicia desde aquí.

**Lo que no toqué:** ni una línea de producto, ningún commit, `ENVIRONMENT.md`
intacto. Los árboles de las pruebas viven en el scratchpad, fuera del repositorio.
