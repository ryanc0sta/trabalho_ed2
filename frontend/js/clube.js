// Página do clube: ficha, elenco atual e a Máquina do tempo — quanto valia,
// numa data passada, cada jogador do elenco de hoje (uma busca de piso na
// árvore de histórico de cada um).

import { api } from "./api.js?v=6";
import {
  cardJogador, esc, formatarData, formatarValor, iniciarPagina, mostrarErro, parametro,
  registrarOperacao, selo,
} from "./comum.js?v=6";

iniciarPagina();

const clubeId = parametro("id");
const elClube = document.getElementById("clube");
const ANO_ATUAL = new Date().getFullYear();
const PRIMEIRO_ANO = 2010;
let clube = null;

function renderizarElenco(titulo, resumo, jogadores, legenda = () => null) {
  document.getElementById("elenco").innerHTML = `
    <div class="secao-titulo"><h2>${esc(titulo)}</h2><span class="meta num">${esc(resumo)}</span></div>
    ${jogadores.length
      ? `<div class="grade">${jogadores.map((j, i) => cardJogador(j, i, legenda(j))).join("")}</div>`
      : `<p class="vazio">Nenhum jogador com avaliação nessa data.</p>`}`;
}

function mostrarHoje() {
  document.getElementById("rotulo-ano").textContent = "Hoje";
  document.getElementById("valor-ano").textContent = formatarValor(clube.valor_total);
  renderizarElenco("Elenco", `${clube.elenco.length} jogadores · ${formatarValor(clube.valor_total)}`, clube.elenco);
}

let espera = null;
let pedido = 0;
function mudarAno(ano) {
  clearTimeout(espera);
  if (ano >= ANO_ATUAL) {
    pedido += 1;
    mostrarHoje();
    return;
  }
  document.getElementById("rotulo-ano").textContent = `Julho de ${ano}`;
  espera = setTimeout(() => viajar(`${ano}-07-01`, ano), 160); // o controle dispara vários eventos ao arrastar
}

async function viajar(data, ano) {
  const meu = ++pedido;
  try {
    const dados = await api.maquina(clubeId, data);
    if (meu !== pedido) return;
    document.getElementById("valor-ano").textContent = `${formatarValor(dados.total)} · hoje ${formatarValor(dados.hoje)}`;
    renderizarElenco(
      `Elenco de hoje em julho de ${ano}`,
      `${dados.com_valor} de ${dados.elenco} já tinham avaliação · ${formatarValor(dados.total)}`,
      dados.jogadores.map((j) => ({ ...j, valor: j.valor_na_data })),
      (j) => `Avaliação de ${formatarData(j.avaliacao)}`,
    );
    registrarOperacao({
      ferramenta: "maquina",
      acao: true,
      titulo: `${clube.nome} em julho de ${ano}`,
      rastro: dados.rastro,
      cena: {
        arvore: dados.arvore, alvo: dados.alvo,
        legendaFinal: dados.alvo ? `Resposta para ${dados.primeiro}: a avaliação de ${formatarData(dados.alvo)}, a última até a data pedida.` : null,
      },
      resultado: `Uma busca em cada um dos ${dados.elenco} históricos: ${dados.comparacoes} comparações no total. A animação mostra a de ${dados.primeiro}.`,
    });
  } catch (erro) {
    if (meu === pedido) mostrarErro(document.getElementById("elenco"), erro);
  }
}

async function iniciar() {
  if (!clubeId) {
    elClube.innerHTML = `<p class="aviso">Clube não informado.</p>`;
    return;
  }
  elClube.innerHTML = `<div class="esqueleto" style="height:80px"></div>`;
  try {
    clube = await api.clube(clubeId);
    document.title = `${clube.nome} · Scout Explorer`;
    const ficha = [
      clube.liga ? `<a class="link" href="liga.html?id=${encodeURIComponent(clube.liga.id)}">${esc(clube.liga.nome)}</a>` : null,
      clube.estadio ? `${esc(clube.estadio)}${clube.capacidade ? ` <span class="num">(${clube.capacidade.toLocaleString("pt-BR")})</span>` : ""}` : null,
      clube.tecnico ? `Técnico <b>${esc(clube.tecnico)}</b>` : null,
    ].filter(Boolean);
    elClube.innerHTML = `
      <div class="cabecalho">
        <img class="escudo-grande" src="${esc(clube.escudo)}" alt="" referrerpolicy="no-referrer">
        <div>
          <h1>${esc(clube.nome)}</h1>
          <p class="ficha">${ficha.join(" · ")}</p>
        </div>
      </div>
      ${clube.elenco.length ? `
        <section class="filtro">
          <div class="linha">
            <label class="rotulo" for="ano">Máquina do tempo: <span id="rotulo-ano">Hoje</span></label>
            <span class="grupo-selo"><span class="meta num" id="valor-ano"></span>${selo("maquina")}</span>
          </div>
          <input id="ano" type="range" min="${PRIMEIRO_ANO}" max="${ANO_ATUAL}" value="${ANO_ATUAL}">
          <div class="extremos"><span>${PRIMEIRO_ANO}</span><span>Hoje</span></div>
        </section>` : ""}
      <section class="secao" id="elenco" style="margin-top:var(--e5)"></section>`;
    if (clube.elenco.length) {
      document.getElementById("ano").addEventListener("input", (e) => mudarAno(Number(e.target.value)));
      mostrarHoje();
    } else {
      document.getElementById("elenco").innerHTML = `<p class="vazio">Sem jogadores ativos na base.</p>`;
    }
  } catch (erro) {
    mostrarErro(elClube, erro);
  }
}

iniciar();
