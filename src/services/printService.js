/**
 * printService.js
 * Utility to format and trigger thermal printing for invoices.
 * Supports classic thermal receipt (80mm/58mm) and modern stylized ticket templates.
 */

export function printInvoice(invoice, client = null, settings = {}) {
  // 1. Default settings fallback
  const printSettings = {
    template: settings.template || 'classic',
    showLogo: settings.showLogo !== false,
    showCompanyName: settings.showCompanyName !== false,
    showProducts: settings.showProducts !== false,
    showContact: settings.showContact !== false,
    showTax: settings.showTax === true,
    footerText: settings.footerText || '¡Gracias por su compra!',
    companyName: settings.companyName || 'GestivaOne',
    companyLogo: settings.companyLogo || null,
    companyPhone: settings.companyPhone || '',
    companyEmail: settings.companyEmail || ''
  }

  // 2. Parse Invoice Items
  // items can be a JSON string or an array
  let itemsList = []
  if (invoice.items) {
    try {
      itemsList = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
    } catch (e) {
      console.error('Error parsing invoice items for printing:', e)
    }
  }

  // 3. Build HTML ticket based on template
  const isModern = printSettings.template === 'modern'
  
  // Basic receipt calculations
  const totalVal = invoice.total || 0
  const taxRate = 0.19 // 19% IVA
  const subtotalVal = printSettings.showTax ? totalVal / (1 + taxRate) : (invoice.subtotal || totalVal)
  const taxVal = printSettings.showTax ? totalVal - subtotalVal : 0

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)
  }

  const invoiceIdStr = (invoice.id?.slice(-8) || invoice.id || 'N/A').toUpperCase()
  const dateStr = invoice.created_at ? new Date(invoice.created_at).toLocaleString('es-CO') : new Date().toLocaleString('es-CO')

  let ticketHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factura ${invoiceIdStr}</title>
      <style>
        /* General page layout for thermal paper */
        @page {
          size: auto;
          margin: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background-color: #fff;
          margin: 0;
          padding: 10px 15px;
          width: 76mm; /* Default standard width for 80mm roll including margins */
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
        }

        /* Template: Modern styling */
        ${isModern ? `
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            padding: 12px;
            background: #fff;
          }
          .modern-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
          }
          .header-title {
            font-weight: 800;
            font-size: 16px;
            letter-spacing: -0.5px;
            text-transform: uppercase;
          }
          .divider {
            border-top: 1px dashed #cbd5e1 !important;
            margin: 8px 0;
          }
          .total-row {
            background-color: #f8fafc;
            font-weight: 800;
            padding: 4px;
            border-radius: 4px;
          }
        ` : `
          /* Template: Classic styling */
          .header-title {
            font-weight: bold;
            font-size: 15px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .total-row {
            font-weight: bold;
          }
        `}

        /* Common Utility Classes */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        
        .logo-img {
          max-width: 50px;
          max-height: 50px;
          border-radius: 50%;
          margin: 0 auto 5px auto;
          display: block;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
        }
        .items-table th {
          text-align: left;
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding-bottom: 3px;
        }
        ${isModern ? `.items-table th { border-bottom: 1.5px solid #0f172a; }` : ''}
        .items-table td {
          padding: 3px 0;
          vertical-align: top;
        }
        
        .footer-note {
          font-size: 10px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="${isModern ? 'modern-card' : ''}">
        
        <!-- HEADER / BRANDING -->
        <div class="text-center">
          ${printSettings.showLogo && printSettings.companyLogo ? `
            <img class="logo-img" src="${printSettings.companyLogo}" alt="Logo" />
          ` : ''}
          
          ${printSettings.showCompanyName ? `
            <div class="header-title">${printSettings.companyName}</div>
          ` : `
            <div class="header-title">RECIBO DE VENTA</div>
          `}
          
          <div style="font-size: 10px; margin-top: 2px;">
            ${printSettings.companyPhone ? `Tel: ${printSettings.companyPhone}<br/>` : ''}
            ${printSettings.companyEmail ? `${printSettings.companyEmail}<br/>` : ''}
          </div>
        </div>

        <div class="divider"></div>

        <!-- INVOICE INFO -->
        <div style="font-size: 10px;">
          <div><span class="font-bold">FACTURA:</span> #${invoiceIdStr}</div>
          <div><span class="font-bold">FECHA:</span> ${dateStr}</div>
          ${invoice.payment_type ? `<div><span class="font-bold">METODO:</span> ${invoice.payment_type === 'immediate' ? 'INMEDIATO' : 'CREDITO'}</div>` : ''}
        </div>

        <!-- CLIENT INFO -->
        ${printSettings.showContact && (client || invoice.client_name) ? `
          <div class="divider"></div>
          <div style="font-size: 10px;">
            <div class="font-bold">CLIENTE:</div>
            <div>${client?.name || invoice.client_name}</div>
            ${client?.document_id || invoice.client_document_id || (client && client.document_id) ? `<div>C.C./NIT/Código: ${client?.document_id || invoice.client_document_id || client.document_id}</div>` : ''}
            ${client?.phone || invoice.client_phone ? `<div>Tel: ${client?.phone || invoice.client_phone}</div>` : ''}
            ${client?.email || invoice.client_email ? `<div>Email: ${client?.email || invoice.client_email}</div>` : ''}
          </div>
        ` : ''}

        <div class="divider"></div>

        <!-- PRODUCT LIST -->
        ${printSettings.showProducts && itemsList.length > 0 ? `
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 10%">Cant</th>
                <th style="width: 50%">Detalle</th>
                <th style="width: 40%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList.map(item => `
                <tr>
                  <td>${item.quantity || 1}</td>
                  <td>
                    ${item.name || item.product_name || 'Producto'}
                    ${item.price ? `<br/><span style="font-size: 9px; color: #555;">${formatCurrency(item.price)}</span>` : ''}
                  </td>
                  <td class="text-right">${formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
        ` : ''}

        <!-- TOTALS BREAKDOWN -->
        <div style="font-size: 11px; space-y: 2px;">
          ${printSettings.showTax ? `
            <div class="flex justify-between">
              <span>SUBTOTAL NETO:</span>
              <span>${formatCurrency(subtotalVal)}</span>
            </div>
            <div class="flex justify-between">
              <span>IVA (19%):</span>
              <span>${formatCurrency(taxVal)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between total-row" style="font-size: 12px; margin-top: 4px;">
            <span>TOTAL A PAGAR:</span>
            <span>${formatCurrency(totalVal)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- FOOTER VALUES -->
        <div class="text-center footer-note">
          <p>${printSettings.footerText}</p>
          <p style="font-size: 8px; color: #888; margin-top: 8px;">GestivaOne — www.gestivaone.com</p>
        </div>

      </div>
    </body>
    </html>
  `

  // 4. Create and use invisible iframe to execute standard print
  const iframeId = 'gestiva-print-iframe'
  let iframe = document.getElementById(iframeId)
  if (!iframe) {
    iframe = document.createElement('iframe')
    iframe.id = iframeId
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
  }

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(ticketHtml)
  doc.close()

  // Wait for resources (like logo images) to load if present, then print
  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  }, 350)
}
