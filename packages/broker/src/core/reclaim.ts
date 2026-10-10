import { computeScore, type Priority } from "@queueengine/shared";
import { redisClient } from "../store/redis/client.js";
import { qeActive, qeLease, qeReady } from "../store/redis/keys.js";
import { getJobById, markJobAbandoned, markJobPending } from "../store/pg/jobs.js";
import { runScript } from "../store/redis/scripts/loader.js";
import { markAttemptAbandoned } from "../store/pg/attempts.js";

export async function findExpiredJobs() {
    const jobs = await redisClient.zRangeByScore(qeActive(), 0, Date.now());
    return jobs;
}

export function decideReclaim(job: { attempts: number, max_attempts: number, priority: Priority, enqueued_at: Date }) {
    if (job.attempts < job.max_attempts) {
        return { action: "requeue" as const, score: computeScore(job.enqueued_at.getTime(), job.priority) }
    }
    return { action: "dead" as const, score: "" }
}

export async function reclaimJob(jobId: string) {
    const job = await getJobById(jobId);
    if (!job) return;

    const reclaimDecision = decideReclaim(job)

    const score = reclaimDecision.score;

    const result = await runScript('reclaim', [qeActive(), qeReady()], [jobId, String(Date.now()), qeLease(''), String(score)])

    if (result === 0) return

    if (reclaimDecision.action === 'requeue') { await markJobPending(jobId); }
    else { await markJobAbandoned(jobId) }

    await markAttemptAbandoned(jobId)
}

export async function reclaimExpired(){
    const jobIds = await findExpiredJobs();

    for(const jobId of jobIds){
        try{
            await reclaimJob(jobId);
        }catch(error : any){
            console.error(`Some error in reclaiming a job with id : `, jobId , error.message);
        }
    }
    return jobIds.length;
}