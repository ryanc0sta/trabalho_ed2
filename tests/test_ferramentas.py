"""Operações acrescentadas para as ferramentas da barra lateral."""

import bisect
import math
import random

import pytest

from backend.estruturas.arvore_binaria import ArvoreBinariaBusca
from backend.estruturas.avl import ArvoreAVL
from backend.estruturas.avl_ordem import ArvoreAVLOrdem
from backend.estruturas.lista_mtf import ListaMTF
from backend.estruturas.rastro import Rastro
from backend.estruturas.skiplist import SkipList
from backend.estruturas.skiplist_valor import SkipListValor
from backend.estruturas.splay import ArvoreAfunilada
from tests.test_arvores import verificar_avl


# ------------------------------------------------- lista: buscas recentes
def test_inserir_no_inicio_e_remover_ultimo():
    lista = ListaMTF()
    for termo in ("haal", "vini", "saka"):
        assert lista.inserir_no_inicio(termo, termo)
    assert lista.chaves() == ["saka", "vini", "haal"]
    assert not lista.inserir_no_inicio("vini", "x")  # chave primária
    lista.buscar("haal")  # movimentação para o início
    assert lista.chaves() == ["haal", "saka", "vini"]
    assert lista.remover_ultimo() == "vini"
    assert lista.chaves() == ["haal", "saka"] and len(lista) == 2
    assert lista.remover_ultimo() == "saka" and lista.remover_ultimo() == "haal"
    assert lista.remover_ultimo() is None and lista.cabeca is None


# ----------------------------------------------- árvore: vizinhos em ordem
@pytest.mark.parametrize("classe", [ArvoreBinariaBusca, ArvoreAVL, ArvoreAfunilada])
def test_iterar_nos_dois_sentidos(classe):
    chaves = sorted(random.Random(3).sample(range(1000), 200))
    arvore = classe()
    embaralhadas = chaves[:]
    random.Random(4).shuffle(embaralhadas)
    for c in embaralhadas:
        arvore.inserir(c, None)
    for x in (-5, 0, 137, 500, 999, 2000):
        i = bisect.bisect_left(chaves, x)
        assert [c for c, _ in arvore.iterar_a_partir_de(x)] == chaves[i:]
        assert [c for c, _ in arvore.iterar_antes_de(x)] == chaves[:i][::-1]
    # Sucessores e predecessores imediatos de uma chave existente.
    meio = chaves[100]
    assert next(arvore.iterar_a_partir_de(meio + 1))[0] == chaves[101]
    assert next(arvore.iterar_antes_de(meio))[0] == chaves[99]


# ------------------------------------------------ AVL com tamanho (ordem)
def verificar_tam(no):
    if no is None:
        return 0
    total = 1 + verificar_tam(no.esq) + verificar_tam(no.dir)
    assert no.tam == total
    return total


def test_avl_ordem_contra_forca_bruta():
    aleatorio = random.Random(17)
    arvore, referencia = ArvoreAVLOrdem(), set()
    for _ in range(3000):
        chave = aleatorio.randrange(600)
        if aleatorio.random() < 0.65:
            assert arvore.inserir(chave, -chave) == (chave not in referencia)
            referencia.add(chave)
        else:
            assert arvore.remover(chave) == (chave in referencia)
            referencia.discard(chave)
    verificar_avl(arvore.raiz)
    assert verificar_tam(arvore.raiz) == len(referencia) == len(arvore)
    ordenadas = sorted(referencia)
    for x in range(-3, 605, 7):
        assert arvore.posicao(x) == bisect.bisect_left(ordenadas, x)
    for _ in range(300):
        de = aleatorio.randrange(-10, 610)
        ate = de + aleatorio.randrange(-5, 300)
        assert arvore.contar(de, ate) == sum(1 for c in ordenadas if de <= c <= ate)
    for k in range(0, len(ordenadas), 11):
        assert arvore.selecionar(k) == (ordenadas[k], -ordenadas[k])
    assert arvore.selecionar(len(ordenadas)) is None
    assert [c for c, _ in arvore.fatia(10, 24)] == ordenadas[10:34]
    assert [c for c, _ in arvore.fatia(len(ordenadas) - 3, 24)] == ordenadas[-3:]


def test_avl_ordem_contar_e_logaritmico():
    arvore = ArvoreAVLOrdem()
    arvore.construir_de_ordenados([((valor, i), None) for i, valor in enumerate(range(0, 200_000, 10))])
    verificar_tam(arvore.raiz)
    rastro = Rastro()
    # Chaves compostas (valor, id): a faixa inclui todo id com o valor nos limites.
    total = arvore.contar((50_000, -1), (150_000, math.inf), rastro)
    assert total == 10_001  # 50000, 50010, ..., 150000
    assert rastro.comparacoes < 4 * math.log2(20_000)  # sem visitar os 10 mil da faixa


# --------------------------------------- Skip List: teto, posição e dedo
def nomes(n, semente=5):
    aleatorio = random.Random(semente)
    letras = "abcdefghijklmnopqrstuvwxyz"
    return sorted({"".join(aleatorio.choice(letras) for _ in range(6)) for _ in range(n)})


def test_posicao_teto_classica_e_modificada():
    chaves = nomes(800)
    classica = SkipList(semente=2)
    for c in chaves:
        classica.inserir(c, c.upper())
    modificada = SkipListValor.construir([(c, len(c) * i) for i, c in enumerate(chaves)], medida=lambda v: v)
    for prefixo in ["a", "m", "mz", "zzzzzzz", chaves[0], chaves[-1], chaves[400]]:
        i = bisect.bisect_left(chaves, prefixo)
        esperado = (i + 1, chaves[i]) if i < len(chaves) else None
        for lista in (classica, modificada):
            resposta = lista.posicao_teto(prefixo)
            assert (resposta and resposta[:2]) == esperado


def comparar_com_e_sem_dedo(chaves_buscadas, pares):
    com_dedo = SkipListValor.construir(pares, medida=lambda v: v)
    sem_dedo = SkipListValor.construir(pares, medida=lambda v: v)
    total_com = total_sem = 0
    for chave in chaves_buscadas:
        r1, r2 = Rastro(), Rastro()
        resposta = com_dedo.posicao_teto(chave, r1)
        sem_dedo._dedo = None
        assert resposta == sem_dedo.posicao_teto(chave, r2)  # mesmo resultado sempre
        total_com += r1.comparacoes
        total_sem += r2.comparacoes
    return total_com, total_sem, r1


def test_busca_dedilhada_economiza_para_alvos_proximos():
    chaves = nomes(3000)
    aleatorio = random.Random(9)
    pares = [(c, aleatorio.randrange(10**8)) for c in chaves]  # valor independente do nome
    com, sem, ultimo = comparar_com_e_sem_dedo(chaves[:600:2], pares)  # de 2 em 2 posições
    assert com < 0.5 * sem
    assert any(p["passo"] == "dedo" for p in ultimo.passos)


def test_busca_dedilhada_nao_piora_para_alvos_distantes():
    chaves = nomes(3000)
    aleatorio = random.Random(9)
    pares = [(c, aleatorio.randrange(10**8)) for c in chaves]
    com, sem, ultimo = comparar_com_e_sem_dedo(chaves[::400], pares)  # saltos longos
    assert com <= 1.1 * sem  # no máximo ~1 comparação a mais por busca
    assert any(p.get("decisao") == "longe" for p in ultimo.passos)


def test_digitar_um_nome_aos_poucos_usa_o_dedo():
    chaves = nomes(3000)
    aleatorio = random.Random(9)
    pares = [(c, aleatorio.randrange(10**8)) for c in chaves]
    alvo = chaves[1700]
    prefixos = [alvo[:k] for k in range(1, len(alvo) + 1)]  # "s", "sa", "sal", ...
    com, sem, _ = comparar_com_e_sem_dedo(prefixos, pares)
    assert com < sem


def test_dedo_volta_ao_inicio_e_e_descartado_quando_a_lista_muda():
    chaves = nomes(500)
    lista = SkipListValor.construir([(c, 1) for c in chaves], medida=lambda v: v)
    assert lista.posicao_teto("m")[0] == bisect.bisect_left(chaves, "m") + 1
    rastro = Rastro()
    assert lista.posicao_teto("c", rastro)[0] == bisect.bisect_left(chaves, "c") + 1  # chave anterior
    assert rastro.passos[0]["passo"] == "inicio"  # não usa o dedo: recomeça da cabeça
    lista.posicao_teto("t")
    lista.inserir("tzzzzz", 1)
    assert lista._dedo is None
    assert lista.posicao_teto("u")[0] == bisect.bisect_left(sorted(chaves + ["tzzzzz"]), "u") + 1
    lista.remover(chaves[0])
    assert lista._dedo is None
