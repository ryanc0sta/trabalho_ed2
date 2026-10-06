from fastapi.testclient import TestClient

from backend.api import app

cliente = TestClient(app)


def test_saude():
    assert cliente.get("/api/saude").json()["status"] == "ok"


def test_frontend_servido():
    resposta = cliente.get("/")
    assert resposta.status_code == 200 and "Scout Explorer" in resposta.text
