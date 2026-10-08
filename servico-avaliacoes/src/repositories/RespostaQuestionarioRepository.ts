import type Database from 'better-sqlite3';
import { RespostaQuestionario } from '../models/RespostaQuestionario.js';
import { NivelRisco } from '../models/Avaliacao.js';
import { db } from '../database.js';

export interface IRespostaQuestionarioRepository {
  criar(resposta: RespostaQuestionario): Promise<RespostaQuestionario>;
  listarPorAvaliacao(avaliacaoId: string): Promise<RespostaQuestionario[]>;
  contarPorAvaliacao(avaliacaoId: string): Promise<number>;
}

export class RespostaQuestionarioRepository implements IRespostaQuestionarioRepository {
  private readonly dbInstance: Database.Database;

  constructor(databaseInstance?: Database.Database) {
    this.dbInstance = databaseInstance || db;
  }

  private mapear(row: any): RespostaQuestionario {
    return {
      id: row.id,
      avaliacaoId: row.avaliacaoId,
      colaboradorId: row.colaboradorId || undefined,
      sobrecargaTrabalho: Number(row.sobrecargaTrabalho),
      suporteLideranca: Number(row.suporteLideranca),
      clarezaPapel: Number(row.clarezaPapel),
      ambienteFisico: Number(row.ambienteFisico),
      scoreIndividual: Number(row.scoreIndividual),
      nivelRisco: row.nivelRisco as NivelRisco,
      submetidoEm: new Date(row.submetidoEm)
    };
  }

  async criar(resposta: RespostaQuestionario): Promise<RespostaQuestionario> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO respostas_questionario (
        id, avaliacaoId, colaboradorId, sobrecargaTrabalho,
        suporteLideranca, clarezaPapel, ambienteFisico, scoreIndividual,
        nivelRisco, submetidoEm
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      resposta.id,
      resposta.avaliacaoId,
      resposta.colaboradorId || null,
      resposta.sobrecargaTrabalho,
      resposta.suporteLideranca,
      resposta.clarezaPapel,
      resposta.ambienteFisico,
      resposta.scoreIndividual,
      resposta.nivelRisco,
      resposta.submetidoEm.toISOString()
    );

    return { ...resposta };
  }

  async listarPorAvaliacao(avaliacaoId: string): Promise<RespostaQuestionario[]> {
    const stmt = this.dbInstance.prepare('SELECT * FROM respostas_questionario WHERE avaliacaoId = ? ORDER BY submetidoEm ASC');
    const rows = stmt.all(avaliacaoId) as any[];
    return rows.map(r => this.mapear(r));
  }

  async contarPorAvaliacao(avaliacaoId: string): Promise<number> {
    const stmt = this.dbInstance.prepare('SELECT COUNT(*) as total FROM respostas_questionario WHERE avaliacaoId = ?');
    const row = stmt.get(avaliacaoId) as { total: number } | undefined;
    return row ? Number(row.total) : 0;
  }
}
