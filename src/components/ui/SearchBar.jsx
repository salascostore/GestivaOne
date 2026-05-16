import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Buscar...', onClear }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-700 border border-subtle rounded-xl pl-8 pr-8 py-2 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
      />
      {value && (
        <button
          onClick={() => { onChange(''); onClear?.() }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-400 hover:text-white p-0.5 rounded"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
