# Scout Explorer

Visualizador da base Transfermarkt para o trabalho de Estrutura de Dados e Algoritmos II.

## Como rodar

1. Coloque os CSVs da base Transfermarkt (Kaggle) na pasta `dados/`.
2. Crie o ambiente e instale as dependências:
   ```bash
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
3. Suba o servidor e abra http://localhost:8001:
   ```bash
   .venv/bin/uvicorn backend.api:app --reload --port 8001
   ```
   Na subida, o servidor carrega a base nas estruturas (~10 s) e mostra um resumo no terminal.
4. Testes: `.venv/bin/pytest` (não precisam da base real)
5. Só a carga, com resumo e tempos: `.venv/bin/python -m backend.dados.carregar`

## Telas (frontend)

| Página | O que mostra |
|---|---|
| `index.html` | Ligas (lista autoorganizável), "Em alta" (topo da árvore afunilada), frequentes (transposição) |
| `liga.html?id=GB1` | Slider de profundidade sobre os níveis da Skip List, cards paginados |
| `jogador.html?id=418560` | Ficha, gráfico do histórico, valor numa data (piso) e pico no período (AVL aumentada), transferências |
| `clube.html?id=281` | Ficha e elenco |
| `faixa.html` | Jogadores numa faixa de valor: contagem, extremos (piso e teto) e páginas |
| `lista.html` | Minha lista: jogadores guardados, com inserção e remoção ao vivo |

### Ferramentas e o que cada uma exercita

| Ferramenta | Onde | Estrutura e operação |
|---|---|---|
| Minha lista | botão na página do jogador + `lista.html` | Skip List: **inserção e remoção** (nível pelo valor, larguras atualizadas) |
| Buscas recentes | barra lateral | Lista com **movimentação para o início clássica** (inserção no início, remoção do último) |
| Faixa de valor | `faixa.html` | AVL por valor: **intervalo**, **piso**, **teto** e contagem pelo tamanho da subárvore |
| Ir para um nome | página da liga | Skip List: **busca de teto** + **busca dedilhada** ao digitar letra a letra |
| Parecidos | página do jogador | AVL por valor: **sucessores e predecessores** |
| Vistos por você | barra lateral | Lista com transposição |

### Como o site mostra qual estrutura cada ferramenta usa

- Cada ferramenta tem um **selo** com o nome da estrutura (por exemplo, "Lista com saltos" ao lado
  do filtro da liga). Clicar no selo abre os Bastidores naquela ferramenta.
- O painel **Bastidores** explica uma ferramenta por vez: o tipo (linear ou hierárquica), o que é a
  estrutura, por que ela foi usada ali e uma **animação da última operação**, com uma frase por passo
  e controles de tocar, pausar e avançar. A animação é montada a partir do rastro real devolvido pelo
  servidor — não é uma simulação.
- No fim do painel, o mapa **"O que cada ferramenta usa"** lista todas as ferramentas, separadas em
  estruturas lineares e hierárquicas, e o seletor de versão (modificada ou clássica) para comparar.

| Animação (`frontend/js/estruturas.js`) | Usada por |
|---|---|
| Lista encadeada (itens que se reordenam) | Ligas mais visitadas, Buscas recentes, Vistos por você |
| Torres da lista com saltos (cursor descendo os níveis) | Destaques e páginas da liga, Ir para um nome, Minha lista |
| Árvore (caminho, rotações, ramos aproveitados inteiros) | Em alta, Valor numa data e pico, Faixa de valor, Parecidos |
| Busca binária (barras que caem pela metade) | Buscar jogador |

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
| `avl_ordem.py` | `avl.py` | Cada nó guarda o tamanho da subárvore: contar e paginar uma faixa de valor em θ(log n) |
| `skiplist_valor.py` (busca dedilhada) | `skiplist.py` | `posicao_teto` parte de onde a busca anterior parou quando o alvo está perto |

## API (backend/api.py)

Com o servidor rodando, http://localhost:8001/docs permite testar cada rota pelo navegador ("Try it out").
Rotas com `modo` aceitam `modificado` (padrão) ou `classico`. As que executam uma operação devolvem o
`rastro` (os passos do algoritmo), usado pelas animações.

| Rota | Estrutura |
|---|---|
| `GET /api/ligas` · `POST /api/ligas/{id}/acessar` | Lista ponderada / movimentação para o início |
| `GET /api/ligas/{id}` | Níveis da Skip List e valor mínimo de cada um |
| `GET /api/ligas/{id}/jogadores?nivel=&pagina=` | Skip List: um nível, paginado (larguras) |
| `GET /api/ligas/{id}/estrutura` · `GET /api/ligas/{id}/localizar/{jogador}` | Recorte da Skip List para desenhar; descida de uma busca |
| `GET /api/busca?q=` | Lista ordenada de trechos do nome (autocompletar) |
| `POST /api/jogadores/{id}/acessar` · `GET /api/em-alta` | Splay condicional / clássica (recorte antes e depois) |
| `GET /api/frequentes` | Lista com transposição |
| `GET /api/jogadores/{id}` · `/valor?data=` · `/pico?de=&ate=` | AVL aumentada do histórico |
| `GET /api/clubes/{id}` | AVL de clubes |
| `GET /api/minha-lista` · `PUT`/`DELETE /api/minha-lista/{id}` | Skip List: inserção e remoção |
| `POST /api/buscas?q=` · `GET /api/lateral` | Lista com movimentação para o início; dados da barra lateral |
| `GET /api/faixa?minimo=&maximo=` | AVL por valor com tamanho da subárvore |
| `GET /api/ligas/{id}/ir-para?q=` | Skip List: teto + busca dedilhada |
| `GET /api/jogadores/{id}/parecidos` | AVL por valor: vizinhos em ordem |
