import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, User, Trash2, Mail, Phone, Calendar, GripVertical } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const COLUMNS = [
  { id: 'applied', title: 'Postulados', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { id: 'interview', title: 'Entrevistas', color: 'bg-warning-500/10 border-warning-500/30 text-warning-400' },
  { id: 'offer', title: 'Oferta', color: 'bg-pink-500/10 border-pink-500/30 text-pink-400' },
  { id: 'hired', title: 'Contratados', color: 'bg-success-500/10 border-success-500/30 text-success-400' },
  { id: 'rejected', title: 'Rechazados', color: 'bg-danger-500/10 border-danger-500/30 text-danger-400' }
]

export default function CandidatesKanban({ candidates, addCandidate, updateCandidateStage, removeCandidate }) {
  const [openModal, setOpenModal] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName || !email || !position) {
      toast.error('Completa los campos obligatorios (*)')
      return
    }

    setSubmitting(true)
    const success = await addCandidate({
      full_name: fullName,
      email,
      phone,
      position,
      notes,
      stage: 'applied'
    })

    if (success) {
      setOpenModal(false)
      // reset form
      setFullName('')
      setEmail('')
      setPhone('')
      setPosition('')
      setNotes('')
    }
    setSubmitting(false)
  }

  // Helper to move stages
  const getNextStage = (curr) => {
    const idx = COLUMNS.findIndex(c => c.id === curr)
    if (idx < COLUMNS.length - 1) return COLUMNS[idx + 1].id
    return null
  }

  const getPrevStage = (curr) => {
    const idx = COLUMNS.findIndex(c => c.id === curr)
    if (idx > 0) return COLUMNS[idx - 1].id
    return null
  }

  // @hello-pangea/dnd Drag handler
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    updateCandidateStage(draggableId, destination.droppableId)
  }

  return (
    <div className="space-y-4">
      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Embudo de Reclutamiento</h3>
        <Button
          onClick={() => setOpenModal(true)}
          variant="primary"
          size="sm"
          className="rounded-xl py-2"
          icon={<Plus size={14} />}
        >
          Agregar Candidato
        </Button>
      </div>

      {/* Kanban Board Grid */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 no-scrollbar">
          {COLUMNS.map((col) => {
            const colCandidates = candidates.filter(c => c.stage === col.id)
            return (
              <div 
                key={col.id} 
                className="bg-surface-800/40 border border-subtle/70 rounded-3xl p-4 min-w-[220px] flex flex-col h-[500px]"
              >
                {/* Column Title */}
                <div className={`p-2.5 rounded-2xl border ${col.color} mb-4 flex items-center justify-between text-xs font-black uppercase tracking-widest`}>
                  <span>{col.title}</span>
                  <span className="bg-surface-900/60 text-foreground px-2 py-0.5 rounded-lg border border-subtle/50 text-[10px]">
                    {colCandidates.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      className={`flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar ${snapshot.isDraggingOver ? 'bg-surface-800/60 rounded-2xl' : ''}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {colCandidates.map((cand, index) => {
                        const next = getNextStage(cand.stage)
                        const prev = getPrevStage(cand.stage)
                        return (
                          <Draggable key={cand.id} draggableId={cand.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-surface-800 border border-subtle hover:border-brand-500/20 rounded-2xl p-3 space-y-3 shadow-sm ${snapshot.isDragging ? 'shadow-glow-sm border-brand-500/50 rotate-2' : ''}`}
                                style={provided.draggableProps.style}
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="flex items-start gap-2 min-w-0">
                                    <div {...provided.dragHandleProps} className="mt-1 text-muted-500 cursor-grab active:cursor-grabbing hover:text-brand-400">
                                      <GripVertical size={14} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-foreground truncate">{cand.full_name}</p>
                                      <p className="text-[10px] text-brand-400 font-bold tracking-wider mt-0.5">{cand.position}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeCandidate(cand.id)}
                                    className="text-muted-500 hover:text-danger-500 transition-colors p-1 rounded-lg hover:bg-danger-500/10 shrink-0"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                {/* Candidate Contact Details */}
                                <div className="space-y-1 text-[10px] text-muted-400 leading-tight pl-5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Mail size={10} className="shrink-0" />
                                    <span>{cand.email}</span>
                                  </div>
                                  {cand.phone && (
                                    <div className="flex items-center gap-1.5">
                                      <Phone size={10} className="shrink-0" />
                                      <span>{cand.phone}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Interactive Move Stage Controls */}
                                <div className="flex justify-between items-center pt-2 border-t border-subtle/50">
                                  <button
                                    disabled={!prev}
                                    onClick={() => updateCandidateStage(cand.id, prev)}
                                    className="p-1 rounded-lg bg-surface-700/50 hover:bg-surface-700 border border-subtle text-muted-400 hover:text-foreground disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                                  >
                                    <ChevronLeft size={12} />
                                  </button>
                                  
                                  <span className="text-[9px] uppercase font-bold text-muted-500 select-none">
                                    Mover
                                  </span>

                                  <button
                                    disabled={!next}
                                    onClick={() => updateCandidateStage(cand.id, next)}
                                    className="p-1 rounded-lg bg-surface-700/50 hover:bg-surface-700 border border-subtle text-muted-400 hover:text-foreground disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                                  >
                                    <ChevronRight size={12} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                      {colCandidates.length === 0 && !snapshot.isDraggingOver && (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-subtle/50 rounded-2xl p-6 text-center mt-2">
                          <span className="text-[10px] font-bold text-muted-500 uppercase tracking-wider">Arrastra aquí</span>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Add Candidate Modal */}
      <AnimatePresence>
        {openModal && (
          <Modal
            open={openModal}
            onClose={() => setOpenModal(false)}
            title="Agregar Candidato a Selección"
            size="md"
          >
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Nombre Completo *</label>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                    placeholder="Ej: Laura Castro"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Cargo Postulado *</label>
                  <input
                    required
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                    placeholder="Ej: Despachador"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Correo Electrónico *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                    placeholder="Ej: laura@gmail.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-500 mb-1.5 block">Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                    placeholder="Ej: 315897463"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-500 mb-1.5 block">Notas y Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface-900 border border-subtle rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30 h-20 resize-none"
                  placeholder="Añade detalles sobre el perfil o el proceso..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setOpenModal(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl"
                >
                  {submitting ? 'Guardando...' : 'Registrar Candidato'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
