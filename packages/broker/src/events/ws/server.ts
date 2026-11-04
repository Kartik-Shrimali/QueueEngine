import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { config } from "../../config.js";
import type { Client } from "./client.js";
import { WS_STATE_FLUSH_MS } from "@queueengine/shared";
import { getSnapshot } from "../stats.js";

export function startWsServer(httpServer: Server) {
    const wss = new WebSocketServer({ noServer: true });
    const clients = new Set<Client>();
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
            const client : Client = {socket : ws , pendingState : null};
            clients.add(client);
            ws.on('close', () => {
                clients.delete(client);
            })

            ws.on('error', (error) => {
                console.error(error.message)
            })

            ws.send(JSON.stringify({ t: "snapshot", serverTime: new Date().toISOString() }))
        })
    })

    const stateTimer = setInterval(() => {
        const message = JSON.stringify({t : "state" , stats : getSnapshot()});
        
        for(const client of clients){
            client.pendingState = message;
            if(client.socket.readyState === 1 && client.socket.bufferedAmount === 0){
                client.socket.send(client.pendingState);
            }
        }
    } , WS_STATE_FLUSH_MS)

    return closeAllClients;

    function closeAllClients() {
        clearInterval(stateTimer);
        for(const client of clients){
            client.socket.close(1001);
        }
    }
}
