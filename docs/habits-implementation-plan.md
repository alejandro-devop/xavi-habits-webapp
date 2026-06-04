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

Las fases 7 y 8 pueden ejecutarse en paralelo una vez que 5 y 6 estén completas. La Fase 7 puede incluso empezar en paralelo con la 5 (solo depende de 4), pero la 8 necesita 6 completa.
