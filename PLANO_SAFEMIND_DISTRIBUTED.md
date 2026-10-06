# Plano de Implementação: SafeMind Distributed (Entrega 2)

**Disciplina:** Desenvolvimento de Sistemas Distribuídos  
**Prazo:** 08/10/26 até às 18:59h  
**Apresentação:** 15 minutos (Demonstração prática via Postman / Insomnia)

---

## 1. Visão Geral da Arquitetura

Para atender aos requisitos da Entrega 2 sem complexidade excessiva, o sistema será dividido em **3 serviços leves em Node.js/TypeScript** rodando em portas distintas:

```mermaid
flowchart LR
    Client["Postman / Insomnia"] -->|HTTP Request| Gateway["API Principal / Gateway\n(Porta 3000)"]
    Gateway -->|HTTP Síncrono (Ex1)| ServicoA["Microsserviço A: Avaliações\n(Porta 3001)"]
    ServicoA -->|HTTP Síncrono (Ex2)| ServicoB["Microsserviço B: Cadastros\n(Porta 3002)"]
    ServicoB -->|JSON Response| ServicoA
    ServicoA -->|JSON Response| Gateway
    Gateway -->|HTTP 201 Created| Client
```

### Justificativa dos Serviços:
1. **API Principal (Porta 3000):** Ponto de entrada único do sistema. Valida tokens/chaves e despacha a requisição para os serviços internos.
2. **Microsserviço A - Avaliações & Questionários (Porta 3001):** Responsável por abrir avaliações, calcular pontuações de risco e registrar questionários respondidos.
3. **Microsserviço B - Cadastros (Porta 3002):** Responsável pelo cadastro de Empresas e Colaboradores.

---

## 2. Padrão Obrigatório de 5 Camadas (Em Cada Microsserviço)

Cada microsserviço terá **obrigatoriamente** as seguintes pastas e responsabilidades bem delimitadas:

```
src/
├── controllers/    # Recebe HTTP, valida DTO, chama Service, retorna JSON + Status Code
├── dtos/           # Interfaces/Classes de RequestDTO e ResponseDTO
├── services/       # Regras de negócio, cálculos, orquestração e chamadas síncronas via rede
├── repositories/   # Interfaces e métodos de persistência (CRUD)
└── models/         # Entidades de dados centrais
```

### Fluxo de Execução de Dados:
$$\text{HTTP Request} \rightarrow \text{Controller} \rightarrow \text{DTO} \rightarrow \text{Service} \rightarrow \text{Repository} \rightarrow \text{Model}$$

---

## 3. Demonstração Prática da Comunicação Síncrona (Ex1 e Ex2)

O trabalho exige provar a comunicação síncrona em rede em tempo real. Implementaremos o seguinte fluxo principal:

* **Operação: "Criar Avaliação de Risco Psicossocial"**
  1. **Postman $\rightarrow$ API Principal (Ex1):**  
     O cliente envia `POST http://localhost:3000/api/avaliacoes` contendo `{ empresaId: "emp-1", titulo: "Avaliação Setorial 2026", setor: "Operações" }`.
  2. **API Principal $\rightarrow$ Microsserviço A (3001):**  
     A API dispara uma requisição HTTP síncrona (`fetch`) para `http://localhost:3001/avaliacoes`.
  3. **Microsserviço A $\rightarrow$ Microsserviço B (3002) (Ex2):**  
     O `AvaliacaoService` precisa validar se a empresa existe e está ativa antes de salvar. Ele faz uma requisição HTTP síncrona para `http://localhost:3002/empresas/emp-1`.
  4. **Retorno em cascata:**  
     O Microsserviço B responde status `200 OK` com os dados da empresa; o Microsserviço A conclui o cálculo, salva a avaliação no repositório e devolve `201 Created`; a API repassa a resposta final para o Postman com status `201 Created`.

---

## 4. Estrutura do Novo Repositório (`safemind-distributed`)

Criaremos uma pasta/repositório dedicado com estrutura limpa e direta:

```
safemind-distributed/
├── api-gateway/            # Porta 3000
│   ├── src/
│   │   ├── controllers/
│   │   ├── dtos/
│   │   ├── routes/
│   │   └── server.ts
│   └── package.json
│
├── servico-avaliacoes/     # Porta 3001 (Microsserviço A)
│   ├── src/
│   │   ├── controllers/
│   │   ├── dtos/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── server.ts
│   └── package.json
│
├── servico-cadastros/      # Porta 3002 (Microsserviço B)
│   ├── src/
│   │   ├── controllers/
│   │   ├── dtos/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── server.ts
│   └── package.json
│
├── postman/
│   └── SafeMind_Entrega2.postman_collection.json  # Coleção pronta para a apresentação
│
├── package.json            # Script raiz: "npm run dev" para subir os 3 serviços juntos
└── README.md               # Documentação clara para o professor com diagrama e instruções
```

---

## 5. Roteiro de Execução Passo a Passo

### Passo 1: Inicialização do Projeto
* Criar a pasta do projeto (fora ou como módulo independente).
* Configurar TypeScript e dependências básicas mínimas (`express`, `cors`, `dotenv`, `ts-node-dev`/`tsx`).
* Configurar script concorrente para iniciar os 3 serviços com um único comando (`npm run dev`).

### Passo 2: Microsserviço B (Cadastros - Porta 3002)
* Criar **Model**: `Empresa`, `Colaborador`.
* Criar **Repository**: `EmpresaRepository`, `ColaboradorRepository` (persistência simples e robusta).
* Criar **Service**: `EmpresaService`, `ColaboradorService`.
* Criar **DTOs**: `CriarEmpresaRequestDTO`, `EmpresaResponseDTO`, etc.
* Criar **Controller**: Rotas `POST /empresas`, `GET /empresas/:id`, `POST /colaboradores`.

### Passo 3: Microsserviço A (Avaliações - Porta 3001)
* Criar **Model**: `Avaliacao`, `RespostaQuestionario`.
* Criar **Repository**: `AvaliacaoRepository`.
* Criar **DTOs**: `CriarAvaliacaoRequestDTO`, `AvaliacaoResponseDTO`, `SubmeterRespostaDTO`.
* Criar **Service**: `AvaliacaoService` com método que faz `fetch("http://localhost:3002/empresas/" + empresaId)` síncrono.
* Criar **Controller**: Rotas `POST /avaliacoes`, `GET /avaliacoes/:id`, `POST /avaliacoes/:id/respostas`.

### Passo 4: API Principal / Gateway (Porta 3000)
* Rotas HTTP expostas para o Postman que encaminham para os microsserviços.
* Tratamento de erros e formatação padrão de resposta.

### Passo 5: Coleção do Postman e Roteiro de Apresentação (15 Minutos)
* Exportar o arquivo JSON da coleção do Postman com as requisições configuradas na ordem exata de teste:
  1. `Cadastrar Empresa` (Serviço B)
  2. `Cadastrar Colaborador` (Serviço B)
  3. `Criar Avaliação via API` (API $\rightarrow$ Serv. A $\rightarrow$ Serv. B)
  4. `Responder Questionário e Calcular Risco` (API $\rightarrow$ Serv. A)
* Redigir o `README.md` com prints/diagrama explicativo para garantir nota máxima.
