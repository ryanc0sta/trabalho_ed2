// Página inicial. Ação principal: buscar um jogador.
// "Em alta" = topo da árvore de busca; "Ligas" = lista autoorganizável (as
// mais visitadas sobem); "Vistos por você" = lista com transposição.

import { api, modoAtual } from "./api.js";
import {
  cardJogador, esc, esqueletos, iniciarPagina, montarBusca, montarFrequentes, mostrarErro,
} from "./comum.js";

iniciarPagina({ busca: false });
montarBusca(document.getElementById("busca-principal"), { grande: true });

const elLigas = document.getElementById("ligas");
const elAlta = document.getElementById("em-alta");
const botaoTodas = document.getElementById("ver-todas");

// Mostra as 12 primeiras (as mais visitadas); o resto sob demanda.
botaoTodas.addEventListener("click", () => {
  const recolhidas = elLigas.classList.toggle("recolhidas");
  botaoTodas.textContent = recolhidas ? `Ver todas as ${elLigas.children.length} ligas` : "Mostrar menos";
});

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

const itemLiga = (l) => `
  <a class="liga-item" href="liga.html?id=${encodeURIComponent(l.id)}" data-id="${esc(l.id)}">
    <img class="escudo" src="${esc(l.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer">
    <div><div class="nome">${esc(l.nome)}</div><div class="meta">${esc(l.pais || "")}</div></div>
  </a>`;

async function carregarLigas() {
  elLigas.innerHTML = esqueletos(12, "height:58px");
  try {
    const { ligas } = await api.ligas();
    const novaOrdem = ligas.map((l) => l.id);
    const anterior = lerOrdemAnterior();
    guardarOrdem(novaOrdem);
    const porId = new Map(ligas.map((l) => [l.id, l]));
    const mesmaLista = anterior && anterior.length === ligas.length && anterior.every((id) => porId.has(id));
    // Desenha na ordem antiga e então anima até a nova (técnica FLIP).
    elLigas.innerHTML = (mesmaLista ? anterior : novaOrdem).map((id) => itemLiga(porId.get(id))).join("");
    if (elLigas.classList.contains("recolhidas")) botaoTodas.textContent = `Ver todas as ${ligas.length} ligas`;
    if (mesmaLista) animarReordenacao(novaOrdem);
  } catch (erro) {
    mostrarErro(elLigas, erro);
  }
}

function animarReordenacao(novaOrdem) {
  const itens = [...elLigas.children];
  const antes = new Map(itens.map((el) => [el.dataset.id, el.getBoundingClientRect()]));
  const indiceAntigo = new Map(itens.map((el, i) => [el.dataset.id, i]));
  novaOrdem.forEach((id) => elLigas.appendChild(itens.find((el) => el.dataset.id === id)));
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  [...elLigas.children].forEach((el, novo) => {
    const a = antes.get(el.dataset.id);
    const d = el.getBoundingClientRect();
    if (!d.width) return; // continua escondida (além das 12 primeiras)
    if (!a.width) {
      // Estava escondida e entrou entre as 12 primeiras: aparece no lugar.
      el.classList.add("subiu");
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480 });
      setTimeout(() => el.classList.remove("subiu"), 1600);
      return;
    }
    const dx = a.left - d.left;
    const dy = a.top - d.top;
    if (!dx && !dy) return;
    if (novo < indiceAntigo.get(el.dataset.id)) el.classList.add("subiu");
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
      { duration: 480, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
    setTimeout(() => el.classList.remove("subiu"), 1600);
  });
}

async function carregarEmAlta() {
  elAlta.innerHTML = esqueletos(6);
  try {
    const { niveis } = await api.emAlta(3);
    elAlta.innerHTML = niveis.flat().map((j, i) => cardJogador(j, i)).join("");
  } catch (erro) {
    mostrarErro(elAlta, erro);
  }
}

function carregarTudo() {
  carregarLigas();
  carregarEmAlta();
  montarFrequentes(document.getElementById("frequentes"), document.getElementById("secao-frequentes"));
}

window.addEventListener("modo", carregarTudo);
// Ao voltar pelo botão do navegador, a página pode vir do cache: recarrega.
window.addEventListener("pageshow", (e) => { if (e.persisted) carregarTudo(); });
carregarTudo();
