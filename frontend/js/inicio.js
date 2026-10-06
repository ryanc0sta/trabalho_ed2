// Página inicial: lista de ligas (autoorganizável), "Em alta" (topo da árvore
// afunilada) e frequentes (transposição).

import { api, modoAtual } from "./api.js";
import { cardJogador, esc, esqueletos, iniciarPagina, montarFrequentes, mostrarErro } from "./comum.js";

iniciarPagina();

const elLigas = document.getElementById("ligas");
const elAlta = document.getElementById("em-alta");

const TEXTOS = {
  modificado: {
    etiqueta: "Movimentação ponderada",
    explica: "Cada liga aberta ganha pontos (que envelhecem com o tempo) e só ultrapassa as ligas com menos pontos.",
    alta: "Árvore afunilada condicional",
  },
  classico: {
    etiqueta: "Movimentação para o início",
    explica: "A liga aberta vai direto para o topo da lista, mesmo que tenha sido um único acesso.",
    alta: "Árvore afunilada clássica",
  },
};

// Ordem mostrada da última vez, para animar o que mudou desde então.
const chaveOrdem = () => `ordem-ligas-${modoAtual()}`;
function lerOrdemAnterior() {
  try {
    return JSON.parse(sessionStorage.getItem(chaveOrdem()) || "null");
  } catch {
    return null;
  }
}
function guardarOrdem(ids) {
  try {
    sessionStorage.setItem(chaveOrdem(), JSON.stringify(ids));
  } catch {
    /* sem armazenamento: apenas não anima */
  }
}

async function carregarLigas() {
  const textos = TEXTOS[modoAtual()];
  document.getElementById("etiqueta-ligas").textContent = textos.etiqueta;
  document.getElementById("explica-ligas").textContent = textos.explica;
  elLigas.innerHTML = esqueletos(8, "esqueleto-liga");
  try {
    const { ligas } = await api.ligas();
    const maxPontos = Math.max(1, ...ligas.map((l) => l.pontuacao || 0));
    elLigas.innerHTML = ligas.map((l, i) => `
      <a class="liga-item" href="liga.html?id=${encodeURIComponent(l.id)}" data-id="${esc(l.id)}">
        <span class="pos">${i + 1}</span>
        <img src="${esc(l.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer">
        <div>
          <div class="nome">${esc(l.nome)}</div>
          <div class="pais">${l.bandeira ? `<img src="${esc(l.bandeira)}" alt="" referrerpolicy="no-referrer">` : ""}${esc(l.pais || "")}</div>
        </div>
        <div class="pontos">
          ${l.pontuacao !== undefined
            ? `${l.pontuacao.toFixed(2).replace(".", ",")} pts<div class="barra"><i style="width:${(100 * l.pontuacao) / maxPontos}%"></i></div>`
            : `${l.jogadores} jog.`}
        </div>
      </a>`).join("");
    animarMudancas(ligas.map((l) => l.id));
  } catch (erro) {
    mostrarErro(elLigas, erro);
  }
}

/** FLIP: cada liga começa na posição antiga e desliza até a nova. */
function animarMudancas(ordemNova) {
  const anterior = lerOrdemAnterior();
  guardarOrdem(ordemNova);
  if (!anterior || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const itens = [...elLigas.children];
  const passo = itens.length > 1 ? itens[1].offsetTop - itens[0].offsetTop : 0;
  itens.forEach((el, novo) => {
    const antigo = anterior.indexOf(el.dataset.id);
    if (antigo < 0 || antigo === novo) return;
    el.style.transition = "none";
    el.style.transform = `translateY(${(antigo - novo) * passo}px)`;
    el.style.zIndex = antigo > novo ? 2 : 1;
    if (antigo > novo) el.classList.add("subiu");
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    itens.forEach((el) => {
      if (!el.style.transform) return;
      el.style.transition = "transform 900ms cubic-bezier(0.2, 0.7, 0.2, 1)";
      el.style.transform = "";
    });
    setTimeout(() => itens.forEach((el) => el.classList.remove("subiu")), 2600);
  }));
}

async function carregarEmAlta() {
  document.getElementById("etiqueta-alta").textContent = TEXTOS[modoAtual()].alta;
  elAlta.innerHTML = esqueletos(7);
  try {
    const { niveis } = await api.emAlta(3);
    let i = 0;
    elAlta.innerHTML = niveis.map((nivel, profundidade) => nivel.map((j) =>
      cardJogador(j, i++, `<span class="selo">${profundidade === 0 ? "Raiz" : `Nível ${profundidade}`}</span>`),
    ).join("")).join("");
  } catch (erro) {
    mostrarErro(elAlta, erro);
  }
}

function carregarTudo() {
  carregarLigas();
  carregarEmAlta();
  montarFrequentes(document.getElementById("frequentes"));
}

window.addEventListener("modo", carregarTudo);
// Ao voltar pelo botão "voltar" do navegador, a página pode vir do cache: recarrega.
window.addEventListener("pageshow", (e) => { if (e.persisted) carregarTudo(); });
carregarTudo();
