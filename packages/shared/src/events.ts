import type { JobStatus } from "./types.js"

export type JobEvent = {
    jobId : string,
    type : string,
    from : JobStatus | null,
    to : JobStatus,
    attempt : number,
    at : string
}