from .arvore_binaria import NoArvore
from .rastro import RASTRO_NULO, rotulo
from .splay import ArvoreAfunilada

class NoContador(NoArvore):
    __slots__ = ("contador",)

    def __init__(self, chave, valor):
        super().__init__(chave, valor)
        self.contador = 0

class ArvoreAfuniladaCondicional(ArvoreAfunilada):
    def __init__(self, limite=3):
        super().__init__()
        self.limite = limite

    def _novo_no(self, chave, valor):
        return NoContador(chave, valor)

    def buscar(self, chave, rastro=None):
        r = rastro or RASTRO_NULO
        no = self._localizar(chave, r)
        if no is None:
            r.registrar("nao_encontrado", chave=rotulo(chave))
            return None
        no.contador += 1
        r.registrar("acesso", no=rotulo(chave), contador=no.contador, limite=self.limite)
        if no.contador >= self.limite:

            self.afunilar(chave, r)
            no.contador = 0
        r.registrar("encontrado", no=rotulo(chave))
        return no.valor

    def contador(self, chave):
        no = self._localizar(chave, RASTRO_NULO)
        return no.contador if no is not None else None
