---
id: FEAT-026
title: Las categorías de hábitos eligen color en la paleta, como todo lo demás
status: building
architect: no    # tercera vez del mismo patrón resuelto: ColorPicker compartido + sorteo; ver sección 1
area: features/habits
requested: 2026-09-28
updated: 2026-09-28
---

# FEAT-026 — Las categorías de hábitos eligen color en la paleta, como todo lo demás

## 1. The request — feature-analyst

**Summary for whoever's next:** las dos pantallas donde nace o se edita una
categoría de hábitos dejan la rueda de color del sistema y el campo de hex, y
pasan al `ColorPicker` compartido de 22 muestras, con un color del núcleo ya
marcado al crear que no repite el de otra categoría. **Tajada 1:** la pantalla
Categorías (`/app/habits/categories`, crear y editar). **Tajada 2:** el paso
«+ nueva categoría» dentro del asistente de crear hábito.

**What problem it solves:**

Elegir el color de una categoría de hábitos es hoy lo único del producto que
todavía abre el diálogo de color del sistema operativo (16 millones de opciones,
distinto en cada plataforma, hostil en móvil, fuera del lenguaje Aura), y en
dos de sus tres caminos **lo que se ve no es lo que se guarda**. Medido leyendo
el código el 2026-09-28:

- **Paso «+ nueva categoría» del asistente**
  (`src/features/habits/components/CreateHabitCategoryStep/CreateHabitCategoryStep.tsx`):
  el estado del color empieza en `null` (`:22`), la rueda pinta `#6366f1`
  (`:80`) y, si no se toca, la categoría se crea **sin color** (`:35` envía
  `color: null`). Es exactamente la «mentira visual» que el BACKLOG describía
  para los hábitos antes de la fase 9 (`docs/remodel/BACKLOG.md:39`).
- **Crear desde la pantalla Categorías**
  (`HabitCategoriesPage.tsx:47-50` → `habit-category-form.utils.ts:16`): el valor
  por defecto es `#6366f1` **de verdad**, así que se guarda índigo. Ese hex
  **no está en la paleta de 22** (`src/shared/ui/ColorPicker/color-palette.ts`,
  0 coincidencias): toda categoría creada así, sin tocar el color, es hoy una
  categoría con color de fuera de la paleta.
- **Editar una categoría** (`HabitCategoriesPage.tsx:52-55` →
  `habit-category-form.utils.ts:26`): si la categoría no tiene color, el
  formulario enseña `#6366f1` y **guardar le escribe índigo**, aunque solo se
  haya cambiado el nombre. Editar le inventa un color.
- En los dos formularios hay además un campo de texto para escribir el hex a
  mano (`HabitCategoryForm.tsx:97-102`, `CreateHabitCategoryStep.tsx:85-90`);
  vaciarlo es hoy la única forma de dejar una categoría sin color
  (`habit-category-form.utils.ts:56`).
- **Ninguno de los cuatro ficheros tiene tests** (`CreateHabitCategoryStep`,
  `HabitCategoryForm`, `HabitCategoriesPage`, `habit-category-form.utils`):
  0 coincidencias en `src/**/*.test.*`.

El color de la categoría se ve después en el acento de la lista de Categorías
(`HabitCategoriesPage.tsx:133`) y en las fichas del filtro de Mis hábitos
(`HabitCategoryFilter.tsx:41,70`). Una categoría creada desde el asistente sin
tocar la rueda sale ahí **sin color**, cuando al crearla se le vio índigo.

La fase 9 del rediseño (`docs/remodel/08-color-inicial-habito.spec.md`) quitó la
rueda solo de los hábitos, que era su alcance; FEAT-017 tajada 3 hizo lo mismo
para las categorías de Vida. Esto cierra la deuda anotada en
`docs/remodel/BACKLOG.md:29`.

**Who it's for:** quien organiza sus hábitos en categorías: al crear un hábito
nuevo y necesitar una categoría que aún no existe (asistente, paso «+ nueva
categoría»), y al ordenar o retocar sus categorías en Ajustes → Categorías.

**User's words:** no hay cita literal del usuario en el encargo. Lo que llegó,
por boca de quien me invoca: el usuario «aceptó hoy esta recomendación: que las
categorías de hábitos usen la paleta compartida de colores en lugar de la rueda
nativa del navegador». La recomendación viene de la deuda de
`docs/remodel/BACKLOG.md:29` («La rueda de color del sistema sigue en las
categorías (`CreateHabitCategoryStep`, `HabitCategoryForm`). La fase 9 la quitó
solo de los hábitos, que era su alcance.»). **El sorteo del color inicial lo
añade el encargo, no el usuario**: ver D-A.

**Out of scope:**

- **Recolorear las categorías que ya existen.** Las que hoy tienen `#6366f1`
  (todas las creadas desde la pantalla sin tocar el color) u otro hex de fuera
  de la paleta **conservan su color**: el `ColorPicker` las enseña como «Color
  actual» al principio de la fila (`ColorPicker.tsx:41-51`) y así se quedan hasta
  que alguien elija otra muestra. Pasarlas a un color de la paleta sería una
  migración de datos y otra conversación.
- **Escribir un hex exacto.** El campo de texto desaparece con la rueda. Ya lo
  decidió la fase 9 para los hábitos: «La rueda del sistema no vuelve. Si alguien
  quiere un color exacto, esa es otra fase y otra conversación»
  (`08-color-inicial-habito.spec.md:47`).
- **Dejar una categoría sin color a propósito.** Hoy se consigue vaciando el
  campo de hex; el `ColorPicker` no tiene opción «sin color»
  (`onChange: (hex: string) => void`, `ColorPicker.tsx:9`). Las categorías que
  ya no tienen color siguen sin él (criterio 8); lo que se pierde es poder
  quitárselo a una que lo tiene. Ver D-B.
- **El color de los hábitos**, **las categorías de Vida** y **el `ColorPicker`
  mismo**: ya están hechos y no se tocan. Tampoco la plantilla de hábito
  «Escribir», que lleva `#6366f1` (`habit-templates.ts:104`): es color de
  hábito, no de categoría.
- **Los demás campos** de la categoría (nombre, descripción, icono, orden) y
  dónde se ve el color después (lista de Categorías, fichas del filtro): igual
  que hoy.
- **Sortear al editar.** Editar nunca elige un color por nadie.

**Acceptance criteria:**

*Tajada 1 — pantalla Categorías (`/app/habits/categories`), crear y editar:*

- [ ] 1. Abriendo el formulario de crear y el de editar, no hay ningún
  `input[type="color"]` ni campo de texto para el hex. En su lugar hay un
  `role="radiogroup"` con las 22 muestras de la paleta (23 si la categoría trae
  un color de fuera), cada una con su nombre en español como `aria-label`, y el
  grupo tiene un nombre accesible que dice que es el color de la categoría.
- [ ] 2. Crear desde la pantalla con al menos una categoría de hábitos existente
  deja **una muestra ya marcada** (`aria-checked="true"`), y es una de las 6 del
  núcleo que **ninguna** categoría de hábitos del usuario usa hoy.
- [ ] 3. Con las 6 del núcleo ya usadas por categorías, el color marcado es el
  que menos categorías tienen (empate → cualquiera de los empatados). Sin
  ninguna categoría, cualquiera de los 6.
- [ ] 4. El sorteo mira **los colores de las categorías de hábitos**, no los de
  los hábitos ni los de las categorías de Vida. Comprobable: con hábitos que usan
  los 6 del núcleo y ninguna categoría, el sorteo puede dar cualquiera de los 6.
- [ ] 5. El color marcado no cambia mientras se escribe el nombre, la
  descripción o el orden, ni al elegir icono: se decide una vez al abrir el
  formulario.
- [ ] 6. Elegir otra muestra la sustituye sin aviso, y guardar envía **ese** hex.
  Tras guardar, el acento de la categoría en la lista de Categorías y su ficha
  en el filtro de Mis hábitos muestran ese color.
- [ ] 7. Editar una categoría con un color **de fuera de la paleta** (p. ej.
  `#6366f1`, el antiguo valor por defecto) la enseña marcada como «Color actual»
  al principio de la fila, y guardar sin tocar el color envía **exactamente el
  mismo hex** — ni otro color, ni `null`.
- [ ] 8. Editar una categoría **sin color** no marca ninguna muestra, y guardar
  sin tocar el color envía `color: null`. Hoy le escribe `#6366f1`; eso deja de
  pasar.
- [ ] 9. Editar no sortea nada: una categoría con color del núcleo se abre con
  ese color marcado, sea cual sea el de las demás.
- [ ] 10. Si se abre «crear» antes de que la lista de categorías haya llegado,
  el color **no** se sortea sobre una lista vacía: o se espera a la lista, o no
  se puede abrir crear hasta que llegue. Lo que no vale es sortear sobre cero y
  repetir color.
- [ ] 11. Mientras se guarda, el grupo de muestras está deshabilitado, como el
  resto del formulario hoy (`HabitCategoryForm.tsx:94`).
- [ ] 12. Con el formulario en un `iframe` de **375 px** y de **760 px** de
  ancho (no la pestaña, que emula 568: ver `ENVIRONMENT.md`), no hay scroll
  horizontal con 23 muestras (22 + «Color actual») y el botón de guardar sigue
  alcanzable. Se mide en crear y en editar-con-color-de-fuera.
- [ ] 13. El grupo se recorre con flechas, Inicio y Fin, y entrar en él cuesta
  un tabulador, no veintidós.

*Tajada 2 — el paso «+ nueva categoría» del asistente de crear hábito:*

- [ ] 14. En el paso (`CreateHabitCategoryStep`, apilado desde
  `HabitFormStepButtons.tsx:35`), no hay `input[type="color"]` ni campo de hex;
  hay el mismo `radiogroup` de 22 muestras, y al abrirlo con la lista de
  categorías ya cargada hay una muestra marcada que cumple 2, 3 y 4.
- [ ] 15. **Lo que se ve marcado es lo que se guarda:** crear la categoría sin
  tocar el color envía el hex de la muestra marcada, no `null`. (Hoy se ve
  índigo y se guarda sin color.)
- [ ] 16. Elegir otra muestra la sustituye y es la que se envía; escribir el
  nombre o elegir el icono no la cambia (como 5 y 6).
- [ ] 17. **Montaje en frío:** si el paso se abre antes de que la lista de
  categorías haya llegado, no hay ninguna muestra marcada hasta que llega; al
  llegar se marca una, **una sola vez**, y no salta después de un color a otro.
  Probado con la lista llegando después del montaje, no solo con datos síncronos.
- [ ] 18. El nombre sugerido que trae el paso (`initialName`, desde una
  plantilla) sigue apareciendo relleno, y al crear la categoría queda
  seleccionada en el hábito como hoy (`onCreated`).

*Transversal a las dos:*

- [ ] 19. Al cerrar la tajada 2, `input[type="color"]` no aparece en ningún
  fichero de `src/features/habits/` (búsqueda con 0 resultados).
- [ ] 20. Hay tests donde hoy no hay ninguno: del sorteo (si nace función
  propia) con generador fijo, al estilo de `habit-colors.test.ts:138-219`, y de
  los componentes para 2, 7, 8, 15 y 17 como mínimo.
- [ ] 21. `pnpm typecheck` limpio; `pnpm lint` y `pnpm test` **no peores** que la
  línea base de `ENVIRONMENT.md` (14/0; 2 fallos preexistentes, 3 en sábado o con
  el flaky de `IconPicker`); `pnpm build` limpio. Si el CSS baja (es esperable:
  salen las reglas de la rueda, `.colorSwatch`, `.colorInputs`, `.colorPicker`),
  se demuestra comparando **listas de selectores** de `HEAD` y del árbol con
  `sass --style=compressed`, no solo el tamaño.

**Slices:**
| # | What it does | State |
|---|---|---|
| 1 | Pantalla Categorías: crear y editar con el `ColorPicker`; crear nace con un color del núcleo que no repite; editar enseña el que hay (de la paleta, de fuera o ninguno) y no lo cambia | accepted |
| 2 | Asistente de crear hábito, paso «+ nueva categoría»: mismo `ColorPicker`, color ya marcado que es el que se guarda, y a prueba de montaje en frío | pending |

La tajada 1 va primero porque es la que más gente toca para ajustar colores y
porque estrena el sorteo en el sitio sin trampa de montaje (se puede decidir al
pulsar «crear»). La 2 reutiliza ese sorteo y añade el pestillo.

**Architect? no** because es la tercera repetición de un patrón ya resuelto dos
veces, sin concepto nuevo ni capa nueva:

- El control: `src/shared/ui/ColorPicker/ColorPicker.tsx` (ya maneja `null` sin
  marcar y el color de fuera como «Color actual», `:38-51`).
- El sorteo: `pickInitialHabitColor` en `src/features/habits/data/habit-colors.ts:44-65`.
- La implementación de referencia, formulario tonto: `src/features/vida/components/VidaCategoryForm/VidaCategoryForm.tsx:91-99`.
- La implementación de referencia, paso apilado con pestillo:
  `src/features/vida/components/CreateVidaCategoryStep/CreateVidaCategoryStep.tsx:68-83`
  y su razonamiento en `FEAT-017-vida-mas-iconos-y-colores.md:939-966`.
- Donde se cuelga: `HabitCategoryForm.tsx:83-104`,
  `CreateHabitCategoryStep.tsx:71-92`, `habit-category-form.utils.ts:11-29` y
  `HabitCategoriesPage.tsx:47-55`.

No toca `graphql/`, `api/` ni `setQueryData`: no tira la caché de nadie
(`vite/cache-shape.ts`, mismo razonamiento que FEAT-017).

**¿Hace falta render aprobado? No**, por la misma razón que FEAT-017 tajada 3
(`FEAT-017:566-570`): el control que entra es el `ColorPicker` que ya está
aprobado y en uso en cuatro sitios (`HabitWizardStep1.tsx:118`,
`HabitEditForm.tsx:305`, `VidaCategoryForm.tsx:93`, `CreateVidaCategoryStep.tsx:145`),
con la etiqueta «Color» encima como en `VidaCategoryForm`. Cero píxeles nuevos
en el control. Lo único que cambia de forma es que la fila de color pasa de una
línea (rueda + campo) a dos o tres de muestras, y el formulario crece hacia
abajo; eso no se decide con un render sino midiendo (criterio 12). Si el usuario
quiere verlo antes, el formulario de categoría de Vida es el mismo aspecto.

**Hipótesis marcadas (no son decisiones mías; son para quien construye):**

- *Hipótesis — dónde vive el sorteo:* en hábitos. Es dominio de hábitos (mira
  categorías de hábitos) y el precedente escrito es que el sorteo no sube a
  `shared/` (`color-palette.ts:10-13`, `FEAT-017:502-503`).
- *Hipótesis — ¿reutilizar `pickInitialHabitColor` o gemelo?* Reutilizar el
  algoritmo, no copiarlo por tercera vez. El motivo del gemelo en Vida era la
  **frontera de módulo** (Vida no importa dominio de hábitos); aquí no hay
  frontera: es el mismo módulo, y la lista «en uso» es un **parámetro**, así que
  pasarle los colores de las categorías no comparte la lista de los hábitos
  (criterio 4 se cumple igual). Lo que sí conviene es que la llamada se lea bien:
  un nombre propio (`pickInitialHabitCategoryColor`) en `habit-colors.ts` que
  delegue en el de hábitos, en vez de llamar a «el color del hábito» para una
  categoría. Consecuencia aceptada: si un día cambian las reglas del sorteo de
  hábitos, cambian también las de categorías. Si quien construye prefiere
  gemelo, que lo diga en la sección 3 con su porqué.
- *Hipótesis — tajada 1, dónde sortear:* al pulsar «crear»
  (`openCreate`, `HabitCategoriesPage.tsx:47-50`), que es un manejador de
  evento: sin estado ajustado en el render y sin la trampa del linter. **Ojo:**
  en ese fichero la lista se lee como `data: categories = []` (`:30`), que
  confunde «aún no ha llegado» con «no hay ninguna»; el criterio 10 existe por
  eso.
- *Hipótesis — tajada 2, cómo sortear:* el pestillo en el propio estado
  (`{ decided, value }`, ajuste de estado durante el render) de
  `CreateVidaCategoryStep.tsx:68-83`. Es la única salida que deja el linter en
  14/0 (`ENVIRONMENT.md`, fila «Linter»): `useRef` leído en el render y
  `setState` en un `useEffect` suben la línea base. El
  `useState(() => sorteo)` de `HabitCreateWizard` **no** vale: el paso se apila
  y en frío la lista puede no haber llegado. Y la misma trampa de `= []`: el
  pestillo tiene que distinguir `data === undefined` de lista vacía.
- *Hipótesis — mocks:* el paso estrenaría `useHabitCategoriesQuery` (lo exporta
  `hooks/useHabitCategories.ts:14`, que el paso ya importa en `:2`). Las suites
  que mockean ese módulo y montan el asistente pueden quedar **verdes por
  casualidad** sin listar el hook nuevo — la misma trampa que `ENVIRONMENT.md`
  documenta para `useActivityCategories`. Buscarlas y completarlas.
- *Observación:* el mensaje «El color debe ser un hex válido»
  (`habit-category-form.utils.ts:35-37`) deja de poder dispararse desde la
  pantalla. Qué hacer con él es técnico.

**Decisions that aren't mine:**

- **D-A — ¿Una categoría nueva nace con un color sorteado, o sin color?** El
  usuario pidió la paleta; el sorteo lo añade el encargo. Algo hay que decidir,
  porque el valor de hoy (`#6366f1`) no está en la paleta y una categoría recién
  creada aparecería con una muestra «Color actual» que nadie eligió.
  - *(a) Sorteado entre los 6 del núcleo, sin repetir el de otra categoría*
    (lo que describen los criterios 2-5, 10, 14-17). Igual que los hábitos y las
    categorías de Vida; crear sigue costando una acción, y dos categorías nuevas
    se distinguen solas en el filtro. **Recomendado.**
  - *(b) Sin color: ninguna muestra marcada.* Más simple (sin sorteo ni
    pestillo), pero quien no elija crea categorías sin color, que es justo lo
    que hoy pasa en el asistente a escondidas; y en la pantalla sería peor que
    hoy, que al menos guarda índigo.
  - **No bloquea:** la sección se escribe con (a). Si el usuario elige (b), se
    caen 2-5, 10 y 17, y 15 pasa a «sin tocar, se envía `null`».
- **D-B — Perder la opción de quitarle el color a una categoría.** Hoy se hace
  vaciando el campo de hex; con la paleta no hay forma.
  - *(a) Aceptarlo*, como ya pasa con hábitos y categorías de Vida. Las que no
    tienen color siguen sin él (criterio 8). **Recomendado.**
  - *(b) Añadir una muestra «sin color» al `ColorPicker`.* Toca `shared/ui` y
    cambia también los formularios de hábitos y de Vida: es otra feature, no una
    tajada de esta.
  - **No bloquea:** se escribe con (a).
- **Resuelto por precedente — escribir un hex exacto:** no vuelve
  (`08-color-inicial-habito.spec.md:47`).
- **Resuelto por el encargo — categorías con color de fuera de la paleta:** se
  enseñan y no se les cambia el color (criterio 7).

## 2. The plan — feature-architect

*(sin arquitecto: ver «Architect? no» en la sección 1)*

## 3. Construction — feature-builder

### Tajada 1

**Resumen para el revisor:** la pantalla Categorías (`/app/habits/categories`)
elige el color de crear y editar con el `ColorPicker` compartido; crear sortea al
pulsar con `pickInitialHabitCategoryColor` (nuevo, delega en `pickInitialHabitColor`)
sobre los colores de las categorías, y editar ya no le inventa `#6366f1` a nadie.
**Lo que más probablemente rompí:** «Nueva categoría» ahora está deshabilitado
mientras `data === undefined` —también si la carga falla y no hay caché—, y el
vacío «No hay categorías todavía» ya no sale antes de que llegue la lista; y
`validateCategoryForm` **dejó de validar el color** (ver «Por qué así»).

**Decisiones D-A y D-B, pendientes de que las confirme el usuario.** No estaban
contestadas y el encargo me pidió construir con la recomendada de cada una:
- **D-A → (a), sortear.** Una categoría nueva nace con un color del núcleo que
  no repite el de otra categoría de hábitos. Si el usuario elige (b), sin color:
  en `openCreate` se deja de llamar al sorteo y se pasa `null` a
  `defaultCategoryFormValues` (una línea), y caen los tests de los criterios 2, 3
  y 10 de `HabitCategoriesPage.test.tsx`.
- **D-B → (a), se acepta.** Desde el formulario ya no se le puede quitar el color
  a una categoría que lo tiene (el campo de hex, que era la única forma, se fue).
  Las que no tienen color siguen sin él al editar (criterio 8, probado).

**Lo que se hizo:**
- `src/features/habits/data/habit-colors.ts` — `pickInitialHabitCategoryColor(categoryColors, random)`,
  que delega en `pickInitialHabitColor`. Nombre propio para que la llamada se
  lea bien; mismo algoritmo, como proponía la hipótesis del analista.
- `src/features/habits/utils/habit-category-form.utils.ts` —
  `defaultCategoryFormValues(orderIndex, color = null)`: el color lo trae quien
  llama, ya no `#6366f1`. `categoryToFormValues` pasa `category.color` tal cual
  (de la paleta, de fuera o `null`). `validateCategoryForm` ya no mira el color y
  se va `HEX_COLOR_PATTERN`.
- `src/features/habits/components/HabitCategoryForm/HabitCategoryForm.tsx` — el
  `FormField` con `input type="color"` + campo de hex pasa a ser la etiqueta «Color» y
  `<ColorPicker label="Color de la categoría" disabled={loading}>`, igual que
  `VidaCategoryForm.tsx:91-99`. Se quita `!error.includes('color')` del aviso general
  (ya no hay error de color).
- `HabitCategoryForm.module.scss` — fuera `.colorPicker` (y su `:disabled`);
  `.colorRow` pasa a columna y entra `.colorLabel`, copiados de
  `VidaCategoryForm.module.scss`; `min-width: 0` en `.form`, como allí.
- `src/features/habits/pages/HabitCategoriesPage.tsx` — `data: categories` **sin**
  `= []`; `categoriesArrived = categories !== undefined`. `openCreate` sale sin
  hacer nada si la lista no ha llegado, y si ha llegado sortea sobre ella y abre.
  «Nueva categoría» pasa de `disabled={isLoading}` a `disabled={!categoriesArrived}`, y el
  estado vacío (con «Crear la primera categoría») de `!isLoading && …` a
  `categoriesArrived && …`.
- Tests nuevos: `HabitCategoriesPage.test.tsx` (9), `HabitCategoryForm.test.tsx` (7),
  `habit-category-form.utils.test.ts` (8) y 5 casos más en `habit-colors.test.ts`.

**Por qué así:**
- *Sorteo en `openCreate` y no en el render:* es un manejador de evento, así que
  «una sola vez» sale gratis y el linter no se entera (sin pestillo). Escribir el
  nombre o elegir icono no vuelven a pasar por ahí (criterio 5).
- *Criterio 10, «no se puede abrir crear hasta que llegue»* en vez de «esperar a
  la lista con el formulario abierto»: la otra salida pedía un pestillo en el
  render solo para esta pantalla, y aquí la lista llega casi siempre de la caché
  persistida. El `disabled={isLoading}` de antes **no bastaba**: con la consulta
  apagada por el guardia de sesión, o tras un error, `isLoading` es `false` y
  `data` sigue `undefined`. El `if (!categories) return` es la red por si alguien
  llama a `openCreate` por otra vía.
- *El vacío también espera a la lista:* su botón llama a `openCreate`; si saliera
  con `data === undefined` (guardia cerrado) sería un botón que no hace nada, y
  además diría «no hay categorías» sin saberlo.
- *`validateCategoryForm` sin color* (la «observación» técnica del analista):
  desde el `ColorPicker` no se puede elegir un color mal escrito; lo único que
  podría fallar es lo que la categoría **ya traía** guardado (p. ej. `#fff`).
  Dejar la validación obligaba a cambiar el color para poder cambiar el nombre,
  que contradice «editar no toca el color que no se toca». El servidor tampoco
  lo exige: `color: z.string().max(255).nullable().optional()` en
  `xavi-platform-node/src/validators/schemas/habit.schemas.ts:260,270`.
- *Delegar y no gemelo:* lo que decía la hipótesis; aquí no hay frontera de
  módulo.
- No me desvié de la referencia: `VidaCategoryForm` para el formulario tonto; el
  pestillo de `CreateVidaCategoryStep` no hacía falta en esta pantalla.

**Verificación:**
- `pnpm typecheck` → limpio (exit 0).
- `pnpm lint` → `✖ 14 problems (14 errors, 0 warnings)`, ninguno en los ficheros
  tocados. Igual que la línea base.
- `pnpm test` → `Test Files 1 failed | 137 passed (138)`, `Tests 2 failed | 2391 passed (2393)`;
  los 2 fallos son `SearchSelect.test.tsx`, los de la línea base. 2393 = 2364 + 29 nuevos.
- `pnpm build` → limpio. Chunk inicial `index-*.js` **1.157,80 kB** (antes
  1.158,09), `app-icons` 652,57 kB, `IconPicker` 4,64 kB, **CSS 281,51 kB (antes
  281,63)**. La bajada es a propósito, y se comprobó con listas de selectores:
  compilé `HabitCategoryForm.module.scss` de `HEAD` (`git show`) y del árbol con
  `sass --load-path=src --style=compressed`. Es el único `.scss` tocado. `diff` de
  las listas: salen `.colorPicker` y `.colorPicker:disabled`, entra `.colorLabel`;
  `.form`, `.colorRow`, `.actions` y `.formError` siguen (467 → 350 bytes).
- Corrida aislada de las cuatro suites de la tajada: 52/52 en verde.
- `grep 'type="color"\|#6366f1' src/features/habits` (sin tests): solo quedan
  `CreateHabitCategoryStep.tsx:77,80,88` (tajada 2), `habit-templates.ts:104`
  (fuera de alcance, es color de hábito) y dos comentarios míos que cuentan el antes.
- `graphify update .` hecho.

**Criterio 12, medición de ancho:** el 5173 estaba **apagado** (sonda: «APAGADO
(nadie escucha)» en 5173 y 5174), y no levanto servidores. Así que medí con
Chrome headless una página del scratchpad (ningún fichero en el repo) con el
CSS **real** compilado por la API de `sass` desde `src/` (el alias `@/` resuelto
con un importador): `global.scss` + los módulos de `Modal`, `FormField`, `Input`,
`Textarea`, `Button`, `ColorPicker` y `HabitCategoryForm` del árbol, con las clases
prefijadas por módulo como haría CSS Modules. El marcado es el que pinta
`Modal.tsx` (`size="md"`) con el formulario dentro y las muestras de `ColorPicker.tsx`.
Cada caso en un `iframe` del ancho exacto, en bloque, **sin contenedor flex**.
Medido con `contentDocument`:

| Caso | `iframe` | `innerWidth` | doc `scrollWidth` | panel client/scroll | formulario client/scroll | grupo client/scroll | muestras | filas | scroll vertical del panel | «Guardar» visible tras bajar |
|---|---|---|---|---|---|---|---|---|---|---|
| crear | 375×812 | 375 | 375 | 341 / 341 | 277 / 277 | 277 / 277 | 22 (30 px) | 4 (7+7+7+1) | no | sí |
| crear | 760×812 | 760 | 760 | 510 / 510 | 446 / 446 | 446 / 446 | 22 (32 px) | 2 (11+11) | no | sí |
| editar, color de fuera | 375×812 | 375 | 375 | 341 / 341 | 277 / 277 | 277 / 277 | 23 (30 px) | 4 (7+7+7+2) | no | sí |
| editar, color de fuera | 760×812 | 760 | 760 | 510 / 510 | 446 / 446 | 446 / 446 | 23 (32 px) | 3 (11+11+1) | no | sí |
| crear | 375×568 | 375 | 375 | 326 / 326 | 262 / 262 | 262 / 262 | 22 | 4 | sí (534 de 742) | sí |
| editar, color de fuera | 375×568 | 375 | 375 | 326 / 326 | 262 / 262 | 262 / 262 | 23 | 4 | sí (534 de 742) | sí |

`scrollWidth === clientWidth` en todos los casos y el documento no crece: no hay
scroll horizontal. En una pantalla baja (568) el panel del `Modal` hace scroll
vertical, como ya pasaba con cualquier formulario largo, y al bajar «Guardar»
queda dentro del panel. La muestra de 30 px a 375 confirma que la media query de
`ColorPicker` (`min-width: 25rem`) se evaluó dentro del `iframe`. **Dos límites
honestos:** el disparador del `IconPicker` y el `Textarea` los aproximé con su
clase de `Input`/`Textarea` (no están en la fila que cambia); y el formulario
tiene 64 px menos que el panel por el `padding` del `Modal`, así que a 375 bajan 7
muestras por fila, no 9 como en la medición de FEAT-017, que no llevaba modal.

**Criterios que cierra, uno a uno:**
- **1** ✔ `HabitCategoryForm.test.tsx` «no hay rueda ni campo de hex…»: sin
  `input[type="color"]`, sin placeholder `#6366f1`, sin «Selector de color»; `radiogroup`
  «Color de la categoría» con 22 radios cuyos `aria-label` son los de `PALETTE_COLORS`.
  23 con color de fuera (criterio 7). Crear y editar pasan por el mismo formulario
  (y la página lo comprueba en crear).
- **2** ✔ Página: con Menta, `#6366f1` y Carmín (en mayúsculas) usados, crear
  marca Oliva con `random = 0` y Violeta con `0.999`: nunca un usado. También en
  `habit-colors.test.ts` con barrido del generador.
- **3** ✔ Página: con los seis usados y Ámbar una vez menos, marca Ámbar. Sin
  categorías, «Crear la primera categoría» marca Azul con `0.99`; en
  `habit-colors.test.ts` el barrido saca los seis.
- **4** ✔ La pantalla no consulta hábitos: el sorteo recibe
  `categories.map((category) => category.color)`. Test de página sin categorías y test
  de `pickInitialHabitCategoryColor` con lista vacía (cualquiera de los seis).
- **5** ✔ Sorteo en el manejador de evento; tests: escribir nombre, descripción
  y orden no mueve la muestra (formulario) y escribir el nombre tampoco (página).
- **6** ✔ en lo que se prueba aquí: elegir otra muestra la sustituye y se envía
  su hex (formulario: Petróleo `#186068`; página, editar: Carmín). **Pendiente de
  prueba manual** la segunda mitad (el acento en la lista y la ficha en el filtro
  de Mis hábitos tras guardar): depende de la invalidación de
  `habitKeys.categories.list()`, que no se tocó, y está detrás del login.
- **7** ✔ Página: categoría con `#6366F1` → 23 muestras, la primera «Color actual»
  y marcada; se cambia el nombre, «Guardar» → `mutate` con `color: '#6366F1'`
  exacto, mayúsculas incluidas. Utils: lo mismo sin pantalla.
- **8** ✔ Página: categoría sin color → ninguna marcada; «Guardar» → `color: null`.
- **9** ✔ Página: dos categorías Violeta, editar la segunda → Violeta marcada y
  `Math.random` **no se llama**.
- **10** ✔ Página: con `data: undefined`, «Nueva categoría» deshabilitado, sin
  «Crear la primera categoría» y sin sorteo; al llegar la lista (con `rerender`,
  no datos síncronos) se abre y sortea sobre ella (Menta usada → Oliva).
- **11** ✔ Formulario con `loading` y página con `createMutation.isPending`: las 22
  muestras deshabilitadas.
- **12** ✔ Ver la tabla de arriba (375 y 760, crear y editar con color de fuera).
  Pendiente solo mirarlo en la pantalla real, que está detrás del login.
- **13** ✔ Formulario: una sola muestra con `tabIndex=0` (la marcada); →, Fin e
  Inicio mueven foco y selección. Es el `ColorPicker` sin tocar.
- **19** — es de cierre de la tajada 2; hoy solo queda `CreateHabitCategoryStep.tsx`.
- **20** ✔ para esta tajada: tests del sorteo con generador fijo y de componente
  para 2 y 7 y 8 (15 y 17 son de la tajada 2).
- **21** ✔ Cifras arriba: typecheck limpio, lint 14/0, tests 2 fallos de 2393
  (los de la línea base), build limpio y la bajada del CSS demostrada con listas
  de selectores.

**Recorrido que le queda al usuario** (con el 5173 arriba y sesión iniciada):
1. Hábitos → Ajustes → Categorías → «Nueva categoría»: tiene que salir una
   muestra marcada que no sea el color de ninguna categoría de la lista.
   Escribe un nombre y crea sin tocar el color: la tarjeta nueva lleva ese color
   de acento, y en Mis hábitos la ficha del filtro también.
2. «Editar» en una categoría vieja creada con el índigo de antes: la primera
   muestra es «Color actual» y está marcada; cambia solo el nombre y guarda: el
   acento no cambia.
3. «Editar» en una sin color (si hay alguna): ninguna muestra marcada; guarda
   cambiando solo el nombre: sigue sin color (acento gris del borde).
4. En el móvil: el formulario no se sale por los lados y «Guardar» se alcanza
   bajando dentro del modal.

**Riesgos:**
- «Nueva categoría» deshabilitado cuando la carga de la lista falla sin caché:
  antes se podía crear (sorteando sobre nada); ahora se usa «Reintentar» primero.
- `validateCategoryForm` ya no valida el color: si alguien llama a esa función
  desde otro sitio esperando que lo haga, deja de hacerlo. Hoy solo la llama
  `HabitCategoryForm`.
- Firma de `defaultCategoryFormValues` con un segundo parámetro opcional; solo la
  llama `HabitCategoriesPage`.
- Los mocks: la página no estrena ningún hook de `useHabitCategories`, así que
  ninguna suite existente queda verde por casualidad por esta tajada. La nueva
  `HabitCategoriesPage.test.tsx` lista los cuatro hooks que usa la pantalla.

**Lo que descubrí y no toqué:**
- `HabitCategoryForm` sigue diciendo «Cancelar» en el botón de volver, y la
  pantalla «Eliminar»/«Cancelar» en el diálogo de quitar una categoría
  (`HabitCategoriesPage.tsx`, `handleDelete` y el botón de la tarjeta).
  `VidaCategoryForm` dice «Volver». Vocabulario fuera de esta tajada;
  puede que le toque a FEAT-025.
- Con el guardia de sesión cerrado la pantalla no pinta nada (ni esqueleto ni
  vacío): `isLoading` es `false` porque la consulta está apagada. Antes pintaba
  «No hay categorías todavía», que era falso. No afecta dentro de `/app`, donde el
  guardia ya está abierto.

**Estado del árbol:** sin commitear. Ficheros de la tajada: los seis de
`src/features/habits` de arriba (3 modificados, 3 tests nuevos, más
`habit-colors.test.ts` ampliado) y `graphify-out/` por `graphify update .`. La
página de medida vive en el scratchpad, fuera del repo.


## 4. Review — feature-reviewer

### Tajada 1 — la pantalla Categorías, crear y editar con la paleta

**Veredicto: `accepted`.** Los criterios 1-5 y 7-13 se cumplen con evidencia
propia (tests corridos por mí y una medición de ancho con arnés propio, no la del
constructor); el 20 y el 21 se cumplen en lo que toca a esta tajada; el 19 es de
cierre de la tajada 2. **Quedan en prueba manual**, detrás del login: la segunda
mitad del 6 (el acento en la lista y la ficha del filtro de Mis hábitos tras
guardar) y ver el 12 en la pantalla real. No encontré regresiones. D-A y D-B van
construidas con la opción recomendada y siguen pendientes de que las confirme el
usuario; no son hallazgo.

**Criterios, uno a uno** (contra la sección 1, no contra el resumen del
constructor). Leí las tres suites nuevas entera la de la página, y los títulos y
aserciones de las otras dos, para comprobar que prueban lo que dicen:

- **1** ✅ `HabitCategoryForm.test.tsx` («no hay rueda ni campo de hex») y el
  primer test de la página: sin `input[type="color"]`, sin el campo de
  placeholder `#6366f1`, `radiogroup` con nombre «Color de la categoría» y 22
  radios con los `aria-label` de la paleta; 23 con color de fuera. Lo confirma
  también el arnés de ancho (22 en crear, 23 en editar, primera «Color actual»).
- **2** ✅ Página: con Menta, `#6366f1` y Carmín **en mayúsculas** como colores
  de categorías, `random = 0` marca Oliva; con Menta, Ámbar y Azul, `0.999` marca
  Violeta. `normalizeColor` baja a minúsculas antes de contar, así que el Carmín
  en mayúsculas sí bloquea su casilla.
- **3** ✅ Página: los seis usados y Ámbar una vez menos → Ámbar con `0.5`. Sin
  categorías, «Crear la primera categoría» con `0.99` → Azul; el barrido de
  `habit-colors.test.ts` saca los seis.
- **4** ✅ Leído en el código: el único punto de llamada es `openCreate`
  (`HabitCategoriesPage.tsx:63`) y le pasa `categories.map((category) =>
  category.color)`, que es la lista de `useHabitCategoriesQuery`. La pantalla no
  importa ninguna consulta de hábitos ni de Vida (`git grep
  pickInitialHabitCategoryColor`: un solo llamador fuera de tests). El test «con
  hábitos que usan los seis y ninguna categoría» se cumple por construcción: la
  función no recibe hábitos.
- **5** ✅ El sorteo vive en el manejador del clic; escribir nombre, descripción
  u orden no vuelve a pasar por ahí. Probado en el formulario (los tres campos) y
  en la página (nombre, antes de crear).
- **6** ✅ en su primera mitad: elegir otra muestra la sustituye y se envía su
  hex (formulario, Petróleo; página al editar, Carmín). **Pendiente de prueba
  manual** la segunda: el acento de la tarjeta y la ficha del filtro tras
  guardar. Ninguna de las dos se tocó (`HabitCategoriesPage.tsx`, bloque de la
  tarjeta; `HabitCategoryFilter.tsx`) y leen `category.color` como antes, pero
  eso es lectura, no verlo.
- **7** ✅ Página: categoría con `#6366F1` → 23 muestras, la primera «Color
  actual» marcada; se cambia solo el nombre y `mutate` recibe `color: '#6366F1'`,
  mayúsculas incluidas, y `Math.random` no se llama. `categoryToFormValues` pasa
  `category.color` tal cual y `buildCategoryCreatePayload` solo hace `trim()`.
- **8** ✅ Página: sin color → ninguna marcada y `color: null` al guardar. Ya no
  hay `?? '#6366f1'` en `categoryToFormValues` (`git grep -i 6366f1` en `src/`:
  quedan `CreateHabitCategoryStep.tsx:80,88`, que es la tajada 2,
  `habit-templates.ts:104`, fuera de alcance, y dos comentarios).
- **9** ✅ Página: dos categorías Violeta, editar la segunda → Violeta marcada,
  sin sorteo; elegir Carmín envía Carmín.
- **10** ✅ Página: con `data: undefined` el botón está deshabilitado, no sale
  el vacío y no se sortea; tras `rerender` con la lista llegada, crear sortea
  sobre ella. Es la rama «no se puede abrir crear hasta que llegue», que el
  criterio admite literalmente. Ver abajo lo que pasa tras un error.
- **11** ✅ Formulario con `loading` y página con `createMutation.isPending`:
  todas las muestras deshabilitadas.
- **12** ✅ **Repetido con arnés propio**, distinto del del constructor: en vez
  de compilar el CSS a mano, construí con Vite (config propia, todo en el
  scratchpad, `node_modules` enlazado, nada escrito en el repo) un paquete IIFE
  que monta el `Modal` real (`size="md"`, sin `ds`, como la página) con el
  `HabitCategoryForm` real dentro —y con él el `ColorPicker`, `Input`,
  `Textarea` y el disparador del `IconPicker` reales, con sus CSS Modules
  compilados por Vite— y `global.scss`. Medido en Chrome headless con cada caso
  en un `iframe` del ancho exacto, en bloque, sin contenedor flex. (Un primer
  intento con `--window-size=375` no sirve: Chrome headless no baja de 500 px de
  ventana, y lo descarté.) En editar, el nombre de la categoría era largo a
  propósito:

  | Caso | `innerWidth` | doc `scrollWidth` | panel c/s | form c/s | grupo c/s | muestras | filas | «Guardar/Crear» visible tras bajar |
  |---|---|---|---|---|---|---|---|---|
  | crear 375×812 | 375 | 375 | 341/341 | 277/277 | 277/277 | 22 (30 px) | 7+7+7+1 | sí |
  | crear 760×812 | 760 | 760 | 510/510 | 446/446 | 446/446 | 22 (32 px) | 11+11 | sí |
  | editar, `#6366F1`, 375×812 | 375 | 375 | 341/341 | 277/277 | 277/277 | 23 (30 px) | 7+7+7+2 | sí |
  | editar, `#6366F1`, 760×812 | 760 | 760 | 510/510 | 446/446 | 446/446 | 23 (32 px) | 11+11+1 | sí |
  | crear 375×568 | 375 | 375 | 326/326 | 262/262 | 262/262 | 22 | 7+7+7+1 | sí |
  | editar 375×568 | 375 | 375 | 326/326 | 262/262 | 262/262 | 23 | 7+7+7+2 | sí |

  Ningún elemento de la página se sale por la derecha (lo comprobé recorriendo
  todos). Las cifras coinciden con las del constructor al píxel, con
  componentes reales donde él aproximó dos. Falta verlo en la pantalla real.
- **13** ✅ Formulario: una sola muestra con `tabIndex=0`; →, Fin e Inicio mueven
  foco y selección. Es el `ColorPicker` compartido sin tocar.
- **19** — de cierre de la tajada 2. Hoy quedan `CreateHabitCategoryStep.tsx:77`
  (`type="color"`) y sus `#6366f1`.
- **20** ✅ para esta tajada: sorteo con generador fijo (5 casos nuevos en
  `habit-colors.test.ts`) y componentes para 2, 7 y 8. 15 y 17 son de la 2.
- **21** ✅ Corrido por mí: `pnpm typecheck` exit 0; `pnpm lint` 14 errores / 0
  warnings, todos en ficheros de la línea base (`HabitDifficultyPicker`,
  `CommandPalette*`, `ConfirmDialogProvider`, `IconPicker`, `SteppedModal`,
  `Tabs`, `toast.context`, `test/render`), ninguno tocado; `pnpm test` 2 fallos de
  2393, los dos de `SearchSelect`; `pnpm build` limpio, chunk inicial 1.157,80
  kB, `app-icons` 652,57 kB, **CSS 281,51 kB**. La bajada (281,63 → 281,51) la
  comprobé con listas de selectores: `git show HEAD:` y el árbol de
  `HabitCategoryForm.module.scss` (el único `.scss` del `git diff`) compilados con
  `sass --load-path=src --style=compressed`, 467 → 350 bytes; `diff` de las listas
  ordenadas: **salen `.colorPicker` y `.colorPicker:disabled`, entra
  `.colorLabel`**, y siguen `.form`, `.colorRow`, `.actions`, `.formError`. Sin
  errores de compilación: no hay comentario abierto.

**Lo que se rompió cerca** (cómo lo busqué):

- *Otros consumidores de `habit-category-form.utils.ts` y de
  `HabitCategoryForm`.* El grafo ya es posterior al cambio, así que para «quién
  dependía antes» usé `git grep` sobre `HEAD`: `validateCategoryForm` solo lo
  llama `HabitCategoryForm.tsx`; `defaultCategoryFormValues` y
  `categoryToFormValues`, solo `HabitCategoriesPage.tsx`; `HabitCategoryForm`
  solo lo monta esa página (más una mención en un comentario de
  `VidaCategoryForm.tsx:38`). `graphify explain` sobre los dos nodos da lo mismo
  más los tests nuevos. `HabitCategoryFormValues` solo lo usan esos tres
  ficheros. **Nada más dependía del `#6366f1` por defecto.** `HabitCategoriesPage`
  solo lo monta `habits.routes.tsx:34`.
- *La validación de color que se fue.* Juzgada: no abre ninguna puerta. El
  `ColorPicker` solo emite hexes de la paleta o el «Color actual» que ya traía la
  categoría (`ColorPicker.tsx:9`, `onChange: (hex: string) => void`, y sus
  opciones salen de `PALETTE_COLORS` más ese), y no queda ningún campo de texto
  para el color. Lo único que podría llegar «inválido» es un valor que la
  categoría **ya tenía guardado**, y se reenvía tal cual; con la validación
  puesta, esa categoría no se habría podido renombrar sin cambiarle el color, que
  contradice el criterio 7. El servidor acepta `string max 255 nullable` según el
  constructor (no lo abrí: otro repositorio). Correcto.
- *Tras un error de la consulta.* Con TanStack Query 5, si la carga falla sin
  datos en caché, `data` queda `undefined` e `isError` a `true`: el Alert con
  «Reintentar» sale y «Nueva categoría» queda deshabilitado hasta que la lista
  llegue. Antes el botón seguía activo (`disabled={isLoading}`) y crear abría el
  formulario con índigo y **orden 0** calculado sobre una lista vacía. Lo juzgo
  **aceptable, no regresión**: el criterio 10 admite literalmente «no se puede
  abrir crear hasta que llegue», y un error es una lista que no ha llegado; lo que
  se podía hacer antes era crear a ciegas contra el mismo API que acababa de
  fallar, con un orden que podía chocar. El Alert está justo encima y dice qué
  pasa. Si el error es de un refresco con datos ya en caché, `data` se conserva y
  el botón sigue activo, como antes. Hallazgo menor abajo.
- *La misma pantalla.* Editar y quitar una categoría no cambian (`openEdit`,
  `handleDelete`, tarjetas). El vacío ahora espera a que la lista llegue: con la
  consulta en marcha sale el esqueleto, como antes; con el guardia de sesión
  cerrado no sale nada en vez de un «no hay categorías» falso, y dentro de `/app`
  el guardia está abierto.
- *Mocks verdes por casualidad.* La página no estrena ningún hook de
  `useHabitCategories`; la suite nueva lista los cuatro que usa. No hay otra
  suite que monte `HabitCategoriesPage`.

**Estados:**

- *Vacío* ✅ «No hay categorías todavía» + «Crear la primera categoría», que
  sortea entre los seis (probado).
- *Carga* ✅ esqueleto, como antes, y crear deshabilitado (probado con
  `data: undefined`).
- *Error* ✅ Alert con «Reintentar»; crear deshabilitado hasta que llegue. No hay
  test del caso `isError` con `data: undefined` (el del criterio 10 usa
  `isError: false`); leído en el código, no probado.
- *Sin permisos* — no aplica: la pantalla solo es del propio usuario.
- *Texto largo* ✅ en el arnés, editar con un nombre largo no ensancha nada.
- *Móvil* ✅ 375 sin scroll horizontal y «Guardar» alcanzable (tabla del 12).

**¿Duplica algo que existía?** No hubo arquitecto; lo miro contra lo que la
sección 1 dejó escrito. Se reutiliza el `ColorPicker` compartido sin tocarlo, y
el sorteo **delega** en `pickInitialHabitColor` en vez de copiarlo, que es la
hipótesis del analista; el gemelo de Vida sigue siendo solo de Vida. La etiqueta
«Color» y `.colorLabel` copian `VidaCategoryForm`, que es la referencia
nombrada. Nada nuevo en `shared/`, ni en `api/`, `graphql/` o `setQueryData`: no
se tira la caché de nadie.

**Hallazgos (ninguno bloquea):**

1. *Crear justo después de crear puede repetir color.* Al crear, el modal se
   cierra en el `onSuccess` del `mutate` y la lista se invalida sin esperar al
   refresco. Si alguien pulsa «Nueva categoría» dentro de ese viaje de ida y
   vuelta, el sorteo mira la lista vieja, sin la categoría recién creada, y puede
   darle el mismo color. Ventana de un segundo o menos; el criterio 10 habla de
   la lista que no ha llegado, no de la que está refrescando. La tajada 2 tendrá
   el mismo borde. Anotado, no devuelto.
2. *El botón deshabilitado tras un error no dice por qué.* El Alert de encima sí
   lo dice, así que se entiende; es un detalle, no un defecto.
3. *Falta un test del estado de error* (`isError: true`, `data: undefined` →
   crear deshabilitado, Alert visible). La conducta es correcta leyendo el código.
4. *Vocabulario preexistente, fuera de esta tajada:* el formulario dice
   «Cancelar» y la tarjeta y su diálogo, «Eliminar»/«Cancelar». Ya lo anotó el
   constructor; si le toca a alguien es a FEAT-025.
5. *Elegir de nuevo «Color actual» tras pasar por otra muestra* envía el hex en
   minúsculas (`normalizeColor`), no en su grafía original. Mismo color;
   irrelevante salvo para una comparación de texto exacta.

**Lo que no revisé:** la pantalla real con sesión (los agentes no entran con
credenciales): la segunda mitad del 6 y ver el 12 en el navegador quedan para el
usuario. No abrí el esquema del servidor (`habit.schemas.ts`); me fío de la cita
del constructor para el `max(255)`.

**Arnés:** vive en el scratchpad de la sesión (`h/`, con un enlace a
`node_modules`), fuera del repositorio; no quedó ningún servidor arrancado ni
ningún fichero en el árbol.

**Para el usuario** (la nota de cierre va con la tajada 2; esto es lo que ya se
puede probar):

1. Hábitos → Ajustes → Categorías → «Nueva categoría»: sale una muestra marcada
   que no es el color de ninguna categoría de la lista. Escribe un nombre y crea
   sin tocar el color: la tarjeta nueva lleva ese color, y en Mis hábitos la ficha
   del filtro también.
2. «Editar» en una categoría creada con el índigo de antes: la primera muestra
   es «Color actual» y está marcada; cambia solo el nombre y guarda: el color no
   cambia.
3. «Editar» en una sin color, si hay alguna: ninguna muestra marcada; guarda
   cambiando solo el nombre: sigue sin color.
4. En el móvil: el formulario no se sale por los lados y «Guardar» se alcanza
   bajando dentro de la ventana.
