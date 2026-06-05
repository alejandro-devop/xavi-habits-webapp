# Habits Module — Implementation Plan

> Estado del tracker: `docs/habits-phases.json`
> Documento de análisis previo: `docs/habits-module-design.md`
> Última actualización: 2026-06-03

---

## Instrucciones para agentes

Antes de implementar cualquier cosa, leer este archivo completo y el tracker de fases.

### Protocolo obligatorio

1. **Leer** `docs/habits-phases.json` para conocer el estado actual.
2. **Verificar** que todas las fases de las que dependes estén en `"status": "complete"`.
3. **Actualizar** el JSON antes de empezar: `"status": "in_progress"`, `"startedAt": "<fecha ISO>"`.
4. **Implementar** exactamente lo descrito en la sección de la fase, sin agregar ni omitir.
5. **Actualizar** el JSON al terminar: `"status": "complete"`, `"completedAt": "<fecha ISO>"`, `"completedBy": "<agente o sesión>"`.
6. **No mergear** la Fase 2 sin que todos los tests estén en verde.
7. **No ejecutar** la migración `041` antes de que el código de Fase 3 esté deployado.

### Cómo saber qué implementar a continuación

```
Fase siguiente = la fase con "status": "pending" cuyo "dependsOn" 
                 tiene todas las fases en "status": "complete"
```

Si hay varias fases elegibles (7 y 8 pueden iniciar en paralelo tras 5 y 6), se puede trabajar en paralelo en repos distintos.

---

## Repos

| Repo | Ruta |
|---|---|
| Frontend | `/Users/jako/Developer/xavi-fronts/xavi-habits-web` |
| Backend | `/Users/jako/Developer/xavi-platform/xavi-platform-node` |

---

## Decisiones de diseño (P1–P8 resueltas)

| # | Pregunta | Decisión |
|---|---|---|
| P1 | Lifeline para la racha | Neutral: no incrementa ni mata la racha. Sí extiende `end_date` en +1 día. |
| P2 | Retroactividad del lifeline | Permitido hoy y ayer (máximo). Validación server-side: `completedDate >= CURRENT_DATE - 1`. |
| P3 | Inicio de semana | Lunes. Usar `DATE_TRUNC('week', ...)` en PostgreSQL (ISO, ya inicia lunes). |
| P4 | Eliminar follow-up recalcula racha | Sí. `removeHabitFollowUp` llama `syncHabitStreakFromLogs` con el nuevo algoritmo. |
| P5 | `period_days` editable | No es campo de input. Se computa automáticamente como `end_date - start_date`. Edición de fechas bloqueada si hay follow-ups. |
| P6 | Hábito completado | Estado `completed` distinto de `archived`. Mutación `habitComplete` manual. |
| P7 | Dificultad | Escala numérica 0–4 en DB. Frontend mapea a emojis fijos. |
| P8 | `is_incremental` / `is_decremental` | Eliminados. Del código, GraphQL, schemas y DB. |

---

## Fase 1 — Migración DB

**Repo:** Backend
**Dependencias:** ninguna
**Riesgo:** Bajo

### Scope exacto

Solo cambios aditivos en PostgreSQL. No toca ningún archivo de servicio. No rompe nada existente. Las columnas legacy (`is_counter`, `is_timer`, `is_incremental`, `is_decremental`) se mantienen intactas hasta Fase 3.

### Archivos a crear

| Archivo | Acción |
|---|---|
| `migrations/040_habits_v2.sql` | CREAR |

### Contenido de `040_habits_v2.sql`

**Tabla `habits` — 5 columnas nuevas:**

1. `habit_type VARCHAR(10) NOT NULL DEFAULT 'boolean'` con `CHECK (habit_type IN ('boolean', 'count', 'time'))`.

2. `period_days INTEGER NOT NULL DEFAULT 0` — duración planeada en días, se computa desde fechas. Inmutable una vez que hay follow-ups.

3. `restart_count INTEGER NOT NULL DEFAULT 0` — contador de reinicios históricos. Incrementa en cada falla.

4. `weekly_lifelines INTEGER NOT NULL DEFAULT 0` — salvavidas por semana configurados. 0 = sin salvavidas.

5. `status VARCHAR(20) NOT NULL DEFAULT 'active'` con `CHECK (status IN ('active', 'completed', 'archived'))`.

**Índice sobre `status`:**
```sql
CREATE INDEX idx_habits_status ON habits(user_id, status);
```

**Tabla `habit_logs` — 2 columnas nuevas:**

1. `difficulty SMALLINT` nullable, sin default, con `CHECK (difficulty IS NULL OR (difficulty BETWEEN 0 AND 4))`.

2. `is_lifeline BOOLEAN NOT NULL DEFAULT FALSE`.

**Índice sobre lifelines:**
```sql
CREATE INDEX idx_habit_logs_lifeline ON habit_logs(habit_id, is_lifeline, completed_date);
```
Necesario para la query semanal de lifelines usados.

**Migración de datos existentes:**

```sql
-- Poblar habit_type desde flags (is_timer tiene precedencia)
UPDATE habits SET habit_type = CASE
  WHEN is_timer = TRUE THEN 'time'
  WHEN is_counter = TRUE THEN 'count'
  ELSE 'boolean'
END;

-- Poblar period_days desde fechas cuando ambas existen
UPDATE habits
SET period_days = (end_date - start_date)
WHERE start_date IS NOT NULL AND end_date IS NOT NULL;

-- Poblar status desde is_active
UPDATE habits SET status = CASE
  WHEN is_active = TRUE THEN 'active'
  ELSE 'archived'
END;
```

**Sección DOWN:**
- `ALTER TABLE habits DROP COLUMN IF EXISTS habit_type, period_days, restart_count, weekly_lifelines, status;`
- `ALTER TABLE habit_logs DROP COLUMN IF EXISTS difficulty, is_lifeline;`
- `DROP INDEX IF EXISTS idx_habits_status;`
- `DROP INDEX IF EXISTS idx_habit_logs_lifeline;`

### Criterio de done

- La migración corre sin errores en una DB limpia y en producción.
- `SELECT habit_type, COUNT(*) FROM habits GROUP BY habit_type` muestra distribución coherente.
- `SELECT difficulty, is_lifeline FROM habit_logs LIMIT 5` funciona sin error.
- El DOWN revierte a estado previo.

---

## Fase 2 — Algoritmo de racha

**Repo:** Backend
**Dependencias:** Fase 1
**Riesgo:** ALTO — es la lógica central. No mergear sin tests en verde.

### Scope exacto

Reescritura completa del algoritmo de racha en `habit-streak.ts`. El algoritmo consecutivo (`recalculateStreakFromDates`) desaparece. La racha ahora es `COUNT de accomplished logs desde la última falla`. Actualización de `habit.service.ts` para usar las nuevas funciones. Tests unitarios obligatorios.

### Archivos afectados

| Archivo | Acción |
|---|---|
| `src/services/habit-streak.ts` | MODIFICAR — reescritura parcial |
| `src/services/habit.service.ts` | MODIFICAR |
| `src/services/habit-streak.test.ts` | CREAR |

### Cambios en `habit-streak.ts`

**Funciones eliminadas:**

- `recalculateStreakFromDates(accomplishedDates: string[])` — algoritmo de días consecutivos. Eliminar completamente, incluyendo su export.
- `applyAccomplishedStreak(habit)` — ya no se necesita incremento en memoria; la racha se actualiza vía SQL o de forma incremental en el servicio.

**Tipo `HabitStreakFields` — modificar:**

Campos a eliminar del tipo: `is_counter`, `is_timer`, `is_incremental`, `is_decremental`, `times_goal`.

Campos a añadir al tipo: `habit_type: 'boolean' | 'count' | 'time'`, `period_days: number`, `restart_count: number`.

Campos que permanecen: `daily_goal`, `timer_goal`, `target_count`, `streak`, `max_streak`, `days`, `end_date`.

**Función `getEffectiveGoal(habit)` — reescribir:**

Reemplazar el bloque de 4 flags booleanos con un switch sobre `habit.habit_type`:
- `'time'` → devolver `habit.timer_goal`
- `'count'` → devolver `habit.daily_goal > 0 ? habit.daily_goal : habit.target_count`
- `'boolean'` → devolver `1` (cualquier registro cuenta)

**Función `applyFailedStreak(habit, followUpDate)` — modificar:**

Cambio crítico: el nuevo `end_date` ya no usa `habit.days` (logs acumulados). Usa `habit.period_days` para un reinicio completo del período desde la fecha de falla.

Nuevo cálculo: `end_date = addDaysToDateString(followUpDate, habit.period_days)`.

Caso especial: si `habit.period_days === 0` (hábito sin fecha fin), `end_date` devuelve `null`.

El tipo de retorno añade `restart_count: habit.restart_count + 1`.

Firma nueva:
```typescript
applyFailedStreak(
  habit: HabitStreakFields,
  followUpDate: string
): { streak: 0; end_date: string | null; restart_count: number }
```

**Función nueva `applyLifelineToEndDate(habit)` — añadir:**

No toca `streak`. Solo extiende `end_date` en exactamente 1 día.

Si `habit.end_date` es null, devuelve `{ end_date: null }` (sin cambio).

Si `habit.end_date` es string, devuelve `{ end_date: addDaysToDateString(habit.end_date, 1) }`.

Firma:
```typescript
applyLifelineToEndDate(
  habit: Pick<HabitStreakFields, 'end_date'>
): { end_date: string | null }
```

**Funciones que permanecen sin cambio estructural:**

- `isFollowUpGoalMet(habit, followUp)` — sin cambio en firma; se beneficia automáticamente del `getEffectiveGoal` reescrito.
- `addDaysToDateString(dateStr, days)` — sin cambio.

### Cambios en `habit.service.ts`

**`syncHabitStreakFromLogs(habitId: number): Promise<void>` — reescribir completamente:**

Esta función es ahora el único lugar de recálculo total. Se usa exclusivamente al eliminar un follow-up (P4) y al actualizar uno. En el path de inserción de accomplished, se hace incremento directo (ver `applyStreakAfterFollowUp`).

La función ejecuta dos queries SQL separadas:

*Query A — racha actual (current streak):*
```sql
SELECT COUNT(*)::int AS streak
FROM habit_logs
WHERE habit_id = $1
  AND is_accomplished = TRUE
  AND is_lifeline = FALSE
  AND archived = FALSE
  AND completed_date > (
    SELECT COALESCE(MAX(completed_date), '1970-01-01'::date)
    FROM habit_logs
    WHERE habit_id = $1 AND is_failed = TRUE
  )
```

*Query B — max_streak verdadero (épocas entre fallas):*

Lógica: cada falla define el inicio de una nueva época. Se calcula cuántos accomplished logs hay en cada época (entre dos fallas consecutivas, o desde el inicio hasta la primera falla, o desde la última falla hasta hoy). El máximo de esos conteos es el `max_streak` histórico. Se implementa como una CTE:

```sql
WITH failure_dates AS (
  SELECT completed_date AS fd
  FROM habit_logs
  WHERE habit_id = $1 AND is_failed = TRUE
),
boundaries AS (
  SELECT '1970-01-01'::date AS epoch_start,
         MIN(fd) AS epoch_end
  FROM failure_dates
  UNION ALL
  SELECT fd AS epoch_start,
         LEAD(fd) OVER (ORDER BY fd) AS epoch_end
  FROM failure_dates
),
epoch_counts AS (
  SELECT b.epoch_start,
         COALESCE(b.epoch_end, '9999-12-31'::date) AS epoch_end,
         COUNT(hl.id) AS cnt
  FROM boundaries b
  LEFT JOIN habit_logs hl
    ON hl.habit_id = $1
    AND hl.is_accomplished = TRUE
    AND hl.is_lifeline = FALSE
    AND hl.archived = FALSE
    AND hl.completed_date > b.epoch_start
    AND hl.completed_date < COALESCE(b.epoch_end, '9999-12-31'::date)
  GROUP BY b.epoch_start, b.epoch_end
)
SELECT COALESCE(MAX(cnt), 0) AS max_streak FROM epoch_counts
```

Nota: se usa `SET max_streak = computed_max` (no `GREATEST`), porque se está recalculando desde cero; si el usuario borró sus mejores logs, el max_streak debe reflejar la realidad.

*UPDATE final:*
```sql
UPDATE habits
SET streak = $1,
    max_streak = $2,
    days = (SELECT COUNT(*) FROM habit_logs WHERE habit_id = $3 AND archived = FALSE)
WHERE id = $3
```

**`applyStreakAfterFollowUp(habit, date, isAccomplished, isFailed, isLifeline)` — modificar:**

Añadir el parámetro `isLifeline: boolean`. Añadir un tercer branch:

- Si `isLifeline = true`: llamar a `applyLifelineToEndDate(habit)` y ejecutar `UPDATE habits SET end_date = $1 WHERE id = $2`. No tocar `streak`, `days`, ni `restart_count`. Retornar sin llamar `syncHabitStreakFromLogs`.

- Si `isFailed = true`: igual que hoy (archivar logs, aplicar `applyFailedStreak`). El UPDATE ahora incluye además `restart_count = $N`. No llamar `syncHabitStreakFromLogs` después; la racha queda en 0 por definición.

- Si `isAccomplished = true`: en lugar de llamar `syncHabitStreakFromLogs` (costoso para el path happy), ejecutar directamente el incremento:
  ```sql
  UPDATE habits
  SET streak = streak + 1,
      max_streak = GREATEST(max_streak, streak + 1),
      days = days + 1
  WHERE id = $1
  ```
  Este incremental es correcto porque la racha es conteo desde la última falla, y sumar 1 es equivalente dado que los logs anteriores ya están contados en `streak`.

**`addHabitLog(habitIdStr, userId, input)` — modificar:**

El parámetro `input` acepta dos nuevos campos: `isLifeline?: boolean` y `difficulty?: number | null`.

Al inicio de la función, branch si `isLifeline = true`:
1. Forzar `isAccomplished = false`, `isFailed = false`.
2. Validar `completedDate >= CURRENT_DATE - 1`; si no, lanzar `ConflictError('Lifeline can only be applied to today or yesterday')`.
3. Validar que `habit.weekly_lifelines > 0`; si es 0, lanzar `ConflictError('This habit has no lifelines configured')`.
4. Llamar a `getLifelinesUsedThisWeek(habitId)`. Si `used >= habit.weekly_lifelines`, lanzar `ConflictError('Weekly lifeline limit reached')`.

El INSERT y UPDATE de `habit_logs` incluyen `difficulty` e `is_lifeline` como campos adicionales.

Actualizar `LOG_RETURNING` para incluir `difficulty, is_lifeline`.

**`updateHabitFollowUp(followUpId, userId, input)` — modificar:**

Aceptar `difficulty?: number | null` en el input. El UPDATE de `habit_logs` incluye `difficulty = COALESCE($N, difficulty)`.

**`removeHabitFollowUp` — sin cambio de firma:**

La llamada a `syncHabitStreakFromLogs` sigue ahí; ahora usa el nuevo algoritmo SQL (correcto para P4).

**`getHabitMyDay(userId, date)` — refactor de N+1:**

El loop actual hace una query por hábito. Reemplazar por un JOIN único:

```sql
SELECT h.*, hl.id AS log_id, hl.completed_date, hl.count, hl.time,
       hl.notes, hl.story, hl.archived, hl.is_accomplished, hl.is_failed,
       hl.difficulty, hl.is_lifeline, hl.created_at AS log_created_at,
       hl.updated_at AS log_updated_at
FROM habits h
LEFT JOIN habit_logs hl
  ON hl.habit_id = h.id
  AND hl.completed_date = $2::date
  AND hl.archived = FALSE
WHERE h.user_id = $1
  AND h.status = 'active'
ORDER BY h.order_index ASC
```

Mapear las filas: si `log_id` es null, `followUp = null`; si no, construir el objeto `HabitLog` desde los campos `hl.*`.

**Nueva función `getLifelinesUsedThisWeek(habitId: number): Promise<number>`:**

```sql
SELECT COUNT(*)::int AS count
FROM habit_logs
WHERE habit_id = $1
  AND is_lifeline = TRUE
  AND DATE_TRUNC('week', completed_date) = DATE_TRUNC('week', CURRENT_DATE)
```

Esta función es interna al servicio (no exportada). Usada en `addHabitLog` para la validación.

### Cambios en `habit-streak.test.ts`

Casos de test obligatorios (sin tests, la Fase 2 no se mergea):

1. **Racha no muere con días vacíos:** Dos logs accomplished con fecha 1 y fecha 3 (gap en fecha 2). `syncHabitStreakFromLogs` debe devolver `streak = 2`.

2. **Racha muere solo con `is_failed = true`:** Tres logs accomplished, luego uno `is_failed = true`, luego dos accomplished más. `streak` debe ser 2, no 5.

3. **Lifeline no incrementa ni rompe racha:** Log accomplished (streak=1), log lifeline, log accomplished. `streak` debe ser 2, no 3.

4. **Falla extiende `end_date` correctamente:** Hábito con `period_days = 30`, falla en fecha `2026-01-15`. `end_date` resultante = `2026-02-14`.

5. **Falla incrementa `restart_count`:** Hábito con `restart_count = 0`, se aplica falla. Resultado: `restart_count = 1`.

6. **Recalculación post-delete es correcta:** 5 logs accomplished, se elimina el 3ro. `streak = 4`, `max_streak = 5`.

7. **`applyLifelineToEndDate` extiende end_date en 1 día:** `end_date = '2026-06-10'` → `'2026-06-11'`.

8. **`applyLifelineToEndDate` con `end_date = null` devuelve null.**

9. **`getEffectiveGoal` con `habit_type = 'boolean'` devuelve 1.**

10. **`getEffectiveGoal` con `habit_type = 'time'` devuelve `timer_goal`.**

11. **Max streak calcula correctamente entre épocas:** 5 accomplished → 1 failed → 3 accomplished → 1 failed → 7 accomplished. `max_streak = 7`, `streak = 7`.

### Criterio de done

- Todos los 11 tests en verde.
- `streak` de todos los hábitos existentes recalculado con `syncHabitStreakFromLogs` post-deploy.
- Un lifeline no altera `streak` en la DB.
- Una falla muestra `end_date = failure_date + period_days` en la DB.

---

## Fase 3 — Servicio y GraphQL

**Repo:** Backend
**Dependencias:** Fases 1 y 2
**Riesgo:** Medio
**Nota importante:** La migración `041` se aplica en un segundo paso, DESPUÉS de que el código esté deployado.

### Scope exacto

Exposición de todos los campos nuevos en el API GraphQL. Eliminación de flags legacy del código. Nueva query `habitWeekView`. Nueva mutación `habitComplete`. Protección de edición de fechas si hay follow-ups.

### Archivos afectados

| Archivo | Acción |
|---|---|
| `migrations/041_habits_cleanup.sql` | CREAR |
| `src/types/services/habit.types.ts` | MODIFICAR |
| `src/services/habit.service.ts` | MODIFICAR |
| `src/validators/schemas/habit.schemas.ts` | MODIFICAR |
| `src/graphql/modules/habit/habit.schema.ts` | MODIFICAR |
| `src/graphql/modules/habit/habit.resolvers.ts` | MODIFICAR |

### Contenido de `041_habits_cleanup.sql`

Dropea las 4 columnas legacy. Ejecutar SOLO después de que el código de Fase 3 esté deployado.

```sql
-- IMPORTANTE: Solo ejecutar post-deploy del código de Fase 3
ALTER TABLE habits
  DROP COLUMN IF EXISTS is_incremental,
  DROP COLUMN IF EXISTS is_decremental,
  DROP COLUMN IF EXISTS is_counter,
  DROP COLUMN IF EXISTS is_timer;
```

DOWN: re-add las 4 columnas con sus defaults originales.

### Cambios en `habit.types.ts`

**Tipo `Habit`:**

Eliminar campos: `isCounter`, `isTimer`, `isIncremental`, `isDecremental`.

Añadir campos:
- `habitType: 'boolean' | 'count' | 'time'`
- `periodDays: number`
- `restartCount: number`
- `weeklyLifelines: number`
- `status: 'active' | 'completed' | 'archived'`

**Tipo `HabitLog` / `HabitFollowUp`:**

Añadir campos:
- `difficulty: number | null`
- `isLifeline: boolean`

**Tipo `HabitMyDayEntry`:**

Añadir campos:
- `lifelinesUsedThisWeek: number`
- `lifelinesRemaining: number`

**Nuevos tipos a exportar:**
```typescript
export type HabitType = 'boolean' | 'count' | 'time'
export type HabitStatus = 'active' | 'completed' | 'archived'
export type HabitDayStatus = 'empty' | 'accomplished' | 'failed' | 'lifeline'

export interface HabitDayEntry {
  date: string
  status: HabitDayStatus
  followUp: HabitFollowUp | null
}

export interface HabitWeekView {
  habit: Habit
  days: HabitDayEntry[]
  lifelinesRemaining: number
}
```

**Inputs:**

`CreateHabitInput`: eliminar `isCounter`, `isTimer`, `isIncremental`, `isDecremental`. Añadir `habitType?: HabitType`, `weeklyLifelines?: number`.

`UpdateHabitInput`: mismo cambio.

`AddHabitLogInput`: añadir `isLifeline?: boolean`, `difficulty?: number | null`.

`UpdateHabitFollowUpInput`: añadir `difficulty?: number | null`.

`ListHabitsOptions`: añadir `status?: HabitStatus`.

### Cambios en `habit.service.ts`

**`HabitRow` type interno:**

Añadir: `habit_type`, `period_days`, `restart_count`, `weekly_lifelines`, `status`.

Eliminar: `is_counter`, `is_timer`, `is_incremental`, `is_decremental`.

**`HabitLogRow` type interno:**

Añadir: `difficulty: number | null`, `is_lifeline: boolean`.

**`HABIT_RETURNING` constante:**

Añadir los 5 campos nuevos de habits. Eliminar los 4 flags legacy de la lista.

**`LOG_RETURNING` constante:**

Añadir `difficulty, is_lifeline`.

**`mapHabit(row)`:**

Añadir mapeos de los 5 campos nuevos. Eliminar mapeos de los 4 flags legacy.

**`mapHabitLog(row)`:**

Añadir: `difficulty: row.difficulty ?? null`, `isLifeline: row.is_lifeline ?? false`.

**`createHabit(userId, input)`:**

Eliminar los 4 flags del INSERT. Añadir `habit_type`, `weekly_lifelines`, `status = 'active'`.

Calcular `period_days` antes del INSERT:
- Si `input.startDate` y `input.endDate` están presentes: `period_days = Math.round((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000)`.
- Si solo uno o ninguno: `period_days = 0`.

Incluir `period_days` en el INSERT.

**`updateHabit(id, userId, input)`:**

En el `fieldMap`, eliminar los 4 flags legacy. Añadir `habit_type`, `weekly_lifelines`, `status`.

Antes de aplicar cualquier cambio de fechas (`startDate` o `endDate` presentes en el input):

```sql
SELECT COUNT(*) AS cnt FROM habit_logs WHERE habit_id = $1 AND archived = FALSE
```

Si `cnt > 0`, lanzar `ConflictError('Cannot change dates after follow-ups have been recorded')`.

Si la edición de fechas es permitida: recalcular `period_days` desde las nuevas fechas e incluirlo en el UPDATE como campo adicional.

**Nueva función `getHabitWeekView(habitId: string, weekStart: string, userId: number): Promise<HabitWeekView>`:**

1. Verificar propiedad con `getOwnedHabitOrThrow`.
2. Construir array de 7 fechas: `[weekStart, weekStart+1, ..., weekStart+6]` usando `addDaysToDateString`.
3. Query única:
   ```sql
   SELECT * FROM habit_logs
   WHERE habit_id = $1
     AND completed_date >= $2::date
     AND completed_date <= $3::date
     AND archived = FALSE
   ```
4. Construir `Map<string, HabitLogRow>` indexado por `completed_date` formateado.
5. Para cada una de las 7 fechas, determinar status:
   - Sin log → `'empty'`
   - Log con `is_lifeline = true` → `'lifeline'`
   - Log con `is_failed = true` → `'failed'`
   - Log con `is_accomplished = true` → `'accomplished'`
   - Log existe sin ninguna flag → `'empty'`
6. Calcular `lifelinesUsedThisWeek`: `COUNT de logs con is_lifeline = TRUE WHERE DATE_TRUNC('week', completed_date) = DATE_TRUNC('week', weekStart::date)`.
7. `lifelinesRemaining = Math.max(0, habit.weekly_lifelines - lifelinesUsedThisWeek)`.
8. Devolver `{ habit: mapHabit(habitRow), days: [7 x HabitDayEntry], lifelinesRemaining }`.

**Nueva función `completeHabit(id: string, userId: number): Promise<Habit>`:**

1. Verificar propiedad.
2. Verificar `habit.status === 'active'`; si no, lanzar `ConflictError('Habit is not active')`.
3. `UPDATE habits SET status = 'completed', is_active = FALSE WHERE id = $1 RETURNING ${HABIT_RETURNING}`.
4. Devolver `mapHabit(result.rows[0])`.

**`listHabits(userId, options)`:**

Añadir filtro por `status`. Si `options.status` está presente, filtrar `status = $N`. Para backward compat, si `options.isActive = true`, filtrar `status = 'active'`.

**`getHabitMyDay(userId, date)`:**

Añadir los campos `lifelinesUsedThisWeek` y `lifelinesRemaining` por hábito.

Implementar como un batch: una sola query que cuenta los lifelines de la semana actual agrupados por `habit_id` para todos los hábitos del usuario, luego hacer Map lookup al construir las entradas.

```sql
SELECT hl.habit_id, COUNT(*)::int AS cnt
FROM habit_logs hl
INNER JOIN habits h ON h.id = hl.habit_id
WHERE h.user_id = $1
  AND hl.is_lifeline = TRUE
  AND DATE_TRUNC('week', hl.completed_date) = DATE_TRUNC('week', CURRENT_DATE)
GROUP BY hl.habit_id
```

### Cambios en `habit.schemas.ts`

**`legacyHabitFields`:**

Eliminar: `isCounter`, `isTimer`, `isIncremental`, `isDecremental`.

Añadir:
- `habitType: z.enum(['boolean', 'count', 'time']).optional()`
- `weeklyLifelines: z.number().int().min(0).optional()`

**`habitEditFields` array** (del `refine` de `habitEditInputSchema`): eliminar los 4 flags, añadir `'habitType'` y `'weeklyLifelines'`.

**`habitLogAddInputSchema` / `habitFollowUpAddInputSchema`:**

Añadir:
- `difficulty: z.number().int().min(0).max(4).nullable().optional()`
- `isLifeline: z.boolean().optional()`

**`habitFollowUpEditInputSchema`:**

Añadir: `difficulty: z.number().int().min(0).max(4).nullable().optional()`

Actualizar el `refine` para incluir `difficulty` en la comprobación "al menos un campo".

**Nuevo schema `habitWeekViewArgsSchema`:**
```typescript
z.object({
  habitId: habitIdString,
  weekStart: dateString,
}).refine(
  (d) => new Date(d.weekStart + 'T00:00:00Z').getUTCDay() === 1,
  { message: 'weekStart must be a Monday (ISO week start)' }
)
```

**Nuevo schema `habitCompleteArgSchema`:**
```typescript
z.object({ id: habitIdString })
```

### Cambios en `habit.schema.ts` (GraphQL)

**Nuevos enums:**
```graphql
enum HabitType { boolean count time }
enum HabitStatus { active completed archived }
enum HabitDayStatus { empty accomplished failed lifeline }
```

**Tipo `Habit`:**

Eliminar: `isCounter`, `isTimer`, `isIncremental`, `isDecremental`.

Añadir:
```graphql
habitType: HabitType!
periodDays: Int!
restartCount: Int!
weeklyLifelines: Int!
status: HabitStatus!
```

**Tipo `HabitFollowUp`:**

Añadir:
```graphql
difficulty: Int
isLifeline: Boolean!
```

**Tipo `HabitMyDayEntry`:**

Añadir:
```graphql
lifelinesUsedThisWeek: Int!
lifelinesRemaining: Int!
```

**Nuevos tipos:**
```graphql
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
```

**Query nueva:**
```graphql
habitWeekView(habitId: ID!, weekStart: String!): HabitWeekView!
```

**Mutación nueva:**
```graphql
habitComplete(id: ID!): Habit!
```

**Input `HabitInput`:**

Eliminar: `isCounter`, `isTimer`, `isIncremental`, `isDecremental`.

Añadir: `habitType: HabitType`, `weeklyLifelines: Int`.

**Input `HabitEditInput`:** mismos cambios que `HabitInput`.

**Input `HabitFollowUpAddInput`:** añadir `difficulty: Int`, `isLifeline: Boolean`.

**Input `HabitFollowUpEditInput`:** añadir `difficulty: Int`.

### Cambios en `habit.resolvers.ts`

**Nuevas importaciones:** `habitWeekViewArgsSchema`, `habitCompleteArgSchema`, y los nuevos nombres de schemas modificados.

**Nuevo resolver en `Query`:**
```typescript
habitWeekView: withValidatedResolver(
  habitWeekViewArgsSchema,
  async (_parent, { habitId, weekStart }, context) => {
    requireAuth(context, 'habitWeekView')
    return habitService.getHabitWeekView(habitId, weekStart, uid(context))
  },
  'habitWeekView'
)
```

**Nuevo resolver en `Mutation`:**
```typescript
habitComplete: withValidatedResolver(
  habitCompleteArgSchema,
  async (_parent, { id }, context) => {
    requireAuth(context, 'habitComplete')
    return habitService.completeHabit(id, uid(context))
  },
  'habitComplete'
)
```

**Actualizar `habitFollowUpAdd`:** extraer `isLifeline` y `difficulty` del input y pasarlos al servicio.

**Actualizar `habitFollowUpEdit`:** extraer `difficulty` y pasarlo al servicio.

Los field resolvers de `Habit` que referenciaban los 4 flags legacy se pueden eliminar (eran campos directos del objeto, no resolvers con lógica propia).

### Criterio de done

- `habitWeekView` query devuelve 7 entradas con status correcto para un hábito real.
- `habitComplete` cambia `status` a `'completed'` y el hábito desaparece de `habitMyDay`.
- `habitFollowUpAdd` con `isLifeline: true` para antes de ayer lanza `ConflictError`.
- `habitFollowUpAdd` con `isLifeline: true` para ayer funciona y extiende `end_date` en 1 día.
- `habitAdd` sin los campos legacy crea el hábito correctamente.
- La migración `041` se aplica sin errores en segundo paso post-deploy.

---

## Fase 4 — Frontend: Feature folder base

**Repo:** Frontend
**Dependencias:** Fase 3
**Riesgo:** Bajo

### Scope exacto

Scaffolding completo del feature folder `habits`. Tipos TypeScript, queries GraphQL, funciones de API, hooks de TanStack Query, rutas con stubs, utilidades de mapeo. Sin componentes reales aún — solo las bases para que las fases 5–8 construyan encima.

### Archivos a crear

```
src/features/habits/
├── index.ts
├── types/
│   └── habit.types.ts
├── graphql/
│   ├── habits.graphql.ts
│   └── habit-follow-ups.graphql.ts
├── api/
│   ├── habits.api.ts
│   └── habit-follow-ups.api.ts
├── hooks/
│   ├── useHabits.ts
│   └── useHabitFollowUps.ts
├── routes/
│   ├── habits-paths.ts
│   └── habits.routes.tsx
├── pages/
│   ├── HabitMyDayPage.tsx        (stub: retorna <div>My Day — coming soon</div>)
│   ├── HabitsListPage.tsx        (stub)
│   └── HabitDetailPage.tsx       (stub)
└── utils/
    ├── habit-type.utils.ts
    └── habit-difficulty.utils.ts
```

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/shared/api/query-keys.ts` | Extender `habitKeys` |
| `src/app/router/routes.tsx` | Importar y registrar `habitsRoutes` |

### Contenido de `habit.types.ts`

Espeja los tipos del backend. Define todas las interfaces y tipos que las fases siguientes necesitarán:

- `HabitType = 'boolean' | 'count' | 'time'`
- `HabitStatus = 'active' | 'completed' | 'archived'`
- `HabitDayStatus = 'empty' | 'accomplished' | 'failed' | 'lifeline'`
- `Habit` — todos los campos del tipo GraphQL Habit (incluyendo los nuevos de Fase 3, excluyendo flags legacy). Campo `category?: HabitCategory | null`, `measure?: HabitMeasure | null` opcionales.
- `HabitFollowUp` — todos los campos de HabitFollowUp más `difficulty: number | null`, `isLifeline: boolean`.
- `HabitCollection = { habits: Habit[]; page: number; limit: number; total: number }`
- `HabitMyDayEntry = { habit: Habit; followUp: HabitFollowUp | null; lifelinesUsedThisWeek: number; lifelinesRemaining: number }`
- `HabitDayEntry = { date: string; status: HabitDayStatus; followUp: HabitFollowUp | null }`
- `HabitWeekView = { habit: Habit; days: HabitDayEntry[]; lifelinesRemaining: number }`
- `HabitInput` — campos para crear hábito (sin flags legacy, con `habitType`, `weeklyLifelines`)
- `HabitEditInput` — campos para editar, más `id: string`
- `HabitFollowUpAddInput = { habitId: string; date?: string; count?: number; time?: number; notes?: string | null; story?: string | null; isAccomplished?: boolean; isFailed?: boolean; isLifeline?: boolean; difficulty?: number | null }`
- `HabitFollowUpEditInput = { id: string; count?: number; time?: number; notes?: string | null; story?: string | null; isAccomplished?: boolean; isFailed?: boolean; archived?: boolean; difficulty?: number | null }`
- `HabitFilters = { isActive?: boolean; status?: HabitStatus; categoryId?: string; page?: number; limit?: number }`

### Contenido de `habits.graphql.ts`

Definir los siguientes query strings. Para la selección de campos de `Habit`, incluir siempre: `id, userId, name, description, habitType, periodDays, restartCount, weeklyLifelines, status, shouldAvoid, shouldKeep, streak, maxStreak, days, dailyGoal, timerGoal, timesGoal, icon, color, orderIndex, startDate, endDate, categoryId, measureId, createdAt, updatedAt`.

- `HABIT_MY_DAY_QUERY`: query `habitMyDay(date: $date)` devolviendo array de `HabitMyDayEntry` con campos completos de `habit`, `followUp { id, date, count, time, notes, story, isAccomplished, isFailed, isLifeline, difficulty, archived }`, `lifelinesUsedThisWeek`, `lifelinesRemaining`.

- `HABITS_QUERY`: query `habits(isActive, status, categoryId, page, limit)` devolviendo `HabitCollection { habits { ... }, page, limit, total }`.

- `HABIT_QUERY`: query `habit(id)` con todos los campos del Habit más `category { id, name, icon, color }`.

- `HABIT_WEEK_VIEW_QUERY`: query `habitWeekView(habitId: $habitId, weekStart: $weekStart)` devolviendo `{ habit { ... }, days { date, status, followUp { id, date, isAccomplished, isFailed, isLifeline, difficulty } }, lifelinesRemaining }`.

- `HABIT_FOLLOW_UPS_IN_DATES_QUERY`: query `habitFollowUpsInDates(from: $from, to: $to)` devolviendo `[{ date, followUps { id, date, habitId, isAccomplished, isFailed, isLifeline, difficulty, count, time } }]`.

- `HABIT_CATEGORIES_QUERY`: query `habitCategories` devolviendo `[{ id, name, icon, color, orderIndex }]`.

- `HABIT_ADD_MUTATION`: mutación `habitAdd(input: $input)` devolviendo campos core del Habit.

- `HABIT_EDIT_MUTATION`: mutación `habitEdit(input: $input)` devolviendo campos core.

- `HABIT_REMOVE_MUTATION`: mutación `habitRemove(id: $id)` devolviendo `Boolean`.

- `HABIT_COMPLETE_MUTATION`: mutación `habitComplete(id: $id)` devolviendo `{ id, status, isActive }`.

### Contenido de `habit-follow-ups.graphql.ts`

- `HABIT_FOLLOW_UP_ADD_MUTATION`: mutación `habitFollowUpAdd(input: $input)` devolviendo el `HabitFollowUp` completo con `id, date, habitId, isAccomplished, isFailed, isLifeline, difficulty, count, time, notes, story, archived`.

- `HABIT_FOLLOW_UP_EDIT_MUTATION`: mutación `habitFollowUpEdit(input: $input)` devolviendo el mismo conjunto de campos.

- `HABIT_FOLLOW_UP_REMOVE_MUTATION`: mutación `habitFollowUpRemove(id: $id)` devolviendo `Boolean`.

### Contenido de `habits.api.ts`

Funciones con el mismo patrón de `activities.api.ts` (usar `graphqlRequest`):

- `getHabitMyDay(date: string): Promise<HabitMyDayEntry[]>`
- `getHabits(filters: HabitFilters): Promise<HabitCollection>`
- `getHabit(id: string): Promise<Habit | null>`
- `getHabitWeekView(habitId: string, weekStart: string): Promise<HabitWeekView>`
- `getHabitFollowUpsInDates(from: string, to: string): Promise<HabitFollowUpsDateGroup[]>`
- `getHabitCategories(): Promise<HabitCategory[]>`
- `createHabit(input: HabitInput): Promise<Habit>`
- `updateHabit(input: HabitEditInput): Promise<Habit>`
- `removeHabit(id: string): Promise<boolean>`
- `completeHabit(id: string): Promise<Habit>`

### Contenido de `habit-follow-ups.api.ts`

- `addHabitFollowUp(input: HabitFollowUpAddInput): Promise<HabitFollowUp>`
- `updateHabitFollowUp(input: HabitFollowUpEditInput): Promise<HabitFollowUp>`
- `removeHabitFollowUp(id: string): Promise<boolean>`

### Contenido de `useHabits.ts`

Patrón idéntico a `useActivities.ts`:

- `useHabitMyDayQuery(date: string)` — queryKey: `habitKeys.myDay(date)`, staleTime: 30s
- `useHabitsQuery(filters: HabitFilters)` — queryKey: `habitKeys.list(filters)`, staleTime: 30s
- `useHabitQuery(id: string | undefined)` — queryKey: `habitKeys.detail(id ?? '')`, enabled: `Boolean(id)`
- `useHabitWeekViewQuery(habitId: string | undefined, weekStart: string | undefined)` — queryKey: `habitKeys.weekView(habitId, weekStart)`, enabled: `Boolean(habitId) && Boolean(weekStart)`
- `useHabitFollowUpsInDatesQuery(from: string, to: string)` — queryKey: `habitKeys.calendar(from, to)`
- `useHabitCategoriesQuery()` — queryKey: `habitKeys.categories.list()`
- `useCreateHabitMutation()` — onSuccess: invalidar `habitKeys.all`, toast "Hábito creado"
- `useUpdateHabitMutation()` — onSuccess: invalidar `habitKeys.all` + `habitKeys.detail(id)`, toast "Hábito actualizado"
- `useDeleteHabitMutation()` — onSuccess: invalidar `habitKeys.all`, toast "Hábito eliminado"
- `useCompleteHabitMutation()` — onSuccess: invalidar `habitKeys.all` + `habitKeys.myDay(today)`, toast "¡Hábito completado!"

### Contenido de `useHabitFollowUps.ts`

- `useAddHabitFollowUpMutation()` — onSuccess: invalidar `habitKeys.myDay(date)` + `habitKeys.detail(habitId)` + `habitKeys.weekView(habitId, weekStart)`
- `useUpdateHabitFollowUpMutation()` — mismas invalidaciones
- `useRemoveHabitFollowUpMutation()` — mismas invalidaciones

### Cambios en `query-keys.ts`

El objeto `habitKeys` ya existe con `all`, `list`, `detail`, `myDay`. Extenderlo:

```typescript
habitKeys.weekView = (habitId: string, weekStart: string) =>
  [...habitKeys.all, 'weekView', habitId, weekStart] as const

habitKeys.calendar = (from: string, to: string) =>
  [...habitKeys.all, 'calendar', from, to] as const

habitKeys.categories = {
  all: () => [...habitKeys.all, 'categories'] as const,
  list: () => [...habitKeys.categories.all(), 'list'] as const,
}
```

### Contenido de `habits-paths.ts`

```typescript
export const habitsPaths = {
  root: '/app/habits',
  myDay: '/app/habits/my-day',
  list: '/app/habits/list',
  detail: (id: string) => `/app/habits/${id}`,
  edit: (id: string) => `/app/habits/${id}/edit`,
  week: (id: string) => `/app/habits/${id}/week`,
  calendar: (id: string) => `/app/habits/${id}/calendar`,
} as const
```

### Contenido de `habits.routes.tsx`

```
path: 'habits'
  element: <HabitsModuleLayout />   (stub en Fase 4, implementado en Fase 5)
  children:
    index           → <HabitMyDayPage />
    'my-day'        → <HabitMyDayPage />
    'list'          → <HabitsListPage />
    ':id/edit'      → <HabitFormPage />   (stub hasta Fase 8)
    ':id/week'      → <HabitWeekViewPage /> (stub hasta Fase 6)
    ':id/calendar'  → <HabitCalendarPage /> (stub hasta Fase 7)
    ':id'           → <HabitDetailPage />
```

Exportar `habitsRoutes` y `habitsPaths`.

### Cambios en `routes.tsx`

Añadir junto a los otros features:
```typescript
import { habitsRoutes } from '@/features/habits'
// ...
// dentro de VerifyAccountGuard children:
habitsRoutes,
```

### Contenido de `index.ts` (barrel)

```typescript
export { habitsPaths } from './routes/habits-paths'
export { habitsRoutes } from './routes/habits.routes'
export type { Habit, HabitFollowUp, HabitType, HabitStatus, HabitDayStatus } from './types/habit.types'
```

### Contenido de `habit-type.utils.ts`

```typescript
export const HABIT_TYPE_LABELS: Record<HabitType, string> = {
  boolean: 'Sí / No',
  count: 'Contador',
  time: 'Tiempo',
}

// Usar el nombre del icono que corresponda a la librería de iconos del proyecto
export const HABIT_TYPE_ICONS: Record<HabitType, string> = {
  boolean: 'check-circle',
  count: 'hash',
  time: 'clock',
}

export function getHabitTypeLabel(type: HabitType): string {
  return HABIT_TYPE_LABELS[type]
}
```

### Contenido de `habit-difficulty.utils.ts`

```typescript
export const DIFFICULTY_EMOJIS: Record<number, string> = {
  0: '😊',
  1: '🙂',
  2: '😐',
  3: '😓',
  4: '💀',
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  0: 'Muy fácil',
  1: 'Fácil',
  2: 'Normal',
  3: 'Difícil',
  4: 'Extremo',
}

export function getDifficultyEmoji(difficulty: number | null): string {
  if (difficulty === null) return '—'
  return DIFFICULTY_EMOJIS[difficulty] ?? '—'
}
```

### Criterio de done

- TypeScript compila sin errores.
- Las rutas `/app/habits/*` están registradas y navegables (muestran los stubs sin romper otros features).
- `useHabitMyDayQuery(today)` retorna datos reales desde el backend en sesión autenticada.

---

## Fase 5 — Frontend: Vista diaria (Mi día)

**Repo:** Frontend
**Dependencias:** Fase 4
**Riesgo:** Bajo

### Scope exacto

Vista principal de uso diario. Lista de hábitos activos con su estado del día. Permite registrar follow-ups (logro o falla), usar lifelines, ver el estado visual de la racha.

### Archivos a crear

```
src/features/habits/
├── components/
│   ├── HabitsModuleLayout/
│   │   ├── HabitsModuleLayout.tsx
│   │   ├── HabitsModuleLayout.module.scss
│   │   └── index.ts
│   ├── HabitDayCard/
│   │   ├── HabitDayCard.tsx
│   │   ├── HabitDayCard.module.scss
│   │   └── index.ts
│   ├── HabitFollowUpForm/
│   │   ├── HabitFollowUpForm.tsx
│   │   ├── HabitFollowUpForm.module.scss
│   │   └── index.ts
│   ├── HabitStreakBadge/
│   │   ├── HabitStreakBadge.tsx
│   │   ├── HabitStreakBadge.module.scss
│   │   └── index.ts
│   ├── HabitLifelineButton/
│   │   ├── HabitLifelineButton.tsx
│   │   ├── HabitLifelineButton.module.scss
│   │   └── index.ts
│   └── HabitDifficultyPicker/
│       ├── HabitDifficultyPicker.tsx
│       ├── HabitDifficultyPicker.module.scss
│       └── index.ts
└── pages/
    ├── HabitMyDayPage.tsx      (reemplaza el stub de Fase 4)
    └── HabitMyDayPage.module.scss
```

### Descripción de cada componente

**`HabitsModuleLayout`:**

Wrapper de todas las rutas de hábitos. Análogo a `ActivitiesModuleLayout`. Renderiza nav con links a "Mi Día" (`habitsPaths.myDay`) y "Mis Hábitos" (`habitsPaths.list`). Usa `<Outlet />` para el contenido hijo.

**`HabitMyDayPage`:**

- Calcula `today = new Date().toISOString().split('T')[0]`.
- Llama a `useHabitMyDayQuery(today)`.
- Renderiza un `HabitDayCard` por cada `HabitMyDayEntry`.
- Muestra empty state si no hay hábitos activos.

**`HabitDayCard`:**

Props: `entry: HabitMyDayEntry`.

Lógica de display:
- Si `followUp` es null: botón "Registrar" que abre `HabitFollowUpForm`.
- Si `followUp.isLifeline = true`: badge "Salvavidas" en color neutro (no verde ni rojo).
- Si `followUp.isFailed = true`: badge "Fallido" en rojo.
- Si `followUp.isAccomplished = true`: badge "Logrado" en verde + valor registrado si es count o time.
- Siempre muestra `HabitStreakBadge` con `entry.habit.streak`.
- Si `entry.habit.weeklyLifelines > 0` y no hay follow-up aún (o el existente es accomplished pero no lifeline): mostrar `HabitLifelineButton` con `entry.lifelinesRemaining`.
- Si `entry.habit.periodDays > 0`: barra de progreso `habit.streak / habit.periodDays` con label "N/M días".

**`HabitFollowUpForm`:**

Props: `habit: Habit`, `date: string`, `existingFollowUp?: HabitFollowUp`, `onSuccess?: () => void`.

Campos condicionales según `habit.habitType`:
- `'boolean'`: solo botones "Logrado" y "Fallido". Sin campo de valor.
- `'count'`: input numérico para count (label: `habit.measure?.name ?? 'veces'`). Más botón "Fallido".
- `'time'`: input numérico para tiempo en minutos. Más botón "Fallido".

Si existe `existingFollowUp`, precargar el valor actual.

Campos compartidos en todos los tipos:
- `HabitDifficultyPicker` (opcional, sin bloquear envío).
- Textarea para `notes` (opcional).

Al enviar logro: llamar `useAddHabitFollowUpMutation()` con `{ habitId: habit.id, date, count/time, difficulty, isAccomplished: true }`.

Al enviar falla: mostrar diálogo de confirmación. En confirmación: llamar con `{ habitId: habit.id, date, isFailed: true, difficulty }`.

**`HabitStreakBadge`:**

Props: `streak: number`.

Mostrar icono + número. Si `streak === 0`: mostrar "Sin racha" en gris. Si `streak > 0`: mostrar "🔥 N días" (o el icono de la librería del proyecto).

**`HabitLifelineButton`:**

Props: `habitId: string`, `date: string`, `lifelinesRemaining: number`.

Si `lifelinesRemaining === 0`: botón deshabilitado, tooltip "Sin salvavidas esta semana".

Al hacer click: diálogo de confirmación "¿Usar un salvavidas para hoy? Te quedan N esta semana."

En confirmación: llamar `useAddHabitFollowUpMutation()` con `{ habitId, date, isLifeline: true }`.

**`HabitDifficultyPicker`:**

Props: `value: number | null`, `onChange: (v: number | null) => void`.

5 botones (0–4) con el emoji de `DIFFICULTY_EMOJIS`. Botón activo resaltado. Click en el activo = deseleccionar (vuelve a null).

### Criterio de done

- `/app/habits/my-day` muestra los hábitos activos.
- Registrar un logro de tipo count actualiza la card y el streak en UI.
- Usar un lifeline extiende el `end_date` del hábito (verificable en la DB).
- Registrar una falla muestra badge "Fallido" y `streak = 0` en UI.

---

## Fase 6 — Frontend: Vista semanal

**Repo:** Frontend
**Dependencias:** Fase 5
**Riesgo:** Bajo

### Scope exacto

Vista semana a semana de un hábito. Grilla de 7 celdas (lun–dom) con estado visual por celda. Navegación prev/next semana. Permite registrar/editar el follow-up de días editables (hoy o ayer).

### Archivos a crear

```
src/features/habits/
├── components/
│   ├── HabitWeekGrid/
│   │   ├── HabitWeekGrid.tsx
│   │   ├── HabitWeekGrid.module.scss
│   │   └── index.ts
│   ├── HabitDayCell/
│   │   ├── HabitDayCell.tsx
│   │   ├── HabitDayCell.module.scss
│   │   └── index.ts
│   ├── HabitWeekNav/
│   │   ├── HabitWeekNav.tsx
│   │   ├── HabitWeekNav.module.scss
│   │   └── index.ts
│   └── HabitLifelinesIndicator/
│       ├── HabitLifelinesIndicator.tsx
│       ├── HabitLifelinesIndicator.module.scss
│       └── index.ts
└── pages/
    ├── HabitWeekViewPage.tsx      (reemplaza stub)
    └── HabitWeekViewPage.module.scss
```

### Descripción de cada componente

**`HabitWeekViewPage`:**

- `habitId` desde `useParams()`.
- Estado local `weekStart: string`, inicializado como el lunes de la semana actual.

Cálculo del lunes actual (puro JS, sin librería):
```
const today = new Date()
const dayOfWeek = today.getUTCDay()               // 0=domingo, 1=lunes...
const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
const monday = new Date(today)
monday.setUTCDate(today.getUTCDate() - daysFromMonday)
weekStart = monday.toISOString().split('T')[0]
```

- Llama a `useHabitWeekViewQuery(habitId, weekStart)`.
- Renderiza: header con nombre del hábito, `HabitWeekNav`, `HabitLifelinesIndicator`, `HabitWeekGrid`.

Handlers:
- `onPrev`: `weekStart = addDaysToString(weekStart, -7)` (función util en `habit-type.utils.ts` o similar).
- `onNext`: `weekStart = addDaysToString(weekStart, 7)`. Deshabilitado si `weekStart >= startOfCurrentWeek`.

**`HabitWeekNav`:**

Props: `weekStart: string`, `onPrev: () => void`, `onNext: () => void`, `disableNext: boolean`.

Muestra el rango de la semana como "2 jun – 8 jun 2026". Botones `<` y `>`. El `>` se muestra deshabilitado si `disableNext`.

**`HabitWeekGrid`:**

Props: `days: HabitDayEntry[]`, `habit: Habit`, `lifelinesRemaining: number`.

Renderiza 7 `HabitDayCell` en orden. Los `days` del backend ya vienen ordenados lun–dom.

**`HabitDayCell`:**

Props: `entry: HabitDayEntry`, `habit: Habit`, `lifelinesRemaining: number`.

Editabilidad: `const today = getTodayString(); const yesterday = getYesterdayString(); const isEditable = entry.date === today || entry.date === yesterday`.

Clases CSS según `entry.status`:
- `empty` — gris claro
- `accomplished` — verde
- `failed` — rojo
- `lifeline` — azul claro o amarillo (neutro)

Contenido de la celda:
- Label del día de semana corto (L, M, X, J, V, S, D) + número del día del mes.
- Icono pequeño del status si no es `empty`.

Si `isEditable`: al hacer click, abrir `HabitFollowUpForm` con `date = entry.date` y `existingFollowUp = entry.followUp ?? undefined`.

**`HabitLifelinesIndicator`:**

Props: `used: number`, `total: number`.

Si `total === 0`: no renderizar nada.

Si `total > 0`: mostrar "Salvavidas: N/M esta semana". Donde `used = total - lifelinesRemaining` (calcular en el componente padre).

### Criterio de done

- `/app/habits/:id/week` muestra la grilla de 7 días con colores correctos.
- Navegación prev semana muestra datos históricos correctos.
- Hacer click en hoy abre el formulario y al guardar actualiza la celda.
- El contador de lifelines es correcto.

---

## Fase 7 — Frontend: Calendario de progreso

**Repo:** Frontend
**Dependencias:** Fase 4 (no requiere Fases 5 ni 6)
**Riesgo:** Bajo

### Scope exacto

Vista de calendario estilo GitHub contributions desde `start_date` hasta hoy (o `end_date` si es pasado). Solo lectura. Usa la query existente `habitFollowUpsInDates` del backend.

### Archivos a crear

```
src/features/habits/
├── components/
│   ├── HabitContributionGrid/
│   │   ├── HabitContributionGrid.tsx
│   │   ├── HabitContributionGrid.module.scss
│   │   └── index.ts
│   └── HabitCalendarLegend/
│       ├── HabitCalendarLegend.tsx
│       ├── HabitCalendarLegend.module.scss
│       └── index.ts
└── pages/
    ├── HabitCalendarPage.tsx      (reemplaza stub)
    └── HabitCalendarPage.module.scss
```

### Descripción de cada componente

**`HabitCalendarPage`:**

- `habitId` desde `useParams()`.
- Llama `useHabitQuery(habitId)` para obtener `startDate`, `endDate`, `habitType`, `dailyGoal`, `timerGoal`.
- Si no hay `startDate`: mostrar mensaje "Este hábito no tiene fecha de inicio".
- `rangeEnd = endDate && endDate < today ? endDate : today`.
- Llama `useHabitFollowUpsInDatesQuery(startDate, rangeEnd)`.
- Construye `Map<string, HabitFollowUp>` indexado por `date` para O(1) lookup por celda.
- Renderiza `HabitContributionGrid` y `HabitCalendarLegend`.

**`HabitContributionGrid`:**

Props: `startDate: string`, `endDate: string`, `followUpByDate: Map<string, HabitFollowUp>`, `habit: Habit`.

Lógica:
1. Generar todos los días del rango (fecha por fecha).
2. Agrupar en semanas (arrays de 7), comenzando en el lunes de la semana del `startDate`.
3. Renderizar semanas como columnas, días como filas (layout tipo GitHub).

Para cada celda, determinar la clase de color:
- Sin log → `cell--empty` (gris claro)
- `is_lifeline = true` → `cell--lifeline` (azul claro)
- `is_failed = true` → `cell--failed` (rojo)
- `is_accomplished = true`:
  - Para `habit_type = 'boolean'`: `cell--accomplished-full`
  - Para `habit_type = 'count'`: calcular porcentaje `followUp.count / habit.dailyGoal`:
    - < 50% → `cell--accomplished-low`
    - 50–99% → `cell--accomplished-mid`
    - ≥ 100% → `cell--accomplished-full`
  - Para `habit_type = 'time'`: mismo cálculo con `followUp.time / habit.timerGoal`

**`HabitCalendarLegend`:**

Props: `habitType: HabitType`.

Renderiza 4–5 swatches con labels: "Sin registro", "Logrado parcial" (solo si count o time), "Logrado", "Fallido", "Salvavidas". Los swatches usan las mismas clases CSS del grid.

### Criterio de done

- `/app/habits/:id/calendar` muestra el grid desde `start_date` hasta hoy.
- Los días con log muestran el color correcto.
- Los días futuros dentro del período no aparecen en el grid.

---

## Fase 8 — Frontend: CRUD de hábitos

**Repo:** Frontend
**Dependencias:** Fases 5 y 6
**Riesgo:** Medio (formulario más complejo del módulo)

### Scope exacto

Lista de hábitos agrupada por categoría, formulario de creación/edición, página de detalle con stats y tabs, flujo de completado/archivado.

### Archivos a crear

```
src/features/habits/
├── components/
│   ├── HabitCard/
│   │   ├── HabitCard.tsx
│   │   ├── HabitCard.module.scss
│   │   └── index.ts
│   ├── HabitFormModal/
│   │   ├── HabitFormModal.tsx
│   │   ├── HabitFormModal.module.scss
│   │   └── index.ts
│   ├── HabitStatsBanner/
│   │   ├── HabitStatsBanner.tsx
│   │   ├── HabitStatsBanner.module.scss
│   │   └── index.ts
│   ├── HabitStatusBadge/
│   │   ├── HabitStatusBadge.tsx
│   │   ├── HabitStatusBadge.module.scss
│   │   └── index.ts
│   ├── HabitTypeBadge/
│   │   ├── HabitTypeBadge.tsx
│   │   └── index.ts
│   └── HabitPeriodProgress/
│       ├── HabitPeriodProgress.tsx
│       ├── HabitPeriodProgress.module.scss
│       └── index.ts
└── pages/
    ├── HabitsListPage.tsx         (reemplaza stub)
    ├── HabitsListPage.module.scss
    ├── HabitDetailPage.tsx        (reemplaza stub)
    ├── HabitDetailPage.module.scss
    ├── HabitFormPage.tsx          (nuevo — wrapper de ruta para el modal)
    └── HabitFormPage.module.scss
utils/
  └── habit-form.utils.ts          (nuevo)
```

### Descripción de cada componente

**`HabitsListPage`:**

- Llama `useHabitsQuery({ status: 'active' })` y `useHabitCategoriesQuery()`.
- Agrupa hábitos por `categoryId` en cliente: `Map<string | null, Habit[]>`.
- Renderiza un grupo por categoría: header con nombre de categoría + array de `HabitCard`.
- Botón "+" o "Nuevo hábito" que abre `HabitFormModal` en modo `'create'`.

**`HabitCard`:**

Props: `habit: Habit`.

Contenido:
- Icono + nombre del hábito. Borde o acento de color con `habit.color`.
- `HabitTypeBadge` con `habit.habitType`.
- `HabitStatusBadge` con `habit.status`.
- `HabitStreakBadge` con `habit.streak`.
- `HabitPeriodProgress` con `streak={habit.streak}` y `periodDays={habit.periodDays}`.
- Menú contextual (tres puntos / kebab menu):
  - "Ver detalle" → navegar a `habitsPaths.detail(habit.id)`.
  - "Editar" → abrir `HabitFormModal` en modo `'edit'` con `habit` como prop.
  - "Completar" → diálogo de confirmación, luego `useCompleteHabitMutation()`.
  - "Archivar" → `useUpdateHabitMutation()` con `{ id: habit.id, status: 'archived' }`.

**`HabitFormModal`:**

Props: `mode: 'create' | 'edit'`, `habit?: Habit`, `onClose: () => void`.

Determinar si el hábito tiene follow-ups: en modo `'edit'`, si `habit.days > 0` las fechas están bloqueadas.

Campos del formulario:
1. `name` (texto, obligatorio)
2. `description` (textarea, opcional)
3. `habitType` (select: "Sí/No" | "Contador" | "Tiempo") — deshabilitado en modo edit si tiene follow-ups
4. `shouldAvoid` (toggle "Es algo a evitar")
5. `icon` (picker de icono)
6. `color` (picker de color)
7. `categoryId` (select cargado con `useHabitCategoriesQuery()`)
8. `measureId` (select de medidas, visible solo si `habitType !== 'boolean'`)
9. `weeklyLifelines` (number input, "Salvavidas por semana", min 0)
10. `startDate` (date picker, deshabilitado en edit si tiene follow-ups)
11. `endDate` (date picker, deshabilitado en edit si tiene follow-ups)
12. `dailyGoal` (visible si `habitType === 'count'`, label según medida)
13. `timerGoal` (visible si `habitType === 'time'`, en minutos)

Si tiene follow-ups y mode es edit: mostrar aviso "Las fechas y el tipo no se pueden modificar porque ya hay registros".

La lógica de construcción del payload (desde valores del form a `HabitInput` / `HabitEditInput`) va en `habit-form.utils.ts` — separada del componente para facilitar testing.

En creación: `useCreateHabitMutation().mutate(payload)`.
En edición: `useUpdateHabitMutation().mutate({ id: habit.id, ...payload })`.

**`HabitDetailPage`:**

- `habitId` desde `useParams()`.
- Llama `useHabitQuery(habitId)`.
- Header: nombre + `HabitStatusBadge` + `HabitTypeBadge` + botón "Editar" que abre `HabitFormModal`.
- `HabitStatsBanner` con el hábito.
- Tabs (usando el sistema de tabs del proyecto):
  - Tab "Esta semana": embebe `HabitWeekGrid` con datos de `useHabitWeekViewQuery(habitId, thisWeekStart)`.
  - Tab "Historial completo": embebe `HabitContributionGrid`.

**`HabitStatsBanner`:**

Props: `habit: Habit`.

4 métricas en cards horizontales:
1. "Racha actual": `habit.streak` días
2. "Racha máxima": `habit.maxStreak` días
3. "Reinicios": `habit.restartCount`
4. "Progreso": `Math.round(habit.streak / habit.periodDays * 100)`% (solo si `periodDays > 0`)

**`HabitStatusBadge`:**

Props: `status: HabitStatus`.

Chip de color: `active` → verde, `completed` → dorado/azul, `archived` → gris.

**`HabitTypeBadge`:**

Props: `habitType: HabitType`.

Chip con label de `HABIT_TYPE_LABELS[habitType]`.

**`HabitPeriodProgress`:**

Props: `streak: number`, `periodDays: number`.

Si `periodDays === 0`: no renderizar.

Si `periodDays > 0`: barra de progreso `Math.min(streak / periodDays, 1) * 100`% + label "N/M días".

**`habit-form.utils.ts`:**

Función `buildHabitCreatePayload(formValues): HabitInput` — transforma los valores del form en el input para la mutación, incluyendo nulls explícitos para campos opcionales no completados.

Función `buildHabitEditPayload(formValues, habit: Habit): HabitEditInput` — solo incluye los campos que cambiaron vs. el hábito original.

### Criterio de done

- Crear un hábito de tipo "count" con fechas, categoría y 2 lifelines funciona end-to-end.
- Editar el nombre de un hábito con follow-ups funciona. Las fechas aparecen deshabilitadas.
- `HabitDetailPage` muestra `streak` y `maxStreak` actualizados después de registrar follow-ups.
- Completar un hábito cambia su status y desaparece de "Mi Día".
- Archivar un hábito lo elimina de la lista activa.

---

## Fase 9 — Frontend: Gestión de categorías de hábitos

**Repo:** Frontend
**Dependencias:** Fase 4
**Riesgo:** Bajo (backend completamente listo; patrón idéntico al módulo de actividades)

### Backend GraphQL ya disponible

Las siguientes operaciones ya existen en el backend y no requieren cambios:

- `habitCategoryAdd(input: HabitCategoryInput!): HabitCategory!`  
  Campos input: `name` (obligatorio), `description`, `icon`, `color`, `orderIndex`
- `habitCategoryEdit(input: HabitCategoryEditInput!): HabitCategory!`  
  Campos input: `id` (obligatorio) + mismos opcionales
- `habitCategoryRemove(id: ID!): Boolean!`
- `habitCategory(id: ID!): HabitCategory` (query individual — también nuevo en el frontend)

### Archivos a crear

```
src/features/habits/
├── graphql/
│   └── habit-categories.graphql.ts        (nuevo)
├── api/
│   └── habit-categories.api.ts            (nuevo)
├── hooks/
│   └── useHabitCategories.ts              (nuevo)
├── types/
│   └── habit-category.types.ts            (nuevo)
├── utils/
│   └── habit-category-form.utils.ts       (nuevo)
├── components/
│   └── HabitCategoryForm/
│       ├── HabitCategoryForm.tsx
│       ├── HabitCategoryForm.module.scss
│       └── index.ts
└── pages/
    ├── HabitCategoriesPage.tsx            (nuevo)
    └── HabitCategoriesPage.module.scss
```

### Archivos a modificar

- `src/shared/api/query-keys.ts` — añadir `habitKeys.categories.detail(id)`.
- `src/features/habits/routes/habits-paths.ts` — añadir `categories: '/app/habits/categories'`.
- `src/features/habits/routes/habits.routes.tsx` — añadir ruta `categories` → `<HabitCategoriesPage />`.

### Descripción de cada pieza

**`habit-category.types.ts`:**

```ts
export interface HabitCategoryInput {
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
}

export interface HabitCategoryEditInput extends HabitCategoryInput {
  id: string
}

export interface HabitCategoryFormValues {
  name: string
  description: string
  icon: string | null
  color: string | null
  orderIndex: string
}
```

**`habit-categories.graphql.ts`:** Exportar `HABIT_CATEGORY_QUERY`, `HABIT_CATEGORY_ADD_MUTATION`, `HABIT_CATEGORY_EDIT_MUTATION`, `HABIT_CATEGORY_REMOVE_MUTATION`.

**`habit-categories.api.ts`:** `createHabitCategory`, `updateHabitCategory`, `removeHabitCategory`, `getHabitCategory`.

**`useHabitCategories.ts`:**
- Reusar el patrón de `useHabits.ts`.
- Exportar: `useCreateHabitCategoryMutation()`, `useUpdateHabitCategoryMutation()`, `useRemoveHabitCategoryMutation()`.
- Cada mutación invalida `habitKeys.categories.list()`.
- `useHabitCategoriesQuery()` **ya existe** en `useHabits.ts`; no duplicarla, re-exportarla desde aquí si es necesario o simplemente importarla desde donde ya está.

**`habit-category-form.utils.ts`:**
- `defaultCategoryFormValues(category?: HabitCategory): HabitCategoryFormValues`
- `buildCategoryCreatePayload(values): HabitCategoryInput`
- `buildCategoryEditPayload(values, category): HabitCategoryEditInput`

**`HabitCategoryForm`:**
Props: `values`, `onChange`, `onSubmit`, `onCancel`, `submitLabel`, `loading?`.
Campos (seguir el patrón de `ActivityCategoryForm`):
1. `name` (Input, obligatorio)
2. `description` (Textarea, opcional)
3. `icon` (IconPicker, clearable)
4. `color` (input type=color + Input de texto)
5. `orderIndex` (Input type=number, min 0)

**`HabitCategoriesPage`:**
- Llama `useHabitCategoriesQuery()`.
- Lista las categorías ordenadas por `orderIndex` ascendente.
- Cada fila muestra: swatch de color, icono, nombre, acciones.
- Botón "Nueva categoría" → abre `Modal` (no SteppedModal) con `HabitCategoryForm` en modo create.
- Acción "Editar" → abre el mismo `Modal` en modo edit con la categoría seleccionada.
- Acción "Eliminar" → `useConfirmDialog` → `useRemoveHabitCategoryMutation`.
- Si no hay categorías: `<EmptyState>`.

### Criterio de done

- Crear una categoría con nombre, icono y color aparece inmediatamente en la lista y en el selector de `HabitFormModal`.
- Editar el nombre o color de una categoría se refleja en tiempo real.
- Eliminar una categoría que ya tiene hábitos: el backend debería devolver error; mostrarlo como toast.

---

## Fase 10 — Frontend: HabitFormModal multi-paso (SteppedModal)

**Repo:** Frontend
**Dependencias:** Fase 8, Fase 9
**Riesgo:** Medio (refactor del componente más usado del módulo; mismo patrón que `StartActivityModal`)

### Qué cambia

`HabitFormModal` actual usa `Modal` plano con scroll largo. Se reemplaza por `SteppedModal` con 3 pasos. El Paso 2 permite crear una categoría nueva inline (empujando un paso extra al stack), igual que `StartActivityModal` hace con `CreateActivityStep`.

### Archivos a crear

```
src/features/habits/components/
└── CreateHabitCategoryStep/
    ├── CreateHabitCategoryStep.tsx    (nuevo)
    └── index.ts                       (nuevo)
```

### Archivos a modificar

```
src/features/habits/components/HabitFormModal/
├── HabitFormModal.tsx          (reemplazar implementación)
└── HabitFormModal.module.scss  (actualizar estilos)
```

### Pasos del formulario

**Paso 1 — Básicos**  
Título del paso: `"Datos básicos"` / description: `"Nombre y tipo del hábito."`

Campos:
- `name` (Input, obligatorio, autoFocus)
- `description` (Textarea, opcional)
- `habitType` (Select: "Sí/No" | "Contador" | "Tiempo") — deshabilitado en edit si `habit.days > 0`
- `shouldAvoid` (Switch "Es algo a evitar")

Footer del paso: botón "Cancelar" (ghost) + botón "Siguiente →".

**Paso 2 — Apariencia y organización**  
Título: `"Apariencia"` / description: `"Personaliza el aspecto y categoría."`

Campos:
- `icon` (IconPicker, clearable)
- `color` (input type=color + Input de texto)
- `categoryId` (Select con opción "Sin categoría" + botón "+ Nueva categoría" que hace `push` a `CreateHabitCategoryStep`)
- `measureId` (Select de medidas, visible solo si `habitType !== 'boolean'` — por ahora un Input de texto con el ID, igual que en la Fase 8 hasta que exista picker de medidas)

Footer: "← Anterior" (ghost) + "Siguiente →".

**Paso 3 — Fechas y metas**  
Título: `"Configuración"` / description: `"Define fechas, salvavidas y meta diaria."`

Campos:
- `weeklyLifelines` (Input number, min 0)
- `startDate` (Input date, deshabilitado en edit si `habit.days > 0`)
- `endDate` (Input date, deshabilitado en edit si `habit.days > 0`)
- `dailyGoal` (Input number, visible solo si `habitType === 'count'`, label "Meta diaria (veces)")
- `timerGoal` (Input number, visible solo si `habitType === 'time'`, label "Meta diaria (minutos)")
- Aviso de bloqueo si `hasFollowUps` (igual que antes)

Footer: "← Anterior" (ghost) + botón submit ("Crear hábito" / "Guardar cambios").

### `CreateHabitCategoryStep`

Patrón idéntico a `CreateActivityStep` en el módulo de actividades.

```tsx
type Props = { onCreated: (categoryId: string) => void }

export function CreateHabitCategoryStep({ onCreated }: Props) {
  const { pop } = useModalStep()
  // Campos: name (obligatorio), icon (IconPicker), color (input type=color + text)
  // Al crear con éxito: onCreated(category.id) → pop()
}
```

Usa `useCreateHabitCategoryMutation()` de la Fase 9.

### Implementación de `HabitFormModal`

- Reemplaza `Modal` → `SteppedModal`.
- El estado `values: HabitFormValues` se mantiene en el componente raíz (igual que antes).
- La función `handleSubmit` solo se llama desde el footer del Paso 3.
- Los footers de los Pasos 1 y 2 solo validan su bloque de campos antes de avanzar (Paso 1: `name` no vacío; Paso 2: sin validación obligatoria).
- `SteppedModal` gestiona el historial de pasos via `push`/`pop`; los 3 pasos iniciales NO se pushean — el componente raíz es el Paso 1 y el contenido de los steps 2 y 3 se pasan como subcomponentes que llaman `useModalStep().pop()` para retroceder.
- Alternativamente (más sencillo): usar `useState<1|2|3>(1)` para el paso actual en lugar de `push`/`pop`, ya que los 3 pasos son lineales. Solo usar `push` para `CreateHabitCategoryStep`.

### Criterio de done

- El modal de creación tiene 3 pasos con indicador visual de progreso (nativo de `SteppedModal`).
- En el Paso 2, "Nueva categoría" empuja un paso extra, crea la categoría y vuelve al Paso 2 con la nueva categoría seleccionada.
- Editar un hábito existente pre-rellena los 3 pasos correctamente.
- Las fechas y tipo siguen bloqueados en modo edit si `habit.days > 0`.
- Cerrar el modal en cualquier paso descarta los cambios (sin confirmación).

---

## Tabla resumen de fases

| Fase | Nombre | Repo | Riesgo | Dependencias |
|---|---|---|---|---|
| 1 | Migración DB | Backend | Bajo | — |
| 2 | Algoritmo de racha | Backend | **Alto** | 1 |
| 3 | Servicio y GraphQL | Backend | Medio | 1, 2 |
| 4 | Feature folder base | Frontend | Bajo | 3 |
| 5 | Vista diaria | Frontend | Bajo | 4 |
| 6 | Vista semanal | Frontend | Bajo | 5 |
| 7 | Calendario de progreso | Frontend | Bajo | 4 |
| 8 | CRUD de hábitos | Frontend | Medio | 5, 6 |
| 9 | Gestión de categorías | Frontend | Bajo | 4 |
| 10 | HabitFormModal multi-paso | Frontend | Medio | 8, 9 |
| 11 | Backend: Entidad HabitPurpose | Backend | Bajo | 3 |
| 12 | Frontend: Página Mi Persona Ideal | Frontend | Medio | 11 |
| 13 | Frontend: Conectar hábitos con propósitos | Frontend | Bajo | 10, 11 |
| 14 | Frontend: Banner de propósito en Mi Día | Frontend | Bajo | 12, 13 |

Las fases 9 y 10 son independientes de las vistas (7) y pueden ejecutarse en cualquier orden. La Fase 10 depende de la 9 porque el Paso 2 del formulario permite crear categorías inline.

Las fases 11–14 implementan la funcionalidad "Mi Persona Ideal". La Fase 11 puede ejecutarse en paralelo con cualquier fase frontend ya que es backend puro. Las Fases 13 y 14 son lineales y dependen de que tanto el backend (11) como el formulario multi-paso (10) estén listos.

---

## Fase 11 — Backend: Entidad HabitPurpose

**Repo:** Backend
**Dependencias:** Fase 3
**Riesgo:** Bajo

### Scope exacto

Nueva entidad `HabitPurpose` (propósito/característica de identidad). Nueva tabla en DB, tipos TypeScript, servicio CRUD, y exposición vía GraphQL. Modificación de `habits` para aceptar `purposeId` opcional. La migración se CREA pero NO se ejecuta.

### Archivos a crear o modificar

| Archivo | Acción |
|---|---|
| `migrations/042_habit_purposes.sql` | CREAR |
| `src/types/services/habit-purpose.types.ts` | CREAR |
| `src/services/habit-purpose.service.ts` | CREAR |
| `src/graphql/modules/habit/habit.schema.ts` | MODIFICAR |
| `src/graphql/modules/habit/habit.resolvers.ts` | MODIFICAR |
| `src/validators/schemas/habit.schemas.ts` | MODIFICAR |
| `src/types/services/habit.types.ts` | MODIFICAR |
| `src/services/habit.service.ts` | MODIFICAR |

### Contenido de `042_habit_purposes.sql`

```sql
-- Nueva tabla de propósitos de identidad
CREATE TABLE habit_purposes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100),
  placement VARCHAR(10) NOT NULL DEFAULT 'pool'
    CHECK (placement IN ('pool', 'want', 'avoid')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_habit_purposes_user_id ON habit_purposes(user_id, placement);

-- Añadir referencia opcional a propósito en la tabla de hábitos
ALTER TABLE habits
  ADD COLUMN purpose_id INTEGER REFERENCES habit_purposes(id) ON DELETE SET NULL;

-- DOWN
-- ALTER TABLE habits DROP COLUMN IF EXISTS purpose_id;
-- DROP TABLE IF EXISTS habit_purposes;
```

`placement` puede ser `'pool'` (creado pero no asignado a columna), `'want'` (lo que quiero) o `'avoid'` (lo que no quiero).

### Contenido de `habit-purpose.types.ts`

```typescript
export type HabitPurposePlacement = 'pool' | 'want' | 'avoid'

export interface HabitPurpose {
  id: string
  userId: number
  name: string
  icon: string | null
  placement: HabitPurposePlacement
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface HabitPurposeInput {
  name: string
  icon?: string | null
  placement?: HabitPurposePlacement
  orderIndex?: number
}

export interface HabitPurposeEditInput extends Partial<HabitPurposeInput> {
  id: string
}
```

### Contenido de `habit-purpose.service.ts`

Funciones:
- `listHabitPurposes(userId: number): Promise<HabitPurpose[]>` — SELECT ordenado por `placement, order_index ASC`.
- `getHabitPurpose(id: string, userId: number): Promise<HabitPurpose>` — SELECT + verificación de propiedad; lanzar `NotFoundError` si no existe.
- `createHabitPurpose(userId: number, input: HabitPurposeInput): Promise<HabitPurpose>` — INSERT con `placement = input.placement ?? 'pool'`.
- `updateHabitPurpose(id: string, userId: number, input: HabitPurposeEditInput): Promise<HabitPurpose>` — UPDATE parcial de los campos presentes en input; no actualizar campos ausentes.
- `removeHabitPurpose(id: string, userId: number): Promise<boolean>` — DELETE. El `ON DELETE SET NULL` en `habits.purpose_id` asegura que los hábitos enlazados no se rompen.

Constante `PURPOSE_RETURNING`:
```
id, user_id, name, icon, placement, order_index, created_at, updated_at
```

Función `mapPurpose(row)` que convierte snake_case a camelCase.

### Cambios en `habit.types.ts` (backend)

Añadir a `Habit`:
```typescript
purposeId: number | null
```

Añadir a `CreateHabitInput` y `UpdateHabitInput`:
```typescript
purposeId?: string | null
```

### Cambios en `habit.service.ts`

- En `HABIT_RETURNING`: añadir `purpose_id`.
- En `mapHabit(row)`: añadir `purposeId: row.purpose_id ?? null`.
- En `createHabit`: añadir `purpose_id` al INSERT si `input.purposeId` está presente.
- En `updateHabit`: añadir `purposeId` al `fieldMap` como `purpose_id`.

### Cambios en `habit.schemas.ts`

En `legacyHabitFields` (o donde corresponda): añadir `purposeId: z.string().nullable().optional()`.

Nuevos schemas:
```typescript
export const habitPurposeInputSchema = z.object({
  name: z.string().min(1).max(255),
  icon: z.string().max(100).nullable().optional(),
  placement: z.enum(['pool', 'want', 'avoid']).optional(),
  orderIndex: z.number().int().min(0).optional(),
})

export const habitPurposeEditInputSchema = z.object({
  id: habitIdString,
  name: z.string().min(1).max(255).optional(),
  icon: z.string().max(100).nullable().optional(),
  placement: z.enum(['pool', 'want', 'avoid']).optional(),
  orderIndex: z.number().int().min(0).optional(),
}).refine(
  (d) => ['name', 'icon', 'placement', 'orderIndex'].some((k) => d[k as keyof typeof d] !== undefined),
  { message: 'At least one field required' }
)
```

### Cambios en `habit.schema.ts` (GraphQL)

Añadir:
```graphql
enum HabitPurposePlacement { pool want avoid }

type HabitPurpose {
  id: ID!
  userId: Int!
  name: String!
  icon: String
  placement: HabitPurposePlacement!
  orderIndex: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

extend type Query {
  habitPurposes: [HabitPurpose!]!
  habitPurpose(id: ID!): HabitPurpose!
}

extend type Mutation {
  habitPurposeAdd(input: HabitPurposeInput!): HabitPurpose!
  habitPurposeEdit(input: HabitPurposeEditInput!): HabitPurpose!
  habitPurposeRemove(id: ID!): Boolean!
}

input HabitPurposeInput {
  name: String!
  icon: String
  placement: HabitPurposePlacement
  orderIndex: Int
}

input HabitPurposeEditInput {
  id: ID!
  name: String
  icon: String
  placement: HabitPurposePlacement
  orderIndex: Int
}
```

En el tipo `Habit` existente, añadir:
```graphql
purposeId: ID
purpose: HabitPurpose
```

En `HabitInput` y `HabitEditInput`, añadir:
```graphql
purposeId: ID
```

### Cambios en `habit.resolvers.ts`

Añadir resolvers en `Query`:
```typescript
habitPurposes: async (_p, _a, ctx) => {
  requireAuth(ctx, 'habitPurposes')
  return habitPurposeService.listHabitPurposes(uid(ctx))
},
habitPurpose: withValidatedResolver(z.object({ id: habitIdString }), async (_p, { id }, ctx) => {
  requireAuth(ctx, 'habitPurpose')
  return habitPurposeService.getHabitPurpose(id, uid(ctx))
}, 'habitPurpose'),
```

Añadir resolvers en `Mutation`:
```typescript
habitPurposeAdd: withValidatedResolver(habitPurposeInputSchema, async (_p, { input }, ctx) => {
  requireAuth(ctx, 'habitPurposeAdd')
  return habitPurposeService.createHabitPurpose(uid(ctx), input)
}, 'habitPurposeAdd'),
habitPurposeEdit: withValidatedResolver(habitPurposeEditInputSchema, async (_p, { input }, ctx) => {
  requireAuth(ctx, 'habitPurposeEdit')
  return habitPurposeService.updateHabitPurpose(input.id, uid(ctx), input)
}, 'habitPurposeEdit'),
habitPurposeRemove: withValidatedResolver(z.object({ id: habitIdString }), async (_p, { id }, ctx) => {
  requireAuth(ctx, 'habitPurposeRemove')
  return habitPurposeService.removeHabitPurpose(id, uid(ctx))
}, 'habitPurposeRemove'),
```

Field resolver en `Habit` para cargar el propósito si `purposeId` está presente:
```typescript
Habit: {
  purpose: async (habit, _args, ctx) => {
    if (!habit.purposeId) return null
    return habitPurposeService.getHabitPurpose(String(habit.purposeId), uid(ctx))
  },
}
```

### Criterio de done

- `habitPurposes` query devuelve lista vacía para usuario sin propósitos.
- `habitPurposeAdd` crea un propósito con `placement = 'pool'` por defecto.
- `habitPurposeEdit` con `placement: 'want'` mueve el propósito a esa columna.
- `habitPurposeRemove` no rompe hábitos enlazados (su `purposeId` queda null en DB).
- `habitAdd` con `purposeId` válido enlaza el hábito al propósito.
- La migración `042` se CREA como archivo pero NO se ejecuta (se aplica manualmente post-deploy).

---

## Fase 12 — Frontend: Página "Mi Persona Ideal"

**Repo:** Frontend
**Dependencias:** Fase 11
**Riesgo:** Medio (drag & drop — librería nueva en el proyecto)

### Scope exacto

Nueva página `/habits/persona` con tres zonas: pool (propósitos sin asignar), columna "Lo que quiero" y columna "Lo que no quiero". Drag & drop entre zonas. CRUD completo de propósitos. Instalar `@dnd-kit/core` y `@dnd-kit/utilities`.

### Instalación previa

```bash
pnpm add @dnd-kit/core @dnd-kit/utilities
```

### Archivos a crear

```
src/features/habits/
├── types/
│   └── habit-purpose.types.ts
├── graphql/
│   └── habit-purposes.graphql.ts
├── api/
│   └── habit-purposes.api.ts
├── hooks/
│   └── useHabitPurposes.ts
├── components/
│   ├── HabitPurposeCard/
│   │   ├── HabitPurposeCard.tsx
│   │   ├── HabitPurposeCard.module.scss
│   │   └── index.ts
│   ├── HabitPurposeForm/
│   │   ├── HabitPurposeForm.tsx
│   │   ├── HabitPurposeForm.module.scss
│   │   └── index.ts
│   └── PersonaColumn/
│       ├── PersonaColumn.tsx
│       ├── PersonaColumn.module.scss
│       └── index.ts
└── pages/
    ├── HabitPersonaPage.tsx
    └── HabitPersonaPage.module.scss
```

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/features/habits/routes/habits-paths.ts` | Añadir `persona: '/app/habits/persona'` |
| `src/features/habits/routes/habits.routes.tsx` | Añadir ruta `persona` → `<HabitPersonaPage />` |
| `src/features/habits/components/HabitsModuleLayout/HabitsModuleLayout.tsx` | Añadir link "Mi Persona" al nav |
| `src/shared/api/query-keys.ts` | Añadir `habitKeys.purposes` |

### Contenido de `habit-purpose.types.ts` (frontend)

Espeja los tipos del backend:
```typescript
export type HabitPurposePlacement = 'pool' | 'want' | 'avoid'

export interface HabitPurpose {
  id: string
  userId: number
  name: string
  icon: string | null
  placement: HabitPurposePlacement
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface HabitPurposeInput {
  name: string
  icon?: string | null
  placement?: HabitPurposePlacement
  orderIndex?: number
}

export interface HabitPurposeEditInput extends Partial<HabitPurposeInput> {
  id: string
}
```

### Contenido de `habit-purposes.graphql.ts`

```typescript
export const HABIT_PURPOSES_QUERY = `
  query HabitPurposes {
    habitPurposes {
      id userId name icon placement orderIndex createdAt updatedAt
    }
  }
`

export const HABIT_PURPOSE_ADD_MUTATION = `
  mutation HabitPurposeAdd($input: HabitPurposeInput!) {
    habitPurposeAdd(input: $input) {
      id userId name icon placement orderIndex createdAt updatedAt
    }
  }
`

export const HABIT_PURPOSE_EDIT_MUTATION = `
  mutation HabitPurposeEdit($input: HabitPurposeEditInput!) {
    habitPurposeEdit(input: $input) {
      id userId name icon placement orderIndex createdAt updatedAt
    }
  }
`

export const HABIT_PURPOSE_REMOVE_MUTATION = `
  mutation HabitPurposeRemove($id: ID!) {
    habitPurposeRemove(id: $id)
  }
`
```

### Contenido de `habit-purposes.api.ts`

- `getHabitPurposes(): Promise<HabitPurpose[]>`
- `createHabitPurpose(input: HabitPurposeInput): Promise<HabitPurpose>`
- `updateHabitPurpose(input: HabitPurposeEditInput): Promise<HabitPurpose>`
- `removeHabitPurpose(id: string): Promise<boolean>`

### Contenido de `useHabitPurposes.ts`

Query keys: `habitKeys.purposes.all()`, `habitKeys.purposes.list()`.

- `useHabitPurposesQuery()` — staleTime: 60s.
- `useCreateHabitPurposeMutation()` — onSuccess: invalidar `habitKeys.purposes.list()`, toast "Propósito creado".
- `useUpdateHabitPurposeMutation()` — onSuccess: invalidar `habitKeys.purposes.list()`, toast "Propósito actualizado".
- `useRemoveHabitPurposeMutation()` — onSuccess: invalidar `habitKeys.purposes.list()`, toast "Propósito eliminado".

### Descripción de `HabitPurposeCard`

Props: `purpose: HabitPurpose`, `onEdit: () => void`, `onDelete: () => void`, `dragging?: boolean`.

La card muestra:
- Icono (si existe) + nombre del propósito.
- Menú contextual (tres puntos): "Editar" y "Eliminar".
- Cuando `dragging = true`: aplicar clase CSS de sombra/opacidad reducida para feedback visual.

Para el drag, el componente debe exponerse como un `useDraggable` de `@dnd-kit/core`. El `id` del draggable es `purpose.id`. El `data` del drag incluye `{ placement: purpose.placement }`.

### Descripción de `HabitPurposeForm`

Props: `initial?: HabitPurpose`, `onSubmit: (values: HabitPurposeInput) => void`, `onCancel: () => void`, `loading?: boolean`.

Campos:
1. `name` (Input, obligatorio, autoFocus)
2. `icon` (IconPicker, clearable — mismo componente que usa HabitCategoryForm)

Footer: botón cancelar (ghost) + botón "Guardar".

### Descripción de `PersonaColumn`

Props: `title: string`, `placement: HabitPurposePlacement`, `purposes: HabitPurpose[]`, `onEdit: (p: HabitPurpose) => void`, `onDelete: (id: string) => void`.

Internamente implementa `useDroppable({ id: placement })` de `@dnd-kit/core`.

Muestra el título, un contador de propósitos, y la lista de `HabitPurposeCard`.

Cuando hay un propósito sobre ella (`isOver = true`): aplicar clase CSS de highlight en el borde/fondo.

Si la lista está vacía y no hay drag sobre ella: mostrar placeholder "Arrastra propósitos aquí".

### Descripción de `HabitPersonaPage`

Estado local:
- `editingPurpose: HabitPurpose | null` — propósito en edición (abre modal).
- `isCreating: boolean` — abre modal de creación.
- `activeId: string | null` — id del propósito siendo arrastrado (para overlay).

Llama `useHabitPurposesQuery()`. Deriva las tres listas filtrando por `placement`:
- `pool = purposes.filter(p => p.placement === 'pool')`
- `want = purposes.filter(p => p.placement === 'want')`
- `avoid = purposes.filter(p => p.placement === 'avoid')`

Layout:
```
[ Header: "Mi Persona Ideal" ] [ Botón "Nuevo propósito" ]

[ Pool — sin asignar ]
  [ card ] [ card ] [ card ] ...

[ Lo que quiero ]          [ Lo que no quiero ]
  [ card ]                   [ card ]
  [ card ]                   [ card ]
```

Pool horizontal (scroll) con las cards no asignadas.
Las dos columnas debajo en layout de dos columnas.

**Implementación DnD:**

Usar `DndContext` de `@dnd-kit/core` con sensor de puntero (`PointerSensor`).

`onDragStart`: guardar `activeId = event.active.id`.

`onDragEnd`: si `event.over` existe y `event.over.id` es diferente al `placement` actual del propósito, llamar `useUpdateHabitPurposeMutation().mutate({ id: activeId, placement: event.over.id as HabitPurposePlacement })`. Limpiar `activeId`.

`DragOverlay`: renderizar una copia de `HabitPurposeCard` del propósito con `activeId` mientras se arrastra, con `dragging = true`.

Las tres `PersonaColumn` (pool, want, avoid) son los `useDroppable` con sus respectivos `id`.

**Modal de crear/editar:**

Usar `Modal` estándar del proyecto con `HabitPurposeForm` dentro.

En creación: `useCreateHabitPurposeMutation().mutate({ name, icon, placement: 'pool' })`.
En edición: `useUpdateHabitPurposeMutation().mutate({ id, name, icon })`.

Eliminar: `useConfirmDialog` → `useRemoveHabitPurposeMutation().mutate(id)`.

### Criterio de done

- `/app/habits/persona` es accesible desde el nav del módulo.
- Crear un propósito lo muestra en el pool.
- Arrastrar del pool a "Lo que quiero" actualiza su `placement` en la DB y la UI refleja el cambio sin recarga.
- Arrastrar de "Lo que no quiero" a "Lo que quiero" funciona igual.
- Editar el nombre e icono funciona desde el menú contextual.
- Eliminar un propósito que ya está enlazado a un hábito no rompe la app (el hábito pierde la referencia silenciosamente por el ON DELETE SET NULL del backend).

---

## Fase 13 — Frontend: Conectar hábitos con propósitos

**Repo:** Frontend
**Dependencias:** Fases 10 y 11
**Riesgo:** Bajo

### Scope exacto

Añadir el campo opcional `purposeId` al formulario de hábitos (Paso 3 del SteppedModal). Actualizar los tipos y queries del frontend para incluir `purposeId` y el objeto `purpose` embebido. El picker de propósito filtra por columna según el tipo de hábito.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/features/habits/types/habit.types.ts` | Añadir `purposeId`, `purpose` a `Habit` y a `HabitInput`/`HabitEditInput` |
| `src/features/habits/graphql/habits.graphql.ts` | Añadir `purposeId` a `HABIT_FIELDS`; añadir `purpose { id name icon placement }` a queries que lo necesiten |
| `src/features/habits/components/HabitFormModal/HabitFormModal.tsx` | Añadir campo propósito en el Paso 3 |

### Cambios en `habit.types.ts` (frontend)

En la interfaz `Habit`:
```typescript
purposeId: string | null
purpose?: HabitPurpose | null
```

En `HabitInput` y `HabitEditInput`:
```typescript
purposeId?: string | null
```

Importar `HabitPurpose` desde `habit-purpose.types.ts`.

### Cambios en `habits.graphql.ts`

En `HABIT_FIELDS`: añadir `purposeId`.

En `HABIT_QUERY` (query de detalle): añadir el bloque:
```graphql
purpose {
  id
  name
  icon
  placement
}
```

En `HABIT_MY_DAY_QUERY`, en el sub-objeto `habit`: añadir `purposeId` y el bloque `purpose { id name icon placement }`.

### Cambios en `HabitFormModal`

En el Paso 3 (Fechas y metas), añadir al final del formulario:

```
[ Propósito (opcional) ]
Select con las opciones filtradas:
  - Si shouldAvoid = true  → mostrar propósitos con placement = 'avoid'
  - Si shouldAvoid = false → mostrar propósitos con placement = 'want'
  - Opción "Sin propósito" siempre disponible (valor null)
```

El componente llama `useHabitPurposesQuery()` para obtener todos los propósitos. Filtra en cliente por `placement`.

Si no hay propósitos en la columna correspondiente: mostrar texto informativo "No tienes propósitos en '...' aún. Ve a Mi Persona para crearlos." con link a `habitsPaths.persona`.

En `habit-form.utils.ts`: incluir `purposeId` en `buildHabitCreatePayload` y `buildHabitEditPayload`.

### Criterio de done

- Al crear un hábito con `shouldAvoid = false`, el picker de propósito muestra solo los de `placement = 'want'`.
- Al crear un hábito con `shouldAvoid = true`, el picker muestra solo los de `placement = 'avoid'`.
- El propósito seleccionado se persiste en la DB (`habits.purpose_id`).
- Editar un hábito que ya tiene propósito pre-selecciona el propósito en el picker.
- Seleccionar "Sin propósito" envía `purposeId: null` y borra la referencia.

---

## Fase 14 — Frontend: Banner de propósito en "Mi Día"

**Repo:** Frontend
**Dependencias:** Fases 12 y 13
**Riesgo:** Bajo

### Scope exacto

Modificar `HabitDayCard` para mostrar encima de cada hábito un banner con el propósito asociado. Si el hábito no tiene propósito, mostrar una invitación sutil para asignarlo.

### Archivos a crear

```
src/features/habits/components/
└── HabitPurposeBanner/
    ├── HabitPurposeBanner.tsx
    ├── HabitPurposeBanner.module.scss
    └── index.ts
```

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/features/habits/components/HabitDayCard/HabitDayCard.tsx` | Añadir `HabitPurposeBanner` encima del contenido principal |
| `src/features/habits/components/HabitDayCard/HabitDayCard.module.scss` | Ajustar layout para acomodar el banner |

### Descripción de `HabitPurposeBanner`

Props: `purpose: HabitPurpose | null | undefined`, `habitId: string`.

**Si `purpose` existe:**

Mostrar un chip/banner compacto con:
- Icono del propósito (si tiene) + nombre.
- Texto de contexto pequeño según `purpose.placement`:
  - `'want'` → "Para ser: ..."
  - `'avoid'` → "Para dejar de ser: ..."
- El banner es visualmente discreto (fondo sutil, texto secundario), no compite con la acción principal de la card.

**Si `purpose` es null o undefined:**

Mostrar un CTA sutil: texto "¿Por qué haces este hábito?" con un link/botón pequeño "Asignar propósito" que navega a `habitsPaths.persona`. El CTA debe ser claramente opcional y no intrusivo — fuente pequeña, color terciario, sin icono llamativo.

### Cambios en `HabitDayCard`

El componente recibe `entry: HabitMyDayEntry`. Dado que la Fase 13 ya añade `purpose` al objeto `habit` en la query `habitMyDay`, el dato llega directamente en `entry.habit.purpose`.

Estructura del componente actualizada:
```tsx
<div className={styles.card}>
  <HabitPurposeBanner purpose={entry.habit.purpose} habitId={entry.habit.id} />
  <div className={styles.content}>
    {/* contenido existente de la card */}
  </div>
</div>
```

El banner va fuera del `content` y ocupa el ancho completo de la card, separado visualmente del cuerpo principal (borde inferior fino o fondo distinto).

### Criterio de done

- En Mi Día, cada hábito con propósito muestra el banner con icono y nombre del propósito.
- El texto "Para ser:" aparece en hábitos `placement = 'want'`; "Para dejar de ser:" en `placement = 'avoid'`.
- Hábitos sin propósito muestran el CTA "¿Por qué haces este hábito?".
- El link "Asignar propósito" navega a `/app/habits/persona`.
- La card mantiene su funcionalidad completa (registrar follow-up, lifeline, etc.) sin regresiones.
