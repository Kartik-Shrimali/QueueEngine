import { computeScore, type Priority } from "@queueengine/shared";
import { redisClient } from "../store/redis/client.js";
import { qeActive } from "../store/redis/keys.js";

export async function findExpiredJobs(){
    const jobs = await redisClient.zRangeByScore(qeActive() , 0 , Date.now());
    return jobs;
}

export function decideReclaim(job : {attempts : number , max_attempts : number , priority : Priority , enqueued_at : Date}){
    if(job.attempts <  job.max_attempts){
        return {action : "requeue" as const, score : computeScore(job.enqueued_at.getTime() , job.priority)}
    }
    return {action : "dead" as const}
}