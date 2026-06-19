import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Trash2, Edit2, Copy, Link2, FileText, DollarSign, ShoppingCart, LayoutGrid, Layers } from 'lucide-react'
import Button from '@/components/ui/Button'
import SearchBar from '@/components/ui/SearchBar'
import SortFilterBar from '@/components/ui/SortFilterBar'
import { useProductStore, CATEGORIES, getProductDiscount } from '@/store/useProductStore'
import { useCartStore } from '@/store/useCartStore'
import { useUIStore } from '@/store/useUIStore'
import { useCurrencyStore } from '@/store/useCurrencyStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useClientStore } from '@/store/useClientStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}

const UNIT_COLORS = {
  KG: 'text-blue-400 bg-blue-500/10',
  LB: 'text-purple-400 bg-purple-500/10',
  UND: 'text-brand-400 bg-brand-500/10',
  L: 'text-cyan-400 bg-cyan-500/10',
  M: 'text-orange-400 bg-orange-500/10',
  ILIMITADO: 'text-success-400 bg-success-500/10',
}

const UNIT_LABELS = { ILIMITADO: 'Ilimitado' }

function ProductCard({ product, onEdit, onDuplicate, onDelete, onAdd, format$ }) {
  const [qty, setQty] = useState('')
  const [added, setAdded] = useState(false)
  const hasUnlimitedStock = product.unit === 'ILIMITADO' || product.stock >= 999999999
  const isOutOfStock = !hasUnlimitedStock && product.stock !== undefined && product.stock !== null && product.stock <= 0
  const discountInfo = getProductDiscount(product)

  const handleAdd = () => {
    const finalQty = qty === '' ? 1 : Number(qty)
    onAdd(product, finalQty)
    setAdded(true)
    setTimeout(() => setAdded(false), 800)
    setQty('')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
      className="bg-surface-800 border border-subtle rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col gap-3 group relative overflow-hidden shadow-glow-sm"
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
          <button onClick={() => onDuplicate(product)} className="p-1.5 rounded-lg text-muted-400 hover:text-foreground hover:bg-surface-600" title="Duplicar">
            <Copy size={12} />
          </button>
          <button onClick={() => onEdit(product)} className="p-1.5 rounded-lg text-muted-400 hover:text-foreground hover:bg-surface-600" title="Editar">
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDelete(product)} className="p-1.5 rounded-lg text-muted-400 hover:text-danger-400 hover:bg-danger-900/30" title="Borrar">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Attachment indicators */}
      {(product.attachment_url || product.attachment_name) && (
        <div className="absolute top-3 right-3 flex items-center gap-1 sm:group-hover:opacity-0 transition-opacity pointer-events-none">
          {product.attachment_url && product.attachment_url.trim() !== '' && (
            <span title={product.attachment_name || 'Enlace adjunto'} className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/15 border border-blue-500/25">
              <Link2 size={10} className="text-blue-400" />
            </span>
          )}
          {product.attachment_name && !product.attachment_url && (
            <span title={product.attachment_name} className="flex items-center justify-center w-5 h-5 rounded-md bg-orange-500/15 border border-orange-500/25">
              <FileText size={10} className="text-orange-400" />
            </span>
          )}
        </div>
      )}

      {/* Price & unit */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex flex-col">
          {discountInfo ? (
            <>
              <span className="text-xs text-muted-400 line-through">{format$(product.price)}</span>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-lg sm:text-xl font-black text-brand-400 drop-shadow-sm">{format$(discountInfo.finalPrice)}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {discountInfo.type === 'percentage' ? `-${discountInfo.value}%` : `-${format$(discountInfo.value)}`}
                </span>
              </div>
              {product.discount_ends_at && (
                <span className="text-[10px] text-muted-400 font-medium mt-1">
                  Promo hasta {new Date(product.discount_ends_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </>
          ) : (
            <span className="text-base sm:text-lg font-bold text-foreground">{format$(product.price)}</span>
          )}
        </div>
        {product.unit !== 'ILIMITADO' && (
          <span className={clsx('text-xs font-semibold px-2 py-1 rounded-lg shrink-0', UNIT_COLORS[product.unit] ?? UNIT_COLORS.UND)}>
            {UNIT_LABELS[product.unit] || product.unit}
          </span>
        )}
      </div>

      {/* Stock */}
      {hasUnlimitedStock ? (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 bg-success-500/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-success-500 w-full" />
          </div>
          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-lg', UNIT_COLORS.ILIMITADO)}>Ilimitado</span>
        </div>
      ) : product.stock !== undefined && product.stock !== null && (
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
          placeholder="1"
          onChange={(e) => {
            const val = e.target.value
            if (val === '') { setQty('') } else { setQty(Math.max(1, Number(val))) }
          }}
          disabled={isOutOfStock}
          className="w-16 bg-surface-700 border border-subtle rounded-lg px-2 py-1.5 text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <motion.button
          whileTap={isOutOfStock ? {} : { scale: 0.95 }}
          onClick={isOutOfStock ? undefined : handleAdd}
          disabled={isOutOfStock}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold transition-all',
            isOutOfStock
              ? 'bg-surface-700 text-muted-500 cursor-not-allowed border border-subtle'
              : added
                ? 'bg-success-500 text-white'
                : 'bg-brand-600 hover:bg-brand-500 text-white'
          )}
        >
          {isOutOfStock ? (
            <span className="truncate">Agotado</span>
          ) : added ? (
            <><span>✓</span><span className="hidden sm:inline"> Añadido</span></>
          ) : (
            <><ShoppingCart size={13} className="shrink-0" /><span className="hidden sm:inline">Añadir</span></>
          )}
        </motion.button>
      </div>

      {/* Out of stock action */}
      <AnimatePresence>
        {isOutOfStock && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <button
              onClick={() => onEdit(product)}
              className="w-full mt-1 border border-warning-500/30 bg-warning-500/10 hover:bg-warning-500/20 text-warning-400 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
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
  const [search, setSearch]       = useState('')
  const [activeCat, setActiveCat] = useState(null)
  const [freePrice, setFreePrice] = useState('')
  const [freeName, setFreeName]   = useState('')
  const [showFree, setShowFree]   = useState(false)
  const [isGrouped, setIsGrouped] = useState(false)

  // Sort & Filter state
  const [sortMode, setSortMode] = useState('recent')
  const [activeLetter, setActiveLetter] = useState(null)

  const products      = useProductStore((s) => s.products)
  const deleteProduct = useProductStore((s) => s.deleteProduct)
  const openModal     = useUIStore((s) => s.openModal)
  const openDuplicate = useUIStore((s) => s.openDuplicate)
  const addItem       = useCartStore((s) => s.addItem)
  const addCustomItem = useCartStore((s) => s.addCustomItem)
  const format$       = useCurrencyStore((s) => s.format)
  const baseCurrency  = useCurrencyStore((s) => s.baseCurrency)
  const selectedClient = useClientStore((s) => s.getSelected())

  const userSettings = useAuthStore((s) => s.user?.settings)
  const customCats = userSettings?.custom_categories || []
  const dynamicCategories = [...CATEGORIES.filter(c => c !== 'Otros'), ...customCats, 'Otros']

  const letters = useMemo(() => {
    const unique = new Set(products.map(p => (p.name || '').charAt(0).toUpperCase()))
    return Array.from(unique).filter(c => c && /[A-Z]/.test(c)).sort()
  }, [products])

  const filtered = useMemo(() => {
    let list = [...products]

    // 1. Basic filters (Search & Category)
    if (activeCat) list = list.filter((p) => p.category === activeCat)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q)))
    }

    // 2. Letter filter
    if (sortMode === 'letter' && activeLetter) {
      list = list.filter((p) => (p.name || '').charAt(0).toUpperCase() === activeLetter)
    }

    // 3. Sorting
    if (sortMode === 'recent') {
      // Assuming products are appended or have created_at. Since store usually unshifts/pushes, we can rely on ID if created_at is missing, or just reverse. 
      // If they have created_at:
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    } else if (sortMode === 'id') {
      // Sort by ID/Code, numeric if possible
      list.sort((a, b) => {
        const idA = a.code || a.id || ''
        const idB = b.code || b.id || ''
        return idA.toString().localeCompare(idB.toString(), undefined, { numeric: true })
      })
    } else if (sortMode === 'letter') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    return list
  }, [products, activeCat, search, sortMode, activeLetter])

  const groupedProducts = useMemo(() => {
    if (!isGrouped) return {}
    const groups = {}
    filtered.forEach(p => {
      const cat = p.category || 'Otros'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(p)
    })
    return groups
  }, [filtered, isGrouped])

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
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="page-container flex flex-col gap-5 h-full">
      {/* Sticky Header & Control Panel */}
      <div className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle flex flex-col gap-4">
        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">Productos</h1>
              <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">{products.length} productos en catálogo</p>
            </div>
            {selectedClient && (
              <div className="flex items-center gap-2 bg-brand-600/10 border border-brand-500/20 px-3 py-1 rounded-full text-xs text-brand-300">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span className="font-medium text-[11px] md:text-xs">
                  Cliente: <strong className="text-foreground dark:text-white">{selectedClient.name}</strong>
                </span>
                {selectedClient.type === 'express' ? (
                  <span className="text-[9px] px-1.5 py-0.5 bg-brand-500/20 border border-brand-500/30 rounded font-bold uppercase tracking-wider text-brand-400">Express</span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 bg-success-500/15 border border-success-500/30 rounded font-bold uppercase tracking-wider text-success-400">Frecuente</span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" pill icon={<DollarSign size={14} />} onClick={() => setShowFree((v) => !v)} className="px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm shrink-0">
              <span className="hidden sm:inline">Valor Libre</span>
              <span className="inline sm:hidden">Libre</span>
            </Button>
            <Button variant="primary" size="sm" pill icon={<Plus size={14} />} onClick={() => openModal('addProduct')} className="px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm shrink-0">
              <span className="hidden sm:inline">Añadir Producto</span>
              <span className="inline sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>

        {/* Free price panel */}
        <AnimatePresence>
          {showFree && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-surface-700/80 border border-brand-500/20 rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[10px] text-muted-400 font-bold mb-1 block uppercase tracking-wide">Descripción (opcional)</label>
                  <input value={freeName} onChange={(e) => setFreeName(e.target.value)} placeholder="Ej: Transporte, Descuento..." className="w-full bg-surface-600 border border-subtle rounded-xl px-3 py-1.5 text-xs md:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
                <div className="sm:w-36">
                  <label className="text-[10px] text-muted-400 font-bold mb-1 block uppercase tracking-wide">Precio ({baseCurrency}) *</label>
                  <input type="number" value={freePrice} onChange={(e) => setFreePrice(e.target.value)} placeholder="0.00" step="0.01" className="w-full bg-surface-600 border border-subtle rounded-xl px-3 py-1.5 text-xs md:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
                <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleFreeAdd} className="py-2 text-xs">Añadir</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} placeholder="Buscar producto..." />
            </div>
            
            <SortFilterBar 
              sortMode={sortMode} 
              onSortChange={setSortMode} 
              activeLetter={activeLetter} 
              onLetterChange={setActiveLetter} 
              letters={letters} 
            />
          </div>

          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar select-none -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCat(null)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border', !activeCat ? 'bg-brand-600 border-brand-500 text-white shadow-glow-sm' : 'bg-surface-700/50 border-subtle text-muted-400 hover:text-foreground')}
              >
                Todos
              </button>
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(activeCat === cat ? null : cat)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border', activeCat === cat ? 'bg-brand-600 border-brand-500 text-white shadow-glow-sm' : 'bg-surface-700/50 border-subtle text-muted-400 hover:text-foreground')}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex bg-surface-800 border border-subtle rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setIsGrouped(false)}
                className={clsx('p-1.5 rounded-md transition-colors', !isGrouped ? 'bg-surface-600 text-foreground shadow-sm' : 'text-muted-400 hover:text-foreground')}
                title="Vista tradicional"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setIsGrouped(true)}
                className={clsx('p-1.5 rounded-md transition-colors', isGrouped ? 'bg-surface-600 text-foreground shadow-sm' : 'text-muted-400 hover:text-foreground')}
                title="Agrupar por categoría"
              >
                <Layers size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 gap-3">
              <Package size={36} className="text-muted-400" />
              <p className="text-sm text-muted-400">{search || activeCat ? 'Sin resultados' : 'Añade tu primer producto'}</p>
              {!search && !activeCat && (
                <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => openModal('addProduct')}>Crear producto</Button>
              )}
            </motion.div>
          ) : isGrouped ? (
            <motion.div layout className="flex flex-col gap-6">
              {Object.entries(groupedProducts).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-black text-brand-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    {category}
                    <span className="text-[10px] bg-surface-700 text-muted-400 px-2 py-0.5 rounded-full">{items.length}</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {items.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onEdit={(prod) => openModal('addProduct', { product: prod })}
                        onDuplicate={(prod) => {
                          const { id, created_at, updated_at, ...duplicateData } = prod
                          openDuplicate('addProduct', duplicateData)
                        }}
                        onDelete={handleDelete}
                        onAdd={handleAdd}
                        format$={format$}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onEdit={(prod) => openModal('addProduct', { product: prod })}
                  onDuplicate={(prod) => {
                    const { id, created_at, updated_at, ...duplicateData } = prod
                    openDuplicate('addProduct', duplicateData)
                  }}
                  onDelete={handleDelete}
                  onAdd={handleAdd}
                  format$={format$}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
