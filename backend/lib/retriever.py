import os
import duckdb

def query_r2_parquet(filters_data: dict, limit: int = 250):
    """
    Executa uma consulta DuckDB diretamente nos arquivos Parquet no R2.
    """
    endpoint = os.environ.get('R2_ENDPOINT')
    access_key = os.environ.get('R2_ACCESS_KEY_ID')
    secret_key = os.environ.get('R2_SECRET_ACCESS_KEY')
    bucket = os.environ.get('R2_BUCKET_NAME', 'zdados-parquet')
    
    if not all([endpoint, access_key, secret_key]):
        print("Faltam credenciais do R2 no .env")
        return []

    # Configura DuckDB para S3 (R2 é compatível)
    con = duckdb.connect(database=':memory:')
    con.execute("INSTALL httpfs;")
    con.execute("LOAD httpfs;")
    
    # R2 Endpoint must be used without https:// for DuckDB S3 compatibility in some versions
    clean_endpoint = endpoint.replace('https://', '')
    
    con.execute(f"SET s3_endpoint='{clean_endpoint}';")
    con.execute(f"SET s3_access_key_id='{access_key}';")
    con.execute(f"SET s3_secret_access_key='{secret_key}';")
    con.execute("SET s3_url_style='path';")
    con.execute("SET s3_region='auto';")

    # Busca em todos os parquets do bucket
    base_path = f"s3://{bucket}/*.parquet" # Ajustado para raiz do bucket conforme pedido
    
    where_clauses = []
    if filters_data.get("uf"):
        where_clauses.append(f"uf = '{filters_data['uf'].upper()}'")
    
    # Filtro Condomínios (8112500) se solicitado ou padrão
    cnae_target = filters_data.get("cnae", "8112500")
    if cnae_target:
        where_clauses.append(f"(cnae_fiscal_principal = '{cnae_target}' OR cnae_fiscal_secundaria LIKE '%{cnae_target}%')")
    
    if filters_data.get("municipio"):
        where_clauses.append(f"municipio ILIKE '%{filters_data['municipio']}%'")
    
    where_str = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    if filters_data.get("q"):
        where_str += f" AND (nome_fantasia ILIKE '%{filters_data['q']}%' OR razao_social ILIKE '%{filters_data['q']}%')"

    query = f"""
        SELECT 
            cnpj, razao_social, nome_fantasia, logradouro, numero, bairro, municipio, uf, cep, telefone_1, ddd_1
        FROM read_parquet('{base_path}')
        WHERE {where_str}
        LIMIT {limit * 2}
    """
    
    try:
        df = con.execute(query).df()
        df = df.drop_duplicates(subset=['cnpj'])
        return df.head(limit).to_dict('records')
    except Exception as e:
        print(f"Erro Real no DuckDB/R2: {e}")
        return []
