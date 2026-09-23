---
id: FEAT-020
title: El vidrio se lee aunque el navegador no desenfoque
status: delivered
architect: no    # cuelga de superficies que ya existen: la barra de `AppLayout` y la de sesión de Vida ya son vidrio; solo cambia su fondo
area: app/styles, layouts, shared/ui, features/vida, features/habits
requested: 2026-09-23
updated: 2026-09-23
---

# FEAT-020 — El vidrio se lee aunque el navegador no desenfoque

## 1. La petición — feature-analyst

**Resumen para quien venga detrás:** las barras de vidrio de la app se apoyan
en `backdrop-filter` para separarse del contenido que pasa por debajo, y
**Chrome de Android no lo pinta** (iOS sí): el texto de debajo se mezcla con el
de la barra. Una sola tajada: bajar la transparencia de las ocho superficies
fijas o pegajosas para que se lean **sin** desenfoque, dejando el desenfoque
encima como mejora donde el navegador lo pinte.

**Qué problema resuelve:** en Android el texto de la página se lee a través de
las barras y se mezcla con el texto de la barra. No es un problema estético: la
barra de sesión de Vida es donde vive el cronómetro y el botón de «Terminar».

**Para quién es:** para el usuario en su teléfono Android, que es donde vive el
módulo Vida durante el día.

**Palabras del usuario:**
> «en web desktop parece que no funciona el efecto blur»
>
> «se ve nítido en android, en ios sí se ve como se desea»
>
> «entonces pon un fallback con menos transparencia, porque se mezcla texto»

**Lo ya diagnosticado (no se vuelve a investigar):**

- **No es nuestro CSS.** Entre la barra y `<html>` no hay ningún ancestro con
  `opacity` < 1, `filter`, `transform`, `perspective`, `mask`, `contain` ni
  `will-change` —lo único que anula un `backdrop-filter` desde arriba—.
  `VidaModuleLayout` solo pone `min-width` y `padding-bottom`; `AppLayout`,
  nada; `html`/`body`/`#root`, nada. El único `opacity: 0.6` del árbol está en
  un botón deshabilitado, que no es ancestro de nadie.
- Falla **igual en las dos barras** (la fija de Vida y la pegajosa de
  `AppLayout`), en Android, y funciona en iOS. Es del motor, no del árbol.
- **`@supports` no sirve de red:** Chrome de Android **declara** soportar
  `backdrop-filter` y luego no lo pinta. La consulta daría verdadero y el
  fallback no entraría nunca.

**Fuera de alcance:**

- **Las otras 54 apariciones de `--aura-glass-1`**: tarjetas en flujo normal,
  sin nada pasando por detrás. Subirles la opacidad aplanaría el diseño entero
  por un problema que no tienen.
- Cambiar el valor del token `--aura-glass-1` en `_theme-variables.scss`: eso
  arrastraría a esas 54.
- Rediseñar el lenguaje Aura, tocar colores de marca o el lienzo aurora.
- Arreglar el desenfoque en Chrome de Android. Se puede **intentar** (capa
  propia en el propio elemento), pero la legibilidad no puede depender de ello.
- El tema no-Aura (`:root` sin `[data-ds='aura']`): se comprueba que no empeora,
  no se rediseña.

**Criterios de aceptación:**

- [ ] 591. Con el `backdrop-filter` **desactivado** (como lo ve Chrome de
  Android) y tema **oscuro**, el texto denso que pasa por debajo de la barra de
  `AppLayout` y de la barra de sesión de Vida **no se lee**: su contraste
  residual contra el fondo de la barra queda **por debajo de 1,25:1**, medido y
  escrito.
- [ ] 592. Lo mismo, con el mismo umbral, en tema **claro**.
- [ ] 593. El texto **propio** de cada barra sobre el fondo nuevo no empeora:
  el texto normal queda **≥ 4,5:1** y el atenuado/secundario **≥ 3:1**, en los
  dos temas, medido y escrito. No se cambia un problema por otro.
- [ ] 594. Con el desenfoque **activado** (como lo ve en iOS) las barras
  **siguen pareciendo vidrio**: el fondo que pasa por debajo aún tiñe la barra
  —diferencia de color medible frente al fondo plano de la página— y conserva
  su borde y su sombra.
- [ ] 595. El cambio toca **solo** superficies fijas o pegajosas. Las 54
  apariciones restantes de `--aura-glass-1` quedan intactas, y se dice cuáles de
  las ocho de la lista **no** lo necesitaban y por qué.
- [ ] 596. El fondo nuevo se escribe con `color-mix(… var(--color-bg) …)` (o un
  token que siga el tema), **no** con un `rgba` fijo: pasar de claro a oscuro
  cambia el fondo sin necesidad de una regla por tema.
- [ ] 597. **No** se usa `@supports (backdrop-filter: …)` como puerta del
  fallback. La legibilidad no depende de ninguna detección de soporte.
- [ ] 598. `pnpm typecheck` limpio; lint y tests **no peores** que la línea base
  (14/0 y 2 fallos de 1951); `pnpm build` en verde y el CSS **no baja** de
  275,14 kB, comprobado comparando la **lista de selectores compilada** de
  `HEAD` y la del árbol con `sass --style=compressed`, no el tamaño.
- [ ] 599. Si se añade el intento de reactivar el desenfoque en Chrome de
  Android (capa propia **en el propio elemento**, nunca en un ancestro), es
  **inocuo** donde el desenfoque ya funciona y queda escrito como «por confirmar
  con él». *(Criterio condicional: si no se añade, se dice y no aplica.)*

**Tajadas:**

| # | Qué hace | Estado |
|---|---|---|
| 1 | **El vidrio se lee sin desenfoque.** Baja la transparencia de las ocho superficies fijas o pegajosas con `backdrop-filter`, en los dos temas, con `color-mix` sobre `--color-bg`. Criterios 591–599. | accepted |

**¿Arquitecto? no** porque no introduce ningún concepto: cambia el valor de
fondo de superficies que ya existen. La forma correcta ya está escrita en
`src/layouts/AppLayout/AppLayout.module.scss:25`
(`color-mix(in srgb, var(--color-bg) 72%, transparent)`); solo está floja.

**Decisiones que no son mías:** ninguna pendiente. El usuario ya eligió el
camino («pon un fallback con menos transparencia») y el criterio de desempate
(«la legibilidad manda» sobre el aspecto de vidrio).

## 2. El plan — feature-architect

*(sin arquitecto: cuelga de las superficies de vidrio que ya existen)*

## 3. Construcción — feature-builder

### Tajada 1 — El vidrio se lee sin desenfoque

**Resumen para el revisor:**
1. Las cuatro superficies fijas o pegajosas que de verdad tenían contenido
   pasando por debajo suben a **92 % de opacidad** con `color-mix` sobre un token
   opaco del tema: la barra de `AppLayout`, la barra de sesión de Vida, `Toast` y
   `RetryNotice`. Las otras cuatro de la lista de ocho **no se tocan** y abajo se
   dice por qué, una a una.
2. Medido en un arnés con texto denso debajo y el desenfoque apagado: la fuga del
   texto de debajo pasa de **2,34:1 a 1,20:1** en oscuro y de **1,85:1 a 1,18:1**
   en claro en la barra de la app; en la barra de sesión, de **14,65:1 a 1,20:1**
   en oscuro (era blanco al 6 %: prácticamente no había barra).
3. **Lo que más probablemente he roto:** el aspecto. Con el desenfoque activado
   (iOS, Chrome de escritorio) la barra ya casi no es vidrio: sobre un orbe del
   lienzo aurora solo se tiñe **3,2 niveles de verde** en oscuro y **5,8 de rojo**
   en claro. Se ve como un panel casi sólido con su borde y su sombra. Es la
   cesión que el usuario autorizó, pero es un cambio visible en **todas** las
   pantallas de la app, no solo en Vida. Segundo sospechoso: `Toast` y
   `RetryNotice` cambian de token (`--color-surface` → `--color-surface-elevated`)
   y por tanto de **color**, no solo de opacidad, en los cuatro temas.

**Qué se construyó:**

- `src/layouts/AppLayout/AppLayout.module.scss` — `.bar`: el mix pasa de
  `var(--color-bg) 72%` a **`92%`**. Se añade `will-change: backdrop-filter` (el
  intento opcional; ver criterio 599).
- `src/features/vida/components/VidaSessionBar/VidaSessionBar.module.scss` —
  `.bar`: `var(--aura-glass-1, var(--color-surface))` →
  **`color-mix(in srgb, var(--color-bg) 92%, transparent)`**, más el mismo
  `will-change`. Era el caso peor: `--aura-glass-1` en oscuro es blanco al 6 %.
- `src/shared/ui/Toast/Toast.module.scss` — `.toast`: el fondo era
  `color-mix(… var(--color-glass-surface, var(--color-surface)) 88% …)` y
  **`--color-glass-surface` no está definido en ningún tema** (comprobado: solo
  aparece en estos dos archivos), así que caía siempre en `--color-surface`, que
  en Aura ya es translúcido. Opacidad **real** medida: **0,397 en claro y 0,052
  en oscuro**. Ahora: `color-mix(in srgb, var(--color-surface-elevated) 92%,
  transparent)`.
- `src/shared/ui/RetryNotice/RetryNotice.module.scss` — `.notice`: idéntico caso
  (medido 0,415 / 0,054). Mismo destino.

**Las cuatro de la lista que NO se tocan, y por qué** (criterio 595):

| Superficie | Fuga medida (claro / oscuro, sin blur) | Por qué se deja |
|---|---|---|
| `AppLayout .pills` | 2,90 / 14,65 | Está **dentro de `.bar`**: lo único que tiene detrás es el fondo de la propia barra, que ahora es opaco al 92 %. Lo que se filtra por las píldoras ya viene filtrado por la barra. Subirle la opacidad solo aplanaría el carril de píldoras. |
| `Drawer .panel` | 1,18 / 1,26 | **Ya estaba en `color-mix(… var(--color-surface-elevated) 92% …)`**: es justo el valor al que llegan las demás, y además lleva un velo (`.overlay`) detrás. No necesita nada. De hecho es la referencia de la que salen `Toast` y `RetryNotice`. |
| `HabitsListPage .emptyCard` y `HabitMyDayPage .emptyCard` | 1,60 / 2,48 | **No son fijas ni pegajosas**: son tarjetas de estado vacío en flujo normal. No hay contenido pasando por debajo; lo único detrás es el lienzo aurora. Son del grupo de las 54. |
| `VidaActividadesPage .panel` | 1,60 / 2,48 | Lo mismo: panel en flujo, `var(--color-glass)`, nada por debajo. |

**Por qué así, y qué se descartó:**

- **92 %, y no 88 ni 90.** Medido en los dos temas con el texto de la página a
  plena fuerza por debajo: 88 % deja la fuga en 1,28 (claro) / 1,36 (oscuro) —un
  fantasma que **todavía se lee**—; 90 % en 1,23 / 1,28; 92 % en **1,18 / 1,20**,
  los dos por debajo del umbral de 1,25 del criterio 591. 94 % apenas gana (1,13
  / 1,14) y cuesta más vidrio.
- **`--color-bg` en las dos barras, `--color-surface-elevated` en `Toast`,
  `RetryNotice` y `Drawer`.** Desviación consciente de la preferencia escrita en
  el encargo: subir el porcentaje **no habría arreglado** `Toast` ni
  `RetryNotice`, porque el token del que colgaban (`--color-surface`) es él mismo
  translúcido en Aura —blanco al 45 % en claro, al 6 % en oscuro—, así que el
  88 % era en realidad un 39,7 %. Hacía falta un token **opaco**;
  `--color-surface-elevated` lo es en los cuatro temas, sigue el tema solo (igual
  que `--color-bg`) y es el que **ya usa `Drawer`**, que es el vecino directo.
  Para las barras sí se usa `--color-bg`, que es lo que pedía el encargo y lo que
  ya usaba `AppLayout`.
- **Descartado `@supports`**, como decía el encargo: Chrome de Android declara
  soporte y no pinta. No hay ninguna consulta de soporte en el cambio.
- **Descartado tocar `--aura-glass-1`** en `_theme-variables.scss`: arrastraría a
  las 54 tarjetas en flujo.

**Verificación:**

*El arnés (borrado).* `src/harness-glass.html` + `src/harness-glass.tsx` +
`src/harness-glass-main.tsx`, servidos por el dev server del usuario en el 5173,
con `import './app/styles/global.scss'` para tener los tokens de verdad. Cada
superficie se pintaba dos veces —**ANTES** con la declaración literal de `HEAD` y
**AHORA** con la nueva— encima de un párrafo denso, en cuatro contextos: Aura
claro, Aura oscuro, `:root` claro y `:root` oscuro, y con el `backdrop-filter`
apagado (Android) y encendido (iOS). Los colores se leyeron con
`getComputedStyle` —que resuelve `color-mix` a `color(srgb …)`— y el compuesto se
calculó con la fórmula de alfa y la de contraste WCAG. **Los tres archivos están
borrados** (`git status` limpio de ellos).

*Fuga del texto de debajo, con el desenfoque apagado* (contraste del texto que se
cuela contra el fondo de la barra; 1,00 sería invisible):

| Superficie | Aura claro antes → ahora | Aura oscuro antes → ahora |
|---|---|---|
| `AppLayout .bar` | 1,85 → **1,18** | 2,34 → **1,20** |
| `VidaSessionBar .bar` | 2,90 → **1,18** | **14,65** → **1,20** |
| `Toast .toast` | 4,66 → **1,18** | **14,97** → **1,26** |
| `RetryNotice .notice` | 4,39 → **1,18** | **14,88** → **1,26** |
| `Drawer .panel` (sin tocar) | 1,18 | 1,26 |

*Contraste del texto propio de la barra sobre el fondo nuevo* (criterio 593):

| Superficie | Aura claro: normal / atenuado | Aura oscuro: normal / atenuado |
|---|---|---|
| `AppLayout .bar` | 17,33 / 2,49 (**sin cambio**) | 16,74 / 5,38 (**sin cambio**) |
| `VidaSessionBar .bar` | 17,61 → 17,33 / 2,53 → **2,49** | 14,55 → **16,74** / 4,68 → **5,38** |
| `Toast` y `RetryNotice` | 17,5 → 16,67 / 2,52 → **2,39** | 14,8 → **15,06** / 4,77 → **4,84** |

En `:root` (fuera de Aura) la barra de sesión pasa de opaca (fuga 1,00) a 0,92
(fuga 1,17 claro / 1,14 oscuro) y `Toast` en oscuro baja de 16,18 a **13,43** de
contraste de texto: sigue muy por encima de AA y **ninguna pantalla de Vida corre
fuera de Aura**, pero queda dicho.

*Con el desenfoque encendido* (criterio 594): captura del arnés con `blur` activo
en los dos temas — el desenfoque **sigue funcionando** (el texto de debajo aparece
emborronado, no nítido) y el `will-change` no lo rompió. Cuánto vidrio queda,
medido: la barra al 92 % sobre un orbe del lienzo (`--aurora-orb-1`) frente a la
misma barra sobre el fondo plano da `rgb(11,1 21,2 33,9)` contra `rgb(11 18 32)`
en oscuro —**Δ +3,2 en verde**— y `rgb(244,2 251 248)` contra `rgb(250 252 251)`
en claro —**Δ −5,8 en rojo**—. Es un tinte perceptible sobre un degradado, no el
vidrio de antes.

*Puertas:*

```
pnpm typecheck  → limpio (rc=0)
pnpm lint       → 14 errores / 0 warnings   (línea base: 14 / 0)
pnpm test       → 2 fallos de 1951 · 117 de 118 archivos  (línea base: los mismos 2 de SearchSelect)
pnpm build      → verde · index.js 1.131,64 kB · CSS 275,17 kB  (HEAD: 275,14 kB)
```

*El CSS, comparado como manda `ENVIRONMENT.md`* —y aquí saltó el susto de la
semana, al revés de lo esperado:

- Se compilaron los cuatro `.module.scss` de `HEAD` (`git show HEAD:<ruta>`) y los
  del árbol con `sass --style=compressed` y se comparó la **lista de selectores**:
  **idénticas**, 85 reglas a cada lado.
- Y el bundle entero: se construyó `HEAD` en un **worktree desechable**
  (`git worktree add --detach`, `node_modules` enlazado, borrado después; el árbol
  del usuario no se tocó en ningún momento) para medir el CSS real de `HEAD`. Dio
  exactamente **275,14 kB**, así que la cifra de `ENVIRONMENT.md` está al día.
- **La primera construcción del árbol bajó a 275,09 kB.** No era un comentario sin
  cerrar —el recuento de reglas seguía en 2.376 a los dos lados—: era que yo había
  añadido `-webkit-backdrop-filter` **junto a** la estándar en `Toast` y
  `RetryNotice`, y **lightningcss se queda entonces solo con la prefijada**. Las
  declaraciones `backdrop-filter` sin prefijo del bundle pasaron de **8 a 6**.
  Quitando el `-webkit-` que yo había añadido, vuelven a ser **8 y 8** y el CSS
  sube a 275,17 kB (+30 B, que son los dos `will-change`). Queda un comentario en
  los dos archivos para que nadie lo vuelva a "arreglar".

**Criterios que cierra:**

- **591 (oscuro, sin blur, fuga < 1,25)** — ✅ `AppLayout .bar` **1,20**,
  `VidaSessionBar .bar` **1,20**. Medido arriba. `Toast` y `RetryNotice` quedan en
  **1,26**, una centésima por encima del umbral: el criterio nombra solo las dos
  barras, y 1,26 es **exactamente** lo que `Drawer` ya lleva en producción; venían
  de 14,97 y 14,88.
- **592 (claro, mismo umbral)** — ✅ **1,18** en las cuatro superficies.
- **593 (texto propio ≥ 4,5 / atenuado ≥ 3)** — ⚠️ **parcialmente, y el criterio
  está mal planteado por mí**. El texto normal cumple de sobra en los dos temas
  (16,7–17,6 claro, 15,1–16,7 oscuro). El **atenuado en Aura claro no llega a 3:1
  y no llegaba antes**: `--color-text-muted: #94a3b8` sobre `#fafcfb` da **2,49:1**
  pase lo que pase con la opacidad, porque el velo es del color del fondo. Mi
  cambio lo mueve **0,04** en la barra de sesión (2,53 → 2,49) y **0,13** en
  `Toast` (2,52 → 2,39). Es deuda del sistema de diseño, del mismo tipo que
  `Button variant="danger"` en oscuro; **no la arreglo aquí** y **no reescribo el
  criterio**: queda señalado para el revisor.
- **594 (con blur sigue pareciendo vidrio)** — ⚠️ **cumplido en lo medible, flojo
  en lo perceptible.** El desenfoque sigue pintando y la barra sigue tiñéndose de
  lo que hay detrás, pero solo 3,2 / 5,8 niveles RGB. Es un panel casi sólido. Es
  la cesión que el encargo autorizó («la legibilidad manda») y el número está
  escrito para que se pueda revertir a 88 % si el usuario prefiere el aspecto:
  costaría subir la fuga a 1,28 / 1,36.
- **595 (solo fijas o pegajosas; las 54 intactas)** — ✅ Cuatro archivos tocados de
  los ocho; las otras cuatro, con su medida y su motivo, en la tabla de arriba.
  `--aura-glass-1` sigue apareciendo donde aparecía salvo en `VidaSessionBar`:
  `git grep -c` sobre `src` en `HEAD` da **60** usos (fuera de
  `_theme-variables.scss`) y en el árbol **59** — baja exactamente uno, el de la
  barra de sesión. El token en sí no se tocó.
- **596 (`color-mix` con token del tema, no `rgba` fijo)** — ✅ Las cuatro son
  `color-mix(in srgb, var(--color-bg | --color-surface-elevated) 92%, transparent)`.
  Ni un `rgba` literal nuevo, ni una regla por tema.
- **597 (nada de `@supports`)** — ✅ No hay ninguna regla `@supports` en el
  cambio: `grep -n "@supports"` sobre los cuatro archivos devuelve **dos
  resultados y los dos están dentro de un comentario mío** que explica
  precisamente por qué no se usa (`AppLayout.module.scss:25`,
  `VidaSessionBar.module.scss:32`). En `HEAD` no había ninguna. La legibilidad no
  depende de ninguna detección de soporte.
- **598 (puertas + CSS por selectores)** — ✅ Tabla de puertas arriba. CSS **sube**
  de 275,14 a 275,17 kB; reglas 2.376 = 2.376; `backdrop-filter` sin prefijo 8 = 8.
- **599 (el intento de capa propia, inocuo)** — ✅ en escritorio: con
  `will-change: backdrop-filter` en el propio elemento (nunca en un ancestro) el
  desenfoque sigue pintando igual en el arnés, en los dos temas. **Por confirmar
  con él en un Android real**: es lo único que podría reactivar el desenfoque allí,
  y la legibilidad **no** depende de ello.

**Pendiente de prueba manual** (`/app/*` está tras un login que un agente no
cruza):

1. En el Android real, entrar en `/app/vida/hoy` con una sesión arrancada, en
   **tema oscuro**, y desplazar la página hasta que haya texto debajo de la barra
   de sesión: **no debe leerse** nada a través de ella.
2. Lo mismo con la barra de arriba en cualquier pantalla de `/app`, subiendo y
   bajando.
3. Decir si ahora **se ve el desenfoque** en la barra en ese Android (sería el
   `will-change`) o si sigue nítido: el cambio funciona igual en los dos casos,
   pero la respuesta decide si el `will-change` se queda o se quita.
4. En el iPhone, confirmar que las barras siguen pareciendo aceptables y no
   bloques opacos. Si no, el número a mover es el **92 %**, en un solo sitio por
   archivo.
5. Un `Toast` y un `RetryNotice` reales (guardar algo, o cortar la red para que
   salte el reintento) en los dos temas: son los que más cambian de color.

**Riesgos:**

- **Aspecto en toda la app.** La barra de `AppLayout` sale en las 20 pantallas de
  `/app`. Es el cambio más visible y el más fácil de revertir (un número).
- **`Toast` y `RetryNotice` cambian de color**, no solo de opacidad:
  `--color-surface-elevated` es `#161e2f` en Aura oscuro y `#f4f7fb` en claro,
  mientras que antes eran el blanco translúcido de `--color-surface`. En oscuro se
  ven **más claros** que antes.
- **`will-change: backdrop-filter`** promueve la barra a capa propia. En
  escritorio no cambió nada medible, pero es memoria de GPU en dos elementos
  permanentes. Si el usuario dice que en Android sigue nítido, quitarlo es gratis.
- **Fuera de Aura** (`:root`), la barra de sesión deja de ser opaca. Ninguna
  pantalla de Vida corre ahí hoy.

**Lo que descubrí y no estaba en el plan** (no lo toco: queda escrito):

1. **`--color-glass-surface` no existe.** Se usa en `Toast` y `RetryNotice` como
   primer término de un `var()` con respaldo y no está declarado en ningún tema, ni
   en `:root` ni en Aura. Llevaba desde siempre cayendo en el respaldo. Era la
   causa real de que esos dos avisos fueran casi invisibles en Aura oscuro (5 % de
   opacidad efectiva), mucho peor que el 12 % que aparentaba el `88%` escrito.
2. **El minificador se está comiendo el `backdrop-filter` sin prefijo en todo el
   repositorio, y esto puede ser la mitad "de escritorio" de la queja del
   usuario.** En el bundle de `HEAD` hay **8** declaraciones `backdrop-filter`
   estándar y **50** `-webkit-backdrop-filter`. Donde el `.scss` escribe las dos
   —primero la estándar y luego la `-webkit-`, que es el patrón de la casa en
   `AppLayout`, `VidaSessionBar` y otros— **lightningcss conserva solo la
   prefijada**. Consecuencia: en **Firefox**, que solo entiende la estándar, esas
   superficies **nunca** han tenido desenfoque. El arreglo es de una línea
   —invertir el orden, o dejar solo la estándar y que el build prefije— pero
   **cambia el aspecto en Firefox** y está fuera del alcance de esta tajada. Vale
   una feature propia.
3. `AppLayout .pills` y `.cmdTrigger` usan `--aura-glass-1`, que **fuera de Aura no
   está definido**: `.pills` se queda con fondo transparente (alfa 0 medida) en los
   temas `:root`. Cosmético y preexistente.

**Estado del árbol:** sin commitear. Cinco archivos: los cuatro `.module.scss`,
más `docs/features/BOARD.md` y este expediente. El arnés está borrado y el
worktree desechable, eliminado (`git worktree list` solo lista el principal).

## 4. Revisión — feature-reviewer

### Tajada 1 — **aceptada** (2026-09-23, revisor). La feature se entrega.

**Por qué se acepta:** medí yo las cuatro superficies, en los cuatro contextos
de tema, y salen **las mismas cifras que declara el constructor** (±0,01). El
número del 92 % no es un gusto: es el **mínimo** compatible con el criterio 591
—a 90 % la fuga en Aura oscuro es 1,275 y el criterio pide < 1,25—. Las puertas
se corrieron enteras y están en la línea base. Quedan tres hallazgos escritos
abajo; ninguno es de esta tajada.

**Cómo medí** (no me fié de la tabla del constructor): en el 5173 del usuario
—que estaba vivo y **no se tocó**— inyecté un medidor en la página con
`javascript_tool` (solo inspección, ni una línea de producto), creando
contenedores `[data-theme='dark'] [data-ds='aura']` y leyendo con
`getComputedStyle` el `color-mix` **ya resuelto** por Chrome; el compuesto y el
contraste WCAG, calculados sobre esos valores. El medidor se borró.

**Fuga del texto de debajo, con el desenfoque APAGADO** (que es como lo ve él en
Android; 1,00 = invisible). Medición mía, independiente:

| Superficie | Aura claro antes → ahora | Aura oscuro antes → ahora |
|---|---|---|
| `AppLayout .bar` | 1,85 → **1,18** | 2,34 → **1,20** |
| `VidaSessionBar .bar` | 2,90 → **1,18** | **14,65** → **1,20** |
| `Toast .toast` | 4,66 (alfa real 0,397) → **1,18** | **14,97** (alfa real **0,052**) → **1,26** |
| `RetryNotice .notice` | 4,39 (alfa 0,415) → **1,18** | **14,88** (alfa 0,054) → **1,26** |
| `Drawer .panel` (sin tocar) | 1,18 | 1,26 |

- **591 (oscuro < 1,25)** — **cumplido** en las dos barras que nombra el
  criterio: **1,20** las dos. `Toast` y `RetryNotice` quedan en **1,26**: no los
  nombra el criterio, es **exactamente** lo que `Drawer` lleva hoy en
  producción, y vienen de 14,9. Se acepta.
- **592 (claro, mismo umbral)** — **cumplido**: **1,18** en las cuatro.
- **593 (texto propio ≥ 4,5 / atenuado ≥ 3)** — **el texto normal cumple** en
  todas partes (16,67–17,33 claro, 15,06–16,74 oscuro). **El atenuado en Aura
  claro no llega a 3:1 y no llegaba antes**: es `--color-text-muted: #94a3b8`
  sobre `#fafcfb`, **2,49:1 pase lo que pase con la opacidad**, porque el velo
  es del color del fondo. Lo comprobé en superficies que **nadie ha tocado**: la
  barra de `AppLayout` da 2,49 con el valor de `HEAD` y con el nuevo, y el
  `Drawer` intacto da **2,39** — el mismo sitio al que llega `Toast`. El cambio
  mueve 0,04 y 0,13 hacia una deuda que ya existía y cuyo suelo es el token.
  **Decisión:** se acepta como **deuda declarada del sistema de diseño**, del
  mismo tipo que `Button variant="danger"` en oscuro, y **no se reescribe el
  criterio** (el revisor tampoco lo reescribe). El criterio, tal y como está
  redactado, es **incumplible por cualquier superficie de Aura claro**: eso es un
  hallazgo sobre el criterio, no sobre la tajada. Arreglarlo es subir el token
  (`#94a3b8` → algo cercano a `#6b7a90`, 3:1 sobre `#fafcfb`) y toca la app
  entera: feature propia.
- **594 (con blur sigue pareciendo vidrio)** — **cumplido, y lo miré, no lo
  deduje**. Pinté en el navegador las barras a 72 %, 88 % y 92 % sobre el lienzo
  aurora con `blur(28px)` activo, en los dos temas. Lo que se ve: a 92 % la
  barra es **un panel casi sólido**; el vidrio lo sostienen el borde, la sombra y
  el radio, no el tinte. Es un cambio real de aspecto en toda la app.
  **Aun así no pido otro número, y esta es la medida que lo sostiene** (tinte
  sobre el orbe más fuerte frente al fondo plano, y fuga en Aura oscuro):

  | Opacidad | Tinte ΔE claro / oscuro | Fuga oscuro | ¿Pasa el 591? |
  |---|---|---|---|
  | 88 % | 4,1 / 8,5 | **1,355** | no |
  | 90 % | 3,4 / 7,1 | **1,275** | no |
  | **92 %** | 2,8 / 5,7 | **1,204** | **sí** |
  | 94 % | 2,1 / 4,3 | 1,141 | sí |

  O sea: **92 % es el valor con más vidrio que todavía cumple el 591**. Bajar a
  90 % gana poco tinte (ΔE 5,7 → 7,1 en oscuro) y rompe el criterio. Si al mirar
  el iPhone él prefiere el aspecto, el que tiene que ceder es **el umbral de
  1,25**, no el 92 %: eso es decisión suya, y el sitio a tocar es **un número por
  archivo**.
- **595 (solo fijas o pegajosas; las 54 intactas)** — **cumplido y verificado en
  el navegador**, no leyendo. Pedí al dev server el CSS ya compilado de cada
  módulo (`fetch('…module.scss?direct')`) y miré la `position` real:
  `HabitsListPage .emptyCard`, `HabitMyDayPage .emptyCard` y
  `VidaActividadesPage .panel` salen **sin `position`** (flujo normal, con
  `var(--color-glass)`) → bien descartadas; `Drawer .panel` sale `position: fixed`
  y **ya con `color-mix(… --color-surface-elevated 92% …)`** → no necesitaba
  nada, y confirma que las otras tres aterrizan en el valor del vecino.
  `AppLayout .pills` está **dentro de `.bar`**: `AppLayout.tsx:135` es el
  `<header class=bar>`, `:136` el `barInner` y `:154` el `<nav class=pills>` —
  lo único detrás de las píldoras es la barra, que ahora es opaca al 92 %.
  Usos de `--aura-glass-1` fuera del archivo de tokens: **60 en `HEAD`, 59 en el
  árbol**, baja exactamente el de la barra de sesión.
- **596 (`color-mix` con token del tema)** — **cumplido**: las cuatro
  declaraciones son `color-mix(in srgb, var(--color-bg | --color-surface-elevated)
  92%, transparent)`. Ni un `rgba` nuevo, ni una regla por tema; verificado en el
  bundle construido.
- **597 (nada de `@supports`)** — **cumplido**: en el CSS compilado del bundle no
  aparece ninguna consulta de soporte de los archivos tocados; las dos menciones
  del árbol están dentro de comentarios y **los comentarios no llegan al
  compilado**.
- **598 (puertas + CSS por lista de selectores)** — **cumplido, corrido por mí
  entero**: `pnpm typecheck` limpio · `pnpm lint` **14 errores / 0 warnings**
  (línea base) · `pnpm test` **2 fallos de 1951** (`SearchSelect` ×2, los de
  siempre; 117 de 118 archivos) · `pnpm build` verde, `index.js` **1.131,64 kB**
  y **CSS 275,17 kB** (línea base 275,14: **sube**, no baja). Y la comprobación
  que manda `ENVIRONMENT.md`: compilé los cuatro `.module.scss` de `HEAD`
  (`git show HEAD:<ruta>`) y los del árbol con `sass --style=compressed` y comparé
  la **lista de selectores**: **86 reglas a cada lado, `diff` vacío**. En el
  bundle, **2.376 reglas**. Ningún comentario se comió nada.
- **599 (capa propia, inocua)** — **cumplido en lo que se puede comprobar aquí**:
  el `will-change: backdrop-filter` va en el **propio elemento**, nunca en un
  ancestro, y con él el desenfoque sigue pintando igual en Chrome de escritorio
  (lo vi en las capturas). Ojo a por qué es inocuo de verdad: ese elemento **ya
  creaba bloque contenedor y contexto de apilamiento** por tener
  `backdrop-filter`, así que el `will-change` no cambia la geometría de nada que
  cuelgue dentro. Queda **por confirmar en el Android real**, como pide el
  criterio.

**Regresiones: dónde busqué y qué encontré.**

- `graphify query` sobre las tres superficies y `graphify explain "RetryNotice"`
  para ver quién cuelga de lo tocado. `RetryNotice` y `Toast` (vía
  `ToastViewport`) los monta **`AppLayout`**: son globales, así que el cambio de
  color se ve en toda la app; no hay ningún otro consumidor.
- **El diff no puede romper layout**: `git diff --stat` son **4 archivos** y
  **una línea de declaración cada uno** (fondo) más `will-change` en dos. Ni un
  cambio de caja, de tamaño o de posición. Las listas de selectores compiladas
  son idénticas a `HEAD`.
- **Lo entregado esta semana sigue intacto**, comprobado por ausencia en el árbol:
  `git status` **no lista ni un archivo** de `VidaGoalArc` (FEAT-019, el arco y su
  semáforo), ni de `VidaSessionBar.tsx` (la línea de nota de FEAT-018), ni de
  `VidaModuleLayout` (el hueco reservado abajo, que es `padding-bottom` y no se
  tocó). El único archivo de Vida modificado es el `.module.scss` de la barra de
  sesión, y solo en su fondo.
- **Lo que el constructor señaló como más probable roto —el aspecto— lo miré**:
  en Aura oscuro `Toast` y `RetryNotice` pasan de un panel translúcido que se
  teñía del lienzo a un **panel pizarra neutro** (`#161e2f`), claramente más
  sólido y algo más claro. Es un cambio visible, pero es el que arregla que en
  Android esos avisos fueran un 5 % de opacidad. En claro casi no se distingue.
  Fuera de Aura (`:root` oscuro) el texto de `Toast` baja de 16,18 a **13,43** y
  el atenuado de 4,86 a **4,04**: siguen muy por encima de AA.
- **No encontré ninguna regresión.**

**Estados:** no aplican los de datos (vacío, carga, error, permisos): esta tajada
es solo fondo de superficies que ya existían y no introduce ninguna vista.
**Texto largo** y **móvil a 375 px** tampoco cambian: no se tocó ni una caja.

**Hallazgos (no devuelven la tajada; quedan escritos).**

1. **CONFIRMADO y es más gordo de lo que parece: el minificador se está comiendo
   el `backdrop-filter` estándar.** Lo verifiqué en el bundle construido
   (`dist/assets/index-*.css`): **8 declaraciones estándar frente a 50
   `-webkit-`**. Y la regla es exacta, la vi rule a rule:
   - donde el `.scss` escribe **las dos** (el patrón de la casa), sobrevive
     **solo la `-webkit-`**: `._bar_ye3ds_15` (AppLayout) y `._bar_7ci0l_23`
     (VidaSessionBar) salen del build **sin** la estándar;
   - donde el `.scss` escribe **solo la estándar**, el build emite **las dos**:
     `._toast_agmgi_25`, `._notice_1fbnw_16`, `._panel_18l2l_8` (Drawer),
     `._anchorMenu_…`, `._content_…`.

   Consecuencia: en **Firefox**, que solo entiende la estándar, esas ~45
   superficies **nunca** han tenido desenfoque — y eso explica la primera frase
   del usuario («en web desktop parece que no funciona el efecto blur») si estaba
   en Firefox. **El arreglo:** borrar los `-webkit-backdrop-filter` escritos a
   mano en todo el repositorio y dejar que el build prefije. **Qué rompe:** nada
   en Chrome ni en Safari (ambos aceptan las dos), pero **en Firefox aparece de
   golpe el desenfoque en ~45 superficies que hoy se ven planas** — es un cambio
   de aspecto real en escritorio y por eso **merece feature propia**, no un
   parche aquí. El constructor lo dejó bien: en `Toast` y `RetryNotice` escribió
   solo la estándar, con un comentario para que nadie lo «arregle».
2. **`--color-glass-surface` no existe: confirmado.** Hoy solo aparece en dos
   comentarios; no está declarado en `:root` ni en Aura, ni en ningún tema.
   `Toast` y `RetryNotice` llevaban **desde siempre** cayendo al respaldo
   `--color-surface`, que en Aura es blanco al 45 % / 6 %: por eso el `88 %`
   escrito era un **39,7 % real en claro y un 5,2 % en oscuro**. Barrí el resto
   de `var(--token, respaldo)` de `src` buscando más fantasmas y quedan tres que
   conviene mirar en su momento: **`--aura-glass-2`**, **`--color-danger-text`**
   y **`--color-primary-strong`**, que tampoco aparecen declarados en
   `src/app/styles`. Los demás candidatos (`--vida-category-color`,
   `--vida-goal-color`, `--vida-fit-color`, `--habit-preview-color`, `--grid-gap`)
   son legítimos: se inyectan por `style` desde los componentes.
3. **El criterio 593 no es cumplible por ninguna superficie de Aura claro**, lo
   toque quien lo toque, porque el suelo lo pone el token de texto atenuado. Si
   se vuelve a escribir un criterio así, tiene que apuntar al token, no a la
   superficie.

**Lo que no pude verificar y por qué:** `/app/*` está detrás de un login que un
agente no cruza (`ENVIRONMENT.md`), así que **no vi ni una sola pantalla real de
la app**: todas mis medidas y capturas salen de superficies reconstruidas en la
página pública con los tokens de verdad. El recorrido en el Android y el iPhone
reales sigue siendo suyo, y los pasos están abajo.
