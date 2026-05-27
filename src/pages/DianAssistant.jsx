import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calculator, Download, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, FileText, Info, HelpCircle, Landmark, CheckCircle2
} from 'lucide-react'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useExpenseStore } from '@/store/useExpenseStore'
import { useClientStore } from '@/store/useClientStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

export default function DianAssistant() {
  const [selectedYear, setSelectedYear] = useState('2025')
  const [taxType, setTaxType] = useState('juridica') // 'juridica' | 'natural'
  const [estimatedIvaRate, setEstimatedIvaRate] = useState(19) // Percentage of expenses with IVA
  const [activeTab, setActiveTab] = useState('renta') // 'renta' | 'iva' | 'exogena'

  // Persistent Renta inputs
  const [ingresosNoConstitutivos, setIngresosNoConstitutivos] = useState(() => {
    return Number(localStorage.getItem(`dian_incr_${selectedYear}`) || 0)
  })
  const [rentasExentas, setRentasExentas] = useState(() => {
    return Number(localStorage.getItem(`dian_exentas_${selectedYear}`) || 0)
  })
  const [retencionesFuente, setRetencionesFuente] = useState(() => {
    return Number(localStorage.getItem(`dian_retenciones_${selectedYear}`) || 0)
  })

  // Collapsible detailed tables
  const [showSalesIvaDetail, setShowSalesIvaDetail] = useState(false)
  const [showExpensesIvaDetail, setShowExpensesIvaDetail] = useState(false)

  // Load correct values when year changes
  useEffect(() => {
    setIngresosNoConstitutivos(Number(localStorage.getItem(`dian_incr_${selectedYear}`) || 0))
    setRentasExentas(Number(localStorage.getItem(`dian_exentas_${selectedYear}`) || 0))
    setRetencionesFuente(Number(localStorage.getItem(`dian_retenciones_${selectedYear}`) || 0))
  }, [selectedYear])

  // Persist values
  useEffect(() => {
    localStorage.setItem(`dian_incr_${selectedYear}`, ingresosNoConstitutivos.toString())
  }, [ingresosNoConstitutivos, selectedYear])

  useEffect(() => {
    localStorage.setItem(`dian_exentas_${selectedYear}`, rentasExentas.toString())
  }, [rentasExentas, selectedYear])

  useEffect(() => {
    localStorage.setItem(`dian_retenciones_${selectedYear}`, retencionesFuente.toString())
  }, [retencionesFuente, selectedYear])

  const invoices = useInvoiceStore((s) => s.invoices)
  const expenses = useExpenseStore((s) => s.expenses)
  const clients = useClientStore((s) => s.clients)
  const format$ = useCurrencyStore((s) => s.format)

  const fetchInvoices = useInvoiceStore((s) => s.fetchInvoices)
  const fetchExpenses = useExpenseStore((s) => s.fetchExpenses)
  const fetchClients = useClientStore((s) => s.fetchClients)

  useEffect(() => {
    fetchInvoices()
    fetchExpenses()
    fetchClients()
  }, [fetchInvoices, fetchExpenses, fetchClients])

  // ─── Filtered Data by Year ───
  const yearInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invYear = new Date(inv.created_at || inv.date).getFullYear().toString()
      return invYear === selectedYear
    })
  }, [invoices, selectedYear])

  const yearExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const expYear = new Date(exp.created_at).getFullYear().toString()
      return expYear === selectedYear
    })
  }, [expenses, selectedYear])

  // ─── Financial Summaries ───
  const totalSales = useMemo(() => {
    return yearInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
  }, [yearInvoices])

  const totalCost = useMemo(() => {
    return yearExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  }, [yearExpenses])

  // ─── UVT Calculations ───
  // Values: 2025 UVT = $49,741 COP | 2026 UVT = $52,000 COP
  const uvtValue = selectedYear === '2025' ? 49741 : 52000

  // ─── Renta Calculations (Estatuto Tributario Colombiano) ───
  // 1. Ingresos Netos
  const netSales = Math.max(0, totalSales - ingresosNoConstitutivos)
  
  // 2. Renta Líquida Ordinaria (Ingresos Netos - Costos)
  const rentaLiquidaOrdinaria = Math.max(0, netSales - totalCost)

  // 3. Rentas Exentas y Deducciones (Limitadas al 40% de la Renta Líquida Ordinaria o 1340 UVT para personas naturales)
  const maxDeduccionPermitida = taxType === 'natural' 
    ? Math.min(rentasExentas, rentaLiquidaOrdinaria * 0.40, 1340 * uvtValue)
    : rentasExentas

  // 4. Renta Líquida Gravable
  const rentaLiquidaGravable = Math.max(0, rentaLiquidaOrdinaria - maxDeduccionPermitida)

  const netIncomeInUvt = Math.max(0, rentaLiquidaGravable / uvtValue)

  // ─── Income Tax Calculation (Declaración de Renta) ───
  const calculatedTax = useMemo(() => {
    if (rentaLiquidaGravable <= 0) return 0

    if (taxType === 'juridica') {
      // General Corporate Tax Rate in Colombia: 35%
      return rentaLiquidaGravable * 0.35
    } else {
      // Progressive personal tax schedule (Formulario 210, Art. 241 Estatuto Tributario)
      const uvt = netIncomeInUvt
      let taxInUvt = 0

      if (uvt <= 1090) {
        taxInUvt = 0
      } else if (uvt <= 1700) {
        taxInUvt = (uvt - 1090) * 0.19
      } else if (uvt <= 4100) {
        taxInUvt = (uvt - 1700) * 0.28 + 116
      } else if (uvt <= 8670) {
        taxInUvt = (uvt - 4100) * 0.33 + 788
      } else if (uvt <= 18970) {
        taxInUvt = (uvt - 8670) * 0.35 + 2296
      } else if (uvt <= 31000) {
        taxInUvt = (uvt - 18970) * 0.37 + 5901
      } else {
        taxInUvt = (uvt - 31000) * 0.39 + 10352
      }

      return taxInUvt * uvtValue
    }
  }, [rentaLiquidaGravable, taxType, netIncomeInUvt, uvtValue])

  // Total tax to pay after deducting retenciones (Anticipos)
  const finalRentaToPay = Math.max(0, calculatedTax - retencionesFuente)

  // ─── IVA Calculation ───
  const totalIvaCollected = useMemo(() => {
    return yearInvoices.reduce((sum, inv) => {
      if (inv.tax) return sum + (inv.tax || 0)
      return sum + (inv.total * 0.19 / 1.19)
    }, 0)
  }, [yearInvoices])

  const totalIvaDeductible = useMemo(() => {
    return yearExpenses.reduce((sum, exp) => {
      if (exp.iva_paid !== undefined && exp.iva_paid !== null && Number(exp.iva_paid) > 0) {
        return sum + Number(exp.iva_paid)
      }
      if (exp.category !== 'Salarios/Nómina') {
        const expenseIvaRate = estimatedIvaRate / 100
        return sum + (exp.amount * expenseIvaRate / (1 + expenseIvaRate))
      }
      return sum
    }, 0)
  }, [yearExpenses, estimatedIvaRate])

  const netIvaBalance = totalIvaCollected - totalIvaDeductible

  // ─── Exógena Data Audit ───
  const exogenaAudit = useMemo(() => {
    let clientsMissingDoc = 0
    let expensesMissingDoc = 0
    
    // Audit invoices / clients
    const uniqueClientsInInvoices = new Set(yearInvoices.map(inv => inv.client_id || 'CLIENTE_EXPRESS'))
    uniqueClientsInInvoices.forEach(cId => {
      if (cId === 'CLIENTE_EXPRESS') return
      const clientObj = clients.find(c => c.id === cId)
      if (!clientObj || !clientObj.document_id || clientObj.document_id.trim() === '') {
        clientsMissingDoc++
      }
    })

    // Audit expenses / providers
    yearExpenses.forEach(exp => {
      if (!exp.provider_doc_id || exp.provider_doc_id.trim() === '') {
        expensesMissingDoc++
      }
    })

    return {
      clientsMissingDoc,
      expensesMissingDoc,
      hasIssues: clientsMissingDoc > 0 || expensesMissingDoc > 0
    }
  }, [yearInvoices, yearExpenses, clients])

  // ─── Exógena Exporters ───
  const downloadExogena1007 = () => {
    const clientMap = {}
    
    yearInvoices.forEach((inv) => {
      const clientId = inv.client_id || 'CLIENTE_EXPRESS'
      const clientObj = clients.find(c => c.id === clientId)
      
      const docType = clientObj?.document_type || '13'
      const docNum = clientObj?.document_id || '222222222'
      const name = clientObj?.name || 'Cliente Express / Consumidor Final'
      
      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          concepto: '4001',
          tipoDoc: docType,
          identificacion: docNum,
          primerApellido: name.split(' ')[1] || '',
          primerNombre: name.split(' ')[0] || name,
          razonSocial: clientObj?.companyName || '',
          direccion: clientObj?.address || 'Sin Dirección',
          departamento: '11',
          municipio: '001',
          pais: '169',
          ingresosBrutos: 0,
          devoluciones: 0
        }
      }
      clientMap[clientId].ingresosBrutos += (inv.total || 0)
    })

    const rows = Object.values(clientMap)
    
    if (rows.length === 0) {
      toast.error('No hay datos de ventas en este año para generar el Formato 1007')
      return
    }

    let csvContent = "Concepto,Tipo Documento,Numero Identificacion,Primer Apellido,Primer Nombre,Razon Social,Direccion,Departamento,Municipio,Pais,Ingresos Brutos,Devoluciones y Descuentos\r\n"
    
    rows.forEach(r => {
      csvContent += `${r.concepto},${r.tipoDoc},${r.identificacion},"${r.primerApellido}","${r.primerNombre}","${r.razonSocial}","${r.direccion}",${r.departamento},${r.municipio},${r.pais},${Math.round(r.ingresosBrutos)},0\r\n`
    })

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `DIAN_Exogena_Formato_1007_${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Formato 1007 (Ingresos) exportado con éxito')
  }

  const downloadExogena1001 = () => {
    const getConcept = (cat) => {
      switch (cat) {
        case 'Salarios/Nómina': return '5001'
        case 'Alquiler/Servicios': return '5016'
        case 'Marketing/Publicidad': return '5002'
        case 'Inventario/Mercancía': return '5007'
        default: return '5008'
      }
    }

    if (yearExpenses.length === 0) {
      toast.error('No hay datos de egresos en este año para generar el Formato 1001')
      return
    }

    let csvContent = "Concepto,Tipo Documento,Numero Identificacion,Primer Apellido,Primer Nombre,Razon Social,Direccion,Departamento,Municipio,Pais,Pago o Abono en Cuenta (Deducible),Pago o Abono en Cuenta (No Deducible),Retencion en la Fuente Practicada\r\n"

    yearExpenses.forEach((exp) => {
      const concept = getConcept(exp.category)
      const providerName = exp.provider_name || 'Proveedor Varios'
      const docType = exp.provider_doc_type || '31'
      const docNum = exp.provider_doc_id || '999999999'
      const ret = exp.retencion || 0

      csvContent += `${concept},${docType},${docNum},,"","${providerName}","Calle Ficticia 123",11,001,169,${Math.round(exp.amount)},0,${Math.round(ret)}\r\n`
    })

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `DIAN_Exogena_Formato_1001_${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Formato 1001 (Egresos) exportado con éxito')
  }

  return (
    <div className="page-container space-y-6 pb-12">
      {/* ── Fixed Sticky Page Header ─────────────────── */}
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <Calculator className="text-brand-400" />
            Asistente DIAN
          </h1>
          <p className="hidden sm:block text-xs text-muted-400">
            Módulo tributario interactivo para estimar impuesto de renta, liquidación de IVA e información exógena.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-10 px-3 rounded-xl bg-surface-800 border border-subtle text-sm text-foreground focus:outline-none focus:border-brand-500 font-bold transition-colors cursor-pointer"
          >
            <option value="2025">Año 2025</option>
            <option value="2026">Año 2026</option>
          </select>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex gap-3.5 p-4 rounded-2xl bg-warning-500/10 border border-warning-500/25 text-warning-400">
        <AlertTriangle className="shrink-0 mt-0.5" size={18} />
        <div>
          <h3 className="text-sm font-bold">Módulo Experimental Informativo</h3>
          <p className="text-xs opacity-90 mt-1 leading-relaxed">
            Las cifras simuladas aquí son proyecciones basadas únicamente en las facturas de venta y egresos registrados en Gestiva One. Esta simulación no reemplaza la asesoría oficial de un Contador Público Titulado y no constituye una declaración tributaria vinculante.
          </p>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-800/50 p-4 rounded-2xl border border-subtle/50">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-400">Tipo de Contribuyente (Renta)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTaxType('juridica')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-300 ${
                taxType === 'juridica'
                  ? 'bg-brand-600 border-brand-500 text-white shadow-glow-sm'
                  : 'bg-surface-800 border-subtle text-muted-400 hover:text-foreground'
              }`}
            >
              Jurídica (35%)
            </button>
            <button
              onClick={() => setTaxType('natural')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-300 ${
                taxType === 'natural'
                  ? 'bg-brand-600 border-brand-500 text-white shadow-glow-sm'
                  : 'bg-surface-800 border-subtle text-muted-400 hover:text-foreground'
              }`}
            >
              Natural (UVT)
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-400">Tasa Est. IVA Egresos: {estimatedIvaRate}%</label>
          <input
            type="range"
            min="0"
            max="19"
            step="1"
            value={estimatedIvaRate}
            onChange={(e) => setEstimatedIvaRate(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-surface-700 accent-brand-500 cursor-pointer"
          />
          <p className="text-[10px] text-muted-400">
            Ajusta para estimar el IVA promedio cobrado por tus proveedores en tus compras.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-none whitespace-nowrap border-b border-subtle -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('renta')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'renta'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-muted-400 hover:text-foreground dark:hover:text-white'
          }`}
        >
          Simulador Renta
        </button>
        <button
          onClick={() => setActiveTab('iva')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'iva'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-muted-400 hover:text-foreground dark:hover:text-white'
          }`}
        >
          Liquidación IVA
        </button>
        <button
          onClick={() => setActiveTab('exogena')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'exogena'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-muted-400 hover:text-foreground dark:hover:text-white'
          }`}
        >
          Información Exógena
        </button>
      </div>

      {/* ─── TAB CONTENT: RENTA ─── */}
      {activeTab === 'renta' && (
        <div className="space-y-6">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-surface-800 border border-subtle p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-400 font-bold uppercase tracking-wider">Ingresos Brutos ({selectedYear})</span>
                <h3 className="text-2xl font-black text-foreground mt-1.5">{format$(totalSales)}</h3>
                <span className="text-[10px] text-brand-400 font-semibold block mt-1">Soportados por Factura Electrónica</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success-500/10 text-success-400 flex items-center justify-center">
                <ArrowUpRight size={20} />
              </div>
            </div>

            <div className="bg-surface-800 border border-subtle p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-400 font-bold uppercase tracking-wider">Costos y Deducciones</span>
                <h3 className="text-2xl font-black text-foreground mt-1.5">{format$(totalCost)}</h3>
                <span className="text-[10px] text-brand-400 font-semibold block mt-1">Egresos operativos registrados</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-danger-500/10 text-danger-400 flex items-center justify-center">
                <ArrowDownRight size={20} />
              </div>
            </div>

            <div className="bg-brand-600/10 border border-brand-500/30 p-5 rounded-2xl flex items-center justify-between shadow-glow-sm">
              <div>
                <span className="text-xs text-brand-300 font-bold uppercase tracking-wider">Renta Líquida Gravable</span>
                <h3 className="text-2xl font-black text-foreground mt-1.5">{format$(rentaLiquidaGravable)}</h3>
                <span className="text-[10px] text-brand-300/80 font-semibold block mt-1">
                  ~ {netIncomeInUvt.toFixed(1)} UVT ({format$(uvtValue)} c/u)
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center">
                <Landmark size={20} />
              </div>
            </div>
          </div>

          {/* Renta Calculation Detail Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {/* Column 1: Adjustments Inputs */}
            <div className="bg-surface-800 border border-subtle p-6 rounded-3xl space-y-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calculator size={18} className="text-brand-400" />
                Ajustes Tributarios del Año
              </h3>

              <div className="space-y-4">
                {/* INCR input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-400 uppercase tracking-wide">
                      Ingresos No Constitutivos de Renta (INCR)
                    </label>
                    <HelpCircle size={14} className="text-muted-500 cursor-help" title="Aportes obligatorios a salud, pensión, etc." />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      value={ingresosNoConstitutivos || ''}
                      onChange={(e) => setIngresosNoConstitutivos(Math.max(0, Number(e.target.value)))}
                      placeholder="Ej: 3000000"
                      className="w-full bg-surface-700 border border-subtle rounded-xl pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-500 font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-muted-500">Aportes a seguridad social que reducen los ingresos netos.</p>
                </div>

                {/* Rentas Exentas input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-400 uppercase tracking-wide">
                      Rentas Exentas y Deducciones
                    </label>
                    <HelpCircle size={14} className="text-muted-500 cursor-help" title="Medicina prepagada, dependientes, aportes AFC, renta exenta del 25%" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      value={rentasExentas || ''}
                      onChange={(e) => setRentasExentas(Math.max(0, Number(e.target.value)))}
                      placeholder="Ej: 5000000"
                      className="w-full bg-surface-700 border border-subtle rounded-xl pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-500 font-semibold"
                    />
                  </div>
                  {taxType === 'natural' && (
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-[10px] text-muted-500">
                        Límite de deducción (40% de renta ordinaria o 1,340 UVT):{' '}
                        <span className="font-bold text-brand-400">
                          {format$(Math.min(rentaLiquidaOrdinaria * 0.40, 1340 * uvtValue))}
                        </span>
                      </p>
                      {rentasExentas > rentaLiquidaOrdinaria * 0.40 && (
                        <span className="text-[9px] text-warning-400 font-semibold">
                          ⚠️ Has superado el límite del 40% ordinario. Se limitará automáticamente en el cálculo.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Retenciones Fuente input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-400 uppercase tracking-wide">
                      Retenciones en la Fuente Practicadas
                    </label>
                    <HelpCircle size={14} className="text-muted-500 cursor-help" title="Anticipos de renta retenidos por tus clientes" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      value={retencionesFuente || ''}
                      onChange={(e) => setRetencionesFuente(Math.max(0, Number(e.target.value)))}
                      placeholder="Ej: 1500000"
                      className="w-full bg-surface-700 border border-subtle rounded-xl pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-500 font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-muted-500">Impuesto pagado por anticipado que se resta del saldo final.</p>
                </div>
              </div>
            </div>

            {/* Column 2: Tax Calculation Ledger */}
            <div className="bg-surface-800 border border-subtle p-6 rounded-3xl space-y-6">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText size={18} className="text-brand-400" />
                Depuración de Renta e Impuesto Neto
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between border-b border-subtle/30 pb-2">
                  <span className="text-xs text-muted-400">(+) Ingresos Brutos Totales</span>
                  <span className="text-xs font-semibold text-foreground">{format$(totalSales)}</span>
                </div>
                <div className="flex justify-between border-b border-subtle/30 pb-2">
                  <span className="text-xs text-muted-400">(-) Ingresos No Constitutivos (INCR)</span>
                  <span className="text-xs font-semibold text-danger-400">-{format$(ingresosNoConstitutivos)}</span>
                </div>
                <div className="flex justify-between border-b border-subtle/30 pb-2 font-bold bg-surface-700/20 px-2 py-1.5 rounded-lg">
                  <span className="text-xs text-foreground">(=) Ingresos Netos</span>
                  <span className="text-xs text-foreground">{format$(netSales)}</span>
                </div>
                <div className="flex justify-between border-b border-subtle/30 pb-2">
                  <span className="text-xs text-muted-400">(-) Costos y Deducciones Operativas</span>
                  <span className="text-xs font-semibold text-danger-400">-{format$(totalCost)}</span>
                </div>
                <div className="flex justify-between border-b border-subtle/30 pb-2 font-bold bg-surface-700/20 px-2 py-1.5 rounded-lg">
                  <span className="text-xs text-foreground">(=) Renta Líquida Ordinaria</span>
                  <span className="text-xs text-foreground">{format$(rentaLiquidaOrdinaria)}</span>
                </div>
                <div className="flex justify-between border-b border-subtle/30 pb-2">
                  <span className="text-xs text-muted-400 flex items-center gap-1.5">
                    (-) Rentas Exentas y Deducciones
                    {rentasExentas > maxDeduccionPermitida && (
                      <Badge variant="warning" className="text-[8px] py-0 px-1 font-bold">Limitado</Badge>
                    )}
                  </span>
                  <span className="text-xs font-semibold text-danger-400">-{format$(maxDeduccionPermitida)}</span>
                </div>
                <div className="flex justify-between border-b border-subtle/30 pb-2 font-bold bg-brand-500/10 px-2 py-1.5 rounded-lg border border-brand-500/25">
                  <span className="text-xs text-brand-300">(=) Renta Líquida Gravable</span>
                  <span className="text-xs text-foreground">{format$(rentaLiquidaGravable)}</span>
                </div>
                <div className="flex justify-between border-b border-subtle/30 pb-2">
                  <span className="text-xs text-muted-400">
                    (=) Impuesto de Renta Proyectado ({taxType === 'juridica' ? '35%' : `${(calculatedTax / (rentaLiquidaGravable || 1) * 100).toFixed(1)}% prom.`})
                  </span>
                  <span className="text-xs font-semibold text-foreground">{format$(calculatedTax)}</span>
                </div>
                <div className="flex justify-between border-b border-subtle/30 pb-2">
                  <span className="text-xs text-muted-400">(-) Retenciones en la Fuente (Anticipos)</span>
                  <span className="text-xs font-semibold text-success-400">-{format$(retencionesFuente)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-subtle font-black bg-brand-600/10 px-3 py-2.5 rounded-xl border border-brand-500/35 shadow-glow-sm">
                  <span className="text-sm text-foreground flex items-center gap-1">
                    (=) TOTAL NETO A PAGAR
                  </span>
                  <span className="text-sm text-brand-400">{format$(finalRentaToPay)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: IVA ─── */}
      {activeTab === 'iva' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales IVA */}
            <div className="bg-surface-800 border border-subtle p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-400 font-bold uppercase tracking-wider">IVA Generado (Cobrado en Ventas)</span>
                <span className="w-8 h-8 rounded-lg bg-success-500/10 text-success-400 flex items-center justify-center">
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <h3 className="text-2xl font-black text-foreground">{format$(totalIvaCollected)}</h3>
              <p className="text-xs text-muted-400">
                Calculado a partir del desglose de IVA de las facturas de venta realizadas.
              </p>
              <button
                onClick={() => setShowSalesIvaDetail(!showSalesIvaDetail)}
                className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-2 focus:outline-none"
              >
                {showSalesIvaDetail ? 'Ocultar desglose' : 'Ver desglose detallado'}
              </button>

              {showSalesIvaDetail && (
                <div className="mt-4 border-t border-subtle/50 pt-4 overflow-x-auto max-h-64 overflow-y-auto no-scrollbar">
                  <table className="w-full text-left text-xs text-muted-400">
                    <thead>
                      <tr className="border-b border-subtle/40 text-[10px] uppercase font-bold text-muted-500">
                        <th className="pb-2">Factura</th>
                        <th className="pb-2">Cliente</th>
                        <th className="pb-2">Fecha</th>
                        <th className="pb-2 text-right">Total</th>
                        <th className="pb-2 text-right">IVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-muted-500">No hay ventas registradas en {selectedYear}</td>
                        </tr>
                      ) : (
                        yearInvoices.map((inv) => {
                          const calculatedIva = inv.tax || (inv.total * 0.19 / 1.19)
                          return (
                            <tr key={inv.id} className="border-b border-subtle/20 last:border-0 hover:bg-surface-700/30">
                              <td className="py-2 font-mono text-foreground font-semibold">{inv.id.slice(-8).toUpperCase()}</td>
                              <td className="py-2 truncate max-w-[120px]">{inv.client_name}</td>
                              <td className="py-2">{inv.created_at.slice(0, 10)}</td>
                              <td className="py-2 text-right font-semibold text-foreground">{format$(inv.total)}</td>
                              <td className="py-2 text-right font-bold text-success-400">
                                {format$(calculatedIva)}
                                {!inv.tax && <span className="text-[9px] text-muted-500 font-normal block">(Est. 19%)</span>}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Expenses IVA */}
            <div className="bg-surface-800 border border-subtle p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-400 font-bold uppercase tracking-wider">IVA Descontable (Pagado en Compras)</span>
                <span className="w-8 h-8 rounded-lg bg-danger-500/10 text-danger-400 flex items-center justify-center">
                  <ArrowDownRight size={16} />
                </span>
              </div>
              <h3 className="text-2xl font-black text-foreground">{format$(totalIvaDeductible)}</h3>
              <p className="text-xs text-muted-400">
                Estimado a partir del {estimatedIvaRate}% sobre egresos operacionales (excepto nóminas).
              </p>
              <button
                onClick={() => setShowExpensesIvaDetail(!showExpensesIvaDetail)}
                className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-2 focus:outline-none"
              >
                {showExpensesIvaDetail ? 'Ocultar desglose' : 'Ver desglose detallado'}
              </button>

              {showExpensesIvaDetail && (
                <div className="mt-4 border-t border-subtle/50 pt-4 overflow-x-auto max-h-64 overflow-y-auto no-scrollbar">
                  <table className="w-full text-left text-xs text-muted-400">
                    <thead>
                      <tr className="border-b border-subtle/40 text-[10px] uppercase font-bold text-muted-500">
                        <th className="pb-2">Proveedor</th>
                        <th className="pb-2">Categoría</th>
                        <th className="pb-2">Fecha</th>
                        <th className="pb-2 text-right">Monto</th>
                        <th className="pb-2 text-right">IVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearExpenses.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-muted-500">No hay egresos registrados en {selectedYear}</td>
                        </tr>
                      ) : (
                        yearExpenses.map((exp) => {
                          const isSalary = exp.category === 'Salarios/Nómina'
                          const hasActualIva = exp.iva_paid !== undefined && exp.iva_paid !== null && Number(exp.iva_paid) > 0
                          const calculatedIva = hasActualIva 
                            ? Number(exp.iva_paid)
                            : isSalary ? 0 : (exp.amount * (estimatedIvaRate / 100) / (1 + (estimatedIvaRate / 100)))

                          return (
                            <tr key={exp.id} className="border-b border-subtle/20 last:border-0 hover:bg-surface-700/30">
                              <td className="py-2 truncate max-w-[120px] text-foreground font-semibold">{exp.provider_name}</td>
                              <td className="py-2">{exp.category}</td>
                              <td className="py-2">{exp.created_at ? exp.created_at.slice(0, 10) : ''}</td>
                              <td className="py-2 text-right font-semibold text-foreground">{format$(exp.amount)}</td>
                              <td className="py-2 text-right font-bold text-danger-400">
                                {format$(calculatedIva)}
                                {isSalary ? (
                                  <span className="text-[9px] text-muted-500 font-normal block">(Exento/Nómina)</span>
                                ) : hasActualIva ? (
                                  <span className="text-[9px] text-success-400 font-normal block">(Real)</span>
                                ) : (
                                  <span className="text-[9px] text-muted-500 font-normal block">(Est. {estimatedIvaRate}%)</span>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* IVA Balance Card */}
          <div className="bg-surface-800 border border-subtle p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Resultado de Impuesto a las Ventas (IVA)</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-700/50 border border-subtle/50">
              <div>
                <span className="text-xs text-muted-400 font-bold uppercase tracking-wider">Balance Neto Proyectado</span>
                <h2 className="text-3xl font-black text-foreground mt-1">
                  {format$(Math.abs(netIvaBalance))}
                </h2>
                <span className="text-[10px] text-muted-400 mt-1 block">
                  {netIvaBalance >= 0 ? 'Monto estimado a pagar a favor de la DIAN' : 'Saldo a favor proyectado'}
                </span>
              </div>
              <Badge variant={netIvaBalance >= 0 ? 'warning' : 'primary'} className="text-xs py-1.5 px-3">
                {netIvaBalance >= 0 ? 'Saldo a Pagar' : 'Saldo a Favor'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: EXOGENA ─── */}
      {activeTab === 'exogena' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/25 text-brand-300">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Landmark size={16} />
              ¿Qué es la Exógena y para qué sirven estos archivos?
            </h3>
            <p className="text-xs opacity-90 mt-1 leading-relaxed">
              La DIAN exige anualmente a las empresas reportar las operaciones realizadas con terceros (clientes y proveedores) en formatos XML predefinidos. Los archivos CSV que puedes descargar a continuación consolidan y formatean automáticamente tus registros en Gestiva One para rellenar fácilmente los borradores de los <strong>Formatos 1001 y 1007</strong> del Prevalidador de la DIAN.
            </p>
          </div>

          {/* Data Audit Card */}
          <div className="bg-surface-800 border border-subtle p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Landmark size={18} className="text-brand-400" />
              Auditoría y Calidad de los Datos (Exógena)
            </h3>

            {exogenaAudit.hasIssues ? (
              <div className="flex gap-3.5 p-4 rounded-2xl bg-danger-500/10 border border-danger-500/25 text-danger-400 text-xs">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Se encontraron inconsistencias en tus datos de {selectedYear}</h4>
                  <p className="opacity-90 mt-1 leading-relaxed">
                    Hay registros de transacciones que no cuentan con un número de identificación (NIT/Cédula) del tercero:
                  </p>
                  <ul className="list-disc pl-4 mt-2 space-y-1">
                    {exogenaAudit.clientsMissingDoc > 0 && (
                      <li>{exogenaAudit.clientsMissingDoc} cliente(s) con NIT/Cédula faltante (afecta Formato 1007).</li>
                    )}
                    {exogenaAudit.expensesMissingDoc > 0 && (
                      <li>{exogenaAudit.expensesMissingDoc} proveedor(es) con NIT/Cédula faltante (afecta Formato 1001).</li>
                    )}
                  </ul>
                  <p className="opacity-80 mt-2">
                    Aunque puedes descargar los archivos CSV, te recomendamos completar estos datos en los módulos de Clientes y Egresos para evitar sanciones de la DIAN.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3.5 p-4 rounded-2xl bg-success-500/10 border border-success-500/25 text-success-400 text-xs">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">¡Calidad de datos excelente!</h4>
                  <p className="opacity-90 mt-1 leading-relaxed">
                    Todos los clientes y proveedores asociados a transacciones del año {selectedYear} cuentan con tipo y número de documento registrado. Los formatos 1001 y 1007 se generarán con NITs completos.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formato 1007 */}
            <div className="bg-surface-800 border border-subtle p-6 rounded-3xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <Badge variant="primary" className="text-[10px] uppercase font-bold">Ventas / Ingresos</Badge>
                <h4 className="text-base font-bold text-foreground">Formato 1007: Ingresos Propios</h4>
                <p className="text-xs text-muted-400 leading-relaxed">
                  Consolida los ingresos recibidos por facturación de ventas agrupados por NIT/Documento del cliente. Mapea la información de contacto y montos brutos de facturación.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center gap-2 mt-4"
                icon={<Download size={16} />}
                onClick={downloadExogena1007}
              >
                Exportar Formato 1007 (.csv)
              </Button>
            </div>

            {/* Formato 1001 */}
            <div className="bg-surface-800 border border-subtle p-6 rounded-3xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <Badge variant="warning" className="text-[10px] uppercase font-bold">Compras / Egresos</Badge>
                <h4 className="text-base font-bold text-foreground">Formato 1001: Pagos a Terceros</h4>
                <p className="text-xs text-muted-400 leading-relaxed">
                  Lista todos tus costos, egresos y pagos de nómina mapeando automáticamente las categorías a sus conceptos tributarios DIAN correspondientes (5001, 5016, 5002, 5007).
                </p>
              </div>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-center gap-2 mt-4"
                icon={<Download size={16} />}
                onClick={downloadExogena1001}
              >
                Exportar Formato 1001 (.csv)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
