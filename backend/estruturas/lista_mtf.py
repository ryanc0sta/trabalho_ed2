"""Lista encadeada com movimentação para o início (slides: Busca Linear, parte 2).

Após a chave ser encontrada, seu nó passa a ser o primeiro da lista. Em lista
encadeada a movimentação custa θ(1): basta religar dois ponteiros.
"""

from .lista_encadeada import ListaEncadeada
from .rastro import rotulo


class ListaMTF(ListaEncadeada):
    def _reorganizar(self, ante_anterior, anterior, atual, posicao, rastro):
        if anterior is None:  # já está no início
            return
        anterior.prox = atual.prox
        atual.prox = self.cabeca
        self.cabeca = atual
        rastro.registrar("move_inicio", no=rotulo(atual.chave), de=posicao, para=0)
