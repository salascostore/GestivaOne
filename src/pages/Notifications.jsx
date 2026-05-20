import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, Check, AlertTriangle, AlertCircle, 
  Info, CheckCircle2, ShoppingCart, Settings,
  Calendar, Layers, Sparkles
} from 'lucide-react'
import { useNotificationStore } from '@/store/useNotificationStore'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 25 }
  }
}

const CATEGORY_ICONS = {
  'Inventario': ShoppingCart,
  'Cobros': Calendar,
  'Ventas': Sparkles,
  'Sistema': Settings,
}

const TYPE_STYLES = {
  danger: {
    border: 'border-danger-500/20 dark:border-danger-500/30',
    bg: 'bg-danger-500/5 dark:bg-danger-500/10',
    text: 'text-danger-500 dark:text-danger-400',
    icon: AlertCircle,
  },
  warning: {
    border: 'border-warning-500/20 dark:border-warning-500/30',
    bg: 'bg-warning-500/5 dark:bg-warning-500/10',
    text: 'text-warning-500 dark:text-warning-400',
    icon: AlertTriangle,
  },
  success: {
    border: 'border-success-500/20 dark:border-success-500/30',
    bg: 'bg-success-500/5 dark:bg-success-500/10',
    text: 'text-success-500 dark:text-success-400',
    icon: CheckCircle2,
  },
  info: {
    border: 'border-brand-500/20 dark:border-brand-500/30',
    bg: 'bg-brand-500/5 dark:bg-brand-500/10',
    text: 'text-brand-500 dark:text-brand-400',
    icon: Info,
  },
}

export default function Notifications() {
  const getNotifications = useNotificationStore((s) => s.getNotifications)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)

  const notifications = getNotifications()
  const unreadCount = notifications.filter(n => !n.read).length

  const [activeCategory, setActiveCategory] = useState('Todas')

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(notifications.map(n => n.category))
    return ['Todas', ...Array.from(cats)]
  }, [notifications])

  // Filtered notifications
  const filtered = useMemo(() => {
    if (activeCategory === 'Todas') return notifications
    return notifications.filter(n => n.category === activeCategory)
  }, [notifications, activeCategory])

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      markAllAsRead(unreadIds)
      toast.success('Todas las notificaciones marcadas como leídas')
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="page-container flex flex-col gap-6 h-full"
    >
      {/* Sticky Header & Categories Wrapper */}
      <motion.div 
        variants={itemVariants}
        className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 border-b border-subtle/20 flex flex-col gap-4"
      >
        {/* Row 1: Title and Actions */}
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-2xl font-bold text-brand-600 dark:text-white">Notificaciones</h1>
              {unreadCount > 0 && (
                <Badge variant="primary" className="px-2 py-0.5 text-[10px] md:text-xs font-black animate-pulse shrink-0">
                  {unreadCount} Nuevas
                </Badge>
              )}
            </div>
            <p className="hidden sm:block text-xs md:text-sm text-muted-400 mt-0.5">Alertas importantes y anuncios</p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Check size={14} />}
              onClick={handleMarkAllRead}
              className="px-2.5 py-1.5 text-xs rounded-xl shrink-0"
            >
              <span className="hidden sm:inline">Marcar todo como leído</span>
              <span className="inline sm:hidden">Marcar Leído</span>
            </Button>
          )}
        </div>

        {/* Row 2: Categories Horizontal Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((cat) => {
            const count = cat === 'Todas' 
              ? notifications.filter(n => !n.read).length
              : notifications.filter(n => n.category === cat && !n.read).length

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx(
                  "relative flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 whitespace-nowrap border shrink-0",
                  activeCategory === cat
                    ? "bg-brand-600 border-brand-500 text-white shadow-glow-sm"
                    : "bg-surface-800 border-subtle text-muted-400 hover:text-white hover:bg-surface-700"
                )}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className={clsx(
                    "w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold",
                    activeCategory === cat ? "bg-white text-brand-600" : "bg-brand-600 text-white"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Notifications List */}
      <motion.div variants={itemVariants} className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-subtle rounded-3xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-subtle flex items-center justify-center mb-4">
                <Bell size={26} className="text-muted-400" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Sin notificaciones</h3>
              <p className="text-xs text-muted-400 mt-1 max-w-[280px]">
                No hay alertas activas en esta categoría. Todo está al día.
              </p>
            </motion.div>
          ) : (
            filtered.map((notif) => {
              const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info
              const IconComp = style.icon
              const CatIcon = CATEGORY_ICONS[notif.category] || Info

              return (
                <motion.div
                  key={notif.id}
                  layoutId={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    if (!notif.read) {
                      markAsRead(notif.id)
                      toast.success('Notificación marcada como leída', { id: notif.id, duration: 1500 })
                    }
                  }}
                  className={clsx(
                    "group relative overflow-hidden flex gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none active:scale-[0.99]",
                    notif.read 
                      ? "bg-surface-800/20 dark:bg-surface-800/10 border-subtle/30 opacity-40 hover:opacity-80" 
                      : clsx("bg-surface-800 border-subtle hover:border-brand-500/30 hover:scale-[1.01] shadow-sm", style.border)
                  )}
                >
                  {/* Left indicator strip for unread notifications */}
                  {!notif.read && (
                    <div className={clsx("absolute left-0 top-0 bottom-0 w-1", 
                      notif.type === 'danger' ? 'bg-danger-500' :
                      notif.type === 'warning' ? 'bg-warning-500' :
                      notif.type === 'success' ? 'bg-success-500' : 'bg-brand-500'
                    )} />
                  )}

                  {/* Left Icon with color scheme */}
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105",
                    notif.read ? "bg-surface-700/20 border-subtle/30 text-muted-500 grayscale opacity-60" : clsx(style.bg, style.border, style.text)
                  )}>
                    <IconComp size={20} />
                  </div>

                  {/* Message body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={clsx("text-sm font-bold truncate", notif.read ? "text-muted-500/80 font-medium" : "text-foreground")}>
                        {notif.title}
                      </h4>
                      <div className={clsx(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        notif.read ? "bg-surface-700/10 border-subtle/30 text-muted-500" : "bg-surface-700/50 border-subtle text-muted-400"
                      )}>
                        <CatIcon size={10} />
                        <span>{notif.category}</span>
                      </div>
                    </div>
                    <p className={clsx("text-xs mt-1.5 leading-relaxed", notif.read ? "text-muted-500/70" : "text-muted-400")}>
                      {notif.message}
                    </p>
                  </div>

                  {/* Unread circle badge / read checkmark on right */}
                  {!notif.read ? (
                    <div className="flex items-center justify-center shrink-0">
                      <span className={clsx("w-2 h-2 rounded-full animate-pulse", 
                        notif.type === 'danger' ? 'bg-danger-500' :
                        notif.type === 'warning' ? 'bg-warning-500' :
                        notif.type === 'success' ? 'bg-success-500' : 'bg-brand-500'
                      )} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center shrink-0 text-success-500 dark:text-success-400">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  )}
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
