import type { WebSocket } from "ws"
import type { JobEvent } from "../bus.js"

export type Client = {
    socket : WebSocket,
    pendingState : string | null,
    pendingEvents : JobEvent[],
    dropped : number,
    strikes : number
}