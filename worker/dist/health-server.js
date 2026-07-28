"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHealthServer = startHealthServer;
const node_http_1 = require("node:http");
function startHealthServer(port, logger) {
    const server = (0, node_http_1.createServer)((req, res) => {
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
