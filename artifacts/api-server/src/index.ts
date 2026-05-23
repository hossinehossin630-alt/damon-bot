import { httpServer } from "./app.js";
import { logger } from "./lib/logger.js";
import { startBot } from "./bot/core.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

httpServer.listen(port, () => {
  logger.info({ port }, "DAMON Bot server listening");

  startBot().catch((err: unknown) => {
    logger.error({ err }, "Bot failed to start");
  });
});
