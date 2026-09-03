export type ErrorCode = "unauthorized" | "forbidden" | "not_found" | "validation_failed" | "unregistered_job_type" | "payload_too_large" | "lease_lost" | "job_not_active" | "not_replayable" | "queue_unavailable" | "internal_error"

export const statusMap: Record<ErrorCode, number> = {
    "unauthorized": 401,
    "forbidden": 403,
    "not_found": 404,
    "validation_failed": 400,
    "unregistered_job_type": 400,
    "payload_too_large": 413,
    "lease_lost": 409,
    "job_not_active": 409,
    "not_replayable": 409,
    "queue_unavailable": 503,
    "internal_error": 500
}

export class AppError extends Error {
    code: ErrorCode;
    details?: unknown;

    constructor(code: ErrorCode, message: string, details?: unknown) {
        super(message);
        this.code = code;
        this.details = details;
    }
}