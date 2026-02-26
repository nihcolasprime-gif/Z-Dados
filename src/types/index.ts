export interface Empresa {
    id: string;
    cnpj: string;
    razao_social: string;
    nome_fantasia: string | null;
    cnae_principal: string | null;
    data_abertura: string | null;
    capital_social: number | null;
    status_ativa: boolean;
    cep: string | null;
    uf: string | null;
    municipio: string | null;
    logradouro?: string | null;
    numero?: string | null;
    bairro?: string | null;
    telefone_real: string | null;
    email_real: string | null;
    site: string | null;
    instagram: string | null;
    necessita_enriquecimento: boolean;
    created_at: string;
}

export interface Socio {
    id: string;
    cnpj_empresa: string;
    nome_socio: string;
    qualificacao: string | null;
    created_at: string;
}

export interface SearchFilters {
    query?: string;
    razao_social?: string;
    cnae_principal?: string;
    natureza_juridica?: string;
    status_ativa?: boolean | string; // string for 'all', boolean for true/false
    uf?: string;
    municipio?: string;
    bairro?: string;
    cep?: string;
    ddd?: string;
    data_abertura_min?: string;
    data_abertura_max?: string;
    capital_social_min?: number;
    capital_social_max?: number;
}
