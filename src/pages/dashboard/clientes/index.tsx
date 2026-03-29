import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Building2, User, X, Save, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clienteService } from '../../../services/clienteService';
import { Cliente } from '../../../models';
import { toast } from 'sonner';
import { generateProcuracaoHTML } from '../../../services/documentGenerator';

export default function ClientesPage() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPostSave, setShowPostSave] = useState(false);
  const [createdCliente, setCreatedCliente] = useState<Cliente | null>(null);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [filtro, setFiltro] = useState('');

  const [form, setForm] = useState({
    nome: '', tipo: 'PF' as 'PF' | 'PJ', doc: '', email: '', contato: '',
    rg: '', estadoCivil: '', profissao: '', endereco: '', numero: '',
    complemento: '', cidade: 'Santa Maria', uf: 'RS', cep: '', data_nascimento: ''
  });

  const carregarClientes = useCallback(async () => {
    try {
      const data = await clienteService.fetchClientes();
      setClientes(data);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message);
    }
  }, []);

  useEffect(() => { carregarClientes(); }, [carregarClientes]);

  const buscarCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setForm(prev => ({ ...prev, endereco: data.logradouro, cidade: data.localidade, uf: data.uf, complemento: data.complemento || prev.complemento }));
      }
    } catch (e) { console.error('Erro ao buscar CEP:', e); }
  };

  const handleSalvar = async () => {
    if (!form.nome || !form.doc) { toast.error('Nome e Documento são obrigatórios.'); return; }
    try {
      const payload: any = {
        nome: form.nome, documento: form.doc?.replace(/\D/g, '') || '', email: form.email || null,
        contato: form.contato || null, rg: form.rg || null, estado_civil: form.estadoCivil || null,
        profissao: form.profissao || null, endereco: form.endereco || null, numero: form.numero || null,
        complemento: form.complemento || null, cidade: form.cidade || null, uf: form.uf || null,
        cep: form.cep?.replace(/\D/g, '') || null, tipo: form.tipo, data_nascimento: form.data_nascimento || null
      };
      if (editando) {
        await clienteService.salvarCliente(payload, editando.id);
        toast.success('Cliente atualizado com sucesso!');
        carregarClientes(); fecharModal();
      } else {
        const data = await clienteService.salvarCliente(payload);
        toast.success('Cliente cadastrado com sucesso!');
        setCreatedCliente(data); carregarClientes(); fecharModal(); setShowPostSave(true);
      }
    } catch (error: any) { toast.error('Erro ao salvar: ' + error.message); }
  };

  const fecharModal = () => {
    setShowModal(false); setEditando(null);
    setForm({ nome: '', tipo: 'PF', doc: '', email: '', contato: '', rg: '', estadoCivil: '', profissao: '', endereco: '', numero: '', complemento: '', cidade: 'Santa Maria', uf: 'RS', cep: '', data_nascimento: '' });
  };

  const imprimirProcuracao = (cliente: Cliente) => {
    const html = generateProcuracaoHTML(cliente as any);
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const abrirEdicao = (c: Cliente) => {
    setEditando(c);
    setForm({ nome: c.nome, tipo: c.tipo, doc: c.documento || c.doc || '', email: c.email || '', contato: c.contato || '', rg: c.rg || '', estadoCivil: c.estado_civil || '', profissao: c.profissao || '', endereco: c.endereco || '', numero: c.numero || '', complemento: c.complemento || '', cidade: c.cidade || 'Santa Maria', uf: c.uf || 'RS', cep: c.cep || '', data_nascimento: c.data_nascimento || '' });
    setShowModal(true);
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Deseja realmente excluir este cliente?')) {
      try { await clienteService.excluirCliente(id); toast.success('Cliente removido!'); carregarClientes(); fecharModal(); }
      catch (error: any) { toast.error(error.message); }
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(filtro.toLowerCase()) || c.documento?.includes(filtro) || c.doc?.includes(filtro)
  );

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">Clientes</h1>
          <p className="text-muted text-sm mt-1">Gestão estratégica de clientes e contratos.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Novo Cliente</button>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 mb-6">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Buscar por nome ou documento..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={fecharModal}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="modal-content glass-panel" style={{ maxWidth: '750px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-serif text-xl text-white">{editando ? 'Dossiê do Cliente' : 'Novo Cliente'}</h3>
                <button onClick={fecharModal} className="btn-icon"><X size={20} /></button>
              </div>
              <div className="flex flex-col gap-4">
                {!editando && (
                  <div className="input-group">
                    <label>Tipo de Cliente</label>
                    <div className="flex gap-3">
                      <button onClick={() => setForm({ ...form, tipo: 'PF' })} className={form.tipo === 'PF' ? 'btn-primary flex-1' : 'btn-outline flex-1'}>Pessoa Física</button>
                      <button onClick={() => setForm({ ...form, tipo: 'PJ' })} className={form.tipo === 'PJ' ? 'btn-primary flex-1' : 'btn-outline flex-1'}>Pessoa Jurídica</button>
                    </div>
                  </div>
                )}
                {editando && (
                  <div className="flex items-center gap-3 p-4 glass-panel mb-2">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      {form.tipo === 'PJ' ? <Building2 size={22} /> : <User size={22} />}
                    </div>
                    <div>
                      <p className="text-xs text-muted font-bold uppercase">Tipo de Cliente</p>
                      <p className="text-white font-bold">{form.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-group"><label>Nome *</label><input className="dark-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
                  <div className="input-group"><label>{form.tipo === 'PJ' ? 'CNPJ *' : 'CPF *'}</label><input className="dark-input" value={form.doc} onChange={e => setForm({ ...form, doc: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="input-group col-span-2"><label>CEP</label><input className="dark-input" value={form.cep} onChange={e => setForm({ ...form, cep: e.target.value })} /></div>
                  <div className="input-group"><label>&nbsp;</label><button className="btn-outline w-full h-[42px]" onClick={() => buscarCEP(form.cep)}>Buscar</button></div>
                </div>
                <div className="input-group"><label>Endereço</label><input className="dark-input" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group"><label>Número</label><input className="dark-input" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} /></div>
                  <div className="input-group"><label>Complemento</label><input className="dark-input" value={form.complemento} onChange={e => setForm({ ...form, complemento: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group"><label>Cidade</label><input className="dark-input" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} /></div>
                  <div className="input-group"><label>UF</label><input className="dark-input" value={form.uf} onChange={e => setForm({ ...form, uf: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group"><label>E-mail</label><input type="email" className="dark-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="input-group"><label>Contato</label><input className="dark-input" value={form.contato} onChange={e => setForm({ ...form, contato: e.target.value })} /></div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button className="btn-primary flex-1" onClick={handleSalvar}><Save size={18} /> {editando ? 'Atualizar Ficha' : 'Criar Cliente'}</button>
                  {editando && <button className="btn-outline text-red-400 border-red-400/30" onClick={() => handleExcluir(editando.id)}><Trash2 size={18} /></button>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showPostSave && createdCliente && (
          <div className="modal-overlay" onClick={() => setShowPostSave(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="modal-content glass-panel text-center" style={{ maxWidth: '500px', padding: '2.5rem' }} onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mx-auto mb-6"><Save size={32} /></div>
              <h3 className="text-serif text-2xl text-white mb-3">Cliente Cadastrado!</h3>
              <p className="text-muted mb-8">O dossiê de <strong className="text-white">{createdCliente.nome}</strong> foi criado com sucesso.</p>
              <div className="flex flex-col gap-3">
                <button className="btn-primary w-full py-3" onClick={() => { imprimirProcuracao(createdCliente); setShowPostSave(false); }}>📄 Gerar Procuração</button>
                <button className="btn-outline w-full py-3" onClick={() => { navigate('/dashboard/contratos'); setShowPostSave(false); }}>⚖️ Novo Contrato</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Client List */}
      <div className="glass-panel p-6">
        <h3 className="text-serif text-lg text-white mb-4">Base de Clientes</h3>
        <div className="flex flex-col gap-3">
          {clientesFiltrados.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-all border border-white/[0.03]" onClick={() => abrirEdicao(c)}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.tipo === 'PJ' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {c.tipo === 'PJ' ? <Building2 size={20} /> : <User size={20} />}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium text-sm">{c.nome}</h4>
                <p className="text-muted text-xs">{c.documento || c.doc} • {c.email || 'Sem e-mail'}</p>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
          ))}
          {clientesFiltrados.length === 0 && (
            <div className="text-center py-12"><User size={48} className="text-muted mx-auto mb-3 opacity-30" /><p className="text-muted">Nenhum cliente encontrado.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
