import { pool } from '../database.js';
import { Colaborador, Empresa } from '../models/cadastro.js';

interface EmpresaRow {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  setor_principal: string;
  ativa: boolean;
}

interface ColaboradorRow {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  setor: string;
  cargo: string;
  ativo: boolean;
}

const toEmpresa = (r: EmpresaRow): Empresa => ({
  id: r.id,
  razaoSocial: r.razao_social,
  nomeFantasia: r.nome_fantasia,
  cnpj: r.cnpj,
  setorPrincipal: r.setor_principal,
  ativa: r.ativa
});

const toColaborador = (r: ColaboradorRow): Colaborador => ({
  id: r.id,
  empresaId: r.empresa_id,
  nome: r.nome,
  email: r.email,
  setor: r.setor,
  cargo: r.cargo,
  ativo: r.ativo
});

export const empresaRepository = {
  async salvar(e: Empresa): Promise<void> {
    await pool.query(
      `INSERT INTO empresas (id, razao_social, nome_fantasia, cnpj, setor_principal, ativa)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET razao_social = EXCLUDED.razao_social,
         nome_fantasia = EXCLUDED.nome_fantasia, cnpj = EXCLUDED.cnpj,
         setor_principal = EXCLUDED.setor_principal, ativa = EXCLUDED.ativa`,
      [e.id, e.razaoSocial, e.nomeFantasia, e.cnpj, e.setorPrincipal, e.ativa]
    );
  },

  async listar(): Promise<Empresa[]> {
    const { rows } = await pool.query<EmpresaRow>('SELECT * FROM empresas ORDER BY id');
    return rows.map(toEmpresa);
  },

  async buscarPorId(id: string): Promise<Empresa | undefined> {
    const { rows } = await pool.query<EmpresaRow>('SELECT * FROM empresas WHERE id = $1', [id]);
    return rows[0] ? toEmpresa(rows[0]) : undefined;
  }
};

export const colaboradorRepository = {
  async criar(c: Colaborador): Promise<void> {
    await pool.query(
      'INSERT INTO colaboradores (id, empresa_id, nome, email, setor, cargo, ativo) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [c.id, c.empresaId, c.nome, c.email, c.setor, c.cargo, c.ativo]
    );
  },

  async listar(empresaId?: string): Promise<Colaborador[]> {
    const { rows } = empresaId
      ? await pool.query<ColaboradorRow>('SELECT * FROM colaboradores WHERE empresa_id = $1 ORDER BY id', [empresaId])
      : await pool.query<ColaboradorRow>('SELECT * FROM colaboradores ORDER BY id');
    return rows.map(toColaborador);
  }
};
