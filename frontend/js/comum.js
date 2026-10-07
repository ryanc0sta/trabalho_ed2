// Componentes compartilhados: topo, busca, cards, formatação e o painel
// "Bastidores" — onde ficam os detalhes técnicos (passos de cada operação e a
// escolha entre as versões modificada e clássica das estruturas).

import { api, definirModo, modoAtual } from "./api.js?v=6";
import { descreverPasso, esc, formatarData, formatarValor, icone, nomeDoNo } from "./formato.js?v=6";

import { ESTRUTURAS, FERRAMENTAS, montarAnimacao, nomeDoTipo, selo } from "./estruturas.js?v=6";

export { descreverPasso, esc, formatarData, formatarValor, icone, nomeDoNo, selo };

// -------------------------------------------------------------- formatação
export function idade(nascimento) {
  if (!nascimento) return null;
  const hoje = new Date();
  const n = new Date(nascimento + "T00:00:00");
  let anos = hoje.getFullYear() - n.getFullYear();
  if (hoje < new Date(hoje.getFullYear(), n.getMonth(), n.getDate())) anos -= 1;
  return anos;
}

const POSICOES = {
  Attack: "Ataque", Midfield: "Meio-campo", Defender: "Defesa", Goalkeeper: "Goleiro",
  "Centre-Forward": "Centroavante", "Second Striker": "Segundo atacante",
  "Left Winger": "Ponta esquerda", "Right Winger": "Ponta direita",
  "Attacking Midfield": "Meia ofensivo", "Central Midfield": "Meio-campista",
  "Defensive Midfield": "Volante", "Left Midfield": "Meia esquerda", "Right Midfield": "Meia direita",
  "Centre-Back": "Zagueiro", "Left-Back": "Lateral esquerdo", "Right-Back": "Lateral direito",
};
export const traduzirPosicao = (p) => POSICOES[p] || p || "—";
export const traduzirPe = (p) => ({ right: "Direito", left: "Esquerdo", both: "Ambos" })[p] || "—";

export function parametro(nome) {
  return new URLSearchParams(location.search).get(nome);
}

// ------------------------------------------------------------ fotos e cards
const iniciais = (nome) =>
  String(nome || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

/** <img> da foto; se faltar ou falhar, mostra as iniciais. */
export function fotoHTML(url, nome, classe = "foto") {
  if (!url) return `<div class="${classe} sem-foto" aria-hidden="true">${esc(iniciais(nome))}</div>`;
  return `<img class="${classe}" src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer"
    data-iniciais="${esc(iniciais(nome))}">`;
}

document.addEventListener("error", (evento) => {
  const img = evento.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.iniciais) return;
  const div = document.createElement("div");
  div.className = `${img.className} sem-foto`;
  div.textContent = img.dataset.iniciais;
  img.replaceWith(div);
}, true);

/** Card de jogador. `legenda` troca a linha do clube (ex.: o motivo de uma recomendação). */
export function cardJogador(j, i = 0, legenda = null) {
  return `
    <a class="card entrar" href="jogador.html?id=${j.id}" style="--i:${Math.min(i, 16)}">
      ${fotoHTML(j.foto, j.nome)}
      <div>
        <div class="nome">${esc(j.nome)}</div>
        <div class="sub${legenda ? " motivo" : ""}">${esc(legenda || j.clube_nome || traduzirPosicao(j.posicao))}</div>
      </div>
      <div class="num">${formatarValor(j.valor)}</div>
    </a>`;
}

/**
 * Reordena os filhos de `container` (identificados por data-id) para `novaOrdem`,
 * fazendo cada um deslizar do lugar antigo até o novo.
 */
export function reordenarComAnimacao(container, novaOrdem) {
  const itens = [...container.children];
  const antes = new Map(itens.map((e) => [e.dataset.id, e.getBoundingClientRect()]));
  novaOrdem.forEach((id) => {
    const item = itens.find((e) => e.dataset.id === String(id));
    if (item) container.appendChild(item);
  });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const e of container.children) {
    const a = antes.get(e.dataset.id);
    const d = e.getBoundingClientRect();
    if (!a || (a.left === d.left && a.top === d.top)) continue;
    e.animate([{ transform: `translate(${a.left - d.left}px, ${a.top - d.top}px)` }, { transform: "none" }],
      { duration: 420, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
  }
}

export function esqueletos(quantidade, estilo = "aspect-ratio:4/5") {
  return Array.from({ length: quantidade }, () => `<div class="esqueleto" style="${estilo}"></div>`).join("");
}

export function mostrarErro(elemento, erro) {
  elemento.innerHTML = `<p class="aviso">Não foi possível carregar (${esc(erro.message)}). Verifique se o servidor está rodando.</p>`;
}

/** Conta de 0 até o valor, como um placar. */
export function animarNumero(elemento, valorFinal, formatar = formatarValor, duracao = 700) {
  if (valorFinal === null || valorFinal === undefined || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elemento.textContent = formatar(valorFinal);
    return;
  }
  const inicio = performance.now();
  const quadro = (agora) => {
    const t = Math.min(1, (agora - inicio) / duracao);
    elemento.textContent = formatar(Math.round(valorFinal * (1 - Math.pow(1 - t, 3))));
    if (t < 1) requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

// -------------------------------------------------------------------- tema
function temaAtual() {
  const definido = document.documentElement.dataset.tema;
  if (definido) return definido;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

function alternarTema(botao) {
  const novo = temaAtual() === "escuro" ? "claro" : "escuro";
  document.documentElement.dataset.tema = novo;
  try {
    localStorage.setItem("tema", novo);
  } catch {
    /* sem armazenamento: vale até recarregar */
  }
  atualizarBotaoTema(botao);
  window.dispatchEvent(new CustomEvent("tema", { detail: novo }));
}

function atualizarBotaoTema(botao) {
  const escuro = temaAtual() === "escuro";
  botao.innerHTML = icone(escuro ? "sol" : "lua");
  botao.setAttribute("aria-label", escuro ? "Usar tema claro" : "Usar tema escuro");
  botao.title = botao.getAttribute("aria-label");
}

// -------------------------------------------------------------------- topo
function montarTopo({ busca = true } = {}) {
  const topo = document.getElementById("topo");
  topo.className = "topo";
  topo.innerHTML = `
    <div class="container">
      <button class="botao icone-so" data-menu aria-label="Abrir ferramentas" aria-controls="lateral">${icone("menu")}</button>
      <a class="marca" href="index.html">Scout Explorer</a>
      ${busca ? `<div id="busca-topo"></div>` : ""}
      <div class="acoes">
        <button class="botao icone-so" data-tema></button>
        <button class="botao" data-bastidores aria-controls="bastidores">
          ${icone("bastidores")}<span>Bastidores</span><i class="ponto oculto" data-novo aria-label="há uma nova animação"></i>
        </button>
      </div>
    </div>`;
  const botaoTema = topo.querySelector("[data-tema]");
  atualizarBotaoTema(botaoTema);
  botaoTema.addEventListener("click", () => alternarTema(botaoTema));
  if (busca) montarBusca(document.getElementById("busca-topo"));
}

/** Campo de busca com sugestões. `grande` = versão de destaque da página inicial. */
/** `aoEscolher(jogador)`: em vez de abrir o perfil, entrega o jogador escolhido (ex.: Comparar). */
export function montarBusca(caixa, { grande = false, aoEscolher = null, dica = "Nome ou sobrenome do jogador" } = {}) {
  caixa.classList.add("busca");
  caixa.classList.toggle("grande", grande);
  caixa.innerHTML = `
    <div class="campo">
      ${icone("busca")}
      <input type="search" placeholder="${esc(dica)}" aria-label="Buscar jogador"
        autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list">
    </div>
    <div class="sugestoes oculto" role="listbox"></div>`;
  const entrada = caixa.querySelector("input");
  const lista = caixa.querySelector(".sugestoes");
  let itens = [];
  let selecionado = -1;
  let espera = null;
  let pedido = 0;

  const fechar = () => {
    lista.classList.add("oculto");
    entrada.setAttribute("aria-expanded", "false");
    selecionado = -1;
  };
  const marcar = () => lista.querySelectorAll(".sugestao").forEach((el, i) =>
    el.setAttribute("aria-selected", String(i === selecionado)));
  const abrir = async (jogador) => {
    if (aoEscolher) {
      entrada.value = "";
      fechar();
      aoEscolher(jogador);
      return;
    }
    try {
      const termo = entrada.value.trim();
      const resposta = await api.registrarBusca(termo); // entra nas "buscas recentes"
      const itens = (termos) => termos.map((t) => ({ id: t, rotulo: t, titulo: t }));
      registrarOperacao({
        ferramenta: "buscas-recentes",
        titulo: `Busca por “${termo}”`,
        rastro: resposta.rastro,
        cena: { antes: itens(resposta.antes), depois: itens(resposta.buscas) },
        resultado: `“${resposta.buscas[0]}” agora é a primeira das buscas recentes.`,
      });
    } catch {
      /* não impede a navegação */
    }
    location.href = `jogador.html?id=${jogador.id}`;
  };

  entrada.addEventListener("input", () => {
    clearTimeout(espera);
    const q = entrada.value.trim();
    if (!q) return fechar();
    espera = setTimeout(async () => {
      const meu = ++pedido;
      try {
        const resposta = await api.busca(q, 6);
        if (meu !== pedido) return;
        itens = resposta.sugestoes;
        selecionado = itens.length ? 0 : -1;
        lista.innerHTML = itens.length
          ? itens.map((j, i) => `
              <div class="sugestao" role="option" data-i="${i}">
                ${fotoHTML(j.foto, j.nome, "avatar")}
                <div><div class="nome">${esc(j.nome)}</div><div class="meta">${esc(j.clube_nome || "")}</div></div>
                <span class="num">${formatarValor(j.valor)}</span>
              </div>`).join("")
          : `<div class="sugestao vazia">Nenhum jogador encontrado.</div>`;
        marcar();
        lista.classList.remove("oculto");
        entrada.setAttribute("aria-expanded", "true");
        registrarOperacao({
          ferramenta: "busca",
          acao: true,
          titulo: `Busca por “${q}”`,
          rastro: resposta.rastro,
          resultado: `${resposta.rastro.comparacoes} comparações para chegar às sugestões de “${q}”.`,
        });
      } catch {
        fechar();
      }
    }, 140);
  });

  entrada.addEventListener("keydown", (e) => {
    if (lista.classList.contains("oculto") || !itens.length) return;
    if (e.key === "ArrowDown") { selecionado = (selecionado + 1) % itens.length; marcar(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { selecionado = (selecionado - 1 + itens.length) % itens.length; marcar(); e.preventDefault(); }
    else if (e.key === "Enter" && selecionado >= 0) abrir(itens[selecionado]);
    else if (e.key === "Escape") fechar();
  });
  lista.addEventListener("mousedown", (e) => {
    const el = e.target.closest(".sugestao[data-i]");
    if (el) abrir(itens[Number(el.dataset.i)]);
  });
  entrada.addEventListener("blur", () => setTimeout(fechar, 120));
  return entrada;
}

// -------------------------------------------------------------- bastidores
// O painel explica UMA ferramenta por vez: qual estrutura ela usa, por quê, e
// uma animação da última operação feita (a partir do rastro real do servidor).
// A última operação de cada ferramenta fica na sessão, para continuar
// disponível ao trocar de página.
const CHAVE_OPERACOES = "bastidores";
const operacoes = lerOperacoes();
let ferramentaAtual = null;
let pararAnimacao = () => {};

function lerOperacoes() {
  const vazio = { porFerramenta: {}, ultima: null, historico: [] };
  try {
    return { ...vazio, ...JSON.parse(sessionStorage.getItem(CHAVE_OPERACOES)) };
  } catch {
    return vazio;
  }
}

function guardarOperacoes() {
  try {
    sessionStorage.setItem(CHAVE_OPERACOES, JSON.stringify(operacoes));
  } catch {
    /* sem espaço ou sem armazenamento: as operações valem só nesta página */
  }
}

function montarBastidores() {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="veu"></div>
    <aside class="bastidores" id="bastidores" aria-label="Bastidores" aria-hidden="true">
      <header>
        <h2 style="font-size:var(--t3)">Bastidores</h2>
        <button class="botao icone-so" data-fechar aria-label="Fechar">${icone("fechar")}</button>
      </header>
      <div class="corpo">
        <section id="explicacao"></section>
        <section class="mapa" id="acoes"></section>
        <section class="mapa" id="mapa"></section>
        <div class="versao">
          <span class="meta">Versão das estruturas (para comparar)</span>
          <div class="segmentado" role="group" aria-label="Versão das estruturas">
            <button data-modo="modificado">Modificada</button>
            <button data-modo="classico">Clássica</button>
          </div>
        </div>
      </div>
    </aside>`);
  const painel = document.getElementById("bastidores");
  const veu = document.querySelector(".veu");
  document.querySelector("[data-bastidores]").addEventListener("click", () => abrirBastidores());
  painel.querySelector("[data-fechar]").addEventListener("click", fecharBastidores);
  veu.addEventListener("click", fecharBastidores);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharBastidores(); });
  // Selos espalhados pelo site e linhas do mapa abrem a explicação da ferramenta.
  document.addEventListener("click", (e) => {
    const alvo = e.target.closest("[data-selo]");
    if (alvo) {
      e.preventDefault();
      abrirBastidores(alvo.dataset.selo);
    }
  });
  painel.querySelector(".corpo").addEventListener("click", (e) => {
    const linha = e.target.closest("[data-ferramenta]");
    if (linha) mostrarFerramenta(linha.dataset.ferramenta);
  });
  montarAviso();

  const botoesModo = painel.querySelectorAll("[data-modo]");
  const marcarModo = () => botoesModo.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === modoAtual())));
  marcarModo();
  botoesModo.forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.modo === modoAtual()) return;
    definirModo(b.dataset.modo);
    marcarModo();
  }));
}

/** Abre o painel na ferramenta indicada (ou na da última operação feita). */
export function abrirBastidores(ferramenta) {
  const painel = document.getElementById("bastidores");
  painel.classList.add("aberto");
  painel.setAttribute("aria-hidden", "false");
  document.querySelector(".veu").classList.add("visivel");
  document.querySelector("[data-novo]")?.classList.add("oculto");
  mostrarFerramenta(FERRAMENTAS[ferramenta] ? ferramenta : operacoes.ultima || "busca");
  painel.querySelector("[data-fechar]").focus();
}

function fecharBastidores() {
  const painel = document.getElementById("bastidores");
  pararAnimacao();
  painel.classList.remove("aberto");
  painel.setAttribute("aria-hidden", "true");
  document.querySelector(".veu").classList.remove("visivel");
}

function mostrarFerramenta(id) {
  ferramentaAtual = id;
  pararAnimacao();
  const ferramenta = FERRAMENTAS[id];
  const estrutura = ESTRUTURAS[ferramenta.estrutura];
  const op = operacoes.porFerramenta[id];
  const passos = op?.rastro?.passos || [];
  const alvo = document.getElementById("explicacao");
  alvo.innerHTML = `
    <p class="tipo">${icone(estrutura.tipo)}${nomeDoTipo(estrutura.tipo)}</p>
    <h3 class="nome-estrutura">${esc(estrutura.nome)}</h3>
    <p>${esc(estrutura.oQue)}</p>
    <p class="porque"><b>${esc(ferramenta.nome)}.</b> ${esc(ferramenta.porQue)}</p>
    ${op ? `
      <div class="operacao">
        <p class="acao-feita"><span class="meta">Sua ação${op.modo === "classico" ? " · versão clássica" : ""}</span><b>${esc(op.titulo)}</b></p>
        <div id="animacao"></div>
        ${op.resultado ? `<p class="resultado">${esc(op.resultado)}</p>` : ""}
        ${passos.length ? `
          <details>
            <summary>Ver os ${passos.length} passos em texto</summary>
            <ol class="passos">${passos.slice(0, 200).map((p) => `<li>${esc(descreverPasso(p))}</li>`).join("")}</ol>
          </details>` : ""}
      </div>`
    : `
      <div class="operacao">
        <p class="meta">Você ainda não usou esta ferramenta. Use-a e a animação do que aconteceu aparece aqui.</p>
        ${ferramenta.onde ? `<a class="botao" href="${esc(ferramenta.onde.href)}">${esc(ferramenta.onde.texto)}</a>` : ""}
      </div>`}`;
  if (op) pararAnimacao = montarAnimacao(document.getElementById("animacao"), op);
  renderizarAcoes();
  renderizarMapa();
  document.querySelector("#bastidores .corpo").scrollTop = 0;
}

/** Histórico: as últimas ações do usuário e a estrutura que cada uma usou. */
function renderizarAcoes() {
  const alvo = document.getElementById("acoes");
  if (!operacoes.historico.length) {
    alvo.innerHTML = "";
    return;
  }
  alvo.innerHTML = `
    <h3>Suas últimas ações</h3>
    <ul>${operacoes.historico.map((a) => `
      <li><button type="button" data-ferramenta="${esc(a.ferramenta)}" ${a.ferramenta === ferramentaAtual ? 'aria-current="true"' : ""}>
        <span>${esc(a.titulo)}</span><span class="meta">${esc(ESTRUTURAS[FERRAMENTAS[a.ferramenta].estrutura].nome)}</span>
      </button></li>`).join("")}</ul>`;
}

function renderizarMapa() {
  const linha = ([id, f]) => `
    <li><button type="button" data-ferramenta="${id}" ${id === ferramentaAtual ? 'aria-current="true"' : ""}>
      <span>${esc(f.nome)}</span><span class="meta">${esc(ESTRUTURAS[f.estrutura].nome)}</span>
    </button></li>`;
  const doTipo = (tipo) => Object.entries(FERRAMENTAS).filter(([, f]) => ESTRUTURAS[f.estrutura].tipo === tipo);
  document.getElementById("mapa").innerHTML = `
    <h3>O que cada ferramenta usa</h3>
    ${["linear", "hierarquica"].map((tipo) => `
      <p class="tipo">${icone(tipo)}${tipo === "linear" ? "Estruturas lineares" : "Estruturas hierárquicas"}</p>
      <ul>${doTipo(tipo).map(linha).join("")}</ul>`).join("")}`;
}

/**
 * Registra a última operação de uma ferramenta para os Bastidores.
 * { ferramenta, titulo, rastro: {passos, comparacoes}, cena?: dados do desenho,
 *   resultado?: frase final, acao?: true se veio de uma ação direta do usuário }
 * Ações diretas entram no histórico e mostram o aviso "você acabou de usar…".
 */
export function registrarOperacao(operacao) {
  if (!FERRAMENTAS[operacao.ferramenta]) return;
  const { acao, ...op } = operacao;
  op.modo = modoAtual();
  operacoes.porFerramenta[op.ferramenta] = op;
  operacoes.ultima = op.ferramenta;
  if (acao) {
    // Repetições seguidas da mesma ferramenta (digitar, arrastar) ocupam uma linha só.
    if (operacoes.historico[0]?.ferramenta === op.ferramenta) operacoes.historico.shift();
    operacoes.historico.unshift({ ferramenta: op.ferramenta, titulo: op.titulo });
    operacoes.historico.splice(8);
  }
  guardarOperacoes();
  const painel = document.getElementById("bastidores");
  if (painel?.classList.contains("aberto")) {
    if (ferramentaAtual === op.ferramenta) mostrarFerramenta(op.ferramenta);
    return;
  }
  document.querySelector("[data-novo]")?.classList.remove("oculto");
  if (acao) mostrarAviso(op);
}

// ------------------------------------------------- aviso "você acabou de usar"
let relogioAviso = null;

function montarAviso() {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="aviso-uso" id="aviso-uso" role="status" aria-live="polite">
      <span data-icone></span>
      <div class="texto">
        <span class="meta">Você acabou de usar</span>
        <b data-estrutura></b>
        <span class="meta" data-titulo></span>
      </div>
      <button class="botao pequeno" data-ver>Ver como</button>
      <button class="botao icone-so" data-dispensar aria-label="Dispensar">${icone("fechar")}</button>
    </div>`);
  const aviso = document.getElementById("aviso-uso");
  aviso.querySelector("[data-ver]").addEventListener("click", () => {
    esconderAviso();
    abrirBastidores(aviso.dataset.ferramenta);
  });
  aviso.querySelector("[data-dispensar]").addEventListener("click", esconderAviso);
  aviso.addEventListener("mouseenter", () => clearTimeout(relogioAviso));
  aviso.addEventListener("mouseleave", () => { relogioAviso = setTimeout(esconderAviso, 3000); });
}

function mostrarAviso(op) {
  const aviso = document.getElementById("aviso-uso");
  if (!aviso) return;
  const estrutura = ESTRUTURAS[FERRAMENTAS[op.ferramenta].estrutura];
  aviso.dataset.ferramenta = op.ferramenta;
  aviso.querySelector("[data-icone]").innerHTML = icone(estrutura.tipo);
  aviso.querySelector("[data-estrutura]").textContent = estrutura.nome;
  aviso.querySelector("[data-titulo]").textContent = op.titulo;
  aviso.classList.add("visivel");
  clearTimeout(relogioAviso);
  relogioAviso = setTimeout(esconderAviso, 7000);
}

function esconderAviso() {
  clearTimeout(relogioAviso);
  document.getElementById("aviso-uso")?.classList.remove("visivel");
}

// --------------------------------------------------------------- frequentes
/** Preenche a fileira de jogadores vistos; esconde `secao` se estiver vazia. */
export async function montarFrequentes(elemento, secao) {
  try {
    const { jogadores } = await api.frequentes();
    secao?.classList.toggle("oculto", !jogadores.length);
    elemento.innerHTML = jogadores.map((j) => `
      <a class="frequente" href="jogador.html?id=${j.id}">${fotoHTML(j.foto, j.nome, "avatar")}<span class="nome">${esc(j.nome)}</span></a>`).join("");
  } catch {
    secao?.classList.add("oculto");
  }
}

// ------------------------------------------------------------ barra lateral
const PAGINAS = [
  { grupo: "Explorar", itens: [
    { href: "index.html", icone: "inicio", texto: "Início" },
    { href: "posicoes.html", icone: "posicoes", texto: "Por posição" },
    { href: "faixa.html", icone: "faixa", texto: "Faixa de valor" },
    { href: "transferencias.html", icone: "transferencias", texto: "Transferências" },
    { href: "comparar.html", icone: "comparar", texto: "Comparar" },
  ] },
  { grupo: "Seu espaço", itens: [
    { href: "lista.html", icone: "marcador", texto: "Minha lista", contador: "minha_lista" },
  ] },
];

function montarLateral() {
  document.body.insertAdjacentHTML("beforeend", `<aside class="lateral" id="lateral" aria-label="Ferramentas"></aside>`);
  const lateral = document.getElementById("lateral");
  const veu = document.querySelector(".veu");
  const abrirFechar = (abrir) => {
    lateral.classList.toggle("aberta", abrir);
    veu.classList.toggle("visivel", abrir);
  };
  document.querySelector("[data-menu]").addEventListener("click", () => abrirFechar(true));
  veu.addEventListener("click", () => abrirFechar(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") abrirFechar(false); });
  lateral.addEventListener("click", async (e) => {
    if (!e.target.closest("[data-limpar-buscas]")) return;
    try {
      const resposta = await api.limparBuscas();
      const itens = (termos) => termos.map((t) => ({ id: t, rotulo: t, titulo: t }));
      const n = resposta.antes.length;
      registrarOperacao({
        ferramenta: "buscas-recentes",
        acao: true,
        titulo: "Limpar as buscas recentes",
        rastro: resposta.rastro,
        cena: { antes: itens(resposta.antes), depois: [] },
        resultado: `${n === 1 ? "A busca foi apagada" : `As ${n} buscas foram apagadas`} de uma vez, sem percorrer a lista.`,
      });
      atualizarLateral();
    } catch {
      /* a lista continua como estava */
    }
  });
  renderizarLateral({ minha_lista: 0, buscas: [], vistos: [] });
  atualizarLateral();
}

function renderizarLateral(dados) {
  const lateral = document.getElementById("lateral");
  if (!lateral) return;
  const atual = location.pathname.split("/").pop() || "index.html";
  lateral.innerHTML = `
    <a class="marca" href="index.html">Scout Explorer</a>
    ${PAGINAS.map((g) => `
      <nav aria-label="${esc(g.grupo)}">
        <h2>${esc(g.grupo)}</h2>
        ${g.itens.map((i) => `
          <a class="item" href="${i.href}" ${i.href === atual ? 'aria-current="page"' : ""}>
            ${icone(i.icone)}<span class="texto">${esc(i.texto)}</span>
            ${i.contador ? `<span class="num">${dados[i.contador]}</span>` : ""}
          </a>`).join("")}
      </nav>`).join("")}
    ${dados.buscas.length ? `
      <nav aria-label="Buscas recentes">
        <h2>Buscas recentes ${selo("buscas-recentes", { soIcone: true })}</h2>
        ${dados.buscas.map((termo) => `
          <a class="item fino" href="index.html?q=${encodeURIComponent(termo)}">${icone("relogio")}<span class="texto">${esc(termo)}</span></a>`).join("")}
        <button class="limpar" type="button" data-limpar-buscas>Limpar buscas</button>
      </nav>` : ""}
    ${dados.vistos.length ? `
      <nav aria-label="Vistos por você">
        <h2>Vistos por você ${selo("vistos", { soIcone: true })}</h2>
        ${dados.vistos.map((j) => `
          <a class="item fino" href="jogador.html?id=${j.id}">${fotoHTML(j.foto, j.nome, "avatar")}<span class="texto">${esc(j.nome)}</span></a>`).join("")}
      </nav>` : ""}`;
}

/** Recarrega os contadores e as listas da barra lateral. */
export async function atualizarLateral() {
  try {
    renderizarLateral(await api.lateral());
  } catch {
    /* sem servidor: a barra fica só com os links */
  }
}

// ------------------------------------------------------------------ página
export function iniciarPagina(opcoes) {
  montarTopo(opcoes);
  montarBastidores();
  montarLateral();
  // Marcadores <span data-selo-de="ferramenta"> do HTML viram selos clicáveis.
  document.querySelectorAll("[data-selo-de]").forEach((marcador) => { marcador.outerHTML = selo(marcador.dataset.seloDe); });
}
