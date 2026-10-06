"""MODIFICAÇÃO 1 — Lista com movimentação ponderada (lista das ligas).

Problema da movimentação para o início clássica: um único acesso a uma liga
pouco usada a joga para o topo, empurrando para baixo as ligas que o usuário
realmente consulta sempre.

Modificação: cada nó guarda uma pontuação de interesse. Cada acesso soma 1 à
pontuação do nó, e todas as pontuações "envelhecem" — são multiplicadas por
`fator` a cada acesso feito na lista (acessos antigos pesam menos). Depois de
encontrado, o nó avança apenas até passar os nós com pontuação menor que a
sua. Assim a lista fica sempre ordenada pela pontuação: quem é acessado com
frequência sobe e se mantém; um acesso isolado sobe pouco.

O envelhecimento é preguiçoso: o nó guarda a pontuação e o instante (relógio
da lista) em que ela foi atualizada; a pontuação atual é
pontuacao · fator^(relogio − instante). Como todos envelhecem na mesma taxa,
a ordem relativa entre nós não acessados nunca muda, e por isso não é preciso
percorrer a lista para envelhecer ninguém.
"""

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
        self.relogio = 0  # número de acessos já feitos na lista

    def _novo_no(self, chave, valor):
        no = NoPonderado(chave, valor)
        no.instante = self.relogio
        return no

    def pontuacao(self, no):
        """Pontuação atual do nó, já envelhecida até o instante presente."""
        return no.pontuacao * self.fator ** (self.relogio - no.instante)

    def _reorganizar(self, ante_anterior, anterior, atual, posicao, rastro):
        self.relogio += 1
        atual.pontuacao = self.pontuacao(atual) + 1
        atual.instante = self.relogio
        rastro.registrar("pontua", no=rotulo(atual.chave), pontuacao=round(atual.pontuacao, 3))
        if anterior is None:  # já está no início
            return

        # Procura, a partir do início, o primeiro nó com pontuação menor:
        # o nó acessado será colocado imediatamente antes dele.
        antes_destino, destino, destino_pos = None, self.cabeca, 0
        while destino is not atual and self.pontuacao(destino) >= atual.pontuacao:
            antes_destino, destino = destino, destino.prox
            destino_pos += 1
        if destino is atual:  # ninguém à frente tem pontuação menor: não se move
            rastro.registrar("permanece", no=rotulo(atual.chave), posicao=posicao)
            return

        ultrapassados = []
        no = destino
        while no is not atual:
            ultrapassados.append(rotulo(no.chave))
            no = no.prox

        anterior.prox = atual.prox  # retira o nó da posição atual
        atual.prox = destino  # e o religa antes do destino
        if antes_destino is None:
            self.cabeca = atual
        else:
            antes_destino.prox = atual
        rastro.registrar(
            "avanca", no=rotulo(atual.chave), de=posicao, para=destino_pos,
            ultrapassados=ultrapassados,
        )

    def pontuacoes(self):
        """Pares (chave, pontuação atual) na ordem da lista — usado pela interface."""
        resultado = []
        no = self.cabeca
        while no is not None:
            resultado.append((no.chave, round(self.pontuacao(no), 3)))
            no = no.prox
        return resultado
