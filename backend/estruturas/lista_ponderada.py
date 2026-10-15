from .lista_encadeada import NoLista
from .lista_mtf import ListaMTF
from .rastro import rotulo

class NoPonderado(NoLista):
    __slots__ = ("pontuacao", "instante")

    def __init__(self, chave, valor, prox=None):
        super().__init__(chave, valor, prox)
        self.pontuacao = 0.0
        self.instante = 0

class ListaPonderada(ListaMTF):
    def __init__(self, fator=0.9):
        super().__init__()
        self.fator = fator
        self.relogio = 0

    def _novo_no(self, chave, valor):
        no = NoPonderado(chave, valor)
        no.instante = self.relogio
        return no

    def pontuacao(self, no):
        return no.pontuacao * self.fator ** (self.relogio - no.instante)

    def _reorganizar(self, ante_anterior, anterior, atual, posicao, rastro):
        self.relogio += 1
        atual.pontuacao = self.pontuacao(atual) + 1
        atual.instante = self.relogio
        rastro.registrar("pontua", no=rotulo(atual.chave), pontuacao=round(atual.pontuacao, 3))
        if anterior is None:
            return

        antes_destino, destino, destino_pos = None, self.cabeca, 0
        while destino is not atual and self.pontuacao(destino) >= atual.pontuacao:
            antes_destino, destino = destino, destino.prox
            destino_pos += 1
        if destino is atual:
            rastro.registrar("permanece", no=rotulo(atual.chave), posicao=posicao)
            return

        ultrapassados = []
        no = destino
        while no is not atual:
            ultrapassados.append(rotulo(no.chave))
            no = no.prox

        anterior.prox = atual.prox
        atual.prox = destino
        if antes_destino is None:
            self.cabeca = atual
        else:
            antes_destino.prox = atual
        rastro.registrar(
            "avanca", no=rotulo(atual.chave), de=posicao, para=destino_pos,
            ultrapassados=ultrapassados,
        )

    def pontuacoes(self):
        resultado = []
        no = self.cabeca
        while no is not None:
            resultado.append((no.chave, round(self.pontuacao(no), 3)))
            no = no.prox
        return resultado
