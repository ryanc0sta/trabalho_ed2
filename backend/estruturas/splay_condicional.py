"""MODIFICAÇÃO 3 — Árvore afunilada com afunilamento condicional (busca de jogadores).

Problema da versão clássica: toda busca leva o nó à raiz. Um jogador
consultado uma única vez (por curiosidade, ou por um clique errado) desaloja
da raiz e dos níveis próximos os jogadores que são realmente procurados com
frequência — e a seção "Em alta", que mostra o topo da árvore, fica instável.

Modificação: cada nó guarda um contador de acessos. A busca localiza o nó
como numa árvore binária de busca comum, sem rotações, e soma 1 ao contador.
Só quando o contador atinge `limite` (K) o nó é afunilado até a raiz — e o
contador volta a zero. Buscas malsucedidas não alteram a árvore.

Inserção e remoção continuam como na árvore afunilada clássica.
"""

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
            # As rotações movem o próprio objeto do nó, então `no` continua válido.
            self.afunilar(chave, r)
            no.contador = 0
        r.registrar("encontrado", no=rotulo(chave))
        return no.valor

    def contador(self, chave):
        """Acessos acumulados desde o último afunilamento (sem alterar a árvore)."""
        no = self._localizar(chave, RASTRO_NULO)
        return no.contador if no is not None else None
