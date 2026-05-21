import { useState } from 'react'
import { Badge, Button, EmptyState, Section, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui'
import styles from '../TestingHallPage.module.scss'

const MOCK_ROWS = [
  { id: '1', name: 'Meditar', status: 'Completado' },
  { id: '2', name: 'Leer 20 min', status: 'Pendiente' },
  { id: '3', name: 'Ejercicio', status: 'Completado' },
]

export function DataDisplaySection() {
  const [showEmpty, setShowEmpty] = useState(false)
  const [loading, setLoading] = useState(false)
  const rows = showEmpty ? [] : MOCK_ROWS

  return (
    <Section id="data-display" title="Data display" description="Table y badges">
      <div className={styles.row}>
        <Badge>Neutral</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
      </div>

      <div className={styles.row}>
        <Button size="sm" variant="secondary" onClick={() => setShowEmpty((v) => !v)}>
          Toggle empty
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setLoading((v) => !v)}>
          Toggle loading
        </Button>
      </div>

      <Table
        caption="Hábitos de ejemplo"
        isLoading={loading}
        empty={
          rows.length === 0 ? (
            <EmptyState title="Sin hábitos" description="Añade tu primer hábito para empezar." icon="○" />
          ) : undefined
        }
      >
        {rows.length > 0 ? (
          <>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead sortable sortDirection="asc" onSort={() => undefined}>
                  Ordenable
                </TableHead>
                <TableHead align="end">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'Completado' ? 'success' : 'warning'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>—</TableCell>
                  <TableCell align="end">
                    <Button size="sm" variant="ghost">
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </>
        ) : null}
      </Table>
    </Section>
  )
}
