import { createServer } from "node:http";
import type { Logger } from "@hatef/observability";

export function startHealthServer(port: number, logger: Logger): void {
  const server = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "worker", timestamp: new Date().toISOString() }));
      return;
    }
    res.writeHead(404).end();
  });

  server.listen(port, () => {
    logger.info({ port }, "worker health server listening");
  });
}
