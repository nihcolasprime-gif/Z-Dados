import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Empresa } from '../../types';
import { Building2, MapPin, CheckCircle2, XCircle, Printer, X, FileText, List, Download, FileSpreadsheet, FileDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { exportToCSV, exportToExcel } from '../../lib/exportUtils';

interface SearchResultsProps {
    results: Empresa[];
    isLoading: boolean;
}

export default function SearchResults({ results, isLoading }: SearchResultsProps) {
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const handlePrint = (mode: 'simple' | 'complete') => {
        setIsPrintModalOpen(false);
        document.body.classList.add(`print-${mode}`);

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove(`print-${mode}`);
            }, 1000);
        }, 100);
    };
    if (isLoading) {
        return (
            <div className="w-full max-w-5xl mx-auto mt-12 space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card h-24 w-full" />
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return null;
    }

    const formatCNPJ = (cnpj: string) => {
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    };

    return (
        <div className="w-full max-w-5xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6 px-2 text-zinc-400 no-print">
                <h3 className="font-medium">{results.length} resultado(s) encontrado(s)</h3>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="glass-button flex items-center gap-2 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all border border-emerald-500/20 text-emerald-400 hover:text-emerald-300"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar Leads</span>
                    </button>
                    <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="glass-button flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all border border-white/10 text-white"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">Imprimir Relatório</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {results.map((empresa) => (
                    <Link
                        to={`/empresa/${empresa.cnpj}`}
                        key={empresa.cnpj}
                        className="group"
                    >
                        <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:-translate-y-1 transition-transform duration-300">

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm tracking-wider text-white/70 bg-white/5 py-1 px-3 rounded-full border border-white/10">
                                        {formatCNPJ(empresa.cnpj)}
                                    </span>
                                    <div className={cn(
                                        "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border complete-only",
                                        empresa.status_ativa
                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                        {empresa.status_ativa ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {empresa.status_ativa ? 'ATIVA' : 'INATIVA'}
                                    </div>
                                </div>

                                <h4 className="text-xl font-bold text-white group-hover:text-gradient transition-all duration-300 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-zinc-500 group-hover:text-white/80 transition-colors" />
                                    {empresa.nome_fantasia || empresa.razao_social}
                                </h4>

                                {empresa.nome_fantasia && (
                                    <p className="text-sm text-zinc-400 complete-only">Razão Social: {empresa.razao_social}</p>
                                )}
                            </div>

                            <div className="flex flex-col md:items-end justify-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    {empresa.municipio} - {empresa.uf}
                                </div>
                                {empresa.cnae_principal && (
                                    <div className="text-xs text-zinc-500 max-w-[200px] truncate md:text-right complete-only" title={empresa.cnae_principal}>
                                        {empresa.cnae_principal}
                                    </div>
                                )}
                            </div>

                        </div>
                    </Link>
                ))}
            </div>

            {/* Print Options Modal */}
            {isPrintModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
                    <div className="glass-panel w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsPrintModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-2">Formato do Relatório</h2>
                        <p className="text-zinc-400 mb-6 text-sm">Escolha como deseja visualizar os dados impressos ou gerar o PDF.</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handlePrint('simple')}
                                className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-indigo-500/50 hover:bg-white/5 transition-all group flex gap-4"
                            >
                                <div className="p-3 bg-white/5 rounded-lg h-fit group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                    <List className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Relatório Simples</h3>
                                    <p className="text-sm text-zinc-400 mt-1.5">Lista apenas Nomes, Cidades e CNPJ, economizando espaço na impressão.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handlePrint('complete')}
                                className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-purple-500/50 hover:bg-white/5 transition-all group flex gap-4"
                            >
                                <div className="p-3 bg-white/5 rounded-lg h-fit group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Relatório Completo</h3>
                                    <p className="text-sm text-zinc-400 mt-1.5">Exibe todos os campos disponíveis na busca como CNAE e Situação.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Options Modal */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
                    <div className="glass-panel w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsExportModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-2">Exportar Leads</h2>
                        <p className="text-zinc-400 mb-6 text-sm">Escolha o formato para baixar os {results.length} resultado(s) da busca.</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => { exportToCSV(results); setIsExportModalOpen(false); }}
                                className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-emerald-500/50 hover:bg-white/5 transition-all group flex gap-4"
                            >
                                <div className="p-3 bg-white/5 rounded-lg h-fit group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                                    <FileDown className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Arquivo CSV</h3>
                                    <p className="text-sm text-zinc-400 mt-1.5">Formato universal, abre diretamente no Excel, Google Sheets e outros.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { exportToExcel(results); setIsExportModalOpen(false); }}
                                className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-sky-500/50 hover:bg-white/5 transition-all group flex gap-4"
                            >
                                <div className="p-3 bg-white/5 rounded-lg h-fit group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-colors">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Arquivo Excel (.xls)</h3>
                                    <p className="text-sm text-zinc-400 mt-1.5">Planilha formatada com cabeçalhos coloridos, pronta para análise.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
