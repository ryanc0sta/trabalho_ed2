"""Lista com Saltos (Skip List) de William Pugh (slides: Busca Linear, parte 3).

Lista encadeada ordenada dividida em níveis. Todos os nós estão no nível 0 e
o nível de cada novo nó é sorteado pelo lançamento de uma moeda. A cabeça tem
ponteiros para todos os níveis possíveis e o sentinela representa o final
(uma chave maior do que qualquer outra).

O sorteio fica em `_sortear_nivel`, para que a versão modificada possa trocar
apenas esse critério.
"""

import random

from .rastro import RASTRO_NULO, rotulo


class NoSkip:
    __slots__ = ("chave", "valor", "prox")

    def __init__(self, chave, valor, nivel):
        self.chave = chave
        self.valor = valor
        self.prox = [None] * (nivel + 1)  # nível do nó = nº de ponteiros - 1

    @property
    def nivel(self):
        return len(self.prox) - 1


class SkipList:
    def __init__(self, nivel_max=16, p=0.5, semente=None):
        self.nivel_max = nivel_max
        self.p = p
        self.aleatorio = random.Random(semente)
        self.sentinela = self._novo_no(None, None, 0)
        # A cabeça é criada com ponteiros para o nível máximo, todos no sentinela.
        self.cabeca = self._novo_no(None, None, nivel_max)
        for i in range(nivel_max + 1):
            self.cabeca.prox[i] = self.sentinela
        self.nivel = 0  # nível do nó de maior nível da lista
        self.tamanho = 0

    # ------------------------------------------------------------- auxiliares
    def _novo_no(self, chave, valor, nivel):
        return NoSkip(chave, valor, nivel)

    def _descer(self, chave, rastro):
        """Percurso comum a busca, inserção e remoção: começa no nível mais
        alto e, em cada nível, avança enquanto a próxima chave for menor.
        Retorna o último nó visitado e o array aux com o último nó de cada nível."""
        aux = [self.cabeca] * (self.nivel_max + 1)
        p = self.cabeca
        rastro.registrar("inicio", nivel=self.nivel)
        for i in range(self.nivel, -1, -1):
            while True:
                proximo = p.prox[i]
                if proximo is self.sentinela:
                    rastro.registrar("compara", no="sentinela", nivel=i, decisao="desce")
                    break
                if proximo.chave < chave:
                    rastro.registrar("compara", no=rotulo(proximo.chave), nivel=i, decisao="avanca")
                    p = proximo
                else:
                    rastro.registrar("compara", no=rotulo(proximo.chave), nivel=i, decisao="desce")
                    break
            aux[i] = p
        return p, aux

    def _sortear_nivel(self, chave, valor):
        """Lançamentos de moeda: enquanto der cara (e não passar do máximo),
        o nível do novo nó aumenta."""
        nv = 0
        while self.aleatorio.random() < self.p and nv < self.nivel_max:
            nv += 1
        return nv

    # ------------------------------------------------------------------ busca
    def buscar(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        p, _ = self._descer(chave, r)
        p = p.prox[0]
        if p is not self.sentinela and p.chave == chave:
            r.registrar("encontrado", no=rotulo(chave), nivel=p.nivel)
            return p.valor
        r.registrar("nao_encontrado", chave=rotulo(chave))
        return None

    # --------------------------------------------------------------- inserção
    def inserir(self, chave, valor, rastro=None):
        r = rastro or RASTRO_NULO
        p, aux = self._descer(chave, r)
        p = p.prox[0]
        if p is not self.sentinela and p.chave == chave:
            r.registrar("duplicada", no=rotulo(chave))
            return False

        nv = self._sortear_nivel(chave, valor)
        r.registrar("sorteio", no=rotulo(chave), nivel=nv)
        novo = self._novo_no(chave, valor, nv)
        if nv > self.nivel:
            # Os níveis excedentes partem da cabeça (aux já aponta para ela)
            # e o novo nó aponta para o sentinela neles.
            self.nivel = nv
        for i in range(nv + 1):
            novo.prox[i] = aux[i].prox[i]
            aux[i].prox[i] = novo
            r.registrar(
                "liga", no=rotulo(chave), nivel=i,
                anterior=rotulo(aux[i].chave) if aux[i] is not self.cabeca else "cabeca",
            )
        self.tamanho += 1
        return True

    # ---------------------------------------------------------------- remoção
    def remover(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        p, aux = self._descer(chave, r)
        alvo = p.prox[0]
        if alvo is self.sentinela or alvo.chave != chave:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return False
        for i in range(alvo.nivel + 1):
            aux[i].prox[i] = alvo.prox[i]
            r.registrar("desliga", no=rotulo(chave), nivel=i)
        # Nenhum ponteiro deve sair da cabeça direto para o sentinela acima do nível 0.
        while self.nivel > 0 and self.cabeca.prox[self.nivel] is self.sentinela:
            self.nivel -= 1
        self.tamanho -= 1
        return True

    # --------------------------------------------------------------- consulta
    def nos_do_nivel(self, nivel):
        """Pares (chave, valor) presentes no nível informado, em ordem."""
        resultado = []
        if nivel > self.nivel:
            return resultado
        no = self.cabeca.prox[nivel]
        while no is not self.sentinela:
            resultado.append((no.chave, no.valor))
            no = no.prox[nivel]
        return resultado

    def torres(self, nivel_min=0):
        """Triplas (chave, valor, nível do nó) dos nós presentes em `nivel_min`
        — a "vista de cima" da lista, usada para desenhá-la."""
        resultado = []
        if nivel_min > self.nivel:
            return resultado
        no = self.cabeca.prox[nivel_min]
        while no is not self.sentinela:
            resultado.append((no.chave, no.valor, no.nivel))
            no = no.prox[nivel_min]
        return resultado

    def trecho(self, inicio, quantidade, rastro=None):
        """Até `quantidade` triplas (chave, valor, nível) a partir da posição
        `inicio` (1..n). Na versão clássica é preciso percorrer o nível 0
        desde o começo: θ(inicio)."""
        r = rastro or RASTRO_NULO
        no, posicao = self.cabeca.prox[0], 1
        while no is not self.sentinela and posicao < inicio:
            no, posicao = no.prox[0], posicao + 1
        r.registrar("percorre", nos=posicao - 1)
        resultado = []
        while no is not self.sentinela and len(resultado) < quantidade:
            resultado.append((no.chave, no.valor, no.nivel))
            no = no.prox[0]
        return resultado

    def niveis_dos_nos(self):
        """Pares (chave, nível do nó) no nível 0, em ordem — usado para desenhar."""
        resultado = []
        no = self.cabeca.prox[0]
        while no is not self.sentinela:
            resultado.append((no.chave, no.nivel))
            no = no.prox[0]
        return resultado

    def __iter__(self):
        no = self.cabeca.prox[0]
        while no is not self.sentinela:
            yield no.chave, no.valor
            no = no.prox[0]

    def __len__(self):
        return self.tamanho
