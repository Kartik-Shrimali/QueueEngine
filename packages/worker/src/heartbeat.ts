import { HEARTBEAT_INTERVAL_MS } from "@queueengine/shared";

export function startHeartbeat(request: (method: string, path: string, body?: unknown, signal?: AbortSignal) => Promise<any>, workerId: string, heldLeases: Map<string, string> , lostJobs : Set<string>) {

    async function sendHeartbeat() {
        try {
            const leases = Array.from(heldLeases, ([jobId, leaseToken]) => ({ jobId, leaseToken }))
            const response = await request('POST', '/jobs/heartbeat', { workerId, leases })

            for(const jobId of response?.lost ?? []){
                lostJobs.add(jobId)
            }
        } catch (error: any) {
            console.warn('Heartbeat failed: ', error.message);
        }
    }

    sendHeartbeat();
    const timer = setInterval(sendHeartbeat , HEARTBEAT_INTERVAL_MS);
    return timer;
}