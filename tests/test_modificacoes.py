import math
import random

import pytest

from backend.estruturas.avl_aumentada import ArvoreAVLAumentada
from backend.estruturas.lista_mtf import ListaMTF
from backend.estruturas.lista_ponderada import ListaPonderada
from backend.estruturas.rastro import Rastro
from backend.estruturas.skiplist_valor import SkipListValor
from backend.estruturas.splay_condicional import ArvoreAfuniladaCondicional
from tests.test_arvores import verificar_avl
from tests.test_skiplist import verificar_invariantes


# ===================================================== 1. Lista ponderada
def test_ponderada_acesso_isolado_nao_vai_ao_topo():
    classica, ponderada = ListaMTF(), ListaPonderada(fator=0.9)
    for lista in (classica, ponderada):
        for c in "ABCDE":
            lista.inserir(c, None)
        for _ in range(3):
            lista.buscar("A")
        lista.buscar("E")
    assert classica.chaves() == list("EABCD")  # um acesso a E derruba A
    assert ponderada.chaves() == list("AEBCD")  # E sobe, mas A continua na frente


def test_ponderada_ultrapassa_so_quem_tem_menos_pontos():
    lista = ListaPonderada(fator=0.9)
    for c in "ABCDE":
        lista.inserir(c, None)
    for c in "AAAE":
        lista.buscar(c)
    rastro = Rastro()
    lista.buscar("B", rastro)  # B (1 ponto) passa E (envelhecido: 0,9)
    assert lista.chaves() == list("ABECD")
    assert rastro.passos[-1]["passo"] == "avanca"
    assert rastro.passos[-1]["ultrapassados"] == ["E"]


def test_ponderada_lista_sempre_ordenada_pela_pontuacao():
    aleatorio = random.Random(5)
    lista = ListaPonderada(fator=0.95)
    for c in range(31):
        lista.inserir(c, None)
    for _ in range(3000):
        # Acessos enviesados: poucas ligas muito populares.
        lista.buscar(min(int(aleatorio.expovariate(0.25)), 30))
        pontos = [p for _, p in lista.pontuacoes()]
        assert all(pontos[i] >= pontos[i + 1] - 1e-9 for i in range(len(pontos) - 1))
    assert sorted(lista.chaves()) == list(range(31))
    assert lista.chaves()[0] == 0 and set(lista.chaves()[:3]) <= set(range(5))  # as mais acessadas lideram


# ================================================ 2. Skip List por valor
def gerar_jogadores(n, semente=8):
    aleatorio = random.Random(semente)
    # (nome|id, valor de mercado) com distribuição assimétrica, como na base real
    return [(f"jogador{aleatorio.randrange(10**6):06d}|{i}", int(aleatorio.paretovariate(1.2) * 100_000))
            for i in range(n)]


def larguras_consistentes(lista):
    posicoes, no, pos = {}, lista.cabeca, 0
    while no is not lista.sentinela:
        posicoes[id(no)] = pos
        no, pos = no.prox[0], pos + 1
    posicoes[id(lista.sentinela)] = pos
    no = lista.cabeca
    while no is not lista.sentinela:
        for i in range(len(no.prox)):
            if no is lista.cabeca and i > lista.nivel:
                continue
            assert no.largura[i] == posicoes[id(no.prox[i])] - posicoes[id(no)]
        no = no.prox[0]


def test_skip_valor_niveis_pelo_ranking():
    pares = gerar_jogadores(1000)
    lista = SkipListValor.construir(pares, medida=lambda v: v)
    verificar_invariantes(lista)
    larguras_consistentes(lista)
    assert [c for c, _ in lista] == sorted(c for c, _ in pares)
    for k in range(lista.nivel + 1):
        assert len(lista.nos_do_nivel(k)) == 1000 // 2 ** k  # lista perfeita
    # O nível k contém exatamente os 1000/2^k mais valiosos.
    ranking = sorted(pares, key=lambda p: (-p[1], p[0]))
    for k in (1, 3, 5):
        assert {c for c, _ in lista.nos_do_nivel(k)} == {c for c, _ in ranking[: 1000 // 2 ** k]}
    assert lista.nos_do_nivel(lista.nivel)[0][0] == ranking[0][0]


def media_comparacoes(lista, chaves):
    total = 0
    for chave in chaves:
        rastro = Rastro(guardar=False)
        assert lista.buscar(chave, rastro) is not None
        total += rastro.comparacoes
    return total / len(chaves)


def test_skip_ordenada_por_nome_mantem_busca_logaritmica():
    pares = gerar_jogadores(4000)
    por_nome = SkipListValor.construir(pares, medida=lambda v: v)
    # Alternativa descartada: ordenar pelo próprio valor -> nós altos ficam todos no início.
    por_valor = SkipListValor.construir([((-v, c), v) for c, v in pares], medida=lambda v: v)
    amostra = random.Random(1).sample(pares, 400)
    media_nome = media_comparacoes(por_nome, [c for c, _ in amostra])
    media_valor = media_comparacoes(por_valor, [(-v, c) for c, v in amostra])
    assert media_nome < 3 * math.log2(4000)
    assert media_valor > 10 * media_nome  # degrada para θ(n)


def test_skip_valor_posicao_e_paginacao():
    pares = gerar_jogadores(500)
    lista = SkipListValor.construir(pares, medida=lambda v: v)
    ordenadas = sorted(pares)
    for i, (chave, valor) in enumerate(ordenadas, start=1):
        assert lista.posicao(chave) == i
        assert lista.no_na_posicao(i) == (chave, valor)
    assert lista.posicao("inexistente") is None and lista.no_na_posicao(501) is None
    assert lista.fatia(481, 24) == ordenadas[480:]
    rastro = Rastro()
    lista.no_na_posicao(400, rastro)
    assert len(rastro.passos) < 40  # não percorre os 399 anteriores


def test_skip_valor_insercao_e_remocao_mantem_larguras():
    pares = gerar_jogadores(300)
    lista = SkipListValor.construir(pares, medida=lambda v: v)
    referencia = dict(pares)
    aleatorio = random.Random(13)
    for i in range(1500):
        if aleatorio.random() < 0.5:
            chave, valor = f"novo{aleatorio.randrange(500):03d}", aleatorio.randrange(10**8)
            assert lista.inserir(chave, valor) == (chave not in referencia)
            referencia.setdefault(chave, valor)
        else:
            chave = aleatorio.choice(sorted(referencia))
            assert lista.remover(chave)
            del referencia[chave]
    verificar_invariantes(lista)
    larguras_consistentes(lista)
    ordenadas = sorted(referencia)
    assert [lista.posicao(c) for c in ordenadas[:50]] == list(range(1, 51))


def test_skip_valor_insercao_usa_limiares():
    lista = SkipListValor.construir(gerar_jogadores(1024), medida=lambda v: v)
    rastro = Rastro()
    lista.inserir("craque|0", 10**12, rastro)  # mais valioso que todos
    nivel = [p for p in rastro.passos if p["passo"] == "nivel_por_valor"][0]["nivel"]
    assert nivel == len(lista.limiares)
    rastro = Rastro()
    lista.inserir("reserva|0", 0, rastro)
    assert [p for p in rastro.passos if p["passo"] == "nivel_por_valor"][0]["nivel"] == 0


# ============================================== 3. Splay condicional
def test_splay_condicional_so_afunila_apos_k_acessos():
    arvore = ArvoreAfuniladaCondicional(limite=3)
    arvore.construir_de_ordenados([(c, str(c)) for c in range(100)])
    raiz = arvore.raiz.chave
    for vez in (1, 2):
        rastro = Rastro()
        assert arvore.buscar(87, rastro) == "87"
        assert arvore.raiz.chave == raiz
        assert not [p for p in rastro.passos if p["passo"] == "rotacao"]
        assert arvore.contador(87) == vez
    rastro = Rastro()
    arvore.buscar(87, rastro)
    assert arvore.raiz.chave == 87 and arvore.contador(87) == 0
    assert [p for p in rastro.passos if p["passo"] == "rotacao"]


def test_splay_condicional_busca_malsucedida_nao_altera():
    arvore = ArvoreAfuniladaCondicional(limite=2)
    arvore.construir_de_ordenados([(c, None) for c in range(0, 100, 2)])
    raiz = arvore.raiz.chave
    assert arvore.buscar(33) is None
    assert arvore.raiz.chave == raiz


def test_splay_condicional_operacoes_aleatorias():
    aleatorio = random.Random(21)
    arvore, referencia = ArvoreAfuniladaCondicional(limite=3), {}
    for _ in range(4000):
        chave = aleatorio.randrange(300)
        op = aleatorio.random()
        if op < 0.4:
            assert arvore.inserir(chave, chave) == (chave not in referencia)
            referencia.setdefault(chave, chave)
        elif op < 0.6:
            assert arvore.remover(chave) == (chave in referencia)
            referencia.pop(chave, None)
        else:
            assert arvore.buscar(chave) == referencia.get(chave)
    assert list(arvore.em_ordem()) == sorted(referencia.items())


def test_splay_condicional_topo_estavel_com_acessos_isolados():
    """Populares acessados com frequência + muitos acessos isolados: na versão
    condicional, os populares ficam nos primeiros níveis."""
    from backend.estruturas.splay import ArvoreAfunilada

    aleatorio = random.Random(2)
    populares = [10, 500, 900]
    resultados = {}
    for classe in (ArvoreAfunilada, ArvoreAfuniladaCondicional):
        arvore = classe()
        arvore.construir_de_ordenados([(c, None) for c in range(1000)])
        for _ in range(300):
            for p in populares:
                arvore.buscar(p)
            for _ in range(5):
                arvore.buscar(aleatorio.randrange(1000))  # curiosos
        topo = {c for nivel in arvore.primeiros_niveis(3) for c, _ in nivel}
        resultados[classe.__name__] = len(topo & set(populares))
    assert resultados["ArvoreAfuniladaCondicional"] > resultados["ArvoreAfunilada"]


# ================================================= 4. AVL aumentada
def verificar_max(arvore, no):
    if no is None:
        return -math.inf
    maior = max(arvore.medida(no.valor), verificar_max(arvore, no.esq), verificar_max(arvore, no.dir))
    assert no.max_sub == maior
    return maior


def test_avl_aumentada_max_sub_correto_apos_operacoes():
    aleatorio = random.Random(31)
    arvore, referencia = ArvoreAVLAumentada(), {}
    for _ in range(3000):
        chave = aleatorio.randrange(400)
        if aleatorio.random() < 0.6:
            valor = aleatorio.randrange(10**6)
            assert arvore.inserir(chave, valor) == (chave not in referencia)
            referencia.setdefault(chave, valor)
        else:
            assert arvore.remover(chave) == (chave in referencia)
            referencia.pop(chave, None)
    verificar_avl(arvore.raiz)
    verificar_max(arvore, arvore.raiz)
    assert list(arvore.em_ordem()) == sorted(referencia.items())


def test_avl_aumentada_pico_contra_forca_bruta():
    aleatorio = random.Random(41)
    pares = {aleatorio.randrange(5000): aleatorio.randrange(10**7) for _ in range(800)}
    arvore = ArvoreAVLAumentada()
    for chave, valor in pares.items():
        arvore.inserir(chave, valor)
    for _ in range(500):
        de = aleatorio.randrange(-100, 5100)
        ate = de + aleatorio.randrange(0, 3000)
        no_intervalo = [(c, v) for c, v in pares.items() if de <= c <= ate]
        resposta = arvore.pico(de, ate)
        if not no_intervalo:
            assert resposta is None
        else:
            assert resposta[1] == max(v for _, v in no_intervalo)
            assert de <= resposta[0] <= ate and pares[resposta[0]] == resposta[1]


def test_avl_aumentada_pico_logaritmico():
    arvore = ArvoreAVLAumentada()
    arvore.construir_de_ordenados([(c, (c * 7919) % 10007) for c in range(10000)])
    rastro = Rastro()
    arvore.pico(1000, 9000, rastro)
    assert rastro.comparacoes < 4 * math.log2(10000)  # a força bruta veria 8001 nós


def test_avl_aumentada_com_datas_e_valor_em():
    arvore = ArvoreAVLAumentada(medida=lambda v: v)
    historico = [("2015-01-10", 1_000_000), ("2017-06-01", 25_000_000),
                 ("2019-07-15", 80_000_000), ("2021-02-01", 60_000_000), ("2023-12-20", 30_000_000)]
    for data, valor in historico:
        arvore.inserir(data, valor)
    assert arvore.valor_em("2020-01-01") == ("2019-07-15", 80_000_000)
    assert arvore.valor_em("2014-01-01") is None
    assert arvore.pico("2020-01-01", "2024-01-01") == ("2021-02-01", 60_000_000)
    assert arvore.pico("2000-01-01", "2030-01-01") == ("2019-07-15", 80_000_000)
