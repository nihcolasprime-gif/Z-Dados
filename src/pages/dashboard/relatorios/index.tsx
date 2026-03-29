import { useState, useEffect } from 'react';
import { 
  FileText, Calendar, TrendingUp, TrendingDown, DollarSign, 
  Users, Briefcase, Activity, CheckCircle2, Clock
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState({
    receitaTotal: 0,
    despesaTotal: 0,
    honorarios: 0,
    custas: 0,
    processosAtivos: 0,
    leadsAbertos: 0,
    conversaoCrm: 0,
    vlpProjetado: 0
  });

  const [periodo, setPeriodo] = useState('mes');

  useEffect(() => {
    async function carregarInteligencia() {
      setLoading(true);
      try {
        // 1. Transações reais
        const { data: trans } = await supabase.from('transacoes').select('valor, tipo, categoria, concretizado');
        
        // 2. Processos reais
        const { count: procCount } = await supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status', 'ativo');
        
        // 3. CRM real
        const { data: leads } = await supabase.from('crm_orcamentos').select('status');

        if (trans) {
          const stats = trans.reduce((acc, t) => {
            if (t.tipo === 'receita' && t.concretizado) {
              acc.receita += t.valor;
              if (t.categoria?.includes('Honorários')) acc.honorarios += t.valor;
              if (t.categoria?.includes('Custas')) acc.custas += t.valor;
            } else if (t.tipo === 'despesa' && t.concretizado) {
              acc.despesa += t.valor;
            }
            return acc;
          }, { receita: 0, despesa: 0, honorarios: 0, custas: 0 });

          const leadsTotal = leads?.length || 0;
          const leadsConvertidos = leads?.filter(l => l.status === 'virou_cliente').length || 0;
          const taxaConversao = leadsTotal > 0 ? (leadsConvertidos / leadsTotal) * 100 : 0;

          setDados({
            receitaTotal: stats.receita,
            despesaTotal: stats.despesa,
            honorarios: stats.honorarios,
            custas: stats.custas,
            processosAtivos: procCount || 0,
            leadsAbertos: leads?.filter(l => l.status !== 'virou_cliente' && l.status !== 'perda').length || 0,
            conversaoCrm: taxaConversao,
            vlpProjetado: stats.receita - stats.despesa
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao consolidar teia de dados.');
      } finally {
        setLoading(false);
      }
    }
    carregarInteligencia();
  }, []);

  const formatBRL = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="animate-in flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest">Torre de <span className="font-bold">Controle</span></h1>
          <p className="text-muted text-sm mt-1">Inteligência consolidada da sua teia operacional.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button onClick={() => setPeriodo('mes')} className={`px-4 py-1.5 rounded-md text-xs transition-all ${periodo === 'mes' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40'}`}>Este Mês</button>
            <button onClick={() => setPeriodo('ano')} className={`px-4 py-1.5 rounded-md text-xs transition-all ${periodo === 'ano' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40'}`}>Este Ano</button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Activity className="text-secondary animate-pulse" size={40} />
            <p className="text-muted text-sm animate-pulse">Sincronizando Teia de Dados...</p>
        </div>
      ) : (
        <>
          {/* Métricas de Topo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-6 border-l-4 border-secondary">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><TrendingUp size={20} /></div>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Líquido</span>
               </div>
               <h3 className="text-2xl font-bold text-white">{formatBRL(dados.vlpProjetado)}</h3>
               <p className="text-[10px] text-white/40 mt-1 italic">Resultado operacional real</p>
            </div>
            <div className="glass-panel p-6 border-l-4 border-green-500">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><DollarSign size={20} /></div>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Honorários</span>
               </div>
               <h3 className="text-2xl font-bold text-white">{formatBRL(dados.honorarios)}</h3>
               <p className="text-[10px] text-white/40 mt-1 italic">Lucro bruto advocatício</p>
            </div>
            <div className="glass-panel p-6 border-l-4 border-blue-500">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Briefcase size={20} /></div>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Processos</span>
               </div>
               <h3 className="text-2xl font-bold text-white">{dados.processosAtivos}</h3>
               <p className="text-[10px] text-white/40 mt-1 italic">Demandas ativas no judiciário</p>
            </div>
            <div className="glass-panel p-6 border-l-4 border-purple-500">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Users size={20} /></div>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Conversão</span>
               </div>
               <h3 className="text-2xl font-bold text-white">{dados.conversaoCrm.toFixed(1)}%</h3>
               <p className="text-[10px] text-white/40 mt-1 italic">Taxa de sucesso do CRM</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-8">
               <h3 className="text-serif text-lg text-white mb-6 flex items-center gap-2"><CheckCircle2 className="text-secondary" size={20} /> Saúde da Operação</h3>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs mb-2"><span className="text-muted">Proporção Honorários / Custas</span><span className="text-white font-bold">{((dados.honorarios / (dados.receitaTotal || 1)) * 100).toFixed(0)}% Honorários</span></div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-secondary transition-all" style={{ width: `${(dados.honorarios / (dados.receitaTotal || 1)) * 100}%` }} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-muted uppercase mb-1">Repasse de Custas</p>
                        <p className="text-sm font-bold text-white">{formatBRL(dados.custas)}</p>
                     </div>
                     <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-muted uppercase mb-1">Leads em Aberto</p>
                        <p className="text-sm font-bold text-white">{dados.leadsAbertos} Prospectos</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="glass-panel p-8">
                <h3 className="text-serif text-lg text-white mb-6 flex items-center gap-2"><Clock size={20} className="text-secondary" /> Próximos Passos Sugeridos</h3>
                <div className="space-y-4">
                    {dados.conversaoCrm < 20 && (
                        <div className="flex gap-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <TrendingDown className="text-yellow-500 shrink-0" size={20} />
                            <div>
                                <p className="text-sm text-white font-medium">Melhorar Funil de Vendas</p>
                                <p className="text-xs text-white/50">Sua taxa de conversão está abaixo de 20%. Considere treinar a equipe de primeiro atendimento.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                        <div>
                            <p className="text-sm text-white font-medium font-bold">Fluxo de Caixa Positivo</p>
                            <p className="text-xs text-white/50">Você está operando no azul. É um excelente momento para reinvestir em Marketing de Processos.</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
