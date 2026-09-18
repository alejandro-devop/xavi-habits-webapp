# Spec — Fase 9: El color del hábito viene puesto

> **Estado:** lista para construir
> **Depende de:** `05-wizard-habito.spec.md`. Toca el paso 1 del wizard.
> **Pedida por el usuario el 2026-09-18:** «Randomizar los colores para los hábitos, dejar que el usuario seleccione, pero inicialmente sí setearle un color inicial random».

## Objetivo

Al crear un hábito, el color llega **ya puesto** —uno de la paleta Aura, elegido al azar entre los que no estás usando— y se cambia con un toque si no gusta. Elegir color en frío es una microdecisión que frena en un momento en que solo quieres empezar; y un campo que casi nadie rellena deja todos los hábitos del mismo color, que es justo lo que vuelve ilegible la rejilla de Mis Hábitos.

## El hallazgo que amplía el alcance

La fase 6 decía «nombre con selector de icono y color **en píldoras**». Se construyó con **la rueda de color nativa del sistema**:

```tsx
// HabitWizardStep1.tsx:81
<input type="color" value={values.color ?? '#10b981'} onChange={...} />
```

Eso son 16 millones de opciones para una decisión que no importa tanto, con un diálogo del sistema operativo que **rompe el lenguaje Aura** en mitad del wizard, se ve distinto en cada plataforma y en móvil es especialmente hostil. Y no guarda nada: `defaultFormValues` deja `color: null`, así que el `#10b981` que se ve es una mentira visual — el hábito se crea **sin color**.

Por eso esta fase hace las dos cosas juntas, que son la misma: **paleta de píldoras + preselección aleatoria**. Sortear un color y seguir enseñando la rueda del sistema no resolvería nada.

## Fuera de alcance

- **Backend.** `color` ya existe y es texto; nada que cambiar.
- **Recolorear los hábitos que ya existen.** Un hábito sin color se queda sin color hasta que su dueño le ponga uno. No se toca lo ya creado.
- **El color de categorías, medidas y propósitos.** Se hará igual cuando toque, pero no aquí.
- **Editar un hábito.** La edición **nunca** cambia el color: ver la regla de abajo.

## Diseño

### La paleta

`src/features/habits/data/habit-colors.ts`, datos puros:

**Ocho colores**, derivados del lenguaje Aura, no inventados: mint, violeta, ámbar, cielo, rosa, lima, coral e índigo. Ocho es el número: suficientes para distinguir una rejilla de hábitos de un vistazo, pocos para que quepan en una fila sin desplegar nada.

Cada entrada lleva `name` (identificador estable), `label` en español (`'Menta'`, `'Violeta'`) y `hex`.

**Cada color tiene que ser legible sobre vidrio en tema claro y en oscuro.** Es el criterio que manda al elegir los tonos; un color que se pierde sobre el vidrio oscuro no entra en la paleta aunque sea bonito en claro.

### Las píldoras

Sustituyen al `<input type="color">` en el paso 1 del wizard y en el formulario de edición: una fila de ocho muestras redondas, la activa con anillo y marca de verificación, cada una con su `aria-label` en español. Recorrido con flechas, como una lista de opciones.

**La rueda del sistema no vuelve.** Si alguien quiere un color exacto, esa es otra fase y otra conversación.

### El sorteo

Cuatro reglas. Las cuatro son la diferencia entre que se sienta bien y que moleste:

1. **Se sortea una sola vez**, al abrir el wizard. Si el color cambiara en cada render, parpadearía con cada tecla del nombre. Sortear dentro del `useState` inicial, nunca en el cuerpo del componente.
2. **Preferir un color que no estén usando ya** los hábitos activos del usuario. Solo cuando los ocho estén cogidos se vuelve a repetir, y entonces se elige **el menos usado**. Un sorteo puramente aleatorio repite colores enseguida, y el objetivo era distinguir la rejilla.
3. **La plantilla manda.** Las plantillas de la fase 6 traen color propio: aplicar una **sustituye** el color sorteado, sin avisar. El sorteo es un valor por defecto, no una elección del usuario.
4. **Solo al crear.** `defaultFormValues(habit)` con un hábito existente devuelve `habit.color` tal cual, incluido `null`. Abrir la edición no le inventa un color a nada.

### Dónde entra

`defaultFormValues()` es una **función pura y hay que dejarla pura**: el sorteo se le pasa desde fuera, no se llama a `Math.random()` dentro.

```ts
// habit-colors.ts
export function pickInitialHabitColor(
  usedColors: readonly (string | null)[],
  random: () => number = Math.random,
): string
```

El parámetro `random` inyectable es lo que hace que esto se pueda testear de verdad: con un generador fijo, el resultado es predecible.

## Criterios de aceptación

- [ ] Abrir el wizard de creación muestra un color **ya seleccionado** de la paleta
- [ ] El color elegido se guarda: el hábito creado sin tocar el color **tiene color**, no `null`
- [ ] El color no cambia mientras se rellena el formulario (escribir el nombre no lo hace parpadear)
- [ ] Con menos de ocho colores en uso, el sorteado **no es ninguno de los que ya usan** los hábitos activos
- [ ] Con los ocho en uso, sale el menos usado
- [ ] Aplicar una plantilla con color propio sustituye al sorteado
- [ ] Abrir la edición de un hábito sin color **no le asigna uno**
- [ ] Abrir la edición de un hábito con color muestra el suyo seleccionado
- [ ] El `<input type="color">` ya no aparece en ninguna parte del módulo de hábitos
- [ ] Las píldoras se recorren con teclado y cada una se anuncia con su nombre en español
- [ ] Los ocho colores se distinguen sobre vidrio en tema claro **y** oscuro — comprobado a ojo en ambos
- [ ] `pickInitialHabitColor` tiene tests con generador fijo: sin colores usados, con algunos, con los ocho, y con `null` mezclados en la lista
- [ ] Funciona a ~375px sin que las ocho píldoras desborden

## Notas para el constructor

- La paleta es un **archivo de datos**, no un componente.
- Ojo con el caso de la lista de usados: llega con `null` y con mayúsculas/minúsculas mezcladas (`#10B981` vs `#10b981`). Normaliza antes de comparar o la regla de «no repetir» no servirá de nada.
- Las píldoras de color y las de icono comparten sitio en el paso 1: míralo a 375px, que es donde se rompe.
- Reutiliza lo que haya en `shared/ui` antes de inventar una píldora nueva. Si no encaja nada, el componente nuevo va en `src/features/habits/components/` porque es del dominio, no en `shared/ui`.
- No añadas dependencias.
- Al terminar, `graphify update .`
