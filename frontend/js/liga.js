// Página da liga: explorar os jogadores pelos níveis da lista com saltos.
// Nível 0 = todos; quanto mais alto o nível, menos (e, na versão modificada,
// mais valiosos) os jogadores.

import { api, modoAtual } from "./api.js";
import {
  cardJogador, esc, esqueletos, formatarValor, iniciarPagina, mostrarErro, parametro,
  registrarOperacao,
} from "./comum.js";

iniciarPagina();

const ligaId = parametro("id");
const elCabecalho = document.getElementById("cabecalho");
const elExplorar = document.getElementById("explorar");
const elJogadores = document.getElementById("jogadores");
const elPaginacao = document.getElementById("paginacao");
const POR_PAGINA = 24;

let detalhe = null;
let nivel = 0;
let pagina = 1;

const niveisDoModo = () => (modoAtual() === "modificado" ? detalhe.niveis : detalhe.niveis_classica);

function nivelInicial() {
  // O nível mais alto que ainda mostra uma grade cheia de jogadores.
  const niveis = niveisDoModo();
  for (let k = niveis.length - 1; k >= 0; k--) if (niveis[k].jogadores >= 12) return k;
  return 0;
}

function renderizarCabecalho() {
  document.title = `${detalhe.nome} · Scout Explorer`;
  elCabecalho.innerHTML = `
    <div class="cabecalho-pagina">
      <img class="logo" src="${esc(detalhe.logo)}" alt="" referrerpolicy="no-referrer">
      <div>
        <div class="mudo">${detalhe.bandeira ? `<img src="${esc(detalhe.bandeira)}" alt="" style="display:inline;width:20px;vertical-align:middle;border-radius:2px" referrerpolicy="no-referrer"> ` : ""}${esc(detalhe.pais || "")}</div>
        <h1>${esc(detalhe.nome)}</h1>
        <div class="meta">
          <span><b>${detalhe.jogadores}</b> jogadores ativos</span>
          <span>Valor total <b class="valor">${formatarValor(detalhe.valor_total)}</b></span>
          <span><b>${niveisDoModo().length}</b> níveis na lista com saltos</span>
        </div>
      </div>
    </div>`;
}

function descreverNivel(k) {
  const info = niveisDoModo()[k];
  if (k === 0) return `Todos os ${info.jogadores} jogadores, em ordem alfabética.`;
  if (modoAtual() === "modificado") {
    return `${info.jogadores} jogadores com valor a partir de ${formatarValor(info.valor_minimo)}.`;
  }
  return `${info.jogadores} jogadores — sorteados pela moeda ao entrar na lista.`;
}

function renderizarExplorar() {
  const niveis = niveisDoModo();
  const maximo = niveis.length - 1;
  const maiorLog = Math.log2(niveis[0].jogadores + 1);
  elExplorar.innerHTML = `
    <div class="explorar-topo">
      <div>
        <h2>Profundidade de exploração</h2>
        <p class="mudo pequeno" style="margin:4px 0 0">${modoAtual() === "modificado"
          ? "Cada nível da lista com saltos guarda metade dos jogadores do nível de baixo — os mais valiosos."
          : "Na lista com saltos clássica, os níveis são sorteados: olhar “por cima” mostra jogadores aleatórios."}</p>
      </div>
      <div style="text-align:right">
        <div class="nivel-atual" id="nivel-atual">Nível ${nivel}</div>
        <div class="nivel-desc" id="nivel-desc">${esc(descreverNivel(nivel))}</div>
      </div>
    </div>
    <div class="degraus" id="degraus">
      ${niveis.map((n) => `
        <button class="degrau" data-nivel="${n.nivel}" title="Nível ${n.nivel}: ${n.jogadores} jogadores"
          style="height:${12 + (88 * Math.log2(n.jogadores + 1)) / maiorLog}%"><span>${n.nivel}</span></button>`).join("")}
    </div>
    <input class="nivel" type="range" min="0" max="${maximo}" value="${nivel}" aria-label="Nível da lista com saltos">
    <div class="legenda-slider"><span>◀ Todos os jogadores</span><span>Só o topo ▶</span></div>`;

  elExplorar.querySelector("input").addEventListener("input", (e) => mudarNivel(Number(e.target.value)));
  elExplorar.querySelectorAll(".degrau").forEach((b) =>
    b.addEventListener("click", () => mudarNivel(Number(b.dataset.nivel))));
  marcarDegraus();
}

function marcarDegraus() {
  elExplorar.querySelectorAll(".degrau").forEach((b) => {
    const k = Number(b.dataset.nivel);
    b.classList.toggle("atual", k === nivel);
    b.classList.toggle("ativo", k > nivel);
  });
  elExplorar.querySelector("input").value = nivel;
  document.getElementById("nivel-atual").textContent = `Nível ${nivel}`;
  document.getElementById("nivel-desc").textContent = descreverNivel(nivel);
}

let espera = null;
function mudarNivel(novo) {
  if (novo === nivel) return;
  nivel = novo;
  pagina = 1;
  marcarDegraus();
  clearTimeout(espera);
  espera = setTimeout(carregarJogadores, 120); // o range dispara vários eventos ao arrastar
}

let pedido = 0;
async function carregarJogadores() {
  const meu = ++pedido;
  // Cards atuais saem em sequência enquanto a próxima página chega.
  [...elJogadores.children].forEach((c, i) => { c.style.setProperty("--i", Math.min(i, 20)); c.classList.add("saindo"); });
  try {
    const [dados] = await Promise.all([
      api.jogadoresDaLiga(ligaId, nivel, pagina, POR_PAGINA),
      new Promise((r) => setTimeout(r, elJogadores.children.length ? 200 : 0)),
    ]);
    if (meu !== pedido) return;
    elJogadores.innerHTML = dados.jogadores.length
      ? dados.jogadores.map((j, i) => cardJogador(j, i,
          `<span class="selo nivel" title="Altura da torre deste nó na lista com saltos">▲ ${j.nivel}</span>`)).join("")
      : `<p class="vazio">Nenhum jogador neste nível.</p>`;
    renderizarPaginacao(dados);
    registrarOperacao({
      titulo: `${detalhe.nome}: nível ${dados.nivel}, página ${dados.pagina}`,
      estrutura: "Lista com saltos",
      rastro: dados.rastro,
      resumo: [`${dados.total} jogadores no nível`],
      silencioso: true,
    });
  } catch (erro) {
    if (meu === pedido) mostrarErro(elJogadores, erro);
  }
}

function renderizarPaginacao(dados) {
  if (dados.paginas <= 1) {
    elPaginacao.innerHTML = "";
    return;
  }
  elPaginacao.innerHTML = `
    <button class="botao" data-ir="-1" ${dados.pagina <= 1 ? "disabled" : ""}>← Anterior</button>
    <span class="mudo">Página ${dados.pagina} de ${dados.paginas}</span>
    <button class="botao" data-ir="1" ${dados.pagina >= dados.paginas ? "disabled" : ""}>Próxima →</button>`;
  elPaginacao.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => {
    pagina += Number(b.dataset.ir);
    carregarJogadores();
    elExplorar.scrollIntoView({ behavior: "smooth" });
  }));
}

async function iniciar() {
  if (!ligaId) {
    elCabecalho.innerHTML = `<div class="aviso">Liga não informada.</div>`;
    return;
  }
  elJogadores.innerHTML = esqueletos(12);
  try {
    // Abrir a página conta como acesso à liga na lista autoorganizável.
    const [acesso, dados] = await Promise.all([api.acessarLiga(ligaId), api.liga(ligaId)]);
    detalhe = dados;
    const passo = acesso.rastro.passos.find((p) => ["avanca", "move_inicio"].includes(p.passo));
    registrarOperacao({
      titulo: `Abrir ${detalhe.nome}`,
      estrutura: modoAtual() === "modificado" ? "Lista com movimentação ponderada" : "Lista com movimentação para o início",
      rastro: acesso.rastro,
      resumo: [passo ? `posição ${passo.de + 1} → ${passo.para + 1}` : "posição mantida"],
    });
    nivel = nivelInicial();
    renderizarCabecalho();
    renderizarExplorar();
    carregarJogadores();
  } catch (erro) {
    mostrarErro(elCabecalho, erro);
    elJogadores.innerHTML = "";
  }
}

window.addEventListener("modo", () => {
  if (!detalhe) return;
  nivel = nivelInicial();
  pagina = 1;
  renderizarCabecalho();
  renderizarExplorar();
  carregarJogadores();
});

iniciar();
