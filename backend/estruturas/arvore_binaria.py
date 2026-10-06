"""Árvore binária ordinária de busca (slides: Busca Hierárquica, parte 1).

Contém o que é comum às árvores usadas no projeto (AVL e Afunilada): busca,
rotações, busca de piso/teto, percursos e construção balanceada a partir de
uma lista ordenada. As subclasses redefinem inserção/remoção e o gancho
`_atualizar`, chamado sempre que os filhos de um nó mudam (a AVL o usa para
recalcular a altura).

As operações são iterativas para não depender da altura da árvore (uma árvore
ordinária pode degenerar numa lista).
"""

from .rastro import RASTRO_NULO, rotulo


class NoArvore:
    __slots__ = ("chave", "valor", "esq", "dir")

    def __init__(self, chave, valor):
        self.chave = chave
        self.valor = valor
        self.esq = None
        self.dir = None


class ArvoreBinariaBusca:
    def __init__(self):
        self.raiz = None
        self.tamanho = 0

    # ---------------------------------------------------------------- ganchos
    def _novo_no(self, chave, valor):
        return NoArvore(chave, valor)

    def _atualizar(self, no):
        """Chamado após mudar os filhos de `no`. Árvore ordinária: nada a fazer."""

    # --------------------------------------------------------------- rotações
    def _rotacao_direita(self, no, rastro):
        """O filho esquerdo (pivô) sobe e ocupa o lugar de `no`."""
        pivo = no.esq
        no.esq = pivo.dir
        pivo.dir = no
        self._atualizar(no)
        self._atualizar(pivo)
        rastro.registrar("rotacao", direcao="direita", no=rotulo(no.chave), pivo=rotulo(pivo.chave))
        return pivo

    def _rotacao_esquerda(self, no, rastro):
        """O filho direito (pivô) sobe e ocupa o lugar de `no`."""
        pivo = no.dir
        no.dir = pivo.esq
        pivo.esq = no
        self._atualizar(no)
        self._atualizar(pivo)
        rastro.registrar("rotacao", direcao="esquerda", no=rotulo(no.chave), pivo=rotulo(pivo.chave))
        return pivo

    # ------------------------------------------------------------------ busca
    def _localizar(self, chave, rastro):
        no = self.raiz
        while no is not None:
            if chave == no.chave:
                rastro.registrar("compara", no=rotulo(no.chave), decisao="igual")
                return no
            if chave < no.chave:
                rastro.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
                no = no.esq
            else:
                rastro.registrar("compara", no=rotulo(no.chave), decisao="direita")
                no = no.dir
        return None

    def buscar(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        no = self._localizar(chave, r)
        if no is None:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return None
        r.registrar("encontrado", no=rotulo(chave))
        return no.valor

    def piso(self, chave, rastro=None):
        """Maior par (chave, valor) com chave <= chave, ou None."""
        r = rastro or RASTRO_NULO
        no, melhor = self.raiz, None
        while no is not None:
            if no.chave == chave:
                r.registrar("compara", no=rotulo(no.chave), decisao="igual")
                return no.chave, no.valor
            if no.chave < chave:
                r.registrar("compara", no=rotulo(no.chave), decisao="direita")
                melhor = no
                no = no.dir
            else:
                r.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
                no = no.esq
        return (melhor.chave, melhor.valor) if melhor else None

    def teto(self, chave, rastro=None):
        """Menor par (chave, valor) com chave >= chave, ou None."""
        r = rastro or RASTRO_NULO
        no, melhor = self.raiz, None
        while no is not None:
            if no.chave == chave:
                r.registrar("compara", no=rotulo(no.chave), decisao="igual")
                return no.chave, no.valor
            if no.chave > chave:
                r.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
                melhor = no
                no = no.esq
            else:
                r.registrar("compara", no=rotulo(no.chave), decisao="direita")
                no = no.dir
        return (melhor.chave, melhor.valor) if melhor else None

    # --------------------------------------------------------------- inserção
    def inserir(self, chave, valor, rastro=None):
        r = rastro or RASTRO_NULO
        pai, no = None, self.raiz
        while no is not None:
            if chave == no.chave:
                r.registrar("duplicada", no=rotulo(chave))
                return False
            pai = no
            if chave < no.chave:
                r.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
                no = no.esq
            else:
                r.registrar("compara", no=rotulo(no.chave), decisao="direita")
                no = no.dir
        novo = self._novo_no(chave, valor)
        if pai is None:
            self.raiz = novo
        elif chave < pai.chave:
            pai.esq = novo
        else:
            pai.dir = novo
        self.tamanho += 1
        r.registrar("insere", no=rotulo(chave), pai=rotulo(pai.chave) if pai else None)
        return True

    # ---------------------------------------------------------------- remoção
    def remover(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        pai, no = None, self.raiz
        while no is not None and no.chave != chave:
            pai = no
            no = no.esq if chave < no.chave else no.dir
        if no is None:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return False

        if no.esq is not None and no.dir is not None:
            # Caso 3: dois filhos — copia o sucessor (menor da subárvore
            # direita) para o nó e passa a remover o sucessor.
            pai_suc, suc = no, no.dir
            while suc.esq is not None:
                pai_suc, suc = suc, suc.esq
            r.registrar("substitui", no=rotulo(no.chave), por=rotulo(suc.chave))
            no.chave, no.valor = suc.chave, suc.valor
            pai, no = pai_suc, suc

        # Casos 1 e 2: nenhum ou um filho — o filho (ou None) ocupa o lugar.
        filho = no.esq if no.esq is not None else no.dir
        if pai is None:
            self.raiz = filho
        elif pai.esq is no:
            pai.esq = filho
        else:
            pai.dir = filho
        self.tamanho -= 1
        r.registrar("remove", no=rotulo(chave))
        return True

    # ------------------------------------------------------------- construção
    def construir_de_ordenados(self, pares):
        """Monta uma árvore balanceada a partir de pares (chave, valor) já
        ordenados e sem repetição: o elemento do meio vira a raiz, e cada
        metade, recursivamente, uma subárvore. θ(n) e altura ⌈log₂(n+1)⌉."""

        def montar(inicio, fim):
            if inicio > fim:
                return None
            meio = (inicio + fim) // 2
            no = self._novo_no(*pares[meio])
            no.esq = montar(inicio, meio - 1)
            no.dir = montar(meio + 1, fim)
            self._atualizar(no)
            return no

        self.raiz = montar(0, len(pares) - 1)
        self.tamanho = len(pares)

    # --------------------------------------------------------------- consulta
    def em_ordem(self):
        """Percurso em ordem infixa (chaves crescentes), com pilha explícita."""
        pilha, no = [], self.raiz
        while pilha or no is not None:
            while no is not None:
                pilha.append(no)
                no = no.esq
            no = pilha.pop()
            yield no.chave, no.valor
            no = no.dir

    def a_partir_de(self, chave, limite):
        """Até `limite` pares em ordem, começando pelo teto de `chave` —
        base do autocompletar. Não altera a árvore."""
        pilha, no = [], self.raiz
        # Empilha o caminho até o teto, guardando só os nós com chave >= chave.
        while no is not None:
            if no.chave >= chave:
                pilha.append(no)
                no = no.esq
            else:
                no = no.dir
        resultado = []
        while pilha and len(resultado) < limite:
            no = pilha.pop()
            resultado.append((no.chave, no.valor))
            no = no.dir
            while no is not None:
                pilha.append(no)
                no = no.esq
        return resultado

    def primeiros_niveis(self, k):
        """Nós dos k primeiros níveis (raiz = nível 0), em largura."""
        niveis, atual = [], [self.raiz] if self.raiz else []
        while atual and len(niveis) < k:
            niveis.append([(no.chave, no.valor) for no in atual])
            proximo = []
            for no in atual:
                if no.esq is not None:
                    proximo.append(no.esq)
                if no.dir is not None:
                    proximo.append(no.dir)
            atual = proximo
        return niveis

    def altura(self):
        """Número de níveis (árvore vazia = 0), percorrendo em largura."""
        altura, atual = 0, [self.raiz] if self.raiz else []
        while atual:
            altura += 1
            proximo = []
            for no in atual:
                if no.esq is not None:
                    proximo.append(no.esq)
                if no.dir is not None:
                    proximo.append(no.dir)
            atual = proximo
        return altura

    def __len__(self):
        return self.tamanho

    def __iter__(self):
        return self.em_ordem()
