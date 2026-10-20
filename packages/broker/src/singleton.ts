import { BROKER_LOCK_RENEW_MS, BROKER_LOCK_TTL_MS } from "@queueengine/shared";
import { redisClient } from "./store/redis/client.js";
import { qeBrokerLock } from "./store/redis/keys.js";
import { runScript } from "./store/redis/scripts/loader.js";

let currentInstanceId: string | null = null;

export async function acquireBrokerLock() {
    currentInstanceId = crypto.randomUUID();
    const result = await redisClient.set(qeBrokerLock(), currentInstanceId, { expiration: { type: 'PX', value: BROKER_LOCK_TTL_MS }, condition: 'NX' })

    if (result === null) {
        const holder = await redisClient.get(qeBrokerLock())
        console.error(holder);

        process.exit(1);
    }

    return currentInstanceId;
}

export async function renewBrokerLock(instanceId: string) {
    const result = await runScript('renewlock', [qeBrokerLock()], [instanceId, String(BROKER_LOCK_TTL_MS)])
    if (result === 1) return true;
    return false;
}

export function startLockRenewal(instanceId: string) {
    return setInterval(async () => {
        try {
            const response = await renewBrokerLock(instanceId);
            if (response === false) {
                console.error('Lost the broker lock, exiting');
                process.exit(1);
            }
        } catch (error: any) {
            console.error(error.message)
        }
    }, BROKER_LOCK_RENEW_MS)
}

export async function releaseBrokerLock(instanceId: string) {
    const result = await runScript('releaselock', [qeBrokerLock()], [instanceId]);

    if (result === 1) return true;

    return false;
}

export async function isBrokerLockHeld() {
    if (currentInstanceId === null) return false;

    const result = await redisClient.get(qeBrokerLock());

    return result === currentInstanceId;
}