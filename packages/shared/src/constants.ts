export const LEASE_TTL_MS = 30000;
export const HEARTBEAT_INTERVAL_MS = 10000;
export const RECLAIM_INTERVAL_MS = 5000;
export const LONG_POLL_TIMEOUT_MS = 30000;
export const WORKER_CONCURRENCY = 5;
export const SHUTDOWN_GRACE_MS = 30000;
export const BASE_MS = 1000;
export const MAX_DELAY_MS = 300000;
export const DEFAULT_MAX_ATTEMPTS = 5;
export const SWEEP_INTERVAL_MS = 30000;
export const WS_EVENT_FLUSH_MS = 250;
export const WS_STATE_FLUSH_MS = 1000;
export const WS_BUFFER_LIMIT_BYTES = 1048576;
export const MAX_PAYLOAD_BYTES = 262144;
export const PRIORITY_BOOST_MS = {
    critical : 3600000,
    high : 900000,
    normal : 0,
    low : -900000
} as const;