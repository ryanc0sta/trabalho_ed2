// Minha lista: jogadores que o usuário marcou para acompanhar.
// Cada adição e remoção é uma inserção/remoção ao vivo numa lista com saltos
// (os passos aparecem nos Bastidores).

import { api } from "./api.js?v=6";
import {
  atualizarLateral, cardJogador, esqueletos, formatarValor, iniciarPagina, mostrarErro,
  registrarOperacao, selo,
} from "./comum.js?v=6";

iniciarPagina();

const el = document.getElementById("lista");
el.innerHTML = `
  <h1>Minha lista</h1>
  <p class="introducao"><span id="resumo"></span> ${selo("minha-lista")}</p>
  <section id="corpo" style="margin-top:var(--e4)"><div class="grade">${esqueletos(4)}</div></section>`;
const elResumo = document.getElementById("resumo");
const elCorpo = document.getElementById("corpo");

async function carregar() {
  try {
    const dados = await api.minhaLista();
    if (!dados.total) {
      elResumo.textContent = "Nenhum jogador ainda.";
      elCorpo.innerHTML = `
        <p class="vazio">Abra a página de um jogador e toque em “Adicionar à lista”.</p>
        <a class="botao principal" href="index.html">Encontrar jogadores</a>`;
      return;
    }
    elResumo.innerHTML = `<span class="num">${dados.total}</span> ${dados.total === 1 ? "jogador" : "jogadores"} ·
      <span class="num">${formatarValor(dados.valor_total)}</span> no total`;
    elCorpo.innerHTML = `<div class="grade">${dados.jogadores.map((j, i) => `
      <div class="item-lista">
        ${cardJogador(j, i)}
        <button class="botao pequeno" data-remover="${j.id}">Remover</button>
      </div>`).join("")}</div>`;
    elCorpo.querySelectorAll("[data-remover]").forEach((b) => b.addEventListener("click", () => remover(b)));
  } catch (erro) {
    mostrarErro(elCorpo, erro);
  }
}

async function remover(botao) {
  botao.disabled = true;
  try {
    const nome = botao.parentElement.querySelector(".nome").textContent;
    const resposta = await api.removerDaLista(botao.dataset.remover);
    registrarOperacao({
      ferramenta: "minha-lista",
      acao: true,
      titulo: `Remover ${nome} da lista`,
      rastro: resposta.rastro,
      resultado: `A torre de ${nome} saiu da lista. Restam ${resposta.total}.`,
    });
    atualizarLateral();
    carregar();
  } catch (erro) {
    botao.disabled = false;
    mostrarErro(elCorpo, erro);
  }
}

window.addEventListener("modo", carregar);
carregar();
