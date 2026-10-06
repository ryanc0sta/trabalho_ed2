import random

from backend.estruturas.rastro import Rastro
from backend.estruturas.skiplist import SkipList


def verificar_invariantes(lista):
    anterior = set()
    for nivel in range(lista.nivel, -1, -1):
        chaves = [c for c, _ in lista.nos_do_nivel(nivel)]
        assert chaves == sorted(chaves) and len(chaves) == len(set(chaves))
        assert anterior <= set(chaves), "cada nível deve estar contido no nível abaixo"
        anterior = set(chaves)
    assert len(lista.nos_do_nivel(0)) == len(lista)
    # Nenhum ponteiro da cabeça vai direto ao sentinela no nível atual (exceto lista vazia).
    if lista.nivel > 0:
        assert lista.cabeca.prox[lista.nivel] is not lista.sentinela


def test_operacoes_aleatorias():
    aleatorio = random.Random(3)
    lista, referencia = SkipList(nivel_max=12, semente=42), {}
    for _ in range(3000):
        chave = aleatorio.randrange(400)
        op = aleatorio.random()
        if op < 0.5:
            assert lista.inserir(chave, str(chave)) == (chave not in referencia)
            referencia.setdefault(chave, str(chave))
        elif op < 0.75:
            assert lista.remover(chave) == (chave in referencia)
            referencia.pop(chave, None)
        else:
            assert lista.buscar(chave) == referencia.get(chave)
    verificar_invariantes(lista)
    assert [c for c, _ in lista] == sorted(referencia)


def test_esvaziar_volta_ao_nivel_zero():
    lista = SkipList(semente=1)
    for c in range(200):
        lista.inserir(c, c)
    assert lista.nivel > 0
    for c in range(200):
        assert lista.remover(c)
    assert lista.nivel == 0 and len(lista) == 0 and lista.nos_do_nivel(0) == []


def test_niveis_aproximadamente_pela_metade():
    lista = SkipList(nivel_max=20, semente=5)
    for c in range(20000):
        lista.inserir(c, c)
    n0, n1, n2 = (len(lista.nos_do_nivel(i)) for i in range(3))
    assert 0.45 < n1 / n0 < 0.55 and 0.4 < n2 / n1 < 0.6


def test_busca_logaritmica_e_rastro():
    lista = SkipList(nivel_max=20, semente=9)
    for c in range(0, 20000, 2):
        lista.inserir(c, c)
    rastro = Rastro()
    assert lista.buscar(12346, rastro) == 12346
    assert rastro.comparacoes < 80  # busca sequencial levaria ~6000
    assert rastro.passos[0] == {"passo": "inicio", "nivel": lista.nivel}
    assert rastro.passos[-1]["passo"] == "encontrado"
    assert lista.buscar(12347) is None
