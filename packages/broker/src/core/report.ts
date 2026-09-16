import { updateJobStatus } from "../store/pg/jobs.js"

export async function reportResult(jobId: string, outcome: 'succeeded' | 'failed') {
    if (outcome == 'succeeded') {
        const response = await updateJobStatus(jobId, 'completed');
        return response;
    }
    if (outcome == 'failed') {
        const response = await updateJobStatus(jobId, 'dead', 'exhausted');
        return response;
    } 
}