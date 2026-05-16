import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
      setNotification: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),

      // ── SMTP config ────────────────────────────────────────
      smtp: {
        host:     '',
        port:     '587',
        user:     '',
        password: '',
        fromName: '',
        enabled:  false,
      },
      setSmtp: (data) => set((s) => ({ smtp: { ...s.smtp, ...data } })),
      testSmtp: () => new Promise((res) => setTimeout(() => res({ ok: false, msg: 'SMTP requiere backend para funcionar' }), 1200)),

      // ── WhatsApp Business ──────────────────────────────────
      whatsapp: {
        phoneNumber: '',
        apiKey:      '',
        enabled:     false,
      },
      setWhatsapp: (data) => set((s) => ({ whatsapp: { ...s.whatsapp, ...data } })),

      // ── API REST backend ───────────────────────────────────
      api: {
        url:     '',
        apiKey:  '',
        enabled: false,
        lastPing: null,
        status: 'disconnected', // 'connected' | 'disconnected' | 'testing'
      },
      setApi: (data) => set((s) => ({ api: { ...s.api, ...data } })),
      testApi: async () => {
        const { api } = get()
        if (!api.url) return { ok: false, msg: 'Ingresa la URL de la API primero' }
        set((s) => ({ api: { ...s.api, status: 'testing' } }))
        try {
          const res = await fetch(`${api.url}/health`, { signal: AbortSignal.timeout(4000) })
          const ok = res.ok
          set((s) => ({ api: { ...s.api, status: ok ? 'connected' : 'disconnected', lastPing: Date.now() } }))
          return { ok, msg: ok ? 'Conexión exitosa' : `Error HTTP ${res.status}` }
        } catch (e) {
          set((s) => ({ api: { ...s.api, status: 'disconnected', lastPing: Date.now() } }))
          return { ok: false, msg: 'No se pudo conectar' }
        }
      },
    }),
    { name: 'gestiva-settings' }
  )
)
