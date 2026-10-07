"""Lista encadeada simples com busca sequencial (slides: Busca Linear, parte 1).

Serve de base para as listas autoorganizáveis (movimentação para o início e
transposição): elas herdam esta classe e redefinem apenas `_reorganizar`,
chamado depois que a busca encontra o elemento.
"""

from .rastro import RASTRO_NULO, rotulo


class NoLista:
    __slots__ = ("chave", "valor", "prox")

    def __init__(self, chave, valor, prox=None):
        self.chave = chave
        self.valor = valor
        self.prox = prox


class ListaEncadeada:
    def __init__(self):
        self.cabeca = None
        self.tamanho = 0

    # ------------------------------------------------------------------ busca
    def buscar(self, chave, rastro=None):
        """Busca sequencial. Retorna o valor associado à chave ou None.

        Guarda o anterior e o anterior do anterior para que as subclasses
        possam reorganizar a lista em tempo constante após encontrar o nó.
        """
        r = rastro or RASTRO_NULO
        ante_anterior, anterior, atual = None, None, self.cabeca
        posicao = 0
        while atual is not None:
            igual = atual.chave == chave
            r.registrar("compara", no=rotulo(atual.chave), posicao=posicao, igual=igual)
            if igual:
                r.registrar("encontrado", no=rotulo(atual.chave), posicao=posicao)
                self._reorganizar(ante_anterior, anterior, atual, posicao, r)
                return atual.valor
            ante_anterior, anterior, atual = anterior, atual, atual.prox
            posicao += 1
        r.registrar("nao_encontrado", chave=rotulo(chave))
        return None

    def consultar(self, chave):
        """Busca sequencial que nunca reorganiza a lista — para leituras
        internas que não devem contar como acesso do usuário."""
        atual = self.cabeca
        while atual is not None:
            if atual.chave == chave:
                return atual.valor
            atual = atual.prox
        return None

    def _reorganizar(self, ante_anterior, anterior, atual, posicao, rastro):
        """Busca sequencial simples: não altera a lista."""

    def _novo_no(self, chave, valor):
        return NoLista(chave, valor)

    # ------------------------------------------------------ inserção/remoção
    def inserir(self, chave, valor, rastro=None):
        """Insere no final, se a chave ainda não existir (chave primária).
        Custo θ(n), pois é preciso percorrer a lista para checar duplicatas."""
        r = rastro or RASTRO_NULO
        anterior, atual = None, self.cabeca
        while atual is not None:
            if atual.chave == chave:
                r.registrar("duplicada", no=rotulo(chave))
                return False
            anterior, atual = atual, atual.prox
        novo = self._novo_no(chave, valor)
        if anterior is None:
            self.cabeca = novo
        else:
            anterior.prox = novo
        self.tamanho += 1
        r.registrar("insere", no=rotulo(chave), posicao=self.tamanho - 1)
        return True

    def inserir_no_inicio(self, chave, valor, rastro=None):
        """Insere como primeiro elemento, se a chave ainda não existir.
        A ligação é θ(1), mas checar a duplicata ainda percorre a lista."""
        r = rastro or RASTRO_NULO
        if self.consultar(chave) is not None:
            r.registrar("duplicada", no=rotulo(chave))
            return False
        novo = self._novo_no(chave, valor)
        novo.prox = self.cabeca
        self.cabeca = novo
        self.tamanho += 1
        r.registrar("insere", no=rotulo(chave), posicao=0)
        return True

    def remover_ultimo(self, rastro=None):
        """Remove o último elemento (o menos recente numa lista com
        movimentação para o início). Retorna a chave removida ou None."""
        r = rastro or RASTRO_NULO
        if self.cabeca is None:
            return None
        anterior, atual = None, self.cabeca
        while atual.prox is not None:
            anterior, atual = atual, atual.prox
        if anterior is None:
            self.cabeca = None
        else:
            anterior.prox = None
        self.tamanho -= 1
        r.registrar("remove", no=rotulo(atual.chave), posicao=self.tamanho)
        return atual.chave

    def remover(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        anterior, atual = None, self.cabeca
        posicao = 0
        while atual is not None and atual.chave != chave:
            anterior, atual = atual, atual.prox
            posicao += 1
        if atual is None:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return False
        if anterior is None:
            self.cabeca = atual.prox
        else:
            anterior.prox = atual.prox
        self.tamanho -= 1
        r.registrar("remove", no=rotulo(chave), posicao=posicao)
        return True

    # --------------------------------------------------------------- consulta
    def __iter__(self):
        atual = self.cabeca
        while atual is not None:
            yield atual.chave, atual.valor
            atual = atual.prox

    def __len__(self):
        return self.tamanho

    def chaves(self):
        return [chave for chave, _ in self]

    def para_lista(self):
        return list(self)
