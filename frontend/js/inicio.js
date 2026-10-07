// Página inicial. Ação principal: buscar um jogador.
// "Em alta" = topo da árvore de busca; "Ligas" = lista autoorganizável (as
// mais visitadas sobem); "Vistos por você" = lista com transposição.

import { api, modoAtual } from "./api.js?v=6";
import {
  cardJogador, esc, esqueletos, formatarValor, iniciarPagina, montarBusca, montarFrequentes, mostrarErro,
  parametro, registrarOperacao,
} from "./comum.js?v=6";

iniciarPagina({ busca: false });
const campoBusca = montarBusca(document.getElementById("busca-principal"), { grande: true });

// Vindo de uma "busca recente" da barra lateral: refaz a busca.
const termoInicial = parametro("q");
if (termoInicial) {
  campoBusca.value = termoInicial;
  campoBusca.focus();
  campoBusca.dispatchEvent(new Event("input"));
}

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
    const dados = await api.emAlta(6);
    elAlta.innerHTML = dados.jogadores.map((j, i) => cardJogador(j, i)).join("");
    registrarOperacao({
      ferramenta: "em-alta",
      titulo: "Os jogadores mais valiosos",
      rastro: dados.rastro,
      cena: { arvore: dados.arvore },
      resultado: `Os ${dados.jogadores.length} mais valiosos entre milhares de jogadores, com ${dados.rastro.comparacoes} comparações. O primeiro é ${dados.jogadores[0].nome}, com ${formatarValor(dados.jogadores[0].valor)}.`,
    });
  } catch (erro) {
    mostrarErro(elAlta, erro);
  }
}

// Recomendações a partir dos perfis que o usuário abriu (a lista de vistos).
const elRecomendados = document.getElementById("recomendados");
const elBaseRecomendados = document.getElementById("base-recomendados");
async function carregarRecomendados() {
  elRecomendados.innerHTML = esqueletos(6);
  try {
    const dados = await api.recomendados();
    if (!dados.fontes.length) {
      elBaseRecomendados.textContent = "Abra o perfil de um jogador e as recomendações aparecem aqui.";
      elRecomendados.innerHTML = "";
      return;
    }
    const nomes = dados.fontes.map((f) => f.nome);
    const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}` : nomes[0];
    elBaseRecomendados.textContent = `Porque você abriu ${lista}.`;
    elRecomendados.innerHTML = dados.jogadores.map((j, i) => cardJogador(j, i, j.motivo)).join("");
    registrarOperacao({
      ferramenta: "recomendados",
      titulo: `Recomendações a partir de ${nomes[0]}`,
      rastro: dados.rastro,
      cena: { arvore: dados.arvore },
      resultado: `${dados.jogadores.length} recomendações com ${dados.rastro.comparacoes} comparações: três buscas por perfil aberto, sem percorrer a base.`,
    });
  } catch (erro) {
    mostrarErro(elRecomendados, erro);
  }
}

function carregarTudo() {
  carregarLigas();
  carregarRecomendados();
  carregarEmAlta();
  montarFrequentes(document.getElementById("frequentes"), document.getElementById("secao-frequentes"));
}

window.addEventListener("modo", carregarTudo);
// Ao voltar pelo botão do navegador, a página pode vir do cache: recarrega.
window.addEventListener("pageshow", (e) => { if (e.persisted) carregarTudo(); });
carregarTudo();
