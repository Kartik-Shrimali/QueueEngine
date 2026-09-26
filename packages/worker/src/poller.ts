import { executeJob } from "./executor.js";

export type ActiveController = { current: AbortController | null }

export async function startPolling(request: (method: string, path: string, body?: unknown, signal?: AbortSignal) => Promise<any>, concurrency: number, stopping: { value: boolean }, activeController: ActiveController) {
    let inFlight = 0;
    while (1) {

        if (stopping.value && inFlight === 0) break;

        if (stopping.value) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            continue;
        }

        if (concurrency - inFlight <= 0) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            continue;
        }
        const controller = new AbortController();
        activeController.current = controller
        try {
            const response = await request("POST", "/jobs/dequeue", { workerId: 'worker-1', count: concurrency - inFlight }, controller.signal);
            if (!response || !response.jobs || response.jobs.length === 0) {
                continue;

            }

            for (let job of response.jobs) {
                inFlight++;
                executeJob(job).then(async (result) => {
                    inFlight--;
                    await request("POST", `/jobs/${job.id}/result`, {
                        leaseToken: job.leaseToken,
                        outcome: result.outcome,
                        error: result.error
                    })
                })
            }

        } catch (error: any) {
            if (error.code === 'ERR_CANCELED') {
                continue; //this was us cancelling on purpose.It is not a problem
            }
            console.error('Dequeue request failed:', error.message);
            continue;
        }

    }
}