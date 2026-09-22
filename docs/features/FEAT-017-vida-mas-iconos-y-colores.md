---
id: FEAT-017
title: Categorías — más iconos que se encuentran, más colores, y uno que no se repite al crear
status: specified
architect: no    # las cuatro tajadas cuelgan de estructuras ya existentes: los datos del catálogo de iconos (src/shared/icons/catalog/*.icons.ts), los dos niveles de la paleta (src/shared/ui/ColorPicker/color-palette.ts) y el sorteo que ya existe para hábitos (src/features/habits/data/habit-colors.ts, pickInitialHabitColor), que documenta por escrito que su equivalente de Vida es dominio de Vida y vive en Vida. Ninguna tajada crea entidad, pantalla ni cruce de capas nuevo.
area: shared/icons, shared/ui, features/vida
requested: 2026-09-22
updated: 2026-09-22
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

*(no aplica: `architect: no`)*

## 3. Construction — feature-builder

*(pendiente)*

## 4. Review — feature-reviewer

*(pendiente)*
