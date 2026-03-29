export interface ColabShare { id: string; nome: string; percentual: number; }

export interface Colaborador {
  id: string;
  escritorio_id: string;
  user_id?: string;
  nome: string;
  email: string;
  oab?: string;
  tipo: 'master' | 'associado' | 'colaborador';
  comissao_padrao?: number;
  ativo: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface Contrato { 
  id: string; 
  numero: string; 
  cliente_id: string; 
  cliente_nome?: string; 
  valor_total: number; 
  valor_causa?: number;
  natureza?: string;
  tribunal?: string;
  vara?: string;
  imposto: number; 
  parcelas: number; 
  colaboradores: ColabShare[]; 
  data_inicio: string; 
  status: 'ativo' | 'concluido' | 'suspenso'; 
}

export interface Transacao { 
  id: string; 
  valor: number;
  data: string;
  entidade: string;
  tipo: 'receita' | 'despesa' | 'distribuicao'; 
  status: 'pendente' | 'recebido' | 'pago'; 
  categoria?: string;
  concretizado: boolean; 
  referencia?: string; 
  conta?: string; 
  parent_id?: string; 
  colaborador_id?: string;
  parcela_origem_id?: string; 
  escritorio_id?: string;
  created_at?: string;
}

export interface Cliente { 
  id: string; 
  nome: string; 
  tipo: 'PF' | 'PJ'; 
  doc: string; 
  documento?: string; 
  email: string; 
  contato: string; 
  rg?: string; 
  estado_civil?: string; 
  profissao?: string; 
  endereco?: string; 
  numero?: string; 
  complemento?: string; 
  cidade?: string; 
  uf?: string; 
  cep?: string; 
  data_nascimento?: string; 
}

export interface Orcamento {
  id: string;
  nome_prospect: string;
  telefone_prospect?: string;
  email_prospect?: string;
  origem?: string;
  descricao?: string;
  valor_proposto?: number;
  status: 'prospeccao' | 'apresentacao' | 'negociacao' | 'virou_cliente' | 'perda';
  escritorio_id?: string;
  data_envio?: string;
  data_retorno?: string;
  created_at?: string;
}

export interface DocumentoTemplate {
  id: string;
  escritorio_id: string;
  nome: string;
  tipo: 'procuracao' | 'contrato' | 'peticao' | 'oficio';
  conteudo_html: string;
  created_at?: string;
}

export interface Escritorio {
  id: string;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  logo_url?: string;
  site?: string;
  endereco_completo?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  trial_ends_at: string;
  plano: 'gratis' | 'pro' | 'enterprise';
  status: 'trial' | 'ativo' | 'bloqueado' | 'vencido';
  stripe_customer_id?: string;
}
