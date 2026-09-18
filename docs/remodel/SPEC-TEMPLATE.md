# Spec — <nombre del módulo o slice>

> **Estado:** borrador | lista para construir | construida
> **Depende de:** <specs que deben estar hechas antes, o «nada»>

## Objetivo

Una o dos frases: qué queda distinto cuando esto esté hecho, en términos de lo que ve y hace la persona que usa la app.

## Fuera de alcance

Lo que explícitamente **no** se toca en esta spec. Esta sección evita que el constructor se expanda.

- …

## Pantallas y rutas

| Ruta | Página | Qué cambia |
|------|--------|------------|
| `/app/…` | `src/pages/…` | |

## Diseño

Referencia visual (Stitch, Figma, captura) y las decisiones que se derivan de ella.

- **Layout:** …
- **Tokens que cambian:** … (o «ninguno»)
- **Componentes del DS a reutilizar:** `Card`, `Stack`, …
- **Componentes nuevos propuestos:** … (o «ninguno»)

## Datos

Qué consulta y qué muta. El backend no se modifica.

- **Queries GraphQL:** …
- **Mutations:** …
- **Query keys:** …
- **Estado local (Zustand):** … (o «ninguno»)

## Criterios de aceptación

Comprobables, en presente, uno por línea. Sin esto la spec no se construye.

- [ ] …
- [ ] …
- [ ] Funciona en tema claro y oscuro
- [ ] Funciona a ~375px de ancho
- [ ] Estados vacío, cargando y error resueltos

## Notas para el constructor

Trampas conocidas, código existente que conviene imitar, decisiones ya tomadas que no hay que re-litigar.

- …
