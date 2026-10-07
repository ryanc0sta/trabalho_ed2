// Acesso à API do backend. Todas as funções devolvem o JSON da resposta.

export function modoAtual() {
  try {
    return localStorage.getItem("modo") === "classico" ? "classico" : "modificado";
  } catch {
    return "modificado";
  }
}

export function definirModo(modo) {
  try {
    localStorage.setItem("modo", modo);
  } catch {
    /* sem armazenamento: o modo vale só até recarregar */
  }
  window.dispatchEvent(new CustomEvent("modo", { detail: modo }));
}

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

const comModo = (params = {}) => ({ ...params, modo: modoAtual() });

export const api = {
  ligas: () => pedir("/ligas", { params: comModo() }),
  acessarLiga: (id) => pedir(`/ligas/${id}/acessar`, { metodo: "POST", params: comModo() }),
  liga: (id) => pedir(`/ligas/${id}`),
  jogadoresDaLiga: (id, nivel, pagina, porPagina = 24) =>
    pedir(`/ligas/${id}/jogadores`, { params: comModo({ nivel, pagina, por_pagina: porPagina }) }),
  estrutura: (id, params) => pedir(`/ligas/${id}/estrutura`, { params: comModo(params) }),
  localizar: (ligaId, jogadorId) => pedir(`/ligas/${ligaId}/localizar/${jogadorId}`, { params: comModo() }),
  busca: (q, limite = 8) => pedir("/busca", { params: { q, limite } }),
  acessarJogador: (id) => pedir(`/jogadores/${id}/acessar`, { metodo: "POST", params: comModo() }),
  emAlta: (niveis = 3) => pedir("/em-alta", { params: comModo({ niveis }) }),
  frequentes: () => pedir("/frequentes"),
  jogador: (id) => pedir(`/jogadores/${id}`),
  valorEm: (id, data) => pedir(`/jogadores/${id}/valor`, { params: { data } }),
  pico: (id, de, ate) => pedir(`/jogadores/${id}/pico`, { params: comModo({ de, ate }) }),
  clube: (id) => pedir(`/clubes/${id}`),
  // ferramentas da barra lateral
  lateral: () => pedir("/lateral"),
  minhaLista: () => pedir("/minha-lista", { params: comModo() }),
  adicionarALista: (id) => pedir(`/minha-lista/${id}`, { metodo: "PUT", params: comModo() }),
  removerDaLista: (id) => pedir(`/minha-lista/${id}`, { metodo: "DELETE", params: comModo() }),
  registrarBusca: (q) => pedir("/buscas", { metodo: "POST", params: { q } }),
  faixa: (minimo, maximo, pagina, porPagina = 24) =>
    pedir("/faixa", { params: comModo({ minimo, maximo, pagina, por_pagina: porPagina }) }),
  irPara: (ligaId, q, porPagina = 24) =>
    pedir(`/ligas/${ligaId}/ir-para`, { params: comModo({ q, por_pagina: porPagina }) }),
  parecidos: (id) => pedir(`/jogadores/${id}/parecidos`),
};
