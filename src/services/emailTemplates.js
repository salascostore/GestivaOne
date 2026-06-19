/**
 * emailTemplates.js
 * Premium HTML email templates for GestivaOne transactional emails.
 * All templates use inline CSS for maximum email client compatibility.
 */

// ── Shared helpers ────────────────────────────────────────────────────────────

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Shared wrapper with GestivaOne branding
const wrapper = (content, { companyName = 'GestivaOne', companyLogo = null } = {}) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${companyName}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f14;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- HEADER -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              ${companyLogo
                ? `<img src="${companyLogo}" alt="${companyName}" style="height:48px;width:48px;border-radius:50%;object-fit:cover;display:inline-block;border:2px solid #7c3aed;" />`
                : `<div style="display:inline-block;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);line-height:48px;text-align:center;font-size:20px;font-weight:800;color:#fff;">${companyName.charAt(0).toUpperCase()}</div>`
              }
              <p style="margin:8px 0 0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${companyName}</p>
              <p style="margin:2px 0 0;font-size:11px;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Gestión Inteligente</p>
            </td>
          </tr>

          <!-- CONTENT CARD -->
          <tr>
            <td style="background-color:#1a1a2e;border-radius:20px;border:1px solid #2d2d4a;overflow:hidden;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                Enviado por <strong style="color:#7c3aed;">GestivaOne</strong> · gestivaone.com
              </p>
              <p style="margin:4px 0 0;font-size:10px;color:#374151;">
                Este es un correo automático. Por favor no respondas directamente.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

// Colored top accent bar
const accentBar = (color = '#7c3aed') =>
  `<tr><td style="height:4px;background:linear-gradient(90deg,${color},${color}aa);border-radius:20px 20px 0 0;"></td></tr>`

// Section heading inside card
const cardHeading = (emoji, title, subtitle = '', color = '#7c3aed') => `
  <tr>
    <td style="padding:32px 32px 0;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">${emoji}</div>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#f9fafb;letter-spacing:-0.5px;">${title}</h1>
      ${subtitle ? `<p style="margin:8px 0 0;font-size:14px;color:#9ca3af;line-height:1.5;">${subtitle}</p>` : ''}
    </td>
  </tr>
`

// Divider
const divider = () =>
  `<tr><td style="padding:20px 32px;"><div style="height:1px;background-color:#2d2d4a;"></div></td></tr>`

// Call-to-action button
const ctaButton = (label, href, color = '#7c3aed') => `
  <tr>
    <td style="padding:8px 32px 32px;text-align:center;">
      <a href="${href}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,${color},${color}cc);color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">${label}</a>
    </td>
  </tr>
`

// ── 1. Invoice Template ────────────────────────────────────────────────────────
export function invoiceTemplate(invoice, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null, companyEmail = '', companyPhone = '' } = company
  const invoiceId = (invoice.id?.slice(-8) || invoice.id || 'N/A').toUpperCase()

  let itemsList = []
  try {
    itemsList = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : (invoice.items || [])
  } catch (e) {}

  const itemsRows = itemsList.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #2d2d4a;font-size:13px;color:#d1d5db;">
        ${item.name || item.product_name || 'Producto'}
        ${item.quantity > 1 ? `<span style="color:#6b7280;font-size:11px;"> x${item.quantity}</span>` : ''}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #2d2d4a;font-size:13px;color:#d1d5db;text-align:right;font-family:monospace;">
        ${formatCOP((item.price || 0) * (item.quantity || 1))}
      </td>
    </tr>
  `).join('')

  const attachments = itemsList.filter(item => item.attachment_url && item.attachment_url.trim() !== '')

  const isCredit = invoice.payment_type !== 'immediate'
  const statusColor = invoice.payment_status === 'paid' ? '#10b981' : '#f59e0b'
  const statusLabel = invoice.payment_status === 'paid' ? 'PAGADA' : 'PENDIENTE DE PAGO'

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#7c3aed')}
      ${cardHeading('📄', `Factura #${invoiceId}`, `${companyName} te ha enviado una factura`, '#7c3aed')}
      ${divider()}

      <!-- Status badge -->
      <tr>
        <td style="padding:0 32px 20px;text-align:center;">
          <span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1px;background-color:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">
            ${statusLabel}
          </span>
        </td>
      </tr>

      <!-- Amount highlight -->
      <tr>
        <td style="padding:0 32px 20px;text-align:center;">
          <div style="background:linear-gradient(135deg,#7c3aed22,#a855f722);border:1px solid #7c3aed44;border-radius:16px;padding:20px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Total a pagar</p>
            <p style="margin:4px 0 0;font-size:32px;font-weight:900;color:#a78bfa;font-family:monospace;">${formatCOP(invoice.total)}</p>
            ${isCredit && invoice.scheduled_date ? `<p style="margin:6px 0 0;font-size:12px;color:#f59e0b;">⏰ Vence el ${formatDate(invoice.scheduled_date)}</p>` : ''}
          </div>
        </td>
      </tr>

      <!-- Invoice Details -->
      <tr>
        <td style="padding:0 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:6px 0;">Factura N°</td>
              <td style="font-size:12px;color:#e5e7eb;text-align:right;font-weight:600;">#${invoiceId}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:6px 0;">Fecha de emisión</td>
              <td style="font-size:12px;color:#e5e7eb;text-align:right;">${formatDate(invoice.created_at)}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:6px 0;">Empresa</td>
              <td style="font-size:12px;color:#e5e7eb;text-align:right;">${companyName}</td>
            </tr>
            ${companyPhone ? `<tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Teléfono</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${companyPhone}</td></tr>` : ''}
          </table>
        </td>
      </tr>

      ${divider()}

      <!-- Items list -->
      ${itemsList.length > 0 ? `
      <tr>
        <td style="padding:0 32px 20px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Detalle de productos</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemsRows}
            <tr>
              <td style="padding:12px 0 0;font-size:14px;font-weight:700;color:#f9fafb;">TOTAL</td>
              <td style="padding:12px 0 0;font-size:14px;font-weight:700;color:#a78bfa;text-align:right;font-family:monospace;">${formatCOP(invoice.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
      ` : ''}

      ${divider()}

      <!-- Attachments list -->
      ${attachments.length > 0 ? `
      <tr>
        <td style="padding:0 32px 20px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Archivos Adjuntos</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${attachments.map(att => `
              <tr>
                <td style="padding:8px 0;">
                  <a href="${att.attachment_url}" target="_blank" style="display:inline-block;padding:8px 16px;background-color:#252540;border:1px solid #2d2d4a;border-radius:8px;color:#a78bfa;text-decoration:none;font-size:13px;font-weight:600;">
                    📄 ${att.attachment_name || 'Ver documento adjunto'}
                  </a>
                </td>
              </tr>
            `).join('')}
          </table>
        </td>
      </tr>
      ${divider()}
      ` : ''}

      <tr>
        <td style="padding:0 32px 32px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
            Si tienes alguna duda sobre esta factura, puedes contactarnos${companyEmail ? ` a <a href="mailto:${companyEmail}" style="color:#a78bfa;text-decoration:none;">${companyEmail}</a>` : ''}.
          </p>
        </td>
      </tr>
    </table>
  `
  return wrapper(content, { companyName, companyLogo })
}

// ── 2. Overdue / Mora Template ─────────────────────────────────────────────────
export function overdueTemplate(invoice, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null, companyEmail = '', companyPhone = '' } = company
  const invoiceId = (invoice.id?.slice(-8) || invoice.id || 'N/A').toUpperCase()
  const daysOverdue = invoice.scheduled_date
    ? Math.max(0, Math.floor((Date.now() - new Date(invoice.scheduled_date)) / 86400000))
    : 0

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#ef4444')}
      ${cardHeading('⚠️', 'Factura en mora', `Tu pago a ${companyName} está vencido`, '#ef4444')}
      ${divider()}

      <!-- Overdue badge -->
      <tr>
        <td style="padding:0 32px 20px;text-align:center;">
          <span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1px;background-color:#ef444422;color:#ef4444;border:1px solid #ef444444;">
            ${daysOverdue > 0 ? `VENCIDA HACE ${daysOverdue} DÍA${daysOverdue > 1 ? 'S' : ''}` : 'VENCIDA HOY'}
          </span>
        </td>
      </tr>

      <!-- Amount -->
      <tr>
        <td style="padding:0 32px 20px;text-align:center;">
          <div style="background:linear-gradient(135deg,#ef444422,#f9731622);border:1px solid #ef444444;border-radius:16px;padding:20px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Monto pendiente</p>
            <p style="margin:4px 0 0;font-size:32px;font-weight:900;color:#f87171;font-family:monospace;">${formatCOP(invoice.total)}</p>
            ${invoice.scheduled_date ? `<p style="margin:6px 0 0;font-size:12px;color:#f59e0b;">Fecha de vencimiento: ${formatDate(invoice.scheduled_date)}</p>` : ''}
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:0 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:6px 0;">Factura N°</td>
              <td style="font-size:12px;color:#e5e7eb;text-align:right;font-weight:600;">#${invoiceId}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:6px 0;">Empresa acreedora</td>
              <td style="font-size:12px;color:#e5e7eb;text-align:right;">${companyName}</td>
            </tr>
            ${companyPhone ? `<tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Contacto</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${companyPhone}</td></tr>` : ''}
          </table>
        </td>
      </tr>

      ${divider()}

      <tr>
        <td style="padding:0 32px 32px;text-align:center;">
          <p style="margin:0 0 16px;font-size:13px;color:#9ca3af;line-height:1.6;">
            Por favor regulariza tu pago lo antes posible para evitar inconvenientes.
            ${companyEmail ? `Contáctanos en <a href="mailto:${companyEmail}" style="color:#f87171;text-decoration:none;">${companyEmail}</a>.` : ''}
          </p>
        </td>
      </tr>
    </table>
  `
  return wrapper(content, { companyName, companyLogo })
}

// ── 3. Payment Confirmation Template ─────────────────────────────────────────
export function paymentConfirmTemplate(invoice, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company
  const invoiceId = (invoice.id?.slice(-8) || invoice.id || 'N/A').toUpperCase()

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#10b981')}
      ${cardHeading('✅', '¡Pago confirmado!', `Recibimos tu pago a ${companyName}. ¡Gracias!`, '#10b981')}
      ${divider()}

      <!-- Amount -->
      <tr>
        <td style="padding:0 32px 20px;text-align:center;">
          <div style="background:linear-gradient(135deg,#10b98122,#34d39922);border:1px solid #10b98144;border-radius:16px;padding:20px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Monto pagado</p>
            <p style="margin:4px 0 0;font-size:32px;font-weight:900;color:#34d399;font-family:monospace;">${formatCOP(invoice.total)}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#6ee7b7;">Pagado el ${formatDate(invoice.paid_at || new Date().toISOString())}</p>
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:0 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:6px 0;">Factura N°</td>
              <td style="font-size:12px;color:#e5e7eb;text-align:right;font-weight:600;">#${invoiceId}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:6px 0;">Estado</td>
              <td style="font-size:12px;text-align:right;"><span style="color:#10b981;font-weight:700;">✓ Completamente pagada</span></td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#6b7280;padding:6px 0;">Empresa</td>
              <td style="font-size:12px;color:#e5e7eb;text-align:right;">${companyName}</td>
            </tr>
          </table>
        </td>
      </tr>

      ${divider()}

      <tr>
        <td style="padding:0 32px 32px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
            Conserva este correo como comprobante de pago. Si necesitas un recibo formal, contáctanos.
          </p>
        </td>
      </tr>
    </table>
  `
  return wrapper(content, { companyName, companyLogo })
}

// ── 4. Welcome Template ───────────────────────────────────────────────────────
export function welcomeTemplate(user = {}, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company
  const userName = user.name || user.email?.split('@')[0] || 'Usuario'

  const features = [
    { icon: '📄', label: 'Facturación inteligente' },
    { icon: '👥', label: 'Gestión de clientes' },
    { icon: '📦', label: 'Control de inventario' },
    { icon: '📊', label: 'Dashboard en tiempo real' },
  ]

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#7c3aed')}
      ${cardHeading('🎉', `¡Bienvenido, ${userName}!`, 'Tu cuenta en GestivaOne está lista. Empieza a gestionar tu negocio de forma inteligente.', '#7c3aed')}
      ${divider()}

      <!-- Features grid -->
      <tr>
        <td style="padding:0 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${features.slice(0, 2).map(f => `
                <td width="50%" style="padding:0 6px 12px 0;">
                  <div style="background-color:#252540;border:1px solid #2d2d4a;border-radius:12px;padding:14px;text-align:center;">
                    <div style="font-size:24px;margin-bottom:6px;">${f.icon}</div>
                    <p style="margin:0;font-size:12px;color:#d1d5db;font-weight:600;">${f.label}</p>
                  </div>
                </td>
              `).join('')}
            </tr>
            <tr>
              ${features.slice(2, 4).map(f => `
                <td width="50%" style="padding:0 6px 0 0;">
                  <div style="background-color:#252540;border:1px solid #2d2d4a;border-radius:12px;padding:14px;text-align:center;">
                    <div style="font-size:24px;margin-bottom:6px;">${f.icon}</div>
                    <p style="margin:0;font-size:12px;color:#d1d5db;font-weight:600;">${f.label}</p>
                  </div>
                </td>
              `).join('')}
            </tr>
          </table>
        </td>
      </tr>

      ${divider()}

      ${ctaButton('Ingresar a GestivaOne →', 'https://gestivaone.com')}
    </table>
  `
  return wrapper(content, { companyName, companyLogo })
}

// ── 5. Worker Invite Template ─────────────────────────────────────────────────
export function workerInviteTemplate(invite = {}, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null, companyEmail = '' } = company
  const { workerName = 'Trabajador', inviteCode = '------', role = 'despachador' } = invite

  const roleLabel = {
    administrador: 'Administrador',
    despachador: 'Despachador',
    contable: 'Contable',
  }[role] || role

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#7c3aed')}
      ${cardHeading('👷', `¡Hola, ${workerName}!`, `${companyName} te ha invitado a unirte como ${roleLabel}`, '#7c3aed')}
      ${divider()}

      <tr>
        <td style="padding:0 32px 24px;">
          <p style="margin:0 0 16px;font-size:13px;color:#9ca3af;line-height:1.7;">
            Para activar tu cuenta, descarga la app de GestivaOne e ingresa el siguiente código de vinculación:
          </p>
          <!-- Code block -->
          <div style="background:linear-gradient(135deg,#7c3aed22,#a855f722);border:2px dashed #7c3aed66;border-radius:16px;padding:24px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;">Código de vinculación</p>
            <p style="margin:0;font-size:36px;font-weight:900;color:#a78bfa;letter-spacing:6px;font-family:monospace;">${inviteCode}</p>
          </div>

          <div style="margin-top:20px;background-color:#252540;border-radius:12px;padding:16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#6b7280;padding:4px 0;">Empresa</td>
                <td style="font-size:12px;color:#e5e7eb;text-align:right;font-weight:600;">${companyName}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;padding:4px 0;">Tu rol</td>
                <td style="font-size:12px;color:#a78bfa;text-align:right;font-weight:600;">${roleLabel}</td>
              </tr>
              ${companyEmail ? `<tr><td style="font-size:12px;color:#6b7280;padding:4px 0;">Contacto</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${companyEmail}</td></tr>` : ''}
            </table>
          </div>

          <div style="margin-top:16px;background-color:#1f1f35;border:1px solid #f59e0b33;border-radius:12px;padding:12px;">
            <p style="margin:0;font-size:12px;color:#f59e0b;">⏳ Este código expira en 7 días. Úsalo cuanto antes.</p>
          </div>
        </td>
      </tr>

      ${ctaButton('Activar mi cuenta →', 'https://gestivaone.com/auth')}
    </table>
  `
  return wrapper(content, { companyName, companyLogo })
}

// ── 6. Weekly Report Template ─────────────────────────────────────────────────
export function weeklyReportTemplate(stats = {}, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company
  const {
    totalRevenue = 0,
    totalInvoices = 0,
    paidInvoices = 0,
    pendingInvoices = 0,
    overdueInvoices = 0,
    newClients = 0,
    periodLabel = 'esta semana',
  } = stats

  const collectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0

  const statCard = (emoji, label, value, color) => `
    <td width="50%" style="padding:4px;">
      <div style="background-color:#252540;border:1px solid #2d2d4a;border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:20px;">${emoji}</div>
        <p style="margin:4px 0 2px;font-size:18px;font-weight:800;color:${color};font-family:monospace;">${value}</p>
        <p style="margin:0;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
      </div>
    </td>
  `

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#7c3aed')}
      ${cardHeading('📊', `Reporte semanal`, `Resumen de ${companyName} · ${periodLabel}`, '#7c3aed')}
      ${divider()}

      <!-- Revenue highlight -->
      <tr>
        <td style="padding:0 32px 20px;text-align:center;">
          <div style="background:linear-gradient(135deg,#7c3aed22,#a855f722);border:1px solid #7c3aed44;border-radius:16px;padding:20px;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Ingresos totales ${periodLabel}</p>
            <p style="margin:6px 0 0;font-size:28px;font-weight:900;color:#a78bfa;font-family:monospace;">${formatCOP(totalRevenue)}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#10b981;">Tasa de cobro: ${collectionRate}%</p>
          </div>
        </td>
      </tr>

      <!-- Stats grid -->
      <tr>
        <td style="padding:0 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${statCard('📄', 'Facturas totales', totalInvoices, '#e5e7eb')}
              ${statCard('✅', 'Facturas pagadas', paidInvoices, '#10b981')}
            </tr>
            <tr style="height:8px;"><td colspan="2"></td></tr>
            <tr>
              ${statCard('⏳', 'Pendientes', pendingInvoices, '#f59e0b')}
              ${statCard('👥', 'Nuevos clientes', newClients, '#60a5fa')}
            </tr>
          </table>
        </td>
      </tr>

      ${overdueInvoices > 0 ? `
      <tr>
        <td style="padding:0 32px 20px;">
          <div style="background-color:#ef444415;border:1px solid #ef444433;border-radius:12px;padding:14px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#f87171;font-weight:600;">⚠️ ${overdueInvoices} factura${overdueInvoices > 1 ? 's' : ''} en mora requiere${overdueInvoices > 1 ? 'n' : ''} atención</p>
          </div>
        </td>
      </tr>
      ` : ''}

      ${ctaButton('Ver dashboard completo →', 'https://gestivaone.com')}
    </table>
  `
  return wrapper(content, { companyName, companyLogo })
}

// ── 7. Reset Workspace Confirmation ───────────────────────────────────────────
export function resetWorkspaceTemplate(company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#ef4444')}
      ${cardHeading('🗑️', 'Espacio de trabajo limpiado', `Los datos operativos de ${companyName} han sido eliminados`, '#ef4444')}
      ${divider()}

      <tr>
        <td style="padding:0 32px 20px;">
          <div style="background-color:#ef444415;border:1px solid #ef444433;border-radius:12px;padding:16px;">
            <p style="margin:0 0 12px;font-size:13px;color:#f87171;font-weight:700;">Datos eliminados:</p>
            <ul style="margin:0;padding-left:18px;font-size:12px;color:#9ca3af;line-height:2;">
              <li>Clientes y contactos</li>
              <li>Productos e inventario</li>
              <li>Facturas y pagos</li>
              <li>Egresos y gastos</li>
              <li>Bolsillos y transacciones</li>
              <li>Préstamos personales</li>
              <li>Notificaciones</li>
            </ul>
          </div>
          <div style="margin-top:16px;background-color:#1f1f35;border:1px solid #2d2d4a;border-radius:12px;padding:14px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Tu cuenta, empresa y trabajadores <strong style="color:#e5e7eb;">permanecen intactos</strong>.
              Si esto fue un error, contacta al soporte inmediatamente.
            </p>
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:0 32px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6b7280;">Acción realizada el ${formatDate(new Date().toISOString())}</p>
        </td>
      </tr>
    </table>
  `
  return wrapper(content, { companyName, companyLogo })
}

// ── 8. Test Email Template ────────────────────────────────────────────────────

// ── 8. Expense Registered Template ───────────────────────────────────────────
export function expenseRegisteredTemplate(expense = {}, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company
  const amount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(expense.amount || 0)
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#f59e0b')}
      ${cardHeading('💸', 'Gasto Registrado', 'Se registró un nuevo gasto en ' + companyName, '#f59e0b')}
      ${divider()}
      <tr><td style="padding:0 32px 24px;">
        <div style="background:linear-gradient(135deg,#f59e0b22,#d9770622);border:1px solid #f59e0b44;border-radius:16px;padding:20px;text-align:center;margin-bottom:20px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Monto</p>
          <p style="margin:4px 0 0;font-size:32px;font-weight:900;color:#fbbf24;font-family:monospace;">${amount}</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Categoría</td><td style="font-size:12px;color:#e5e7eb;text-align:right;font-weight:600;">${expense.category || 'Otros'}</td></tr>
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Proveedor</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${expense.provider_name || 'N/A'}</td></tr>
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Descripción</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${expense.description || '—'}</td></tr>
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">IVA pagado</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(expense.iva_paid||0)}</td></tr>
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Fecha</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${formatDate(new Date().toISOString())}</td></tr>
        </table>
      </td></tr>
      ${ctaButton('Ver Gastos →', 'https://gestivaone.com', '#f59e0b')}
    </table>`
  return wrapper(content, { companyName, companyLogo })
}

// ── 9. New Client Added Template ──────────────────────────────────────────────
export function newClientTemplate(client = {}, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#10b981')}
      ${cardHeading('👤', '¡Nuevo Cliente!', (client.name || 'Un cliente') + ' se añadió a ' + companyName, '#10b981')}
      ${divider()}
      <tr><td style="padding:0 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Nombre</td><td style="font-size:12px;color:#e5e7eb;text-align:right;font-weight:600;">${client.name || '—'}</td></tr>
          ${client.email ? '<tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Correo</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">' + client.email + '</td></tr>' : ''}
          ${client.phone ? '<tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Teléfono</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">' + client.phone + '</td></tr>' : ''}
          ${client.document_id ? '<tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Documento</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">' + client.document_id + '</td></tr>' : ''}
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Tipo</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${client.type === 'frequent' ? 'Frecuente' : 'Express'}</td></tr>
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Fecha</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${formatDate(new Date().toISOString())}</td></tr>
        </table>
      </td></tr>
      ${ctaButton('Ver Clientes →', 'https://gestivaone.com', '#10b981')}
    </table>`
  return wrapper(content, { companyName, companyLogo })
}

// ── 10. Low Stock Alert Template ──────────────────────────────────────────────
export function lowStockTemplate(product = {}, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#ef4444')}
      ${cardHeading('⚠️', 'Alerta: Stock Bajo', '"' + (product.name || 'Producto') + '" tiene stock crítico', '#ef4444')}
      ${divider()}
      <tr><td style="padding:0 32px 24px;">
        <div style="background:linear-gradient(135deg,#ef444422,#dc262622);border:1px solid #ef444444;border-radius:16px;padding:20px;text-align:center;margin-bottom:20px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Stock Actual</p>
          <p style="margin:4px 0 0;font-size:48px;font-weight:900;color:#f87171;font-family:monospace;">${product.stock ?? 0}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">${product.unit || 'UND'} disponibles</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Producto</td><td style="font-size:12px;color:#e5e7eb;text-align:right;font-weight:600;">${product.name || '—'}</td></tr>
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Categoría</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${product.category || '—'}</td></tr>
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Precio</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(product.price||0)}</td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:13px;color:#fca5a5;padding:12px;background:#ef444411;border-radius:8px;border-left:3px solid #ef4444;">
          Reabastece este producto pronto para evitar interrupciones en ventas.
        </p>
      </td></tr>
      ${ctaButton('Ir al Inventario →', 'https://gestivaone.com', '#ef4444')}
    </table>`
  return wrapper(content, { companyName, companyLogo })
}

// ── 11. New Employee Added Template ───────────────────────────────────────────
export function newEmployeeTemplate(employee = {}, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company
  const roleLabel = { administrador: 'Administrador', despachador: 'Despachador', contable: 'Contable' }[employee.role] || employee.role || 'Empleado'
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#6366f1')}
      ${cardHeading('👷', 'Nuevo Empleado Registrado', (employee.full_name || 'Un empleado') + ' se unió a ' + companyName, '#6366f1')}
      ${divider()}
      <tr><td style="padding:0 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Nombre</td><td style="font-size:12px;color:#e5e7eb;text-align:right;font-weight:600;">${employee.full_name || '—'}</td></tr>
          ${employee.email ? '<tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Correo</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">' + employee.email + '</td></tr>' : ''}
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Rol</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${roleLabel}</td></tr>
          <tr><td style="font-size:12px;color:#6b7280;padding:6px 0;">Fecha</td><td style="font-size:12px;color:#e5e7eb;text-align:right;">${formatDate(new Date().toISOString())}</td></tr>
        </table>
      </td></tr>
      ${ctaButton('Ver Equipo →', 'https://gestivaone.com', '#6366f1')}
    </table>`
  return wrapper(content, { companyName, companyLogo })
}

// ── 8. Test Email Template ────────────────────────────────────────────────────
export function testEmailTemplate(company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company

  const content = `

      ${cardHeading('🧪', '¡Correo de prueba exitoso!', 'El sistema de correos de GestivaOne está configurado correctamente', '#7c3aed')}
      ${divider()}

      <tr>
        <td style="padding:0 32px 20px;text-align:center;">
          <div style="background:linear-gradient(135deg,#10b98122,#34d39922);border:1px solid #10b98144;border-radius:16px;padding:20px;">
            <div style="font-size:40px;margin-bottom:8px;">✅</div>
            <p style="margin:0;font-size:15px;font-weight:700;color:#34d399;">Todo funcionando correctamente</p>
            <p style="margin:6px 0 0;font-size:12px;color:#6ee7b7;">Los correos transaccionales se enviarán automáticamente</p>
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:0 32px 20px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Correos configurados:</p>
          ${[
            ['📄', 'Factura a clientes (crédito)'],
            ['✅', 'Confirmación de pago'],
            ['⚠️', 'Aviso de mora'],
            ['🎉', 'Bienvenida al registrarse'],
            ['👷', 'Invitación a trabajadores'],
            ['📊', 'Reporte semanal (Pro/Empresarial)'],
          ].map(([emoji, label]) => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #2d2d4a;">
              <span style="font-size:16px;">${emoji}</span>
              <span style="font-size:13px;color:#d1d5db;">${label}</span>
              <span style="margin-left:auto;font-size:11px;color:#10b981;font-weight:600;">✓ Activo</span>
            </div>
          `).join('')}
        </td>
      </tr>

      <tr>
        <td style="padding:0 32px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#6b7280;">
            Enviado desde <strong style="color:#a78bfa;">${companyName} · GestivaOne</strong>
          </p>
        </td>
      </tr>
    </table>
  `
  return wrapper(content, { companyName, companyLogo })
}

// ── 12. Verification Code Template ───────────────────────────────────────────
export function verificationCodeTemplate(code, company = {}) {
  const { companyName = 'GestivaOne', companyLogo = null } = company
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${accentBar('#ef4444')}
      ${cardHeading('🔐', 'Código de verificación', 'Has solicitado eliminar los datos de tu espacio de trabajo en ' + companyName, '#ef4444')}
      ${divider()}
      <tr><td style="padding:0 32px 24px;">
        <p style="margin:0 0 16px;font-size:13px;color:#9ca3af;line-height:1.7;">
          Usa este código para confirmar la acción. Si no solicitaste esto, ignora este mensaje.
        </p>
        <div style="background:linear-gradient(135deg,#ef444422,#dc262622);border:2px dashed #ef444466;border-radius:16px;padding:24px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;">Código de seguridad</p>
          <p style="margin:0;font-size:36px;font-weight:900;color:#f87171;letter-spacing:6px;font-family:monospace;">${code}</p>
        </div>
      </td></tr>
    </table>`
  return wrapper(content, { companyName, companyLogo })
}
