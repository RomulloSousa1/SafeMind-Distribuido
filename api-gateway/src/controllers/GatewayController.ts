import { Request, Response } from 'express';

export class GatewayController {
  private readonly servicoAvaliacoesUrl: string;
  private readonly servicoCadastrosUrl: string;
  private readonly servicoAutenticacaoUrl: string;

  constructor() {
    this.servicoAvaliacoesUrl = process.env.SERVICO_AVALIACOES_URL || 'http://localhost:3001';
    this.servicoCadastrosUrl = process.env.SERVICO_CADASTROS_URL || 'http://localhost:3002';
    this.servicoAutenticacaoUrl = process.env.SERVICO_AUTENTICACAO_URL || 'http://localhost:3003';
  }

  // --- Verificação de Saúde do Cluster Distribuído ---
  obterStatusCluster = async (_req: Request, res: Response): Promise<void> => {
    const checarServico = async (nome: string, url: string) => {
      try {
        const resp = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
        if (resp.ok) {
          const dados = await resp.json();
          return { nome, status: 'ONLINE', url, dados };
        }
        return { nome, status: 'DEGRADED', url, erro: `HTTP ${resp.status}` };
      } catch (e: any) {
        return { nome, status: 'OFFLINE', url, erro: e.message };
      }
    };

    const [statusA, statusB, statusC] = await Promise.all([
      checarServico('Microsserviço A (Avaliações)', this.servicoAvaliacoesUrl),
      checarServico('Microsserviço B (Cadastros)', this.servicoCadastrosUrl),
      checarServico('Microsserviço C (Autenticação)', this.servicoAutenticacaoUrl)
    ]);

    res.status(200).json({
      gateway: { nome: 'API Gateway Principal', status: 'ONLINE', porta: 3000 },
      servicosInternos: [statusA, statusB, statusC],
      topologia: 'Síncrona (Postman -> Gateway:3000 -> Servicos Internos: 3001, 3002, 3003)',
      timestamp: new Date()
    });
  };

  // --- Rotas de Avaliações (Microsserviço A) ---
  criarAvaliacao = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes`;
    console.log(`[GATEWAY] [SYNC] Requisição recebida do cliente. Disparando chamada HTTP Síncrona (Ex1) -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  buscarAvaliacaoPorId = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes/${req.params.id}`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  listarAvaliacoes = async (req: Request, res: Response): Promise<void> => {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes${qs}`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  submeterResposta = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes/${req.params.id}/respostas`;
    console.log(`[GATEWAY] [SYNC] Encaminhando resposta de questionário psicossocial -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  obterRelatorioAvaliacao = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAvaliacoesUrl}/avaliacoes/${req.params.id}/relatorio`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  // --- Rotas de Cadastros (Microsserviço B) ---
  criarEmpresa = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoCadastrosUrl}/empresas`;
    console.log(`[GATEWAY] [SYNC] Cadastrando empresa no Microsserviço B -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  buscarEmpresaPorId = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoCadastrosUrl}/empresas/${req.params.id}`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  listarEmpresas = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoCadastrosUrl}/empresas`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  criarColaborador = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoCadastrosUrl}/colaboradores`;
    console.log(`[GATEWAY] [SYNC] Cadastrando colaborador no Microsserviço B -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  listarColaboradores = async (req: Request, res: Response): Promise<void> => {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const destino = `${this.servicoCadastrosUrl}/colaboradores${qs}`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  // --- Rotas de Autenticação (Microsserviço C) ---
  registrarUsuario = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAutenticacaoUrl}/auth/registrar`;
    console.log(`[GATEWAY] [SYNC] Registrando novo usuário no Microsserviço C -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAutenticacaoUrl}/auth/login`;
    console.log(`[GATEWAY] [SYNC] Autenticando usuário (CPF + Senha) no Microsserviço C -> ${destino}`);
    await this.repassarRequisicao(req, res, destino, 'POST');
  };

  validarToken = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAutenticacaoUrl}/auth/validar`;
    await this.repassarRequisicao(req, res, destino, req.method);
  };

  buscarUsuarioPorId = async (req: Request, res: Response): Promise<void> => {
    const destino = `${this.servicoAutenticacaoUrl}/auth/usuarios/${req.params.id}`;
    await this.repassarRequisicao(req, res, destino, 'GET');
  };

  // Helper de despacho de rede
  private async repassarRequisicao(req: Request, res: Response, url: string, metodo: string): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Forwarded-By': 'SafeMind-API-Gateway'
      };

      if (req.headers.authorization) {
        headers['Authorization'] = String(req.headers.authorization);
      }

      const opcoes: RequestInit = {
        method: metodo,
        headers,
        signal: AbortSignal.timeout(10000)
      };

      if (['POST', 'PUT', 'PATCH'].includes(metodo)) {
        opcoes.body = JSON.stringify(req.body);
      }

      const resposta = await fetch(url, opcoes);
      const corpo = await resposta.json().catch(() => ({}));

      res.status(resposta.status).json(corpo);
    } catch (err: any) {
      console.error(`[GATEWAY] [ERRO] Erro ao comunicar com serviço interno (${url}):`, err.message);
      if (err.name === 'TimeoutError') {
        res.status(504).json({
          erro: 'Gateway Timeout',
          detalhe: `Tempo limite de requisição excedido ao comunicar com ${url}.`
        });
        return;
      }
      if (err.cause?.code === 'ECONNREFUSED') {
        res.status(503).json({
          erro: 'Serviço interno indisponível',
          detalhe: `Não foi possível conectar em ${url}. Certifique-se de que os microsserviços estão ativos.`
        });
        return;
      }
      res.status(502).json({
        erro: 'Bad Gateway',
        detalhe: err.message
      });
    }
  }
}
