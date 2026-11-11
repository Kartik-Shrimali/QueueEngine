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

export type JobRow = {
    id : string,
    type : string,
    status : string,
    priority : string,
    attempts : number,
    maxAttempts : number,
    runAfter : string,
    enqueuedAt : string,
    updatedAt : string,
    deadReason : string | null,
    replayedFrom : string | null,
    firstStartedAt : string | null,
    finishedAt : string | null,
}

export type AttemptRow = {
    attemptNumber : number,
    workerId : string,
    startedAt : string,
    endedAt : string | null,
    outcome : string | null,
    errorMessage : string | null,
    durationMs : number | null
}

export type JobDetail = {
    id : string,
    type : string,
    status : string,
    priority : string,
    attempts : number,
    maxAttempts : number,
    runAfter : string,
    enqueuedAt : string,
    deadReason : string | null,
    replayedFrom : string | null,
    firstStartedAt : string | null,
    finishedAt : string | null,
    totalAttempts : number,
    attemptHistory : AttemptRow[]
}