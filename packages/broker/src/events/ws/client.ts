import type { WebSocket } from "ws"

export type Client = {
    socket : WebSocket,
    pendingState : string | null
}