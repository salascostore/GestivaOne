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
      baseCurrency: 'USD', // This is now the "Display" currency
      sourceCurrency: 'USD', // This is the currency of the values in the DB
      rates: {},           
      lastFetched: null,
      loading: false,
      error: null,

      setCurrency: (code) => {
        set({ baseCurrency: code })
      },

      setSourceCurrency: (code) => {
        set({ sourceCurrency: code, baseCurrency: code })
      },

      fetchRates: async (force = false) => {
        const { lastFetched, loading } = get()
        const now = Date.now()
        if (!force && lastFetched && (now - lastFetched) < CACHE_TTL) return
        if (loading) return

        set({ loading: true, error: null })
        try {
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

      // Convert a Source Amount → Current baseCurrency
      convert: (amount) => {
        const { baseCurrency, sourceCurrency, rates } = get()
        if (baseCurrency === sourceCurrency || !rates[baseCurrency] || !rates[sourceCurrency]) return amount
        
        // Convert source -> USD -> base
        const amountUSD = amount / rates[sourceCurrency]
        return amountUSD * rates[baseCurrency]
      },

      // Format a Source Amount
      format: (amount) => {
        const { baseCurrency, sourceCurrency, rates } = get()
        if (!rates[baseCurrency]) return `$${amount}`
        
        const converted = (baseCurrency === sourceCurrency)
          ? amount
          : (amount / rates[sourceCurrency]) * rates[baseCurrency]

        return new Intl.NumberFormat('es', {
          style: 'currency',
          currency: baseCurrency,
          minimumFractionDigits: baseCurrency === 'JPY' || baseCurrency === 'CLP' ? 0 : 0,
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
