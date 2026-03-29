import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, Mail, Trash2, CheckCircle, 
  X, Search, MoreVertical 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Colaborador } from '../../../models';
import { toast } from 'sonner';

export default function EquipePage() {
  const { escritorioId, role } = useAuth();
  const [membros, setMembros] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtro, setFiltro] = useState('');
  
  const [novoMembro, setNovoMembro] = useState({
    nome: '',
    email: '',
    tipo: 'colaborador' as 'master' | 'associado' | 'colaborador',
    comissao: '20'
  });

  const isMaster = role === 'master';

  const carregarEquipe = useCallback(async () => {
    if (!escritorioId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('escritorio_id', escritorioId)
        .order('nome');

      if (error) throw error;
      setMembros(data || []);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Erro ao carregar equipe: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [escritorioId]);

  useEffect(() => {
    carregarEquipe();
  }, [carregarEquipe]);

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMaster) {
      toast.error('Apenas Administradores podem convidar novos membros.');
      return;
    }

    try {
      // 1. Registrar na tabela de colaboradores (Isso autoriza o e-mail na Teia)
      const { error } = await supabase
        .from('colaboradores')
        .insert([{
          escritorio_id: escritorioId,
          nome: novoMembro.nome,
          email: novoMembro.email,
          tipo: novoMembro.tipo,
          comissao_padrao: parseFloat(novoMembro.comissao),
          ativo: true
        }]);

      if (error) {
        if (error.code === '23505') throw new Error('Este e-mail já está convidado para este escritório.');
        throw error;
      }

      // 2. Tenta enviar o convite via Supabase Auth (Caminho AdvBox)
      // Nota: Para isso funcionar 100% num SaaS real, usamos uma Edge Function 
      // ou o colaborador faz o signUp normal e o sistema o reconhece pelo e-mail.
      toast.success('Membro autorizado! Peça para ele criar conta com este e-mail.');
      
      setShowModal(false);
      setNovoMembro({ nome: '', email: '', tipo: 'colaborador', comissao: '20' });
      carregarEquipe();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message);
    }
  };

  const removerMembro = async (id: string, email: string) => {
    if (!isMaster) return;
    if (confirm(`Remover acesso de ${email}?`)) {
      try {
        const { error } = await supabase
          .from('colaboradores')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        toast.success('Acesso removido.');
        carregarEquipe();
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="animate-in flex flex-col gap-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest uppercase">Gestão de <span className="font-bold text-secondary">Equipe</span></h1>
          <p className="text-muted text-sm mt-1">Gerencie quem acessa a teia jurídica do seu escritório.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary"
          disabled={!isMaster}
        >
          <UserPlus size={18} /> Convidar Membro
        </button>
      </div>

      <div className="glass-panel p-4 flex gap-4">
        <Search size={18} className="text-muted mt-1" />
        <input 
          type="text" 
          placeholder="Buscar por nome ou e-mail..." 
          className="bg-transparent border-none text-white focus:ring-0 flex-1 outline-none"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="dark-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Cargo</th>
              <th>Status</th>
              <th>Comissão</th>
              <th className="text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {membros
              .filter(m => m.nome.toLowerCase().includes(filtro.toLowerCase()) || m.email.toLowerCase().includes(filtro.toLowerCase()))
              .map(membro => (
              <tr key={membro.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                      {membro.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{membro.nome}</p>
                      <p className="text-muted text-[10px]">{membro.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${membro.tipo === 'master' ? 'bg-secondary/20 text-secondary' : 'bg-white/5 text-white/60'}`}>
                    {membro.tipo === 'master' ? 'Administrador' : 'Equipe'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-xs text-white/80">Ativo</span>
                  </div>
                </td>
                <td>
                  <span className="text-xs text-white">{membro.comissao_padrao}%</span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    {isMaster && membro.tipo !== 'master' && (
                      <button 
                        onClick={() => removerMembro(membro.id, membro.email)}
                        className="p-2 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button className="p-2 text-white/20 hover:text-white transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="p-12 text-center text-muted">Carregando equipe...</div>
        )}
        
        {!loading && membros.length === 0 && (
          <div className="p-12 text-center">
            <Mail size={48} className="text-muted mx-auto mb-3 opacity-20" />
            <p className="text-muted">Ainda não há outros membros. Convide sua equipe!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="modal-content glass-panel p-8 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-white font-serif uppercase tracking-widest flex items-center gap-2">
                <UserPlus className="text-secondary" /> Novo Convite
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleConvidar} className="space-y-4">
              <div className="input-group">
                <label>Nome Completo</label>
                <input 
                  required
                  className="dark-input"
                  placeholder="Ex: Dr. João Pedro"
                  value={novoMembro.nome}
                  onChange={(e) => setNovoMembro({...novoMembro, nome: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>E-mail de Acesso</label>
                <input 
                  required
                  type="email"
                  className="dark-input"
                  placeholder="joao@escritorio.com.br"
                  value={novoMembro.email}
                  onChange={(e) => setNovoMembro({...novoMembro, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Nível de Acesso</label>
                  <select 
                    className="dark-select"
                    value={novoMembro.tipo}
                    onChange={(e) => setNovoMembro({...novoMembro, tipo: e.target.value as any})}
                  >
                    <option value="colaborador">Equipe (Limitado)</option>
                    <option value="master">Administrador (Total)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Comissão (%)</label>
                  <input 
                    type="number"
                    className="dark-input"
                    value={novoMembro.comissao}
                    onChange={(e) => setNovoMembro({...novoMembro, comissao: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="btn-primary w-full py-4 uppercase tracking-widest font-bold">
                  Liberar Acesso na Teia
                </button>
                <p className="text-[10px] text-muted text-center mt-3">
                  Após clicar, o e-mail será autorizado. Peça para o colaborador criar uma conta com este mesmo e-mail.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
