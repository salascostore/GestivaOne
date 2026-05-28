import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'
import { useProductStore } from './useProductStore'
import { usePocketStore } from './usePocketStore'
import { isAfter, parseISO, differenceInDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

export const useInvoiceStore = create((set, get) => ({
  invoices: [],
  loading: false,
  invoicesFetched: false,

  fetchInvoices: async (force = false) => {
    const { invoicesFetched } = get()
    const { user } = useAuthStore.getState()
    if (!user?.companyId || (invoicesFetched && !force)) return
    
    set({ loading: true })
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_payments(*)')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    if (!error) {
      // Map relational invoice_payments to JSON string inside inv.note to keep frontend UI components happy
      const mappedInvoices = (data || []).map((inv) => {
        const dbNote = inv.note || ''
        let notesText = dbNote
        let customCharges = []
        let pocketId = 'general'
        
        // If database note contains JSON legacy structure, parse it
        if (dbNote.trim().startsWith('{') && dbNote.trim().endsWith('}')) {
          try {
            const parsed = JSON.parse(dbNote)
            notesText = parsed.notes || ''
            customCharges = parsed.custom_charges || []
            pocketId = parsed.pocket_id || 'general'
          } catch (e) {}
        }

        const paymentsList = (inv.invoice_payments || []).map(p => ({
          amount: Number(p.amount),
          date: p.created_at,
          reference: p.reference || 'Abono registrado'
        }))

        return {
          ...inv,
          note: JSON.stringify({
            notes: notesText,
            payments: paymentsList,
            custom_charges: customCharges,
            pocket_id: pocketId
          })
        }
      })

      set({ invoices: mappedInvoices, invoicesFetched: true })
    } else {
      console.error('❌ Error fetching invoices:', error)
    }
    set({ loading: false })
  },

  createInvoice: async ({ client, items, subtotal, total, paymentType, scheduledDate, note, pocketId }) => {
    const { user } = useAuthStore.getState()
    if (!user) return null

    if (!items || items.length === 0 || total <= 0) {
      console.error("Cannot create invoice: items list is empty or total is zero.")
      return null
    }

    const now = new Date()
    const invoiceId = `INV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    const tax = Math.max(0, Number(total || 0) - Number(subtotal || 0))

    const newInvoice = {
      id: invoiceId,
      company_id: user.companyId,
      client_id: client?.id ?? null,
      client_name: client?.name ?? 'Cliente Express',
      items: items.map((i) => ({ ...i })),
      subtotal: Number(subtotal),
      tax: Number(tax), // Colombian Sales Tax (IVA)
      total: Number(total),
      payment_type: paymentType,
      scheduled_date: scheduledDate ?? null,
      payment_status: paymentType === 'immediate' ? 'paid' : 'pending',
      paid_at: paymentType === 'immediate' ? now.toISOString() : null,
      note: note ?? '',
      created_at: now.toISOString(),
    }

    const { data: saved, error } = await supabase
      .from('invoices')
      .insert([newInvoice])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating invoice in Supabase:', error)
      import('react-hot-toast').then(m => m.default.error(`Error: ${error.message}`))
      return null
    }

    let notesText = ''
    let parsedPocketId = pocketId || 'general'
    let customCharges = []
    try {
      if (note && note.trim().startsWith('{') && note.trim().endsWith('}')) {
        const parsed = JSON.parse(note)
        notesText = parsed.notes || ''
        parsedPocketId = parsed.pocket_id || parsedPocketId
        customCharges = parsed.custom_charges || []
      } else {
        notesText = note || ''
      }
    } catch (e) {}

    const mappedSaved = {
      ...saved,
      note: JSON.stringify({
        notes: notesText,
        payments: [],
        custom_charges: customCharges,
        pocket_id: parsedPocketId
      })
    }

    set((s) => ({ invoices: [mappedSaved, ...s.invoices] }))

    // Trigger Notification for created invoice
    const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mappedSaved.total)
    try {
      const { useNotificationStore } = await import('./useNotificationStore')
      if (paymentType === 'immediate') {
        await useNotificationStore.getState().addNotification({
          title: 'Factura Hecha',
          message: `La factura #${mappedSaved.id.slice(-8).toUpperCase()} de "${mappedSaved.client_name}" por ${formattedTotal} ha sido realizada con éxito.`,
          category: 'Cobros',
          type: 'success'
        })
      } else {
        const dueDateStr = scheduledDate 
          ? format(parseISO(scheduledDate), "dd 'de' MMMM", { locale: es })
          : 'próximamente'
        await useNotificationStore.getState().addNotification({
          title: 'Factura Pendiente',
          message: `La factura #${mappedSaved.id.slice(-8).toUpperCase()} de "${mappedSaved.client_name}" por ${formattedTotal} vence el ${dueDateStr}.`,
          category: 'Cobros',
          type: 'warning'
        })
      }
    } catch (e) {
      console.error('❌ Error triggering creation notification:', e)
    }

    const { products, updateProduct } = useProductStore.getState()
    items.forEach(async (item) => {
      if (!item.productId) return
      const product = products.find((p) => p.id === item.productId)
      if (product && typeof product.stock === 'number') {
        const newStock = Math.max(0, product.stock - item.qty)
        await updateProduct(item.productId, { stock: newStock })
      }
    })

    if (paymentType === 'immediate') {
      let targetPocketId = pocketId
      if (!targetPocketId && note) {
        try {
          if (note.trim().startsWith('{') && note.trim().endsWith('}')) {
            const parsed = JSON.parse(note)
            targetPocketId = parsed.pocket_id
          }
        } catch (e) {}
      }
      if (!targetPocketId) targetPocketId = 'general'

      if (targetPocketId && targetPocketId !== 'general') {
        const { usePocketStore } = await import('./usePocketStore')
        await usePocketStore.getState().addFunds(targetPocketId, Number(total))
      } else {
        await usePocketStore.getState().distributeInvoicePayment(Number(total))
      }
    }

    return mappedSaved;
  },

  markPaid: async (id) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('invoices')
      .update({ payment_status: 'paid', paid_at: now })
      .eq('id', id)

    if (!error) {
      set((s) => ({
        invoices: s.invoices.map((inv) =>
          inv.id === id ? { ...inv, payment_status: 'paid', paid_at: now } : inv
        ),
      }))

      // Trigger "Factura Hecha" notification
      const inv = get().invoices.find(i => i.id === id)
      if (inv) {
        const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.total)
        try {
          const { useNotificationStore } = await import('./useNotificationStore')
          await useNotificationStore.getState().addNotification({
            title: 'Factura Hecha',
            message: `La factura #${inv.id.slice(-8).toUpperCase()} de "${inv.client_name}" por ${formattedTotal} ha sido cobrada y marcada como pagada.`,
            category: 'Cobros',
            type: 'success'
          })
        } catch (e) {
          console.error('❌ Error triggering payment notification:', e)
        }
        
        let targetPocketId = 'general'
        if (inv.note) {
          try {
            if (inv.note.trim().startsWith('{') && inv.note.trim().endsWith('}')) {
              const parsed = JSON.parse(inv.note)
              targetPocketId = parsed.pocket_id || 'general'
            }
          } catch (e) {}
        }

        if (targetPocketId && targetPocketId !== 'general') {
          const { usePocketStore } = await import('./usePocketStore')
          await usePocketStore.getState().addFunds(targetPocketId, Number(inv.total))
        } else {
          await usePocketStore.getState().distributeInvoicePayment(Number(inv.total))
        }
      }
    } else {
      console.error('❌ Error marking invoice as paid:', error)
    }
  },

  registerAbono: async (invoiceId, abonoAmount, reference = '') => {
    const { user } = useAuthStore.getState()
    if (!user) return { success: false, error: 'No user authenticated' }

    const inv = get().invoices.find(i => i.id === invoiceId)
    if (!inv) return { success: false, error: 'Factura no encontrada' }

    const wasPaid = inv.payment_status === 'paid'

    // Insert payment record into cloud database table `invoice_payments`
    const newPayment = {
      company_id: user.companyId,
      invoice_id: invoiceId,
      amount: Number(abonoAmount),
      reference: reference || 'Abono registrado'
    }

    const { data: savedPayment, error: payError } = await supabase
      .from('invoice_payments')
      .insert([newPayment])
      .select()
      .single()

    if (payError) {
      console.error('❌ Error registering payment in DB:', payError)
      return { success: false, error: payError.message }
    }

    // Recalculate invoice status based on all payments
    const { data: allPayments, error: fetchErr } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId)

    if (fetchErr) {
      console.error('❌ Error fetching all payments for recalculation:', fetchErr)
      return { success: false, error: fetchErr.message }
    }

    const totalPaid = (allPayments || []).reduce((sum, p) => sum + Number(p.amount), 0)

    let newStatus = inv.payment_status
    let paidAt = inv.paid_at
    if (totalPaid >= inv.total) {
      newStatus = 'paid'
      paidAt = new Date().toISOString()
    } else {
      newStatus = 'pending'
      paidAt = null
    }

    // Update invoice status in Supabase
    const { error: invUpdateErr } = await supabase
      .from('invoices')
      .update({
        payment_status: newStatus,
        paid_at: paidAt
      })
      .eq('id', invoiceId)

    if (invUpdateErr) {
      console.error('❌ Error updating invoice status in DB:', invUpdateErr)
      return { success: false, error: invUpdateErr.message }
    }

    // Trigger "Factura Hecha" notification if transition to paid
    if (newStatus === 'paid' && !wasPaid) {
      const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.total)
      try {
        const { useNotificationStore } = await import('./useNotificationStore')
        await useNotificationStore.getState().addNotification({
          title: 'Factura Hecha',
          message: `La factura #${inv.id.slice(-8).toUpperCase()} de "${inv.client_name}" por ${formattedTotal} ha sido completamente pagada mediante abonos.`,
          category: 'Cobros',
          type: 'success'
        })
      } catch (e) {
        console.error('❌ Error triggering payment notification:', e)
      }
    }

    // Distribute or send to specific pocket
    let targetPocketId = 'general'
    if (inv && inv.note) {
      try {
        if (inv.note.trim().startsWith('{') && inv.note.trim().endsWith('}')) {
          const parsed = JSON.parse(inv.note)
          targetPocketId = parsed.pocket_id || 'general'
        }
      } catch (e) {}
    }

    if (targetPocketId && targetPocketId !== 'general') {
      const { usePocketStore } = await import('./usePocketStore')
      await usePocketStore.getState().addFunds(targetPocketId, Number(abonoAmount))
    } else {
      await usePocketStore.getState().distributeInvoicePayment(Number(abonoAmount))
    }

    // Refresh state from Supabase relationally
    await get().fetchInvoices(true)
    return { success: true }
  },

  deleteInvoice: async (id) => {
    // Save invoice details before deletion for notification composition
    const inv = get().invoices.find(i => i.id === id)

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (!error) {
      set((s) => ({ invoices: s.invoices.filter((inv) => inv.id !== id) }))

      if (inv) {
        const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.total)
        try {
          const { useNotificationStore } = await import('./useNotificationStore')
          await useNotificationStore.getState().addNotification({
            title: 'Factura Eliminada',
            message: `La factura #${inv.id.slice(-8).toUpperCase()} de "${inv.client_name}" por ${formattedTotal} ha sido eliminada del sistema.`,
            category: 'Cobros',
            type: 'danger'
          })
        } catch (e) {
          console.error('❌ Error triggering delete notification:', e)
        }
      }
    } else {
      console.error('❌ Error deleting invoice:', error)
    }
  },

  checkOverdue: async () => {
    const { user } = useAuthStore.getState()
    if (!user?.companyId) return

    const now = new Date()
    const { invoices } = get()
    
    // Find scheduled pending invoices that are past their due dates
    const overdueInvoices = invoices.filter(inv => 
      inv.payment_status === 'pending' && 
      inv.payment_type === 'scheduled' && 
      inv.scheduled_date && 
      isAfter(now, parseISO(inv.scheduled_date))
    )

    if (overdueInvoices.length === 0) return

    for (const inv of overdueInvoices) {
      // 1. Update in Supabase
      const { error } = await supabase
        .from('invoices')
        .update({ payment_status: 'overdue' })
        .eq('id', inv.id)

      if (!error) {
        const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.total)
        try {
          const { useNotificationStore } = await import('./useNotificationStore')
          await useNotificationStore.getState().addNotification({
            title: 'Factura en Mora',
            message: `La factura #${inv.id.slice(-8).toUpperCase()} de "${inv.client_name}" por ${formattedTotal} está en mora/vencida.`,
            category: 'Cobros',
            type: 'danger'
          })
        } catch (e) {
          console.error('❌ Error triggering overdue notification:', e)
        }
      }
    }

    // Refresh state
    await get().fetchInvoices(true)
  },

  // Selectors
  getPending: () => get().invoices.filter((i) => i.payment_status === 'pending'),
  getOverdue: () => get().invoices.filter((i) => i.payment_status === 'overdue'),
  getPaid:    () => get().invoices.filter((i) => i.payment_status === 'paid'),

  getByClient: (clientId) =>
    get().invoices.filter((i) => i.client_id === clientId),

  getOverdueDays: (inv) => {
    if (!inv.scheduled_date) return 0
    return Math.max(0, differenceInDays(new Date(), parseISO(inv.scheduled_date)))
  },

  getTotalRevenue: () =>
    get().invoices.filter((i) => i.payment_status === 'paid').reduce((s, i) => s + (i.total || 0), 0),

  getPendingRevenue: () =>
    get().invoices.filter((i) => i.payment_status !== 'paid').reduce((s, i) => s + (i.total || 0), 0),

  getMonthlyRevenue: () => {
    const months = {}
    get().invoices
      .filter((i) => i.payment_status === 'paid')
      .forEach((inv) => {
        const key = inv.created_at.slice(0, 7) // "YYYY-MM"
        months[key] = (months[key] ?? 0) + (inv.total || 0)
      })
    return months
  },
}))
