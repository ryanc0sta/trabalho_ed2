// Catálogo "qual estrutura cada ferramenta usa" e as animações dos Bastidores.
//
// Cada operação do site chega com o RASTRO devolvido pelo servidor (os passos
// que o algoritmo realmente executou). Uma "cena" transforma o rastro em
// quadros; o reprodutor mostra um quadro por vez, com uma única frase.
//
// Cenas: lista (encadeada), torres (lista com saltos), árvore e vetor (busca binária).

import { esc, formatarValor, icone, nomeDoNo } from "./formato.js?v=6";

// ---------------------------------------------------------------- catálogo
export const ESTRUTURAS = {
  "lista-ordenada": {
    nome: "Lista ordenada", tipo: "linear",
    oQue: "Uma lista em ordem alfabética. A busca abre a lista ao meio e descarta a metade onde o alvo não pode estar — de novo e de novo.",
  },
  "lista-auto": {
    nome: "Lista autoorganizável", tipo: "linear",
    oQue: "Uma fila de elementos ligados um ao outro, que se reordena sozinha: o que você usa sobe, o que fica esquecido desce.",
  },
  "lista-inicio": {
    nome: "Lista com movimentação para o início", tipo: "linear",
    oQue: "Uma fila de elementos ligados um ao outro. O que acabou de ser usado vai para a primeira posição.",
  },
  "lista-transposicao": {
    nome: "Lista com transposição", tipo: "linear",
    oQue: "Uma fila de elementos ligados um ao outro. A cada uso, o elemento troca de lugar com o vizinho da frente: sobe um degrau por vez.",
  },
  saltos: {
    nome: "Lista com saltos", tipo: "linear",
    oQue: "Uma lista ordenada com vias expressas: os níveis de cima pulam muitos elementos de uma vez; para chegar ao destino, desce-se de nível.",
  },
  afunilada: {
    nome: "Árvore afunilada", tipo: "hierarquica",
    oQue: "Uma árvore de busca que se reorganiza: quem é procurado é levado para a raiz, e os mais procurados ficam sempre perto do topo.",
  },
  avl: {
    nome: "Árvore AVL", tipo: "hierarquica",
    oQue: "Uma árvore de busca que se mantém sempre equilibrada: cada comparação descarta metade do que falta olhar.",
  },
  "avl-composta": {
    nome: "Árvore AVL com chave composta", tipo: "hierarquica",
    oQue: "Uma árvore de busca equilibrada em que a chave tem partes: primeiro o grupo, depois o valor. Tudo o que é do mesmo grupo fica lado a lado, já em ordem.",
  },
};

export const FERRAMENTAS = {
  busca: {
    nome: "Buscar jogador", estrutura: "lista-ordenada", cena: "vetor",
    onde: { texto: "Buscar na página inicial", href: "index.html" },
    porQue: "Com cerca de 100 mil trechos de nomes em ordem, umas 17 comparações bastam para chegar às sugestões.",
  },
  ligas: {
    nome: "Ligas mais visitadas", estrutura: "lista-auto", cena: "lista",
    onde: { texto: "Abrir uma liga", href: "index.html" },
    porQue: "As ligas que você abre ganham pontos e sobem; assim as suas favoritas aparecem primeiro.",
  },
  destaques: {
    nome: "Destaques e páginas", estrutura: "saltos", cena: "torres",
    onde: { texto: "Abrir a Premier League", href: "liga.html?id=GB1" },
    porQue: "Os jogadores mais valiosos ganham torres mais altas: olhar a lista “de cima” mostra só os destaques, e os saltos levam direto a qualquer página.",
  },
  "ir-para": {
    nome: "Ir para um nome", estrutura: "saltos", cena: "torres",
    onde: { texto: "Abrir a Premier League", href: "liga.html?id=GB1" },
    porQue: "A busca desce pelas vias expressas até o primeiro nome a partir do que foi digitado — e, ao digitar a próxima letra, continua de onde parou.",
  },
  "minha-lista": {
    nome: "Minha lista", estrutura: "saltos", cena: "torres",
    onde: { texto: "Abrir a minha lista", href: "lista.html" },
    porQue: "Adicionar e remover jogadores insere e retira torres da lista, mantendo-a em ordem alfabética.",
  },
  "buscas-recentes": {
    nome: "Buscas recentes", estrutura: "lista-inicio", cena: "lista",
    onde: { texto: "Buscar na página inicial", href: "index.html" },
    porQue: "O termo que você acabou de buscar passa a ser o primeiro; os mais antigos vão ficando para trás até sair.",
  },
  vistos: {
    nome: "Vistos por você", estrutura: "lista-transposicao", cena: "lista",
    onde: { texto: "Abrir um jogador pela busca", href: "index.html" },
    porQue: "Cada nova visita adianta o jogador uma posição: quem você revisita sempre vai chegando à frente aos poucos.",
  },
  "em-alta": {
    nome: "Em alta", estrutura: "avl", cena: "arvore",
    onde: { texto: "Ver na página inicial", href: "index.html" },
    porQue: "Os jogadores ficam numa árvore ordenada pelo valor de mercado. O mais valioso é sempre o último à direita, e os seguintes são os vizinhos dele. A seção não muda com as suas visitas.",
  },
  perfil: {
    nome: "Abrir um perfil", estrutura: "afunilada", cena: "arvore",
    onde: { texto: "Abrir um jogador pela busca", href: "index.html" },
    porQue: "Cada perfil é achado pelo nome nesta árvore. Quem você abre três vezes é levado à raiz e, daí em diante, é achado em menos passos.",
  },
  posicoes: {
    nome: "Por posição", estrutura: "lista-inicio", cena: "lista",
    onde: { texto: "Abrir as posições", href: "posicoes.html" },
    porQue: "Cada posição é um item da lista, e a que você escolhe vai para o início. Cada item guarda a sua própria lista com saltos, com os jogadores daquela posição.",
  },
  transferencias: {
    nome: "Janela de transferências", estrutura: "lista-ordenada", cena: "vetor",
    onde: { texto: "Abrir as transferências", href: "transferencias.html" },
    porQue: "As transferências ficam numa lista ordenada pela data. Duas buscas acham onde o período começa e onde termina; tudo o que está entre os dois pontos é a resposta. Aqui a busca binária vence a busca por interpolação, porque as datas se concentram em janeiro e julho.",
  },
  comparar: {
    nome: "Comparar jogadores", estrutura: "avl", cena: "intercalacao",
    onde: { texto: "Abrir a comparação", href: "comparar.html" },
    porQue: "O histórico de cada jogador é uma árvore ordenada pela data. Percorrer a árvore em ordem já entrega as avaliações em sequência; juntar os percursos, pegando sempre a data mais antiga, monta a linha do tempo conjunta sem ordenar nada.",
  },
  extremos: {
    nome: "Extremos da liga", estrutura: "avl-composta", cena: "arvore",
    onde: { texto: "Abrir a Premier League", href: "liga.html?id=GB1" },
    porQue: "Na árvore por idade a chave começa pela liga, então os jogadores de uma liga ficam juntos, do mais velho ao mais jovem. Os extremos são a menor e a maior chave do grupo. Outra árvore, por altura, funciona do mesmo jeito.",
  },
  maquina: {
    nome: "Máquina do tempo", estrutura: "avl", cena: "arvore",
    onde: { texto: "Abrir o Manchester City", href: "clube.html?id=281" },
    porQue: "O valor de um jogador numa data é a última avaliação até aquele dia: uma busca de piso na árvore de histórico dele. Para o elenco, a mesma busca se repete na árvore de cada jogador.",
  },
  recomendados: {
    nome: "Recomendados para você", estrutura: "avl-composta", cena: "arvore",
    onde: { texto: "Ver na página inicial", href: "index.html" },
    porQue: "Cada jogador entra na árvore uma vez por afinidade: clube, posição e liga, país e posição. Para cada perfil que você abriu, três buscas acham os grupos dele e pegam os mais valiosos de cada um. Quem combina em mais critérios aparece primeiro.",
  },
  valor: {
    nome: "Valor numa data e pico", estrutura: "avl", cena: "arvore",
    onde: { texto: "Abrir o perfil de Erling Haaland", href: "jogador.html?id=418560" },
    porQue: "Cada avaliação do jogador é um nó, ordenado pela data. Cada nó guarda o maior valor abaixo dele, então o pico de um período sai sem olhar data por data.",
  },
  faixa: {
    nome: "Faixa de valor", estrutura: "avl", cena: "arvore",
    onde: { texto: "Abrir a faixa de valor", href: "faixa.html" },
    porQue: "Os jogadores ficam ordenados pelo valor. Cada nó sabe quantos jogadores há abaixo dele, então contar uma faixa não exige visitá-la inteira.",
  },
  parecidos: {
    nome: "Parecidos", estrutura: "avl", cena: "arvore",
    onde: { texto: "Abrir o perfil de Erling Haaland", href: "jogador.html?id=418560" },
    porQue: "Na árvore ordenada pelo valor, os jogadores de valor mais próximo são os vizinhos imediatos: basta andar para um lado e para o outro.",
  },
};

export const nomeDoTipo = (tipo) => (tipo === "linear" ? "Estrutura linear" : "Estrutura hierárquica");

/** Selo clicável que diz qual estrutura a ferramenta usa (abre os Bastidores nela). */
export function selo(ferramenta, { soIcone = false } = {}) {
  const estrutura = ESTRUTURAS[FERRAMENTAS[ferramenta].estrutura];
  const dica = `${estrutura.nome} — ver como funciona`;
  return `<button class="selo${soIcone ? " so-icone" : ""}" type="button" data-selo="${ferramenta}" title="${esc(dica)}" aria-label="${esc(dica)}">
    ${icone(estrutura.tipo)}${soIcone ? "" : `<span>${esc(estrutura.nome)}</span>`}</button>`;
}

// ------------------------------------------------------------- utilitários
const NS = "http://www.w3.org/2000/svg";
const L = 512; // largura lógica do palco

function el(tag, atributos = {}, texto) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(atributos)) e.setAttribute(k, v);
  if (texto !== undefined) e.textContent = texto;
  return e;
}
const curto = (texto, n = 7) => (texto.length > n ? `${texto.slice(0, n - 1)}…` : texto);
const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
const nome = (no) => `“${nomeDoNo(no)}”`;
const reduzirMovimento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===================================================================== lista
function cenaLista(op) {
  const { antes = [], depois = [] } = op.cena || {};
  const itens = new Map();
  [...antes, ...depois].forEach((item) => itens.set(String(item.id), item));
  const titulo = (id) => `“${itens.get(String(id))?.titulo ?? nomeDoNo(id)}”`;

  let ordem = antes.map((i) => String(i.id));
  let achado = null;
  const quadros = [{ ordem: [...ordem], cursor: null, achado, legenda: "A lista como estava antes." }];
  const quadro = (legenda, cursor = null) => quadros.push({ ordem: [...ordem], cursor, achado, legenda });
  const mover = (id, para) => {
    ordem = ordem.filter((x) => x !== id);
    ordem.splice(para, 0, id);
  };
  for (const p of op.rastro?.passos || []) {
    const id = p.no === undefined ? null : String(p.no);
    switch (p.passo) {
      case "compara":
        if (p.posicao === undefined) break;
        if (p.igual) achado = id;
        quadro(p.igual ? `${titulo(id)}: achou, na posição ${p.posicao + 1}.` : `${titulo(id)}? Não é. Segue para o próximo.`, p.posicao);
        break;
      case "pontua": quadro(`Ganha 1 ponto: agora tem ${String(p.pontuacao).replace(".", ",")}.`, ordem.indexOf(id)); break;
      case "avanca": mover(id, p.para); quadro(`Sobe da posição ${p.de + 1} para a ${p.para + 1}: só ultrapassa quem tem menos pontos.`); break;
      case "permanece": quadro("Fica onde está: ninguém à frente tem menos pontos."); break;
      case "move_inicio": mover(id, 0); quadro("Vai direto para o início da lista."); break;
      case "transpoe": mover(id, p.para); quadro("Troca de lugar com o vizinho da frente."); break;
      case "nao_encontrado": quadro("Chegou ao fim sem achar: é um item novo."); break;
      case "esvazia": ordem = []; achado = null; quadro("Limpar tudo é imediato: a lista solta o primeiro elemento e, como cada um só é alcançado pelo anterior, todos se vão juntos."); break;
      case "remove": ordem = ordem.filter((x) => x !== id); quadro(`A lista está cheia: o último, ${titulo(id)}, sai.`); break;
      case "insere":
        achado = id;
        if (p.posicao === 0) ordem.unshift(id); else ordem.push(id);
        quadro(`${titulo(id)} entra ${p.posicao === 0 ? "no início" : "no fim"} da lista.`);
        break;
      default: break;
    }
  }

  const colunas = 7;
  const larguraCelula = L / colunas;
  const alturaCelula = 44;
  const linhas = Math.max(1, Math.ceil(itens.size / colunas));
  const altura = linhas * alturaCelula + 8;
  const centro = (indice) => [(indice % colunas) * larguraCelula + larguraCelula / 2, Math.floor(indice / colunas) * alturaCelula + alturaCelula / 2 + 4];
  const grupos = new Map();
  let cursor;

  return {
    altura, quadros,
    montar(svg) {
      for (let i = 0; i < itens.size - 1; i++) { // setas entre posições vizinhas da mesma linha
        if (i % colunas === colunas - 1) continue;
        const [x, y] = centro(i);
        svg.append(el("path", { class: "seta", d: `M${x + 31} ${y}h9m-3 -3l3 3l-3 3` }));
      }
      cursor = el("rect", { class: "cursor-lista", x: -34, y: -17, width: 68, height: 34, rx: 8 });
      svg.append(cursor);
      for (const [id, item] of itens) {
        const g = el("g", { class: "no-lista" });
        g.append(el("title", {}, String(item.titulo ?? item.rotulo ?? id)));
        g.append(el("rect", { x: -30, y: -13, width: 60, height: 26, rx: 6 }));
        g.append(el("text", { y: 4, "text-anchor": "middle" }, curto(String(item.rotulo ?? id), 8)));
        grupos.set(id, g);
        svg.append(g);
      }
    },
    mostrar(i) {
      const q = quadros[i];
      for (const [id, g] of grupos) {
        const indice = q.ordem.indexOf(id);
        g.style.opacity = indice < 0 ? 0 : 1;
        if (indice >= 0) {
          const [x, y] = centro(indice);
          g.style.transform = `translate(${x}px, ${y}px)`;
        }
        g.classList.toggle("achado", q.achado === id);
      }
      cursor.style.opacity = q.cursor === null || q.cursor < 0 ? 0 : 1;
      if (q.cursor !== null && q.cursor >= 0) {
        const [x, y] = centro(q.cursor);
        cursor.style.transform = `translate(${x}px, ${y}px)`;
      }
    },
  };
}

// ==================================================================== torres
function cenaTorres(op) {
  const passos = op.rastro?.passos || [];
  // Colunas: só os nós que a operação tocou, em ordem (mais início e fim).
  const nos = new Map();
  const novos = new Set(); // nós inseridos: a torre aparece durante a animação
  for (const p of passos) {
    if (p.no === undefined || p.no === "sentinela" || p.no === "cabeca") continue;
    const no = nos.get(p.no) || { id: p.no, torre: 0 };
    no.torre = Math.max(no.torre, p.torre ?? p.nivel ?? 0);
    if (p.posicao !== undefined) no.pos = p.posicao;
    if (p.passo === "liga") novos.add(p.no);
    nos.set(p.no, no);
  }
  // Sem busca (vista de um nível alto, ou percurso clássico): desenha as torres da página.
  const torresDaPagina = op.cena?.torres || [];
  const semBusca = nos.size === 0;
  if (semBusca) torresDaPagina.forEach((t, k) => nos.set(t.no, { id: t.no, torre: t.nivel, pos: k }));
  const lista = [...nos.values()];
  const porPosicao = lista.length > 0 && lista.every((n) => n.pos !== undefined);
  const chaveOrdem = (id) => { const [texto, numero] = String(id).split("|"); return [texto, Number(numero) || 0]; };
  lista.sort((a, b) => {
    if (porPosicao) return a.pos - b.pos;
    const [ta, na] = chaveOrdem(a.id);
    const [tb, nb] = chaveOrdem(b.id);
    return ta < tb ? -1 : ta > tb ? 1 : na - nb;
  });
  const colunas = ["cabeca", ...lista.map((n) => n.id), "sentinela"];
  const coluna = (id) => Math.max(0, colunas.indexOf(id === undefined ? "cabeca" : id));
  const topo = Math.max(1, ...lista.map((n) => n.torre), ...passos.filter((p) => p.passo === "inicio").map((p) => p.nivel));

  let cursor = null;
  let achado = null;
  const visiveis = new Map([...novos].map((id) => [id, -1])); // id -> último andar ligado
  const quadros = [];
  const quadro = (legenda, sonda = null) => quadros.push({ cursor: cursor && { ...cursor }, sonda, achado, visiveis: new Map(visiveis), legenda });
  let anterior = null;
  for (const p of passos) {
    switch (p.passo) {
      case "inicio":
        cursor = { c: 0, n: p.nivel };
        quadro(p.nivel > 0 ? `Começa no início da lista, pelo nível ${p.nivel} — o mais alto.` : "Começa no início da lista.");
        break;
      case "compara":
        if (p.decisao === "avanca") {
          cursor = { c: coluna(p.no), n: p.nivel };
          quadro(`Nível ${p.nivel}: ${nome(p.no)} vem antes do alvo. Avança${p.largura > 1 ? `, pulando ${p.largura} de uma vez` : ""}.`);
        } else if (p.decisao === "desce") {
          const fim = p.no === "sentinela";
          if (cursor && p.nivel > 0) cursor = { c: cursor.c, n: p.nivel - 1 };
          quadro(`Nível ${p.nivel}: ${fim ? "o próximo é o fim da lista" : `${nome(p.no)} já passa do alvo`}. ${p.nivel > 0 ? "Desce um nível." : "Chegou ao lugar."}`, coluna(p.no));
        } else if (p.decisao === "sobe") {
          if (cursor) cursor = { c: cursor.c, n: p.nivel };
          quadro(`${nome(p.no)} ainda vem antes do alvo: sobe para o nível ${p.nivel}.`, coluna(p.no));
        } else if (p.decisao === "perto" || p.decisao === "longe") {
          quadro(p.decisao === "perto"
            ? "O alvo está perto da busca anterior: continua de onde parou."
            : "O alvo está longe da busca anterior: recomeça do início.", coluna(p.no));
        }
        break;
      case "dedo": cursor = { c: coluna(p.no), n: p.nivel }; quadro(`Parte de onde a busca anterior parou, no nível ${p.nivel}.`); break;
      case "salta": cursor = { c: coluna(p.no), n: p.nivel }; quadro(`Nível ${p.nivel}: salta até ${nome(p.no)}, na posição ${p.posicao}.`); break;
      case "desce":
        if (cursor) cursor = { c: cursor.c, n: Math.max(0, p.nivel - 1) };
        if (anterior === "desce") quadros.pop(); // vários "desce" seguidos viram um quadro só
        quadro(`Desce até o nível ${Math.max(0, p.nivel - 1)}.`);
        break;
      case "percorre":
        cursor = { c: Math.max(0, colunas.length - 2), n: 0 };
        quadro(`Sem vias expressas para contar: percorre ${p.nos} jogadores, um a um.`);
        break;
      case "encontrado":
        achado = coluna(p.no); cursor = { c: achado, n: 0 };
        quadro(`Chegou: ${nome(p.no)}${p.posicao ? `, na posição ${p.posicao}` : ""}.`);
        break;
      case "nao_encontrado": quadro("Não há nenhum nome a partir desse ponto."); break;
      case "duplicada": quadro(`${nome(p.no)} já está na lista.`); break;
      case "nivel_por_valor": quadro(`Pelo valor de mercado, a torre de ${nome(p.no)} terá ${p.nivel + 1} ${p.nivel ? "andares" : "andar"}.`); break;
      case "sorteio": quadro(`A moeda sorteou uma torre de ${p.nivel + 1} ${p.nivel ? "andares" : "andar"} para ${nome(p.no)}.`); break;
      case "liga":
        visiveis.set(p.no, p.nivel); achado = coluna(p.no);
        if (anterior === "liga") quadros.pop();
        quadro(`Encaixa a torre de ${nome(p.no)}: em cada andar, o vizinho anterior passa a apontar para ela.`);
        break;
      case "desliga":
        visiveis.set(p.no, -1);
        if (anterior === "desliga") quadros.pop();
        quadro(`Retira a torre de ${nome(p.no)}: em cada andar, o vizinho anterior passa a apontar para o seguinte.`);
        break;
      default: break;
    }
    anterior = p.passo;
  }
  const nivelDaVista = op.cena?.nivel ?? 0;
  if (semBusca && torresDaPagina.length && nivelDaVista > 0) {
    cursor = { c: 0, n: nivelDaVista };
    quadro(`Vista do nível ${nivelDaVista}: nesta altura, a lista só liga as torres que chegam até aqui.`);
    for (const t of torresDaPagina) {
      cursor = { c: coluna(t.no), n: nivelDaVista };
      quadro(`Nível ${nivelDaVista}: o próximo é ${nome(t.no)}.`);
    }
    cursor = { c: colunas.length - 1, n: nivelDaVista };
    quadro("Fim: todos os outros jogadores têm torres mais baixas e ficaram de fora.");
  }
  if (!quadros.length) quadros.push({ cursor: null, sonda: null, achado: null, visiveis: new Map(visiveis), legenda: "Nada a mostrar." });

  const margem = 30;
  const passoX = limitar((L - 2 * margem) / Math.max(1, colunas.length - 1), 14, 56);
  const passoY = limitar(170 / (topo + 1), 12, 22);
  const base = (topo + 1) * passoY + 6;
  const altura = base + 54;
  const x = (c) => margem + c * passoX;
  const y = (n) => base - n * passoY - passoY / 2;
  const lado = Math.min(passoX - 3, passoY - 3, 14);
  const celulas = []; // {c, n, id, rect}
  const rotulos = [];
  let bolinha;

  return {
    altura, quadros,
    montar(svg) {
      for (let n = 0; n <= topo; n++) {
        svg.append(el("line", { class: "trilho", x1: x(0), x2: x(colunas.length - 1), y1: y(n), y2: y(n) }));
        svg.append(el("text", { class: "eixo", x: 2, y: y(n) + 3 }, String(n)));
      }
      colunas.forEach((id, c) => {
        const extremo = id === "cabeca" || id === "sentinela";
        const torre = extremo ? topo : nos.get(id).torre;
        for (let n = 0; n <= torre; n++) {
          const rect = el("rect", { class: `andar${extremo ? " extremo" : ""}`, x: x(c) - lado / 2, y: y(n) - lado / 2, width: lado, height: lado, rx: 2 });
          rect.append(el("title", {}, extremo ? (id === "cabeca" ? "início da lista" : "fim da lista") : `${nomeDoNo(id)} — torre de ${torre + 1} ${torre ? "andares" : "andar"}`));
          celulas.push({ c, n, id, rect });
          svg.append(rect);
        }
        const texto = extremo ? (id === "cabeca" ? "início" : "fim") : curto(nomeDoNo(id).split(" ")[0], 8);
        const rotulo = el("text", { class: "rotulo-coluna", "text-anchor": "end", transform: `translate(${x(c) + 3}, ${base + 12}) rotate(-40)` }, texto);
        rotulos.push(rotulo);
        svg.append(rotulo);
      });
      bolinha = el("circle", { class: "cursor-torre", r: lado / 2 + 3 });
      svg.append(bolinha);
    },
    mostrar(i) {
      const q = quadros[i];
      for (const cel of celulas) {
        const limite = q.visiveis.has(cel.id) ? q.visiveis.get(cel.id) : Infinity;
        cel.rect.style.opacity = cel.n <= limite ? 1 : 0;
        cel.rect.classList.toggle("achado", q.achado === cel.c);
        cel.rect.classList.toggle("sonda", q.sonda === cel.c && q.cursor !== null && cel.n === Math.min(q.cursor.n + 1, topo));
      }
      rotulos.forEach((r, c) => r.classList.toggle("ativo", q.achado === c || q.sonda === c || q.cursor?.c === c));
      bolinha.style.opacity = q.cursor ? 1 : 0;
      if (q.cursor) bolinha.style.transform = `translate(${x(q.cursor.c)}px, ${y(q.cursor.n)}px)`;
    },
  };
}

// ==================================================================== árvore
const EXPLICA_CASO = {
  zig: "o alvo é filho da raiz: basta uma rotação",
  zag: "o alvo é filho da raiz: basta uma rotação",
  "zig-zig": "alvo e pai do mesmo lado: duas rotações no mesmo sentido",
  "zag-zag": "alvo e pai do mesmo lado: duas rotações no mesmo sentido",
  "zig-zag": "alvo e pai em lados opostos: duas rotações em sentidos contrários",
  "zag-zig": "alvo e pai em lados opostos: duas rotações em sentidos contrários",
};

function rotuloDoNo(dados) {
  if (dados.data) return `${dados.data.slice(5, 7)}/${dados.data.slice(2, 4)}`;
  if (dados.nascimento) return dados.nascimento.slice(0, 4); // árvore por idade: o ano de nascimento
  if (dados.tam !== undefined) return formatarValor(dados.valor);
  const partes = String(dados.nome ?? nomeDoNo(dados.id)).split(" ");
  return curto(partes[partes.length - 1], 9);
}

function cenaArvore(op) {
  const passos = op.rastro?.passos || [];
  // Estrutura: raiz + filhos de cada nó; os quadros guardam cópias (as rotações a alteram).
  const dados = new Map();
  const filhos = new Map();
  const ler = (no) => {
    if (!no) return null;
    dados.set(no.id, no);
    filhos.set(no.id, [null, null]);
    filhos.set(no.id, [ler(no.esq), ler(no.dir)]);
    return no.id;
  };
  let estrutura = { raiz: ler(op.cena?.arvore), filhos };
  const copiar = (e) => ({ raiz: e.raiz, filhos: new Map([...e.filhos].map(([id, par]) => [id, [...par]])) });

  function rotacionar(e, noId, pivoId, direcao) {
    const f = e.filhos;
    if (!f.has(noId) || !f.has(pivoId)) return false;
    const [ne, nd] = f.get(noId);
    const [pe, pd] = f.get(pivoId);
    if (direcao === "direita") {
      if (ne !== pivoId) return false;
      f.set(noId, [pd, nd]); f.set(pivoId, [pe, noId]);
    } else {
      if (nd !== pivoId) return false;
      f.set(noId, [ne, pe]); f.set(pivoId, [noId, pd]);
    }
    if (e.raiz === noId) e.raiz = pivoId;
    else {
      for (const [id, [a, b]] of f) {
        if (id === pivoId) continue;
        if (a === noId) { f.set(id, [pivoId, b]); break; }
        if (b === noId) { f.set(id, [a, pivoId]); break; }
      }
    }
    return true;
  }

  let atual = null;
  let alvo = null;
  const visitados = new Set();
  const marcas = new Map();
  const quadros = [];
  const quadro = (legenda) => quadros.push({ estrutura, atual, alvo, visitados: new Set(visitados), marcas: new Map(marcas), legenda });
  const rotulo = (id) => (dados.has(id) && dados.get(id).data ? nomeDoNo(id) : nome(id));
  let depoisDoAcesso = false;
  let resumido = false;
  const ehPico = passos.some((p) => p.passo === "divide");
  const ETAPAS = {
    ate: "Primeira descida: quantos jogadores valem até o máximo da faixa?",
    de: "Segunda descida: quantos valem menos que o mínimo da faixa?",
    pagina: "Por fim, pega os jogadores da página pela posição deles, descendo pelos tamanhos dos ramos.",
    maior: "Para achar o jogador mais valioso, basta descer sempre para a direita: é lá que ficam os maiores valores.",
    clube: "Primeira busca: desce até o primeiro jogador do mesmo clube.",
    liga: "Segunda busca, do mesmo jeito: desce até o primeiro jogador da mesma posição e da mesma liga.",
    pais: "Terceira busca: desce até o primeiro jogador do mesmo país e da mesma posição.",
    mais_velho: "Primeira busca: a menor chave da liga — quem nasceu há mais tempo. Desce até o começo do grupo da liga.",
    mais_jovem: "Segunda busca, do mesmo jeito: a maior chave da liga — quem nasceu por último.",
  };
  quadro("A árvore antes da operação. A busca sempre começa pela raiz, no topo.");
  passos.forEach((p, indice) => {
    switch (p.passo) {
      case "etapa":
        atual = estrutura.raiz; visitados.clear(); marcas.clear();
        // Descidas que repetem a ideia da anterior ganham um quadro só.
        resumido = ["pagina", "liga", "pais", "mais_jovem"].includes(p.nome);
        quadro(ETAPAS[p.nome] || "");
        break;
      case "compara": {
        if (depoisDoAcesso || resumido) break; // descidas repetidas não ganham quadros próprios
        if (passos[indice + 1]?.passo === "conta_subarvore") break; // o próximo quadro já explica este nó
        atual = p.no; visitados.add(p.no);
        if (ehPico && p.decisao !== "visita") { quadro(`Segue pela borda do período: ${rotulo(p.no)}.`); break; }
        const destino = { esquerda: "o alvo vem antes: vai para a esquerda", direita: "o alvo vem depois: vai para a direita", igual: "é o alvo", visita: "confere este nó" }[p.decisao] || p.decisao;
        quadro(`Compara com ${rotulo(p.no)} — ${destino}.`);
        break;
      }
      case "acesso":
        depoisDoAcesso = true; atual = p.no;
        quadro(p.contador < p.limite
          ? `Visita ${p.contador} de ${p.limite}: a árvore ainda não muda. Na ${p.limite}ª visita, este jogador sobe para a raiz.`
          : `É a ${p.limite}ª visita: agora ele é levado até a raiz, rotação por rotação.`);
        break;
      case "caso": atual = p.alvo; quadro(`Caso ${p.caso}: ${EXPLICA_CASO[p.caso] || ""}.`); break;
      case "rotacao": {
        const nova = copiar(estrutura);
        if (rotacionar(nova, p.no, p.pivo, p.direcao)) estrutura = nova;
        atual = p.pivo;
        quadro(`Rotação à ${p.direcao}: ${rotulo(p.pivo)} sobe e ${rotulo(p.no)} desce.`);
        break;
      }
      case "raiz": alvo = p.no; atual = p.no; quadro(`${rotulo(p.no)} agora está na raiz.`); break;
      case "divide": atual = p.no; visitados.add(p.no); quadro(`${rotulo(p.no)} é o primeiro nó dentro do período: daqui a busca segue para os dois lados.`); break;
      case "subarvore_inteira": marcas.set(p.no, "inteira"); quadro(`Todo o ramo de ${rotulo(p.no)} cabe no período: usa o máximo já guardado nele (${formatarValor(p.max_sub)}), sem entrar.`); break;
      case "descarta": marcas.set(p.no, "descartada"); quadro(`O ramo de ${rotulo(p.no)} fica fora do período: é ignorado inteiro.`); break;
      case "segue_maximo": atual = p.no; quadro(`Segue o máximo guardado até ${rotulo(p.no)}.`); break;
      case "pico": alvo = p.no; atual = p.no; quadro(`Pico: ${formatarValor(p.valor)}, em ${rotulo(p.no)}.`); break;
      case "conta_subarvore": {
        atual = p.no; visitados.add(p.no);
        const esquerdo = estrutura.filhos.get(p.no)?.[0];
        if (esquerdo) marcas.set(esquerdo, "inteira");
        quadro(`${rotulo(p.no)} e todo o ramo à esquerda dele valem menos: soma ${p.quantidade} de uma vez, sem visitá-los.`);
        break;
      }
      case "contagem": quadro(`A diferença entre as duas descidas dá o total: ${p.quantidade} jogadores na faixa.`); break;
      case "percorre_intervalo": quadro(`Sem a contagem guardada nos nós, percorre os ${p.nos} jogadores da faixa, um a um.`); break;
      case "vizinhos": quadro(p.sentido === "sucessores"
        ? `Anda para os vizinhos mais caros: ${p.quantidade} da mesma posição em ${p.visitados} passos.`
        : `Anda para os vizinhos mais baratos: ${p.quantidade} da mesma posição em ${p.visitados} passos.`); break;
      case "nao_encontrado": quadro("Não encontrado."); break;
      case "maiores": quadro(`Do mais valioso, anda para os vizinhos à esquerda: os ${p.quantidade} mais valiosos saem já em ordem.`); break;
      case "grupo": quadro(p.quantidade
        ? `Os jogadores do grupo estão lado a lado, do mais valioso para o menos: pega ${p.quantidade === 1 ? "o primeiro" : `os ${p.quantidade} primeiros`} andando pelos vizinhos.`
        : "Não há outros jogadores neste grupo."); break;
      case "encontrado": if (!depoisDoAcesso && !resumido) { alvo = p.no; atual = p.no; quadro(`Chegou: ${rotulo(p.no)}.`); } break;
      default: break;
    }
  });
  if (op.cena?.alvo && dados.has(op.cena.alvo)) {
    alvo = op.cena.alvo; atual = alvo;
    quadro(op.cena.legendaFinal || `Resposta: ${rotulo(alvo)}.`);
  }

  // Árvores pequenas (o histórico de um jogador) são apertadas para caber inteiras no palco.
  const dx = limitar((L - 60) / Math.max(1, dados.size - 1), 24, 46);
  const dy = 50;
  const altura = 300;
  function calcular(e) {
    const pos = new Map();
    let coluna = 0;
    let fundo = 0;
    const andar = (id, nivel) => {
      if (!id) return;
      const [esq, dir] = e.filhos.get(id) || [null, null];
      andar(esq, nivel + 1);
      pos.set(id, { x: coluna++ * dx, y: nivel * dy });
      fundo = Math.max(fundo, nivel);
      andar(dir, nivel + 1);
    };
    andar(e.raiz, 0);
    return { pos, largura: Math.max(0, coluna - 1) * dx, altura: fundo * dy };
  }
  const desenhos = new Map(); // estrutura -> layout
  const layout = (e) => { if (!desenhos.has(e)) desenhos.set(e, calcular(e)); return desenhos.get(e); };

  const grupos = new Map();
  const linhas = [];
  let camada;
  let estado = null; // posições e câmera atualmente desenhadas
  let animacao = 0;

  function alvoVisual(q) {
    const { pos, largura, altura: alturaArvore } = layout(q.estrutura);
    const foco = pos.get(q.atual) || pos.get(q.estrutura.raiz) || { x: 0, y: 0 };
    const margem = 30;
    const cx = largura + 2 * margem <= L ? (L - largura) / 2 : limitar(L / 2 - foco.x, L - largura - margem, margem);
    const cy = alturaArvore + 60 <= altura ? 24 : limitar(altura * 0.42 - foco.y, altura - alturaArvore - 40, 24);
    return { pos, cx, cy };
  }

  function desenhar(q, posicoes, cx, cy) {
    camada.setAttribute("transform", `translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`);
    let k = 0;
    for (const [id, [esq, dir]] of q.estrutura.filhos) {
      for (const filho of [esq, dir]) {
        if (!filho) continue;
        const a = posicoes.get(id);
        const b = posicoes.get(filho);
        const linha = linhas[k++];
        if (!linha || !a || !b) continue;
        linha.setAttribute("x1", a.x); linha.setAttribute("y1", a.y);
        linha.setAttribute("x2", b.x); linha.setAttribute("y2", b.y);
        linha.style.display = "";
      }
    }
    for (; k < linhas.length; k++) linhas[k].style.display = "none";
    for (const [id, g] of grupos) {
      const p = posicoes.get(id);
      if (p) g.setAttribute("transform", `translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`);
    }
  }

  return {
    altura, quadros,
    montar(svg) {
      camada = el("g");
      svg.append(camada);
      for (let i = 0; i < dados.size; i++) { const linha = el("line", { class: "ramo" }); linhas.push(linha); camada.append(linha); }
      for (const [id, d] of dados) {
        const g = el("g", { class: `no-arvore${d.resumo ? " resumo" : ""}` });
        g.append(el("title", {}, d.resumo ? "ramo não desenhado"
          : d.data ? `${nomeDoNo(d.data)} — ${formatarValor(d.valor)}`
            : d.nascimento ? `${d.nome} — nascido em ${nomeDoNo(d.nascimento)}`
            : `${d.nome ?? nomeDoNo(id)}${d.valor ? ` — ${formatarValor(d.valor)}` : ""}${d.grupo ? ` (${d.grupo})` : ""}`));
        if (d.resumo) g.append(el("path", { d: "M0 -9 L9 8 L-9 8 Z" }));
        else {
          g.append(el("circle", { r: 13 }));
          g.append(el("text", { y: 27, "text-anchor": "middle" }, rotuloDoNo(d)));
        }
        grupos.set(id, g);
        camada.append(g);
      }
    },
    mostrar(i, animar) {
      const q = quadros[i];
      for (const [id, g] of grupos) {
        g.classList.toggle("visitado", q.visitados.has(id));
        g.classList.toggle("atual", q.atual === id);
        g.classList.toggle("alvo", q.alvo === id);
        g.classList.toggle("inteira", q.marcas.get(id) === "inteira");
        g.classList.toggle("descartada", q.marcas.get(id) === "descartada");
      }
      const destino = alvoVisual(q);
      cancelAnimationFrame(animacao);
      if (!animar || !estado || reduzirMovimento()) {
        estado = { pos: destino.pos, cx: destino.cx, cy: destino.cy };
        desenhar(q, destino.pos, destino.cx, destino.cy);
        return;
      }
      const origem = estado;
      const inicio = performance.now();
      const duracao = 420;
      const passo = (agora) => {
        const t = Math.min(1, (agora - inicio) / duracao);
        const s = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const pos = new Map();
        for (const [id, fim] of destino.pos) {
          const ini = origem.pos.get(id) || fim;
          pos.set(id, { x: ini.x + (fim.x - ini.x) * s, y: ini.y + (fim.y - ini.y) * s });
        }
        const cx = origem.cx + (destino.cx - origem.cx) * s;
        const cy = origem.cy + (destino.cy - origem.cy) * s;
        estado = { pos, cx, cy };
        desenhar(q, pos, cx, cy);
        if (t < 1) animacao = requestAnimationFrame(passo);
      };
      animacao = requestAnimationFrame(passo);
    },
  };
}

// ===================================================================== vetor
/** Número do dia (como no servidor) -> "dd/mm/aaaa". */
function dataDoDia(chave) {
  const dia = Math.floor(Number(chave) / 1e6);
  return new Date((dia - 719163) * 86400000).toISOString().slice(0, 10).split("-").reverse().join("/");
}

function cenaVetor(op) {
  // Comparações da busca binária (as "de limite" são da busca por interpolação, que não é animada).
  const comparacoes = (op.rastro?.passos || []).filter((p) => p.passo === "compara" && p.meio !== undefined && p.decisao !== "limite");
  const datas = op.cena?.chave === "dia"; // lista de transferências: a chave é um dia
  const itens = datas ? "transferências, em ordem de data" : "trechos de nomes, em ordem alfabética";
  const total = op.cena?.total ?? (comparacoes.length ? comparacoes[0].meio * 2 + 1 : 0);
  let inf = 0;
  let sup = total - 1;
  const faixas = [{ restam: total, legenda: `A lista tem ${datas ? "" : "cerca de "}${total.toLocaleString("pt-BR")} ${itens}.` }];
  for (const p of comparacoes) {
    if (p.decisao === "esquerda") sup = p.meio - 1; else inf = p.meio + 1;
    const restam = p.restam ?? Math.max(0, sup - inf + 1);
    const pivo = datas ? dataDoDia(p.no) : nomeDoNo(p.no);
    faixas.push({
      restam, pivo,
      legenda: `Abre no meio: ${datas ? pivo : `“${pivo}”`}. O ${datas ? "começo do período" : "alvo"} vem ${p.decisao === "esquerda" ? "antes" : "depois"} — descarta a outra metade. Restam ${restam.toLocaleString("pt-BR")}.`,
    });
  }
  if (faixas.length > 1) {
    faixas[faixas.length - 1].legenda = datas
      ? `Com ${comparacoes.length} comparações achou onde o período começa. Uma segunda busca igual acha onde ele termina.`
      : `Com ${comparacoes.length} comparações chegou ao ponto exato da lista — sem ler os ${total.toLocaleString("pt-BR")} nomes.`;
  }
  const passoY = 17;
  const altura = faixas.length * passoY + 16;
  const larguraMaxima = L - 150;
  // Escala linear: cada barra tem metade da anterior — é a busca binária "a olho".
  const escala = (n) => (total > 0 ? Math.max(3, (larguraMaxima * n) / total) : 3);
  const linhas = [];
  return {
    altura,
    quadros: faixas.map((f) => ({ legenda: f.legenda })),
    montar(svg) {
      faixas.forEach((f, k) => {
        const g = el("g", { class: "faixa-vetor", transform: `translate(0, ${8 + k * passoY})` });
        g.append(el("rect", { x: 0, y: 0, width: escala(f.restam), height: 11, rx: 2 }));
        g.append(el("text", { x: escala(f.restam) + 8, y: 9.5 }, `${f.restam.toLocaleString("pt-BR")}${f.pivo ? ` · ${curto(f.pivo, 16)}` : ""}`));
        linhas.push(g);
        svg.append(g);
      });
    },
    mostrar(i) {
      linhas.forEach((g, k) => {
        g.style.opacity = k <= i ? 1 : 0;
        g.classList.toggle("atual", k === i);
      });
    },
  };
}

// ============================================================== intercalação
// Uma fileira por jogador (as avaliações na ordem em que a árvore as entrega)
// e, embaixo, a linha do tempo conjunta sendo montada.
function cenaIntercalacao(op) {
  const nomes = op.cena?.nomes || [];
  const tamanhos = op.cena?.tamanhos || [];
  const picks = (op.rastro?.passos || []).filter((p) => p.passo === "intercala");
  const total = picks.length;
  const lote = Math.max(1, Math.ceil(total / 36)); // animações longas avançam alguns pontos por quadro
  const quadros = [{ feitos: 0, legenda: "Cada fileira é o histórico de um jogador, já em ordem de data — é assim que o percurso da árvore entrega." }];
  for (let feitos = lote; feitos < total + lote; feitos += lote) {
    const n = Math.min(feitos, total);
    const ultimo = picks[n - 1];
    quadros.push({
      feitos: n,
      legenda: n < total
        ? `Entre as próximas avaliações de cada jogador, a mais antiga é a de ${nomeDoNo(ultimo.no)}, de ${nomes[ultimo.fonte]}: ela entra na linha do tempo.`
        : `Pronto: as ${total} avaliações estão numa só linha do tempo, sem que nada precisasse ser ordenado.`,
    });
  }
  const margem = 96;
  const largura = L - margem - 12;
  const passoY = 34;
  const altura = (nomes.length + 1) * passoY + 30;
  const maior = Math.max(1, ...tamanhos);
  const pontos = []; // {ordem na linha do tempo, fonte, origem, destino}
  const vistos = nomes.map(() => 0);
  picks.forEach((p, k) => {
    const i = vistos[p.fonte]++;
    pontos.push({
      k, fonte: p.fonte,
      origem: [margem + (largura * i) / Math.max(1, maior - 1), 18 + p.fonte * passoY],
      destino: [margem + (largura * k) / Math.max(1, total - 1), 18 + nomes.length * passoY + 12],
    });
  });
  return {
    altura, quadros,
    montar(svg) {
      nomes.forEach((nome, i) => svg.append(el("text", { class: "rotulo-fileira", x: 0, y: 22 + i * passoY }, curto(nome.split(" ").pop(), 13))));
      svg.append(el("line", { class: "trilho", x1: 0, x2: L, y1: 18 + nomes.length * passoY - 6, y2: 18 + nomes.length * passoY - 6 }));
      svg.append(el("text", { class: "rotulo-fileira", x: 0, y: 22 + nomes.length * passoY + 12 }, "Linha do tempo"));
      for (const ponto of pontos) {
        ponto.el = el("circle", { class: `ponto-serie serie-${ponto.fonte}`, r: 4.5 });
        ponto.el.append(el("title", {}, `${nomeDoNo(picks[ponto.k].no)} — ${nomes[ponto.fonte]}`));
        svg.append(ponto.el);
      }
    },
    mostrar(i) {
      const { feitos } = quadros[i];
      for (const ponto of pontos) {
        const [x, y] = ponto.k < feitos ? ponto.destino : ponto.origem;
        ponto.el.style.transform = `translate(${x}px, ${y}px)`;
        ponto.el.classList.toggle("atual", ponto.k === feitos - 1 && feitos < total);
      }
    },
  };
}

// ================================================================ reprodutor
const CENAS = { lista: cenaLista, torres: cenaTorres, arvore: cenaArvore, vetor: cenaVetor, intercalacao: cenaIntercalacao };

/**
 * Monta a animação de uma operação dentro de `container`.
 * Controles: tocar/pausar, passo anterior e próximo, barra para arrastar
 * pelos passos e as setas ← → do teclado.
 * Devolve uma função que interrompe a animação (para trocar de operação).
 */
export function montarAnimacao(container, op) {
  const tipo = FERRAMENTAS[op.ferramenta]?.cena;
  const criar = CENAS[tipo];
  if (!criar) {
    container.innerHTML = "";
    return () => {};
  }
  let cena;
  try {
    cena = criar(op);
  } catch {
    container.innerHTML = "";
    return () => {};
  }
  const total = cena.quadros.length;
  container.innerHTML = `
    <div class="palco"><svg viewBox="0 0 ${L} ${cena.altura}" role="img" aria-label="Animação da operação"></svg></div>
    <p class="legenda" aria-live="polite"></p>
    <input class="trilha" type="range" min="0" max="${Math.max(0, total - 1)}" value="0" aria-label="Passo da animação">
    <div class="controles">
      <button class="botao icone-so" data-acao="anterior" aria-label="Passo anterior" title="Passo anterior (←)">${icone("voltar")}</button>
      <button class="botao icone-so" data-acao="tocar" aria-label="Tocar ou pausar" title="Tocar ou pausar (espaço)"></button>
      <button class="botao icone-so" data-acao="passo" aria-label="Próximo passo" title="Próximo passo (→)">${icone("avancar")}</button>
      <span class="num" data-contagem></span>
    </div>`;
  const svg = container.querySelector("svg");
  const legenda = container.querySelector(".legenda");
  const trilha = container.querySelector(".trilha");
  const contagem = container.querySelector("[data-contagem]");
  const botaoTocar = container.querySelector('[data-acao="tocar"]');
  cena.montar(svg);

  let indice = 0;
  let relogio = null;
  const intervalo = limitar(10000 / total, 280, 1400); // animações longas andam mais depressa

  const mostrar = (i, animar = true) => {
    indice = limitar(i, 0, total - 1);
    cena.mostrar(indice, animar);
    legenda.textContent = cena.quadros[indice].legenda;
    contagem.textContent = `passo ${indice + 1} de ${total}`;
    trilha.value = indice;
    botaoTocar.innerHTML = icone(relogio ? "pausar" : indice >= total - 1 ? "repetir" : "tocar");
  };
  const parar = () => { clearInterval(relogio); relogio = null; };
  const tocar = () => {
    parar();
    if (indice >= total - 1) mostrar(0, false);
    relogio = setInterval(() => {
      if (indice >= total - 1) { parar(); mostrar(indice); return; }
      mostrar(indice + 1);
    }, intervalo);
    mostrar(indice);
  };
  const alternar = () => { if (relogio) { parar(); mostrar(indice); } else tocar(); };

  container.querySelector('[data-acao="anterior"]').addEventListener("click", () => { parar(); mostrar(indice - 1); });
  container.querySelector('[data-acao="passo"]').addEventListener("click", () => { parar(); mostrar(indice + 1); });
  botaoTocar.addEventListener("click", alternar);
  trilha.addEventListener("input", () => { parar(); mostrar(Number(trilha.value), false); });
  const teclado = (e) => {
    if (!container.isConnected || e.target.matches("input:not(.trilha), textarea")) return;
    if (e.key === "ArrowRight") { parar(); mostrar(indice + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { parar(); mostrar(indice - 1); e.preventDefault(); }
    else if (e.key === " " && !e.target.matches("button")) { alternar(); e.preventDefault(); }
  };
  document.addEventListener("keydown", teclado);

  mostrar(0, false);
  if (reduzirMovimento()) mostrar(total - 1, false); // sem animação: mostra o resultado
  else if (total > 1) tocar();
  return () => { parar(); document.removeEventListener("keydown", teclado); };
}
