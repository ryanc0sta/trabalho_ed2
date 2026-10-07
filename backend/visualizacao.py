"""Conversão das estruturas em JSON para o frontend desenhar e animar.

As estruturas são grandes demais para desenhar inteiras (a árvore de busca
tem 50 mil nós), então aqui se produzem RECORTES: os primeiros níveis, mais
os caminhos até os nós de interesse. Os filhos dos nós do caminho entram
como "resumo" (sem descendentes) — é o suficiente para o frontend reproduzir
as rotações registradas no rastro.
"""

from .estruturas.avl import balanceamento
from .estruturas.rastro import rotulo


# --------------------------------------------------------------------- árvores
def recorte_arvore(arvore, destaques=(), profundidade=3, dados_no=None):
    """Árvore aninhada {id, ..., esq, dir} com os `profundidade` primeiros
    níveis e os caminhos da raiz até cada chave de `destaques`."""
    dados_no = dados_no or (lambda no: {})
    caminho = []  # nós visitados da raiz até cada destaque
    for chave in destaques:
        no = arvore.raiz
        while no is not None:
            caminho.append(no)
            if chave == no.chave:
                break
            no = no.esq if chave < no.chave else no.dir

    def expandir(no, nivel):
        return nivel < profundidade or any(no is c for c in caminho)

    def montar(no, nivel):
        item = {"id": rotulo(no.chave), **dados_no(no)}
        if expandir(no, nivel):
            item["esq"] = montar(no.esq, nivel + 1) if no.esq is not None else None
            item["dir"] = montar(no.dir, nivel + 1) if no.dir is not None else None
        else:
            item["resumo"] = True  # subárvore não desenhada
            item["tem_filhos"] = no.esq is not None or no.dir is not None
        return item

    return montar(arvore.raiz, 0) if arvore.raiz is not None else None


def dados_no_jogador(no):
    """Nó da árvore de busca por nome (valor = Jogador)."""
    jogador = no.valor
    dados = {"nome": jogador.nome, "foto": jogador.foto, "valor": jogador.valor,
             "jogador_id": jogador.id}
    if hasattr(no, "contador"):
        dados["contador"] = no.contador
    return dados


def dados_no_historico(no):
    """Nó da AVL de histórico (chave = data, valor = valor de mercado)."""
    dados = {"data": no.chave, "valor": no.valor, "altura": no.altura,
             "balanceamento": balanceamento(no)}
    if hasattr(no, "max_sub"):
        dados["max_sub"] = no.max_sub
    return dados


def dados_no_valor(no):
    """Nó da árvore por valor (chave = (valor, id), valor = Jogador)."""
    return {"nome": no.valor.nome, "valor": no.valor.valor, "tam": no.tam}


# ----------------------------------------------------------------------- listas
def itens_ligas(lista):
    """Ligas na ordem atual da lista (com a pontuação, se for a ponderada)."""
    pontos = None
    if hasattr(lista, "pontuacoes"):
        pontos = [p for _, p in lista.pontuacoes()]
    itens = []
    for i, (_, liga) in enumerate(lista):
        item = liga.para_json()
        if pontos is not None:
            item["pontuacao"] = pontos[i]
        itens.append(item)
    return itens


def nos_skip(triplas, posicao_inicial=None):
    """Triplas (chave, Jogador, nível) -> nós para desenhar as torres."""
    nos = []
    for i, (chave, jogador, nivel) in enumerate(triplas):
        # "no" identifica o nó no rastro; "id" é o id do jogador.
        item = {**jogador.resumo(), "no": rotulo(chave), "nivel": nivel}
        if posicao_inicial is not None:
            item["posicao"] = posicao_inicial + i
        nos.append(item)
    return nos
