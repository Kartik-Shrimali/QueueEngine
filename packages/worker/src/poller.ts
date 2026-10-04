import { executeJob } from "./executor.js";

export type ActiveController = { current: AbortController | null }

export async function startPolling(request: (method: string, path: string, body?: unknown, signal?: AbortSignal) => Promise<any>, concurrency: number, stopping: { value: boolean }, activeController: ActiveController, heldLeases: Map<string, string>, workerId: string, lostJobs: Set<string>) {
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
            const response = await request("POST", "/jobs/dequeue", { workerId: workerId, count: concurrency - inFlight }, controller.signal);
            if (!response || !response.jobs || response.jobs.length === 0) {
                continue;

            }

            for (let job of response.jobs) {
                inFlight++;
                heldLeases.set(job.id, job.leaseToken)
                executeJob(job).then(async (result) => {
                    inFlight--;
                    heldLeases.delete(job.id)
                    if (lostJobs.has(job.id)) {
                        lostJobs.delete(job.id);
                        console.warn('Lease lost, skipping report for job', job.id)
                        return
                    }
                    try {
                        await request("POST", `/jobs/${job.id}/result`, {
                            leaseToken: job.leaseToken,
                            outcome: result.outcome,
                            error: result.error
                        })
                    } catch (error: any) {
                        if (error.response?.status === 409) console.warn("The lease was lost for job: ", job.id);
                        else {
                            console.error("Report failed for job:", job.id, error.message);
                        }
                    }
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