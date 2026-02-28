# Z-Dados

Projeto simplificado para prospecção via IA com frontend React (Vite) e backend FastAPI.

## Rotas backend

- `GET /api/health`
- `GET /api/ia-prospeccao?pergunta=...`

## Variáveis de ambiente

### Backend

- `GEMINI_API_KEY` (opcional, habilita resposta via Gemini)
- `GEMINI_MODEL` (opcional, padrão: `gemini-1.5-flash`)
- `HF_REPO_ID` (opcional, repo/dataset/model no Hugging Face)
- `HF_REPO_TYPE` (opcional, padrão: `dataset`)
- `HF_REVISION` (opcional, padrão: `main`)
- `HF_TOKEN` (opcional, para repo privado)
- `HF_ALLOW_PATTERNS` (opcional, ex: `*.json,*.txt,*.md`)
- `HF_CACHE_DIR` (opcional, padrão: `.cache/hf`)

## Rodando local

### 1) Frontend

```bash
npm install
npm run dev
```

### 2) Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

## Testes rápidos

Com backend ativo:

```bash
curl "http://localhost:8000/api/health"
curl "http://localhost:8000/api/ia-prospeccao?pergunta=teste"
```

Com frontend ativo (`npm run dev`), a Home chama `/api/ia-prospeccao` automaticamente.

## Deploy Vercel

- Frontend build: `npm run build`
- API serverless entrypoint: `api/index.py`
- Rewrites configurados em `vercel.json` para:
  - `/api/* -> /api/index.py`
  - demais rotas -> `/index.html`

Após deploy:

```bash
curl "https://SEU-DOMINIO.vercel.app/api/health"
curl "https://SEU-DOMINIO.vercel.app/api/ia-prospeccao?pergunta=teste"
```