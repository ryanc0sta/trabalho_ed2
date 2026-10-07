// Página da liga. Ação principal: o filtro "Todos ↔ Só os destaques", que
// percorre os níveis da lista com saltos (cada nível tem metade dos jogadores
// do anterior — os mais valiosos, na versão modificada).

import { api, modoAtual } from "./api.js";
import {
  cardJogador, esc, esqueletos, formatarValor, icone, iniciarPagina, mostrarErro, parametro,
  registrarOperacao,
} from "./comum.js";

iniciarPagina();

const ligaId = parametro("id");
const elCabecalho = document.getElementById("cabecalho");
const elFiltro = document.getElementById("filtro");
const elJogadores = document.getElementById("jogadores");
const elPaginacao = document.getElementById("paginacao");
const POR_PAGINA = 24;

let detalhe = null;
let nivel = 0;
let pagina = 1;

const niveisDoModo = () => (modoAtual() === "modificado" ? detalhe.niveis : detalhe.niveis_classica);

function nivelInicial() {
  // O nível mais alto que ainda enche a primeira página.
  const niveis = niveisDoModo();
  for (let k = niveis.length - 1; k >= 0; k--) if (niveis[k].jogadores >= 12) return k;
  return 0;
}

function renderizarCabecalho() {
  document.title = `${detalhe.nome} · Scout Explorer`;
  elCabecalho.innerHTML = `
    <div class="cabecalho">
      <img class="escudo-grande" src="${esc(detalhe.logo)}" alt="" referrerpolicy="no-referrer">
      <div>
        <h1>${esc(detalhe.nome)}</h1>
        <p class="meta">${esc(detalhe.pais || "")} · <span class="num">${detalhe.jogadores}</span> jogadores ·
          <span class="num">${formatarValor(detalhe.valor_total)}</span></p>
      </div>
    </div>`;
}

function rotuloDoNivel(k) {
  const info = niveisDoModo()[k];
  if (k === 0) return `Todos os ${info.jogadores} jogadores`;
  if (modoAtual() === "modificado") return `Acima de ${formatarValor(info.valor_minimo)}`;
  return `Amostra de ${info.jogadores} jogadores`;
}

function renderizarFiltro() {
  const maximo = niveisDoModo().length - 1;
  elFiltro.classList.remove("oculto");
  elFiltro.innerHTML = `
    <div class="linha">
      <label class="rotulo" for="nivel" id="rotulo-nivel"></label>
      <span class="meta num" id="contagem-nivel"></span>
    </div>
    <input id="nivel" type="range" min="0" max="${maximo}" value="${nivel}">
    <div class="extremos"><span>Todos</span><span>Só os destaques</span></div>`;
  elFiltro.querySelector("input").addEventListener("input", (e) => mudarNivel(Number(e.target.value)));
  atualizarRotulo();
}

function atualizarRotulo() {
  const info = niveisDoModo()[nivel];
  document.getElementById("rotulo-nivel").textContent = rotuloDoNivel(nivel);
  document.getElementById("contagem-nivel").textContent = nivel === 0 ? "" : `${info.jogadores} jogadores`;
}

let espera = null;
function mudarNivel(novo) {
  if (novo === nivel) return;
  nivel = novo;
  pagina = 1;
  atualizarRotulo();
  clearTimeout(espera);
  espera = setTimeout(carregarJogadores, 120); // o range dispara vários eventos ao arrastar
}

let pedido = 0;
async function carregarJogadores() {
  const meu = ++pedido;
  [...elJogadores.children].forEach((c) => c.classList.add("sair"));
  try {
    const [dados] = await Promise.all([
      api.jogadoresDaLiga(ligaId, nivel, pagina, POR_PAGINA),
      new Promise((r) => setTimeout(r, elJogadores.children.length ? 150 : 0)),
    ]);
    if (meu !== pedido) return;
    elJogadores.innerHTML = dados.jogadores.length
      ? dados.jogadores.map((j, i) => cardJogador(j, i)).join("")
      : `<p class="vazio">Nenhum jogador aqui.</p>`;
    renderizarPaginacao(dados);
    registrarOperacao({
      titulo: `${detalhe.nome}: nível ${dados.nivel}, página ${dados.pagina}`,
      estrutura: "Lista com saltos",
      rastro: dados.rastro,
      resumo: [`${dados.total} jogadores no nível`],
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
    <button class="botao icone-so" data-ir="-1" aria-label="Página anterior" ${dados.pagina <= 1 ? "disabled" : ""}>${icone("anterior")}</button>
    <span class="num">${dados.pagina} / ${dados.paginas}</span>
    <button class="botao icone-so" data-ir="1" aria-label="Próxima página" ${dados.pagina >= dados.paginas ? "disabled" : ""}>${icone("proximo")}</button>`;
  elPaginacao.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => {
    pagina += Number(b.dataset.ir);
    carregarJogadores();
    elFiltro.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

async function iniciar() {
  if (!ligaId) {
    elCabecalho.innerHTML = `<p class="aviso">Liga não informada.</p>`;
    return;
  }
  elJogadores.innerHTML = esqueletos(12);
  try {
    // Abrir a página conta como uma visita à liga na lista autoorganizável.
    const [acesso, dados] = await Promise.all([api.acessarLiga(ligaId), api.liga(ligaId)]);
    detalhe = dados;
    const passo = acesso.rastro.passos.find((p) => ["avanca", "move_inicio"].includes(p.passo));
    registrarOperacao({
      titulo: `Visita a ${detalhe.nome}`,
      estrutura: modoAtual() === "modificado" ? "Lista com movimentação ponderada" : "Lista com movimentação para o início",
      rastro: acesso.rastro,
      resumo: [passo ? `posição ${passo.de + 1} → ${passo.para + 1}` : "posição mantida"],
    });
    nivel = nivelInicial();
    renderizarCabecalho();
    renderizarFiltro();
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
  renderizarFiltro();
  carregarJogadores();
});

iniciar();
