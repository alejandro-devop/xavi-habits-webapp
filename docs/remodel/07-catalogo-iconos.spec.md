# Spec — Fase 8: Un catálogo de iconos que alcance

> **Estado:** lista para construir
> **Depende de:** nada. Es independiente de la fase 7; puede construirse en cualquier orden.
> **Pedida por el usuario el 2026-09-18:** «Más iconos, tenemos muy pocos iconos para las categorías».

## Objetivo

Hay tan pocos iconos que las categorías y los hábitos acaban pareciéndose todos. Esta fase **llena el catálogo**, no reconstruye el selector.

**La infraestructura ya existe y es buena** — conviene decirlo antes de que nadie la rehaga:

- `src/shared/icons/` ya tiene catálogo por temas, tipado y con `satisfies`.
- `filterAppIcons` ya busca **sin distinguir mayúsculas ni acentos**, por nombre, etiqueta, categoría y **palabras clave en español** (`'pesas'`, `'ejercicio'` ya encuentran `dumbbell`).
- `groupIconsByCategory` ya agrupa, `IconPicker` ya tiene buscador, rejilla, navegación por teclado y `role="option"`.

El problema es de **inventario**, y hay un agujero concreto:

| | Hoy |
|---|---|
| Iconos en el catálogo | 160 |
| Visibles en el selector | **138** (22 son de sistema, `showInPicker: false`) |
| Categoría **Social** | Declarada en las etiquetas y en el orden, **con cero iconos**: el grupo se filtra y nunca aparece |
| Categorías más flacas | Bienestar 7 · Ejercicio 8 · Tecnología 9 · Finanzas 10 |

## Fuera de alcance

- **Rehacer `IconPicker`.** Se toca solo si algo se rompe al crecer (ver «Lo que hay que comprobar al crecer»).
- **Cambiar el formato de guardado.** `icon` sigue siendo el `name` en texto. Ningún icono existente puede dejar de resolverse.
- **Abrir el paquete entero de Font Awesome.** Ver la decisión de abajo.
- **Backend, iconos de actividades, iconos subidos por el usuario.**

## Decisión: catálogo curado grande, no el paquete entero

Se **cura** la selección hasta ~400 iconos visibles, no se exponen los 1 400 de `free-solid-svg-icons`.

Por qué, para que no se reabra a mitad de construcción:

- Cada entrada del catálogo lleva **etiqueta y palabras clave en español**, que es justo lo que hace que la búsqueda funcione. Volcar el paquete entero traería 1 400 nombres en inglés sin sinónimos: más iconos y **peor** de encontrar.
- Font Awesome trae cientos de iconos de marcas, flechas y símbolos de interfaz que no significan nada como hábito.
- 400 con búsqueda buena se recorre; 1 400 sin ella, no.

**Meta: ~400 visibles**, con un suelo de **25 por categoría** en las que el usuario elige (no en `system`).

## Qué hay que hacer

### 1. Crear la categoría que falta

`src/shared/icons/catalog/social.icons.ts`, con al menos 25 entradas: familia, pareja, amigos, llamada, mensaje, café con alguien, quedada, regalo, videollamada, comunidad, voluntariado… Añadirla a `catalog/index.ts` y al array de `app-icons.ts`. **La etiqueta y el orden ya existen**: solo faltaba el archivo.

### 2. Engordar las demás hasta el suelo de 25

Con criterio de hábito real, no de relleno. Como guía de qué falta hoy:

- **Ejercicio** (8): yoga, pilates, escalada, remo, boxeo, baile, senderismo, patinete, esquí, tenis, baloncesto, pádel, estiramientos, abdominales, pesa rusa…
- **Bienestar** (7): respiración, meditación sentada, diario, gratitud, terapia, siesta, sol, naturaleza, silencio, spa, masaje…
- **Salud** (14): medicación, dentista, vitaminas, agua, verdura, fruta, báscula, tensión, revisión, dormir, ayuno…
- **Hogar** (13): lavadora, plancha, basura, reciclaje, cocinar, fregar, cama, plantas, compra, bricolaje…
- **Estudio** (13): idiomas, guitarra, piano, pintura, escritura, ajedrez, podcast, curso, examen…
- **Tecnología** (9) y **Finanzas** (10): mismo trato.

### 3. Mantener la calidad de cada entrada

Cada icono nuevo, igual que los que ya hay:

```ts
{ name: 'yoga', label: 'Yoga', category: 'fitness', icon: faSpa,
  keywords: ['estiramiento', 'flexibilidad', 'mindfulness', 'postura', 'clase'] }
```

- **Etiqueta en español**, que es lo que se ve en el `title` y el `aria-label`.
- **Palabras clave en español y en inglés**: el nombre de Font Awesome viene en inglés y el usuario escribe en español. Sin esto, la búsqueda no encuentra nada, que es el fallo que hay que evitar.
- `name` en kebab-case, **único en todo el catálogo** y estable para siempre: es lo que queda guardado en la base de datos.
- Si un icono ya existe con otro nombre, **alias en `iconNameAliases`**, no entrada duplicada.

### 4. Lo que hay que comprobar al crecer

El selector está construido para 138. A ~400 hay que mirar tres cosas y **arreglarlas si fallan**:

- **Peso.** Medir `pnpm build` antes y después y **escribirlo en el reporte**. Los iconos se importan uno a uno, así que el árbol debería sacudirse bien, pero hay que verlo, no suponerlo.
- **Rendimiento del filtrado.** `filterAppIcons` reconstruye el *haystack* de cada entrada en cada tecla: 400 × cada pulsación. Si se nota, precalcularlo una vez por entrada (memoizado a nivel de módulo). Sin reescribir la API.
- **Recorrido por teclado.** La rejilla usa `tabIndex` móvil; con 400 elementos en varios grupos hay que comprobar que las flechas siguen cruzando grupos y que el foco no se pierde al filtrar.

## Criterios de aceptación

- [ ] El selector muestra **~400 iconos**, con un mínimo de 25 por categoría elegible
- [ ] La categoría **Social** aparece en el selector con sus iconos
- [ ] Todo icono nuevo trae etiqueta en español y palabras clave en español e inglés
- [ ] Buscar «pesas», «yoga», «lavadora», «familia» o «idiomas» devuelve resultados con sentido
- [ ] Buscar sin acentos y en mayúsculas sigue funcionando («MEDITACION» encuentra «Meditación»)
- [ ] **Ningún icono ya guardado deja de resolverse**: los `name` existentes no se renombran ni se borran
- [ ] No hay `name` duplicados en todo el catálogo — con un test que lo compruebe
- [ ] Todas las entradas resuelven a un `IconDefinition` real — con un test que lo compruebe
- [ ] El recorrido con teclado por la rejilla sigue funcionando con el catálogo lleno
- [ ] El tamaño del bundle antes y después está medido y escrito en el reporte
- [ ] Tema claro y oscuro, y el selector usable a ~375px

## Notas para el constructor

- **No rehagas `IconPicker` ni `icon-search.ts`.** Están bien. Esta fase es sobre todo datos.
- Los dos tests de integridad (sin duplicados, todos resuelven) son **obligatorios**: son la única red que impide que el catálogo se pudra cuando alguien añada iconos más adelante.
- Importa cada icono por su nombre desde `@fortawesome/free-solid-svg-icons`. **Nunca** `import * as icons`: eso mata el árbol sacudido y engorda el bundle.
- Antes de inventar un icono, comprueba que Font Awesome **Free Solid** lo tiene. Muchos de los evidentes (varios deportes, instrumentos) solo están en la versión de pago. Si no existe, elige el más cercano y dilo en el reporte; no dejes una importación rota.
- No añadas dependencias. El paquete ya está instalado.
- Al terminar, `graphify update .`
