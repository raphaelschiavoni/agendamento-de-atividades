import "../config/env.js";
import { pool } from "../db/pool.js";
import { createAdminUser } from "../modules/auth/auth.service.js";

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

async function main() {
  const args = parseArgs();
  // Aceita via argumentos (CLI) ou variáveis de ambiente (deploy automático).
  const email = args.email ?? process.env.ADMIN_EMAIL;
  const password = args.password ?? process.env.ADMIN_PASSWORD;
  const name = args.name ?? process.env.ADMIN_NAME ?? "Administrador";

  if (!email || !password) {
    console.error(
      'Informe as credenciais via argumentos ou variáveis de ambiente.\n' +
        'CLI: npm run create-admin -- --email="admin@exemplo.com" --password="senha" --name="Nome"\n' +
        'ENV: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME'
    );
    process.exit(1);
  }
  const user = await createAdminUser(email, password, name);
  if (user) console.log("Admin criado:", user);
  else console.log(`Admin '${email}' já existe — nenhuma alteração.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
