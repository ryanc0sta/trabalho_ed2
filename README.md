# Scout Explorer

Visualizador da base Transfermarkt para o trabalho de Estrutura de Dados e Algoritmos II.

> **Nota para quem for avaliar.** O código-fonte não tem comentários nem docstrings internos.
> Toda a documentação de cada estrutura — o que ela faz e, principalmente, o que foi **modificado**
> em relação à versão clássica e por quê — está neste README, na seção
> [Modificações (para a versão aplicada ao projeto)](#modificações-para-a-versão-aplicada-ao-projeto).
> Por favor, leia essa seção antes de revisar o código.

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

Detalhe de cada uma, com o problema que motivou a mudança:

**Modificação 1 — Lista com movimentação ponderada** (`lista_ponderada.py`, lista das ligas).
Na movimentação para o início clássica, um único acesso a uma liga pouco usada a joga para o topo,
empurrando para baixo as ligas que o usuário realmente consulta sempre. A modificação dá a cada nó
uma pontuação de interesse: cada acesso soma 1 à pontuação, e todas as pontuações "envelhecem" —
são multiplicadas por `fator` a cada acesso feito na lista (acessos antigos pesam menos). Depois de
encontrado, o nó avança só até passar os nós com pontuação menor que a sua, então a lista fica
sempre ordenada pela pontuação: quem é acessado com frequência sobe e se mantém; um acesso isolado
sobe pouco. O envelhecimento é preguiçoso: o nó guarda a pontuação e o instante (relógio da lista)
em que ela foi atualizada; a pontuação atual é `pontuacao · fator^(relogio − instante)`. Como todos
envelhecem na mesma taxa, a ordem relativa entre nós não acessados nunca muda, e por isso não é
preciso percorrer a lista para envelhecer ninguém.

**Modificação 2 — Lista com saltos com níveis por valor e larguras** (`skiplist_valor.py`,
jogadores de uma liga). Problema da versão clássica: o nível de cada nó vem de lançamentos de
moeda, então "olhar a liga por cima" (só os níveis altos) mostra jogadores aleatórios, não os mais
valiosos. Duas mudanças:
- **(a) nível pelo valor de mercado, não pela moeda** — a lista continua ordenada pelo **nome**,
  mas o nível de cada jogador vem da sua posição no ranking de valor da liga: a metade mais
  valiosa tem nível ≥ 1, o quarto mais valioso tem nível ≥ 2, o oitavo, nível ≥ 3, e assim por
  diante (posição `r` → nível `⌊log₂(n/r)⌋`). Cada nível tem exatamente metade dos nós do nível de
  baixo, como numa lista com saltos perfeita, e o nível mais alto mostra só as estrelas. Por que
  ordenar pelo nome e não pelo valor? Se a lista estivesse ordenada pelo próprio valor, todos os
  nós altos ficariam juntos no começo e, para achar um jogador barato, a busca percorreria quase
  todo o nível 0: θ(n). Como nome e valor são independentes, os nós altos ficam espalhados pela
  lista e a busca continua θ(log n) — sem precisar de moeda. Os limiares de valor de cada nível são
  calculados na construção; jogadores inseridos depois recebem o nível pelo limiar que alcançam.
- **(b) larguras nos ponteiros** — cada ponteiro guarda quantos nós do nível 0 ele salta. Somando
  as larguras durante a descida, obtém-se a posição de um nó, e a descida inversa acha o nó de uma
  posição — paginação ("página 30") em θ(log n), sem percorrer os nós anteriores. As larguras são
  atualizadas na inserção e na remoção.

**Modificação 3 — Árvore afunilada com afunilamento condicional** (`splay_condicional.py`, busca de
jogadores). Problema da versão clássica: toda busca leva o nó à raiz. Um jogador consultado uma
única vez (por curiosidade, ou por um clique errado) desaloja da raiz e dos níveis próximos os
jogadores que são realmente procurados com frequência — e a seção "Em alta", que mostra o topo da
árvore, fica instável. A modificação dá a cada nó um contador de acessos: a busca localiza o nó como
numa árvore binária de busca comum, sem rotações, e soma 1 ao contador; só quando o contador atinge
`limite` (K) o nó é afunilado até a raiz — e o contador volta a zero. Buscas malsucedidas não
alteram a árvore. Inserção e remoção continuam como na árvore afunilada clássica.

**Modificação 4 — AVL aumentada com o máximo da subárvore** (`avl_aumentada.py`, histórico de um
jogador). Cada jogador tem uma AVL cujas chaves são as datas de avaliação e cujos valores são os
valores de mercado. "Quanto ele valia em 01/2020?" já era uma busca de piso pela data; mas "qual foi
o maior valor entre 2018 e 2022?" na AVL clássica exigiria visitar todas as datas do período: θ(k).
A modificação faz cada nó guardar também `max_sub`, o maior valor de mercado da sua subárvore,
recalculado sempre que os filhos de um nó mudam — na inserção, na remoção e em cada rotação (gancho
`_atualizar`). Com isso, a consulta do pico usa subárvores inteiras sem entrar nelas e responde em
θ(log n): só desce nos dois caminhos que delimitam o período.

**Modificação 5 — AVL com o tamanho da subárvore** (`avl_ordem.py`, jogadores por valor de
mercado). Perguntas da interface sobre faixas de valor como "quantos jogadores valem entre €10M e
€20M?" ou "mostre a 3ª página dessa faixa" exigiriam, na AVL clássica, visitar todos os jogadores da
faixa (θ(k)) ou percorrer as páginas anteriores. A modificação faz cada nó guardar `tam`, o número de
nós da sua subárvore (atualizado no mesmo gancho `_atualizar`, portanto também em toda rotação). Com
isso a árvore responde em θ(log n): `posicao(chave)` soma, ao descer para a direita, o nó e toda a
sua subárvore esquerda de uma vez; `contar(de, ate)` é a diferença entre duas posições, sem visitar a
faixa; `selecionar(k)` acha a k-ésima menor chave descendo pelo tamanho.

**Modificação 6 — Busca dedilhada** (`skiplist_valor.py`, método `posicao_teto`, campo "Ir para um
nome"). A posição de um nó já sai da soma das larguras em θ(log n) (modificação 2b). Além disso, a
busca é **dedilhada**: guarda-se onde a busca anterior parou (o "dedo" — o último nó de cada nível)
e, se a nova chave vier logo depois, a busca recomeça dali, subindo só os níveis necessários — útil
porque o campo dispara uma busca a cada letra digitada, e cada letra cai perto da anterior. Partir do
dedo custa cerca de 2·log(distância): compensa para alvos próximos, mas seria pior que partir da
cabeça (log n) para alvos distantes. Por isso, antes de usar o dedo, uma única comparação no nível do
meio decide: se o próximo nó desse nível já passa da chave, o alvo está perto; senão, a busca
recomeça da cabeça.

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
