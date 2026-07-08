# Deploy no EasyPanel (VPS) com Docker

O projeto roda como **um único container**: o servidor Express serve a API **e** o
front-end já compilado, na mesma porta/origem. O `Dockerfile` na raiz faz todo o build.

## 1. Pré-requisitos

- Um banco **PostgreSQL** acessível (pode continuar usando o Neon, ou criar um Postgres
  no próprio EasyPanel). Tenha em mãos a `DATABASE_URL`.
- O código no GitHub (já está em `raphaelschiavoni/agendamento-de-atividades`).

## 2. Criar o serviço (App) no EasyPanel

1. No projeto do EasyPanel, crie um **App**.
2. Em **Source**, escolha **GitHub** e selecione o repositório / branch `main`.
   - **Build Path / Context:** `app` (o `Dockerfile` está dentro da pasta `app/`).
     Se o EasyPanel apontar para a raiz do repositório, defina o *Build context* para `app`.
3. Em **Build**, deixe o método como **Dockerfile** (ele detecta o `app/Dockerfile`).

## 3. Variáveis de ambiente (aba Environment)

Defina:

```
NODE_ENV=production
DATABASE_URL=postgres://USUARIO:SENHA@HOST/BANCO?sslmode=require
SESSION_SECRET=<uma string aleatória longa e secreta>
PORT=4000
PAYMENT_PROVIDER=mock
NOTIFICATION_PROVIDER=console
UPLOADS_DIR=/data/uploads
```

- **SESSION_SECRET:** gere algo aleatório (ex.: no terminal, `openssl rand -hex 32`).
- **UPLOADS_DIR=/data/uploads:** aponta as fotos enviadas para o volume persistente (passo 5).
- Não precisa de `CLIENT_ORIGIN` em produção (front e API na mesma origem).

## 4. Porta e domínio

- Em **Ports / Proxy**, exponha a porta **4000** (a mesma do `PORT`).
- Associe seu domínio e ative **HTTPS** (o EasyPanel provisiona o certificado via Let's Encrypt).
  O app já está preparado para rodar atrás do proxy HTTPS (cookies seguros + `trust proxy`).

## 5. Volume persistente para as fotos (importante)

O disco do container é efêmero — sem volume, as fotos enviadas somem a cada redeploy.

- Em **Mounts / Volumes**, crie um volume e monte em `/data`
  (com `UPLOADS_DIR=/data/uploads` as fotos ficam em `/data/uploads`).

## 6. Primeiro deploy

Clique em **Deploy**. O EasyPanel vai:
1. Buildar a imagem (compila front + back).
2. Subir o container. O healthcheck usa `GET /health`.

## 7. Rodar migração, seed e criar admin (uma vez)

Abra o **Console/Terminal** do serviço no EasyPanel e rode, na ordem:

```bash
# cria as tabelas
npm run migrate -w server

# popula os 5 hotéis + atividades reais (idempotente, pode rodar de novo sem duplicar)
npm run seed -w server

# cria o usuário administrador
npm run create-admin -w server -- --email="admin@redesonhos.com.br" --password="TROQUE-ESSA-SENHA" --name="Administrador"
```

> Esses comandos usam a `DATABASE_URL` que você configurou nas variáveis de ambiente.
> Rode-os apenas na primeira vez (ou o `create-admin` quando quiser um novo usuário).

Pronto — acesse pelo seu domínio. O painel administrativo fica no botão
**"Painel Administrativo"**, com o login criado acima.

## 8. Atualizações futuras

Toda vez que você fizer `git push` na branch `main`, é só clicar em **Deploy** no
EasyPanel (ou ativar o deploy automático). Migração/seed só precisam rodar de novo
se você criar novas migrações.

---

### Testar a imagem localmente (opcional)

Se tiver Docker na sua máquina:

```bash
cd app
docker build -t rede-sonhos .
docker run --rm -p 4000:4000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgres://...sslmode=require" \
  -e SESSION_SECRET="algo-aleatorio" \
  -e UPLOADS_DIR=/data/uploads \
  -v rede_sonhos_uploads:/data \
  rede-sonhos
# depois, num outro terminal: npm run migrate/seed/create-admin dentro do container
```
