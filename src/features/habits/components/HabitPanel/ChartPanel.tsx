import type { ReactNode } from 'react'
import styles from './charts.module.scss'

export type ChartTable = {
  caption: string
  columns: string[]
  rows: Array<{ key: string; cells: string[] }>
}

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  legend?: ReactNode
  /**
   * Cada gráfico lleva su tabla de datos oculta visualmente: mismos números que
   * dibuja, para el lector de pantalla y para quien no distingue los tonos.
   */
  table: ChartTable
}

export function ChartPanel({ title, subtitle, children, legend, table }: Props) {
  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>{title}</h3>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      <div className={styles.plot}>{children}</div>
      {legend}
      <div className={styles.srOnly}>
        <table>
          <caption>{table.caption}</caption>
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.key}>
                {row.cells.map((cell, index) =>
                  index === 0 ? (
                    <th key={index} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={index}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function ChartLegend({ items }: { items: Array<{ label: string; variant: string }> }) {
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.label} className={styles.legendItem}>
          <span
            className={[styles.swatch, styles[item.variant]].filter(Boolean).join(' ')}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
