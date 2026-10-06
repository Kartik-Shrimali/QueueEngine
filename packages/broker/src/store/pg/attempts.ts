import { pool } from "./client.js";

export async function insertAttempt(jobId : string , attemptNumber : number , workerId : string , leaseToken : string){
    const result = await pool.query(`
        INSERT INTO job_attempts(job_id , attempt_number , worker_id , lease_token) VALUES($1 , $2 , $3 , $4) RETURNING id`,[jobId , attemptNumber , workerId , leaseToken]);

    return result.rows[0];
}

export async function finalizeAttempt(jobId : string , leaseToken : string ,outcome : 'succeeded' | 'failed' , errorMessage ?: string){
    const result = await pool.query(`
        UPDATE job_attempts SET outcome = $1, ended_at = now() , error_message = $2 WHERE job_id = $3 AND lease_token = $4 AND outcome IS NULL RETURNING id `,[outcome , errorMessage ?? null, jobId , leaseToken ]);

    return result.rows[0];
}

export async function markAttemptAbandoned(jobId : string){
    const result = await pool.query(`UPDATE job_attempts SET outcome = 'abandoned' , ended_at = now() WHERE job_id = $1 AND outcome IS NULL RETURNING id` , [jobId])

    return result.rows[0];
}