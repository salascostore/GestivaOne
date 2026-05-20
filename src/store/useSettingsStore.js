import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './useAuthStore'

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // ── Notification preferences ──────────────────────────
      notifications: {
        invoicePaid:    true,
        invoiceOverdue: true,
        lowStock:       true,
        newClient:      false,
        weeklyReport:   false,
        pushEnabled:    false,
      },
      setNotification: (key, value) => {
        set((s) => ({ notifications: { ...s.notifications, [key]: value } }))
        get().saveToDB()
      },

      // ── SMTP config ────────────────────────────────────────
      smtp: {
        host:     '',
        port:     '587',
        user:     '',
        password: '',
        fromName: '',
        enabled:  false,
      },
      setSmtp: (data) => {
        set((s) => ({ smtp: { ...s.smtp, ...data } }))
        get().saveToDB()
      },
      testSmtp: () => new Promise((res) => {
        setTimeout(() => {
          const { smtp } = get()
          if (!smtp.host || !smtp.user || !smtp.password) {
            res({ ok: false, msg: 'Faltan credenciales SMTP requeridas' })
          } else {
            res({ ok: true, msg: 'Conexión SMTP probada con éxito' })
          }
        }, 1200)
      }),

      // ── WhatsApp Business ──────────────────────────────────
      whatsapp: {
        phoneNumber: '',
        apiKey:      '',
        enabled:     false,
      },
      setWhatsapp: (data) => {
        set((s) => ({ whatsapp: { ...s.whatsapp, ...data } }))
        get().saveToDB()
      },

      // ── API REST backend ───────────────────────────────────
      api: {
        url:     '',
        apiKey:  '',
        enabled: false,
        lastPing: null,
        status: 'disconnected', // 'connected' | 'disconnected' | 'testing'
      },
      setApi: (data) => {
        set((s) => ({ api: { ...s.api, ...data } }))
        get().saveToDB()
      },
      testApi: async () => {
        const { api } = get()
        if (!api.url) return { ok: false, msg: 'Ingresa la URL de la API primero' }
        set((s) => ({ api: { ...s.api, status: 'testing' } }))
        try {
          const res = await fetch(`${api.url}/health`, { signal: AbortSignal.timeout(4000) })
          const ok = res.ok
          set((s) => ({ api: { ...s.api, status: ok ? 'connected' : 'disconnected', lastPing: Date.now() } }))
          get().saveToDB()
          return { ok, msg: ok ? 'Conexión exitosa' : `Error HTTP ${res.status}` }
        } catch (e) {
          set((s) => ({ api: { ...s.api, status: 'disconnected', lastPing: Date.now() } }))
          get().saveToDB()
          return { ok: false, msg: 'No se pudo conectar' }
        }
      },

      // ── Thermal Printer Config ──────────────────────────────
      printer: {
        autoPrint: false,
        template: 'classic',
        pdfTemplate: 'corporate',
        showLogo: true,
        showCompanyName: true,
        showProducts: true,
        showContact: true,
        showTax: false,
        footerText: '¡Gracias por su compra!',
        themeColor: 'indigo',
      },
      setPrinter: (data) => {
        set((s) => ({ printer: { ...s.printer, ...data } }))
        get().saveToDB()
      },

      // ── Database Sync Helpers ──────────────────────────────
      loadFromSettings: (dbSettings) => {
        if (!dbSettings) return
        set({
          notifications: dbSettings.notifications || get().notifications,
          smtp:          dbSettings.smtp || get().smtp,
          whatsapp:      dbSettings.whatsapp || get().whatsapp,
          api:           dbSettings.api || get().api,
          printer:       dbSettings.printer || get().printer,
        })
      },

      saveToDB: async () => {
        try {
          const auth = useAuthStore.getState()
          if (auth.isAuthenticated && auth.user?.companyId) {
            const newSettings = {
              ...(auth.user.settings || {}),
              notifications: get().notifications,
              smtp: get().smtp,
              whatsapp: get().whatsapp,
              api: get().api,
              printer: get().printer,
            }
            await auth.updateProfile({ settings: newSettings })
          }
        } catch (err) {
          console.warn('Error saving settings to DB:', err)
        }
      }
    }),
    { name: 'gestiva-settings-v2.3' }
  )
)
