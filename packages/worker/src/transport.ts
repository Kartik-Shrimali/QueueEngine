import axios from "axios";

const MAX_TRANSPORT_RETRIES = 3;
const TRANSPORT_BASE_DELAY_MS = 500;

export function createTransport(brokerUrl: string, apikey: string) {
    const client = axios.create({
        baseURL: brokerUrl,
        headers: {
            Authorization: `Bearer ${apikey}`
        }
    })

    return async function request(method: string, path: string, body?: unknown , signal?: AbortSignal) {
        for (let attempt = 1; attempt <= MAX_TRANSPORT_RETRIES; attempt++) {
            try {
                const response = await client.request({
                    method,
                    url: path,
                    data: body,
                    signal
                })

                return response.data;
            } catch (error) {
                const isLastAttempt = attempt === MAX_TRANSPORT_RETRIES;
                if (!shouldRetry(error) || isLastAttempt) {
                    throw error;
                }

                const delay = TRANSPORT_BASE_DELAY_MS * 2 ** (attempt - 1);
                await wait(delay);
            }
        }
    }
}

function shouldRetry(error: any): boolean {
    if (!error.response) return true;
    return error.response.status >= 500;
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}