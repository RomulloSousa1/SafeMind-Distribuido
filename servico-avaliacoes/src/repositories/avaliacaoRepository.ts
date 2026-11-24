import { pool } from '../database.js';
import { Avaliacao, NivelRisco, Resposta, StatusResposta } from '../models/avaliacao.js';

interface AvaliacaoRow {
  id: string;
  empresa_id: string;
  titulo: string;
  setor: string;
  criado_em: string;
}

interface RespostaRow {
  id: string;
  avaliacao_id: string;
  sobrecarga_trabalho: number;
  suporte_lideranca: number;
  clareza_papel: number;
  ambiente_fisico: number;
  status: StatusResposta;
  pontuacao: number | null;
  nivel_risco: NivelRisco | null;
  criado_em: string;
  processado_em: string | null;
}

const toAvaliacao = (r: AvaliacaoRow): Avaliacao => ({
  id: r.id,
  empresaId: r.empresa_id,
  titulo: r.titulo,
  setor: r.setor,
  criadoEm: r.criado_em
});

const toResposta = (r: RespostaRow): Resposta => ({
  id: r.id,
  avaliacaoId: r.avaliacao_id,
  sobrecargaTrabalho: r.sobrecarga_trabalho,
  suporteLideranca: r.suporte_lideranca,
  clarezaPapel: r.clareza_papel,
  ambienteFisico: r.ambiente_fisico,
  status: r.status,
  pontuacao: r.pontuacao,
  nivelRisco: r.nivel_risco,
  criadoEm: r.criado_em,
  processadoEm: r.processado_em
});

export const avaliacaoRepository = {
  async criar(a: Avaliacao): Promise<void> {
    await pool.query(
      'INSERT INTO avaliacoes (id, empresa_id, titulo, setor, criado_em) VALUES ($1,$2,$3,$4,$5)',
      [a.id, a.empresaId, a.titulo, a.setor, a.criadoEm]
    );
  },

  async listar(): Promise<Avaliacao[]> {
    const { rows } = await pool.query<AvaliacaoRow>('SELECT * FROM avaliacoes ORDER BY criado_em');
    return rows.map(toAvaliacao);
  },

  async buscarPorId(id: string): Promise<Avaliacao | undefined> {
    const { rows } = await pool.query<AvaliacaoRow>('SELECT * FROM avaliacoes WHERE id = $1', [id]);
    return rows[0] ? toAvaliacao(rows[0]) : undefined;
  }
};

export const respostaRepository = {
  async criar(r: Resposta): Promise<void> {
    await pool.query(
      `INSERT INTO respostas (id, avaliacao_id, sobrecarga_trabalho, suporte_lideranca, clareza_papel,
         ambiente_fisico, status, criado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [r.id, r.avaliacaoId, r.sobrecargaTrabalho, r.suporteLideranca, r.clarezaPapel,
        r.ambienteFisico, r.status, r.criadoEm]
    );
  },

  /** Idempotente: só atualiza respostas ainda PENDENTES (reentrega do broker não duplica). */
  async marcarProcessada(id: string, pontuacao: number, nivel: NivelRisco): Promise<boolean> {
    const res = await pool.query(
      `UPDATE respostas SET status = 'PROCESSADA', pontuacao = $2, nivel_risco = $3, processado_em = $4
       WHERE id = $1 AND status = 'PENDENTE'`,
      [id, pontuacao, nivel, new Date().toISOString()]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async listarPorAvaliacao(avaliacaoId: string): Promise<Resposta[]> {
    const { rows } = await pool.query<RespostaRow>(
      'SELECT * FROM respostas WHERE avaliacao_id = $1 ORDER BY criado_em',
      [avaliacaoId]
    );
    return rows.map(toResposta);
  }
};
