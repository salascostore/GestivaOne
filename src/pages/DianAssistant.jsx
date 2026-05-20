import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Calculator, Download, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, FileText, Info, HelpCircle, Landmark 
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

  const invoices = useInvoiceStore((s) => s.invoices)
  const expenses = useExpenseStore((s) => s.expenses)
  const clients = useClientStore((s) => s.clients)
  const format$ = useCurrencyStore((s) => s.format)

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

  const netIncome = totalSales - totalCost

  // ─── UVT Calculations ───
  // Values: 2025 UVT = $49,741 COP | 2026 UVT = $52,000 COP
  const uvtValue = selectedYear === '2025' ? 49741 : 52000
  const netIncomeInUvt = Math.max(0, netIncome / uvtValue)

  // ─── Income Tax Calculation (Declaración de Renta) ───
  const calculatedTax = useMemo(() => {
    if (netIncome <= 0) return 0

    if (taxType === 'juridica') {
      // General Corporate Tax Rate in Colombia: 35%
      return netIncome * 0.35
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
  }, [netIncome, taxType, netIncomeInUvt, uvtValue])

  // ─── IVA Calculation ───
  const totalIvaCollected = useMemo(() => {
    // Gestiva One stores invoice tax or we estimate 19% on invoices with tax flag
    return yearInvoices.reduce((sum, inv) => {
      if (inv.tax) return sum + (inv.tax || 0)
      // Fallback: estimate 19% IVA included
      return sum + (inv.total * 0.19 / 1.19)
    }, 0)
  }, [yearInvoices])

  const totalIvaDeductible = useMemo(() => {
    // Estimate based on expenses categories that typically carry IVA (e.g. inventory, marketing, arriendos)
    return yearExpenses.reduce((sum, exp) => {
      const applicableCategories = ['Inventario/Mercancía', 'Marketing/Publicidad', 'Alquiler/Servicios']
      if (applicableCategories.includes(exp.category)) {
        // Calculate estimated IVA included in expense
        const expenseIvaRate = estimatedIvaRate / 100
        return sum + (exp.amount * expenseIvaRate / (1 + expenseIvaRate))
      }
      return sum
    }, 0)
  }, [yearExpenses, estimatedIvaRate])

  const netIvaBalance = totalIvaCollected - totalIvaDeductible

  // ─── Exógena Exporters ───
  const downloadExogena1007 = () => {
    // Group invoices by client
    const clientMap = {}
    
    yearInvoices.forEach((inv) => {
      const clientId = inv.client_id || 'CLIENTE_EXPRESS'
      const clientObj = clients.find(c => c.id === clientId)
      
      const docType = clientObj?.documentType || '13' // Default Cédula de Ciudadanía
      const docNum = clientObj?.phone || '222222222' // Placeholder or NIT
      const name = clientObj?.name || 'Cliente Express / Consumidor Final'
      
      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          concepto: '4001', // Ingresos operacionales ordinarios
          tipoDoc: docType,
          identificacion: docNum,
          primerApellido: name.split(' ')[1] || '',
          primerNombre: name.split(' ')[0] || name,
          razonSocial: clientObj?.companyName || '',
          direccion: clientObj?.address || 'Sin Dirección',
          departamento: '11', // Default Bogotá
          municipio: '001',
          pais: '169', // Colombia
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

    // CSV Header
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
    // Map categories to DIAN Concepts
    const getConcept = (cat) => {
      switch (cat) {
        case 'Salarios/Nómina': return '5001' // Pagos laborales
        case 'Alquiler/Servicios': return '5016' // Arrendamientos
        case 'Marketing/Publicidad': return '5002' // Honorarios/Publicidad
        case 'Inventario/Mercancía': return '5007' // Inventario
        default: return '5008' // Otros costos y deducciones
      }
    }

    if (yearExpenses.length === 0) {
      toast.error('No hay datos de egresos en este año para generar el Formato 1001')
      return
    }

    // CSV Header
    let csvContent = "Concepto,Tipo Documento,Numero Identificacion,Primer Apellido,Primer Nombre,Razon Social,Direccion,Departamento,Municipio,Pais,Pago o Abono en Cuenta (Deducible),Pago o Abono en Cuenta (No Deducible),Retencion en la Fuente Practicada\r\n"

    yearExpenses.forEach((exp) => {
      const concept = getConcept(exp.category)
      const desc = exp.description || 'Proveedor Varios'
      
      // Synthesize mock supplier details for Excel editing
      const docType = '31' // NIT
      const docNum = '999999999' // Template NIT
      const razonSocial = desc.substring(0, 30)
      
      csvContent += `${concept},${docType},${docNum},,"","${razonSocial}","Calle Ficticia 123",11,001,169,${Math.round(exp.amount)},0,0\r\n`
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
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle/20 flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <Calculator className="text-brand-400" />
            Asistente DIAN
          </h1>
          <p className="hidden sm:block text-xs text-muted-400">
            Módulo tributario experimental para la estimación de impuestos y exógena en Colombia.
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
                  : 'bg-surface-800 border-subtle text-muted-400 hover:text-white'
              }`}
            >
              Jurídica (35%)
            </button>
            <button
              onClick={() => setTaxType('natural')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-300 ${
                taxType === 'natural'
                  ? 'bg-brand-600 border-brand-500 text-white shadow-glow-sm'
                  : 'bg-surface-800 border-subtle text-muted-400 hover:text-white'
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
              : 'border-transparent text-muted-400 hover:text-white'
          }`}
        >
          Simulador Renta
        </button>
        <button
          onClick={() => setActiveTab('iva')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'iva'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-muted-400 hover:text-white'
          }`}
        >
          Liquidación IVA
        </button>
        <button
          onClick={() => setActiveTab('exogena')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'exogena'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-muted-400 hover:text-white'
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
                <h3 className="text-2xl font-black text-white mt-1.5">{format$(totalSales)}</h3>
                <span className="text-[10px] text-brand-400 font-semibold block mt-1">Soportados por Factura Electrónica</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success-500/10 text-success-400 flex items-center justify-center">
                <ArrowUpRight size={20} />
              </div>
            </div>

            <div className="bg-surface-800 border border-subtle p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-400 font-bold uppercase tracking-wider">Costos y Deducciones</span>
                <h3 className="text-2xl font-black text-white mt-1.5">{format$(totalCost)}</h3>
                <span className="text-[10px] text-brand-400 font-semibold block mt-1">Egresos operativos registrados</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-danger-500/10 text-danger-400 flex items-center justify-center">
                <ArrowDownRight size={20} />
              </div>
            </div>

            <div className="bg-brand-600/10 border border-brand-500/30 p-5 rounded-2xl flex items-center justify-between shadow-glow-sm">
              <div>
                <span className="text-xs text-brand-300 font-bold uppercase tracking-wider">Renta Líquida Gravable</span>
                <h3 className="text-2xl font-black text-white mt-1.5">{format$(netIncome)}</h3>
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
          <div className="bg-surface-800 border border-subtle p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-brand-400" />
              Proyección de Impuesto de Renta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-subtle/50 pb-2.5">
                  <span className="text-sm text-muted-400">Renta Líquida Gravable</span>
                  <span className="text-sm font-bold text-white">{format$(netIncome)}</span>
                </div>
                <div className="flex justify-between border-b border-subtle/50 pb-2.5">
                  <span className="text-sm text-muted-400">Tarifa Aplicada</span>
                  <span className="text-sm font-bold text-white">
                    {taxType === 'juridica' ? '35% Fijo' : 'Progresivo UVT'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-subtle/50 pb-2.5">
                  <span className="text-sm text-muted-400">Ingresos Exentos / Beneficios</span>
                  <span className="text-sm font-bold text-success-400">$0 COP (No Configurado)</span>
                </div>
                <div className="flex justify-between border-b border-subtle/50 pb-2.5 bg-brand-600/5 p-2 rounded-xl">
                  <span className="text-sm text-brand-300 font-bold">Impuesto Estimado a Declarar</span>
                  <span className="text-sm font-black text-brand-400">{format$(calculatedTax)}</span>
                </div>
              </div>

              <div className="p-4 bg-surface-700/50 rounded-2xl border border-subtle/40 space-y-3">
                <div className="flex items-center gap-2 text-brand-400">
                  <Info size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Detalle del Cálculo</span>
                </div>
                {taxType === 'juridica' ? (
                  <p className="text-xs text-muted-400 leading-relaxed">
                    Las personas jurídicas (empresas) en Colombia están sujetas a una tarifa única general de renta del <strong>35%</strong> (Art. 240 E.T.). Se calcula multiplicando tu Renta Líquida por 0.35.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs text-muted-400 leading-relaxed">
                    <p>
                      Las personas naturales tributan mediante una tabla progresiva medida en UVT. Con tu renta líquida de <strong>{netIncomeInUvt.toFixed(1)} UVT</strong>:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Primeras 1,090 UVT: <strong>Exentas (Tarifa 0%)</strong></li>
                      <li>Siguiente tramo: Calculado progresivamente según rangos de la DIAN.</li>
                    </ul>
                  </div>
                )}
                <div className="text-[10px] text-muted-500 pt-2 border-t border-subtle/40">
                  * Recuerda registrar todos tus gastos en la sección de Egresos para bajar legalmente tu Renta Líquida.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: IVA ─── */}
      {activeTab === 'iva' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales IVA */}
            <div className="bg-surface-800 border border-subtle p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-400 font-bold uppercase tracking-wider">IVA Generado (Cobrado en Ventas)</span>
                <span className="w-8 h-8 rounded-lg bg-success-500/10 text-success-400 flex items-center justify-center">
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">{format$(totalIvaCollected)}</h3>
              <p className="text-xs text-muted-400">
                Calculado a partir del desglose de IVA de las facturas de venta realizadas.
              </p>
            </div>

            {/* Expenses IVA */}
            <div className="bg-surface-800 border border-subtle p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-400 font-bold uppercase tracking-wider">IVA Descontable (Pagado en Compras)</span>
                <span className="w-8 h-8 rounded-lg bg-danger-500/10 text-danger-400 flex items-center justify-center">
                  <ArrowDownRight size={16} />
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">{format$(totalIvaDeductible)}</h3>
              <p className="text-xs text-muted-400">
                Estimado a partir del {estimatedIvaRate}% sobre compras de inventario, publicidad y arriendos.
              </p>
            </div>
          </div>

          {/* IVA Balance Card */}
          <div className="bg-surface-800 border border-subtle p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white">Resultado de Impuesto a las Ventas (IVA)</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-700/50 border border-subtle/50">
              <div>
                <span className="text-xs text-muted-400 font-bold uppercase tracking-wider">Balance Neto Proyectado</span>
                <h2 className="text-3xl font-black text-white mt-1">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formato 1007 */}
            <div className="bg-surface-800 border border-subtle p-6 rounded-3xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <Badge variant="primary" className="text-[10px] uppercase font-bold">Ventas / Ingresos</Badge>
                <h4 className="text-base font-bold text-white">Formato 1007: Ingresos Propios</h4>
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
                <h4 className="text-base font-bold text-white">Formato 1001: Pagos a Terceros</h4>
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
