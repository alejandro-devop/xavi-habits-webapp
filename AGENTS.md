# AGENTS.md — Xavi Habits Web

Instrucciones para agentes de código (Cursor, etc.) que trabajan en este repositorio.

## Construir interfaces (UI)

**Obligatorio** al implementar o modificar pantallas, layouts o componentes visuales:

1. Leer **`docs/design-system-agent-guide.md`** — matriz necesidad → componente, flujo de decisión, cuándo proponer componentes nuevos.
2. Consultar ejemplos en **`/app/testinghall`** (ruta protegida) o `src/pages/app/TestingHallPage/`.
3. Aplicar la regla de Cursor **`.cursor/rules/design-system.mdc`**.

### Imports estándar

```tsx
import { Button, Card, FormField, … } from '@/shared/ui'
import { Container, Grid, GridItem, Stack } from '@/shared/layout'
```

### Si falta un componente

No improvisar con HTML/CSS sueltos. Indicar al usuario que no existe en el DS y ofrecer:

- **Composición** con componentes actuales, o
- **Propuesta** de nuevo componente en `src/shared/ui/` (con Testing Hall + test).

Detalle técnico: `docs/design-system.md`.

## Arquitectura

- Feature-first: `src/features/<dominio>/`
- Páginas finas: `src/pages/`
- UI reutilizable: `src/shared/ui/`, layout: `src/shared/layout/`
- Convenciones: `docs/project-conventions.md`
- Auth/rutas: `docs/auth-flow.md`

## Calidad

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
