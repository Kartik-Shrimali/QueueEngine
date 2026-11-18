//Priority is a copy of Priority type in shared
export type Priority = 'critical' | 'high' | 'normal' | 'low';

export type ClientConfig = {
    brokerUrl: string,
    apiKey: string
}

export type EnqueueOptions = {
    priority?: Priority,
    maxAttempts?: number,
    runAfter?: Date | string
}

export type EnqueueResult = {
    id: string,
    status: string,
    enqueuedAt: string
}

export function createClient(config: ClientConfig) {
    const baseUrl = config.brokerUrl.replace(/\/+$/, '');

    return {
        enqueue: async <T>(type: string, payload: T, options?: EnqueueOptions): Promise<EnqueueResult> => {
            const body = {
                type,
                payload,
                priority: options?.priority,
                maxAttempts: options?.maxAttempts,
                runAfter: typeof options?.runAfter === 'string' ? options.runAfter : options?.runAfter?.toISOString()
            }

            const response = await fetch(baseUrl + "/jobs", {
                "method": "POST",
                "headers": {
                    "Authorization": `Bearer ${config.apiKey}`,
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify(body)
            })

            if(response.ok === false){
                const answer = await response.json();
                throw new Error(`QueueEngine ${response.status} : ${answer.message}`);
            }

            return await response.json();
        }
    }
}