import { AppError } from "@queueengine/shared";
import { redisClient } from "../store/redis/client.js";
import { qeReady } from "../store/redis/keys.js";
import { getJobById } from "../store/pg/jobs.js";
import { insertAttempt } from "../store/pg/attempts.js";
import { randomUUID } from "crypto";

export async function dequeue(count : number = 1){
    const jobs = [];

    for(let i = 0; i < count; i++){
        const response = await redisClient.ZPOPMIN(qeReady())
        if(!response){
            break;
        }
        const job = await getJobById(response.value);
        await insertAttempt(job.id , 1 , 'worker-1' , randomUUID());
        jobs.push(job);
    }
    return jobs;    
}