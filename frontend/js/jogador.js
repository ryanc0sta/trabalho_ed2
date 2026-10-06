// Página do jogador. Abrir a página conta como acesso na árvore afunilada
// (busca) e na lista de frequentes. O histórico de valores vem de uma AVL
// aumentada: valor numa data (busca de piso) e pico num período.

import { api, modoAtual } from "./api.js";
import {
  animarNumero, esc, fotoHTML, formatarData, formatarValor, idade, iniciarPagina, mostrarErro,
  parametro, registrarOperacao, traduzirPe, traduzirPosicao,
} from "./comum.js";

iniciarPagina();

const jogadorId = parametro("id");
const elJogador = document.getElementById("jogador");
let dados = null;
let grafico = null;

const dataParaTempo = (iso) => new Date(iso + "T00:00:00").getTime();

function chip(rotulo, valor) {
  return valor === null || valor === undefined || valor === "" || valor === "—"
    ? "" : `<span class="chip">${esc(rotulo)} <b>${esc(valor)}</b></span>`;
}

function renderizar() {
  const j = dados.jogador;
  document.title = `${j.nome} · Scout Explorer`;
  const anos = idade(j.nascimento);
  const historico = dados.historico;
  const primeira = historico[0]?.data;
  const ultima = historico[historico.length - 1]?.data;

  elJogador.innerHTML = `
    <section class="jogador-heroi">
      ${fotoHTML(j.foto, j.nome, "retrato")}
      <div>
        <span class="etiqueta-estrutura">${j.ativo ? `${esc(traduzirPosicao(j.sub_posicao || j.posicao))}` : `Inativo desde ${j.ultima_temporada}`}</span>
        <h1 style="margin-top:10px">${esc(j.nome)}</h1>
        <div class="clube">
          ${dados.clube ? `<img src="${esc(dados.clube.escudo)}" alt="" referrerpolicy="no-referrer">
            <a href="clube.html?id=${dados.clube.id}">${esc(dados.clube.nome)}</a>` : ""}
          ${dados.liga ? `<span>·</span><a href="liga.html?id=${encodeURIComponent(dados.liga.id)}">${esc(dados.liga.nome)}</a>` : ""}
        </div>
        <div class="valor-grande" id="valor-atual">€0</div>
        <div class="chips">
          ${dados.ranking_liga ? `<span class="chip">Ranking na liga <b>#${dados.ranking_liga.posicao}</b> de ${dados.ranking_liga.total}</span>` : ""}
          ${chip("Valor máximo", formatarValor(j.valor_maximo))}
          ${chip("Idade", anos !== null ? `${anos} anos` : null)}
          ${chip("Altura", j.altura ? `${(j.altura / 100).toFixed(2).replace(".", ",")} m` : null)}
          ${chip("Pé", traduzirPe(j.pe))}
          ${chip("Nacionalidade", j.cidadania)}
          ${chip("Nascido em", j.pais_nascimento)}
          ${chip("Contrato até", j.contrato ? formatarData(j.contrato) : null)}
          ${chip("Seleção", j.jogos_selecao ? `${j.jogos_selecao} jogos, ${j.gols_selecao ?? 0} gols` : null)}
          ${chip("Agente", j.agente)}
        </div>
      </div>
    </section>

    <div class="duas-colunas secao">
      <section class="painel">
        <div class="secao-titulo"><h2>Valor de mercado</h2><span class="etiqueta-estrutura">AVL aumentada · ${historico.length} nós</span></div>
        ${historico.length
          ? `<div class="grafico-caixa"><canvas id="grafico" aria-label="Histórico do valor de mercado"></canvas></div>`
          : `<p class="vazio">Sem histórico de valores para este jogador.</p>`}
      </section>

      <section class="ferramentas">
        <div class="painel ferramenta">
          <h3>Quanto valia em… <span class="etiqueta-estrutura">Busca de piso</span></h3>
          <form class="linha-form" id="form-valor">
            <input type="date" id="data-valor" value="${esc(primeira ? meioDoHistorico(primeira, ultima) : "")}" required>
            <button class="botao primario" ${historico.length ? "" : "disabled"}>Consultar</button>
          </form>
          <div class="resposta" id="resposta-valor"></div>
        </div>
        <div class="painel ferramenta">
          <h3>Pico no período <span class="etiqueta-estrutura">${modoAtual() === "modificado" ? "Máximo da subárvore" : "Percurso em ordem"}</span></h3>
          <form class="linha-form" id="form-pico">
            <input type="date" id="pico-de" value="${esc(primeira || "")}" required>
            <span class="mudo">até</span>
            <input type="date" id="pico-ate" value="${esc(ultima || "")}" required>
            <button class="botao primario" ${historico.length ? "" : "disabled"}>Calcular</button>
          </form>
          <div class="resposta" id="resposta-pico"></div>
        </div>
      </section>
    </div>

    <section class="secao painel">
      <div class="secao-titulo"><h2>Transferências</h2><span class="etiqueta-estrutura">Lista ordenada · intervalo do jogador</span></div>
      ${dados.transferencias.length
        ? `<ol class="linha-tempo">${[...dados.transferencias].reverse().map((t) => `
            <li>
              <div class="data">${formatarData(t.data)} · temporada ${esc(t.temporada)}</div>
              <div class="clubes">${clubeLink(t.de_clube_id, t.de_clube)}<span class="seta">→</span>${clubeLink(t.para_clube_id, t.para_clube)}</div>
              <div class="pequeno mudo">Taxa ${t.taxa ? `<span class="valor">${formatarValor(t.taxa)}</span>` : "não informada / livre"}
                ${t.valor_mercado ? ` · valor de mercado na época ${formatarValor(t.valor_mercado)}` : ""}</div>
            </li>`).join("")}</ol>`
        : `<p class="vazio">Nenhuma transferência registrada.</p>`}
    </section>`;

  animarNumero(document.getElementById("valor-atual"), j.valor);
  if (historico.length) desenharGrafico();
  document.getElementById("form-valor").addEventListener("submit", consultarValor);
  document.getElementById("form-pico").addEventListener("submit", calcularPico);
}

function clubeLink(id, nome) {
  return id ? `<a href="clube.html?id=${id}">${esc(nome)}</a>` : esc(nome || "—");
}

function meioDoHistorico(de, ate) {
  const meio = new Date((dataParaTempo(de) + dataParaTempo(ate)) / 2);
  return meio.toISOString().slice(0, 10);
}

// ------------------------------------------------------------------ gráfico
function desenharGrafico() {
  const pontos = dados.historico.map((h) => ({ x: dataParaTempo(h.data), y: h.valor, data: h.data }));
  const estilo = getComputedStyle(document.documentElement);
  const cor = (nome) => estilo.getPropertyValue(nome).trim();
  grafico = new Chart(document.getElementById("grafico"), {
    type: "line",
    data: {
      datasets: [
        {
          label: "Valor de mercado",
          data: pontos,
          stepped: "before",
          borderColor: cor("--verde"),
          backgroundColor: "rgba(52, 211, 153, 0.12)",
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2.5,
        },
        {
          label: "Destaque",
          data: [],
          pointRadius: 9,
          pointHoverRadius: 10,
          pointBackgroundColor: cor("--ouro"),
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: "easeOutQuart" },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (itens) => formatarData(itens[0].raw.data),
            label: (item) => ` ${formatarValor(item.raw.y)}`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          ticks: { color: cor("--texto-3"), callback: (v) => new Date(v).getFullYear(), maxTicksLimit: 8 },
          grid: { color: "rgba(255,255,255,0.04)" },
        },
        y: {
          ticks: { color: cor("--texto-3"), callback: (v) => formatarValor(v) },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
      },
    },
  });
}

function destacarNoGrafico(data, valor) {
  if (!grafico) return;
  grafico.data.datasets[1].data = data ? [{ x: dataParaTempo(data), y: valor, data }] : [];
  grafico.update();
}

// ------------------------------------------------------------- ferramentas
async function consultarValor(evento) {
  evento.preventDefault();
  const data = document.getElementById("data-valor").value;
  const alvo = document.getElementById("resposta-valor");
  try {
    const resposta = await api.valorEm(jogadorId, data);
    const r = resposta.resultado;
    alvo.innerHTML = r
      ? `<span class="valor">${formatarValor(r.valor)}</span> <span class="mudo">— avaliação de ${formatarData(r.data)}, a mais recente até ${formatarData(data)}</span>`
      : `<span class="mudo">Não há avaliação até ${formatarData(data)}.</span>`;
    destacarNoGrafico(r?.data, r?.valor);
    registrarOperacao({
      titulo: `Valor em ${formatarData(data)}`,
      estrutura: "AVL · busca de piso",
      rastro: resposta.rastro,
    });
  } catch (erro) {
    alvo.innerHTML = `<span class="aviso">${esc(erro.message)}</span>`;
  }
}

async function calcularPico(evento) {
  evento.preventDefault();
  const de = document.getElementById("pico-de").value;
  const ate = document.getElementById("pico-ate").value;
  const alvo = document.getElementById("resposta-pico");
  if (de > ate) {
    alvo.innerHTML = `<span class="mudo">A data inicial deve ser anterior à final.</span>`;
    return;
  }
  try {
    const resposta = await api.pico(jogadorId, de, ate);
    const r = resposta.resultado;
    alvo.innerHTML = r
      ? `<span class="valor">${formatarValor(r.valor)}</span> <span class="mudo">em ${formatarData(r.data)} · ${resposta.rastro.comparacoes} comparações</span>`
      : `<span class="mudo">Nenhuma avaliação no período.</span>`;
    destacarNoGrafico(r?.data, r?.valor);
    registrarOperacao({
      titulo: `Pico entre ${formatarData(de)} e ${formatarData(ate)}`,
      estrutura: modoAtual() === "modificado" ? "AVL aumentada · máximo da subárvore" : "AVL · percurso em ordem",
      rastro: resposta.rastro,
    });
  } catch (erro) {
    alvo.innerHTML = `<span class="aviso">${esc(erro.message)}</span>`;
  }
}

// ------------------------------------------------------------------ início
async function iniciar() {
  if (!jogadorId) {
    elJogador.innerHTML = `<div class="aviso">Jogador não informado.</div>`;
    return;
  }
  elJogador.innerHTML = `<div class="esqueleto" style="height:300px"></div>`;
  try {
    // Abrir a página = acessar o jogador na árvore afunilada (e nos frequentes).
    const [acesso, detalhe] = await Promise.all([api.acessarJogador(jogadorId), api.jogador(jogadorId)]);
    dados = detalhe;
    renderizar();
    const acessoPasso = acesso.rastro.passos.find((p) => p.passo === "acesso");
    const rotacoes = acesso.rastro.passos.filter((p) => p.passo === "rotacao").length;
    registrarOperacao({
      titulo: `Abrir ${dados.jogador.nome}`,
      estrutura: modoAtual() === "modificado" ? "Árvore afunilada condicional" : "Árvore afunilada",
      rastro: acesso.rastro,
      resumo: [
        acessoPasso ? `acesso ${acessoPasso.contador || acessoPasso.limite} de ${acessoPasso.limite}` : null,
        rotacoes ? `${rotacoes} rotações — virou a raiz` : "sem rotações",
      ].filter(Boolean),
    });
    registrarOperacao({
      titulo: `Montagem do histórico de ${dados.jogador.nome}`,
      estrutura: "AVL aumentada · inserções em ordem",
      rastro: dados.rastro_montagem,
      resumo: [`${dados.rastro_montagem.passos.filter((p) => p.passo === "rotacao").length} rotações`],
      silencioso: true,
    });
  } catch (erro) {
    mostrarErro(elJogador, erro);
  }
}

window.addEventListener("modo", () => { if (dados) renderizar(); });
iniciar();
