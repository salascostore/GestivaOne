import { useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, FileText, Clock, CheckCircle, Users, TrendingUp, AlertTriangle, Lock } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
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
    <div className="glass border border-subtle rounded-xl px-3 py-2 text-xs">
      <p className="text-muted-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-white font-semibold">{formatFn(p.value)}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const invoices    = useInvoiceStore((s) => s.invoices)
  const clients     = useClientStore((s) => s.clients)
  const products    = useProductStore((s) => s.products)
  const user        = useAuthStore((s) => s.user)
  const format$     = useCurrencyStore((s) => s.format)
  const checkOverdue = useInvoiceStore((s) => s.checkOverdue)

  const role = user?.role || 'administrador'
  const canView = ROLES[role]?.permissions?.dashboard ?? true

  // Auto check overdue on mount
  useEffect(() => { checkOverdue() }, [])

  const paid    = invoices.filter((i) => i.paymentStatus === 'paid')
  const pending = invoices.filter((i) => i.paymentStatus === 'pending')
  const overdue = invoices.filter((i) => i.paymentStatus === 'overdue')

  const totalRevenue   = paid.reduce((s, i) => s + i.total, 0)
  const pendingRevenue = [...pending, ...overdue].reduce((s, i) => s + i.total, 0)

  // Monthly chart — last 6 months
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, idx) => {
      const date = subMonths(new Date(), 5 - idx)
      const key  = format(date, 'yyyy-MM')
      const revenue = paid
        .filter((i) => i.createdAt.startsWith(key))
        .reduce((s, i) => s + i.total, 0)
      return { month: format(date, 'MMM', { locale: es }), revenue }
    })
  }, [paid])

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
        days: Math.max(0, Math.floor((Date.now() - new Date(inv.scheduledDate || inv.createdAt)) / 86400000))
      }))
      .sort((a, b) => b.days - a.days),
  [overdue])

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

      {!plan.hasAdvancedDashboard ? (
        <motion.div variants={itemVariants} className="bg-surface-800 border-2 border-dashed border-subtle rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 text-brand-400 border border-brand-500/20 flex items-center justify-center shadow-glow-sm">
            <TrendingUp size={30} />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-xl font-bold text-white">Análisis Avanzado Bloqueado</h2>
            <p className="text-sm text-muted-400">
              Mejora a un plan <span className="text-brand-400 font-bold">Pro</span> o <span className="text-brand-400 font-bold">Empresarial</span> para visualizar gráficos de revenue mensual, top de productos y análisis detallado de clientes.
            </p>
          </div>
          <button className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-glow transition-all">
            Ver Planes y Mejorar
          </button>
        </motion.div>
      ) : (
        <>
          {/* Charts: stacked mobile → side by side lg+ */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {/* Revenue chart */}
            <div className="bg-surface-800 border border-subtle rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-brand-400" />
                <span className="text-sm font-semibold text-white">Revenue — Últimos 6 meses</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip formatFn={format$} />} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revenueGrad)" />
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

          {/* Tables row: stacked → 3 cols on xl */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
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
                        <p className="text-xs font-medium text-white truncate">{inv.clientName}</p>
                        <p className="text-[10px] text-danger-400">{inv.days} días de atraso</p>
                      </div>
                      <span className="text-xs font-semibold text-danger-400">{format$(inv.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
