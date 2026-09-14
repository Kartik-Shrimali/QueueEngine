import type { Priority } from "@queueengine/shared";
import { computeScore } from "@queueengine/shared";
import { insertJob } from "../store/pg/jobs.js";
import { redisClient } from "../store/redis/client.js";
import { qeDelayed, qeReady } from "../store/redis/keys.js";


export async function enqueueJob(params: {
    type: string,
    payload: unknown,
    priority: Priority,
    maxAttempts: number,
    runAfter: Date
}) {

    const job = await insertJob(params);

    if (params.runAfter.getTime() <= Date.now()) {
        await redisClient.ZADD(qeReady(), { score: computeScore(job.enqueued_at.getTime(), params.priority), value: job.id })
    } else {
        await redisClient.ZADD(qeDelayed(), { score: params.runAfter.getTime(), value: job.id })
    }

    return { id: job.id, status: job.status, enqueuedAt: job.enqueued_at };
}