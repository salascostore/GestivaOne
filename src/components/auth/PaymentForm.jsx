import { useState } from 'react'
import { CreditCard, Smartphone, Building, Lock, Check } from 'lucide-react'
import { PLANS } from '@/store/useAuthStore'
import clsx from 'clsx'

const METHODS = [
  { id: 'card',   label: 'Tarjeta',  icon: CreditCard },
  { id: 'pse',    label: 'PSE',      icon: Building   },
  { id: 'nequi',  label: 'Nequi',    icon: Smartphone },
]

function formatCard(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

export default function PaymentForm({ plan, onSubmit, loading }) {
  const [method, setMethod] = useState('card')
  const [card, setCard]     = useState({ number: '', expiry: '', cvv: '', name: '' })
  const planData = PLANS[plan]

  const handleCard = (k, v) => setCard((c) => ({ ...c, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ method, card })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center space-y-1 mb-4">
        <h2 className="text-xl font-bold text-white">Datos de pago</h2>
        <p className="text-sm text-muted-400">Tu información está cifrada y protegida</p>
      </div>

      {/* Plan summary */}
      {planData && (
        <div className="bg-brand-600/10 border border-brand-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Plan {planData.name}</p>
            {planData.promoPrice
              ? <p className="text-xs text-brand-300">{planData.promoPriceDisplay}/mes los primeros {planData.promoMonths} meses</p>
              : <p className="text-xs text-muted-400">{planData.priceDisplay}/mes</p>
            }
          </div>
          <span className="text-xs bg-brand-600 text-white px-2 py-1 rounded-lg font-semibold">Seleccionado</span>
        </div>
      )}

      {/* Payment method */}
      <div>
        <p className="text-xs font-medium text-muted-400 uppercase tracking-wide mb-2">Método de pago</p>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setMethod(id)}
              className={clsx(
                'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-all',
                method === id ? 'border-brand-500 bg-brand-600/10 text-brand-300' : 'border-subtle bg-surface-700 text-muted-400 hover:border-surface-300'
              )}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {method === 'card' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-400 mb-1 block">Número de tarjeta</label>
            <input value={card.number} onChange={(e) => handleCard('number', formatCard(e.target.value))}
              placeholder="1234 5678 9012 3456" maxLength={19}
              className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono" />
          </div>
          <input value={card.name} onChange={(e) => handleCard('name', e.target.value)}
            placeholder="Nombre en la tarjeta"
            className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-400 mb-1 block">Vencimiento</label>
              <input value={card.expiry} onChange={(e) => handleCard('expiry', e.target.value)}
                placeholder="MM/AA" maxLength={5}
                className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
            </div>
            <div>
              <label className="text-xs text-muted-400 mb-1 block">CVV</label>
              <input value={card.cvv} onChange={(e) => handleCard('cvv', e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="123" type="password" maxLength={3}
                className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
            </div>
          </div>
        </div>
      )}

      {method === 'pse' && (
        <div className="bg-surface-700 border border-subtle rounded-xl p-4 text-center">
          <Building size={32} className="text-brand-400 mx-auto mb-2" />
          <p className="text-sm text-white font-medium">Pago por PSE</p>
          <p className="text-xs text-muted-400 mt-1">Serás redirigido a tu banco para completar el pago de forma segura.</p>
        </div>
      )}
      {method === 'nequi' && (
        <div className="space-y-2">
          <label className="text-xs text-muted-400 mb-1 block">Número Nequi</label>
          <input placeholder="Ej: 300 000 0000"
            className="w-full bg-surface-700 border border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-muted-400">
        <Lock size={11} /> Pago seguro con cifrado SSL de 256 bits
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
        {loading ? 'Procesando...' : <><Check size={15} /> Completar registro</>}
      </button>
    </form>
  )
}
