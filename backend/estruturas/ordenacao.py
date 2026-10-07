"""Ordenação por intercalação (merge sort), θ(n log n).

Usada para construir listas indexadas ordenadas de uma vez (slides: "é melhor
criar a tabela desordenada e, então, ordená-la usando um método eficiente"),
em vez de θ(n²) com inserções sucessivas.
"""


def merge_sort(elementos, chave=lambda x: x):
    """Retorna uma nova lista ordenada (estável) segundo `chave(elemento)`.

    Versão ascendente (iterativa): intercala blocos de tamanho 1, 2, 4, ...
    As chaves são calculadas uma única vez e ordenadas junto com os elementos
    (dois arrays paralelos), em vez de recalculadas a cada comparação.
    """
    n = len(elementos)
    if n <= 1:
        return list(elementos)
    chaves, itens = [chave(e) for e in elementos], list(elementos)
    chaves_dest, itens_dest = [None] * n, [None] * n
    largura = 1
    while largura < n:
        for inicio in range(0, n, 2 * largura):
            meio = min(inicio + largura, n)
            fim = min(inicio + 2 * largura, n)
            _intercalar(chaves, itens, chaves_dest, itens_dest, inicio, meio, fim)
        chaves, chaves_dest = chaves_dest, chaves
        itens, itens_dest = itens_dest, itens
        largura *= 2
    return itens


def intercalar(sequencias, rastro=None):
    """Intercala k sequências já ordenadas de pares (chave, valor) numa só,
    em ordem: a cada passo sai o menor entre os primeiros de cada sequência.
    Devolve triplas (chave, índice da sequência, valor).

    É o passo de intercalação do merge sort, aplicado aos percursos em ordem
    de várias árvores de busca: como cada árvore já entrega suas chaves em
    ordem, não é preciso ordenar nada."""
    iteradores = [iter(s) for s in sequencias]
    frentes = [next(it, None) for it in iteradores]
    resultado = []
    while True:
        menor = None
        for i, par in enumerate(frentes):
            if par is not None and (menor is None or par[0] < frentes[menor][0]):
                menor = i
        if menor is None:
            return resultado
        chave, valor = frentes[menor]
        if rastro is not None:
            rastro.registrar("intercala", fonte=menor, no=str(chave))
        resultado.append((chave, menor, valor))
        frentes[menor] = next(iteradores[menor], None)


def _intercalar(chaves, itens, chaves_dest, itens_dest, inicio, meio, fim):
    if meio >= fim or chaves[meio - 1] <= chaves[meio]:
        # Os dois blocos já estão em ordem entre si: basta copiar.
        chaves_dest[inicio:fim] = chaves[inicio:fim]
        itens_dest[inicio:fim] = itens[inicio:fim]
        return
    i, j, k = inicio, meio, inicio
    while i < meio and j < fim:
        # <= mantém a ordem relativa de chaves iguais (estabilidade)
        if chaves[i] <= chaves[j]:
            chaves_dest[k], itens_dest[k] = chaves[i], itens[i]
            i += 1
        else:
            chaves_dest[k], itens_dest[k] = chaves[j], itens[j]
            j += 1
        k += 1
    if i < meio:
        chaves_dest[k:fim] = chaves[i:meio]
        itens_dest[k:fim] = itens[i:meio]
    else:
        chaves_dest[k:fim] = chaves[j:fim]
        itens_dest[k:fim] = itens[j:fim]
