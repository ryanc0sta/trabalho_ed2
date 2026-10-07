// Faixa de valor. Ação principal: "Ver jogadores".
// Usa a árvore por valor: contagem pela diferença de posições (tamanho das
// subárvores), página selecionada pela posição, e piso/teto para os extremos.

import { api } from "./api.js?v=5";
import {
  cardJogador, esc, esqueletos, formatarValor, icone, iniciarPagina, mostrarErro, parametro,
  registrarOperacao, selo,
} from "./comum.js?v=5";

iniciarPagina();

const el = document.getElementById("faixa");
const POR_PAGINA = 24;
const MILHAO = 1_000_000;
const ATALHOS = [
  { texto: "Até €1M", min: 0, max: 1 },
  { texto: "€1M a €10M", min: 1, max: 10 },
  { texto: "€10M a €50M", min: 10, max: 50 },
  { texto: "Acima de €50M", min: 50, max: 300 },
];

let minimo = Number(parametro("min") ?? 10);
let maximo = Number(parametro("max") ?? 20);
let pagina = 1;

el.innerHTML = `
  <h1>Faixa de valor</h1>
  <p class="introducao">Jogadores em atividade pelo valor de mercado. ${selo("faixa")}</p>
  <form class="consulta" id="form-faixa" style="margin-top:var(--e4)">
    <label>De (€ milhões)<input type="number" id="minimo" min="0" max="300" step="0.1" value="${minimo}" required></label>
    <label>Até (€ milhões)<input type="number" id="maximo" min="0" max="300" step="0.1" value="${maximo}" required></label>
    <button class="botao principal">Ver jogadores</button>
  </form>
  <div class="atalhos">
    ${ATALHOS.map((a, i) => `<button class="botao pequeno" type="button" data-atalho="${i}">${esc(a.texto)}</button>`).join("")}
  </div>
  <p class="leitura" id="resumo" aria-live="polite"></p>
  <section style="margin-top:var(--e4)">
    <div class="grade" id="jogadores"></div>
    <nav class="paginacao" id="paginacao" aria-label="Páginas"></nav>
  </section>`;

const elResumo = document.getElementById("resumo");
const elJogadores = document.getElementById("jogadores");
const elPaginacao = document.getElementById("paginacao");
const campoMin = document.getElementById("minimo");
const campoMax = document.getElementById("maximo");

document.getElementById("form-faixa").addEventListener("submit", (e) => {
  e.preventDefault();
  minimo = Number(campoMin.value);
  maximo = Number(campoMax.value);
  pagina = 1;
  carregar();
});
el.querySelectorAll("[data-atalho]").forEach((b) => b.addEventListener("click", () => {
  const atalho = ATALHOS[Number(b.dataset.atalho)];
  campoMin.value = minimo = atalho.min;
  campoMax.value = maximo = atalho.max;
  pagina = 1;
  carregar();
}));

async function carregar() {
  if (minimo > maximo) {
    elResumo.textContent = "O valor inicial deve ser menor que o final.";
    elJogadores.innerHTML = "";
    elPaginacao.innerHTML = "";
    return;
  }
  history.replaceState(null, "", `?min=${minimo}&max=${maximo}`);
  elJogadores.innerHTML = esqueletos(12);
  try {
    const dados = await api.faixa(Math.round(minimo * MILHAO), Math.round(maximo * MILHAO), pagina, POR_PAGINA);
    const faixa = `entre ${formatarValor(dados.minimo)} e ${formatarValor(dados.maximo)}`;
    elResumo.innerHTML = dados.total
      ? `<b>${dados.total.toLocaleString("pt-BR")}</b> jogadores ${faixa} — de ${esc(dados.mais_barato.nome)}
         (<b>${formatarValor(dados.mais_barato.valor)}</b>) a ${esc(dados.mais_caro.nome)} (<b>${formatarValor(dados.mais_caro.valor)}</b>).`
      : `Nenhum jogador ${faixa}.`;
    elJogadores.innerHTML = dados.jogadores.map((j, i) => cardJogador(j, i)).join("");
    renderizarPaginacao(dados);
    registrarOperacao({
      ferramenta: "faixa",
      acao: true,
      titulo: `Jogadores ${faixa}`,
      rastro: dados.rastro,
      cena: { arvore: dados.arvore },
      resultado: dados.modo === "classico"
        ? `Contou ${dados.total} jogadores visitando um por um: ${dados.rastro.comparacoes} comparações.`
        : `Contou ${dados.total} jogadores com ${dados.rastro.comparacoes} comparações, sem visitar a faixa inteira.`,
    });
  } catch (erro) {
    mostrarErro(elJogadores, erro);
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
    carregar();
    elResumo.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

window.addEventListener("modo", carregar);
carregar();
