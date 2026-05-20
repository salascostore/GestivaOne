import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useProductStore } from './useProductStore'
import { useInvoiceStore } from './useInvoiceStore'
import { useAuthStore } from './useAuthStore'
import { parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      readIdsByUser: {}, // dictionary mapping userId -> array of read notification IDs

      // Mark a single notification as read
      markAsRead: (id) => {
        const userId = useAuthStore.getState().user?.id || 'guest'
        set((state) => {
          const userReads = state.readIdsByUser[userId] || []
          if (userReads.includes(id)) return state
          return {
            readIdsByUser: {
              ...state.readIdsByUser,
              [userId]: [...userReads, id]
            }
          }
        })
        get().saveToDB()
      },

      // Mark all notifications as read
      markAllAsRead: (allIds) => {
        const userId = useAuthStore.getState().user?.id || 'guest'
        set((state) => {
          const userReads = state.readIdsByUser[userId] || []
          const newReadIds = Array.from(new Set([...userReads, ...allIds]))
          return {
            readIdsByUser: {
              ...state.readIdsByUser,
              [userId]: newReadIds
            }
          }
        })
        get().saveToDB()
      },

      // Reset read status for the current user
      clearReadNotifications: () => {
        const userId = useAuthStore.getState().user?.id || 'guest'
        set((state) => ({
          readIdsByUser: {
            ...state.readIdsByUser,
            [userId]: []
          }
        }))
        get().saveToDB()
      },

      loadFromSettings: (dbSettings) => {
        if (!dbSettings) return
        set({
          readIdsByUser: dbSettings.readNotifications || get().readIdsByUser
        })
      },

      saveToDB: async () => {
        try {
          const auth = useAuthStore.getState()
          if (auth.isAuthenticated && auth.user?.companyId) {
            const newSettings = {
              ...(auth.user.settings || {}),
              readNotifications: get().readIdsByUser
            }
            await auth.updateProfile({ settings: newSettings })
          }
        } catch (err) {
          console.warn('Error saving notifications status to DB:', err)
        }
      },

      // Dynamic selectors to generate notifications based on live app state
      getNotifications: () => {
        const { products } = useProductStore.getState()
        const { invoices } = useInvoiceStore.getState()
        const userId = useAuthStore.getState().user?.id || 'guest'
        const companyId = useAuthStore.getState().user?.companyId
        
        const readIdsByUser = get().readIdsByUser || {}
        const readIds = readIdsByUser[userId] || []

        const list = []

        // Filter products and invoices belonging to the active company if applicable
        const companyProducts = companyId 
          ? products.filter(p => p.company_id === companyId)
          : products

        const companyInvoices = companyId
          ? invoices.filter(inv => inv.company_id === companyId)
          : invoices

        // 1. Stock Alerts
        companyProducts.forEach((p) => {
          if (p.stock !== null && p.stock !== undefined) {
            if (p.stock === 0) {
              list.push({
                id: `stock-out-${p.id}`,
                type: 'danger', // danger, warning, info, success
                title: 'Producto Agotado',
                message: `El producto "${p.name}" se encuentra sin inventario disponible.`,
                category: 'Inventario',
                date: p.updated_at || new Date().toISOString(), // visual sorting
              })
            } else if (p.stock <= (p.minStock || 5)) {
              list.push({
                id: `stock-low-${p.id}`,
                type: 'warning',
                title: 'Stock Crítico',
                message: `Quedan solo ${p.stock} unidades de "${p.name}" en stock.`,
                category: 'Inventario',
                date: p.updated_at || new Date().toISOString(),
              })
            }
          }
        })

        // 2. Invoice Alerts
        companyInvoices.forEach((inv) => {
          if (inv.payment_status === 'overdue') {
            const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.total)
            list.push({
              id: `invoice-overdue-${inv.id}`,
              type: 'danger',
              title: 'Factura Vencida',
              message: `La factura #${inv.id.slice(-8).toUpperCase()} de "${inv.client_name}" por ${formattedTotal} está vencida.`,
              category: 'Cobros',
              date: inv.scheduled_date || inv.created_at,
            })
          } else if (inv.payment_status === 'pending') {
            const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.total)
            const dueDateStr = inv.scheduled_date 
              ? format(parseISO(inv.scheduled_date), "dd 'de' MMMM", { locale: es })
              : 'próximamente'
            list.push({
              id: `invoice-pending-${inv.id}`,
              type: 'warning',
              title: 'Factura Pendiente',
              message: `La factura #${inv.id.slice(-8).toUpperCase()} de "${inv.client_name}" por ${formattedTotal} vence el ${dueDateStr}.`,
              category: 'Cobros',
              date: inv.created_at,
            })
          } else if (inv.client_name === 'Cliente Express' && (new Date() - new Date(inv.created_at)) < 86400000 * 3) {
            // Express invoice recorded in last 3 days
            const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.total)
            list.push({
              id: `invoice-express-${inv.id}`,
              type: 'success',
              title: 'Factura Express Registrada',
              message: `Venta rápida realizada con éxito por ${formattedTotal} en modo express.`,
              category: 'Ventas',
              date: inv.created_at,
            })
          }
        })

        // 3. System announcements
        list.push({
          id: 'sys-ann-dian',
          type: 'info',
          title: 'Próxima Actualización',
          message: 'Estamos preparando integraciones de facturación electrónica directa para optimizar tus obligaciones fiscales en un clic.',
          category: 'Sistema',
          date: '2026-05-18T12:00:00.000Z',
        })

        // Add 'read' parameter to each notification
        return list.map((item) => ({
          ...item,
          read: readIds.includes(item.id),
        })).sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
      },

      // Get count of unread notifications
      getUnreadCount: () => {
        const notifications = get().getNotifications()
        return notifications.filter((n) => !n.read).length
      },
    }),
    {
      name: 'gestiva-notifications',
      partialize: (s) => ({
        readIdsByUser: s.readIdsByUser || {},
      }),
    }
  )
)
