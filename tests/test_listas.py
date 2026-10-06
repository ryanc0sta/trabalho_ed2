import random

import pytest

from backend.estruturas.lista_encadeada import ListaEncadeada
from backend.estruturas.lista_mtf import ListaMTF
from backend.estruturas.lista_transposicao import ListaTransposicao
from backend.estruturas.rastro import Rastro


def montar(classe, chaves="ABCDE"):
    lista = classe()
    for c in chaves:
        assert lista.inserir(c, c.lower())
    return lista


@pytest.mark.parametrize("classe", [ListaEncadeada, ListaMTF, ListaTransposicao])
def test_insercao_busca_remocao(classe):
    lista = montar(classe)
    assert lista.chaves() == list("ABCDE")
    assert not lista.inserir("C", "x")  # chave primária
    assert lista.buscar("Z") is None
    assert lista.buscar("D") == "d"
    assert lista.remover("B") and not lista.remover("B")
    assert len(lista) == 4 and "B" not in lista.chaves()


def test_busca_simples_nao_reorganiza():
    lista = montar(ListaEncadeada)
    lista.buscar("E")
    assert lista.chaves() == list("ABCDE")


def test_movimentacao_para_o_inicio():
    lista = montar(ListaMTF)
    rastro = Rastro()
    lista.buscar("D", rastro)
    assert lista.chaves() == list("DABCE")
    assert rastro.comparacoes == 4
    assert rastro.passos[-1] == {"passo": "move_inicio", "no": "D", "de": 3, "para": 0}
    lista.buscar("D")  # já no início: não muda
    assert lista.chaves() == list("DABCE")
    lista.buscar("E")
    assert lista.chaves() == list("EDABC")


def test_transposicao():
    lista = montar(ListaTransposicao)
    rastro = Rastro()
    lista.buscar("D", rastro)
    assert lista.chaves() == list("ABDCE")
    assert rastro.passos[-1]["passo"] == "transpoe" and rastro.passos[-1]["com"] == "C"
    lista.buscar("B")  # troca com a cabeça
    assert lista.chaves() == list("BADCE")
    lista.buscar("B")
    assert lista.chaves() == list("BADCE")


@pytest.mark.parametrize("classe", [ListaEncadeada, ListaMTF, ListaTransposicao])
def test_operacoes_aleatorias(classe):
    aleatorio = random.Random(7)
    lista, referencia = classe(), {}
    for _ in range(2000):
        chave = aleatorio.randrange(60)
        op = aleatorio.random()
        if op < 0.4:
            assert lista.inserir(chave, chave * 10) == (chave not in referencia)
            referencia.setdefault(chave, chave * 10)
        elif op < 0.6:
            assert lista.remover(chave) == (chave in referencia)
            referencia.pop(chave, None)
        else:
            assert lista.buscar(chave) == referencia.get(chave)
        assert len(lista) == len(referencia)
        assert sorted(lista.chaves()) == sorted(referencia)
