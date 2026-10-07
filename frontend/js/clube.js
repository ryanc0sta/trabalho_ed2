// Página do clube: ficha e elenco atual (clube encontrado na AVL de clubes).

import { api } from "./api.js?v=4";
import { cardJogador, esc, formatarValor, iniciarPagina, mostrarErro, parametro } from "./comum.js?v=4";

iniciarPagina();

const clubeId = parametro("id");
const elClube = document.getElementById("clube");

async function iniciar() {
  if (!clubeId) {
    elClube.innerHTML = `<p class="aviso">Clube não informado.</p>`;
    return;
  }
  elClube.innerHTML = `<div class="esqueleto" style="height:80px"></div>`;
  try {
    const c = await api.clube(clubeId);
    document.title = `${c.nome} · Scout Explorer`;
    const ficha = [
      c.liga ? `<a class="link" href="liga.html?id=${encodeURIComponent(c.liga.id)}">${esc(c.liga.nome)}</a>` : null,
      c.estadio ? `${esc(c.estadio)}${c.capacidade ? ` <span class="num">(${c.capacidade.toLocaleString("pt-BR")})</span>` : ""}` : null,
      c.tecnico ? `Técnico <b>${esc(c.tecnico)}</b>` : null,
    ].filter(Boolean);
    elClube.innerHTML = `
      <div class="cabecalho">
        <img class="escudo-grande" src="${esc(c.escudo)}" alt="" referrerpolicy="no-referrer">
        <div>
          <h1>${esc(c.nome)}</h1>
          <p class="ficha">${ficha.join(" · ")}</p>
        </div>
      </div>
      <section class="secao">
        <div class="secao-titulo">
          <h2>Elenco</h2>
          <span class="meta num">${c.elenco.length} jogadores · ${formatarValor(c.valor_total)}</span>
        </div>
        ${c.elenco.length
          ? `<div class="grade">${c.elenco.map((j, i) => cardJogador(j, i)).join("")}</div>`
          : `<p class="vazio">Sem jogadores ativos na base.</p>`}
      </section>`;
  } catch (erro) {
    mostrarErro(elClube, erro);
  }
}

iniciar();
