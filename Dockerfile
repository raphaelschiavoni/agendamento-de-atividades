# syntax=docker/dockerfile:1

# ============================================================
# Estágio 1 — build (instala tudo e compila client + server)
# ============================================================
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Ferramentas para compilar dependências nativas (bcrypt) caso não haja prebuild.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Instala dependências a partir dos manifestos (melhor cache de camadas).
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

# Copia o código e gera os builds de produção.
COPY . .
RUN npm run build -w client \
  && npm run build -w server

# ============================================================
# Estágio 2 — runtime (imagem final que roda em produção)
# ============================================================
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Manifestos + dependências já instaladas (inclui node-pg-migrate e tsx,
# usados pelos comandos de migração/seed no console do EasyPanel).
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules

# Server: código-fonte (para os scripts tsx), build compilado e migrações.
COPY --from=build /app/server ./server

# Front-end já buildado (servido pelo server) + manifesto do workspace client
# (para que `npm run ... -w server` funcione com o workspace íntegro).
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/client/package.json ./client/package.json

# Script de inicialização (espera o banco, migra, popula, cria admin, sobe o server).
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Porta padrão da API/site (ajustável via variável PORT).
EXPOSE 4000

# Healthcheck simples usado pelo orquestrador.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Migra/popula/cria-admin e então sobe a API (que também serve o front estático).
CMD ["sh", "docker-entrypoint.sh"]
