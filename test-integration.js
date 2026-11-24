// Teste de integração ponta a ponta (requer `docker compose up -d --build`).
// Uso: node test-integration.js [baseUrl]   (padrão: http://localhost)
const BASE = process.argv[2] || 'http://localhost';
let falhas = 0;

function check(nome, ok, extra = '') {
  console.log(`${ok ? '[OK]   ' : '[FALHA]'} ${nome}${extra ? ' - ' + extra : ''}`);
  if (!ok) falhas++;
}

async function http(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, headers: res.headers };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(cpf, senha) {
  const r = await http('POST', '/api/auth/login', { body: { cpf, senha } });
  return r.json.access_token;
}

function adulterar(token, role) {
  const [h, p, s] = token.split('.');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  payload.role = role;
  return `${h}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${s}`;
}

// 1. Segurança
let r = await http('GET', '/api/avaliacoes');
check('Sem token retorna 401', r.status === 401, `status ${r.status}`);

const token = await login('111.222.333-44', 'Senha@2026');
check('Login retorna JWT', Boolean(token));

r = await http('GET', '/api/avaliacoes', { token: adulterar(token, 'ADMIN') });
check('Token adulterado (role=ADMIN) retorna 401', r.status === 401, `status ${r.status}`);

r = await http('POST', '/api/auth/registrar', {
  body: { cpf: `000.${String(Date.now() % 1000000).padStart(6, "0")}-00`, nome: 'Teste Escalada', senha: 'abc12345', role: 'ADMIN' }
});
check('Registro público ignora role=ADMIN', r.status === 201 && r.json.role === 'USER', `role ${r.json.role}`);

r = await http('GET', '/api/auth/usuarios', { token });
check('Rota ADMIN com token USER retorna 403', r.status === 403, `status ${r.status}`);
const tokenAdmin = await login('999.888.777-66', 'Admin@2026');
r = await http('GET', '/api/auth/usuarios', { token: tokenAdmin });
check('Rota ADMIN com token ADMIN retorna 200', r.status === 200, `status ${r.status}`);

// 2. Balanceamento (Round Robin entre as réplicas)
const instancias = new Set();
for (let i = 0; i < 10; i++) {
  const res = await http('GET', '/api/avaliacoes', { token });
  if (res.status === 200) instancias.add(res.json.instancia);
}
check('10 GETs atendidos por 3 instâncias distintas', instancias.size === 3, [...instancias].join(', '));

// 3. Negócio: comunicação síncrona + mensageria
r = await http('POST', '/api/avaliacoes', { token, body: { empresaId: 'emp-inexistente', titulo: 'NR-1 teste', setor: 'TI' } });
check('Avaliação com empresa inexistente retorna 404', r.status === 404, `status ${r.status}`);

r = await http('POST', '/api/avaliacoes', { token, body: { empresaId: 'emp-1', titulo: 'NR-1 Q4', setor: 'TI' } });
check('Avaliação com empresa válida retorna 201', r.status === 201, `status ${r.status}`);
const avalId = r.json.id;

// Todas as réplicas enxergam a mesma avaliação (banco compartilhado)
const vistas = new Set();
for (let i = 0; i < 6; i++) {
  const g = await http('GET', `/api/avaliacoes/${avalId}`, { token });
  if (g.status === 200) vistas.add(g.json.instancia);
}
check('Avaliação visível em todas as réplicas', vistas.size === 3, `${vistas.size} instâncias`);

r = await http('POST', `/api/avaliacoes/${avalId}/respostas`, {
  token,
  body: { sobrecargaTrabalho: 5, suporteLideranca: 4, clarezaPapel: 4, ambienteFisico: 5 }
});
check('Resposta retorna 202 Accepted', r.status === 202, `status ${r.status}`);

let rel;
for (let i = 0; i < 20; i++) {
  rel = (await http('GET', `/api/avaliacoes/${avalId}/relatorio`, { token })).json;
  if (rel.processadas >= 1) break;
  await sleep(500);
}
check('Consumidor processou a resposta (relatório atualizado)', rel?.processadas === 1 && rel.nivelRiscoGeral === 'ALTO',
  JSON.stringify(rel));

// 4. Rotas /api/negocio/
r = await http('GET', '/api/negocio/empresas', { token });
check('Rota /api/negocio/empresas retorna 200', r.status === 200, `status ${r.status}`);

console.log(falhas === 0 ? '\nTodos os testes passaram.' : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
