import { BROKER_LOCK_TTL_MS } from "@queueengine/shared";
import { redisClient } from "./store/redis/client.js";
import { qeBrokerLock } from "./store/redis/keys.js";
import { runScript } from "./store/redis/scripts/loader.js";

export async function acquireBrokerLock(){
    const instanceId = crypto.randomUUID();
    const result = await redisClient.set(qeBrokerLock() , instanceId , {expiration : {type : 'PX' , value : BROKER_LOCK_TTL_MS} , condition :'NX'})

    if(result === null){
        const holder = await redisClient.get(qeBrokerLock())
        console.error(holder);

        process.exit(1);
    }

    return instanceId;
}

export async function renewBrokerLock(instanceId : string){
    const result = await runScript('renewlock' , [qeBrokerLock()] , [instanceId , String(BROKER_LOCK_TTL_MS)])
    if(result === 1) return true;
    return false;
}