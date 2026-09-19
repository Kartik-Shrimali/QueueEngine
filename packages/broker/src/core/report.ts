import { finalizeAttempt } from "../store/pg/attempts.js";
import { updateJobStatus } from "../store/pg/jobs.js"

export async function reportResult(jobId: string, outcome: 'succeeded' | 'failed') {
    if (outcome == 'succeeded') {
        const response = await updateJobStatus(jobId, 'completed');
        await finalizeAttempt(jobId , 1 , 'succeeded');
        return response;
    }
    if (outcome == 'failed') {
        const response = await updateJobStatus(jobId, 'dead', 'exhausted');
        await finalizeAttempt(jobId , 1 , 'failed');
        return response;
    } 
}