import 'dotenv/config'
import { execSync , spawn } from 'node:child_process';

const PRODUCER_API_KEY = process.env.PRODUCER_API_KEY;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if(!PRODUCER_API_KEY || !ADMIN_API_KEY){
    console.error(`Producer & Admin key must be provided`);
    process.exit(1);
}

const brokerUrl = 'http://localhost:3000'
const totalJobs = 500;

function psql(sql : string) : string {
    return execSync(
        `docker exec queueengine-postgres-1 psql -U user -d postgres -t -A -c "${sql}"`
    ).toString().trim();
}

function startBroker(){
    const broker = spawn('node packages/broker/dist/index.js' , {stdio : "inherit" , shell : true});
    return broker;
}

async function waitForBroker(){
    for(let i = 0; i < 30; i++){
        try{
            const response = await fetch(`${brokerUrl}/readyz`)
            if(response.status === 200) return;
        }catch(error : any){

        }

        await new Promise((resolve) => {setTimeout(resolve , 1000)});
    }
    console.error(`Broker did not become ready within 30 seconds`)
    process.exit(1);
}

function startWorker(){
    const worker = spawn(`pnpm --filter demo-worker dev` , {stdio : "inherit" , shell : true});
    return worker;
}

async function enqueueJobs(){
    let correctResponse = 0
    for(let i = 0; i < totalJobs; i++){
        const response = await fetch(`${brokerUrl}/jobs` , {
            "headers" : {
                "Authorization" : `Bearer ${PRODUCER_API_KEY}`,
                "Content-Type" : "application/json"
            },
            "body" : JSON.stringify({
                type : "bench_io_200",
                payload : {}
            }),
            "method" : "POST"
        })

        if(response.status === 202) correctResponse++;
    }

    if(correctResponse !== totalJobs){
        console.error(`There was some error in enqueueing the jobs`);
        process.exit(1);
    }

    console.log(`Enqueued ${correctResponse} jobs`)
}


const broker = startBroker();
console.log('started the broker.Now trying to see if broker is ready');

await waitForBroker();
console.log('Broker is ready');

const worker = startWorker();
console.log('Started a worker.Now sending Jobs');

const runStart = new Date().toISOString();
await enqueueJobs()

await new Promise((resolve) => {setTimeout(resolve , 3000)})

const psqlResult = psql(`SELECT status, count(*) FROM jobs WHERE type = 'bench_io_200' AND enqueued_at > '${runStart}' GROUP BY status`);
console.log(psqlResult);

execSync(`docker exec queueengine-redis-1 redis-cli FLUSHALL`);
console.log('Redis was wiped clean');

execSync(`taskkill /F /T /PID ${broker.pid}`);
console.log('Broker was killed')

const broker2 = startBroker();
console.log(`Broker was restarted`);

await waitForBroker()
console.log(`Broker is ready again`);

let drained = false;
const drainStart = Date.now();
const drainTimeoutMs = 5 * 60 * 1000;

while(Date.now() - drainStart < drainTimeoutMs){
    const count = psql(`SELECT count(*) FROM jobs WHERE type = 'bench_io_200' AND enqueued_at > '${runStart}' AND status IN ('pending' , 'active')`);

    if(count === "0"){
        drained = true;
        break;
    }
    console.log(`Jobs remaining : ${count}`);

    await new Promise((resolve) => {setTimeout(resolve , 5000)})
}

console.log(psql(`SELECT status, count(*) FROM jobs WHERE type = 'bench_io_200' AND enqueued_at > '${runStart}' GROUP BY status`));

const terminal = psql(`SELECT count(*) FROM jobs WHERE type = 'bench_io_200' AND enqueued_at > '${runStart}' AND status IN ('completed' , 'dead')`);

console.log(`Terminal Jobs : ${terminal} of ${totalJobs}`);

const response = await fetch(`${brokerUrl}/admin/invariants` , {
    "headers" : {
        "Authorization" : `Bearer ${ADMIN_API_KEY}`,
        "Content-Type" : "application/json"
    }
})

const body : any = await response.json();

const invariantsOk = body.ok;

console.log(`Invariants Ok: ${invariantsOk}`);

//killing the worker and broker
execSync(`taskkill /F /T /PID ${broker2.pid}`)
execSync(`taskkill /F /T /PID ${worker.pid}`);
console.log(`Worker and broker killed`);

const pass = drained && Number(terminal) === totalJobs && invariantsOk;
console.log(pass ? 'RESULT: PASS' : "RESULT: FAIL");
process.exit(pass ? 0 : 1);