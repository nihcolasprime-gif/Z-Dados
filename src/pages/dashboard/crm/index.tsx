import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragEndEvent, PointerSensor, useSensor, useSensors,
  DragOverlay, defaultDropAnimationSideEffects, DropAnimation, DragStartEvent
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Plus, X, Phone, FileText, DollarSign, GripVertical } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { Orcamento } from '../../../models';

const COLUNAS = [
  { id: 'prospeccao', label: 'Prospecção / Lead', color: '#ffffff' },
  { id: 'enviado', label: 'Orçamento Enviado', color: '#f59e0b' },
  { id: 'retornou', label: 'Em Negociação', color: '#8b5cf6' },
  { id: 'nao_retornou', label: 'Não Retornou', color: '#ef4444' },
  { id: 'virou_cliente', label: 'Fechado ✓', color: '#22c55e' }
];

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
};

// --- Inline Kanban Components ---
function KanbanCard({ card, isDragging }: { card: Orcamento; isDragging?: boolean }) {
  return (
    <div className={`p-4 rounded-xl bg-white/[0.03] border border-white/5 ${isDragging ? 'opacity-50 shadow-2xl' : 'hover:bg-white/[0.06]'} transition-all cursor-grab active:cursor-grabbing`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="text-white text-sm font-semibold mb-1">{card.nome_prospect}</h4>
          {card.telefone_prospect && (
            <p className="text-muted text-xs flex items-center gap-1"><Phone size={10} /> {card.telefone_prospect}</p>
          )}
        </div>
        <GripVertical size={14} className="text-white/20 flex-shrink-0 mt-1" />
      </div>
      {card.descricao && <p className="text-muted text-xs mt-2 line-clamp-2">{card.descricao}</p>}
      {card.valor_proposto && (
        <div className="mt-3 flex items-center gap-1 text-green-400 text-xs font-semibold">
          <DollarSign size={12} /> R$ {card.valor_proposto.toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}

function DroppableColumn({ id, label, color, cards, children }: { id: string; label: string; color: string; cards: Orcamento[]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] flex-shrink-0 rounded-2xl border transition-all ${isOver ? 'border-white/20 bg-white/[0.03]' : 'border-white/5 bg-white/[0.01]'}`}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-bold uppercase tracking-widest text-white/60">{label}</span>
        </div>
        <span className="text-xs text-muted bg-white/5 px-2 py-0.5 rounded-full">{cards.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-3 pt-0 flex-1 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}

function DraggableCard({ card }: { card: Orcamento }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: card,
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.3 : 1 }}>
      <KanbanCard card={card} />
    </div>
  );
}

export default function CRMPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCard, setActiveCard] = useState<Orcamento | null>(null);

  const [form, setForm] = useState({
    nome_prospect: '', telefone_prospect: '', descricao: '',
    valor_proposto: '', status: 'prospeccao' as Orcamento['status']
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const carregarOrcamentos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('crm_orcamentos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setOrcamentos(data || []);
    } catch (e: any) {
      toast.error('Falha ao carregar CRM: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { carregarOrcamentos(); }, [carregarOrcamentos]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_prospect) { toast.error('Nome do prospect é obrigatório.'); return; }
    try {
      const { data: me } = await supabase.auth.getUser();
      if (!me.user) throw new Error('Usuário não autenticado');
      const { data: profile } = await supabase.from('colaboradores').select('escritorio_id').eq('email', me.user.email).single();
      if (!profile) throw new Error('Perfil não encontrado');

      const { data, error } = await supabase.from('crm_orcamentos').insert([{
        nome_prospect: form.nome_prospect, telefone_prospect: form.telefone_prospect,
        descricao: form.descricao, valor_proposto: form.valor_proposto ? parseFloat(form.valor_proposto) : null,
        status: form.status, escritorio_id: profile.escritorio_id,
        data_envio: form.status === 'enviado' ? new Date().toISOString().split('T')[0] : null,
      }]).select().single();
      if (error) throw error;

      toast.success('Prospecção registrada!');
      setOrcamentos(prev => [data, ...prev]);
      setModalNovo(false);
      setForm({ nome_prospect: '', telefone_prospect: '', descricao: '', valor_proposto: '', status: 'prospeccao' });
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  const handleDragStart = (event: DragStartEvent) => setActiveCard(event.active.data.current as Orcamento);

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;
    const id = active.id as string;
    const novoStatus = over.id as Orcamento['status'];
    const cardOriginal = orcamentos.find(o => o.id === id);
    if (!cardOriginal || cardOriginal.status === novoStatus) return;

    const backup = [...orcamentos];
    setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, status: novoStatus } : o));
    try {
      const updateData: Partial<Orcamento> = { status: novoStatus };
      const hoje = new Date().toISOString().split('T')[0];
      if (novoStatus === 'enviado') updateData.data_envio = hoje;
      if (novoStatus === 'retornou' || novoStatus === 'nao_retornou') updateData.data_retorno = hoje;
      const { error } = await supabase.from('crm_orcamentos').update(updateData).eq('id', id);
      if (error) throw error;
      toast.success('Status atualizado!');
    } catch (e: any) {
      setOrcamentos(backup);
      toast.error('Erro ao atualizar: ' + e.message);
    }
  };

  return (
    <div className="animate-in flex flex-col gap-6 h-full">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">CRM / <span className="font-bold">Funil</span></h1>
          <p className="text-muted text-sm mt-1">Gestão de leads, orçamentos e conversão.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalNovo(true)}><Plus size={18} /> Nova Prospecção</button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto flex-1 pb-4 custom-scrollbar">
          {COLUNAS.map(col => {
            const cards = orcamentos.filter(o => o.status === col.id);
            return (
              <DroppableColumn key={col.id} id={col.id} label={col.label} color={col.color} cards={cards}>
                {cards.map(card => <DraggableCard key={card.id} card={card} />)}
              </DroppableColumn>
            );
          })}
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeCard ? <KanbanCard card={activeCard} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* New Lead Modal */}
      <AnimatePresence>
        {modalNovo && (
          <div className="modal-overlay" onClick={() => setModalNovo(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal-content glass-panel" style={{ maxWidth: '550px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-serif text-xl text-white">Nova Prospecção</h3>
                <button className="btn-icon" onClick={() => setModalNovo(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSalvar} className="flex flex-col gap-4">
                <div className="input-group"><label>Nome do Prospect *</label><input className="dark-input" value={form.nome_prospect} onChange={e => setForm({ ...form, nome_prospect: e.target.value })} required /></div>
                <div className="input-group"><label>Telefone</label><input className="dark-input" value={form.telefone_prospect} onChange={e => setForm({ ...form, telefone_prospect: e.target.value })} /></div>
                <div className="input-group"><label>Descrição</label><textarea className="dark-textarea" rows={3} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="input-group"><label>Valor Proposto (R$)</label><input type="number" step="0.01" className="dark-input" value={form.valor_proposto} onChange={e => setForm({ ...form, valor_proposto: e.target.value })} /></div>
                <div className="input-group">
                  <label>Status Inicial</label>
                  <select className="dark-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Orcamento['status'] })}>
                    {COLUNAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" className="btn-outline" onClick={() => setModalNovo(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary">Registrar Lead</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
        </div>
      )}
    </div>
  );
}
