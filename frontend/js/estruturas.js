// Catálogo "qual estrutura cada ferramenta usa" e as animações dos Bastidores.
//
// Cada operação do site chega com o RASTRO devolvido pelo servidor (os passos
// que o algoritmo realmente executou). Uma "cena" transforma o rastro em
// quadros; o reprodutor mostra um quadro por vez, com uma única frase.
//
// Cenas: lista (encadeada), torres (lista com saltos), árvore e vetor (busca binária).

import { esc, formatarValor, icone, nomeDoNo } from "./formato.js?v=4";

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
};

export const FERRAMENTAS = {
  busca: {
    nome: "Buscar jogador", estrutura: "lista-ordenada", cena: "vetor",
    porQue: "Com cerca de 100 mil trechos de nomes em ordem, umas 17 comparações bastam para chegar às sugestões.",
  },
  ligas: {
    nome: "Ligas mais visitadas", estrutura: "lista-auto", cena: "lista",
    porQue: "As ligas que você abre ganham pontos e sobem; assim as suas favoritas aparecem primeiro.",
  },
  destaques: {
    nome: "Destaques e páginas da liga", estrutura: "saltos", cena: "torres",
    porQue: "Os jogadores mais valiosos ganham torres mais altas: olhar a lista “de cima” mostra só os destaques, e os saltos levam direto a qualquer página.",
  },
  "ir-para": {
    nome: "Ir para um nome", estrutura: "saltos", cena: "torres",
    porQue: "A busca desce pelas vias expressas até o primeiro nome a partir do que foi digitado — e, ao digitar a próxima letra, continua de onde parou.",
  },
  "minha-lista": {
    nome: "Minha lista", estrutura: "saltos", cena: "torres",
    porQue: "Adicionar e remover jogadores insere e retira torres da lista, mantendo-a em ordem alfabética.",
  },
  "buscas-recentes": {
    nome: "Buscas recentes", estrutura: "lista-inicio", cena: "lista",
    porQue: "O termo que você acabou de buscar passa a ser o primeiro; os mais antigos vão ficando para trás até sair.",
  },
  vistos: {
    nome: "Vistos por você", estrutura: "lista-transposicao", cena: "lista",
    porQue: "Cada nova visita adianta o jogador uma posição: quem você revisita sempre vai chegando à frente aos poucos.",
  },
  "em-alta": {
    nome: "Em alta", estrutura: "afunilada", cena: "arvore",
    porQue: "Mostra quem está no topo da árvore. Um jogador só é levado à raiz na 3ª visita, para um clique isolado não bagunçar a seção.",
  },
  valor: {
    nome: "Valor numa data e pico", estrutura: "avl", cena: "arvore",
    porQue: "Cada avaliação do jogador é um nó, ordenado pela data. Cada nó guarda o maior valor abaixo dele, então o pico de um período sai sem olhar data por data.",
  },
  faixa: {
    nome: "Faixa de valor", estrutura: "avl", cena: "arvore",
    porQue: "Os jogadores ficam ordenados pelo valor. Cada nó sabe quantos jogadores há abaixo dele, então contar uma faixa não exige visitá-la inteira.",
  },
  parecidos: {
    nome: "Parecidos", estrutura: "avl", cena: "arvore",
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
      case "nao_encontrado": quadro("Chegou ao fim sem achar: é um termo novo."); break;
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
  };
  quadro("A árvore antes da operação. A busca sempre começa pela raiz, no topo.");
  passos.forEach((p, indice) => {
    switch (p.passo) {
      case "etapa":
        atual = estrutura.raiz; visitados.clear(); marcas.clear();
        resumido = p.nome === "pagina"; // a seleção da página repete a ideia: um quadro basta
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
function cenaVetor(op) {
  const comparacoes = (op.rastro?.passos || []).filter((p) => p.passo === "compara" && p.meio !== undefined);
  const total = comparacoes.length ? comparacoes[0].meio * 2 + 1 : 0;
  let inf = 0;
  let sup = total - 1;
  const faixas = [{ restam: total, legenda: `A lista tem cerca de ${total.toLocaleString("pt-BR")} trechos de nomes, em ordem alfabética.` }];
  for (const p of comparacoes) {
    if (p.decisao === "esquerda") sup = p.meio - 1; else inf = p.meio + 1;
    const restam = Math.max(0, sup - inf + 1);
    faixas.push({
      restam, pivo: nomeDoNo(p.no),
      legenda: `Abre no meio: “${nomeDoNo(p.no)}”. O alvo vem ${p.decisao === "esquerda" ? "antes" : "depois"} — descarta a outra metade. Restam ${restam.toLocaleString("pt-BR")}.`,
    });
  }
  if (faixas.length > 1) faixas[faixas.length - 1].legenda = `Com ${comparacoes.length} comparações chegou ao ponto exato da lista — sem ler os ${total.toLocaleString("pt-BR")} nomes.`;
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

// ================================================================ reprodutor
const CENAS = { lista: cenaLista, torres: cenaTorres, arvore: cenaArvore, vetor: cenaVetor };

/**
 * Monta a animação de uma operação dentro de `container`.
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
    <div class="controles">
      <button class="botao icone-so" data-acao="inicio" aria-label="Voltar ao início">${icone("voltar")}</button>
      <button class="botao icone-so" data-acao="tocar" aria-label="Tocar ou pausar"></button>
      <button class="botao icone-so" data-acao="passo" aria-label="Próximo passo">${icone("avancar")}</button>
      <span class="num" data-contagem></span>
    </div>`;
  const svg = container.querySelector("svg");
  const legenda = container.querySelector(".legenda");
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
    contagem.textContent = `${indice + 1} / ${total}`;
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

  container.querySelector('[data-acao="inicio"]').addEventListener("click", () => { parar(); mostrar(0, false); });
  container.querySelector('[data-acao="passo"]').addEventListener("click", () => { parar(); mostrar(indice + 1); });
  botaoTocar.addEventListener("click", () => { if (relogio) { parar(); mostrar(indice); } else tocar(); });

  mostrar(0, false);
  if (reduzirMovimento()) mostrar(total - 1, false); // sem animação: mostra o resultado
  else if (total > 1) tocar();
  return parar;
}
