import { computeBackoff } from "@queueengine/shared";
import type { ConnectionStatus } from "./types";

export function connect(brokerUrl: string, key: string, onMessage: (msg: any) => void, onStatus: (status: ConnectionStatus) => void) {
    let attempt = 1;
    let stopped = false;
    let timer: number | undefined = undefined;
    let currentSocket: WebSocket | undefined = undefined;
    let everOpened = false;
    const wsUrl = brokerUrl.replace(/^http/, "ws") + "/ws?key=" + key;

    function open() {
        const socket = new WebSocket(wsUrl);
        currentSocket = socket;

        socket.onopen = () => {
            everOpened = true;
            onStatus("connected");
            attempt = 1;
        }
        socket.onmessage = (e) => onMessage(JSON.parse(e.data));
        socket.onclose = (e) => {
            if (stopped === true) return;

            if(everOpened === false) {
                onStatus("failed");
                return;
            }    

            onStatus("reconnecting");
            const waitTime = computeBackoff(attempt);
            attempt++;

            timer = window.setTimeout(open, waitTime);
        }
        socket.onerror = () => {}

        return socket;
    }
    onStatus("connecting");
    open();

    return function close() {
        stopped = true;
        window.clearTimeout(timer);
        currentSocket?.close()
    }
}