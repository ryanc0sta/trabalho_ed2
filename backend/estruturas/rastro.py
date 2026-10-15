def rotulo(chave):
    if isinstance(chave, tuple):
        return "|".join(str(parte) for parte in chave)
    return str(chave)

class Rastro:

    def __init__(self, ativo=True, guardar=True):
        self.ativo = ativo
        self.guardar = guardar
        self.passos = []
        self.comparacoes = 0

    def registrar(self, passo, **dados):
        if not self.ativo:
            return
        if passo == "compara":
            self.comparacoes += 1
        if self.guardar:
            dados["passo"] = passo
            self.passos.append(dados)

    def limpar(self):
        self.passos = []
        self.comparacoes = 0

    def para_json(self):
        return {"passos": self.passos, "comparacoes": self.comparacoes}

RASTRO_NULO = Rastro(ativo=False)
