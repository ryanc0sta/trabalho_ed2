"""Carga da base Transfermarkt (CSVs em dados/) nas estruturas da aplicação.

Tudo é montado uma única vez, quando o servidor sobe, com o rastro desligado.
Para cada estrutura modificada também é montada a versão clássica, usada no
modo de comparação.

Executar `python -m backend.dados.carregar` mostra um resumo da carga.
"""

import csv
import math
import time
from pathlib import Path

from ..estruturas.avl import ArvoreAVL
from ..estruturas.avl_aumentada import ArvoreAVLAumentada
from ..estruturas.avl_ordem import ArvoreAVLOrdem
from ..estruturas.lista_mtf import ListaMTF
from ..estruturas.lista_ordenada import ListaOrdenada
from ..estruturas.lista_transposicao import ListaTransposicao
from ..estruturas.lista_ponderada import ListaPonderada
from ..estruturas.ordenacao import merge_sort
from ..estruturas.rastro import RASTRO_NULO
from ..estruturas.skiplist import SkipList
from ..estruturas.skiplist_valor import SkipListValor
from ..estruturas.splay import ArvoreAfunilada
from ..estruturas.splay_condicional import ArvoreAfuniladaCondicional
from .modelos import Clube, Jogador, Liga, Transferencia, normalizar

PASTA_DADOS = Path(__file__).resolve().parents[2] / "dados"
QUANTOS_AQUECER = 30  # jogadores mais valiosos já "em alta" quando o servidor sobe


def valor_de_mercado(jogador):
    """Medida usada pela Skip List: jogadores sem valor contam como 0."""
    return jogador.valor or 0


def chave_por_valor(jogador):
    """Chave da árvore por valor: (valor, id) — o id desempata valores iguais."""
    return (valor_de_mercado(jogador), jogador.id)


# ---------------------------------------------------------------- conversões
def _inteiro(texto):
    return int(float(texto)) if texto else None


def _data(texto):
    return texto[:10] if texto else None


def _ler(pasta, arquivo):
    """Abre um CSV e devolve (leitor, função que dá o índice de uma coluna)."""
    arquivo_aberto = open(pasta / arquivo, encoding="utf-8", newline="")
    leitor = csv.reader(arquivo_aberto)
    cabecalho = next(leitor)
    return arquivo_aberto, leitor, cabecalho.index


def _titulo(codigo):
    """'premier-league' -> 'Premier League'."""
    return " ".join(parte.capitalize() for parte in codigo.split("-"))


class BaseDeDados:
    def __init__(self):
        # Ligas — modificação 1 (ponderada) e clássica (movimentação para o início)
        self.ligas = ListaPonderada()
        self.ligas_classica = ListaMTF()
        # Busca por nome — modificação 3 (condicional) e clássica
        self.busca = ArvoreAfuniladaCondicional(limite=3)
        self.busca_classica = ArvoreAfunilada()
        # Índices
        self.jogadores = ListaOrdenada()  # id -> Jogador
        self.nomes = ListaOrdenada()  # (trecho do nome, id) -> Jogador, para o autocompletar
        self.clubes = ArvoreAVL()  # id -> Clube
        self.valores = ListaOrdenada()  # (id do jogador, data) -> valor de mercado
        self.transferencias = ListaOrdenada()  # (id do jogador, data, seq) -> Transferencia
        # Jogadores frequentes do usuário: transposição (sobe uma posição por visita)
        self.frequentes = ListaTransposicao()
        # Ferramentas da barra lateral
        self.por_valor = ArvoreAVLOrdem()  # (valor, id) -> Jogador ativo com valor (modificação 5)
        self.minha_lista = SkipListValor(valor_de_mercado)  # lista de observação do usuário
        self.minha_lista_classica = SkipList(semente=7)
        self.buscas = ListaMTF()  # termos buscados: movimentação para o início clássica
        self.temporada_atual = None
        self.ligas_ignoradas = []
        self.tempos = []  # (etapa, segundos)

    # ------------------------------------------------------------- consultas
    def jogador(self, jogador_id):
        return self.jogadores.buscar(jogador_id)

    def clube(self, clube_id):
        return self.clubes.buscar(clube_id)

    def liga(self, liga_id):
        """Consulta sem reorganizar a lista (não conta como acesso)."""
        return self.ligas.consultar(liga_id)

    def sugerir(self, texto, limite=8, rastro=None):
        """Autocompletar: jogadores com alguma palavra do nome começando por
        `texto`. Busca de teto (binária) no índice de nomes e percurso a partir
        dela; os encontrados são ordenados pelo valor de mercado."""
        prefixo = normalizar(texto)
        if not prefixo:
            return []
        encontrados = []
        trecho = self.nomes.intervalo((prefixo,), (prefixo + "\uffff",), rastro, limite=200)
        for _, jogador in trecho:
            if jogador not in encontrados:  # o mesmo jogador pode casar por mais de um trecho
                encontrados.append(jogador)
        return merge_sort(encontrados, chave=lambda j: -(j.valor or 0))[:limite]

    def registrar_frequente(self, jogador, limite=10, rastro=None):
        """Visita a um jogador: se já está na lista, a transposição o adianta
        uma posição; se não está, entra no fim (saindo o último, se cheia)."""
        if self.frequentes.buscar(jogador.id, rastro) is not None:
            return
        if len(self.frequentes) >= limite:
            ultimo = self.frequentes.chaves()[-1]
            self.frequentes.remover(ultimo, rastro)
        self.frequentes.inserir(jogador.id, jogador, rastro)

    # ---------------------------------------------------- ferramentas laterais
    def na_lista(self, jogador):
        return self.minha_lista.buscar(jogador.chave) is not None

    def adicionar_a_lista(self, jogador, classica=False, rastro=None):
        """Inserção ao vivo nas duas versões; o rastro é o da versão pedida."""
        r = rastro or RASTRO_NULO
        inseriu = self.minha_lista.inserir(jogador.chave, jogador, RASTRO_NULO if classica else r)
        self.minha_lista_classica.inserir(jogador.chave, jogador, r if classica else RASTRO_NULO)
        return inseriu

    def remover_da_lista(self, jogador, classica=False, rastro=None):
        r = rastro or RASTRO_NULO
        removeu = self.minha_lista.remover(jogador.chave, RASTRO_NULO if classica else r)
        self.minha_lista_classica.remover(jogador.chave, r if classica else RASTRO_NULO)
        return removeu

    def registrar_busca(self, termo, limite=8, rastro=None):
        """Termo já buscado vai para o início (movimentação para o início);
        termo novo entra no início e, se a lista estiver cheia, sai o último."""
        termo = normalizar(termo)
        if not termo:
            return
        if self.buscas.buscar(termo, rastro) is not None:
            return
        if len(self.buscas) >= limite:
            self.buscas.remover_ultimo(rastro)
        self.buscas.inserir_no_inicio(termo, termo, rastro)

    def faixa_de_valor(self, minimo, maximo, pagina=1, por_pagina=24, classica=False, rastro=None):
        """Jogadores ativos com minimo <= valor <= maximo, do mais caro ao mais
        barato. Devolve (total, jogadores da página, mais barato, mais caro).

        Modificada: o total sai de duas descidas (tamanho das subárvores) e a
        página é selecionada pela posição — θ(log n) + tamanho da página.
        Clássica: percorre toda a faixa para contar — θ(k)."""
        r = rastro or RASTRO_NULO
        de, ate = (minimo, -1), (maximo, math.inf)
        arvore = self.por_valor
        if classica:
            todos = []
            for chave, jogador in arvore.iterar_a_partir_de(de, r):
                if chave > ate:
                    break
                todos.append(jogador)
            r.comparacoes += len(todos)
            r.registrar("percorre_intervalo", nos=len(todos))
            total = len(todos)
            todos.reverse()
            jogadores = todos[(pagina - 1) * por_pagina: pagina * por_pagina]
        else:
            inicio, fim = arvore.posicoes(de, ate, r)
            total = fim - inicio
            alto = fim - (pagina - 1) * por_pagina  # posição logo após a página
            baixo = max(inicio, alto - por_pagina)
            if alto > baixo:
                r.registrar("etapa", nome="pagina")
            jogadores = [j for _, j in arvore.fatia(baixo, alto - baixo, r)] if alto > baixo else []
            jogadores.reverse()
        mais_barato = arvore.teto(de)  # busca de teto: o primeiro a partir do mínimo
        mais_caro = arvore.piso(ate)  # busca de piso: o último até o máximo
        if total == 0:
            mais_barato = mais_caro = None
        return total, jogadores, mais_barato and mais_barato[1], mais_caro and mais_caro[1]

    def parecidos(self, jogador, de_cada_lado=3, rastro=None):
        """Jogadores da mesma posição com valor mais próximo: os vizinhos na
        árvore por valor — sucessores (mais caros) e predecessores (mais baratos)."""
        r = rastro or RASTRO_NULO
        if not jogador.ativo or not jogador.valor:
            return []
        valor, jogador_id = chave_por_valor(jogador)

        def colher(vizinhos, sentido):
            achados, visitados = [], 0
            for _, outro in vizinhos:
                visitados += 1
                if outro.posicao == jogador.posicao:
                    achados.append(outro)
                if len(achados) >= de_cada_lado or visitados >= 400:
                    break
            r.registrar("vizinhos", sentido=sentido, quantidade=len(achados), visitados=visitados)
            return achados

        acima = colher(self.por_valor.iterar_a_partir_de((valor, jogador_id + 1), r), "sucessores")
        abaixo = colher(self.por_valor.iterar_antes_de((valor, jogador_id), r), "predecessores")
        return acima[::-1] + abaixo  # do mais caro ao mais barato

    def ranking_na_liga(self, jogador):
        """Posição do jogador entre os ativos da liga, por valor de mercado."""
        liga = self.liga(jogador.liga_id) if jogador.ativo and jogador.liga_id else None
        if liga is None:
            return None
        meu_valor = valor_de_mercado(jogador)
        acima = sum(1 for _, outro in liga.skip if valor_de_mercado(outro) > meu_valor)
        return {"posicao": acima + 1, "total": liga.jogadores}

    def historico(self, jogador_id, rastro=None):
        """Monta a AVL aumentada do histórico de valores de um jogador.

        A busca binária acha o trecho do jogador no índice de valores e as
        datas são inseridas em ordem cronológica — o rastro registra as
        rotações de balanceamento da construção, para a animação."""
        arvore = ArvoreAVLAumentada()
        for (_, data), valor in self.valores.intervalo((jogador_id, ""), (jogador_id, "￿")):
            arvore.inserir(data, valor, rastro)
        return arvore

    def transferencias_de(self, jogador_id):
        trecho = self.transferencias.intervalo((jogador_id, "", -1), (jogador_id, "￿", 0))
        return [transferencia for _, transferencia in trecho]

    def resumo(self):
        linhas = [
            f"Temporada atual: {self.temporada_atual}",
            f"Ligas: {len(self.ligas)} (ignoradas por não estarem em competitions.csv: "
            f"{', '.join(self.ligas_ignoradas) or 'nenhuma'})",
            f"Jogadores: {len(self.jogadores)} no total, "
            f"{sum(liga.jogadores for _, liga in self.ligas)} ativos nas Skip Lists das ligas",
            f"Clubes: {len(self.clubes)}",
            f"Histórico de valores: {len(self.valores)} registros",
            f"Transferências: {len(self.transferencias)} registros",
            f"Splay de busca: {len(self.busca)} nós, altura {self.busca.altura()}",
            f"Árvore por valor: {len(self.por_valor)} jogadores, altura {self.por_valor.altura()}",
        ]
        for _, liga in self.ligas:
            linhas.append(
                f"  {liga.id:>5} {liga.nome:<30} {liga.jogadores:>4} jogadores, "
                f"Skip List com {liga.skip.nivel + 1} níveis"
            )
        linhas.append("Tempos: " + ", ".join(f"{etapa} {seg:.1f}s" for etapa, seg in self.tempos))
        return "\n".join(linhas)


# ---------------------------------------------------------------------- carga
def carregar(pasta=PASTA_DADOS):
    base = BaseDeDados()
    pasta = Path(pasta)

    def medir(etapa, funcao):
        inicio = time.perf_counter()
        funcao(base, pasta)
        base.tempos.append((etapa, time.perf_counter() - inicio))

    medir("jogadores", _carregar_jogadores)
    medir("clubes", _carregar_clubes)
    medir("ligas", _carregar_ligas)
    medir("busca", _montar_busca)
    medir("por valor", _montar_por_valor)
    medir("valores", _carregar_valores)
    medir("transferências", _carregar_transferencias)
    return base


def _carregar_jogadores(base, pasta):
    arquivo, leitor, col = _ler(pasta, "players.csv")
    c = {nome: col(nome) for nome in (
        "player_id", "name", "last_season", "current_club_id", "country_of_birth",
        "country_of_citizenship", "date_of_birth", "sub_position", "position", "foot",
        "height_in_cm", "contract_expiration_date", "agent_name", "image_url",
        "international_caps", "international_goals", "url",
        "current_club_domestic_competition_id", "current_club_name",
        "market_value_in_eur", "highest_market_value_in_eur",
    )}  # nome da coluna -> índice (só para ler o CSV)
    pares = []
    with arquivo:
        for linha in leitor:
            foto = linha[c["image_url"]]
            pares.append((int(linha[c["player_id"]]), Jogador(
                id=int(linha[c["player_id"]]),
                nome=linha[c["name"]].strip(),
                posicao=linha[c["position"]] or None,
                sub_posicao=linha[c["sub_position"]] or None,
                pe=linha[c["foot"]] or None,
                altura=_inteiro(linha[c["height_in_cm"]]),
                nascimento=_data(linha[c["date_of_birth"]]),
                pais_nascimento=linha[c["country_of_birth"]] or None,
                cidadania=linha[c["country_of_citizenship"]] or None,
                clube_id=_inteiro(linha[c["current_club_id"]]),
                clube_nome=linha[c["current_club_name"]] or None,
                liga_id=linha[c["current_club_domestic_competition_id"]] or None,
                valor=_inteiro(linha[c["market_value_in_eur"]]),
                valor_maximo=_inteiro(linha[c["highest_market_value_in_eur"]]),
                foto=foto if foto and "default" not in foto else None,
                contrato=_data(linha[c["contract_expiration_date"]]),
                agente=linha[c["agent_name"]] or None,
                jogos_selecao=_inteiro(linha[c["international_caps"]]),
                gols_selecao=_inteiro(linha[c["international_goals"]]),
                ultima_temporada=_inteiro(linha[c["last_season"]]),
                url=linha[c["url"]] or None,
            )))
    base.jogadores = ListaOrdenada.construir(pares)
    # Jogadores aposentados continuam ligados ao último clube; "ativo" é quem
    # está na temporada mais recente da base.
    base.temporada_atual = max(j.ultima_temporada or 0 for _, j in base.jogadores)
    for _, jogador in base.jogadores:
        jogador.ativo = jogador.ultima_temporada == base.temporada_atual


def _carregar_clubes(base, pasta):
    arquivo, leitor, col = _ler(pasta, "clubs.csv")
    i_id, i_nome, i_liga = col("club_id"), col("name"), col("domestic_competition_id")
    i_estadio, i_lugares, i_tecnico = col("stadium_name"), col("stadium_seats"), col("coach_name")
    pares = []
    with arquivo:
        for linha in leitor:
            clube_id = int(linha[i_id])
            pares.append((clube_id, Clube(
                clube_id, linha[i_nome], linha[i_liga] or None, linha[i_estadio] or None,
                _inteiro(linha[i_lugares]), linha[i_tecnico] or None,
            )))
    base.clubes = ArvoreAVL()
    base.clubes.construir_de_ordenados(list(ListaOrdenada.construir(pares)))
    # Clubes antigos que só aparecem nos jogadores entram com os dados que existem.
    for _, jogador in base.jogadores:
        if jogador.clube_id is None:
            continue
        clube = base.clubes.buscar(jogador.clube_id)
        if clube is None:
            clube = Clube(jogador.clube_id, jogador.clube_nome, jogador.liga_id)
            base.clubes.inserir(jogador.clube_id, clube)
        if jogador.ativo:
            clube.elenco.append(jogador)
            clube.valor_total += jogador.valor or 0


def _carregar_ligas(base, pasta):
    arquivo, leitor, col = _ler(pasta, "competitions.csv")
    i_id, i_nome, i_tipo = col("competition_id"), col("name"), col("type")
    i_pais, i_pais_id = col("country_name"), col("country_id")
    ligas = ListaOrdenada()
    with arquivo:
        for linha in leitor:
            if linha[i_tipo] == "domestic_league":
                pais_id = linha[i_pais_id] if linha[i_pais_id] not in ("", "-1") else None
                ligas.inserir(linha[i_id], Liga(linha[i_id], _titulo(linha[i_nome]),
                                                linha[i_pais] or None, pais_id))

    # Distribui os jogadores ativos pelas ligas.
    por_liga = ListaOrdenada()  # id da liga -> lista indexada de pares (chave, Jogador)
    for _, jogador in base.jogadores:
        if not jogador.ativo or jogador.liga_id is None:
            continue
        if ligas.buscar(jogador.liga_id) is None:
            if jogador.liga_id not in base.ligas_ignoradas:
                base.ligas_ignoradas.append(jogador.liga_id)
            continue
        grupo = por_liga.buscar(jogador.liga_id)
        if grupo is None:
            grupo = []
            por_liga.inserir(jogador.liga_id, grupo)
        grupo.append((jogador.chave, jogador))

    montadas = []
    for semente, (liga_id, grupo) in enumerate(por_liga):
        liga = ligas.buscar(liga_id)
        liga.jogadores = len(grupo)
        liga.valor_total = sum(valor_de_mercado(j) for _, j in grupo)
        liga.skip = SkipListValor.construir(grupo, medida=valor_de_mercado)
        liga.skip_classica = SkipList(semente=semente)
        for chave, jogador in grupo:
            liga.skip_classica.inserir(chave, jogador)
        montadas.append(liga)

    # Ordem inicial das listas: da liga mais valiosa para a menos valiosa.
    for liga in merge_sort(montadas, chave=lambda l: -l.valor_total):
        base.ligas.inserir(liga.id, liga)
        base.ligas_classica.inserir(liga.id, liga)


def _montar_busca(base, pasta):
    pares = merge_sort([(j.chave, j) for _, j in base.jogadores], chave=lambda par: par[0])
    base.busca.construir_de_ordenados(pares)
    base.busca_classica.construir_de_ordenados(pares)

    # Aquecimento: a árvore balanceada por nome não diz nada sobre
    # popularidade. Os mais valiosos são acessados como se tivessem sido
    # procurados (K vezes na condicional), do menos para o mais valioso, para
    # que "Em alta" comece com eles e o mais valioso fique na raiz.
    ativos = [j for _, j in base.jogadores if j.ativo]
    for jogador in reversed(merge_sort(ativos, chave=lambda j: -valor_de_mercado(j))[:QUANTOS_AQUECER]):
        for _ in range(base.busca.limite):
            base.busca.buscar(jogador.chave)
        base.busca_classica.buscar(jogador.chave)

    # Índice do autocompletar: o nome a partir de cada palavra
    # ("erling haaland" e "haaland"), para achar também pelo sobrenome.
    trechos = []
    for (nome, jogador_id), jogador in pares:
        palavras = nome.split()
        for i in range(len(palavras)):
            trechos.append(((" ".join(palavras[i:]), jogador_id), jogador))
    base.nomes = ListaOrdenada.construir(trechos)


def _montar_por_valor(base, pasta):
    """Árvore por valor (só ativos com valor) e limiares globais dos níveis,
    usados pela lista de observação do usuário."""
    pares = merge_sort([(chave_por_valor(j), j) for _, j in base.jogadores if j.ativo and j.valor],
                       chave=lambda par: par[0])
    base.por_valor.construir_de_ordenados(pares)
    # Mesmo critério das ligas: o nível k exige estar entre os n/2^k mais valiosos.
    n, limiares, k = len(pares), [], 1
    while n // (2 ** k) >= 1:
        limiares.append(pares[n - n // (2 ** k)][0][0])
        k += 1
    base.minha_lista = SkipListValor(valor_de_mercado, limiares=limiares)


def _carregar_valores(base, pasta):
    arquivo, leitor, col = _ler(pasta, "player_valuations.csv")
    i_id, i_data, i_valor = col("player_id"), col("date"), col("market_value_in_eur")
    with arquivo:
        pares = [((int(linha[i_id]), linha[i_data]), int(linha[i_valor])) for linha in leitor]
    base.valores = ListaOrdenada.construir(pares)


def _carregar_transferencias(base, pasta):
    arquivo, leitor, col = _ler(pasta, "transfers.csv")
    i_id, i_data, i_temp = col("player_id"), col("transfer_date"), col("transfer_season")
    i_de, i_para = col("from_club_id"), col("to_club_id")
    i_de_nome, i_para_nome = col("from_club_name"), col("to_club_name")
    i_taxa, i_valor = col("transfer_fee"), col("market_value_in_eur")
    pares = []
    with arquivo:
        # seq (número da linha) desempata transferências do mesmo jogador na mesma data.
        for seq, linha in enumerate(leitor):
            pares.append(((int(linha[i_id]), _data(linha[i_data]) or "", seq), Transferencia(
                _data(linha[i_data]), linha[i_temp], _inteiro(linha[i_de]), linha[i_de_nome],
                _inteiro(linha[i_para]), linha[i_para_nome], _inteiro(linha[i_taxa]),
                _inteiro(linha[i_valor]),
            )))
    base.transferencias = ListaOrdenada.construir(pares)


if __name__ == "__main__":
    inicio = time.perf_counter()
    print(carregar().resumo())
    print(f"Total: {time.perf_counter() - inicio:.1f}s")
