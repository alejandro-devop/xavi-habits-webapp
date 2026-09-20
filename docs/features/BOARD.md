# Feature board

One row per feature. It's the index, not the content: to know *what* exists
you read here; to know *what's known*, the dossier (`FEAT-NNN-*.md`).

The user decides the order, not an agent. The state and slice rules are in
[PROTOCOL.md](PROTOCOL.md); this project's addresses and gotchas, in
`ENVIRONMENT.md` (here or in `docs/bugs/`).

| ID | State | Slice | Area | Title | Requested |
|---|---|---|---|---|---|
| FEAT-001 | delivered | 3/3 | layouts, app/router, features/vida | Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón | 2026-09-19 |
| FEAT-002 | delivered | 4/4 | features/vida | El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días | 2026-09-19 |
| FEAT-003 | specified | 0/5 | features/vida | Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos | 2026-09-20 |

The **Slice** column says which one it's on: `2/4` is "the second of four". A
feature in `building` at `3/4` has two accepted and one in progress.

## Delivered

| ID | Area | Title | Delivered |
|---|---|---|---|
| FEAT-001 | layouts, app/router, features/vida | Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón | 2026-09-19 |
| FEAT-002 | features/vida | El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días | 2026-09-20 |

FEAT-003 está `specified` con **las ocho decisiones respondidas** (D1…D8 al final
de la sección 1) y **cinco tajadas**: D6 cambió el modelo —la plantilla de Vida
pasa a llevar **hora y duración**— y por eso la tajada 1 es ese prerrequisito
más los **ajustes de Vida** (inicio y fin del día), antes de la agenda.

**Dependencia externa de FEAT-003:** el API gana `VidaItem.startTime`,
`VidaItem.durationMinutes` y `UserSettings.vidaDayStartTime` /
`vidaDayEndTime`; se construye en `~/Developer/xavi-platform-node` y **no desde
este repo**. Los tests de contrato validan contra el **SDL vendorizado**, no
contra el servidor: mientras Cloud Run no lleve el cambio, `pnpm test` puede
estar verde y una consulta real fallar con «campo desconocido» — no es un fallo
del constructor. El **recorrido real (criterio 58) no se puede hacer hasta que
esté desplegado**.

FEAT-002 queda con el **criterio 36 pendiente**: el recorrido real con sesión
(primer minuto → catálogo → crear con categoría nueva → plantilla → editar →
archivar → restaurar → cambiar una categoría). No es de ningún agente — está
detrás del login; los pasos están al final del dossier.

FEAT-001 queda con el **criterio 10 pendiente**: el recorrido real con sesión
(cambiar de Hábitos a Vida y volver). No es de ningún agente — está detrás del
login; los pasos están al final del dossier.
