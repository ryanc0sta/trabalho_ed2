from .arvore_binaria import ArvoreBinariaBusca, NoArvore
from .rastro import RASTRO_NULO, rotulo

class NoAVL(NoArvore):
    __slots__ = ("altura",)

    def __init__(self, chave, valor):
        super().__init__(chave, valor)
        self.altura = 1

def _altura(no):
    return no.altura if no is not None else 0

def balanceamento(no):
    return _altura(no.esq) - _altura(no.dir)

class ArvoreAVL(ArvoreBinariaBusca):
    def _novo_no(self, chave, valor):
        return NoAVL(chave, valor)

    def _atualizar(self, no):
        no.altura = 1 + max(_altura(no.esq), _altura(no.dir))

    def _balancear(self, no, rastro):
        fb = balanceamento(no)
        if fb > 1:
            if balanceamento(no.esq) >= 0:
                rastro.registrar("desbalanceado", no=rotulo(no.chave), fator=fb, caso="esquerda-esquerda")
            else:
                rastro.registrar("desbalanceado", no=rotulo(no.chave), fator=fb, caso="esquerda-direita")
                no.esq = self._rotacao_esquerda(no.esq, rastro)
            return self._rotacao_direita(no, rastro)
        if fb < -1:
            if balanceamento(no.dir) <= 0:
                rastro.registrar("desbalanceado", no=rotulo(no.chave), fator=fb, caso="direita-direita")
            else:
                rastro.registrar("desbalanceado", no=rotulo(no.chave), fator=fb, caso="direita-esquerda")
                no.dir = self._rotacao_direita(no.dir, rastro)
            return self._rotacao_esquerda(no, rastro)
        return no

    def inserir(self, chave, valor, rastro=None):
        r = rastro or RASTRO_NULO
        self._inseriu = False
        self.raiz = self._inserir(self.raiz, chave, valor, r)
        return self._inseriu

    def _inserir(self, no, chave, valor, rastro):
        if no is None:
            self._inseriu = True
            self.tamanho += 1
            rastro.registrar("insere", no=rotulo(chave))
            return self._novo_no(chave, valor)
        if chave == no.chave:
            rastro.registrar("duplicada", no=rotulo(chave))
            return no
        if chave < no.chave:
            rastro.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
            no.esq = self._inserir(no.esq, chave, valor, rastro)
        else:
            rastro.registrar("compara", no=rotulo(no.chave), decisao="direita")
            no.dir = self._inserir(no.dir, chave, valor, rastro)

        self._atualizar(no)
        return self._balancear(no, rastro)

    def remover(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        self._removeu = False
        self.raiz = self._remover(self.raiz, chave, r)
        if not self._removeu:
            r.registrar("nao_encontrado", chave=rotulo(chave))
        return self._removeu

    def _remover(self, no, chave, rastro):
        if no is None:
            return None
        if chave < no.chave:
            rastro.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
            no.esq = self._remover(no.esq, chave, rastro)
        elif chave > no.chave:
            rastro.registrar("compara", no=rotulo(no.chave), decisao="direita")
            no.dir = self._remover(no.dir, chave, rastro)
        elif no.esq is None or no.dir is None:

            self._removeu = True
            self.tamanho -= 1
            rastro.registrar("remove", no=rotulo(chave))
            return no.esq if no.esq is not None else no.dir
        else:

            suc = no.dir
            while suc.esq is not None:
                suc = suc.esq
            rastro.registrar("substitui", no=rotulo(no.chave), por=rotulo(suc.chave))
            no.chave, no.valor = suc.chave, suc.valor
            no.dir = self._remover(no.dir, suc.chave, rastro)

        self._atualizar(no)
        return self._balancear(no, rastro)
