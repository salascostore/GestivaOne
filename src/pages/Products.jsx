import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Package, DollarSign, Tag, ShoppingCart, Pencil } from 'lucide-react'
import Button from '@/components/ui/Button'
import SearchBar from '@/components/ui/SearchBar'
import { useProductStore, CATEGORIES } from '@/store/useProductStore'
import { useCartStore } from '@/store/useCartStore'
import { useUIStore } from '@/store/useUIStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const UNIT_COLORS = {
  KG: 'text-blue-400 bg-blue-500/10',
  LB: 'text-purple-400 bg-purple-500/10',
  UND: 'text-brand-400 bg-brand-500/10',
  L: 'text-cyan-400 bg-cyan-500/10',
  M: 'text-orange-400 bg-orange-500/10',
}

function ProductCard({ product, onEdit, onDelete, onAdd, format$ }) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAdd(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 800)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
      className="bg-surface-800 border border-subtle rounded-2xl p-4 flex flex-col gap-3 group relative overflow-hidden"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600/0 to-brand-600/0 group-hover:from-brand-600/5 group-hover:to-transparent transition-all rounded-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{product.name}</p>
          <p className="text-[11px] text-muted-400 mt-0.5">{product.category}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(product)} className="p-1.5 rounded-lg text-muted-400 hover:text-white hover:bg-surface-600">
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDelete(product)} className="p-1.5 rounded-lg text-muted-400 hover:text-danger-400 hover:bg-danger-900/30">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Price & unit */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-white">{format$(product.price)}</span>
        <span className={clsx('text-xs font-semibold px-2 py-1 rounded-lg', UNIT_COLORS[product.unit] ?? UNIT_COLORS.UND)}>
          {product.unit}
        </span>
      </div>

      {/* Stock */}
      {product.stock !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 bg-surface-600 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', product.stock > 10 ? 'bg-success-500' : product.stock > 0 ? 'bg-warning-500' : 'bg-danger-500')}
              style={{ width: `${Math.min(100, (product.stock / 100) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-400">{product.stock} en stock</span>
        </div>
      )}

      {/* Add to cart */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          className="w-16 bg-surface-700 border border-subtle rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
            added
              ? 'bg-success-500 text-white'
              : 'bg-brand-600 hover:bg-brand-500 text-white'
          )}
        >
          {added ? '✓ Añadido' : <><ShoppingCart size={13} /> Añadir</>}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function Products() {
  const [search, setSearch]     = useState('')
  const [activeCat, setActiveCat] = useState(null)
  const [freePrice, setFreePrice] = useState('')
  const [freeName, setFreeName]   = useState('')
  const [showFree, setShowFree]   = useState(false)

  const products    = useProductStore((s) => s.products)
  const deleteProduct = useProductStore((s) => s.deleteProduct)
  const openModal   = useUIStore((s) => s.openModal)
  const addItem     = useCartStore((s) => s.addItem)
  const addCustomItem = useCartStore((s) => s.addCustomItem)
  const format$     = useCurrencyStore((s) => s.format)

  const filtered = useMemo(() => {
    let list = products
    if (activeCat) list = list.filter((p) => p.category === activeCat)
    if (search)    list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [products, activeCat, search])

  const handleAdd = (product, qty) => {
    addItem(product, qty)
    toast.success(`${qty}x ${product.name} al carrito`, { duration: 1500 })
  }

  const handleDelete = (product) => {
    deleteProduct(product.id)
    toast.success(`${product.name} eliminado`)
  }

  const handleFreeAdd = () => {
    if (!freePrice || isNaN(Number(freePrice)) || Number(freePrice) <= 0) {
      toast.error('Ingresa un precio válido')
      return
    }
    addCustomItem(freeName || 'Valor libre', Number(freePrice))
    setFreePrice('')
    setFreeName('')
    setShowFree(false)
    toast.success('Valor libre añadido al carrito')
  }

  return (
    <div className="p-6 flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Productos</h1>
          <p className="text-sm text-muted-400 mt-0.5">{products.length} productos en catálogo</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<DollarSign size={14} />}
            onClick={() => setShowFree((v) => !v)}
          >
            Valor Libre
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => openModal('addProduct')}
          >
            Añadir Producto
          </Button>
        </div>
      </div>

      {/* Free price panel */}
      <AnimatePresence>
        {showFree && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-700 border-2 border-brand-500/30 rounded-2xl p-4 flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-muted-400 font-medium mb-1.5 block uppercase tracking-wide">Descripción (opcional)</label>
                <input
                  value={freeName}
                  onChange={(e) => setFreeName(e.target.value)}
                  placeholder="Ej: Transporte, Descuento..."
                  className="w-full bg-surface-600 border border-subtle rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <div className="w-36">
                <label className="text-xs text-muted-400 font-medium mb-1.5 block uppercase tracking-wide">Precio (USD) *</label>
                <input
                  type="number"
                  value={freePrice}
                  onChange={(e) => setFreePrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full bg-surface-600 border border-subtle rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={handleFreeAdd}>
                Añadir al carrito
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar producto..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCat(null)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              !activeCat ? 'bg-brand-600 text-white' : 'bg-surface-700 text-muted-400 hover:text-white border border-subtle'
            )}
          >
            Todos
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(activeCat === cat ? null : cat)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeCat === cat ? 'bg-brand-600 text-white' : 'bg-surface-700 text-muted-400 hover:text-white border border-subtle'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 gap-3"
            >
              <Package size={36} className="text-muted-400" />
              <p className="text-sm text-muted-400">
                {search || activeCat ? 'Sin resultados' : 'Añade tu primer producto'}
              </p>
              {!search && !activeCat && (
                <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => openModal('addProduct')}>
                  Crear producto
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onEdit={(prod) => openModal('addProduct', { product: prod })}
                  onDelete={handleDelete}
                  onAdd={handleAdd}
                  format$={format$}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
