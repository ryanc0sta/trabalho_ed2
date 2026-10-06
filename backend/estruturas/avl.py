"""Árvore AVL (slides: Busca Hierárquica, parte 2).

Árvore binária de busca na qual as alturas das duas subárvores de qualquer nó
nunca diferem em mais de 1. O balanceamento de um nó é a altura da subárvore
esquerda menos a da direita; após inserções e remoções, os nós no caminho
inverso são rebalanceados pelos 4 casos (EE, ED, DD, DE).
"""

from .arvore_binaria import ArvoreBinariaBusca, NoArvore
from .rastro import RASTRO_NULO, rotulo


class NoAVL(NoArvore):
    __slots__ = ("altura",)

    def __init__(self, chave, valor):
        super().__init__(chave, valor)
        self.altura = 1  # folha tem altura 1; subárvore vazia, 0


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
        """Corrige o nó se ele estiver desbalanceado (|balanceamento| = 2)."""
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

    # --------------------------------------------------------------- inserção
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
        # Caminho inverso de inserção: atualiza a altura e rebalanceia.
        self._atualizar(no)
        return self._balancear(no, rastro)

    # ---------------------------------------------------------------- remoção
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
            # Nenhum ou um filho: o filho ocupa o lugar do nó.
            self._removeu = True
            self.tamanho -= 1
            rastro.registrar("remove", no=rotulo(chave))
            return no.esq if no.esq is not None else no.dir
        else:
            # Dois filhos: copia o sucessor e remove-o da subárvore direita.
            suc = no.dir
            while suc.esq is not None:
                suc = suc.esq
            rastro.registrar("substitui", no=rotulo(no.chave), por=rotulo(suc.chave))
            no.chave, no.valor = suc.chave, suc.valor
            no.dir = self._remover(no.dir, suc.chave, rastro)
        # O desbalanceamento pode se propagar até a raiz: verifica todos os ancestrais.
        self._atualizar(no)
        return self._balancear(no, rastro)
