// Formatação, ícones e frases dos passos — usados pelas páginas e pelas animações.

// ------------------------------------------------------------------ ícones
// Conjunto único: Lucide (https://lucide.dev, licença ISC), embutido como SVG.
const ICONES = {
  busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  anterior: '<path d="m15 18-6-6 6-6"/>',
  proximo: '<path d="m9 18 6-6-6-6"/>',
  lua: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  bastidores: '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  inicio: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  faixa: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  marcador: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  relogio: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  tocar: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pausar: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  voltar: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
  avancar: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  repetir: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  linear: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  hierarquica: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
  certo: '<path d="M20 6 9 17l-5-5"/>',
};
export const icone = (nome) =>
  `<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome]}</svg>`;

// -------------------------------------------------------------- formatação
export function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

export function formatarValor(valor) {
  if (valor === null || valor === undefined) return "—";
  if (valor >= 1e9) return `€${(valor / 1e9).toFixed(1).replace(".", ",")} bi`;
  if (valor >= 1e6) {
    const m = valor / 1e6;
    return `€${m >= 100 || Number.isInteger(m) ? Math.round(m) : m.toFixed(1).replace(".", ",")}M`;
  }
  if (valor >= 1e3) return `€${Math.round(valor / 1e3)}K`;
  return `€${valor}`;
}

export function formatarData(iso) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Rótulo de um nó do rastro: "erling haaland|418560" -> "erling haaland". */
export function nomeDoNo(no) {
  if (no === null || no === undefined) return "—";
  const texto = String(no);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return formatarData(texto);
  if (/^\d+\|\d+$/.test(texto)) return formatarValor(Number(texto.split("|")[0])); // (valor, id)
  return texto.split("|")[0];
}

// ------------------------------------------------------ frases dos passos
const DIRECAO = { esquerda: "desce à esquerda", direita: "desce à direita", igual: "é igual — achou" };

/** Frase em português para um passo do rastro. */
export function descreverPasso(p) {
  const no = nomeDoNo(p.no);
  switch (p.passo) {
    case "compara":
      if (p.decisao === "sobe") return `Nível ${p.nivel}: “${no}” ainda é menor — sobe um nível`;
      if (p.decisao === "perto") return `Nível ${p.nivel}: o próximo marco (“${no}”) já passa do alvo — está perto, parte do dedo`;
      if (p.decisao === "longe") return `Nível ${p.nivel}: o próximo marco (“${no}”) ainda é menor — está longe, recomeça da cabeça`;
      if (p.nivel !== undefined) {
        return p.decisao === "avanca"
          ? `Nível ${p.nivel}: “${no}” é menor — avança${p.largura ? ` (salta ${p.largura})` : ""}`
          : `Nível ${p.nivel}: ${p.no === "sentinela" ? "chegou ao sentinela" : `“${no}” não é menor`} — desce`;
      }
      if (p.posicao !== undefined) return `Posição ${p.posicao}: compara com “${no}” — ${p.igual ? "achou" : "não é"}`;
      if (p.meio !== undefined) return `Busca binária: meio = ${p.meio} (“${no}”), segue à ${p.decisao}`;
      if (p.decisao === "visita") return `Visita ${no} (percurso em ordem)`;
      return `Compara com “${no}”: ${DIRECAO[p.decisao] || p.decisao}`;
    case "inicio": return `Começa na cabeça, no nível ${p.nivel}`;
    case "encontrado": return `Encontrado: “${no}”${p.posicao ? ` (posição ${p.posicao})` : ""}`;
    case "nao_encontrado": return "Não encontrado";
    case "move_inicio": return `Move “${no}” da posição ${p.de} para o início`;
    case "transpoe": return `Troca “${no}” com “${nomeDoNo(p.com)}” (posição ${p.de} → ${p.para})`;
    case "pontua": return `“${no}” ganha 1 ponto — pontuação agora ${p.pontuacao}`;
    case "avanca": return `“${no}” avança da posição ${p.de} para ${p.para}, ultrapassando ${p.ultrapassados.length} liga(s)`;
    case "permanece": return `“${no}” permanece na posição ${p.posicao}`;
    case "rotacao": return `Rotação à ${p.direcao} em “${no}”: “${nomeDoNo(p.pivo)}” sobe`;
    case "caso": return `Caso ${p.caso} para “${nomeDoNo(p.alvo)}”`;
    case "raiz": return `“${no}” agora é a raiz`;
    case "acesso": return `Acesso ${p.contador} de ${p.limite} a “${no}”${p.contador < p.limite ? " — ainda não afunila" : " — afunila"}`;
    case "desbalanceado": return `“${no}” desbalanceado (fator ${p.fator}): caso ${p.caso}`;
    case "insere": return `Insere “${no}”`;
    case "salta": return `Nível ${p.nivel}: salta para “${no}” (posição ${p.posicao})`;
    case "desce": return `Desce do nível ${p.nivel}`;
    case "percorre": return `Percorre ${p.nos} nós do nível 0, um a um, até a página pedida`;
    case "divide": return `Primeiro nó dentro do período: ${no}`;
    case "subarvore_inteira": return `Subárvore de ${no} cabe inteira no período — usa o máximo guardado (${formatarValor(p.max_sub)})`;
    case "descarta": return `Descarta a subárvore de ${no} (fora do período)`;
    case "segue_maximo": return `Segue o máximo até ${no}`;
    case "pico": return `Pico: ${no} — ${formatarValor(p.valor)}`;
    case "nivel_por_valor": return `Nível de “${no}” pelo valor: ${p.nivel}`;
    case "sorteio": return `Moeda sorteou o nível ${p.nivel} para “${no}”`;
    case "liga": return `Liga “${no}” no nível ${p.nivel}`;
    case "desliga": return `Desliga “${no}” do nível ${p.nivel}`;
    case "remove": return `Remove “${no}”`;
    case "duplicada": return `“${no}” já está na estrutura`;
    case "dedo": return `Parte do dedo, no nível ${p.nivel} (busca anterior: “${nomeDoNo(p.de)}”)`;
    case "conta_subarvore": return `${no} e toda a sua subárvore esquerda são menores: soma ${p.quantidade} de uma vez (total ${p.total})`;
    case "contagem": return `Diferença entre as duas posições: ${p.quantidade} na faixa`;
    case "percorre_intervalo": return `Percorre os ${p.nos} jogadores da faixa, um a um, para contar`;
    case "vizinhos": return `${p.sentido === "sucessores" ? "Sucessores (mais caros)" : "Predecessores (mais baratos)"}: ${p.quantidade} da mesma posição entre ${p.visitados} vizinhos`;
    default: return `${p.passo} ${p.no ? no : ""}`;
  }
}

