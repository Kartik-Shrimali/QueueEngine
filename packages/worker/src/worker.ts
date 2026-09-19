import { startPolling } from "./poller.js";
import { createTransport } from "./transport.js";

export {register , executeJob} from "./executor.js";

export function createWorker(config : {brokerUrl : string , apiKey : string}){
    const request = createTransport(config.brokerUrl , config.apiKey);

    return {
        start : () => startPolling(request)
    }
}