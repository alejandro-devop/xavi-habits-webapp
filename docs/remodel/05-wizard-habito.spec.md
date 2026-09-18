# Spec — Fase 6: El wizard de crear hábito

> **Estado:** lista para construir
> **Depende de:** `04-chasis-app.spec.md`. El wizard se abre desde Mi Día y desde Mis Hábitos, ya construidas.

## Objetivo

Crear un hábito deja de ser un formulario de catorce campos con vocabulario de programador («Sí / No · Contador · Tiempo») y pasa a ser una conversación de tres pasos que se entiende sin saber nada de la app: qué quieres cambiar, cómo sabrás que lo cumpliste, y cuándo lo vas a hacer. Con una galería de puntos de partida para quien llega nuevo, ajustes avanzados plegados para quien ya sabe, y vista previa en vivo de cómo quedará el hábito en Mi Día.

**Referencia visual aprobada por el usuario:** `docs/remodel/assets/05-wizard-habito.html` — cuatro marcos: los tres pasos en escritorio y la hoja inferior en móvil.

## Fuera de alcance

- **La edición de un hábito existente** no usa el wizard de tres pasos: abre directamente en un formulario plano con todos los campos, como hoy. El wizard es para crear. (Excepción: ver "Editar la intención".)
- Mi Persona, categorías y medidas como pantallas propias. Aquí solo aparecen sus pasos incrustados, que ya existen.
- Backend. Ni un campo nuevo — ver "Dónde se guarda la intención", que es la decisión central.
- Recordatorios o notificaciones. La intención se escribe y se muestra; no dispara nada. Eso necesitaría backend.

## Pantallas y rutas

| Ruta | Archivo | Qué cambia |
|------|---------|------------|
| — | `src/features/habits/components/HabitFormModal/` | Modo `create`: wizard de 3 pasos. Modo `edit`: formulario plano |
| — | `src/features/habits/utils/habit-form.utils.ts` | Se añade la composición y el análisis de la intención |
| — | `src/features/habits/data/habit-templates.ts` | **Nuevo**: el catálogo de plantillas |

## Diseño

### Paso 1 — ¿Qué quieres cambiar?

Dos tarjetas grandes, que son el único fork que cualquiera entiende:

- **Construir algo nuevo** (`shouldAvoid: false`) — mint. Ejemplos: *meditar, leer, salir a caminar*.
- **Dejar algo atrás** (`shouldAvoid: true`) — violeta. Ejemplos: *redes por la mañana, azúcar, fumar*.

Debajo, la **galería de plantillas** (ver su sección). Debajo, el nombre con selector de icono y color en píldoras.

Para pasar de paso solo hace falta el nombre. Nada más es obligatorio.

### Paso 2 — ¿Cómo sabrás que lo cumpliste?

**Desaparece el desplegable de `habitType`.** Tres tarjetas que se explican por lo que hacen, con ejemplos reales:

| Tarjeta | Valor | Ejemplos |
|---|---|---|
| **Lo hice o no lo hice** — un toque y listo | `boolean` | Meditar · Hacer la cama · Llamar a mamá |
| **Cuento cuánto** — una cantidad y un objetivo diario | `count` | 2,5 litros de agua · 8.000 pasos · 30 páginas |
| **Mido el tiempo** — minutos y un objetivo diario | `time` | 30 min de guitarra · 45 min de estudio |

Al elegir `count` o `time` aparecen debajo el objetivo (`dailyGoal` / `timerGoal`) y, para `count`, la medida — reutilizando `CreateHabitMeasureStep`, que ya existe, para crearla al vuelo si falta.

Pista fija bajo las tarjetas, que quita el miedo a equivocarse: *«Puedes cambiarlo más adelante sin perder el historial. Si dudas, quédate con lo hice o no lo hice.»*

**Ajustes avanzados**, plegado y cerrado por defecto: categoría (con `CreateHabitCategoryStep`), `startDate`, `endDate` y `hidden`. Todo lo que hoy se pregunta de golpe y casi nadie necesita el primer día.

### Paso 3 — ¿Cuándo lo vas a hacer?

**La frase guía es parte del diseño, no decoración.** Va sobre la frase de intención, en tono calmado y con una instrucción concreta:

> **¿Cuándo lo vas a hacer?**
>
> Tómate diez segundos antes de responder. Imagina mañana: ¿qué estás haciendo justo *antes* de este hábito? Ese momento que ya existe en tu día es el ancla — el primer café, cerrar el portátil, apagar la luz. Engancha el hábito ahí y dejas de depender de acordarte.

Debajo, la **frase de intención** con tres huecos pulsables sobre fondo violeta suave:

> Cuando **[me levante]**, haré **[15 minutos de meditación]** en **[¿dónde?]**

- **Hueco 1, el ancla:** desplegable con anclas frecuentes (*me levante · desayune · llegue a casa · termine de trabajar · cene · me meta en la cama*) más «Otro…» para escribirla. Es el hueco que más importa; si solo se rellena uno, que sea este.
- **Hueco 2, la acción:** se propone sola a partir del nombre y el objetivo del hábito (*«15 minutos de meditación»*), y se puede editar.
- **Hueco 3, el lugar:** texto libre, opcional. En vacío se muestra como hueco punteado con «¿dónde?», no como error.

**Los tres huecos son opcionales.** Ninguno bloquea la creación.

Después, dos bloques más:

**Salvavidas, en idioma humano.** «`weeklyLifelines: 0`» deja de ser un número suelto: la pregunta es *«¿Cuántos días puedes fallar sin romper la racha?»* con píldoras (Ninguno · 1 · 2 · 3) y su explicación: *«Son tus salvavidas. Un mal día no borra tres semanas de trabajo: gastas uno y la racha sigue viva.»*

**Propósito, eligiendo, no redactando.** *«¿A quién te acerca este hábito?»* con los propósitos existentes como píldoras (icono + nombre) y «＋ Otro» que abre el `CreateHabitPurposeStep` de siempre. Marcado como **opcional y aplazable** en la propia etiqueta. Nunca bloquea.

En el pie: **Atrás**, **Omitir y crear** (crea con lo que haya) y **Crear hábito**.

### Plantillas

Catálogo en `src/features/habits/data/habit-templates.ts`, datos puros, sin API. Cada plantilla trae nombre, icono, color, `habitType`, objetivo cuando aplica, `weeklyLifelines` sugerido, una acción propuesta para la frase de intención, y opcionalmente el nombre de una medida y de una categoría.

Ocho, como punto de partida: Meditar · Beber agua · Leer · Caminar · Entrenar · Escribir · Dormir a mi hora · Estirar.

**El detalle que hay que resolver bien:** una plantilla **no puede traer `measureId` ni `categoryId`**, porque medidas y categorías son datos de cada usuario. Trae **nombres**. Al aplicarla:

1. Se busca entre las medidas y categorías del usuario una cuyo nombre coincida (sin distinguir mayúsculas ni acentos). Si existe, se preselecciona.
2. Si no existe, **no se crea nada a escondidas**: el campo queda vacío y con el paso de creación al vuelo ya prefijado con el nombre sugerido, para que lo confirme con un toque.

Aplicar una plantilla rellena los campos y **deja seguir editando todo**. No es un camino cerrado. Si el usuario ya escribió un nombre, aplicar una plantilla no lo pisa sin avisar.

### Dónde se guarda la intención

**Decisión: en `description`, sin tocar el backend.** Es la recomendación que el usuario aceptó: esto es un piloto, y si al usarlo la frase demuestra valer la pena, entonces se le hace un campo propio en `xavi-platform-node` con esa certeza.

Reglas, que son lo que hace que esto no se convierta en un lío:

- Formato estable y analizable: `Cuando {ancla}, haré {acción} en {lugar}.` Sin lugar: `Cuando {ancla}, haré {acción}.`
- Al **editar** un hábito se intenta analizar `description`. Si encaja con el patrón, los tres huecos se rellenan. Si no encaja —hábitos viejos con texto libre— se muestra el campo de descripción libre con su contenido intacto, **sin destruir nada**, y un enlace discreto «convertirlo en intención».
- Intención y descripción libre son **excluyentes**: en Ajustes avanzados hay un conmutador entre las dos. Al cambiar de una a otra se avisa de que se sustituye el texto. Nunca se pisa en silencio.
- Los tests de análisis y composición son obligatorios, incluidos los casos feos: comas dentro de la acción, frases sin lugar, texto libre que casualmente empieza por «Cuando».

### Vista previa en vivo

Panel a la derecha (292px), con fondo de vidrio más claro. Muestra **la fila del hábito tal como se verá en Mi Día**, reutilizando `HabitDayRow` o su presentación, más la tira de siete días vacía y la lista de los tres pasos marcándose. Incluye la línea *«Nada se guarda hasta el último paso»*, porque la vista previa parece un hábito ya creado y conviene decirlo.

Cuando hay propósito, añade la línea de confirmación que se verá al marcarlo: *«Un día más siendo alguien sereno.»*

En móvil el panel no cabe: se sustituye por una tira compacta bajo el título con icono y nombre.

### Móvil

Hoja inferior (`Drawer` anclado abajo) hasta el 92% de alto, un paso por pantalla, botones a ancho completo. Los tres puntos de progreso arriba.

## Datos

- **Queries:** `useHabitCategoriesQuery`, `useHabitMeasuresQuery`, `useHabitPurposesQuery` — las que ya usa el modal.
- **Mutations:** `useCreateHabitMutation`, `useUpdateHabitMutation`, y las de crear categoría, medida y propósito al vuelo. Sin cambios.
- **Payload:** el mismo `buildHabitCreatePayload`. La intención entra por `description`; ningún campo nuevo.
- **Estado local:** los valores del formulario y el paso actual, en el componente.

## Criterios de aceptación

- [ ] Crear un hábito son tres pasos, fiel a `docs/remodel/assets/05-wizard-habito.html`
- [ ] En ningún punto del camino por defecto aparecen las palabras «booleano», «contador» o «tipo de hábito»
- [ ] Solo el nombre es obligatorio: se puede crear un hábito pasando por los tres pasos sin rellenar nada más
- [ ] «Omitir y crear» en el paso 3 crea el hábito con lo que haya
- [ ] Aplicar una plantilla rellena nombre, icono, color, tipo y objetivo, y todo sigue siendo editable
- [ ] Una plantilla con medida preselecciona la del usuario si existe por nombre, y si no, **no crea nada**: deja el paso de creación prefijado
- [ ] Aplicar una plantilla sobre un nombre ya escrito avisa antes de sustituirlo
- [ ] La frase de intención se compone en `description` con el formato acordado, y al editar el hábito se vuelve a descomponer en los tres huecos
- [ ] Un hábito con descripción libre previa se edita **sin perder su texto** y sin que el wizard lo reescriba
- [ ] Los salvavidas se preguntan en lenguaje natural y guardan `weeklyLifelines`
- [ ] El propósito se elige entre píldoras, está marcado como opcional y nunca bloquea el envío
- [ ] La vista previa refleja los cambios mientras se rellena y dice que nada se guarda hasta el final
- [ ] Editar un hábito abre el formulario plano, no el wizard
- [ ] Todo el wizard se recorre con teclado, y el paso actual se anuncia a lectores de pantalla
- [ ] Funciona en tema claro y oscuro
- [ ] Funciona a ~375px como hoja inferior
- [ ] Estados vacío, cargando y error resueltos

## Notas para el constructor

- **Empieza por la maqueta.**
- `SteppedModal` y `useModalStep` ya existen y resuelven los sub-pasos de categoría, medida y propósito. **Reutilízalos**: el wizard es un `SteppedModal` con tres pasos raíz, no un componente nuevo desde cero.
- `CreateHabitCategoryStep`, `CreateHabitMeasureStep` y `CreateHabitPurposeStep` se conservan tal cual. Lo que cambia es dónde y cómo se invocan.
- La composición y el análisis de la intención van en `habit-form.utils.ts` como funciones puras con tests, nunca dentro del componente.
- Nada de expresiones regulares frágiles para el análisis: acota el patrón, y ante la duda trata el texto como descripción libre. **Perder la descripción de un usuario es el peor fallo posible de esta spec.**
- El catálogo de plantillas es un archivo de datos, no un componente. Tipa sus entradas contra `HabitFormValues` para que no puedan desincronizarse.
- La microcopia de esta spec está escrita a propósito, incluida la frase guía del paso 3 y la explicación de los salvavidas. Cópiala literal; si algo no cabe, dilo en el reporte en vez de reescribirla.
- Al terminar, `graphify update .`
