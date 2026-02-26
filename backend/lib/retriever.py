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
        return []

    # Configura DuckDB para S3 (R2 é compatível)
    con = duckdb.connect(database=':memory:')
    con.execute("INSTALL httpfs;")
    con.execute("LOAD httpfs;")
    con.execute(f"SET s3_endpoint='{endpoint.replace('https://', '')}';")
    con.execute(f"SET s3_access_key_id='{access_key}';")
    con.execute(f"SET s3_secret_access_key='{secret_key}';")
    con.execute("SET s3_url_style='path';")

    # Glob dos arquivos Parquet no R2
    base_path = f"s3://{bucket}/**/*.parquet"
    
    where_clauses = []
    if filters_data.get("uf"):
        where_clauses.append(f"uf = '{filters_data['uf'].upper()}'")
    if filters_data.get("cnae"):
        where_clauses.append(f"(cnae_fiscal_principal = '{filters_data['cnae']}' OR cnae_fiscal_secundaria LIKE '%{filters_data['cnae']}%')")
    if filters_data.get("municipio"):
        where_clauses.append(f"municipio ILIKE '{filters_data['municipio']}'")
    if filters_data.get("situacao"):
        where_clauses.append(f"situacao_cadastral = '{filters_data['situacao']}'")
    
    where_str = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    if filters_data.get("q"):
        where_str += f" AND (nome_fantasia ILIKE '%{filters_data['q']}%' OR razao_social ILIKE '%{filters_data['q']}%')"

    query = f"""
        SELECT * FROM read_parquet('{base_path}')
        WHERE {where_str}
        LIMIT {limit * 2}
    """
    
    try:
        df = con.execute(query).df()
        df = df.drop_duplicates(subset=['cnpj'])
        return df.head(limit).to_dict('records')
    except Exception as e:
        print(f"Erro no DuckDB: {e}")
        return []
