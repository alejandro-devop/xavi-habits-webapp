# Habits Module — Design Document

> Estado: **Diseño / Pre-implementación**
> Fecha: 2026-06-03
> Autor: Arquitecto (sesión Claude)

---

## 1. Contexto y alcance

Xavi Habits es una app de productividad personal. El módulo de hábitos es el core que le da nombre y sentido a la aplicación. Actualmente el backend tiene una base implementada (tablas, servicio, GraphQL) pero incompleta y con conflictos respecto a los requerimientos definitivos. El frontend no tiene ningún feature folder de hábitos aún.

Este documento cubre:
- Estado actual del backend
- Gaps y conflictos identificados
- Preguntas de afinamiento sin resolver (deben responderse antes de implementar)
- Plan de implementación por fases

---

## 2. Requerimientos de negocio

### Entidades

**Categorías de hábitos**
- CRUD estándar con nombre, ícono, color, orden

**Hábitos**
- Tipo: `boolean` | `count` | `time`
- Naturaleza: beneficioso (`should_keep`) | a evitar (`should_avoid`)
- Período en días: duración total planeada del hábito
- Fecha inicio / fin
- Contador de reinicios histórico
- Salvavidas semanales configurables (número máximo por semana)

**Follow-ups diarios**
- Valor registrado (count o tiempo, según tipo)
- Emoji de dificultad
- Log/mensaje opcional

### Lógica de negocio

| Regla | Descripción |
|---|---|
| Racha | Incrementa con cada follow-up accomplished. **No muere por ausencia.** Solo muere con falla explícita (`is_failed = true`) |
| Completado | Checkbox marcado (boolean) / cantidad ≥ meta (count) / tiempo ≥ meta (time) |
| Falla | Extiende `end_date` para preservar la duración original del hábito |
| Salvavidas | Se resetean semanalmente. Protegen la racha en días excepcionales sin contar como logro |
| Métricas | Racha actual, racha máxima histórica, número de reinicios |

### Vistas requeridas (frontend — solo consideradas, no se implementan en esta fase)

- **Seguimiento semana a semana**: grilla de 7 días con estado por celda (vacío / logrado / fallido / lifeline)
- **Calendario completo estilo GitHub contributions**: desde `start_date` hasta `end_date`, con intensidad de color proporcional al logro

---

## 3. Estado actual del backend

### 3.1 Qué existe y está bien

| Elemento | Ubicación | Observación |
|---|---|---|
| Tablas DB | `migrations/004`, `024` | `habits`, `habit_logs`, `habit_categories`, `habit_measures` |
| CRUD hábitos | `habit.service.ts` | Completo |
| CRUD categorías | `habit-category.service.ts` | Completo, no requiere cambios |
| CRUD medidas | `habit-measure.service.ts` | Completo |
| `isFollowUpGoalMet` | `habit-streak.ts` | Determina si el follow-up cumple la meta |
| `applyFailedStreak` | `habit-streak.ts` | Resetea racha Y extiende `end_date` — ya cubre el req de "preservar días" |
| `getHabitMyDay` | `habit.service.ts` | Buena base para la vista diaria |
| GraphQL schema | `habit.schema.ts` | Bien estructurado, solo requiere extensión |
| Servicio de resolvers | `habit.resolvers.ts` | Patrón sólido con `withValidatedResolver` |

### 3.2 Qué existe pero tiene conflictos

#### Conflicto 1 — Tipo de hábito: 4 booleans vs. enum canónico (MODERADO)

**Situación actual:** Cuatro columnas booleanas: `is_counter`, `is_timer`, `is_incremental`, `is_decremental`. No son mutuamente excluyentes a nivel de DB. No hay garantía de consistencia.

**Requerido:** Un campo `habit_type` enum con valores `boolean | count | time`.

**Impacto:** Bajo en DB (agregar columna, migrar desde flags). Los flags existentes pueden mantenerse como campos de comportamiento secundarios (`is_incremental`, `is_decremental`).

---

#### Conflicto 2 — Algoritmo de racha: días consecutivos vs. "solo muere con falla explícita" (CRÍTICO)

**Situación actual:** `recalculateStreakFromDates` usa detección de huecos entre fechas de follow-ups. Si hay un día sin log, la racha **muere**. Esta función se ejecuta en `syncHabitStreakFromLogs`, que se llama después de cualquier cambio en los logs.

**Requerido:** La racha no muere por ausencia. Un día sin log = pausa, no muerte.

**Ejemplo del conflicto:**
```
Día 1: ✅  |  Día 2: —  |  Día 3: ✅
Actual:  racha = 1  (el gap del día 2 rompe todo)
Requerido: racha = 2  (el gap no mata nada)
```

**Impacto:** Alto. Es el algoritmo central. Debe reescribirse.

**Nuevo algoritmo:**
```
streak = COUNT de follow-ups con is_accomplished = TRUE
         WHERE completed_date > MAX(completed_date de is_failed = TRUE logs)
         -- Si no hay fallas, contar desde el inicio
```

---

#### Conflicto 3 — Campo `days` tiene doble semántica (MODERADO)

**Situación actual:** `days` actúa como acumulador de días completados (lo incrementa `syncHabitStreakFromLogs`). Al mismo tiempo, `applyFailedStreak` lo usa para calcular la extensión de `end_date`.

**Requerido:** "Período en días" como la duración total **planeada** del hábito — inmutable, configurada al crear.

**Solución:** Agregar `period_days` (duración original, no toca el usuario después). `days` sigue siendo el acumulador de días completados. `end_date` sigue siendo dinámico (se extiende en fallas).

---

### 3.3 Qué no existe

| Requerimiento | Gap |
|---|---|
| `restart_count` en hábito | ❌ |
| `weekly_lifelines` configurables | ❌ |
| Mecanismo de uso y tracking de lifelines | ❌ |
| `difficulty` en follow-up | ❌ |
| `period_days` como campo inmutable | ❌ |
| `habit_type` como enum canónico | ❌ |
| Query `habitWeekView` | ❌ |
| Feature folder en frontend | ❌ (ningún componente) |

---

## 4. Preguntas de afinamiento

Estas preguntas deben responderse antes de comenzar la implementación para evitar cambios de diseño a mitad de desarrollo.

### P1 — Lifelines: ¿protegen la racha o solo eximen el día?

**Opciones:**
- **A)** El lifeline se usa en un día → ese día no cuenta como logro ni como falla. La racha simplemente no incrementa ese día, pero tampoco muere.
- **B)** El lifeline se usa en un día → ese día cuenta como logro especial. La racha incrementa normalmente.

**Impacto:** Define si `is_lifeline` en `habit_logs` es neutral o positivo para la racha.

---

### P2 — ¿El lifeline se registra proactivamente o retroactivamente?

**Opciones:**
- **A)** El usuario lo usa el mismo día para "marcar el día como excepción" antes de que acabe.
- **B)** El usuario puede aplicarlo retroactivamente a un día pasado.
- **C)** Ambas opciones.

**Impacto:** Valida si la lógica de lifeline necesita restricciones de fecha.

---

### P3 — Reset semanal de lifelines: ¿lunes o domingo?

¿La semana empieza el **lunes** o el **domingo** para el conteo y reset de salvavidas?

**Impacto:** Define el cálculo de `week_start` en las queries.

---

### P4 — ¿Qué pasa con la racha cuando se elimina un follow-up?

**Opciones:**
- **A)** Recalcular racha desde todos los logs restantes (como hoy, pero con el nuevo algoritmo).
- **B)** La racha es solo incremental — eliminar un log no la reduce (solo se recalcula en fallas).

**Impacto:** Define si `removeHabitFollowUp` dispara o no una recalculación.

---

### P5 — ¿El `period_days` se puede editar después de creado?

¿El usuario puede cambiar la duración planeada del hábito después de iniciarlo, o es inmutable?

**Impacto:** Decide si `period_days` va en el input de edición o solo en el de creación.

---

### P6 — Hábito completado vs. hábito activo

¿Qué sucede cuando se llega a `end_date` sin fallas?
- **A)** El hábito se marca automáticamente como `is_active = false`.
- **B)** El usuario debe archivarlo manualmente.
- **C)** El hábito entra en estado "completado" (nuevo estado) distinto de activo/inactivo.

**Impacto:** Define si se necesita un campo de estado más rico o si `is_active` es suficiente.

---

### P7 — Dificultad: ¿escala numérica o emoji libre?

**Opciones:**
- **A)** Escala fija 0–4 (el frontend mapea cada valor a un emoji predefinido).
- **B)** El usuario escoge un emoji libre (se guarda el carácter del emoji como string).

**Recomendación:** Opción A — más fácil de consultar, ordenar y mostrar en vistas agregadas.

---

### P8 — ¿Los `is_incremental` / `is_decremental` siguen siendo relevantes?

Con el nuevo `habit_type`, los flags `is_incremental` e `is_decremental` quedan como modificadores secundarios. ¿Se mantienen o se eliminan?

**Impacto:** Si se mantienen, hay que documentar exactamente qué cambia en la UX/lógica cuando están activos.

---

## 5. Plan de implementación

Las fases están diseñadas para ser independientes y mergeable por separado.

### Fase 0 — Responder preguntas de afinamiento
**Duración estimada:** Sesión de diseño
**Entregable:** Este documento con las secciones P1–P8 respondidas

---

### Fase 1 — Migración DB (backend)
**Scope:** Solo cambios aditivos en la base de datos. No rompe nada existente.

**Archivo:** `migrations/040_habits_v2.sql`

**Cambios en `habits`:**
- `habit_type VARCHAR(10) DEFAULT 'boolean'` con CHECK constraint
- `period_days INTEGER NOT NULL DEFAULT 0`
- `restart_count INTEGER NOT NULL DEFAULT 0`
- `weekly_lifelines INTEGER NOT NULL DEFAULT 0`

**Cambios en `habit_logs`:**
- `difficulty SMALLINT` (nullable, 0–4)
- `is_lifeline BOOLEAN NOT NULL DEFAULT FALSE`

**Datos de migración:**
- Poblar `habit_type` desde flags existentes: `is_timer → 'time'`, `is_counter → 'count'`, resto → `'boolean'`
- Poblar `period_days` desde `days` (mejor estimación posible con datos existentes)

---

### Fase 2 — Reescritura del algoritmo de racha (backend)
**Scope:** Archivo `habit-streak.ts` + ajustes en `habit.service.ts`.
**Riesgo:** Alto — es la lógica central. Requiere tests antes de mergear.

**Cambios en `habit-streak.ts`:**
- Reemplazar `recalculateStreakFromDates` con el nuevo algoritmo basado en conteo desde última falla
- Mantener función como interna, no exportarla directamente desde el servicio

**Cambios en `habit.service.ts`:**
- `syncHabitStreakFromLogs`: usar nueva query SQL (COUNT desde última falla)
- `applyFailedStreak`: añadir `restart_count += 1` en el UPDATE
- `addHabitLog`: branch para `is_lifeline = true` (no aplica streak logic)

**Tests requeridos (backend):**
- Racha no muere con días vacíos
- Racha muere solo con `is_failed = true`
- Lifeline no incrementa ni rompe racha
- Falla extiende `end_date` correctamente
- Falla incrementa `restart_count`
- Recalculación post-delete es correcta

---

### Fase 3 — Extensión del servicio y GraphQL (backend)
**Scope:** Campos nuevos expuestos en el API.

**Cambios en `habit.service.ts`:**
- `createHabit`: aceptar `habit_type`, `period_days`, `weekly_lifelines`
- `updateHabit`: aceptar los mismos (excepto `period_days` si se decide inmutable)
- `getHabitMyDay`: incluir `lifelinesUsedThisWeek` calculado
- Nueva función: `getLifelinesUsedThisWeek(habitId, weekStart): Promise<number>`

**Cambios en `habit.schema.ts` (GraphQL):**

```graphql
enum HabitType { boolean count time }

type Habit {
  # Campos nuevos:
  habitType: HabitType!
  periodDays: Int!
  restartCount: Int!
  weeklyLifelines: Int!
  lifelinesUsedThisWeek: Int!
}

type HabitFollowUp {
  # Campos nuevos:
  difficulty: Int       # nullable, 0-4
  isLifeline: Boolean!
}

type HabitWeekView {
  habit: Habit!
  days: [HabitDayEntry!]!
  lifelinesRemaining: Int!
}

type HabitDayEntry {
  date: String!
  status: HabitDayStatus!
  followUp: HabitFollowUp
}

enum HabitDayStatus { empty accomplished failed lifeline }
```

**Nuevas queries GraphQL:**
- `habitWeekView(habitId: ID!, weekStart: String!): HabitWeekView!`

**Cambios en inputs:**
- `HabitInput`: añadir `habitType`, `periodDays`, `weeklyLifelines`
- `HabitEditInput`: añadir los mismos (según decisión de P5)
- `HabitFollowUpAddInput`: añadir `difficulty`, `isLifeline`
- `HabitFollowUpEditInput`: añadir `difficulty`

**Cambios en validación Zod (`habit.schemas.ts`):**
- Agregar los nuevos campos a los schemas correspondientes

---

### Fase 4 — Frontend: Feature folder base
**Scope:** Estructura del módulo, tipos, API y hooks. Sin UI aún.

**Archivos a crear:**
```
src/features/habits/
├── index.ts
├── types/habit.types.ts
├── graphql/habits.graphql.ts
├── api/habits.api.ts
├── hooks/useHabits.ts
├── routes/
│   ├── habits.routes.tsx
│   └── habits-paths.ts
└── utils/
    ├── habit-type.ts        # mapeo de HabitType a labels/icons
    └── difficulty.ts        # mapeo 0-4 → emoji
```

**Integración:**
- Añadir rutas a `src/app/router/routes.tsx`
- Añadir entrada de nav en `app-nav.config.ts`
- Añadir query keys en `src/shared/api/query-keys.ts`

---

### Fase 5 — Frontend: Vista diaria (Mi día)
**Scope:** Vista principal de seguimiento del día actual.

**Componentes:**
- `HabitMyDayPage`: lista de hábitos del día
- `HabitDayCard`: tarjeta de un hábito en el día (muestra estado, botón de registro)
- `HabitFollowUpModal`: modal para registrar follow-up (valor + dificultad + nota)
- `HabitLifelineButton`: botón de usar salvavidas (con contador de restantes)

---

### Fase 6 — Frontend: Vista semanal
**Scope:** Grilla semana a semana de un hábito.

**Componentes:**
- `HabitWeekView`: contenedor de la vista semanal
- `HabitWeekGrid`: grilla de 7 celdas
- `HabitDayCell`: celda de un día con estado visual (vacío / logrado / fallido / lifeline)
- `HabitWeekNav`: navegación entre semanas (anterior / siguiente)

**Data:** Query `habitWeekView` implementada en Fase 3.

---

### Fase 7 — Frontend: Calendario de progreso
**Scope:** Vista completa estilo GitHub contributions desde `start_date` hasta `end_date`.

**Componentes:**
- `HabitCalendarView`: contenedor
- `HabitContributionGrid`: grilla de todos los días del período con color por estado
- `HabitCalendarLegend`: leyenda de colores

**Data:** Query existente `habitFollowUpsInDates` con rango `start_date → end_date`.

---

### Fase 8 — Frontend: CRUD de hábitos
**Scope:** Crear, editar y archivar hábitos.

**Componentes:**
- `HabitsPage`: lista de hábitos agrupados por categoría
- `HabitCard`: tarjeta con nombre, tipo, racha actual, progreso del período
- `HabitFormModal`: crear/editar hábito (tipo, naturaleza, período, salvavidas, fechas)
- `HabitDetailPage`: detalle completo con stats + vista semanal + calendario

---

## 6. Resumen ejecutivo de cambios

| Área | Tipo | Riesgo |
|---|---|---|
| Migración DB | Aditivo | Bajo |
| Algoritmo racha | Reescritura | **Alto** |
| Servicio + nuevos campos | Extensión | Medio |
| GraphQL extensión | Aditivo | Bajo |
| Frontend base (tipos, API, hooks) | Nuevo | Bajo |
| Frontend vistas | Nuevo | Bajo |

**Orden de prioridad:** Fase 0 → 1 → 2 (con tests) → 3 → 4 → 5 → 6 → 7 → 8

El único punto de riesgo real es la **Fase 2** (algoritmo de racha). Requiere tests exhaustivos antes de mergear porque afecta datos existentes de todos los usuarios.

---

## 7. Decisiones pendientes (resumen)

| # | Pregunta | Decisión |
|---|---|---|
| P1 | ¿Lifeline es neutral o cuenta como logro? | ⬜ Sin definir |
| P2 | ¿Lifeline proactivo, retroactivo, o ambos? | ⬜ Sin definir |
| P3 | ¿Reset semanal lunes o domingo? | ⬜ Sin definir |
| P4 | ¿Eliminar follow-up recalcula racha? | ⬜ Sin definir |
| P5 | ¿`period_days` es editable post-creación? | ⬜ Sin definir |
| P6 | ¿Hábito completado = auto-archivar o manual? | ⬜ Sin definir |
| P7 | ¿Dificultad es escala 0–4 o emoji libre? | ⬜ Sin definir |
| P8 | ¿`is_incremental`/`is_decremental` se mantienen? | ⬜ Sin definir |
