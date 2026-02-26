import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEmpresa } from '../lib/api';
import type { Empresa, Socio } from '../types';
import {
    MapPin, Calendar,
    DollarSign, Briefcase, Phone,
    Mail, CheckCircle2, XCircle,
    ArrowLeft, Users, Globe, Instagram, Sparkles, Printer, X, FileText, List, Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { exportToCSV } from '../lib/exportUtils';

export default function EmpresaDetails() {
    const { cnpj } = useParams<{ cnpj: string }>();
    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [socios, setSocios] = useState<Socio[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    useEffect(() => {
        async function fetchDetails() {
            if (!cnpj) return;

            try {
                setIsLoading(true);
                const data = await getEmpresa(cnpj);
                setEmpresa(data.empresa);
                setSocios(data.socios);
            } catch (error) {
                console.error('Erro ao buscar empresa:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchDetails();
    }, [cnpj]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!empresa) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-3xl font-bold mb-4">Empresa não encontrada</h2>
                <Link to="/" className="text-zinc-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar para a busca
                </Link>
            </div>
        );
    }

    const formatCNPJ = (cnpj: string) => {
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return 'Não informado';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Não informada';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // Real data from scraper or falback
    const phone = empresa.telefone_real || "Não informado";
    const email = empresa.email_real || "Não informado";
    const site = empresa.site || null;
    const isEnriched = !empresa.necessita_enriquecimento && (empresa.telefone_real || empresa.email_real);

    const generateWhatsAppLink = (phoneString: string) => {
        if (phoneString === "Não informado") return "#";
        const cleanNumber = phoneString.replace(/\D/g, '');
        return `https://wa.me/55${cleanNumber}`;
    };

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

    return (
        <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-700">

            <div className="flex justify-between items-center mb-8 no-print">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white group transition-colors">
                    <div className="p-2 glass rounded-full group-hover:-translate-x-1 transition-transform">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Voltar para a busca
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => empresa && exportToCSV([empresa], `empresa-${empresa.cnpj}`)}
                        className="glass-button flex items-center gap-2 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-xl transition-all border border-emerald-500/20 text-emerald-400 hover:text-emerald-300"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar Dados</span>
                    </button>
                    <button onClick={() => setIsPrintModalOpen(true)} className="glass-button flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/10 text-white">
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">Imprimir Relatório</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-8">

                    <div className="glass-card p-8 md:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full group-hover:bg-white/10 transition-colors duration-700" />

                        <div className="relative z-10">
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <span className="font-mono text-lg tracking-wider bg-white/10 px-4 py-1.5 rounded-full border border-white/20 shadow-inner">
                                    {formatCNPJ(empresa.cnpj)}
                                </span>
                                <div className={cn(
                                    "flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full border shadow-[0_0_15px_#00000080]",
                                    empresa.status_ativa
                                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                                        : "bg-red-500/20 text-red-500 border-red-500/30"
                                )}>
                                    {empresa.status_ativa ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {empresa.status_ativa ? 'ATIVA' : 'BAIXADA'}
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                                {empresa.nome_fantasia || empresa.razao_social}
                            </h1>

                            {empresa.nome_fantasia && (
                                <p className="text-xl text-zinc-400 font-medium mb-8">
                                    {empresa.razao_social}
                                </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-white/10">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400 uppercase tracking-wider font-semibold">
                                        <Calendar className="w-4 h-4" /> Data de Abertura
                                    </div>
                                    <p className="text-xl text-white font-medium">{formatDate(empresa.data_abertura)}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400 uppercase tracking-wider font-semibold">
                                        <DollarSign className="w-4 h-4" /> Capital Social
                                    </div>
                                    <p className="text-xl text-white font-medium text-gradient">{formatCurrency(empresa.capital_social)}</p>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400 uppercase tracking-wider font-semibold">
                                        <Briefcase className="w-4 h-4" /> Atividade Principal (CNAE)
                                    </div>
                                    <p className="text-lg text-white/90">{empresa.cnae_principal || 'Não informada'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Socios Box */}
                    <div className="glass-card p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                            <Users className="w-6 h-6 text-zinc-400" />
                            Quadro Societário
                        </h3>

                        {socios.length > 0 ? (
                            <ul className="space-y-4">
                                {socios.map((socio) => (
                                    <li key={socio.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                                        <span className="font-medium text-lg text-white">{socio.nome_socio}</span>
                                        <span className="text-sm text-zinc-400 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full mt-2 sm:mt-0 w-fit">
                                            {socio.qualificacao || 'SÓCIO'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-zinc-500 italic py-4 text-center">Nenhum sócio registrado nesta empresa.</p>
                        )}
                    </div>
                </div>

                {/* Sidebar Info Column */}
                <div className="space-y-6">

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                            <MapPin className="w-5 h-5 text-zinc-400" />
                            Endereço
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <span className="block text-xs text-zinc-500 uppercase font-semibold mb-1">CEP</span>
                                <span className="text-white">{empresa.cep ? empresa.cep.replace(/^(\d{5})(\d{3})/, "$1-$2") : 'Não informado'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-zinc-500 uppercase font-semibold mb-1">Município - UF</span>
                                <span className="text-white font-medium">{empresa.municipio} - {empresa.uf}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 relative overflow-hidden group">
                        {/* Subtle glow behind contact box */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-500/5 pointer-events-none" />

                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                Contato Oficial
                            </h3>
                            {isEnriched && (
                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-md border border-violet-500/20" title="Dados minerados em tempo real pela IA do Z Dados">
                                    <Sparkles className="w-3 h-3" /> IA Enriched
                                </span>
                            )}
                        </div>

                        <div className="space-y-6 relative z-10">

                            {site && (
                                <a href={site.startsWith('http') ? site : `https://${site}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                                    <div className="p-3 bg-black/50 border border-white/10 rounded-lg group-hover/item:border-white/30 transition-colors">
                                        <Globe className="w-5 h-5 text-zinc-300" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <span className="block text-xs text-zinc-500 uppercase font-semibold">Website</span>
                                        <span className="text-white/90 group-hover/item:text-white transition-colors truncate block">{site}</span>
                                    </div>
                                </a>
                            )}

                            {empresa.instagram && (
                                <a href={`https://instagram.com/${empresa.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                                    <div className="p-3 bg-black/50 border border-white/10 rounded-lg group-hover/item:border-pink-500/50 transition-colors">
                                        <Instagram className="w-5 h-5 text-zinc-300 group-hover/item:text-pink-400" />
                                    </div>
                                    <div>
                                        <span className="block text-xs text-zinc-500 uppercase font-semibold">Instagram</span>
                                        <span className="text-white/90 group-hover/item:text-white transition-colors">{empresa.instagram}</span>
                                    </div>
                                </a>
                            )}

                            <a href={email !== "Não informado" ? `mailto:${email}` : '#'} className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                                <div className="p-3 bg-black/50 border border-white/10 rounded-lg group-hover/item:border-white/30 transition-colors">
                                    <Mail className="w-5 h-5 text-zinc-300" />
                                </div>
                                <div className="overflow-hidden">
                                    <span className="block text-xs text-zinc-500 uppercase font-semibold">E-mail</span>
                                    <span className="text-white/90 group-hover/item:text-white transition-colors truncate block">{email}</span>
                                </div>
                            </a>

                            <div className="flex items-center gap-4 p-3 -mx-3">
                                <div className="p-3 bg-black/50 border border-white/10 rounded-lg">
                                    <Phone className="w-5 h-5 text-zinc-300" />
                                </div>
                                <div>
                                    <span className="block text-xs text-zinc-500 uppercase font-semibold">Telefone</span>
                                    <span className="text-white/90">{phone}</span>
                                </div>
                            </div>

                            {phone !== "Não informado" && (
                                <a
                                    href={generateWhatsAppLink(phone)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full relative overflow-hidden bg-green-500 hover:bg-green-400 text-black border border-green-400/50 rounded-xl shadow-[0_0_20px_#22c55e4d] hover:shadow-[0_0_30px_#22c55e80] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center font-bold px-4 py-4"
                                >
                                    <span className="flex flex-row gap-2 items-center justify-center relative z-10">
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                        </svg>
                                        Conversar no WhatsApp
                                    </span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Google Maps Embebed - Sem necessidade de API Key */}
                    {empresa.cep && empresa.municipio && empresa.uf && (
                        <div className="glass-card p-6 min-h-[300px] flex flex-col relative overflow-hidden group no-print">
                            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-zinc-400" />
                                    Visão no Mapa
                                </h3>
                            </div>
                            <div className="relative flex-grow rounded-xl overflow-hidden border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, minHeight: '250px' }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                        `${empresa.logradouro || ''} ${empresa.numero || ''} ${empresa.municipio || ''} ${empresa.uf || ''} ${empresa.cep || ''} Brasil`
                                    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                ></iframe>
                            </div>
                        </div>
                    )}
                </div>

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
                        <p className="text-zinc-400 mb-6 text-sm">Escolha como deseja exportar ou imprimir os dados desta empresa.</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handlePrint('simple')}
                                className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-indigo-500/50 hover:bg-white/5 transition-all group flex gap-4"
                            >
                                <div className="p-3 bg-white/5 rounded-lg h-fit group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                    <List className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Perfil Simples</h3>
                                    <p className="text-sm text-zinc-400 mt-1.5">Imprime dados básicos de contato e endereço condensado para gastar menos papel.</p>
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
                                    <h3 className="font-bold text-white text-lg">Dossiê Completo</h3>
                                    <p className="text-sm text-zinc-400 mt-1.5">Imprime todos os detalhes incluindo datas de abertura, histórico e atividades detalhadas.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
