import { LEASE_TTL_MS } from "@queueengine/shared";
import { qeActive, qeLease, qeReady, qeType } from "../store/redis/keys.js";
import {  markJobActive } from "../store/pg/jobs.js";
import { insertAttempt } from "../store/pg/attempts.js";
import { randomUUID } from "crypto";
import { runScript } from "../store/redis/scripts/loader.js";

export async function dequeue(workerId : string , count : number = 1 , types ?: string[]){
    const jobs = [];
    const currentTime = Date.now();
    const leasePrefix = qeLease('')
    const typePrefix = qeType('')
    const AllTokens = Array.from({length : count} , () => randomUUID());
    const args : string[] = [String(LEASE_TTL_MS) , leasePrefix , String(currentTime) , typePrefix , String((types ?? []).length) , ...(types ?? []) , String(count) , ...AllTokens  ]

    const popped = await runScript('dequeue' , [qeReady() , qeActive()] , args);

    const rows = popped as [string , string , string][];

    for(const [jobId , score  , token ] of rows ){
        const leaseExpiresAt = new Date(currentTime + LEASE_TTL_MS);
        const job = await markJobActive(jobId , workerId , token , leaseExpiresAt);
        await insertAttempt(jobId , job.attempts ,workerId , token);
        jobs.push({...job , leaseToken : token , leaseExpiresAt : leaseExpiresAt.toISOString()})
    }
    return jobs;    
}