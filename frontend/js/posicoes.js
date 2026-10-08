// Por posição — o Exemplo 1 do enunciado: uma lista com movimentação para o
// início (as posições) em que cada item guarda uma lista com saltos (os
// jogadores da posição), explorada do nível mais alto ao nível 0.

import { api } from "./api.js?v=7";
import {
  cardJogador, esc, esqueletos, formatarValor, icone, iniciarPagina, mostrarErro, parametro,
  registrarOperacao, reordenarComAnimacao, selo, traduzirPosicao,
} from "./comum.js?v=7";

iniciarPagina();

const POR_PAGINA = 24;
const el = document.getElementById("posicoes");
el.innerHTML = `
  <h1>Por posição</h1>
  <p class="introducao">Escolha uma posição. As que você abre vão para a frente da fila. ${selo("posicoes")}</p>
  <div class="atalhos" id="lista-posicoes" style="margin-top:var(--e3)"></div>
  <section class="filtro oculto" id="filtro"></section>
  <section style="margin-top:var(--e4)">
    <div class="grade" id="jogadores"></div>
    <nav class="paginacao" id="paginacao" aria-label="Páginas"></nav>
  </section>`;
const elLista = document.getElementById("lista-posicoes");
const elFiltro = document.getElementById("filtro");
const elJogadores = document.getElementById("jogadores");
const elPaginacao = document.getElementById("paginacao");

let detalhe = null; // posição escolhida, com os níveis da sua lista com saltos
let nivel = 0;
let pagina = 1;

const niveisDoModo = () => detalhe.niveis; // níveis da lista com saltos (altura pelo valor de mercado)
const nomeDaPosicao = (id) => traduzirPosicao(id);

function renderizarPosicoes(posicoes) {
  elLista.innerHTML = posicoes.map((p) => `
    <button class="botao pequeno" type="button" data-id="${esc(p.id)}" aria-pressed="${p.id === detalhe?.id}">
      ${esc(nomeDaPosicao(p.id))} <span class="num">${p.jogadores}</span>
    </button>`).join("");
  elLista.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => escolher(b.dataset.id, true)));
}

async function escolher(id, porUsuario) {
  try {
    const acesso = await api.acessarPosicao(id);
    detalhe = acesso.posicao;
    history.replaceState(null, "", `?id=${encodeURIComponent(id)}`);
    if (!elLista.children.length) renderizarPosicoes(acesso.antes);
    elLista.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    reordenarComAnimacao(elLista, acesso.depois.map((p) => p.id));
    const itens = (lista) => lista.map((p) => ({ id: p.id, rotulo: nomeDaPosicao(p.id), titulo: nomeDaPosicao(p.id) }));
    const mudou = acesso.rastro.passos.find((p) => p.passo === "move_inicio");
    registrarOperacao({
      ferramenta: "posicoes",
      acao: porUsuario,
      titulo: `Escolher ${nomeDaPosicao(id)}`,
      rastro: acesso.rastro,
      cena: { antes: itens(acesso.antes), depois: itens(acesso.depois) },
      resultado: mudou
        ? `${nomeDaPosicao(id)} foi da ${mudou.de + 1}ª posição para o início da lista.`
        : `${nomeDaPosicao(id)} já era a primeira da lista.`,
    });
    nivel = nivelInicial();
    pagina = 1;
    renderizarFiltro();
    carregarJogadores(false);
  } catch (erro) {
    mostrarErro(elJogadores, erro);
  }
}

function nivelInicial() {
  const niveis = niveisDoModo();
  for (let k = niveis.length - 1; k >= 0; k--) if (niveis[k].jogadores >= 12) return k;
  return 0;
}

function rotuloDoNivel(k) {
  const info = niveisDoModo()[k];
  if (k === 0) return `Todos os ${info.jogadores} jogadores`;
  return `Acima de ${formatarValor(info.valor_minimo)}`;
}

function renderizarFiltro() {
  elFiltro.classList.remove("oculto");
  elFiltro.innerHTML = `
    <div class="linha">
      <label class="rotulo" for="nivel" id="rotulo-nivel"></label>
      <span class="grupo-selo"><span class="meta num" id="contagem-nivel"></span>${selo("destaques")}</span>
    </div>
    <input id="nivel" type="range" min="0" max="${niveisDoModo().length - 1}" value="${nivel}">
    <div class="extremos"><span>Todos</span><span>Só os destaques</span></div>`;
  elFiltro.querySelector("#nivel").addEventListener("input", (e) => mudarNivel(Number(e.target.value)));
  atualizarRotulo();
}

function atualizarRotulo() {
  const rotulo = rotuloDoNivel(nivel);
  document.getElementById("rotulo-nivel").textContent = `${nomeDaPosicao(detalhe.id)}: ${rotulo[0].toLowerCase()}${rotulo.slice(1)}`;
  document.getElementById("contagem-nivel").textContent = nivel === 0 ? "" : `${niveisDoModo()[nivel].jogadores} jogadores`;
}

let espera = null;
function mudarNivel(novo) {
  if (novo === nivel) return;
  nivel = novo;
  pagina = 1;
  atualizarRotulo();
  clearTimeout(espera);
  espera = setTimeout(() => carregarJogadores(true), 120);
}

let pedido = 0;
async function carregarJogadores(porUsuario) {
  const meu = ++pedido;
  [...elJogadores.children].forEach((c) => c.classList.add("sair"));
  try {
    const dados = await api.jogadoresDaPosicao(detalhe.id, nivel, pagina, POR_PAGINA);
    if (meu !== pedido) return;
    elJogadores.innerHTML = dados.jogadores.map((j, i) => cardJogador(j, i)).join("");
    renderizarPaginacao(dados);
    const passos = dados.rastro.passos.length;
    registrarOperacao({
      ferramenta: "destaques",
      acao: porUsuario,
      titulo: dados.nivel === 0
        ? `${nomeDaPosicao(detalhe.id)}: todos os jogadores, página ${dados.pagina}`
        : `${nomeDaPosicao(detalhe.id)}: vista do nível ${dados.nivel}`,
      rastro: dados.rastro,
      cena: { torres: dados.jogadores.map((j) => ({ no: j.no, nivel: j.nivel })), nivel: dados.nivel },
      resultado: dados.nivel === 0
        ? (passos ? `Chegou ao começo da página ${dados.pagina} em ${passos} ${passos === 1 ? "passo" : "passos"}.` : "")
        : `No nível ${dados.nivel} só aparecem ${dados.total} das ${detalhe.jogadores} torres: as mais altas.`,
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
    carregarJogadores(true);
    elFiltro.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

async function iniciar() {
  elJogadores.innerHTML = esqueletos(12);
  try {
    const { posicoes } = await api.posicoes();
    renderizarPosicoes(posicoes);
    const pedida = parametro("id");
    // Sem posição no endereço, abre a primeira da lista (acessá-la não muda a ordem).
    escolher(posicoes.some((p) => p.id === pedida) ? pedida : posicoes[0].id, false);
  } catch (erro) {
    mostrarErro(elJogadores, erro);
  }
}

iniciar();
