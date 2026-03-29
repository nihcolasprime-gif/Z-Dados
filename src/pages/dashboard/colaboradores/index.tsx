import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, User, X, Save, Trash2 } from 'lucide-react';
import { colaboradorService } from '../../../services/colaboradorService';
import { Colaborador } from '../../../models';
import { toast } from 'sonner';

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome: '', email: '', oab: '',
    tipo: 'associado' as 'admin' | 'associado',
    comissao_padrao: 0, password: '', avatar_url: ''
  });

  const carregarColaboradores = useCallback(async () => {
    try {
      setLoading(true);
      const data = await colaboradorService.list();
      setColaboradores(data);
    } catch (error: any) {
      toast.error('Erro ao carregar: ' + error.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregarColaboradores(); }, [carregarColaboradores]);

  const handleSalvar = async () => {
    if (!form.nome || !form.email) { toast.error('Nome e E-mail são obrigatórios.'); return; }
    try {
      setSaving(true);
      if (editando) {
        await colaboradorService.update(editando.id, {
          nome: form.nome, email: form.email, oab: form.oab,
          tipo: form.tipo, comissao_padrao: form.comissao_padrao, avatar_url: form.avatar_url
        });
        toast.success('Perfil atualizado!');
      } else {
        await colaboradorService.create({
          nome: form.nome, email: form.email, oab: form.oab,
          tipo: form.tipo, comissao_padrao: form.comissao_padrao,
          escritorio_id: '868f08f0-104b-4683-9eb1-30960d738f6d', avatar_url: form.avatar_url
        });
        toast.success('Colaborador criado!');
      }
      carregarColaboradores(); fecharModal();
    } catch (error: any) { toast.error('Erro: ' + error.message); }
    finally { setSaving(false); }
  };

  const fecharModal = () => {
    setShowModal(false); setEditando(null);
    setForm({ nome: '', email: '', oab: '', tipo: 'associado', comissao_padrao: 0, password: '', avatar_url: '' });
  };

  const abrirEdicao = (c: Colaborador) => {
    setEditando(c);
    setForm({ nome: c.nome, email: c.email, oab: c.oab || '', tipo: c.tipo, comissao_padrao: c.comissao_padrao || 0, password: '', avatar_url: c.avatar_url || '' });
    setShowModal(true);
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Remover este colaborador?')) {
      try { await colaboradorService.delete(id); toast.success('Removido!'); carregarColaboradores(); fecharModal(); }
      catch (error: any) { toast.error(error.message); }
    }
  };

  const filtrados = colaboradores.filter(c =>
    c.nome.toLowerCase().includes(filtro.toLowerCase()) || c.email.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="animate-in flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">Colabo<span className="font-bold">radores</span></h1>
          <p className="text-muted text-sm mt-1">Administre membros da equipe, permissões e repasses.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Novo Colaborador</button>
      </div>

      <div className="glass-panel p-4">
        <div className="search-bar"><Search size={18} /><input type="text" placeholder="Buscar por nome ou e-mail..." value={filtro} onChange={(e) => setFiltro(e.target.value)} /></div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={fecharModal}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="modal-content glass-panel" style={{ maxWidth: '600px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-serif text-xl text-white">{editando ? 'Editar Perfil' : 'Novo Colaborador'}</h3>
                <button onClick={fecharModal} className="btn-icon"><X size={20} /></button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="input-group"><label>Nome Completo *</label><input className="dark-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="input-group"><label>E-mail *</label><input type="email" className="dark-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!editando} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group"><label>OAB</label><input className="dark-input" value={form.oab} onChange={e => setForm({ ...form, oab: e.target.value })} /></div>
                  <div className="input-group">
                    <label>Cargo</label>
                    <select className="dark-select" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as 'admin' | 'associado' })}>
                      <option value="admin">Administrador</option><option value="associado">Associado</option>
                    </select>
                  </div>
                </div>
                <div className="input-group"><label>Comissão Padrão (%)</label><input type="number" className="dark-input" value={form.comissao_padrao} onChange={e => setForm({ ...form, comissao_padrao: parseFloat(e.target.value) || 0 })} /></div>
                <div className="flex gap-3 mt-4">
                  <button className="btn-primary flex-1" onClick={handleSalvar} disabled={saving}><Save size={18} /> {saving ? 'Salvando...' : 'Salvar'}</button>
                  {editando && <button className="btn-outline text-red-400 border-red-400/30" onClick={() => handleExcluir(editando.id)}><Trash2 size={18} /></button>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <table className="dark-table">
          <thead>
            <tr><th>Colaborador</th><th>Cargo</th><th>Comissão</th><th style={{ textAlign: 'right' }}>Ações</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-muted">Carregando...</td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0"><User size={18} /></div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{c.nome}</h4>
                      <p className="text-muted text-xs">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${c.tipo === 'admin' ? 'badge-warning' : 'badge-neutral'}`}>{c.tipo.toUpperCase()}</span></td>
                <td className="text-white/70">{c.comissao_padrao || 0}%</td>
                <td style={{ textAlign: 'right' }}><button onClick={() => abrirEdicao(c)} className="btn-outline text-xs py-1">Editar</button></td>
              </tr>
            ))}
            {!loading && filtrados.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-muted">Nenhum colaborador encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
