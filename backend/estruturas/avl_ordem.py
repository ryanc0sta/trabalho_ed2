from .avl import ArvoreAVL, NoAVL
from .rastro import RASTRO_NULO, rotulo

class NoOrdem(NoAVL):
    __slots__ = ("tam",)

    def __init__(self, chave, valor):
        super().__init__(chave, valor)
        self.tam = 1

def _tam(no):
    return no.tam if no is not None else 0

class ArvoreAVLOrdem(ArvoreAVL):
    def _novo_no(self, chave, valor):
        return NoOrdem(chave, valor)

    def _atualizar(self, no):
        super()._atualizar(no)
        no.tam = 1 + _tam(no.esq) + _tam(no.dir)

    def _menores(self, chave, inclusive, rastro):
        no, total = self.raiz, 0
        while no is not None:
            if no.chave < chave or (inclusive and no.chave == chave):
                salto = 1 + _tam(no.esq)
                total += salto

                rastro.registrar("compara", no=rotulo(no.chave), decisao="direita")
                rastro.registrar("conta_subarvore", no=rotulo(no.chave), quantidade=salto, total=total)
                no = no.dir
            else:
                rastro.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
                no = no.esq
        return total

    def posicao(self, chave, rastro=None):
        return self._menores(chave, False, rastro or RASTRO_NULO)

    def posicoes(self, de, ate, rastro=None):
        r = rastro or RASTRO_NULO
        if de > ate:
            return 0, 0
        r.registrar("etapa", nome="ate")
        fim = self._menores(ate, True, r)
        r.registrar("etapa", nome="de")
        inicio = self._menores(de, False, r)
        r.registrar("contagem", quantidade=fim - inicio)
        return inicio, fim

    def contar(self, de, ate, rastro=None):
        inicio, fim = self.posicoes(de, ate, rastro)
        return fim - inicio

    def selecionar(self, k, rastro=None):
        r = rastro or RASTRO_NULO
        no = self.raiz
        while no is not None:
            a_esquerda = _tam(no.esq)
            if k < a_esquerda:
                r.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
                no = no.esq
            elif k == a_esquerda:
                r.registrar("encontrado", no=rotulo(no.chave))
                return no.chave, no.valor
            else:
                r.registrar("compara", no=rotulo(no.chave), decisao="direita")
                k -= a_esquerda + 1
                no = no.dir
        return None

    def fatia(self, inicio, quantidade, rastro=None):
        primeiro = self.selecionar(inicio, rastro)
        if primeiro is None or quantidade <= 0:
            return []
        resultado = []
        for par in self.iterar_a_partir_de(primeiro[0]):
            resultado.append(par)
            if len(resultado) >= quantidade:
                break
        return resultado
