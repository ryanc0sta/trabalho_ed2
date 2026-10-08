# Scout Explorer

Visualizador da base Transfermarkt para o trabalho de Estrutura de Dados e Algoritmos II.

## Como rodar

**Você precisa de:** Python 3.10 ou mais novo, git e conexão com a internet (as fotos, os escudos, as
fontes e a biblioteca do gráfico vêm de servidores externos).

1. **Baixe o código.**
   ```bash
   git clone https://github.com/ryanc0sta/trabalho_ed2.git
   cd trabalho_ed2
   ```

2. **Baixe a base de dados.** Os CSVs não ficam no repositório (são grandes). Baixe a base
   "Football Data from Transfermarkt" no Kaggle, crie a pasta `dados/` na raiz do projeto e coloque
   nela estes 5 arquivos (cerca de 80 MB; os outros arquivos da base não são usados):

   ```
   dados/players.csv
   dados/clubs.csv
   dados/competitions.csv
   dados/player_valuations.csv
   dados/transfers.csv
   ```

3. **Crie o ambiente e instale as dependências.**
   ```bash
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
   No Windows: `python -m venv .venv` e depois `.venv\Scripts\pip install -r requirements.txt`.

4. **Suba o servidor.**
   ```bash
   .venv/bin/uvicorn backend.api:app --port 8001
   ```
   No Windows: `.venv\Scripts\uvicorn backend.api:app --port 8001`.

   Espere aparecer `Application startup complete` (cerca de 15 s: o servidor carrega a base nas
   estruturas e mostra um resumo no terminal) e abra **http://localhost:8001**. Para parar, Ctrl+C.

**Outros comandos**
- Testes: `.venv/bin/pytest` (não precisam da base de dados; devem passar todos).
- Só a carga, com resumo e tempos: `.venv/bin/python -m backend.dados.carregar`.
- Para desenvolver, acrescente `--reload` ao comando do servidor: ele reinicia a cada mudança no código.

**Problemas comuns**
- *"Não foi possível carregar"* no site: a página foi aberta antes de `Application startup complete`,
  ou os CSVs não estão em `dados/` (o terminal avisa "CSVs não encontrados").
- *"address already in use"*: a porta está ocupada; troque `--port 8001` por outra, como `--port 8002`.
- As visitas, a "Minha lista" e as buscas recentes ficam na memória do servidor: ao reiniciá-lo, voltam ao início.

## Telas (frontend)

| Página | O que mostra |
|---|---|
| `index.html` | Ligas (lista autoorganizável), "Em alta" (topo da árvore afunilada), frequentes (transposição) |
| `liga.html?id=GB1` | Slider de profundidade sobre os níveis da Skip List, cards paginados |
| `jogador.html?id=418560` | Ficha, gráfico do histórico, valor numa data (piso) e pico no período (AVL aumentada), transferências |
| `clube.html?id=281` | Ficha, elenco e Máquina do tempo |
| `estruturas.html` | Qual estrutura cada ferramenta usa, e quais foram modificadas |
| `faixa.html` | Jogadores numa faixa de valor: contagem, extremos (piso e teto) e páginas |
| `lista.html` | Minha lista: jogadores guardados, com inserção e remoção ao vivo |
| `posicoes.html` | Por posição: lista de posições, cada uma com a sua Skip List (o Exemplo 1 do enunciado) |
| `transferencias.html` | As maiores transferências de um período |
| `comparar.html?ids=…` | Até três históricos no mesmo gráfico e as trocas de liderança |

### Ferramentas e o que cada uma exercita

| Ferramenta | Onde | Estrutura e operação |
|---|---|---|
| Minha lista | botão na página do jogador + `lista.html` | Skip List: **inserção e remoção** (nível pelo valor, larguras atualizadas) |
| Buscas recentes | barra lateral | Lista com **movimentação para o início clássica** (inserção no início, remoção do último; "Limpar buscas" esvazia a lista em θ(1)) |
| Faixa de valor | `faixa.html` | AVL por valor: **intervalo**, **piso**, **teto** e contagem pelo tamanho da subárvore |
| Ir para um nome | página da liga | Skip List: **busca de teto** + **busca dedilhada** ao digitar letra a letra |
| Parecidos | página do jogador | AVL por valor: **sucessores e predecessores** |
| Em alta | página inicial | AVL por valor: **busca da maior chave** e predecessores (os mais valiosos; não muda com as visitas) |
| Recomendados para você | página inicial | **AVL com chave composta** `(grupo, -valor, id)`: uma busca de teto por afinidade (clube, posição + liga, país + posição) de cada perfil aberto |
| Abrir um perfil | página do jogador | **Árvore afunilada condicional**: o jogador é achado pelo nome e vai à raiz na 3ª visita |
| Vistos por você | barra lateral | Lista com transposição |
| Por posição | `posicoes.html` | Lista com **movimentação para o início** em que cada item é uma **Skip List** |
| Janela de transferências | `transferencias.html` | Lista ordenada por data: **busca binária** das duas pontas do período; a **busca por interpolação** roda junto para comparar |
| Comparar | `comparar.html` | **Percurso em ordem** de várias AVLs + **intercalação** numa linha do tempo |
| Extremos da liga | página da liga | AVL com chave composta `(liga, nascimento, id)`: **busca da menor e da maior chave** do grupo |
| Máquina do tempo | página do clube | **Busca de piso** na AVL de histórico de cada jogador do elenco |

**Busca por interpolação, medida na base real.** Para localizar o verão de 2025 entre 175 mil
transferências, a busca binária fez 35 comparações e a interpolação, 385. As datas se concentram em
janeiro e julho (quase 70 mil transferências num único mês), e a interpolação supõe chaves bem
espalhadas. O teste `test_interpolacao_vence_com_chaves_uniformes_e_perde_com_concentradas` mostra os
dois lados; por isso a ferramenta usa a binária e mostra a contagem da interpolação só como comparação.

### Como o site mostra qual estrutura cada ferramenta usa

- Cada ferramenta tem um **selo** com o nome da estrutura (por exemplo, "Lista com saltos" ao lado
  do filtro da liga). Clicar no selo abre os Bastidores naquela ferramenta.
- O painel **Bastidores** explica uma ferramenta por vez: o tipo (linear ou hierárquica), o que é a
  estrutura, por que ela foi usada ali e uma **animação da última operação**, com uma frase por passo
  e controles de tocar, pausar e avançar. A animação é montada a partir do rastro real devolvido pelo
  servidor — não é uma simulação.
- Depois de cada ação aparece um **aviso** ("Você acabou de usar: Lista com saltos") com o botão
  "Ver como", que abre a animação daquela ação.
- A animação tem uma **barra para arrastar** pelos passos e aceita as setas ← → e a barra de espaço.
- **"Suas últimas ações"** lista as ações recentes e a estrutura que cada uma usou.
- Cada estrutura traz a indicação **Clássica** (como nos slides da disciplina) ou **Modificada**. Nas
  modificadas, o painel explica o que mudou em relação à versão clássica e, quando há, o ganho medido.
  Os selos das ferramentas modificadas também dizem "modificada".
- A página **Estruturas usadas** (`estruturas.html`, na barra lateral) lista todas as ferramentas,
  separadas em estruturas lineares e hierárquicas, com a versão de cada uma e um botão "Como funciona".
- O site usa sempre a versão do trabalho. As versões clássicas continuam no servidor (rotas com
  `?modo=classico`), para os testes e para as medições que comparam as duas.

| Animação (`frontend/js/estruturas.js`) | Usada por |
|---|---|
| Lista encadeada (itens que se reordenam) | Ligas mais visitadas, Buscas recentes, Vistos por você |
| Torres da lista com saltos (cursor descendo os níveis) | Destaques e páginas da liga, Ir para um nome, Minha lista |
| Árvore (caminho, rotações, ramos aproveitados inteiros) | Abrir um perfil, Em alta, Recomendados, Valor numa data e pico, Faixa de valor, Parecidos |
| Busca binária (barras que caem pela metade) | Buscar jogador, Janela de transferências |
| Intercalação (fileiras que se juntam numa linha do tempo) | Comparar |

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
| `POST /api/jogadores/{id}/acessar` | Splay condicional / clássica (recorte antes e depois) + lista de vistos |
| `GET /api/frequentes` | Lista com transposição |
| `GET /api/jogadores/{id}` · `/valor?data=` · `/pico?de=&ate=` | AVL aumentada do histórico |
| `GET /api/clubes/{id}` | AVL de clubes |
| `GET /api/minha-lista` · `PUT`/`DELETE /api/minha-lista/{id}` | Skip List: inserção e remoção |
| `POST /api/buscas?q=` · `GET /api/lateral` | Lista com movimentação para o início; dados da barra lateral |
| `GET /api/faixa?minimo=&maximo=` | AVL por valor com tamanho da subárvore |
| `GET /api/ligas/{id}/ir-para?q=` | Skip List: teto + busca dedilhada |
| `GET /api/jogadores/{id}/parecidos` | AVL por valor: vizinhos em ordem |
| `GET /api/em-alta` | AVL por valor: maior chave e predecessores |
| `GET /api/recomendados?jogador_id=` | AVL de afinidades (chave composta) |
| `DELETE /api/buscas` | Esvazia a lista de buscas recentes |
| `GET /api/posicoes` · `POST /api/posicoes/{id}/acessar` · `GET /api/posicoes/{id}/jogadores` | Lista de posições + Skip List de cada uma |
| `GET /api/transferencias?de=&ate=` | Lista ordenada: binária (e interpolação para comparar) |
| `GET /api/comparar?ids=` | Percursos em ordem intercalados |
| `GET /api/ligas/{id}/extremos` | AVLs por idade e por altura (menor e maior chave) |
| `GET /api/clubes/{id}/maquina?data=` | Busca de piso em cada histórico do elenco |
