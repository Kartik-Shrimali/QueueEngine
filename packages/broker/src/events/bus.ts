import type { JobStatus } from "@queueengine/shared";
import { EventEmitter } from "node:events";

export type JobEvent = {
    jobId : string,
    type : string,
    from : JobStatus | null,
    to : JobStatus,
    attempt : number,
    at : string
}

export const bus = new EventEmitter();

export function emitJobEvent(jobEvent : Omit<JobEvent , 'at'>){
    bus.emit('job' , {
        type : jobEvent.type,
        jobId : jobEvent.jobId,
        from : jobEvent.from ,
        to : jobEvent.to,
        attempt : jobEvent.attempt,
        at : new Date().toISOString()
    })
}