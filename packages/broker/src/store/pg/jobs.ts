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
    const result = await pool.query(`UPDATE jobs SET status = $1, dead_reason = $2, lease_token = NULL, lease_expires_at = NULL, worker_id = NULL, finished_at = now() WHERE id = $3 RETURNING id, status , finished_at , type , attempts`,[status , deadReason ?? null, id]);
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

export async function markJobAbandoned(jobId : string){
    const result = await pool.query(`UPDATE jobs SET status = 'dead' , dead_reason = 'abandoned' , finished_at = now() , lease_token = NULL , lease_expires_at = NULL , worker_id = NULL WHERE id = $1 AND status = 'active' RETURNING id , status , dead_reason` , [jobId ]);

    return result.rows[0]
}

export async function markJobRetry(jobId : string , runAfter : Date){
    const result = await pool.query(`UPDATE jobs SET status = 'pending' , run_after = $1 , lease_token = NULL , lease_expires_at = NULL , worker_id = NULL WHERE id = $2 AND status = 'active' RETURNING id , status , attempts , run_after` , [runAfter , jobId]);

    return result.rows[0];
}

export async function getLiveJobs(){
    const result = await pool.query(`SELECT id , type , priority , status , enqueued_at , run_after from jobs WHERE status IN ('pending' , 'active')`);

    return result.rows;
}

export async function getStalePendingJobs(){
    const result = await pool.query(`SELECT id , type , priority , enqueued_at , run_after from jobs WHERE status = 'pending' and run_after < now() - interval '30 seconds'`);

    return result.rows;
}

export async function getStatsCounts(){
    const result = await pool.query(`SELECT 
        count(*) FILTER (WHERE status = 'pending' AND run_after <= now() AND priority = 'critical') AS critical,
        count(*) FILTER (WHERE status = 'pending' AND run_after <= now() AND priority = 'high') AS high,
        count(*) FILTER (WHERE status = 'pending' AND run_after <= now() AND priority = 'normal') AS normal,
        count(*) FILTER (WHERE status = 'pending' AND run_after <= now() AND priority = 'low') AS low,
        count(*) FILTER (WHERE status = 'pending' AND run_after <= now()) AS ready_total,
        count(*) FILTER (WHERE status = 'pending' AND run_after > now()) AS delayed,
        count(*) FILTER (WHERE status = 'active') AS active,
        count(*) FILTER (WHERE status = 'dead') AS dead_total,
        min(enqueued_at) FILTER (WHERE status = 'pending' AND run_after <= now()) AS oldest_enqueued_at
        FROM jobs
    `);

    return result.rows[0];
}

export async function getActiveByWorker(){
    const result = await pool.query(`SELECT worker_id , count(*) AS in_flight FROM jobs WHERE status = 'active' GROUP BY worker_id`);

    return result.rows;
}

export async function getJobsPage(jobDetails : {
    status ?: string,
    type ?: string
    priority ?: string
    deadReason ?: string,
    limit : number,
    cursor ?: {
        updatedAt : string,
        id : string
    }
}){
    const conditions : string[] = [];
    const values : any[] = [];

    if(jobDetails.status){
        values.push(jobDetails.status);
        conditions.push(`status = $${values.length}`);
    }
    if(jobDetails.type){
        values.push(jobDetails.type);
        conditions.push(`type = $${values.length}`);
    }
    if(jobDetails.priority){
        values.push(jobDetails.priority);
        conditions.push(`priority = $${values.length}`);
    }
    if(jobDetails.deadReason){
        values.push(jobDetails.deadReason);
        conditions.push(`dead_reason = $${values.length}`);
    }

    if(jobDetails.cursor){
        values.push(jobDetails.cursor.updatedAt);
        values.push(jobDetails.cursor.id);

        conditions.push(`(updated_at,id) < ($${values.length-1}::timestamptz , $${values.length}::uuid)`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(jobDetails.limit + 1);

    const result = await pool.query(`SELECT id , type , status , priority , attempts , max_attempts , run_after ,dead_reason , replayed_from , enqueued_at , first_started_at , finished_at , updated_at , updated_at::text AS updated_at_text FROM jobs ${where} ORDER BY updated_at DESC, id DESC LIMIT $${values.length}`, values);

    const rows = result.rows;
    const hasMore = rows.length > jobDetails.limit;

    if(hasMore){
        rows.pop();
    }

    return {rows , hasMore}
}

export async function insertReplay(sourceId : string){
    const result = await pool.query(`INSERT INTO jobs (type , payload , priority , max_attempts , replayed_from) SELECT type , payload , priority , max_attempts , id FROM jobs WHERE id = $1 AND status = 'dead' RETURNING id , status , replayed_from , enqueued_at , type , priority`, [sourceId]);

    return result.rows[0];  
}