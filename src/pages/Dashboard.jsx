import { useMemo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, FileText, Clock, CheckCircle, Users, TrendingUp, AlertTriangle, Lock, Package, Calendar, Coins } from 'lucide-react'
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
      <p className="text-muted-400 font-bold mb-1 border-b border-subtle/50 pb-1">{label}</p>
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

  // React state variables defined at the very top of the component to prevent TDZ errors
  const [selectedYears, setSelectedYears] = useState([new Date().getFullYear().toString()])
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

  const totalRevenue   = paid.reduce((s, i) => s + i.total, 0)
  const pendingRevenue = [...pending, ...overdue].reduce((s, i) => s + i.total, 0)

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

      return {
        month: format(date, 'MMM', { locale: es }).toUpperCase(),
        revenue: revenueAmt,
        pending: pendingAmt,
      }
    })
  }, [paid, pending, overdue, revenueYearFilter])

  // Top clients
  const topClients = useMemo(() =>
    [...clients]
      .filter((c) => c.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5),
  [clients])

  // Top products — use stable selector, compute in memo
  const topProducts = useMemo(() =>
    [...products].sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0)).slice(0, 5),
  [products])

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
      counts[cat] = (counts[cat] || 0) + (p.salesCount || 0)
    })
    const colors = ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']
    return Object.entries(counts)
      .map(([name, value], idx) => ({ name, value, fill: colors[idx % colors.length] }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [products])



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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="page-container space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-muted-400 mt-0.5">Vista general del negocio</p>
          </div>
          {plan.id === 'standard' && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-600/10 border border-brand-500/20">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Plan Standard</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* KPIs: 2 col mobile → 4 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            title: "Revenue Total",
            value: format$(totalRevenue),
            icon: <DollarSign size={18} />,
            color: "brand",
            subtitle: `${paid.length} facturas pagadas`
          },
          {
            title: "Pendiente",
            value: format$(pendingRevenue),
            icon: <Clock size={18} />,
            color: "warning",
            subtitle: `${pending.length + overdue.length} facturas`
          },
          {
            title: "Atrasadas",
            value: overdue.length,
            icon: <AlertTriangle size={18} />,
            color: "danger",
            subtitle: overdue.length > 0 ? `${format$(overdueList.reduce((s,i)=>s+i.total,0))} en riesgo` : 'Sin atrasos'
          },
          {
            title: "Clientes Activos",
            value: clients.filter((c) => c.type === 'frequent').length,
            icon: <Users size={18} />,
            color: "success",
            subtitle: `${products.length} productos`
          }
        ].map((kpi, i) => (
          <motion.div 
            key={kpi.title} 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <KPICard {...kpi} />
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
              <span className="text-sm font-semibold text-white">Revenue vs Pendiente</span>
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
                <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip formatFn={format$} />} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revenueGrad)" />
              <Area type="monotone" dataKey="pending" name="pending" stroke="#f59e0b" strokeWidth={2} fill="url(#pendingGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoices breakdown */}
        <div className="bg-surface-800 border border-subtle rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">Facturas por estado</span>
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
                    <p className="text-white font-semibold">{payload[0].value} facturas</p>
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
            <h2 className="text-xl font-bold text-white">Análisis Avanzado Bloqueado</h2>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-subtle/50 pb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
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
                          : "border-subtle bg-surface-700/50 text-muted-400 hover:text-white"
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
              <div className="flex rounded-xl bg-surface-900 p-1 border border-subtle/50 self-start">
                {[
                  { id: 'monthly',   label: 'Mes Actual' },
                  { id: 'semesterly',label: 'Semestral' },
                  { id: 'annually',  label: 'Anual' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setChartView(t.id)}
                    className={clsx(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      chartView === t.id
                        ? "bg-surface-700 text-white shadow"
                        : "text-muted-400 hover:text-white"
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
                    className="bg-surface-700 border border-subtle rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 cursor-pointer"
                  >
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Dynamic Combined Line Chart */}
            <div className="h-[280px] w-full bg-surface-900/40 border border-subtle/40 rounded-2xl p-4">
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
                          <p className="text-xs font-bold text-white border-b border-subtle/50 pb-1.5">
                            {chartView === 'monthly' ? `Día ${label}` : label}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4 text-[11px]">
                              <span className="text-success-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> Reconocidas:
                              </span>
                              <span className="font-bold text-white">{format$(payload[0].value)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[11px]">
                              <span className="text-warning-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-warning-500" /> Pendientes:
                              </span>
                              <span className="font-bold text-white">{format$(payload[1].value)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[11px]">
                              <span className="text-danger-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-danger-500" /> Atrasadas:
                              </span>
                              <span className="font-bold text-white">{format$(payload[2].value)}</span>
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
                <span className="text-sm font-semibold text-white">Top Clientes</span>
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
                        <p className="text-xs font-medium text-white truncate">{c.name}</p>
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
                <span className="text-sm font-semibold text-white">Productos más vendidos</span>
              </div>
              {topProducts.length === 0 ? (
                <p className="text-xs text-muted-400 text-center py-6">Sin ventas aún</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-5 text-xs text-muted-400 font-semibold">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{p.name}</p>
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
                <span className="text-sm font-semibold text-white">Clientes con deuda</span>
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
                        <p className="text-xs font-medium text-white truncate">{inv.client_name}</p>
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
                <span className="text-sm font-semibold text-white">Ventas por Categoría</span>
              </div>
              <div className="flex-1 min-h-[200px]">
                {categoryData.length === 0 ? (
                  <p className="text-xs text-muted-400 text-center py-10">Sin ventas registradas</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={({ active, payload }) => 
                        active && payload?.length ? (
                          <div className="glass border border-subtle rounded-xl px-3 py-2 text-xs">
                            <p className="text-muted-400 mb-1">{payload[0].name}</p>
                            <p className="text-white font-semibold">{payload[0].value} uds vendidas</p>
                          </div>
                        ) : null
                      } />
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
