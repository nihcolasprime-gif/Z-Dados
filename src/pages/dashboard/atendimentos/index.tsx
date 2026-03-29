import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Plus, Search, ChevronRight, X,
  FileText, Paperclip, Clock, User, Trash2, Send,
  Briefcase, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface Atendimento {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  titulo: string;
  descricao: string;
  data: string;
  status: 'concluido' | 'em_andamento' | 'agendado';
  documentos: string[];
}

export default function AtendimentosPage() {
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<{ id: string, nome: string }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    cliente_id: '', 
    nome_avulso: '', // Para quem ainda não é cliente
    titulo: '', 
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    status: 'concluido' as 'concluido' | 'em_andamento' | 'agendado',
    cobrar_consulta: false,
    valor_consulta: '150,00'
  });

  useEffect(() => { carregarAtendimentos(); carregarClientes(); }, []);

  const carregarClientes = async () => {
    try {
      const { data } = await supabase.from('clientes').select('id, nome').order('nome');
      if (data) setClientes(data);
    } catch (e) { console.error(e); }
  };

  const carregarAtendimentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('atendimentos').select('*').order('data', { ascending: false });
      if (error) throw error;
      setAtendimentos(data || []);
    } catch (error: any) {
      toast.error('Falha ao carregar atendimentos: ' + error.message);
    } finally { setLoading(false); }
  };

  const handleSalvarAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!form.cliente_id && !form.nome_avulso) || !form.titulo) { 
      toast.error('Preencha o cliente (ou nome) e o título.'); return; 
    }
    try {
      const cliente = clientes.find(c => c.id === form.cliente_id);
      const nomeExibicao = cliente ? cliente.nome : form.nome_avulso;
      
      const { data: newAtend, error } = await supabase.from('atendimentos').insert([{
        cliente_id: form.cliente_id || null,
        cliente_nome: nomeExibicao,
        titulo: form.titulo,
        descricao: form.descricao,
        data: form.data,
        status: form.status,
        documentos: []
      }]).select().single();
      
      if (error) throw error;

      if (form.cobrar_consulta) {
        await supabase.from('transacoes').insert([{
          tipo: 'receita',
          valor: parseFloat(form.valor_consulta.replace(',', '.')),
          data: form.data,
          entidade: `Consulta: ${nomeExibicao}`,
          status: 'recebido',
          concretizado: true,
          referencia: `ATEND-${newAtend.id.substring(0,4)}`,
          escritorio_id: 'ESC-001'
        }]);
      }

      toast.success('Atendimento e fluxo financeiro registrados!');
      setModalNovo(false);
      setForm({ cliente_id: '', nome_avulso: '', titulo: '', descricao: '', data: new Date().toISOString().split('T')[0], status: 'concluido', cobrar_consulta: false, valor_consulta: '150,00' });
      carregarAtendimentos();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const moverParaCRM = (atend: Atendimento) => {
    navigate('/dashboard/crm', { 
      state: { 
        lead: { 
          nome_prospect: atend.cliente_nome, 
          descricao: atend.descricao,
          status: 'prospeccao'
        } 
      } 
    });
  };

  const filtrados = atendimentos.filter(a =>
    a.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    a.titulo?.toLowerCase().includes(busca.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido': return <span className="badge badge-success">Concluído</span>;
      case 'em_andamento': return <span className="badge badge-warning">Em Andamento</span>;
      case 'agendado': return <span className="badge badge-neutral">Agendado</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="animate-in flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">Atendi<span className="font-bold">mentos</span></h1>
          <p className="text-muted text-sm mt-1">Histórico de interações e gestão de documentos por cliente.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalNovo(true)}><Plus size={18} /> Novo Registro</button>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 flex gap-3">
        <div className="search-bar flex-1">
          <Search size={18} />
          <input type="text" placeholder="Buscar por cliente ou título..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {filtrados.map(atend => (
          <motion.div
            key={atend.id} layout className="glass-panel overflow-hidden cursor-pointer"
            style={{ borderLeft: '3px solid rgba(255,255,255,0.2)' }}
            onClick={() => setExpandedId(expandedId === atend.id ? null : atend.id)}
          >
            <div className="p-5 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <User size={22} className="text-white/50" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{atend.cliente_nome}</h3>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <span className="text-muted text-xs flex items-center gap-1"><Clock size={12} /> {new Date(atend.data).toLocaleDateString('pt-BR')}</span>
                    {getStatusBadge(atend.status)}
                    <span className="text-muted text-xs">{atend.titulo}</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-muted flex-shrink-0" style={{ transform: expandedId === atend.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>

            <AnimatePresence>
              {expandedId === atend.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <div className="px-5 pb-5 pt-0 border-t border-white/5">
                    <p className="text-white/60 text-sm mt-4 leading-relaxed">{atend.descricao || 'Sem descrição detalhada.'}</p>
                    <div className="mt-4">
                      <h4 className="text-sm text-white/70 flex items-center gap-1 mb-3"><Paperclip size={14} /> Documentos</h4>
                      <div className="flex flex-wrap gap-2">
                        {(atend.documentos || []).map((doc, idx) => (
                          <span key={idx} className="badge badge-neutral gap-1"><FileText size={12} /> {doc}</span>
                        ))}
                        <button className="btn-outline text-xs py-1"><Plus size={12} /> Anexar</button>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); moverParaCRM(atend); }} className="btn-primary text-xs py-1.5"><Briefcase size={14} /> Mover p/ CRM</button>
                      <button className="btn-outline text-xs py-1.5"><Trash2 size={14} className="text-red-400" /> Excluir</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {filtrados.length === 0 && !loading && (
          <div className="text-center py-16">
            <CheckSquare size={48} className="text-muted mx-auto mb-3 opacity-20" />
            <p className="text-muted">Nenhum atendimento registrado.</p>
          </div>
        )}
      </div>

      {/* New Modal */}
      <AnimatePresence>
        {modalNovo && (
          <div className="modal-overlay" onClick={() => setModalNovo(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal-content glass-panel" style={{ maxWidth: '600px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-serif text-xl text-white flex items-center gap-2"><CheckSquare className="text-white/60" /> Novo Atendimento</h2>
                <button className="btn-icon" onClick={() => setModalNovo(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSalvarAtendimento} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-group">
                    <label>Cliente Cadastrado</label>
                    <select className="dark-select" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value, nome_avulso: '' })}>
                      <option value="">Selecione se já existir</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Ou Nome do Novo Prospecto</label>
                    <input className="dark-input" placeholder="Se ainda não for cliente..." value={form.nome_avulso} onChange={e => setForm({ ...form, nome_avulso: e.target.value, cliente_id: '' })} />
                  </div>
                </div>
                <div className="input-group"><label>Título do Atendimento *</label><input className="dark-input" placeholder="Ex: Consulta sobre Inventário" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group"><label>Data *</label><input type="date" className="dark-input" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} required /></div>
                  <div className="input-group">
                    <label>Status</label>
                    <select className="dark-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                      <option value="concluido">Concluído</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="agendado">Agendado</option>
                    </select>
                  </div>
                </div>
                <div className="input-group"><label>Notas do Atendimento (O que foi tratado)</label><textarea className="dark-textarea" rows={4} placeholder="Digite aqui o parecer inicial..." value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                   <div className="flex items-center gap-2">
                     <input type="checkbox" id="cobrar" checked={form.cobrar_consulta} onChange={e => setForm({...form, cobrar_consulta: e.target.checked})} className="w-5 h-5 accent-secondary" />
                     <label htmlFor="cobrar" className="text-sm text-white font-medium cursor-pointer">Cobrar Taxa de Consulta?</label>
                   </div>
                   {form.cobrar_consulta && (
                     <div className="flex items-center gap-2">
                       <span className="text-xs text-muted">R$</span>
                       <input className="dark-input w-24 text-right" value={form.valor_consulta} onChange={e => setForm({...form, valor_consulta: e.target.value})} />
                     </div>
                   )}
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" className="btn-outline" onClick={() => setModalNovo(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary"><Send size={16} /> Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
