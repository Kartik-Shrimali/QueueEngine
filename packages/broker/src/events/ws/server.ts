import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { config } from "../../config.js";
import type { Client } from "./client.js";
import { AppError, WS_BUFFER_LIMIT_BYTES, WS_EVENT_FLUSH_MS, WS_STATE_FLUSH_MS, type JobEvent } from "@queueengine/shared";
import { getSnapshot } from "../stats.js";
import { bus } from "../bus.js";
import { replayJob } from "../../core/replay.js";

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
            const client: Client = { socket: ws, pendingState: null, pendingEvents: [], dropped: 0, strikes: 0, types: null, statuses: null };
            clients.add(client);
            ws.on('close', () => {
                clients.delete(client);
            })

            ws.on('error', (error) => {
                console.error(error.message)
            })

            ws.send(JSON.stringify({ t: "snapshot", serverTime: new Date().toISOString(), stats: getSnapshot() }));

            ws.on('message', async (data) => {
                try {
                    const parsedData = JSON.parse(data.toString());
                    if (parsedData.t === 'subscribe') {
                        const filters = parsedData.filters ?? {};
                        client.types = (Array.isArray(filters.types) && filters.types.length > 0) ? filters.types : null;
                        client.statuses = (Array.isArray(filters.statuses) && filters.statuses.length > 0) ? filters.statuses : null;
                    }else if(parsedData.t === 'replay'){
                        const jobId = parsedData.jobId;
                        const requestId = parsedData.requestId;

                        if(typeof jobId !== 'string' || typeof requestId !== 'string'){
                            ws.send(JSON.stringify({t : 'replay_result' , requestId  , ok : false , error : 'validation_failed'}));

                            return;
                        }

                        try{
                            const result = await replayJob(jobId);
                            ws.send(JSON.stringify({t : "replay_result" , requestId , ok : true , newJobId : result.id}));
                        }catch(error : any){
                            let code = 'internal_error';

                            if(error instanceof AppError){
                                code = error.code;
                            }else if(error.code === '22P02'){
                                code = 'validation_failed';
                            }else{
                                console.error(error);
                            }

                            ws.send(JSON.stringify({t : 'replay_result' , requestId , ok : false , error : code}))
                        }
                    }
                } catch (error: any) {

                }
            })
        })
    })

    const onJob = (event: JobEvent) => {
        for (const client of clients) {
            if (client.types !== null && !client.types.includes(event.type)) continue;
            if (client.statuses !== null && !client.statuses.includes(event.to)) continue;
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
        for (const client of clients) {
            if (client.pendingEvents.length === 0 || client.socket.readyState !== 1) {
                continue;
            }

            if (client.socket.bufferedAmount > WS_BUFFER_LIMIT_BYTES) {
                client.dropped += client.pendingEvents.length;
                client.pendingEvents = [];
                client.strikes++;
                client.socket.send(JSON.stringify({ t: 'stale', reason: "buffer_limit", strikes: client.strikes }));
                if (client.strikes === 3) {
                    console.log("Client was closed after 3 strikes.Dropped: ", client.dropped);
                    client.socket.close(1013, 'Client is in a stale state');
                }
            } else {
                client.socket.send(JSON.stringify({ t: 'events', dropped: client.dropped, events: client.pendingEvents }));
                client.dropped = 0;
                client.pendingEvents = []
                client.strikes = 0;
            }
        }
    }, WS_EVENT_FLUSH_MS)

    return closeAllClients;

    function closeAllClients() {
        clearInterval(stateTimer);
        clearInterval(eventTimer);
        bus.off('job', onJob);
        for (const client of clients) {
            client.socket.close(1001);
        }
    }
}
