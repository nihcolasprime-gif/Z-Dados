import os
from huggingface_hub import HfApi
from dotenv import load_dotenv

load_dotenv()

repo_id = os.getenv("HF_REPO_ID", "Onico11/base-receita-zdados")
token = os.getenv("HF_TOKEN")

if not token:
    print("Erro: HF_TOKEN não encontrado no .env!")
    exit(1)

api = HfApi(token=token)

print(f"Deletando arquivos .txt antigos do repositório {repo_id}...")
try:
    # A HfApi permite apagar múltiplos arquivos usando delete_folder ou listando e deletando
    # Arquivos estão na raiz do dataset
    files = api.list_repo_files(repo_id=repo_id, repo_type="dataset")
    txt_files = [f for f in files if f.endswith('.txt')]
    
    if txt_files:
        print(f"Encontrados {len(txt_files)} arquivos .txt para deletar.")
        # É mais eficiente deletar cada um, ou simplesmente aceitar a operação
        # Como são 88 arquivos, um loop com delete_file deve funcionar
        for i, file in enumerate(txt_files, 1):
            print(f"[{i}/{len(txt_files)}] Deletando {file}...")
            api.delete_file(path_in_repo=file, repo_id=repo_id, repo_type="dataset")
        print("Limpeza concluída!")
    else:
        print("Nenhum arquivo .txt antigo encontrado.")
        
except Exception as e:
    print(f"Erro ao deletar arquivos .txt: {e}")

print("\n--------------------------------")
print(f"Fazendo upload da nova base em Parquet para {repo_id}...")
try:
    api.upload_folder(
        folder_path="dados_parquet",
        repo_id=repo_id,
        repo_type="dataset",
        path_in_repo=".", # Coloca direto na raiz do HF
    )
    print("✅ UPLOAD DOS PARQUETS CONCLUÍDO COM SUCESSO!")
except Exception as e:
    print(f"❌ Erro ao fazer upload dos parquets: {e}")
