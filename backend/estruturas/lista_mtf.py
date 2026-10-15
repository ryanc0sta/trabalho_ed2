from .lista_encadeada import ListaEncadeada
from .rastro import rotulo

class ListaMTF(ListaEncadeada):
    def _reorganizar(self, ante_anterior, anterior, atual, posicao, rastro):
        if anterior is None:
            return
        anterior.prox = atual.prox
        atual.prox = self.cabeca
        self.cabeca = atual
        rastro.registrar("move_inicio", no=rotulo(atual.chave), de=posicao, para=0)
