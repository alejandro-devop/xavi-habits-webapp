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
| FEAT-003 | building | 2/5 | features/vida | Hoy — planear el día: la plantilla con hora, el presupuesto y los huecos | 2026-09-20 |

The **Slice** column says which one it's on: `2/4` is "the second of four". A
feature in `building` at `3/4` has two accepted and one in progress.

## Delivered

| ID | Area | Title | Delivered |
|---|---|---|---|
| FEAT-001 | layouts, app/router, features/vida | Cimientos del módulo Vida — la barra cambia de módulo y Vida existe como cascarón | 2026-09-19 |
| FEAT-002 | features/vida | El catálogo de Vida — las actividades de tu día a día, con su categoría y sus días | 2026-09-20 |

FEAT-003 está `planned` con **las ocho decisiones respondidas** (D1…D8 al final
de la sección 1) y **cinco tajadas** que el arquitecto mantiene tal cual: D6
cambió el modelo —la plantilla de Vida pasa a llevar **hora y duración**— y por
eso la tajada 1 es ese prerrequisito más los **ajustes de Vida** (inicio y fin
del día, en `/app/vida/ajustes`), antes de la agenda. La sección 2 deja las
rutas archivo por archivo, qué se rescata de `79bece0` función por función, y
un único recorte anotado: **el criterio 21 se parte** —el texto de «hoy sin
plan» cierra en la tajada 2 y el botón «Armar desde la plantilla» en la 5, que
es donde vive `activityDayPlanSet`—.

**FEAT-003, tajada 1 `accepted`** (sin commitear; la revisión está en la
sección 4 del dossier): la plantilla de Vida ya lleva **hora y duración** —SDL
recopiado y **verificado contra el repo hermano** carácter a carácter, tipos,
`planVidaItemSave`, la hoja con «a qué hora» y las píldoras 15 · 30 · 45 · 1h ·
libre, y la tarjeta leyendo «8:00 · 40 min · L M X J V»— y existe
**`/app/vida/ajustes`** con el inicio y el fin del día, en el popover «Ajustes»
del módulo y en `⌘K`. El riesgo gordo quedó descartado con un arnés de revisión
propio: **editar solo los días de un ítem que ya tenía hora no se la borra**, y
el test de contrato falla de verdad si el SDL pierde los campos. Línea base sin
empeorar: typecheck limpio, lint 14/0, `pnpm test` 2 fallos de **708** (los dos
de `SearchSelect`, preexistentes), chunk inicial **861,01 kB** (+7,8 kB, ninguno
de iconos). **Falta el recorrido manual del usuario** (criterio 58, con el API
desplegada) y, dentro de él, mirar los 375 px y el tema oscuro: esa medida es de
segunda mano. Hallazgo abierto: lo que *pinta* un `input type="time"` lo decide
el idioma del navegador, aunque el **valor** siempre sea `HH:mm` 24 h.

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
