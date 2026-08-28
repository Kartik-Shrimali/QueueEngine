export type Priority = 'critical' | 'high' | 'normal' | 'low';
export type JobStatus = 'pending' | 'active' | 'completed' | 'dead';
export type DeadReason = 'exhausted' | 'abandoned';
export type Outcome = 'succeeded' | 'failed' | 'abandoned';

export interface Job{
    id : string,
    type : string,
    payload : unknown,
    priority : Priority,
    status : JobStatus,
    attempts : number,
    maxAttempts : number,
    runAfter : Date,
    leaseToken : string | null,
    leaseExpiresAt : Date | null,
    workerId : string | null,
    deadReason : DeadReason | null,
    replayedFrom : string | null,
    enqueuedAt : Date,
    firstStartedAt : Date | null,
    finishedAt : Date | null,
    updatedAt : Date
}   

export interface JobAttempt{
    id : number,
    jobId : string,
    attemptNumber : number,
    workerId : string,
    leaseToken : string,
    startedAt : Date
    endedAt : Date | null,
    durationMs : number | null,
    outcome : Outcome | null,
    errorMessage : string | null,
    errorStack : string | null,
}