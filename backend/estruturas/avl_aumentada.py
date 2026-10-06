"""MODIFICAÇÃO 4 — Árvore AVL aumentada com o máximo da subárvore (histórico de um jogador).

Cada jogador tem uma AVL cujas chaves são as datas de avaliação e cujos
valores são os valores de mercado. Duas perguntas da interface:

  * "Quanto ele valia em 01/2020?" -> busca de piso pela data (já existente).
  * "Qual foi o maior valor entre 2018 e 2022?" -> na AVL clássica, exige
    visitar todas as datas do período: θ(k).

Modificação: cada nó guarda também `max_sub`, o maior valor de mercado da
sua subárvore. Ele é recalculado sempre que os filhos de um nó mudam — na
inserção, na remoção e em cada rotação (gancho `_atualizar`). Com isso, a
consulta do pico usa subárvores inteiras sem entrar nelas e responde em
θ(log n): só desce nos dois caminhos que delimitam o período.
"""

from .avl import ArvoreAVL, NoAVL
from .rastro import RASTRO_NULO, rotulo


class NoMax(NoAVL):
    __slots__ = ("max_sub",)

    def __init__(self, chave, valor, medida):
        super().__init__(chave, valor)
        self.max_sub = medida(valor)


class ArvoreAVLAumentada(ArvoreAVL):
    def __init__(self, medida=lambda valor: valor):
        """medida(valor) -> número comparado no pico (valor de mercado)."""
        super().__init__()
        self.medida = medida

    def _novo_no(self, chave, valor):
        return NoMax(chave, valor, self.medida)

    def _atualizar(self, no):
        super()._atualizar(no)  # altura
        maior = self.medida(no.valor)
        if no.esq is not None and no.esq.max_sub > maior:
            maior = no.esq.max_sub
        if no.dir is not None and no.dir.max_sub > maior:
            maior = no.dir.max_sub
        no.max_sub = maior

    def valor_em(self, chave, rastro=None):
        """Busca de piso: o par da maior data <= `chave` (o valor vigente)."""
        return self.piso(chave, rastro)

    def pico(self, de, ate, rastro=None):
        """Par (chave, valor) de maior medida com de <= chave <= ate, ou None."""
        r = rastro or RASTRO_NULO

        # 1. Desce até o primeiro nó dentro do intervalo (onde os caminhos se separam).
        no = self.raiz
        while no is not None and not (de <= no.chave <= ate):
            decisao = "direita" if no.chave < de else "esquerda"
            r.registrar("compara", no=rotulo(no.chave), decisao=decisao)
            no = no.dir if no.chave < de else no.esq
        if no is None:
            r.registrar("nao_encontrado", de=rotulo(de), ate=rotulo(ate))
            return None
        r.registrar("divide", no=rotulo(no.chave))

        # Candidatos: nós isolados (só o próprio nó) ou subárvores inteiras.
        melhor_valor, melhor_no, melhor_sub = self.medida(no.valor), no, None

        def considerar_sub(sub):
            nonlocal melhor_valor, melhor_no, melhor_sub
            if sub is None:
                return
            r.registrar("subarvore_inteira", no=rotulo(sub.chave), max_sub=sub.max_sub)
            if sub.max_sub > melhor_valor:
                melhor_valor, melhor_no, melhor_sub = sub.max_sub, None, sub

        def considerar_no(x):
            nonlocal melhor_valor, melhor_no, melhor_sub
            if self.medida(x.valor) > melhor_valor:
                melhor_valor, melhor_no, melhor_sub = self.medida(x.valor), x, None

        # 2. Caminho esquerdo: limite inferior `de`.
        x = no.esq
        while x is not None:
            if x.chave >= de:
                r.registrar("compara", no=rotulo(x.chave), decisao="esquerda")
                considerar_no(x)
                considerar_sub(x.dir)  # toda a direita de x está no intervalo
                x = x.esq
            else:
                r.registrar("compara", no=rotulo(x.chave), decisao="direita")
                if x.esq is not None:
                    r.registrar("descarta", no=rotulo(x.esq.chave))
                x = x.dir

        # 3. Caminho direito: limite superior `ate`.
        x = no.dir
        while x is not None:
            if x.chave <= ate:
                r.registrar("compara", no=rotulo(x.chave), decisao="direita")
                considerar_no(x)
                considerar_sub(x.esq)  # toda a esquerda de x está no intervalo
                x = x.dir
            else:
                r.registrar("compara", no=rotulo(x.chave), decisao="esquerda")
                if x.dir is not None:
                    r.registrar("descarta", no=rotulo(x.dir.chave))
                x = x.esq

        # 4. Se o máximo está numa subárvore inteira, segue o max_sub até o nó.
        if melhor_sub is not None:
            x = melhor_sub
            while self.medida(x.valor) != melhor_valor:
                x = x.esq if x.esq is not None and x.esq.max_sub == melhor_valor else x.dir
                r.registrar("segue_maximo", no=rotulo(x.chave))
            melhor_no = x
        r.registrar("pico", no=rotulo(melhor_no.chave), valor=melhor_valor)
        return melhor_no.chave, melhor_no.valor
