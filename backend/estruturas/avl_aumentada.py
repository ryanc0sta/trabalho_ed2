from .avl import ArvoreAVL, NoAVL
from .rastro import RASTRO_NULO, rotulo

class NoMax(NoAVL):
    __slots__ = ("max_sub",)

    def __init__(self, chave, valor, medida):
        super().__init__(chave, valor)
        self.max_sub = medida(valor)

class ArvoreAVLAumentada(ArvoreAVL):
    def __init__(self, medida=lambda valor: valor):
        super().__init__()
        self.medida = medida

    def _novo_no(self, chave, valor):
        return NoMax(chave, valor, self.medida)

    def _atualizar(self, no):
        super()._atualizar(no)
        maior = self.medida(no.valor)
        if no.esq is not None and no.esq.max_sub > maior:
            maior = no.esq.max_sub
        if no.dir is not None and no.dir.max_sub > maior:
            maior = no.dir.max_sub
        no.max_sub = maior

    def valor_em(self, chave, rastro=None):
        return self.piso(chave, rastro)

    def pico(self, de, ate, rastro=None):
        r = rastro or RASTRO_NULO

        no = self.raiz
        while no is not None and not (de <= no.chave <= ate):
            decisao = "direita" if no.chave < de else "esquerda"
            r.registrar("compara", no=rotulo(no.chave), decisao=decisao)
            no = no.dir if no.chave < de else no.esq
        if no is None:
            r.registrar("nao_encontrado", de=rotulo(de), ate=rotulo(ate))
            return None
        r.registrar("divide", no=rotulo(no.chave))

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

        x = no.esq
        while x is not None:
            if x.chave >= de:
                r.registrar("compara", no=rotulo(x.chave), decisao="esquerda")
                considerar_no(x)
                considerar_sub(x.dir)
                x = x.esq
            else:
                r.registrar("compara", no=rotulo(x.chave), decisao="direita")
                if x.esq is not None:
                    r.registrar("descarta", no=rotulo(x.esq.chave))
                x = x.dir

        x = no.dir
        while x is not None:
            if x.chave <= ate:
                r.registrar("compara", no=rotulo(x.chave), decisao="direita")
                considerar_no(x)
                considerar_sub(x.esq)
                x = x.dir
            else:
                r.registrar("compara", no=rotulo(x.chave), decisao="esquerda")
                if x.dir is not None:
                    r.registrar("descarta", no=rotulo(x.dir.chave))
                x = x.esq

        if melhor_sub is not None:
            x = melhor_sub
            while self.medida(x.valor) != melhor_valor:
                x = x.esq if x.esq is not None and x.esq.max_sub == melhor_valor else x.dir
                r.registrar("segue_maximo", no=rotulo(x.chave))
            melhor_no = x
        r.registrar("pico", no=rotulo(melhor_no.chave), valor=melhor_valor)
        return melhor_no.chave, melhor_no.valor
