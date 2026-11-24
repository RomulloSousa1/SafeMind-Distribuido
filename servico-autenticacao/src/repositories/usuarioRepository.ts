import { pool } from '../database.js';
import { Usuario } from '../models/usuario.js';

interface Row {
  id: string;
  cpf: string;
  nome: string;
  role: Usuario['role'];
  senha_hash: string;
  criado_em: string;
}

const toModel = (r: Row): Usuario => ({
  id: r.id,
  cpf: r.cpf,
  nome: r.nome,
  role: r.role,
  senhaHash: r.senha_hash,
  criadoEm: r.criado_em
});

export const usuarioRepository = {
  async buscarPorCpf(cpf: string): Promise<Usuario | undefined> {
    const { rows } = await pool.query<Row>('SELECT * FROM usuarios WHERE cpf = $1', [cpf]);
    return rows[0] ? toModel(rows[0]) : undefined;
  },

  async criar(u: Usuario): Promise<void> {
    await pool.query(
      'INSERT INTO usuarios (id, cpf, nome, role, senha_hash, criado_em) VALUES ($1,$2,$3,$4,$5,$6)',
      [u.id, u.cpf, u.nome, u.role, u.senhaHash, u.criadoEm]
    );
  },

  async listar(): Promise<Usuario[]> {
    const { rows } = await pool.query<Row>('SELECT * FROM usuarios ORDER BY criado_em');
    return rows.map(toModel);
  }
};
