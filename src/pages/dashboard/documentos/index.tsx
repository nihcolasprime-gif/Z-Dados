import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Plus, Trash2, Edit2, X, 
  Printer, FileSignature, Briefcase, User, Scale 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { documentoService } from '../../../services/documentoService';
import { DocumentoTemplate, Cliente, Contrato, Escritorio } from '../../../models';

export default function DocumentosPage() {
  const { escritorioId } = useAuth();
  const [templates, setTemplates] = useState<DocumentoTemplate[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [processos, setProcessos] = useState<Contrato[]>([]);
  const [escritorio, setEscritorio] = useState<Escritorio | null>(null);
  
  // Modais e Estados de Seleção
  const [modalNovo, setModalNovo] = useState(false);
  const [modalGerar, setModalGerar] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState<DocumentoTemplate | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  // Seleção de Dados para Gerar
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedProcessoId, setSelectedProcessoId] = useState('');

  // Formulário de Template
  const [form, setForm] = useState({
    nome: '', tipo: 'procuracao' as any,
    conteudo_html: ''
  });

  const carregarTudo = useCallback(async () => {
    if (!escritorioId) return;
    try {
      const [t, c, p, e] = await Promise.all([
        supabase.from('documento_templates').select('*').eq('escritorio_id', escritorioId),
        supabase.from('clientes').select('*').eq('escritorio_id', escritorioId),
        supabase.from('processos').select('*').eq('escritorio_id', escritorioId),
        supabase.from('escritorios').select('*').eq('id', escritorioId).maybeSingle()
      ]);
      if (t.data) setTemplates(t.data);
      if (c.data) setClientes(c.data);
      if (p.data) setProcessos(p.data);
      if (e.data) setEscritorio(e.data);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Falha ao carregar central de documentos: ' + error.message);
    }
  }, [escritorioId]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  const handleSalvarTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escritorioId) return;
    try {
      if (editandoId) {
        const { error } = await supabase.from('documento_templates').update(form).eq('id', editandoId);
        if (error) throw error;
        toast.success('Modelo atualizado!');
      } else {
        const { error } = await supabase.from('documento_templates').insert([{
          ...form, escritorio_id: escritorioId
        }]);
        if (error) throw error;
        toast.success('Modelo salvo com sucesso!');
      }
      setModalNovo(false);
      setEditandoId(null);
      setForm({ nome: '', tipo: 'procuracao', conteudo_html: '' });
      carregarTudo();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleExcluirTemplate = async (id: string) => {
    if (!confirm('Deseja excluir este modelo permanentemente?')) return;
    try {
      const { error } = await supabase.from('documento_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Modelo removido.');
      carregarTudo();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleGerarPdf = () => {
    if (!templateSelecionado || !selectedClienteId) {
      toast.error('Selecione um cliente para prosseguir.');
      return;
    }

    const cliente = clientes.find(c => c.id === selectedClienteId);
    const processo = processos.find(p => p.id === selectedProcessoId);

    if (!cliente) return;

    const htmlPreenchido = documentoService.preencherTemplate(
      templateSelecionado.conteudo_html,
      cliente,
      processo,
      escritorio || undefined
    );

    const pdfContent = documentoService.gerarPreviewPdf(htmlPreenchido, escritorio || undefined);
    
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(pdfContent);
      win.document.close();
    }
    setModalGerar(false);
  };

  return (
    <div className="animate-in flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest uppercase">Fábrica de <span className="font-bold text-secondary">Documentos</span></h1>
          <p className="text-muted text-sm mt-1 decoration-secondary underline-offset-4 decoration-dotted underline">
            Geração de petições, procurações e contratos com preenchimento automático.
          </p>
        </div>
        <button onClick={() => { setEditandoId(null); setForm({ nome: '', tipo: 'procuracao', conteudo_html: '' }); setModalNovo(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Modelo
        </button>
      </div>

      <div className="glass-panel p-4 flex gap-4">
        <div className="text-muted mt-2"><Scale size={18} /></div>
        <input 
          className="bg-transparent flex-1 text-white border-none focus:ring-0" 
          placeholder="Buscar modelos por nome..." 
          onChange={e => {
            const val = e.target.value.toLowerCase();
            if (!val) { carregarTudo(); return; }
            setTemplates(prev => prev.filter(t => t.nome.toLowerCase().includes(val)));
          }} 
        />
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 glass-panel">
            <FileText size={48} className="text-muted mx-auto mb-4 opacity-10" />
            <h3 className="text-white font-serif text-lg">Sem Modelos Cadastrados</h3>
            <button onClick={() => setModalNovo(true)} className="btn-outline mt-6">Criar Primeiro Modelo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
            <motion.div key={t.id} layout className="glass-panel p-6 border-t-4 border-secondary/50 hover:border-secondary transition-all group flex flex-col justify-between h-[200px]">
               <div>
                  <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] text-muted uppercase font-bold tracking-widest">{t.tipo}</span>
                      <div className="flex gap-2">
                         <button onClick={(e) => { e.stopPropagation(); setEditandoId(t.id); setForm({ nome: t.nome, tipo: t.tipo as any, conteudo_html: t.conteudo_html }); setModalNovo(true); }} className="text-white/20 hover:text-white transition-colors"><Edit2 size={16} /></button>
                         <button onClick={(e) => { e.stopPropagation(); handleExcluirTemplate(t.id); }} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                      </div>
                  </div>
                  <h3 className="text-white font-serif text-lg group-hover:text-secondary transition-colors">{t.nome}</h3>
               </div>
               <button 
                  onClick={() => { setTemplateSelecionado(t); setModalGerar(true); }}
                  className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2 mt-4"
                >
                  <FileSignature size={14} /> Gerar para Cliente
                </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL NOVO TEMPLATE */}
      <AnimatePresence>
        {modalNovo && (
          <div className="modal-overlay">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-content glass-panel w-full max-w-4xl p-8 overflow-y-auto max-h-[90vh]">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl text-white font-serif uppercase tracking-widest">{editandoId ? 'Editar Modelo' : 'Novo Modelo Estratégico'}</h2>
                    <button onClick={() => { setModalNovo(false); setEditandoId(null); setForm({ nome: '', tipo: 'procuracao', conteudo_html: '' }); }} className="text-muted"><X size={20} /></button>
                 </div>
                <form onSubmit={handleSalvarTemplate} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="input-group">
                         <label>Nome do Modelo</label>
                         <input className="dark-input" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                      </div>
                      <div className="input-group">
                         <label>Tipo de Documento</label>
                         <select className="dark-select" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value as any})}>
                            <option value="procuracao">Procuração</option>
                            <option value="contrato">Contrato de Honorários</option>
                            <option value="peticao">Petição / Outros</option>
                         </select>
                      </div>
                   </div>
                   <div className="input-group">
                      <label className="flex justify-between items-center">
                        Conteúdo (Use tags CLIENTE_NOME, CLIENTE_CPF entre chaves duplas)
                        <span className="text-[10px] text-secondary">HTML Suportado</span>
                      </label>
                      <textarea className="dark-textarea font-mono text-xs leading-relaxed" rows={15} value={form.conteudo_html} onChange={e => setForm({...form, conteudo_html: e.target.value})} placeholder="Eu, {{cliente_nome}}..."/>
                   </div>
                   <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                      <button type="button" onClick={() => { setModalNovo(false); setEditandoId(null); }} className="btn-outline px-6">Cancelar</button>
                      <button type="submit" className="btn-primary px-10">Salvar Modelo</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL GERAR DOCUMENTO */}
      <AnimatePresence>
         {modalGerar && (
           <div className="modal-overlay">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-content glass-panel w-full max-w-lg p-8">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-lg text-white font-serif uppercase tracking-widest">{templateSelecionado?.nome}</h2>
                    <button onClick={() => setModalGerar(false)} className="text-muted"><X size={20} /></button>
                 </div>
                 <div className="space-y-6">
                    <div className="input-group">
                        <label className="flex items-center gap-2"><User size={14} className="text-secondary" /> Selecione o Cliente</label>
                        <select className="dark-select" value={selectedClienteId} onChange={e => setSelectedClienteId(e.target.value)}>
                           <option value="">Buscar cliente...</option>
                           {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="flex items-center gap-2"><Briefcase size={14} className="text-secondary" /> Selecione o Processo (Opcional)</label>
                        <select className="dark-select" value={selectedProcessoId} onChange={e => setSelectedProcessoId(e.target.value)}>
                           <option value="">Vincular identificador...</option>
                           {processos.filter(p => p.cliente_id === selectedClienteId).map(p => <option key={p.id} value={p.id}>#{p.numero}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                       <button onClick={() => setModalGerar(false)} className="btn-outline px-6">Cancelar</button>
                       <button onClick={handleGerarPdf} className="btn-primary px-10 flex items-center gap-2">
                         <Printer size={16} /> Gerar PDF Final
                       </button>
                    </div>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
