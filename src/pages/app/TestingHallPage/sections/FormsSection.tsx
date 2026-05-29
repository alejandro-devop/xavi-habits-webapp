import { useState } from 'react'
import {
  Card,
  Checkbox,
  FormField,
  Input,
  MarkdownEditor,
  Section,
  Select,
  Switch,
  Textarea,
} from '@/shared/ui'
const SELECT_OPTIONS = [
  { value: 'habits', label: 'Hábitos' },
  { value: 'courses', label: 'Cursos' },
  { value: 'activities', label: 'Actividades' },
]

export function FormsSection() {
  const [switchOn, setSwitchOn] = useState(false)
  const [selectValue, setSelectValue] = useState('')
  const [textarea, setTextarea] = useState('')
  const [markdown, setMarkdown] = useState('# Hola\n\nTexto **negrita** y *cursiva*.\n\n- Item uno\n- Item dos')

  return (
    <Section id="forms" title="Forms" description="Controles de formulario">
      <Card padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <FormField id="th-input" label="Input" helperText="Con FormField" defaultValue="" />
          <Input placeholder="Input suelto" aria-label="Input suelto" />
          <Textarea
            id="th-textarea"
            label="Textarea"
            value={textarea}
            onChange={(e) => setTextarea(e.target.value)}
            helperText="Con contador de caracteres"
            maxLength={120}
            showCount
          />
          <div>
            <p style={{ margin: '0 0 var(--spacing-xs)', fontWeight: 600 }}>MarkdownEditor</p>
            <MarkdownEditor
              value={markdown}
              onChange={setMarkdown}
              savedValue={markdown}
              maxLength={500}
              placeholder="Prueba el editor…"
            />
          </div>
          <Select
            id="th-select"
            label="Select"
            placeholder="Elige una opción"
            options={SELECT_OPTIONS}
            value={selectValue}
            onChange={setSelectValue}
            helperText="Select nativo estilizado"
          />
          <Select
            id="th-select-error"
            label="Select con error"
            options={SELECT_OPTIONS}
            value=""
            error="Selección obligatoria"
          />
          <Checkbox id="th-check" label="Checkbox" description="Descripción opcional" defaultChecked />
          <Checkbox id="th-check-error" label="Checkbox con error" error="Debes aceptar" />
          <Switch
            id="th-switch"
            label="Switch"
            description="Notificaciones activas"
            checked={switchOn}
            onChange={(e) => setSwitchOn(e.target.checked)}
          />
          <Switch id="th-switch-off" label="Switch deshabilitado" disabled />
        </div>
      </Card>
    </Section>
  )
}
