# Scout Explorer — descrição do trabalho

Trabalho de Estrutura de Dados e Algoritmos II — Interface de Visualização de Base de Dados

**Grupo:** [Leandro Cipriano, Luiz Eduardo, Rickison de Lima, Ryan Costa]

## 1. A aplicação

O Scout Explorer é um site para explorar a base **Football Data from Transfermarkt** (Kaggle): cerca de
50 mil jogadores, 31 ligas, os clubes, o histórico de valores de mercado de cada jogador e mais de
175 mil transferências. A base é multimídia, com fotos de jogadores, escudos, logos de ligas e bandeiras.

O site permite navegar pelas ligas, abrir a ficha de um jogador (com gráfico do valor ao longo do tempo),
ver o elenco de um clube, filtrar jogadores por faixa de valor, consultar as maiores transferências de um
período, comparar até três jogadores e montar uma lista pessoal de observação.

A ideia central do trabalho é que as estruturas de dados não apenas guardam os dados, mas **são a própria
funcionalidade** que o usuário vê. Nenhuma estrutura pronta da linguagem (como dicionários ou ordenação
embutida) guarda os dados da base: tudo fica em listas e árvores implementadas pelo grupo. Cada
ferramenta do site tem um selo com o nome da estrutura que usa, e o painel **Bastidores** mostra uma
animação passo a passo da última operação, montada a partir do rastro real que o servidor devolve.

## 2. Estruturas utilizadas

| Tipo         | Estruturas                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lineares     | lista encadeada, lista com movimentação para o início, lista com transposição, lista indexada ordenada (busca binária, piso, teto e intervalo), lista com saltos (Skip List) |
| Hierárquicas | árvore binária de busca, árvore AVL, árvore afunilada (splay)                                                                                                                |

Usos principais: ligas em uma lista que se reorganiza conforme o uso; jogadores de cada liga em uma
Skip List; busca de jogadores por nome em uma árvore afunilada; histórico de valores de cada jogador em
uma AVL; jogadores por valor de mercado, afinidades e extremos de cada liga em AVLs; índices de grande
porte (jogadores por id, transferências por data) em listas ordenadas com busca binária.

## 3. Modificações nos algoritmos clássicos

Cada modificação responde a um problema concreto da aplicação. Para todas existe também a versão clássica,
e o site permite comparar as duas (`modo=classico` ou `modo=modificado` na API).

1. **Lista com movimentação ponderada** (ligas). Na movimentação para o início clássica, um único acesso a
   uma liga pouco usada a joga para o topo. Aqui cada nó tem uma pontuação que sobe a cada acesso e
   envelhece com o tempo, e o nó avança só até passar quem tem pontuação menor.
2. **Skip List com nível por valor e larguras** (jogadores da liga). O nível de cada nó vem do ranking de
   valor de mercado, e não de uma moeda, então olhar só os níveis altos mostra as estrelas da liga. A lista
   continua ordenada pelo nome. Cada ponteiro guarda quantos nós salta, o que dá a posição de um jogador e
   a paginação em θ(log n). A busca de teto também é "dedilhada": ao digitar letra a letra, ela recomeça de
   onde a busca anterior parou.
3. **Árvore afunilada condicional** (abrir um perfil). Na versão clássica, toda consulta leva o nó à raiz.
   Aqui cada nó conta seus acessos e só é afunilado no 3º acesso, então uma consulta isolada não desaloja
   da raiz quem é realmente procurado.
4. **AVL aumentada com o máximo da subárvore** (histórico de valores). Cada nó guarda o maior valor da sua
   subárvore, e o pico de valor num período sai em θ(log n), sem visitar todas as datas.
5. **AVL com o tamanho da subárvore** (jogadores por valor). Cada nó guarda quantos nós tem sua subárvore,
   o que permite contar quantos jogadores há numa faixa de valor e paginar a faixa em θ(log n).

Um resultado medido na base real: para localizar o verão de 2025 entre 175 mil transferências, a busca
binária fez 35 comparações e a busca por interpolação, 385, porque as datas se concentram em janeiro e
julho. Por isso a ferramenta usa a binária e mostra a interpolação só como comparação.

## 4. Processo de desenvolvimento

O desenvolvimento seguiu etapas, registradas no histórico do repositório:

1. **Estruturas clássicas, modificações e testes.** Primeiro as estruturas, isoladas da aplicação, cada
   uma com testes automatizados.
2. **Carga da base.** Leitura dos CSVs e montagem de todas as estruturas na subida do servidor.
3. **API com rastro das operações.** Cada operação devolve os passos do algoritmo, o que alimenta as
   animações, e as rotas aceitam os modos clássico e modificado.
4. **Telas.** Páginas de início, liga, jogador, clube, faixa de valor, transferências, comparação e
   posições, seguidas de um redesign do site.
5. **Ferramentas e Bastidores.** Barra lateral de ferramentas, animações das estruturas, recomendações,
   página "Estruturas usadas" e indicação de quais estruturas são modificadas.

O projeto tem mais de 100 testes automatizados, que não precisam da base real.

## 5. Como executar

As instruções estão no `README.md`.
