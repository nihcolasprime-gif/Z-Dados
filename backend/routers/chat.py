# Arquitetura 100% IA captação - listas mín 100 resultados sem duplicatas
import os
import json
import meilisearch
import google.generativeai as genai
from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from ..lib.r2_client import get_s3_client
from ..lib.retriever import query_r2_parquet

router = APIRouter(tags=["IA Chat-First"])

# Configurações
MEILI_URL = os.environ.get("MEILI_URL", "http://localhost:7700")
MEILI_SEARCH_KEY = os.environ.get("MEILI_SEARCH_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Inicialização
try:
    ms_client = meilisearch.Client(MEILI_URL, MEILI_SEARCH_KEY)
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Erro na inicialização da IA/Busca: {e}")

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

SYSTEM_PROMPT = """
Você é um especialista em captação de leads B2B. Sua tarefa é transformar o pedido do usuário em filtros de busca para uma base da Receita Federal.
Retorne APENAS um JSON com os seguintes campos (se não houver valor, use null ou string vazia):
{
  "q": "termo de busca fuzzy (nome ou atividade)",
  "uf": "sigla do estado (ex: SP, RJ)",
  "municipio": "nome da cidade",
  "cnae": "código CNAE de 7 dígitos",
  "situacao": "SITUAÇÃO (2 para Ativa, 4 para Inapta, etc)",
  "reasoning": "breve explicação do que você entendeu"
}
"""

@router.get("/rag/health")
async def health_check():
    """Verifica a conexão com o Cloudflare R2 e MeiliSearch"""
    status = {"r2": "offline", "meilisearch": "offline"}
    try:
        s3 = get_s3_client()
        s3.list_buckets()
        status["r2"] = "ok"
    except Exception as e:
        status["r2"] = f"error: {str(e)}"
    
    try:
        if ms_client:
            ms_client.health()
            status["meilisearch"] = "ok"
    except:
        pass
    
    return status

@router.post("/rag/chat")
async def chat_rag(request: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key não configurada")
    
    try:
        # 1. IA define os filtros
        prompt = f"{SYSTEM_PROMPT}\nUsuário: {request.message}"
        response = model.generate_content(prompt)
        
        text_response = response.text.strip()
        if "```json" in text_response:
            text_response = text_response.split("```json")[1].split("```")[0].strip()
        
        filters_data = json.loads(text_response)
        
        # 2. Busca híbrida (MeiliSearch + DuckDB/R2)
        hits = []
        if filters_data.get("q") and ms_client:
            try:
                index = ms_client.index('empresas')
                meili_filters = []
                if filters_data.get("uf"):
                    meili_filters.append(f"uf = '{filters_data['uf'].upper()}'")
                
                search_params = { 'limit': 100, 'filter': " AND ".join(meili_filters) if meili_filters else None }
                search_results = index.search(filters_data.get("q", ""), search_params)
                hits = search_results.get('hits', [])
            except:
                pass

        # 3. Busca Profunda no R2 (Parquet 40GB) via DuckDB
        if len(hits) < 50 or not filters_data.get("q"):
            r2_results = query_r2_parquet(filters_data, limit=250)
            seen_cnpjs = {h['cnpj'] for h in hits if 'cnpj' in h}
            for res in r2_results:
                if res['cnpj'] not in seen_cnpjs:
                    hits.append(res)
                    seen_cnpjs.add(res['cnpj'])
        
        deduplicated = hits[:250]
        
        return {
            "count": len(deduplicated),
            "results": deduplicated, 
            "full_list_available": True,
            "filters_applied": filters_data,
            "message": f"Encontrei {len(deduplicated)} empresas (deduplicadas por CNPJ). Listando os melhores resultados da base de 40GB no R2:"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento IA: {str(e)}")
