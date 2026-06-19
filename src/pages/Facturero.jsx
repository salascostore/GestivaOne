import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Printer, FileText, Check, Save, Download, Image, HelpCircle, AlertCircle, Sparkles, Building2, Phone, Mail, FileCheck, Settings, Palette } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { printInvoice } from '@/services/printService'
import { exportSingleInvoicePDF } from '@/services/exportService'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 25 } }
}

const MOCK_INVOICE = {
  id: 'f-8a9c12bf',
  created_at: new Date().toISOString(),
  payment_type: 'immediate',
  payment_status: 'paid',
  client_name: 'Randy Mendoza',
  client_document_id: '1020304050',
  client_phone: '312 456 7890',
  client_email: 'example@example.com',
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

const THEME_COLORS = {
  indigo: {
    name: 'Violeta / Indigo',
    primary: '#4f46e5',
    primaryLight: '#c7d2fe',
    primaryDark: '#1e1b4b',
  },
  emerald: {
    name: 'Verde Esmeralda',
    primary: '#059669',
    primaryLight: '#a7f3d0',
    primaryDark: '#064e3b',
  },
  blue: {
    name: 'Azul Eléctrico',
    primary: '#2563eb',
    primaryLight: '#bfdbfe',
    primaryDark: '#1e3a8a',
  },
  rose: {
    name: 'Rosa Fucsia',
    primary: '#e11d48',
    primaryLight: '#fecdd3',
    primaryDark: '#4c0519',
  },
  amber: {
    name: 'Ámbar Cálido',
    primary: '#d97706',
    primaryLight: '#fde68a',
    primaryDark: '#78350f',
  },
  slate: {
    name: 'Slate / Carbón',
    primary: '#475569',
    primaryLight: '#cbd5e1',
    primaryDark: '#0f172a',
  }
}

export default function Facturero() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const format = useCurrencyStore((s) => s.format)

  // Settings store
  const { printer, setPrinter } = useSettingsStore()

  // Printer detection state
  const [hasPrinter, setHasPrinter] = useState(false)
  const [checkingPrinter, setCheckingPrinter] = useState(true)

  // Local states for custom edit (we sync with settings on Save)
  const [pdfTemplate, setPdfTemplate] = useState(printer.pdfTemplate || 'corporate')
  const [thermalTemplate, setThermalTemplate] = useState(printer.template || 'classic')
  const [themeColor, setThemeColor] = useState(printer.themeColor || 'indigo')
  const [autoPrint, setAutoPrint] = useState(printer.autoPrint || false)
  const [showLogo, setShowLogo] = useState(printer.showLogo !== false)
  const [showCompanyName, setShowCompanyName] = useState(printer.showCompanyName !== false)
  const [showProducts, setShowProducts] = useState(printer.showProducts !== false)
  const [showContact, setShowContact] = useState(printer.showContact !== false)
  const [showTax, setShowTax] = useState(printer.showTax === true)
  const [footerText, setFooterText] = useState(printer.footerText || '¡Gracias por su compra!')
  const [bannerUrl, setBannerUrl] = useState(printer.bannerUrl || '')

  // Metadata for the company
  const [companyName, setCompanyName] = useState(user?.companyName || 'GestivaOne')
  const [companyPhone, setCompanyPhone] = useState(user?.companyPhone || '')
  const [companyEmail, setCompanyEmail] = useState(user?.companyEmail || '')
  const [logoUrl, setLogoUrl] = useState(user?.companyLogo || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const checkDevices = async () => {
      if (typeof window.print !== 'function') {
        setHasPrinter(false)
        setCheckingPrinter(false)
        return
      }

      if (printer.autoPrint || autoPrint) {
        setHasPrinter(true)
        setCheckingPrinter(false)
        return
      }

      if (navigator.usb) {
        try {
          const devices = await navigator.usb.getDevices()
          if (devices.length > 0) {
            setHasPrinter(true)
          }
        } catch (e) {
          console.warn('Error checking USB devices in Facturero:', e)
        }
      }
      setCheckingPrinter(false)
    }

    checkDevices()
  }, [printer.autoPrint, autoPrint])

  const requestUsbPrinter = async () => {
    if (!navigator.usb) {
      toast.error('Este navegador no soporta detección de dispositivos USB.')
      return
    }
    try {
      const device = await navigator.usb.requestDevice({ filters: [] })
      if (device) {
        setHasPrinter(true)
        setAutoPrint(true)
        toast.success(`Impresora detectada: ${device.productName || 'Dispositivo USB'}`)
      }
    } catch (e) {
      toast.error('No se vinculó ningún dispositivo')
    }
  }

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
        themeColor,
        bannerUrl,
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

  // Upload modals state
  const [logoModalOpen, setLogoModalOpen] = useState(false)
  const [bannerModalOpen, setBannerModalOpen] = useState(false)

  // Logo upload simulation
  const handleUploadLogo = () => {
    setLogoModalOpen(true)
  }

  const submitLogo = (url) => {
    if (url.length > 5000) {
      toast.error('La imagen es demasiado pesada (base64). Por favor usa un enlace (URL) a la imagen.')
      return
    }
    setLogoUrl(url)
    setLogoModalOpen(false)
    toast.success('Logo actualizado temporalmente. Recuerda guardar cambios.')
  }

  // Banner upload simulation
  const handleUploadBanner = () => {
    setBannerModalOpen(true)
  }

  const submitBanner = (url) => {
    if (url.length > 5000) {
      toast.error('La imagen es demasiado pesada (base64). Por favor usa un enlace (URL) a la imagen.')
      return
    }
    setBannerUrl(url)
    setBannerModalOpen(false)
    toast.success('Banner actualizado temporalmente. Recuerda guardar cambios.')
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
      companyEmail,
      themeColor,
      bannerUrl
    }
    printInvoice(MOCK_INVOICE, { name: MOCK_INVOICE.client_name, phone: MOCK_INVOICE.client_phone, email: MOCK_INVOICE.client_email, document_id: '1020304050' }, settingsObj)
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
      footerText,
      themeColor,
      bannerUrl
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
      address: MOCK_INVOICE.client_address,
      document_id: '1020304050'
    }, settingsObj)
    toast.success('Generando descarga de PDF de prueba.')
  }

  // Mock rendering helpers for the visual preview pane
  const renderLivePreview = () => {
    const totalVal = MOCK_INVOICE.total
    const taxVal = showTax ? MOCK_INVOICE.taxAmount : 0
    const subtotalVal = showTax ? MOCK_INVOICE.subtotal : totalVal
    const activeColor = THEME_COLORS[themeColor] || THEME_COLORS.indigo

    if (previewType === 'pdf-corporate') {
      return (
        <div className="bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-sans text-sm leading-relaxed max-w-2xl mx-auto transition-all duration-300">
          {/* Corporate Header */}
          <div className="text-white p-8 flex justify-between items-start relative overflow-hidden" style={{ backgroundColor: activeColor.primaryDark }}>
            {bannerUrl && (
              <img src={bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />
            )}
            <div className="relative z-10 w-full flex justify-between items-start">
              <div>
                {showLogo && logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-white/20" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: activeColor.primary }}><Sparkles className="text-white w-7 h-7" /></div>
                )}
                {showCompanyName && <h4 className="text-xl font-black tracking-wide uppercase drop-shadow-md" style={{ color: activeColor.primaryLight }}>{companyName}</h4>}
                <p className="text-xs text-slate-200 mt-1 font-medium drop-shadow-md">NIT: 901.458.789-2</p>
                {showContact && (
                  <div className="text-xs text-slate-200 space-y-0.5 mt-2 font-medium drop-shadow-md">
                    {companyPhone && <p>Tel: {companyPhone}</p>}
                    {companyEmail && <p>{companyEmail}</p>}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold uppercase tracking-wider block drop-shadow-md">Factura de Venta</span>
                <span className="text-2xl font-black drop-shadow-md">#{MOCK_INVOICE.id.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Metadata and client */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <span className="text-[10px] font-bold block mb-1.5" style={{ color: activeColor.primary }}>FACTURAR A:</span>
                <p className="font-bold text-slate-900 text-sm leading-tight mb-1">{MOCK_INVOICE.client_name}</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Doc: {MOCK_INVOICE.client_document_id}</p>
                <p className="text-slate-600 text-[11px]">Tel: {MOCK_INVOICE.client_phone}</p>
                <p className="text-slate-600 text-[11px]">{MOCK_INVOICE.client_email}</p>
                <p className="text-slate-600 text-[11px] truncate mt-0.5">{MOCK_INVOICE.client_address}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <span className="text-[10px] font-bold block mb-1.5" style={{ color: activeColor.primary }}>DETALLES:</span>
                <p className="text-slate-700 text-[11px] mb-0.5"><span className="font-semibold">Fecha:</span> {new Date(MOCK_INVOICE.created_at).toLocaleDateString('es-CO')}</p>
                <p className="text-slate-700 text-[11px] mb-0.5"><span className="font-semibold">Método:</span> Contado / Inmediato</p>
                <p className="text-slate-700 text-[11px]"><span className="font-semibold">Estado:</span> <span className="text-emerald-600 font-bold ml-1">PAGADA</span></p>
              </div>
            </div>

            {/* Table */}
            {showProducts && (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-white text-[10px] text-left uppercase tracking-wider" style={{ backgroundColor: activeColor.primary }}>
                      <th className="p-2.5 w-8 text-center rounded-tl-lg">#</th>
                      <th className="p-2.5">Producto</th>
                      <th className="p-2.5 w-12 text-center">Cant</th>
                      <th className="p-2.5 text-right">Precio</th>
                      <th className="p-2.5 text-right rounded-tr-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INVOICE.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-slate-100 text-[11px] text-slate-600 hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 text-center font-medium">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{it.name}</td>
                        <td className="p-2.5 text-center font-medium">{it.quantity}</td>
                        <td className="p-2.5 text-right">{format(it.price)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-700">{format(it.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-[11px]">
                {showTax && (
                  <>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Subtotal:</span>
                      <span>{format(subtotalVal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>IVA (19%):</span>
                      <span>{format(taxVal)}</span>
                    </div>
                    <div className="border-t border-slate-200 my-1.5"></div>
                  </>
                )}
                <div className="flex justify-between font-black text-slate-900 text-sm">
                  <span style={{ color: activeColor.primary }}>Total a Pagar:</span>
                  <span>{format(totalVal)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-6 border-t border-slate-100 space-y-1.5 text-slate-400 text-[10px]">
              <p className="italic font-medium text-slate-500 text-[11px]">"{footerText}"</p>
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
              <span className="font-bold block mb-1" style={{ color: activeColor.primary }}>CLIENTE</span>
              <p className="font-black text-slate-800 text-sm">{MOCK_INVOICE.client_name}</p>
              <p className="text-slate-600 mt-1">Doc: {MOCK_INVOICE.client_document_id}</p>
              <p className="text-slate-600">Tel: {MOCK_INVOICE.client_phone}</p>
              <p className="text-slate-600">{MOCK_INVOICE.client_email}</p>
              <p className="text-slate-600 truncate">{MOCK_INVOICE.client_address}</p>
            </div>
            <div>
              <span className="font-bold block mb-1" style={{ color: activeColor.primary }}>DETALLES</span>
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
              <div className="flex justify-between font-bold text-xs pt-1" style={{ color: activeColor.primary }}>
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
            {showContact && (
              <>
                <div>CLIENTE: {MOCK_INVOICE.client_name}</div>
                <div>DOC: {MOCK_INVOICE.client_document_id}</div>
                <div>TEL: {MOCK_INVOICE.client_phone}</div>
              </>
            )}
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
              <div className="col-span-2 space-y-0.5">
                <div><span className="font-bold text-slate-800">Cliente:</span> {MOCK_INVOICE.client_name}</div>
                <div><span className="font-bold text-slate-800">Doc:</span> {MOCK_INVOICE.client_document_id}</div>
                <div><span className="font-bold text-slate-800">Tel:</span> {MOCK_INVOICE.client_phone}</div>
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
            <div className="flex justify-between font-black text-xs p-1.5 rounded-lg mt-1 text-white" style={{ backgroundColor: activeColor.primary }}>
              <span>Total COP:</span>
              <span>{format(totalVal)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-slate-200"></div>

          <div className="text-center text-xs space-y-1 text-slate-500">
            <p className="font-bold italic">"{footerText}"</p>
            <p className="text-[10px]">GestivaOne</p>
          </div>
        </div>
      )
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="page-container flex flex-col gap-6 h-full lg:h-full lg:overflow-hidden pb-12 lg:pb-0">
      {/* Sticky Header & Control Panel */}
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">
              Facturero
            </h1>
            <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">
              Diseña, personaliza y prueba tus plantillas de facturación PDF y recibos térmicos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 font-bold shadow-glow"
            title="Guardar todos los cambios realizados en la configuración de la empresa y plantillas"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:h-[calc(100vh-160px)] flex-1 min-h-0">
        {/* Left config form panel (8 cols on lg) */}
        <div className="lg:col-span-7 space-y-6 lg:h-full lg:overflow-y-auto no-scrollbar lg:pr-2 pb-6">
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
                  title="Seleccionar plantilla PDF clásica y corporativa para las facturas"
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
                    <p className="text-xs text-muted-300 mt-0.5">Encabezado formal con color corporativo, doble bloque estructurado y diseño robusto.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setPdfTemplate('minimalist'); setPreviewType('pdf-minimalist') }}
                  title="Seleccionar plantilla PDF moderna y minimalista para las facturas"
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
                    <p className="text-xs text-muted-300 mt-0.5">Diseño minimalista con alto espacio en blanco, líneas limpias y diseño contemporáneo.</p>
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
                  title="Seleccionar formato clásico courier para tickets impresos"
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
                    <p className="text-xs text-muted-300 mt-0.5">Estilo tradicional monoespaciado en Courier, divisores de guiones y formato compacto.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setThermalTemplate('modern'); setPreviewType('ticket-modern') }}
                  title="Seleccionar formato moderno sans-serif para tickets impresos"
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
                    <p className="text-xs text-muted-300 mt-0.5">Tipografía sans-serif limpia, tarjeta superior para datos de empresa y bordes sutiles.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div className="bg-surface-800 border border-subtle rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-subtle">
              <Settings size={18} className="text-brand-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">2. Configuración Visual e Impresión</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hasPrinter ? (
                <label
                  title="Imprimir ticket de forma automática al guardar una nueva factura"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-base font-bold text-foreground block">Impresión Automática</span>
                    <span className="text-sm text-muted-300 block">Lanza el ticket automáticamente al realizar pedido</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                    className="rounded border-subtle text-brand-600 focus:ring-brand-500/20 bg-surface-800 w-4.5 h-4.5"
                  />
                </label>
              ) : (
                <button
                  type="button"
                  onClick={requestUsbPrinter}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-750/50 border border-dashed border-brand-500/20 hover:border-brand-500/40 text-left cursor-pointer transition-colors w-full"
                  title="Detectar y vincular impresora USB para habilitar impresión automática"
                >
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-brand-400 block flex items-center gap-1.5">
                      <Printer size={14} />
                      Vincular Impresora USB
                    </span>
                    <span className="text-[11px] text-muted-400 block">Habilita la impresión automática de tickets</span>
                  </div>
                </button>
              )}

              <label
                title="Incluir el logo de tu empresa en el encabezado de facturas y tickets"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="text-base font-bold text-foreground block">Mostrar Logo Comercial</span>
                  <span className="text-sm text-muted-300 block">Dibuja tu logotipo cargado en los documentos</span>
                </div>
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded border-subtle text-brand-600 focus:ring-brand-500/20 bg-surface-800 w-4.5 h-4.5"
                />
              </label>

              <label
                title="Mostrar el nombre comercial en lugar del texto genérico"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="text-base font-bold text-foreground block">Nombre de Empresa</span>
                  <span className="text-sm text-muted-300 block">Muestra tu nombre comercial como encabezado</span>
                </div>
                <input
                  type="checkbox"
                  checked={showCompanyName}
                  onChange={(e) => setShowCompanyName(e.target.checked)}
                  className="rounded border-subtle text-brand-600 focus:ring-brand-500/20 bg-surface-800 w-4.5 h-4.5"
                />
              </label>

              <label
                title="Detallar cada producto, cantidad y precio en las facturas y tickets"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="text-base font-bold text-foreground block">Desglose de Productos</span>
                  <span className="text-sm text-muted-300 block">Lista los artículos vendidos y sus totales</span>
                </div>
                <input
                  type="checkbox"
                  checked={showProducts}
                  onChange={(e) => setShowProducts(e.target.checked)}
                  className="rounded border-subtle text-brand-600 focus:ring-brand-500/20 bg-surface-800 w-4.5 h-4.5"
                />
              </label>

              <label
                title="Incluir la información de contacto del cliente en el recibo"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="text-base font-bold text-foreground block">Contacto del Cliente</span>
                  <span className="text-sm text-muted-300 block">Muestra nombre y celular del cliente</span>
                </div>
                <input
                  type="checkbox"
                  checked={showContact}
                  onChange={(e) => setShowContact(e.target.checked)}
                  className="rounded border-subtle text-brand-600 focus:ring-brand-500/20 bg-surface-800 w-4.5 h-4.5"
                />
              </label>

              <label
                title="Calcular y desglosar el IVA (19%) del total a pagar"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-750 border border-subtle cursor-pointer hover:border-surface-600 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="text-base font-bold text-foreground block">Aplicar Impuestos (IVA 19%)</span>
                  <span className="text-sm text-muted-300 block">Añade desglose de IVA a los subtotales</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTax}
                  onChange={(e) => setShowTax(e.target.checked)}
                  className="rounded border-subtle text-brand-600 focus:ring-brand-500/20 bg-surface-800 w-4.5 h-4.5"
                />
              </label>
            </div>
          </div>

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
                <label className="text-xs font-bold text-muted-400 block uppercase tracking-wide">Logotipo Corporativo</label>
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
                    title="Cambiar la URL de la imagen de tu logotipo"
                  >
                    Editar URL
                  </Button>
                </div>
              </div>

              {/* Banner Url selection (only for pdf-corporate) */}
              {previewType === 'pdf-corporate' && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-muted-400 block uppercase tracking-wide">Banner Factura Corporativa</label>
                  <p className="text-[10px] text-muted-500 mb-1">Guía de medidas recomendada: 1200x300px o proporción 4:1 (Alta resolución HD)</p>
                  <div className="flex gap-2">
                    <div className="bg-surface-750 border border-subtle rounded-xl flex-1 px-3 py-2 text-xs text-muted-300 truncate flex items-center gap-2">
                      {bannerUrl ? (
                        <>
                          <img src={bannerUrl} alt="Banner" className="w-16 h-5 rounded object-cover" />
                          <span className="truncate">{bannerUrl}</span>
                        </>
                      ) : (
                        <>
                          <Image size={14} className="text-muted-500" />
                          <span className="text-muted-500">Sin banner asignado (usará color corporativo)</span>
                        </>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="font-bold border border-subtle"
                      onClick={handleUploadBanner}
                      title="Cambiar la URL de la imagen de tu banner"
                    >
                      Editar Banner
                    </Button>
                  </div>
                </div>
              )}

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

          {/* 4. Color Theme Selector */}
          <div className="bg-surface-800 border border-subtle rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-subtle">
              <Palette size={18} className="text-brand-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">4. Paleta de Color y Tema</h2>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-400">
                Selecciona una paleta de color para tus plantillas y PDFs corporativos. El color se aplicará automáticamente a los encabezados, tablas y totales.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {Object.entries(THEME_COLORS).map(([key, col]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setThemeColor(key)}
                    title={`Aplicar el tema de color ${col.name} a tus facturas y PDFs`}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-300 ${themeColor === key
                      ? 'bg-surface-700 border-brand-500 ring-2 ring-brand-500/20'
                      : 'bg-surface-850 border-subtle hover:border-muted-500'
                      }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 border border-white/10"
                      style={{ backgroundColor: col.primary }}
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-foreground truncate">{col.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side live preview pane (5 cols on lg) */}
        <div className="lg:col-span-5 lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
          <div className="bg-surface-800 border border-subtle rounded-2xl p-5 space-y-4 lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-subtle shrink-0">
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
            <div className="p-3 bg-surface-900 border border-subtle rounded-xl flex-1 overflow-y-auto no-scrollbar min-h-[300px]">
              {renderLivePreview()}
            </div>

            {/* Test Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTestPDF}
                className="flex items-center justify-center gap-1.5 border border-subtle font-bold text-xs"
                title="Descargar un archivo PDF de demostración con la configuración actual"
              >
                <Download size={14} />
                <span>Descargar PDF</span>
              </Button>

              {hasPrinter ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTestPrint}
                  className="flex items-center justify-center gap-1.5 border border-subtle font-bold text-xs text-brand-300"
                  title="Enviar un ticket de demostración a la impresora para probar el formato"
                >
                  <Printer size={14} />
                  <span>Imprimir Ticket</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={requestUsbPrinter}
                  className="flex items-center justify-center gap-1.5 border border-dashed border-brand-500/20 font-bold text-xs text-brand-400 hover:bg-brand-500/10"
                  title="Detectar y vincular impresora USB"
                >
                  <Printer size={14} className="animate-pulse" />
                  <span>Vincular Impresora</span>
                </Button>
              )}
            </div>

            <div className="p-3 rounded-xl bg-surface-750 border border-subtle flex items-start gap-2.5 shrink-0">
              <AlertCircle size={16} className="text-brand-400 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-300 leading-normal">
                Esta es una simulación visual en tiempo real. Los cambios en el logotipo, datos de la empresa e IVA se reflejarán inmediatamente en las facturas y tickets reales al presionar el botón <strong>Guardar Configuración</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* URL Modals */}
      {logoModalOpen && (
        <Modal open={logoModalOpen} onClose={() => setLogoModalOpen(false)} title="Actualizar Logotipo">
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-400">Ingresa la URL de la imagen de tu Logotipo corporativo.</p>
            <Input 
              label="URL de la imagen" 
              placeholder="https://..." 
              defaultValue={logoUrl} 
              id="logo-url-input"
            />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setLogoModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl" onClick={() => submitLogo(document.getElementById('logo-url-input').value)}>Actualizar Logo</Button>
            </div>
          </div>
        </Modal>
      )}

      {bannerModalOpen && (
        <Modal open={bannerModalOpen} onClose={() => setBannerModalOpen(false)} title="Actualizar Banner">
          <div className="p-5 space-y-4">
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 flex gap-3 mb-2">
              <AlertCircle className="text-brand-400 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-brand-300">
                <strong>Guía de medidas:</strong> Te recomendamos usar una imagen de <strong>1200x300 píxeles</strong> (Proporción 4:1) para que se vea en alta definición y encaje perfectamente en el encabezado corporativo.
              </p>
            </div>
            <p className="text-sm text-muted-400">Ingresa la URL de la imagen de tu Banner corporativo.</p>
            <Input 
              label="URL del Banner" 
              placeholder="https://..." 
              defaultValue={bannerUrl} 
              id="banner-url-input"
            />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setBannerModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl" onClick={() => submitBanner(document.getElementById('banner-url-input').value)}>Actualizar Banner</Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  )
}
