import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, Landmark, CreditCard, Building2, Coins, ChevronLeft,
  Trash2, ArrowUpRight, CheckCircle2, Eye, EyeOff, 
  X, Plus, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../../contexts/AppContext';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Transacao, Contrato } from '../../../models';
import { financeiroService } from '../../../services/financeiroService';
import { useAuth } from '../../../contexts/AuthContext';


const CATEGORIAS_RECEITA = ['Honorários Contratuais', 'Honorários Sucumbenciais', 'Consultas', 'Reembolso de Custas', 'Outros'];
const CATEGORIAS_DESPESA = ['Aluguel/Escritório', 'Marketing/Leads', 'Software/SaaS', 'Impostos', 'Salários', 'Custas Processuais', 'Outros'];

const CONTAS_DEFAULT_ICONS: Record<string, JSX.Element> = {
  'corrente': <Building2 size={16} />,
  'digital': <CreditCard size={16} />,
  'poupanca': <Landmark size={16} />,
  'dinheiro': <Coins size={16} />,
  'investimento': <ArrowUpRight size={16} />,
  'outro': <ChevronRight size={16} />
};

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface FinanceiroData { transacoes: Transacao[]; contratos: Contrato[]; colaboradores: { id: string; nome: string; }[]; }

export default function FinanceiroPage() {
  const { escritorioId, role } = useAuth();
  const isMaster = role === 'master';
  const { reportError } = useApp();
  const queryClient = useQueryClient();
  const [dadosVisiveis, setDadosVisiveis] = useState(true);
  const [editandoTransacao, setEditandoTransacao] = useState<Transacao | null>(null);
  const [modalTransacao, setModalTransacao] = useState(false);
  const [modalBancos, setModalBancos] = useState(false);
  const [novoBancoForm, setNovoBancoForm] = useState({ nome: '', tipo: 'digital' });
  const [tipoTransacao, setTipoTransacao] = useState<'receita' | 'despesa' | 'distribuicao'>( 'receita');

  const now = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(now.getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(now.getFullYear());
  const pagina = 0;
  const ITEMS_PER_PAGE = 50;
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [formTrans, setFormTrans] = useState({
    entidade: '', valor: '', data: now.toISOString().split('T')[0],
    status: 'pendente' as 'pendente' | 'recebido' | 'pago',
    categoria: 'Outros',
    concretizado: false, referencia: '', conta: '',
    parcelas: '1', impostoPercent: '0', comissaoPercent: '0',
    distribuicao: [] as { id: string; nome: string; percentual: number }[]
  });

  const { data: dashData, error: dashError } = useQuery<FinanceiroData, Error>({
    queryKey: ['financeiro', mesSelecionado, pagina],
    queryFn: () => financeiroService.fetchDashboardData(new Date().getFullYear(), mesSelecionado, pagina, ITEMS_PER_PAGE),
  });

  const { data: contasBancarias = [] } = useQuery({
    queryKey: ['contas_bancarias'],
    queryFn: () => financeiroService.fetchContasBancarias(),
  });

  const { mutate: adicionarBanco } = useMutation({
    mutationFn: () => financeiroService.salvarContaBancaria(novoBancoForm.nome, novoBancoForm.tipo, escritorioId!),
    onSuccess: () => { toast.success('Banco cadastrado!'); queryClient.invalidateQueries({ queryKey: ['contas_bancarias'] }); setNovoBancoForm({ nome: '', tipo: 'digital' }); },
    onError: (err: Error) => toast.error(err.message)
  });

  const { mutate: excluirBanco } = useMutation({
    mutationFn: (id: string) => financeiroService.excluirContaBancaria(id),
    onSuccess: () => { toast.success('Removido.'); queryClient.invalidateQueries({ queryKey: ['contas_bancarias'] }); },
    onError: (err: Error) => toast.error(err.message)
  });

  const { transacoes = [], contratos = [] } = dashData || {};

  useEffect(() => { if (dashError) reportError('Erro Financeiro', dashError.message); }, [dashError, reportError]);
  useEffect(() => { if (contasBancarias.length > 0 && !formTrans.conta) setFormTrans(prev => ({ ...prev, conta: contasBancarias[0].id })); }, [contasBancarias, formTrans.conta]);
  useEffect(() => { if (modalTransacao) setTimeout(() => firstInputRef.current?.focus(), 150); }, [modalTransacao]);

  const parseCurrency = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const formatCurrencyBR = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getSaldoConta = (contaId: string) => {
    return transacoes.filter(t => t.conta === contaId && t.concretizado).reduce((sum, t) => sum + (t.tipo === 'receita' ? t.valor : -t.valor), 0);
  };

  const { mutate: salvarTransacao, isPending: isSaving } = useMutation({
    mutationFn: () => financeiroService.salvarTransacao({ formTrans, tipoTransacao, editandoTransacao, contratos, parseCurrency, escritorioId: escritorioId! }),
    onSuccess: () => {
      toast.success('Registrado!');
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      setModalTransacao(false);
      setEditandoTransacao(null);
      setFormTrans({ entidade: '', valor: '', data: now.toISOString().split('T')[0], status: 'pendente', categoria: 'Outros', concretizado: false, referencia: '', conta: contasBancarias[0]?.id || '', parcelas: '1', impostoPercent: '0', comissaoPercent: '0', distribuicao: [] });
    },
    onError: (err: Error) => reportError('Erro ao Salvar', err.message),
  });

  const { mutate: excluirTransacao } = useMutation({
    mutationFn: (id: string) => financeiroService.excluirTransacao(id),
    onSuccess: () => { toast.success('Excluído.'); queryClient.invalidateQueries({ queryKey: ['financeiro'] }); },
  });

  const { mutate: confirmarPagamento } = useMutation({
    mutationFn: (id: string) => financeiroService.confirmarPagamento(id, transacoes),
    onSuccess: () => { toast.success('Confirmado!'); queryClient.invalidateQueries({ queryKey: ['financeiro'] }); },
  });

  const transFiltered = useMemo(() => (transacoes || []).filter(t => {
    if (!t.data) return false;
    const d = new Date(t.data);
    return d.getMonth() === mesSelecionado && d.getFullYear() === new Date().getFullYear();
  }), [transacoes, mesSelecionado]);

  const totalReceitas = useMemo(() => transFiltered.filter(t => t.tipo === 'receita' && t.concretizado).reduce((s, t) => s + t.valor, 0), [transFiltered]);
  const totalDespesas = useMemo(() => transFiltered.filter(t => t.tipo === 'despesa' && t.concretizado).reduce((s, t) => s + t.valor, 0), [transFiltered]);
  const totalComissoes = useMemo(() => transFiltered.filter(t => t.tipo === 'distribuicao' && t.concretizado).reduce((s, t) => s + t.valor, 0), [transFiltered]);
  const totalProjetadoMes = totalReceitas - (totalDespesas + totalComissoes);

  const dadosPizza = useMemo(() => [
    { name: 'Receitas', value: totalReceitas, color: '#22c55e' },
    { name: 'Despesas', value: totalDespesas, color: '#f59e0b' },
    { name: 'Comissões', value: totalComissoes, color: '#3b82f6' },
  ].filter(d => d.value > 0), [totalReceitas, totalDespesas, totalComissoes]);

  const blurStyle = { filter: !dadosVisiveis ? 'blur(12px)' : 'none', transition: 'filter 0.3s ease' };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">Finan<span className="font-bold">ceiro</span></h1>
          <p className="text-muted text-sm mt-1">Gestão de caixa estratégica por categorias jurídicas.</p>
        </div>
        <div className="flex gap-3 h-fit items-center">
            <button onClick={() => setDadosVisiveis(!dadosVisiveis)} className="btn-outline">{dadosVisiveis ? <Eye size={16} /> : <EyeOff size={16} />}</button>
            <div className="flex gap-2 items-center glass-panel p-2">
                <button onClick={() => setMesSelecionado(m => m === 0 ? 11 : m - 1)} className="btn-icon text-white"><ChevronLeft size={16} /></button>
                <span className="text-xs text-white font-bold min-w-[100px] text-center">{MESES[mesSelecionado]} {new Date().getFullYear()}</span>
                <button onClick={() => setMesSelecionado(m => m === 11 ? 0 : m + 1)} className="btn-icon text-white"><ChevronRight size={16} /></button>
            </div>
            <button onClick={() => { setTipoTransacao('receita'); setFormTrans({...formTrans, categoria: 'Honorários Contratuais'}); setModalTransacao(true); }} className="btn-primary"><Plus size={18} /> Novo Lançamento</button>
        </div>
      </div>

      {isMaster ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-panel p-5 text-center border-b-2 border-green-500/30" style={blurStyle}><p className="text-[10px] text-muted uppercase mb-1">Receitas</p><p className="text-2xl font-bold text-white">{formatCurrencyBR(totalReceitas)}</p></div>
            <div className="glass-panel p-5 text-center border-b-2 border-yellow-500/30" style={blurStyle}><p className="text-[10px] text-muted uppercase mb-1">Despesas</p><p className="text-2xl font-bold text-white">{formatCurrencyBR(totalDespesas)}</p></div>
            <div className="glass-panel p-5 text-center border-b-2 border-blue-500/30" style={blurStyle}><p className="text-[10px] text-muted uppercase mb-1">Comissões</p><p className="text-2xl font-bold text-white">{formatCurrencyBR(totalComissoes)}</p></div>
            <div className="glass-panel p-5 text-center border-b-2 border-white/30" style={blurStyle}><p className="text-[10px] text-muted uppercase mb-1">Lucro Líquido</p><p className="text-2xl font-bold text-white">{formatCurrencyBR(totalProjetadoMes)}</p></div>
        </div>
      ) : (
        <div className="glass-panel p-6 mb-8 border-l-4 border-blue-500 bg-blue-500/5">
          <h3 className="text-white font-bold mb-1">Visão de Colaborador Ativa</h3>
          <p className="text-muted text-sm">Você tem acesso apenas às suas participações e transações vinculadas. O financeiro geral é restrito à diretoria.</p>
        </div>
      )}

      {isMaster && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel p-6 lg:col-span-2">
                <h3 className="text-serif text-white mb-4">Análise Fiscal</h3>
                <div className="h-[200px]"><ResponsiveContainer><PieChart><Pie data={dadosPizza} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">{dadosPizza.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><RechartsTooltip formatter={(v) => formatCurrencyBR(Number(v))} contentStyle={{ background: '#111', border: '1px solid #333' }} /></PieChart></ResponsiveContainer></div>
            </div>
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4"><h3 className="text-serif text-white">Contas</h3><button onClick={() => setModalBancos(true)} className="text-[10px] text-secondary font-bold">Gerenciar</button></div>
                <div className="space-y-3">{contasBancarias.map((b: { id: string; nome: string; tipo: string }) => <div key={b.id} className="flex justify-between items-center text-sm"><div className="flex items-center gap-2 text-white/60">{CONTAS_DEFAULT_ICONS[b.tipo]} <span>{b.nome}</span></div><span className="text-white font-bold" style={blurStyle}>{formatCurrencyBR(getSaldoConta(b.id))}</span></div>)}</div>
            </div>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
          <table className="dark-table">
              <thead><tr><th>Data</th><th>Classificação</th><th>Entidade</th><th>Status</th><th style={{ textAlign: 'right' }}>Valor</th><th></th></tr></thead>
              <tbody>
                  {transFiltered.map(t => (
                      <tr key={t.id}>
                          <td>{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                          <td><div className="flex items-center gap-2"><Tag size={12} className="text-secondary" /><span className="text-xs text-white/70">{t.categoria || 'Outros'}</span></div></td>
                          <td className="text-white font-medium">{t.entidade}</td>
                          <td><span className={t.concretizado ? 'text-green-400 text-xs' : 'text-white/20 text-xs'}>{t.concretizado ? 'Efetivado' : 'Previsto'}</span></td>
                          <td style={blurStyle} className="font-bold text-white text-right">{formatCurrencyBR(t.valor)}</td>
                          <td style={{ textAlign: 'right' }}>
                              <div className="flex gap-2 justify-end">
                                  {!t.concretizado && <button onClick={() => confirmarPagamento(t.id)} className="text-green-400"><CheckCircle2 size={16} /></button>}
                                  <button onClick={() => excluirTransacao(t.id)} className="text-white/20 hover:text-red-400"><Trash2 size={16} /></button>
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* Modal Lançamento */}
      <AnimatePresence>
        {modalTransacao && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-content glass-panel w-full max-w-xl p-8 scrollable">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl text-white font-serif uppercase tracking-widest">{tipoTransacao}</h3>
                <button onClick={() => setModalTransacao(false)}><X size={20} className="text-white/40" /></button>
              </div>
              <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg">
                  <button onClick={() => { setTipoTransacao('receita'); setFormTrans({...formTrans, categoria: 'Honorários Contratuais'}); }} className={tipoTransacao === 'receita' ? 'flex-1 btn-primary py-2 text-xs' : 'flex-1 text-white/40 py-2 text-xs'}>Receita</button>
                  <button onClick={() => { setTipoTransacao('despesa'); setFormTrans({...formTrans, categoria: 'Custas Processuais'}); }} className={tipoTransacao === 'despesa' ? 'flex-1 btn-primary py-2 text-xs' : 'flex-1 text-white/40 py-2 text-xs'}>Despesa</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-group"><label>Descrição / Cliente</label><input ref={firstInputRef} className="dark-input" value={formTrans.entidade} onChange={e => setFormTrans({...formTrans, entidade: e.target.value})} /></div>
                  <div className="input-group"><label>Categoria</label>
                    <select className="dark-select" value={formTrans.categoria} onChange={e => setFormTrans({...formTrans, categoria: e.target.value})}>
                        {(tipoTransacao === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group"><label>Valor R$</label><input className="dark-input font-bold" value={formTrans.valor} onChange={e => setFormTrans({...formTrans, valor: e.target.value})} /></div>
                  <div className="input-group"><label>Data</label><input type="date" className="dark-input text-xs" value={formTrans.data} onChange={e => setFormTrans({...formTrans, data: e.target.value})} /></div>
                  <div className="input-group"><label>Conta Bancária</label>
                    <select className="dark-select" value={formTrans.conta} onChange={e => setFormTrans({...formTrans, conta: e.target.value})}>
                        {contasBancarias.map((b: any) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="efet" checked={formTrans.concretizado} onChange={e => setFormTrans({...formTrans, concretizado: e.target.checked, status: e.target.checked ? (tipoTransacao === 'receita' ? 'recebido' : 'pago') : 'pendente'})} className="w-5 h-5 accent-secondary" />
                    <label htmlFor="efet" className="text-xs text-white/60 cursor-pointer">Lançamento Efetivado?</label>
                  </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                  <button onClick={() => setModalTransacao(false)} className="btn-outline px-6">Cancelar</button>
                  <button onClick={() => salvarTransacao()} disabled={isSaving || !formTrans.entidade || !formTrans.valor} className="btn-primary px-10">{isSaving ? 'Gravando...' : 'Confirmar'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Bancos Simples */}
      <AnimatePresence>
          {modalBancos && (
              <div className="modal-overlay">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-content glass-panel w-full max-w-sm p-6 scrollable">
                      <div className="flex justify-between items-center mb-6"><h3 className="text-white">Gerenciar Bancos</h3><button onClick={() => setModalBancos(false)}><X size={18} /></button></div>
                      <div className="flex gap-2 mb-4">
                          <input className="dark-input text-xs flex-1" placeholder="Nome do banco..." value={novoBancoForm.nome} onChange={e => setNovoBancoForm({...novoBancoForm, nome: e.target.value})} />
                          <button onClick={() => adicionarBanco()} className="btn-primary p-2"><Plus size={16} /></button>
                      </div>
                      <div className="space-y-2">{contasBancarias.map((b: any) => <div key={b.id} className="flex justify-between items-center p-2 bg-white/5 rounded"><span className="text-xs text-white">{b.nome}</span><button onClick={() => excluirBanco(b.id)}><Trash2 size={12} className="text-red-400" /></button></div>)}</div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}
