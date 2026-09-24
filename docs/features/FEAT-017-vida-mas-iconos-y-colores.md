---
id: FEAT-017
title: Categorías — más iconos que se encuentran, más colores, y uno que no se repite al crear
status: planned
architect: no    # las cuatro tajadas cuelgan de estructuras ya existentes: los datos del catálogo de iconos (src/shared/icons/catalog/*.icons.ts), los dos niveles de la paleta (src/shared/ui/ColorPicker/color-palette.ts) y el sorteo que ya existe para hábitos (src/features/habits/data/habit-colors.ts, pickInitialHabitColor), que documenta por escrito que su equivalente de Vida es dominio de Vida y vive en Vida. Ninguna tajada crea entidad, pantalla ni cruce de capas nuevo.
area: shared/icons, shared/ui, features/vida
requested: 2026-09-22
updated: 2026-09-24
---

# FEAT-017 — Categorías: más iconos que se encuentran, más colores, y uno que no se repite al crear

## 1. The request — feature-analyst

**Summary for whoever's next:** Dos mejoras del formulario de categoría de Vida —
más iconos (curados, no solo cantidad), más colores en la paleta, y que el color
se sortee al crear una categoría— repartidas en cuatro tajadas. La primera y más
barata no añade nada: son palabras clave que faltan en iconos que ya existen.

**What problem it solves:** El usuario buscó «sombrero de chef» y no encontró
nada. El problema real, verificado, es doble: (1) Font Awesome Free no tiene ese
icono —ni buscando mejor aparece—, y (2) el icono que sí serviría (`kitchen-set`,
etiquetado «Cocinar») no tiene «chef» entre sus palabras clave, así que ni
buscando lo correcto se encuentra. Y, aparte: todas las categorías nuevas nacen
con el mismo hueco de color sin marcar, lo mismo que le pasaba a los hábitos
antes de la fase 9 — una categoría se distingue de un vistazo por su icono y su
color, y hoy ese color hay que elegirlo siempre a mano.

**Who it's for:** Cualquiera que cree o edite una categoría en Vida
(`/app/vida` → categorías, dos pantallas: crear y editar).

**User's words:** «Dos mejoras de actividades que pueden ir al final: Incorpora
mas iconos, busque sombrero de chef y no encontre, incluye muchos mas unos 100
mas si se puede. Incorpora mas colores para las categorias y al abrir el form de
categorias selecciona uno distinto al azar.»

**Verificado antes de escribir esto** (no se repite la búsqueda, ya está hecha):
- El catálogo tiene hoy **868 iconos** en `src/shared/icons/catalog/*.icons.ts`,
  con dos tests de integridad: `catalog-integrity.test.ts` (213 líneas) e
  `icon-registry.test.ts`. Esas reglas —sin duplicar `name` ni el icono de Font
  Awesome subyacente, `label` y `keywords` obligatorios, kebab-case, categorías
  conocidas, ≥ 60 iconos elegibles por categoría, ≥ 850 en total— son las que 100
  iconos nuevos tienen que cumplir sin tocarlas.
- Font Awesome Free solid trae ~2.000 iconos y el catálogo usa 868: añadir 100 es
  **curar de lo que ya está instalado**, no meter una dependencia nueva.
- **El sombrero de chef no existe en Font Awesome Free.** Comprobado sobre el
  paquete instalado: de sombreros solo hay `faHatCowboy`, `faHatCowboySide`,
  `faHatWizard` y `faHardHat`. El de chef es de Font Awesome **Pro**. Esto no
  tiene arreglo dentro de esta feature.
- Pero **la búsqueda del usuario sí tiene arreglo, y es más barato que un icono
  nuevo**: `kitchen-set` (etiqueta «Cocinar») ya trae las palabras clave
  «cocinar, cocina, receta, cook, guisar, batch cooking» —y también existen
  `fire-burner`, `blender`, `mortar-pestle`, `utensils`, `bowl-food»— pero
  ninguno tiene «chef» como palabra clave. `icon-search.ts` busca por
  coincidencia de texto exacta contra `name + label + category + keywords`
  (`filterAppIcons`, `src/shared/icons/icon-search.ts:40-54`): si la palabra no
  está en esa lista, no aparece aunque el icono sea el correcto.
- La paleta (`src/shared/ui/ColorPicker/color-palette.ts`) tiene **17 colores en
  dos niveles**: 6 `core` (los que la app reparte sola) y 11 `extended` (solo a
  mano). El criterio no es el gusto: cada extendido está a **ΔE ≥ 15 en OKLab**
  de cada color del núcleo, **comprobado en un test**
  (`src/features/habits/data/habit-colors.test.ts:84-95`, que es donde vive hoy
  el validador aunque los datos ya se mudaron). Los hexadecimales **no cambian**:
  hay hábitos y categorías guardados con ellos. Y hay un techo documentado en
  `docs/remodel/11-mas-color-mas-iconos.spec.md`: con los mismos hexadecimales
  sirviendo a los dos temas y exigiendo que **todos** los colores se distingan
  entre sí (no solo del núcleo), el máximo medido fue 6 — por eso la paleta se
  parte en dos niveles, y por eso «más colores» significa más **extendidos**,
  cada uno solo obligado a distinguirse del núcleo, no entre sí.
- El sorteo ya existe, pero es de hábitos: `pickInitialHabitColor`
  (`src/features/habits/data/habit-colors.ts:44-65`) sortea entre los 6 del
  núcleo, prefiriendo el que menos usan los hábitos activos del usuario, y se
  quedó deliberadamente fuera de `shared/ui` cuando la paleta se mudó allí
  (comentario en el propio archivo: «eso sí es dominio»). Hay precedente vivo
  que imitar, no un patrón que inventar.
- El formulario de categoría de Vida son **dos archivos**:
  `src/features/vida/components/CreateVidaCategoryStep/CreateVidaCategoryStep.tsx`
  (crear, `color` nace en `null`) y
  `src/features/vida/components/VidaCategoryForm/VidaCategoryForm.tsx` (editar,
  tonto, recibe `values` y `onChange` desde fuera). FEAT-016 está tocando los dos
  ahora mismo para añadir una casilla —no se puede asumir su contenido actual
  como definitivo, hay que releerlos al construir.
- El formulario de categoría de **hábitos**
  (`src/features/habits/components/HabitCategoryForm/HabitCategoryForm.tsx:84-99`)
  **sigue con el `<input type="color">` nativo del sistema**, no con el
  `ColorPicker` compartido: nunca migró cuando la paleta se mudó a `shared/ui`.
  Meterle un sorteo ahí no es una tajada de esta feature, es migrar ese
  formulario primero — feature aparte.
- Peso: el chunk `app-icons` pesa 620,20 kB perezosos para 868 iconos, ~0,71
  kB/icono. Cien más son **~+71 kB** en un chunk que ya se carga aparte del
  inicial. Se mide, no se alarma.

**Out of scope:**
- El sombrero de chef literal — no existe en Font Awesome Free. Se resuelve
  ampliando las palabras clave de los iconos afines, no creando ni comprando un
  icono nuevo.
- Migrar `HabitCategoryForm` (hábitos) del `<input type="color">` nativo al
  `ColorPicker` compartido. Sin esa migración, el sorteo no tiene dónde
  engancharse ahí. Es otra feature.
- Sortear el **icono** al crear — el usuario solo pidió el color.
- La deuda del tema oscuro de la paleta (guardar el nombre del color en vez del
  hex para que cada tema pinte su propio tono) — ya está anotada en
  `color-palette.ts` como fuera de esta fase, y sigue fuera aquí.
- Cambiar el algoritmo de búsqueda (`icon-search.ts`) o el catálogo de
  categorías del selector de iconos — solo se tocan datos (`keywords` y
  entradas nuevas), no la función que filtra ni la lista de 13 categorías.
- Recolorear categorías que ya existen — el sorteo solo aplica al crear una
  categoría nueva, nunca al editar una existente (criterio 521).
- Relajar la regla ΔE ≥ 15 sin decirlo — si no caben tantos colores nuevos como
  se querría, se dice con la cifra real, no se fuerza en silencio.

**Acceptance criteria:**

*Tajada 1 — palabras clave que arreglan lo que no se encontraba:*
- [ ] 504. Buscar «chef» en el selector de iconos encuentra al menos
  `kitchen-set` (Cocinar) — no crea ningún icono nuevo, añade la palabra clave
  que falta.
- [ ] 505. Buscar «cocina» sigue encontrando `kitchen-set`, `fire-burner`,
  `blender`, `mortar-pestle`, `utensils` y `bowl-food`, y ninguno de esos cinco
  pierde ninguna palabra clave que ya tenía.
- [ ] 506. Se añaden al menos 15 palabras clave nuevas repartidas entre iconos
  **ya existentes** (no en los de la tajada 2), elegidas por búsquedas
  plausibles que hoy no encuentran nada; la lista de qué se buscó y qué icono se
  amplió queda escrita en la sección 3, una por una, para que se pueda comprobar
  sin repetir la exploración.
- [ ] 507. `catalog-integrity.test.ts` e `icon-registry.test.ts` siguen en verde
  sin editar ninguna de sus reglas: el diff de esta tajada son solo arrays
  `keywords` dentro de `src/shared/icons/catalog/*.icons.ts`.
- [ ] 508. Ningún `name` ni `label` existente cambia en esta tajada.

*Tajada 2 — cien iconos más, curados:*
- [ ] 509. El catálogo pasa de 868 a al menos 968 iconos, todos con `label` y
  `keywords` no vacíos.
- [ ] 510. Ninguno de los `name` actuales desaparece ni cambia de icono de Font
  Awesome (el test que fija los 453 congelados sigue en verde sin tocarlo).
- [ ] 511. Ningún icono nuevo repite el mismo icono de Font Awesome
  (`prefix:iconName`) que uno ya presente en el catálogo.
- [ ] 512. Cada icono nuevo se elige por utilidad para una actividad o hábito
  concreto — no para rellenar cupo — y trae al menos 3 palabras clave en
  español, con variantes sin tilde donde aplique.
- [ ] 513. Los 13 grupos del catálogo mantienen el suelo de 60 iconos elegibles
  por categoría (ya se cumple hoy; no puede bajar con la redistribución).
- [ ] 514. `pnpm build` sigue sirviendo el catálogo de iconos en un chunk
  perezoso separado del inicial, y el chunk inicial no crece frente a la línea
  base del día en `ENVIRONMENT.md`.
- [ ] 515. El peso del chunk de iconos se mide con `pnpm build` antes y después
  y se registra en la sección 3 (no hay umbral duro: es una cifra para que el
  usuario la vea, del orden de +71 kB si son 100 iconos).

*Tajada 3 — un color que no se repite al crear una categoría de Vida:*
- [ ] 516. Abrir «+ nueva categoría» en Vida (`CreateVidaCategoryStep`) con al
  menos una categoría existente deja el color **ya seleccionado**, y ese color
  es uno de los 6 del núcleo que **ninguna** categoría activa del usuario de
  Vida usa hoy.
- [ ] 517. Con los 6 del núcleo ya usados por categorías existentes, el sorteo
  elige el que menos categorías tienen (empate → cualquiera de los empatados).
- [ ] 518. El color sorteado no cambia mientras se escribe el nombre o se elige
  el icono: se sortea una sola vez al abrir el paso, no en cada render.
- [ ] 519. El sorteo mira los colores de las **categorías de Vida**, no los de
  hábitos ni los de ningún otro catálogo — son dominios independientes.
- [ ] 520. Elegir a mano una muestra distinta en el `ColorPicker` sustituye al
  color sorteado sin avisar: el sorteo es un valor por defecto, no una elección
  forzada.
- [ ] 521. Editar una categoría existente (`VidaCategoryForm`) **no sortea
  nada**: se sigue mostrando el color que ya tenía, incluido si es `null` (sin
  seleccionar) — abrir la edición no le inventa un color a nada.
- [ ] 522. Con el catálogo de categorías de Vida vacío (la primera del
  usuario), el sorteo elige cualquiera de los 6 del núcleo — no hay nada que
  evitar.
- [ ] 523. Existe una función de sorteo propia de Vida (no se reutiliza ni se
  importa la de hábitos) con tests de generador fijo: sin categorías, con
  algunas, con las 6 del núcleo en uso, y con colores extendidos o de fuera de
  la paleta mezclados en el historial de colores en uso (no bloquean ninguna
  casilla del núcleo) — mismo patrón de pruebas que
  `habit-colors.test.ts:138-219`.

*Tajada 4 — más colores en la paleta:*
- [ ] 524. La paleta gana colores `extended` nuevos; cada uno queda a ΔE ≥ 15
  en OKLab de **cada uno** de los 6 del núcleo, comprobado en un test igual que
  los 11 actuales (no se exige que se distingan entre sí — esa es la razón de
  que sean «extendidos» y no núcleo).
- [ ] 525. Los hexadecimales de los 17 colores actuales (6 núcleo + 11
  extendidos) no cambian.
- [ ] 526. Cada color nuevo trae su nombre en español (`label`) y se anuncia en
  el `ColorPicker` igual que los demás (`role="radio"`, `aria-label` con ese
  nombre).
- [ ] 527. El `ColorPicker` sigue recorriéndose con teclado (flechas, Fin/Inicio)
  incluyendo los colores nuevos, y no desborda a 375 px con la paleta ampliada.
- [ ] 528. Los colores nuevos **no** entran en ningún sorteo automático
  (`pickInitialHabitColor` de hábitos ni el de Vida de la tajada 3): siguen
  siendo `tier: 'extended'`, solo se eligen a mano.
- [ ] 529. Si el número de candidatos que pasa ΔE ≥ 15 del núcleo es menor que
  lo esperado, la construcción lo dice con la cifra real lograda en vez de
  forzar candidatos que no cumplen.

*Transversal a las cuatro:*
- [ ] 530. typecheck limpio; lint y tests **no peores** que la línea base de
  `ENVIRONMENT.md` al cerrar cada tajada, y `pnpm build` limpio.

**Slices:** (vertical, cada una usable por sí sola)
| # | What it does | State |
|---|---|---|
| 1 | Palabras clave que arreglan las búsquedas de iconos que hoy fallan (incluida «chef») | pending |
| 2 | Cien iconos nuevos curados, dentro de las reglas de integridad ya existentes | pending |
| 3 | Al crear una categoría de Vida, el color nace sorteado entre el núcleo y sin repetir el de otra categoría | pending |
| 4 | Más colores extendidos en la paleta compartida | pending |

**Architect? no** — porque las cuatro tajadas cuelgan de estructuras que ya
existen y no cruzan ninguna capa nueva: la 1 y la 2 son datos dentro de
`src/shared/icons/catalog/*.icons.ts`, respetando reglas que ya viven en
`catalog-integrity.test.ts`; la 4 es datos dentro de
`src/shared/ui/ColorPicker/color-palette.ts`, respetando el mismo test ΔE que ya
existe; la 3 imita literalmente `pickInitialHabitColor`
(`src/features/habits/data/habit-colors.ts:44-65`), que el propio archivo
documenta como el lugar correcto para un sorteo de dominio — su gemelo de Vida
va en `src/features/vida/`, junto al resto de utilidades del módulo.

**Decisions that aren't mine:**

- **D-A — El sombrero de chef no se puede cumplir tal cual lo pidió.** Font
  Awesome Free no lo tiene (solo Pro, comprobado sobre el paquete instalado).
  Resuelto sin bloquear nada: la tajada 1 hace que buscar «chef» encuentre
  `kitchen-set` (Cocinar) y los iconos de cocina afines, ampliando sus palabras
  clave. Si el usuario de verdad quiere el dibujo exacto de un sombrero de chef,
  eso es una decisión de producto distinta (comprar Font Awesome Pro, o un SVG a
  medida) y queda fuera de esta feature con la razón escrita.

- **D-B — «distinto al azar»: ¿distinto de qué?** Resuelto con una hipótesis
  marcada, corregible en una línea: **distinto de los colores que ya usan las
  demás categorías de Vida del usuario**, no un azar puro que puede repetir el
  color de la categoría de al lado — exactamente el criterio de
  `pickInitialHabitColor`. Y, dentro de eso, **el sorteo solo elige entre los 6
  del núcleo**, nunca entre los 17, por la misma razón escrita en
  `color-palette.ts`: los extendidos se parecen entre sí a propósito, y dos
  categorías a las que la app les pone el color sola tienen que distinguirse
  siempre porque nadie las está mirando cuando se deciden. Si el usuario prefiere
  un azar puro, o que el sorteo sí incluya los extendidos, es una línea de
  respuesta.

- **D-C — ¿El sorteo es solo de Vida, o también de hábitos?** Resuelto: **solo
  Vida**, porque es lo que se pidió y porque el formulario de categoría de
  hábitos (`HabitCategoryForm.tsx:84-99`) todavía usa el `<input type="color">`
  nativo del sistema, no el `ColorPicker` compartido — no migró cuando la
  paleta se mudó a `shared/ui`. Llevar el sorteo también a hábitos es una
  feature aparte que empieza por esa migración, no una tajada de esta.

- **D-D — ¿Cuántos colores extendidos más?** El usuario no dio un número
  («más colores», sin cifra). No es una decisión puramente técnica: cuántos
  colores nuevos entran cambia cuánta variedad tiene quien elige a mano, y eso
  es gusto de producto, no de ingeniería. Propuesta para no bloquear: **al
  menos 8 más** (pasar de 11 a ~19 extendidos, ~25 colores en total), sujeto a
  cuántos candidatos reales pasen ΔE ≥ 15 del núcleo — si el validador encuentra
  menos, se entrega esa cifra real (criterio 529) y el usuario decide si le
  basta o si quiere que se seleccione una tanda todavía la lea eligiendo tonos
  concretos.

## 2. The plan — feature-architect

> El expediente venía con `architect: no` y la sección vacía. El usuario pidió
> plan igual: esta feature toca dos ficheros de datos cuyos límites reales
> **nadie había medido**, y medirlos cambia dos tajadas. El `architect: no` del
> front-matter se queda como está (la decisión del analista era razonable con lo
> que sabía); lo que sigue es el plan, no una recusación.

**Summary for the builder:** La implementación de referencia para la única
tajada con lógica es `pickInitialHabitColor`
(`src/features/habits/data/habit-colors.ts:44-65`) con su cableado en
`HabitCreateWizard.tsx:52-69` y su test en `habit-colors.test.ts:138-219`: su
gemelo de Vida se copia a `src/features/vida/utils/vida-category-color.utils.ts`
y se engancha en `CreateVidaCategoryStep.tsx:38` (el `useState` del color). Las
otras tres tajadas **no crean ningún fichero**: son entradas dentro de
`src/shared/icons/catalog/*.icons.ts` y de
`src/shared/ui/ColorPicker/color-palette.ts:70-82`. **No crees** ni un buscador
de iconos, ni un `ColorPicker` propio de Vida, ni un sorteo compartido: las tres
cosas existen y funcionan.

---

### Lo que ya existe (medido hoy, 2026-09-24, sobre el árbol)

| Pieza | Dónde | Qué hace ya |
|---|---|---|
| Búsqueda de iconos | `src/shared/icons/icon-search.ts:40-54` | `filterAppIcons` normaliza (minúsculas, sin tildes), parte la consulta en tokens y **exige que TODOS los tokens estén** en un pajar de `name + label + category + etiqueta de categoría + keywords`, cacheado por entrada en un `WeakMap`. |
| Catálogo | `src/shared/icons/catalog/*.icons.ts` (13 ficheros + `system`) | **868 entradas, contadas hoy**: entertainment 70, finance 70, fitness 72, health 75, home 74, mindfulness 66, pets 61, productivity 69, social 67, study 72, system 25, technology 71, work 76. |
| Reglas del catálogo | `catalog-integrity.test.ts:92-181` | Sin `name` duplicado, sin repetir `prefix:iconName`, `label`+`keywords` obligatorios, kebab-case, categorías conocidas, los **453 nombres congelados** (`LEGACY_ICON_NAMES:18`), ≥60 por categoría elegible, ≥850 en total y ≥840 en el selector. |
| Tabla de búsquedas en español | `catalog-integrity.test.ts:185-207` | 15 pares `[consulta, icono]` en un `it.each`. **Es el sitio donde se prueba una palabra clave nueva.** |
| Paleta | `src/shared/ui/ColorPicker/color-palette.ts:47-82` | 6 `core` + 11 `extended`, con `normalizeColor` (`:95`) y `findPaletteColor` (`:102`). |
| Validador ΔE | `src/features/habits/data/habit-colors.test.ts:17-44` (`toLinear`/`toOklab`/`deltaE`, escala 0-100) y su puerta en `:84-95` | Mide cada extendido contra cada core. |
| Sorteo | `src/features/habits/data/habit-colors.ts:44-65` | Cuenta usos **solo entre los 6 del núcleo**, ignora `null`, colores de fuera y extendidos, coge los de cuenta mínima y elige con `random` inyectable. |
| Cableado del sorteo | `HabitCreateWizard.tsx:52-69` | Lee la lista activa de la caché y sortea **dentro del `useState` inicial y del `reset`, nunca en el cuerpo** (el propio comentario explica por qué). |
| Formulario de crear categoría de Vida | `CreateVidaCategoryStep.tsx:31-42` | Ya usa el `ColorPicker` compartido y el `IconPicker` diferido. `color` nace en `null` (`:38`). |
| Formulario de editar | `VidaCategoryForm.tsx:44-52` | Tonto: recibe `values`/`onChange`. No sortea nada y no debe sortear. |

**Lo que NO existe, y hay que decirlo:** no hay ningún sorteo de color en Vida,
ningún test de `CreateVidaCategoryStep` (no hay
`CreateVidaCategoryStep.test.tsx`; lo que renderiza ese paso es
`VidaActivitySheet.test.tsx:200-210`), y ningún test de la paleta en
`src/shared/ui/ColorPicker/` más allá de `ColorPicker.test.tsx` (el validador ΔE
sigue viviendo en hábitos). **Nada está duplicado**: la paleta se mudó a
`shared/ui` en FEAT-002 y el único sorteo del repositorio es el de hábitos. Sí
hay un *casi*-duplicado conocido y fuera de alcance: `HabitCategoryForm.tsx:84-99`
con `<input type="color">` nativo.

### Reference implementation

**`src/features/habits/data/habit-colors.ts:44-65` + `HabitCreateWizard.tsx:52-69`
+ `habit-colors.test.ts:138-219`.** No por bien escrita, sino porque es
**literalmente la misma figura**: una función pura que recibe los colores en uso
y un `random` inyectable, un componente que la llama una sola vez al montar, y
un test de generador fijo que cubre los ocho casos (vacío, algunos, todos,
extendidos mezclados, `null`, colores de fuera, mayúsculas, `random()===1`). Los
criterios 516-523 son ese test traducido a categorías. Está viva y mantenida.

Para las tajadas de datos la referencia es el vecino inmediato, no un patrón:
una entrada de catálogo se copia de `home.icons.ts:93` (`jug-detergent`, la de
una línea con `name/label/category/icon/keywords`) y un color se copia de
`color-palette.ts:70` (`cyan`).

---

### Lo que medí, y que cambia dos tajadas

**(A) «Iconos que se encuentran» — el problema es la búsqueda, no la cantidad.**

`filterAppIcons` exige **todos** los tokens. Medido sobre el catálogo:
«sombrero» solo aparece en `hat-wizard`
(`entertainment.icons.ts:102`) y «chef» **no aparece en ninguna entrada**.
Consecuencia: aunque la tajada 1 añada `chef` a `kitchen-set`, **la consulta
literal del usuario, «sombrero de chef», seguirá devolviendo cero**, porque
tendría que encontrar `sombrero` Y `de` Y `chef` en la misma entrada.

Esto no obliga a tocar `icon-search.ts` (está fuera de alcance y debe seguir
estándolo): se arregla con datos, poniendo **la frase entera como palabra
clave**. Con `keywords: [... 'chef', 'sombrero de chef', 'gorro de cocinero',
'cocinero']` en `kitchen-set`, el pajar contiene la frase y los tres tokens la
encuentran por subcadena. **Compruébalo con una entrada de la tabla
`catalog-integrity.test.ts:186`, no de memoria.**

Y el hallazgo que no es de esta feature, escrito para que no se pierda: **una
búsqueda en lenguaje natural de más de una palabra casi siempre devuelve cero**
con AND estricto. Arreglarlo de verdad (puntuar por cuántos tokens coinciden y
ordenar, en vez de exigirlos todos) **es otra feature**, con su propio
expediente. La tajada 1 tapa el caso concreto, frase a frase; no cierra el
problema.

**(B) Cien iconos nuevos: el número no da. Medido.** De 2.000 exportaciones de
`@fortawesome/free-solid-svg-icons` (única familia instalada; no hay `regular`
ni `brands` en `package.json:21-23`) hay **1.422 `iconName` únicos**; el
catálogo ya usa **868**, así que quedan **554 libres**. Pero:

- quitando cromo de interfaz (flechas, ángulos, carets, chevrons, letras
  sueltas, dígitos, `face-*`, `square-*`, `circle-*`, formato de texto) quedan
  **269**;
- quitando además catástrofe/reparto humanitario (`bridge-circle-*`,
  `house-flood-water`, `tarp`, `tents`, `person-drowning`…), zodiaco (12),
  armas y militar, símbolos de moneda exótica (14: `florin-sign`, `kip-sign`,
  `tenge-sign`…), género y variantes duplicadas, quedan **113**;
- y de esos 113, leídos uno a uno, los que sirven de verdad para «una actividad
  o un hábito» (criterio 512) son del orden de **60-80**: `truck-moving`,
  `traffic-light`, `kit-medical`, `mitten`, `igloo`, `baby-carriage`,
  `person-pregnant`, `person-breastfeeding`, `solar-panel`, `magnet`, `tape`,
  `compass`, `monument`, `gifts`, `restroom`, `envelope-open`, `martini-glass-empty`,
  `flask-vial`, `car-tunnel`, `mountain-city`, `tree-city`, `user-astronaut`,
  `child`, `child-dress`, `hat-cowboy`, `cube`, `cubes`, `image-portrait`,
  `chart-diagram`, `bus-side`, `truck-pickup`, `truck-front`, `cloud-bolt`,
  `cloud-sun-rain`, `cloud-moon-rain`, `icicles`, `archway`, `house-flag`,
  `building-flag`, `pen-clip`, `hand-scissors`, `comment-medical`,
  `file-prescription`, `mobile-screen-button`, `tablet`, `vest`, `trailer`…

**Los criterios 509 (≥968 iconos) y 512 (cada uno elegido por utilidad, no para
rellenar cupo) no se pueden cumplir los dos.** No reescribo criterios: lo dejo
escrito y va al reporte como decisión del usuario (**D-E**, abajo). El patrón
correcto ya está inventado dentro de este mismo expediente: es el criterio 529
aplicado a iconos — entregar **la cifra real medida** en vez de forzar.

*Comando para reproducir el conteo* (no es código de producto, es una medición;
el constructor debería volver a correrlo al cerrar la tajada 2):

```bash
node -e "const fs=require('fs');const fa=require('@fortawesome/free-solid-svg-icons');
const used=new Set();for(const f of fs.readdirSync('src/shared/icons/catalog').filter(f=>f.endsWith('.icons.ts')))
for(const m of fs.readFileSync('src/shared/icons/catalog/'+f,'utf8').matchAll(/icon:\s*(fa[A-Za-z0-9]+)/g))used.add(fa[m[1]].iconName);
const libres=[...new Set(Object.keys(fa).filter(k=>k.startsWith('fa')&&fa[k]&&fa[k].iconName).map(k=>fa[k].iconName))].filter(n=>!used.has(n));
console.log('usados',used.size,'libres',libres.length);console.log(libres.join(' '))"
```

**(C) Más colores: la puerta ΔE ≥ 15 no es la puerta. Medida.** Sobre una
rejilla de 4.096 colores (16 pasos por canal), usando el `deltaE` de
`habit-colors.test.ts:40`:

- pasan **ΔE ≥ 15 de los seis del núcleo**: **1.807 de 4.096 (44 %)**. La puerta
  del criterio 524 es **barata**: ocho colores nuevos la pasan sin esfuerzo.
- La puerta que sí ata es otra y **ningún test la mira**: la luminosidad. Los 17
  actuales caben en una banda estrecha, `L` de OKLab **0,449 (`indigo`) a 0,769
  (`amber`)**, y `ColorPicker.module.scss:57-62` lo dice por escrito: la palomita
  es **blanca** y se lee «en los diecisiete» porque todos están en la banda clara
  (el más justo, `amber`, da 2,15:1 con blanco y se sostiene con el
  `drop-shadow`). Un color fuera de esa banda —y el ΔE **premia** justo los
  extremos: el negro puntúa ΔE 55— deja la palomita ilegible. Dentro de la banda
  siguen pasando **437 de 4.096 (10,7 %)**. Sigue sobrando.
- La puerta de verdad es la tercera: **parecerse a los once extendidos que ya
  hay**. Exigiendo ΔE ≥ 11,2 (el suelo que el propio `color-palette.ts:61`
  documenta como aceptable: `mauve` ↔ `rose`) contra los once, de 4.096 quedan
  **23**; y una tanda que además se separe 11,2 **entre sí** da **5**:
  `#dd00ff`, `#ff00aa`, `#aaaaaa`, `#555555`, `#887777` — dos fucsias y tres
  grises.

Traducción para D-D: **«al menos 8 más» es alcanzable contra el test, y no lo es
contra el ojo.** Con la rejilla gruesa el techo útil medido es **~5**, y una
barrida fina (paso 8, o un barrido en OKLCH) subirá algo esa cifra, no la
multiplicará. La paleta está prácticamente saturada, que es lo mismo que ya
descubrió `docs/remodel/11-mas-color-mas-iconos.spec.md` un nivel más arriba.
Va al reporte como **D-D revisada**.

*Medición reproducible* (rejilla, banda y separación, en un solo comando): está
en el reporte del arquitecto; el constructor la repite con paso 8 antes de
proponer hexadecimales.

---

### Dónde va el código nuevo, fichero a fichero

**Tajada 1 — palabras clave** (solo datos; **ningún fichero nuevo**):
- `src/shared/icons/catalog/home.icons.ts` — `kitchen-set` (y vecinos de cocina:
  `fire-burner`, `blender`, `mortar-pestle`), **solo el array `keywords`**.
- `src/shared/icons/catalog/*.icons.ts` — el resto de las ≥15 palabras clave.
- `src/shared/icons/catalog-integrity.test.ts:186-201` — **añadir pares a la
  tabla `cases`**, no tocar ninguna regla de `:92-181`.

**Tajada 2 — iconos nuevos** (solo datos):
- `src/shared/icons/catalog/*.icons.ts` — entradas nuevas con la forma de
  `home.icons.ts:93`, cada una con su `import { faXxx }` **nominal** en la
  cabecera del mismo fichero.
- Nada más. `app-icons.ts`, `icon-registry.ts` y `categories.ts` **no se tocan**:
  el catálogo se compone solo (`app-icons.ts:21-34`).

**Tajada 3 — el sorteo de Vida** (la única con lógica):
- **CREAR** `src/features/vida/utils/vida-category-color.utils.ts` — copia de
  `habit-colors.ts:44-65` renombrada a `pickInitialCategoryColor(usedColors,
  random = Math.random)`, importando `CORE_COLORS` y `normalizeColor` de
  `@/shared/ui/ColorPicker/color-palette` (**del submódulo, no del barril**: es
  un fichero de datos y ahí no entra React — la razón está escrita en
  `habit-colors.ts:14-15`).
- **CREAR** `src/features/vida/utils/vida-category-color.utils.test.ts` — calcado
  de `habit-colors.test.ts:138-219`, con su `fixedRandom`.
- **MODIFICAR** `src/features/vida/components/CreateVidaCategoryStep/CreateVidaCategoryStep.tsx`:
  - importar `useActivityCategoriesQuery` del hook que **ya se importa en `:2-5`**;
  - línea `38` (`const [color, setColor] = useState<string | null>(null)`) pasa a
    sembrarse con el sorteo;
  - actualizar el comentario de `:27` («los diecisiete de la paleta») si la
    tajada 4 ya entró.
- **MODIFICAR** `src/features/vida/components/VidaActivitySheet/VidaActivitySheet.test.tsx:200-210`
  — es el **único** sitio que renderiza el paso; ahí van 516, 518, 520 y 522.

  **La trampa del montaje, y por qué no basta con copiar el `useState(() => …)`
  de hábitos.** `HabitCreateWizard` se permite el inicializador porque la lista
  de hábitos «casi siempre viene de la caché». Aquí el paso se apila dentro de
  `VidaActivitySheet`, y si en ese primer render `useActivityCategoriesQuery()`
  todavía devuelve `data: undefined`, el sorteo ve **cero categorías** y puede
  repetir un color — el criterio 516 se incumple en frío y **en verde**, porque
  en los tests el hook está mockeado con datos síncronos. Siembra con un
  `useRef` que marque «ya sorteado» y sortea en cuanto llegue la primera lista:
  cumple 516 **y** 518 (una vez, no por render), y deja el caso frío cubierto.
  Si prefieres el inicializador por fidelidad al precedente, dilo en la sección 3
  con esa consecuencia escrita.

- **NO tocar** `VidaCategoryForm.tsx` (criterio 521: editar no sortea) ni
  `VidaCategoriasPage.tsx` (`:36` dice por escrito que ahí solo se lista y se
  edita; crear vive en «+ nueva»). **No hay un segundo punto de creación.**

**Tajada 4 — más colores extendidos**:
- **MODIFICAR** `src/shared/ui/ColorPicker/color-palette.ts:70-82`
  (`EXTENDED_COLORS`) y el comentario de `:57-68`, que dice «once».
- **MODIFICAR** `src/features/habits/data/habit-colors.test.ts:47-68` — fija
  `toHaveLength(11)`, `toHaveLength(17)` y `toBe(17)` **a mano**. Es
  obligatorio: sin eso la tajada 4 sale roja. La puerta ΔE de `:84-95` no se
  toca, solo se ejecuta sobre más colores.
- **MODIFICAR** `src/shared/ui/ColorPicker/ColorPicker.test.tsx:8-11`
  (`toHaveLength(17)`) y `VidaActivitySheet.test.tsx:203-208`
  (`toHaveLength(17)`).
- **MODIFICAR los comentarios que quedarían mintiendo**: `color-palette.ts:10`,
  `habit-colors.ts:10`, `ColorPicker.tsx:55`, `ColorPicker.module.scss:3` y `:59`,
  `VidaCategoryForm.tsx:41`, `CreateVidaCategoryStep.tsx:27`,
  `VidaActivitySheet.test.tsx:203`. Todos dicen «diecisiete» (lista completa:
  `grep -rn "diecisiete\|toBe(17)\|toHaveLength(17)" src/`).
- **No tocar** `ColorPicker.module.scss` por desbordamiento: `.root` ya es
  `display:flex; flex-wrap:wrap` (`:5-10`) y la propia cabecera dice que es «la
  red de seguridad de los 375 px». Los colores nuevos bajan de fila, no
  desbordan. **Mídelo igual** (criterio 527) y mídelo bien: la pestaña emula
  **568 px**, así que se mide metiendo el formulario en un `iframe` del ancho
  exacto (375 y 760), y el `iframe` **no puede ir dentro de un contenedor flex**
  porque lo encoge ignorando su `width`.

### Lo que NO hay que crear

- **Un buscador, un normalizador o un ranking de iconos.** `filterAppIcons` ya
  normaliza tildes y mayúsculas y cachea el pajar por entrada
  (`icon-search.ts:17-33`). Tocarlo está fuera de alcance.
- **Un `ColorPicker`, un `ColorSwatch` o una paleta de Vida.** Existe uno
  compartido, con `role="radiogroup"`, teclado completo (`ColorPicker.tsx:62-80`)
  y el hueco del «color actual» heredado (`:41-49`).
- **Un sorteo compartido en `shared/`.** `color-palette.ts:10-13` dice
  explícitamente por qué el sorteo **no** se mudó allí. El de Vida vive en Vida.
- **Un fichero de datos de colores para Vida.** Se importa `CORE_COLORS`.
- **Un test nuevo de `catalog-integrity`.** Se añaden filas a su tabla.
- **Un `CreateVidaCategoryStep.test.tsx` nuevo**, salvo que el paso crezca:
  `VidaActivitySheet.test.tsx` ya lo monta con el `SteppedModal` real.

### Dónde NO va

- **En `src/features/vida/data/`.** Ahí vive `vida-starting-points.ts`, que es un
  catálogo de datos; las funciones puras de Vida están todas en
  `src/features/vida/utils/vida-*.utils.ts` (46 ficheros). Hábitos lo puso en
  `data/` solo porque la paleta vivía ahí, y ya no vive ahí.
- **En `icon-search.ts`.** Descartado: cambiar AND por puntuación arregla de
  verdad «no se encuentran», pero es otra feature (ver **(A)**) y reventaría la
  tabla de 15 casos y `IconPicker.test.tsx:75-90`.
- **En `@fortawesome/free-regular-svg-icons`.** Descartado: no está instalado
  (`package.json:21-23`), y aunque `far:heart` no choca con `fas:heart` en la
  regla de `catalog-integrity.test.ts:125`, serían **los mismos dibujos en
  contorno**: cupo relleno, criterio 512 incumplido, y dependencia nueva.
- **En `HabitCategoryForm.tsx:84-99`.** Fuera de alcance por D-C.
- **En el invalidador de caché.** Comprobado contra `vite/cache-shape.ts:28-45`:
  entra lo que esté en `graphql/*.graphql.ts`, `api/*.api.ts`, `src/shared/api/*.ts`
  o llame a `setQueryData`. **Ninguna de las cuatro tajadas toca nada de eso**
  (datos de iconos, datos de paleta, una utilidad pura y estado de componente).
  → **Ninguna tajada de FEAT-017 tira la caché de nadie.** Se lo puedes prometer
  al usuario en los cuatro despliegues.

### Trampas concretas de esta feature

1. **`IconPicker.test.tsx:75-90` cuenta resultados**: busca `lavadora` y exige
   **exactamente 1**. Si la tajada 1 o la 2 mete «lavadora» en otra entrada, ese
   test se cae — y es **el mismo fichero flaky** que documenta `ENVIRONMENT.md`
   (`normalizes selection to stored name bell` falla a veces en la corrida
   completa y pasa 6/6 aislado). **Al tocar iconos vas a ver rojos que no son
   tuyos: córrelo aislado antes de culparte.**
2. **`icon-search.test.ts:16-20 y :39-46` exigen pureza de categoría**: todo
   resultado de «finanzas» tiene que ser `category: 'finance'` y todo el de
   «mascota», `pets`. Una palabra clave «finanzas» o «mascota» en otra categoría
   los rompe. Y «finanzas» entra al pajar por la **etiqueta de categoría**
   (`icon-search.ts:26`), no por `keywords`.
3. **Los mocks de `useActivityCategories`.** La tajada 3 estrena una llamada a
   `useActivityCategoriesQuery` dentro de `CreateVidaCategoryStep`. Comprobado:
   las **siete** suites que mockean ese módulo ya lo listan
   (`VidaActivitySheet`, `VidaAjustesPage`, `VidaPlantillaPage`, `VidaHoyPage`,
   `VidaCategoriasPage`, `VidaActividadesPage`, `VidaArchivadasPage`), así que
   **esta vez la trampa de `ENVIRONMENT.md` no muerde**. Vuelve a comprobarlo si
   añades cualquier otro hook.
4. **El CSS no avisa.** Si acabas tocando un `.module.scss`, la comprobación no
   es el tamaño: se compila el SCSS de `HEAD` y el del árbol con
   `sass --style=compressed` y se comparan **las listas de selectores**. Un
   `/*` sin cerrar se llevó cuatro reglas el 2026-09-22 y solo lo delató una
   bajada de 0,57 kB.
5. **El peso, con cifra.** Línea base `app-icons` **620 kB** para 868 iconos
   (~0,71 kB/icono). Si la tajada 2 entrega N iconos, el coste esperado es
   **N × 0,71 kB**: 100 → ~+71 kB; 70 → ~+50 kB. Es un chunk **perezoso**: no
   entra en el arranque salvo que alguien importe `@/shared/ui/IconPicker/IconPicker`
   en vez del barril. Se mide con `pnpm build` (criterio 515) y **el chunk
   inicial tiene que seguir en 1.149,14 kB**.
6. **Todo esto vive tras el login.** El recorrido real (abrir «+ nueva» y ver el
   color ya puesto) lo hace el usuario. Lo que sí se puede sin sesión: los tests,
   y un arnés temporal bajo `src/` con `MemoryRouter` (se borra antes de
   reportar).

### ¿Hace falta render aprobado antes de construir?

- **Tajadas 1, 2 y 3: no.** Ninguna cambia una pantalla: la 1 y la 2 meten más
  fichas en una rejilla que ya existe, y la 3 deja marcada una muestra que ya se
  dibujaba. Cero píxeles nuevos.
- **Tajada 4: no hace falta un render, pero sí una decisión del usuario, y es de
  color, no de forma.** La fila pasa de 17 a N muestras y baja de línea sola
  (`flex-wrap`). Lo que no puede decidir un agente es **qué tonos**. Lo barato es
  una **hoja de muestras**: un `.html` estático bajo `docs/` con los candidatos
  pintados sobre vidrio claro y vidrio oscuro, con su nombre en español, su ΔE
  mínimo al núcleo y su ΔE mínimo a los once actuales — Vite sirve `docs/` sin
  login (`ENVIRONMENT.md`). El usuario responde tres cosas: **(1)** cuántos
  acepta sabiendo que el techo útil medido ronda 5 y no 8; **(2)** si prefiere
  menos colores bien distintos o más colores parecidos entre sí; **(3)** si acepta
  que alguno salga de la banda `L 0,449-0,769`, lo que obliga a cambiar el color
  de la palomita en `ColorPicker.module.scss:57-62` (hoy blanca para todos).

---

### Slices, with paths

| # | What it does | Files | Criteria it closes | State |
|---|---|---|---|---|
| 1 | Las búsquedas de iconos que hoy devuelven cero encuentran el icono que ya existe (incluida «chef» y la frase «sombrero de chef») | `src/shared/icons/catalog/home.icons.ts` (`kitchen-set`, `fire-burner`, `blender`, `mortar-pestle`) + el resto de `catalog/*.icons.ts`, **solo arrays `keywords`**; filas nuevas en la tabla `cases` de `catalog-integrity.test.ts:186` | 504, 505, 506, 507, 508, 530 | pending |
| 2 | Los iconos útiles que quedan en Font Awesome Free entran al catálogo, con la cifra real medida | entradas nuevas en `src/shared/icons/catalog/*.icons.ts` con sus `import { faXxx }`; **nada más** | 510, 511, 512, 513, 514, 515, 530 — y **509 con la cifra real** (ver D-E) | pending |
| 3 | Al abrir «+ nueva categoría» en Vida el color ya viene puesto, y no repite el de otra categoría | **crear** `src/features/vida/utils/vida-category-color.utils.ts` y `…utils.test.ts`; **modificar** `CreateVidaCategoryStep.tsx:38` (+ el import del hook) y `VidaActivitySheet.test.tsx:200-210`. **`VidaCategoryForm.tsx` y `VidaCategoriasPage.tsx` no se tocan** | 516, 517, 518, 519, 520, 521, 522, 523, 530 | pending |
| 4 | La paleta compartida gana los colores extendidos que de verdad se distinguen | `color-palette.ts:57-82`; contadores de `habit-colors.test.ts:47-68`, `ColorPicker.test.tsx:8-11`, `VidaActivitySheet.test.tsx:203-208`; los comentarios que dicen «diecisiete» | 524, 525, 526, 527, 528, 529, 530 | pending |

**Las cuatro tajadas siguen siendo verticales y del expediente: no las he
recortado.** El orden 1 → 2 → 3 → 4 es correcto y **la 4 va la última a
propósito**: es la única que rompe contadores en tres ficheros de test ajenos, y
llevarla antes obliga a la 3 a arreglar rojos que no son suyos. La 3 no depende
de la 4 (solo sortea entre el núcleo, criterio 528).

**Decisiones nuevas que no son mías** (van al usuario; no bloquean las tajadas
1 y 3):

- **D-E — La tajada 2 no puede dar 100 iconos útiles.** Medido: quedan 554
  `iconName` libres en Font Awesome Free solid, ~269 sin cromo de interfaz, ~113
  sin catástrofe/zodiaco/armas/monedas, y del orden de **60-80** que de verdad
  nombran una actividad o un hábito. **509 (≥968) y 512 (por utilidad, no por
  cupo) se contradicen.** Opciones: **(a)** entregar los que haya con la cifra
  real, como hace 529 con los colores — es lo que recomiendo; **(b)** llegar a
  100 metiendo zodiaco, banderas, monedas y catástrofes, y romper 512;
  **(c)** comprar Font Awesome Pro, que también resolvería el sombrero de chef
  de D-A. **No construyas la tajada 2 sin esta respuesta**: las tres dan
  catálogos distintos.
- **D-D revisada — «al menos 8 colores más» pasa el test y no pasa el ojo.**
  Contra la puerta del criterio 524 (ΔE ≥ 15 del núcleo) caben de sobra: 44 % del
  espacio de color. Contra el ojo, exigiendo además la banda de luminosidad que
  la palomita blanca necesita y ΔE ≥ 11,2 de los once extendidos actuales, la
  tanda máxima medida con rejilla gruesa es **5**. Una barrida fina subirá algo
  esa cifra. El usuario decide entre **~5 bien distintos** o **8+ con parecidos**,
  sobre la hoja de muestras.

## 3. Construction — feature-builder

*(pendiente)*

## 4. Review — feature-reviewer

*(pendiente)*
