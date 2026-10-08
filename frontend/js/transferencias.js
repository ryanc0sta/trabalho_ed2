// Janela de transferências. Ação principal: "Ver transferências".
// As transferências ficam numa lista ordenada pela data; duas buscas binárias
// acham onde o período começa e termina. A busca por interpolação roda junto,
// só para comparar o número de comparações.

import { api } from "./api.js?v=7";
import {
  esc, formatarData, formatarValor, iniciarPagina, mostrarErro, parametro, registrarOperacao, selo,
} from "./comum.js?v=7";

iniciarPagina();

const ATALHOS = [
  { texto: "Verão de 2025", de: "2025-06-01", ate: "2025-09-01" },
  { texto: "Inverno de 2025", de: "2025-01-01", ate: "2025-02-03" },
  { texto: "Verão de 2024", de: "2024-06-01", ate: "2024-09-01" },
  { texto: "Ano de 2020", de: "2020-01-01", ate: "2020-12-31" },
];
let de = parametro("de") || ATALHOS[0].de;
let ate = parametro("ate") || ATALHOS[0].ate;

const el = document.getElementById("transferencias");
el.innerHTML = `
  <h1>Janela de transferências</h1>
  <p class="introducao">As maiores transferências de um período. ${selo("transferencias")}</p>
  <form class="consulta" id="form-janela" style="margin-top:var(--e4)">
    <label>De<input type="date" id="de" value="${esc(de)}" required></label>
    <label>Até<input type="date" id="ate" value="${esc(ate)}" required></label>
    <button class="botao principal">Ver transferências</button>
  </form>
  <div class="atalhos">
    ${ATALHOS.map((a, i) => `<button class="botao pequeno" type="button" data-atalho="${i}">${esc(a.texto)}</button>`).join("")}
  </div>
  <p class="leitura" id="resumo" aria-live="polite"></p>
  <div id="tabela" style="margin-top:var(--e3)"></div>`;
const elResumo = document.getElementById("resumo");
const elTabela = document.getElementById("tabela");
const campoDe = document.getElementById("de");
const campoAte = document.getElementById("ate");

document.getElementById("form-janela").addEventListener("submit", (e) => {
  e.preventDefault();
  de = campoDe.value;
  ate = campoAte.value;
  carregar();
});
el.querySelectorAll("[data-atalho]").forEach((b) => b.addEventListener("click", () => {
  const atalho = ATALHOS[Number(b.dataset.atalho)];
  campoDe.value = de = atalho.de;
  campoAte.value = ate = atalho.ate;
  carregar();
}));

const clube = (id, nome) => (id ? `<a class="link" href="clube.html?id=${id}">${esc(nome)}</a>` : esc(nome || "—"));

async function carregar() {
  if (de > ate) {
    elResumo.textContent = "A data inicial deve vir antes da final.";
    elTabela.innerHTML = "";
    return;
  }
  history.replaceState(null, "", `?de=${de}&ate=${ate}`);
  elTabela.innerHTML = `<div class="esqueleto" style="height:240px"></div>`;
  try {
    const dados = await api.transferencias(de, ate, 30);
    const periodo = `entre ${formatarData(de)} e ${formatarData(ate)}`;
    elResumo.innerHTML = dados.total
      ? `<b>${dados.total.toLocaleString("pt-BR")}</b> transferências ${periodo}${dados.total > dados.transferencias.length ? ` — as ${dados.transferencias.length} de maior taxa:` : ":"}`
      : `Nenhuma transferência ${periodo}.`;
    elTabela.innerHTML = dados.total ? `
      <table class="transferencias">
        <thead><tr><th>Jogador</th><th>Saída</th><th>Chegada</th><th>Taxa</th><th class="so-largo">Data</th></tr></thead>
        <tbody>${dados.transferencias.map((t) => `
          <tr>
            <td><a class="link" href="jogador.html?id=${t.jogador_id}"><b>${esc(t.jogador)}</b></a></td>
            <td>${clube(t.de_clube_id, t.de_clube)}</td>
            <td>${clube(t.para_clube_id, t.para_clube)}</td>
            <td class="num">${t.taxa ? formatarValor(t.taxa) : "—"}</td>
            <td class="num so-largo">${formatarData(t.data)}</td>
          </tr>`).join("")}</tbody>
      </table>` : "";
    const { comparacoes_binaria: binaria, comparacoes_interpolacao: interpolacao } = dados;
    registrarOperacao({
      ferramenta: "transferencias",
      acao: true,
      titulo: `Transferências ${periodo}`,
      rastro: dados.rastro,
      cena: { chave: "dia", total: dados.na_base },
      resultado: `Período localizado com ${binaria} comparações entre ${dados.na_base.toLocaleString("pt-BR")} transferências. `
        + (interpolacao > binaria
          ? `A busca por interpolação precisaria de ${interpolacao}: ela supõe datas bem espalhadas, e aqui elas se concentram em janeiro e julho.`
          : `A busca por interpolação faria ${interpolacao}.`),
    });
  } catch (erro) {
    mostrarErro(elTabela, erro);
  }
}

carregar();
