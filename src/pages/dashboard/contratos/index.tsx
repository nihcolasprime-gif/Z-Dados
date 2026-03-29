import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, ChevronRight, Trash2, Edit2, RefreshCw, X, FileText, 
  Gavel, Download, UploadCloud
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { tarefaService, Tarefa as ITarefa } from '../../../services/tarefaService';
import { financeiroService } from '../../../services/financeiroService';
import { useAuth } from '../../../contexts/AuthContext';
import { generateTransactionsForContract } from '../../../lib/transactionsManager';
import { generateContratoHTML, generateProcuracaoHTML } from '../../../services/documentGenerator';
import { arquivoService, ArquivoVault } from '../../../services/arquivoService';

interface ColaboradorDistribuicao { id: string; nome: string; percentual: number; }

interface Contrato {
  id: string; numero: string; cliente_id: string; cliente_nome: string;
  valor_total: number; valor_causa?: number; natureza?: string;
  tribunal?: string; vara?: string;
  status: 'ativo' | 'concluido' | 'suspenso' | 'inadimplente';
  data_inicio: string; data_fim?: string; finalidade?: string;
  forma_pagamento?: string; qtd_parcelas?: number; valor_entrada?: number;
  banco_entrada?: string; colaboradores_distribuicao?: ColaboradorDistribuicao[];
}

interface Parcela {
  id: string; data_prevista: string; data_pagamento: string | null;
  valor: number; status: 'pendente' | 'pago' | 'atrasado';
}

const NATUREZAS = [
  'Trabalhista Reclamante', 'Trabalhista Reclamada', 'Cível', 'Previdenciário',
  'Família', 'Empresarial', 'Tributário', 'Administrativo', 'Outro'
];

export default function ContratosPage() {
  const { escritorioId } = useAuth();
  const location = useLocation();
  const [bancos, setBancos] = useState<any[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [busca, setBusca] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'pagamentos' | 'prazos' | 'arquivos'>('pagamentos');
  const [modalNovo, setModalNovo] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    cliente_id: '', numero: '', finalidade: '', natureza: 'Cível',
    valor_causa: '', tribunal: '', vara: '',
    data_inicio: new Date().toISOString().split('T')[0], data_fim: '',
    data_entrada: new Date().toISOString().split('T')[0],
    data_primeira_parcela: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    valor_total: '', forma_pagamento: 'a_vista',
    tem_entrada: false, valor_entrada: '', qtd_parcelas: '1',
    meio_pagamento: 'pix', local_pagamento: '',
    imposto_percent: '5',
    distribuicao: [] as { id: string, nome: string, percentual: number }[]
  });

  const [clientes, setClientes] = useState<{ id: string, nome: string }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [tarefas, setTarefas] = useState<ITarefa[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoVault[]>([]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);
  const [loadingArquivos, setLoadingArquivos] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [novaTarefaForm, setNovaTarefaForm] = useState({ titulo: '', data: '', prioridade: 'media' as any });

  const applyMask = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue || parseInt(cleanValue) === 0) return "";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(parseFloat(cleanValue) / 100);
  };

  const parseCurrency = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const carregarDados = useCallback(async () => {
    try {
      const [cData, bData] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        financeiroService.fetchContasBancarias()
      ]);
      if (cData.data) setClientes(cData.data);
      if (bData) setBancos(bData);
    } catch (e) { console.error(e); }
  }, []);

  const carregarContratos = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('processos').select('*').order('data_inicio', { ascending: false });
      if (error) throw error;
      setContratos(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar processos: ' + error.message);
    }
  }, []);

  useEffect(() => { 
    if (escritorioId) {
      carregarContratos(); 
      carregarDados(); 
    }
  }, [carregarContratos, carregarDados, escritorioId]);

  useEffect(() => {
    if (location.state?.lead && modalNovo) {
      const lead = location.state.lead;
      setForm(prev => ({
        ...prev,
        finalidade: lead.descricao || '',
        valor_total: lead.valor_proposto ? applyMask((lead.valor_proposto * 100).toString()) : '',
        numero: `LEAD-${lead.id.substring(0,4)}`
      }));
    }
  }, [location.state, modalNovo]);

  const carregarParcelas = async (id: string) => {
    try {
      const { data, error } = await supabase.from('parcelas_pagamento').select('*').eq('contrato_id', id).order('data_prevista', { ascending: true });
      if (error) throw error;
      setParcelas(data || []);
    } catch (e: any) { toast.error(e.message); }
  };

  const carregarTarefas = async (id: string) => {
    setLoadingTarefas(true);
    try {
      const data = await tarefaService.fetchTarefas({ vinculo_id: id, vinculo_tipo: 'processo' });
      setTarefas(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingTarefas(false); }
  };

  const carregarArquivos = async (id: string) => {
    setLoadingArquivos(true);
    try {
      const data = await arquivoService.listarArquivos(id);
      setArquivos(data);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingArquivos(false); }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setParcelas([]); setTarefas([]); setArquivos([]); return; }
    setExpandedId(id); setActiveSubTab('pagamentos');
    carregarParcelas(id);
    carregarTarefas(id);
    carregarArquivos(id);
  };

  const handleUploadArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !expandedId || !escritorioId) return;
    setUploading(true);
    try {
      await arquivoService.uploadArquivo(file, expandedId, 'processo', escritorioId);
      toast.success('Arquivo anexado!');
      carregarArquivos(expandedId);
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const handleExcluirArquivo = async (id: string, url: string) => {
    if (!confirm('Excluir este documento?') || !expandedId) return;
    try {
      await arquivoService.excluirArquivo(id, url);
      toast.success('Removido.');
      carregarArquivos(expandedId);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleCriarTarefa = async () => {
    if (!novaTarefaForm.titulo || !expandedId) return;
    try {
      await tarefaService.salvarTarefa({
        titulo: novaTarefaForm.titulo,
        data_prazo: novaTarefaForm.data || null,
        prioridade: novaTarefaForm.prioridade,
        status: 'pendente',
        vinculo_id: expandedId,
        vinculo_tipo: 'processo'
      });
      toast.success('Agendado!');
      setNovaTarefaForm({ titulo: '', data: '', prioridade: 'media' });
      carregarTarefas(expandedId);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSalvarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id || !form.numero || !form.valor_total || !escritorioId) {
      toast.error('Preencha os campos obrigatórios.'); return;
    }
    try {
      const cliente = clientes.find(c => c.id === form.cliente_id);
      const valTotal = parseCurrency(form.valor_total);
      const payload = {
        cliente_id: form.cliente_id, 
        cliente_nome: cliente?.nome || '', 
        numero: form.numero,
        finalidade: form.finalidade, 
        natureza: form.natureza,
        valor_total: valTotal,
        valor_causa: parseCurrency(form.valor_causa),
        tribunal: form.tribunal, 
        vara: form.vara,
        status: 'ativo', 
        data_inicio: form.data_inicio,
        forma_pagamento: form.forma_pagamento, 
        qtd_parcelas: parseInt(form.qtd_parcelas) || 1,
        colaboradores_distribuicao: form.distribuicao,
        escritorio_id: escritorioId
      };

      let contratoId = editandoId;
      if (editandoId) {
        await supabase.from('processos').update(payload).eq('id', editandoId);
      } else {
        const { data, error } = await supabase.from('processos').insert([payload]).select().single();
        if (error) throw error;
        contratoId = data.id;
      }

      if (!editandoId && contratoId) {
         await generateTransactionsForContract({
            contratoId: contratoId, 
            numeroContrato: form.numero, 
            clienteNome: cliente?.nome || '',
            valorTotal: valTotal, 
            impostoPercent: parseFloat(form.imposto_percent), 
            colaboradores: form.distribuicao,
            formaPagamento: form.forma_pagamento, 
            qtdParcelas: parseInt(form.qtd_parcelas),
            dataInicio: form.data_inicio, 
            temEntrada: form.tem_entrada, 
            valorEntrada: parseCurrency(form.valor_entrada),
            meioPagamento: form.meio_pagamento, 
            bancoEntrada: form.local_pagamento, 
            parcelasIds: []
         });
      }
      
      toast.success('Sucesso!'); setModalNovo(false); carregarContratos();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja excluir este processo?')) return;
    try {
      await supabase.from('processos').delete().eq('id', id);
      toast.success('Excluído'); carregarContratos();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="animate-in flex flex-col gap-6">
      <div className="page-header">
        <h1 className="text-3xl font-light text-white tracking-widest uppercase">Processos & <span className="font-bold text-secondary">Contratos</span></h1>
        <div className="flex gap-2">
            <button className="btn-outline" onClick={() => carregarContratos()}><RefreshCw size={16} /></button>
            <button className="btn-primary" onClick={() => { setEditandoId(null); setModalNovo(true); }}><Plus size={18} /> Novo Contrato</button>
        </div>
      </div>

      <div className="glass-panel p-4 flex gap-4"><Search size={18} className="text-muted mt-2" /><input className="bg-transparent flex-1 text-white border-none focus:ring-0" placeholder="Buscar por cliente, número ou objeto..." value={busca} onChange={e => setBusca(e.target.value)} /></div>

      <div className="glass-panel overflow-hidden">
        <table className="dark-table">
          <thead><tr><th>Identificação</th><th>Natureza</th><th>Local/Vara</th><th style={{ textAlign: 'right' }}>Honorários</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(contratos || []).filter(c => c.cliente_nome?.toLowerCase().includes(busca.toLowerCase())).map(c => (
              <React.Fragment key={c.id}>
                <tr className="cursor-pointer" onClick={() => toggleExpand(c.id)}>
                  <td><div className="text-white font-medium">#{c.numero}</div><div className="text-xs text-muted">{c.cliente_nome}</div></td>
                  <td><span className="text-[10px] bg-white/5 px-2 py-1 rounded text-white/60">{c.natureza || 'Cível'}</span></td>
                  <td><div className="text-xs text-white/60">{c.tribunal || '-'}</div><div className="text-[10px] text-muted">{c.vara || '-'}</div></td>
                  <td style={{ textAlign: 'right' }} className="text-white font-bold">R$ {c.valor_total?.toLocaleString('pt-BR')}</td>
                  <td><span className="badge badge-success">{c.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex gap-2 justify-end">
                      <button onClick={(e) => { e.stopPropagation(); setEditandoId(c.id); setModalNovo(true); }} className="text-white/20 hover:text-white transition-colors"><Edit2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleExcluir(c.id); }} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                      <ChevronRight size={18} className="text-muted" style={{ transform: expandedId === c.id ? 'rotate(90deg)' : 'none' }} />
                    </div>
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr>
                    <td colSpan={6} className="bg-white/[0.01] p-6 border-t border-white/5">
                      <div className="flex gap-4 mb-6">
                        <button onClick={() => setActiveSubTab('pagamentos')} className={activeSubTab === 'pagamentos' ? 'text-white border-b-2 border-white pb-1 text-sm font-bold' : 'text-white/40 pb-1 text-sm'}>Financeiro</button>
                        <button onClick={() => setActiveSubTab('prazos')} className={activeSubTab === 'prazos' ? 'text-white border-b-2 border-white pb-1 text-sm font-bold' : 'text-white/40 pb-1 text-sm'}>Prazos e Audiências</button>
                        <button onClick={() => setActiveSubTab('arquivos')} className={activeSubTab === 'arquivos' ? 'text-white border-b-2 border-white pb-1 text-sm font-bold' : 'text-white/40 pb-1 text-sm'}>Documentos e Provas</button>
                      </div>
                      {activeSubTab === 'prazos' ? (
                        <div className="space-y-4">
                           <div className="flex gap-2 bg-white/5 p-3 rounded-lg border border-white/10">
                              <input className="flex-1 dark-input text-xs" placeholder="Novo compromisso..." value={novaTarefaForm.titulo} onChange={e => setNovaTarefaForm({...novaTarefaForm, titulo: e.target.value})} />
                              <input type="date" className="dark-input text-xs w-40" value={novaTarefaForm.data} onChange={e => setNovaTarefaForm({...novaTarefaForm, data: e.target.value})} />
                              <button onClick={handleCriarTarefa} className="btn-primary px-4 text-xs">Agendar</button>
                           </div>
                           <div className="space-y-2">
                             {loadingTarefas ? <p className="text-xs text-muted">Carregando...</p> : tarefas.map(t => (
                               <div key={t.id} className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                                 <div className="flex items-center gap-2"><Gavel size={14} className="text-secondary" /><span className="text-sm text-white/80">{t.titulo}</span></div>
                                 <span className="text-[10px] text-muted">{t.data_prazo ? new Date(t.data_prazo).toLocaleDateString('pt-BR') : 'S/ Data'}</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      ) : activeSubTab === 'arquivos' ? (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-dashed border-white/20">
                             <div className="flex items-center gap-3">
                               <UploadCloud size={24} className="text-muted" />
                               <div>
                                 <p className="text-sm text-white">Upload de Documentos</p>
                                 <p className="text-[10px] text-muted uppercase">PDF, PNG, JPG até 10MB</p>
                               </div>
                             </div>
                             <label className="btn-primary flex items-center gap-2 cursor-pointer py-1 px-4 text-xs">
                               <Plus size={14} /> {uploading ? 'Enviando...' : 'Selecionar'}
                               <input type="file" className="hidden" onChange={handleUploadArquivo} disabled={uploading} />
                             </label>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {loadingArquivos ? <p className="text-xs text-muted">Buscando cofre...</p> : arquivos.map(arq => (
                               <div key={arq.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 group">
                                 <div className="flex items-center gap-3">
                                   <div className="p-2 bg-secondary/10 rounded"><FileText size={16} className="text-secondary" /></div>
                                   <div>
                                     <p className="text-xs text-white truncate max-w-[150px]">{arq.nome}</p>
                                     <p className="text-[10px] text-muted lowercase">{arq.formato} • {new Date(arq.created_at!).toLocaleDateString('pt-BR')}</p>
                                   </div>
                                 </div>
                                 <div className="flex gap-2">
                                   <a href={arq.url} target="_blank" rel="noreferrer" className="p-2 text-white/20 hover:text-white transition-colors"><Download size={14} /></a>
                                   <button onClick={() => handleExcluirArquivo(arq.id, arq.url)} className="p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                 </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="glass-panel p-4 text-center"><p className="text-[10px] text-muted uppercase tracking-tighter">Valor Honorários</p><p className="text-white font-bold text-lg">R$ {c.valor_total?.toLocaleString('pt-BR')}</p></div>
                            <div className="glass-panel p-4 text-center"><p className="text-[10px] text-muted uppercase tracking-tighter">Valor Causa</p><p className="text-white font-bold text-lg">R$ {c.valor_causa?.toLocaleString('pt-BR') || '---'}</p></div>
                          </div>
                          <div className="glass-panel overflow-hidden">
                            <table className="dark-table text-[10px]">
                              <thead><tr><th>Vencimento</th><th>Valor</th><th>Status</th><th>Pagamento</th></tr></thead>
                              <tbody>
                                {parcelas.map(p => (
                                  <tr key={p.id}>
                                    <td>{new Date(p.data_prevista).toLocaleDateString('pt-BR')}</td>
                                    <td className="font-bold text-white">R$ {p.valor.toLocaleString('pt-BR')}</td>
                                    <td><span className={p.status === 'pago' ? 'text-green-400' : 'text-yellow-400'}>{p.status.toUpperCase()}</span></td>
                                    <td className="text-muted">{p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString('pt-BR') : '--'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => {
                                const html = generateContratoHTML({ nome: c.cliente_nome } as any, { numero: c.numero, valor_total: c.valor_total, parcelas: 1 } as any);
                                const win = window.open('', '_blank'); win?.document.write(html); win?.document.close();
                            }} className="btn-outline flex-1 text-[10px] py-2 flex items-center justify-center gap-1"><FileText size={12} /> Contrato PDF</button>
                            <button onClick={() => {
                                const html = generateProcuracaoHTML({ nome: c.cliente_nome } as any, { numero: c.numero, valor_total: c.valor_total, parcelas: 1 } as any);
                                const win = window.open('', '_blank'); win?.document.write(html); win?.document.close();
                            }} className="btn-outline flex-1 text-[10px] py-2 flex items-center justify-center gap-1"><FileText size={12} /> Procuração PDF</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modalNovo && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-content glass-panel w-full max-w-4xl p-8 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6"><h2 className="text-2xl text-white font-serif uppercase tracking-widest">{editandoId ? 'Editar Processo' : 'Novo Processo'}</h2><button onClick={() => setModalNovo(false)}><X size={20} className="text-white/40" /></button></div>
              <form onSubmit={handleSalvarContrato} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-4">
                   <div className="input-group"><label>Cliente *</label>
                      <select className="dark-select" value={form.cliente_id} onChange={e => setForm({...form, cliente_id: e.target.value})} required>
                         <option value="">Selecione o Cliente</option>{clientes.map(cl => <option key={cl.id} value={cl.id}>{cl.nome}</option>)}
                      </select>
                   </div>
                   <div className="input-group"><label>Número do Processo / Identificador *</label><input className="dark-input" value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} required placeholder="Ex: 5001234-56.2024.8.21.0001" /></div>
                   <div className="input-group"><label>Natureza da Ação</label>
                      <select className="dark-select" value={form.natureza} onChange={e => setForm({...form, natureza: e.target.value})}>
                         {NATUREZAS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="input-group"><label>Tribunal / Orgão</label><input className="dark-input" placeholder="Ex: TJRS, Justiça Federal" value={form.tribunal} onChange={e => setForm({...form, tribunal: e.target.value})} /></div>
                   <div className="input-group"><label>Vara / Comarca</label><input className="dark-input" placeholder="Ex: 1ª Vara Cível de Porto Alegre" value={form.vara} onChange={e => setForm({...form, vara: e.target.value})} /></div>
                   <div className="grid grid-cols-2 gap-2">
                       <div className="input-group"><label>Honorários (R$)</label><input className="dark-input" value={form.valor_total} onChange={e => setForm({...form, valor_total: applyMask(e.target.value)})} required /></div>
                       <div className="input-group"><label>Conta p/ Recebimento</label>
                          <select className="dark-select" value={form.local_pagamento} onChange={e => setForm({...form, local_pagamento: e.target.value})}>
                             <option value="">Selecione o Banco</option>
                             {bancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                          </select>
                       </div>
                   </div>
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-white/5">
                   <button type="button" onClick={() => setModalNovo(false)} className="btn-outline px-6">Descartar</button>
                   <button type="submit" className="btn-primary px-10">Pulsar Contrato na Teia</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
