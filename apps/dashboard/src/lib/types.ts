import type { JobEvent } from "@queueengine/shared"

export type LogRow =
    {
        kind: "event",
        id: number,
        event: JobEvent
    } | {
        kind: "gap",
        id: number,
        dropped: number
    };

export type ThroughputPoint = {
    at : number,
    completed : number,
    failed : number
} 

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "failed"