import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface Consulta {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  valor: number;
  data_consulta: string;
  meio_pagamento: string;
  banco_entrada: string;
  status: 'recebido' | 'pendente';
  created_at: string;
}

export default function ConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<{ id: string, nome: string }[]>([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    cliente_id: '', valor: '', data_consulta: new Date().toISOString().split('T')[0],
    meio_pagamento: 'pix', banco_entrada: 'BB', status: 'recebido' as 'recebido' | 'pendente',
  });

  const carregarDados = useCallback(async () => {
    try {
      const [cliRes] = await Promise.all([
        supabase.from('clientes').select('id, nome').order('nome'),
      ]);
      if (cliRes.data) setClientes(cliRes.data);
    } catch (e) { console.error(e); }
  }, []);

  const carregarConsultas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('lca_consultas').select('*').order('data_consulta', { ascending: false });
      if (error) throw error;
      setConsultas(data || []);
    } catch (error: any) {
      toast.error('Falha ao carregar consultas: ' + error.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregarConsultas(); carregarDados(); }, [carregarConsultas, carregarDados]);

  const applyMask = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue || parseInt(cleanValue) === 0) return "";
    const numberValue = parseFloat(cleanValue) / 100;
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(numberValue);
  };

  const parseCurrency = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id || !form.valor) { toast.error('Preencha os campos obrigatórios.'); return; }
    try {
      const cliente = clientes.find(c => c.id === form.cliente_id);
      const valorNum = parseCurrency(form.valor);

      if (editandoId) {
        const { error } = await supabase.from('lca_consultas').update({
          cliente_id: form.cliente_id, cliente_nome: cliente?.nome || '', valor: valorNum,
          data_consulta: form.data_consulta, meio_pagamento: form.meio_pagamento,
          banco_entrada: form.banco_entrada, status: form.status
        }).eq('id', editandoId);
        if (error) throw error;
        toast.success('Consulta atualizada!');
      } else {
        const { error: insertErr } = await supabase.from('lca_consultas').insert([{
          cliente_id: form.cliente_id, cliente_nome: cliente?.nome || '', valor: valorNum,
          data_consulta: form.data_consulta, meio_pagamento: form.meio_pagamento,
          banco_entrada: form.banco_entrada, status: form.status
        }]);
        if (insertErr) throw insertErr;
        toast.success('Consulta registrada!');
      }
      setModalNovo(false); setEditandoId(null);
      setForm({ cliente_id: '', valor: '', data_consulta: new Date().toISOString().split('T')[0], meio_pagamento: 'pix', banco_entrada: 'BB', status: 'recebido' });
      carregarConsultas();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const handleEditar = (c: Consulta) => {
    setEditandoId(c.id);
    setForm({ cliente_id: c.cliente_id, valor: c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), data_consulta: c.data_consulta, meio_pagamento: c.meio_pagamento, banco_entrada: c.banco_entrada, status: c.status });
    setModalNovo(true);
  };

  const handleExcluir = async (c: Consulta) => {
    if (!confirm(`Excluir a consulta de ${c.cliente_nome}?`)) return;
    try {
      const { error } = await supabase.from('lca_consultas').delete().eq('id', c.id);
      if (error) throw error;
      toast.success('Consulta excluída!'); carregarConsultas();
    } catch { toast.error('Erro ao excluir consulta.'); }
  };

  const filtrados = consultas.filter(c => c.cliente_nome?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="animate-in flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">Consultas <span className="font-bold">Jurídicas</span></h1>
          <p className="text-muted text-sm mt-1">Registro de consultas rápidas e honorários de balcão.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalNovo(true)}><Plus size={18} /> Nova Consulta</button>
      </div>

      <div className="glass-panel p-4">
        <div className="search-bar"><Search size={18} /><input type="text" placeholder="Buscar por cliente..." value={busca} onChange={e => setBusca(e.target.value)} /></div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="dark-table">
          <thead>
            <tr>
              <th>Data</th><th>Cliente</th><th>Meio / Banco</th><th>Status</th>
              <th style={{ textAlign: 'right' }}>Valor</th><th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(c => (
              <tr key={c.id}>
                <td>{new Date(c.data_consulta).toLocaleDateString('pt-BR')}</td>
                <td className="font-semibold text-white">{c.cliente_nome}</td>
                <td className="text-muted">{c.meio_pagamento.toUpperCase()} / {c.banco_entrada.toUpperCase()}</td>
                <td>
                  <span className={`badge ${c.status === 'recebido' ? 'badge-success' : 'badge-warning'}`}>
                    {c.status === 'recebido' ? 'Recebido' : 'Pendente'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }} className="font-semibold text-green-400">R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>
                  <div className="flex gap-1 justify-center">
                    <button className="btn-icon text-white/50" onClick={() => handleEditar(c)}><Edit2 size={14} /></button>
                    <button className="btn-icon text-red-400" onClick={() => handleExcluir(c)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && !loading && (
              <tr><td colSpan={6} className="text-center py-12 text-muted">Nenhuma consulta registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modalNovo && (
          <div className="modal-overlay" onClick={() => { setModalNovo(false); setEditandoId(null); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '2rem' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-serif text-xl text-white">{editandoId ? 'Editar Consulta' : 'Nova Consulta'}</h2>
                <button className="btn-icon" onClick={() => setModalNovo(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSalvar} className="flex flex-col gap-4">
                <div className="input-group">
                  <label>Cliente *</label>
                  <select className="dark-select" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} required>
                    <option value="">Selecione</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="input-group"><label>Valor (R$) *</label><input className="dark-input" placeholder="0,00" value={form.valor} onChange={e => setForm({ ...form, valor: applyMask(e.target.value) })} required /></div>
                <div className="input-group"><label>Data *</label><input type="date" className="dark-input" value={form.data_consulta} onChange={e => setForm({ ...form, data_consulta: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label>Meio Pagamento</label>
                    <select className="dark-select" value={form.meio_pagamento} onChange={e => setForm({ ...form, meio_pagamento: e.target.value })}>
                      <option value="pix">PIX</option><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão</option><option value="boleto">Boleto</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Banco</label>
                    <select className="dark-select" value={form.banco_entrada} onChange={e => setForm({ ...form, banco_entrada: e.target.value })}>
                      <option value="BB">Banco do Brasil</option><option value="Nubank">Nubank</option><option value="Sicoob">Sicoob</option><option value="Asaas">Asaas</option><option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" className="btn-outline" onClick={() => setModalNovo(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
