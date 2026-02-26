import os
import boto3
from botocore.exceptions import ClientError

def get_s3_client():
    """Retorna o cliente S3 configurado para Cloudflare R2"""
    return boto3.client(
        's3',
        endpoint_url=os.environ.get('R2_ENDPOINT'),
        aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
        region_name='auto' # R2 exige region_name ou auto
    )

def ensure_bucket_exists():
    bucket_name = os.environ.get('R2_BUCKET_NAME', 'zdados-parquet')
    s3 = get_s3_client()
    try:
        s3.head_bucket(Bucket=bucket_name)
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            s3.create_bucket(Bucket=bucket_name)
        else:
            raise
    return bucket_name
