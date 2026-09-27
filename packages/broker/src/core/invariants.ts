import { pool } from "../store/pg/client.js";
import { redisClient } from "../store/redis/client.js";
import { qeActive, qeDelayed, qeReady } from "../store/redis/keys.js";


// I3: same job kabhi bhi ek se zyada jagah nahi hona chahiye (qe:ready, qe:delayed, qe:active — teeno mein se sirf ek mein hona chahiye) Agar kahin duplicate mila, matlab kuch bug hai jo job ko galat tarike se do jagah daal raha hai — sabse zyada common bug is project mein yehi hoga.

export async function checkI3(){
    const readyJobs = await redisClient.zRange(qeReady(), 0 , -1);
    const delayedJobs = await redisClient.zRange(qeDelayed() , 0 , -1);
    const activeJobs = await redisClient.zRange(qeActive() , 0 , -1);

    const combinedJobs = [...readyJobs , ...delayedJobs , ...activeJobs ];

    const counts = new Map<string ,number>();
    for(const id of combinedJobs){
        counts.set(id , (counts.get(id) ?? 0) + 1);
    }

    const sample : string[] = [];
    for(const [id , count] of counts){
        if(count > 1) sample.push(id);
    }

    if(sample.length > 0){
        return {id : 'I3' , ok : false , sample};
    }
    return {id : 'I3' , ok : true}
}


// I8: qe:ready mein jo bhi job hai, uska run_after already beet chuka hona chahiye (yaani woh dequeue ke liye ready hai). Agar future ka run_after wala job ready set mein mil gaya, matlab woh time se pehle hi dequeue ho sakta hai — jo galat hai.

export async function checkI8(){
    const readyJobs = await redisClient.zRange(qeReady() , 0 , -1);

    const response = await  pool.query(`SELECT id FROM jobs WHERE id = ANY($1) AND run_after > now()` , [readyJobs]);

    const sample = response.rows.map((row) => row.id);

    return {id : 'I8' , ok : sample.length === 0 , sample};
}

export async function checkI7(){
    const response = await pool.query(`SELECT id FROM jobs WHERE attempts > max_attempts`);

    const sample = response.rows.map((row) => row.id);

    return {id : 'I7' , ok : sample.length === 0, sample}
}