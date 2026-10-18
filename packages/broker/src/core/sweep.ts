import { computeScore } from "@queueengine/shared";
import { getStalePendingJobs } from "../store/pg/jobs.js";
import { redisClient } from "../store/redis/client.js";
import { qeActive, qeDelayed, qeReady, qeType } from "../store/redis/keys.js";
import { wakeOne } from "./waiters.js";

export async function sweepOnce() {
    const staleJobs = await getStalePendingJobs();
    const repairedIds = [];
    for (const job of staleJobs) {
        let readyBool = await redisClient.zScore(qeReady(), job.id);
        let delayedBool = await redisClient.zScore(qeDelayed(), job.id);
        let activeBool = await redisClient.zScore(qeActive(), job.id);

        if (readyBool === null && delayedBool === null && activeBool === null) {
            await redisClient.zAdd(qeReady(), { score: computeScore(job.enqueued_at.getTime(), job.priority), value: job.id });

            await redisClient.set(qeType(job.id), job.type);

            wakeOne();
            repairedIds.push(job.id);
        }
    }

    return repairedIds;
}