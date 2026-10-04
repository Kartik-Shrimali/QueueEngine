import { pool } from "../store/pg/client.js";
import { redisClient } from "../store/redis/client.js";
import { qeActive, qeDelayed, qeLease, qeReady } from "../store/redis/keys.js";


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

// I7: attempts kabhi max_attempts se zyada nahi hone chahiye. Database ka CHECK constraint yeh pehle se rokta hai, isliye yahan koi id aaye toh matlab constraint hata diya gaya hai.

export async function checkI7(){
    const response = await pool.query(`SELECT id FROM jobs WHERE attempts > max_attempts`);

    const sample = response.rows.map((row) => row.id);

    return {id : 'I7' , ok : sample.length === 0, sample}
}

// I4: jo job Postgres mein 'active' hai, woh ya toh qe:active mein honi chahiye (live lease ya orphan jisko reclaimer dhoondh lega), ya uski lease key abhi bhi honi chahiye. Agar dono nahi hain, toh woh job kabhi recover nahi hogi. Ek baar dikhne wali id report chalte waqt bhi ho sakti hai (pehle Redis clear hota hai, Postgres baad mein), isliye sirf un ids pe bharosa karo jo baar baar check mein aayein.

export async function checkI4(){
    const result = await pool.query(`SELECT id FROM jobs WHERE status = 'active'`)
    const activeIds = result.rows.map((row) => row.id)

    const response = await redisClient.zRange(qeActive() , 0 , -1);
    const inActiveSet = new Set(response);

    const sample : string[] = [];

    for(const id of activeIds){
        if(inActiveSet.has(id)) continue;
        else{
            const leaseExists = await redisClient.exists(qeLease(id))
            if(leaseExists === 0) sample.push(id);
        }
    }

    return {id : 'I4' , ok : sample.length === 0 , sample}
}