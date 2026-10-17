import { AppError, computeBackoff } from "@queueengine/shared";
import { finalizeAttempt } from "../store/pg/attempts.js";
import { getJobById, markJobRetry, updateJobStatus } from "../store/pg/jobs.js"
import { qeActive, qeDelayed, qeLease } from "../store/redis/keys.js";
import { runScript } from "../store/redis/scripts/loader.js";
import { redisClient } from "../store/redis/client.js";

export async function reportResult(jobId: string,  leaseToken : string , outcome: 'succeeded' | 'failed' , errorMessage? : string) {
    const released = await runScript('release' , [qeActive()] , [qeLease('') , jobId , leaseToken])

    if(released === 0){
        throw new AppError('lease_lost' , "Lease token does not match the current lease for this job." , {jobId})
    }
    if (outcome == 'succeeded') {
        const response = await updateJobStatus(jobId, 'completed');
        await finalizeAttempt(jobId , leaseToken , 'succeeded');
        return response;
    }
    if (outcome == 'failed') {
        const job = await getJobById(jobId);
        if(!job) throw new AppError('not_found' , "Job not found");

        if(job.attempts < job.max_attempts){
            const delay = computeBackoff(job.attempts);
            const runAfter = new Date(Date.now() + delay);

            const response = await markJobRetry(jobId , runAfter)
            await redisClient.zAdd(qeDelayed() , {score : runAfter.getTime() ,value :  jobId});
            await finalizeAttempt(jobId , leaseToken , 'failed' , errorMessage)
            return response;
        }            
        const response = await updateJobStatus(jobId, 'dead', 'exhausted');
        await finalizeAttempt(jobId , leaseToken , 'failed' , errorMessage);
        return response;
    } 
}