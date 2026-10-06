# Scout Explorer

Visualizador da base Transfermarkt para o trabalho de Estrutura de Dados e Algoritmos II.

## Como rodar

1. Coloque os CSVs da base Transfermarkt (Kaggle) na pasta `dados/`.
2. Crie o ambiente e instale as dependências:
   ```bash
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
3. Suba o servidor e abra http://localhost:8000:
   ```bash
   .venv/bin/uvicorn backend.api:app --reload
   ```
   Na subida, o servidor carrega a base nas estruturas (~10 s) e mostra um resumo no terminal.
4. Testes: `.venv/bin/pytest` (não precisam da base real)
5. Só a carga, com resumo e tempos: `.venv/bin/python -m backend.dados.carregar`

## Dados usados (backend/dados)

| Estrutura | Conteúdo |
|---|---|
| `ListaPonderada` / `ListaMTF` | 31 ligas nacionais (modificada / clássica) |
| `SkipListValor` / `SkipList` por liga | Jogadores **ativos** (temporada mais recente) da liga |
| `ArvoreAfuniladaCondicional` / `ArvoreAfunilada` | Todos os ~50 mil jogadores, chave (nome normalizado, id) |
| `ListaOrdenada` | Jogadores por id; trechos do nome (autocompletar); histórico de valores; transferências |
| `ArvoreAVL` | Clubes por id |
| `ArvoreAVLAumentada` | Histórico de um jogador, montado sob demanda ao abrir a página dele |

## Estruturas (backend/estruturas)

| Arquivo | Estrutura |
|---|---|
| `rastro.py` | Registro dos passos de cada operação (alimenta as animações) |
| `lista_encadeada.py` | Lista encadeada com busca sequencial |
| `lista_mtf.py` | Lista com movimentação para o início |
| `lista_transposicao.py` | Lista com transposição |
| `ordenacao.py` | Merge sort |
| `lista_ordenada.py` | Lista indexada ordenada com busca binária, piso, teto e intervalo |
| `skiplist.py` | Lista com saltos |
| `arvore_binaria.py` | Árvore binária de busca (base das árvores) |
| `avl.py` | Árvore AVL |
| `splay.py` | Árvore afunilada (afunilamento descendente recursivo) |

### Modificações (para a versão aplicada ao projeto)

| Arquivo | Modifica | O que muda |
|---|---|---|
| `lista_ponderada.py` | `lista_mtf.py` | Nó avança só até passar quem tem menos pontos (acessos com envelhecimento) |
| `skiplist_valor.py` | `skiplist.py` | Ordem pelo nome, nível pelo ranking de valor (sem moeda) + larguras para posição/paginação |
| `splay_condicional.py` | `splay.py` | Só afunila depois de K acessos ao mesmo nó |
| `avl_aumentada.py` | `avl.py` | Cada nó guarda o máximo da subárvore: pico de valor num período em θ(log n) |
