import bisect
import random

from backend.estruturas.lista_ordenada import ListaOrdenada
from backend.estruturas.ordenacao import merge_sort


def test_merge_sort():
    aleatorio = random.Random(1)
    for n in [0, 1, 2, 3, 10, 257, 1000]:
        dados = [aleatorio.randrange(50) for _ in range(n)]
        assert merge_sort(dados) == sorted(dados)


def test_merge_sort_estavel():
    dados = [(3, "a"), (1, "b"), (3, "c"), (1, "d"), (2, "e")]
    assert merge_sort(dados, chave=lambda x: x[0]) == sorted(dados, key=lambda x: x[0])


def test_construir_remove_duplicadas():
    lista = ListaOrdenada.construir([(5, "a"), (1, "b"), (5, "c"), (3, "d")])
    assert list(lista) == [(1, "b"), (3, "d"), (5, "a")]


def test_buscas_contra_referencia():
    aleatorio = random.Random(2)
    chaves = sorted(set(aleatorio.randrange(0, 1000, 3) for _ in range(300)))
    lista = ListaOrdenada.construir([(c, -c) for c in chaves])
    for x in range(-5, 1010):
        i = bisect.bisect_left(chaves, x)
        assert lista.buscar(x) == (-x if x in chaves else None)
        assert lista.teto(x) == ((chaves[i], -chaves[i]) if i < len(chaves) else None)
        j = bisect.bisect_right(chaves, x) - 1
        assert lista.piso(x) == ((chaves[j], -chaves[j]) if j >= 0 else None)
    assert [c for c, _ in lista.intervalo(100, 200)] == [c for c in chaves if 100 <= c <= 200]


def test_chaves_compostas_intervalo_por_jogador():
    # (player_id, data): todos os registros de um jogador formam um intervalo contíguo.
    pares = [((2, "2020-01-01"), 10), ((1, "2019-05-01"), 5), ((2, "2018-01-01"), 7), ((3, "2021-01-01"), 1)]
    lista = ListaOrdenada.construir(pares)
    assert lista.intervalo((2, ""), (2, "￿")) == [((2, "2018-01-01"), 7), ((2, "2020-01-01"), 10)]
    assert lista.piso((2, "2019-06-01")) == ((2, "2018-01-01"), 7)


def test_insercao_e_remocao():
    lista = ListaOrdenada()
    for c in [5, 1, 9, 3]:
        assert lista.inserir(c, str(c))
    assert not lista.inserir(9, "x")
    assert lista.chaves == [1, 3, 5, 9]
    assert lista.remover(3) and not lista.remover(3)
    assert lista.chaves == [1, 5, 9]
