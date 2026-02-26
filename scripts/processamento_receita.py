import os
import glob
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import boto3
import meilisearch
from rapidfuzz import fuzz
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# 0. CONFIGURAÇÕES E CREDENCIAIS
# ==========================================
MEILI_URL = os.environ.get('MEILI_URL', 'http://localhost:7700')
MEILI_KEY = os.environ.get('MEILI_KEY', '')

R2_ENDPOINT = os.environ.get('R2_ENDPOINT', 'https://<account_id>.r2.cloudflarestorage.com')
R2_ACCESS_KEY = os.environ.get('R2_ACCESS_KEY', 'sua_access_key')
R2_SECRET_KEY = os.environ.get('R2_SECRET_KEY', 'sua_secret_key')
R2_BUCKET = 'receita-2026'

INPUT_FOLDER = './dados_receita'
OUTPUT_FOLDER = './output_parquet'

os.makedirs(INPUT_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

try:
    ms_client = meilisearch.Client(MEILI_URL, MEILI_KEY)
except Exception as e:
    ms_client = None
    print("Aviso: Falha ao conectar ao MeiliSearch Cloud")

try:
    s3_client = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY
    )
except Exception:
    pass

# ==========================================
# 1. PROCESSAR CSV PARA PARQUET (BATCHES)
# ==========================================
def processar_csv_para_parquet():
    print("Iniciando conversão de CSV para Parquet em batches...")
    
    arquivos_csv = glob.glob(f"{INPUT_FOLDER}/*.csv") + glob.glob(f"{INPUT_FOLDER}/*.CSV")
    if not arquivos_csv:
        print(f"Nenhum arquivo CSV encontrado em {INPUT_FOLDER}.")
        return

    # Agora vamos ler e manter TODAS as colunas do CSV da Receita    
    for arquivo in arquivos_csv:
        print(f"Processando {arquivo}...")
        
        try:
            chunks = pd.read_csv(
                arquivo, 
                chunksize=100000, 
                sep=';',
                dtype=str, 
                on_bad_lines='skip',
                encoding='latin1'
            )
            
            for i, chunk in enumerate(chunks):
                # Mantém todas as colunas lidas do dataset
                df_filtered = chunk.fillna('')
                
                # Agrupar por UF e anexar (append) no respectivo arquivo Parquet
                if 'UF' in df_filtered.columns:
                    grupos_uf = df_filtered.groupby('UF')
                    for uf, df_uf in grupos_uf:
                        if not str(uf).strip() or len(str(uf)) > 2 or uf == 'EX': continue # Ignora lixo ou exterior
                        
                        uf_folder = f"{OUTPUT_FOLDER}/{uf}"
                        os.makedirs(uf_folder, exist_ok=True)
                        parquet_file = f"{uf_folder}/dados_{os.path.basename(arquivo).replace('.csv', '').replace('.CSV', '')}_{i}.parquet"
                        
                        table = pa.Table.from_pandas(df_uf)
                        pq.write_table(table, parquet_file, compression='snappy')
            print(f"{arquivo} concluído!")
        except Exception as e:
             print(f"Erro processando {arquivo}: {e}")

# ==========================================
# 2. COLOCAR RESTANTE DO CÓDIGO (R2/MEILISEARCH) DE ACORDO COM NECESSIDADE
# ==========================================
# Adicione funções de upload e indexação como discutido no guia

if __name__ == "__main__":
    print("Pipeline Python Preparada.")
    # processar_csv_para_parquet()
