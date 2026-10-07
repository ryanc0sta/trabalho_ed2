"""Testes da carga com CSVs pequenos (mesmas colunas da base real)."""

import csv

import pytest

from backend.dados.carregar import carregar
from backend.estruturas.rastro import Rastro

JOGADORES = [
    # id, nome, última temporada, clube, liga, valor, foto
    (1, "Erling Haaland", 2025, 281, "GB1", 200_000_000, "https://img/1.jpg"),
    (2, "Bukayo Saka", 2025, 11, "GB1", 130_000_000, "https://img/2.jpg"),
    (3, "Markus Haaland", 2025, 11, "GB1", 900_000, "https://img/default.jpg"),
    (4, "Miroslav Klose", 2015, 398, "IT1", 1_000_000, ""),  # aposentado
    (5, "Nicolò Barella", 2025, 46, "IT1", 70_000_000, ""),
    (6, "Jogador Sem Valor", 2025, 46, "IT1", None, ""),
    (7, "Juan Colombiano", 2025, 999, "COL1", 500_000, ""),  # liga fora de competitions.csv
    (8, "Bukayo Saka", 2025, 46, "IT1", 100_000, ""),  # homônimo
]

PAISES = {1: "Norway", 3: "Norway", 2: "England", 8: "England", 5: "Italy", 6: "Italy",
          7: "Colombia", 4: "Germany"}

COLUNAS_JOGADORES = [
    "player_id", "first_name", "last_name", "name", "last_season", "current_club_id",
    "player_code", "country_of_birth", "city_of_birth", "country_of_citizenship",
    "date_of_birth", "sub_position", "position", "foot", "height_in_cm",
    "contract_expiration_date", "agent_name", "image_url", "international_caps",
    "international_goals", "current_national_team_id", "url",
    "current_club_domestic_competition_id", "current_club_name", "market_value_in_eur",
    "highest_market_value_in_eur",
]


def escrever(pasta, nome, colunas, linhas):
    with open(pasta / nome, "w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=colunas, restval="")
        escritor.writeheader()
        escritor.writerows(linhas)


@pytest.fixture(scope="module")
def base(tmp_path_factory):
    pasta = tmp_path_factory.mktemp("dados")
    escrever(pasta, "players.csv", COLUNAS_JOGADORES, [
        {"player_id": i, "name": nome, "last_season": temporada, "current_club_id": clube,
         "current_club_domestic_competition_id": liga, "current_club_name": f"Clube {clube}",
         "market_value_in_eur": valor if valor is not None else "", "image_url": foto,
         "date_of_birth": "2000-07-21 00:00:00", "position": "Attack", "height_in_cm": "194",
         "sub_position": "Centre-Forward", "country_of_citizenship": PAISES[i]}
        for i, nome, temporada, clube, liga, valor, foto in JOGADORES
    ])
    escrever(pasta, "clubs.csv", ["club_id", "name", "domestic_competition_id", "stadium_name",
                                  "stadium_seats", "coach_name"], [
        {"club_id": 281, "name": "Manchester City", "domestic_competition_id": "GB1",
         "stadium_name": "Etihad Stadium", "stadium_seats": "55017"},
        {"club_id": 11, "name": "Arsenal FC", "domestic_competition_id": "GB1"},
        {"club_id": 46, "name": "Inter Milan", "domestic_competition_id": "IT1"},
    ])
    escrever(pasta, "competitions.csv", ["competition_id", "name", "type", "country_id",
                                         "country_name"], [
        {"competition_id": "GB1", "name": "premier-league", "type": "domestic_league",
         "country_id": "189", "country_name": "England"},
        {"competition_id": "IT1", "name": "serie-a", "type": "domestic_league",
         "country_id": "75", "country_name": "Italy"},
        {"competition_id": "CL", "name": "uefa-champions-league", "type": "international_cup",
         "country_id": "-1"},
    ])
    escrever(pasta, "player_valuations.csv", ["player_id", "date", "market_value_in_eur"], [
        {"player_id": 1, "date": "2021-10-07", "market_value_in_eur": 150_000_000},
        {"player_id": 2, "date": "2020-01-01", "market_value_in_eur": 20_000_000},
        {"player_id": 1, "date": "2019-12-16", "market_value_in_eur": 45_000_000},
        {"player_id": 1, "date": "2024-12-16", "market_value_in_eur": 200_000_000},
        {"player_id": 1, "date": "2017-01-01", "market_value_in_eur": 200_000},
    ])
    escrever(pasta, "transfers.csv", ["player_id", "transfer_date", "transfer_season",
                                      "from_club_id", "to_club_id", "from_club_name",
                                      "to_club_name", "transfer_fee", "market_value_in_eur",
                                      "player_name"], [
        {"player_id": 3, "transfer_date": "2022-07-01", "transfer_season": "22/23", "player_name": "Markus Haaland",
         "from_club_id": 11, "to_club_id": 11, "from_club_name": "Arsenal U21", "to_club_name": "Arsenal"},
        {"player_id": 5, "transfer_date": "2019-07-12", "transfer_season": "19/20", "player_name": "Nicolò Barella",
         "from_club_id": 1390, "to_club_id": 46, "from_club_name": "Cagliari", "to_club_name": "Inter",
         "transfer_fee": "32500000.000"},
        {"player_id": 1, "transfer_date": "2022-07-01", "transfer_season": "22/23", "player_name": "Erling Haaland",
         "from_club_id": 16, "to_club_id": 281, "from_club_name": "Dortmund",
         "to_club_name": "Man City", "transfer_fee": "60000000.000"},
        {"player_id": 1, "transfer_date": "2020-01-01", "transfer_season": "19/20", "player_name": "Erling Haaland",
         "from_club_id": 409, "to_club_id": 16, "from_club_name": "Salzburg",
         "to_club_name": "Dortmund", "transfer_fee": "20000000.000"},
    ])
    return carregar(pasta)


def test_jogadores_e_temporada(base):
    assert len(base.jogadores) == len(JOGADORES)
    assert base.temporada_atual == 2025
    haaland = base.jogador(1)
    assert haaland.nome == "Erling Haaland" and haaland.nascimento == "2000-07-21"
    assert haaland.altura == 194 and haaland.ativo
    assert base.jogador(3).foto is None  # foto padrão do site vira None
    assert not base.jogador(4).ativo
    assert base.jogador(6).valor is None


def test_em_alta_sao_os_mais_valiosos_e_nao_muda_com_visitas(base):
    rastro = Rastro()
    assert [j.id for j in base.em_alta(3, rastro)] == [1, 2, 5]  # €200M, €130M, €70M
    # Achar o maior é descer sempre para a direita.
    assert all(p["decisao"] == "direita" for p in rastro.passos if p["passo"] == "compara")
    for _ in range(5):
        base.busca.buscar(base.jogador(8).chave)  # visitas a um jogador barato
    assert [j.id for j in base.em_alta(3)] == [1, 2, 5]


def test_arvore_de_afinidades_agrupa_e_ordena_por_valor(base):
    chaves = [chave for chave, _ in base.afinidades.em_ordem()]
    assert chaves == sorted(chaves)
    da_inter = [(chave[0], j.nome) for chave, j in base.afinidades.iterar_a_partir_de(("clube:46",))
                if chave[0] == "clube:46"]
    # Mesmo grupo = vizinhos, do mais valioso para o menos (sem valor por último).
    assert [nome for _, nome in da_inter] == ["Nicolò Barella", "Bukayo Saka", "Jogador Sem Valor"]
    assert not any(j.id == 4 for _, j in base.afinidades.em_ordem())  # aposentado fica fora


def test_recomendar_soma_criterios_e_exclui_as_fontes(base):
    saka = base.jogador(2)  # Arsenal (clube 11), Premier League, England
    rastro = Rastro()
    recomendados = base.recomendar([saka], rastro=rastro)
    # Markus Haaland: mesmo clube (3) + mesma liga e posição (2) = 5 pontos -> primeiro.
    # Erling Haaland e o outro Saka empatam em 2; desempata o valor de mercado.
    assert [(j.id, criterio) for j, criterio, _ in recomendados] == [(3, "clube"), (1, "liga"), (8, "pais")]
    assert all(fonte is saka for _, _, fonte in recomendados)
    assert [p["nome"] for p in rastro.passos if p["passo"] == "etapa"] == ["clube", "liga", "pais"]
    assert [p["quantidade"] for p in rastro.passos if p["passo"] == "grupo"] == [1, 2, 1]
    # Com duas fontes, nenhuma delas é recomendada; sem fontes, nada a recomendar.
    ids = [j.id for j, _, _ in base.recomendar([saka, base.jogador(1)])]
    assert 2 not in ids and 1 not in ids and 3 in ids
    assert base.recomendar([]) == []


def test_recomendar_divide_as_vagas_entre_os_perfis_abertos(base):
    saka, barella = base.jogador(2), base.jogador(5)
    todos = base.recomendar([saka, barella])
    assert {fonte.id for _, _, fonte in todos} == {2, 5}
    # O outro Saka (id 8) combina com os DOIS perfis: clube e liga de Barella (3 + 2) e
    # país do Saka (2) = 7 pontos. "Jogador Sem Valor" também soma 7 (clube, liga e país
    # de Barella); o valor de mercado desempata.
    assert [j.id for j, _, _ in todos[:2]] == [8, 6]
    assert todos[0][1:] == ("clube", barella)  # o motivo mostrado é o de maior peso
    # Com só duas vagas, cada perfil fica com uma — mesmo havendo outro candidato de Barella com mais pontos.
    duas = base.recomendar([saka, barella], limite=2)
    assert [(j.id, fonte.id) for j, _, fonte in duas] == [(8, 5), (3, 2)]


def test_recomendar_limita_recomendacoes_pelo_mesmo_motivo(base):
    barella = base.jogador(5)  # Inter: dois companheiros de clube
    um_por_motivo = base.recomendar([barella], por_motivo=1)
    assert len({criterio for _, criterio, _ in um_por_motivo}) == len(um_por_motivo)


def test_ligas_so_com_ativos_e_ordem_por_valor(base):
    assert base.ligas.chaves() == ["GB1", "IT1"]  # GB1 vale mais
    assert base.ligas_classica.chaves() == ["GB1", "IT1"]
    assert base.ligas_ignoradas == ["COL1"]
    serie_a = base.liga("IT1")
    assert serie_a.nome == "Serie A" and serie_a.pais == "Italy"
    nomes = [j.nome for _, j in serie_a.skip]
    assert "Miroslav Klose" not in nomes  # aposentado fica fora da liga
    assert sorted(nomes) == ["Bukayo Saka", "Jogador Sem Valor", "Nicolò Barella"]
    # Nível mais alto da Skip List modificada = o mais valioso da liga.
    assert serie_a.skip.nos_do_nivel(serie_a.skip.nivel)[0][1].nome == "Nicolò Barella"
    assert len(serie_a.skip_classica) == 3


def test_consultar_liga_nao_reorganiza(base):
    base.liga("IT1")
    assert base.ligas.chaves()[0] == "GB1"


def test_clubes(base):
    city = base.clube(281)
    assert city.nome == "Manchester City" and city.capacidade == 55017
    assert [j.nome for j in city.elenco] == ["Erling Haaland"]
    lazio = base.clube(398)  # só existe nos jogadores
    assert lazio is not None and lazio.elenco == []


def test_busca_e_homonimos(base):
    assert len(base.busca) == len(base.busca_classica) == len(JOGADORES)
    sakas = [j.id for c, j in base.busca.a_partir_de(("bukayo saka",), 2)]
    assert sakas == [2, 8]
    jogador = base.busca.buscar(base.jogador(5).chave)
    assert jogador.nome == "Nicolò Barella"


def test_sugerir_pelo_sobrenome_e_por_valor(base):
    assert [j.id for j in base.sugerir("haal")] == [1, 3]
    assert [j.id for j in base.sugerir("NICOLO")] == [5]  # sem acento e maiúsculas
    assert [j.id for j in base.sugerir("saka")] == [2, 8]
    assert base.sugerir("") == [] and base.sugerir("xyz") == []


def test_historico_avl(base):
    rastro = Rastro()
    avl = base.historico(1, rastro)
    assert [d for d, _ in avl] == ["2017-01-01", "2019-12-16", "2021-10-07", "2024-12-16"]
    assert avl.valor_em("2020-06-01") == ("2019-12-16", 45_000_000)
    assert avl.pico("2018-01-01", "2022-01-01") == ("2021-10-07", 150_000_000)
    assert [p for p in rastro.passos if p["passo"] == "rotacao"]  # inserção em ordem rotaciona
    assert len(base.historico(999)) == 0


# ------------------------------------------------------- segunda leva
def test_posicoes_com_skip_list_e_movimentacao_para_o_inicio(base):
    assert base.posicoes.chaves() == ["Centre-Forward"]  # na base de teste todos são centroavantes
    posicao = base.posicao("Centre-Forward")
    assert posicao.jogadores == 7 and len(posicao.skip) == len(posicao.skip_classica) == 7
    assert posicao.skip.nos_do_nivel(posicao.skip.nivel)[0][1].id == 1  # o topo é o mais valioso
    assert base.posicao("Goalkeeper") is None


def test_janela_de_transferencias_binaria_e_interpolacao_concordam(base):
    total, maiores, binaria, interpolacao = base.transferencias_na_janela("2019-01-01", "2020-12-31")
    assert total == 2 and binaria > 0 and interpolacao > 0
    assert [(nome, t.taxa) for _, nome, t in maiores] == [("Nicolò Barella", 32_500_000), ("Erling Haaland", 20_000_000)]
    # O dia final entra inteiro, mesmo com várias transferências na mesma data.
    assert base.transferencias_na_janela("2022-07-01", "2022-07-01")[0] == 2
    assert base.transferencias_na_janela("2000-01-01", "2000-12-31")[0] == 0
    assert len(base.janela) == 4


def test_extremos_da_liga(base):
    # Todos nasceram no mesmo dia na base de teste: a menor chave tem o menor id, a maior, o maior.
    rastro = Rastro()
    extremos = base.extremos_da_liga("IT1", rastro)
    assert extremos["mais_velho"].id == 5 and extremos["mais_jovem"].id == 8
    assert extremos["mais_alto"].liga_id == "IT1" and extremos["mais_baixo"].liga_id == "IT1"
    assert [p["nome"] for p in rastro.passos if p["passo"] == "etapa"] == ["mais_velho", "mais_jovem"]
    assert base.extremos_da_liga("XX9")["mais_velho"] is None  # liga sem jogadores


def test_comparar_intercala_os_historicos_por_data(base):
    rastro = Rastro()
    arvores, linha = base.comparar([base.jogador(1), base.jogador(2)], rastro)
    assert [len(a) for a in arvores] == [4, 1]
    assert [(data, indice) for data, indice, _ in linha] == [
        ("2017-01-01", 0), ("2019-12-16", 0), ("2020-01-01", 1), ("2021-10-07", 0), ("2024-12-16", 0)]
    assert [p["fonte"] for p in rastro.passos] == [0, 0, 1, 0, 0]


def test_maquina_do_tempo(base):
    rastro = Rastro()
    linhas, comparacoes, arvore = base.maquina_do_tempo(base.clube(281), "2020-06-01", rastro)
    assert [(j.id, valor, quando) for j, valor, quando in linhas] == [(1, 45_000_000, "2019-12-16")]
    assert comparacoes > 0 and len(arvore) == 4
    # Jogador sem avaliação até a data fica sem valor.
    linhas, _, _ = base.maquina_do_tempo(base.clube(11), "2019-01-01")
    assert [valor for _, valor, _ in linhas] == [None, None]


def test_transferencias_em_ordem(base):
    transferencias = base.transferencias_de(1)
    assert [(t.de_clube, t.para_clube, t.taxa) for t in transferencias] == [
        ("Salzburg", "Dortmund", 20_000_000), ("Dortmund", "Man City", 60_000_000)]
    assert base.transferencias_de(2) == []
