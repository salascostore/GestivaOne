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
