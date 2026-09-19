# Spec — Fase 12: Más color y más iconos, sin romper lo que se distingue

> **Estado:** lista para construir
> **Depende de:** `07-catalogo-iconos.spec.md` y `08-color-inicial-habito.spec.md`, ambas construidas.
> **Pedida por el usuario el 2026-09-18:** «necesitamos más colores y más más iconos».

## Objetivo

La paleta pasa de **6 a 17** colores y el catálogo de iconos de **453 a más de
850**, sin perder lo que la fase 9 ganó: que dos hábitos con color distinto se
distingan de verdad, también para quien no ve bien el rojo o el verde.

## El hallazgo: seis no era un capricho, era un techo

Antes de escribir esto medí cuántos colores caben. El resultado, con el validador:

| Restricción | Máximo |
|---|---|
| Solo tema claro, todos los pares | **11** |
| Solo tema oscuro, todos los pares | **9** |
| **Los mismos hexadecimales sirviendo a los dos temas** | **6** |

Seis es exactamente lo que hay. No se llega a diecisiete relajando el gusto: se
llega **cambiando la pregunta**.

Y la pregunta cambia porque **un hábito nunca se identifica solo por el color**:
siempre lleva su icono y su nombre al lado. Eso es justo el «encoding secundario»
que el propio validador reconoce. La regla dura de todos-contra-todos es para un
gráfico donde el color es la única pista; aquí no lo es.

## La decisión: dos niveles

**Núcleo — 6 colores, los de hoy, intactos.** Pasan el validador entero en tema
claro. **Son los únicos que entran en el sorteo**: un hábito al que la app le pone
el color solo puede recibir uno de estos seis, así que dos hábitos automáticos
siempre se distinguen.

```
menta #10b981 · oliva #4d7c0f · ámbar #f59e0b
carmín #e11d48 · violeta #8b5cf6 · azul #0284c7
```

**Extendidos — 11 más, solo a mano.** Cada uno está **a ΔE ≥ 15 de los seis del
núcleo** —comprobado, no supuesto—, así que nunca se confunde con un color que la
app haya repartido sola. Entre ellos sí pueden parecerse: quien los elige los está
mirando.

```
#ff6ce2 #793974 #99a7f9 #2d3acc #924b00 #c02ca7
#e1808d #7017b6 #af761e #11bff0 #b46ca8
```

Los once están dentro de la banda de luminosidad y pasan el suelo de croma. Lo que
**no** pasan es el todos-contra-todos, y es deliberado: `#b46ca8` y `#e1808d` están
a ΔE 11,2. Si eso te parece inaceptable, el número a recortar son los extendidos,
no el núcleo.

**Los nombres en español son obligatorios** en cada muestra (`aria-label` y
tooltip): son la pista que hace legítimo tener colores parecidos.

### Lo que esta fase NO arregla

**El tema oscuro sigue con su deuda.** La única solución real es guardar el
*nombre* del color en vez del hexadecimal, para que cada tema pinte su propio
paso. Eso es cambio de datos y es otra fase. Aquí los extendidos se eligen dentro
de la banda clara, igual que los seis de hoy.

## Iconos: de 453 a más de 850

Font Awesome free-solid trae **1.422**; el catálogo usa **453**, un 32 %. Hay sitio
para doblarlo largo.

- **Suelo de 60 iconos por categoría** (hoy 25) en las trece que existen.
- **Mínimo 850 en total**, sin duplicar `name` ni `iconName`.
- **Ningún icono desaparece.** Los 453 de hoy siguen ahí con el mismo `name`: hay
  hábitos que ya los usan. El test de integridad tiene que comprobarlo.

## Lo que paga los iconos: el selector en diferido

Doblar el catálogo engorda el paquete inicial, y ya es un único trozo de 1,1 MB.
Por eso las dos cosas van juntas, como en la fase 9:

**`IconPicker` y el catálogo salen a un chunk perezoso.** Se cargan cuando alguien
abre el selector, no al arrancar la app. Quien solo mira Mi día no paga por 850
iconos.

Ojo: `AppIcon` —que pinta el icono ya elegido— **se queda en el paquete principal**.
Lo usa media app. Lo que se va en diferido es el *selector* y la lista completa,
no la capacidad de dibujar un icono.

## Criterios de aceptación

- [ ] La paleta tiene 17 colores: los 6 del núcleo **sin cambiar de hexadecimal** y 11 extendidos
- [ ] `pickInitialHabitColor` **solo sortea entre los 6 del núcleo**, y hay un test que lo demuestra
- [ ] Un test comprueba que **cada extendido está a ΔE ≥ 15 de cada color del núcleo** en OKLab
- [ ] Cada muestra se anuncia con su nombre en español
- [ ] El selector de color se recorre con teclado y no desborda a 375 px
- [ ] Un hábito con un color que ya no está en la paleta **sigue mostrando el suyo**
- [ ] El catálogo tiene ≥ 850 iconos y ≥ 60 por categoría
- [ ] **Ninguno de los 453 `name` actuales desaparece** — comprobado en el test de integridad
- [ ] `IconPicker` y el catálogo viven en un chunk aparte: `pnpm build` muestra más de un `.js`
- [ ] El chunk inicial **no crece** respecto a los 1.128 kB de hoy
- [ ] `AppIcon` sigue en el paquete principal y los iconos ya elegidos se pintan sin abrir nada
- [ ] Funciona en claro y oscuro
- [ ] typecheck limpio; lint y tests **no peores** que la línea base

## Notas para el constructor

- **Los hexadecimales de esta spec son el resultado de una búsqueda con el
  validador, no una propuesta.** No los cambies «porque quedan mejor»: en la fase 9
  se eligieron a ojo ocho colores y dos pares eran indistinguibles. Si crees que
  alguno sobra, dilo en el reporte; no lo sustituyas.
- Separa **núcleo** y **extendidos** en la estructura de datos (un campo `tier`, o
  dos listas), porque el sorteo depende de esa distinción.
- Los iconos nuevos se eligen por **utilidad para un hábito**, no por rellenar:
  antes de añadir uno, pregúntate qué hábito lo usaría.
- Para el chunk perezoso, `React.lazy` + `Suspense` con un `Skeleton` mientras
  carga. Comprueba que el selector sigue abriendo en el wizard **y** en la edición.
- Mide el paquete antes y después y **ponlo en el reporte**.
- No añadas dependencias.
- Al terminar, `graphify update .`
