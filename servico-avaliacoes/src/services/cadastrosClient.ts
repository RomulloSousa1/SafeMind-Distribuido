import { HttpError } from '../errors/httpError.js';

const CADASTROS_URL = process.env.CADASTROS_URL || 'http://servico-cadastros:3002';

/** Comunicação síncrona (HTTP) com o serviço de cadastros, repassando o JWT do chamador. */
export async function validarEmpresaAtiva(empresaId: string, authorization: string): Promise<void> {
  let resp: Response;
  try {
    resp = await fetch(`${CADASTROS_URL}/api/empresas/${encodeURIComponent(empresaId)}`, {
      headers: { Authorization: authorization },
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    throw new HttpError(503, 'Serviço de cadastros indisponível.');
  }

  if (resp.status === 404) {
    throw new HttpError(404, 'Empresa não encontrada ou inativa no serviço de cadastros.');
  }
  if (!resp.ok) {
    throw new HttpError(502, `Serviço de cadastros respondeu ${resp.status}.`);
  }
  const empresa = (await resp.json()) as { ativa?: boolean };
  if (empresa.ativa === false) {
    throw new HttpError(404, 'Empresa não encontrada ou inativa no serviço de cadastros.');
  }
}
