import type Database from 'better-sqlite3';
import { Avaliacao, StatusAvaliacao, NivelRisco } from '../models/Avaliacao.js';
import { db } from '../database.js';

export interface IAvaliacaoRepository {
  criar(avaliacao: Avaliacao): Promise<Avaliacao>;
  buscarPorId(id: string): Promise<Avaliacao | null>;
  listarPorEmpresa(empresaId?: string): Promise<Avaliacao[]>;
  atualizar(id: string, dados: Partial<Avaliacao>): Promise<Avaliacao | null>;
}

export class AvaliacaoRepository implements IAvaliacaoRepository {
  private readonly dbInstance: Database.Database;

  constructor(databaseInstance?: Database.Database) {
    this.dbInstance = databaseInstance || db;
  }

  private mapear(row: any): Avaliacao {
    return {
      id: row.id,
      empresaId: row.empresaId,
      empresaRazaoSocial: row.empresaRazaoSocial || undefined,
      titulo: row.titulo,
      setor: row.setor,
      status: row.status as StatusAvaliacao,
      nivelRiscoGeral: (row.nivelRiscoGeral as NivelRisco) || undefined,
      scoreMedio: row.scoreMedio !== null && row.scoreMedio !== undefined ? Number(row.scoreMedio) : undefined,
      totalRespostas: Number(row.totalRespostas),
      criadaEm: new Date(row.criadaEm),
      atualizadaEm: new Date(row.atualizadaEm)
    };
  }

  async criar(avaliacao: Avaliacao): Promise<Avaliacao> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO avaliacoes (
        id, empresaId, empresaRazaoSocial, titulo, setor, status,
        nivelRiscoGeral, scoreMedio, totalRespostas, criadaEm, atualizadaEm
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      avaliacao.id,
      avaliacao.empresaId,
      avaliacao.empresaRazaoSocial || null,
      avaliacao.titulo,
      avaliacao.setor,
      avaliacao.status,
      avaliacao.nivelRiscoGeral || null,
      avaliacao.scoreMedio !== undefined ? avaliacao.scoreMedio : null,
      avaliacao.totalRespostas,
      avaliacao.criadaEm.toISOString(),
      avaliacao.atualizadaEm.toISOString()
    );

    return { ...avaliacao };
  }

  async buscarPorId(id: string): Promise<Avaliacao | null> {
    const stmt = this.dbInstance.prepare('SELECT * FROM avaliacoes WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapear(row) : null;
  }

  async listarPorEmpresa(empresaId?: string): Promise<Avaliacao[]> {
    if (empresaId) {
      const stmt = this.dbInstance.prepare('SELECT * FROM avaliacoes WHERE empresaId = ? ORDER BY criadaEm DESC');
      const rows = stmt.all(empresaId) as any[];
      return rows.map(r => this.mapear(r));
    }
    const stmt = this.dbInstance.prepare('SELECT * FROM avaliacoes ORDER BY criadaEm DESC');
    const rows = stmt.all() as any[];
    return rows.map(r => this.mapear(r));
  }

  async atualizar(id: string, dados: Partial<Avaliacao>): Promise<Avaliacao | null> {
    const existente = await this.buscarPorId(id);
    if (!existente) return null;

    const atualizada: Avaliacao = {
      ...existente,
      ...dados,
      atualizadaEm: new Date()
    };

    const stmt = this.dbInstance.prepare(`
      UPDATE avaliacoes SET
        empresaId = ?,
        empresaRazaoSocial = ?,
        titulo = ?,
        setor = ?,
        status = ?,
        nivelRiscoGeral = ?,
        scoreMedio = ?,
        totalRespostas = ?,
        atualizadaEm = ?
      WHERE id = ?
    `);

    stmt.run(
      atualizada.empresaId,
      atualizada.empresaRazaoSocial || null,
      atualizada.titulo,
      atualizada.setor,
      atualizada.status,
      atualizada.nivelRiscoGeral || null,
      atualizada.scoreMedio !== undefined ? atualizada.scoreMedio : null,
      atualizada.totalRespostas,
      atualizada.atualizadaEm.toISOString(),
      id
    );

    return { ...atualizada };
  }
}
