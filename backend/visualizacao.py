from .estruturas.avl import balanceamento
from .estruturas.rastro import rotulo

def recorte_arvore(arvore, destaques=(), profundidade=3, dados_no=None):
    dados_no = dados_no or (lambda no: {})
    caminho = []
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
            item["resumo"] = True
            item["tem_filhos"] = no.esq is not None or no.dir is not None
        return item

    return montar(arvore.raiz, 0) if arvore.raiz is not None else None

def dados_no_jogador(no):
    jogador = no.valor
    dados = {"nome": jogador.nome, "foto": jogador.foto, "valor": jogador.valor,
             "jogador_id": jogador.id}
    if hasattr(no, "contador"):
        dados["contador"] = no.contador
    return dados

def dados_no_historico(no):
    dados = {"data": no.chave, "valor": no.valor, "altura": no.altura,
             "balanceamento": balanceamento(no)}
    if hasattr(no, "max_sub"):
        dados["max_sub"] = no.max_sub
    return dados

def dados_no_valor(no):
    return {"nome": no.valor.nome, "valor": no.valor.valor, "tam": no.tam}

def dados_no_afinidade(no):
    return {"nome": no.valor.nome, "valor": no.valor.valor, "grupo": no.chave[0]}

def itens_ligas(lista):
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
    nos = []
    for i, (chave, jogador, nivel) in enumerate(triplas):

        item = {**jogador.resumo(), "no": rotulo(chave), "nivel": nivel}
        if posicao_inicial is not None:
            item["posicao"] = posicao_inicial + i
        nos.append(item)
    return nos
