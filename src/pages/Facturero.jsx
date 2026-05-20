import { useState } from 'react'
import { Printer, FileText, Check, Save, Download, Image, HelpCircle, AlertCircle, Sparkles, Building2, Phone, Mail, FileCheck } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { printInvoice } from '@/services/printService'
import { exportSingleInvoicePDF } from '@/services/exportService'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const MOCK_INVOICE = {
  id: 'f-8a9c12bf',
  created_at: new Date().toISOString(),
  payment_type: 'immediate',
  payment_status: 'paid',
  client_name: 'Randy Mendoza',
  client_phone: '312 456 7890',
  client_email: 'randy.mendoza@example.com',
  client_address: 'Calle 45 #12-89, Bogotá',
  subtotal: 305390,
  taxRate: 0.19,
  taxAmount: 58024,
  total: 363414,
  items: [
    { name: 'Licuadora Oster Cromada', quantity: 1, price: 215390 },
    { name: 'Termo Térmico 1.5L', quantity: 2, price: 45000 }
  ]
}

export default function Facturero() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const format = useCurrencyStore((s) => s.format)
  
  // Settings store
  const { printer, setPrinter } = useSettingsStore()
  
  // Local states for custom edit (we sync with settings on Save)
  const [pdfTemplate, setPdfTemplate] = useState(printer.pdfTemplate || 'corporate')
  const [thermalTemplate, setThermalTemplate] = useState(printer.template || 'classic')
  const [autoPrint, setAutoPrint] = useState(printer.autoPrint || false)
  const [showLogo, setShowLogo] = useState(printer.showLogo !== false)
  const [showCompanyName, setShowCompanyName] = useState(printer.showCompanyName !== false)
  const [showProducts, setShowProducts] = useState(printer.showProducts !== false)
  const [showContact, setShowContact] = useState(printer.showContact !== false)
  const [showTax, setShowTax] = useState(printer.showTax === true)
  const [footerText, setFooterText] = useState(printer.footerText || '¡Gracias por su compra!')
  
  // Metadata for the company
  const [companyName, setCompanyName] = useState(user?.companyName || 'GestivaOne')
  const [companyPhone, setCompanyPhone] = useState(user?.companyPhone || '')
  const [companyEmail, setCompanyEmail] = useState(user?.companyEmail || '')
  const [logoUrl, setLogoUrl] = useState(user?.companyLogo || '')
  const [saving, setSaving] = useState(false)

  // Preview type toggle: 'pdf-corporate' | 'pdf-minimalist' | 'ticket-classic' | 'ticket-modern'
  const [previewType, setPreviewType] = useState('pdf-corporate')

  // Handle saving configurations
  const handleSave = async () => {
    setSaving(true)
    try {
      // 1. Save printer settings
      setPrinter({
        autoPrint,
        template: thermalTemplate,
        pdfTemplate,
        showLogo,
        showCompanyName,
        showProducts,
        showContact,
        showTax,
        footerText,
      })

      // 2. Save user/company info in auth/database
      await updateProfile({
        companyName,
        companyPhone,
        companyEmail,
        companyLogo: logoUrl
      })

      toast.success('Configuración del Facturero guardada con éxito')
    } catch (e) {
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  // Logo upload simulation
  const handleUploadLogo = () => {
    const url = prompt('Ingresa la URL de la imagen de tu Logo:', logoUrl)
    if (url !== null) {
      setLogoUrl(url)
      toast.success('Logo actualizado temporalmente. Recuerda guardar cambios.')
    }
  }

  // Trigger test print
  const handleTestPrint = () => {
    const settingsObj = {
      template: thermalTemplate,
      showLogo,
      showCompanyName,
      showProducts,
      showContact,
      showTax: showTax,
      footerText,
      companyName,
      companyLogo: logoUrl,
      companyPhone,
      companyEmail
    }
    printInvoice(MOCK_INVOICE, { name: MOCK_INVOICE.client_name, phone: MOCK_INVOICE.client_phone }, settingsObj)
    toast.success('Enviando ticket de prueba a la impresora...')
  }

  // Trigger test PDF
  const handleTestPDF = () => {
    const settingsObj = {
      pdfTemplate,
      companyName,
      companyLogo: logoUrl,
      companyPhone,
      companyEmail,
      footerText
    }
    const mockInvWithTax = {
      ...MOCK_INVOICE,
      taxAmount: showTax ? MOCK_INVOICE.taxAmount : 0,
      taxRate: showTax ? MOCK_INVOICE.taxRate : 0,
      subtotal: showTax ? MOCK_INVOICE.subtotal : MOCK_INVOICE.total
    }
    exportSingleInvoicePDF(mockInvWithTax, {
      name: MOCK_INVOICE.client_name,
      phone: MOCK_INVOICE.client_phone,
      email: MOCK_INVOICE.client_email,
      address: MOCK_INVOICE.client_address
    }, settingsObj)
    toast.success('Generando descarga de PDF de prueba...')
  }

  // Mock rendering helpers for the visual preview pane
  const renderLivePreview = () => {
    const totalVal = MOCK_INVOICE.total
    const taxVal = showTax ? MOCK_INVOICE.taxAmount : 0
    const subtotalVal = showTax ? MOCK_INVOICE.subtotal : totalVal

    if (previewType === 'pdf-corporate') {
      return (
        <div className="bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-sans text-[11px] leading-relaxed max-w-lg mx-auto transition-all duration-300">
          {/* Corporate Header */}
          <div className="bg-indigo-950 text-white p-6 flex justify-between items-start">
            <div>
              {showLogo && logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover mb-2 border border-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center mb-2"><Sparkles className="text-white w-4 h-4" /></div>
              )}
              {showCompanyName && <h4 className="text-sm font-black tracking-wide uppercase text-violet-300">{companyName}</h4>}
              <p className="text-[9px] text-slate-300 mt-1">NIT: 901.458.789-2</p>
              {showContact && (
                <div className="text-[9px] text-slate-300 space-y-0.5 mt-1.5">
                  {companyPhone && <p>Tel: {companyPhone}</p>}
                  {companyEmail && <p>{companyEmail}</p>}
                </div>
              )}
            </div>
            <div className="bg-violet-600 px-4 py-2.5 rounded-lg text-right min-w-[120px]">
              <span className="text-[9px] font-bold text-violet-200 uppercase block tracking-wider">Factura de Venta</span>
              <span className="text-xs font-black block mt-0.5">#{MOCK_INVOICE.id.toUpperCase()}</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Metadata and client */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <span className="text-[9px] font-bold text-violet-600 block mb-1">FACTURAR A:</span>
                <p className="font-bold text-slate-900">{MOCK_INVOICE.client_name}</p>
                <p className="text-slate-500 text-[9px] mt-0.5">Tel: {MOCK_INVOICE.client_phone}</p>
                <p className="text-slate-500 text-[9px]">{MOCK_INVOICE.client_email}</p>
                <p className="text-slate-500 text-[9px] truncate">{MOCK_INVOICE.client_address}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <span className="text-[9px] font-bold text-violet-600 block mb-1">DETALLES:</span>
                <p className="text-slate-700 text-[9px]">Fecha: {new Date(MOCK_INVOICE.created_at).toLocaleDateString('es-CO')}</p>
                <p className="text-slate-700 text-[9px]">Método: Contado / Inmediato</p>
                <p className="text-slate-700 text-[9px]">Estado: <span className="text-emerald-600 font-bold">PAGADA</span></p>
              </div>
            </div>

            {/* Table */}
            {showProducts && (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-violet-600 text-white text-[9px] text-left">
                      <th className="p-2 w-8 text-center">#</th>
                      <th className="p-2">Producto</th>
                      <th className="p-2 w-10 text-center">Cant</th>
                      <th className="p-2 text-right">Precio</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INVOICE.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-slate-100 text-[9px] text-slate-600 hover:bg-slate-50">
                        <td className="p-2 text-center">{idx + 1}</td>
                        <td className="p-2 font-semibold text-slate-800">{it.name}</td>
                        <td className="p-2 text-center">{it.quantity}</td>
                        <td className="p-2 text-right">{format(it.price)}</td>
                        <td className="p-2 text-right">{format(it.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            <div className="flex justify-end pt-1">
              <div className="w-56 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-[10px]">
                {showTax && (
                  <>
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span>{format(subtotalVal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>IVA (19%):</span>
                      <span>{format(taxVal)}</span>
                    </div>
                    <div className="border-t border-slate-200 my-1"></div>
                  </>
                )}
                <div className="flex justify-between font-black text-slate-900 text-xs">
                  <span className="text-violet-600">Total a Pagar:</span>
                  <span>{format(totalVal)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-slate-100 space-y-1 text-slate-400 text-[9px]">
              <p className="italic font-medium text-slate-500">"{footerText}"</p>
              <p>Factura generada electrónicamente por GestivaOne.</p>
            </div>
          </div>
        </div>
      )
    }

    if (previewType === 'pdf-minimalist') {
      return (
        <div className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6 font-sans text-[11px] leading-relaxed max-w-lg mx-auto transition-all duration-300">
          {/* Minimalist Header */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-100">
            <div>
              {showLogo && logoUrl && (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover mb-2" />
              )}
              {showCompanyName && <h4 className="text-lg font-black tracking-tight text-slate-900">{companyName}</h4>}
              <p className="text-slate-400 text-[9px]">Factura de Venta Comercial</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider block">Factura #{MOCK_INVOICE.id.toUpperCase()}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Fecha: {new Date(MOCK_INVOICE.created_at).toLocaleDateString('es-CO')}</span>
            </div>
          </div>

          {/* Client details */}
          <div className="grid grid-cols-2 gap-8 text-[9px]">
            <div>
              <span className="font-bold text-slate-400 block mb-1">CLIENTE</span>
              <p className="font-black text-slate-800 text-sm">{MOCK_INVOICE.client_name}</p>
              <p className="text-slate-600 mt-1">Tel: {MOCK_INVOICE.client_phone}</p>
              <p className="text-slate-600">{MOCK_INVOICE.client_email}</p>
              <p className="text-slate-600 truncate">{MOCK_INVOICE.client_address}</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 block mb-1">DETALLES</span>
              <p className="text-slate-600">Método de pago: Inmediato (Contado)</p>
              <p className="text-slate-600">Estado: <span className="font-bold text-slate-800">PAGADA</span></p>
              {showContact && (companyPhone || companyEmail) && (
                <p className="text-slate-600 mt-2">{companyPhone} • {companyEmail}</p>
              )}
            </div>
          </div>

          {/* Table */}
          {showProducts && (
            <table className="w-full text-left text-[9.5px]">
              <thead>
                <tr className="border-b border-slate-900 text-slate-400 uppercase text-[8px] font-bold">
                  <th className="py-2">Producto</th>
                  <th className="py-2 text-center">Cant</th>
                  <th className="py-2 text-right">Precio</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_INVOICE.items.map((it, idx) => (
                  <tr key={idx} className="text-slate-700">
                    <td className="py-2.5 font-medium">{it.name}</td>
                    <td className="py-2.5 text-center">{it.quantity}</td>
                    <td className="py-2.5 text-right">{format(it.price)}</td>
                    <td className="py-2.5 text-right font-semibold">{format(it.price * it.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Summary minimalist */}
          <div className="flex justify-end pt-2">
            <div className="w-48 space-y-1.5 text-right text-[10px]">
              {showTax && (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>{format(subtotalVal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-b border-slate-100 pb-1.5">
                    <span>IVA (19%):</span>
                    <span>{format(taxVal)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-slate-900 font-bold text-xs pt-1">
                <span>TOTAL:</span>
                <span>{format(totalVal)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-100 text-slate-400 text-[9px] italic">
            <p>"{footerText}"</p>
          </div>
        </div>
      )
    }

    if (previewType === 'ticket-classic') {
      return (
        <div className="bg-[#fffae8] text-black border border-[#d6cb9e] p-6 shadow-md font-mono text-[10.5px] leading-relaxed max-w-[280px] mx-auto rounded-md transition-all duration-300">
          <div className="text-center space-y-1">
            {showLogo && logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full mx-auto object-cover border border-black/20" />
            )}
            {showCompanyName ? (
              <div className="font-bold text-xs uppercase tracking-wide">{companyName}</div>
            ) : (
              <div className="font-bold text-xs uppercase">RECIBO DE VENTA</div>
            )}
            {showContact && (
              <div className="text-[9px]">
                {companyPhone && <div>Tel: {companyPhone}</div>}
                {companyEmail && <div className="truncate">{companyEmail}</div>}
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          <div className="space-y-0.5 text-[9.5px]">
            <div>FACTURA: #{MOCK_INVOICE.id.slice(-8).toUpperCase()}</div>
            <div>FECHA: {new Date(MOCK_INVOICE.created_at).toLocaleDateString('es-CO')}</div>
            {showContact && <div>CLIENTE: {MOCK_INVOICE.client_name}</div>}
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          {showProducts && (
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-[9px]">
                <span>CANT / DETALLE</span>
                <span>TOTAL</span>
              </div>
              {MOCK_INVOICE.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start text-[9px]">
                  <div className="max-w-[150px]">
                    {it.quantity}x {it.name}
                    <div className="text-[8px] text-slate-700">@ {format(it.price)}</div>
                  </div>
                  <span>{format(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-dashed border-black my-2"></div>

          <div className="space-y-0.5 text-right font-semibold">
            {showTax && (
              <>
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{format(subtotalVal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (19%):</span>
                  <span>{format(taxVal)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-xs pt-1">
              <span>TOTAL COP:</span>
              <span>{format(totalVal)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          <div className="text-center text-[9px] space-y-1">
            <p className="font-bold">"{footerText}"</p>
            <p className="text-[7.5px] text-slate-700">Facturador Express - GestivaOne</p>
          </div>
        </div>
      )
    }

    if (previewType === 'ticket-modern') {
      return (
        <div className="bg-white text-slate-800 border border-slate-200 p-5 shadow-lg font-sans text-[10px] leading-relaxed max-w-[270px] mx-auto rounded-2xl transition-all duration-300">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center space-y-1">
            {showLogo && logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full mx-auto object-cover" />
            )}
            {showCompanyName ? (
              <div className="font-black text-slate-900 text-xs tracking-tight">{companyName}</div>
            ) : (
              <div className="font-bold text-xs text-slate-900">RECIBO COMERCIAL</div>
            )}
            {showContact && (
              <div className="text-[8.5px] text-slate-500 space-y-0.5">
                {companyPhone && <div>Cel: {companyPhone}</div>}
                {companyEmail && <div className="truncate">{companyEmail}</div>}
              </div>
            )}
          </div>

          <div className="my-2.5 border-t border-dashed border-slate-200"></div>

          <div className="grid grid-cols-2 gap-2 text-[8.5px] text-slate-500">
            <div>
              <span className="font-bold text-slate-800">Recibo:</span> #{MOCK_INVOICE.id.slice(-8).toUpperCase()}
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800">Fecha:</span> {new Date(MOCK_INVOICE.created_at).toLocaleDateString('es-CO')}
            </div>
            {showContact && (
              <div className="col-span-2">
                <span className="font-bold text-slate-800">Cliente:</span> {MOCK_INVOICE.client_name}
              </div>
            )}
          </div>

          <div className="my-2.5 border-t border-dashed border-slate-200"></div>

          {showProducts && (
            <div className="space-y-1.5">
              {MOCK_INVOICE.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-[9px] text-slate-600">
                  <div>
                    <span className="font-bold text-slate-800">{it.quantity}</span> x {it.name}
                  </div>
                  <span className="font-semibold text-slate-800">{format(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="my-2.5 border-t border-dashed border-slate-200"></div>

          <div className="space-y-1 text-slate-600">
            {showTax && (
              <>
                <div className="flex justify-between text-[9px]">
                  <span>Subtotal Neto:</span>
                  <span>{format(subtotalVal)}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>IVA (19%):</span>
                  <span>{format(taxVal)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-black text-slate-900 text-xs bg-slate-50 p-1.5 rounded-lg mt-1">
              <span>Total COP:</span>
              <span>{format(totalVal)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-slate-200"></div>

          <div className="text-center text-[8.5px] text-slate-400 italic">
            <p className="font-semibold text-slate-500">"{footerText}"</p>
            <p className="mt-1 text-[7.5px]">GestivaOne — www.gestivaone.com</p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="pb-12 max-w-7xl mx-auto space-y-6">
      {/* ── Fixed Sticky Page Header ─────────────────── */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-surface-900/80 border-b border-subtle py-4 px-4 sm:px-6 -mx-4 sm:-mx-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <Printer className="text-brand-400" />
            Facturero
          </h1>
          <p className="text-xs text-muted-400">
            Diseña, personaliza y prueba tus plantillas de facturación PDF y recibos térmicos.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 font-bold shadow-glow"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save size={15} />
            )}
            <span>Guardar Configuración</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left config form panel (8 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Template Choices Card */}
          <div className="bg-surface-800 border border-subtle rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-subtle">
              <Sparkles size={18} className="text-brand-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">1. Selección de Plantillas</h2>
            </div>

            {/* PDF Templates choice */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-300 block">Plantilla predeterminada para exportar PDF (Formato A4)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setPdfTemplate('corporate'); setPreviewType('pdf-corporate') }}
                  className={clsx(
                    'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    pdfTemplate === 'corporate'
                      ? 'border-brand-500 bg-brand-600/10'
                      : 'border-subtle bg-surface-750 hover:border-surface-600'
                  )}
                >
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', pdfTemplate === 'corporate' ? 'bg-brand-500 text-white' : 'bg-surface-650 text-muted-400')}>
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">One Corporate (Clásica)</h4>
                    <p className="text-[10px] text-muted-400 mt-0.5">Encabezado formal con color corporativo, doble bloque estructurado y diseño robusto.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setPdfTemplate('minimalist'); setPreviewType('pdf-minimalist') }}
                  className={clsx(
                    'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    pdfTemplate === 'minimalist'
                      ? 'border-brand-500 bg-brand-600/10'
                      : 'border-subtle bg-surface-750 hover:border-surface-600'
                  )}
                >
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', pdfTemplate === 'minimalist' ? 'bg-brand-500 text-white' : 'bg-surface-650 text-muted-400')}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">One Minimalist (Moderna)</h4>
                    <p className="text-[10px] text-muted-400 mt-0.5">Diseño minimalista con alto espacio en blanco, líneas limpias y diseño contemporáneo.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Thermal ticket choice */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-300 block">Plantilla predeterminada para impresora de tickets (Térmica 80mm)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setThermalTemplate('classic'); setPreviewType('ticket-classic') }}
                  className={clsx(
                    'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    thermalTemplate === 'classic'
                      ? 'border-brand-500 bg-brand-600/10'
                      : 'border-subtle bg-surface-750 hover:border-surface-600'
                  )}
                >
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', thermalTemplate === 'classic' ? 'bg-brand-500 text-white' : 'bg-surface-650 text-muted-400')}>
                    <Printer size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Ticket Clásico</h4>
                    <p className="text-[10px] text-muted-400 mt-0.5">Estilo tradicional monoespaciado en Courier, divisores de guiones y formato compacto.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setThermalTemplate('modern'); setPreviewType('ticket-modern') }}
                  className={clsx(
                    'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    thermalTemplate === 'modern'
                      ? 'border-brand-500 bg-brand-600/10'
                      : 'border-subtle bg-surface-750 hover:border-surface-600'
                  )}
                >
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', thermalTemplate === 'modern' ? 'bg-brand-500 text-white' : 'bg-surface-650 text-muted-400')}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Ticket Moderno</h4>
                    <p className="text-[10px] text-muted-400 mt-0.5">Tipografía sans-serif limpia, tarjeta superior para datos de empresa y bordes sutiles.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Visual Elements Toggle Options */}
          <div className="bg-surface-800 border border-subtle rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-subtle">
              <Settings size={18} className="text-brand-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">2. Configuración Visual e Impresión</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Impresión Automática</span>
                  <span className="text-[10px] text-muted-400 block">Lanza el ticket automáticamente al realizar pedido</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="rounded bg-surface-650 border-subtle text-brand-500 focus:ring-brand-500/20 w-4.5 h-4.5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Mostrar Logo Comercial</span>
                  <span className="text-[10px] text-muted-400 block">Dibuja tu logotipo cargado en los documentos</span>
                </div>
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded bg-surface-650 border-subtle text-brand-500 focus:ring-brand-500/20 w-4.5 h-4.5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Nombre de Empresa</span>
                  <span className="text-[10px] text-muted-400 block">Muestra tu nombre comercial como encabezado</span>
                </div>
                <input
                  type="checkbox"
                  checked={showCompanyName}
                  onChange={(e) => setShowCompanyName(e.target.checked)}
                  className="rounded bg-surface-650 border-subtle text-brand-500 focus:ring-brand-500/20 w-4.5 h-4.5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Desglose de Productos</span>
                  <span className="text-[10px] text-muted-400 block">Lista los artículos vendidos y sus totales</span>
                </div>
                <input
                  type="checkbox"
                  checked={showProducts}
                  onChange={(e) => setShowProducts(e.target.checked)}
                  className="rounded bg-surface-650 border-subtle text-brand-500 focus:ring-brand-500/20 w-4.5 h-4.5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Contacto del Cliente</span>
                  <span className="text-[10px] text-muted-400 block">Muestra nombre y celular del cliente</span>
                </div>
                <input
                  type="checkbox"
                  checked={showContact}
                  onChange={(e) => setShowContact(e.target.checked)}
                  className="rounded bg-surface-650 border-subtle text-brand-500 focus:ring-brand-500/20 w-4.5 h-4.5"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Aplicar Impuestos (IVA 19%)</span>
                  <span className="text-[10px] text-muted-400 block">Añade desglose de IVA a los subtotales</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTax}
                  onChange={(e) => setShowTax(e.target.checked)}
                  className="rounded bg-surface-650 border-subtle text-brand-500 focus:ring-brand-500/20 w-4.5 h-4.5"
                />
              </label>
            </div>
          </div>

          {/* Company branding text fields */}
          <div className="bg-surface-800 border border-subtle rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-subtle">
              <Building2 size={18} className="text-brand-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">3. Datos de la Empresa y Logotipo</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre Comercial de la Empresa"
                placeholder="Ej. Mi Tienda Express"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />

              <Input
                label="Teléfono de Contacto"
                placeholder="Ej. 300 123 4567"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
              />

              <Input
                label="Correo de Contacto"
                placeholder="Ej. contacto@mitienda.com"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
              />

              {/* Logo Url selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-400 block">Logotipo Corporativo</label>
                <div className="flex gap-2">
                  <div className="bg-surface-750 border border-subtle rounded-xl flex-1 px-3 py-2 text-xs text-muted-300 truncate flex items-center gap-2">
                    {logoUrl ? (
                      <>
                        <img src={logoUrl} alt="Logo" className="w-5 h-5 rounded-full object-cover" />
                        <span className="truncate">{logoUrl}</span>
                      </>
                    ) : (
                      <>
                        <Image size={14} className="text-muted-500" />
                        <span className="text-muted-500">Sin logotipo asignado</span>
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="font-bold border border-subtle"
                    onClick={handleUploadLogo}
                  >
                    Editar URL
                  </Button>
                </div>
              </div>

              {/* Footer text field */}
              <div className="sm:col-span-2">
                <Input
                  label="Mensaje / Términos del Footer"
                  placeholder="Ej. ¡Gracias por preferirnos! Devoluciones válidas por 30 días con factura original."
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side live preview pane (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-800 border border-subtle rounded-2xl p-5 space-y-4 sticky top-28">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-subtle">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <FileCheck size={16} className="text-brand-400" />
                Vista Previa Interactiva
              </span>
              
              {/* Preview Mode Selector */}
              <select
                value={previewType}
                onChange={(e) => setPreviewType(e.target.value)}
                className="bg-surface-700 border border-subtle rounded-lg px-2 py-1 text-xs text-foreground focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="pdf-corporate">Factura PDF (Corporativo)</option>
                <option value="pdf-minimalist">Factura PDF (Minimalista)</option>
                <option value="ticket-classic">Ticket Térmico (Clásico)</option>
                <option value="ticket-modern">Ticket Térmico (Moderno)</option>
              </select>
            </div>

            {/* Simulated Sheet Canvas */}
            <div className="p-3 bg-surface-900 border border-subtle rounded-xl min-h-[360px] flex items-center justify-center overflow-auto no-scrollbar">
              {renderLivePreview()}
            </div>

            {/* Test Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTestPDF}
                className="flex items-center justify-center gap-1.5 border border-subtle font-bold text-xs"
              >
                <Download size={14} />
                <span>Descargar PDF</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleTestPrint}
                className="flex items-center justify-center gap-1.5 border border-subtle font-bold text-xs text-brand-300"
              >
                <Printer size={14} />
                <span>Imprimir Ticket</span>
              </Button>
            </div>

            <div className="p-3 rounded-xl bg-surface-750 border border-subtle flex items-start gap-2.5">
              <AlertCircle size={16} className="text-brand-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-400 leading-normal">
                Esta es una simulación visual en tiempo real. Los cambios en el logotipo, datos de la empresa e IVA se reflejarán inmediatamente en las facturas y tickets reales al presionar el botón <strong>Guardar Configuración</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
