import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"

// Helper para formatear valores monetarios
export const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
})

// Función para generar un archivo PDF de Factura profesional
export async function generateInvoicePDF(data: {
  invoice_number: string
  created_at: string
  client_name: string
  company_name: string
  product_name: string
  quantity: number
  subtotal: number
  tax_amount: number
  total: number
}) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.27, 841.89]) // Tamaño A4
  const { width, height } = page.getSize()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // 1. Banner Superior (Color de marca oscuro de GestivaOne)
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: rgb(30 / 255, 30 / 255, 46 / 255),
  })

  // Marca / Logo
  page.drawText(data.company_name, {
    x: 35,
    y: height - 40,
    size: 20,
    font: fontBold,
    color: rgb(167 / 255, 139 / 255, 250 / 255),
  })
  
  page.drawText("Facturación Electrónica Inteligente", {
    x: 35,
    y: height - 58,
    size: 9,
    font: fontRegular,
    color: rgb(200 / 255, 200 / 255, 200 / 255),
  })

  // Título e Información de Factura
  page.drawText("FACTURA DE VENTA", {
    x: width - 200,
    y: height - 35,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  page.drawText(`Nº: ${data.invoice_number}`, {
    x: width - 200,
    y: height - 52,
    size: 11,
    font: fontBold,
    color: rgb(124 / 255, 58 / 255, 237 / 255),
  })

  const formattedDate = new Date(data.created_at).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  page.drawText(`Fecha: ${formattedDate}`, {
    x: width - 200,
    y: height - 67,
    size: 9,
    font: fontRegular,
    color: rgb(200 / 255, 200 / 255, 200 / 255),
  })

  // 2. Sección de Detalles del Cliente
  page.drawRectangle({
    x: 35,
    y: height - 180,
    width: width - 70,
    height: 75,
    color: rgb(245 / 255, 245 / 250 / 255),
    borderColor: rgb(220 / 255, 220 / 230 / 255),
    borderWidth: 1,
  })

  page.drawText("INFORMACIÓN DEL CLIENTE", {
    x: 45,
    y: height - 125,
    size: 10,
    font: fontBold,
    color: rgb(124 / 255, 58 / 255, 237 / 255),
  })

  page.drawText(`Nombre / Razón Social: ${data.client_name}`, {
    x: 45,
    y: height - 145,
    size: 10,
    font: fontRegular,
    color: rgb(30 / 255, 30 / 255, 46 / 255),
  })

  page.drawText(`Estado de Pago: PAGADO (Inmediato)`, {
    x: 45,
    y: height - 165,
    size: 10,
    font: fontRegular,
    color: rgb(16 / 255, 185 / 255, 129 / 255),
  })

  // 3. Encabezados de Tabla de Ítems
  const tableTop = height - 230
  page.drawRectangle({
    x: 35,
    y: tableTop,
    width: width - 70,
    height: 25,
    color: rgb(124 / 255, 58 / 255, 237 / 255),
  })

  page.drawText("Descripción del Producto / Servicio", {
    x: 45,
    y: tableTop + 8,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  page.drawText("Cant.", {
    x: 320,
    y: tableTop + 8,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  page.drawText("Precio Unitario", {
    x: 390,
    y: tableTop + 8,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  page.drawText("Total COP", {
    x: 500,
    y: tableTop + 8,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  // Fila del Producto
  const rowTop = tableTop - 30
  page.drawRectangle({
    x: 35,
    y: rowTop,
    width: width - 70,
    height: 30,
    color: rgb(1, 1, 1),
    borderColor: rgb(240 / 255, 240 / 245 / 255),
    borderWidth: 1,
  })

  page.drawText(data.product_name, {
    x: 45,
    y: rowTop + 10,
    size: 9,
    font: fontRegular,
    color: rgb(30 / 255, 30 / 255, 46 / 255),
  })

  page.drawText(data.quantity.toString(), {
    x: 320,
    y: rowTop + 10,
    size: 9,
    font: fontRegular,
    color: rgb(30 / 255, 30 / 255, 46 / 255),
  })

  page.drawText(formatter.format(data.subtotal / data.quantity), {
    x: 390,
    y: rowTop + 10,
    size: 9,
    font: fontRegular,
    color: rgb(30 / 255, 30 / 255, 46 / 255),
  })

  page.drawText(formatter.format(data.subtotal), {
    x: 500,
    y: rowTop + 10,
    size: 9,
    font: fontRegular,
    color: rgb(30 / 255, 30 / 255, 46 / 255),
  })

  // 4. Sección de Totales
  const totalsTop = rowTop - 100
  page.drawText("Subtotal:", {
    x: 390,
    y: totalsTop + 70,
    size: 10,
    font: fontRegular,
    color: rgb(100 / 255, 100 / 110 / 255),
  })
  page.drawText(formatter.format(data.subtotal), {
    x: 500,
    y: totalsTop + 70,
    size: 10,
    font: fontRegular,
    color: rgb(30 / 255, 30 / 255, 46 / 255),
  })

  page.drawText("IVA (19%):", {
    x: 390,
    y: totalsTop + 50,
    size: 10,
    font: fontRegular,
    color: rgb(100 / 255, 100 / 110 / 255),
  })
  page.drawText(formatter.format(data.tax_amount), {
    x: 500,
    y: totalsTop + 50,
    size: 10,
    font: fontRegular,
    color: rgb(30 / 255, 30 / 255, 46 / 255),
  })

  // Línea divisoria de totales
  page.drawLine({
    start: { x: 380, y: totalsTop + 40 },
    end: { x: 560, y: totalsTop + 40 },
    color: rgb(220 / 255, 220 / 230 / 255),
    thickness: 1,
  })

  page.drawText("Total General:", {
    x: 390,
    y: totalsTop + 20,
    size: 11,
    font: fontBold,
    color: rgb(124 / 255, 58 / 255, 237 / 255),
  })
  page.drawText(formatter.format(data.total), {
    x: 500,
    y: totalsTop + 20,
    size: 11,
    font: fontBold,
    color: rgb(124 / 255, 58 / 255, 237 / 255),
  })

  // Footer Decorativo
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 40,
    color: rgb(245 / 255, 245 / 250 / 255),
  })

  page.drawText("Factura oficial generada por GestiBot para GestivaOne SaaS. Todos los derechos reservados.", {
    x: 35,
    y: 15,
    size: 8,
    font: fontRegular,
    color: rgb(120 / 255, 120 / 130 / 255),
  })

  return await pdfDoc.save()
}

// Función para generar un Reporte PDF profesional con tablas y balance
export async function generateReportPDF(data: {
  days: number
  company_name: string
  total_ingresos: number
  total_egresos: number
  balance: number
  invoices: Array<{ client_name: string; total: number; created_at: string }>
  expenses: Array<{ description: string; category: string; amount: number; created_at: string }>
}) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.27, 841.89]) // Tamaño A4
  const { width, height } = page.getSize()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // 1. Banner Superior (Estilo GestivaOne)
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: rgb(30 / 255, 30 / 255, 46 / 255),
  })

  page.drawText(`Reporte de Caja: ${data.company_name}`, {
    x: 35,
    y: height - 40,
    size: 18,
    font: fontBold,
    color: rgb(167 / 255, 139 / 255, 250 / 255),
  })

  page.drawText(`Resumen financiero consolidado — Últimos ${data.days} días`, {
    x: 35,
    y: height - 58,
    size: 10,
    font: fontRegular,
    color: rgb(200 / 255, 200 / 255, 200 / 255),
  })

  // 2. Tarjetas de Resumen
  const cardWidth = 160
  const cardHeight = 55
  const cardY = height - 155

  // Tarjeta Ingresos (Verde)
  page.drawRectangle({
    x: 35,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: rgb(240 / 255, 253 / 255, 244 / 255),
    borderColor: rgb(187 / 255, 247 / 255, 208 / 255),
    borderWidth: 1,
  })
  page.drawText("TOTAL INGRESOS", { x: 45, y: cardY + 38, size: 8, font: fontBold, color: rgb(22 / 255, 101 / 255, 52 / 255) })
  page.drawText(formatter.format(data.total_ingresos), { x: 45, y: cardY + 15, size: 13, font: fontBold, color: rgb(21 / 255, 128 / 255, 61 / 255) })

  // Tarjeta Egresos (Rojo)
  page.drawRectangle({
    x: 35 + cardWidth + 20,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: rgb(254 / 255, 242 / 255, 242 / 255),
    borderColor: rgb(254 / 255, 202 / 255, 202 / 255),
    borderWidth: 1,
  })
  page.drawText("TOTAL EGRESOS", { x: 35 + cardWidth + 30, y: cardY + 38, size: 8, font: fontBold, color: rgb(153 / 255, 27 / 255, 27 / 255) })
  page.drawText(formatter.format(data.total_egresos), { x: 35 + cardWidth + 30, y: cardY + 15, size: 13, font: fontBold, color: rgb(185 / 255, 28 / 255, 28 / 255) })

  // Tarjeta Balance
  const balanceColor = data.balance >= 0 ? rgb(21 / 255, 128 / 255, 61 / 255) : rgb(185 / 255, 28 / 255, 28 / 255)
  page.drawRectangle({
    x: 35 + (cardWidth * 2) + 40,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: rgb(245 / 255, 245 / 250 / 255),
    borderColor: rgb(220 / 255, 220 / 230 / 255),
    borderWidth: 1,
  })
  page.drawText("BALANCE NETO", { x: 35 + (cardWidth * 2) + 50, y: cardY + 38, size: 8, font: fontBold, color: rgb(100 / 255, 100 / 110 / 255) })
  page.drawText(formatter.format(data.balance), { x: 35 + (cardWidth * 2) + 50, y: cardY + 15, size: 13, font: fontBold, color: balanceColor })

  // ==========================================
  // GRÁFICO COMPARATIVO DE FLUJO DE CAJA
  // ==========================================
  const chartContainerY = height - 225
  const chartContainerHeight = 50
  page.drawRectangle({
    x: 35,
    y: chartContainerY,
    width: width - 70,
    height: chartContainerHeight,
    color: rgb(248 / 255, 250 / 255, 252 / 255),
    borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
    borderWidth: 1,
  })

  // Leyenda del gráfico
  page.drawText("PROPORCIÓN DEL FLUJO DE CAJA (INGRESOS VS EGRESOS)", {
    x: 45,
    y: chartContainerY + 38,
    size: 7,
    font: fontBold,
    color: rgb(100 / 255, 116 / 255, 139 / 255)
  })

  const barX = 45
  const barY = chartContainerY + 14
  const barWidth = width - 90
  const barHeight = 16

  // Dibujar fondo de barra (gris)
  page.drawRectangle({
    x: barX,
    y: barY,
    width: barWidth,
    height: barHeight,
    color: rgb(226 / 255, 232 / 255, 240 / 255),
  })

  const totalFlow = data.total_ingresos + data.total_egresos
  let incomePct = 0
  let expensePct = 0

  if (totalFlow > 0) {
    incomePct = data.total_ingresos / totalFlow
    expensePct = data.total_egresos / totalFlow

    const incomeWidth = barWidth * incomePct
    const expenseWidth = barWidth * expensePct

    // Dibujar parte verde (Ingresos)
    if (incomeWidth > 0) {
      page.drawRectangle({
        x: barX,
        y: barY,
        width: incomeWidth,
        height: barHeight,
        color: rgb(34 / 255, 197 / 255, 94 / 255), // Verde
      })
    }

    // Dibujar parte roja (Egresos)
    if (expenseWidth > 0) {
      page.drawRectangle({
        x: barX + incomeWidth,
        y: barY,
        width: expenseWidth,
        height: barHeight,
        color: rgb(239 / 255, 68 / 255, 68 / 255), // Rojo
      })
    }
  }

  // Textos de porcentaje
  const pctText = totalFlow > 0 
    ? `Ingresos: ${Math.round(incomePct * 100)}% | Egresos: ${Math.round(expensePct * 100)}%` 
    : "Sin transacciones registradas en este período"
  
  const pctTextWidth = fontBold.widthOfText(pctText, 7)
  page.drawText(pctText, {
    x: width - 45 - pctTextWidth,
    y: chartContainerY + 38,
    size: 7,
    font: fontBold,
    color: totalFlow > 0 ? rgb(71 / 255, 85 / 255, 105 / 255) : rgb(148 / 255, 163 / 255, 184 / 255)
  })

  // 3. Tabla de Ingresos (Facturas)
  let yCursor = height - 265
  page.drawText("DETALLE DE INGRESOS (VENTAS)", { x: 35, y: yCursor, size: 9, font: fontBold, color: rgb(30 / 255, 30 / 255, 46 / 255) })
  
  yCursor -= 20
  page.drawRectangle({ x: 35, y: yCursor, width: width - 70, height: 18, color: rgb(124 / 255, 58 / 255, 237 / 255) })
  page.drawText("Fecha", { x: 45, y: yCursor + 5, size: 8, font: fontBold, color: rgb(255 / 255, 255 / 255, 255 / 255) })
  page.drawText("Cliente / Razón Social", { x: 120, y: yCursor + 5, size: 8, font: fontBold, color: rgb(255 / 255, 255 / 255, 255 / 255) })
  page.drawText("Estado", { x: 380, y: yCursor + 5, size: 8, font: fontBold, color: rgb(255 / 255, 255 / 255, 255 / 255) })
  page.drawText("Total COP", { x: 495, y: yCursor + 5, size: 8, font: fontBold, color: rgb(255 / 255, 255 / 255, 255 / 255) })

  const maxRows = 5
  if (data.invoices.length === 0) {
    yCursor -= 18
    page.drawRectangle({ x: 35, y: yCursor, width: width - 70, height: 18, color: rgb(255 / 255, 255 / 255, 255 / 255), borderColor: rgb(240 / 255, 240 / 245 / 255), borderWidth: 1 })
    page.drawText("No se registraron ventas en este período.", { x: 45, y: yCursor + 5, size: 8, font: fontRegular, color: rgb(148 / 255, 163 / 255, 184 / 255) })
  } else {
    const recentInvoices = data.invoices.slice(0, maxRows)
    recentInvoices.forEach((inv, index) => {
      yCursor -= 18
      const rowColor = index % 2 === 0 ? rgb(255 / 255, 255 / 255, 255 / 255) : rgb(248 / 255, 250 / 255, 252 / 255)
      page.drawRectangle({ 
        x: 35, 
        y: yCursor, 
        width: width - 70, 
        height: 18, 
        color: rowColor, 
        borderColor: rgb(241 / 255, 245 / 255, 249 / 255), 
        borderWidth: 1 
      })

      const dateText = new Date(inv.created_at).toLocaleDateString("es-CO")
      page.drawText(dateText, { x: 45, y: yCursor + 5, size: 8, font: fontRegular, color: rgb(51 / 255, 65 / 255, 85 / 255) })
      page.drawText(inv.client_name || "Cliente Express", { x: 120, y: yCursor + 5, size: 8, font: fontRegular, color: rgb(51 / 255, 65 / 255, 85 / 255) })
      
      // Indicador de pago
      page.drawCircle({ x: 384, y: yCursor + 8, radius: 3, color: rgb(34 / 255, 197 / 255, 94 / 255) })
      page.drawText("PAGADO", { x: 392, y: yCursor + 5, size: 7, font: fontBold, color: rgb(21 / 255, 128 / 255, 61 / 255) })

      // Alinear precio a la derecha
      const priceText = formatter.format(inv.total)
      const priceTextWidth = fontBold.widthOfText(priceText, 8)
      page.drawText(priceText, { 
        x: 550 - priceTextWidth, 
        y: yCursor + 5, 
        size: 8, 
        font: fontBold, 
        color: rgb(30 / 255, 41 / 255, 59 / 255) 
      })
    })
    
    if (data.invoices.length > maxRows) {
      yCursor -= 14
      page.drawText(`* Se muestran las últimas ${maxRows} ventas. Ingrese a la app para ver el listado completo.`, {
        x: 35,
        y: yCursor,
        size: 7,
        font: fontRegular,
        color: rgb(148 / 255, 163 / 255, 184 / 255)
      })
    }
  }

  // 4. Tabla de Egresos (Gastos)
  yCursor -= 30
  page.drawText("DETALLE DE EGRESOS (GASTOS)", { x: 35, y: yCursor, size: 9, font: fontBold, color: rgb(30 / 255, 30 / 255, 46 / 255) })
  
  yCursor -= 20
  page.drawRectangle({ x: 35, y: yCursor, width: width - 70, height: 18, color: rgb(239 / 255, 68 / 255, 68 / 255) })
  page.drawText("Fecha", { x: 45, y: yCursor + 5, size: 8, font: fontBold, color: rgb(255 / 255, 255 / 255, 255 / 255) })
  page.drawText("Descripción", { x: 120, y: yCursor + 5, size: 8, font: fontBold, color: rgb(255 / 255, 255 / 255, 255 / 255) })
  page.drawText("Categoría", { x: 380, y: yCursor + 5, size: 8, font: fontBold, color: rgb(255 / 255, 255 / 255, 255 / 255) })
  page.drawText("Monto COP", { x: 495, y: yCursor + 5, size: 8, font: fontBold, color: rgb(255 / 255, 255 / 255, 255 / 255) })

  if (data.expenses.length === 0) {
    yCursor -= 18
    page.drawRectangle({ x: 35, y: yCursor, width: width - 70, height: 18, color: rgb(255 / 255, 255 / 255, 255 / 255), borderColor: rgb(240 / 255, 240 / 245 / 255), borderWidth: 1 })
    page.drawText("No se registraron gastos en este período.", { x: 45, y: yCursor + 5, size: 8, font: fontRegular, color: rgb(148 / 255, 163 / 255, 184 / 255) })
  } else {
    const recentExpenses = data.expenses.slice(0, maxRows)
    recentExpenses.forEach((exp, index) => {
      yCursor -= 18
      const rowColor = index % 2 === 0 ? rgb(255 / 255, 255 / 255, 255 / 255) : rgb(248 / 255, 250 / 255, 252 / 255)
      page.drawRectangle({ 
        x: 35, 
        y: yCursor, 
        width: width - 70, 
        height: 18, 
        color: rowColor, 
        borderColor: rgb(241 / 255, 245 / 255, 249 / 255), 
        borderWidth: 1 
      })

      const dateText = new Date(exp.created_at).toLocaleDateString("es-CO")
      page.drawText(dateText, { x: 45, y: yCursor + 5, size: 8, font: fontRegular, color: rgb(51 / 255, 65 / 255, 85 / 255) })
      page.drawText(exp.description || "Gasto sin descripción", { x: 120, y: yCursor + 5, size: 8, font: fontRegular, color: rgb(51 / 255, 65 / 255, 85 / 255) })
      
      // Categoría
      page.drawText(exp.category || "Otros", { x: 380, y: yCursor + 5, size: 8, font: fontRegular, color: rgb(71 / 255, 85 / 255, 105 / 255) })

      // Alinear precio a la derecha (Rojo)
      const amountText = formatter.format(exp.amount)
      const amountTextWidth = fontBold.widthOfText(amountText, 8)
      page.drawText(amountText, { 
        x: 550 - amountTextWidth, 
        y: yCursor + 5, 
        size: 8, 
        font: fontBold, 
        color: rgb(185 / 255, 28 / 255, 28 / 255) 
      })
    })

    if (data.expenses.length > maxRows) {
      yCursor -= 14
      page.drawText(`* Se muestran los últimos ${maxRows} egresos. Ingrese a la app para ver el listado completo.`, {
        x: 35,
        y: yCursor,
        size: 7,
        font: fontRegular,
        color: rgb(148 / 255, 163 / 255, 184 / 255)
      })
    }
  }

  // Footer Decorativo
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 40,
    color: rgb(245 / 255, 245 / 250 / 255),
  })

  page.drawText("Reporte oficial consolidado emitido por GestiBot para GestivaOne. Confidencial.", {
    x: 35,
    y: 15,
    size: 8,
    font: fontRegular,
    color: rgb(120 / 255, 120 / 130 / 255),
  })

  return await pdfDoc.save()
}
