import { startPolling, type ActiveController } from "./poller.js";
import { createTransport } from "./transport.js";
import { SHUTDOWN_GRACE_MS, WORKER_CONCURRENCY } from "@queueengine/shared"

export { register, executeJob } from "./executor.js";

export function createWorker(config: { brokerUrl: string, apiKey: string, concurrency?: number }) {
    if (!config.concurrency) config.concurrency = WORKER_CONCURRENCY;
    const concurrency = config.concurrency;
    const stopping = { value: false };
    const activeController : ActiveController = {current : null};
    const request = createTransport(config.brokerUrl, config.apiKey);
    let pollingPromise: Promise<any>;

    return {
        start: () => pollingPromise = startPolling(request, concurrency, stopping , activeController),
        stop: async () => {
            stopping.value = true;
            activeController.current?.abort();
            await Promise.race([pollingPromise, new Promise((resolve) => { setTimeout(resolve, SHUTDOWN_GRACE_MS) })])
        }
    }
}