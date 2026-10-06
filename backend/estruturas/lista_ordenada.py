"""Lista indexada ordenada com busca binária (slides: Busca Linear, parte 2).

Usada como índice de tabelas grandes que quase não mudam (histórico de
valores, transferências, jogadores por id): constrói-se de uma vez com
merge sort e depois só se fazem buscas θ(log n), inclusive de piso, teto e
intervalo.
"""

from .ordenacao import merge_sort
from .rastro import RASTRO_NULO, rotulo


class ListaOrdenada:
    def __init__(self):
        self.chaves = []
        self.valores = []

    @classmethod
    def construir(cls, pares):
        """Constrói a partir de pares (chave, valor) em qualquer ordem.
        Chaves repetidas: fica apenas a primeira ocorrência (chave primária)."""
        lista = cls()
        anterior = object()
        for chave, valor in merge_sort(pares, chave=lambda par: par[0]):
            if chave == anterior:
                continue
            lista.chaves.append(chave)
            lista.valores.append(valor)
            anterior = chave
        return lista

    # ------------------------------------------------------------------ busca
    def _indice_teto(self, chave, rastro):
        """Menor índice cuja chave é >= chave (len se não houver)."""
        inf, sup = 0, len(self.chaves) - 1
        resposta = len(self.chaves)
        while inf <= sup:
            meio = inf + (sup - inf) // 2
            chave_meio = self.chaves[meio]
            if chave_meio >= chave:
                resposta = meio
                sup = meio - 1
                decisao = "esquerda"
            else:
                inf = meio + 1
                decisao = "direita"
            rastro.registrar("compara", meio=meio, no=rotulo(chave_meio), decisao=decisao)
        return resposta

    def buscar(self, chave, rastro=None):
        """Busca binária. Retorna o valor associado à chave ou None."""
        r = rastro or RASTRO_NULO
        i = self._indice_teto(chave, r)
        if i < len(self.chaves) and self.chaves[i] == chave:
            r.registrar("encontrado", indice=i, no=rotulo(chave))
            return self.valores[i]
        r.registrar("nao_encontrado", chave=rotulo(chave))
        return None

    def teto(self, chave, rastro=None):
        """Menor par (chave, valor) com chave >= chave, ou None."""
        i = self._indice_teto(chave, rastro or RASTRO_NULO)
        if i == len(self.chaves):
            return None
        return self.chaves[i], self.valores[i]

    def piso(self, chave, rastro=None):
        """Maior par (chave, valor) com chave <= chave, ou None."""
        i = self._indice_teto(chave, rastro or RASTRO_NULO)
        if i < len(self.chaves) and self.chaves[i] == chave:
            return self.chaves[i], self.valores[i]
        if i == 0:
            return None
        return self.chaves[i - 1], self.valores[i - 1]

    def intervalo(self, de, ate, rastro=None, limite=None):
        """Busca de intervalo: os pares com de <= chave <= ate (no máximo
        `limite`, se informado)."""
        i = self._indice_teto(de, rastro or RASTRO_NULO)
        resultado = []
        while (i < len(self.chaves) and self.chaves[i] <= ate
               and (limite is None or len(resultado) < limite)):
            resultado.append((self.chaves[i], self.valores[i]))
            i += 1
        return resultado

    # ------------------------------------------------------ inserção/remoção
    def inserir(self, chave, valor, rastro=None):
        """θ(n): acha a posição em θ(log n), mas deslocar os elementos é θ(n)."""
        r = rastro or RASTRO_NULO
        i = self._indice_teto(chave, r)
        if i < len(self.chaves) and self.chaves[i] == chave:
            r.registrar("duplicada", no=rotulo(chave))
            return False
        self.chaves.insert(i, chave)
        self.valores.insert(i, valor)
        r.registrar("insere", indice=i, no=rotulo(chave))
        return True

    def remover(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        i = self._indice_teto(chave, r)
        if i == len(self.chaves) or self.chaves[i] != chave:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return False
        del self.chaves[i]
        del self.valores[i]
        r.registrar("remove", indice=i, no=rotulo(chave))
        return True

    # --------------------------------------------------------------- consulta
    def __len__(self):
        return len(self.chaves)

    def __iter__(self):
        for i in range(len(self.chaves)):
            yield self.chaves[i], self.valores[i]
