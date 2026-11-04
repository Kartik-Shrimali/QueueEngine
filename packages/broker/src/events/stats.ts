import { HEARTBEAT_INTERVAL_MS, WS_STATE_FLUSH_MS } from "@queueengine/shared";
import { bus, type JobEvent } from "./bus.js";
import { getActiveByWorker, getStatsCounts } from "../store/pg/jobs.js";
import { redisClient } from "../store/redis/client.js";
import { qeWorker } from "../store/redis/keys.js";

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

let snapshot: Stats = {
    queueDepth: { critical: 0, high: 0, normal: 0, low: 0, total: 0 },
    delayed: 0,
    active: 0,
    deadTotal: 0,
    throughput: {
        completedPerSec: 0,
        failedPerSec: 0,
        windowSec: 60
    },
    workers: [],
    oldestPendingAgeMs: 0
};

export function getSnapshot() {
    return snapshot;
}

const completedTimes: number[] = [];
const deadTimes: number[] = [];

export function startStats() {
    bus.on('job', (event: JobEvent) => {
        if (event.to === 'completed') {
            completedTimes.push(Date.now())
        }

        if (event.to === 'dead') {
            deadTimes.push(Date.now());
        }
    })

    return setInterval(async () => {
        const cutoff = Date.now() - 60000;
        while (completedTimes.length !== 0 && completedTimes[0] < cutoff) {
            completedTimes.shift();
        }

        while (deadTimes.length !== 0 && deadTimes[0] < cutoff) {
            deadTimes.shift();
        }

        snapshot.throughput.completedPerSec = completedTimes.length / 60;
        snapshot.throughput.failedPerSec = deadTimes.length / 60;

        try {
            const response = await getStatsCounts();

            snapshot.queueDepth.critical = Number(response.critical);
            snapshot.queueDepth.high = Number(response.high);
            snapshot.queueDepth.normal = Number(response.normal);
            snapshot.queueDepth.low = Number(response.low);
            snapshot.queueDepth.total = Number(response.ready_total);

            snapshot.delayed = Number(response.delayed);
            snapshot.active = Number(response.active);
            snapshot.deadTotal = Number(response.dead_total);

            snapshot.oldestPendingAgeMs = response.oldest_enqueued_at === null ? 0 : Date.now() - response.oldest_enqueued_at.getTime();

            const heartbeats = await getWorkerHeartbeats();
            const activeWorkers = await getActiveByWorker();

            const inFlightByWorker = new Map<string, number>();

            for (const row of activeWorkers) {
                inFlightByWorker.set(row.worker_id, Number(row.in_flight));
            }

            snapshot.workers = heartbeats.map((beat) => {
                return {
                    workerId: beat.workerId,
                    inFlight: inFlightByWorker.get(beat.workerId) ?? 0,
                    lastSeen: new Date(beat.lastSeenMs).toISOString(),
                    alive : Date.now() - beat.lastSeenMs <= 2 * HEARTBEAT_INTERVAL_MS
                }
            })

        } catch (error: any) {
            console.error(`There was some error in fetching stats from postgres or Redis.Error message : `, error.message);
        }

    }, WS_STATE_FLUSH_MS);
}

async function getWorkerHeartbeats() {
    const workerHeartbeats = [];
    for await (const keys of redisClient.scanIterator({ MATCH: qeWorker('') + '*', COUNT: 100 })) {
        if (keys.length === 0) continue;

        for (const workerKey of keys) {
            const value = await redisClient.get(workerKey);

            if (value === null) continue;

            workerHeartbeats.push({
                workerId: workerKey.slice(qeWorker('').length),
                lastSeenMs: Number(value)
            })
        }
    }

    return workerHeartbeats;
}