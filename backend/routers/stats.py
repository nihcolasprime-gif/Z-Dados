from fastapi import APIRouter

router = APIRouter(tags=["Estatísticas"])

@router.get("/stats")
async def get_stats():
    """
    Retorna métricas da base de dados.
    """
    # Mock inicial. Posteriormente, pode buscar direto do R2 ou Meilisearch via count
    return {
        "total_empresas": 50000000,
        "last_update": "2026-02-26"
    }
