"""Registros da aplicação (um objeto por linha dos CSVs).

São classes simples com __slots__: guardam os campos de um registro, mas não
fazem busca nem organização — isso fica a cargo das estruturas de dados.
"""

import unicodedata

URL_ESCUDO = "https://tmssl.akamaized.net/images/wappen/head/{}.png"
URL_LOGO_LIGA = "https://tmssl.akamaized.net/images/logo/header/{}.png"
URL_BANDEIRA = "https://tmssl.akamaized.net/images/flagge/head/{}.png"


def normalizar(texto):
    """Minúsculas e sem acentos: 'Kylian Mbappé' -> 'kylian mbappe'."""
    decomposto = unicodedata.normalize("NFKD", texto.strip().lower())
    return "".join(c for c in decomposto if not unicodedata.combining(c))


def _para_json(objeto):
    return {campo: getattr(objeto, campo) for campo in objeto.CAMPOS_JSON}


class Jogador:
    __slots__ = (
        "id", "nome", "chave", "posicao", "sub_posicao", "pe", "altura",
        "nascimento", "pais_nascimento", "cidadania", "clube_id", "clube_nome",
        "liga_id", "valor", "valor_maximo", "foto", "contrato", "agente",
        "jogos_selecao", "gols_selecao", "ultima_temporada", "ativo", "url",
    )
    CAMPOS_JSON = (
        "id", "nome", "posicao", "sub_posicao", "pe", "altura", "nascimento",
        "pais_nascimento", "cidadania", "clube_id", "clube_nome", "liga_id",
        "valor", "valor_maximo", "foto", "contrato", "agente", "jogos_selecao",
        "gols_selecao", "ultima_temporada", "ativo", "url",
    )

    def __init__(self, **campos):
        for campo in self.__slots__:
            setattr(self, campo, campos.get(campo))
        # Chave das estruturas por nome: (nome normalizado, id) — o id
        # desempata os ~900 nomes repetidos da base.
        self.chave = (normalizar(self.nome), self.id)

    def para_json(self):
        return _para_json(self)

    def resumo(self):
        """Campos usados nos cards."""
        return {
            "id": self.id, "nome": self.nome, "posicao": self.posicao,
            "sub_posicao": self.sub_posicao, "clube_nome": self.clube_nome,
            "valor": self.valor, "foto": self.foto,
        }


class Clube:
    __slots__ = ("id", "nome", "liga_id", "estadio", "capacidade", "tecnico",
                 "valor_total", "escudo", "elenco")
    CAMPOS_JSON = ("id", "nome", "liga_id", "estadio", "capacidade", "tecnico", "escudo")

    def __init__(self, id, nome, liga_id=None, estadio=None, capacidade=None, tecnico=None):
        self.id = id
        self.nome = nome
        self.liga_id = liga_id
        self.estadio = estadio
        self.capacidade = capacidade
        self.tecnico = tecnico
        self.escudo = URL_ESCUDO.format(id)
        self.valor_total = 0
        self.elenco = []  # lista indexada de Jogador (só os ativos)

    def para_json(self):
        return _para_json(self)


class Liga:
    __slots__ = ("id", "nome", "pais", "pais_id", "logo", "bandeira",
                 "jogadores", "valor_total", "skip", "skip_classica")
    CAMPOS_JSON = ("id", "nome", "pais", "logo", "bandeira", "jogadores", "valor_total")

    def __init__(self, id, nome, pais, pais_id):
        self.id = id
        self.nome = nome
        self.pais = pais
        self.pais_id = pais_id
        self.logo = URL_LOGO_LIGA.format(id.lower())
        self.bandeira = URL_BANDEIRA.format(pais_id) if pais_id else None
        self.jogadores = 0
        self.valor_total = 0
        self.skip = None  # SkipListValor (modificada)
        self.skip_classica = None  # SkipList (clássica, para comparação)

    def para_json(self):
        return _para_json(self)


class Posicao:
    """Uma posição em campo (ex.: Centre-Forward) com a Skip List dos seus jogadores."""
    __slots__ = ("id", "jogadores", "valor_total", "skip", "skip_classica")
    CAMPOS_JSON = ("id", "jogadores", "valor_total")

    def __init__(self, id):
        self.id = id
        self.jogadores = 0
        self.valor_total = 0
        self.skip = None
        self.skip_classica = None

    def para_json(self):
        return _para_json(self)


class Transferencia:
    __slots__ = ("data", "temporada", "de_clube_id", "de_clube", "para_clube_id",
                 "para_clube", "taxa", "valor_mercado")
    CAMPOS_JSON = __slots__

    def __init__(self, data, temporada, de_clube_id, de_clube, para_clube_id,
                 para_clube, taxa, valor_mercado):
        self.data = data
        self.temporada = temporada
        self.de_clube_id = de_clube_id
        self.de_clube = de_clube
        self.para_clube_id = para_clube_id
        self.para_clube = para_clube
        self.taxa = taxa
        self.valor_mercado = valor_mercado

    def para_json(self):
        return _para_json(self)
