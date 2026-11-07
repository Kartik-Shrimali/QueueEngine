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
    }