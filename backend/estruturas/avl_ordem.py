"""MODIFICAÇÃO 5 — Árvore AVL com o tamanho da subárvore (jogadores por valor de mercado).

Perguntas da interface sobre faixas de valor:

  * "Quantos jogadores valem entre €10M e €20M?" -> na AVL clássica é preciso
    visitar todos os jogadores da faixa: θ(k).
  * "Mostre a 3ª página dessa faixa" -> seria preciso percorrer as páginas
    anteriores.

Modificação: cada nó guarda `tam`, o número de nós da sua subárvore
(atualizado no gancho `_atualizar`, portanto também em toda rotação). Com
isso a árvore responde em θ(log n):

  * `posicao(chave)`  — quantas chaves são menores que `chave`: ao descer para
    a direita, soma de uma vez o nó e toda a sua subárvore esquerda;
  * `contar(de, ate)` — diferença entre duas posições, sem visitar a faixa;
  * `selecionar(k)`   — a k-ésima menor chave, descendo pelo tamanho.
"""

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
        super()._atualizar(no)  # altura
        no.tam = 1 + _tam(no.esq) + _tam(no.dir)

    def _menores(self, chave, inclusive, rastro):
        """Número de chaves < chave (ou <= chave, se inclusive)."""
        no, total = self.raiz, 0
        while no is not None:
            if no.chave < chave or (inclusive and no.chave == chave):
                salto = 1 + _tam(no.esq)
                total += salto
                # O nó e toda a subárvore esquerda são menores: conta sem visitá-la.
                rastro.registrar("compara", no=rotulo(no.chave), decisao="direita")
                rastro.registrar("conta_subarvore", no=rotulo(no.chave), quantidade=salto, total=total)
                no = no.dir
            else:
                rastro.registrar("compara", no=rotulo(no.chave), decisao="esquerda")
                no = no.esq
        return total

    def posicao(self, chave, rastro=None):
        """Quantas chaves são menores que `chave` (posição 0..n em ordem crescente)."""
        return self._menores(chave, False, rastro or RASTRO_NULO)

    def contar(self, de, ate, rastro=None):
        """Quantas chaves existem com de <= chave <= ate, em θ(log n)."""
        r = rastro or RASTRO_NULO
        if de > ate:
            return 0
        total = self._menores(ate, True, r) - self._menores(de, False, r)
        r.registrar("contagem", quantidade=total)
        return total

    def selecionar(self, k, rastro=None):
        """Par (chave, valor) da k-ésima menor chave (k = 0..n-1), ou None."""
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
        """Até `quantidade` pares em ordem crescente a partir da posição
        `inicio` (0..n-1): seleciona o primeiro e segue pelos sucessores."""
        primeiro = self.selecionar(inicio, rastro)
        if primeiro is None or quantidade <= 0:
            return []
        resultado = []
        for par in self.iterar_a_partir_de(primeiro[0]):
            resultado.append(par)
            if len(resultado) >= quantidade:
                break
        return resultado
