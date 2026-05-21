import { useState } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import { IconPicker } from '@/shared/ui/IconPicker'
import { SearchSelect, type SearchSelectOption } from '@/shared/ui/SearchSelect'
import { Section } from '@/shared/ui/Section'
import { Stack } from '@/shared/layout'

const DEMO_OPTIONS: SearchSelectOption[] = [
  { label: 'Meditación', value: 'meditation', description: '5 min al día', icon: <AppIcon name="brain" /> },
  { label: 'Correr', value: 'run', description: 'Mañanas', icon: <AppIcon name="running" /> },
  { label: 'Leer', value: 'read', icon: <AppIcon name="book" /> },
  { label: 'Ahorro', value: 'save', description: 'Meta mensual', icon: <AppIcon name="piggy-bank" /> },
  { label: 'Gym', value: 'gym', icon: <AppIcon name="dumbbell" /> },
]

export function AdvancedFormsSection() {
  const [selectValue, setSelectValue] = useState<string | null>('meditation')
  const [iconValue, setIconValue] = useState<string | null>('bell')

  return (
    <Section
      id="advanced-forms"
      title="Advanced Forms"
      description="SearchSelect, IconPicker y AppIcon"
    >
      <Stack gap="lg">
        <SearchSelect
          label="Hábito (demo)"
          placeholder="Elige un hábito…"
          value={selectValue}
          options={DEMO_OPTIONS}
          onChange={(v) => setSelectValue(v)}
          clearable
          helperText="Búsqueda local por label, value y description"
        />
        <SearchSelect
          label="Con error"
          value={null}
          options={DEMO_OPTIONS}
          onChange={() => {}}
          error="Selección obligatoria"
          disabled
        />
        <IconPicker
          label="Icono del hábito"
          value={iconValue}
          onChange={setIconValue}
          clearable
          helperText="Valor guardado: solo el nombre (ej. bell)"
        />
        {iconValue ? (
          <p>
            Preview: <AppIcon name={iconValue} size="lg" /> — almacenado como{' '}
            <code>{iconValue}</code>
          </p>
        ) : null}
      </Stack>
    </Section>
  )
}
