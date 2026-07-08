#!/bin/sh
set -e

echo "==> Aguardando o banco de dados ficar disponível..."
node -e "
const { Client } = require('pg');
(async () => {
  for (let i = 0; i < 30; i++) {
    try {
      const c = new Client({ connectionString: process.env.DATABASE_URL });
      await c.connect(); await c.end();
      console.log('Banco de dados disponível.');
      process.exit(0);
    } catch (e) {
      console.log('Aguardando banco... tentativa ' + (i + 1) + ' (' + e.code + ')');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.error('Banco de dados não respondeu a tempo.');
  process.exit(1);
})();
"

echo '==> Aplicando migracoes...'
npm run migrate -w server

echo '==> Populando catalogo (idempotente)...'
npm run seed -w server

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo '==> Garantindo usuario administrador...'
  npm run create-admin -w server
fi

echo '==> Iniciando servidor...'
exec node server/dist/index.js
