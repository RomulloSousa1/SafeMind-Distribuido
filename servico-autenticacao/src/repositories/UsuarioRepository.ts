import type Database from 'better-sqlite3';
import { Usuario } from '../models/Usuario.js';
import { db } from '../database.js';

export interface IUsuarioRepository {
  criar(usuario: Usuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorCpf(cpf: string): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
}

export class UsuarioRepository implements IUsuarioRepository {
  private readonly dbInstance: Database.Database;

  constructor(databaseInstance?: Database.Database) {
    this.dbInstance = databaseInstance || db;
  }

  private mapear(row: any): Usuario {
    return {
      id: row.id,
      cpf: row.cpf,
      cpfFormatado: row.cpfFormatado || undefined,
      nome: row.nome || undefined,
      senhaHash: row.senhaHash,
      ativo: Boolean(row.ativo),
      criadoEm: new Date(row.criadoEm),
      atualizadoEm: new Date(row.atualizadoEm)
    };
  }

  async criar(usuario: Usuario): Promise<Usuario> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO usuarios (id, cpf, cpfFormatado, nome, senhaHash, ativo, criadoEm, atualizadoEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      usuario.id,
      usuario.cpf,
      usuario.cpfFormatado || null,
      usuario.nome || null,
      usuario.senhaHash,
      usuario.ativo ? 1 : 0,
      usuario.criadoEm.toISOString(),
      usuario.atualizadoEm.toISOString()
    );

    return { ...usuario };
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const stmt = this.dbInstance.prepare('SELECT * FROM usuarios WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapear(row) : null;
  }

  async buscarPorCpf(cpf: string): Promise<Usuario | null> {
    const normalizado = cpf.replace(/\D/g, '');
    const stmt = this.dbInstance.prepare(`
      SELECT * FROM usuarios 
      WHERE cpf = ? 
         OR REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?
      LIMIT 1
    `);
    const row = stmt.get(normalizado, normalizado);
    return row ? this.mapear(row) : null;
  }

  async listar(): Promise<Usuario[]> {
    const stmt = this.dbInstance.prepare('SELECT * FROM usuarios WHERE ativo = 1 ORDER BY criadoEm DESC');
    const rows = stmt.all() as any[];
    return rows.map(r => this.mapear(r));
  }
}
