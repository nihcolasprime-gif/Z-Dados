import os
from functools import lru_cache
from typing import List, Optional, Tuple
import httpx
@lru_cache(maxsize=1)
def _list_remote_assets() -> List[str]:
    repo_id = os.getenv("HF_REPO_ID", "").strip()
    if not repo_id:
        return []

    repo_type = os.getenv("HF_REPO_TYPE", "dataset").strip() or "dataset"
    token = os.getenv("HF_TOKEN") or None

    url = f"https://huggingface.co/api/{repo_type}s/{repo_id}/tree/main"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    try:
        response = httpx.get(url, headers=headers, timeout=15.0)
        response.raise_for_status()
        files_data = response.json()
        
        parquet_files = []
        for item in files_data:
            if item.get("type", "") == "file" and item.get("path", "").endswith(".parquet"):
                # DuckDB aceita a URL hf://
                hf_uri = f"hf://{repo_type}s/{repo_id}/{item['path']}"
                parquet_files.append(hf_uri)
                
        return parquet_files
    except Exception as e:
        print(f"Erro ao listar arquivos do HF via API: {e}")
        return []


def list_assets(max_files: int = 20) -> Tuple[Optional[str], List[str]]:
    files = _list_remote_assets()
    
    if not files:
        return None, []

    files.sort()
    # Retornamos o repo_id como 'snapshot_path' e os caminhos (hf://...) 
    repo_id = os.getenv("HF_REPO_ID", "")
    return repo_id, files[:max_files]