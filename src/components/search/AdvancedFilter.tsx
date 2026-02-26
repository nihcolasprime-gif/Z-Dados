import React, { useState } from 'react';
import type { SearchFilters } from '../../types';
import { Search, MapPin, Building2, Calendar, DollarSign, Filter, X } from 'lucide-react';

interface AdvancedFilterProps {
    onFilterChange: (filters: SearchFilters) => void;
    isOpen: boolean;
    onClose: () => void;
}

// Sugestões Estáticas de CNAE
const SUGESTOES_CNAE = [
    "4711302 - Comércio varejista de mercadorias em geral",
    "4781400 - Comércio varejista de artigos do vestuário e acessórios",
    "5611201 - Restaurantes e similares",
    "5611203 - Lanchonetes, casas de chá, de sucos e similares",
    "4399103 - Obras de alvenaria",
    "9602501 - Cabeleireiros, manicure e pedicure",
    "4789099 - Comércio varejista de outros produtos não especificados"
];

const ESTADOS_BR = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

export default function AdvancedFilter({ onFilterChange, isOpen, onClose }: AdvancedFilterProps) {
    const [filters, setFilters] = useState<SearchFilters>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange(filters);
    };

    const handleClear = () => {
        setFilters({});
        onFilterChange({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] z-50 transform transition-transform duration-500 ease-in-out">
            <div className="h-full w-full glass-card border-r-0 border-y-0 rounded-r-none flex flex-col pt-6 pb-24 shadow-[-20px_0_50px_-20px_#00000080]">

                {/* Header */}
                <div className="px-6 flex items-center justify-between pb-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 glass rounded-lg">
                            <Filter className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Filtros Avançados</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <form id="advanced-filter-form" onSubmit={handleApply} className="space-y-8">

                        {/* Seção 1: Identificação */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Identificação
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-sm text-zinc-300">Razão Social ou Nome Fantasia</label>
                                    <input type="text" name="razao_social" value={filters.razao_social || ''} onChange={handleInputChange} placeholder="Razão Social ou Fantasia" className="glass-input w-full" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-300">Atividade Principal (CNAE)</label>
                                    <input 
                                        type="text" 
                                        name="cnae_principal" 
                                        list="cnae-suggestions"
                                        value={filters.cnae_principal || ''} 
                                        onChange={handleInputChange} 
                                        placeholder="Digite para ver sugestões..." 
                                        className="glass-input w-full" 
                                    />
                                    <datalist id="cnae-suggestions">
                                        {SUGESTOES_CNAE.map((cnae, i) => <option key={i} value={cnae} />)}
                                    </datalist>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-300">Natureza Jurídica</label>
                                    <input type="text" name="natureza_juridica" value={filters.natureza_juridica || ''} onChange={handleInputChange} placeholder="Código ou nome da natureza" className="glass-input w-full" />
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: Localização */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Localização
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-sm text-zinc-300">Situação</label>
                                    <select name="status_ativa" value={filters.status_ativa as string || 'all'} onChange={handleInputChange} className="glass-input w-full appearance-none h-[42px] cursor-pointer">
                                        <option value="all" className="bg-zinc-900">Todas</option>
                                        <option value="true" className="bg-zinc-900">Ativa</option>
                                        <option value="false" className="bg-zinc-900">Inativa</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-300">Estado (UF)</label>
                                    <select name="uf" value={filters.uf || ''} onChange={handleInputChange} className="glass-input w-full appearance-none h-[42px] cursor-pointer">
                                        <option value="" className="bg-zinc-900">Todos</option>
                                        {ESTADOS_BR.map(uf => (
                                            <option key={uf} value={uf} className="bg-zinc-900">{uf}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-300">Município</label>
                                    <input type="text" name="municipio" value={filters.municipio || ''} onChange={handleInputChange} placeholder="Nome" className="glass-input w-full" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-300">Bairro</label>
                                    <input type="text" name="bairro" value={filters.bairro || ''} onChange={handleInputChange} placeholder="Nome do bairro" className="glass-input w-full" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-300">CEP</label>
                                    <input type="text" name="cep" value={filters.cep || ''} onChange={handleInputChange} placeholder="Somente números" className="glass-input w-full" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-300">DDD</label>
                                    <input type="text" name="ddd" value={filters.ddd || ''} onChange={handleInputChange} placeholder="2 dígitos" maxLength={2} className="glass-input w-full" />
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Detalhes Numéricos (Agora sendo usados!) */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> & <DollarSign className="w-4 h-4" /> Detalhes Numéricos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-300">Data de Abertura Inicial</label>
                                    <input type="date" name="data_abertura_min" value={filters.data_abertura_min || ''} onChange={handleInputChange} className="glass-input w-full [color-scheme:dark]" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-300">Data de Abertura Final</label>
                                    <input type="date" name="data_abertura_max" value={filters.data_abertura_max || ''} onChange={handleInputChange} className="glass-input w-full [color-scheme:dark]" />
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="text-sm text-zinc-300">Capital Social Mínimo</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                                        <input type="number" name="capital_social_min" value={filters.capital_social_min || ''} onChange={handleInputChange} placeholder="0,00" className="glass-input w-full pl-9" />
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="text-sm text-zinc-300">Capital Social Máximo</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                                        <input type="number" name="capital_social_max" value={filters.capital_social_max || ''} onChange={handleInputChange} placeholder="0,00" className="glass-input w-full pl-9" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="absolute bottom-0 inset-x-0 p-6 glass-card rounded-t-none rounded-b-none border-t border-white/10 flex items-center justify-end gap-4">
                    <button type="button" onClick={handleClear} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Limpar Filtros</button>
                    <button type="submit" form="advanced-filter-form" className="glass-button-primary"><Search className="w-4 h-4 mr-2" />Aplicar Filtros</button>
                </div>

            </div>
        </div>
    );
}
