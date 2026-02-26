import React, { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchEmpresas } from '../lib/api';
import type { Empresa, SearchFilters } from '../types';
import SearchResults from '../components/search/SearchResults';
import AdvancedFilter from '../components/search/AdvancedFilter';
import { cn } from '../lib/utils';

export default function Home() {
    const [query, setQuery] = useState('');
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [results, setResults] = useState<Empresa[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Controle de Paginação
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});

    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isAdvancedOpen && filterRef.current && !filterRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (target.id === 'advanced-filter-backdrop') {
                    setIsAdvancedOpen(false);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isAdvancedOpen]);

    const performSearch = async (searchTerm: string, filters: SearchFilters = {}, newPage: number = 1) => {
        setIsAdvancedOpen(false); // Fecha imediatamente ao clicar
        setIsLoading(true);
        setHasSearched(true);
        setPage(newPage);
        setCurrentFilters(filters);

        try {
            const response = await searchEmpresas(searchTerm, filters, newPage);
            setResults(response.data);
            setHasNextPage(response.hasNextPage);
        } catch (error) {
            console.error('Erro na busca:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSimpleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        performSearch(query, {}, 1);
    };

    const handleAdvancedFilter = (filters: SearchFilters) => {
        performSearch(query, filters, 1);
    };

    return (
        <div className="relative min-h-screen flex flex-col justify-center transition-all duration-700">
            {isAdvancedOpen && (
                <div id="advanced-filter-backdrop" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" />
            )}

            <div className={cn(
                "w-full max-w-4xl mx-auto px-4 z-10 transition-all duration-700 ease-in-out",
                hasSearched ? "transform mt-20" : "transform translate-y-[-10vh]"
            )}>
                <div className="text-center mb-8 sm:mb-12 pt-4">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                        Z <span className="text-gradient">Dados</span>
                    </h1>
                    <p className="text-zinc-400 text-base md:text-xl font-medium max-w-2xl mx-auto px-4 opacity-80">
                        Inteligência de mercado e dados públicos de empresas do Brasil em milissegundos.
                    </p>
                </div>

                <form onSubmit={handleSimpleSearch} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/30 to-blue-500/20 rounded-3xl blur-md opacity-50"></div>
                    <div className="relative flex items-center glass-panel p-2">
                        <div className="pl-4 pr-3 text-white/50"><Search className="w-6 h-6" /></div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Digite um CNPJ, Razão Social ou Nome Fantasia..."
                            className="w-full bg-transparent border-none text-white text-lg focus:outline-none py-4"
                        />
                        <div className="flex items-center gap-2 pr-2">
                            <button type="button" onClick={() => setIsAdvancedOpen(true)} className="p-3 text-zinc-400 hover:text-white rounded-xl">
                                <SlidersHorizontal className="w-5 h-5" />
                            </button>
                            <button type="submit" className="glass-button-primary px-6 md:px-8 py-3">Pesquisar</button>
                        </div>
                    </div>
                </form>
            </div>

            {hasSearched && (
                <div className="z-10 w-full px-4 pb-20 mt-8">
                    <SearchResults results={results} isLoading={isLoading} />

                    {!isLoading && results.length > 0 && (
                        <div className="flex items-center justify-center gap-6 mt-12 animate-in fade-in duration-500">
                            <button
                                onClick={() => performSearch(query, currentFilters, page - 1)}
                                disabled={page === 1}
                                className="glass-button p-3 rounded-xl disabled:opacity-20 transition-all"
                            >
                                <ChevronLeft className="w-6 h-6 text-white" />
                            </button>

                            <div className="flex flex-col items-center">
                                <span className="text-zinc-500 text-xs uppercase font-bold tracking-widest">Página</span>
                                <span className="text-white text-xl font-black">{page}</span>
                            </div>

                            <button
                                onClick={() => performSearch(query, currentFilters, page + 1)}
                                disabled={!hasNextPage}
                                className="glass-button p-3 rounded-xl disabled:opacity-20 transition-all"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div ref={filterRef} className="z-50">
                <AdvancedFilter isOpen={isAdvancedOpen} onClose={() => setIsAdvancedOpen(false)} onFilterChange={handleAdvancedFilter} />
            </div>
        </div>
    );
}
