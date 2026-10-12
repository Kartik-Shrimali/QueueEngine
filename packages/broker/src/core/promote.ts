import { computeScore } from "@queueengine/shared";
import { getJobById } from "../store/pg/jobs.js";
import { redisClient } from "../store/redis/client.js";
import { qeDelayed, qeReady } from "../store/redis/keys.js";
import { runScript } from "../store/redis/scripts/loader.js";
import { wakeOne } from "./waiters.js";

export async function findDueJobs(){
    const jobs = await redisClient.zRangeByScore(qeDelayed() , 0 , Date.now());
    return jobs
}

export async function promoteJob(jobId : string){
    const job = await getJobById(jobId);

    if(!job){
        await redisClient.zRem(qeDelayed() , jobId);
        console.warn(`Ghost id found : ${jobId}`)
        return;
    }

    const score = computeScore(job.enqueued_at.getTime() , job.priority)

    const result = await runScript('promote' , [qeDelayed() , qeReady()] , [jobId , String(Date.now()) , String(score)])

    if(result === 1){
        wakeOne();
    }

    return result;
}

export async function promoteDue(){
    const jobIds = await findDueJobs();
    for(const job of jobIds){
        try{
            await promoteJob(job);
        }catch(error : any){
            console.error(`There was some error for job ${job}` ,  error.message)
        }
    }

    return jobIds.length;
}