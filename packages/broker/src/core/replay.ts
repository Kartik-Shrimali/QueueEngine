import { AppError, computeScore } from "@queueengine/shared";
import { getJobById, insertReplay } from "../store/pg/jobs.js";
import { redisClient } from "../store/redis/client.js";
import { qeReady, qeType } from "../store/redis/keys.js";
import { wakeOne } from "./waiters.js";
import { emitJobEvent } from "../events/bus.js";

export async function replayJob(sourceId : string){
    const result = await insertReplay(sourceId);

    if(result === undefined){
        const job = await getJobById(sourceId);

        if(!job) throw new AppError('not_found' , 'No Job with that Id');
        else throw new AppError('not_replayable' , "Only dead jobs can be replayed")
    }

    await redisClient.zAdd(qeReady() , {score : computeScore(result.enqueued_at.getTime() , result.priority) , value : result.id});

    await redisClient.set(qeType(result.id) , result.type);

    wakeOne();

    emitJobEvent({jobId : result.id , type : result.type , from : null , to : 'pending' , attempt : 0});

    return result;
}