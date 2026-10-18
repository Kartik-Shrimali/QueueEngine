import { BROKER_LOCK_TTL_MS } from "@queueengine/shared";
import { redisClient } from "./store/redis/client.js";
import { qeBrokerLock } from "./store/redis/keys.js";

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