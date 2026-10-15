import sys

from .arvore_binaria import ArvoreBinariaBusca
from .rastro import RASTRO_NULO, rotulo

sys.setrecursionlimit(max(sys.getrecursionlimit(), 100_000))

class ArvoreAfunilada(ArvoreBinariaBusca):

    def _afunilar(self, no, chave, rastro):
        if no is None:
            return None
        if chave == no.chave:
            rastro.registrar("compara", no=rotulo(no.chave), decisao="igual")
            return no

        if chave < no.chave:
            rastro.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
            if no.esq is None:
                return no
            filho = no.esq
            if chave < filho.chave:
                rastro.registrar("compara", no=rotulo(filho.chave), decisao="esquerda")
                filho.esq = self._afunilar(filho.esq, chave, rastro)
                self._registrar_caso(rastro, "zig-zig" if filho.esq else "zig", filho.esq or filho)
                no = self._rotacao_direita(no, rastro)
            elif chave > filho.chave:
                rastro.registrar("compara", no=rotulo(filho.chave), decisao="direita")
                filho.dir = self._afunilar(filho.dir, chave, rastro)
                if filho.dir is not None:
                    self._registrar_caso(rastro, "zag-zig", filho.dir)
                    no.esq = self._rotacao_esquerda(filho, rastro)
                else:
                    self._registrar_caso(rastro, "zig", filho)
            else:
                rastro.registrar("compara", no=rotulo(filho.chave), decisao="igual")
                self._registrar_caso(rastro, "zig", filho)
            return self._rotacao_direita(no, rastro) if no.esq is not None else no

        rastro.registrar("compara", no=rotulo(no.chave), decisao="direita")
        if no.dir is None:
            return no
        filho = no.dir
        if chave < filho.chave:
            rastro.registrar("compara", no=rotulo(filho.chave), decisao="esquerda")
            filho.esq = self._afunilar(filho.esq, chave, rastro)
            if filho.esq is not None:
                self._registrar_caso(rastro, "zig-zag", filho.esq)
                no.dir = self._rotacao_direita(filho, rastro)
            else:
                self._registrar_caso(rastro, "zag", filho)
        elif chave > filho.chave:
            rastro.registrar("compara", no=rotulo(filho.chave), decisao="direita")
            filho.dir = self._afunilar(filho.dir, chave, rastro)
            self._registrar_caso(rastro, "zag-zag" if filho.dir else "zag", filho.dir or filho)
            no = self._rotacao_esquerda(no, rastro)
        else:
            rastro.registrar("compara", no=rotulo(filho.chave), decisao="igual")
            self._registrar_caso(rastro, "zag", filho)
        return self._rotacao_esquerda(no, rastro) if no.dir is not None else no

    @staticmethod
    def _registrar_caso(rastro, caso, alvo):
        rastro.registrar("caso", caso=caso, alvo=rotulo(alvo.chave))

    def afunilar(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        self.raiz = self._afunilar(self.raiz, chave, r)
        if self.raiz is not None:
            r.registrar("raiz", no=rotulo(self.raiz.chave))

    def buscar(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        self.afunilar(chave, r)
        if self.raiz is not None and self.raiz.chave == chave:
            r.registrar("encontrado", no=rotulo(chave))
            return self.raiz.valor
        r.registrar("nao_encontrado", chave=rotulo(chave))
        return None

    def inserir(self, chave, valor, rastro=None):
        r = rastro or RASTRO_NULO
        novo = self._novo_no(chave, valor)
        if self.raiz is None:
            self.raiz = novo
        else:
            self.afunilar(chave, r)
            raiz = self.raiz
            if raiz.chave == chave:
                r.registrar("duplicada", no=rotulo(chave))
                return False
            if chave < raiz.chave:
                novo.esq, novo.dir = raiz.esq, raiz
                raiz.esq = None
            else:
                novo.dir, novo.esq = raiz.dir, raiz
                raiz.dir = None
            self._atualizar(raiz)
            self._atualizar(novo)
            self.raiz = novo
        self.tamanho += 1
        r.registrar("insere", no=rotulo(chave))
        return True

    def remover(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        self.afunilar(chave, r)
        if self.raiz is None or self.raiz.chave != chave:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return False
        esquerda, direita = self.raiz.esq, self.raiz.dir
        if esquerda is None:
            self.raiz = direita
        else:

            nova_raiz = self._afunilar(esquerda, chave, r)
            nova_raiz.dir = direita
            self._atualizar(nova_raiz)
            self.raiz = nova_raiz
        self.tamanho -= 1
        r.registrar("remove", no=rotulo(chave))
        return True
