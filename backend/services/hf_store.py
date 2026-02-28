import os
from functools import lru_cache
from typing import List, Optional, Tuple

from huggingface_hub import HfFileSystem


@lru_cache(maxsize=1)
def _list_remote_assets() -> List[str]:
    repo_id = os.getenv("HF_REPO_ID", "").strip()
    if not repo_id:
        return []

    repo_type = os.getenv("HF_REPO_TYPE", "dataset").strip() or "dataset"
    token = os.getenv("HF_TOKEN") or None

    fs = HfFileSystem(token=token)
    
    repo_path = f"datasets/{repo_id}" if repo_type == "dataset" else repo_id
    
    try:
        files = fs.ls(repo_path, detail=False)
        return [f for f in files if getattr(fs.info(f), "type", "file") == "file"]
    except Exception as e:
        print(f"Erro ao listar arquivos do hf: {e}")
        return []


def list_assets(max_files: int = 20) -> Tuple[Optional[str], List[str]]:
    files = _list_remote_assets()
    
    if not files:
        return None, []

    files.sort()
    # Retornamos o repo_id como 'snapshot_path' e os caminhos (hf://...) 
    repo_id = os.getenv("HF_REPO_ID", "")
    return repo_id, files[:max_files]