import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  Landmark, CreditCard, Building2, Coins, ChevronLeft,
  Edit2, Trash2, ArrowUpRight, ArrowDownRight,
  PieChart as PieChartIcon,
  CheckCircle2, Eye, EyeOff, RefreshCw, X, DollarSign, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../../contexts/AppContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transacao, Contrato } from '../../../models';
import { financeiroService } from '../../../services/financeiroService';

type FinanceiroTab = 'resumo' | 'receitas' | 'despesas' | 'pendentes';

const CONTAS = [
  { id: 'BB', nome: 'Banco do Brasil', icone: <Landmark size={16} /> },
  { id: 'Asaas', nome: 'Asaas', icone: <CreditCard size={16} /> },
  { id: 'Nubank', nome: 'Nubank', icone: <CreditCard size={16} /> },
  { id: 'Sicoob', nome: 'Sicoob', icone: <Building2 size={16} /> },
  { id: 'Dinheiro', nome: 'Dinheiro', icone: <Coins size={16} /> },
];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface FinanceiroData {
  transacoes: Transacao[];
  contratos: Contrato[];
  colaboradores: { id: string; nome: string; }[];
}

export default function FinanceiroPage() {
  const { reportError } = useApp();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<FinanceiroTab>('resumo');
  const [dadosVisiveis, setDadosVisiveis] = useState(true);
  const [editandoTransacao, setEditandoTransacao] = useState<Transacao | null>(null);
  const [modalTransacao, setModalTransacao] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState<'receita' | 'despesa' | 'distribuicao'>('receita');

  const now = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(now.getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(now.getFullYear());
  const [pagina, setPagina] = useState(0);
  const ITEMS_PER_PAGE = 50;
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [formTrans, setFormTrans] = useState({
    entidade: '', valor: '', data: now.toISOString().split('T')[0],
    status: 'pendente' as 'pendente' | 'recebido' | 'pago',
    concretizado: false, referencia: '', conta: 'BB',
    parcelas: '1', impostoPercent: '0', comissaoPercent: '0',
    distribuicao: [] as { id: string; nome: string; percentual: number }[]
  });

  useEffect(() => {
    if (modalTransacao) {
      setTimeout(() => firstInputRef.current?.focus(), 150);
    }
  }, [modalTransacao]);

  const { data, error } = useQuery<FinanceiroData, Error, FinanceiroData, (string | number)[]>({
    queryKey: ['financeiro', anoSelecionado, mesSelecionado, pagina],
    queryFn: () => financeiroService.fetchDashboardData(anoSelecionado, mesSelecionado, pagina, ITEMS_PER_PAGE),
  });

  useEffect(() => {
    if (error) {
      reportError('Erro Financeiro', 'Não foi possível carregar os dados financeiros. Por favor, tente novamente.');
    }
  }, [error, reportError]);

  const { transacoes = [], contratos = [], colaboradores = [] } = data || {};

  const carregarTransacoes = async () => {
    await queryClient.invalidateQueries({ queryKey: ['financeiro', anoSelecionado, mesSelecionado, pagina] });
  };

  const parseCurrency = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const formatCurrencyBR = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getSaldoConta = (contaId: string) => {
    return transacoes
      .filter(t => t.conta === contaId && t.concretizado)
      .reduce((sum, t) => sum + (t.tipo === 'receita' ? t.valor : -t.valor), 0);
  };

  const { mutate: salvarTransacao, isPending: isSaving } = useMutation({
    mutationFn: () => financeiroService.salvarTransacao({ formTrans, tipoTransacao, editandoTransacao, contratos, parseCurrency }),
    onSuccess: () => {
      toast.success(editandoTransacao ? 'Lançamento atualizado.' : 'Lançamento(s) criados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      setModalTransacao(false);
      setEditandoTransacao(null);
      setFormTrans({ entidade: '', valor: '', data: now.toISOString().split('T')[0], status: 'pendente', concretizado: false, referencia: '', conta: 'BB', parcelas: '1', impostoPercent: '0', comissaoPercent: '0', distribuicao: [] });
    },
    onError: (err: Error) => reportError('Erro ao Salvar', err.message || 'Houve um problema técnico ao registrar o lançamento.'),
  });

  const { mutate: excluirTransacao } = useMutation({
    mutationFn: (id: string) => financeiroService.excluirTransacao(id),
    onSuccess: () => {
      toast.success('Lançamento excluído.');
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
    },
    onError: (err: Error) => reportError('Erro ao Excluir', err.message || 'Não foi possível remover o lançamento.'),
  });

  const { mutate: confirmarPagamento } = useMutation({
    mutationFn: (id: string) => financeiroService.confirmarPagamento(id, transacoes),
    onSuccess: () => {
      toast.success('Transação confirmada (Realizado)');
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
    },
    onError: () => toast.error('Erro ao confirmar transação'),
  });

  const { mutate: pagarComissoesLiberadas } = useMutation({
    mutationFn: (liberadas: Transacao[]) => financeiroService.pagarComissoesLiberadas(liberadas),
    onSuccess: (liberadas) => {
      toast.success(`${liberadas.length} comissões pagas com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
    },
    onError: (err: Error) => reportError('Erro ao Pagar Comissões', err.message)
  });

  const handleExcluirTransacao = (id: string) => {
    const trans = transacoes.find(t => t.id === id);
    if (!trans) return;
    let description = 'Esta ação não pode ser desfeita.';
    if (transacoes.some(t => t.parent_id === id)) description = "AVISO: Impostos e comissões vinculados também serão EXCLUÍDOS.";
    toast(`Excluir o lançamento "${trans.entidade}"?`, {
      description,
      action: { label: 'Confirmar Exclusão', onClick: () => excluirTransacao(id) },
      cancel: { label: 'Cancelar', onClick: () => { } }, duration: 8000,
    });
  };

  const handlePagarComissoesLiberadas = () => {
    const liberadas = transacoes.filter(t => t.tipo === 'distribuicao' && !t.concretizado && transacoes.find(p => p.id === t.parent_id)?.concretizado);
    if (liberadas.length === 0) return toast.info('Nenhuma comissão liberada para pagar.');
    const total = liberadas.reduce((s, t) => s + t.valor, 0);
    toast(`Pagar ${liberadas.length} comissões liberadas?`, {
      description: `O valor total de ${formatCurrencyBR(total)} será marcado como pago.`,
      action: { label: 'Confirmar Pagamento', onClick: () => pagarComissoesLiberadas(liberadas) },
      cancel: { label: 'Cancelar', onClick: () => { } }, duration: 8000,
    });
  };

  const formatarDataBR = (data: string) => {
    if (!data) return '-';
    const [y, m, d] = data.split('-');
    return `${d}/${m}/${y}`;
  };

  const transFiltered = useMemo(() => (transacoes || []).filter(t => {
    if (!t.data) return false;
    const d = new Date(t.data);
    return d.getMonth() === mesSelecionado && d.getFullYear() === anoSelecionado;
  }), [transacoes, mesSelecionado, anoSelecionado]);

  const totalReceitas = useMemo(() =>
    transFiltered.filter(t => t.tipo === 'receita' && t.concretizado).reduce((s, t) => s + t.valor, 0),
    [transFiltered]
  );

  const totalDespesas = useMemo(() =>
    transFiltered.filter(t => t.tipo === 'despesa' && t.concretizado).reduce((s, t) => s + t.valor, 0),
    [transFiltered]
  );

  const totalComissoes = useMemo(() =>
    transFiltered.filter(t => t.tipo === 'distribuicao' && t.concretizado).reduce((s, t) => s + t.valor, 0),
    [transFiltered]
  );

  const totalProjetadoMes = totalReceitas - (totalDespesas + totalComissoes);

  const dadosPizza = useMemo(() => [
    { name: 'Receitas', value: totalReceitas, color: '#22c55e' },
    { name: 'Despesas', value: totalDespesas, color: '#f59e0b' },
    { name: 'Comissões', value: totalComissoes, color: '#3b82f6' },
  ].filter(d => d.value > 0), [totalReceitas, totalDespesas, totalComissoes]);

  const blurStyle = {
    filter: !dadosVisiveis ? 'blur(12px)' : 'none',
    userSelect: (!dadosVisiveis ? 'none' : 'auto') as React.CSSProperties['userSelect'],
    transition: 'filter 0.3s ease',
    pointerEvents: (!dadosVisiveis ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">
            Overview <span className="font-bold">Financeiro</span>
          </h1>
          <p className="text-muted text-sm mt-1">Visão geral e gestão de fluxo de caixa.</p>
        </div>
        <div className="flex flex-col gap-3 items-end">
          <div className="flex gap-3 items-center">
            <button onClick={() => {
              if (mesSelecionado === 0) {
                setMesSelecionado(11);
                setAnoSelecionado(a => a - 1);
              } else {
                setMesSelecionado(m => m - 1);
              }
            }} className="btn-icon text-white"><ChevronLeft size={20} /></button>
            <div className="glass-panel px-4 py-2 text-white font-semibold text-sm min-w-[150px] text-center">{MESES[mesSelecionado]} {anoSelecionado}</div>
            <button onClick={() => {
              if (mesSelecionado === 11) {
                setMesSelecionado(0);
                setAnoSelecionado(a => a + 1);
              } else {
                setMesSelecionado(m => m + 1);
              }
            }} className="btn-icon text-white"><ChevronRight size={20} /></button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => carregarTransacoes()} className="btn-outline">
              <RefreshCw size={16} /> Atualizar
            </button>
            <button onClick={() => setDadosVisiveis(!dadosVisiveis)} className="btn-outline">
              {dadosVisiveis ? <Eye size={16} /> : <EyeOff size={16} />}
              {dadosVisiveis ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'resumo', label: 'Resumo', icon: <PieChartIcon size={16} /> },
          { id: 'receitas', label: 'Receitas', icon: <ArrowUpRight size={16} /> },
          { id: 'despesas', label: 'Despesas', icon: <ArrowDownRight size={16} /> },
          { id: 'pendentes', label: 'Pendentes', icon: <CheckCircle2 size={16} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as FinanceiroTab)}
            className={activeTab === t.id ? 'btn-primary' : 'btn-outline'}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'resumo' && (
          <motion.div key="resumo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="glass-panel p-5" style={blurStyle}>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight size={14} className="text-green-400" />
                  <span className="text-muted text-xs uppercase tracking-widest">Receitas</span>
                </div>
                <span className="text-2xl font-bold text-green-400">{formatCurrencyBR(totalReceitas)}</span>
              </div>
              <div className="glass-panel p-5" style={blurStyle}>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight size={14} className="text-yellow-400" />
                  <span className="text-muted text-xs uppercase tracking-widest">Despesas</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{formatCurrencyBR(totalDespesas)}</span>
              </div>
              <div className="glass-panel p-5" style={blurStyle}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-blue-400" />
                  <span className="text-muted text-xs uppercase tracking-widest">Comissões</span>
                </div>
                <span className="text-2xl font-bold text-blue-400">{formatCurrencyBR(totalComissoes)}</span>
              </div>
              <div className="glass-panel p-5 border-white/10" style={blurStyle}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-white" />
                  <span className="text-muted text-xs uppercase tracking-widest">Líquido</span>
                </div>
                <span className={`text-2xl font-bold ${totalProjetadoMes >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatCurrencyBR(totalProjetadoMes)}
                </span>
              </div>
            </div>

            {/* Chart + Balance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-panel p-6 lg:col-span-2">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-serif text-lg text-white mb-1">Balanço Mensal</h3>
                    <p className="text-muted text-sm">Proporção de entradas e saídas</p>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px] h-[220px]">
                    {dadosPizza.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dadosPizza} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                            {dadosPizza.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                            contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-40 w-40 border-2 border-dashed border-white/10 rounded-full mx-auto">
                        <p className="text-muted text-xs">Sem dados</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-[200px] flex flex-col gap-3 pl-6" style={blurStyle}>
                    <div>
                      <p className="text-muted text-xs mb-0.5">Receitas</p>
                      <h3 className="text-lg font-bold text-green-400">{formatCurrencyBR(totalReceitas)}</h3>
                    </div>
                    <div>
                      <p className="text-muted text-xs mb-0.5">Despesas</p>
                      <h3 className="text-lg font-bold text-yellow-400">{formatCurrencyBR(totalDespesas)}</h3>
                    </div>
                    <div>
                      <p className="text-muted text-xs mb-0.5">Comissões</p>
                      <h3 className="text-lg font-bold text-blue-400">{formatCurrencyBR(totalComissoes)}</h3>
                    </div>
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-muted text-xs mb-0.5">Líquido Projetado (Mês)</p>
                      <h2 className={`text-xl font-bold ${totalProjetadoMes >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {formatCurrencyBR(totalProjetadoMes)}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-serif text-lg text-white">Saldos por Conta</h3>
                  <span className="text-xs text-muted">Até {MESES[mesSelecionado]}</span>
                </div>
                <div style={blurStyle}>
                  {CONTAS.map(conta => (
                    <div key={conta.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">{conta.icone}</div>
                        <span className="text-sm text-white/80">{conta.nome}</span>
                      </div>
                      <strong className="text-sm text-white">{formatCurrencyBR(getSaldoConta(conta.id))}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="glass-panel mt-6 overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b border-white/5">
                <h3 className="text-serif text-white">Movimentações do Mês</h3>
                <button onClick={() => setModalTransacao(true)} className="btn-primary text-sm">
                  <Plus size={16} /> Novo Lançamento
                </button>
              </div>
              <table className="dark-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {transFiltered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-muted">Nenhuma movimentação neste período.</td></tr>
                  ) : (
                    transFiltered.map(t => (
                      <tr key={t.id}>
                        <td>{formatarDataBR(t.data)}</td>
                        <td className="font-medium text-white">{t.entidade}</td>
                        <td>
                          <span className={`badge ${t.tipo === 'receita' ? 'badge-success' : t.tipo === 'despesa' ? 'badge-warning' : 'badge-neutral'}`}>
                            {t.tipo === 'receita' ? 'Receita' : t.tipo === 'despesa' ? 'Despesa' : 'Comissão'}
                          </span>
                        </td>
                        <td>
                          <span className={t.concretizado ? 'text-green-400' : 'text-white/40'}>
                            {t.concretizado ? '● Realizado' : '○ Previsto'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`font-semibold ${t.tipo === 'receita' ? 'text-green-400' : 'text-white/70'}`} style={blurStyle}>
                            {formatCurrencyBR(t.valor)}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1 justify-center">
                            {!t.concretizado && (
                              <button className="btn-icon text-green-400" onClick={() => confirmarPagamento(t.id)} title="Confirmar">
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            <button className="btn-icon text-red-400" onClick={() => handleExcluirTransacao(t.id)} title="Excluir">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'receitas' && (
          <motion.div key="receitas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-panel overflow-hidden">
              <table className="dark-table">
                <thead><tr><th>Data</th><th>Entidade</th><th>Status</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
                <tbody>
                  {transFiltered.filter(t => t.tipo === 'receita').map(t => (
                    <tr key={t.id}>
                      <td>{formatarDataBR(t.data)}</td>
                      <td className="font-medium text-white">{t.entidade}</td>
                      <td><span className={t.concretizado ? 'text-green-400' : 'text-white/40'}>{t.concretizado ? '● Recebido' : '○ Pendente'}</span></td>
                      <td style={{ textAlign: 'right' }} className="font-semibold text-green-400">{formatCurrencyBR(t.valor)}</td>
                    </tr>
                  ))}
                  {transFiltered.filter(t => t.tipo === 'receita').length === 0 && (
                    <tr><td colSpan={4} className="text-center py-12 text-muted">Nenhuma receita registrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'despesas' && (
          <motion.div key="despesas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-panel overflow-hidden">
              <table className="dark-table">
                <thead><tr><th>Data</th><th>Entidade</th><th>Status</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
                <tbody>
                  {transFiltered.filter(t => t.tipo !== 'receita').map(t => (
                    <tr key={t.id}>
                      <td>{formatarDataBR(t.data)}</td>
                      <td className="font-medium text-white">{t.entidade}</td>
                      <td><span className={t.concretizado ? 'text-yellow-400' : 'text-white/40'}>{t.concretizado ? '● Pago' : '○ Pendente'}</span></td>
                      <td style={{ textAlign: 'right' }} className="font-semibold text-yellow-400">{formatCurrencyBR(t.valor)}</td>
                    </tr>
                  ))}
                  {transFiltered.filter(t => t.tipo !== 'receita').length === 0 && (
                    <tr><td colSpan={4} className="text-center py-12 text-muted">Nenhuma despesa registrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'pendentes' && (
          <motion.div key="pendentes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-panel overflow-hidden">
              <table className="dark-table">
                <thead><tr><th>Data</th><th>Entidade</th><th>Tipo</th><th style={{ textAlign: 'right' }}>Valor</th><th></th></tr></thead>
                <tbody>
                  {transFiltered.filter(t => !t.concretizado).map(t => (
                    <tr key={t.id}>
                      <td>{formatarDataBR(t.data)}</td>
                      <td className="font-medium text-white">{t.entidade}</td>
                      <td><span className={`badge ${t.tipo === 'receita' ? 'badge-success' : 'badge-warning'}`}>{t.tipo}</span></td>
                      <td style={{ textAlign: 'right' }} className="font-semibold">{formatCurrencyBR(t.valor)}</td>
                      <td><button className="btn-icon text-green-400" onClick={() => confirmarPagamento(t.id)}><CheckCircle2 size={16} /></button></td>
                    </tr>
                  ))}
                  {transFiltered.filter(t => !t.concretizado).length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-muted">Nenhuma transação pendente.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
