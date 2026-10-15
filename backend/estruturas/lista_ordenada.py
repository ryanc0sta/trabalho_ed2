from .ordenacao import merge_sort
from .rastro import RASTRO_NULO, rotulo

class ListaOrdenada:
    def __init__(self):
        self.chaves = []
        self.valores = []

    @classmethod
    def construir(cls, pares):
        lista = cls()
        anterior = object()
        for chave, valor in merge_sort(pares, chave=lambda par: par[0]):
            if chave == anterior:
                continue
            lista.chaves.append(chave)
            lista.valores.append(valor)
            anterior = chave
        return lista

    def _indice_teto(self, chave, rastro):
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
            rastro.registrar("compara", meio=meio, no=rotulo(chave_meio), decisao=decisao,
                             restam=sup - inf + 1)
        return resposta

    def indice_teto(self, chave, rastro=None):
        return self._indice_teto(chave, rastro or RASTRO_NULO)

    def indice_teto_interpolacao(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        chaves = self.chaves
        inf, sup = 0, len(chaves) - 1
        resposta = len(chaves)
        while inf <= sup:
            r.registrar("compara", meio=inf, no=rotulo(chaves[inf]), decisao="limite", restam=sup - inf + 1)
            if chaves[inf] >= chave:
                resposta = inf
                break
            r.registrar("compara", meio=sup, no=rotulo(chaves[sup]), decisao="limite", restam=sup - inf + 1)
            if chaves[sup] < chave:
                break

            pos = inf + (chave - chaves[inf]) * (sup - inf) // (chaves[sup] - chaves[inf])
            if chaves[pos] >= chave:
                resposta = pos
                sup = pos - 1
                decisao = "esquerda"
            else:
                inf = pos + 1
                decisao = "direita"
            r.registrar("compara", meio=pos, no=rotulo(chaves[pos]), decisao=decisao, restam=max(0, sup - inf + 1))
        return resposta

    def fatia(self, inicio, fim):
        return [(self.chaves[i], self.valores[i]) for i in range(max(0, inicio), min(fim, len(self.chaves)))]

    def buscar(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        i = self._indice_teto(chave, r)
        if i < len(self.chaves) and self.chaves[i] == chave:
            r.registrar("encontrado", indice=i, no=rotulo(chave))
            return self.valores[i]
        r.registrar("nao_encontrado", chave=rotulo(chave))
        return None

    def teto(self, chave, rastro=None):
        i = self._indice_teto(chave, rastro or RASTRO_NULO)
        if i == len(self.chaves):
            return None
        return self.chaves[i], self.valores[i]

    def piso(self, chave, rastro=None):
        i = self._indice_teto(chave, rastro or RASTRO_NULO)
        if i < len(self.chaves) and self.chaves[i] == chave:
            return self.chaves[i], self.valores[i]
        if i == 0:
            return None
        return self.chaves[i - 1], self.valores[i - 1]

    def intervalo(self, de, ate, rastro=None, limite=None):
        i = self._indice_teto(de, rastro or RASTRO_NULO)
        resultado = []
        while (i < len(self.chaves) and self.chaves[i] <= ate
               and (limite is None or len(resultado) < limite)):
            resultado.append((self.chaves[i], self.valores[i]))
            i += 1
        return resultado

    def inserir(self, chave, valor, rastro=None):
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

    def __len__(self):
        return len(self.chaves)

    def __iter__(self):
        for i in range(len(self.chaves)):
            yield self.chaves[i], self.valores[i]
