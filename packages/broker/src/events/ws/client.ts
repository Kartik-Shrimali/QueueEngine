import type { WebSocket } from "ws"
import type { JobEvent, JobStatus } from "@queueengine/shared"

export type Client = {
    socket : WebSocket,
    pendingState : string | null,
    pendingEvents : JobEvent[],
    dropped : number,
    strikes : number,
    types : string [] | null,
    statuses : JobStatus[] | null 
}