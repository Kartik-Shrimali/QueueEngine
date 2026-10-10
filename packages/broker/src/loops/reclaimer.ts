import { RECLAIM_INTERVAL_MS } from "@queueengine/shared";
import { reclaimExpired } from "../core/reclaim.js";

let running = false;
let timer: NodeJS.Timeout | null = null;

export function startReclaimer() {
    timer = setInterval(async () => {
        if (running === true) return;
        running = true;
        try {
            await reclaimExpired();
        } catch (error) {
            console.error(error);
        }finally{
            running = false;
        }
    }, RECLAIM_INTERVAL_MS);
}

export function stopReclaimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}