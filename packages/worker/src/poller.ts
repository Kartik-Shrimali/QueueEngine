import { executeJob } from "./executor.js";

export async function startPolling(request : (method : string , path : string , body ?: unknown) => Promise<any>){
    while(1){
        const response = await request("POST" , "/jobs/dequeue" , {workerId : 'worker-1' , count : 1});

        if(!response || !response.jobs || response.jobs.length === 0){
            continue;
        }

        const job = response.jobs[0];
        const result = await executeJob(job);

        await request("POST" , `/jobs/${job.id}/result` , {
            leaseToken : job.leaseToken,
            outcome : result.outcome,
            error : result.error
        })
    }
}