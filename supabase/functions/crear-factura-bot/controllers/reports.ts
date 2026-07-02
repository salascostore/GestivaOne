import { Context } from "https://esm.sh/hono@3.11.10"
import { supabase } from "../utils/supabase.ts"
import { generateReportPDF, formatter } from "../utils/pdf.ts"

// GET /api/reports/dashboard - Obtener reporte financiero consolidado
export async function getDashboardReport(c: Context) {
  const companyId = c.get("company_id")
  const companyName = c.get("company_name")
  const isDemo = c.get("is_demo")

  const daysQuery = c.req.query("days")
  const daysCount = daysQuery ? Number(daysQuery) : 3

  let invoicesList = []
  let expensesList = []
  let totalIngresos = 0
  let totalEgresos = 0
  let balance = 0

  if (isDemo) {
    // Listas simuladas en Modo Demo
    invoicesList = [
      { client_name: "Juan Pérez (Demo)", total: 450000, created_at: new Date(Date.now() - 3600000).toISOString() },
      { client_name: "María Gómez (Demo)", total: 350000, created_at: new Date(Date.now() - 7200000).toISOString() },
      { client_name: "Carlos Mendoza (Demo)", total: 550000, created_at: new Date(Date.now() - 86400000).toISOString() },
    ]
    expensesList = [
      { description: "Compra de Papelería", category: "Oficina", amount: 120000, created_at: new Date(Date.now() - 18000000).toISOString() },
      { description: "Pago Internet Claro", category: "Servicios", amount: 150000, created_at: new Date(Date.now() - 43200000).toISOString() },
      { description: "Transportes y Mensajería", category: "Logística", amount: 210000, created_at: new Date(Date.now() - 90000000).toISOString() },
    ]
    totalIngresos = invoicesList.reduce((sum, inv) => sum + inv.total, 0)
    totalEgresos = expensesList.reduce((sum, exp) => sum + exp.amount, 0)
    balance = totalIngresos - totalEgresos
  } else {
    try {
      const dateLimit = new Date()
      dateLimit.setDate(dateLimit.getDate() - daysCount)
      const dateStr = dateLimit.toISOString()

      // Consultar Facturas
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("client_name, total, created_at")
        .eq("company_id", companyId)
        .gte("created_at", dateStr)
        .order("created_at", { ascending: false })

      if (invError) {
        console.error("Error consultando ingresos:", invError)
        return c.json({ error: `Error consultando ingresos: ${invError.message}` }, 500)
      }
      invoicesList = invoices || []

      // Consultar Gastos
      const { data: expenses, error: expError } = await supabase
        .from("expenses")
        .select("amount, description, category, created_at")
        .eq("company_id", companyId)
        .gte("created_at", dateStr)
        .order("created_at", { ascending: false })

      if (expError) {
        console.error("Error consultando egresos:", expError)
        return c.json({ error: `Error consultando egresos: ${expError.message}` }, 500)
      }
      expensesList = expenses || []

      totalIngresos = invoicesList.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
      totalEgresos = expensesList.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
      balance = totalIngresos - totalEgresos
    } catch (err) {
      console.error("Excepción en base de datos al generar reporte:", err)
      return c.json({ error: "No se pudo recuperar la información de reporte financiero." }, 500)
    }
  }

  // Generar el PDF consolidado del reporte
  let pdfUrl = ""
  try {
    const reportPdfBytes = await generateReportPDF({
      days: daysCount,
      company_name: companyName,
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      balance: balance,
      invoices: invoicesList,
      expenses: expensesList,
    })

    if (isDemo) {
      pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    } else {
      // Subir a Storage en bucket público
      const randomSalt = Math.floor(1000 + Math.random() * 9000)
      const filename = `reporte-${daysCount}d-${companyId}-${randomSalt}.pdf`

      const { error: uploadError } = await supabase.storage
        .from("facturas-pdf")
        .upload(filename, reportPdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        })

      if (uploadError) {
        console.error("Error al subir el reporte PDF a Storage:", uploadError)
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("facturas-pdf")
          .getPublicUrl(filename)
        pdfUrl = publicUrlData?.publicUrl || ""
      }
    }
  } catch (pdfErr) {
    console.error("Excepción al generar o subir el reporte PDF:", pdfErr)
  }

  return c.json({
    success: true,
    demo: isDemo,
    total_ingresos: totalIngresos,
    total_egresos: totalEgresos,
    balance: balance,
    pdf_url: pdfUrl,
    message: `Reporte de los últimos ${daysCount} días: Ingresos de ${formatter.format(totalIngresos)} COP y egresos de ${formatter.format(totalEgresos)} COP. Balance neto de ${formatter.format(balance)} COP. PDF generado.`
  })
}

// GET /api/reports/debts - Consultar deudas pendientes de clientes
export async function getDebtsReport(c: Context) {
  const companyId = c.get("company_id")
  const isDemo = c.get("is_demo")

  if (isDemo) {
    const demoDebts = [
      { client_name: "Juan Pérez (Demo)", total_pendiente: 450000, facturas: 2 },
      { client_name: "María Gómez (Demo)", total_pendiente: 150000, facturas: 1 }
    ]
    return c.json({
      success: true,
      deudas: demoDebts,
      total_deudas: 600000,
      message: `Se encontraron 2 clientes con deudas pendientes (Modo Demo). Total deudas: $600.000 COP.`
    })
  }

  try {
    // Buscar facturas no pagadas ('pending' o 'overdue')
    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("id, client_name, total")
      .eq("company_id", companyId)
      .in("payment_status", ["pending", "overdue"])

    if (invError) {
      console.error("Error consultando facturas para deudas:", invError)
      return c.json({ error: "No se pudieron consultar las facturas de la base de datos." }, 500)
    }

    const invoiceIds = invoices?.map(inv => inv.id) || []
    let payments: any[] = []
    if (invoiceIds.length > 0) {
      const { data: paymentsData, error: payError } = await supabase
        .from("invoice_payments")
        .select("invoice_id, amount")
        .in("invoice_id", invoiceIds)

      if (payError) {
        console.warn("Error consultando pagos para deudas:", payError)
      } else {
        payments = paymentsData || []
      }
    }

    const debtByClient: Record<string, { client_name: string; total_pendiente: number; facturas: number }> = {}

    for (const inv of invoices || []) {
      const totalAbonos = payments
        .filter(p => p.invoice_id === inv.id)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      const pendiente = Number(inv.total) - totalAbonos

      if (pendiente > 0) {
        if (!debtByClient[inv.client_name]) {
          debtByClient[inv.client_name] = {
            client_name: inv.client_name,
            total_pendiente: 0,
            facturas: 0
          }
        }
        debtByClient[inv.client_name].total_pendiente += pendiente
        debtByClient[inv.client_name].facturas += 1
      }
    }

    const result = Object.values(debtByClient).sort((a, b) => b.total_pendiente - a.total_pendiente)
    const totalDeudas = result.reduce((sum, r) => sum + r.total_pendiente, 0)

    return c.json({
      success: true,
      deudas: result,
      total_deudas: totalDeudas,
      message: `Se encontraron ${result.length} clientes con deudas pendientes. Total deudas: $${totalDeudas.toLocaleString("es-CO")} COP.`
    })
  } catch (err) {
    console.error("Excepción en reporte de deudas:", err)
    return c.json({ error: "Error interno al procesar el reporte de deudas." }, 500)
  }
}

// GET /api/reports/daily - Resumen de caja de hoy (ingresos vs egresos)
export async function getDailySummary(c: Context) {
  const companyId = c.get("company_id")
  const isDemo = c.get("is_demo")

  if (isDemo) {
    return c.json({
      success: true,
      sales_count: 3,
      expenses_count: 2,
      total_ingresos: 850000,
      total_egresos: 270000,
      balance: 580000,
      message: `Resumen de caja de hoy (Modo Demo): Se registraron 3 ventas por $850.000 COP y 2 gastos por $270.000 COP. Balance neto: $580.000 COP.`
    })
  }

  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const dateStrStart = todayStart.toISOString()
    const dateStrEnd = todayEnd.toISOString()

    // Consultar facturas de hoy
    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("total")
      .eq("company_id", companyId)
      .gte("created_at", dateStrStart)
      .lte("created_at", dateStrEnd)

    if (invError) {
      console.error("Error consultando ingresos de hoy:", invError)
      return c.json({ error: "Error al consultar los ingresos de la base de datos." }, 500)
    }

    // Consultar gastos de hoy
    const { data: expenses, error: expError } = await supabase
      .from("expenses")
      .select("amount")
      .eq("company_id", companyId)
      .gte("created_at", dateStrStart)
      .lte("created_at", dateStrEnd)

    if (expError) {
      console.error("Error consultando gastos de hoy:", expError)
      return c.json({ error: "Error al consultar los gastos de la base de datos." }, 500)
    }

    const totalIngresos = invoices?.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) || 0
    const totalEgresos = expenses?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0
    const balance = totalIngresos - totalEgresos

    return c.json({
      success: true,
      sales_count: invoices?.length || 0,
      expenses_count: expenses?.length || 0,
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      balance: balance,
      message: `Resumen de caja de hoy: Se registraron ${invoices?.length || 0} ventas por $${totalIngresos.toLocaleString("es-CO")} COP y ${expenses?.length || 0} gastos por $${totalEgresos.toLocaleString("es-CO")} COP. Balance neto: $${balance.toLocaleString("es-CO")} COP.`
    })
  } catch (err) {
    console.error("Excepción en resumen diario:", err)
    return c.json({ error: "Error interno al procesar el resumen de caja." }, 500)
  }
}
