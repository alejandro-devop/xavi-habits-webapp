import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import type { PaletteColor } from './color-palette'
import { PALETTE_COLORS, findPaletteColor, normalizeColor } from './color-palette'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './ColorPicker.module.scss'

type Props = {
  value: string | null
  onChange: (hex: string) => void
  disabled?: boolean
  /** Lo que se anuncia al entrar en el grupo. */
  label?: string
  className?: string
}

/**
 * Diecisiete muestras y nada más. La rueda de color del sistema rompía el
 * lenguaje Aura en mitad del formulario, se veía distinta en cada plataforma y
 * ofrecía dieciséis millones de opciones para una decisión que no las necesita.
 *
 * Primero los seis del núcleo y detrás los once extendidos, en el orden de la
 * paleta. Es un grupo de radios de verdad: se recorre con flechas y cada
 * muestra se anuncia **con su nombre en español**, que es justo lo que hace
 * legítimo que dos extendidos se parezcan entre sí.
 *
 * Era `HabitColorPicker`. Se mudó a `shared/ui` en FEAT-002 (tajada 2), cuando
 * el catálogo de Vida pidió el mismo selector para el color de una categoría.
 */
export function ColorPicker({
  value,
  onChange,
  disabled = false,
  label = 'Color',
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedHex = normalizeColor(value)
  const known = findPaletteColor(selectedHex)

  // Algo creado antes de esta paleta puede llevar un color de fuera. No se le
  // quita ni se le cambia a escondidas: se enseña tal cual, al principio de la
  // fila, para que se vea que ya tiene uno.
  // Se comporta como un extendido: se enseña y se puede elegir, pero nunca
  // entra en el sorteo —ni siquiera es de la paleta—.
  const legacy: PaletteColor | null =
    selectedHex && !known
      ? { name: 'current', label: 'Color actual', hex: selectedHex, tier: 'extended' }
      : null

  const options: PaletteColor[] = legacy ? [legacy, ...PALETTE_COLORS] : [...PALETTE_COLORS]

  const selectedIndex = options.findIndex((option) => option.hex === selectedHex)
  // Sin selección, el primero es el que recibe el tabulador: entrar al grupo
  // nunca debe costar diecisiete tabulaciones.
  const focusableIndex = selectedIndex >= 0 ? selectedIndex : 0

  function focusAt(index: number) {
    const buttons = rootRef.current?.querySelectorAll<HTMLButtonElement>('[data-color-swatch]')
    buttons?.[index]?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()

    const last = options.length - 1
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? (index + 1) % options.length
            : (index - 1 + options.length) % options.length

    onChange(options[next].hex)
    focusAt(next)
  }

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={label}
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      {options.map((option, index) => {
        const isSelected = option.hex === selectedHex
        return (
          <button
            key={option.name}
            type="button"
            role="radio"
            data-color-swatch={option.hex}
            aria-checked={isSelected}
            aria-label={option.label}
            title={option.label}
            tabIndex={index === focusableIndex ? 0 : -1}
            disabled={disabled}
            className={[styles.swatch, isSelected ? styles.swatchSelected : '']
              .filter(Boolean)
              .join(' ')}
            style={{ '--color-picker-swatch': option.hex } as CSSProperties}
            onClick={() => onChange(option.hex)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className={styles.check} aria-hidden="true">
              <AppIcon name="check" size="sm" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
