"""Servidor da aplicação: API em /api e frontend estático em /."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

RAIZ = Path(__file__).resolve().parent.parent

app = FastAPI(title="Scout Explorer")


@app.get("/api/saude")
def saude():
    return {"status": "ok"}


# Montado por último para não encobrir as rotas /api.
app.mount("/", StaticFiles(directory=RAIZ / "frontend", html=True), name="frontend")
