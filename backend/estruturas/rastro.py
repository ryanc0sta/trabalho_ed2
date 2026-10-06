"""Registro dos passos executados pelas estruturas de dados.

Cada operação (busca, inserção, rotação, movimentação...) pode receber um
Rastro e anotar nele o que fez. A API devolve esses passos ao frontend, que
os reproduz como animação — a animação mostra exatamente o que o algoritmo
executou, e não uma simulação.

Os passos são dicionários apenas por serem o formato de saída em JSON; nenhum
dado da aplicação é guardado ou buscado através deles.
"""


def rotulo(chave):
    """Converte uma chave (inclusive tupla) num identificador de texto estável,
    usado pelo frontend para reconhecer o mesmo nó entre um passo e outro."""
    if isinstance(chave, tuple):
        return "|".join(str(parte) for parte in chave)
    return str(chave)


class Rastro:
    """Lista ordenada de passos de uma operação.

    ativo=False   -> não registra nada (usado na carga em massa dos dados).
    guardar=False -> só conta comparações, sem guardar os passos (métricas).
    """

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

    # Sem __len__ de propósito: um Rastro vazio precisa continuar "verdadeiro"
    # para que `rastro or RASTRO_NULO` não o descarte.


# Rastro compartilhado que descarta tudo; usado quando nenhum é informado.
RASTRO_NULO = Rastro(ativo=False)
