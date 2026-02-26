import os
import meilisearch
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(tags=["Busca de Empresas"])

MEILI_URL = os.environ.get("MEILI_URL", "http://localhost:7700")  # MeiliSearch default URL
MEILI_SEARCH_KEY = os.environ.get("MEILI_SEARCH_KEY", "")

try:
    client = meilisearch.Client(MEILI_URL, MEILI_SEARCH_KEY)
except Exception as e:
    client = None
    print(f"Aviso: Não foi possível conectar ao MeiliSearch na inicialização: {e}")

@router.get("/search")
async def search_empresas(
    q: str = Query(..., description="Termo de pesquisa (nome_fantasia, razao_social, cnpj)"),
    limit: int = Query(10, description="Número máximo de resultados"),
    offset: int = Query(0, description="Paginação")
):
    if not client:
        raise HTTPException(status_code=503, detail="Serviço de busca temporariamente indisponível")
        
    try:
        index = client.index('empresas')
        resultados = index.search(q, {
            'limit': limit,
            'offset': offset,
            'attributesToHighlight': ['nome_fantasia', 'razao_social']
        })
        
        # Opcional: Adicionar a URL do R2 para detalhes completos para cada resultado
        BUCKET_URL_R2 = os.environ.get("R2_PUBLIC_URL", "https://seu-bucket.r2.dev")
        
        for hit in resultados.get('hits', []):
            uf = hit.get('uf', 'SP')
            hit['detalhes_r2_url'] = f"{BUCKET_URL_R2}/{uf}/dados.parquet"
            
        return {
            "query": q, 
            "resultados": resultados['hits'],
            "totalHits": resultados.get('estimatedTotalHits', len(resultados['hits'])),
            "processingTimeMs": resultados.get('processingTimeMs', 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao buscar dados: {str(e)}")
