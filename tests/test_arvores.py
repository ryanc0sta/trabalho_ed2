import bisect
import math
import random

import pytest

from backend.estruturas.arvore_binaria import ArvoreBinariaBusca
from backend.estruturas.avl import ArvoreAVL, balanceamento
from backend.estruturas.rastro import Rastro
from backend.estruturas.splay import ArvoreAfunilada

ARVORES = [ArvoreBinariaBusca, ArvoreAVL, ArvoreAfunilada]


def verificar_avl(no):
    """Retorna a altura real, conferindo altura armazenada e balanceamento."""
    if no is None:
        return 0
    he, hd = verificar_avl(no.esq), verificar_avl(no.dir)
    assert no.altura == 1 + max(he, hd)
    assert abs(balanceamento(no)) <= 1
    return no.altura


@pytest.mark.parametrize("classe", ARVORES)
def test_operacoes_aleatorias(classe):
    aleatorio = random.Random(11)
    arvore, referencia = classe(), {}
    for _ in range(4000):
        chave = aleatorio.randrange(500)
        op = aleatorio.random()
        if op < 0.5:
            assert arvore.inserir(chave, -chave) == (chave not in referencia)
            referencia.setdefault(chave, -chave)
        elif op < 0.75:
            assert arvore.remover(chave) == (chave in referencia)
            referencia.pop(chave, None)
        else:
            assert arvore.buscar(chave) == referencia.get(chave)
        assert len(arvore) == len(referencia)
    assert list(arvore.em_ordem()) == sorted(referencia.items())
    if classe is ArvoreAVL:
        verificar_avl(arvore.raiz)


@pytest.mark.parametrize("classe", ARVORES)
def test_piso_teto_e_a_partir_de(classe):
    chaves = list(range(0, 300, 7))
    arvore = classe()
    embaralhadas = chaves[:]
    random.Random(4).shuffle(embaralhadas)
    for c in embaralhadas:
        arvore.inserir(c, str(c))
    for x in range(-3, 305):
        i = bisect.bisect_left(chaves, x)
        assert arvore.teto(x) == ((chaves[i], str(chaves[i])) if i < len(chaves) else None)
        j = bisect.bisect_right(chaves, x) - 1
        assert arvore.piso(x) == ((chaves[j], str(chaves[j])) if j >= 0 else None)
    assert [c for c, _ in arvore.a_partir_de(50, 4)] == [56, 63, 70, 77]
    assert arvore.a_partir_de(1000, 3) == []


def test_a_partir_de_com_prefixo_de_texto():
    arvore = ArvoreAfunilada()
    nomes = ["ney", "neymar|1", "neymar|2", "neto|5", "messi|3", "nunes|9"]
    arvore.construir_de_ordenados([(n, None) for n in sorted(nomes)])
    sugestoes = [c for c, _ in arvore.a_partir_de("ney", 10) if c.startswith("ney")]
    assert sugestoes == ["ney", "neymar|1", "neymar|2"]


@pytest.mark.parametrize("classe", ARVORES)
def test_construir_de_ordenados_e_balanceado(classe):
    pares = [(c, c * 2) for c in range(1000)]
    arvore = classe()
    arvore.construir_de_ordenados(pares)
    assert list(arvore.em_ordem()) == pares
    assert arvore.altura() == math.ceil(math.log2(1001))
    if classe is ArvoreAVL:
        verificar_avl(arvore.raiz)
    assert arvore.inserir(5000, 1) and arvore.buscar(5000) == 1


def test_primeiros_niveis():
    arvore = ArvoreBinariaBusca()
    arvore.construir_de_ordenados([(c, None) for c in range(7)])
    niveis = [[c for c, _ in nivel] for nivel in arvore.primeiros_niveis(2)]
    assert niveis == [[3], [1, 5]]


# ------------------------------------------------------------------------ AVL
@pytest.mark.parametrize(
    "ordem, caso",
    [
        ([3, 2, 1], "esquerda-esquerda"),
        ([3, 1, 2], "esquerda-direita"),
        ([1, 2, 3], "direita-direita"),
        ([1, 3, 2], "direita-esquerda"),
    ],
)
def test_avl_quatro_casos(ordem, caso):
    arvore = ArvoreAVL()
    rastro = Rastro()
    for c in ordem:
        arvore.inserir(c, None, rastro)
    assert arvore.raiz.chave == 2 and arvore.raiz.esq.chave == 1 and arvore.raiz.dir.chave == 3
    casos = [p["caso"] for p in rastro.passos if p["passo"] == "desbalanceado"]
    assert casos == [caso]
    rotacoes = [p for p in rastro.passos if p["passo"] == "rotacao"]
    assert len(rotacoes) == (1 if caso in ("esquerda-esquerda", "direita-direita") else 2)


def test_avl_altura_logaritmica_com_insercoes_em_ordem():
    arvore = ArvoreAVL()
    for c in range(10000):
        arvore.inserir(c, None)
    verificar_avl(arvore.raiz)
    assert arvore.altura() <= 1.44 * math.log2(10000 + 2)


def test_avl_remocao_propaga_rebalanceamento():
    arvore = ArvoreAVL()
    for c in range(100):
        arvore.inserir(c, None)
    for c in range(0, 100, 3):
        arvore.remover(c)
        verificar_avl(arvore.raiz)
    assert [c for c, _ in arvore] == [c for c in range(100) if c % 3]


# --------------------------------------------------------------------- Splay
def test_splay_busca_leva_a_raiz():
    arvore = ArvoreAfunilada()
    arvore.construir_de_ordenados([(c, str(c)) for c in range(100)])
    for c in [17, 90, 3, 17, 55]:
        assert arvore.buscar(c) == str(c)
        assert arvore.raiz.chave == c
    # Busca malsucedida afunila o último nó visitado (vizinho da chave).
    assert arvore.buscar(17.5) is None
    assert arvore.raiz.chave in (17, 18)


@pytest.mark.parametrize(
    "caminho, caso",
    [
        # árvore: 3 -> (2 -> 1) — alvo 1 é esq. do esq.
        ([3, 2, 1], "zig-zig"),
        ([1, 2, 3], "zag-zag"),
        ([3, 1, 2], "zag-zig"),
        ([1, 3, 2], "zig-zag"),
    ],
)
def test_splay_casos(caminho, caso):
    arvore = ArvoreBinariaBusca()
    for c in caminho:
        arvore.inserir(c, None)
    splay = ArvoreAfunilada()
    splay.raiz, splay.tamanho = arvore.raiz, 3
    rastro = Rastro()
    splay.buscar(caminho[-1], rastro)
    assert splay.raiz.chave == caminho[-1]
    assert [p["caso"] for p in rastro.passos if p["passo"] == "caso"] == [caso]
    assert len([p for p in rastro.passos if p["passo"] == "rotacao"]) == 2
    assert [c for c, _ in splay] == [1, 2, 3]


def test_splay_zig_quando_alvo_e_filho_da_raiz():
    splay = ArvoreAfunilada()
    splay.construir_de_ordenados([(1, None), (2, None), (3, None)])
    rastro = Rastro()
    splay.buscar(1, rastro)
    assert [p["caso"] for p in rastro.passos if p["passo"] == "caso"] == ["zig"]
    assert splay.raiz.chave == 1


def test_splay_insercao_e_remocao_mudam_a_raiz():
    splay = ArvoreAfunilada()
    for c in [50, 20, 80, 10, 30]:
        splay.inserir(c, None)
        assert splay.raiz.chave == c
    assert splay.remover(20)
    assert 20 not in [c for c, _ in splay]
    assert splay.raiz.chave == 10  # maior da subárvore esquerda de 20
