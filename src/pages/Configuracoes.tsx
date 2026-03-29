import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, UploadCloud, Building2, MapPin, Globe, 
  Fingerprint, CreditCard, Trash2, Edit2, Plus, MessageCircle, X 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Escritorio } from '../models';
import { financeiroService } from '../services/financeiroService';

export default function Configuracoes() {
  const { escritorioId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<Escritorio>({
    id: '',
    nome: '',
    razao_social: '',
    cnpj: '',
    logo_url: '',
    endereco_completo: '',
    cidade: '',
    uf: '',
    cep: ''
  });
  const [contas, setContas] = useState<any[]>([]);
  const [modalBanco, setModalBanco] = useState(false);
  const [bancoForm, setBancoForm] = useState({ id: '', nome: '', tipo: 'digital' });

  const carregarConfiguracoes = useCallback(async () => {
    if (!escritorioId) return;
    try {
      const { data, error } = await supabase
        .from('escritorios')
        .select('*')
        .eq('id', escritorioId)
        .maybeSingle();

      if (error) throw error;
      if (data) setDados(data);
      
      const contasData = await financeiroService.fetchContasBancarias();
      setContas(contasData);
    } catch (err: unknown) {
      toast.error('Erro ao carregar dados do escritório.');
    } finally {
      setLoading(false);
    }
  }, [escritorioId]);

  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  const handleSave = async () => {
    if (!escritorioId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('escritorios')
        .update({
          nome: dados.nome,
          razao_social: dados.razao_social,
          cnpj: dados.cnpj,
          logo_url: dados.logo_url,
          endereco_completo: dados.endereco_completo,
          cidade: dados.cidade,
          uf: dados.uf,
          cep: dados.cep
        })
        .eq('id', escritorioId);

      if (error) throw error;
      toast.success('Identidade do escritório atualizada!');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarBanco = async () => {
    if (!escritorioId) return;
    try {
      if (bancoForm.id) {
        await financeiroService.atualizarContaBancaria(bancoForm.id, bancoForm.nome, bancoForm.tipo);
        toast.success('Banco atualizado!');
      } else {
        await financeiroService.salvarContaBancaria(bancoForm.nome, bancoForm.tipo, escritorioId);
        toast.success('Novo banco adicionado!');
      }
      setModalBanco(false);
      setBancoForm({ id: '', nome: '', tipo: 'digital' });
      carregarConfiguracoes();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleExcluirBanco = async (id: string) => {
    if (!confirm('Tem certeza? Isso pode afetar transações vinculadas.')) return;
    try {
      await financeiroService.excluirContaBancaria(id);
      toast.success('Banco removido com sucesso!');
      carregarConfiguracoes();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-muted font-serif uppercase tracking-widest">Sincronizando Identidade SaaS...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[900px] mx-auto pb-24 md:pb-0 animate-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest uppercase">
            Identidade do <span className="font-bold text-secondary">Escritório</span>
          </h1>
          <p className="text-white/40 text-sm mt-1 tracking-wide underline decoration-secondary/30 decoration-dotted underline-offset-4">Configurações globais e personalização de documentos.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-10 py-3 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          {saving ? 'Gravando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Lado Esquerdo: Marca */}
         <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 text-center">
               <label className="block text-[10px] uppercase font-bold text-white/40 mb-4 tracking-widest">Logomarca Oficial</label>
               <div className="relative group cursor-pointer">
                  <div className="w-full aspect-square bg-black/40 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-secondary">
                     {dados.logo_url ? (
                        <img src={dados.logo_url} className="w-full h-full object-contain p-4" alt="Logo" />
                     ) : (
                        <>
                           <UploadCloud className="w-10 h-10 text-white/20 mb-2" />
                           <span className="text-[10px] text-white/30">PNG Transparente</span>
                        </>
                     )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                     <span className="text-xs text-white font-bold">Alterar Logo</span>
                  </div>
               </div>
               <input 
                  className="mt-4 dark-input text-center text-xs" 
                  placeholder="URL da Logomarca" 
                  value={dados.logo_url || ''} 
                  onChange={e => setDados({...dados, logo_url: e.target.value})} 
               />
            </div>

            <div className="glass-panel p-6 border-l-4 border-red-500/50">
               <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <ShieldAlert size={14} /> Zona de Risco
               </h3>
               <p className="text-[10px] text-white/40 mb-4 leading-relaxed">A exclusão da instância remove permanentemente todos os registros vinculados a este ID.</p>
               <button className="text-[10px] text-red-400 font-bold border border-red-400/20 w-full py-2 rounded hover:bg-red-400 hover:text-black transition-all">Excluir Conta do Escritório</button>
            </div>

            <div className="glass-panel p-6 bg-secondary/5 border-l-4 border-secondary">
               <h3 className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-2 mb-4">
                  <MessageCircle size={14} /> Suporte Técnico
               </h3>
               <p className="text-[10px] text-white/40 mb-4 leading-relaxed">Dúvidas sobre o funcionamento da teia? Fale com nosso time.</p>
               <a 
                 href="https://wa.me/5500000000000" 
                 target="_blank" 
                 className="btn-primary w-full py-2 text-[10px] flex items-center justify-center gap-2"
               >
                 Abrir WhatsApp de Ajuda
               </a>
            </div>
         </div>

         {/* Lado Direito: Dados Gerais */}
         <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-8">
               <h3 className="text-white font-serif text-lg mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                  <Building2 className="text-secondary" size={20} /> Informações Institucionais
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="input-group">
                     <label className="flex items-center gap-2"><Fingerprint size={12} /> Nome de Exibição / Fantasia</label>
                     <input className="dark-input" value={dados.nome || ''} onChange={e => setDados({...dados, nome: e.target.value})} />
                  </div>
                  <div className="input-group">
                     <label>Razão Social</label>
                     <input className="dark-input" value={dados.razao_social || ''} onChange={e => setDados({...dados, razao_social: e.target.value})} />
                  </div>
                  <div className="input-group">
                     <label>CNPJ / CPF do Titular</label>
                     <input className="dark-input" value={dados.cnpj || ''} onChange={e => setDados({...dados, cnpj: e.target.value})} />
                  </div>
                  <div className="input-group">
                     <label className="flex items-center gap-2"><Globe size={12} /> Site / Link do Escritório</label>
                     <input className="dark-input" value={dados.site || ''} onChange={e => setDados({...dados, site: e.target.value})} />
                  </div>
               </div>
            </div>

            <div className="glass-panel p-8">
               <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                  <h3 className="text-white font-serif text-lg flex items-center gap-2">
                     <CreditCard className="text-secondary" size={20} /> Gestão de Bancos
                  </h3>
                  <button onClick={() => { setBancoForm({ id: '', nome: '', tipo: 'digital' }); setModalBanco(true); }} className="btn-outline text-[10px] py-1 px-3 flex items-center gap-1">
                     <Plus size={14} /> Novo Banco
                  </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contas.map(conta => (
                     <div key={conta.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center group">
                        <div>
                           <p className="text-white text-sm font-medium">{conta.nome}</p>
                           <p className="text-[10px] text-white/30 uppercase tracking-tighter">{conta.tipo}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setBancoForm(conta); setModalBanco(true); }} className="text-white/40 hover:text-white"><Edit2 size={14} /></button>
                           <button onClick={() => handleExcluirBanco(conta.id)} className="text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* MODAL BANCO */}
      <AnimatePresence>
        {modalBanco && (
          <div className="modal-overlay">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-sm p-8">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-white font-serif text-lg">{bancoForm.id ? 'Editar Banco' : 'Adicionar Banco'}</h2>
                   <button onClick={() => setModalBanco(false)} className="text-white/40"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                   <div className="input-group">
                      <label>Nome do Banco / Carteira</label>
                      <input className="dark-input" value={bancoForm.nome} onChange={e => setBancoForm({...bancoForm, nome: e.target.value})} placeholder="Ex: Banco Inter Principal" />
                   </div>
                   <div className="input-group">
                      <label>Tipo de Conta</label>
                      <select className="dark-select" value={bancoForm.tipo} onChange={e => setBancoForm({...bancoForm, tipo: e.target.value})}>
                         <option value="digital">Conta Digital</option>
                         <option value="corrente">Conta Corrente</option>
                         <option value="dinheiro">Dinheiro Físico / Caixa</option>
                         <option value="investimento">Investimento</option>
                      </select>
                   </div>
                   <button onClick={handleSalvarBanco} className="btn-primary w-full py-3 mt-4">Salvar na Teia</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
