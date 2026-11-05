import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { config } from "../../config.js";
import type { Client } from "./client.js";
import { WS_BUFFER_LIMIT_BYTES, WS_EVENT_FLUSH_MS, WS_STATE_FLUSH_MS } from "@queueengine/shared";
import { getSnapshot } from "../stats.js";
import { bus, type JobEvent } from "../bus.js";

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
            const client: Client = { socket: ws, pendingState: null, pendingEvents: [], dropped: 0 };
            clients.add(client);
            ws.on('close', () => {
                clients.delete(client);
            })

            ws.on('error', (error) => {
                console.error(error.message)
            })

            ws.send(JSON.stringify({ t: "snapshot", serverTime: new Date().toISOString(), stats: getSnapshot() }));
        })
    })

    const onJob = (event: JobEvent) => {
        for (const client of clients) {
            client.pendingEvents.push(event);
        }
    }
     
    bus.on('job', onJob);

    const stateTimer = setInterval(() => {
        const message = JSON.stringify({ t: "state", stats: getSnapshot() });

        for (const client of clients) {
            client.pendingState = message;
            if (client.socket.readyState === 1 && client.socket.bufferedAmount === 0) {
                client.socket.send(client.pendingState);
                client.pendingState = null;
            }
        }
    }, WS_STATE_FLUSH_MS)

    const eventTimer = setInterval(() => {
        for(const client of clients){
            if(client.pendingEvents.length === 0 || client.socket.readyState !== 1){
                continue;
            }

            if(client.socket.bufferedAmount > WS_BUFFER_LIMIT_BYTES){
                client.dropped += client.pendingEvents.length;
                client.pendingEvents = [];
            }else{
                client.socket.send(JSON.stringify({t : 'events' , dropped : client.dropped , events : client.pendingEvents}));
                client.dropped = 0; 
                client.pendingEvents = []
            }
        }
    } , WS_EVENT_FLUSH_MS)

    return closeAllClients;

    function closeAllClients() {
        clearInterval(stateTimer);
        clearInterval(eventTimer);
        bus.off('job' , onJob);
        for (const client of clients) {
            client.socket.close(1001);
        }
    }
}
