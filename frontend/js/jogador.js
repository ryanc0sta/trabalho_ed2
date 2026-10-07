// Página do jogador. Abrir a página conta como acesso na árvore de busca e
// nos "vistos por você". O histórico vem de uma AVL aumentada:
//   - clicar no gráfico = valor naquela data (busca de piso);
//   - "Ver pico" = maior valor no período (máximo guardado nas subárvores).

import { api, modoAtual } from "./api.js?v=3";
import {
  animarNumero, atualizarLateral, cardJogador, esc, fotoHTML, formatarData, formatarValor, icone, idade,
  iniciarPagina, mostrarErro, parametro, registrarOperacao, traduzirPe, traduzirPosicao,
} from "./comum.js?v=3";

iniciarPagina();

const jogadorId = parametro("id");
const elJogador = document.getElementById("jogador");
let dados = null;
let grafico = null;
let destaque = null; // {data, valor} marcado no gráfico

const paraTempo = (iso) => new Date(iso + "T00:00:00").getTime();
const paraIso = (tempo) => new Date(tempo).toISOString().slice(0, 10);

function fato(rotulo, valor) {
  return valor ? `<div><dt>${esc(rotulo)}</dt><dd>${esc(valor)}</dd></div>` : "";
}

function renderizar() {
  const j = dados.jogador;
  document.title = `${j.nome} · Scout Explorer`;
  const historico = dados.historico;
  const primeira = historico[0]?.data;
  const ultima = historico[historico.length - 1]?.data;
  const anos = idade(j.nascimento);
  const ranking = dados.ranking_liga;

  elJogador.innerHTML = `
    <section class="perfil">
      ${fotoHTML(j.foto, j.nome, "retrato")}
      <div>
        <h1>${esc(j.nome)}</h1>
        <div class="vinculo">
          ${dados.clube ? `<img src="${esc(dados.clube.escudo)}" alt="" referrerpolicy="no-referrer">
            <a class="link" href="clube.html?id=${dados.clube.id}">${esc(dados.clube.nome)}</a>` : ""}
          ${dados.liga ? `<span aria-hidden="true">·</span><a class="link" href="liga.html?id=${encodeURIComponent(dados.liga.id)}">${esc(dados.liga.nome)}</a>` : ""}
          ${j.ativo ? "" : `<span>· inativo desde ${j.ultima_temporada}</span>`}
        </div>
        <div class="valor-atual"><span id="valor-atual">€0</span>
          <small>${ranking ? `${ranking.posicao}º mais valioso de ${ranking.total} na liga` : "valor de mercado"}</small>
        </div>
        <dl class="fatos">
          ${fato("Posição", traduzirPosicao(j.sub_posicao || j.posicao))}
          ${fato("Idade", anos !== null ? `${anos} anos` : null)}
          ${fato("Nacionalidade", j.cidadania)}
          ${fato("Altura", j.altura ? `${(j.altura / 100).toFixed(2).replace(".", ",")} m` : null)}
          ${fato("Pé", traduzirPe(j.pe) === "—" ? null : traduzirPe(j.pe))}
          ${fato("Contrato até", j.contrato ? formatarData(j.contrato) : null)}
        </dl>
        <div class="acoes-perfil"><button class="botao" id="botao-lista"></button></div>
      </div>
    </section>

    <section class="secao">
      <div class="secao-titulo"><h2>Valor de mercado</h2></div>
      ${historico.length ? `
        <form class="consulta" id="form-pico">
          <label>De<input type="date" id="pico-de" value="${esc(primeira)}" min="${esc(primeira)}" max="${esc(ultima)}" required></label>
          <label>Até<input type="date" id="pico-ate" value="${esc(ultima)}" min="${esc(primeira)}" max="${esc(ultima)}" required></label>
          <button class="botao principal">Ver pico</button>
        </form>
        <div class="grafico"><canvas id="grafico" aria-label="Histórico do valor de mercado" role="img"></canvas></div>
        <p class="leitura" id="leitura" aria-live="polite">Clique no gráfico para ver o valor em qualquer data.</p>`
        : `<p class="vazio">Sem histórico de valores.</p>`}
    </section>

    <section class="secao oculto" id="secao-parecidos">
      <div class="secao-titulo"><h2>Parecidos</h2><span class="meta">Mesma posição, valor próximo</span></div>
      <div class="grade" id="parecidos"></div>
    </section>

    <section class="secao">
      <div class="secao-titulo"><h2>Transferências</h2></div>
      ${dados.transferencias.length ? `
        <table class="transferencias">
          <thead><tr><th>Data</th><th>Saída</th><th>Chegada</th><th>Taxa</th></tr></thead>
          <tbody>${[...dados.transferencias].reverse().map((t) => `
            <tr>
              <td class="num">${formatarData(t.data)}</td>
              <td>${clubeLink(t.de_clube_id, t.de_clube)}</td>
              <td>${clubeLink(t.para_clube_id, t.para_clube)}</td>
              <td class="num">${t.taxa ? formatarValor(t.taxa) : "—"}</td>
            </tr>`).join("")}</tbody>
        </table>`
        : `<p class="vazio">Nenhuma transferência registrada.</p>`}
    </section>`;

  animarNumero(document.getElementById("valor-atual"), j.valor);
  const botaoLista = document.getElementById("botao-lista");
  atualizarBotaoLista(botaoLista);
  botaoLista.addEventListener("click", () => alternarLista(botaoLista));
  carregarParecidos();
  if (historico.length) {
    desenharGrafico();
    document.getElementById("form-pico").addEventListener("submit", calcularPico);
  }
}

function clubeLink(id, nome) {
  return id ? `<a class="link" href="clube.html?id=${id}">${esc(nome)}</a>` : esc(nome || "—");
}

// ------------------------------------------------------------ minha lista
function atualizarBotaoLista(botao) {
  botao.setAttribute("aria-pressed", String(dados.na_lista));
  botao.innerHTML = dados.na_lista ? `${icone("certo")}Na sua lista` : `${icone("marcador")}Adicionar à lista`;
  botao.title = dados.na_lista ? "Remover da sua lista" : "Guardar este jogador na sua lista";
}

async function alternarLista(botao) {
  botao.disabled = true;
  try {
    const nome = dados.jogador.nome;
    const resposta = dados.na_lista ? await api.removerDaLista(jogadorId) : await api.adicionarALista(jogadorId);
    registrarOperacao({
      titulo: dados.na_lista ? `Remover ${nome} da lista` : `Adicionar ${nome} à lista`,
      estrutura: `Lista com saltos · ${dados.na_lista ? "remoção" : "inserção"}`,
      rastro: resposta.rastro,
      resumo: [`${resposta.total} na lista`],
    });
    dados.na_lista = !dados.na_lista;
    atualizarBotaoLista(botao);
    atualizarLateral();
  } finally {
    botao.disabled = false;
  }
}

// --------------------------------------------------------------- parecidos
async function carregarParecidos() {
  try {
    const resposta = await api.parecidos(jogadorId);
    if (!resposta.jogadores.length) return;
    document.getElementById("parecidos").innerHTML = resposta.jogadores.map((j, i) => cardJogador(j, i)).join("");
    document.getElementById("secao-parecidos").classList.remove("oculto");
    registrarOperacao({
      titulo: `Parecidos com ${dados.jogador.nome}`,
      estrutura: "AVL por valor · sucessores e predecessores",
      rastro: resposta.rastro,
    });
  } catch {
    /* a seção apenas não aparece */
  }
}

// ------------------------------------------------------------------ gráfico
function cor(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

function desenharGrafico() {
  grafico?.destroy();
  const pontos = dados.historico.map((h) => ({ x: paraTempo(h.data), y: h.valor, data: h.data }));
  grafico = new Chart(document.getElementById("grafico"), {
    type: "line",
    data: {
      datasets: [
        {
          data: pontos, stepped: "before", borderColor: cor("--tinta"), borderWidth: 2,
          pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: cor("--tinta"),
        },
        {
          data: destaque ? [{ x: paraTempo(destaque.data), y: destaque.valor, data: destaque.data }] : [],
          showLine: false, pointRadius: 7, pointHoverRadius: 7,
          pointBackgroundColor: cor("--acao"), pointBorderColor: cor("--fundo"), pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cor("--tinta"), titleColor: cor("--fundo"), bodyColor: cor("--fundo"),
          displayColors: false, cornerRadius: 8, padding: 8,
          titleFont: { family: "IBM Plex Mono" }, bodyFont: { family: "IBM Plex Mono" },
          filter: (item) => item.datasetIndex === 0,
          callbacks: { title: (i) => formatarData(i[0].raw.data), label: (i) => formatarValor(i.raw.y) },
        },
      },
      scales: {
        x: {
          type: "linear", border: { color: cor("--borda") }, grid: { display: false },
          ticks: { color: cor("--tinta-2"), font: { family: "IBM Plex Mono", size: 12 },
            callback: (v) => new Date(v).getFullYear(), maxTicksLimit: 8 },
        },
        y: {
          border: { display: false }, grid: { color: cor("--borda") },
          ticks: { color: cor("--tinta-2"), font: { family: "IBM Plex Mono", size: 12 },
            callback: (v) => formatarValor(v), maxTicksLimit: 6 },
        },
      },
      onClick: (evento, _itens, chart) => consultarValor(paraIso(chart.scales.x.getValueForPixel(evento.x))),
    },
  });
}

function marcar(data, valor) {
  destaque = data ? { data, valor } : null;
  if (!grafico) return;
  grafico.data.datasets[1].data = destaque ? [{ x: paraTempo(data), y: valor, data }] : [];
  grafico.update();
}

// ------------------------------------------------------------- consultas
async function consultarValor(data) {
  const leitura = document.getElementById("leitura");
  try {
    const resposta = await api.valorEm(jogadorId, data);
    const r = resposta.resultado;
    leitura.innerHTML = r
      ? `Em ${formatarData(data)}: <b>${formatarValor(r.valor)}</b> (avaliação de ${formatarData(r.data)})`
      : `Sem avaliação até ${formatarData(data)}.`;
    marcar(r?.data, r?.valor);
    registrarOperacao({ titulo: `Valor em ${formatarData(data)}`, estrutura: "AVL · busca de piso", rastro: resposta.rastro });
  } catch (erro) {
    leitura.textContent = erro.message;
  }
}

async function calcularPico(evento) {
  evento.preventDefault();
  const de = document.getElementById("pico-de").value;
  const ate = document.getElementById("pico-ate").value;
  const leitura = document.getElementById("leitura");
  if (de > ate) {
    leitura.textContent = "A data inicial deve vir antes da final.";
    return;
  }
  try {
    const resposta = await api.pico(jogadorId, de, ate);
    const r = resposta.resultado;
    leitura.innerHTML = r
      ? `Pico entre ${formatarData(de)} e ${formatarData(ate)}: <b>${formatarValor(r.valor)}</b> em ${formatarData(r.data)}`
      : "Nenhuma avaliação no período.";
    marcar(r?.data, r?.valor);
    registrarOperacao({
      titulo: `Pico entre ${formatarData(de)} e ${formatarData(ate)}`,
      estrutura: modoAtual() === "modificado" ? "AVL aumentada · máximo da subárvore" : "AVL · percurso em ordem",
      rastro: resposta.rastro,
    });
  } catch (erro) {
    leitura.textContent = erro.message;
  }
}

// ------------------------------------------------------------------ início
async function iniciar() {
  if (!jogadorId) {
    elJogador.innerHTML = `<p class="aviso">Jogador não informado.</p>`;
    return;
  }
  elJogador.innerHTML = `<div class="esqueleto" style="height:300px"></div>`;
  try {
    // Abrir a página = acessar o jogador na árvore de busca (e nos vistos).
    const [acesso, detalhe] = await Promise.all([api.acessarJogador(jogadorId), api.jogador(jogadorId)]);
    dados = detalhe;
    renderizar();
    const passoAcesso = acesso.rastro.passos.find((p) => p.passo === "acesso");
    const rotacoes = acesso.rastro.passos.filter((p) => p.passo === "rotacao").length;
    registrarOperacao({
      titulo: `Visita a ${dados.jogador.nome}`,
      estrutura: modoAtual() === "modificado" ? "Árvore afunilada condicional" : "Árvore afunilada",
      rastro: acesso.rastro,
      resumo: [
        passoAcesso ? `acesso ${passoAcesso.contador} de ${passoAcesso.limite}` : null,
        rotacoes ? `${rotacoes} rotações até a raiz` : "sem rotações",
      ].filter(Boolean),
    });
    registrarOperacao({
      titulo: `Montagem do histórico de ${dados.jogador.nome}`,
      estrutura: "AVL aumentada · inserções em ordem",
      rastro: dados.rastro_montagem,
      resumo: [`${dados.rastro_montagem.passos.filter((p) => p.passo === "rotacao").length} rotações`],
    });
  } catch (erro) {
    mostrarErro(elJogador, erro);
  }
}

window.addEventListener("tema", () => { if (dados?.historico.length) desenharGrafico(); });
iniciar();
