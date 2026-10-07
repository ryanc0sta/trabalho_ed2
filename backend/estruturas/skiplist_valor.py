"""MODIFICAÇÃO 2 — Lista com saltos com níveis por valor e larguras (jogadores de uma liga).

Problema da versão clássica: o nível de cada nó vem de lançamentos de moeda,
então "olhar a liga por cima" (só os níveis altos) mostra jogadores
aleatórios.

Modificação (a) — nível pelo valor de mercado, não pela moeda:
  a lista continua ordenada pelo NOME, mas o nível de cada jogador vem da sua
  posição no ranking de valor da liga: a metade mais valiosa tem nível >= 1,
  o quarto mais valioso tem nível >= 2, o oitavo, nível >= 3, e assim por
  diante (posição r -> nível ⌊log₂(n/r)⌋). Cada nível tem exatamente metade
  dos nós do nível de baixo, como numa lista com saltos perfeita, e o nível
  mais alto mostra só as estrelas.

  Por que ordenar pelo nome e não pelo valor? Se a lista estivesse ordenada
  pelo próprio valor, todos os nós altos ficariam juntos no começo e, para
  achar um jogador barato, a busca percorreria quase todo o nível 0: θ(n).
  Como nome e valor são independentes, os nós altos ficam espalhados pela
  lista e a busca continua θ(log n) — sem precisar de moeda.

  Os limiares de valor de cada nível são calculados na construção; jogadores
  inseridos depois recebem o nível pelo limiar que alcançam.

Modificação (b) — larguras nos ponteiros:
  cada ponteiro guarda quantos nós do nível 0 ele salta. Somando as larguras
  durante a descida, obtém-se a posição de um nó, e a descida inversa acha o
  nó de uma posição — paginação ("página 30") em θ(log n), sem percorrer os
  nós anteriores. As larguras são atualizadas na inserção e na remoção.

Convenção: a cabeça está na posição 0, os nós nas posições 1..n e o
sentinela na posição n+1.
"""

from .ordenacao import merge_sort
from .rastro import RASTRO_NULO, rotulo
from .skiplist import NoSkip, SkipList


class NoSkipLargura(NoSkip):
    __slots__ = ("largura",)

    def __init__(self, chave, valor, nivel):
        super().__init__(chave, valor, nivel)
        self.largura = [0] * (nivel + 1)


class SkipListValor(SkipList):
    def __init__(self, medida, nivel_max=16, limiares=None):
        """medida(valor) -> número usado para definir o nível (valor de mercado).
        limiares[k-1] = menor medida exigida para ter nível >= k."""
        super().__init__(nivel_max=nivel_max)
        self.medida = medida
        self.limiares = list(limiares or [])
        self.cabeca.largura = [1] * (nivel_max + 1)  # lista vazia: sentinela na posição 1
        self._dedo = None  # (chave, aux, pos) da última busca de teto

    def _novo_no(self, chave, valor, nivel):
        return NoSkipLargura(chave, valor, nivel)

    # ------------------------------------------------------------- construção
    @classmethod
    def construir(cls, pares, medida, nivel_max=16):
        """Monta a lista em θ(n log n) a partir de pares (chave, valor) em
        qualquer ordem: ordena por valor para definir os níveis, ordena pela
        chave e liga os nós da esquerda para a direita."""
        n = len(pares)
        itens = [[chave, valor, 0] for chave, valor in pares]  # [chave, valor, nível]

        # 1. Ranking por valor (desempate pela chave): posição r -> nível ⌊log₂(n/r)⌋.
        por_valor = merge_sort(itens, chave=lambda it: (-medida(it[1]), it[0]))
        for r, item in enumerate(por_valor, start=1):
            item[2] = min((n // r).bit_length() - 1, nivel_max)
        limiares = []
        k = 1
        while k <= nivel_max and n // (2 ** k) >= 1:
            limiares.append(medida(por_valor[n // (2 ** k) - 1][1]))
            k += 1

        # 2. Ordem pela chave e ligação em θ(n): ultimo[i] é o último nó ligado no nível i.
        lista = cls(medida, nivel_max=nivel_max, limiares=limiares)
        ultimo = [lista.cabeca] * (nivel_max + 1)
        pos_ultimo = [0] * (nivel_max + 1)
        posicao = 0
        anterior = object()
        for chave, valor, nivel in merge_sort(itens, chave=lambda it: it[0]):
            if chave == anterior:
                raise ValueError(f"chave repetida: {chave!r}")
            anterior = chave
            posicao += 1
            novo = lista._novo_no(chave, valor, nivel)
            for i in range(nivel + 1):
                ultimo[i].prox[i] = novo
                ultimo[i].largura[i] = posicao - pos_ultimo[i]
                ultimo[i], pos_ultimo[i] = novo, posicao
        for i in range(nivel_max + 1):  # fecha cada nível no sentinela
            ultimo[i].prox[i] = lista.sentinela
            ultimo[i].largura[i] = n + 1 - pos_ultimo[i]
        lista.tamanho = n
        lista.nivel = max((it[2] for it in itens), default=0)
        return lista

    def _sortear_nivel(self, chave, valor):
        """Sem moeda: o nível é o número de limiares que o valor alcança."""
        v = self.medida(valor)
        nivel = 0
        while nivel < len(self.limiares) and v >= self.limiares[nivel]:
            nivel += 1
        return min(nivel, self.nivel_max)

    # ------------------------------------------------------------- auxiliares
    def _descer_niveis(self, chave, p, posicao, nivel_inicial, aux, pos, rastro):
        """Desce de `nivel_inicial` até o nível 0 a partir do nó `p`, avançando
        enquanto a próxima chave for menor e somando as larguras saltadas.
        Atualiza aux/pos (último nó e sua posição em cada nível)."""
        for i in range(nivel_inicial, -1, -1):
            while True:
                proximo = p.prox[i]
                if proximo is self.sentinela:
                    rastro.registrar("compara", no="sentinela", nivel=i, decisao="desce")
                    break
                if proximo.chave < chave:
                    rastro.registrar("compara", no=rotulo(proximo.chave), nivel=i,
                                     decisao="avanca", largura=p.largura[i])
                    posicao += p.largura[i]
                    p = proximo
                else:
                    rastro.registrar("compara", no=rotulo(proximo.chave), nivel=i, decisao="desce")
                    break
            aux[i], pos[i] = p, posicao
        return p

    def _descer_com_posicao(self, chave, rastro):
        """Como `_descer`, mas também devolve a posição do último nó de cada nível."""
        aux = [self.cabeca] * (self.nivel_max + 1)
        pos = [0] * (self.nivel_max + 1)
        rastro.registrar("inicio", nivel=self.nivel)
        p = self._descer_niveis(chave, self.cabeca, 0, self.nivel, aux, pos, rastro)
        return p, aux, pos

    def posicao_teto(self, chave, rastro=None):
        """Tripla (posição 1..n, chave, valor) da menor chave >= `chave`, ou None.

        A posição sai da soma das larguras: θ(log n). Além disso, a busca é
        DEDILHADA: guarda-se onde a busca anterior parou (o "dedo": o último
        nó de cada nível) e, se a nova chave vier logo depois, a busca
        recomeça dali, subindo só os níveis necessários.

        Partir do dedo custa cerca de 2·log(distância): compensa para alvos
        próximos, mas seria pior que partir da cabeça (log n) para alvos
        distantes. Por isso, antes de usar o dedo, UMA comparação no nível do
        meio decide: se o próximo nó desse nível já passa da chave, o alvo
        está perto; senão, a busca recomeça da cabeça."""
        r = rastro or RASTRO_NULO
        dedo = self._dedo
        usar_dedo = False
        if dedo is not None and chave >= dedo[0]:
            meio = self.nivel // 2
            marco = dedo[1][meio].prox[meio]
            usar_dedo = marco is self.sentinela or marco.chave >= chave
            r.registrar("compara", no="sentinela" if marco is self.sentinela else rotulo(marco.chave),
                        nivel=meio, decisao="perto" if usar_dedo else "longe")
        if usar_dedo:
            aux, pos = list(dedo[1]), list(dedo[2])
            i = 0
            while i < meio:  # sobe enquanto o próximo do nível de cima ainda for menor
                acima = aux[i + 1].prox[i + 1]
                if acima is self.sentinela or acima.chave >= chave:
                    break
                r.registrar("compara", no=rotulo(acima.chave), nivel=i + 1, decisao="sobe")
                i += 1
            r.registrar("dedo", nivel=i, de=rotulo(dedo[0]))
            p = self._descer_niveis(chave, aux[i], pos[i], i, aux, pos, r)
        else:
            p, aux, pos = self._descer_com_posicao(chave, r)
        self._dedo = (chave, aux, pos)
        alvo = p.prox[0]
        if alvo is self.sentinela:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return None
        posicao = pos[0] + p.largura[0]
        r.registrar("encontrado", no=rotulo(alvo.chave), posicao=posicao)
        return posicao, alvo.chave, alvo.valor

    # --------------------------------------------------------------- inserção
    def inserir(self, chave, valor, rastro=None):
        r = rastro or RASTRO_NULO
        p, aux, pos = self._descer_com_posicao(chave, r)
        p = p.prox[0]
        if p is not self.sentinela and p.chave == chave:
            r.registrar("duplicada", no=rotulo(chave))
            return False

        nv = self._sortear_nivel(chave, valor)
        r.registrar("nivel_por_valor", no=rotulo(chave), nivel=nv)
        novo = self._novo_no(chave, valor, nv)
        posicao_novo = pos[0] + 1
        if nv > self.nivel:
            self.nivel = nv
        for i in range(self.nivel_max + 1):
            if i <= nv:
                distancia = posicao_novo - pos[i]
                novo.prox[i] = aux[i].prox[i]
                novo.largura[i] = aux[i].largura[i] - distancia + 1
                aux[i].prox[i] = novo
                aux[i].largura[i] = distancia
                r.registrar(
                    "liga", no=rotulo(chave), nivel=i,
                    anterior=rotulo(aux[i].chave) if aux[i] is not self.cabeca else "cabeca",
                )
            else:
                aux[i].largura[i] += 1  # o ponteiro acima passa a saltar um nó a mais
        self.tamanho += 1
        self._dedo = None  # a lista mudou: o dedo guardado não vale mais
        return True

    # ---------------------------------------------------------------- remoção
    def remover(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        p, aux, _ = self._descer_com_posicao(chave, r)
        alvo = p.prox[0]
        if alvo is self.sentinela or alvo.chave != chave:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return False
        for i in range(self.nivel_max + 1):
            if i <= alvo.nivel:
                aux[i].largura[i] += alvo.largura[i] - 1
                aux[i].prox[i] = alvo.prox[i]
                r.registrar("desliga", no=rotulo(chave), nivel=i)
            else:
                aux[i].largura[i] -= 1
        while self.nivel > 0 and self.cabeca.prox[self.nivel] is self.sentinela:
            self.nivel -= 1
        self.tamanho -= 1
        self._dedo = None  # a lista mudou: o dedo guardado não vale mais
        return True

    # ------------------------------------------------- consultas por posição
    def posicao(self, chave, rastro=None):
        """Posição (1..n) da chave na ordem da lista, ou None — θ(log n)."""
        r = rastro or RASTRO_NULO
        p, _, pos = self._descer_com_posicao(chave, r)
        alvo = p.prox[0]
        if alvo is self.sentinela or alvo.chave != chave:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return None
        posicao = pos[0] + p.largura[0]
        r.registrar("encontrado", no=rotulo(chave), posicao=posicao)
        return posicao

    def _no_em(self, posicao, rastro):
        """Desce como numa busca, mas usando a soma das larguras como chave."""
        p, atual = self.cabeca, 0
        for i in range(self.nivel, -1, -1):
            while p.prox[i] is not self.sentinela and atual + p.largura[i] <= posicao:
                atual += p.largura[i]
                p = p.prox[i]
                rastro.registrar("salta", no=rotulo(p.chave), nivel=i, posicao=atual)
            if atual == posicao:
                break
            rastro.registrar("desce", nivel=i)
        return p

    def no_na_posicao(self, posicao, rastro=None):
        """Par (chave, valor) da posição informada (1..n), ou None — θ(log n)."""
        if not 1 <= posicao <= self.tamanho:
            return None
        p = self._no_em(posicao, rastro or RASTRO_NULO)
        return p.chave, p.valor

    def fatia(self, inicio, quantidade, rastro=None):
        """Até `quantidade` pares a partir da posição `inicio` — uma página."""
        return [(chave, valor) for chave, valor, _ in self.trecho(inicio, quantidade, rastro)]

    def trecho(self, inicio, quantidade, rastro=None):
        """Como na versão clássica, mas chega à posição `inicio` pelas
        larguras em θ(log n), em vez de percorrer o nível 0."""
        if not 1 <= inicio <= self.tamanho:
            return []
        p = self._no_em(inicio, rastro or RASTRO_NULO)
        resultado = []
        while p is not self.sentinela and len(resultado) < quantidade:
            resultado.append((p.chave, p.valor, p.nivel))
            p = p.prox[0]
        return resultado
