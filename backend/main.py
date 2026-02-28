import os
from typing import List
import duckdb

from google import genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .services.hf_store import list_assets

load_dotenv()

app = FastAPI(
    title="Z-Dados API",
    description="API de prospecção suportada por DuckDB + Parquet Serverless",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_duckdb_conn():
    con = duckdb.connect(':memory:')
    hf_token = os.getenv('HF_TOKEN')
    if hf_token:
        con.execute(f"CREATE SECRET hf (TYPE HUGGINGFACE, TOKEN '{hf_token}');")
    return con

def _run_gemini(pergunta: str, amostra_dados: List[dict]) -> str:
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not gemini_api_key:
        return (
            "Resposta local: configure GEMINI_API_KEY para habilitar análise generativa completa. "
            f"Pergunta recebida: {pergunta}"
        )

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    dados_str = "\n".join([str(d) for d in amostra_dados])
    
    prompt = (
        "Você é um especialista em analisar dados B2B do Brasil.\n"
        "Com base APENAS nos dados fornecidos abaixo (Retornados do Banco de Dados), e não em conhecimento externo, "
        "responda a pergunta do usuário da forma mais útil e estruturada possível.\n\n"
        f"PERGUNTA: {pergunta}\n\n"
        f"DADOS BRUTOS RETORNADOS DO BANCO:\n{dados_str if dados_str else 'Nenhum dado encontrado para esta busca.'}\n"
    )

    client = genai.Client(api_key=gemini_api_key)
    response = client.models.generate_content(model=model_name, contents=prompt)

    text = getattr(response, "text", "")
    if not text:
        return "Não foi possível gerar uma resposta com o Gemini neste momento."

    return text.strip()


@app.get("/api/health")
def api_health() -> dict:
    repo_id, files = list_assets(max_files=5)
    return {
        "ok": True,
        "service": "z-dados-api",
        "hf_repo_id": os.getenv("HF_REPO_ID", ""),
        "hf_cache_ready": bool(repo_id),
        "hf_assets_preview": files,
    }

@app.get("/api/ia-prospeccao")
def ia_prospeccao(pergunta: str = Query(..., min_length=1)) -> dict:
    pergunta_limpa = pergunta.strip()
    if not pergunta_limpa:
        raise HTTPException(status_code=400, detail="O parâmetro 'pergunta' é obrigatório.")

    # Descobre o caminho do HF
    repo_id = os.getenv("HF_REPO_ID", "Onico11/base-receita-zdados")
    # Usa o glob do DuckDB para ler qualquer parquet q ele encontrar lá dentro
    hf_path = f"hf://datasets/{repo_id}/*.parquet"
    
    amostra_db = []
    
    try:
        # Pega a DB em memória com as credenciais
        con = build_duckdb_conn()
        
        # Como é um teste demonstrativo RAG Simplificado sem o LLM gerando a Query SQL (que seria lento via serverless cold start),
        # Vamos rodar uma busca simples: Trazer 10 linhas aleatórias ou as primeiras 10 para o Gemini trabalhar.
        # Numa arquitetura real rodando MeiliSearch ou ES, a keyword da pergunta seria usada no WHERE
        query = f"SELECT * FROM read_parquet('{hf_path}') LIMIT 10"
        
        df = con.execute(query).fetchdf()
        amostra_db = df.to_dict(orient="records")
        
    except Exception as e:
        print(f"Erro DuckDB: {e}")
        # Caímos calados caso o upload não tenha terminado, apenas repassamos pro gemini sem dados

    try:
        resposta = _run_gemini(pergunta_limpa, amostra_db)
        provider = "gemini" if os.getenv("GEMINI_API_KEY", "").strip() else "fallback"
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao processar IA: {exc}") from exc

    return {
        "pergunta": pergunta_limpa,
        "resposta": resposta,
        "resultados": amostra_db, 
        "fontes": [hf_path],
        "metadata": {
            "provider": provider,
            "hf_repo_id": repo_id,
        },
    }