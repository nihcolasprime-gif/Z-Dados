@echo off
echo =======================================================
echo INICIANDO RETOMADA DA INGESTAO Z-DADOS (8GB RAM)
echo =======================================================

set NODE_OPTIONS=--max-old-space-size=8192

echo.
echo [1/3] Ingerindo Estabelecimentos 8 e 9...
node scripts/cloud-ingest.js --step estab --workers 5 --files 8,9

echo.
echo [2/3] Ingerindo Socios 5 a 9...
node scripts/cloud-ingest.js --step socios --workers 5 --files 5,6,7,8,9

echo.
echo [3/3] Ingerindo Empresas 5 a 9...
node scripts/cloud-ingest.js --step empresas --workers 5 --files 5,6,7,8,9

echo.
echo =======================================================
echo 🏁 TOTALLY FINISHED! PRONTO!
echo =======================================================
pause
