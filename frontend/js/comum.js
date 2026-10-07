// Componentes compartilhados: topo, busca, cards, formatação e o painel
// "Bastidores" — onde ficam os detalhes técnicos (passos de cada operação e a
// escolha entre as versões modificada e clássica das estruturas).

import { api, definirModo, modoAtual } from "./api.js";

// ------------------------------------------------------------------ ícones
// Conjunto único: Lucide (https://lucide.dev, licença ISC), embutido como SVG.
const ICONES = {
  busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  anterior: '<path d="m15 18-6-6 6-6"/>',
  proximo: '<path d="m9 18 6-6-6-6"/>',
  lua: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  bastidores: '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
};
export const icone = (nome) =>
  `<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome]}</svg>`;

// -------------------------------------------------------------- formatação
export function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

export function formatarValor(valor) {
  if (valor === null || valor === undefined) return "—";
  if (valor >= 1e9) return `€${(valor / 1e9).toFixed(1).replace(".", ",")} bi`;
  if (valor >= 1e6) {
    const m = valor / 1e6;
    return `€${m >= 100 || Number.isInteger(m) ? Math.round(m) : m.toFixed(1).replace(".", ",")}M`;
  }
  if (valor >= 1e3) return `€${Math.round(valor / 1e3)}K`;
  return `€${valor}`;
}

export function formatarData(iso) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

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

/** Rótulo de um nó do rastro: "erling haaland|418560" -> "erling haaland". */
export function nomeDoNo(no) {
  if (no === null || no === undefined) return "—";
  const texto = String(no);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return formatarData(texto);
  return texto.split("|")[0];
}

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

export function cardJogador(j, i = 0) {
  return `
    <a class="card entrar" href="jogador.html?id=${j.id}" style="--i:${Math.min(i, 16)}">
      ${fotoHTML(j.foto, j.nome)}
      <div>
        <div class="nome">${esc(j.nome)}</div>
        <div class="sub">${esc(j.clube_nome || traduzirPosicao(j.posicao))}</div>
      </div>
      <div class="num">${formatarValor(j.valor)}</div>
    </a>`;
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
      <a class="marca" href="index.html">Scout Explorer</a>
      ${busca ? `<div id="busca-topo"></div>` : ""}
      <div class="acoes">
        <button class="botao icone-so" data-tema></button>
        <button class="botao" data-bastidores aria-controls="bastidores">
          ${icone("bastidores")}<span>Bastidores</span><span class="num" data-contador>0</span>
        </button>
      </div>
    </div>`;
  const botaoTema = topo.querySelector("[data-tema]");
  atualizarBotaoTema(botaoTema);
  botaoTema.addEventListener("click", () => alternarTema(botaoTema));
  if (busca) montarBusca(document.getElementById("busca-topo"));
}

/** Campo de busca com sugestões. `grande` = versão de destaque da página inicial. */
export function montarBusca(caixa, { grande = false } = {}) {
  caixa.classList.add("busca");
  caixa.classList.toggle("grande", grande);
  caixa.innerHTML = `
    <div class="campo">
      ${icone("busca")}
      <input type="search" placeholder="Nome ou sobrenome do jogador" aria-label="Buscar jogador"
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
  const abrir = (jogador) => { location.href = `jogador.html?id=${jogador.id}`; };

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
          titulo: `Sugestões para “${q}”`,
          estrutura: "Lista ordenada · busca binária",
          rastro: resposta.rastro,
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
const operacoes = [];

function montarBastidores() {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="veu"></div>
    <aside class="bastidores" id="bastidores" aria-label="Bastidores" aria-hidden="true">
      <header>
        <h2 style="font-size:var(--t3)">Bastidores</h2>
        <button class="botao icone-so" data-fechar aria-label="Fechar">${icone("fechar")}</button>
      </header>
      <div class="corpo">
        <div class="versao">
          <span class="meta">Versão das estruturas</span>
          <div class="segmentado" role="group" aria-label="Versão das estruturas">
            <button data-modo="modificado">Modificada</button>
            <button data-modo="classico">Clássica</button>
          </div>
        </div>
        <div id="operacoes"><p class="meta">As operações feitas pelo site aparecem aqui, passo a passo.</p></div>
      </div>
    </aside>`);
  const painel = document.getElementById("bastidores");
  const veu = document.querySelector(".veu");
  const abrirFechar = (abrir) => {
    painel.classList.toggle("aberto", abrir);
    painel.setAttribute("aria-hidden", String(!abrir));
    veu.classList.toggle("visivel", abrir);
    if (abrir) painel.querySelector("[data-fechar]").focus();
  };
  document.querySelector("[data-bastidores]").addEventListener("click", () => abrirFechar(true));
  painel.querySelector("[data-fechar]").addEventListener("click", () => abrirFechar(false));
  veu.addEventListener("click", () => abrirFechar(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") abrirFechar(false); });

  const botoesModo = painel.querySelectorAll("[data-modo]");
  const marcarModo = () => botoesModo.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === modoAtual())));
  marcarModo();
  botoesModo.forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.modo === modoAtual()) return;
    definirModo(b.dataset.modo);
    marcarModo();
  }));
}

/** Registra uma operação: { titulo, estrutura, rastro: {passos, comparacoes}, resumo?: [texto] }. */
export function registrarOperacao(operacao) {
  operacao.modo = modoAtual();
  operacoes.unshift(operacao);
  operacoes.splice(12);
  const contador = document.querySelector("[data-contador]");
  if (contador) contador.textContent = operacoes.length;
  renderizarOperacoes();
}

const LIMITE_PASSOS = 200;
const PASSOS_CHAVE = ["encontrado", "pico", "raiz", "move_inicio", "avanca", "transpoe", "caso", "desbalanceado"];

function renderizarOperacoes() {
  const alvo = document.getElementById("operacoes");
  if (!alvo) return;
  alvo.innerHTML = operacoes.map((op, indice) => {
    const passos = op.rastro?.passos || [];
    const numeros = [`${op.rastro?.comparacoes ?? 0} comparações`, `${passos.length} passos`, ...(op.resumo || [])];
    return `
      <section class="operacao">
        <span class="estrutura">${esc(op.estrutura)} · ${op.modo === "classico" ? "clássica" : "modificada"}</span>
        <h3>${esc(op.titulo)}</h3>
        <span class="numeros num">${esc(numeros.join(" · "))}</span>
        ${indice === 0 && passos.length ? `
          <ol class="passos">
            ${passos.slice(0, LIMITE_PASSOS).map((p) =>
              `<li class="${PASSOS_CHAVE.includes(p.passo) ? "chave" : ""}">${esc(descreverPasso(p))}</li>`).join("")}
          </ol>
          ${passos.length > LIMITE_PASSOS ? `<p class="meta">… e mais ${passos.length - LIMITE_PASSOS} passos.</p>` : ""}` : ""}
      </section>`;
  }).join("");
}

const DIRECAO = { esquerda: "desce à esquerda", direita: "desce à direita", igual: "é igual — achou" };

/** Frase em português para um passo do rastro. */
export function descreverPasso(p) {
  const no = nomeDoNo(p.no);
  switch (p.passo) {
    case "compara":
      if (p.nivel !== undefined) {
        return p.decisao === "avanca"
          ? `Nível ${p.nivel}: “${no}” é menor — avança${p.largura ? ` (salta ${p.largura})` : ""}`
          : `Nível ${p.nivel}: ${p.no === "sentinela" ? "chegou ao sentinela" : `“${no}” não é menor`} — desce`;
      }
      if (p.posicao !== undefined) return `Posição ${p.posicao}: compara com “${no}” — ${p.igual ? "achou" : "não é"}`;
      if (p.meio !== undefined) return `Busca binária: meio = ${p.meio} (“${no}”), segue à ${p.decisao}`;
      if (p.decisao === "visita") return `Visita ${no} (percurso em ordem)`;
      return `Compara com “${no}”: ${DIRECAO[p.decisao] || p.decisao}`;
    case "inicio": return `Começa na cabeça, no nível ${p.nivel}`;
    case "encontrado": return `Encontrado: “${no}”${p.posicao ? ` (posição ${p.posicao})` : ""}`;
    case "nao_encontrado": return "Não encontrado";
    case "move_inicio": return `Move “${no}” da posição ${p.de} para o início`;
    case "transpoe": return `Troca “${no}” com “${nomeDoNo(p.com)}” (posição ${p.de} → ${p.para})`;
    case "pontua": return `“${no}” ganha 1 ponto — pontuação agora ${p.pontuacao}`;
    case "avanca": return `“${no}” avança da posição ${p.de} para ${p.para}, ultrapassando ${p.ultrapassados.length} liga(s)`;
    case "permanece": return `“${no}” permanece na posição ${p.posicao}`;
    case "rotacao": return `Rotação à ${p.direcao} em “${no}”: “${nomeDoNo(p.pivo)}” sobe`;
    case "caso": return `Caso ${p.caso} para “${nomeDoNo(p.alvo)}”`;
    case "raiz": return `“${no}” agora é a raiz`;
    case "acesso": return `Acesso ${p.contador} de ${p.limite} a “${no}”${p.contador < p.limite ? " — ainda não afunila" : " — afunila"}`;
    case "desbalanceado": return `“${no}” desbalanceado (fator ${p.fator}): caso ${p.caso}`;
    case "insere": return `Insere “${no}”`;
    case "salta": return `Nível ${p.nivel}: salta para “${no}” (posição ${p.posicao})`;
    case "desce": return `Desce do nível ${p.nivel}`;
    case "percorre": return `Percorre ${p.nos} nós do nível 0, um a um, até a página pedida`;
    case "divide": return `Primeiro nó dentro do período: ${no}`;
    case "subarvore_inteira": return `Subárvore de ${no} cabe inteira no período — usa o máximo guardado (${formatarValor(p.max_sub)})`;
    case "descarta": return `Descarta a subárvore de ${no} (fora do período)`;
    case "segue_maximo": return `Segue o máximo até ${no}`;
    case "pico": return `Pico: ${no} — ${formatarValor(p.valor)}`;
    case "nivel_por_valor": return `Nível de “${no}” pelo valor: ${p.nivel}`;
    case "sorteio": return `Moeda sorteou o nível ${p.nivel} para “${no}”`;
    case "liga": return `Liga “${no}” no nível ${p.nivel}`;
    default: return `${p.passo} ${p.no ? no : ""}`;
  }
}

// --------------------------------------------------------------- frequentes
/** Preenche a fileira de jogadores vistos; esconde `secao` se estiver vazia. */
export async function montarFrequentes(elemento, secao) {
  try {
    const { jogadores } = await api.frequentes();
    secao?.classList.toggle("oculto", !jogadores.length);
    elemento.innerHTML = jogadores.map((j) => `
      <a class="frequente" href="jogador.html?id=${j.id}">${fotoHTML(j.foto, j.nome, "avatar")}${esc(j.nome)}</a>`).join("");
  } catch {
    secao?.classList.add("oculto");
  }
}

// ------------------------------------------------------------------ página
export function iniciarPagina(opcoes) {
  montarTopo(opcoes);
  montarBastidores();
}
