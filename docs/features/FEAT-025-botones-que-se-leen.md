---
id: FEAT-025
title: Los botones se leen — el verde y el rojo de Aura con texto que se distingue, sobre todo en oscuro
status: building    # tajada 1 aceptada; 2-4 esperan D-A, D-B y D-C
architect: no    # cambia valores de tokens y reglas de un componente que ya existe (shared/ui/Button); no hay concepto nuevo
area: shared/ui, app/styles
requested: 2026-09-28
updated: 2026-09-28
---

# FEAT-025 — Los botones se leen

## 1. La petición — feature-analyst

**Resumen para quien venga detrás:** el `Button` de Aura pinta texto blanco
sobre un verde (`primary`, de 2,22:1 a 3,77:1, en los dos temas) y sobre un rojo
rosado en oscuro (`danger`, 1,70:1). La tajada 1 es **una hoja de muestras**
—actual frente a propuestas, en claro y en oscuro, sobre el vidrio real y con el
contraste medido— para que el usuario elija; hasta que elija, no se toca ni un
color de la app.

**Qué problema resuelve:** la acción principal de casi todas las pantallas (el
botón que guarda, empieza o confirma) y la confirmación roja de las acciones
irreversibles de hábitos **no se leen bien**: la etiqueta blanca se funde con el
fondo del propio botón. En oscuro, el rojo es directamente ilegible. No es un
fallo de una pantalla: es del sistema de diseño, está anotado como deuda desde
FEAT-005 y FEAT-006, y cada feature nueva lo hereda o lo esquiva a mano (las
confirmaciones nuevas de Vida usan `secondary` para no caer en el rojo, según
`docs/features/ENVIRONMENT.md:225` y el comentario de
`src/features/vida/components/VidaTemplateRemoveDialog/VidaTemplateRemoveDialog.tsx:84`).

**Para quién es:** para el usuario en cualquier pantalla de Vida y de hábitos
que tenga un botón principal o de confirmación roja, a cualquier hora y más aún
de noche con el tema oscuro. Consumidores medidos por `grep`:

- `Button` sin `variant` **es `primary`** por defecto
  (`src/shared/ui/Button/Button.tsx:36`), así que la cifra de consumidores
  explícitos (48 `variant="primary|danger"` en 40 ficheros `.tsx`) se queda
  corta: son prácticamente todas las pantallas de `/app/vida/*` y
  `/app/habits/*`, más el inicio público y el formulario de acceso.
- `ConfirmDialog` pinta su botón de aceptar como `danger` o `primary`
  (`src/shared/ui/ConfirmDialog/ConfirmDialogProvider.tsx:97`). Piden `danger`
  **nueve** confirmaciones de hábitos: `HabitMeasuresPage.tsx:78`,
  `HabitPersonaPage.tsx:138`, `ArchivedHabitCard.tsx:46`,
  `HabitCategoriesPage.tsx:81`, `HabitFollowUpForm.tsx:151`,
  `HabitDetailPage.tsx:82`, `HabitDayRow.tsx:124`, `HabitCard.tsx:44`,
  `HabitListCard.tsx:97` (todas bajo `src/features/habits/`).
- `Button variant="danger"` directo: uno, el botón rojo de la ficha de un hábito
  archivado (`src/features/habits/pages/HabitDetailPage.tsx:139-146`).

**Palabras del usuario:** el usuario aceptó hoy, tal cual, la recomendación de
«que los botones del design system Aura se lean en modo oscuro». No hay frase
propia más allá de esa aceptación; el problema de fondo (la etiqueta no se
distingue de su fondo) está escrito arriba por mí y se apoya en las mediciones.

### El problema, medido

Cifras **calculadas** con la fórmula de luminancia y contraste de WCAG 2.x a
partir de los tokens del árbol (no en el navegador: no tengo uno). Sirven para
acotar; la hoja de muestras de la tajada 1 las **remide** sobre el vidrio real.
La cifra de FEAT-006 (**2,54:1**, medida en navegador y sobre el fondo
compuesto) cae dentro del rango calculado.

Tokens: `src/app/styles/_theme-variables.scss:155-296` (ámbito
`[data-ds='aura']` y su versión oscura). Estilos:
`src/shared/ui/Button/Button.module.scss`.

**Tamaños reales de letra** (`Button.module.scss:31-47`, peso 600):
`sm` 14 px, `md` 16 px, `lg` 17 px. WCAG llama «texto grande» a ≥ 24 px o
≥ 18,66 px en **negrita** (700); ninguno llega. **Umbral para toda etiqueta de
botón: 4,5:1.** Los iconos y el spinner dentro del botón son no-texto:
**3:1**, y como pintan con el mismo color que la etiqueta, al cumplir 4,5 el
texto cumplen también ellos.

| Variante | Estado | Tema | Texto sobre fondo | Contraste | ¿AA? |
|---|---|---|---|---|---|
| `primary` | reposo | claro **y** oscuro (el degradado no cambia con el tema: `--aura-cta-bg` solo se define en `:155`) | `#fff` sobre `linear-gradient(135deg, #10b981, #059669)` | **2,22** (extremo claro) · **3,07** (centro) · **3,77** (extremo oscuro) | no, en ningún punto |
| `primary` | hover | los dos | mismo fondo (`--button-primary-hover-bg` = `--aura-cta-bg`, `:223`), solo sube 2 px | igual que reposo | no |
| `danger` | reposo | claro | `#fff` sobre `#ba1a1a` | **6,46** | sí |
| `danger` | hover | claro | `#fff` sobre `#ba1a1a` con `brightness(1.08)` ≈ `#c91c1c` | **5,73** | sí |
| `danger` | reposo | **oscuro** | `#fff` sobre `#ffb4ab` | **1,70** | no |
| `danger` | hover | **oscuro** | `#fff` sobre `#ffb4ab` aclarado ≈ `#ffc2b9` | **1,52** (el hover **empeora**) | no |
| `secondary` | reposo | claro / oscuro | `#0f172a` / `#eef2ff` sobre la superficie | > 12 en los dos | sí |
| `secondary` | hover | claro / oscuro | `#006c49` / `#4edea3` sobre la superficie | ≈ 6,4 / ≈ 9,5 | sí |
| `ghost` | reposo y hover | claro / oscuro | `#475569` / `#a8b3c7` (hover: `--color-text`) | ≈ 7,6 / ≈ 7,7 | sí |
| todas | foco | claro | anillo `rgba(124,58,237,.45)` sobre `#fafcfb` | ≈ 2,05 (no-texto, pide 3) | no |
| todas | foco | oscuro | el mismo anillo (el ámbito oscuro de Aura no lo redefine) sobre `#0b1220` | ≈ 1,56 (pide 3) | no |
| todas | deshabilitado | los dos | `opacity: .55` | exento en WCAG (control inactivo) | n/a |
| todas | cargando | los dos | spinner `currentColor` (blanco en `primary`/`danger`) **y** el botón queda `disabled` → `opacity: .55` (`Button.tsx:126`) | hereda el de reposo, y más tenue | exento como inactivo; ver fuera de alcance |

`secondary` y `ghost` sobre vidrio: cifras aproximadas sobre el fondo base
(`#fafcfb` / `#0b1220` con la superficie encima); los orbes de la aurora mueven
el fondo, y por eso la hoja mide sobre el vidrio real.

> **Nota del revisor, 2026-09-28 (tajada 1).** Tres cifras de esta sección
> están mal calculadas; se deja el texto del analista como está y se corrige
> aquí. Ninguna cambia un criterio ni una decisión.
> - **2,22 → 2,54.** Blanco sobre `#10b981` (el extremo claro del degradado)
>   da **2,54** con la fórmula de WCAG, no 2,22. Afecta al resumen de arriba, a
>   la fila `primary` de esta tabla, a los hermanos («2,22–3,77») y a D-A (d) y
>   D-C. Medido en la píldora, que no llega a la esquina del degradado, da
>   **2,59**; en los círculos de los hermanos, **2,73** («hecho») y **2,76**
>   (chip), por debajo incluso del 3:1 de un glifo.
> - **8,04 → 7,04** en D-A (b): `#0f172a` sobre `#10b981`.
> - **1,52 → 1,54** en `danger` hover oscuro: blanco sobre el propio `#ffc2b9`
>   que da la tabla.
> - Redondeos sin consecuencia: D-B (a) 6,53 → 6,54; D-B (b) «≈ 7,6» → 7,72.

### Hermanos, uno por uno

| Hermano | Qué pinta | Medido | Entra |
|---|---|---|---|
| `Button` como enlace (`to=`) | las mismas clases que el botón (`Button.tsx:106`) | idéntico a la tabla de arriba | **sí**, sin trabajo aparte: es el mismo CSS |
| `ConfirmDialog` (aceptar) | `Button` `danger` o `primary` | idéntico | **sí**, sin trabajo aparte |
| `IconButton` `primary` | `#fff` sobre `--color-primary`: claro `#006c49`, oscuro `#4edea3` (`IconButton.module.scss:36-44`) | claro ≈ 6,5; **oscuro ≈ 1,71** (icono, pide 3) | **no**: ningún consumidor pide `variant="primary"` a un `IconButton` (grep sin resultados). Queda anotado como latente |
| `IconButton` `danger` | reposo: `--color-danger` sobre su tinte al 12 %; hover: `#fff` sobre `--color-danger` (`:66-75`) | reposo pasa en los dos; **hover oscuro 1,70** | **no**, mismo motivo: sin consumidores con `variant="danger"`. Latente |
| Botón «hecho» del día de un hábito (`HabitDayRow.module.scss:238-243`, `.toggleDone`) | `#fff` sobre `--aura-cta-bg`, letra 15 px/600 (`:84-85`) | igual que `primary`: 2,22–3,77 | **lo decide el usuario** (D-C) |
| Chip de día cumplido (`HabitDayMarker.module.scss:106-111`) | número o glifo `#fff` sobre `--aura-cta-bg` | igual: 2,22–3,77 | **lo decide el usuario** (D-C) |
| Punto hecho del asistente de hábito (`HabitCreateWizard.module.scss:72-74`) y relleno de la barra de métricas (`HabitMyDayMetrics.module.scss:227-233`) | el degradado **sin texto encima** | no aplica contraste de texto | **no**: no hay nada que leer |
| Enlaces de la barra (`--nav-link-*`) | texto `--color-primary` sobre blanco / vidrio | ya pasan (FEAT-020) | **no** |
| Paleta Apple fuera de Aura (solo `/app/settings/*`, `AppLayout.tsx:93`) | `primary` oscuro `#fff` sobre `#409cff` ≈ 2,83; `danger` oscuro `#fff` sobre `#ff3b30` ≈ 3,55 | no pasan | **no**: ese ámbito espera su migración a Aura (`_theme-variables.scss:148-154`) y ahí heredará lo que se decida aquí |

**Fuera de alcance:**

- **El anillo de foco** (≈ 2,05 en claro, ≈ 1,56 en oscuro). Es de **todos** los
  componentes enfocables (campos, `IconButton`, enlaces), no solo de los
  botones: arreglarlo aquí cambiaría cómo se ve el foco en toda la app sin que
  nadie lo haya pedido. Queda medido y propuesto como expediente aparte.
- **El aspecto de «cargando» y «deshabilitado».** Siguen con `opacity: .55`.
  WCAG exime a los controles inactivos; si el usuario quiere que la etiqueta de
  un botón que está guardando se lea igual que en reposo, es otra conversación.
- **Devolver al rojo las confirmaciones de Vida** que hoy usan `secondary` para
  esquivar el `danger` ilegible. Cuando el rojo se lea, cambiarlas es una
  decisión de cada pantalla, no de esta feature.
- **`IconButton` `primary` y `danger`**: medidos y con el mismo defecto en
  oscuro, pero sin consumidores hoy. No se tocan.
- **La paleta Apple de `/app/settings/*`**: medida, no se toca.
- **La forma y el tamaño de los botones** (radio, relleno, sombra, el salto de
  2 px del hover): solo cambia el color del fondo y/o de la etiqueta.
- **Las variantes `secondary` y `ghost`**: ya pasan AA en los dos temas.
- **El `danger` en claro**: ya pasa (6,46 / 5,73). Solo cambia si el usuario, al
  ver la hoja, quiere que claro y oscuro se parezcan (D-B).
- **Los colores de categoría y de hábito** (FEAT-017): no son botones.

**Criterios de aceptación:**

Los contrastes se miden **en el navegador, sobre el fondo compuesto real**
(vidrio encima de la aurora, como hizo FEAT-006), en el punto **más
desfavorable** del fondo del botón si es un degradado, y en los **dos** temas.

- [ ] 640. Existe `docs/features/assets/FEAT-025-hoja-de-muestras.html` que
  enseña, lado a lado y **en claro y en oscuro**, el `Button` `primary` y el
  `danger` **actuales** y **al menos dos propuestas** para cada uno, en reposo y
  en hover, cada muestra en tamaño `sm` y `md`, **sobre el vidrio real de Aura**
  (tarjeta de vidrio sobre la aurora, no sobre blanco o negro liso). Debajo de
  cada muestra figura su contraste medido, con el punto donde se midió.
- [ ] 641. La hoja incluye los dos hermanos de D-C (el botón «hecho» del día y
  el chip de día cumplido de hábitos) con cómo quedarían si siguen al botón y si
  no, para que la decisión se vea.
- [ ] 642. La hoja abre como fichero suelto en el navegador sin servidor, igual
  que `docs/features/assets/FEAT-017-hoja-de-muestras.html`.
- [ ] 643. Ningún fichero de `src/` cambia en la tajada 1.
- [ ] 644. Tras aplicar la opción elegida, la etiqueta del `Button` `danger` mide
  **≥ 4,5:1** en oscuro **en reposo y en hover**, en `sm`, `md` y `lg`.
- [ ] 645. El `danger` en claro no baja de su cifra actual en reposo (6,46) ni en
  hover (5,73), salvo que el usuario elija en D-B una opción que lo cambie, y
  aun así **≥ 4,5:1**.
- [ ] 646. El botón de aceptar de las nueve confirmaciones `danger` de hábitos
  (lista en «Para quién es») y el botón rojo de la ficha de un hábito archivado
  cumplen 644 sin tocar esas pantallas: se comprueba abriendo **una** de ellas
  en oscuro y midiendo.
- [ ] 647. Tras aplicar la opción elegida, la etiqueta del `Button` `primary`
  mide **≥ 4,5:1** en **reposo y hover**, en `sm`, `md` y `lg`, en el tema o los
  temas que el usuario elija en D-A, midiendo en el **extremo más claro** del
  fondo si sigue siendo un degradado.
- [ ] 648. `Button` con `to=` (como enlace) da las mismas cifras que el botón
  equivalente: se mide uno de cada variante.
- [ ] 649. El spinner de «cargando» sigue viéndose dentro del botón en las dos
  variantes y los dos temas: con el botón en `isLoading`, el arco del spinner
  mide **≥ 3:1** contra el fondo del botón **antes** de la opacidad de
  deshabilitado (la opacidad queda como está, ver fuera de alcance).
- [ ] 650. `secondary` y `ghost` no cambian: sus cifras en reposo y hover son las
  mismas antes y después (± 0,1), en los dos temas.
- [ ] 651. Lo que se ve coincide con la muestra aprobada: mismo color de fondo,
  mismo color de etiqueta, en los dos temas. Si el constructor se aparta, lo
  dice y por qué.
- [ ] 652. Con una etiqueta tres veces más larga de lo normal (p. ej. «Moverlo a
  las 20:30 y avisarme mañana también por la mañana») a 375 px, el contraste no
  cambia (no hay texto que se salga del fondo del botón hacia el vidrio) y no
  aparece scroll horizontal: `scrollWidth === clientWidth`.
- [ ] 653. Si el usuario decide en D-C que los hermanos siguen al botón: el
  número o glifo del chip de día cumplido y el contenido del botón «hecho» miden
  **≥ 4,5:1** (texto) o **≥ 3:1** (glifo) en los dos temas. Si decide que no,
  **no cambian ni un píxel**: se comprueba midiendo su fondo antes y después.
- [ ] 654. `pnpm typecheck` limpio; `pnpm lint` y `pnpm test` no peores que la
  línea base (hoy: lint 14/0, tests 2 fallos preexistentes de `SearchSelect`);
  `pnpm build` verde.

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | **La hoja de muestras.** Un HTML suelto en `docs/features/assets/` con `primary` y `danger` actuales frente a las propuestas, en claro y oscuro, sobre el vidrio real, con el contraste medido debajo de cada una, y los hermanos de D-C. Sirve para que el usuario elija; no toca la app. Cierra 640-643. | accepted |
| 2 | **El rojo se lee en oscuro.** Se aplica la opción de D-B: el botón de aceptar de las confirmaciones de hábitos y el botón rojo de la ficha del hábito archivado se leen de noche. Es la peor cifra (1,70) y la de menos superficie. Cierra 644-646 y la parte `danger` de 648-652, 654. | pending (espera D-B) |
| 3 | **El verde se lee.** Se aplica la opción de D-A: la acción principal de todas las pantallas de Vida y hábitos se lee, en el tema o temas elegidos. Cierra 647 y la parte `primary` de 648-652, 654. | pending (espera D-A) |
| 4 | **Los hermanos**, solo si D-C dice que siguen: el botón «hecho» y el chip de día cumplido de hábitos. Si D-C dice que no, esta tajada no existe. Cierra 653. | pending (espera D-C) |

Las tajadas 2 y 3 son independientes entre sí; la 4 depende de la 3 (usa el
mismo fondo). La 1 va primero porque **ninguna otra empieza sin render
aprobado** (regla del usuario: render aprobado → spec → construcción).

**¿Hace falta render?** Sí, y es la tajada 1: esto cambia el color de un
botón que está en casi todas las pantallas. La forma es una **hoja de muestras**
como la de FEAT-017, no un render de pantalla completa: lo que se decide es un
par de colores, y compararlo lado a lado con su cifra debajo es más útil que
verlo en una sola pantalla.

**¿Arquitecto? no** porque todo cuelga de lo que ya existe: el componente
`src/shared/ui/Button/Button.module.scss` (reglas `.primary` `:53-63` y
`.danger` `:86-93`), los enganches `--button-primary-*` del ámbito Aura en
`src/app/styles/_theme-variables.scss:220-227` y los tokens de color de
`:155-296`. La hoja de muestras tiene precedente exacto en
`docs/features/assets/FEAT-017-hoja-de-muestras.html`.
*Hipótesis marcada, no decisión:* si D-C dice que los hermanos siguen,
probablemente baste con que el cambio viva en el token `--aura-cta-bg` (que
ellos ya leen) en vez de en el botón; si dice que no, el cambio va en los
enganches `--button-primary-*`. Eso lo resuelve el constructor.

**Decisiones que no son mías** (todas se toman **mirando la hoja** de la
tajada 1; ninguna bloquea la tajada 1):

- **D-A — Qué verde para el botón principal, y en qué tema.** El degradado es
  el mismo en claro y en oscuro, y en los dos queda por debajo de AA.
  - *(a) Degradado más oscuro, texto blanco* (p. ej. `#047857 → #065f46`,
    calculado ≥ 5,48:1). El botón se ve más sobrio, menos «menta»; es el mismo
    en los dos temas.
  - *(b) Mismo degradado menta, texto oscuro* (p. ej. `#0f172a`, calculado
    4,74 en el extremo oscuro y 8,04 en el claro). Se conserva el color de la
    marca; el botón pasa a tener letra oscura, que es un cambio de carácter.
  - *(c) Distinto por tema*: en oscuro, un menta más claro con texto oscuro
    (brilla sobre el fondo nocturno); en claro, (a) o (b). Dos aspectos que
    mantener.
  - *(d) Solo oscuro*: arreglar el oscuro y dejar el claro como está
    (2,22-3,77). Es literalmente lo pedido, pero el claro seguiría sin llegar.
- **D-B — Qué rojo para el botón de confirmación en oscuro.**
  - *(a) Rojo profundo con texto blanco* (p. ej. `#b3261e`, calculado 6,53). Se
    parece al rojo de claro; en la noche resalta más.
  - *(b) Mismo rosado `#ffb4ab`, texto granate* (p. ej. `#690005`, calculado
    ≈ 7,6). Conserva el tono suave actual; letra oscura.
  - *(c) Tonal*, como el `IconButton` `danger`: fondo rojo al 12-20 % y letra
    `#ffb4ab`. Muy discreto; una confirmación irreversible pasa a destacar
    menos que el botón principal.
- **D-C — ¿Los hermanos de hábitos siguen al botón?** El botón «hecho» del día y
  el chip de día cumplido pintan blanco sobre el mismo degradado y miden lo
  mismo (2,22-3,77).
  - *Sí:* un solo verde en toda la app, y el día cumplido se lee; cambia también
    el aspecto del calendario de hábitos, que nadie ha pedido tocar.
  - *No:* los hábitos se quedan como están, con el número blanco que no llega a
    AA, y el verde del botón y el del día cumplido dejan de ser el mismo.
- **D-D — El anillo de foco** (≈ 2,05 claro, ≈ 1,56 oscuro), fuera de alcance
  aquí. *¿Expediente propio ahora, o se deja anotado?* Afecta a todos los
  campos y controles, no solo a botones.

## 2. El plan — feature-architect

## 3. Construcción — feature-builder

### Tajada 1

**Resumen para el revisor:** hecha la hoja de muestras
`docs/features/assets/FEAT-025-hoja-de-muestras.html` (HTML suelto, sin
scripts), con 136 contrastes medidos en Chrome sobre el vidrio de Aura, los
hermanos de D-C y las cuatro decisiones con recomendación. Cero cambios en `src/`.
**Lo que más probablemente rompí:** nada de la app, pero sí puede estar mal
**la cifra**: el «peor punto» depende de cuántos píxeles de borde se descartan
(3 px), y cambiar eso mueve las cifras de los degradados unas centésimas (con
2 px, el brillo de 1 px de arriba se colaba y daba 2,43 en vez de 2,59). Además,
el tonal D-B (c) varía ±0,1 según dónde caiga sobre la aurora.

**Qué se construyó:**
- `docs/features/assets/FEAT-025-hoja-de-muestras.html` (nuevo, ~120 kB, sin
  `<script>` ni URLs externas). Por orden: cómo se midió; tabla resumen (el
  peor de `sm`/`md`/`lg`, claro/oscuro × reposo/hover); D-A con cinco fichas
  (hoy, a, b, c, d); D-B con cuatro (hoy, a, b, c) más dos opcionales «claro a
  juego» para (b) y (c); D-C con su tabla y cuatro fichas (no siguen = hoy,
  siguen a a, b y c); las decisiones D-A..D-D tal como las formula la
  sección 1, con la cifra medida de cada opción y mi recomendación. Cada
  muestra lleva debajo su contraste, el punto donde se midió y, si es otra, la
  cifra bajo la etiqueta.
- Nada más en el repositorio. El generador y el arnés de medición viven en el
  scratchpad de la sesión (`gen.py`, `measure.py`), fuera del árbol.

**Por qué así:**
- **El CSS no está copiado a mano, está compilado.** El `<style>` de arriba es
  la salida de `node_modules/.bin/sass --load-path=src` sobre
  `_theme-variables.scss` (entero), `Button.module.scss`,
  `AppIcon.module.scss`, `HabitDayMarker.module.scss` y las reglas
  `.toggle`/`.toggleDone` de `HabitDayRow.module.scss`, con las clases
  prefijadas (`Button-primary`...). A cada `:hover:not(:disabled)` se le añade
  un gemelo `.forzar-hover` para enseñar el hover quieto al lado del reposo.
  Cada muestra vive dentro de `[data-theme] > [data-ds='aura']`, así que la
  cascada de tokens es la de la app.
- **Me aparto de FEAT-017 en el vidrio**, y lo digo: FEAT-017 copió los valores
  del vidrio a mano; aquí los orbes, `--color-glass`, `--shadow-glass` y
  `--blur-md` salen de las variables compiladas (`var(--aurora-orb-1)`...). Los
  orbes siguen siendo tres degradados radiales, como en FEAT-017, no los
  `div` desenfocados de `AuroraCanvas`. El resto (estructura de fichas,
  panel, tabla, pie, sin scripts, español) es la forma de FEAT-017.
- **Las propuestas se pintan con dos reglas añadidas**, las únicas que no salen
  del árbol: `.hoja-tinta` cambia el color de la letra (hoy `#fff` fijo en
  `Button.module.scss:56` y `:88`) y `.hoja-fondo` da el fondo tonal de
  D-B (c). Para el fondo del verde hay que dar valor a
  `--button-primary-bg` y `--button-primary-hover-bg`, no solo a
  `--aura-cta-bg`: el enganche se resuelve en `[data-ds='aura']`, así que
  cambiar `--aura-cta-bg` más abajo no llega al botón (sí a los hermanos).
- **Los hermanos pintan una palomita, no un número.** El chip de día cumplido
  enseña el glifo `check` (`HabitDayMarker.tsx:131`, `STATUS_GLYPH`) y el
  botón «hecho» también (`HabitDayRow.tsx:294`). Su umbral es por tanto 3:1
  (no-texto). El hover del botón «hecho» solo escala, así que no tiene
  muestra de hover.
- Etiquetas de muestra: «Guardar», «Empezar el día», «Guardar cambios» y
  «Archivar», «Archivar hábito», «Sí, archivarlo». Nada de
  cancelar/eliminar/borrar.

**Verificación:**
- Medición: Chrome 154 headless, `--force-color-profile=srgb`, densidad 2,
  1280 px. Dos capturas por pasada: una con la etiqueta en
  `visibility: hidden` (fondo real ya compuesto sobre vidrio y aurora, con el
  `filter` del hover) y otra con un bloque de 8 px de `currentColor` dentro de
  la etiqueta (color real de la letra, también filtrado: en D-B (b) el hover
  convierte `#690005` en `#710005`). Contraste WCAG 2.x contra **el píxel más
  desfavorable de toda la píldora** menos 3 px de borde (1 px de borde
  transparente + 1 px de brillo `inset` + suavizado), y aparte contra el peor
  bajo la etiqueta. Mismo método en los círculos de los hermanos. Dos pasadas
  seguidas: 134 de 136 cifras idénticas a la centésima; las otras dos, el
  tonal D-B (c) `lg` hover (±0,08).
- Resultados (peor de los tres tamaños; claro reposo / claro hover / oscuro
  reposo / oscuro hover):

  | Opción | Cifras |
  |---|---|
  | `primary` hoy | 2,59 / 2,59 / 2,59 / 2,59 (bajo la etiqueta 2,67-2,71) |
  | D-A (a) `#047857→#065f46`, blanco | 5,56 / 5,56 / 5,56 / 5,56 |
  | D-A (b) menta, `#0f172a` | 4,85 / 4,85 / 4,85 / 4,85 |
  | D-A (c) | 5,56 / 5,56 / 6,11 / 6,11 |
  | D-A (d) | 2,59 / 2,59 / 6,11 / 6,11 |
  | `danger` hoy | 6,46 / 5,73 / **1,70** / **1,54** |
  | D-B (a) `#b3261e`, blanco | 6,46 / 5,73 / 6,54 / 5,82 |
  | D-B (b) `#ffb4ab`, `#690005` | 6,46 / 5,73 / 7,72 / 8,02 |
  | D-B (c) tonal | 6,46 / 5,73 / 6,75 / 7,37 |
  | claro a juego (b) / (c) | 13,26 / 14,50 · 5,05 / 4,61 |
  | Hermanos hoy («hecho» / chip) | 2,73 / 2,76 en los dos temas |
  | Siguen a (a) / (b) / (c) | 5,86 · 5,09-5,15 · claro 5,86, oscuro 6,38-6,45 |

- A 375 px (`mobile` emulado): `scrollWidth 375 === clientWidth 375`; la tabla
  resumen hace scroll dentro de su panel, como en FEAT-017. A 1280 px:
  `1280 === 1280`. Miradas las capturas de los dos anchos: las cifras se leen
  en los dos vidrios.
- `git diff --quiet -- src/shared/ui src/app/styles src/features/habits/components/HabitDayRow src/features/habits/components/HabitDayMarker`
  → sin cambios. `grep -c '<script\|http'` en la hoja → 0.
- No corrí typecheck/lint/test/build: esta tajada no toca código, y 654 es de
  las tajadas 2-4. Tampoco `graphify update .`: no hay código nuevo y el
  directorio `graphify-out/` tiene cambios de otra sesión.

**Criterios que cierra:**
- **640** — sí. `primary` y `danger` de hoy y propuestas (D-A: 4; D-B: 3 + 2
  opcionales de claro), en claro y en oscuro, reposo y hover, a `sm`, `md` y
  `lg`, dentro de vidrio Aura sobre aurora. Debajo de cada una: la cifra, el
  punto («peor punto: arriba a la izquierda», «fondo uniforme»...) y la cifra
  bajo la etiqueta cuando difiere.
- **641** — sí. Sección D-C: botón «hecho» y chip de día cumplido (semana de
  siete, cuatro cumplidos) en «no siguen» (= hoy) y «siguen» a (a), (b) y (c),
  con su contraste.
- **642** — sí. Abierta en Chrome como `file://` sin servidor, para medirla y
  para las capturas; sin `<script>` ni recursos externos.
- **643** — sí. Los cambios de `src/` que hay en el árbol son de FEAT-026 (otra
  sesión: `HabitCategoryForm`, `habit-colors`, `HabitCategoriesPage`); ninguno
  lo he tocado yo, y ninguno de los ficheros que lee la hoja ha cambiado.

**Lo que descubrí y no estaba en el plan:**
- **La cifra de la sección 1 «2,22 en el extremo claro» no cuadra.** Blanco
  sobre `#10b981` es 2,54 calculado, y es el punto más claro que puede tener el
  degradado; medido en la píldora da 2,59 (el extremo exacto cae en la
  esquina, fuera del botón). Coincide con los 2,54 de FEAT-006. Igual con
  (b): la sección 1 da 8,04 en el extremo claro y el cálculo da 7,04; no cambia
  ninguna decisión.
- **Los hermanos no llegan ni a 3:1** (2,73 y 2,76), el umbral de un glifo; la
  sección 1 los daba «igual que primary» sin decir que ni el umbral bajo pasa.
- **`--aura-cta-bg` y `--button-primary-bg` no se mueven juntos por debajo de
  `[data-ds='aura']`**: la hipótesis de la sección 1 («si D-C dice sí, basta
  con cambiar `--aura-cta-bg`») es cierta solo si se cambia en el propio
  ámbito `[data-ds='aura']` (y en su versión oscura para (c)/(d)), no en un
  descendiente.
- D-B (c) «claro a juego» hereda el `brightness(1.08)` del hover y queda en
  4,61, justo por encima del umbral.

**Riesgos:** la hoja no toca la app. El riesgo es de lectura: el usuario puede
tomar las cifras como exactas a la centésima cuando el método tiene ±0,05 en
los degradados y ±0,1 en el tonal. Y los orbes de la hoja son degradados
radiales, no los orbes desenfocados de la app: sobre fondos opacos (todas las
propuestas menos D-B (c)) da igual; en el tonal, la cifra real en una pantalla
puede moverse algo según dónde caiga el botón.

**Estado del árbol:** sin commitear. Solo es mío
`docs/features/assets/FEAT-025-hoja-de-muestras.html` y esta sección (más la
fila de la tajada 1 y el `status:` de este expediente). `BOARD.md` no lo he
tocado.

## 4. Revisión — feature-reviewer

### Tajada 1

**Criterios, uno por uno:**

- **640 — cumple.** La hoja enseña `primary` (hoy + D-A a, b, c, d) y `danger`
  (hoy + D-B a, b, c, más dos «claro a juego» opcionales), en claro y en
  oscuro, reposo y hover, a `sm`, `md` **y** `lg` (el criterio pedía `sm` y
  `md`), cada una dentro de `[data-theme] > [data-ds='aura']` con lámina de
  vidrio sobre los orbes. Debajo de cada muestra: cifra, punto («peor punto:
  arriba a la izquierda», «fondo uniforme»…) y la cifra bajo la etiqueta si
  difiere. 136 muestras con `data-m`.
  - **El CSS es el real.** Compilé yo `Button.module.scss`,
    `_theme-variables.scss`, `HabitDayMarker.module.scss` y
    `HabitDayRow.module.scss` con `node_modules/.bin/sass --load-path=src
    --style=expanded` y comparé contra el primer `<style>` de la hoja,
    normalizando espacios y comentarios: los tokens de tema están **literales y
    enteros**; `Button` también, una vez aplicado el prefijo `Button-` y el
    gemelo `.forzar-hover` de cada `:hover:not(:disabled)`; `HabitDayMarker`
    entero y las reglas `.toggle*`/`.toggleDone` de `HabitDayRow`, idénticas.
    Lo que la hoja añade es solo `.hoja-tinta` (color de letra) y
    `.hoja-fondo` (fondo tonal), declarados como tales, y los valores de cada
    propuesta van en `style=` sobre el contenedor.
  - **Las cifras, remedidas con arnés propio.** Chrome headless, perfil sRGB,
    densidad **1** (el constructor usó 2), dos capturas de la hoja (etiqueta y
    glifos ocultos / un bloque de 8 px de `currentColor` en la etiqueta) y
    búsqueda del píxel más desfavorable dentro de la píldora con 3 px de
    margen y el radio real. Las 136: 123 coinciden a ±0,06; las 13 restantes se
    separan entre 0,07 y 0,12, siempre en degradados o en el tonal, y ninguna
    cruza un umbral (4,5 ni 3). Además, fórmula WCAG sobre los colores exactos
    y sobre la geometría del círculo:

    | Fila | Hoja | Mío (píxel) | Fórmula |
    |---|---|---|---|
    | `primary` hoy, los dos temas | 2,59 | 2,59 | extremo 2,54, centro 3,07 |
    | D-A (a) | 5,56 | 5,56 | extremo 5,48 |
    | D-A (b) | 4,85 | 4,85 | extremo 4,74 |
    | D-A (c) claro / oscuro | 5,56 / 6,11 | 5,56 / 6,11 | 5,48 / 5,97 |
    | `danger` hoy claro | 6,46 / 5,73 | 6,46 / 5,73 | 6,46 / 5,73 |
    | `danger` hoy oscuro | 1,70 / 1,54 | 1,70 / 1,54 | 1,70 / 1,54 |
    | D-B (a) | 6,54 / 5,82 | 6,54 / 5,82 | 6,54 / 5,82 |
    | D-B (b) | 7,72 / 8,02 | 7,72 / 8,02 | 7,72 / 8,02 |
    | D-B (c) tonal | 6,75 / 7,37 | 6,75 / 7,46 | depende del fondo |
    | claro a juego (b) / (c) | 13,26-14,50 / 5,05-4,61 | idénticas | 13,26 / 14,50 |
    | Hermanos hoy («hecho» / chip) | 2,73 / 2,76 | 2,74 / 2,77 | 2,73 / 2,76 (círculo, 3 px) |
    | Siguen a (a) | 5,86 | 5,78 / 5,85 | 5,86 |
    | Siguen a (c) oscuro | 6,38 / 6,45 | 6,45 / 6,52 | 6,48 |

    En los degradados la cifra de la píldora queda unas centésimas **por
    encima** del extremo calculado porque la píldora no llega a la esquina del
    degradado de 135°: es correcto medir ahí, y es lo que pide el criterio
    («punto más desfavorable del fondo del botón»). Las diferencias con mi
    arnés son de rejilla de píxeles: la misma regla da 2,62 en una ficha y
    2,65 en otra (D-A (d) claro `sm` frente a hoy `sm`, CSS idéntico). La
    tolerancia que el constructor declara (±0,05 en degradados, ±0,1 en el
    tonal) es honesta. **No hay ninguna cifra equivocada.**
  - **El hover aclara también la letra**, comprobado en píxel: con
    `brightness(1.08)` Chrome multiplica en sRGB, y el granate `#690005` sale
    `(113, 0, 5)` = `#710005`; la letra tonal `#ffb4ab` sale `#ffc2b9`; el
    rojo de «claro a juego (c)» `#ba1a1a` sale `#c91c1c`. La hoja lo mide
    bien porque su bloque de `currentColor` vive dentro del botón filtrado.
    Por eso el hover **mejora** D-B (b) (7,72 → 8,02) y **empeora** «claro a
    juego (c)» (5,05 → 4,61, a 0,11 del umbral).
  - **Matiz, no defecto:** los orbes son tres degradados radiales con los
    colores reales, no los `div` desenfocados de `AuroraCanvas` (declarado en
    la sección 3; mismo criterio que FEAT-017). Solo pesa en el tonal D-B (c),
    que queda a más de 2 puntos del umbral. Y la hoja no carga las fuentes
    (`Plus Jakarta Sans`/`Inter`): cae a `system-ui`. No mueve ninguna cifra,
    pero la forma de la letra no es exactamente la de la app.
- **641 — cumple.** Sección D-C con el botón «hecho» y una semana de chips
  (cuatro cumplidos), en «no siguen (= hoy)» y siguiendo a (a), (b) y (c), en
  los dos temas, con tabla y cifra por muestra. Correcto que el umbral sea 3:1:
  los dos pintan la palomita (`HabitDayMarker.tsx:131`, `AppIcon` con el
  glifo de `STATUS_GLYPH`), no el número.
- **642 — cumple.** 0 `<script>`, 0 URL `http(s)`, 0 `url(`, sin `@font-face`.
  La abrí como `file://` en Chrome headless.
- **643 — cumple.** `git show --numstat 0a3a549`: solo
  `docs/features/BOARD.md`, este expediente y la hoja. El último commit que
  toca `src/shared/ui/Button` o `_theme-variables.scss` es `d9225b2`,
  anterior.

**La hipótesis de D-C, comprobada.** Cierta tal como la corrige el
constructor. `--button-primary-bg: var(--aura-cta-bg)` se declara en
`[data-ds='aura']` (`_theme-variables.scss:223`), y una custom property
resuelve su `var()` **en el elemento donde se declara** y hereda ya resuelta.
Lo probé en Chrome: con `--aura-cta-bg` cambiado en un **descendiente** del
ámbito, el `background-image` del botón sigue siendo `#10b981 → #059669`; con
`--aura-cta-bg` cambiado en el **propio** elemento `[data-ds='aura']`, pasa a
`#047857 → #065f46`. Para las tajadas 3 y 4: si D-C dice «sí», basta con
cambiar `--aura-cta-bg` en `[data-ds='aura']` (y en
`[data-theme='dark'] [data-ds='aura']` para (c) o (d), que es el mismo
elemento y gana por especificidad); si dice «no», el cambio va en
`--button-primary-bg` y `--button-primary-hover-bg`, que hoy son dos
enganches separados y los dos hacen falta. Y la letra: `color: #fff` está
escrito a mano en `.primary` y `.danger` (`Button.module.scss:56` y `:88`),
así que las opciones de letra oscura (D-A b/c/d, D-B b) obligan a tocar el
componente o a añadirle un enganche; no basta un token.

**Lo que rompió cerca:** nada que pueda romper. Busqué así: el commit no toca
`src/` (numstat de arriba); `BOARD.md` solo gana 57 líneas y no pierde
ninguna (`57 0`), así que no pisó filas ajenas; la hoja es un HTML suelto que
nadie importa. El árbol estaba limpio al empezar (`git status` vacío). El
grafo no aplica: no hay código nuevo.

**Estados sin construir:** aplican dos.
- *Móvil*: dentro de un `iframe` de **375 px** exactos (la ventana headless no
  baja de 500 y daba una cifra falsa), `scrollWidth 375 === clientWidth 375`,
  ningún elemento sale del ancho fuera de un contenedor con scroll y ninguna
  muestra recorta su etiqueta. La tabla resumen hace scroll dentro de su
  panel. Captura mirada: las fichas se apilan y las cifras se leen en los dos
  vidrios. *Escritorio* (1280): `1280 === 1280`, las dos láminas lado a lado.
- *Texto largo*: las etiquetas de muestra son cortas («Sí, archivarlo»); el
  texto tres veces más largo es el criterio 652, de las tajadas 2-3, no de
  esta.
- Vacío, cargando, error y permisos no aplican a un HTML estático.

**¿Duplica algo que existía?** No hubo arquitecto. El precedente es
`docs/features/assets/FEAT-017-hoja-de-muestras.html` y la hoja sigue su
forma (fichas, panel, tabla, pie, sin scripts); en lo que se aparta —tokens
compilados en vez de copiados a mano— mejora la fidelidad. No crea nada en
`src/`.

**Hallazgos que no devuelven la tajada:**
- La sección 1 tenía tres cifras mal calculadas (2,22; 8,04; 1,52). Añadida
  una nota fechada debajo de su tabla, sin tocar el texto del analista.
- «Claro a juego (c)» queda en 4,61 en hover: pasa, pero a 0,11 del umbral y
  con la tolerancia del método en ±0,1. Si el usuario lo elige, la tajada 2
  debería remedirlo en la app antes de darlo por bueno.
- Las decisiones del final siguen la formulación de la sección 1, con la
  cifra de cada opción, y añaden una recomendación del constructor en cada una
  (a en D-A, a en D-B, «sí» en D-C, expediente propio en D-D). Van marcadas
  como recomendación, no como decisión.
- Vocabulario: sin «cancelar», «eliminar», «borrar», «fallaste» ni
  «deberías»; las muestras en rojo dicen «Archivar». Todo en español.
- Mi arnés reescribió dos ficheros del constructor en el scratchpad de la
  sesión (`button.css`, `theme.css`), con la misma salida de `sass`. Fuera del
  repositorio; sin efecto.

**Veredicto:** accepted — porque el CSS de la hoja es el real, copiado del
compilador y no a mano; las 136 cifras aguantan un arnés independiente y la
fórmula dentro de la tolerancia declarada, sin que ninguna cambie de lado de
un umbral; y los cuatro criterios de la tajada se cumplen con evidencia.

**Para el usuario:** *(no es la última tajada: la feature sigue abierta; la
nota de cierre llegará con la última)*. Ya puedes abrir la hoja de muestras y
elegir: ves el botón verde y el rojo de hoy junto a cada propuesta, en claro y
en oscuro, parados y con el ratón encima, con la cifra de contraste debajo de
cada uno. Para probarlo: abre `FEAT-025-hoja-de-muestras.html` de la carpeta
de expedientes con doble clic en el navegador; mira D-A, D-B y D-C; y responde
las cuatro preguntas del final.
