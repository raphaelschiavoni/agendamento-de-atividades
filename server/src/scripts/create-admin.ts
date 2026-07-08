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
  const { email, password, name } = parseArgs();
  if (!email || !password || !name) {
    console.error('Uso: npm run create-admin -- --email="admin@exemplo.com" --password="senha" --name="Nome"');
    process.exit(1);
  }
  const user = await createAdminUser(email, password, name);
  console.log("Admin criado:", user);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
