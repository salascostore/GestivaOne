import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in ms

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar',         symbol: '$',  flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',              symbol: '€',  flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',     symbol: '£',  flag: '🇬🇧' },
  { code: 'COP', name: 'Colombian Peso',    symbol: '$',  flag: '🇨🇴' },
  { code: 'MXN', name: 'Mexican Peso',      symbol: '$',  flag: '🇲🇽' },
  { code: 'ARS', name: 'Argentine Peso',    symbol: '$',  flag: '🇦🇷' },
  { code: 'BRL', name: 'Brazilian Real',    symbol: 'R$', flag: '🇧🇷' },
  { code: 'CLP', name: 'Chilean Peso',      symbol: '$',  flag: '🇨🇱' },
  { code: 'PEN', name: 'Peruvian Sol',      symbol: 'S/', flag: '🇵🇪' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡',  flag: '🇨🇷' },
  { code: 'DOP', name: 'Dominican Peso',    symbol: 'RD$',flag: '🇩🇴' },
  { code: 'CAD', name: 'Canadian Dollar',   symbol: 'CA$',flag: '🇨🇦' },
  { code: 'JPY', name: 'Japanese Yen',      symbol: '¥',  flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc',       symbol: 'Fr', flag: '🇨🇭' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
]

export { SUPPORTED_CURRENCIES }

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      baseCurrency: 'USD',
      rates: {},           // { EUR: 0.92, COP: 4000, ... } relative to USD
      lastFetched: null,
      loading: false,
      error: null,

      setCurrency: (code) => {
        set({ baseCurrency: code })
      },

      fetchRates: async (force = false) => {
        const { lastFetched, loading } = get()
        const now = Date.now()
        if (!force && lastFetched && (now - lastFetched) < CACHE_TTL) return
        if (loading) return

        set({ loading: true, error: null })
        try {
          // frankfurter.dev: returns rates from USD to all currencies
          const res = await fetch('https://api.frankfurter.dev/v1/latest?base=USD')
          if (!res.ok) throw new Error('Exchange rate fetch failed')
          const data = await res.json()
          set({
            rates: { ...data.rates, USD: 1 },
            lastFetched: now,
            loading: false,
          })
        } catch (err) {
          set({ error: err.message, loading: false })
        }
      },

      // Convert a USD amount → baseCurrency display value
      convert: (amountUSD) => {
        const { baseCurrency, rates } = get()
        if (baseCurrency === 'USD' || !rates[baseCurrency]) return amountUSD
        return amountUSD * rates[baseCurrency]
      },

      // Format a USD amount as the base currency string
      format: (amountUSD) => {
        const { baseCurrency, rates } = get()
        const currency = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)
        const converted = baseCurrency === 'USD' || !rates[baseCurrency]
          ? amountUSD
          : amountUSD * rates[baseCurrency]

        return new Intl.NumberFormat('es', {
          style: 'currency',
          currency: baseCurrency,
          minimumFractionDigits: baseCurrency === 'JPY' || baseCurrency === 'CLP' ? 0 : 2,
          maximumFractionDigits: baseCurrency === 'JPY' || baseCurrency === 'CLP' ? 0 : 2,
        }).format(converted)
      },

      getSymbol: () => {
        const { baseCurrency } = get()
        return SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol ?? '$'
      },

      isStale: () => {
        const { lastFetched } = get()
        if (!lastFetched) return true
        return (Date.now() - lastFetched) >= CACHE_TTL
      },
    }),
    {
      name: 'gestiva-currency',
      partialize: (state) => ({
        baseCurrency: state.baseCurrency,
        rates: state.rates,
        lastFetched: state.lastFetched,
      }),
    }
  )
)
