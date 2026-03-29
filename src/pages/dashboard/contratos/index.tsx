import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronRight, Trash2, Edit2, RefreshCw, X, FileText } from 'lucide-react';
import { parseCurrencyToNumber } from '../../../utils/format';
import { addMonths } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { generateTransactionsForContract } from '../../../lib/transactionsManager';
import { generateContratoHTML, generateProcuracaoHTML } from '../../../services/documentGenerator';

interface ColaboradorDistribuicao { id: string; nome: string; percentual: number; }

interface Contrato {
  id: string; numero: string; cliente_id: string; cliente_nome: string;
  valor_total: number; status: 'ativo' | 'concluido' | 'suspenso' | 'inadimplente';
  data_inicio: string; data_fim?: string; finalidade?: string;
  forma_pagamento?: string; qtd_parcelas?: number; valor_entrada?: number;
  banco_entrada?: string; colaboradores_distribuicao?: ColaboradorDistribuicao[];
}

interface Parcela {
  id: string; data_prevista: string; data_pagamento: string | null;
  valor: number; status: 'pendente' | 'pago' | 'atrasado';
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [clientes, setClientes] = useState<{ id: string, nome: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string, nome: string }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loadingParcelas, setLoadingParcelas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalNovo, setModalNovo] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    cliente_id: '', numero: '', finalidade: '',
    data_inicio: new Date().toISOString().split('T')[0], data_fim: '',
    data_entrada: new Date().toISOString().split('T')[0],
    data_primeira_parcela: addMonths(new Date(), 1).toISOString().split('T')[0],
    valor_total: '', forma_pagamento: 'a_vista',
    tem_entrada: false, valor_entrada: '', qtd_parcelas: '1',
    meio_pagamento: 'pix', local_pagamento: 'bb',
    imposto_percent: '5',
    distribuicao: [] as { id: string, nome: string, percentual: number }[]
  });

  const applyMask = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue || parseInt(cleanValue) === 0) return "";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(parseFloat(cleanValue) / 100);
  };

  const carregarDados = useCallback(async () => {
    try {
      const { data: cData } = await supabase.from('clientes').select('*').order('nome');
      if (cData) setClientes(cData);
      const { data: sData } = await supabase.from('colaboradores').select('id, nome').order('nome');
      if (sData) setStaff(sData);
    } catch (e) { console.error(e); }
  }, []);

  const carregarContratos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('processos')
        .select('id, numero, cliente_id, cliente_nome, valor_total, status, data_inicio, data_fim, finalidade, forma_pagamento, qtd_parcelas')
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      setContratos(data || []);
    } catch (error: any) {
      toast.error('Falha ao carregar contratos: ' + error.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregarContratos(); carregarDados(); }, [carregarContratos, carregarDados]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setParcelas([]); return; }
    setExpandedId(id); setLoadingParcelas(true);
    try {
      const { data, error } = await supabase.from('parcelas_pagamento').select('*').eq('contrato_id', id).order('data_prevista', { ascending: true });
      if (error) throw error;
      setParcelas(data || []);
    } catch (error: any) { toast.error('Erro: ' + error.message); }
    finally { setLoadingParcelas(false); }
  };

  const marcarComoPago = async (parcelaId: string) => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      await supabase.from('transacoes').update({ status: 'pago', concretizado: true, data_pagamento: hoje }).eq('parcela_origem_id', parcelaId);
      await supabase.from('parcelas_pagamento').update({ status: 'pago', data_pagamento: hoje }).eq('id', parcelaId);
      toast.success('Parcela marcada como paga!');
      setParcelas(parcelas.map(p => p.id === parcelaId ? { ...p, status: 'pago', data_pagamento: hoje } : p));
      carregarContratos();
    } catch (error: any) { toast.error('Erro: ' + error.message); }
  };

  const handleExcluirContrato = async (id: string, numero: string) => {
    if (!confirm(`Excluir o contrato #${numero}? Parcelas e transações serão removidas.`)) return;
    try {
      await supabase.from('transacoes').delete().like('referencia', `${numero}%`);
      const { error } = await supabase.from('processos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Contrato excluído!'); carregarContratos();
    } catch (error: any) { toast.error('Erro: ' + error.message); }
  };

  const handleEditarContrato = async (contrato: Contrato) => {
    try {
      const { data: cFull } = await supabase.from('processos').select('*').eq('id', contrato.id).single();
      if (!cFull) throw new Error('Contrato não encontrado.');
      setForm({
        cliente_id: cFull.cliente_id, numero: cFull.numero, finalidade: cFull.finalidade || '',
        data_inicio: cFull.data_inicio, data_fim: cFull.data_fim || '',
        data_entrada: (cFull as any).data_entrada || cFull.data_inicio,
        data_primeira_parcela: (cFull as any).data_primeira_parcela || addMonths(new Date(cFull.data_inicio), 1).toISOString().split('T')[0],
        valor_total: applyMask((cFull.valor_total * 100).toString()),
        forma_pagamento: cFull.forma_pagamento || 'a_vista',
        tem_entrada: (cFull as any).tem_entrada || false,
        valor_entrada: (cFull as any).valor_entrada ? applyMask(((cFull as any).valor_entrada * 100).toString()) : '',
        qtd_parcelas: (cFull.qtd_parcelas || 1).toString(),
        meio_pagamento: (cFull as any).meio_pagamento || 'pix',
        local_pagamento: cFull.banco_entrada || 'bb',
        imposto_percent: ((cFull as any).imposto_percentual || 5).toString(),
        distribuicao: cFull.colaboradores_distribuicao || []
      });
      setEditandoId(cFull.id); setModalNovo(true);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const gerarPDF = async (contrato: Contrato) => {
    try {
      const { data: cliente, error } = await supabase.from('clientes').select('*').eq('id', contrato.cliente_id).single();
      if (error || !cliente) { toast.error('Dados do cliente não encontrados.'); return; }
      const html = generateContratoHTML(cliente as any, { numero: contrato.numero, valor_total: contrato.valor_total, parcelas: contrato.qtd_parcelas || 1, finalidade: contrato.finalidade });
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
      toast.success('Contrato preparado!');
    } catch (e) { toast.error('Erro ao preparar contrato.'); }
  };

  const gerarProcuracao = async (contrato: Contrato) => {
    try {
      const { data: cliente, error } = await supabase.from('clientes').select('*').eq('id', contrato.cliente_id).single();
      if (error || !cliente) { toast.error('Dados do cliente não encontrados.'); return; }
      const html = generateProcuracaoHTML(cliente as any, { numero: contrato.numero, valor_total: contrato.valor_total, parcelas: contrato.qtd_parcelas || 1, finalidade: contrato.finalidade });
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
    } catch (e) { toast.error('Erro ao preparar procuração.'); }
  };

  const handleSalvarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id || !form.numero || !form.valor_total || !form.data_inicio) {
      toast.error('Preencha os campos obrigatórios.'); return;
    }
    try {
      const cliente = clientes.find(c => c.id === form.cliente_id);
      const valorTotalNum = parseCurrencyToNumber(form.valor_total);
      const valorEntradaNum = (form.forma_pagamento === 'parcelado' && form.tem_entrada) ? parseCurrencyToNumber(form.valor_entrada) : 0;
      const parcelasCount = form.forma_pagamento === 'parcelado' ? (parseInt(form.qtd_parcelas) || 1) : 1;
      const impostoNum = parseFloat(form.imposto_percent) || 0;

      const payload = {
        cliente_id: form.cliente_id, cliente_nome: cliente?.nome || '', numero: form.numero,
        finalidade: form.finalidade, valor_total: valorTotalNum, status: 'ativo',
        data_inicio: form.data_inicio, data_fim: form.data_fim || null,
        forma_pagamento: form.forma_pagamento, tem_entrada: form.forma_pagamento === 'parcelado' && form.tem_entrada,
        valor_entrada: valorEntradaNum, meio_pagamento: form.meio_pagamento,
        banco_entrada: form.local_pagamento, imposto_percentual: impostoNum,
        qtd_parcelas: parcelasCount, data_entrada: form.data_entrada,
        data_primeira_parcela: form.data_primeira_parcela,
        colaboradores_distribuicao: form.distribuicao
      };

      let contratoData;
      if (editandoId) {
        const { data, error } = await supabase.from('processos').update(payload).eq('id', editandoId).select().single();
        if (error) throw error;
        contratoData = data;
        await supabase.from('parcelas_pagamento').delete().eq('contrato_id', editandoId);
        await supabase.from('transacoes').delete().eq('parent_id', null).like('referencia', `${form.numero}%`);
      } else {
        const { data, error } = await supabase.from('processos').insert([payload]).select().single();
        if (error) throw error;
        contratoData = data;
      }

      // Generate installment records
      const parcelasToInsert: any[] = [];
      let restante = valorTotalNum;
      if (form.forma_pagamento === 'parcelado' && form.tem_entrada && valorEntradaNum > 0) {
        parcelasToInsert.push({ contrato_id: contratoData.id, data_prevista: form.data_entrada, valor: valorEntradaNum, status: 'pendente', indice: 0 });
        restante -= valorEntradaNum;
      }
      if (form.forma_pagamento === 'parcelado' && parcelasCount > 0) {
        const valorParcela = restante / parcelasCount;
        const dataBase = new Date(form.data_primeira_parcela);
        for (let i = 0; i < parcelasCount; i++) {
          parcelasToInsert.push({ contrato_id: contratoData.id, data_prevista: addMonths(dataBase, i).toISOString().split('T')[0], valor: valorParcela, status: 'pendente', indice: i + 1 });
        }
      } else if (form.forma_pagamento === 'a_vista' && restante > 0) {
        parcelasToInsert.push({ contrato_id: contratoData.id, data_prevista: form.data_entrada || form.data_inicio, valor: restante, status: 'pendente', indice: 1 });
      }

      let insertedParcelas: { id: string, indice: number }[] = [];
      if (parcelasToInsert.length > 0) {
        const { data: pData, error } = await supabase.from('parcelas_pagamento').insert(parcelasToInsert).select();
        if (error) throw error;
        insertedParcelas = pData || [];
      }

      await generateTransactionsForContract({
        contratoId: contratoData.id, numeroContrato: form.numero, clienteNome: cliente?.nome || '',
        valorTotal: valorTotalNum, impostoPercent: impostoNum, colaboradores: form.distribuicao,
        formaPagamento: form.forma_pagamento, qtdParcelas: parcelasCount,
        dataInicio: form.forma_pagamento === 'a_vista' ? (form.data_entrada || form.data_inicio) : form.data_primeira_parcela,
        temEntrada: form.forma_pagamento === 'parcelado' && form.tem_entrada,
        valorEntrada: valorEntradaNum, meioPagamento: form.meio_pagamento,
        bancoEntrada: form.local_pagamento, parcelasIds: insertedParcelas
      });

      toast.success(editandoId ? 'Contrato atualizado!' : 'Contrato criado com sucesso!');
      setModalNovo(false); setEditandoId(null);
      setForm({ cliente_id: '', numero: '', finalidade: '', data_inicio: new Date().toISOString().split('T')[0], data_fim: '', data_entrada: new Date().toISOString().split('T')[0], data_primeira_parcela: addMonths(new Date(), 1).toISOString().split('T')[0], valor_total: '', forma_pagamento: 'a_vista', tem_entrada: false, valor_entrada: '', qtd_parcelas: '1', meio_pagamento: 'pix', local_pagamento: 'bb', imposto_percent: '5', distribuicao: [] });
      carregarContratos();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo': return <span className="badge badge-success">Ativo</span>;
      case 'concluido': return <span className="badge badge-neutral">Encerrado</span>;
      case 'suspenso': return <span className="badge badge-warning">Suspenso</span>;
      case 'inadimplente': return <span className="badge badge-danger">Inadimplente</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const filtrados = contratos.filter(c => {
    const matchBusca = (c.cliente_nome?.toLowerCase().includes(busca.toLowerCase())) || (c.numero?.toLowerCase().includes(busca.toLowerCase())) || (c.finalidade?.toLowerCase().includes(busca.toLowerCase()));
    const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <div className="animate-in flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">Contra<span className="font-bold">tos</span></h1>
          <p className="text-muted text-sm mt-1">Gestão de contratos, parcelas e inadimplência.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => { carregarContratos(); carregarDados(); toast.success('Atualizado'); }}><RefreshCw size={16} /> Atualizar</button>
          <button className="btn-primary" onClick={() => { setEditandoId(null); setModalNovo(true); }}><Plus size={18} /> Novo Contrato</button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 flex gap-4 flex-wrap items-center">
        <div className="search-bar flex-1 min-w-[250px]"><Search size={18} /><input type="text" placeholder="Buscar por cliente, número ou objeto..." value={busca} onChange={e => setBusca(e.target.value)} /></div>
        <select className="dark-select" style={{ width: 'auto', minWidth: 160 }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os Status</option>
          <option value="ativo">Ativos</option><option value="concluido">Encerrados</option>
          <option value="inadimplente">Inadimplentes</option><option value="suspenso">Suspensos</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <table className="dark-table">
          <thead>
            <tr>
              <th>Contrato / Cliente</th><th className="hidden md:table-cell">Finalidade</th>
              <th className="hidden lg:table-cell">Início / Fim</th>
              <th style={{ textAlign: 'right' }}>Valor Total</th>
              <th style={{ textAlign: 'center' }}>Status</th><th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(contrato => (
              <React.Fragment key={contrato.id}>
                <tr className="cursor-pointer" onClick={() => toggleExpand(contrato.id)}>
                  <td>
                    <div className="text-white font-semibold text-sm">#{contrato.numero}</div>
                    <div className="text-muted text-xs">{contrato.cliente_nome}</div>
                  </td>
                  <td className="text-muted text-sm hidden md:table-cell">{contrato.finalidade}</td>
                  <td className="text-sm hidden lg:table-cell">
                    <div className="text-white/70">{new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}</div>
                    {contrato.data_fim && <div className="text-muted text-xs">Até {new Date(contrato.data_fim).toLocaleDateString('pt-BR')}</div>}
                  </td>
                  <td style={{ textAlign: 'right' }} className="font-semibold text-white">R$ {contrato.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'center' }}>{getStatusBadge(contrato.status)}</td>
                  <td>
                    <div className="flex gap-1 justify-center">
                      <button className="btn-icon text-white/50" onClick={(e) => { e.stopPropagation(); handleEditarContrato(contrato); }}><Edit2 size={16} /></button>
                      <button className="btn-icon text-red-400" onClick={(e) => { e.stopPropagation(); handleExcluirContrato(contrato.id, contrato.numero); }}><Trash2 size={16} /></button>
                      <ChevronRight size={18} className="text-muted mt-0.5" style={{ transform: expandedId === contrato.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </div>
                  </td>
                </tr>
                {expandedId === contrato.id && (
                  <tr>
                    <td colSpan={6} className="!p-0">
                      <div className="p-4 bg-white/[0.01] border-t border-white/5">
                        <div className="glass-panel p-4">
                          <h4 className="text-white font-semibold mb-3">Pagamentos</h4>
                          {loadingParcelas ? <div className="text-muted text-sm">Carregando...</div> : (
                            <table className="dark-table text-sm">
                              <thead><tr><th>Vencimento</th><th style={{ textAlign: 'right' }}>Valor</th><th style={{ textAlign: 'center' }}>Status</th><th></th></tr></thead>
                              <tbody>
                                {parcelas.map(p => (
                                  <tr key={p.id}>
                                    <td>{new Date(p.data_prevista).toLocaleDateString('pt-BR')}</td>
                                    <td style={{ textAlign: 'right' }}>R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ textAlign: 'center' }}><span className={`badge ${p.status === 'pago' ? 'badge-success' : p.status === 'atrasado' ? 'badge-danger' : 'badge-warning'}`}>{p.status}</span></td>
                                    <td style={{ textAlign: 'right' }}>{p.status !== 'pago' && <button className="btn-outline text-xs py-1" onClick={() => marcarComoPago(p.id)}>Baixar</button>}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          <div className="flex gap-3 mt-4">
                            <button className="btn-outline text-xs" onClick={() => gerarPDF(contrato)}><FileText size={14} /> Contrato</button>
                            <button className="btn-outline text-xs" onClick={() => gerarProcuracao(contrato)}><FileText size={14} /> Procuração</button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtrados.length === 0 && !loading && (
              <tr><td colSpan={6} className="text-center py-12 text-muted">Nenhum contrato encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal  */}
      <AnimatePresence>
        {modalNovo && (
          <div className="modal-overlay" onClick={() => setModalNovo(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal-content glass-panel custom-scrollbar" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', padding: '2rem' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-serif text-xl text-white">{editandoId ? 'Editar Contrato' : 'Cadastro de Contrato'}</h2>
                <button className="btn-icon" onClick={() => setModalNovo(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSalvarContrato} className="flex flex-col gap-4">
                <div className="input-group">
                  <label>Cliente *</label>
                  <select className="dark-select" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} required>
                    <option value="">Selecione</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-group"><label>Número *</label><input className="dark-input" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} required /></div>
                  <div className="input-group"><label>Valor Total *</label><input className="dark-input" value={form.valor_total} onChange={e => setForm({ ...form, valor_total: applyMask(e.target.value) })} required /></div>
                </div>
                <div className="input-group"><label>Finalidade / Objeto</label><input className="dark-input" value={form.finalidade} onChange={e => setForm({ ...form, finalidade: e.target.value })} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-group"><label>Início *</label><input type="date" className="dark-input" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} required /></div>
                  <div className="input-group"><label>Fim</label><input type="date" className="dark-input" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })} /></div>
                </div>
                <div className="input-group">
                  <label>Forma de Pagamento</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setForm({ ...form, forma_pagamento: 'a_vista' })} className={form.forma_pagamento === 'a_vista' ? 'btn-primary flex-1' : 'btn-outline flex-1'}>À Vista</button>
                    <button type="button" onClick={() => setForm({ ...form, forma_pagamento: 'parcelado' })} className={form.forma_pagamento === 'parcelado' ? 'btn-primary flex-1' : 'btn-outline flex-1'}>Parcelado</button>
                  </div>
                </div>
                {form.forma_pagamento === 'parcelado' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="input-group"><label>Qtd. Parcelas</label><input type="number" className="dark-input" value={form.qtd_parcelas} onChange={e => setForm({ ...form, qtd_parcelas: e.target.value })} /></div>
                      <div className="input-group"><label>Data 1ª Parcela</label><input type="date" className="dark-input" value={form.data_primeira_parcela} onChange={e => setForm({ ...form, data_primeira_parcela: e.target.value })} /></div>
                    </div>
                    <div className="input-group">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.tem_entrada} onChange={e => setForm({ ...form, tem_entrada: e.target.checked })} className="w-4 h-4" />
                        <span>Tem Entrada?</span>
                      </label>
                    </div>
                    {form.tem_entrada && (
                      <div className="input-group"><label>Valor da Entrada</label><input className="dark-input" value={form.valor_entrada} onChange={e => setForm({ ...form, valor_entrada: applyMask(e.target.value) })} /></div>
                    )}
                  </>
                )}
                {/* Distribuição de Comissão */}
                <div className="input-group">
                  <label>Distribuição de Comissão</label>
                  <div className="flex flex-col gap-2">
                    {form.distribuicao.map((d, idx) => (
                      <div key={d.id} className="flex gap-2 items-center">
                        <span className="text-white text-sm flex-1">{d.nome}</span>
                        <input type="number" className="dark-input" style={{ width: 80 }} value={d.percentual} onChange={e => {
                          const newDist = [...form.distribuicao];
                          newDist[idx].percentual = parseFloat(e.target.value) || 0;
                          setForm({ ...form, distribuicao: newDist });
                        }} />
                        <span className="text-muted text-sm">%</span>
                        <button type="button" className="btn-icon text-red-400" onClick={() => setForm({ ...form, distribuicao: form.distribuicao.filter((_, i) => i !== idx) })}><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <select className="dark-select" value="" onChange={e => {
                      const sel = staff.find(s => s.id === e.target.value);
                      if (sel && !form.distribuicao.find(d => d.id === sel.id)) {
                        setForm({ ...form, distribuicao: [...form.distribuicao, { id: sel.id, nome: sel.nome, percentual: 0 }] });
                      }
                    }}>
                      <option value="">+ Adicionar colaborador</option>
                      {staff.filter(s => !form.distribuicao.find(d => d.id === s.id)).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" className="btn-outline" onClick={() => setModalNovo(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary">Salvar Contrato</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
