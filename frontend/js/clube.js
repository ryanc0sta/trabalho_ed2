// Página do clube: ficha e elenco atual (clube encontrado na AVL de clubes).

import { api } from "./api.js";
import { cardJogador, esc, formatarValor, iniciarPagina, mostrarErro, parametro } from "./comum.js";

iniciarPagina();

const clubeId = parametro("id");
const elClube = document.getElementById("clube");

function item(rotulo, valor) {
  return valor ? `<div><span>${esc(rotulo)}</span><b>${valor}</b></div>` : "";
}

async function iniciar() {
  if (!clubeId) {
    elClube.innerHTML = `<div class="aviso">Clube não informado.</div>`;
    return;
  }
  elClube.innerHTML = `<div class="esqueleto" style="height:200px"></div>`;
  try {
    const c = await api.clube(clubeId);
    document.title = `${c.nome} · Scout Explorer`;
    elClube.innerHTML = `
      <div class="cabecalho-pagina">
        <img class="logo" src="${esc(c.escudo)}" alt="" referrerpolicy="no-referrer">
        <div>
          ${c.liga ? `<a class="mudo" href="liga.html?id=${encodeURIComponent(c.liga.id)}">${esc(c.liga.nome)}</a>` : ""}
          <h1>${esc(c.nome)}</h1>
          <div class="meta"><span class="etiqueta-estrutura">Encontrado na AVL de clubes</span></div>
        </div>
      </div>
      <div class="ficha">
        ${item("Estádio", esc(c.estadio))}
        ${item("Capacidade", c.capacidade ? c.capacidade.toLocaleString("pt-BR") : null)}
        ${item("Técnico", esc(c.tecnico))}
        ${item("Jogadores ativos", c.elenco.length)}
        ${item("Valor do elenco", `<span class="valor">${formatarValor(c.valor_total)}</span>`)}
      </div>
      <section class="secao">
        <div class="secao-titulo"><h2>Elenco</h2><span class="mudo pequeno">por valor de mercado</span></div>
        ${c.elenco.length
          ? `<div class="grade-cards">${c.elenco.map((j, i) => cardJogador(j, i)).join("")}</div>`
          : `<p class="vazio">Nenhum jogador ativo neste clube na base.</p>`}
      </section>`;
  } catch (erro) {
    mostrarErro(elClube, erro);
  }
}

iniciar();
