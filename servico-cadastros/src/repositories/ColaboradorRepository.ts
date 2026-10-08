import type Database from 'better-sqlite3';
import { Colaborador } from '../models/Colaborador.js';
import { db } from '../database.js';

export interface IColaboradorRepository {
  criar(colaborador: Colaborador): Promise<Colaborador>;
  buscarPorId(id: string): Promise<Colaborador | null>;
  listarPorEmpresa(empresaId: string): Promise<Colaborador[]>;
  buscarPorEmail(email: string): Promise<Colaborador | null>;
}

export class ColaboradorRepository implements IColaboradorRepository {
  private readonly dbInstance: Database.Database;

  constructor(databaseInstance?: Database.Database) {
    this.dbInstance = databaseInstance || db;
  }

  private mapear(row: any): Colaborador {
    return {
      id: row.id,
      empresaId: row.empresaId,
      nome: row.nome,
      email: row.email,
      setor: row.setor,
      cargo: row.cargo,
      ativo: Boolean(row.ativo),
      criadoEm: new Date(row.criadoEm),
      atualizadoEm: new Date(row.atualizadoEm)
    };
  }

  async criar(colaborador: Colaborador): Promise<Colaborador> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO colaboradores (id, empresaId, nome, email, setor, cargo, ativo, criadoEm, atualizadoEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      colaborador.id,
      colaborador.empresaId,
      colaborador.nome,
      colaborador.email,
      colaborador.setor,
      colaborador.cargo,
      colaborador.ativo ? 1 : 0,
      colaborador.criadoEm.toISOString(),
      colaborador.atualizadoEm.toISOString()
    );

    return { ...colaborador };
  }

  async buscarPorId(id: string): Promise<Colaborador | null> {
    const stmt = this.dbInstance.prepare('SELECT * FROM colaboradores WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapear(row) : null;
  }

  async listarPorEmpresa(empresaId: string): Promise<Colaborador[]> {
    const stmt = this.dbInstance.prepare('SELECT * FROM colaboradores WHERE empresaId = ? ORDER BY criadoEm ASC');
    const rows = stmt.all(empresaId) as any[];
    return rows.map(r => this.mapear(r));
  }

  async buscarPorEmail(email: string): Promise<Colaborador | null> {
    const stmt = this.dbInstance.prepare('SELECT * FROM colaboradores WHERE LOWER(email) = LOWER(?)');
    const row = stmt.get(email.trim());
    return row ? this.mapear(row) : null;
  }
}
