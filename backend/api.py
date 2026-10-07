"""Servidor da aplicação: API em /api e frontend estático em /.

As rotas que mexem nas estruturas devolvem, além do resultado, o RASTRO da
operação (os passos executados), que o frontend reproduz como animação.
Rotas com `modo` aceitam "modificado" (padrão) ou "classico", para comparar
as duas versões de cada estrutura.

As funções são `async` de propósito: assim todas rodam na mesma thread do
servidor, uma de cada vez, e duas requisições nunca alteram a mesma estrutura
ao mesmo tempo (as operações levam milissegundos).
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.staticfiles import StaticFiles

from .dados.carregar import PASTA_DADOS, carregar
from .dados.modelos import normalizar
from .estruturas.avl import ArvoreAVL
from .estruturas.ordenacao import merge_sort
from .estruturas.rastro import Rastro, rotulo
from .dados.carregar import CRITERIOS_DE_AFINIDADE
from .visualizacao import (dados_no_afinidade, dados_no_historico, dados_no_jogador, dados_no_valor,
                           itens_ligas, nos_skip, recorte_arvore)

RAIZ = Path(__file__).resolve().parent.parent
log = logging.getLogger("uvicorn.error")

Modo = Literal["modificado", "classico"]


@asynccontextmanager
async def ciclo_de_vida(app):
    """Monta todas as estruturas uma única vez, quando o servidor sobe."""
    if getattr(app.state, "base", None) is not None:  # já injetada (testes)
        yield
        return
    pasta = getattr(app.state, "pasta_dados", PASTA_DADOS)
    if (pasta / "players.csv").exists():
        log.info("Carregando a base de dados (leva alguns segundos)...")
        app.state.base = carregar(pasta)
        for linha in app.state.base.resumo().splitlines():
            log.info(linha)
    else:
        log.warning("CSVs não encontrados em %s — a API subirá sem dados.", pasta)
        app.state.base = None
    yield


app = FastAPI(
    title="Scout Explorer",
    description="Visualização da base Transfermarkt com listas e árvores de busca.",
    lifespan=ciclo_de_vida,
)


# ------------------------------------------------------------------ auxiliares
def obter_base(request: Request):
    base = getattr(request.app.state, "base", None)
    if base is None:
        raise HTTPException(503, "Base de dados não carregada (CSVs ausentes em dados/).")
    return base


def obter_liga(base, liga_id):
    liga = base.liga(liga_id)
    if liga is None:
        raise HTTPException(404, f"Liga {liga_id} não encontrada.")
    return liga


def obter_jogador(base, jogador_id):
    jogador = base.jogador(jogador_id)
    if jogador is None:
        raise HTTPException(404, f"Jogador {jogador_id} não encontrado.")
    return jogador


def limiar(liga, nivel):
    """Menor valor de mercado de quem está no nível (Skip List modificada)."""
    return liga.skip.limiares[nivel - 1] if 1 <= nivel <= len(liga.skip.limiares) else 0


# ------------------------------------------------------------------------ saúde
@app.get("/api/saude", tags=["geral"])
async def saude(request: Request):
    base = getattr(request.app.state, "base", None)
    return {"status": "ok", "dados_carregados": base is not None}


# ------------------------------------------------------------------------ ligas
@app.get("/api/ligas", tags=["ligas"], summary="Ligas na ordem atual da lista")
async def listar_ligas(request: Request, modo: Modo = "modificado"):
    base = obter_base(request)
    lista = base.ligas if modo == "modificado" else base.ligas_classica
    return {"modo": modo, "ligas": itens_ligas(lista)}


@app.post("/api/ligas/{liga_id}/acessar", tags=["ligas"],
          summary="Acessa uma liga: movimentação ponderada ou para o início")
async def acessar_liga(request: Request, liga_id: str, modo: Modo = "modificado"):
    base = obter_base(request)
    obter_liga(base, liga_id)
    lista = base.ligas if modo == "modificado" else base.ligas_classica
    antes = itens_ligas(lista)
    rastro = Rastro()
    lista.buscar(liga_id, rastro)
    return {"modo": modo, "antes": antes, "depois": itens_ligas(lista),
            "rastro": rastro.para_json()}


@app.get("/api/ligas/{liga_id}", tags=["ligas"], summary="Dados da liga e níveis da Skip List")
async def detalhar_liga(request: Request, liga_id: str):
    base = obter_base(request)
    liga = obter_liga(base, liga_id)
    niveis = [{"nivel": k, "jogadores": len(liga.skip.nos_do_nivel(k)),
               "valor_minimo": limiar(liga, k)} for k in range(liga.skip.nivel + 1)]
    niveis_classica = [{"nivel": k, "jogadores": len(liga.skip_classica.nos_do_nivel(k))}
                       for k in range(liga.skip_classica.nivel + 1)]
    return {**liga.para_json(), "niveis": niveis, "niveis_classica": niveis_classica}


@app.get("/api/ligas/{liga_id}/jogadores", tags=["ligas"],
         summary="Jogadores de um nível da Skip List, paginados")
async def jogadores_da_liga(request: Request, liga_id: str, nivel: int = Query(0, ge=0),
                            pagina: int = Query(1, ge=1), por_pagina: int = Query(24, ge=1, le=100),
                            modo: Modo = "modificado"):
    base = obter_base(request)
    liga = obter_liga(base, liga_id)
    skip = liga.skip if modo == "modificado" else liga.skip_classica
    nivel = min(nivel, skip.nivel)
    inicio = (pagina - 1) * por_pagina + 1
    rastro = Rastro()
    if nivel == 0:
        # Nível 0 = todos: a página é obtida a partir da posição de início
        # (larguras na modificada; percurso desde o começo na clássica).
        total = len(skip)
        triplas = skip.trecho(inicio, por_pagina, rastro)
    else:
        torres = skip.torres(nivel)
        total = len(torres)
        triplas = torres[inicio - 1: inicio - 1 + por_pagina]
    return {
        "modo": modo, "liga": liga.para_json(), "nivel": nivel, "nivel_maximo": skip.nivel,
        "valor_minimo": limiar(liga, nivel) if modo == "modificado" else None,
        "total": total, "pagina": pagina, "paginas": max(1, -(-total // por_pagina)),
        "jogadores": nos_skip(triplas, inicio), "rastro": rastro.para_json(),
    }


@app.get("/api/ligas/{liga_id}/estrutura", tags=["ligas"],
         summary="Recorte da Skip List para desenhar as torres")
async def estrutura_da_liga(request: Request, liga_id: str, nivel_min: int = Query(0, ge=0),
                            inicio: int = Query(1, ge=1), quantidade: int = Query(40, ge=1, le=200),
                            modo: Modo = "modificado"):
    """Com nivel_min > 0, devolve só os nós desse nível para cima (a "vista de
    cima"); com nivel_min = 0, um trecho de `quantidade` nós a partir de `inicio`."""
    base = obter_base(request)
    liga = obter_liga(base, liga_id)
    skip = liga.skip if modo == "modificado" else liga.skip_classica
    if nivel_min > 0:
        nos = nos_skip(skip.torres(nivel_min))
    else:
        nos = nos_skip(skip.trecho(inicio, quantidade), inicio)
    return {"modo": modo, "nivel_lista": skip.nivel, "total": len(skip), "nos": nos,
            "limiares": liga.skip.limiares if modo == "modificado" else None}


@app.get("/api/ligas/{liga_id}/localizar/{jogador_id}", tags=["ligas"],
         summary="Busca um jogador na Skip List da liga (rastro da descida)")
async def localizar_na_liga(request: Request, liga_id: str, jogador_id: int,
                            modo: Modo = "modificado"):
    base = obter_base(request)
    liga = obter_liga(base, liga_id)
    jogador = obter_jogador(base, jogador_id)
    rastro = Rastro()
    if modo == "modificado":
        posicao = liga.skip.posicao(jogador.chave, rastro)
        encontrado = posicao is not None
    else:
        posicao = None
        encontrado = liga.skip_classica.buscar(jogador.chave, rastro) is not None
    return {"modo": modo, "encontrado": encontrado, "posicao": posicao,
            "rastro": rastro.para_json()}


# -------------------------------------------------------------------- jogadores
@app.get("/api/busca", tags=["jogadores"], summary="Autocompletar por nome ou sobrenome")
async def buscar_jogadores(request: Request, q: str = Query(..., min_length=1),
                           limite: int = Query(8, ge=1, le=30)):
    base = obter_base(request)
    rastro = Rastro()
    sugestoes = base.sugerir(q, limite, rastro)
    return {"q": q, "sugestoes": [j.resumo() | {"ativo": j.ativo} for j in sugestoes],
            "rastro": rastro.para_json()}


@app.post("/api/jogadores/{jogador_id}/acessar", tags=["jogadores"],
          summary="Registra a visita: afunilamento (condicional ou clássico) e frequentes")
async def acessar_jogador(request: Request, jogador_id: int, modo: Modo = "modificado"):
    base = obter_base(request)
    jogador = obter_jogador(base, jogador_id)
    arvore = base.busca if modo == "modificado" else base.busca_classica
    antes = recorte_arvore(arvore, [jogador.chave], profundidade=3, dados_no=dados_no_jogador)
    rastro = Rastro()
    arvore.buscar(jogador.chave, rastro)
    depois = recorte_arvore(arvore, [jogador.chave], profundidade=3, dados_no=dados_no_jogador)
    vistos_antes = [{"id": j.id, "nome": j.nome} for _, j in base.frequentes]
    rastro_vistos = Rastro()
    base.registrar_frequente(jogador, rastro=rastro_vistos)
    return {"modo": modo, "alvo": rotulo(jogador.chave), "antes": antes, "depois": depois,
            "rastro": rastro.para_json(),
            "vistos": {"antes": vistos_antes,
                       "depois": [{"id": j.id, "nome": j.nome} for _, j in base.frequentes],
                       "rastro": rastro_vistos.para_json()}}


@app.get("/api/em-alta", tags=["jogadores"],
         summary="Os jogadores mais valiosos (maior chave e predecessores na árvore por valor)")
async def em_alta(request: Request, quantos: int = Query(6, ge=1, le=24)):
    base = obter_base(request)
    rastro = Rastro()
    jogadores = base.em_alta(quantos, rastro)
    return {
        "jogadores": [j.resumo() for j in jogadores],
        "rastro": rastro.para_json(),
        "arvore": recorte_arvore(base.por_valor, [(float("inf"), 0)], profundidade=2, dados_no=dados_no_valor),
    }


MOTIVOS = {
    "clube": "Mesmo clube de {}",
    "liga": "Mesma posição e liga de {}",
    "pais": "Mesmo país e posição de {}",
}


@app.get("/api/recomendados", tags=["jogadores"],
         summary="Recomendações a partir dos perfis abertos (árvore de afinidades)")
async def recomendados(request: Request, jogador_id: int | None = None,
                       limite: int = Query(8, ge=1, le=24)):
    """Com `jogador_id`, recomenda a partir desse jogador; sem ele, a partir
    dos três primeiros da lista de vistos."""
    base = obter_base(request)
    if jogador_id is not None:
        fontes = [obter_jogador(base, jogador_id)]
    else:
        fontes = [j for _, j in base.frequentes][:3]
    rastro = Rastro()
    escolhidos = base.recomendar(fontes, limite=limite, rastro=rastro)
    grupos = []
    if fontes:
        grupos = [(grupo_de(fontes[0]),) for _, _, grupo_de in CRITERIOS_DE_AFINIDADE if grupo_de(fontes[0])]
    return {
        "fontes": [{"id": j.id, "nome": j.nome} for j in fontes],
        "jogadores": [j.resumo() | {"motivo": MOTIVOS[criterio].format(fonte.nome), "criterio": criterio}
                      for j, criterio, fonte in escolhidos],
        "rastro": rastro.para_json(),
        "arvore": recorte_arvore(base.afinidades, grupos, profundidade=2, dados_no=dados_no_afinidade)
        if fontes else None,
    }


@app.get("/api/frequentes", tags=["jogadores"], summary="Jogadores frequentes (transposição)")
async def frequentes(request: Request):
    base = obter_base(request)
    return {"jogadores": [j.resumo() for _, j in base.frequentes]}


@app.get("/api/jogadores/{jogador_id}", tags=["jogadores"],
         summary="Página do jogador: dados, histórico (AVL) e transferências")
async def detalhar_jogador(request: Request, jogador_id: int):
    base = obter_base(request)
    jogador = obter_jogador(base, jogador_id)
    rastro = Rastro()
    avl = base.historico(jogador_id, rastro)  # a montagem fica no rastro (rotações)
    clube = base.clube(jogador.clube_id) if jogador.clube_id is not None else None
    liga = base.liga(jogador.liga_id) if jogador.liga_id else None
    return {
        "jogador": jogador.para_json(),
        "clube": {"id": clube.id, "nome": clube.nome, "escudo": clube.escudo} if clube else None,
        "liga": {"id": liga.id, "nome": liga.nome, "logo": liga.logo} if liga else None,
        "ranking_liga": base.ranking_na_liga(jogador),
        "na_lista": base.na_lista(jogador),
        "historico": [{"data": data, "valor": valor} for data, valor in avl],
        "transferencias": [t.para_json() for t in base.transferencias_de(jogador_id)],
        "arvore": recorte_arvore(avl, profundidade=64, dados_no=dados_no_historico),
        "rastro_montagem": rastro.para_json(),
    }


@app.get("/api/jogadores/{jogador_id}/valor", tags=["jogadores"],
         summary="Valor de mercado numa data (busca de piso na AVL)")
async def valor_em(request: Request, jogador_id: int,
                   data: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$")):
    base = obter_base(request)
    obter_jogador(base, jogador_id)
    avl = base.historico(jogador_id)
    rastro = Rastro()
    resposta = avl.valor_em(data, rastro)
    return {
        "data": data,
        "resultado": {"data": resposta[0], "valor": resposta[1]} if resposta else None,
        "rastro": rastro.para_json(),
        "arvore": recorte_arvore(avl, profundidade=64, dados_no=dados_no_historico),
    }


@app.get("/api/jogadores/{jogador_id}/pico", tags=["jogadores"],
         summary="Maior valor num período (AVL aumentada ou percurso clássico)")
async def pico(request: Request, jogador_id: int,
               de: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
               ate: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
               modo: Modo = "modificado"):
    base = obter_base(request)
    obter_jogador(base, jogador_id)
    avl = base.historico(jogador_id)
    rastro = Rastro()
    if modo == "modificado":
        resposta = avl.pico(de, ate, rastro)
    else:
        resposta = pico_classico(avl, de, ate, rastro)
    return {
        "modo": modo, "de": de, "ate": ate,
        "resultado": {"data": resposta[0], "valor": resposta[1]} if resposta else None,
        "rastro": rastro.para_json(),
        "arvore": recorte_arvore(avl, profundidade=64, dados_no=dados_no_historico),
    }


def pico_classico(arvore: ArvoreAVL, de, ate, rastro):
    """Sem o máximo da subárvore: percorre em ordem todas as datas do
    período (e as anteriores a ele) — θ(n) no pior caso."""
    melhor = None
    for data, valor in arvore.em_ordem():
        rastro.registrar("compara", no=data, decisao="visita")
        if data > ate:
            break
        if data >= de and (melhor is None or valor > melhor[1]):
            melhor = (data, valor)
    if melhor:
        rastro.registrar("pico", no=melhor[0], valor=melhor[1])
    return melhor


@app.get("/api/jogadores/{jogador_id}/parecidos", tags=["ferramentas"],
         summary="Jogadores da mesma posição com valor mais próximo (vizinhos na árvore por valor)")
async def parecidos(request: Request, jogador_id: int):
    base = obter_base(request)
    jogador = obter_jogador(base, jogador_id)
    rastro = Rastro()
    chave = (jogador.valor or 0, jogador.id)
    return {"jogadores": [j.resumo() for j in base.parecidos(jogador, rastro=rastro)],
            "rastro": rastro.para_json(),
            "arvore": recorte_arvore(base.por_valor, [chave], profundidade=2, dados_no=dados_no_valor)}


# ------------------------------------------------------------------ ferramentas
@app.get("/api/lateral", tags=["ferramentas"], summary="Dados da barra lateral")
async def lateral(request: Request):
    base = obter_base(request)
    return {
        "minha_lista": len(base.minha_lista),
        "buscas": base.buscas.chaves(),
        "vistos": [j.resumo() for _, j in base.frequentes],
    }


@app.get("/api/minha-lista", tags=["ferramentas"], summary="Lista de observação (Skip List)")
async def minha_lista(request: Request, modo: Modo = "modificado"):
    base = obter_base(request)
    skip = base.minha_lista if modo == "modificado" else base.minha_lista_classica
    jogadores = nos_skip(skip.torres(0), 1)
    return {"modo": modo, "total": len(skip), "nivel_lista": skip.nivel,
            "valor_total": sum(j["valor"] or 0 for j in jogadores), "jogadores": jogadores}


@app.put("/api/minha-lista/{jogador_id}", tags=["ferramentas"],
         summary="Adiciona um jogador à lista: inserção na Skip List")
async def adicionar_a_lista(request: Request, jogador_id: int, modo: Modo = "modificado"):
    base = obter_base(request)
    jogador = obter_jogador(base, jogador_id)
    rastro = Rastro()
    adicionado = base.adicionar_a_lista(jogador, classica=modo == "classico", rastro=rastro)
    return {"modo": modo, "adicionado": adicionado, "total": len(base.minha_lista),
            "rastro": rastro.para_json()}


@app.delete("/api/minha-lista/{jogador_id}", tags=["ferramentas"],
            summary="Remove um jogador da lista: remoção na Skip List")
async def remover_da_lista(request: Request, jogador_id: int, modo: Modo = "modificado"):
    base = obter_base(request)
    jogador = obter_jogador(base, jogador_id)
    rastro = Rastro()
    removido = base.remover_da_lista(jogador, classica=modo == "classico", rastro=rastro)
    return {"modo": modo, "removido": removido, "total": len(base.minha_lista),
            "rastro": rastro.para_json()}


@app.post("/api/buscas", tags=["ferramentas"],
          summary="Registra um termo buscado (movimentação para o início)")
async def registrar_busca(request: Request, q: str = Query(..., min_length=1, max_length=60)):
    base = obter_base(request)
    rastro = Rastro()
    antes = base.buscas.chaves()
    base.registrar_busca(q, rastro=rastro)
    return {"antes": antes, "buscas": base.buscas.chaves(), "rastro": rastro.para_json()}


@app.delete("/api/buscas", tags=["ferramentas"], summary="Limpa as buscas recentes")
async def limpar_buscas(request: Request):
    base = obter_base(request)
    rastro = Rastro()
    antes = base.buscas.chaves()
    base.limpar_buscas(rastro)
    return {"antes": antes, "buscas": base.buscas.chaves(), "rastro": rastro.para_json()}


@app.get("/api/faixa", tags=["ferramentas"],
         summary="Jogadores numa faixa de valor (intervalo, piso e teto na árvore por valor)")
async def faixa_de_valor(request: Request, minimo: int = Query(0, ge=0), maximo: int = Query(..., ge=0),
                         pagina: int = Query(1, ge=1), por_pagina: int = Query(24, ge=1, le=100),
                         modo: Modo = "modificado"):
    base = obter_base(request)
    rastro = Rastro()
    total, jogadores, mais_barato, mais_caro = base.faixa_de_valor(
        minimo, maximo, pagina, por_pagina, classica=modo == "classico", rastro=rastro)
    return {
        "modo": modo, "minimo": minimo, "maximo": maximo, "total": total,
        "pagina": pagina, "paginas": max(1, -(-total // por_pagina)),
        "jogadores": [j.resumo() for j in jogadores],
        "mais_barato": mais_barato.resumo() if mais_barato else None,
        "mais_caro": mais_caro.resumo() if mais_caro else None,
        "rastro": rastro.para_json(),
        "arvore": recorte_arvore(base.por_valor, [(minimo, -1), (maximo, float("inf"))],
                                 profundidade=2, dados_no=dados_no_valor),
    }


@app.get("/api/ligas/{liga_id}/ir-para", tags=["ferramentas"],
         summary="Primeiro jogador da liga a partir de um nome (teto + busca dedilhada)")
async def ir_para(request: Request, liga_id: str, q: str = Query(..., min_length=1, max_length=60),
                  por_pagina: int = Query(24, ge=1, le=100), modo: Modo = "modificado"):
    base = obter_base(request)
    liga = obter_liga(base, liga_id)
    skip = liga.skip if modo == "modificado" else liga.skip_classica
    rastro = Rastro()
    achado = skip.posicao_teto((normalizar(q),), rastro)
    if achado is None:
        return {"modo": modo, "posicao": None, "pagina": None, "jogador": None,
                "rastro": rastro.para_json()}
    posicao, _, jogador = achado
    return {"modo": modo, "posicao": posicao, "pagina": (posicao - 1) // por_pagina + 1,
            "jogador": jogador.resumo(), "rastro": rastro.para_json()}


# ----------------------------------------------------------------------- clubes
@app.get("/api/clubes/{clube_id}", tags=["clubes"], summary="Clube e elenco atual")
async def detalhar_clube(request: Request, clube_id: int):
    base = obter_base(request)
    clube = base.clube(clube_id)
    if clube is None:
        raise HTTPException(404, f"Clube {clube_id} não encontrado.")
    liga = base.liga(clube.liga_id) if clube.liga_id else None
    elenco = merge_sort(clube.elenco, chave=lambda j: -(j.valor or 0))
    return {**clube.para_json(), "valor_total": clube.valor_total,
            "liga": {"id": liga.id, "nome": liga.nome, "logo": liga.logo} if liga else None,
            "elenco": [j.resumo() for j in elenco]}


# Montado por último para não encobrir as rotas /api.
class Estaticos(StaticFiles):
    """Arquivos do frontend com "Cache-Control: no-cache": o navegador guarda os
    arquivos, mas sempre confere com o servidor se mudaram (resposta 304 quando
    não). Sem isso, um CSS ou JS antigo podia continuar em uso após uma mudança."""

    async def get_response(self, path, scope):
        resposta = await super().get_response(path, scope)
        resposta.headers["Cache-Control"] = "no-cache"
        return resposta


app.mount("/", Estaticos(directory=RAIZ / "frontend", html=True), name="frontend")
