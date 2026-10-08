// Comparar jogadores: até três históricos no mesmo gráfico.
// Cada histórico é uma árvore AVL; os percursos em ordem são intercalados numa
// única linha do tempo, usada para achar as trocas de liderança.

import { api } from "./api.js?v=7";
import {
  esc, formatarData, formatarValor, iniciarPagina, montarBusca, mostrarErro, parametro,
  registrarOperacao, selo,
} from "./comum.js?v=7";

iniciarPagina();

const MAXIMO = 3;
const TRACOS = [[], [7, 4], [2, 3]]; // cada jogador com um traço: cheio, tracejado, pontilhado
let ids = (parametro("ids") || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, MAXIMO);
let grafico = null;
let dados = null;

const el = document.getElementById("comparar");
el.innerHTML = `
  <h1>Comparar jogadores</h1>
  <p class="introducao">Até três jogadores no mesmo gráfico de valor de mercado. ${selo("comparar")}</p>
  <div class="escolhidos" id="escolhidos"></div>
  <div class="ir-para" id="adicionar"></div>
  <div id="resultado"></div>`;
const elEscolhidos = document.getElementById("escolhidos");
const elAdicionar = document.getElementById("adicionar");
const elResultado = document.getElementById("resultado");

montarBusca(elAdicionar, {
  dica: "Adicionar jogador",
  aoEscolher: (jogador) => {
    if (ids.includes(jogador.id) || ids.length >= MAXIMO) return;
    ids.push(jogador.id);
    carregar(true);
  },
});

const amostra = (i) => `<svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="2" stroke-dasharray="${TRACOS[i].join(" ")}"/></svg>`;
const cor = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
const paraTempo = (iso) => new Date(iso + "T00:00:00").getTime();

function renderizarEscolhidos() {
  elAdicionar.classList.toggle("oculto", ids.length >= MAXIMO);
  elEscolhidos.innerHTML = (dados?.jogadores || []).map((j, i) => `
    <span class="escolhido">${amostra(i)}<a class="link" href="jogador.html?id=${j.id}">${esc(j.nome)}</a>
      <button type="button" data-tirar="${j.id}" aria-label="Tirar ${esc(j.nome)} da comparação">×</button></span>`).join("");
  elEscolhidos.querySelectorAll("[data-tirar]").forEach((b) => b.addEventListener("click", () => {
    ids = ids.filter((id) => id !== Number(b.dataset.tirar));
    carregar(true);
  }));
}

function desenhar() {
  grafico?.destroy();
  const fonte = { family: "IBM Plex Mono", size: 12 };
  grafico = new Chart(document.getElementById("grafico"), {
    type: "line",
    data: {
      datasets: dados.series.map((serie, i) => ({
        label: dados.jogadores[i].nome,
        data: serie.map((p) => ({ x: paraTempo(p.data), y: p.valor, data: p.data })),
        stepped: "before", borderColor: cor("--tinta"), borderWidth: 2, borderDash: TRACOS[i],
        pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: cor("--tinta"),
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 600 },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cor("--tinta"), titleColor: cor("--fundo"), bodyColor: cor("--fundo"),
          displayColors: false, cornerRadius: 8, padding: 8, titleFont: fonte, bodyFont: fonte,
          callbacks: { title: (i) => formatarData(i[0].raw.data), label: (i) => `${i.dataset.label}: ${formatarValor(i.raw.y)}` },
        },
      },
      scales: {
        x: { type: "linear", border: { color: cor("--borda") }, grid: { display: false },
          ticks: { color: cor("--tinta-2"), font: fonte, callback: (v) => new Date(v).getFullYear(), maxTicksLimit: 8 } },
        y: { border: { display: false }, grid: { color: cor("--borda") },
          ticks: { color: cor("--tinta-2"), font: fonte, callback: (v) => formatarValor(v), maxTicksLimit: 6 } },
      },
    },
  });
}

function textoDasViradas() {
  const nomes = dados.jogadores.map((j) => j.nome);
  if (nomes.length < 2 || !dados.linha.length) return "";
  if (!dados.viradas.length) return `<p class="leitura"><b>${esc(nomes[dados.linha[0].jogador])}</b> esteve à frente do começo ao fim.</p>`;
  return `
    <div class="secao-titulo" style="margin-top:var(--e5)"><h2>Trocas de liderança</h2></div>
    <ul class="viradas">${dados.viradas.slice(-8).reverse().map((v) => `
      <li><span class="num">${formatarData(v.data)}</span> <b>${esc(nomes[v.jogador])}</b> passou ${esc(nomes[v.passou])},
        valendo <span class="num">${formatarValor(v.valor)}</span></li>`).join("")}</ul>`;
}

async function carregar(porUsuario = false) {
  history.replaceState(null, "", ids.length ? `?ids=${ids.join(",")}` : location.pathname);
  if (!ids.length) {
    dados = null;
    grafico?.destroy();
    renderizarEscolhidos();
    elResultado.innerHTML = `<p class="vazio">Adicione um jogador para começar.</p>`;
    return;
  }
  try {
    dados = await api.comparar(ids);
    renderizarEscolhidos();
    elResultado.innerHTML = `<div class="grafico" style="cursor:default"><canvas id="grafico" role="img" aria-label="Valor de mercado dos jogadores ao longo do tempo"></canvas></div>${textoDasViradas()}`;
    desenhar();
    const nomes = dados.jogadores.map((j) => j.nome);
    registrarOperacao({
      ferramenta: "comparar",
      acao: porUsuario,
      titulo: `Comparar ${nomes.join(", ")}`,
      rastro: dados.rastro,
      cena: { nomes, tamanhos: dados.series.map((s) => s.length) },
      resultado: `${dados.linha.length} avaliações de ${nomes.length} ${nomes.length === 1 ? "jogador" : "jogadores"} numa só linha do tempo`
        + (nomes.length > 1 ? `, com ${dados.viradas.length} ${dados.viradas.length === 1 ? "troca" : "trocas"} de liderança.` : "."),
    });
  } catch (erro) {
    mostrarErro(elResultado, erro);
  }
}

window.addEventListener("tema", () => { if (dados) desenhar(); });
carregar();
