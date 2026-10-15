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

    def buscar(self, chave, rastro=None):
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
        atual = self.cabeca
        while atual is not None:
            if atual.chave == chave:
                return atual.valor
            atual = atual.prox
        return None

    def _reorganizar(self, ante_anterior, anterior, atual, posicao, rastro):
        pass

    def _novo_no(self, chave, valor):
        return NoLista(chave, valor)

    def inserir(self, chave, valor, rastro=None):
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

    def esvaziar(self, rastro=None):
        r = rastro or RASTRO_NULO
        r.registrar("esvazia", quantidade=self.tamanho)
        self.cabeca = None
        self.tamanho = 0

    def remover_ultimo(self, rastro=None):
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
