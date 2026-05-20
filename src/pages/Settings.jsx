import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, RefreshCw, Check, Moon, Sun, Building2, Bell, Database,
  AlertTriangle, Monitor, Mail, MessageSquare, Server, FileText,
  FileSpreadsheet, Download, ChevronDown, ChevronUp, Loader2, Wifi, WifiOff, Lock,
  Printer
} from 'lucide-react'
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '@/store/useCurrencyStore'
import { useUIStore } from '@/store/useUIStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useAuthStore, PLANS } from '@/store/useAuthStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useClientStore } from '@/store/useClientStore'
import { useProductStore } from '@/store/useProductStore'
import {
  exportInvoicesPDF, exportClientsPDF, exportProductsPDF,
  exportInvoicesExcel, exportClientsExcel, exportProductsExcel
} from '@/services/exportService'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

function SectionTitle({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-subtle">
      <div className="p-2 rounded-xl bg-brand-600/10 text-brand-400">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-sm font-bold text-brand-600 dark:text-brand-400">{title}</h2>
        {desc && <p className="text-xs text-muted-400 mt-0.5">{desc}</p>}
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.08 } 
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 25 }
  }
}

export default function Settings() {
  const baseCurrency  = useCurrencyStore((s) => s.baseCurrency)
  const setCurrency   = useCurrencyStore((s) => s.setCurrency)
  const fetchRates    = useCurrencyStore((s) => s.fetchRates)
  const rates         = useCurrencyStore((s) => s.rates)
  const lastFetched   = useCurrencyStore((s) => s.lastFetched)
  const loading       = useCurrencyStore((s) => s.loading)
  const error         = useCurrencyStore((s) => s.error)
  const isStale       = useCurrencyStore((s) => s.isStale)

  const theme         = useUIStore((s) => s.theme)
  const setTheme      = useUIStore((s) => s.setTheme)

  const [currencySearch, setCurrencySearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch on mount if stale
  useEffect(() => {
    if (isStale()) fetchRates()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRates(true)
    setRefreshing(false)
    toast.success('Tasas de cambio actualizadas')
  }

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
  )

  const selectedCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === baseCurrency)

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="page-container max-w-2xl space-y-6 md:space-y-8"
    >
      <motion.div 
        variants={itemVariants}
        className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle/20"
      >
        <h1 className="text-xl md:text-2xl font-bold text-brand-600 dark:text-white">Configuración</h1>
        <p className="hidden sm:block text-sm text-muted-400 mt-0.5">Personaliza tu plataforma</p>
      </motion.div>

      {/* ─── Currency Section ─── */}
      <motion.section variants={itemVariants} className="bg-surface-800 border border-subtle rounded-3xl p-6 space-y-5">
        <SectionTitle
          icon={Globe}
          title="Divisa & Tasas de Cambio"
          desc="Las tasas se actualizan automáticamente cada 24 horas desde el Banco Central Europeo"
        />

        {/* Current rate info */}
        <div className="flex items-center gap-3 bg-surface-700 border border-subtle rounded-xl p-4">
          <div className="text-2xl">{selectedCurrency?.flag}</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
              {selectedCurrency?.name} ({baseCurrency})
            </p>
            {rates[baseCurrency] && baseCurrency !== 'USD' ? (
              <p className="text-xs text-muted-400">
                1 USD = {new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(rates[baseCurrency])} {baseCurrency}
              </p>
            ) : (
              <p className="text-xs text-muted-400">Divisa base del sistema</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
            loading={loading}
            title="Actualizar tasas ahora"
          >
            Actualizar
          </Button>
        </div>

        {/* Last updated */}
        {lastFetched && (
          <p className="text-[11px] text-muted-400">
            Última actualización: {format(new Date(lastFetched), "d 'de' MMMM, HH:mm", { locale: es })}
            {isStale() && <span className="text-warning-400 ml-2">⚠ Tasas desactualizadas</span>}
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-danger-900/30 border border-danger-500/30 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="text-danger-400" />
            <p className="text-xs text-danger-400">Error al obtener tasas: {error}. Verifica tu conexión.</p>
          </div>
        )}

        {/* Currency selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide">Seleccionar divisa</label>
          <input
            value={currencySearch}
            onChange={(e) => setCurrencySearch(e.target.value)}
            placeholder="Buscar divisa..."
            className="w-full bg-surface-700 border border-subtle rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredCurrencies.map((currency) => (
              <motion.button
                key={currency.code}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setCurrency(currency.code)
                  toast.success(`Divisa cambiada a ${currency.name}`)
                }}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-left transition-all',
                  baseCurrency === currency.code
                    ? 'border-brand-500 bg-brand-600/15'
                    : 'border-subtle bg-surface-700 hover:border-surface-300'
                )}
              >
                <span className="text-lg">{currency.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-xs font-bold transition-colors', baseCurrency === currency.code ? 'text-brand-600 dark:text-brand-300' : 'text-foreground')}>
                    {currency.code}
                  </p>
                  <p className={clsx('text-[10px] truncate transition-colors', baseCurrency === currency.code ? 'text-brand-500/80 dark:text-brand-400/80' : 'text-muted-500 dark:text-muted-400')}>{currency.name}</p>
                </div>
                {baseCurrency === currency.code && (
                  <Check size={13} className="text-brand-400 shrink-0" />
                )}
                {rates[currency.code] && currency.code !== 'USD' && (
                  <span className="text-[10px] text-muted-400 font-mono shrink-0">
                    {new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(rates[currency.code])}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Theme Section ─── */}
      <motion.section variants={itemVariants} className="bg-surface-800 border border-subtle rounded-3xl p-6 space-y-5">
        <SectionTitle
          icon={Moon}
          title="Apariencia"
          desc="Elige entre modo oscuro, claro, o deja que el sistema decida automáticamente"
        />

        <div className="grid grid-cols-3 gap-3">
          {[
            {
              value: 'dark',
              icon: Moon,
              label: 'Oscuro',
              desc: 'Siempre oscuro',
            },
            {
              value: 'light',
              icon: Sun,
              label: 'Claro',
              desc: 'Siempre claro',
            },
            {
              value: 'system',
              icon: Monitor,
              label: 'Sistema',
              desc: window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'Tu sistema usa oscuro'
                : 'Tu sistema usa claro',
            },
          ].map(({ value, icon: Icon, label, desc }) => {
            const active = theme === value
            return (
              <motion.button
                key={value}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setTheme(value); toast.success(`Tema "${label}" activado`) }}
                className={clsx(
                  'flex flex-col items-center gap-2.5 px-3 py-4 rounded-xl border-2 transition-all text-center',
                  active
                    ? 'border-brand-500 bg-brand-600/15'
                    : 'border-subtle bg-surface-700 hover:border-surface-300'
                )}
              >
                <div className={clsx(
                  'p-2.5 rounded-xl transition-colors',
                  active ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-600 text-muted-400'
                )}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className={clsx('text-sm font-semibold', active ? 'text-foreground font-bold' : 'text-muted-400')}>
                    {label}
                  </p>
                  <p className="text-[10px] text-muted-400 mt-0.5 leading-tight">{desc}</p>
                </div>
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center"
                  >
                    <Check size={9} className="text-white" />
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* System mode live indicator */}
        <AnimatePresence>
          {theme === 'system' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-brand-600/10 border border-brand-500/20 rounded-xl px-4 py-2.5"
            >
              <Monitor size={13} className="text-brand-400 shrink-0" />
              <p className="text-xs text-brand-300">
                Modo sistema activo — la app seguirá tu preferencia del SO automáticamente.
                {' '}
                <span className="text-muted-400">
                  Actualmente: {window.matchMedia('(prefers-color-scheme: dark)').matches ? '🌙 Oscuro' : '☀️ Claro'}
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ─── SMTP ─── */}
      <IntegrationBlock
        icon={Mail}
        title="Correo electrónico (SMTP)"
        desc="Envía facturas automáticamente por correo"
        enabledKey="smtp"
      >
        {({ cfg, set, enabled }) => (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CfgInput label="Host SMTP" value={cfg.host}     onChange={v => set({ host: v })}     placeholder="smtp.proveedor.com" />
              <CfgInput label="Puerto"   value={cfg.port}     onChange={v => set({ port: v })}     placeholder="587" />
              <CfgInput label="Usuario"  value={cfg.user}     onChange={v => set({ user: v })}     placeholder="correo@ejemplo.com" />
              <CfgInput label="Contraseña" value={cfg.password} onChange={v => set({ password: v })} placeholder="Password de aplicación" type="password" />
              <CfgInput label="Nombre remitente" value={cfg.fromName} onChange={v => set({ fromName: v })} placeholder="Nombre de tu negocio" />
            </div>
            <SmtpTestBtn />
          </div>
        )}
      </IntegrationBlock>

      {/* ─── WhatsApp ─── */}
      <IntegrationBlock
        icon={MessageSquare}
        title="WhatsApp Business"
        desc="Envía notificaciones de cobro por WhatsApp"
        enabledKey="whatsapp"
      >
        {({ cfg, set }) => (
          <div className="space-y-3">
            <CfgInput label="Número de teléfono" value={cfg.phoneNumber} onChange={v => set({ phoneNumber: v })} placeholder="Ej: +57300..." />
            <CfgInput label="API Key (Meta Business)" value={cfg.apiKey} onChange={v => set({ apiKey: v })} placeholder="Token de acceso permanente" type="password" />
            <div className="bg-warning-900/20 border border-warning-400/20 rounded-xl px-4 py-3">
              <p className="text-xs text-warning-400">Requiere cuenta de Meta Business verificada y aprobación de plantillas de mensaje.</p>
            </div>
          </div>
        )}
      </IntegrationBlock>

      {/* ─── API REST ─── */}
      <ApiBlock />

      {/* ─── Impresión ─── */}
      <PrinterBlock />

      {/* ─── Export ─── */}
      <ExportBlock />
    </motion.div>
  )
}

// ── Small helpers ───────────────────────────────────────────── 
function CfgInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-xs text-muted-400 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-surface-600 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
    </div>
  )
}

function SmtpTestBtn() {
  const testSmtp = useSettingsStore(s => s.testSmtp)
  const [testing, setTesting] = useState(false)
  const run = async () => {
    setTesting(true)
    const r = await testSmtp()
    setTesting(false)
    r.ok ? toast.success(r.msg) : toast.error(r.msg)
  }
  return (
    <button onClick={run} disabled={testing}
      className="flex items-center gap-2 text-xs bg-surface-600 hover:bg-surface-500 border border-subtle text-muted-400 hover:text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
      {testing ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
      {testing ? 'Probando conexión...' : 'Probar conexión SMTP'}
    </button>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} type="button"
      className={clsx('relative w-9 h-[18px] rounded-full transition-colors shrink-0', checked ? 'bg-brand-600' : 'bg-surface-500')}>
      <span className={clsx('absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0')} />
    </button>
  )
}

function IntegrationBlock({ icon: Icon, title, desc, enabledKey, children }) {
  const cfg     = useSettingsStore(s => s[enabledKey])
  const setCfg  = useSettingsStore(s => s[`set${enabledKey.charAt(0).toUpperCase() + enabledKey.slice(1)}`])
  const [open, setOpen] = useState(false)

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-800 border border-subtle rounded-3xl overflow-hidden"
    >
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-5 hover:bg-surface-700/40 transition-colors">
        <div className="p-2 rounded-xl bg-surface-700 text-muted-400"><Icon size={16} /></div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-400">{desc}</p>
        </div>
        <Toggle checked={cfg.enabled} onChange={v => { setCfg({ enabled: v }); toast(v ? `${title} activado` : `${title} desactivado`, { duration: 1500 }) }} />
        <span className="text-muted-400 ml-1">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-5 pb-5 border-t border-subtle pt-4">
              {children({ cfg, set: setCfg, enabled: cfg.enabled })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function ApiBlock() {
  const api     = useSettingsStore(s => s.api)
  const setApi  = useSettingsStore(s => s.setApi)
  const testApi = useSettingsStore(s => s.testApi)
  const user    = useAuthStore(s => s.user)
  const plan    = PLANS[user?.plan] || PLANS.standard
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState(false)

  const runTest = async () => {
    setTesting(true)
    const r = await testApi()
    setTesting(false)
    r.ok ? toast.success(r.msg) : toast.error(r.msg)
  }

  const statusColor = api.status === 'connected' ? 'text-success-400' : api.status === 'testing' ? 'text-warning-400' : 'text-muted-400'

  if (!plan.hasAPI) {
    return (
      <section className="bg-surface-800/50 border border-subtle border-dashed rounded-3xl p-5 flex items-center justify-between opacity-70 group grayscale hover:grayscale-0 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-surface-700 text-muted-500"><Server size={16} /></div>
          <div>
            <p className="text-sm font-semibold text-muted-400">Backend API REST</p>
            <p className="text-[10px] text-muted-500">Disponible en Plan Empresarial</p>
          </div>
        </div>
        <Lock size={14} className="text-muted-500 group-hover:text-brand-400 transition-colors" />
      </section>
    )
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-800 border border-subtle rounded-3xl overflow-hidden"
    >
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-5 hover:bg-surface-700/40 transition-colors">
        <div className="p-2 rounded-xl bg-surface-700 text-muted-400"><Server size={16} /></div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">Backend API REST</p>
          <p className="text-xs text-muted-400">Sincronización multi-dispositivo</p>
        </div>
        <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border', statusColor,
          api.status === 'connected' ? 'bg-success-900/20 border-success-400/20' : 'bg-surface-700 border-subtle')}>
          {api.status === 'connected' ? '● Conectado' : api.status === 'testing' ? '● Probando' : '○ Desconectado'}
        </span>
        {open ? <ChevronUp size={14} className="text-muted-400" /> : <ChevronDown size={14} className="text-muted-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-5 pb-5 border-t border-subtle pt-4 space-y-3">
              <CfgInput label="URL base de la API" value={api.url} onChange={v => setApi({ url: v })} placeholder="https://api.tudominio.com" />
              <CfgInput label="API Key" value={api.apiKey} onChange={v => setApi({ apiKey: v })} placeholder="Bearer token..." type="password" />
              <div className="flex gap-2">
                <button onClick={runTest} disabled={testing}
                  className="flex items-center gap-2 text-xs bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50 font-semibold">
                  {testing ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                  {testing ? 'Probando...' : 'Probar conexión'}
                </button>
              </div>
              {api.lastPing && <p className="text-[11px] text-muted-400">Último intento: {new Date(api.lastPing).toLocaleTimeString('es-CO')}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function ExportBlock() {
  const invoices  = useInvoiceStore(s => s.invoices)
  const clients   = useClientStore(s => s.clients)
  const products  = useProductStore(s => s.products)
  const user      = useAuthStore(s => s.user)
  const plan      = PLANS[user?.plan] || PLANS.standard
  const company   = user?.companyName || 'GestivaOne'
  const [loading, setLoading] = useState({})

  const run = async (key, fn) => {
    setLoading(l => ({ ...l, [key]: true }))
    try { await fn() } catch(e) { toast.error('Error al exportar') }
    setLoading(l => ({ ...l, [key]: false }))
  }

  const exports = [
    { key: 'invPdf',  label: 'Facturas PDF',     icon: FileText,        fn: () => exportInvoicesPDF(invoices, company) },
    { key: 'invXls',  label: 'Facturas Excel',   icon: FileSpreadsheet, fn: () => exportInvoicesExcel(invoices, company) },
    { key: 'cliPdf',  label: 'Clientes PDF',     icon: FileText,        fn: () => exportClientsPDF(clients, company) },
    { key: 'cliXls',  label: 'Clientes Excel',   icon: FileSpreadsheet, fn: () => exportClientsExcel(clients, company) },
    { key: 'prodPdf', label: 'Inventario PDF',   icon: FileText,        fn: () => exportProductsPDF(products, company) },
    { key: 'prodXls', label: 'Inventario Excel', icon: FileSpreadsheet, fn: () => exportProductsExcel(products, company) },
  ]

  if (!plan.hasReports) {
    return (
      <section className="bg-surface-800/50 border border-subtle border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3 opacity-80">
        <div className="p-3 rounded-2xl bg-brand-600/10 text-brand-400 border border-brand-500/20">
          <Lock size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Reportes PDF/Excel bloqueados</p>
          <p className="text-xs text-muted-400 max-w-xs mx-auto">Mejora tu plan a Pro para descargar reportes detallados y análisis de tu negocio.</p>
        </div>
        <button className="text-[11px] font-bold text-brand-400 uppercase tracking-widest hover:text-brand-300 transition-colors">
          Ver Planes →
        </button>
      </section>
    )
  }

  return (
    <motion.section variants={itemVariants} className="bg-surface-800 border border-subtle rounded-3xl p-6 space-y-4">
      <SectionTitle icon={Download} title="Exportar a PDF / Excel" desc="Descarga reportes de facturas, clientes e inventario" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {exports.map(({ key, label, icon: Icon, fn }) => (
          <button key={key} onClick={() => run(key, fn)} disabled={loading[key]}
            className={clsx(
              'flex items-center gap-2 px-3 py-2.5 rounded-xl border border-subtle text-xs font-semibold transition-all',
              key.includes('Pdf') || key.includes('Pdf')
                ? 'bg-danger-900/10 text-danger-400 hover:bg-danger-900/20 border-danger-500/20'
                : 'bg-success-900/10 text-success-400 hover:bg-success-900/20 border-success-500/20',
              loading[key] && 'opacity-60 cursor-not-allowed'
            )}>
            {loading[key] ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
            {loading[key] ? 'Generando...' : label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-400">Los reportes incluyen todos los datos actuales del sistema.</p>
    </motion.section>
  )
}

function PrinterBlock() {
  const printer = useSettingsStore(s => s.printer)
  const setPrinter = useSettingsStore(s => s.setPrinter)
  const user = useAuthStore(s => s.user)
  const [open, setOpen] = useState(false)

  const companyName = user?.companyName || 'Mi Empresa'
  const companyLogo = user?.companyLogo || null

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)
  }

  const previewItems = [
    { name: 'Café Cappuccino Grande', price: 9500, quantity: 2 },
    { name: 'Croissant de Almendras', price: 6500, quantity: 1 }
  ]
  const subtotal = 25500
  const taxVal = subtotal * 0.19
  const total = subtotal + (printer.showTax ? taxVal : 0)

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-800 border border-subtle rounded-3xl overflow-hidden"
    >
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-5 hover:bg-surface-700/40 transition-colors">
        <div className="p-2 rounded-xl bg-surface-700 text-muted-400"><Printer size={16} /></div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">Impresión de Facturas</p>
          <p className="text-xs text-muted-400">Elige la plantilla y contenido de los recibos impresos</p>
        </div>
        <Toggle checked={printer.autoPrint} onChange={v => { setPrinter({ autoPrint: v }); toast(v ? `Impresión automática activada` : `Impresión automática desactivada`, { duration: 1500 }) }} />
        <span className="text-muted-400 ml-1">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 border-t border-subtle pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Controls Column */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-brand-400 uppercase tracking-wider">Diseño y Campos</p>
                
                {/* Template picker */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-400 block font-medium">Plantilla de Recibo</label>
                  <div className="flex gap-2">
                    {['classic', 'modern'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPrinter({ template: t })}
                        className={clsx(
                          'flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-wide',
                          printer.template === t
                            ? 'bg-brand-600/10 border-brand-500 text-brand-400'
                            : 'bg-surface-700 border-subtle text-muted-400 hover:border-surface-300'
                        )}
                      >
                        {t === 'classic' ? 'Clásica (Térmica)' : 'Moderna (Elegante)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual toggles */}
                <div className="space-y-3 bg-surface-700/50 p-4 rounded-2xl border border-subtle/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Mostrar Logo de Empresa</span>
                    <Toggle checked={printer.showLogo} onChange={v => setPrinter({ showLogo: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Mostrar Nombre de Empresa</span>
                    <Toggle checked={printer.showCompanyName} onChange={v => setPrinter({ showCompanyName: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Mostrar Detalles de Productos</span>
                    <Toggle checked={printer.showProducts} onChange={v => setPrinter({ showProducts: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Mostrar Info de Contacto</span>
                    <Toggle checked={printer.showContact} onChange={v => setPrinter({ showContact: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Calcular IVA (19%)</span>
                    <Toggle checked={printer.showTax} onChange={v => setPrinter({ showTax: v })} />
                  </div>
                </div>

                {/* Footer text input */}
                <div>
                  <label className="text-xs text-muted-400 mb-1 block">Mensaje de pie de página</label>
                  <textarea
                    rows={2}
                    value={printer.footerText}
                    onChange={e => setPrinter({ footerText: e.target.value })}
                    placeholder="Escribe un mensaje de agradecimiento..."
                    className="w-full bg-surface-600 border border-subtle rounded-xl px-4 py-2 text-xs text-foreground placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                  />
                </div>
              </div>

              {/* Preview Column */}
              <div className="flex flex-col">
                <p className="text-[11px] font-bold text-brand-400 uppercase tracking-wider mb-2">Vista Previa en Vivo</p>
                <div className="flex-1 bg-surface-700/50 border border-subtle rounded-2xl p-4 flex justify-center items-start overflow-y-auto max-h-[360px]">
                  
                  {/* Paper Receipt Simulation */}
                  <div 
                    className={clsx(
                      "w-[230px] bg-white text-black p-4 shadow-xl border border-gray-300 relative rounded-sm text-[11px]",
                      printer.template === 'modern' ? 'font-sans' : 'font-mono'
                    )}
                    style={{ minHeight: '300px' }}
                  >
                    {/* Simulated Receipt top jagged edge */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-repeat-x bg-[linear-gradient(45deg,transparent_25%,#fff_25%,#fff_75%,transparent_75%,transparent),linear-gradient(-45deg,transparent_25%,#fff_25%,#fff_75%,transparent_75%,transparent)] bg-[size:6px_4px]" style={{ transform: 'translateY(-100%)' }}></div>

                    {/* Header */}
                    <div className="text-center">
                      {printer.showLogo && companyLogo ? (
                        <img src={companyLogo} alt="Logo" className="w-9 h-9 rounded-full object-cover mx-auto mb-1 border border-gray-200" />
                      ) : printer.showLogo ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 mx-auto mb-1 flex items-center justify-center text-[10px] font-bold text-white uppercase">{companyName.charAt(0)}</div>
                      ) : null}

                      {printer.showCompanyName ? (
                        <p className="font-bold text-sm tracking-tight uppercase leading-tight">{companyName}</p>
                      ) : (
                        <p className="font-bold text-xs uppercase leading-tight">RECIBO DE VENTA</p>
                      )}
                      
                      {printer.showContact && (
                        <p className="text-[9px] text-gray-500 leading-normal mt-0.5">
                          {user?.phone ? `Tel: ${user.phone}` : 'Tel: +57 300 000 0000'}<br/>
                          {user?.email || 'contacto@empresa.com'}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                    {/* Meta info */}
                    <div className="text-[9px] text-gray-600 leading-tight">
                      <p><span className="font-bold">FACTURA:</span> #A8B7CD9F</p>
                      <p><span className="font-bold">FECHA:</span> {new Date().toLocaleString('es-CO')}</p>
                      <p><span className="font-bold">METODO:</span> INMEDIATO</p>
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                    {/* Items */}
                    {printer.showProducts ? (
                      <div>
                        <table className="w-full text-[9px] leading-tight mb-2">
                          <thead>
                            <tr className="border-b border-gray-400">
                              <th className="text-left py-0.5">Cant</th>
                              <th className="text-left py-0.5">Detalle</th>
                              <th className="text-right py-0.5">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewItems.map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-1">{item.quantity}</td>
                                <td className="py-1">
                                  {item.name}
                                  <br/><span className="text-[8px] text-gray-500">{formatCurrency(item.price)}</span>
                                </td>
                                <td className="text-right py-1">{formatCurrency(item.price * item.quantity)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="border-t border-dashed border-gray-400 my-2"></div>
                      </div>
                    ) : null}

                    {/* Totals */}
                    <div className="space-y-0.5 text-[10px]">
                      {printer.showTax ? (
                        <>
                          <div className="flex justify-between">
                            <span>Subtotal Neto:</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>IVA (19%):</span>
                            <span>{formatCurrency(taxVal)}</span>
                          </div>
                        </>
                      ) : null}
                      <div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-[11px]">
                        <span>TOTAL A PAGAR:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                    {/* Footer */}
                    <div className="text-center text-[9px] text-gray-500 leading-normal">
                      <p>{printer.footerText || '¡Gracias por su compra!'}</p>
                      <p className="text-[7px] text-gray-400 mt-2">GestivaOne — www.gestivaone.com</p>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
