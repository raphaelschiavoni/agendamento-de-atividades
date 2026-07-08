import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();
// Bind to 0.0.0.0 so the server is reachable from outside the container.
app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
});
