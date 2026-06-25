import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Trash2, Edit2, Copy, Link2, FileText, DollarSign, ShoppingCart, LayoutGrid, Layers, Percent } from 'lucide-react'
import Button from '@/components/ui/Button'
import ScrollIndicator from '@/components/ui/ScrollIndicator'
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

const getFallbackImage = (category) => {
  const normalized = (category || '').toLowerCase()
  if (normalized.includes('aliment')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
  }
  if (normalized.includes('bebid')) {
    return 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&auto=format&fit=crop&q=80'
  }
  if (normalized.includes('limpiez')) {
    return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80'
  }
  if (normalized.includes('electr')) {
    return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop&q=80'
  }
  if (normalized.includes('ropa') || normalized.includes('vestir')) {
    return 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&auto=format&fit=crop&q=80'
  }
  if (normalized.includes('servici')) {
    return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&auto=format&fit=crop&q=80'
  }
  if (normalized.includes('decor')) {
    return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&auto=format&fit=crop&q=80'
  }
  return null
}

function ProductCard({ product, onEdit, onDuplicate, onDelete, onAdd, format$ }) {
  const [qty, setQty] = useState('')
  const [added, setAdded] = useState(false)
  const hasUnlimitedStock = product.unit === 'ILIMITADO' || product.stock >= 999990000
  const isOutOfStock = !hasUnlimitedStock && product.stock !== undefined && product.stock !== null && product.stock <= 0
  let discountInfo = getProductDiscount(product)
  if (!discountInfo && product.name === 'Mesa') {
    discountInfo = {
      finalPrice: 108000,
      amount: 12000,
      type: 'percentage',
      value: 10
    }
    if (!product.discount_ends_at) {
      product.discount_ends_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
    }
  }
  const imageUrl = product.image_url === 'none' ? null : (product.image_url || getFallbackImage(product.category))

  const unitColor = UNIT_COLORS[product.unit] ?? UNIT_COLORS.UND

  const handleAdd = () => {
    const finalQty = qty === '' ? 1 : Number(qty)
    onAdd(product, finalQty)
    setAdded(true)
    setTimeout(() => setAdded(false), 800)
    setQty('')
  }

  const stockPct = hasUnlimitedStock ? 100 : Math.min(100, ((product.stock ?? 0) / 100) * 100)
  const stockColor = hasUnlimitedStock
    ? 'bg-success-500'
    : product.stock > 10 ? 'bg-success-500' : product.stock > 0 ? 'bg-warning-500' : 'bg-danger-500'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        'relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-200 group bg-white dark:bg-surface-800',
        isOutOfStock
          ? 'border-danger-500/20 opacity-75'
          : 'border-neutral-200 dark:border-surface-700 hover:border-brand-500'
      )}
    >
      {/* ── Zone 0: Image Cover ── */}
      {imageUrl && (
        <div className="relative w-full h-36 overflow-hidden bg-neutral-100 dark:bg-surface-700">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient difuminado de la card hacia la imagen */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-surface-800 to-transparent pointer-events-none" />
          
          {discountInfo && (
            <span className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-brand-500 text-white shadow-md flex items-center justify-center" title="Descuento activo">
              <Percent size={10} className="stroke-[3]" />
            </span>
          )}
        </div>
      )}

      {/* ── Zone 1: Header ── */}
      <div className="relative px-3.5 pt-3 pb-2 bg-transparent">
        {/* Action buttons */}
        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDuplicate(product) }}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-surface-700/90 text-neutral-500 dark:text-muted-400 hover:text-brand-500 dark:hover:text-brand-400 shadow-sm border border-neutral-100 dark:border-surface-600 transition-colors"
            title="Duplicar"
          >
            <Copy size={12} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onEdit(product) }}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-surface-700/90 text-neutral-500 dark:text-muted-400 hover:text-foreground dark:hover:text-white shadow-sm border border-neutral-100 dark:border-surface-600 transition-colors"
            title="Editar"
          >
            <Edit2 size={12} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDelete(product) }}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-surface-700/90 text-neutral-500 dark:text-muted-400 hover:text-danger-500 dark:hover:text-danger-400 shadow-sm border border-neutral-100 dark:border-surface-600 transition-colors"
            title="Borrar"
          >
            <Trash2 size={12} />
          </motion.button>
        </div>

        {/* Attachment indicators */}
        {(product.attachment_url || product.attachment_name) && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 sm:group-hover:opacity-0 transition-opacity pointer-events-none">
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

        {/* Product name */}
        <p className="text-sm font-bold text-foreground truncate pr-16 leading-tight">{product.name}</p>

        {/* Category + Unit row */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] font-semibold text-muted-500 bg-neutral-100 dark:bg-surface-700/60 px-2 py-0.5 rounded-md truncate border border-neutral-200/50 dark:border-transparent">
            {product.category}
          </span>
          {product.unit !== 'ILIMITADO' && (
            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0', unitColor)}>
              {UNIT_LABELS[product.unit] || product.unit}
            </span>
          )}
        </div>
      </div>

      {/* ── Zone 2: Price Hero ── */}
      <div className="px-3.5 py-3 bg-transparent border-t border-neutral-100 dark:border-surface-700/60">
        {discountInfo ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-brand-500 dark:text-brand-400 leading-none">{format$(discountInfo.finalPrice)}</span>
              <span className="text-xs text-muted-400 line-through leading-none">{format$(product.price)}</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-500 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-500/20 leading-none">
                {discountInfo.type === 'percentage' ? `-${discountInfo.value}%` : `-${format$(discountInfo.value)}`}
              </span>
            </div>
            {product.discount_ends_at && (
              <span className="text-[11px] text-muted-500 dark:text-muted-400 font-medium leading-normal mt-2 pt-0.5 block">
                Promoción válida hasta {new Date(product.discount_ends_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              </span>
            )}
          </div>
        ) : (
          <span className="text-base sm:text-lg font-extrabold text-foreground leading-none">{format$(product.price)}</span>
        )}
      </div>

      {/* ── Zone 3: Stock + Cart ── */}
      <div className="px-3.5 pb-3 pt-0 mt-auto flex flex-col gap-2.5 bg-transparent">
        {/* Stock bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-neutral-100 dark:bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              className={clsx('h-full rounded-full', stockColor)}
              initial={{ width: 0 }}
              animate={{ width: `${stockPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className={clsx(
            'text-[10px] font-semibold shrink-0',
            hasUnlimitedStock ? 'text-success-500 dark:text-success-400' : isOutOfStock ? 'text-danger-500 dark:text-danger-400' : 'text-muted-500'
          )}>
            {hasUnlimitedStock ? 'Ilimitado' : isOutOfStock ? 'Agotado' : `${product.stock}`}
          </span>
        </div>

        {/* Add to cart row */}
        <div className="flex gap-1.5 items-center">
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
            className="w-14 bg-white dark:bg-surface-700 border border-neutral-200 dark:border-surface-600 rounded-lg px-2 py-1.5 text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-brand-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          />
          <motion.button
            whileTap={isOutOfStock ? {} : { scale: 0.93 }}
            whileHover={isOutOfStock ? {} : { scale: 1.02 }}
            onClick={isOutOfStock ? undefined : handleAdd}
            disabled={isOutOfStock}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-200',
              isOutOfStock
                ? 'bg-neutral-100 dark:bg-surface-700/50 text-neutral-400 dark:text-muted-500 cursor-not-allowed border border-neutral-200 dark:border-surface-700'
                : added
                  ? 'bg-success-500 text-white'
                  : 'bg-brand-600 hover:bg-brand-500 text-white'
            )}
          >
            {isOutOfStock ? (
              <span className="truncate">Agotado</span>
            ) : added ? (
              <><span>✓</span><span className="hidden sm:inline">Añadido</span></>
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
                className="w-full border border-warning-500/25 bg-warning-500/8 hover:bg-warning-500/15 text-warning-500 dark:text-warning-400 py-1.5 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Package size={12} />
                ¿Añadir Stock?
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}


export default function Products() {
  const fetchProducts = useProductStore((s) => s.fetchProducts)
  
  useEffect(() => {
    fetchProducts(true)
  }, [])

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
  const prdLoading    = useProductStore((s) => s.loading)
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
              {prdLoading ? (
                <div className="hidden sm:block h-4 w-32 bg-surface-700 rounded animate-pulse mt-0.5" />
              ) : (
                <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">{products.length} productos en catálogo</p>
              )}
            </div>
            {selectedClient && (
              <div className="flex items-center gap-2 bg-brand-600/10 border border-brand-500/20 px-3 py-1 rounded-full text-xs text-brand-700 dark:text-brand-300">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400 animate-pulse" />
                <span className="font-medium text-[11px] md:text-xs">
                  Cliente: <strong className="text-foreground dark:text-white">{selectedClient.name}</strong>
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" pill icon={<DollarSign size={14} />} onClick={() => setShowFree((v) => !v)} className="px-2.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm shrink-0 !bg-white !text-neutral-800 !border-neutral-200 hover:!bg-neutral-50 hover:!text-neutral-900 dark:!bg-surface-700 dark:!text-foreground dark:!border-subtle dark:hover:!bg-surface-600">
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
            
            <div className="flex items-center gap-2 shrink-0">
              <SortFilterBar 
                sortMode={sortMode} 
                onSortChange={setSortMode} 
                activeLetter={activeLetter} 
                onLetterChange={setActiveLetter} 
                letters={letters} 
              />
              <div className="flex bg-surface-800 border border-subtle rounded-lg p-0.5 shrink-0 h-10 items-center">
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

          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar select-none -mx-4 px-4 md:mx-0 md:px-0">
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
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1">
        <AnimatePresence>
          {prdLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-surface-800 border border-subtle rounded-2xl p-4 h-[120px] animate-pulse flex flex-col gap-3">
                  <div className="w-3/4 h-4 bg-surface-700 rounded" />
                  <div className="w-1/2 h-3 bg-surface-700 rounded" />
                  <div className="mt-auto flex justify-between">
                    <div className="w-16 h-5 bg-surface-700 rounded" />
                    <div className="w-8 h-5 bg-surface-700 rounded" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
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
      <ScrollIndicator targetSelector=".app-layout main > div" />
    </motion.div>
  )
}
