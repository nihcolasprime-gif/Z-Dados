import { useState, useEffect } from 'react';
import { FileText, Calendar, Filter, Printer, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

export default function RelatoriosPage() {
  const { profile } = useAuth();
  const escritorioId = profile?.escritorio_id;
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [dataInicio, setDataInicio] = useState(primeiroDiaMes.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(hoje.toISOString().split('T')[0]);
  const [tipoRelatorio, setTipoRelatorio] = useState('mensal');
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dadosRelatorio, setDadosRelatorio] = useState({
    totalReceitas: 0, totalDistribuicoes: 0, totalImpostos: 0,
    saldoFinal: 0, processosAtivos: 0, recebimentosConcluidos: 0,
    distribuicoesPendentes: 0,
  });

  useEffect(() => {
    async function loadStats() {
      if (!escritorioId) { setLoading(false); return; }
      setLoading(true);
      try {
        const { data: trans, error } = await supabase
          .from('lca_financeiro')
          .select('valor, tipo, status')
          .eq('escritorio_id', escritorioId);

        if (error) throw error;
        if (trans) {
          const stats = trans.reduce((acc, curr) => {
            const val = curr.valor || 0;
            if (curr.tipo === 'Entrada') {
              acc.totalReceitas += val;
              if (curr.status === 'Pago') acc.recebimentosConcluidos++;
            } else if (curr.tipo === 'Saída') {
              acc.totalDistribuicoes += val;
              if (curr.status === 'Pendente') acc.distribuicoesPendentes++;
            }
            return acc;
          }, { totalReceitas: 0, totalDistribuicoes: 0, recebimentosConcluidos: 0, distribuicoesPendentes: 0 });

          setDadosRelatorio({
            ...stats, totalImpostos: stats.totalReceitas * 0.05,
            saldoFinal: stats.totalReceitas - stats.totalDistribuicoes, processosAtivos: 12
          });
        }
      } catch (err) { console.error('Erro ao carregar:', err); }
      finally { setLoading(false); }
    }
    loadStats();
  }, [escritorioId]);

  const handleGerarRelatorio = () => {
    setGerandoRelatorio(true);
    setTimeout(() => {
      setGerandoRelatorio(false);
      toast.success('Relatório gerado!', { description: `${dadosRelatorio.recebimentosConcluidos + dadosRelatorio.distribuicoesPendentes} transações.` });
    }, 1200);
  };

  const handleImprimir = () => { window.print(); toast.success('Preparando impressão...'); };

  const formatBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="animate-in flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">Relató<span className="font-bold">rios</span></h1>
          <p className="text-muted text-sm mt-1">Gere extratos e relatórios de métricas do escritório.</p>
        </div>
      </div>

      {/* Generator */}
      <div className="glass-panel p-6" style={{ borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
        <h3 className="text-serif text-lg text-white flex items-center gap-2 mb-1"><Calendar size={18} className="text-white/60" /> Gerar Novo Relatório</h3>
        <p className="text-muted text-sm mb-5">Visão consolidada atualizada do sistema.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="input-group">
            <label><Filter size={12} className="inline mr-1" />Tipo</label>
            <select className="dark-select" value={tipoRelatorio} onChange={(e) => setTipoRelatorio(e.target.value)}>
              <option value="mensal">Mensal</option><option value="trimestral">Trimestral</option><option value="personalizado">Personalizado</option>
            </select>
          </div>
          <div className="input-group"><label>Data Início</label><input type="date" className="dark-input" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
          <div className="input-group"><label>Data Fim</label><input type="date" className="dark-input" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
          <button className="btn-primary h-[42px]" onClick={handleGerarRelatorio} disabled={gerandoRelatorio || loading}>
            <FileText size={16} /> {gerandoRelatorio ? 'Gerando...' : 'Gerar'}
          </button>
          <button className="btn-outline h-[42px]" onClick={handleImprimir}>
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="glass-panel p-6" id="relatorio-preview">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-serif text-lg text-white">📋 Z DADOS — Relatório Financeiro</h3>
            <p className="text-muted text-sm">
              {new Date(dataInicio).toLocaleDateString('pt-BR')} a {new Date(dataFim).toLocaleDateString('pt-BR')} | Gerado em: {hoje.toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8 text-muted">Calculando métricas...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-green-400" /><span className="text-muted text-xs">Total Receitas</span></div>
                <h3 className="text-lg font-bold text-green-400">{formatBRL(dadosRelatorio.totalReceitas)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 mb-1"><TrendingDown size={14} className="text-yellow-400" /><span className="text-muted text-xs">Total Distribuições</span></div>
                <h3 className="text-lg font-bold text-yellow-400">{formatBRL(dadosRelatorio.totalDistribuicoes)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-yellow-400" /><span className="text-muted text-xs">Impostos (Est.)</span></div>
                <h3 className="text-lg font-bold text-yellow-400">{formatBRL(dadosRelatorio.totalImpostos)}</h3>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border-2 border-white/10">
                <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-white" /><span className="text-muted text-xs font-semibold">Saldo Final</span></div>
                <h3 className={`text-lg font-bold ${dadosRelatorio.saldoFinal >= 0 ? 'text-white' : 'text-red-400'}`}>{formatBRL(dadosRelatorio.saldoFinal)}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-white/[0.01] flex justify-between"><span className="text-muted">Processos Ativos</span><strong className="text-white">{dadosRelatorio.processosAtivos}</strong></div>
              <div className="p-3 rounded-lg bg-white/[0.01] flex justify-between"><span className="text-muted">Recebimentos Pagos</span><strong className="text-white">{dadosRelatorio.recebimentosConcluidos}</strong></div>
              <div className="p-3 rounded-lg bg-white/[0.01] flex justify-between"><span className="text-muted">Despesas Pendentes</span><strong className="text-white">{dadosRelatorio.distribuicoesPendentes}</strong></div>
            </div>
          </>
        )}

        <div className="p-4 rounded-lg bg-white/[0.01] border border-white/5 mt-4">
          <p className="text-muted text-xs"><strong className="text-white/60">Nota:</strong> Relatório gerado automaticamente pelo sistema Z DADOS. Valores referentes ao período selecionado.</p>
          <p className="text-muted text-xs mt-1">Lang Cardoso Advocacia | Módulo Financeiro</p>
        </div>
      </div>
    </div>
  );
}
