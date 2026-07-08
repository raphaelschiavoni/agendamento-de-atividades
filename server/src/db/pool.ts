import { Pool, types } from "pg";
import { env } from "../config/env.js";

// By default `pg` parses the DATE column type (OID 1082) into a JS Date object,
// which JSON.stringify then renders as a UTC ISO string — shifting the calendar
// day depending on the server's timezone offset. Our API contract is a plain
// "YYYY-MM-DD" string everywhere (bookings, availability, seed), so keep it raw.
types.setTypeParser(1082, (value) => value);

// SSL mode is parsed directly from DATABASE_URL's `sslmode` query param by `pg` —
// no need to pass an explicit `ssl` option (doing so would override and could weaken it).
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
