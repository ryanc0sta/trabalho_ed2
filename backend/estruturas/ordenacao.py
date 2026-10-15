def merge_sort(elementos, chave=lambda x: x):
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

        chaves_dest[inicio:fim] = chaves[inicio:fim]
        itens_dest[inicio:fim] = itens[inicio:fim]
        return
    i, j, k = inicio, meio, inicio
    while i < meio and j < fim:

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
