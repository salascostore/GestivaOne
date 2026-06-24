import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Send, AlertCircle, CheckCircle2, User, Sparkles,
  MessageSquare, Info, Star, Percent, ShoppingBag, Search, ShoppingCart,
  Eye, Check, Copy, RefreshCw, Layers, Plus, Trash2, Edit2,
  ArrowUp, ArrowDown, Type, AlignLeft, AlignCenter, AlignRight,
  FileText, Link2, Image as ImageIcon
} from 'lucide-react'
import { useClientStore } from '@/store/useClientStore'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useAuthStore } from '@/store/useAuthStore'
import { sendCustomCampaignEmail } from '@/services/emailService'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const MOCK_LAYOUTS = {
  promo: [
    { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600', altText: 'Banner Promocional', height: '160' },
    { id: '2', type: 'title', value: '¡Descuento Especial en {{producto}}! 🌟', color: '#9333ea', align: 'center' },
    { id: '3', type: 'text', value: 'Hola {{cliente}},\n\nHemos preparado una oferta exclusiva del **15% de descuento** en tu próxima orden de **{{producto}}**.\n\nSimplemente responde a este correo para preparar tu pedido con prioridad.', color: '#374151' },
    { id: '4', type: 'button', value: 'Reclamar Descuento', url: 'https://gestivaone.com', color: '#9333ea', textColor: '#ffffff' }
  ],
  vip: [
    { id: '1', type: 'title', value: 'Gracias por tu Confianza VIP 💖', color: '#d97706', align: 'center' },
    { id: '2', type: 'text', value: 'Estimado/a {{cliente}},\n\nTu preferencia por {{empresa}} es muy valiosa para nosotros. Por ser un cliente frecuente, tu envío y soporte prioritario para **{{producto}}** ya están activos.', color: '#374151' },
    { id: '3', type: 'invoice_table' },
    { id: '4', type: 'button', value: 'Ver Catálogo Completo', url: 'https://gestivaone.com', color: '#d97706', textColor: '#ffffff' }
  ],
  reactivation: [
    { id: '1', type: 'title', value: '¡Te Extrañamos en {{empresa}}! 🎁', color: '#dc2626', align: 'center' },
    { id: '2', type: 'text', value: 'Hola {{cliente}},\n\nHace algún tiempo que no sabemos de ti y te extrañamos por aquí.\n\nQueremos invitarte a conocer nuestras últimas novedades y regalarte un obsequio especial en tu próxima orden.', color: '#374151' },
    { id: '3', type: 'link', label: 'Ver Novedades & Catálogo', url: 'https://gestivaone.com', color: '#dc2626' }
  ]
}

export default function Emails() {
  const clients = useClientStore((s) => s.clients)
  const invoices = useInvoiceStore((s) => s.invoices)
  const user = useAuthStore((s) => s.user)

  // Tab: 'campaign' (composer) or 'affinities' (tendencies)
  const [activeTab, setActiveTab] = useState('campaign')

  // Campaign State
  const [subject, setSubject] = useState('¡Tenemos algo especial para ti! 🌟')
  const [targetSegment, setTargetSegment] = useState('all')
  const [customClientFilter, setCustomClientFilter] = useState('all')
  const [sending, setSending] = useState(false)

  // Builder Blocks State
  const [blocks, setBlocks] = useState([
    { id: '1', type: 'title', value: '¡Hola {{cliente}}! 👋', color: '#9333ea', align: 'center' },
    { id: '2', type: 'text', value: 'Queríamos escribirte para ofrecerte algo especial en **{{producto}}** de nuestra marca **{{empresa}}**.', color: '#374151' },
    { id: '3', type: 'button', value: 'Obtener Beneficio', url: 'https://gestivaone.com', color: '#9333ea', textColor: '#ffffff' }
  ])
  const [selectedBlockId, setSelectedBlockId] = useState('1')

  const selectedBlock = useMemo(() => blocks.find(b => b.id === selectedBlockId), [blocks, selectedBlockId])

  // --- Tendency & Product Affinity Analyzer ---
  const clientAffinities = useMemo(() => {
    return clients.map((client) => {
      const clientInvoices = invoices.filter((inv) => inv.client_id === client.id && inv.payment_status === 'paid')
      const productCounts = {}
      let totalSpent = 0
      
      clientInvoices.forEach((inv) => {
        totalSpent += inv.total || 0
        if (inv.items && Array.isArray(inv.items)) {
          inv.items.forEach((item) => {
            const prodName = item.name || item.product_name || 'Otros'
            productCounts[prodName] = (productCounts[prodName] || 0) + (item.qty || 1)
          })
        }
      })

      let favoriteProduct = 'Ninguno'
      let maxQty = 0
      Object.entries(productCounts).forEach(([name, count]) => {
        if (count > maxQty) {
          maxQty = count
          favoriteProduct = name
        }
      })

      return {
        ...client,
        favoriteProduct,
        favoriteProductCount: maxQty,
        totalOrders: clientInvoices.length,
        totalSpent
      }
    })
  }, [clients, invoices])

  const allPurchasedProducts = useMemo(() => {
    const prods = new Set()
    invoices.forEach((inv) => {
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          if (item.name || item.product_name) prods.add(item.name || item.product_name)
        })
      }
    })
    return Array.from(prods)
  }, [invoices])

  const targetClients = useMemo(() => {
    return clientAffinities.filter((client) => {
      if (targetSegment !== 'all') {
        const daysSinceLast = client.last_purchase
          ? Math.round((Date.now() - new Date(client.last_purchase)) / (1000 * 60 * 60 * 24))
          : Infinity
        
        let segment = 'nuevo'
        if (client.totalOrders === 0) segment = 'nuevo'
        else if (daysSinceLast <= 30 && client.totalOrders >= 5) segment = 'vip'
        else if (daysSinceLast <= 30) segment = 'activo'
        else if (daysSinceLast <= 90) segment = 'tibio'
        else segment = 'inactivo'

        if (segment !== targetSegment) return false
      }

      if (customClientFilter !== 'all') {
        if (client.favoriteProduct !== customClientFilter) return false
      }

      return !!client.email || !!client.phone
    })
  }, [clientAffinities, targetSegment, customClientFilter])

  const personalizeMessage = (text, clientName, favoriteProduct = 'nuestros productos') => {
    return (text || '')
      .replace(/{{cliente}}/g, clientName || 'Cliente')
      .replace(/{{empresa}}/g, user?.companyName || 'nuestra empresa')
      .replace(/{{producto}}/g, favoriteProduct)
  }

  // Compile blocks to standalone styled HTML
  const compileBlocksToHTML = (blocksList, clientName, favoriteProduct) => {
    let html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; color: #374151; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">`
    
    blocksList.forEach(block => {
      const val = personalizeMessage(block.value || '', clientName, favoriteProduct)
      const label = personalizeMessage(block.label || '', clientName, favoriteProduct)
      const url = block.url || '#'
      
      switch (block.type) {
        case 'title': {
          const align = block.align || 'center'
          const tColor = block.color || '#9333ea'
          html += `<h1 style="color: ${tColor}; text-align: ${align}; font-size: 24px; font-weight: 800; margin-bottom: 18px; margin-top: 8px;">${val}</h1>`
          break
        }
        case 'text': {
          const txtColor = block.color || '#374151'
          const formattedText = val.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          html += `<p style="color: ${txtColor}; font-size: 14px; line-height: 1.6; margin-bottom: 18px;">${formattedText}</p>`
          break
        }
        case 'image': {
          const imgUrl = block.url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600'
          const alt = block.altText || 'Banner'
          const h = block.height || '160'
          html += `<div style="text-align: center; margin-bottom: 18px;"><img src="${imgUrl}" alt="${alt}" style="max-width: 100%; height: ${h}px; object-fit: cover; border-radius: 12px;" /></div>`
          break
        }
        case 'invoice_table':
          html += `
            <div style="margin-bottom: 18px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background-color: #f9fafb;">
              <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #9ca3af; margin: 0 0 12px 0; letter-spacing: 0.05em;">Resumen de Operación</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 8px 0; color: #4b5563;">Subtotal estimado</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1f2937;">$100.000 COP</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 8px 0; color: #4b5563;">IVA (19%)</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1f2937;">$19.000 COP</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 0 0; font-weight: 800; color: #9333ea;">Total Estimado</td>
                  <td style="padding: 10px 0 0 0; text-align: right; font-weight: 800; color: #9333ea; font-size: 15px;">$119.000 COP</td>
                </tr>
              </table>
            </div>
          `
          break
        case 'link': {
          const lnkColor = block.color || '#9333ea'
          html += `<div style="margin-bottom: 18px;"><a href="${url}" style="color: ${lnkColor}; font-size: 13.5px; text-decoration: underline; font-weight: 700;">${label || 'Ver adjunto / Enlace'}</a></div>`
          break
        }
        case 'button': {
          const btnBg = block.color || '#9333ea'
          const btnText = block.textColor || '#ffffff'
          html += `
            <div style="text-align: center; margin-bottom: 18px; margin-top: 18px;">
              <a href="${url}" style="background-color: ${btnBg}; color: ${btnText}; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(147, 51, 234, 0.2);">
                ${val || label || 'Hacer Clic'}
              </a>
            </div>
          `
          break
        }
        default:
          break
      }
    })

    // Permanent Watermark
    html += `
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; line-height: 1.5;">
        <span>Este es un correo automático enviado a través de la plataforma.</span><br/>
        <strong style="color: #6b7280;">GestivaOne copyright 2026</strong>
      </div>
    `

    html += `</div>`
    return html
  }

  // --- Campaign Triggering ---
  const handleSendCampaign = async () => {
    if (targetClients.length === 0) {
      toast.error('No hay clientes destinatarios válidos seleccionados')
      return
    }

    setSending(true)
    let successCount = 0
    let failCount = 0

    const companyData = {
      companyName: user?.companyName || 'GestivaOne',
      companyLogo: user?.companyLogo || null,
      companyEmail: user?.email || '',
      companyPhone: user?.phone || ''
    }

    for (const client of targetClients) {
      if (!client.email || client.email === 'correo-cliente@express.com') {
        failCount++
        continue
      }

      const clientSubject = personalizeMessage(subject, client.name, client.favoriteProduct)
      const clientBodyHTML = compileBlocksToHTML(blocks, client.name, client.favoriteProduct)

      const result = await sendCustomCampaignEmail({
        to: client.email,
        subject: clientSubject,
        htmlBody: clientBodyHTML,
        company: companyData
      })

      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    }

    setSending(false)
    toast.success(`Campaña finalizada. Enviados: ${successCount}. Fallidos: ${failCount}.`)
  }

  // --- Block Builder Helpers ---
  const addBlock = (type) => {
    const id = Date.now().toString()
    let newBlock = { id, type }
    switch (type) {
      case 'title':
        newBlock.value = 'Nuevo Título'
        newBlock.color = '#9333ea'
        newBlock.align = 'center'
        break
      case 'text':
        newBlock.value = 'Escribe tu mensaje aquí...\n\nUsa **negrita** para resaltar.'
        newBlock.color = '#374151'
        break
      case 'image':
        newBlock.url = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600'
        newBlock.altText = 'Banner'
        newBlock.height = '160'
        break
      case 'invoice_table':
        break
      case 'link':
        newBlock.label = 'Ver enlace / adjunto'
        newBlock.url = 'https://gestivaone.com'
        newBlock.color = '#9333ea'
        break
      case 'button':
        newBlock.value = 'Hacer Clic'
        newBlock.url = 'https://gestivaone.com'
        newBlock.color = '#9333ea'
        newBlock.textColor = '#ffffff'
        break
    }
    setBlocks([...blocks, newBlock])
    setSelectedBlockId(id)
  }

  const updateBlock = (id, fields) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...fields } : b))
  }

  const deleteBlock = (id) => {
    const updated = blocks.filter(b => b.id !== id)
    setBlocks(updated)
    if (selectedBlockId === id && updated.length > 0) {
      setSelectedBlockId(updated[0].id)
    }
  }

  const moveBlock = (index, direction) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= blocks.length) return
    const updated = [...blocks]
    const [moved] = updated.splice(index, 1)
    updated.splice(nextIndex, 0, moved)
    setBlocks(updated)
  }

  const loadTemplateBlocks = (key) => {
    const tmplBlocks = MOCK_LAYOUTS[key]
    if (tmplBlocks) {
      const cloned = tmplBlocks.map((b, i) => ({ ...b, id: `${Date.now()}-${i}` }))
      setBlocks(cloned)
      setSelectedBlockId(cloned[0]?.id || '')
      toast.success(`Plantilla cargada con éxito`)
    }
  }

  const handleCopyWhatsApp = (client) => {
    // Generate text-only fallback from compiled blocks
    const baseMsg = blocks
      .map(b => {
        if (b.type === 'title') return `*${b.value}*`
        if (b.type === 'text') return b.value
        if (b.type === 'button') return `${b.value}: ${b.url}`
        if (b.type === 'link') return `${b.label}: ${b.url}`
        return ''
      })
      .filter(Boolean)
      .join('\n\n')

    const personalized = personalizeMessage(baseMsg, client.name, client.favoriteProduct)
    const link = `https://api.whatsapp.com/send?phone=${client.phone.replace(/\+/g, '')}&text=${encodeURIComponent(personalized)}`
    
    window.open(link, '_blank')
    toast.success('Abriendo WhatsApp...')
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Mail size={20} className="text-brand-400" />
            Campañas & Constructor de Correos
          </h1>
          <p className="text-xs text-muted-400 mt-0.5">
            Crea plantillas dinámicas por bloques con marca de agua corporativa
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-subtle pb-2 shrink-0">
        <button
          onClick={() => setActiveTab('campaign')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border',
            activeTab === 'campaign'
              ? 'bg-brand-600/20 text-brand-300 border-brand-500/30'
              : 'border-transparent text-muted-400 hover:text-foreground hover:bg-surface-700/60'
          )}
        >
          <Send size={14} />
          Mesa de Trabajo
        </button>
        <button
          onClick={() => setActiveTab('affinities')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border',
            activeTab === 'affinities'
              ? 'bg-brand-600/20 text-brand-300 border-brand-500/30'
              : 'border-transparent text-muted-400 hover:text-foreground hover:bg-surface-700/60'
          )}
        >
          <Layers size={14} />
          Analizador de Afinidades
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'campaign' ? (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start"
          >
            {/* COLUMN 1: Elements Panel */}
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-surface-800/60 border border-subtle rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                  <Star size={14} className="text-brand-400" />
                  Cargar Ajustes
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => loadTemplateBlocks('promo')}
                    className="p-2 rounded-xl border border-subtle bg-surface-900 text-center hover:bg-surface-700/40 text-[10px] font-bold text-muted-400 hover:text-foreground transition-all"
                  >
                    Oferta
                  </button>
                  <button
                    onClick={() => loadTemplateBlocks('vip')}
                    className="p-2 rounded-xl border border-subtle bg-surface-900 text-center hover:bg-surface-700/40 text-[10px] font-bold text-muted-400 hover:text-foreground transition-all"
                  >
                    VIP
                  </button>
                  <button
                    onClick={() => loadTemplateBlocks('reactivation')}
                    className="p-2 rounded-xl border border-subtle bg-surface-900 text-center hover:bg-surface-700/40 text-[10px] font-bold text-muted-400 hover:text-foreground transition-all"
                  >
                    Regreso
                  </button>
                </div>
              </div>

              <div className="bg-surface-800/60 border border-subtle rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                  <Plus size={14} className="text-brand-400" />
                  Añadir Bloques
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addBlock('title')}
                    className="flex items-center gap-2 p-3 rounded-xl border border-subtle bg-surface-900 hover:bg-surface-700/40 text-xs font-bold text-muted-400 hover:text-foreground transition-all"
                  >
                    <Type size={14} className="text-purple-400 shrink-0" />
                    <span>Título</span>
                  </button>
                  <button
                    onClick={() => addBlock('text')}
                    className="flex items-center gap-2 p-3 rounded-xl border border-subtle bg-surface-900 hover:bg-surface-700/40 text-xs font-bold text-muted-400 hover:text-foreground transition-all"
                  >
                    <FileText size={14} className="text-blue-400 shrink-0" />
                    <span>Texto</span>
                  </button>
                  <button
                    onClick={() => addBlock('image')}
                    className="flex items-center gap-2 p-3 rounded-xl border border-subtle bg-surface-900 hover:bg-surface-700/40 text-xs font-bold text-muted-400 hover:text-foreground transition-all"
                  >
                    <ImageIcon size={14} className="text-green-400 shrink-0" />
                    <span>Imagen</span>
                  </button>
                  <button
                    onClick={() => addBlock('invoice_table')}
                    className="flex items-center gap-2 p-3 rounded-xl border border-subtle bg-surface-900 hover:bg-surface-700/40 text-xs font-bold text-muted-400 hover:text-foreground transition-all"
                  >
                    <Percent size={14} className="text-amber-400 shrink-0" />
                    <span>Tabla Resumen</span>
                  </button>
                  <button
                    onClick={() => addBlock('link')}
                    className="flex items-center gap-2 p-3 rounded-xl border border-subtle bg-surface-900 hover:bg-surface-700/40 text-xs font-bold text-muted-400 hover:text-foreground transition-all"
                  >
                    <Link2 size={14} className="text-cyan-400 shrink-0" />
                    <span>Enlace</span>
                  </button>
                  <button
                    onClick={() => addBlock('button')}
                    className="flex items-center gap-2 p-3 rounded-xl border border-subtle bg-surface-900 hover:bg-surface-700/40 text-xs font-bold text-muted-400 hover:text-foreground transition-all"
                  >
                    <ShoppingCart size={14} className="text-red-400 shrink-0" />
                    <span>Botón</span>
                  </button>
                </div>
              </div>

              {/* Targeting settings */}
              <div className="bg-surface-800/60 border border-subtle rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                  <Layers size={14} className="text-brand-400" />
                  Destinatarios
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted-400 mb-1">Segmento CRM</label>
                    <select
                      value={targetSegment}
                      onChange={(e) => setTargetSegment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none focus:border-brand-500"
                    >
                      <option value="all">Todos los clientes</option>
                      <option value="vip">VIP (Frecuentes y recientes)</option>
                      <option value="activo">Activos</option>
                      <option value="tibio">Tibios</option>
                      <option value="inactivo">Inactivos</option>
                      <option value="nuevo">Nuevos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted-400 mb-1">Afinidad por Producto</label>
                    <select
                      value={customClientFilter}
                      onChange={(e) => setCustomClientFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none focus:border-brand-500"
                    >
                      <option value="all">Cualquier producto</option>
                      {allPurchasedProducts.map((p) => (
                        <option key={p} value={p}>Preferencia: {p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 bg-surface-900/60 border border-subtle/50 rounded-xl flex items-center justify-between text-xs mt-2">
                    <span className="text-muted-400">Total filtrados:</span>
                    <span className="font-bold text-brand-400">{targetClients.length} clientes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Editor Panel */}
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-surface-800/60 border border-subtle rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
                  <Edit2 size={14} className="text-brand-400" />
                  Editar Bloques Activos
                </h3>

                {/* Blocks flow */}
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 no-scrollbar mb-4 border-b border-subtle pb-4">
                  {blocks.map((block, idx) => (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={clsx(
                        'flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all',
                        selectedBlockId === block.id
                          ? 'bg-brand-600/10 border-brand-500/40 text-brand-300'
                          : 'bg-surface-900/50 border-subtle text-muted-400 hover:text-foreground hover:bg-surface-900/90'
                      )}
                    >
                      <span className="capitalize">{block.type}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(idx, -1); }}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-surface-700 disabled:opacity-30"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(idx, 1); }}
                          disabled={idx === blocks.length - 1}
                          className="p-1 rounded hover:bg-surface-700 disabled:opacity-30"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                          className="p-1 rounded hover:bg-danger-950/30 text-danger-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected block values editing form */}
                {selectedBlock ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-400">Propiedades del Bloque</span>
                      <span className="text-[10px] bg-brand-500/20 text-brand-300 font-bold px-2 py-0.5 rounded uppercase">{selectedBlock.type}</span>
                    </div>

                    {/* Dynamic Fields */}
                    {selectedBlock.type === 'title' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Texto del Título</label>
                          <input
                            type="text"
                            value={selectedBlock.value}
                            onChange={(e) => updateBlock(selectedBlock.id, { value: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Color de Texto</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={selectedBlock.color}
                              onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                              className="w-8 h-8 rounded border-0 bg-transparent shrink-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={selectedBlock.color}
                              onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-surface-900 border border-subtle text-xs font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Alineación</label>
                          <div className="flex gap-1.5 bg-surface-900 p-1 rounded-xl border border-subtle">
                            {['left', 'center', 'right'].map(align => (
                              <button
                                key={align}
                                onClick={() => updateBlock(selectedBlock.id, { align })}
                                className={clsx(
                                  'flex-1 flex justify-center py-1.5 rounded-lg text-xs capitalize',
                                  selectedBlock.align === align ? 'bg-surface-700 text-white font-bold' : 'text-muted-400 hover:text-foreground'
                                )}
                              >
                                {align === 'left' && <AlignLeft size={13} />}
                                {align === 'center' && <AlignCenter size={13} />}
                                {align === 'right' && <AlignRight size={13} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'text' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Contenido (Soporta **negrita**)</label>
                          <textarea
                            rows={5}
                            value={selectedBlock.value}
                            onChange={(e) => updateBlock(selectedBlock.id, { value: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Color de Texto</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={selectedBlock.color}
                              onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                              className="w-8 h-8 rounded border-0 bg-transparent shrink-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={selectedBlock.color}
                              onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-surface-900 border border-subtle text-xs font-mono"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'image' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">URL de la Imagen</label>
                          <input
                            type="text"
                            value={selectedBlock.url}
                            onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Texto Alternativo (Alt)</label>
                          <input
                            type="text"
                            value={selectedBlock.altText || ''}
                            onChange={(e) => updateBlock(selectedBlock.id, { altText: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Altura (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.height || '160'}
                            onChange={(e) => updateBlock(selectedBlock.id, { height: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none"
                          />
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'invoice_table' && (
                      <p className="text-xs text-muted-400 leading-relaxed bg-surface-900/60 p-3 rounded-xl border border-subtle/50">
                        Este bloque autogenera un resumen de facturación interactivo con Subtotal, IVA y Total. No requiere configuración adicional.
                      </p>
                    )}

                    {selectedBlock.type === 'link' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Texto del Enlace</label>
                          <input
                            type="text"
                            value={selectedBlock.label}
                            onChange={(e) => updateBlock(selectedBlock.id, { label: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">URL / Destino</label>
                          <input
                            type="text"
                            value={selectedBlock.url}
                            onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Color del Vínculo</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={selectedBlock.color}
                              onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                              className="w-8 h-8 rounded border-0 bg-transparent shrink-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={selectedBlock.color}
                              onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-surface-900 border border-subtle text-xs font-mono"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedBlock.type === 'button' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Texto del Botón</label>
                          <input
                            type="text"
                            value={selectedBlock.value}
                            onChange={(e) => updateBlock(selectedBlock.id, { value: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">URL / Destino</label>
                          <input
                            type="text"
                            value={selectedBlock.url}
                            onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Fondo del Botón</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={selectedBlock.color}
                              onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                              className="w-8 h-8 rounded border-0 bg-transparent shrink-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={selectedBlock.color}
                              onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-surface-900 border border-subtle text-xs font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-400 mb-1">Texto del Botón</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={selectedBlock.textColor || '#ffffff'}
                              onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                              className="w-8 h-8 rounded border-0 bg-transparent shrink-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={selectedBlock.textColor || '#ffffff'}
                              onChange={(e) => updateBlock(selectedBlock.id, { textColor: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-surface-900 border border-subtle text-xs font-mono"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Placeholder hint */}
                    <div className="p-3 bg-surface-900/40 border border-subtle rounded-xl text-[10.5px] text-muted-400 leading-normal space-y-1">
                      <p className="font-bold text-brand-400">Variables Disponibles:</p>
                      <p><code className="font-mono text-white">&#123;&#123;cliente&#125;&#125;</code>: Nombre del cliente</p>
                      <p><code className="font-mono text-white">&#123;&#123;empresa&#125;&#125;</code>: {user?.companyName || 'Tu Empresa'}</p>
                      <p><code className="font-mono text-white">&#123;&#123;producto&#125;&#125;</code>: Producto más comprado</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-500 text-center py-6">Selecciona un bloque para editar sus propiedades</p>
                )}
              </div>
            </div>

            {/* COLUMN 3: Live Preview & Send */}
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-surface-800/60 border border-subtle rounded-2xl p-4 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Eye size={14} className="text-brand-400" />
                  Previsualización en Vivo
                </h3>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-400 mb-1">Asunto de Campaña</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-subtle text-xs text-foreground focus:outline-none focus:border-brand-500 font-semibold"
                    placeholder="Escribe el asunto del correo"
                  />
                </div>

                {/* Email container simulator */}
                <div className="border border-dashed border-subtle rounded-xl p-3 bg-surface-900/40 max-h-[420px] overflow-y-auto no-scrollbar">
                  <div className="text-[10px] text-muted-500 font-bold uppercase mb-2">
                    Asunto: {personalizeMessage(subject, targetClients[0]?.name, targetClients[0]?.favoriteProduct)}
                  </div>
                  
                  {/* Inner simulation */}
                  <div className="bg-white text-gray-800 rounded-xl p-4 overflow-hidden">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: compileBlocksToHTML(blocks, targetClients[0]?.name, targetClients[0]?.favoriteProduct)
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendCampaign}
                  disabled={sending || targetClients.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 disabled:opacity-40 text-xs font-bold text-white shadow-glow transition-all"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="animate-spin shrink-0" size={14} />
                      <span>Enviando campaña...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} className="shrink-0" />
                      <span>Enviar a {targetClients.length} Clientes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Affinities Analyser Tab */
          <motion.div
            key="affinities"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="space-y-4 flex-1"
          >
            <div className="p-4 bg-surface-800/60 border border-subtle rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 flex items-center gap-1.5">
                <Info size={14} className="text-brand-400" />
                Análisis de Compras e Interacciones
              </h3>
              <p className="text-xs text-muted-400 leading-relaxed">
                El analizador procesa las compras finalizadas de los clientes de manera continua para identificar qué productos tienen mayor tasa de recurrencia.
                Úsalo para lanzar campañas automatizadas por WhatsApp o correo.
              </p>
            </div>

            <div className="bg-surface-800/40 border border-subtle rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1.8fr_120px] gap-3 px-4 py-3 border-b border-subtle bg-surface-800/60">
                {['Cliente', 'Total Gastado', 'Órdenes Pagadas', 'Producto Preferido / Tendencia', 'Acciones'].map((h) => (
                  <p key={h} className="text-[10px] uppercase tracking-wider text-muted-500 font-bold">{h}</p>
                ))}
              </div>

              <div className="divide-y divide-subtle/50">
                {clientAffinities.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle size={32} className="mx-auto text-muted-600 mb-2 animate-bounce" />
                    <p className="text-xs text-muted-500">No hay ventas registradas para realizar el análisis</p>
                  </div>
                )}
                {clientAffinities.map((client) => (
                  <div
                    key={client.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1fr_1.8fr_120px] gap-2 md:gap-3 px-4 py-3 items-center hover:bg-surface-700/20 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">{client.name}</p>
                      <p className="text-[10px] text-muted-500">{client.email || client.phone || '—'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-foreground">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(client.totalSpent)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-foreground font-semibold">{client.totalOrders} facturas</p>
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        <ShoppingBag size={10} />
                        {client.favoriteProduct} ({client.favoriteProductCount} u)
                      </span>
                    </div>

                    <div className="flex gap-1.5 justify-end">
                      {client.phone && client.phone !== '—' && (
                        <button
                          onClick={() => handleCopyWhatsApp(client)}
                          title="Enviar campaña a WhatsApp"
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                        >
                          <MessageSquare size={13} />
                        </button>
                      )}
                      
                      {client.email && client.email !== 'correo-cliente@express.com' && (
                        <button
                          onClick={() => {
                            setCustomClientFilter(client.favoriteProduct)
                            setActiveTab('campaign')
                            toast.success(`Filtro de afinidad aplicado: ${client.favoriteProduct}`)
                          }}
                          title="Lanzar constructor para este producto"
                          className="p-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/20 transition-colors"
                        >
                          <Mail size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
