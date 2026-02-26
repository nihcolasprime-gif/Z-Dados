import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routers import chat

load_dotenv()

app = FastAPI(
    title="Z-Dados IA Captação",
    description="Motores de Busca Híbrida (MeiliSearch + DuckDB/R2) com IA",
    version="2.0.0"
)

# Configurando CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrando apenas o Chat Router (IA Chat-First)
app.include_router(chat.router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Z-Dados IA Chat-First API está ativa"}
