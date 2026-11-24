# SafeMind Distributed

Disciplina: Desenvolvimento de Sistemas Distribuídos (2026.2)

## O que é

Sistema de avaliações psicossociais dividido em serviços, atrás de um Nginx:

- **Nginx** (porta 80): único ponto exposto. Roteia as requisições e balanceia a carga.
- **servico-autenticacao**: emite o token JWT (login e registro).
- **servico-cadastros**: empresas e colaboradores.
- **servico-avaliacoes**: avaliações e respostas, com **3 réplicas**.
- **PostgreSQL** e **RabbitMQ**: banco de dados e fila de mensagens (rede interna).

## Como rodar

Pré-requisito: Docker Desktop aberto e a porta 80 livre.

```bash
docker compose up -d --build
docker compose ps        # aguarde tudo "healthy" (leva ~1 min na primeira vez)
```

Para parar: `docker compose down`.

Teste automático (opcional, precisa do Node 18+): `node test-integration.js`

## Como testar (Postman/Insomnia)

Base: `http://localhost`. Usuário de teste: CPF `111.222.333-44`, senha `Senha@2026`.

1. **Sem token → 401:** `GET /api/avaliacoes`
2. **Login:** `POST /api/auth/login` com `{"cpf":"111.222.333-44","senha":"Senha@2026"}`. Copie o `access_token` e use no header `Authorization: Bearer <token>`.
3. **Token adulterado → 401:** altere o `role` no jwt.io e reenvie.
4. **Balanceamento:** faça de 5 a 10 `GET /api/avaliacoes` com o token. O campo `instancia` muda entre 3 valores. Veja nos logs:
   ```bash
   docker compose logs -f servico-avaliacoes
   ```
5. **Tolerância a falhas:** descubra o nome dos contêineres com `docker ps`, derrube um e repita as requisições. Continuam retornando 200:
   ```bash
   docker stop <nome-de-um-contêiner-servico-avaliacoes>
   ```
   A primeira requisição após a queda pode levar ~2 s, enquanto o Nginx descarta o nó caído.
6. **Mensageria:** crie uma avaliação (`POST /api/avaliacoes` com `{"empresaId":"emp-1","titulo":"Teste","setor":"TI"}`), envie uma resposta em `POST /api/avaliacoes/{id}/respostas` (retorna 202) e veja o resultado em `GET /api/avaliacoes/{id}/relatorio`.

A coleção do Postman está em `postman/`.

## Observações

- O registro público (`/api/auth/registrar`) sempre cria usuário comum. O administrador existe só no seed: CPF `999.888.777-66`, senha `Admin@2026`.
- Variáveis opcionais (segredo do JWT, senha do banco): copie `.env.example` para `.env`.
- Se uma réplica for recriada (novo IP), rode `docker compose restart nginx`.
