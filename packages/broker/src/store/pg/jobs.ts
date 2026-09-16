import type { Priority } from "@queueengine/shared";
import { pool } from "./client.js";

export async function insertJob(params: {
    type: string;
    payload: unknown;
    priority: Priority;
    maxAttempts: number;
    runAfter: Date
}) {
    const result = await pool.query(`INSERT INTO jobs(type,payload,priority,max_attempts,run_after) values($1,$2,$3,$4,$5) RETURNING id,status,enqueued_at`, [params.type, JSON.stringify(params.payload), params.priority, params.maxAttempts, params.runAfter]);

    return result.rows[0];
}

export async function getJobById(id: string) {
    const result = await pool.query(`SELECT * from jobs WHERE id = $1`, [id]);
    return result.rows[0];
}

export async function updateJobStatus(id : string , status : 'completed' | 'dead' , deadReason?: 'exhausted' | 'abandoned'){
    const result = await pool.query(`UPDATE jobs SET status = $1, dead_reason = $2 WHERE id = $3 RETURNING id, status`,[status , deadReason ?? null, id]);
    return result.rows[0];
}