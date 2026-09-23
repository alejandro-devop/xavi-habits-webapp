---
id: FEAT-021
title: La caché guardada caduca cuando cambia la forma de los datos
status: delivered
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

**Criterios de la tajada 2** (añadidos el 2026-09-23, cuando el usuario decidió
construir la red de abajo y eligió **validar al hidratar**):

- [ ] 616. Con una caché persistida con la **forma vieja** y el **invalidador
  acertando** (mismo hash: el front no cambió, la forma cambió en el servidor),
  al arrancar la pantalla queda **de pie** en su estado de carga y no aparece
  ninguna pantalla de error. Es el caso que la tajada 1 no puede cubrir por
  diseño.
- [ ] 617. Se tira **solo** la entrada que no pasa su validación, no la caché
  entera: en la misma caché, una entrada envenenada y otra sana, la sana se
  hidrata y está en el primer pintado.
- [ ] 618. La red **no estorba**: con la forma de hoy, la caché se hidrata entera
  y no se descarta nada ni se avisa de nada.
- [ ] 619. La validación **no puede tumbar el arranque**. Con la caché ilegible,
  con una estructura que no es la esperada y con una guarda que **lanza**, la
  app arranca igual, en carga, sin propagar la excepción; y la caché que no se
  puede salvar queda **borrada** de `localStorage`.
- [ ] 620. Está escrito y defendido **qué se valida y qué no**, con la regla que
  lo decide, un ejemplo de algo que la regla deja fuera, y qué hay que hacer para
  añadir una guarda. **Sin copiar el SDL.**
- [ ] 621. El coste al abrir está **medido en milisegundos** sobre una caché
  realista, no descrito con adjetivos, y dicho aparte del coste que ya se pagaba
  (`JSON.parse`).

**Tajadas:** (verticales, cada una usable sola)

| # | Qué hace | Criterios | Estado |
|---|---|---|---|
| 1 | El invalidador deja de ser una versión que nadie sube y pasa a ser un hash de la forma de los datos: un despliegue que cambia la forma tira la caché vieja, y uno que solo cambia la pintura la conserva | 596, 597, 598, 599, 600, 601, 602 | **accepted** (2.ª vuelta también aceptada) |
| 2 | La red de abajo: se valida lo que se rehidrata y se descarta la entrada con forma inesperada, sin recargar la página | 616, 617, 618, 619, 620, 621 | **accepted** (2.ª vuelta) |

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

   **RESUELTO (2026-09-23): el usuario eligió la alternativa estrecha**, validar
   al hidratar en el `deserialize` del persister, y descartó la recarga por el
   motivo que da el revisor abajo y que hizo suyo: recargar no distingue una
   caché envenenada de un bug de componente, así que escondería fallos
   recargando encima de ellos, y un bucle de recarga en el teléfono es peor que
   la pantalla de error que se venía a evitar. La tajada 2 está construida así.

   **Reserva del revisor, que es la que decidió esto** (sección 4, «La tajada 2
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


### Tajada 2 — la red de abajo: validar lo que se rehidrata

**Resumen para el revisor:** el `deserialize` del persister deja de ser
`JSON.parse` y pasa a ser `sanitizePersistedClient`, que descarta las entradas
cuya forma no cuadra **antes** de que exista un árbol de React; cuatro guardas,
escritas a mano y no copiadas del SDL, cubren las consultas que alimentan
`/app/vida/hoy`. **CORREGIDO en la segunda vuelta:** eran cuatro y **no cubrían
todo lo que dice esta frase** —`vidaKeys.items.list()` alimenta Hoy y se recorre
sin red, y se quedó fuera—. Ahora son ocho y no se decide de memoria. Ver la
entrada de la segunda vuelta. **Lo que más probablemente he roto:** el control del **criterio
598** de la tajada 1 tuvo que **repuntarse** —el usuario lo decidió así— para
apuntar a un persister **sin** guardas; si alguien lo «arregla» enchufándolo al
de producción, queda un control que no puede fallar nunca y perdemos la vara con
la que se mide que el arnés sigue midiendo algo. Está escrito dentro del propio
test, en mayúsculas. Lo segundo: `query-persist.ts` gana ocho líneas, que es lo
mínimo para poner un `deserialize` donde se construye el persister.

**Qué se construyó:**

- **`src/app/providers/query-cache-guards.ts`** (nuevo). El registro
  `CACHE_GUARDS` (cuatro entradas), `findGuard` (comparación por **prefijo** de
  clave, para que `byDate(cualquier día)` caiga en su guarda sin listar fechas) y
  `sanitizePersistedClient`, el `deserialize`.
- **`src/app/providers/query-persist.ts`**. **Dos líneas**: el import y
  `deserialize: sanitizePersistedClient` dentro de `createAsyncStoragePersister`.
  Nada más. Lo señalo porque la instrucción era no tocar este fichero: **la
  decisión de validar en el `deserialize` obliga a tocarlo**, porque es donde se
  construye el persister. El `buster`, el `storage`, el aviso de cuota y
  `queryPersistOptions` están intactos.
- **`src/app/providers/query-cache-guards.hydration.test.tsx`** (nuevo). Nueve
  casos, en un fichero aparte que copia la forma del arnés de la tajada 1.
- **`src/app/providers/query-persist.hydration.test.tsx`** — **solo** el control
  del criterio 598, repuntado a un persister sin guardas por decisión del
  usuario. Los otros tres casos del fichero están intactos. Ver abajo.
- **`vite/cache-shape.ts` y su test** — solo las dos cosas menores que se
  pidieron de paso: `placeholderData` añadido junto a `initialData` en los puntos
  ciegos, y el **total del conjunto fijado en 32** en el test, con la razón
  escrita (un fichero que solo *mencione* un marcador en un comentario entra y se
  queda).

**Las decisiones, y por qué:**

- **Qué se valida.** La regla, escrita en la cabecera del fichero y aplicada sin
  excepciones: **lleva guarda la consulta cuya forma inesperada TUMBA una
  pantalla; la que solo la VACÍA, no.** Si al faltar un campo queda una lista
  vacía o un texto ausente, degradar ya es seguro y una guarda solo añade
  mantenimiento; si el render desreferencia `undefined` en el primer pintado
  —`activeDays.includes(...)`, `suggestion.item.days`—, la pantalla se cae
  entera. Aplicada hoy da **cuatro guardas**, las de `/app/vida/hoy`: la pantalla
  que se cayó, la que vive en el teléfono todo el día y la única cuyo dato el
  render recorre al pintar. **La prueba de que la regla no es «todo»:**
  `settingsKeys.my()` se queda **fuera** aunque también alimenta Hoy, porque
  `useVidaDayHours` lo lee entero con `?.` y cae a su respaldo de las 23:00. Y
  las guardas miran **invariantes de carga, no el tipo entero**: de
  `ActivityDayPlanItem`, que tiene 11 campos, se comprueban `id`, `startTime` y
  `endTime`. **El SDL no se copia en ningún sitio** —eso serían 63 documentos, y
  `contracts.test.ts` ya lo valida contra el esquema vendorizado—.
- **Qué se hace con lo que no valida.** Se descarta **esa entrada** y se deja que
  la consulta pida lo suyo: la pantalla se ve **en carga**, no en error, y lo que
  seguía siendo válido se hidrata igual (criterio 617, con las dos consultas a la
  vez en el mismo test). No es todo o nada. Se avisa por consola **una vez por
  arranque**, con la frase de qué se cayó si eso llegase mal.
- **Qué pasa si la validación revienta.** `sanitizePersistedClient` **no lanza
  nunca**. Una guarda que lanza se trata como una guarda que falla (try/catch por
  entrada); cualquier otro error devuelve un cliente vacío con `timestamp: 0`,
  que al ser más viejo que cualquier `maxAge` hace que `persistQueryClient` no
  solo no lo hidrate sino que **borre** la entrada de `localStorage`. Si esta
  función lanzara, cambiaríamos una caída por otra: es de lo primero que corre al
  abrir.
- **Por qué `query-cache-guards.ts` NO entra en el hash de la tajada 1** (lo
  miré, y el total sigue en 32): una guarda es un **filtro de lectura**, no un
  productor de forma. Si entrase, tocar una guarda caducaría la caché de todo el
  mundo sin que la forma de nada hubiera cambiado.

**El coste al abrir, en milisegundos.** Medido con un fichero temporal —ya
borrado— que construye cachés realistas (categorías, plantilla, hábitos, y plan +
sesiones + sugerencias por día) y compara 30 vueltas de `JSON.parse` contra
`sanitizePersistedClient`, tras calentar:

```
un día suelto            51 kB    7 entradas   JSON.parse 0,26 ms   +guardas 0,30 ms   (+0,05 ms)
una semana              145 kB   25 entradas   JSON.parse 0,88 ms   +guardas 0,87 ms   (+0,00 ms)
un mes (realista)       542 kB   88 entradas   JSON.parse 2,92 ms   +guardas 3,19 ms   (+0,27 ms)
desbocada (~1 MB)      1088 kB   88 entradas   JSON.parse 5,90 ms   +guardas 6,52 ms   (+0,62 ms)
```

El sobrecoste real es **de 0,05 a 0,62 ms**; el `JSON.parse` de debajo (0,26 a
5,90 ms) ya se pagaba antes de esta tajada. En un teléfono, con un factor de 3-5×
sobre este portátil, el añadido sigue por debajo de **3 ms** en el caso
desbocado. No hace falta cambiar el diseño. **CORREGIDO en la segunda vuelta:** aquí decía que el motivo es que «las guardas
recorren las entradas (88), no los bytes». **Eso no es lo que hace el código:**
`everyItem` llama a `every` sobre el contenido de cada entrada, así que el
trabajo es lineal en el **número de elementos** de esas listas, no en el número
de entradas — la propia tabla lo delata, entre «un mes» y «desbocada» las
entradas son las mismas y el coste sube. La conclusión («es barato») se sostiene
y está remedida abajo, incluido el caso de una entrada con 10.000 elementos; el
argumento era falso.

**Verificación (contra los criterios 616–621, uno a uno):**

- **616** — `query-cache-guards.hydration.test.tsx`, «la caché con forma vieja no
  se hidrata y la pantalla queda de pie»: caché sembrada con una meta **sin**
  `activeDays` y con **`queryPersistBuster`**, el de hoy —es decir, el caso que
  para la tajada 1 es una caché buena—. Queda «Cargando tu día…», no aparece
  «Unexpected Application Error», y se avisa una vez. Verde.
- **617** — «tira solo la entrada mala»: en la misma caché, categorías
  envenenadas y plan del día sano. Sale «agenda desde 09:00» (la sana, hidratada)
  y «Cargando tu día…» (la descartada), sin pantalla de error. Verde.
- **618** — «no estorba a la caché buena»: con la forma de hoy salen las dos,
  «hoy cuenta» y «agenda desde 09:00», y `console.warn` **no** se llama. Verde.
- **619** — tres casos verdes: caché ilegible (`{esto no es JSON`) → pantalla en
  carga y `localStorage` **vacío**; una guarda a la que se le inyecta un `throw`
  con `vi.spyOn` → no propaga, descarta esa entrada y la llamada consta;
  estructuras que no son la esperada (`null`, `[]`, `queries` que no es una
  lista) → cliente vacío con `timestamp: 0`. Verde.
- **620** — la regla, el ejemplo de lo que deja fuera (`settingsKeys.my()`) y el
  «para añadir una guarda» están en la cabecera de `query-cache-guards.ts`, que
  es donde mira quien vaya a añadir una. Y dos casos más lo fijan en el test: una
  consulta **sin guarda** pasa tal cual aunque su forma sea rara, y una entrada
  **sin datos** no se toca.
- **621** — la tabla de arriba.
- **No vacuidad, que es lo que el revisor exigió en la tajada 1.** Como el
  control del criterio 598 deja de valer (ver abajo), **traigo su prueba a esta
  capa**: un caso monta la app con el mismo persister pero con el `JSON.parse` de
  siempre —**quitando solo las guardas**— y la misma caché envenenada **sí**
  tumba la pantalla. Lo que la mantiene de pie arriba es la red, no un descuido
  del test.

**El choque con el criterio 598: resuelto repuntando el control.** El criterio
598 dice que con el invalidador actual y la forma vieja «aparece la pantalla de
error». Era el **control de no vacuidad** de la tajada 1 y era correcto entonces;
la tajada 2 hace que ese escenario ya no pueda ocurrir, que es su objetivo. El
usuario decidió **repuntarlo, no jubilarlo**, y el motivo queda escrito porque es
el que importa: **ese test no afirma que la app se caiga, afirma que el arnés
reproduce el fallo**. Es la vara con la que el revisor comprobó —mutándolo— que
el criterio 596 no es vacuo. Jubilarlo porque ahora pasa por otra razón nos
dejaría sin forma de saber si el arnés sigue midiendo algo.

Repuntado dice **lo mismo que decía**, nombrando qué red está probando: «con la
forma vieja y **sin la red de la tajada 2**, la pantalla se cae». El cambio en
`src/app/providers/query-persist.hydration.test.tsx` es un
`persisterSinGuardas` (mismo almacenamiento, el `JSON.parse` de siempre),
`montarLaApp` con parámetro opcional, y ese único caso montándose con él. Con un
aviso dentro del fichero, en mayúsculas, de **no enchufarlo al persister de
producción**: las guardas impedirían la caída y quedaría un control que no puede
fallar nunca —seguiría verde el día que el arnés dejara de medir nada—. Que la
app de verdad no se cae en ese escenario es del criterio 616, en el fichero de
esta tajada.

**Y sigue sin ser vacuo, comprobado como lo comprobó el revisor:** copié el
fichero repuntado a un temporal, cambié **solo** la forma sembrada (vieja →
nueva) dejando la misma aserción, y **falla** con «Unable to find… Unexpected
Application Error». El temporal está borrado. El control puede fallar, luego mide
algo.

**Con eso, en esta tajada no queda ningún fallo nuevo:** la suite vuelve a **2
fallos de 2054**, los dos de `SearchSelect`, medido entero.

**Línea base (la del coordinador → ahora):**

| Qué | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | limpio |
| `pnpm lint` | 14 / 0 | **14 / 0** |
| `pnpm test` | 2 fallos de 2045 | **2 fallos de 2054** — solo los dos de `SearchSelect`. +9 casos míos, y el control del 598 repuntado y verde |
| chunk inicial | 1.138,74 kB | **1.140,54 kB** (+1,80 kB: el módulo de guardas) |
| CSS | 277,96 kB | **277,96 kB**, idéntico |
| invalidador en `dist/` | `v${appVersion}-c354b9032f97` | **el mismo** |

Ese último renglón importa: **esta tajada no cambia el invalidador**, porque
`src/app/providers/` no está en el conjunto de la tajada 1. Desplegarla **no**
provoca una apertura fría; la caché de todo el mundo se conserva y simplemente
pasa a validarse.

**Riesgos:**

- **El control del criterio 598 repuntado.** Es el sitio frágil: apunta a un
  persister sin guardas a propósito, y enchufarlo al de producción lo convierte
  en un control que no puede fallar nunca. El aviso está dentro del fichero.
- **`query-persist.ts` tocado**, que estaba en la lista de no tocar: ocho líneas
  añadidas, ninguna borrada, y es lo mínimo para poner un `deserialize` donde se
  construye el persister.
- **Una guarda demasiado estricta tira caché buena en silencio.** El síntoma
  sería un parpadeo de carga al abrir, no un error, y queda el `console.warn`
  para verlo. Las cuatro guardas comprueban lo mínimo justamente por esto.
- **Una guarda demasiado laxa no tapa nada.** Sigue habiendo campos que el
  render podría desreferenciar y que no se miran; la regla dice cuáles se miran y
  por qué, y ampliar una guarda es una línea.
- **Lo que no tiene guarda sigue sin red**, y es la mayor parte de la caché
  (hábitos, plantilla, catálogo de actividades, ajustes). Es deliberado: son
  consultas que al degradar se vacían. Si mañana una pantalla de hábitos empieza
  a desreferenciar sin red, hay que añadir su guarda.
- **El aviso es uno por arranque**, no uno por entrada: si se descartan varias
  entradas por motivos distintos, solo se ve la primera.

**Lo que queda para prueba manual** (todo `/app/*` está tras el login):

1. Abrir la app con datos ya cacheados: **debe abrir igual que antes**, con los
   datos al instante. El invalidador no cambia, así que no hay apertura fría.
2. El caso que esto viene a tapar solo se ve de verdad **cuando el API cambie la
   forma de una respuesta sin que se despliegue el front**: entonces Hoy tiene
   que quedarse en carga y recuperarse sola, en vez de caerse. No se puede
   provocar desde aquí sin tocar el repositorio del API.
3. Mirar la consola del teléfono buscando `[query-persist]` tras un despliegue
   del API: si aparece, la red actuó y ahí está qué descartó.

**Estado del árbol:** sin commitear.


### Tajada 2 — segunda vuelta: el contraejemplo y la guarda que tiraba caché buena

**Resumen para el revisor:** las dos devoluciones están arregladas en
`CACHE_GUARDS` —guarda nueva para `vidaKeys.items.list` y la de `followUps`
partida en cuatro, una por forma— y, para que el contraejemplo no pueda repetirse
por olvido, la cobertura deja de decidirse de memoria: un test recorre `vidaKeys`
y **falla** si aparece una clave que no esté ni guardada ni en
`SIN_GUARDA_A_PROPOSITO` con su motivo. **Lo que más probablemente he roto:** las
guardas pasan de 4 a 8 y una de ellas, la de `items.list`, se dispara sobre la
entrada más grande de la caché (la plantilla entera), así que si su predicado se
quedara corto el síntoma sería un parpadeo de carga en Plantilla al abrir; y el
test de cobertura **construye claves llamando a las fábricas de `vidaKeys` con
argumentos de mentira**, de modo que una fábrica que valide sus argumentos lo
rompería.

**Devolución 1 — el contraejemplo `vidaKeys.items.list()`. Arreglado.**

Tenías razón, y la ironía también: mi guarda de `suggestions` ya valida
`Array.isArray(suggestion.item.days)` **por este mismo motivo**, y el mismo
`VidaItem` entraba por otra clave sin guarda. Guarda nueva:

```ts
keyPrefix: [...vidaKeys.items.all(), 'list'],
porQue: 'la plantilla y los avisos recorren `item.days` sin red',
isValid: (data) => everyItem(data, (item) => hasString(item, 'id') && Array.isArray(item.days)),
```

**Apliqué la regla a la lista que señalaste, y sale que una guarda basta.** Busqué
todas las desreferencias sin red de arrays en el módulo
(`.days|.activeDays|.followUps|.sessionSubtasks` seguidas de
`includes|map|filter|length|some|every|reduce|sort|find`) y salen **13 sitios,
todos sobre `.days` de `VidaItem`**: `vida-template.utils.ts` (5),
`vida-patterns.utils.ts` (5), `vida-build-day.utils.ts` (1),
`vida-week-review.utils.ts` (2), más `VidaPlantillaPage`, `VidaTemplateAddPanel` y
`VidaTemplateRemoveDialog`. Todos comen del **mismo** `VidaItem[]`, que llega por
`items.list` o por `suggestions`. Así que tu lista no pide guardas nuevas: pide
**esta** guarda, y con ella queda cubierta entera. **No metí guardas a todo por
susto:** las claves de Vida que siguen sin guarda están abajo, con su motivo.

**Devolución 2 — la guarda de `followUps` tiraba caché buena. Arreglada.**

Partida en cuatro, una por forma, porque el problema no era el predicado sino el
prefijo:

| Clave | Forma | Guarda |
|---|---|---|
| `followUps.open()` | `ActivityFollowUp \| null` | objeto con `id`+`startTime`, **o `null`** (sin sesión abierta es legítimo) |
| `followUps.day(d)` | `ActivityFollowUp[]` | `id`+`startTime` por elemento |
| `followUps.range(f,t)` | `{ date, followUps[] }[]` | **`date` + `followUps` lista** |
| `followUps.byActivity(id,n)` | `ActivityFollowUpNoteRow[]` | `id`+`startTime` por elemento |

Y la lección queda escrita como regla en la cabecera del fichero —**«una guarda,
una forma»**— con un test que la hace cumplir: **ninguna guarda puede ser prefijo
de otra**. Ese test es el que impide que alguien vuelva a «simplificar» esto a un
prefijo ancho.

**Tu caso exacto, fijado en el test:** `range.isValid([{date, followUps:[…]}])`
→ `true`, y la guarda de `day` sobre ese mismo dato → `false`, que es lo que
pasaba antes. Y el criterio 618 ahora **siembra las cuatro formas legítimas** —
tenías razón en que no lo veía porque no sembraba `range`—: se hidratan las
cuatro y `console.warn` no se llama ni una vez.

**Cómo evito que la próxima consulta se quede fuera por olvido.** Es la parte que
más me importa de esta vuelta, porque el contraejemplo no fue mala suerte: fue
que la cobertura se decidía mirando una pantalla y apuntando lo que se veía.
`query-cache-guards.coverage.test.ts` recorre **`vidaKeys`** —la única fuente de
claves del módulo—, descubre cada hoja llamando a su fábrica (se saltan `all` y
`byActivityAll`, que son prefijos de invalidación, no consultas) y exige que cada
clave esté **guardada** o en **`SIN_GUARDA_A_PROPOSITO`** con un motivo escrito.
Una consulta nueva pone el test en rojo hasta que alguien decida cuál de las dos
cosas es. Es la misma idea que la regla por contenido de la tajada 1. También
comprueba lo inverso: que no quede una exclusión apuntando a una clave que ya no
existe, ni una clave a la vez guardada y excluida.

**Alcance del automatismo: `vidaKeys`.** Es el módulo que se cayó, el que vive en
el teléfono y el que está en construcción, o sea donde van a aparecer las
consultas nuevas. `habitKeys`, `settingsKeys` y `authKeys` quedan fuera a
propósito. **Corregido tras el hallazgo B de la revisión:** el motivo no es que
degraden a vacío —es falso, `HabitDetailPage:197` pasa `weekView.days` a un
`days.map(...)` sin red—, sino **riesgo residual aceptado**: son superficies
estables y el módulo que se cayó es Vida. `habitKeys.weekView` es el primer
candidato si se amplía, y ampliarlo es
**una línea** en la constante `FABRICAS`, y lo digo aquí para que sea una
decisión y no un descuido.

**Las claves de Vida que siguen sin guarda, con su motivo** (en
`SIN_GUARDA_A_PROPOSITO`, no en un comentario): `activities.list` y
`activities.detail` —el catálogo se pinta como tarjetas y **ningún campo suyo
aparece en la búsqueda de desreferencias sin red**: al degradar se vacía—,
`categories.detail` —quien recorre `goal.activeDays` es el arco, que va por
`categories.list`— e `items.takenToday` —solo dice si un ítem ya se tomó; al
degradar no se marca ninguno—.

**Y un fallo que cazó el test nuevo nada más escribirlo**, que es la mejor prueba
de que sirve: mi primera versión de la guarda puso
`keyPrefix: vidaKeys.items.list()`, que devuelve `['vida','items','list',false]`
**con el argumento dentro**, así que `list(true)` se quedaba sin guarda. Ahora es
`[...vidaKeys.items.all(), 'list']` y hay un caso que comprueba las dos variantes.

**Devolución 3 — la frase del coste. Corregida, y remedida.**

Tienes razón: `everyItem` recorre los **elementos** de cada lista, así que el
trabajo es lineal en el tamaño del dato, no en el número de entradas. Corregí la
frase en la entrada de la primera vuelta y añadí el caso que responde a tu
pregunta —«¿y si un día hay una entrada enorme?»—, ya con ocho guardas:

```
un día suelto                 53 kB    8 entradas   JSON.parse  0,30 ms   +guardas  0,36 ms   (+0,06)
una semana                   180 kB   26 entradas   JSON.parse  1,05 ms   +guardas  1,00 ms   (+0,00)
un mes (realista)            731 kB   89 entradas   JSON.parse  3,88 ms   +guardas  4,17 ms   (+0,29)
desbocada (~2,3 MB)         2321 kB   89 entradas   JSON.parse 12,18 ms   +guardas 12,50 ms   (+0,33)
una lista de 10.000 ítems   3187 kB    8 entradas   JSON.parse 25,68 ms   +guardas 26,09 ms   (+0,41)
```

El último renglón es el tuyo: **8 entradas** y una lista de 10.000 elementos.
Sobrecoste **0,41 ms** frente a un `JSON.parse` de 25,68 ms que ya se pagaba.
Lineal en el tamaño del dato, sí, pero con una constante ~60× menor que la del
parseo que obligatoriamente lo precede.

**También recogido:** `clientState.mutations` se valida ahora como `queries` —la
línea que sugeriste—; sin ella, un `mutations` que no fuese lista reventaba
dentro de `hydrate()`, fuera de esta función.

**Verificación:**

- `src/app/providers/` entero: **37 casos verdes** (antes 17). Los nuevos: 18 del
  test de cobertura (las 12 claves de Vida, «una guarda, una forma», y los de
  `items.list`) y dos del arnés (el 618 ampliado con las cuatro formas, y el ítem
  sin `days` que ya no tumba Hoy).
- **No vacuidad de la guarda nueva**, con el mismo método de la tajada 1: un caso
  monta la misma caché envenenada **sin las guardas** y la pantalla **sí** se cae.

**Línea base (la del coordinador → ahora):**

| Qué | Línea base | Ahora |
|---|---|---|
| `pnpm typecheck` | limpio | limpio |
| `pnpm lint` | 14 / 0 | **14 / 0** |
| `pnpm test` | 2 fallos de 2054 | **2 fallos de 2074** — solo los dos de `SearchSelect`. +20 casos míos |
| chunk inicial | 1.140,54 kB | **1.141,22 kB** (+0,68 kB: cuatro guardas más y la lista de motivos) |
| CSS | 277,96 kB | **277,96 kB**, idéntico |
| invalidador en `dist/` | `c354b9032f97` | **`c354b9032f97`**, el desplegado. **Sigue sin provocar apertura fría** |

**Lo que no toqué**, por si acorta la revisión: el control del 598 repuntado,
`query-persist.ts` (sigue en +8/0 respecto a lo desplegado), `AppProviders.tsx`,
`vite.config.ts` y `vite/cache-shape.ts`. En esta vuelta solo cambian
`query-cache-guards.ts`, sus dos tests y el dossier.

**Riesgos de esta vuelta:**

- **La guarda de `items.list` se aplica a la entrada más grande de la caché.** Si
  su predicado se quedara corto, el síntoma sería un parpadeo de carga en
  Plantilla y un aviso en consola. Comprueba lo mínimo (`id`, y que `days` sea
  lista) justamente por eso.
- **El test de cobertura llama a las fábricas de `vidaKeys` con argumentos de
  mentira** (`'x'`). Si algún día una fábrica valida sus argumentos, el test
  reventaría por un motivo que no es el suyo.
- **El automatismo solo mira `vidaKeys`.** Hábitos y ajustes siguen decidiéndose a
  mano, es decir, siguen pudiendo olvidarse.
- **Ocho guardas es más superficie de falso positivo que cuatro.** Las cuatro de
  `followUps` están contrastadas contra los tipos y contra el caso real de `range`.

**Lo que queda para prueba manual** (todo `/app/*` sigue tras el login):

1. Abrir la app con datos cacheados: igual que antes, datos al instante, **sin
   apertura fría** (el invalidador no cambia).
2. **La comprobación de la devolución 2, que se ve desde la app**: abrir Revisión,
   recargar y mirar la consola. Hoy sale «Se descartó una entrada de la caché con
   una forma inesperada» sin que nada haya cambiado en el API; con esta vuelta
   **no debe salir nada**.
3. Abrir Plantilla y Hoy y confirmar que la plantilla aparece al instante, sin
   parpadeo de carga: es la entrada que estrena guarda.

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

### Tajada 2 — la red de abajo

**Veredicto: `returned`.** La forma de la solución es la correcta —validar al
rehidratar, por entrada, sin recargar— y el arranque no se puede tumbar. La
devuelvo por dos cosas concretas y medidas, las dos dentro de lo que la propia
tajada dice cubrir:

1. **Hay contraejemplo de la regla, y cae en `/app/vida/hoy`.** Una consulta
   persistida **sin guarda** cuya forma inesperada **tumba** la pantalla que esto
   viene a proteger.
2. **Una guarda descarta datos legítimos.** La de `followUps` rechaza el **100 %**
   de las entradas buenas de `followUps.range()`, que es caché sana tirada en
   silencio en cada arranque.

Ninguna de las dos es de estilo y ninguna se arregla en el reporte: hay que tocar
`CACHE_GUARDS`.

#### Devolución 1 — el contraejemplo: `vidaKeys.items.list()`

La cadena, entera y comprobable:

```
VidaHoyPage.tsx:19          → <VidaTemplateAside/>
VidaTemplateAside.tsx:248   → useVidaItemsQuery()      → vidaKeys.items.list(false)   SIN GUARDA
VidaTemplateAside.tsx:258   → templateItemsForDate(itemsQuery.data ?? [], tomorrow)
vida-build-day.utils.ts:80  → items.filter((item) => item.days.includes(day))         SIN RED
```

Es **el mismo gesto que tumbó Hoy el 2026-09-23**, con otro campo: allí
`goal.activeDays.includes(...)`, aquí `item.days.includes(...)`. Si el servidor
deja de mandar `days` —o lo renombra, que es justo el hueco que esta tajada
existe para tapar—, `/app/vida/hoy` se cae entera en el primer pintado y la red
no se entera. Medido con un test temporal (borrado):

- `findGuard(vidaKeys.items.list())` → **`undefined`**; `findGuard(vidaKeys.items.suggestions(d))` → definida.
- `templateItemsForDate([{ id, activityId, isActive, startTime }], '2026-09-24')` → **lanza**.
- `sanitizePersistedClient(...)` con esa entrada → la deja pasar, `queries.length === 1`.

Lo que hace esto una devolución y no un hallazgo es que **el dossier afirma lo
contrario**: «cubren las consultas que alimentan `/app/vida/hoy`» y «la única
cuyo dato el render **recorre** en el primer pintado». `items.list` alimenta Hoy
y su dato se recorre. La guarda de `suggestions` valida
`Array.isArray(suggestion.item.days)` **precisamente porque `item.days` se
desreferencia sin red** — y el mismo `VidaItem`, con el mismo campo, entra por
otra clave sin guarda. La regla («la que tumba lleva, la que vacía no») es buena;
está **aplicada de forma incompleta**.

Y el mismo `item.days.includes(...)` sin red aparece en
`vida-patterns.utils.ts:784,859,861` (los avisos de Hoy) y en
`vida-template.utils.ts:191,406,745,1279,1300` (la Plantilla). Al revisar el
alcance conviene mirar los dos: la cuenta de «cuatro guardas» puede quedarse en
cuatro si `items.list` cubre la mayoría, pero hay que decidirlo habiéndolo mirado.

#### Devolución 2 — la guarda de `followUps` tira caché buena

`keyPrefix: vidaKeys.followUps.all()` cubre a propósito `day`, `open`, `range` y
`byActivity`. Pero bajo ese prefijo **no viven tres formas iguales**:

| Clave | Lo que devuelve la API | ¿Pasa la guarda? |
|---|---|---|
| `followUps.open()` | `ActivityFollowUp \| null` | sí |
| `followUps.day(d)` | `ActivityFollowUp[]` | sí |
| `followUps.byActivity(id,n)` | `ActivityFollowUpNoteRow[]` (`id`, `date`, `startTime`, `notes`) | sí, de milagro |
| **`followUps.range(f,t)`** | **`ActivityFollowUpsDateGroup[]` = `{ date, followUps[] }`** | **NO: ni `id` ni `startTime`** |

Medido: `guard.isValid([{ date: '2026-09-22', followUps: [{ id: 'f-1', startTime: '09:00' }] }])`
→ **`false`**. O sea: en **cada arranque**, una respuesta perfectamente legítima
de `followUps.range` se descarta, se avisa por consola de una «forma inesperada»
que no lo es, y la pantalla que la usa —Revisión, `VidaRevisionPage.tsx:1027` y
`useVidaHistoryWindow.ts:92`— vuelve a pedirlo. Es exactamente lo que la tajada 1
se esforzó en **no** hacer: tirar caché sana. Con el añadido de que el aviso
miente y mandará a alguien a buscar un bug del API que no existe.

El arreglo no es grande —una rama más en el predicado, o partir la guarda de
`range` con su propio prefijo—, pero es código y no lo escribo yo.

#### Lo que sí está bien, y lo doy por comprobado

- **El arranque no se puede tumbar (punto 4).** Revisado camino a camino:
  `JSON.parse` dentro del `try`; `clientState`/`queries` validados antes de
  usarlos; `guard.isValid` con su **propio** `try` que trata «guarda que revienta»
  como «guarda que falla»; y `catch` final que devuelve `CLIENTE_VACIO`. El
  `timestamp: 0` hace lo que dice: queda más viejo que cualquier `maxAge`, así que
  `persistQueryClient` no lo hidrata **y borra** la entrada. Y el único hueco que
  encontré —`clientState.mutations` **no** se valida, así que un `mutations` que
  no fuera array reventaría dentro de `hydrate()`, ya **fuera** de esta función—
  tampoco deja la app peor: `PersistQueryClientProvider.js:31` envuelve el restore
  en `.catch(...)` y sigue sin caché. Aun así, validar `mutations` como se valida
  `queries` sería coherente y cuesta una línea.
- **Degradar deja la pantalla en carga y es por entrada (punto 3).** El filtro es
  `queries.filter(...)`: lo sano del mismo arranque se hidrata igual. Su test con
  dos consultas a la vez lo fija y pasa. Correcto.
- **Las guardas no se pasan de listas con el resto de formas (punto 2).**
  Contrastadas contra los tipos, no contra el dossier:
  `ActivityDayPlanItem.startTime/endTime` son `string` no nulos,
  `VidaItem.days` es `VidaDayOfWeek[]`, `ActivityFollowUp.startTime` es `string`.
  Una respuesta legítima **no** falla esas tres. La excepción es la devolución 2.
  Bien resuelto además que una entrada sin `state.data` se deje pasar en vez de
  descartarse.
- **El control del 598 sigue sin ser vacuo — lo comprobé yo, otra vez.** Copié el
  fichero cambiando **solo** la forma sembrada (vieja → nueva) y el control
  **falló** («Unable to find… Unexpected Application Error»). Con
  `persisterSinGuardas` sigue midiendo lo que dice medir. El aviso de «no lo
  enchufes al de producción» está pegado a la definición del persister, que es
  donde lo va a leer quien lo toque, y explica **por qué** (un control que no
  puede fallar nunca). Bien puesto.
- **`settingsKeys.my()` fuera es correcto**: `useVidaDayHours` lo lee con `?.` y
  cae a su respaldo. Es un buen ejemplo de la regla y está bien elegido.
- **No tocó la tajada 1 desplegada.** `git status` no tiene `AppProviders.tsx` ni
  `vite.config.ts`. `query-persist.ts`: **+8 líneas, 0 borradas**, solo el `import`
  y la clave `deserialize`; `buster`, `storage`, el aviso de cuota y
  `queryPersistOptions` intactos. `cache-shape.ts`: solo la cabecera (`placeholderData`
  añadido a los puntos ciegos). `cache-shape.test.ts`: +7 (el total fijado en 32).
  Las dos menores que se pidieron, y nada más.
- **El invalidador en `dist/` no cambia:** `` buster:`v${Df.appVersion}-c354b9032f97` ``,
  el mismo que hay desplegado. **Confirmado: desplegar esto no provoca apertura
  fría.**

#### El coste (punto 5): la conclusión vale, el argumento no

«Las guardas recorren **entradas** (88), no bytes» **no es lo que hace el
código**: `everyItem` llama a `Array.prototype.every` sobre el contenido de cada
entrada guardada, así que el trabajo es lineal en el **número de elementos** de
esas listas, no en el número de entradas. Hoy da igual —listas de un día, y cada
elemento son tres comprobaciones de tipo— y por eso el número medido es creíble.
Pero la respuesta a «¿sigue siendo lineal en entradas si un día hay una entrada
enorme?» es **no**: una entrada con 10.000 elementos se recorre entera. Sigue
siendo lineal en el tamaño del dato y varias veces más barato que el `JSON.parse`
que ya se pagaba —la conclusión «es barato» se sostiene—, pero la frase del
dossier describe mal el mecanismo y conviene corregirla antes de que alguien la
use para decidir.

#### Línea base (sin cambios que reprochar)

| Qué | Dice | Mido |
|---|---|---|
| `pnpm lint` | 14 / 0 | **14 / 0** |
| chunk inicial | 1.138,74 → 1.140,54 kB | **1.140,54 kB** |
| CSS | 277,96 kB | **277,96 kB**, idéntico |
| buster en `dist/` | no cambia | **`c354b9032f97`**, el desplegado |

#### Lo que quedaría para prueba manual (cuando vuelva)

Todo `/app/*` sigue tras el login. El recorrido del usuario: con Hoy abierta y
datos cacheados, desplegar y abrir `/app/vida/hoy` — los datos deben seguir
apareciendo **al instante** (el invalidador no cambia, así que la caché se
conserva), y la consola no debe decir nada. La devolución 2 se ve desde la propia
app: abrir Revisión, recargar, y mirar si en consola sale «Se descartó una entrada
de la caché con una forma inesperada» **sin que nada haya cambiado en el API** —
hoy sale.

**Lo que no toqué:** ni una línea de producto, ningún commit, `ENVIRONMENT.md`
intacto, el 5173 del usuario sin tocar. Los dos ficheros temporales de prueba
(`__rev-tmp-contraejemplo.test.ts` y `__rev-tmp-598.test.tsx`) están borrados.

#### Los criterios, uno a uno

| # | Estado | Cómo lo comprobé |
|---|---|---|
| 616 | **cumplido en el caso que prueba, incompleto como propiedad** | `query-cache-guards.hydration.test.tsx` verde: forma vieja + invalidador acertando → «Cargando tu día…», sin pantalla de error. Pero la devolución 1 es el mismo escenario con otra consulta y ahí la pantalla **sí** se cae. El criterio habla de «la pantalla», no de «una consulta». |
| 617 | **cumplido** | Su test con dos consultas a la vez: la envenenada se va, la sana está en el primer pintado. Verde, y el mecanismo es un `queries.filter(...)`, por entrada de verdad. |
| 618 | **NO cumplido** | «Con la forma de hoy, la caché se hidrata entera y **no se descarta nada ni se avisa de nada**». Con la forma de hoy, una entrada legítima de `followUps.range()` **se descarta y se avisa**: `guard.isValid([{date,followUps:[…]}])` → `false`, medido. Su test no lo ve porque no siembra esa clave. Es la devolución 2. |
| 619 | **cumplido** | Caché ilegible, estructura inesperada y guarda que lanza: los tres tratados, `CLIENTE_VACIO` con `timestamp: 0` que además **borra**. Repasado camino a camino. Único hueco, sin consecuencia: `mutations` no se valida, pero el restore está envuelto en `.catch` por la librería. |
| 620 | **cumplido** | La regla está escrita, defendida, con el ejemplo de lo que deja fuera (`settingsKeys.my()`) y con el cómo añadir una guarda. Sin copiar el SDL. Que la regla esté **mal aplicada** (devolución 1) no es este criterio: es el 616. |
| 621 | **cumplido** | Medido en milisegundos, con tabla por tamaño y separado del `JSON.parse`. Detalle que su propia tabla delata: entre «un mes» y «desbocada» las **entradas son las mismas 88** y el sobrecoste pasa de 0,27 a 0,62 ms — o sea que escala con los **bytes**, no con las entradas, que es justo lo que digo arriba. |

### Tajada 2 — segunda vuelta (las dos devoluciones)

**Veredicto: `accepted`.** Las dos devoluciones están cerradas y lo comprobé
sembrando yo los datos, no leyendo sus tests. El criterio 618, que era el que se
incumplía, ahora se cumple. Lo que me llevo son **hallazgos sobre el test de
cobertura y sobre el alcance**, ninguno de devolución.

**Alcance de la vuelta, comprobado.** `git status` no tiene `AppProviders.tsx` ni
`vite.config.ts`, y las mtimes dicen el resto: `query-persist.ts` 13:28,
`query-persist.hydration.test.tsx` **13:37** (el control del 598, intacto) y
`vite/cache-shape.ts` 13:31 son de la vuelta anterior; lo único de esta vuelta es
`query-cache-guards.ts` (13:52) y sus dos tests. El `--stat` sigue midiendo
`query-persist.ts` +8/-0 y `cache-shape.ts` +9. Nada de lo desplegado se movió.

#### Devolución 1 — cerrada, y el «todas» se sostiene

`vidaKeys.items.list` estrena guarda (`id` + `days` lista) y cubre las **dos**
variantes de la clave (`list(false)` y `list(true)`; el comentario cuenta que el
prefijo con el `false` dentro se le coló y lo cazó el test de cobertura — buena
señal del test, no mala del código). Mi cadena original ya no se cae, medido por
mí: sembrando `items.list` con un ítem **sin `days`**, `sanitizePersistedClient`
lo descarta (`queries.length === 0`) y `templateItemsForDate` no llega a verlo —y
sigue lanzando si se le da a mano, que es por lo que hacía falta la guarda.

Verifiqué el **«todas»**, que es lo que sostiene «con una guarda basta». Busqué
cada `.days` de `src/` sin `?.` y las clasifiqué:

- **`VidaItem.days`** — `vida-build-day.utils.ts:80`, `vida-template.utils.ts`
  (191, 406, 745, 1279, 1300), `vida-patterns.utils.ts` (784, 859, 861),
  `VidaTemplateAddPanel:219`, `VidaTemplateRemoveDialog:60` y
  `suggestion.item.days`. **Todas** comen de `items.list` o de `suggestions`, y
  las dos llevan guarda ahora.
- **`habit.days`** (una docena en hábitos) — es un **número**, no una lista:
  `habit.days > 0` o `${habit.days}` con el campo ausente da `false` o `NaN`, **no
  lanza**. No es el mismo caso y está bien no contarlo.
- **`history.days` / `input.days`** (`useVidaPatterns:250`,
  `vida-week-review.utils.ts:267`) — objetos que **construye el propio hook**, no
  dato de consulta. Correcto dejarlos fuera.

Además: `Activity` **no tiene** `days`, no hay ninguna desestructuración
`const { days } = …` sobre dato de consulta, y los consumidores del catálogo leen
`activitiesQuery.data?.activities ?? []`, con red. El «todas» se sostiene.

#### Devolución 2 — cerrada, y el criterio 618 lo comprobé sembrando yo

La guarda única está partida en cuatro, una por forma, y **mi caso exacto pasa**:
`range.isValid([{ date, followUps: [...] }])` → **`true`**, y esos mismos grupos
**no** se cuelan por la guarda de `day` (→ `false`). Las cuatro claves de
`followUps` caen cada una en su guarda (cuatro distintas, no una repetida).

Para el **618** no leí su test: sembré yo una caché con **trece entradas
legítimas** cubriendo las ocho formas guardadas —incluidas `goal: null`,
`followUps.open()` a `null`, `items.list(true)` con `days: []` y una lista vacía—
más dos claves excluidas (`takenToday`, `activities.list`). Resultado:
`queries.length` intacto (13 de 13) y **`console.warn` no se llamó ni una vez**.
Con la forma de hoy no se descarta nada ni se avisa de nada. **618 cumplido.**

**Y la lección convertida en regla no es vacua.** Comprobado mutando la entrada,
no el test: reañadí al registro una guarda con el prefijo ancho de antes
(`followUps.all()`) y la comprobación de «ninguna guarda es prefijo de otra»
**la caza**; sobre el registro real da cero solapes. El test mide lo que dice.

#### Hallazgo A — el test de cobertura tiene tres formas de no ver una consulta

Es un buen mecanismo y es la respuesta correcta a «cómo evito el olvido»: recorre
`vidaKeys` y exige decisión escrita para cada hoja. Pero **descubre por
convención**, y hay tres maneras de quedarse fuera sin que nadie se entere. Las
dos primeras las medí:

1. **Una hoja cuyo nombre acabe en `All`.** `descubrirClaves` salta
   `nombre.endsWith('All')` para esquivar los prefijos de invalidación, así que
   una clave nueva llamada `listAll`, `weekAll` o `pendingAll` sería **invisible**
   y además no tendría guarda. Es una trampa de nombre, y en este repositorio ya
   existe el nombre (`byActivityAll`).
2. **Una hoja escrita como array `const` en vez de función** —`hoy: ['vida','hoy'] as const`—
   no es `typeof 'function'` y el recorrido la salta en silencio.
3. **Una clave inline, construida fuera de la fábrica.** El recorrido solo ve lo
   que cuelga de `vidaKeys`; una consulta con `queryKey: [...vidaKeys.all, 'algo']`
   escrita en el hook no existe para el test. **Y no es hipotético: ese patrón ya
   se usa** en `src/features/habits/hooks/useHabitFollowUps.ts:22-38`, cuatro
   veces.

Nada de esto rompe lo construido y ninguna es motivo de devolución —el mecanismo
cubre el caso que falló y es mucho mejor que la memoria—, pero las tres merecen
estar escritas junto al test, que es donde mira quien añada una consulta.

#### Hallazgo B — el motivo por el que `habitKeys` queda fuera está mal escrito

Que el alcance sea `vidaKeys` **me parece correcto ahora**: es el módulo que se
cayó, el que vive en el teléfono y donde aparecen las consultas nuevas; meter
`habitKeys` no es «una línea» sino una decisión por cada clave, y esta tajada no
es el sitio. Lo que no se sostiene es **el motivo escrito**: «son superficies
estables y **sus pantallas degradan a vacío**». No todas. `HabitDetailPage:197`
pasa `weekView.days` a un hijo que hace `days.map(...)`
(`HabitWeekGrid`, `HabitDayRow:239-240`), sin red: si el servidor dejara de mandar
ese campo, la semana de un hábito se cae igual que se cayó Hoy. Es exactamente la
clase de frase general que produjo la devolución anterior. Lo honesto es dejarlo
escrito como **riesgo residual aceptado**, con `habitKeys.weekView` nombrado como
el primer candidato del día que se amplíe.

#### El coste, ya bien contado

La frase está corregida y el caso nuevo es el que pedí: **8 entradas y una lista
de 10.000 elementos → +0,41 ms** sobre un `JSON.parse` de 25,68 ms. Es coherente
con lo estructural: el trabajo es lineal en **elementos**, no en entradas, pero
cada elemento son dos o tres comprobaciones de tipo, así que siempre sale una
fracción pequeña del `JSON.parse` que va debajo y que hay que pagar igual. Bien
resuelto.

#### Lo demás, repasado

- **Las cuatro exclusiones deliberadas están bien justificadas.** `activities.list`
  y `activities.detail`: los consumidores leen con `?.` y `?? []` (comprobado en
  `VidaTemplateAddPanel:146`, `VidaActivityPicker:106`, `VidaPlantillaPage:340`).
  `categories.detail`: quien recorre `goal.activeDays` es `categories.list`, que sí
  lleva guarda. `items.takenToday`: es un booleano de marcado. Ninguna es un
  «tumba pantalla» disfrazado.
- **Sigue sin validarse `clientState.mutations`** como se valida `queries`. Sin
  consecuencia —el restore está envuelto en `.catch` por la librería— pero es la
  misma línea que ya señalé y sigue pendiente. Finding, no devolución.
- **Criterios:** 616, 617, **618** (era la devolución), 619, 620 y 621,
  **cumplidos**. 33 casos verdes en los tres ficheros de pruebas de la caché.

#### Línea base, medida por mí

| Qué | Dice | Mido |
|---|---|---|
| `pnpm lint` | 14 / 0 | **14 / 0** |
| chunk inicial | 1.140,54 → 1.141,22 kB | **1.141,22 kB** |
| CSS | 277,96 kB | **277,96 kB**, idéntico |
| buster en `dist/` | `c354b9032f97`, sin apertura fría | **`` buster:`v${Of.appVersion}-c354b9032f97` ``**, el mismo desplegado. **Confirmado.** |

#### Lo que queda para prueba manual

Todo `/app/*` sigue tras el login y un agente no entra. Del usuario:

1. Desplegar y abrir `/app/vida/hoy` con datos ya cacheados: **los datos tienen
   que seguir apareciendo al instante**, sin parpadeo de carga. El invalidador no
   cambia, así que la caché de todos se conserva: si hay apertura fría, algo va
   mal.
2. **La que se ve desde la propia app:** abrir `/app/vida/revision`, recargar y
   mirar la consola. **Tiene que callar.** Si sale «Se descartó una entrada de la
   caché con una forma inesperada» sin que el API haya cambiado, es la devolución
   2 sin cerrar. Desde aquí ya no sale.
3. El día que el API cambie de forma de verdad: la pantalla tiene que quedarse
   **en carga** y volver a pedir los datos, nunca en la pantalla de error.

**Lo que no toqué:** ni una línea de producto, ningún commit, `ENVIRONMENT.md`
intacto y el 5173 del usuario sin reiniciar. Los ficheros temporales de prueba
están borrados.
