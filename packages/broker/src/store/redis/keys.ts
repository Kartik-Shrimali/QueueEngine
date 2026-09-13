export function qeReady() : string{
    return "qe:ready";
}

export function qeDelayed() : string{
    return "qe:delayed";
}

export function qeActive() : string{
    return "qe:active";
}

export function qeBrokerLock() : string{
    return "qe:broker:lock"
}

export function qeLease(jobId : string) : string{
    return `qe:lease:${jobId}`;
}

export function qeWorker(workerId : string) : string{
    return `qe:worker:${workerId}`;
}
