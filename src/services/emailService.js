import {
  invoiceTemplate,
  overdueTemplate,
  paymentConfirmTemplate,
  welcomeTemplate,
  workerInviteTemplate,
  weeklyReportTemplate,
  resetWorkspaceTemplate,
  testEmailTemplate,
  expenseRegisteredTemplate,
  newClientTemplate,
  lowStockTemplate,
  newEmployeeTemplate,
  verificationCodeTemplate
} from './emailTemplates'
import { useSettingsStore } from '../store/useSettingsStore'

import { supabase } from '../lib/supabase'

async function callResendAPI({ to, subject, html, replyTo, from }) {
  try {
    const { data, error } = await supabase.functions.invoke('resend-email', {
      body: {
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        from: from || 'GestivaOne <onboarding@resend.dev>',
        reply_to: replyTo || undefined
      }
    })

    if (error) {
      console.error('❌ Supabase Edge Function Invoke Error:', error)
      return { success: false, error: error.message || 'Error al invocar función serverless' }
    }

    // Handlers inside Edge Functions might return an error structure if Deno fetch failed
    if (data && data.error) {
      console.error('❌ Serverless email provider error:', data.error)
      return { success: false, error: data.error.message || 'Error del proveedor de correo' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('❌ Edge Function invoke catch error:', error)
    return { success: false, error: error.message || 'Error de red' }
  }
}

export async function sendInvoiceEmail(invoice, clientEmail, company = {}) {
  const settings = useSettingsStore.getState().resend
  if (settings && (!settings.enabled || !settings.onInvoice)) {
    return { success: false, error: 'Envío de facturas por correo desactivado en configuración' }
  }

  if (!clientEmail || clientEmail === 'correo-cliente@express.com') {
    return { success: false, error: 'Email de cliente no válido' }
  }

  const invoiceId = (invoice.id?.slice(-8) || invoice.id || '').toUpperCase()
  const subject = `Factura #${invoiceId} de ${company.companyName || 'GestivaOne'}`
  const html = invoiceTemplate(invoice, company)

  return await callResendAPI({
    to: clientEmail,
    subject,
    html,
    replyTo: company.companyEmail
  })
}

export async function sendOverdueEmail(invoice, clientEmail, company = {}) {
  const settings = useSettingsStore.getState().resend
  if (settings && (!settings.enabled || !settings.onOverdue)) {
    return { success: false, error: 'Aviso de mora desactivado en configuración' }
  }

  if (!clientEmail || clientEmail === 'correo-cliente@express.com') {
    return { success: false, error: 'Email de cliente no válido' }
  }

  const invoiceId = (invoice.id?.slice(-8) || invoice.id || '').toUpperCase()
  const subject = `⚠️ PAGO VENCIDO: Factura #${invoiceId} de ${company.companyName || 'GestivaOne'}`
  const html = overdueTemplate(invoice, company)

  return await callResendAPI({
    to: clientEmail,
    subject,
    html,
    replyTo: company.companyEmail
  })
}

export async function sendPaymentConfirmEmail(invoice, clientEmail, company = {}) {
  const settings = useSettingsStore.getState().resend
  if (settings && (!settings.enabled || !settings.onPayment)) {
    return { success: false, error: 'Confirmación de pago desactivada en configuración' }
  }

  if (!clientEmail || clientEmail === 'correo-cliente@express.com') {
    return { success: false, error: 'Email de cliente no válido' }
  }

  const invoiceId = (invoice.id?.slice(-8) || invoice.id || '').toUpperCase()
  const subject = `✅ Pago Confirmado - Factura #${invoiceId}`
  const html = paymentConfirmTemplate(invoice, company)

  return await callResendAPI({
    to: clientEmail,
    subject,
    html,
    replyTo: company.companyEmail
  })
}

export async function sendWelcomeEmail(user, company = {}) {
  const settings = useSettingsStore.getState().resend
  // Welcome email might not check onWelcome or settings during signup if settings store is not loaded yet,
  // but let's check settings.enabled and settings.onWelcome if available.
  if (settings && (!settings.enabled || !settings.onWelcome)) {
    return { success: false, error: 'Correo de bienvenida desactivado en configuración' }
  }

  const toEmail = user.email
  if (!toEmail) return { success: false, error: 'Email de usuario vacío' }

  const subject = `¡Bienvenido a GestivaOne! 🎉`
  const html = welcomeTemplate(user, company)

  return await callResendAPI({
    to: toEmail,
    subject,
    html
  })
}

export async function sendWorkerInviteEmail(invite, company = {}) {
  const toEmail = invite.workerEmail
  if (!toEmail) return { success: false, error: 'Email de trabajador vacío' }

  const subject = `👷 Invitación para unirte a ${company.companyName || 'GestivaOne'}`
  const html = workerInviteTemplate(invite, company)

  return await callResendAPI({
    to: toEmail,
    subject,
    html,
    replyTo: company.companyEmail
  })
}

export async function sendWeeklyReportEmail(stats, toEmail, company = {}) {
  const settings = useSettingsStore.getState().resend
  if (settings && (!settings.enabled || !settings.onWeeklyReport)) {
    return { success: false, error: 'Reporte semanal desactivado en configuración' }
  }

  if (!toEmail) return { success: false, error: 'Email de destino vacío' }

  const subject = `📊 Reporte Semanal de Ventas - ${company.companyName || 'GestivaOne'}`
  const html = weeklyReportTemplate(stats, company)

  return await callResendAPI({
    to: toEmail,
    subject,
    html
  })
}

export async function sendResetWorkspaceEmail(toEmail, company = {}) {
  if (!toEmail) return { success: false, error: 'Email de destino vacío' }

  const subject = `🗑️ Espacio de trabajo limpiado - ${company.companyName || 'GestivaOne'}`
  const html = resetWorkspaceTemplate(company)

  return await callResendAPI({
    to: toEmail,
    subject,
    html
  })
}

export async function sendTestEmail(toEmail, company = {}) {
  if (!toEmail) return { success: false, error: 'Email de destino vacío' }

  const subject = `🧪 Correo de Prueba - GestivaOne`
  const html = testEmailTemplate(company)

  return await callResendAPI({
    to: toEmail,
    subject,
    html
  })
}

// ── Expense Created ──────────────────────────────────────────────────────────
export async function sendExpenseEmail(expense, toEmail, company = {}) {
  if (!toEmail) return { success: false, error: 'Email de destino vacío' }

  const amount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(expense.amount || 0)
  return await callResendAPI({
    to: toEmail,
    subject: `💸 Nuevo gasto registrado: ${amount} (${expense.category || 'Otros'})`,
    html: expenseRegisteredTemplate(expense, company)
  })
}

// ── New Client Added ─────────────────────────────────────────────────────────
export async function sendNewClientEmail(client, toEmail, company = {}) {
  if (!toEmail) return { success: false, error: 'Email de destino vacío' }

  return await callResendAPI({
    to: toEmail,
    subject: `👤 Nuevo cliente añadido: ${client.name || 'Cliente'}`,
    html: newClientTemplate(client, company)
  })
}

// ── Low Stock Alert ──────────────────────────────────────────────────────────
export async function sendLowStockEmail(product, toEmail, company = {}) {
  if (!toEmail) return { success: false, error: 'Email de destino vacío' }

  return await callResendAPI({
    to: toEmail,
    subject: `⚠️ Stock bajo: ${product.name || 'Producto'} (${product.stock ?? 0} ${product.unit || 'UND'})`,
    html: lowStockTemplate(product, company)
  })
}

// ── New Employee Added ───────────────────────────────────────────────────────
export async function sendNewEmployeeEmail(employee, toEmail, company = {}) {
  if (!toEmail) return { success: false, error: 'Email de destino vacío' }

  return await callResendAPI({
    to: toEmail,
    subject: `👷 Nuevo empleado en ${company.companyName || 'GestivaOne'}: ${employee.full_name || 'Empleado'}`,
    html: newEmployeeTemplate(employee, company)
  })
}

// ── Verification Code ────────────────────────────────────────────────────────
export async function sendVerificationCodeEmail(code, toEmail, company = {}) {
  if (!toEmail) return { success: false, error: 'Email de destino vacío' }

  return await callResendAPI({
    to: toEmail,
    subject: `🔐 Código de Verificación de Seguridad`,
    html: verificationCodeTemplate(code, company)
  })
}
