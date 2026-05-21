import {
  faCashRegister,
  faChartLine,
  faChartPie,
  faCoins,
  faCreditCard,
  faMoneyBill,
  faPiggyBank,
  faReceipt,
  faSackDollar,
  faWallet,
} from '@fortawesome/free-solid-svg-icons'
import type { AppIconEntry } from '@/shared/icons/types'

export const financeIcons = [
  { name: 'wallet', label: 'Cartera', category: 'finance', icon: faWallet, keywords: ['dinero', 'finanzas', 'money', 'budget'] },
  { name: 'piggy-bank', label: 'Ahorro', category: 'finance', icon: faPiggyBank, keywords: ['ahorro', 'meta', 'savings'] },
  { name: 'money-bill', label: 'Efectivo', category: 'finance', icon: faMoneyBill, keywords: ['cash', 'billete', 'pago'] },
  { name: 'credit-card', label: 'Tarjeta', category: 'finance', icon: faCreditCard, keywords: ['pago', 'banco', 'card'] },
  { name: 'chart-line', label: 'Gráfica', category: 'finance', icon: faChartLine, keywords: ['stats', 'métricas', 'inversión', 'tendencia'] },
  { name: 'chart-pie', label: 'Gráfico circular', category: 'finance', icon: faChartPie, keywords: ['presupuesto', 'distribución', 'analytics'] },
  { name: 'receipt', label: 'Recibo', category: 'finance', icon: faReceipt, keywords: ['gasto', 'factura', 'expense'] },
  { name: 'coins', label: 'Monedas', category: 'finance', icon: faCoins, keywords: ['ahorro', 'coins', 'dinero'] },
  { name: 'sack-dollar', label: 'Ahorros', category: 'finance', icon: faSackDollar, keywords: ['bolsa', 'inversión', 'wealth'] },
  { name: 'cash-register', label: 'Caja', category: 'finance', icon: faCashRegister, keywords: ['ventas', 'tienda', 'negocio'] },
] as const satisfies readonly AppIconEntry[]
