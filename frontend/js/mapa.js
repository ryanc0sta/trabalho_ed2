// Página "Estruturas usadas": qual estrutura cada ferramenta do site adota,
// separadas em lineares e hierárquicas, com a indicação de quais foram
// modificadas em relação à versão clássica (e o que mudou).

import {
  ESTRUTURAS, FERRAMENTAS, esc, etiquetaDeVersao, icone, iniciarPagina,
} from "./comum.js?v=7";

iniciarPagina();

const ferramentas = Object.entries(FERRAMENTAS);
const doTipo = (tipo) => ferramentas.filter(([, f]) => ESTRUTURAS[f.estrutura].tipo === tipo);
const modificadas = ferramentas.filter(([, f]) => f.modificada).length;

const linha = ([id, f]) => `
  <li class="mapa-linha">
    <div>
      <div class="nome">${esc(f.nome)}</div>
      <div class="meta">${esc(ESTRUTURAS[f.estrutura].nome)}</div>
      ${f.modificada ? `<p class="mudou">${esc(f.mudou)}${f.medido ? ` <span class="medido">${esc(f.medido)}</span>` : ""}</p>` : ""}
    </div>
    ${etiquetaDeVersao(id)}
    <button class="botao pequeno" type="button" data-selo="${id}">Como funciona</button>
  </li>`;

const grupo = (tipo, titulo, descricao) => `
  <section class="secao">
    <div class="secao-titulo">
      <h2>${icone(tipo)} ${titulo}</h2>
      <span class="meta num">${doTipo(tipo).length} ferramentas</span>
    </div>
    <p class="meta" style="margin:calc(-1 * var(--e2)) 0 var(--e2)">${descricao}</p>
    <ul class="mapa-lista">${doTipo(tipo).map(linha).join("")}</ul>
  </section>`;

document.getElementById("estruturas").innerHTML = `
  <h1>Estruturas usadas</h1>
  <p class="introducao">Cada ferramenta do site se apoia numa lista ou numa árvore.
    Das ${ferramentas.length} ferramentas, <b>${modificadas}</b> usam uma estrutura modificada em relação à versão clássica; as outras usam a estrutura como ela é ensinada.</p>
  ${grupo("linear", "Estruturas lineares", "Os elementos ficam em sequência, um depois do outro: listas encadeadas, listas ordenadas e listas com saltos.")}
  ${grupo("hierarquica", "Estruturas hierárquicas", "Os elementos ficam em níveis, cada um com até dois filhos: árvores de busca.")}`;
