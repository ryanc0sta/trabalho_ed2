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


def test_busca_por_interpolacao_da_o_mesmo_indice_que_a_binaria():
    aleatorio = random.Random(6)
    for chaves in (
        sorted(set(aleatorio.randrange(0, 10**6) for _ in range(5000))),          # uniformes
        sorted(set(1000 * (i // 500) + i for i in range(5000))),                  # em degraus
        sorted(set(int(aleatorio.paretovariate(1.1) * 100) for _ in range(5000))),  # muito concentradas
        [7], [3, 3 + 10**9],
    ):
        lista = ListaOrdenada.construir([(c, None) for c in chaves])
        for x in [chaves[0] - 1, chaves[0], chaves[-1], chaves[-1] + 1] + [aleatorio.randrange(chaves[0], chaves[-1] + 2) for _ in range(300)]:
            assert lista.indice_teto_interpolacao(x) == lista.indice_teto(x) == bisect.bisect_left(chaves, x)
    assert ListaOrdenada().indice_teto_interpolacao(5) == 0


def test_interpolacao_vence_com_chaves_uniformes_e_perde_com_concentradas():
    from backend.estruturas.rastro import Rastro
    aleatorio = random.Random(8)

    def medias(chaves):
        lista = ListaOrdenada.construir([(c, None) for c in chaves])
        binaria = interpolacao = 0
        for _ in range(400):
            x = aleatorio.randrange(chaves[0], chaves[-1] + 1)
            rb, ri = Rastro(guardar=False), Rastro(guardar=False)
            lista.indice_teto(x, rb)
            lista.indice_teto_interpolacao(x, ri)
            binaria += rb.comparacoes
            interpolacao += ri.comparacoes
        return binaria / 400, interpolacao / 400

    uniformes = sorted(set(aleatorio.randrange(0, 10**9) for _ in range(200_000)))
    binaria, interpolacao = medias(uniformes)
    assert interpolacao < binaria  # θ(log log n) contra θ(log n)
    # Concentradas como as datas das transferências: muitos valores colados e alguns distantes.
    concentradas = sorted(set(list(range(100_000)) + [10**9 + i * 10**6 for i in range(1000)]))
    binaria, interpolacao = medias(concentradas)
    assert interpolacao > binaria
