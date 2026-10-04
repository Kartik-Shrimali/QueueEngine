import { HEARTBEAT_INTERVAL_MS, LEASE_TTL_MS } from "@queueengine/shared";
import { qeActive, qeLease, qeWorker } from "../store/redis/keys.js";
import { redisClient } from "../store/redis/client.js";
import { getScriptSha } from "../store/redis/scripts/loader.js";

export async function heartbeat(workerId : string , leases : {jobId : string , leaseToken : string}[]){
    const currentTime = Date.now();
    const leasePrefix = qeLease('');
    const renewed : string[] = [];
    const lost : string[] = [];
    const leaseExpiresAt = new Date(currentTime + LEASE_TTL_MS).toISOString();

    for(const lease of leases){
        const result = await redisClient.evalSha(getScriptSha('renew') , {keys : [qeActive()] , arguments : [leasePrefix , lease.jobId , lease.leaseToken , String(LEASE_TTL_MS) , String(currentTime)]})

        if(result === 1) renewed.push(lease.jobId);
        else lost.push(lease.jobId);
    }

    await redisClient.SET(qeWorker(workerId) , String(currentTime) , {expiration : {type : 'PX' , value : 3 * HEARTBEAT_INTERVAL_MS}})

    return {renewed , lost , leaseExpiresAt}
}