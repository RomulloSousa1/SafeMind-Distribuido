# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
ARG SERVICE_DIR
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY servico-autenticacao/package.json servico-autenticacao/
COPY servico-avaliacoes/package.json servico-avaliacoes/
COPY servico-cadastros/package.json servico-cadastros/
RUN npm ci
COPY ${SERVICE_DIR} ${SERVICE_DIR}
RUN npm run build -w ${SERVICE_DIR} && npm prune --omit=dev

FROM node:22-alpine
ARG SERVICE_DIR
ENV NODE_ENV=production SERVICE_DIR=${SERVICE_DIR}
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/${SERVICE_DIR}/package.json ./package.json
COPY --from=build /app/${SERVICE_DIR}/dist ./dist
USER node
CMD ["node", "dist/server.js"]
