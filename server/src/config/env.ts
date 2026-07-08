import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";

// Load server/.env by absolute path (not process.cwd()) so `npm run dev` works
// the same whether launched from the server/ directory or via --prefix elsewhere.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  PAYMENT_PROVIDER: z.enum(["mock", "mercadopago"]).default("mock"),
  NOTIFICATION_PROVIDER: z.enum(["console", "whatsapp-cloud-api"]).default("console"),
  MOCK_PIX_AUTO_APPROVE_MS: z.coerce.number().optional(),
  UPLOADS_DIR: z.string().default("./uploads"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Resolve relative to the server package root (not process.cwd()), for the same
// reason .env is loaded by absolute path above.
const serverRoot = path.resolve(__dirname, "../..");

export const env = {
  ...parsed.data,
  UPLOADS_DIR: path.resolve(serverRoot, parsed.data.UPLOADS_DIR),
};
