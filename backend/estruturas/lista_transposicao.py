from .lista_encadeada import ListaEncadeada
from .rastro import rotulo

class ListaTransposicao(ListaEncadeada):
    def _reorganizar(self, ante_anterior, anterior, atual, posicao, rastro):
        if anterior is None:
            return

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
