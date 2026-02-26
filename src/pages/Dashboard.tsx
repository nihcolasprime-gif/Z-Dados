import { useEffect, useState } from 'react';
import { getDashboardStats, type DashboardStats } from '../lib/api';
import {
    BarChart3, Building2, CheckCircle2, XCircle,
    DollarSign, TrendingUp, MapPin, Briefcase, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

// Contador Animado com Formatação Compacta (mi, bi, mil)
function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    const [displayed, setDisplayed] = useState(0);

    useEffect(() => {
        if (value === 0) return;
        const duration = 1200;
        const steps = 40;
        const increment = value / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;
            if (step >= steps) {
                setDisplayed(value);
                clearInterval(timer);
            } else {
                setDisplayed(Math.round(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    const formatado = new Intl.NumberFormat('pt-BR', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(displayed);

    return <span>{prefix}{formatado}{suffix}</span>;
}

// Barras Horizontais com Formatação Compacta (mi, bi, mil)
function HorizontalBar({ label, value, maxValue, color, index }: { label: string; value: number; maxValue: number; color: string; index: number }) {
    const [width, setWidth] = useState(0);
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

    useEffect(() => {
        const timer = setTimeout(() => setWidth(percentage), 100 + index * 150);
        return () => clearTimeout(timer);
    }, [percentage, index]);

    const formatado = new Intl.NumberFormat('pt-BR', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-white font-medium truncate max-w-[70%]" title={label}>{label}</span>
                <span className="text-zinc-400 font-mono tabular-nums">{formatado}</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                setIsLoading(true);
                const data = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                    <p className="text-zinc-400 text-lg">Carregando estatísticas...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-zinc-400">Não foi possível carregar os dados.</p>
            </div>
        );
    }

    const activePercent = stats.totalEmpresas > 0 ? ((stats.ativas / stats.totalEmpresas) * 100).toFixed(1) : '0';

    return (
        <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="text-center mb-14 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="inline-flex items-center gap-3 mb-6">
                    <div className="p-3 glass rounded-2xl">
                        <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-4">
                    Dashboard <span className="text-gradient">Z Dados</span>
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                    Panorama em tempo real da base de dados de empresas Brasileiras.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">

                {/* Total */}
                <div className="glass-card p-6 group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                            <Building2 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-sm text-zinc-400 font-semibold uppercase tracking-wider">Total</span>
                    </div>
                    <p className="text-3xl font-extrabold text-white tracking-tight">
                        <AnimatedCounter value={stats.totalEmpresas} />
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">empresas na base</p>
                </div>

                {/* Ativas */}
                <div className="glass-card p-6 group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-green-500/10 rounded-xl border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-sm text-zinc-400 font-semibold uppercase tracking-wider">Ativas</span>
                    </div>
                    <p className="text-3xl font-extrabold text-green-400 tracking-tight">
                        <AnimatedCounter value={stats.ativas} />
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">{activePercent}% do total</p>
                </div>

                {/* Inativas */}
                <div className="glass-card p-6 group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
                            <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-sm text-zinc-400 font-semibold uppercase tracking-wider">Inativas</span>
                    </div>
                    <p className="text-3xl font-extrabold text-red-400 tracking-tight">
                        <AnimatedCounter value={stats.inativas} />
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">{(100 - parseFloat(activePercent)).toFixed(1)}% do total</p>
                </div>

                {/* Capital Médio */}
                <div className="glass-card p-6 group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                            <DollarSign className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-sm text-zinc-400 font-semibold uppercase tracking-wider">Capital Médio</span>
                    </div>
                    <p className="text-2xl font-extrabold text-white tracking-tight">
                        <AnimatedCounter value={Math.round(stats.mediaCapital)} prefix="R$ " />
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">amostra das empresas</p>
                </div>
            </div>

            {/* Rankings Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">

                {/* Top UFs */}
                <div className="glass-card p-8">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
                            <MapPin className="w-5 h-5 text-sky-400" />
                        </div>
                        Top Estados (UF)
                    </h3>
                    {stats.topUFs.length > 0 ? (
                        <div className="space-y-5">
                            {stats.topUFs.map((item, i) => (
                                <HorizontalBar
                                    key={item.uf}
                                    label={item.uf}
                                    value={item.count}
                                    maxValue={stats.topUFs[0].count}
                                    color="bg-gradient-to-r from-sky-500 to-indigo-500"
                                    index={i}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 italic text-center py-4">Nenhum dado disponível.</p>
                    )}
                </div>

                {/* Top CNAEs */}
                <div className="glass-card p-8">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Briefcase className="w-5 h-5 text-purple-400" />
                        </div>
                        Top Atividades (CNAE)
                    </h3>
                    {stats.topCNAEs.length > 0 ? (
                        <div className="space-y-5">
                            {stats.topCNAEs.map((item, i) => (
                                <HorizontalBar
                                    key={item.cnae}
                                    label={item.cnae}
                                    value={item.count}
                                    maxValue={stats.topCNAEs[0].count}
                                    color="bg-gradient-to-r from-purple-500 to-pink-500"
                                    index={i}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 italic text-center py-4">Nenhum dado disponível.</p>
                    )}
                </div>
            </div>

            {/* Growth Indicator */}
            <div className="mt-12 animate-in fade-in duration-700 delay-700">
                <div className="glass-card p-8 text-center bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-white/10">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                        <h3 className="text-xl font-bold text-white">Base em Crescimento</h3>
                    </div>
                    <p className="text-zinc-400 max-w-xl mx-auto">
                        O Z Dados está constantemente importando novos registros da Receita Federal.
                        Com a migração para CockroachDB, em breve teremos os <strong className="text-white">70 milhões</strong> de empresas disponíveis.
                    </p>
                </div>
            </div>
        </div>
    );
}
