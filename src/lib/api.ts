import type { Empresa, Socio, SearchFilters } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// 1. Criamos um tipo novo para ensinar o TypeScript sobre a paginação
export interface SearchResponse {
    data: Empresa[];
    page: number;
    hasNextPage: boolean;
}

// 2. Adicionamos o 3º argumento (page) e mudamos o retorno para SearchResponse
export async function searchEmpresas(query: string, filters: SearchFilters = {}, page: number = 1): Promise<SearchResponse> {
    const params = new URLSearchParams();

    if (query) params.set('q', query);
    params.set('page', String(page));
    params.set('limit', '50');

    // Mapeia os filtros
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== 'all' && value !== '') {
            params.set(key, String(value));
        }
    });

    const res = await fetch(`${API_BASE}/search?${params.toString()}`);
    if (!res.ok) throw new Error('Erro na busca');
    return res.json();
}

export async function getEmpresa(cnpj: string): Promise<{ empresa: Empresa; socios: Socio[] }> {
    const res = await fetch(`${API_BASE}/empresa?cnpj=${encodeURIComponent(cnpj)}`);
    if (!res.ok) throw new Error('Empresa não encontrada');
    return res.json();
}

export interface DashboardStats {
    totalEmpresas: number;
    ativas: number;
    inativas: number;
    mediaCapital: number;
    topUFs: { uf: string; count: number }[];
    topCNAEs: { cnae: string; count: number }[];
}


export async function getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Erro ao carregar estatísticas');
    return res.json();
}
