import { AppError } from "@queueengine/shared";
import { redisClient } from "../store/redis/client.js";
import { qeReady } from "../store/redis/keys.js";
import { getJobById } from "../store/pg/jobs.js";
import { insertAttempt } from "../store/pg/attempts.js";
import { randomUUID } from "crypto";

export async function dequeue(){
    const response = await redisClient.ZPOPMIN(qeReady())
    if(!response){
        return null;
    }
    const value = response?.value;
    const score = response?.score;

    const job = await getJobById(value);

    await insertAttempt(job.id , 1 , 'worker-1' , randomUUID());
    return job;    
}