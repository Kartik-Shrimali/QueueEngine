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
    const result = await pool.query(`UPDATE jobs SET status = $1, dead_reason = $2, lease_token = NULL, lease_expires_at = NULL, worker_id = NULL WHERE id = $3 RETURNING id, status`,[status , deadReason ?? null, id]);
    return result.rows[0];
}

export async function markJobActive(jobId : string , workerId : string , leaseToken : string , leaseExpiresAt : Date){
    const result = await pool.query(`UPDATE jobs SET status = $1 , attempts = attempts+1 , lease_token = $2 , lease_expires_at = $3 , worker_id = $4 , first_started_at = COALESCE(first_started_at , now()) WHERE id = $5 RETURNING *`,['active' , leaseToken , leaseExpiresAt , workerId , jobId])

    return result.rows[0];
}

export async function markJobPending(jobId : string){
    const result = await pool.query(`UPDATE jobs SET status = 'pending' , run_after = now() , lease_token = NULL , lease_expires_at = NULL , worker_id = NULL WHERE id = $1 AND status = 'active' RETURNING id , status`, [jobId]);

    return result.rows[0];
}