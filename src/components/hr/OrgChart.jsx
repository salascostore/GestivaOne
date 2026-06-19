import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Briefcase, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import SearchBar from '@/components/ui/SearchBar'

function OrgNode({ employee, subordinates, allEmployees, searchQuery, level = 1 }) {
  const [expanded, setExpanded] = useState(true)

  // Check if this node or any of its children match the search query
  const matchesSearch = (emp, query) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      (emp.full_name || '').toLowerCase().includes(q) ||
      (emp.position || '').toLowerCase().includes(q) ||
      (emp.department || '').toLowerCase().includes(q)
    )
  }

  const checkHierarchyMatch = (emp, query) => {
    if (matchesSearch(emp, query)) return true
    const subs = allEmployees.filter(e => e.reports_to === emp.id && e.status === 'active')
    return subs.some(sub => checkHierarchyMatch(sub, query))
  }

  const isVisible = checkHierarchyMatch(employee, searchQuery)
  const isDirectMatch = matchesSearch(employee, searchQuery)

  if (!isVisible && searchQuery) return null

  return (
    <div className="flex flex-col items-center relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-surface-800 border ${isDirectMatch && searchQuery ? 'border-brand-500 shadow-glow-sm' : 'border-subtle hover:border-brand-500/30'} p-3 rounded-2xl w-36 sm:w-44 text-center shadow-sm relative transition-all z-10`}
      >
        <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-muted-300 mx-auto mb-1.5 font-bold text-xs">
          {employee.full_name?.charAt(0).toUpperCase()}
        </div>
        <p className="text-[11px] font-bold text-foreground truncate">{employee.full_name}</p>
        <p className="text-[9px] text-muted-400 font-medium truncate mt-0.5 flex items-center justify-center gap-1">
          <Briefcase size={9} className="text-muted-500" />
          {employee.position}
        </p>
        {employee.department && (
          <p className="text-[8px] text-brand-400 font-bold uppercase tracking-wider mt-1">{employee.department}</p>
        )}

        {subordinates.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-surface-700 border border-subtle rounded-full flex items-center justify-center text-muted-400 hover:text-foreground hover:bg-surface-600 transition-colors z-20"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {expanded && subordinates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center w-full"
          >
            <div className="w-0.5 h-6 bg-subtle/60 relative -z-0" />
            {subordinates.length > 1 && (
              <div 
                className="h-0.5 bg-subtle/60 relative" 
                style={{ 
                  width: `calc(100% - ${100 / subordinates.length}%)` 
                }} 
              />
            )}
            <div className="flex justify-center gap-6 pt-0.5">
              {subordinates.map(sub => {
                const subSubordinates = allEmployees.filter(e => e.reports_to === sub.id && e.status === 'active')
                return (
                  <div key={sub.id} className="relative flex flex-col items-center">
                    {subordinates.length > 1 && <div className="w-0.5 h-4 bg-subtle/60" />}
                    <OrgNode 
                      employee={sub} 
                      subordinates={subSubordinates} 
                      allEmployees={allEmployees} 
                      searchQuery={searchQuery}
                      level={level + 1} 
                    />
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function OrgChart({ employees }) {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')

  const activeEmployees = employees.filter(e => e.status === 'active')
  
  // Root subordinates are those without a reports_to
  const rootSubordinates = activeEmployees.filter(e => !e.reports_to)

  return (
    <div className="space-y-6 flex flex-col items-center py-6 w-full">
      {/* Search Bar */}
      <div className="w-full max-w-md mx-auto mb-4 px-4 sticky left-0 right-0">
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Buscar por nombre, cargo o departamento..." 
        />
      </div>

      {/* OrgChart Container */}
      <div className="w-full overflow-x-auto pb-10 flex justify-center min-h-[500px] no-scrollbar">
        <div className="flex flex-col items-center min-w-max px-8">
          
          {/* Root Node: Company Owner */}
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="liquid-glass border-2 border-brand-500 bg-brand-500/10 p-4 rounded-3xl text-center w-44 sm:w-52 shadow-glow-sm relative z-10"
            >
              <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white mx-auto mb-2 font-black text-sm">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-black text-foreground">{user?.name || 'Administrador'}</p>
              <p className="text-[9px] text-brand-400 font-bold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                <Shield size={10} />
                Director General
              </p>
              <p className="text-[8px] text-muted-500 mt-0.5 truncate">{user?.email}</p>
            </motion.div>
            
            {/* Connecting Vertical Line */}
            {rootSubordinates.length > 0 && (
              <div className="w-0.5 h-8 bg-subtle/60" />
            )}
          </div>

          {/* Root Subordinates Level */}
          {rootSubordinates.length > 0 && (
            <div className="relative flex flex-col items-center w-full">
              {rootSubordinates.length > 1 && (
                <div 
                  className="absolute top-0 h-0.5 bg-subtle/60" 
                  style={{ 
                    left: `${100 / (rootSubordinates.length * 2)}%`, 
                    right: `${100 / (rootSubordinates.length * 2)}%` 
                  }} 
                />
              )}
              
              <div className="flex gap-8 justify-center pt-0.5">
                {rootSubordinates.map(emp => {
                  const subSubordinates = activeEmployees.filter(e => e.reports_to === emp.id)
                  return (
                    <div key={emp.id} className="relative flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-subtle/60" />
                      <OrgNode 
                        employee={emp} 
                        subordinates={subSubordinates} 
                        allEmployees={activeEmployees} 
                        searchQuery={searchQuery}
                        level={2} 
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
