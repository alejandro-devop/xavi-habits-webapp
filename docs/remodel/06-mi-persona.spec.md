# Spec — Fase 7: Mi Persona, la identidad se gana

> **Estado:** lista para construir
> **Depende de:** `04-chasis-app.spec.md` y `05-wizard-habito.spec.md`. Mi Día, Mis Hábitos y el wizard ya están construidos.

## Objetivo

El propósito del hábito no falló por falta de disciplina: falló por diseño. Se pedía **al crear el hábito** (momento administrativo, paciencia agotada), era **una hoja en blanco** (redactar en frío quién quieres ser es caro; reconocerse en algo que te proponen es barato) y **no volvía a aparecer nunca**, así que la conducta se extinguía.

Esta fase invierte las tres cosas: la app **propone** una identidad a partir de la evidencia registrada, la propone **en un hito** (cuando ya hay pruebas y estás en el momento de más orgullo), y la devuelve **al empezar y al lograr**. «Mi Persona» deja de ser un tablero que administrar y pasa a ser un espejo con pruebas.

**Referencia visual aprobada:** `docs/remodel/assets/06-mi-persona.html` — seis marcos.

## Decisiones ya tomadas

Estas tres estaban abiertas al pie del render y quedan cerradas así. No se reabren durante la construcción:

1. **El hito no interrumpe.** En escritorio se muestra **incrustado en Mi Día**, justo debajo de la fila del hábito recién marcado. En móvil (~375px) es una **hoja inferior** (`Drawer` anclado abajo) que se descarta deslizando. **Nunca un modal bloqueante**: un modal después de cumplir es exactamente la interrupción administrativa que mató a la versión anterior.
2. **Un rasgo se sostiene en un solo hábito.** Es lo que soporta `habit.purposeId` hoy, y mantiene el backend intocable. Que un rasgo se apoye en varios hábitos queda para cuando el piloto demuestre que hace falta.
3. **La creación manual de propósitos se conserva, pero deja de ser la puerta de entrada.** Pasa a ser un enlace discreto al pie de Mi Persona. Lo que desaparece es el tablero de tres columnas y el arrastre.

## Fuera de alcance

- **Backend.** Ni un campo nuevo, ni un endpoint, ni una migración. Todo sale de datos que la API ya devuelve.
- **Notificaciones y recordatorios.** El hito se ve al entrar en la app; no dispara nada fuera de ella.
- **Rediseñar el wizard.** La fase 6 se queda como está. Lo único que cambia allí es lo que dice la sección «Qué cambia en el wizard».
- **Un rasgo compartido por varios hábitos.** Ver decisión 2.
- **Historial de rasgos descartados.** Si dices «no me suena», se descarta y ya.

## Pantallas y rutas

| Ruta | Archivo | Qué cambia |
|------|---------|------------|
| `/habitos/mi-dia` | `src/features/habits/pages/HabitMyDayPage.tsx` | Se inserta el hito bajo la fila del hábito que lo dispara |
| `/habitos/persona` | `src/features/habits/pages/HabitPersonaPage.tsx` | **Reescrita**: espejo con evidencia en vez de kanban |
| — | `src/features/habits/components/HabitIdentityMoment/` | **Nuevo**: la tarjeta del hito (y su hoja en móvil) |
| — | `src/features/habits/components/HabitTraitCard/` | **Nuevo**: rasgo en estado ganado / propuesto / en camino |
| — | `src/features/habits/components/HabitPurposeBanner/` | Pasa a mostrar la línea de identidad al empezar y al lograr |
| — | `src/features/habits/utils/habit-identity.utils.ts` | **Nuevo**: detección de hitos, composición y análisis de la evidencia |
| — | `src/features/habits/data/identity-suggestions.ts` | **Nuevo**: el catálogo de identidades propuestas |
| — | `src/features/habits/components/PersonaColumn/` | **Se elimina** junto con la dependencia de arrastre en esta pantalla |

## Diseño

### El hito

Aparece **debajo de la fila del hábito recién marcado**, con la misma anchura que la fila, sobre vidrio con acento violeta.

```
SÉPTIMO DÍA SEGUIDO
Siete mañanas seguidas meditando.
Eso ya no es intención: es evidencia.

Alguien que hace esto siete días seguidos se está volviendo algo. ¿Cuál de estas te suena a ti?

[ Alguien sereno ]  [ Alguien que se cuida ]  [ Alguien que empieza el día en calma ]

✏️ Escribir la mía        Ahora no

Un toque y listo. Puedes cambiarlo o quitarlo cuando quieras — esto no es un contrato.
```

Copia literal. **Tres opciones, nunca más**: cuatro ya es una lista que hay que leer en vez de reconocer.

- **Elegir una píldora** crea el `HabitPurpose` (`placement: 'want'`, o `'avoid'` si `habit.shouldAvoid`) y lo enlaza a `habit.purposeId`. Un toque, sin confirmación ni paso intermedio.
- **«Escribir la mía»** despliega un input en la misma tarjeta, prefijado con «Alguien que…». No abre modal.
- **«Ahora no»** cierra la tarjeta y **no penaliza**: el mismo hito vuelve a ofrecerse la próxima vez que se cumpla, pasada la ventana de silencio.

Al confirmar, la tarjeta se sustituye en el sitio por el acuse:

> **✓ Guardado: alguien sereno**
> Lo escribiste tú al reconocerlo, no al inventarlo. A partir de mañana lo verás al empezar y al cumplir.
> `🧘 Un día más siendo alguien sereno.`

### Los cuatro hitos

Se calculan en `habit-identity.utils.ts` como **funciones puras sobre datos que ya llegan** (`streak`, `maxStreak`, `days`, `restartCount` y los follow-ups de la semana). Con tests.

| Hito | Condición | Encabezado |
|---|---|---|
| `racha7` | `streak === 7` | «Séptimo día seguido» |
| `record` | `streak === maxStreak && streak > 3` | «Tu mejor racha hasta hoy» |
| `mes` | Primer día del mes y `days >= 60` | «Tres meses con esto» |
| `regreso` | Primer día cumplido tras ≥ 7 días sin cumplir, con `restartCount > 0` | «Volviste, y eso también dice algo» |

**Las reglas de silencio son parte de la funcionalidad, no un detalle de implementación.** Si esto aparece a diario deja de ser un hito y se convierte en ruido, que es otra forma de morir:

- Solo para hábitos **sin propósito asignado** (`purposeId === null`). Con propósito, no se pregunta nada.
- **Como mucho un hito visible a la vez** en toda la pantalla. Si dos hábitos lo disparan el mismo día, gana el de racha más larga.
- **Como mucho uno por semana**, aunque haya hitos de sobra.
- Tras un «Ahora no», **silencio de 14 días** para ese hábito.
- Tras un «No me suena» en Mi Persona, ese rasgo concreto no se vuelve a proponer.

### La regla innegociable

**El propósito aparece al empezar y al lograr. Nunca al fallar.** La culpa es el mejor predictor de abandono que hay: quien se siente juzgado no deja el hábito, deja la app.

En la práctica, para el constructor:

- Una fila **cumplida** puede mostrar la línea de identidad (`Un día más siendo alguien sereno`).
- Una fila **sin marcar al empezar el día** puede mostrarla en tono neutro.
- Una fila **fallada, o con la racha rota, o con salvavidas gastado**, habla de la racha y del salvavidas y **de nada más**: «Un mal día no borra 34. Te queda 1 salvavidas esta semana.» Ni una palabra de identidad, ni el nombre del propósito, ni el icono.

Si alguna vista deja escapar el propósito en un estado de fallo, la fase está mal construida aunque todo lo demás funcione.

### Mi Persona

Reescritura completa de `HabitPersonaPage`. Fuera el `DndContext`, fuera `PersonaColumn`, fuera «Nuevo propósito» como acción principal. De arriba abajo:

**1 · El retrato.** Una frase compuesta con los registros, no escrita por el usuario:

> Alguien **sereno** que medita casi todas las mañanas, que **lee** antes de dormir y que lleva **18 días** sin tocar el móvil al despertar.
>
> 📊 Compuesto con 214 registros entre el 20 de junio y el 18 de septiembre

La compone una función pura a partir de los rasgos ganados y sus hábitos. Con menos de dos rasgos ganados, en vez del retrato va la línea honesta: *«Todavía no hay suficientes registros para decir quién eres. Sigue marcando; la app te lo dirá cuando lo sepa.»*

**2 · Rasgos.** Rejilla de tres, con tres estados visualmente distintos:

- **Ganado** — nombre, fecha en que se ganó, la evidencia que lo ganó y el hábito que lo sostiene.
- **Propuesto** — con acento violeta y dos botones: «Sí, soy eso» / «No me suena».
- **En camino** — atenuado, con barra de progreso y lo que falta: *«Cuatro de los últimos siete días. Faltan 3 para que esto se convierta en un rasgo que puedas reclamar.»* Este estado es el que hace que la pantalla dé ganas de volver a mirarla.

**3 · Mis compromisos.** Las frases de intención de la fase 6, leídas de `description` con `parseIntention`, cada una con su cumplimiento reciente («Cumplido 34 de los últimos 40 días») y un enlace a editar. Un hábito sin intención aparece atenuado con *«Leer todavía no tiene un momento fijo del día»* y el enlace «Ponerle uno», que abre la edición de ese hábito.

**4 · Lo que dejo atrás.** Los hábitos con `shouldAvoid`, medidos en días sin caer y con la mejor marca.

**5 · Al pie, discreto.** *«Tienes 4 propósitos que escribiste antes y ningún hábito ha llegado a ganar.»* con «Verlos», que despliega la lista con opción de borrarlos o enlazarlos a un hábito. Ahí vive también «Escribir un propósito a mano».

### Dónde se guarda lo que se gana

**En `HabitPurpose.description`, sin tocar el backend.** Mismo criterio que la frase de intención en la fase 6: si al usarlo demuestra valer la pena, entonces se le hace un campo propio en `xavi-platform-node` con esa certeza.

Formato: **la primera línea** es la evidencia, con forma fija; **lo que venga tras una línea en blanco es texto libre del usuario y no se toca jamás**.

```
Ganado el 2026-08-12 · racha7 · 7 días seguidos

(cualquier cosa que el usuario hubiera escrito, intacta)
```

- Si la primera línea no encaja con el patrón, **todo** el contenido es texto libre: se muestra tal cual y el rasgo se pinta como ganado sin fecha. **Nunca se reescribe.**
- Al descartar un rasgo propuesto no se borra ningún `HabitPurpose` existente — no había ninguno que borrar; solo se anota el descarte.
- Los descartes («ahora no», «no me suena») viven en `localStorage` mediante `src/features/habits/store/habit-identity.store.ts`. **Limitación aceptada y que hay que escribir en el reporte:** no viaja entre dispositivos. Es un piloto; la alternativa era un campo de backend por un dato que quizá se tire.

### Qué cambia en el wizard (fase 6)

Un solo cambio, quirúrgico: el bloque «¿A quién te acerca este hábito?» del paso 3 **deja de ofrecer crear un propósito nuevo**. Sigue dejando elegir uno existente, por si el usuario ya sabe cuál es, y añade bajo las píldoras:

> *La app te propondrá uno cuando lleves unos días. No hace falta que lo decidas ahora.*

`CreateHabitPurposeStep` **no se borra**: se sigue usando desde Mi Persona para la creación manual.

## Datos

- **Queries:** `useHabitMyDayQuery`, `useHabitsQuery`, `useHabitPurposesQuery`, `useHabitFollowUpsInDatesQuery` — todas existentes.
- **Mutations:** `useCreateHabitPurposeMutation`, `useUpdateHabitPurposeMutation`, `useRemoveHabitPurposeMutation`, `useUpdateHabitMutation` (para `purposeId`). Sin cambios.
- **Nada nuevo en la API.** Si algo de esta spec parece necesitarlo, es que hay que resolverlo en cliente o reportarlo como bloqueo.

## Criterios de aceptación

- [ ] Al cumplir el séptimo día seguido de un hábito sin propósito, aparece el hito **bajo esa fila** en Mi Día, fiel a `assets/06-mi-persona.html`
- [ ] El hito ofrece **exactamente tres** identidades, más «Escribir la mía» y «Ahora no»
- [ ] Elegir una píldora crea el propósito y lo enlaza al hábito **en un solo toque**, sin modal ni confirmación
- [ ] «Ahora no» cierra sin penalizar y no vuelve a aparecer para ese hábito en 14 días
- [ ] Nunca se ve más de un hito a la vez, ni más de uno por semana
- [ ] Un hábito que ya tiene propósito **no dispara ningún hito**
- [ ] En un día fallado, con la racha rota o con salvavidas gastado, **no aparece el propósito por ninguna parte**
- [ ] Mi Persona ya no tiene columnas ni arrastre, y muestra retrato, rasgos, compromisos y lo que dejo atrás
- [ ] Un rasgo propuesto en Mi Persona se confirma o se descarta desde la propia tarjeta
- [ ] El estado «en camino» muestra cuánto falta, calculado con datos reales
- [ ] Un `HabitPurpose` con descripción libre previa se muestra **sin perder su texto** y sin reescribirlo
- [ ] La evidencia se compone y se analiza con tests, incluidos los casos feos: descripción vacía, texto libre que empieza por «Ganado», fecha inválida, varias líneas en blanco
- [ ] Con menos de dos rasgos ganados, el retrato se sustituye por la línea honesta en vez de inventarse una frase
- [ ] El wizard ya no ofrece crear propósito nuevo, pero sigue dejando elegir uno existente
- [ ] Todo se recorre con teclado y el hito se anuncia a lectores de pantalla al aparecer
- [ ] Funciona en tema claro y oscuro
- [ ] Funciona a ~375px, con el hito como hoja inferior descartable deslizando
- [ ] Estados vacío, cargando y error resueltos en Mi Persona

## Notas para el constructor

- **Empieza por la maqueta.** `docs/remodel/assets/06-mi-persona.html` tiene los seis marcos, incluido el oscuro y el móvil.
- **La microcopia está escrita a propósito** — el encabezado del hito, la pregunta, la nota de «esto no es un contrato», la línea honesta del retrato y la frase del día fallado. Cópiala literal; si algo no cabe, dilo en el reporte en vez de reescribirla.
- La detección de hitos, la composición y el análisis de la evidencia van en `habit-identity.utils.ts` como **funciones puras con tests**, nunca dentro de un componente.
- **Nada de expresiones regulares frágiles** para analizar `description`: acota el patrón a la primera línea y, ante la duda, trátalo como texto libre. **Perder lo que escribió el usuario es el peor fallo posible de esta spec**, igual que en la fase 6.
- El catálogo de identidades es un **archivo de datos**, no un componente. Propón por palabras clave del nombre del hábito y por categoría, con un fallback genérico decente («Alguien constante», «Alguien que cumple lo que dice», «Alguien que se cuida»). Tres siempre, nunca menos.
- Reutiliza `Drawer` para la hoja móvil, `GlassPanel`/`Card` para las superficies y `AppIcon` para los iconos. No inventes superficies nuevas.
- `PersonaColumn` y su uso de `@dnd-kit` desaparecen **de esta pantalla**. No quites la dependencia del `package.json`: se usa en otros módulos.
- Al terminar, `graphify update .`
