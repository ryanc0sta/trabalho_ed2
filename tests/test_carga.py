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
         "date_of_birth": "2000-07-21 00:00:00", "position": "Attack", "height_in_cm": "194"}
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
                                      "to_club_name", "transfer_fee", "market_value_in_eur"], [
        {"player_id": 1, "transfer_date": "2022-07-01", "transfer_season": "22/23",
         "from_club_id": 16, "to_club_id": 281, "from_club_name": "Dortmund",
         "to_club_name": "Man City", "transfer_fee": "60000000.000"},
        {"player_id": 1, "transfer_date": "2020-01-01", "transfer_season": "19/20",
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


def test_transferencias_em_ordem(base):
    transferencias = base.transferencias_de(1)
    assert [(t.de_clube, t.para_clube, t.taxa) for t in transferencias] == [
        ("Salzburg", "Dortmund", 20_000_000), ("Dortmund", "Man City", 60_000_000)]
    assert base.transferencias_de(2) == []
