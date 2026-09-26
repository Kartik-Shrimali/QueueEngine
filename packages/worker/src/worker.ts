import { startPolling } from "./poller.js";
import { createTransport } from "./transport.js";
import {WORKER_CONCURRENCY} from "@queueengine/shared"

export {register , executeJob} from "./executor.js";

export function createWorker(config : {brokerUrl : string , apiKey : string , concurrency ?: number}){
    if(!config.concurrency) config.concurrency = WORKER_CONCURRENCY;
    const concurrency = config.concurrency;
    const request = createTransport(config.brokerUrl , config.apiKey);

    return {
        start : () => startPolling(request , concurrency)
    }
}