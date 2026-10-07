import pytest
from fastapi.testclient import TestClient

from backend.api import app
from tests.test_carga import base  # noqa: F401  (fixture com a base pequena)


@pytest.fixture(scope="module")
def cliente(base):  # noqa: F811
    app.state.base = base
    with TestClient(app) as c:
        yield c
    app.state.base = None


def test_saude_e_frontend(cliente):
    assert cliente.get("/api/saude").json() == {"status": "ok", "dados_carregados": True}
    resposta = cliente.get("/")
    assert resposta.status_code == 200 and "Scout Explorer" in resposta.text
    # O navegador deve sempre revalidar os arquivos do frontend (evita CSS/JS antigos).
    assert resposta.headers["cache-control"] == "no-cache"
    assert cliente.get("/css/estilo.css").headers["cache-control"] == "no-cache"


def test_ligas_e_acesso(cliente):
    ligas = cliente.get("/api/ligas").json()["ligas"]
    assert [l["id"] for l in ligas] == ["GB1", "IT1"]
    assert ligas[0]["logo"].endswith("/gb1.png") and "pontuacao" in ligas[0]

    resposta = cliente.post("/api/ligas/IT1/acessar").json()
    assert [l["id"] for l in resposta["antes"]] == ["GB1", "IT1"]
    assert [l["id"] for l in resposta["depois"]] == ["IT1", "GB1"]
    passos = [p["passo"] for p in resposta["rastro"]["passos"]]
    assert "pontua" in passos and "avanca" in passos

    classica = cliente.post("/api/ligas/GB1/acessar?modo=classico").json()
    assert classica["rastro"]["passos"][-1]["passo"] == "encontrado"  # GB1 já é a primeira
    assert cliente.post("/api/ligas/XX9/acessar").status_code == 404
    assert cliente.get("/api/ligas?modo=errado").status_code == 422


def test_liga_niveis_e_jogadores(cliente):
    liga = cliente.get("/api/ligas/IT1").json()
    assert liga["nome"] == "Serie A" and liga["jogadores"] == 3
    assert liga["niveis"][0] == {"nivel": 0, "jogadores": 3, "valor_minimo": 0}

    todos = cliente.get("/api/ligas/IT1/jogadores?nivel=0&por_pagina=2").json()
    assert todos["total"] == 3 and todos["paginas"] == 2
    assert [j["posicao"] for j in todos["jogadores"]] == [1, 2]
    pagina2 = cliente.get("/api/ligas/IT1/jogadores?nivel=0&pagina=2&por_pagina=2").json()
    assert len(pagina2["jogadores"]) == 1

    topo = cliente.get("/api/ligas/IT1/jogadores?nivel=1").json()
    assert [j["nome"] for j in topo["jogadores"]] == ["Nicolò Barella"]
    assert topo["valor_minimo"] == 70_000_000
    assert cliente.get("/api/ligas/IT1/jogadores?nivel=99").json()["nivel"] == topo["nivel_maximo"]


def test_estrutura_e_localizar(cliente):
    estrutura = cliente.get("/api/ligas/GB1/estrutura").json()
    assert estrutura["total"] == 3 and len(estrutura["nos"]) == 3
    assert {"id", "no", "nivel", "nome", "foto", "posicao"} <= set(estrutura["nos"][0])
    assert estrutura["nos"][0]["no"] == "bukayo saka|2" and estrutura["nos"][0]["id"] == 2
    de_cima = cliente.get("/api/ligas/GB1/estrutura?nivel_min=1").json()
    assert [n["nome"] for n in de_cima["nos"]] == ["Erling Haaland"]

    achado = cliente.get("/api/ligas/GB1/localizar/2").json()
    assert achado["encontrado"] and achado["posicao"] == 1  # "bukayo saka" é o 1º em ordem alfabética
    assert achado["rastro"]["passos"][0]["passo"] == "inicio"
    assert not cliente.get("/api/ligas/GB1/localizar/5").json()["encontrado"]  # está na IT1


def test_busca(cliente):
    resposta = cliente.get("/api/busca?q=haal").json()
    assert [s["nome"] for s in resposta["sugestoes"]] == ["Erling Haaland", "Markus Haaland"]
    assert resposta["rastro"]["comparacoes"] > 0
    assert cliente.get("/api/busca?q=").status_code == 422


def test_acessar_jogador_splay_condicional_e_frequentes(cliente):
    for vez in (1, 2):
        resposta = cliente.post("/api/jogadores/5/acessar").json()
        passos = [p["passo"] for p in resposta["rastro"]["passos"]]
        assert "rotacao" not in passos  # condicional: ainda não afunilou
    resposta = cliente.post("/api/jogadores/5/acessar").json()
    assert resposta["depois"]["id"] == resposta["alvo"] == "nicolo barella|5"  # 3º acesso: raiz
    assert resposta["antes"]["id"] != resposta["alvo"]

    classica = cliente.post("/api/jogadores/2/acessar?modo=classico").json()
    assert classica["depois"]["id"] == "bukayo saka|2"  # clássica: afunila na hora

    frequentes = cliente.get("/api/frequentes").json()["jogadores"]
    assert [j["id"] for j in frequentes] == [5, 2]
    cliente.post("/api/jogadores/2/acessar")
    assert [j["id"] for j in cliente.get("/api/frequentes").json()["jogadores"]] == [2, 5]


def test_em_alta(cliente):
    resposta = cliente.get("/api/em-alta?niveis=2").json()
    assert len(resposta["niveis"]) == 2
    assert resposta["arvore"]["id"] == "nicolo barella|5"


def test_jogador_historico_valor_e_pico(cliente):
    jogador = cliente.get("/api/jogadores/1").json()
    assert jogador["jogador"]["nome"] == "Erling Haaland"
    assert jogador["clube"]["nome"] == "Manchester City"
    assert jogador["liga"]["id"] == "GB1"
    assert jogador["ranking_liga"] == {"posicao": 1, "total": 3}
    assert [h["data"] for h in jogador["historico"]] == ["2017-01-01", "2019-12-16",
                                                         "2021-10-07", "2024-12-16"]
    assert len(jogador["transferencias"]) == 2
    assert jogador["arvore"]["max_sub"] == 200_000_000
    assert any(p["passo"] == "rotacao" for p in jogador["rastro_montagem"]["passos"])

    valor = cliente.get("/api/jogadores/1/valor?data=2020-06-01").json()
    assert valor["resultado"] == {"data": "2019-12-16", "valor": 45_000_000}
    assert cliente.get("/api/jogadores/1/valor?data=junho").status_code == 422

    for modo in ("modificado", "classico"):
        pico = cliente.get(f"/api/jogadores/1/pico?de=2018-01-01&ate=2022-01-01&modo={modo}").json()
        assert pico["resultado"] == {"data": "2021-10-07", "valor": 150_000_000}
    assert cliente.get("/api/jogadores/999999").status_code == 404


def test_clube(cliente):
    inter = cliente.get("/api/clubes/46").json()
    assert inter["nome"] == "Inter Milan" and inter["liga"]["id"] == "IT1"
    assert [j["nome"] for j in inter["elenco"]] == ["Nicolò Barella", "Bukayo Saka", "Jogador Sem Valor"]
    assert cliente.get("/api/clubes/123456").status_code == 404


def test_sem_dados_responde_503(tmp_path):
    app.state.base = None
    app.state.pasta_dados = tmp_path  # pasta vazia: o servidor sobe sem dados
    try:
        with TestClient(app) as c:
            assert c.get("/api/saude").json()["dados_carregados"] is False
            assert c.get("/api/ligas").status_code == 503
    finally:
        del app.state.pasta_dados
