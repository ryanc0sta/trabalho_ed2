"""Ordenação por intercalação (merge sort), θ(n log n).

Usada para construir listas indexadas ordenadas de uma vez (slides: "é melhor
criar a tabela desordenada e, então, ordená-la usando um método eficiente"),
em vez de θ(n²) com inserções sucessivas.
"""


def merge_sort(elementos, chave=lambda x: x):
    """Retorna uma nova lista ordenada (estável) segundo `chave(elemento)`."""
    n = len(elementos)
    if n <= 1:
        return list(elementos)
    # Versão ascendente (iterativa): intercala blocos de tamanho 1, 2, 4, ...
    origem = list(elementos)
    destino = [None] * n
    largura = 1
    while largura < n:
        for inicio in range(0, n, 2 * largura):
            meio = min(inicio + largura, n)
            fim = min(inicio + 2 * largura, n)
            _intercalar(origem, destino, inicio, meio, fim, chave)
        origem, destino = destino, origem
        largura *= 2
    return origem


def _intercalar(origem, destino, inicio, meio, fim, chave):
    i, j, k = inicio, meio, inicio
    while i < meio and j < fim:
        # <= mantém a ordem relativa de chaves iguais (estabilidade)
        if chave(origem[i]) <= chave(origem[j]):
            destino[k] = origem[i]
            i += 1
        else:
            destino[k] = origem[j]
            j += 1
        k += 1
    while i < meio:
        destino[k] = origem[i]
        i += 1
        k += 1
    while j < fim:
        destino[k] = origem[j]
        j += 1
        k += 1
