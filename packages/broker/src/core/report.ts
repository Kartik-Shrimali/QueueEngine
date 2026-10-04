import { AppError } from "@queueengine/shared";
import { finalizeAttempt } from "../store/pg/attempts.js";
import { updateJobStatus } from "../store/pg/jobs.js"
import { qeActive, qeLease } from "../store/redis/keys.js";
import { runScript } from "../store/redis/scripts/loader.js";

export async function reportResult(jobId: string,  leaseToken : string , outcome: 'succeeded' | 'failed') {
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
        const response = await updateJobStatus(jobId, 'dead', 'exhausted');
        await finalizeAttempt(jobId , leaseToken , 'failed');
        return response;
    } 
}