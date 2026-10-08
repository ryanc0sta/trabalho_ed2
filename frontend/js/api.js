// Acesso à API do backend. Todas as funções devolvem o JSON da resposta.
// O site usa sempre as estruturas do trabalho (as modificadas, onde houver); o servidor
// ainda aceita ?modo=classico nas rotas, usado nos testes e nas medições.

async function pedir(caminho, { metodo = "GET", params = {} } = {}) {
  const url = new URL("/api" + caminho, location.origin);
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== "") url.searchParams.set(chave, valor);
  }
  const resposta = await fetch(url, { method: metodo });
  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status}`;
    try {
      const corpo = await resposta.json();
      if (typeof corpo.detail === "string") mensagem = corpo.detail;
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(mensagem);
  }
  return resposta.json();
}

export const api = {
  ligas: () => pedir("/ligas"),
  acessarLiga: (id) => pedir(`/ligas/${id}/acessar`, { metodo: "POST" }),
  liga: (id) => pedir(`/ligas/${id}`),
  jogadoresDaLiga: (id, nivel, pagina, porPagina = 24) =>
    pedir(`/ligas/${id}/jogadores`, { params: { nivel, pagina, por_pagina: porPagina } }),
  estrutura: (id, params) => pedir(`/ligas/${id}/estrutura`, { params }),
  localizar: (ligaId, jogadorId) => pedir(`/ligas/${ligaId}/localizar/${jogadorId}`),
  busca: (q, limite = 8) => pedir("/busca", { params: { q, limite } }),
  acessarJogador: (id) => pedir(`/jogadores/${id}/acessar`, { metodo: "POST" }),
  emAlta: (quantos = 6) => pedir("/em-alta", { params: { quantos } }),
  frequentes: () => pedir("/frequentes"),
  jogador: (id) => pedir(`/jogadores/${id}`),
  valorEm: (id, data) => pedir(`/jogadores/${id}/valor`, { params: { data } }),
  pico: (id, de, ate) => pedir(`/jogadores/${id}/pico`, { params: { de, ate } }),
  clube: (id) => pedir(`/clubes/${id}`),
  // ferramentas da barra lateral
  lateral: () => pedir("/lateral"),
  minhaLista: () => pedir("/minha-lista"),
  adicionarALista: (id) => pedir(`/minha-lista/${id}`, { metodo: "PUT" }),
  removerDaLista: (id) => pedir(`/minha-lista/${id}`, { metodo: "DELETE" }),
  registrarBusca: (q) => pedir("/buscas", { metodo: "POST", params: { q } }),
  limparBuscas: () => pedir("/buscas", { metodo: "DELETE" }),
  recomendados: (jogadorId) => pedir("/recomendados", { params: { jogador_id: jogadorId } }),
  faixa: (minimo, maximo, pagina, porPagina = 24) =>
    pedir("/faixa", { params: { minimo, maximo, pagina, por_pagina: porPagina } }),
  irPara: (ligaId, q, porPagina = 24) =>
    pedir(`/ligas/${ligaId}/ir-para`, { params: { q, por_pagina: porPagina } }),
  parecidos: (id) => pedir(`/jogadores/${id}/parecidos`),
  // segunda leva
  posicoes: () => pedir("/posicoes"),
  acessarPosicao: (id) => pedir(`/posicoes/${encodeURIComponent(id)}/acessar`, { metodo: "POST" }),
  jogadoresDaPosicao: (id, nivel, pagina, porPagina = 24) =>
    pedir(`/posicoes/${encodeURIComponent(id)}/jogadores`, { params: { nivel, pagina, por_pagina: porPagina } }),
  transferencias: (de, ate, limite = 30) => pedir("/transferencias", { params: { de, ate, limite } }),
  comparar: (ids) => pedir("/comparar", { params: { ids: ids.join(",") } }),
  extremos: (ligaId) => pedir(`/ligas/${ligaId}/extremos`),
  maquina: (clubeId, data) => pedir(`/clubes/${clubeId}/maquina`, { params: { data } }),
};
