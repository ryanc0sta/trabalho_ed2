// Página da liga. Ação principal: o filtro "Todos ↔ Só os destaques", que
// percorre os níveis da lista com saltos (cada nível tem metade dos jogadores
// do anterior — os mais valiosos, na versão modificada).

import { api, modoAtual } from "./api.js?v=6";
import {
  cardJogador, esc, esqueletos, formatarValor, fotoHTML, icone, idade, iniciarPagina, mostrarErro, parametro,
  registrarOperacao, selo,
} from "./comum.js?v=6";

iniciarPagina();

const ligaId = parametro("id");
const elCabecalho = document.getElementById("cabecalho");
const elFiltro = document.getElementById("filtro");
const elJogadores = document.getElementById("jogadores");
const elPaginacao = document.getElementById("paginacao");
const POR_PAGINA = 24;

let detalhe = null;
let nivel = 0;
let pagina = 1;
let alvoId = null; // jogador a destacar depois de "Ir para um nome"

const niveisDoModo = () => (modoAtual() === "modificado" ? detalhe.niveis : detalhe.niveis_classica);

function nivelInicial() {
  // O nível mais alto que ainda enche a primeira página.
  const niveis = niveisDoModo();
  for (let k = niveis.length - 1; k >= 0; k--) if (niveis[k].jogadores >= 12) return k;
  return 0;
}

function renderizarCabecalho() {
  document.title = `${detalhe.nome} · Scout Explorer`;
  elCabecalho.innerHTML = `
    <div class="cabecalho">
      <img class="escudo-grande" src="${esc(detalhe.logo)}" alt="" referrerpolicy="no-referrer">
      <div>
        <h1>${esc(detalhe.nome)}</h1>
        <p class="meta">${esc(detalhe.pais || "")} · <span class="num">${detalhe.jogadores}</span> jogadores ·
          <span class="num">${formatarValor(detalhe.valor_total)}</span></p>
      </div>
    </div>`;
}

function rotuloDoNivel(k) {
  const info = niveisDoModo()[k];
  if (k === 0) return `Todos os ${info.jogadores} jogadores`;
  if (modoAtual() === "modificado") return `Acima de ${formatarValor(info.valor_minimo)}`;
  return `Amostra de ${info.jogadores} jogadores`;
}

function renderizarFiltro() {
  const maximo = niveisDoModo().length - 1;
  elFiltro.classList.remove("oculto");
  elFiltro.innerHTML = `
    <div class="linha">
      <label class="rotulo" for="nivel" id="rotulo-nivel"></label>
      <span class="grupo-selo"><span class="meta num" id="contagem-nivel"></span>${selo("destaques")}</span>
    </div>
    <input id="nivel" type="range" min="0" max="${maximo}" value="${nivel}">
    <div class="extremos"><span>Todos</span><span>Só os destaques</span></div>
    <div class="linha" style="margin-top:var(--e2)">
      <div class="busca ir-para">
        <div class="campo">${icone("busca")}
          <input type="search" id="ir-para" placeholder="Ir para um nome" aria-label="Ir para um nome na lista da liga" autocomplete="off">
        </div>
      </div>
      <span class="grupo-selo"><span class="meta" id="aviso-ir-para" aria-live="polite"></span>${selo("ir-para")}</span>
    </div>`;
  elFiltro.querySelector("#nivel").addEventListener("input", (e) => mudarNivel(Number(e.target.value)));
  elFiltro.querySelector("#ir-para").addEventListener("input", (e) => {
    clearTimeout(esperaIrPara);
    const texto = e.target.value.trim();
    esperaIrPara = setTimeout(() => irPara(texto), 180);
  });
  atualizarRotulo();
}

// "Ir para um nome": acha o primeiro jogador a partir do texto digitado e abre
// a página em que ele está. Digitar letra a letra faz buscas vizinhas, e cada
// uma parte de onde a anterior parou (busca dedilhada).
let esperaIrPara = null;
async function irPara(texto) {
  const aviso = document.getElementById("aviso-ir-para");
  if (!texto) {
    aviso.textContent = "";
    return;
  }
  try {
    const achado = await api.irPara(ligaId, texto, POR_PAGINA);
    registrarOperacao({
      ferramenta: "ir-para",
      acao: true,
      titulo: `Ir para “${texto}” em ${detalhe.nome}`,
      rastro: achado.rastro,
      resultado: achado.posicao
        ? `Chegou a ${achado.jogador.nome}, o ${achado.posicao}º de ${detalhe.jogadores}, com ${achado.rastro.comparacoes} comparações.`
        : `Nenhum nome a partir de “${texto}”.`,
    });
    if (!achado.posicao) {
      aviso.textContent = `Nenhum nome a partir de “${texto}”.`;
      return;
    }
    aviso.textContent = `${achado.jogador.nome} · ${achado.posicao}º em ordem alfabética`;
    alvoId = achado.jogador.id;
    nivel = 0; // a ordem alfabética completa é a do nível "Todos"
    pagina = achado.pagina;
    elFiltro.querySelector("#nivel").value = 0;
    atualizarRotulo();
    carregarJogadores();
  } catch (erro) {
    aviso.textContent = erro.message;
  }
}

function atualizarRotulo() {
  const info = niveisDoModo()[nivel];
  document.getElementById("rotulo-nivel").textContent = rotuloDoNivel(nivel);
  document.getElementById("contagem-nivel").textContent = nivel === 0 ? "" : `${info.jogadores} jogadores`;
}

let espera = null;
function mudarNivel(novo) {
  if (novo === nivel) return;
  nivel = novo;
  pagina = 1;
  atualizarRotulo();
  clearTimeout(espera);
  espera = setTimeout(() => carregarJogadores(true), 120); // o range dispara vários eventos ao arrastar
}

let pedido = 0;
/** `porUsuario`: veio de um gesto direto (filtro ou paginação), e não da abertura da página. */
async function carregarJogadores(porUsuario = false) {
  const meu = ++pedido;
  [...elJogadores.children].forEach((c) => c.classList.add("sair"));
  try {
    const [dados] = await Promise.all([
      api.jogadoresDaLiga(ligaId, nivel, pagina, POR_PAGINA),
      new Promise((r) => setTimeout(r, elJogadores.children.length ? 150 : 0)),
    ]);
    if (meu !== pedido) return;
    elJogadores.innerHTML = dados.jogadores.length
      ? dados.jogadores.map((j, i) => cardJogador(j, i)).join("")
      : `<p class="vazio">Nenhum jogador aqui.</p>`;
    renderizarPaginacao(dados);
    if (alvoId !== null) {
      const alvo = elJogadores.querySelector(`a[href="jogador.html?id=${alvoId}"]`);
      alvo?.classList.add("alvo");
      alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
      alvoId = null;
    }
    const passosDaPagina = dados.rastro.passos.length;
    registrarOperacao({
      ferramenta: "destaques",
      acao: porUsuario,
      titulo: dados.nivel === 0
        ? `${detalhe.nome}: todos os jogadores, página ${dados.pagina}`
        : `${detalhe.nome}: vista do nível ${dados.nivel}`,
      rastro: dados.rastro,
      // Num nível alto não há busca: o desenho mostra as torres que chegam até ele.
      cena: { torres: dados.jogadores.map((j) => ({ no: j.no, nivel: j.nivel })), nivel: dados.nivel },
      resultado: dados.nivel === 0
        ? (passosDaPagina ? `Chegou ao começo da página ${dados.pagina} em ${passosDaPagina} ${passosDaPagina === 1 ? "passo" : "passos"}.` : "")
        : `No nível ${dados.nivel} só aparecem ${dados.total} das ${detalhe.jogadores} torres: as mais altas.`,
    });
  } catch (erro) {
    if (meu === pedido) mostrarErro(elJogadores, erro);
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
    carregarJogadores(true);
    elFiltro.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

async function iniciar() {
  if (!ligaId) {
    elCabecalho.innerHTML = `<p class="aviso">Liga não informada.</p>`;
    return;
  }
  elJogadores.innerHTML = esqueletos(12);
  try {
    // Abrir a página conta como uma visita à liga na lista autoorganizável.
    const [acesso, dados] = await Promise.all([api.acessarLiga(ligaId), api.liga(ligaId)]);
    detalhe = dados;
    const passo = acesso.rastro.passos.find((p) => ["avanca", "move_inicio"].includes(p.passo));
    const itens = (ligas) => ligas.map((l) => ({ id: l.id, rotulo: l.id, titulo: l.nome }));
    registrarOperacao({
      ferramenta: "ligas",
      acao: true,
      titulo: `Visita a ${detalhe.nome}`,
      rastro: acesso.rastro,
      cena: { antes: itens(acesso.antes), depois: itens(acesso.depois) },
      resultado: passo
        ? `${detalhe.nome} foi da ${passo.de + 1}ª para a ${passo.para + 1}ª posição entre as ligas.`
        : `${detalhe.nome} manteve a posição entre as ligas.`,
    });
    nivel = nivelInicial();
    renderizarCabecalho();
    renderizarFiltro();
    carregarJogadores();
    carregarRecordes();
  } catch (erro) {
    mostrarErro(elCabecalho, erro);
    elJogadores.innerHTML = "";
  }
}

// Os extremos da liga: o mais velho, o mais jovem, o mais baixo e o mais alto.
async function carregarRecordes() {
  const alvo = document.getElementById("recordes");
  try {
    const dados = await api.extremos(ligaId);
    const e = dados.extremos;
    const anos = (j) => `${idade(j.nascimento)} anos`;
    const metros = (j) => `${(j.altura / 100).toFixed(2).replace(".", ",")} m`;
    const itens = [
      ["Mais jovem", e.mais_jovem, anos], ["Mais velho", e.mais_velho, anos],
      ["Mais alto", e.mais_alto, metros], ["Mais baixo", e.mais_baixo, metros],
    ].filter(([, jogador]) => jogador);
    if (!itens.length) return;
    alvo.innerHTML = `
      <div class="recordes">
        ${itens.map(([rotulo, j, medida]) => `
          <a class="recorde" href="jogador.html?id=${j.id}">
            ${fotoHTML(j.foto, j.nome, "avatar")}
            <div><div class="meta">${rotulo} · <span class="num">${medida(j)}</span></div><div class="nome">${esc(j.nome)}</div></div>
          </a>`).join("")}
        ${selo("extremos")}
      </div>`;
    registrarOperacao({
      ferramenta: "extremos",
      titulo: `Extremos de ${detalhe.nome}`,
      rastro: dados.rastro,
      cena: { arvore: dados.arvore },
      resultado: `O mais velho e o mais jovem entre ${detalhe.jogadores} jogadores, com ${dados.rastro.comparacoes} comparações: são as duas pontas do grupo da liga na árvore.`,
    });
  } catch {
    alvo.innerHTML = "";
  }
}

window.addEventListener("modo", () => {
  if (!detalhe) return;
  nivel = nivelInicial();
  pagina = 1;
  renderizarFiltro();
  carregarJogadores();
});

iniciar();
