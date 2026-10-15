# SafeMind Distributed — Sistema Distribuído de Avaliação Psicossocial e Autenticação
**Disciplina:** Desenvolvimento de Sistemas Distribuídos — Entrega 3: Comunicação Assíncrona com Message Broker  

---

## 1. Visão Geral da Arquitetura Distribuída

O projeto SafeMind Distributed é uma solução distribuída em **Node.js + TypeScript** que integra comunicação síncrona (REST) e **comunicação assíncrona orientada a eventos** mediada por um Message Broker (**RabbitMQ**).

O sistema opera com **4 serviços desacoplados** e um Message Broker:

```mermaid
flowchart TD
    Client["Cliente HTTP\n(Postman / Frontend)"]
    Gateway["API Gateway Principal\n(Porta 3000)"]
    
    subgraph Cluster["Cluster Distribuído SafeMind"]
        ServicoA["Microsserviço A: Avaliações\n(Porta 3001)"]
        ServicoB["Microsserviço B: Cadastros\n(Porta 3002)"]
        ServicoC["Microsserviço C: Autenticação\n(Porta 3003)"]
    end

    subgraph Broker["Message Broker: RabbitMQ (5672 / 15672)"]
        Exchange["Exchange Topic:\n'safemind.eventos'"]
        FilaRisco["Fila: fila.avaliacoes.processamento-risco\n(Routing Key: 'resposta.submetida')"]
        FilaAuditoria["Fila: fila.cadastros.auditoria-risco\n(Routing Key: 'resposta.*')"]
    end

    Client -->|1. POST /api/avaliacoes/:id/respostas| Gateway
    Gateway -->|2. Encaminha POST| ServicoA
    ServicoA -->|3. Salva resposta local e publica evento| Exchange
    ServicoA -->|4. Retorno imediato HTTP 202 Accepted| Gateway
    Gateway -->|5. HTTP 202 Accepted| Client

    Exchange -->|Mensagem assíncrona| FilaRisco
    Exchange -->|Mensagem assíncrona| FilaAuditoria

    FilaRisco -->|6a. Consumo assíncrono| ServicoA
    FilaAuditoria -->|6b. Consumo assíncrono (Pub/Sub)| ServicoB
```

---

## 2. Responsabilidades dos Serviços

| Serviço | Porta | Responsabilidade | Camadas Implementadas |
| :--- | :---: | :--- | :--- |
| **API Gateway** | `3000` | Ponto de entrada unificado, roteamento transparente, monitoramento de saúde do cluster. | Controllers, Routes |
| **Microsserviço A** | `3001` | Gestão de avaliações, questionários, cálculo psicossocial NR-1, **Produtor de eventos** e **Consumidor de risco**. | Controllers, DTOs, Services, Repositories, Models, Messaging |
| **Microsserviço B** | `3002` | Cadastro de Empresas e Colaboradores, **Consumidor de auditoria e alerta de riscos** (Pub/Sub). | Controllers, DTOs, Services, Repositories, Models, Messaging |
| **Microsserviço C** | `3003` | Autenticação por CPF e Senha, hashing seguro (`scrypt`), emissão e validação de tokens JWT. | Controllers, DTOs, Services, Repositories, Models |
| **Message Broker** | `5672` | Mensageria assíncrona (RabbitMQ) desacoplando produtor e consumidores. | Exchange `safemind.eventos` (Topic) |

---

## 3. Padrão Obrigatório de 5 Camadas

Cada microsserviço de negócio segue rigorosamente a separação de responsabilidades em 5 camadas:

```
src/
├── controllers/    # Recebe requisições HTTP, valida DTOs e retorna status (200, 201, 202)
├── dtos/           # Schemas Zod de validação, DTOs de eventos e tipagens TypeScript
├── services/       # Regras de negócio, cálculos matemáticos e orquestração de eventos
├── repositories/   # Interfaces e implementações isoladas de persistência SQLite
├── models/         # Entidades de domínio centrais
└── messaging/      # Componentes Producer e Consumer desacoplados (AMQP)
```

---

## 4. Endpoints da API (Via API Gateway na Porta 3000)

### Avaliações NR-1 (Microsserviço A — Comunicação Assíncrona)
* `POST /api/avaliacoes/:id/respostas` — **Retorna `HTTP 202 Accepted`**: Salva a resposta localmente e despacha evento assíncrono para recálculo no Broker.
* `GET /api/avaliacoes/:id/relatorio` — Consulta relatório consolidado processado assincronamente.
* `POST /api/avaliacoes` — Criação de avaliação (valida empresa no Microsserviço B via HTTP síncrono).
* `GET /api/avaliacoes` — Listagem de avaliações.
* `GET /api/avaliacoes/:id` — Busca de avaliação por ID.

### Autenticação (Microsserviço C)
* `POST /api/auth/registrar` — Cadastro de usuário com CPF + Senha.
* `POST /api/auth/login` — Autenticação por CPF + Senha com emissão de token JWT.
* `GET /api/auth/validar` — Validação de token de acesso JWT.
* `GET /api/auth/usuarios/:id` — Consulta de usuário por ID.

### Cadastros (Microsserviço B)
* `POST /api/empresas` — Cadastro de empresa.
* `GET /api/empresas` — Listagem de empresas.
* `GET /api/empresas/:id` — Busca de empresa por ID.
* `POST /api/colaboradores` — Cadastro de colaborador.
* `GET /api/colaboradores?empresaId=:id` — Listagem de colaboradores por empresa.

---

## 5. Como Executar o Sistema

### Pré-requisitos
* Node.js v18+ (recomendado v20+)
* npm v9+
* Docker / Docker Compose (para RabbitMQ via container)

### Passo 1: Iniciar o Message Broker (RabbitMQ)
Docker instalado:
```bash
docker compose up -d
```
> *Nota de Resiliência:* Se o RabbitMQ não estiver ativo, os serviços ativam automaticamente o modo resiliente assíncrono em memória, garantindo 100% de funcionamento local.

### Passo 2: Instalar Dependências
```bash
npm install
```

### Passo 3: Iniciar os 4 Microsserviços
```bash
npm run dev
```

Você verá no console as saídas coloridas dos quatro serviços subindo juntos:
* **API Gateway**: `http://localhost:3000`
* **Microsserviço A (Avaliações)**: `http://localhost:3001`
* **Microsserviço B (Cadastros)**: `http://localhost:3002`
* **Microsserviço C (Autenticação)**: `http://localhost:3003`

### Passo 4: Executar Testes de Integração Ponta a Ponta
```bash
npm run test:integration
```

---

## 6. Persistência de Dados (Database-per-Service)

O projeto adota o padrão **Database-per-Service** com SQLite via `better-sqlite3`:
* **Cadastros:** `servico-cadastros/data/cadastros.db`
* **Avaliações:** `servico-avaliacoes/data/avaliacoes.db`
* **Autenticação:** `servico-autenticacao/data/autenticacao.db`

---