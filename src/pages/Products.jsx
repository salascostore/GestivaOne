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
          <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
          <p className="text-[11px] text-muted-400 mt-0.5">{product.category}</p>
        </div>
        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
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
        <span className="text-lg font-bold text-foreground">{format$(product.price)}</span>
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
          disabled={product.stock !== undefined && product.stock <= 0}
          className="w-16 bg-surface-700 border border-subtle rounded-lg px-2 py-1.5 text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <motion.button
          whileTap={product.stock !== undefined && product.stock <= 0 ? {} : { scale: 0.95 }}
          onClick={product.stock !== undefined && product.stock <= 0 ? undefined : handleAdd}
          disabled={product.stock !== undefined && product.stock <= 0}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all',
            product.stock !== undefined && product.stock <= 0
              ? 'bg-surface-700 text-muted-500 cursor-not-allowed border border-subtle'
              : added
                ? 'bg-success-500 text-white'
                : 'bg-brand-600 hover:bg-brand-500 text-white'
          )}
        >
          {product.stock !== undefined && product.stock <= 0 ? (
            <span className="truncate">Agotado</span>
          ) : added ? (
            <>
              <span>✓</span>
              <span className="hidden sm:inline"> Añadido</span>
            </>
          ) : (
            <>
              <ShoppingCart size={13} className="shrink-0" />
              <span className="hidden sm:inline">Añadir</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Out of stock action */}
      <AnimatePresence>
        {product.stock !== undefined && product.stock <= 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <button
              onClick={() => onEdit(product)}
              className="w-full mt-1 border border-warning-500/30 bg-warning-500/10 hover:bg-warning-500/20 text-warning-400 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Package size={13} />
              ¿Añadir Stock?
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency)

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
    <div className="page-container flex flex-col gap-5 h-full">
      {/* Sticky Header & Control Panel */}
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle/20 flex flex-col gap-4">
        {/* Title and Actions */}
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-brand-600 dark:text-white">Productos</h1>
            <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">{products.length} productos en catálogo</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={<DollarSign size={14} />}
              onClick={() => setShowFree((v) => !v)}
              className="px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl shrink-0"
            >
              <span className="hidden sm:inline">Valor Libre</span>
              <span className="inline sm:hidden">Libre</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => openModal('addProduct')}
              className="px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl shrink-0"
            >
              <span className="hidden sm:inline">Añadir Producto</span>
              <span className="inline sm:hidden">Nuevo</span>
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
              <div className="bg-surface-700/80 border border-brand-500/20 rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[10px] text-muted-400 font-bold mb-1 block uppercase tracking-wide">Descripción (opcional)</label>
                  <input
                    value={freeName}
                    onChange={(e) => setFreeName(e.target.value)}
                    placeholder="Ej: Transporte, Descuento..."
                    className="w-full bg-surface-600 border border-subtle rounded-xl px-3 py-1.5 text-xs md:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="sm:w-36">
                  <label className="text-[10px] text-muted-400 font-bold mb-1 block uppercase tracking-wide">Precio ({baseCurrency}) *</label>
                  <input
                    type="number"
                    value={freePrice}
                    onChange={(e) => setFreePrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full bg-surface-600 border border-subtle rounded-xl px-3 py-1.5 text-xs md:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleFreeAdd} className="py-2 text-xs">
                  Añadir
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & filters */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar producto..." />
          </div>
          {/* Categories Horizontal scrollable on mobile, flex wrap on tablet+ */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => setActiveCat(null)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border',
                !activeCat ? 'bg-brand-600 border-brand-500 text-white shadow-glow-sm' : 'bg-surface-700/50 border-subtle text-muted-400 hover:text-white'
              )}
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(activeCat === cat ? null : cat)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border',
                  activeCat === cat ? 'bg-brand-600 border-brand-500 text-white shadow-glow-sm' : 'bg-surface-700/50 border-subtle text-muted-400 hover:text-white'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1">
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
