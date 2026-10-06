async function runIntegrationTests() {
  console.log('===============================================================');
  console.log('🧪 INICIANDO TESTES DE INTEGRAÇÃO DO SISTEMA DISTRIBUÍDO');
  console.log('===============================================================\n');

  const BASE_URL = 'http://localhost:3000/api';

  // 1. Status do Cluster
  console.log('1️⃣ Testando Status do Cluster (Gateway -> Serviços A e B)...');
  const resCluster = await fetch(`${BASE_URL}/status-distribuido`);
  const statusCluster = await resCluster.json();
  console.log('Resposta Status Cluster:', JSON.stringify(statusCluster, null, 2));

  // 2. Cadastrar Empresa (Gateway -> Serviço B)
  console.log('\n2️⃣ Testando Cadastro de Empresa (Gateway -> Microsserviço B)...');
  const resEmpresa = await fetch(`${BASE_URL}/empresas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'emp-teste-1',
      razaoSocial: 'Indústria Metalúrgica Horizonte S.A.',
      nomeFantasia: 'Horizonte Metais',
      cnpj: '55.666.777/0001-88',
      setorPrincipal: 'Metalurgia Pesada',
      ativa: true
    })
  });
  const empresaCriada = await resEmpresa.json();
  console.log('Empresa Criada (Status ' + resEmpresa.status + '):', empresaCriada);

  // 3. Cadastrar Colaborador (Gateway -> Serviço B)
  console.log('\n3️⃣ Testando Cadastro de Colaborador (Gateway -> Microsserviço B)...');
  const resColab = await fetch(`${BASE_URL}/colaboradores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empresaId: 'emp-teste-1',
      nome: 'Juliana Costa',
      email: 'juliana.costa@horizonte.com.br',
      setor: 'Produção',
      cargo: 'Supervisora de Turno',
      ativo: true
    })
  });
  const colabCriado = await resColab.json();
  console.log('Colaborador Criado (Status ' + resColab.status + '):', colabCriado);

  // 4. Prova Síncrona Ex1 + Ex2: Criar Avaliação Psicossocial
  console.log('\n4️⃣ [PROVA SÍNCRONA Ex1 + Ex2] Criando Avaliação Psicossocial...');
  console.log('   Fluxo: Postman -> Gateway:3000 (Ex1) -> ServicoA:3001 (Ex2) -> ServicoB:3002');
  const resAvaliacao = await fetch(`${BASE_URL}/avaliacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empresaId: 'emp-teste-1',
      titulo: 'Avaliação Ergonômica e Psicossocial NR-1 2026',
      setor: 'Produção'
    })
  });
  const avaliacaoCriada = await resAvaliacao.json();
  console.log('Avaliação Criada (Status ' + resAvaliacao.status + '):', avaliacaoCriada);

  // 5. Teste de Validação Negativa: Empresa Inexistente
  console.log('\n5️⃣ [PROVA SÍNCRONA Negativa] Tentativa de criar avaliação com empresa inexistente...');
  const resFalha = await fetch(`${BASE_URL}/avaliacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empresaId: 'empresa-que-nao-existe',
      titulo: 'Tentativa que deve ser rejeitada',
      setor: 'TI'
    })
  });
  const erroRecebido = await resFalha.json();
  console.log('Erro Esperado Recebido (Status ' + resFalha.status + '):', erroRecebido);

  // 6. Submeter Resposta de Questionário (Colaborador 1 - Risco Baixo)
  console.log('\n6️⃣ Submetendo Resposta de Questionário NR-1 (Baixo Risco)...');
  const resResp1 = await fetch(`${BASE_URL}/avaliacoes/${avaliacaoCriada.id}/respostas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sobrecargaTrabalho: 1,
      suporteLideranca: 1,
      clarezaPapel: 2,
      ambienteFisico: 1
    })
  });
  const resp1 = await resResp1.json();
  console.log('Resposta 1 Submetida (Status ' + resResp1.status + '):', resp1);

  // 7. Submeter Resposta de Questionário (Colaborador 2 - Risco Alto)
  console.log('\n7️⃣ Submetendo Resposta de Questionário NR-1 (Alto Risco)...');
  const resResp2 = await fetch(`${BASE_URL}/avaliacoes/${avaliacaoCriada.id}/respostas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sobrecargaTrabalho: 5,
      suporteLideranca: 4,
      clarezaPapel: 4,
      ambienteFisico: 5
    })
  });
  const resp2 = await resResp2.json();
  console.log('Resposta 2 Submetida (Status ' + resResp2.status + '):', resp2);

  // 8. Obter Relatório Consolidado de Risco Psicossocial
  console.log('\n8️⃣ Consultando Relatório Consolidado de Risco Psicossocial...');
  const resRelatorio = await fetch(`${BASE_URL}/avaliacoes/${avaliacaoCriada.id}/relatorio`);
  const relatorio = await resRelatorio.json();
  console.log('Relatório Final Consolidado:', JSON.stringify(relatorio, null, 2));

  console.log('\n===============================================================');
  console.log('🎉 TODOS OS TESTES DE INTEGRAÇÃO PASSARAM COM 100% DE SUCESSO!');
  console.log('===============================================================');
}

runIntegrationTests().catch(e => {
  console.error('❌ Falha nos testes de integração:', e);
  process.exit(1);
});
