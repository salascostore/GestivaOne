import { useMemo, useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { DollarSign, FileText, Clock, CheckCircle, Users, TrendingUp, AlertTriangle, Lock, Package, Calendar, Coins, Download, Plus, Trash2, Zap } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, LineChart, Line, Legend
} from 'recharts'
import { format, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import KPICard from '@/components/ui/KPICard'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useClientStore } from '@/store/useClientStore'
import { useProductStore } from '@/store/useProductStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useAuthStore, ROLES, PLANS } from '@/store/useAuthStore'
import { useExpenseStore } from '@/store/useExpenseStore'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.08,
      delayChildren: 0.1
    } 
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring', 
      stiffness: 260, 
      damping: 25 
    } 
  }
}

const CustomTooltip = ({ active, payload, label, formatFn }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass border border-subtle rounded-xl px-3.5 py-2.5 text-xs space-y-1 min-w-[140px]">
      <p className="text-muted-400 font-bold mb-1 border-b border-subtle pb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.stroke || p.color }} />
            {p.name === 'revenue' || p.name === 'Revenue' ? 'Recaudado:' : 'Pendiente:'}
          </span>
          <span className="text-white font-bold">{formatFn(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// Local helper to parse note payment data for partial payments
function parseInvoiceNoteLocal(note) {
  if (!note) return { text: '', payments: [], paidAmount: 0 }
  try {
    if (note.trim().startsWith('{') && note.trim().endsWith('}')) {
      const parsed = JSON.parse(note)
      if (parsed && (parsed.payments || parsed.notes !== undefined)) {
        const payments = parsed.payments || []
        const paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        return {
          text: parsed.notes || '',
          payments,
          paidAmount
        }
      }
    }
  } catch (e) {}
  return { text: note, payments: [], paidAmount: 0 }
}

export default function Dashboard() {
  const invoices    = useInvoiceStore((s) => s.invoices)
  const clients     = useClientStore((s) => s.clients)
  const products    = useProductStore((s) => s.products)
  const user        = useAuthStore((s) => s.user)
  const format$     = useCurrencyStore((s) => s.format)
  const checkOverdue = useInvoiceStore((s) => s.checkOverdue)

  const rawExpenses   = useExpenseStore((s) => s.expenses)
  const addExpense    = useExpenseStore((s) => s.addExpense)
  const deleteExpense = useExpenseStore((s) => s.deleteExpense)

  const expenses = useMemo(() => {
    const companyId = user?.companyId || 'demo-company'
    return rawExpenses.filter((e) => e.company_id === companyId)
  }, [rawExpenses, user?.companyId])

  // Expense form state
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('Inventario/Mercancía')
  const [expDesc, setExpDesc] = useState('')

  // React state variables defined at the very top of the component to prevent TDZ errors
  const [selectedYears, setSelectedYears] = useState([new Date().getFullYear().toString()])
  const [hoveredKpi, setHoveredKpi] = useState(null)
  const [activeCatIndex, setActiveCatIndex] = useState(null)
  const hoverTimeoutRef = useRef(null)

  const handleKpiMouseEnter = (index) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredKpi(index)
    }, 500)
  }

  const handleKpiMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setHoveredKpi(null)
  }

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [chartView, setChartView] = useState('monthly')
  const [revenueYearFilter, setRevenueYearFilter] = useState(new Date().getFullYear().toString())

  const role = user?.role || 'administrador'
  const canView = ROLES[role]?.permissions?.dashboard ?? true

  // Auto check overdue on mount
  useEffect(() => { checkOverdue() }, [])

  const paid    = invoices.filter((i) => i.payment_status === 'paid')
  const pending = invoices.filter((i) => i.payment_status === 'pending')
  const overdue = invoices.filter((i) => i.payment_status === 'overdue')

  // Express Invoices metrics
  const expressInvoices = invoices.filter((i) => !i.client_id || i.client_name === 'Cliente Express')
  const expressCount = expressInvoices.length
  const expressRevenue = expressInvoices.reduce((s, i) => s + (i.total || 0), 0)

  const totalRevenue   = paid.reduce((s, i) => s + i.total, 0)
  const pendingRevenue = [...pending, ...overdue].reduce((s, i) => s + i.total, 0)
  const totalExpenses  = expenses.reduce((s, e) => s + (e.amount || 0), 0)

  // Monthly chart — last 6 months
  const monthlyData = useMemo(() => {
    const filteredPaid = revenueYearFilter === 'all'
      ? paid
      : paid.filter(i => i.created_at && i.created_at.startsWith(revenueYearFilter))
    
    const filteredPending = revenueYearFilter === 'all'
      ? [...pending, ...overdue]
      : [...pending, ...overdue].filter(i => i.created_at && i.created_at.startsWith(revenueYearFilter))

    const referenceDate = (revenueYearFilter !== 'all' && revenueYearFilter !== new Date().getFullYear().toString())
      ? new Date(Number(revenueYearFilter), 11, 31) // December 31 of selected year
      : new Date()

    return Array.from({ length: 6 }, (_, idx) => {
      const date = subMonths(referenceDate, 5 - idx)
      const key  = format(date, 'yyyy-MM')
      
      const revenueAmt = filteredPaid
        .filter((i) => i.created_at && i.created_at.startsWith(key))
        .reduce((s, i) => s + i.total, 0)

      const pendingAmt = filteredPending
        .filter((i) => i.created_at && i.created_at.startsWith(key))
        .reduce((s, i) => {
          const { paidAmount } = parseInvoiceNoteLocal(i.note)
          return s + (i.total - paidAmount)
        }, 0)

      const expenseAmt = expenses
        .filter((e) => e.created_at && e.created_at.startsWith(key))
        .reduce((s, e) => s + (e.amount || 0), 0)

      return {
        month: format(date, 'MMM', { locale: es }).toUpperCase(),
        revenue: revenueAmt,
        pending: pendingAmt,
        expenses: expenseAmt,
        netProfit: revenueAmt - expenseAmt
      }
    })
  }, [paid, pending, overdue, expenses, revenueYearFilter])

  // Dynamic aggregations from invoices to keep dashboard charts populated and auto-updated
  const clientInvoiceStats = useMemo(() => {
    const stats = {}
    invoices.forEach((inv) => {
      if (inv.client_id) {
        if (!stats[inv.client_id]) {
          stats[inv.client_id] = { count: 0, revenue: 0 }
        }
        stats[inv.client_id].count += 1
        stats[inv.client_id].revenue += (inv.total || 0)
      }
    })
    return stats
  }, [invoices])

  const productSalesStats = useMemo(() => {
    const stats = {}
    invoices.forEach((inv) => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          if (item.productId) {
            stats[item.productId] = (stats[item.productId] || 0) + (item.qty || 0)
          }
        })
      }
    })
    return stats
  }, [invoices])

  // Top clients
  const topClients = useMemo(() => {
    return [...clients]
      .map((c) => {
        const cStats = clientInvoiceStats[c.id] || { count: 0, revenue: 0 }
        return {
          ...c,
          invoiceCount: cStats.count,
          totalRevenue: cStats.revenue
        }
      })
      .filter((c) => c.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)
  }, [clients, clientInvoiceStats])

  // Top products — use stable selector, compute in memo
  const topProducts = useMemo(() => {
    return [...products]
      .map((p) => ({
        ...p,
        salesCount: productSalesStats[p.id] || 0
      }))
      .filter((p) => p.salesCount > 0)
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5)
  }, [products, productSalesStats])

  const overdueList = useMemo(() =>
    overdue
      .map((inv) => ({
        ...inv,
        days: Math.max(0, Math.floor((Date.now() - new Date(inv.scheduled_date || inv.created_at)) / 86400000))
      }))
      .sort((a, b) => b.days - a.days),
  [overdue])

  const categoryData = useMemo(() => {
    const counts = {}
    products.forEach((p) => {
      const cat = p.category || 'Otros'
      const sold = productSalesStats[p.id] || 0
      counts[cat] = (counts[cat] || 0) + sold
    })
    const colors = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']
    return Object.entries(counts)
      .map(([name, value], idx) => ({ name, value, fill: colors[idx % colors.length] }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [products, productSalesStats])



  // Get all unique years from invoices to populate year filter options dynamically
  const availableYears = useMemo(() => {
    const years = new Set()
    invoices.forEach((inv) => {
      if (inv.created_at) {
        const y = new Date(inv.created_at).getFullYear().toString()
        years.add(y)
      }
    })
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString())
    }
    return Array.from(years).sort()
  }, [invoices])

  const toggleYear = (yr) => {
    setSelectedYears((prev) => {
      if (prev.includes(yr)) {
        if (prev.length === 1) return prev // Keep at least one year selected
        return prev.filter((y) => y !== yr)
      } else {
        return [...prev, yr].sort()
      }
    })
  }

  // Memoized line chart data
  const advancedChartData = useMemo(() => {
    const filteredInvoices = invoices.filter((inv) => {
      if (!inv.created_at) return false
      const y = new Date(inv.created_at).getFullYear().toString()
      return selectedYears.includes(y)
    })

    if (chartView === 'monthly') {
      const data = Array.from({ length: 31 }, (_, i) => ({
        label: `${i + 1}`,
        reconocidas: 0,
        pendientes: 0,
        atrasadas: 0,
      }))

      filteredInvoices.forEach((inv) => {
        const d = new Date(inv.created_at)
        if (d.getMonth() === selectedMonth) {
          const dayIdx = d.getDate() - 1
          if (dayIdx >= 0 && dayIdx < 31) {
            const { paidAmount } = parseInvoiceNoteLocal(inv.note)
            if (inv.payment_status === 'paid') {
              data[dayIdx].reconocidas += inv.total
            } else if (inv.payment_status === 'overdue') {
              data[dayIdx].atrasadas += (inv.total - paidAmount)
              data[dayIdx].reconocidas += paidAmount
            } else {
              data[dayIdx].pendientes += (inv.total - paidAmount)
              data[dayIdx].reconocidas += paidAmount
            }
          }
        }
      })
      return data

    } else if (chartView === 'semesterly') {
      const data = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        data.push({
          dateObj: d,
          label: format(d, 'MMM', { locale: es }).toUpperCase(),
          reconocidas: 0,
          pendientes: 0,
          atrasadas: 0,
        })
      }

      invoices.forEach((inv) => {
        if (!inv.created_at) return
        const date = new Date(inv.created_at)
        const yStr = date.getFullYear().toString()
        if (!selectedYears.includes(yStr)) return

        data.forEach((m) => {
          if (
            date.getFullYear() === m.dateObj.getFullYear() &&
            date.getMonth() === m.dateObj.getMonth()
          ) {
            const { paidAmount } = parseInvoiceNoteLocal(inv.note)
            if (inv.payment_status === 'paid') {
              m.reconocidas += inv.total
            } else if (inv.payment_status === 'overdue') {
              m.atrasadas += (inv.total - paidAmount)
              m.reconocidas += paidAmount
            } else {
              m.pendientes += (inv.total - paidAmount)
              m.reconocidas += paidAmount
            }
          }
        })
      })
      return data

    } else {
      const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
      const data = months.map((m) => ({
        label: m,
        reconocidas: 0,
        pendientes: 0,
        atrasadas: 0,
      }))

      filteredInvoices.forEach((inv) => {
        const d = new Date(inv.created_at)
        const monthIdx = d.getMonth()
        if (monthIdx >= 0 && monthIdx < 12) {
          const { paidAmount } = parseInvoiceNoteLocal(inv.note)
          if (inv.payment_status === 'paid') {
            data[monthIdx].reconocidas += inv.total
          } else if (inv.payment_status === 'overdue') {
            data[monthIdx].atrasadas += (inv.total - paidAmount)
            data[monthIdx].reconocidas += paidAmount
          } else {
            data[monthIdx].pendientes += (inv.total - paidAmount)
            data[monthIdx].reconocidas += paidAmount
          }
        }
      })
      return data
    }
  }, [invoices, chartView, selectedYears, selectedMonth])

  // Aggregate absolute totals for summary chips
  const advancedSummaryTotals = useMemo(() => {
    return advancedChartData.reduce(
      (acc, curr) => {
        acc.reconocidas += curr.reconocidas
        acc.pendientes += curr.pendientes
        acc.atrasadas += curr.atrasadas
        return acc
      },
      { reconocidas: 0, pendientes: 0, atrasadas: 0 }
    )
  }, [advancedChartData])

  const plan = PLANS[user?.plan] || PLANS.standard

  if (!canView) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-surface-700 border border-subtle flex items-center justify-center">
          <Lock size={36} className="text-muted-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Acceso restringido</h2>
          <p className="text-sm text-muted-400 mt-1">Tu rol de <span className="text-warning-400 font-medium">{ROLES[role]?.label}</span> no tiene acceso al Dashboard.</p>
          <p className="text-sm text-muted-400">Contacta a tu administrador si necesitas este acceso.</p>
        </div>
      </div>
    )
  }

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const invData = invoices.map(i => ({
        'ID Factura': i.id?.slice(-8)?.toUpperCase() || '',
        'Cliente': i.client_name || 'Cliente Express',
        'Subtotal': i.subtotal || 0,
        'Total': i.total || 0,
        'Método Pago': i.payment_type === 'immediate' ? 'Inmediato' : 'Programado (Crédito)',
        'Estado': i.payment_status === 'paid' ? 'Pagada' : i.payment_status === 'overdue' ? 'Atrasada' : 'Pendiente',
        'Fecha Creación': format(new Date(i.created_at), 'yyyy-MM-dd HH:mm')
      }))

      const expData = expenses.map(e => ({
        'ID Egreso': e.id?.slice(-8)?.toUpperCase() || '',
        'Monto': e.amount || 0,
        'Categoría': e.category || 'Otros',
        'Descripción': e.description || '',
        'Fecha Registro': format(new Date(e.created_at), 'yyyy-MM-dd HH:mm')
      }))

      // Extract abonos from invoices note field
      const abonosData = []
      invoices.forEach(inv => {
        if (inv.note) {
          try {
            const trimmed = inv.note.trim()
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              const parsed = JSON.parse(trimmed)
              if (parsed.payments && Array.isArray(parsed.payments)) {
                parsed.payments.forEach(p => {
                  abonosData.push({
                    'ID Factura': inv.id?.slice(-8)?.toUpperCase() || '',
                    'Cliente': inv.client_name || 'Sin cliente',
                    'Monto Abono': Number(p.amount) || 0,
                    'Fecha Abono': format(new Date(p.date), 'yyyy-MM-dd HH:mm'),
                    'Referencia / Nota': p.reference || 'Abono registrado'
                  })
                })
              }
            }
          } catch (e) {
            // ignore
          }
        }
      })

      const wb = XLSX.utils.book_new()
      const wsInvoices = XLSX.utils.json_to_sheet(invData)
      const wsExpenses = XLSX.utils.json_to_sheet(expData)
      const wsAbonos = XLSX.utils.json_to_sheet(abonosData)

      XLSX.utils.book_append_sheet(wb, wsInvoices, 'Facturación')
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Egresos_Gastos')
      XLSX.utils.book_append_sheet(wb, wsAbonos, 'Abonos_Recibidos')

      XLSX.writeFile(wb, `Reporte_Financiero_GestivaOne_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`)
      toast.success('Reporte Excel generado con éxito')
    } catch (e) {
      toast.error('Error al exportar reporte Excel: ' + e.message)
    }
  }

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const companyName = user?.companyName || 'Mi Empresa'
      
      // Calculate deep metrics
      let totalAbonadoGlobal = 0
      const abonosList = []
      
      invoices.forEach(inv => {
        let parsedPayments = []
        if (inv.note) {
          try {
            const trimmed = inv.note.trim()
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              const parsed = JSON.parse(trimmed)
              if (parsed.payments && Array.isArray(parsed.payments)) {
                parsedPayments = parsed.payments
              }
            }
          } catch (e) {}
        }
        
        if (parsedPayments.length > 0) {
          parsedPayments.forEach(p => {
            const amt = Number(p.amount) || 0
            totalAbonadoGlobal += amt
            abonosList.push([
              inv.id?.slice(-8)?.toUpperCase() || '—',
              inv.client_name || 'Sin cliente',
              format$(amt),
              new Date(p.date).toLocaleDateString('es-CO'),
              p.reference || 'Abono registrado'
            ])
          })
        } else if (inv.payment_status === 'paid') {
          totalAbonadoGlobal += inv.total
          abonosList.push([
            inv.id?.slice(-8)?.toUpperCase() || '—',
            inv.client_name || 'Sin cliente',
            format$(inv.total),
            new Date(inv.created_at).toLocaleDateString('es-CO'),
            'Pago total inmediato'
          ])
        }
      })

      // Header branding
      doc.setFillColor(12, 12, 18)
      doc.rect(0, 0, 210, 36, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(99, 102, 241) // Indigo-400
      doc.text('GESTIVAONE', 14, 15)
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text('REPORTE FINANCIERO EJECUTIVO DE OPERACIONES', 14, 21)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(`Empresa: ${companyName} | Generado el: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`, 14, 29)
      
      // Page 1: Resumen ejecutivo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(79, 70, 229) // Indigo-600
      doc.text('RESUMEN DE FLUJO DE CAJA (CASH FLOW)', 14, 46)
      
      // Summary Card Boxes
      // Card 1: Ventas Netas Facturadas
      doc.setFillColor(243, 244, 246)
      doc.rect(14, 52, 58, 22, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text('VENTAS FACTURADAS', 18, 58)
      doc.setFontSize(11)
      doc.setTextColor(31, 41, 55)
      const salesTotal = invoices.reduce((s, i) => s + (i.total || 0), 0)
      doc.text(format$(salesTotal), 18, 67)

      // Card 2: Ingresos Reales Cobrados (Cash In)
      doc.setFillColor(240, 253, 244)
      doc.rect(76, 52, 58, 22, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(22, 101, 52)
      doc.text('INGRESOS COBRADOS', 80, 58)
      doc.setFontSize(11)
      doc.setTextColor(21, 128, 61)
      doc.text(format$(totalAbonadoGlobal), 80, 67)

      // Card 3: Egresos/Gastos (Cash Out)
      doc.setFillColor(254, 242, 242)
      doc.rect(138, 52, 58, 22, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(153, 27, 27)
      doc.text('EGRESOS (GASTOS)', 142, 58)
      doc.setFontSize(11)
      doc.setTextColor(185, 28, 28)
      doc.text(format$(totalExpenses), 142, 67)

      // Subtotals & Balance
      const netCashBalance = totalAbonadoGlobal - totalExpenses
      doc.setDrawColor(229, 231, 235)
      doc.line(14, 82, 196, 82)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(55, 65, 81)
      doc.text(`Cuentas pendientes por cobrar (Saldo total):`, 14, 88)
      doc.setFont('helvetica', 'bold')
      doc.text(format$(pendingRevenue), 196, 88, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.text(`Balance Neto de Flujo de Caja (Ingresos - Egresos):`, 14, 94)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(netCashBalance >= 0 ? 21 : 185, netCashBalance >= 0 ? 128 : 28, netCashBalance >= 0 ? 61 : 28)
      doc.text(format$(netCashBalance), 196, 94, { align: 'right' })

      // Visual line
      doc.setDrawColor(79, 70, 229) // Indigo-600
      doc.setLineWidth(0.5)
      doc.line(14, 99, 196, 99)
      doc.setLineWidth(0.1)

      // Table 1: Historial de Abonos / Cobros
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(17, 24, 39)
      doc.text('HISTORIAL DETALLADO DE PAGOS Y ABONOS RECIBIDOS', 14, 107)

      autoTable(doc, {
        startY: 112,
        head: [['Factura ID', 'Cliente', 'Monto Recibido', 'Fecha de Pago', 'Concepto/Referencia']],
        body: abonosList.slice(0, 12),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8.5 }
      })

      // Go to page 2 for complete listings
      doc.addPage()
      
      // Page 2 header
      doc.setFillColor(30, 41, 59)
      doc.rect(0, 0, 210, 16, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text('GESTIVAONE - DETALLES COMPLEMENTARIOS DE TRANSACCIONES', 14, 10)

      doc.setFontSize(11)
      doc.setTextColor(17, 24, 39)
      doc.text('TODAS LAS FACTURAS EMITIDAS', 14, 24)

      const allInvoicesBody = invoices.map(i => [
        i.id?.slice(-8)?.toUpperCase() || '—',
        i.client_name || 'Cliente Express',
        format$(i.total),
        i.payment_type === 'immediate' ? 'Inmediato' : 'Crédito',
        i.payment_status === 'paid' ? 'Pagada' : i.payment_status === 'overdue' ? 'Atrasada' : 'Pendiente',
        new Date(i.created_at).toLocaleDateString('es-CO')
      ])

      autoTable(doc, {
        startY: 28,
        head: [['ID Factura', 'Cliente', 'Total', 'Método', 'Estado', 'Fecha']],
        body: allInvoicesBody,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
        styles: { fontSize: 8 }
      })

      // Operating Expenses List
      const nextY = doc.lastAutoTable.finalY + 10
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(17, 24, 39)
      doc.text('DETALLE DE EGRESOS / GASTOS OPERATIVOS', 14, nextY)

      const expBody = expenses.map(e => [
        e.id?.slice(-8)?.toUpperCase() || '—',
        e.category || 'Otros',
        e.description || 'Gasto registrado',
        format$(e.amount),
        new Date(e.created_at).toLocaleDateString('es-CO')
      ])

      autoTable(doc, {
        startY: nextY + 4,
        head: [['ID Egreso', 'Categoría', 'Descripción', 'Monto', 'Fecha']],
        body: expBody,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8 }
      })

      doc.save(`Reporte_Ejecutivo_Financiero_GestivaOne_${Date.now()}.pdf`)
      toast.success('Reporte Financiero PDF exportado con éxito')
    } catch (e) {
      toast.error('Error al generar PDF ejecutivo: ' + e.message)
    }
  }

  const handleExpenseSubmit = (e) => {
    e.preventDefault()
    const amt = Number(expAmount)
    if (!amt || amt <= 0) {
      return toast.error('Ingresa un monto válido para el gasto')
    }
    const res = addExpense({
      amount: amt,
      category: expCategory,
      description: expDesc.trim(),
    })
    if (res.success) {
      toast.success('Gasto registrado exitosamente')
      setExpAmount('')
      setExpDesc('')
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="page-container space-y-6"
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-brand-600 dark:text-white">Dashboard</h1>
            <p className="hidden sm:block text-sm text-muted-400 mt-0.5">Vista general del negocio</p>
          </div>
          {plan.id === 'standard' && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-600/10 border border-brand-500/20">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Plan Standard</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Financial Export Panel */}
      <motion.div variants={itemVariants} className="bg-surface-800 border border-subtle rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp size={20} className="text-brand-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-brand-600 dark:text-white">Reportes Financieros Ejecutivos</h3>
            <p className="text-xs text-muted-400 mt-0.5">Exporta reportes oficiales de facturación, abonos y gastos operacionales</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={exportToPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-glow-sm"
          >
            <Download size={14} /> Exportar PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-700 hover:bg-surface-600 border border-subtle text-foreground text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Download size={14} /> Exportar Excel
          </button>
        </div>
      </motion.div>

      {/* KPIs: 2 col mobile → 3 col tablet → 5 col desktop (Accordion-expanding hover effect!) */}
      {/* Mobile & Tablet view */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:hidden gap-3 md:gap-4">
        {[
          {
            title: "Ingresos (Recaudado)",
            value: format$(totalRevenue),
            icon: <DollarSign size={18} />,
            color: "brand",
            subtitle: `${paid.length} facturas pagadas`
          },
          {
            title: "Pendiente por Cobrar",
            value: format$(pendingRevenue),
            icon: <Clock size={18} />,
            color: "warning",
            subtitle: `${pending.length + overdue.length} facturas`
          },
          {
            title: "Gastos (Egresos)",
            value: format$(totalExpenses),
            icon: <Coins size={18} />,
            color: "danger",
            subtitle: `${expenses.length} egresos registrados`
          },
          {
            title: "Utilidad Neta Real",
            value: format$(totalRevenue - totalExpenses),
            icon: <DollarSign size={18} />,
            color: "success",
            subtitle: "Total Ingresos - Gastos"
          },
          {
            title: "Clientes Frecuentes",
            value: clients.filter((c) => c.type === 'frequent').length,
            icon: <Users size={18} />,
            color: "brand",
            subtitle: `${clients.length} clientes totales`
          },
          {
            title: "Facturas Express",
            value: expressCount,
            icon: <Zap size={18} />,
            color: "brand",
            subtitle: `Facturado: ${format$(expressRevenue)}`
          }
        ].map((kpi, idx) => (
          <motion.div 
            key={kpi.title} 
            variants={itemVariants}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Desktop View with smooth physical horizontal flex accordion */}
      <div className="hidden lg:flex items-stretch gap-4 w-full h-[126px]">
        {[
          {
            title: "Ingresos (Recaudado)",
            value: format$(totalRevenue),
            icon: <DollarSign size={18} />,
            color: "brand",
            subtitle: `${paid.length} facturas pagadas`
          },
          {
            title: "Pendiente por Cobrar",
            value: format$(pendingRevenue),
            icon: <Clock size={18} />,
            color: "warning",
            subtitle: `${pending.length + overdue.length} facturas`
          },
          {
            title: "Gastos (Egresos)",
            value: format$(totalExpenses),
            icon: <Coins size={18} />,
            color: "danger",
            subtitle: `${expenses.length} egresos registrados`
          },
          {
            title: "Utilidad Neta Real",
            value: format$(totalRevenue - totalExpenses),
            icon: <DollarSign size={18} />,
            color: "success",
            subtitle: "Total Ingresos - Gastos"
          },
          {
            title: "Clientes Frecuentes",
            value: clients.filter((c) => c.type === 'frequent').length,
            icon: <Users size={18} />,
            color: "brand",
            subtitle: `${clients.length} clientes totales`
          },
          {
            title: "Facturas Express",
            value: expressCount,
            icon: <Zap size={18} />,
            color: "brand",
            subtitle: `Facturado: ${format$(expressRevenue)}`
          }
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            onMouseEnter={() => handleKpiMouseEnter(i)}
            onMouseLeave={handleKpiMouseLeave}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={clsx(
              "h-full",
              hoveredKpi === i
                ? "flex-[2.35] min-w-[280px] shrink-0"
                : hoveredKpi !== null
                  ? "flex-[0.62] max-w-[85px] shrink"
                  : "flex-1 min-w-0 shrink"
            )}
          >
            <KPICard
              {...kpi}
              collapsed={hoveredKpi !== null && hoveredKpi !== i}
            />
          </motion.div>
        ))}
      </div>

      {/* Charts: stacked mobile → side by side lg+ (Available for ALL plans, making 6 widgets total for Standard) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Revenue vs Pending chart */}
        <div className="bg-surface-800 border border-subtle rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-400" />
              <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Flujo de Caja: Ingresos vs Gastos vs Utilidad</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-400 font-bold uppercase tracking-wider">Filtrar:</span>
              <select
                value={revenueYearFilter}
                onChange={(e) => setRevenueYearFilter(e.target.value)}
                className="bg-surface-700 border border-subtle rounded-xl px-2 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 cursor-pointer"
              >
                <option value="all">Histórico</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="netProfitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip formatFn={format$} />} />
              <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#7c3aed" strokeWidth={2} fill="url(#revenueGrad)" />
              <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#ef4444" strokeWidth={2} fill="url(#expensesGrad)" />
              <Area type="monotone" dataKey="netProfit" name="Utilidad" stroke="#10b981" strokeWidth={2} fill="url(#netProfitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoices breakdown */}
        <div className="bg-surface-800 border border-subtle rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-brand-400" />
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Facturas por estado</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[
              { name: 'Pagadas',   count: paid.length,    fill: '#10b981' },
              { name: 'Pendientes',count: pending.length,  fill: '#f59e0b' },
              { name: 'Atrasadas', count: overdue.length,  fill: '#ef4444' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="glass border border-subtle rounded-xl px-3 py-2 text-xs">
                    <p className="text-muted-400 mb-1">{label}</p>
                    <p className="text-foreground font-semibold">{payload[0].value} facturas</p>
                  </div>
                ) : null
              } />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {[
                  { fill: '#10b981' },
                  { fill: '#f59e0b' },
                  { fill: '#ef4444' },
                ].map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {!plan.hasAdvancedDashboard ? (
        <motion.div variants={itemVariants} className="bg-surface-800 border-2 border-dashed border-subtle rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 text-brand-400 border border-brand-500/20 flex items-center justify-center shadow-glow-sm">
            <TrendingUp size={30} />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-xl font-bold text-foreground">Análisis Avanzado Bloqueado</h2>
            <p className="text-sm text-muted-400">
              Mejora a un plan <span className="text-brand-400 font-bold">Pro</span> o <span className="text-brand-400 font-bold">Empresarial</span> para visualizar métricas avanzadas, top de ventas, segmentación de clientes y análisis de deuda.
            </p>
          </div>
          <button className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-glow transition-all">
            Ver Planes y Mejorar
          </button>
        </motion.div>
      ) : (
        <>
          {/* Advanced Multi-Timeline Analytics Dashboard */}
          <motion.div variants={itemVariants} className="bg-surface-800 border border-subtle rounded-3xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
              <div>
                <h3 className="text-base font-bold text-brand-600 dark:text-brand-400 flex items-center gap-2">
                  <TrendingUp className="text-brand-400" size={18} />
                  Analíticas Avanzadas de Ventas
                </h3>
                <p className="text-xs text-muted-400 mt-0.5">Historial unificado de ventas reconocidas, pendientes y atrasadas</p>
              </div>

              {/* Year Filter Option (Serie de Años) */}
              <div className="flex flex-col gap-1.5 min-w-[200px]">
                <span className="text-[10px] text-muted-400 font-bold uppercase tracking-wider">Filtrar por año(s)</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableYears.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => toggleYear(yr)}
                      className={clsx(
                        "px-3 py-1 rounded-xl text-xs font-bold border transition-all select-none",
                        selectedYears.includes(yr)
                          ? "bg-brand-600/20 border-brand-500 text-brand-300 shadow-glow-sm"
                          : "border-subtle bg-surface-700/50 text-muted-400 hover:text-foreground"
                      )}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dashboard Tabs & Option Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex rounded-xl bg-surface-900 p-1 border border-subtle self-start">
                {[
                  { id: 'monthly',   label: 'Mes Actual' },
                  { id: 'semesterly',label: 'Semestral' },
                  { id: 'annually',  label: 'Anual' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setChartView(t.id)}
                    className={clsx(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-0",
                      chartView === t.id
                        ? "bg-surface-700 text-foreground shadow"
                        : "text-muted-400 hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Conditional month selector for 'monthly' view */}
              {chartView === 'monthly' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-400 font-semibold">Seleccionar mes:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-surface-700 border border-subtle rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/50 cursor-pointer"
                  >
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Dynamic Combined Line Chart */}
            <div className="h-[280px] w-full bg-surface-900/40 border border-subtle rounded-2xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={advancedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(v) => `$${v}`} 
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="glass border border-subtle rounded-2xl p-3.5 space-y-2 shadow-xl min-w-[160px] animate-scale-up">
                          <p className="text-xs font-bold text-foreground border-b border-subtle pb-1.5">
                            {chartView === 'monthly' ? `Día ${label}` : label}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4 text-[11px]">
                              <span className="text-success-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> Reconocidas:
                              </span>
                              <span className="font-bold text-foreground">{format$(payload[0].value)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[11px]">
                              <span className="text-warning-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-warning-500" /> Pendientes:
                              </span>
                              <span className="font-bold text-foreground">{format$(payload[1].value)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[11px]">
                              <span className="text-danger-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-danger-500" /> Atrasadas:
                              </span>
                              <span className="font-bold text-foreground">{format$(payload[2].value)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reconocidas" 
                    name="Reconocidas" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 3, stroke: '#10b981', strokeWidth: 1.5, fill: '#10b981' }} 
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pendientes" 
                    name="Pendientes" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ r: 3, stroke: '#f59e0b', strokeWidth: 1.5, fill: '#f59e0b' }} 
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#f59e0b' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="atrasadas" 
                    name="Atrasadas" 
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    dot={{ r: 3, stroke: '#ef4444', strokeWidth: 1.5, fill: '#ef4444' }} 
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Metrics Summary Cards below chart */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-900/30 p-2.5 rounded-2xl">
              <div className="bg-success-500/5 border border-success-500/10 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] text-success-400/80 font-bold uppercase tracking-wider mb-1">Ventas Reconocidas</span>
                <span className="text-base font-extrabold text-success-400">{format$(advancedSummaryTotals.reconocidas)}</span>
              </div>
              <div className="bg-warning-500/5 border border-warning-500/10 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] text-warning-400/80 font-bold uppercase tracking-wider mb-1">Total Pendiente</span>
                <span className="text-base font-extrabold text-warning-400">{format$(advancedSummaryTotals.pendientes)}</span>
              </div>
              <div className="bg-danger-500/5 border border-danger-500/10 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] text-danger-400/80 font-bold uppercase tracking-wider mb-1">Deuda Atrasada</span>
                <span className="text-base font-extrabold text-danger-400">{format$(advancedSummaryTotals.atrasadas)}</span>
              </div>
            </div>
          </motion.div>

          {/* Advanced row: stacked → 2 cols on md → 4 cols on xl */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mt-6">
            {/* Top clients */}
            <div className="xl:col-span-1 bg-surface-800 border border-subtle rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-brand-400" />
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Top Clientes</span>
              </div>
              {topClients.length === 0 ? (
                <p className="text-xs text-muted-400 text-center py-6">Sin datos aún</p>
              ) : (
                <div className="space-y-3">
                  {topClients.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="w-5 text-xs text-muted-400 font-semibold">{i + 1}</span>
                      <div className="w-7 h-7 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-300">
                        {c.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-400">{c.invoiceCount ?? 0} compras</p>
                      </div>
                      <span className="text-xs font-semibold text-success-400">{format$(c.totalRevenue ?? 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top products */}
            <div className="xl:col-span-1 bg-surface-800 border border-subtle rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-brand-400" />
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Productos más vendidos</span>
              </div>
              {topProducts.length === 0 ? (
                <p className="text-xs text-muted-400 text-center py-6">Sin ventas aún</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-5 text-xs text-muted-400 font-semibold">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-400">{p.category}</p>
                      </div>
                      <span className="text-xs font-semibold text-brand-300">{p.salesCount ?? 0} uds</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue list */}
            <div className="xl:col-span-1 bg-surface-800 border border-subtle rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-danger-400" />
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Clientes con deuda</span>
              </div>
              {overdueList.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6">
                  <CheckCircle size={24} className="text-success-400" />
                  <p className="text-xs text-muted-400">Sin deudas atrasadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueList.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{inv.client_name}</p>
                        <p className="text-[10px] text-danger-400">{inv.days} días de atraso</p>
                      </div>
                      <span className="text-xs font-semibold text-danger-400">{format$(inv.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Categorías (PieChart) */}
            <div className="xl:col-span-1 bg-surface-800 border border-subtle rounded-2xl p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} className="text-brand-400" />
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Ventas por Categoría</span>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {categoryData.length === 0 ? (
                  <p className="text-xs text-muted-400 text-center py-10">Sin ventas registradas</p>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-1 py-2">
                    {/* Ring Chart wrapper with relative center text */}
                    <div className="w-[160px] h-[160px] shrink-0 relative flex items-center justify-center">
                      {/* Interactive Center Ring Info */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
                        {(() => {
                          const totalCategoryUnits = categoryData.reduce((acc, c) => acc + c.value, 0)
                          const activeCat = activeCatIndex !== null ? categoryData[activeCatIndex] : null
                          if (activeCat) {
                            const activePercentage = Math.round((activeCat.value / totalCategoryUnits) * 100)
                            return (
                              <div className="flex flex-col items-center leading-tight">
                                <span className="text-[22px] font-black text-brand-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.3)] leading-none">
                                  {activePercentage}%
                                </span>
                                <span className="text-[10px] text-foreground font-extrabold uppercase tracking-wide mt-1.5 truncate max-w-[90px] text-center">
                                  {activeCat.name}
                                </span>
                                <span className="text-[8px] text-muted-400 font-bold mt-0.5">
                                  {activeCat.value} uds
                                </span>
                              </div>
                            )
                          }
                          return (
                            <div className="flex flex-col items-center leading-tight">
                              <span className="text-[18px] font-black text-foreground leading-none">
                                {totalCategoryUnits}
                              </span>
                              <span className="text-[9px] text-muted-400 font-extrabold uppercase tracking-widest mt-1.5">
                                unidades
                              </span>
                            </div>
                          )
                        })()}
                      </div>

                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={4}
                            onMouseEnter={(_, index) => setActiveCatIndex(index)}
                            onMouseLeave={() => setActiveCatIndex(null)}
                          >
                            {categoryData.map((entry, i) => (
                              <Cell 
                                key={`cell-${i}`} 
                                fill={entry.fill}
                                style={{
                                  filter: activeCatIndex === i ? 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' : 'none',
                                  transform: activeCatIndex === i ? 'scale(1.02)' : 'scale(1)',
                                  transformOrigin: '50% 50%',
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Symmetrical Legend List */}
                    <div className="flex-1 w-full space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {categoryData.map((cat, idx) => {
                        const isHovered = activeCatIndex === idx
                        return (
                          <div 
                            key={cat.name} 
                            className={clsx(
                              "flex items-center justify-between text-xs gap-3 py-0.5 px-2 rounded-lg transition-all duration-300 cursor-pointer",
                              isHovered ? "bg-brand-500/10 scale-102" : "hover:bg-surface-700/40"
                            )}
                            onMouseEnter={() => setActiveCatIndex(idx)}
                            onMouseLeave={() => setActiveCatIndex(null)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span 
                                className={clsx(
                                  "w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-300",
                                  isHovered && "scale-110 shadow-glow"
                                )}
                                style={{ backgroundColor: cat.fill }}
                              />
                              <span className={clsx("font-medium truncate transition-colors duration-300", isHovered ? "text-brand-300 font-bold" : "text-foreground")}>
                                {cat.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={clsx("transition-colors duration-300", isHovered ? "text-brand-200 font-bold" : "text-muted-400")}>
                                {cat.value} uds
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Operating Expenses Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Form: Register Expense */}
        <div className="lg:col-span-1 bg-surface-800 border border-subtle rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Coins size={18} className="text-brand-400" />
            <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400">Registrar Egreso / Gasto</h3>
          </div>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-400 mb-1 block">Monto del gasto ($) *</label>
              <input 
                type="number"
                required
                value={expAmount}
                onChange={e => setExpAmount(e.target.value)}
                placeholder="Ej: 50000"
                className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-400 mb-1 block">Categoría *</label>
              <select
                value={expCategory}
                onChange={e => setExpCategory(e.target.value)}
                className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
              >
                <option value="Inventario/Mercancía">Inventario/Mercancía</option>
                <option value="Alquiler/Servicios">Alquiler/Servicios</option>
                <option value="Marketing/Publicidad">Marketing/Publicidad</option>
                <option value="Salarios/Nómina">Salarios/Nómina</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-400 mb-1 block">Descripción / Detalle</label>
              <textarea 
                value={expDesc}
                onChange={e => setExpDesc(e.target.value)}
                placeholder="Ej: Pago de recibo de energía eléctrica o compra de bolsas..."
                rows={3}
                className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-glow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Registrar Egreso
            </button>
          </form>
        </div>

        {/* List: Recent Expenses */}
        <div className="lg:col-span-2 bg-surface-800 border border-subtle rounded-3xl p-5 flex flex-col h-[350px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-brand-400" />
              <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400">Historial de Egresos</h3>
            </div>
            <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
              {expenses.length} Transacciones
            </span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {expenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-400">
                <Coins size={32} className="text-muted-500 mb-2" />
                <p className="text-xs">No se han registrado gastos operacionales aún.</p>
              </div>
            ) : (
              expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-700/20 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-danger-500/10 border border-danger-500/20 flex items-center justify-center text-danger-400 font-bold text-xs shrink-0">
                      $
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{e.description || 'Gasto Operacional'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] bg-surface-600 text-muted-300 px-1.5 py-0.2 rounded font-medium">{e.category}</span>
                        <span className="text-[9px] text-muted-500">{new Date(e.created_at).toLocaleDateString('es-CO')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-danger-400">-{format$(e.amount)}</span>
                    <button
                      onClick={() => {
                        deleteExpense(e.id)
                        toast.success('Egreso eliminado')
                      }}
                      className="p-1 rounded text-muted-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
