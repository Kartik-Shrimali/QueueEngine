import 'dotenv/config'
import { execSync, spawn } from 'node:child_process';
const PRODUCER_API_KEY = process.env.PRODUCER_API_KEY

if (!PRODUCER_API_KEY) {
    console.error("PRODUCER_API_KEY is missing. Add it to your .env file.");
    process.exit(1)
}

const workerA = spawn(`pnpm --filter demo-worker dev` , {stdio : "inherit" , shell : true})
console.log(workerA.pid);

await new Promise((resolve) => {setTimeout(resolve , 3000)});

const response = await fetch('http://localhost:3000/jobs', {
    "headers": {
        "Authorization": `Bearer ${PRODUCER_API_KEY}`,
        "Content-Type": "application/json"
    },
    "method": "POST",
    "body": JSON.stringify({
        "type": "slow_test",
        "payload": {},
        "maxAttempts": 5
    })
})

if (!response.ok) {
    console.error(response.status);
    process.exit(1);
}

const jsonResponse = await response.json();

console.log(jsonResponse.id);

await waitForStatus(jsonResponse.id , "active" , 60)

console.log(`Job ${jsonResponse.id} is active`);

if(!workerA.pid){
    console.error(`Worker doesnt exist`);
    process.exit(1);
}

execSync(`taskkill /F /T /PID ${workerA.pid}`)
console.log(`workerA killed`)

const workerB = spawn(`pnpm --filter demo-worker dev` , {stdio : "inherit" , shell : true})
console.log(workerB.pid);

await waitForStatus(jsonResponse.id , "completed" , 150);
console.log(`Job completed on workerB`)

if(!workerB.pid){
    console.error(`Worker B doeesnt exist`);
    process.exit(1);
}

execSync(`taskkill /F /T /PID ${workerB.pid}`);
console.log(`Killed worker B`)
process.exit(0);


async function waitForStatus(jobId: string, targetStatus: string , maxWaitSeconds : number = 60) {
    let count = 0;
    while (1) {
        count++;
        const response = await fetch(`http://localhost:3000/jobs/${jobId}`, {
            "headers": {
                "Authorization": `Bearer ${PRODUCER_API_KEY}`,
                "Content-Type": "application/json"
            }
        })
        const jsonResponse = await response.json();
        if(jsonResponse.status === targetStatus){
            return;
        }
        await new Promise((resolve) => {setTimeout(resolve , 1000)})

        if(count === maxWaitSeconds){
            console.error(`job ${jobId} did not reach ${targetStatus} in ${maxWaitSeconds} seconds`);
            process.exit(1)
        }
    }
}