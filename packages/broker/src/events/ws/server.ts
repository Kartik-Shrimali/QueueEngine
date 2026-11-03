import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { config } from "../../config.js";

export function startWsServer(httpServer: Server) {
    const wss = new WebSocketServer({ noServer: true });
    const clients = new Set<WebSocket>();
    const baseUrl = 'http://localhost'
    httpServer.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url ?? '', baseUrl);
        const key = url.searchParams.get('key');

        if (url.pathname !== '/ws' || key !== config.adminApiKey) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            clients.add(ws);
            ws.on('close', () => {
                clients.delete(ws);
            })

            ws.on('error', (error) => {
                console.error(error.message)
            })

            ws.send(JSON.stringify({ t: "snapshot", serverTime: new Date().toISOString() }))
        })
    })

    return closeAllClients;

    function closeAllClients() {
        for(const client of clients){
            client.close(1001);
        }
    }
}
