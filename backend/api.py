"""Servidor da aplicação: API em /api e frontend estático em /."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .dados.carregar import PASTA_DADOS, carregar

RAIZ = Path(__file__).resolve().parent.parent
log = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def ciclo_de_vida(app):
    """Monta todas as estruturas uma única vez, quando o servidor sobe."""
    if (PASTA_DADOS / "players.csv").exists():
        log.info("Carregando a base de dados (leva alguns segundos)...")
        app.state.base = carregar(PASTA_DADOS)
        for linha in app.state.base.resumo().splitlines():
            log.info(linha)
    else:
        log.warning("CSVs não encontrados em %s — a API subirá sem dados.", PASTA_DADOS)
        app.state.base = None
    yield


app = FastAPI(title="Scout Explorer", lifespan=ciclo_de_vida)


@app.get("/api/saude")
def saude():
    base = getattr(app.state, "base", None)
    return {"status": "ok", "dados_carregados": base is not None}


# Montado por último para não encobrir as rotas /api.
app.mount("/", StaticFiles(directory=RAIZ / "frontend", html=True), name="frontend")
