"""Lista encadeada com transposição (slides: Busca Linear, parte 2).

Após a chave ser encontrada, seu nó troca de lugar com o predecessor
(avança uma posição), a não ser que já esteja no início da lista.
"""

from .lista_encadeada import ListaEncadeada
from .rastro import rotulo


class ListaTransposicao(ListaEncadeada):
    def _reorganizar(self, ante_anterior, anterior, atual, posicao, rastro):
        if anterior is None:  # já está no início
            return
        # ante_anterior -> anterior -> atual -> X  vira  ante_anterior -> atual -> anterior -> X
        anterior.prox = atual.prox
        atual.prox = anterior
        if ante_anterior is None:
            self.cabeca = atual
        else:
            ante_anterior.prox = atual
        rastro.registrar(
            "transpoe", no=rotulo(atual.chave), com=rotulo(anterior.chave),
            de=posicao, para=posicao - 1,
        )
