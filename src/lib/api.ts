export interface IAProspeccaoResponse {
  pergunta: string;
  resposta: string;
  resultados: Array<Record<string, unknown>>;
  fontes: string[];
  metadata: {
    provider: string;
    hf_repo_id: string;
    hf_cache_ready: boolean;
  };
}

const API_ROUTE = '/api/ia-prospeccao';

export async function fetchIAProspeccao(pergunta: string): Promise<IAProspeccaoResponse> {
  const params = new URLSearchParams({ pergunta: pergunta.trim() });
  const response = await fetch(`${API_ROUTE}?${params.toString()}`);
  
  // Lemos como texto primeiro para evitar o erro de JSON parse caso dê 502 Bad Gateway (Página HTML do Vercel)
  const bodyText = await response.text();
  
  if (!response.ok) {
    let errorMessage = `Erro na API (${response.status})`;
    try {
      const errorJson = JSON.parse(bodyText);
      if (errorJson && typeof errorJson === 'object' && 'detail' in errorJson) {
        errorMessage = errorJson.detail as string;
      }
    } catch {
      // Ignorar se não for JSON, usamos fallback do status code
    }
    throw new Error(errorMessage);
  }
  
  let payload: unknown = null;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    throw new Error('Resposta inválida da API (não é um JSON válido).');
  }
  
  if (!payload || typeof payload !== 'object') {    
    throw new Error('Resposta inválida da API. Formato inesperado.');   
  }   
  
  return payload as IAProspeccaoResponse;
}
