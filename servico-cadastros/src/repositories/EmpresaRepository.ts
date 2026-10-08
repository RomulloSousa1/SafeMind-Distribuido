import type Database from 'better-sqlite3';
import { Empresa } from '../models/Empresa.js';
import { db } from '../database.js';

export interface IEmpresaRepository {
  criar(empresa: Empresa): Promise<Empresa>;
  buscarPorId(id: string): Promise<Empresa | null>;
  buscarPorCnpj(cnpj: string): Promise<Empresa | null>;
  listarTodas(): Promise<Empresa[]>;
  atualizar(id: string, dados: Partial<Empresa>): Promise<Empresa | null>;
}

export class EmpresaRepository implements IEmpresaRepository {
  private readonly dbInstance: Database.Database;

  constructor(databaseInstance?: Database.Database) {
    this.dbInstance = databaseInstance || db;
  }

  private mapear(row: any): Empresa {
    return {
      id: row.id,
      razaoSocial: row.razaoSocial,
      nomeFantasia: row.nomeFantasia || undefined,
      cnpj: row.cnpj,
      setorPrincipal: row.setorPrincipal,
      ativa: Boolean(row.ativa),
      criadaEm: new Date(row.criadaEm),
      atualizadaEm: new Date(row.atualizadaEm)
    };
  }

  async criar(empresa: Empresa): Promise<Empresa> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO empresas (id, razaoSocial, nomeFantasia, cnpj, setorPrincipal, ativa, criadaEm, atualizadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      empresa.id,
      empresa.razaoSocial,
      empresa.nomeFantasia || null,
      empresa.cnpj,
      empresa.setorPrincipal,
      empresa.ativa ? 1 : 0,
      empresa.criadaEm.toISOString(),
      empresa.atualizadaEm.toISOString()
    );

    return { ...empresa };
  }

  async buscarPorId(id: string): Promise<Empresa | null> {
    const stmt = this.dbInstance.prepare('SELECT * FROM empresas WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapear(row) : null;
  }

  async buscarPorCnpj(cnpj: string): Promise<Empresa | null> {
    const normalizado = cnpj.replace(/\D/g, '');
    const stmt = this.dbInstance.prepare('SELECT * FROM empresas');
    const rows = stmt.all() as any[];
    const encontrada = rows.find(r => r.cnpj.replace(/\D/g, '') === normalizado);
    return encontrada ? this.mapear(encontrada) : null;
  }

  async listarTodas(): Promise<Empresa[]> {
    const stmt = this.dbInstance.prepare('SELECT * FROM empresas ORDER BY criadaEm ASC');
    const rows = stmt.all() as any[];
    return rows.map(r => this.mapear(r));
  }

  async atualizar(id: string, dados: Partial<Empresa>): Promise<Empresa | null> {
    const existente = await this.buscarPorId(id);
    if (!existente) return null;

    const atualizada: Empresa = {
      ...existente,
      ...dados,
      atualizadaEm: new Date()
    };

    const stmt = this.dbInstance.prepare(`
      UPDATE empresas SET
        razaoSocial = ?,
        nomeFantasia = ?,
        cnpj = ?,
        setorPrincipal = ?,
        ativa = ?,
        atualizadaEm = ?
      WHERE id = ?
    `);

    stmt.run(
      atualizada.razaoSocial,
      atualizada.nomeFantasia || null,
      atualizada.cnpj,
      atualizada.setorPrincipal,
      atualizada.ativa ? 1 : 0,
      atualizada.atualizadaEm.toISOString(),
      id
    );

    return { ...atualizada };
  }
}
