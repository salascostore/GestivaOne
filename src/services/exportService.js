/**
 * exportService.js
 * PDF and Excel export utilities for GestivaOne
 * Uses jsPDF + autotable for PDF, xlsx for Excel
 */

// ── PDF ────────────────────────────────────────────────────────
export async function exportInvoicesPDF(invoices, companyName = 'Mi Empresa') {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFillColor(30, 30, 46)
  doc.rect(0, 0, 297, 28, 'F')
  doc.setTextColor(167, 139, 250)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Gestiva', 14, 12)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text('One', 14, 18)
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(9)
  doc.text(`Reporte de Facturas — ${companyName}`, 14, 25)
  doc.text(new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }), 260, 25, { align: 'right' })

  const STATUS_ES = { paid: 'Pagada', pending: 'Pendiente', overdue: 'Atrasada', cancelled: 'Cancelada' }
  const rows = invoices.map((inv) => [
    inv.id?.slice(-8)?.toUpperCase() || '—',
    inv.clientName || 'Sin cliente',
    new Date(inv.createdAt).toLocaleDateString('es-CO'),
    STATUS_ES[inv.status] || inv.status,
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.total || 0),
  ])

  autoTable(doc, {
    startY: 32,
    head: [['ID', 'Cliente', 'Fecha', 'Estado', 'Total']],
    body: rows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
  })

  const total = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const finalY = doc.lastAutoTable.finalY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 46)
  doc.text(`Total general: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)}`, 280, finalY, { align: 'right' })

  doc.save(`facturas_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export async function exportClientsPDF(clients, companyName = 'Mi Empresa') {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  doc.setFillColor(30, 30, 46)
  doc.rect(0, 0, 210, 25, 'F')
  doc.setTextColor(167, 139, 250)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('GestivaOne', 14, 12)
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(`Clientes — ${companyName}`, 14, 20)
  doc.text(new Date().toLocaleDateString('es-CO'), 196, 20, { align: 'right' })

  const TYPE_ES = { frequent: 'Frecuente', express: 'Express' }
  const rows = clients.map((c) => [
    c.name,
    c.email || '—',
    c.phone || '—',
    c.address || '—',
    TYPE_ES[c.type] || c.type,
    c.status === 'active' ? 'Activo' : 'Inactivo',
  ])

  autoTable(doc, {
    startY: 29,
    head: [['Nombre', 'Correo', 'Teléfono', 'Dirección', 'Tipo', 'Estado']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 250] },
  })

  doc.save(`clientes_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export async function exportProductsPDF(products, companyName = 'Mi Empresa') {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  doc.setFillColor(30, 30, 46)
  doc.rect(0, 0, 210, 25, 'F')
  doc.setTextColor(167, 139, 250)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('GestivaOne', 14, 12)
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(`Inventario — ${companyName}`, 14, 20)
  doc.text(new Date().toLocaleDateString('es-CO'), 196, 20, { align: 'right' })

  const rows = products.map((p) => [
    p.name,
    p.category || '—',
    p.unit || '—',
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.price || 0),
    p.stock ?? '—',
    p.stock <= (p.minStock || 5) ? '⚠ Bajo' : 'OK',
  ])

  autoTable(doc, {
    startY: 29,
    head: [['Producto', 'Categoría', 'Unidad', 'Precio', 'Stock', 'Estado']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'center' }, 5: { halign: 'center' } },
  })

  doc.save(`inventario_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Excel ──────────────────────────────────────────────────────
export async function exportInvoicesExcel(invoices, companyName = 'Mi Empresa') {
  const XLSX = await import('xlsx')

  const STATUS_ES = { paid: 'Pagada', pending: 'Pendiente', overdue: 'Atrasada', cancelled: 'Cancelada' }
  const data = [
    [companyName, '', '', '', new Date().toLocaleDateString('es-CO')],
    [],
    ['ID', 'Cliente', 'Fecha', 'Estado', 'Total (COP)'],
    ...invoices.map((inv) => [
      inv.id?.slice(-8)?.toUpperCase() || '',
      inv.clientName || '',
      new Date(inv.createdAt).toLocaleDateString('es-CO'),
      STATUS_ES[inv.status] || inv.status,
      inv.total || 0,
    ]),
    [],
    ['', '', '', 'TOTAL', invoices.reduce((s, i) => s + (i.total || 0), 0)],
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 18 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Facturas')
  XLSX.writeFile(wb, `facturas_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function exportClientsExcel(clients, companyName = 'Mi Empresa') {
  const XLSX = await import('xlsx')
  const TYPE_ES = { frequent: 'Frecuente', express: 'Express' }
  const data = [
    [companyName, '', '', '', '', new Date().toLocaleDateString('es-CO')],
    [],
    ['Nombre', 'Correo', 'Teléfono', 'Dirección', 'Tipo', 'Estado'],
    ...clients.map((c) => [
      c.name, c.email || '', c.phone || '', c.address || '',
      TYPE_ES[c.type] || c.type, c.status === 'active' ? 'Activo' : 'Inactivo',
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
  XLSX.writeFile(wb, `clientes_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function exportProductsExcel(products, companyName = 'Mi Empresa') {
  const XLSX = await import('xlsx')
  const data = [
    [companyName, '', '', '', '', new Date().toLocaleDateString('es-CO')],
    [],
    ['Producto', 'Categoría', 'Unidad', 'Precio (COP)', 'Stock', 'Estado'],
    ...products.map((p) => [
      p.name, p.category || '', p.unit || '', p.price || 0,
      p.stock ?? 0, p.stock <= (p.minStock || 5) ? 'Stock Bajo' : 'OK',
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
  XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function exportSingleInvoicePDF(invoice, client = null, settings = {}) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const isMinimalist = settings.pdfTemplate === 'minimalist'

  const companyName = settings.companyName || 'GestivaOne'
  const companyPhone = settings.companyPhone || ''
  const companyEmail = settings.companyEmail || ''
  const invoiceIdStr = (invoice.id?.slice(-8) || invoice.id || 'N/A').toUpperCase()
  const dateStr = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO')
  
  let itemsList = []
  if (invoice.items) {
    try {
      itemsList = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
    } catch (e) {
      console.error('Error parsing invoice items for PDF:', e)
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)
  }

  // 1. HEADER BRANDING
  if (!isMinimalist) {
    // Corporate Header (Vibrant background band)
    doc.setFillColor(30, 27, 75) // Dark indigo bg
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(167, 139, 250) // Purple violet
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text(companyName.toUpperCase(), 15, 18)
    
    doc.setFontSize(9)
    doc.setTextColor(196, 181, 253)
    doc.text('FACTURA DE VENTA COMERCIAL', 15, 25)
    
    doc.setFontSize(8)
    doc.setTextColor(224, 242, 254)
    if (companyPhone) doc.text(`Cel: ${companyPhone}`, 15, 30)
    if (companyEmail) doc.text(`Email: ${companyEmail}`, 15, 34)

    // Invoice badge
    doc.setFillColor(124, 58, 237)
    doc.rect(145, 10, 50, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`FACTURA N°`, 150, 16)
    doc.setFontSize(11)
    doc.text(`#${invoiceIdStr}`, 150, 24)
  } else {
    // Minimalist Header (Clean whitespace, no background bands)
    doc.setTextColor(15, 23, 42) // Slate-900
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(26)
    doc.text(companyName, 15, 20)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139) // Slate-500
    doc.text('Factura de Venta', 15, 26)
    if (companyPhone || companyEmail) {
      doc.text(`${companyPhone}  |  ${companyEmail}`, 15, 31)
    }

    // Minimalist Invoice Info on the right
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`N° FACTURA: #${invoiceIdStr}`, 195, 18, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`Fecha de Emisión: ${dateStr}`, 195, 24, { align: 'right' })
  }

  // 2. CLIENT & METADATA SECTIONS
  let clientName = client?.name || invoice.client_name || 'Consumidor Final'
  let clientPhone = client?.phone || invoice.client_phone || '—'
  let clientEmail = client?.email || invoice.client_email || '—'
  let clientAddress = client?.address || invoice.client_address || '—'

  let startY = 48
  if (!isMinimalist) {
    // Corporate Info Blocks
    doc.setFillColor(248, 250, 252) // slate-50
    doc.rect(14, startY, 86, 26, 'F')
    doc.rect(110, startY, 86, 26, 'F')
    
    doc.setDrawColor(226, 232, 240)
    doc.rect(14, startY, 86, 26)
    doc.rect(110, startY, 86, 26)

    // Left block: Client Info
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(124, 58, 237)
    doc.text('FACTURAR A:', 18, startY + 5)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(`Nombre: ${clientName}`, 18, startY + 10)
    doc.text(`Teléfono: ${clientPhone}`, 18, startY + 14)
    doc.text(`Email: ${clientEmail}`, 18, startY + 18)
    doc.text(`Dirección: ${clientAddress}`, 18, startY + 22)

    // Right block: Invoice Metadata
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(124, 58, 237)
    doc.text('DETALLES DE FACTURA:', 114, startY + 5)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(`Fecha: ${dateStr}`, 114, startY + 10)
    doc.text(`Método Pago: ${invoice.payment_type === 'immediate' ? 'Inmediato' : 'Crédito'}`, 114, startY + 14)
    if (invoice.due_date || invoice.scheduledDate) {
      const d = invoice.due_date || invoice.scheduledDate
      doc.text(`Vencimiento: ${new Date(d).toLocaleDateString('es-CO')}`, 114, startY + 18)
    } else {
      doc.text(`Estado: ${invoice.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}`, 114, startY + 18)
    }
    doc.text(`Moneda: COP (Peso Colombiano)`, 114, startY + 22)
  } else {
    // Minimalist clean blocks
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('CLIENTE', 15, startY)
    doc.text('DETALLES', 120, startY)

    doc.setDrawColor(241, 245, 249)
    doc.line(15, startY + 2, 200, startY + 2)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(51, 65, 85)
    
    // Client details
    doc.text(clientName, 15, startY + 8)
    doc.text(`Tel: ${clientPhone}`, 15, startY + 13)
    doc.text(`Email: ${clientEmail}`, 15, startY + 18)
    if (clientAddress !== '—') doc.text(`Dirección: ${clientAddress}`, 15, startY + 23)

    // Invoice details
    doc.text(`Fecha: ${dateStr}`, 120, startY + 8)
    doc.text(`Forma de Pago: ${invoice.payment_type === 'immediate' ? 'Inmediato' : 'Crédito'}`, 120, startY + 13)
    if (invoice.payment_status) {
      doc.text(`Estado: ${invoice.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE'}`, 120, startY + 18)
    }
  }

  // 3. PRODUCT ITEMS TABLE
  const tableStartY = isMinimalist ? startY + 32 : startY + 34
  const rows = itemsList.map((item, index) => [
    index + 1,
    item.name || item.product_name || 'Producto',
    item.quantity || 1,
    formatCurrency(item.price || 0),
    formatCurrency((item.price || 0) * (item.quantity || 1))
  ])

  const headStyles = isMinimalist 
    ? { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5 }
    : { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 9 }

  const alternateRowStyles = isMinimalist ? null : { fillColor: [248, 250, 252] }

  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Descripción del Producto', 'Cant', 'Precio Unitario', 'Total']],
    body: rows,
    styles: { fontSize: 8.5, cellPadding: 3.5, font: 'helvetica' },
    headStyles,
    alternateRowStyles,
    columnStyles: {
      0: { width: 10, halign: 'center' },
      2: { width: 15, halign: 'center' },
      3: { width: 35, halign: 'right' },
      4: { width: 35, halign: 'right' }
    }
  })

  // 4. TOTALS SUMMARY block
  const finalY = doc.lastAutoTable.finalY + 8
  const totalVal = invoice.total || 0
  const subtotalVal = invoice.subtotal || (invoice.total - (invoice.taxAmount || 0))
  const taxVal = invoice.taxAmount || 0
  const taxRatePercent = invoice.taxRate ? (invoice.taxRate * 100).toFixed(0) : '19'

  // Set position on the right side
  const summaryX = 130
  
  if (!isMinimalist) {
    doc.setFillColor(248, 250, 252)
    doc.rect(summaryX - 5, finalY - 4, 75, taxVal > 0 ? 28 : 20, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(summaryX - 5, finalY - 4, 75, taxVal > 0 ? 28 : 20)

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    
    let currentY = finalY + 2
    if (taxVal > 0) {
      doc.text('Subtotal:', summaryX, currentY)
      doc.text(formatCurrency(subtotalVal), 195, currentY, { align: 'right' })
      currentY += 6
      
      doc.text(`IVA (${taxRatePercent}%):`, summaryX, currentY)
      doc.text(formatCurrency(taxVal), 195, currentY, { align: 'right' })
      currentY += 6
    }
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(124, 58, 237)
    doc.text('TOTAL A PAGAR:', summaryX, currentY)
    doc.text(formatCurrency(totalVal), 195, currentY, { align: 'right' })
  } else {
    // Minimalist summary
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')

    let currentY = finalY + 1
    if (taxVal > 0) {
      doc.text('Subtotal:', summaryX, currentY)
      doc.text(formatCurrency(subtotalVal), 195, currentY, { align: 'right' })
      
      doc.setDrawColor(241, 245, 249)
      doc.line(summaryX, currentY + 3, 200, currentY + 3)
      currentY += 6

      doc.text(`IVA (${taxRatePercent}%):`, summaryX, currentY)
      doc.text(formatCurrency(taxVal), 195, currentY, { align: 'right' })
      
      doc.line(summaryX, currentY + 3, 200, currentY + 3)
      currentY += 6
    }

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('TOTAL:', summaryX, currentY)
    doc.text(formatCurrency(totalVal), 195, currentY, { align: 'right' })
  }

  // 5. FOOTER
  const pageHeight = doc.internal.pageSize.height
  const footerText = settings.footerText || '¡Gracias por su compra!'
  
  doc.setDrawColor(226, 232, 240)
  doc.line(15, pageHeight - 25, 195, pageHeight - 25)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(footerText, 105, pageHeight - 18, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Factura generada electrónicamente por GestivaOne. Todos los derechos reservados.', 105, pageHeight - 12, { align: 'center' })

  // Save the PDF
  doc.save(`factura_${invoiceIdStr}.pdf`)
}

