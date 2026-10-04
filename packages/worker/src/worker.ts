import { randomUUID } from "node:crypto";
import { startPolling, type ActiveController } from "./poller.js";
import { createTransport } from "./transport.js";
import { SHUTDOWN_GRACE_MS, WORKER_CONCURRENCY } from "@queueengine/shared"
import { startHeartbeat } from "./heartbeat.js";

export { register, executeJob } from "./executor.js";

export function createWorker(config: { brokerUrl: string, apiKey: string, concurrency?: number }) {
    if (!config.concurrency) config.concurrency = WORKER_CONCURRENCY;
    const concurrency = config.concurrency;
    const stopping = { value: false };
    const activeController: ActiveController = { current: null };
    const request = createTransport(config.brokerUrl, config.apiKey);
    let pollingPromise: Promise<any>;
    let heartbeatTimer: NodeJS.Timeout | undefined;
    const workerId: string = 'worker-' + randomUUID().slice(0, 8);

    const heldLeases: Map<string, string> = new Map();
    const lostJobs = new Set<string>()

    return {
        start: () => {
            heartbeatTimer = startHeartbeat(request , workerId , heldLeases , lostJobs)
            pollingPromise = startPolling(request, concurrency, stopping, activeController, heldLeases, workerId , lostJobs)
        },
        stop: async () => {
            stopping.value = true;
            activeController.current?.abort();
            await Promise.race([pollingPromise, new Promise((resolve) => { setTimeout(resolve, SHUTDOWN_GRACE_MS) })])
            clearInterval(heartbeatTimer);
        }
    }
}