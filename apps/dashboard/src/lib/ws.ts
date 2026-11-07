import { computeBackoff } from "@queueengine/shared";

export function connect(brokerUrl: string, key: string, onMessage: (msg: any) => void) {
    let attempt = 1;
    let stopped = false;
    let timer: number | undefined = undefined;
    let currentSocket: WebSocket | undefined = undefined;
    const wsUrl = brokerUrl.replace(/^http/, "ws") + "/ws?key=" + key;

    function open() {
        const socket = new WebSocket(wsUrl);
        currentSocket = socket;

        socket.onopen = () => {
            attempt = 1;
            console.log("ws open");
        }
        socket.onmessage = (e) => onMessage(JSON.parse(e.data));
        socket.onclose = (e) => {
            console.log("ws closed", e.code);
            if (stopped === true) return;

            const waitTime = computeBackoff(attempt);
            attempt++;

            timer = window.setTimeout(open, waitTime);
            console.log(waitTime);
        }
        socket.onerror = () => console.log("ws error");

        return socket;
    }

    open();
    
    return function close() {
        stopped = true;
        window.clearTimeout(timer);
        currentSocket?.close()
    }
}