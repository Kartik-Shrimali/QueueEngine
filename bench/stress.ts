import 'dotenv/config';
import { execSync } from 'node:child_process';

const PRODUCER_API_KEY = process.env.PRODUCER_API_KEY;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const brokerUrl = 'http://localhost:3000';
const rate = 30;
const pollInterval = 10000;
const duration = Number(process.argv[2]) || 600;

if (!PRODUCER_API_KEY || !ADMIN_API_KEY) {
    console.error('PRODUCER_API_KEY and ADMIN_API_KEY must be set in .env');
    process.exit(1);
}

console.log('Stress settings', { brokerUrl, rate, pollInterval, duration });

const counters = {
    sent : 0,
    accepted : 0,
    enqueueFailed : 0,
    polls : 0,
    pollFailed : 0,
    violations : 0
};

async function sendOne(){
    counters.sent++;
    try{
        const response = await fetch(`${brokerUrl}/jobs` , {
            "method" : "POST",
            "headers" : {
                "Authorization" : `Bearer ${PRODUCER_API_KEY}`,
                "Content-Type" : 'application/json'
            },
            "body" : JSON.stringify({type : 'bench_io_200' , payload : {}}),
        });

        if(response.status === 202) counters.accepted++;
        else counters.enqueueFailed++;
    }catch(error){
        counters.enqueueFailed++;
    }
}

async function pollInvariants(){
    counters.polls++;
    try{
        const response = await fetch(`${brokerUrl}/admin/invariants` , {
            "headers" : {
                "Authorization" : `Bearer ${ADMIN_API_KEY}`
            }
        });

        const body : any  = await response.json();

        if(!body.ok){
            counters.violations++;
            console.error(`INVARIANT VIOLATION` , JSON.stringify(body.checks))
        }
    }catch(error){
        counters.pollFailed++;
    }
}

const startedAt = Date.now();
const endAt = startedAt + duration*1000;

const enqueueTimer = setInterval(() => {
    for(let i = 0; i < rate/10; i++){
        void sendOne()
    }
} , 100);

const pollTimer = setInterval(() => void pollInvariants() , pollInterval)

const progressTimer = setInterval(() => {
    const secs = Math.round((Date.now() - startedAt) / 1000);
    console.log(`t=${secs}s` , counters)
} , 5000);

await new Promise((resolve) => {setTimeout(resolve , endAt - Date.now())});

clearInterval(enqueueTimer)
clearInterval(pollTimer)
clearInterval(progressTimer)
console.log(`Stooped sending.Final sending counters: ` , counters)

function psql(sql : string) : string{
    return execSync(
        `docker exec queueengine-postgres-1 psql -U user -d postgres -t -A -c "${sql}"`
    ).toString().trim();
}

const drainTimeoutMs = 5 * 60 * 1000;
const drainStart = Date.now();
let drained = false;

while(Date.now() - drainStart < drainTimeoutMs){
    const left = Number(psql("SELECT count(*) FROM jobs WHERE type = 'bench_io_200' AND status IN ('pending' , 'active')"));
    console.log(`Waiting for drain , jobs left : ${left}`);
    if(left === 0){
        drained = true;
        break;
    }
    await new Promise((resolve) => setTimeout(resolve , 5000));
}

await pollInvariants();

console.log('bench_io_200 jobs by status (all runs so far):');
console.log(psql("SELECT status, count(*) FROM jobs WHERE type = 'bench_io_200' GROUP BY status"));

const pass = drained && counters.violations === 0 && counters.enqueueFailed === 0 && counters.pollFailed === 0;
console.log('Final counters:', counters);
console.log(pass ? 'RESULT: PASS' : 'RESULT: FAIL', { drained });
process.exit(pass ? 0 : 1);