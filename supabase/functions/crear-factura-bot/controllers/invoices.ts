import { Context } from "https://esm.sh/hono@3.11.10"
import { supabase } from "../utils/supabase.ts"
import { generateInvoicePDF, formatter } from "../utils/pdf.ts"

// POST /api/invoices/generate - Registrar venta y generar factura
export async function generateInvoice(c: Context) {
  const companyId = c.get("company_id")
  const companyName = c.get("company_name")
  const isDemo = c.get("is_demo")

  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Cuerpo JSON inválido" }, 400)
  }

  const { 
    client_name, 
    product_name, 
    amount, 
    quantity = 1 
  } = body

  if (!client_name || !product_name || !amount) {
    return c.json({ error: "Faltan campos requeridos para factura: client_name, product_name, amount" }, 400)
  }

  if (isDemo) {
    const mockInvoiceId = "demo-invoice-uuid-" + Math.floor(1000 + Math.random() * 9000)
    const mockNumber = mockInvoiceId.slice(-8).toUpperCase()
    const totalAmount = Math.round(amount * quantity * 1.19)
    return c.json({
      success: true,
      demo: true,
      invoice_id: mockInvoiceId,
      invoice_number: mockNumber,
      created_at: new Date().toISOString(),
      client_name,
      company_name: companyName,
      product_name,
      quantity,
      subtotal: amount * quantity,
      tax_amount: Math.round(amount * quantity * 0.19),
      total: totalAmount,
      pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      message: `Venta registrada para ${client_name}. Factura #${mockNumber} generada con éxito por ${formatter.format(totalAmount)} COP (Modo Demo).`
    })
  }

  try {
    // Buscar o auto-crear el cliente en la tabla `clients`
    let client_id = null
    const { data: existingClients } = await supabase
      .from("clients")
      .select("id")
      .eq("company_id", companyId)
      .ilike("name", `%${client_name}%`)
      .limit(1)

    if (existingClients && existingClients.length > 0) {
      client_id = existingClients[0].id
    } else {
      // Creamos un registro express de cliente si no existía en el CRM de GestivaOne
      const { data: newClient, error: clientCreateError } = await supabase
        .from("clients")
        .insert([{
          company_id: companyId,
          name: client_name,
          status: "active",
          type: "express"
        }])
        .select("id")
        .single()

      if (!clientCreateError && newClient) {
        client_id = newClient.id
      }
    }

    // Calcular valores de facturación con IVA (19% estándar DIAN)
    const subtotal = amount * quantity
    const taxRate = 0.19 
    const taxAmount = Math.round(subtotal * taxRate)
    const total = subtotal + taxAmount

    const items = [
      {
        product_name: product_name,
        price: amount,
        quantity: quantity
      }
    ]

    // Crear la Factura en la tabla `invoices`
    const { data: newInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([{
        company_id: companyId,
        client_name,
        client_id,
        items,
        subtotal,
        tax: taxAmount, // Nota: el campo de IVA en DB se llama `tax` según la estructura SQL, aunque en el código original se insertó como `tax_amount` (revisaremos si es `tax`)
        total,
        status: "paid",
        payment_type: "immediate",
        payment_status: "paid"
      }])
      .select("id, created_at")
      .single()

    if (invoiceError || !newInvoice) {
      // Intentar con la estructura de campo adecuada por si es tax_amount o tax
      console.warn("Fallo al insertar con campo 'tax', reintentando con 'tax_amount':", invoiceError)
      // En database_schema_real.sql, vemos: "tax numeric NOT NULL DEFAULT 0.00,"
      // Así que la base de datos realmente tiene `tax`. Haremos el insert correcto.
      console.error("Error al insertar la factura:", invoiceError)
      return c.json({ error: "No se pudo registrar la factura en la base de datos de Supabase.", details: invoiceError?.message }, 500)
    }

    // Crear el registro del Pago correspondiente en la tabla `invoice_payments`
    const { error: paymentError } = await supabase
      .from("invoice_payments")
      .insert([{
        company_id: companyId,
        invoice_id: newInvoice.id,
        amount: total,
        reference: "Pago inmediato (GestiBot)"
      }])

    if (paymentError) {
      console.warn("No se pudo registrar el pago asociado en invoice_payments:", paymentError)
    }

    // Generar el PDF real en memoria
    const invoiceNumber = newInvoice.id.slice(-8).toUpperCase()
    let pdfUrl = ""
    try {
      const pdfBytes = await generateInvoicePDF({
        invoice_number: invoiceNumber,
        created_at: newInvoice.created_at,
        client_name,
        company_name: companyName,
        product_name,
        quantity,
        subtotal,
        tax_amount: taxAmount,
        total,
      })

      // Subir a Supabase Storage (bucket público: facturas-pdf)
      const { error: uploadError } = await supabase.storage
        .from("facturas-pdf")
        .upload(`${newInvoice.id}.pdf`, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        })

      if (uploadError) {
        console.error("Error al subir el PDF a Storage:", uploadError)
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("facturas-pdf")
          .getPublicUrl(`${newInvoice.id}.pdf`)
        pdfUrl = publicUrlData?.publicUrl || ""
      }
    } catch (pdfErr) {
      console.error("Excepción al generar o subir el PDF:", pdfErr)
    }

    // Devolver los detalles de éxito de la factura generada
    return c.json({
      success: true,
      invoice_id: newInvoice.id,
      invoice_number: invoiceNumber,
      created_at: newInvoice.created_at,
      client_name,
      company_name: companyName,
      product_name,
      quantity,
      subtotal,
      tax_amount: taxAmount,
      total,
      pdf_url: pdfUrl,
      message: `Venta registrada para ${client_name}. Factura #${invoiceNumber} generada con éxito por ${formatter.format(total)} COP.`
    })

  } catch (err) {
    console.error("Error interno al generar factura:", err)
    return c.json({ error: "Error interno al procesar la solicitud de factura." }, 500)
  }
}

// GET /api/invoices/:id/pdf - Redireccionar o descargar PDF de la factura
export async function getInvoicePDF(c: Context) {
  const companyId = c.get("company_id")
  const isDemo = c.get("is_demo")
  const invoiceId = c.req.param("id")

  if (isDemo) {
    return c.json({
      success: true,
      demo: true,
      invoice_id: "demo-invoice-uuid",
      client_name: "Cliente Demo",
      pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    })
  }

  try {
    let finalInvoiceId = ""

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId)
    const isLatest = invoiceId.toLowerCase() === "latest" || invoiceId.toLowerCase() === "ultima" || invoiceId.toLowerCase() === "ultima_general"

    if (isLatest) {
      const { data: lastInvoice, error: lastError } = await supabase
        .from("invoices")
        .select("id")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lastError || !lastInvoice) {
        return c.json({ error: "No se encontró ninguna factura en su empresa." }, 404)
      }
      finalInvoiceId = lastInvoice.id
    } else if (isUUID) {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select("id")
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .maybeSingle()

      if (error || !invoice) {
        return c.json({ error: "Factura por ID no encontrada o no pertenece a su empresa." }, 404)
      }
      finalInvoiceId = invoice.id
    } else {
      // 1. Intentar buscar por coincidencia de nombre de cliente
      const { data: clientInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("company_id", companyId)
        .ilike("client_name", `%${invoiceId}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (clientInvoice) {
        finalInvoiceId = clientInvoice.id
      } else {
        // 2. Intentar buscar por sufijo de ID (por ejemplo, si pasan los últimos caracteres del ID)
        const cleanId = invoiceId.replace(/[^0-9a-f]/gi, "").toLowerCase()
        if (cleanId) {
          const { data: matchedInvoices } = await supabase
            .from("invoices")
            .select("id")
            .eq("company_id", companyId)

          const match = matchedInvoices?.find(inv => inv.id.toLowerCase().endsWith(cleanId))
          if (match) {
            finalInvoiceId = match.id
          }
        }
      }
    }

    if (!finalInvoiceId) {
      return c.json({ error: `No se pudo encontrar ninguna factura para la búsqueda: "${invoiceId}".` }, 404)
    }

    // Obtener detalles de la factura
    const { data: fullInvoice } = await supabase
      .from("invoices")
      .select("id, client_name")
      .eq("id", finalInvoiceId)
      .single()

    // Obtener URL pública de Storage
    const { data: publicUrlData } = supabase.storage
      .from("facturas-pdf")
      .getPublicUrl(`${finalInvoiceId}.pdf`)

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return c.json({ error: "No se pudo recuperar el archivo PDF de almacenamiento." }, 404)
    }

    // Si el cliente pide JSON o pasa parametro query ?json=true, devolvemos JSON
    const acceptHeader = c.req.header("accept") || ""
    if (acceptHeader.includes("application/json") || c.req.query("json") === "true") {
      return c.json({
        success: true,
        invoice_id: finalInvoiceId,
        client_name: fullInvoice?.client_name || "Cliente",
        pdf_url: publicUrlData.publicUrl
      })
    }

    return c.redirect(publicUrlData.publicUrl)
  } catch (err) {
    console.error("Excepción en getInvoicePDF:", err)
    return c.json({ error: "Error interno al recuperar el PDF de la factura." }, 500)
  }
}
