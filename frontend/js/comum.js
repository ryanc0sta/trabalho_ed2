// Componentes compartilhados: topo (busca + modo), cards, formatação e o
// painel "Por dentro da estrutura", que lista as operações feitas.

import { api, definirModo, modoAtual } from "./api.js";

// ------------------------------------------------------------- formatação
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

const iniciais = (nome) =>
  String(nome || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

/** <img> da foto com troca automática pelas iniciais se falhar. */
export function fotoHTML(url, nome, classe = "foto") {
  const reserva = `<div class="${classe} sem-foto">${esc(iniciais(nome))}</div>`;
  if (!url) return reserva;
  return `<img class="${classe}" src="${esc(url)}" alt="${esc(nome)}" loading="lazy"
    referrerpolicy="no-referrer" data-iniciais="${esc(iniciais(nome))}">`;
}

// Substitui fotos que falharam (delegação: vale para imagens criadas depois).
document.addEventListener("error", (evento) => {
  const img = evento.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.iniciais) return;
  const div = document.createElement("div");
  div.className = `${img.className} sem-foto`;
  div.textContent = img.dataset.iniciais;
  img.replaceWith(div);
}, true);

export function cardJogador(j, i = 0, selo = "") {
  const sub = [traduzirPosicao(j.sub_posicao || j.posicao), j.clube_nome].filter(Boolean).join(" · ");
  return `
    <a class="card" href="jogador.html?id=${j.id}" style="--i:${i}">
      ${fotoHTML(j.foto, j.nome)}
      ${selo}
      <div class="info">
        <span class="nome">${esc(j.nome)}</span>
        <span class="sub">${esc(sub)}</span>
        <span class="valor">${formatarValor(j.valor)}</span>
      </div>
    </a>`;
}

export function esqueletos(quantidade, classe = "card-esqueleto") {
  return Array.from({ length: quantidade }, () => `<div class="esqueleto ${classe}"></div>`).join("");
}

export function mostrarErro(elemento, erro) {
  elemento.innerHTML = `<div class="aviso">Não foi possível carregar: ${esc(erro.message)}.
    O servidor está rodando com os CSVs em <code>dados/</code>?</div>`;
}

/** Conta de 0 até o valor (efeito de placar). */
export function animarNumero(elemento, valorFinal, formatar = formatarValor, duracao = 900) {
  if (valorFinal === null || valorFinal === undefined) {
    elemento.textContent = formatar(valorFinal);
    return;
  }
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzir) {
    elemento.textContent = formatar(valorFinal);
    return;
  }
  const inicio = performance.now();
  const quadro = (agora) => {
    const t = Math.min(1, (agora - inicio) / duracao);
    const suave = 1 - Math.pow(1 - t, 3);
    elemento.textContent = formatar(Math.round(valorFinal * suave));
    if (t < 1) requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

// ------------------------------------------------------------------- topo
function montarTopo() {
  const topo = document.getElementById("topo");
  topo.className = "topo";
  topo.innerHTML = `
    <div class="container">
      <a class="marca" href="index.html"><div class="bola"></div><span>Scout<b>Explorer</b></span></a>
      <div class="busca" role="combobox" aria-expanded="false" aria-haspopup="listbox">
        <svg class="lupa" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="search" placeholder="Buscar jogador por nome ou sobrenome…" aria-label="Buscar jogador" autocomplete="off">
        <div class="sugestoes oculto" role="listbox"></div>
      </div>
      <div class="modo" role="group" aria-label="Versão das estruturas">
        <button data-modo="modificado" title="Estruturas com as modificações do trabalho">Modificado</button>
        <button data-modo="classico" title="Estruturas clássicas, como vistas em aula">Clássico</button>
      </div>
    </div>`;

  const botoes = topo.querySelectorAll(".modo button");
  const marcar = () => botoes.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === modoAtual())));
  marcar();
  botoes.forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.modo === modoAtual()) return;
    definirModo(b.dataset.modo);
    marcar();
  }));

  montarBusca(topo.querySelector(".busca"));
}

function montarBusca(caixa) {
  const entrada = caixa.querySelector("input");
  const lista = caixa.querySelector(".sugestoes");
  let itens = [];
  let selecionado = -1;
  let espera = null;
  let pedido = 0;

  const fechar = () => {
    lista.classList.add("oculto");
    caixa.setAttribute("aria-expanded", "false");
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
        const resposta = await api.busca(q, 8);
        if (meu !== pedido) return; // chegou uma resposta mais nova
        itens = resposta.sugestoes;
        selecionado = itens.length ? 0 : -1;
        lista.innerHTML = itens.length
          ? itens.map((j, i) => `
              <div class="sugestao" role="option" data-i="${i}">
                ${fotoHTML(j.foto, j.nome, "mini")}
                <div><div class="nome">${esc(j.nome)}</div>
                  <div class="pequeno mudo">${esc(j.clube_nome || "")}${j.ativo ? "" : " · inativo"}</div></div>
                <span class="valor">${formatarValor(j.valor)}</span>
              </div>`).join("")
          : `<div class="sugestao vazia">Nenhum jogador encontrado para “${esc(q)}”.</div>`;
        marcar();
        lista.classList.remove("oculto");
        caixa.setAttribute("aria-expanded", "true");
        registrarOperacao({
          titulo: `Autocompletar “${q}”`,
          estrutura: "Lista ordenada · busca binária de teto",
          rastro: resposta.rastro,
          silencioso: true,
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
}

// ----------------------------------------- painel "Por dentro da estrutura"
const operacoes = [];

function montarGaveta() {
  document.body.insertAdjacentHTML("beforeend", `
    <button class="botao-estrutura" aria-controls="gaveta">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M11 7 7 16M13 7l4 9"/></svg>
      <span class="texto">Por dentro da estrutura</span><span class="contador">0</span>
    </button>
    <div class="fundo-gaveta"></div>
    <aside class="gaveta" id="gaveta" aria-label="Por dentro da estrutura">
      <header><h2>Por dentro da estrutura</h2><button class="botao" data-fechar>Fechar</button></header>
      <div class="corpo"><p class="mudo">Nenhuma operação ainda. Navegue pelo site e veja aqui o que cada estrutura fez.</p></div>
    </aside>`);
  const gaveta = document.getElementById("gaveta");
  const fundo = document.querySelector(".fundo-gaveta");
  const alternar = (abrir) => {
    gaveta.classList.toggle("aberta", abrir);
    fundo.classList.toggle("visivel", abrir);
  };
  document.querySelector(".botao-estrutura").addEventListener("click", () => alternar(true));
  gaveta.querySelector("[data-fechar]").addEventListener("click", () => alternar(false));
  fundo.addEventListener("click", () => alternar(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") alternar(false); });
}

/**
 * Registra uma operação no painel.
 * { titulo, estrutura, rastro: {passos, comparacoes}, resumo?: [texto], silencioso?: bool }
 */
export function registrarOperacao(operacao) {
  operacao.modo = operacao.modo || modoAtual();
  operacoes.unshift(operacao);
  operacoes.splice(12);
  const botao = document.querySelector(".botao-estrutura");
  if (!botao) return;
  botao.querySelector(".contador").textContent = operacoes.length;
  if (!operacao.silencioso) {
    botao.classList.remove("pulsar");
    void botao.offsetWidth; // reinicia a animação
    botao.classList.add("pulsar");
  }
  renderizarGaveta();
}

const LIMITE_PASSOS = 250;

function renderizarGaveta() {
  const corpo = document.querySelector("#gaveta .corpo");
  corpo.innerHTML = operacoes.map((op, indice) => {
    const passos = op.rastro?.passos || [];
    const visiveis = passos.slice(0, LIMITE_PASSOS);
    return `
      <section class="operacao painel">
        <span class="etiqueta-estrutura">${esc(op.estrutura)} · ${op.modo === "classico" ? "clássica" : "modificada"}</span>
        <h3 style="margin-top:8px">${esc(op.titulo)}</h3>
        <div class="resumo">
          <span class="chip"><b>${op.rastro?.comparacoes ?? 0}</b> comparações</span>
          <span class="chip"><b>${passos.length}</b> passos</span>
          ${(op.resumo || []).map((r) => `<span class="chip">${esc(r)}</span>`).join("")}
        </div>
        ${indice === 0 || passos.length <= 40 ? `
          <ol class="passos" style="margin-top:12px">
            ${visiveis.map((p) => `<li class="${classePasso(p)}">${esc(descreverPasso(p))}</li>`).join("")}
          </ol>
          ${passos.length > LIMITE_PASSOS ? `<p class="mudo pequeno">… e mais ${passos.length - LIMITE_PASSOS} passos.</p>` : ""}`
        : ""}
      </section>`;
  }).join("");
}

function classePasso(p) {
  if (["rotacao", "caso", "desbalanceado"].includes(p.passo)) return "rotacao";
  if (["move_inicio", "avanca", "transpoe", "liga", "desliga"].includes(p.passo)) return "movimento";
  if (["encontrado", "pico", "raiz", "insere"].includes(p.passo)) return "destaque";
  return "";
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
    case "nao_encontrado": return `Não encontrado`;
    case "move_inicio": return `Move “${no}” da posição ${p.de} para o início`;
    case "transpoe": return `Troca “${no}” com “${nomeDoNo(p.com)}” (posição ${p.de} → ${p.para})`;
    case "pontua": return `“${no}” ganha 1 ponto — pontuação agora ${p.pontuacao}`;
    case "avanca": return `“${no}” avança da posição ${p.de} para ${p.para}, ultrapassando ${p.ultrapassados.length} liga(s)`;
    case "permanece": return `“${no}” permanece na posição ${p.posicao} (ninguém à frente tem menos pontos)`;
    case "rotacao": return `Rotação à ${p.direcao} em “${no}”: “${nomeDoNo(p.pivo)}” sobe`;
    case "caso": return `Caso ${p.caso} para “${nomeDoNo(p.alvo)}”`;
    case "raiz": return `“${no}” agora é a raiz`;
    case "acesso": return `Acesso ${p.contador} de ${p.limite} a “${no}”${p.contador < p.limite ? " — ainda não afunila" : " — afunila!"}`;
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

// ----------------------------------------------------------- frequentes
export async function montarFrequentes(elemento) {
  try {
    const { jogadores } = await api.frequentes();
    elemento.innerHTML = jogadores.length
      ? jogadores.map((j) => `
          <a class="frequente" href="jogador.html?id=${j.id}">${fotoHTML(j.foto, j.nome, "")}${esc(j.nome)}</a>`).join("")
      : `<span class="mudo pequeno">Os jogadores que você visitar aparecem aqui. Cada nova visita adianta o jogador uma posição (transposição).</span>`;
  } catch {
    elemento.innerHTML = "";
  }
}

// --------------------------------------------------------------- página
export function iniciarPagina() {
  montarTopo();
  montarGaveta();
}
