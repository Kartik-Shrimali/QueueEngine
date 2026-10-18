import { computeScore } from "@queueengine/shared";
import { markAttemptAbandoned } from "../store/pg/attempts.js";
import { getLiveJobs, markJobPending } from "../store/pg/jobs.js";
import { redisClient } from "../store/redis/client.js";
import { qeActive, qeDelayed, qeLease, qeReady, qeType } from "../store/redis/keys.js";

async function deleteByPattern(pattern : string){
    for await(const keys of redisClient.scanIterator({MATCH: pattern , COUNT : 100})){
        if(keys.length === 0) continue;
        await redisClient.del(keys);
    }
}

export async function clearQueueState(){
    await redisClient.del(qeReady());
    await redisClient.del(qeActive());
    await redisClient.del(qeDelayed());

    await deleteByPattern(qeLease('') + '*');
    await deleteByPattern(qeType('') + '*');
}

export async function rebuildFromPostgres(){
    await clearQueueState();
    const liveJobs = await getLiveJobs();
    const recoveredJobs = [];
    for(const job of liveJobs){
        if(job.status === 'active'){
            recoveredJobs.push(job);
            await markJobPending(job.id);
            await markAttemptAbandoned(job.id);
        }
    }

    const newLiveJobs = await getLiveJobs();
    for(const job of newLiveJobs){
        if(job.run_after.getTime() <= Date.now()){
            await redisClient.zAdd(qeReady() , {score : computeScore(job.enqueued_at.getTime() , job.priority) , value : job.id});
        }else{
            await redisClient.zAdd(qeDelayed() , {score : job.run_after.getTime() , value : job.id});
        }
        await redisClient.set(qeType(job.id) , job.type)
    }
    return recoveredJobs;
}