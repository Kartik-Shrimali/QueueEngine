export type Stats = {
    queueDepth: {
        critical: number,
        high: number,
        normal: number,
        low: number,
        total: number,
    },
    delayed: number,
    active: number,
    deadTotal: number,
    throughput: {
        completedPerSec: number,
        failedPerSec: number,
        windowSec: number
    },
    workers: {
        workerId: string,
        inFlight: number,
        lastSeen: string,
        alive: boolean
    }[],
    oldestPendingAgeMs: number
};