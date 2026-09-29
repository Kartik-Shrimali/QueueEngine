import type { Priority } from "@queueengine/shared";
import { computeScore } from "@queueengine/shared";
import { insertJob } from "../store/pg/jobs.js";
import { redisClient } from "../store/redis/client.js";
import { qeDelayed, qeReady, qeType } from "../store/redis/keys.js";
import { wakeOne } from "./waiters.js";


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
        wakeOne();
    } else {
        await redisClient.ZADD(qeDelayed(), { score: params.runAfter.getTime(), value: job.id })
    }
    await redisClient.SET(qeType(job.id) , params.type)
    return { id: job.id, status: job.status, enqueuedAt: job.enqueued_at };
}