import 'dotenv/config'

const PRODUCER_API_KEY = process.env.PRODUCER_API_KEY;
const brokerUrl = 'http://localhost:3000';
const total = Number(process.argv[2]) || 50000;
const inFlight = 20;

if(!PRODUCER_API_KEY){
    console.error('PRODUCER_API_KEY must be set in .env');
    process.exit(1);
}

let sent = 0;
let accepted = 0; 
let failed = 0;

async function sender(){
    while(sent < total){
        try{
            sent++;
            const response = await fetch(`${brokerUrl}/jobs` , {
                "method" : "POST",
                "headers"  : {
                    "Authorization" : `Bearer ${PRODUCER_API_KEY}`,
                    "Content-Type" : "application/json"
                },
                "body" : JSON.stringify({type : 'bench_io_200' , payload : {}})
            });

            if(response.status === 202) accepted++;
            else failed++;
        }catch(error){
            failed++;
        }
    }
}

console.log(`Fill settings` , {brokerUrl , total , inFlight});
const startedAt = Date.now();

const progressTimer = setInterval(() => {
    console.log(`send : ${sent} , accepted : ${accepted} , failed : ${failed}`);
} , 5000);

const senders = [];
for(let i = 0; i < inFlight; i++) senders.push(sender());

await Promise.all(senders);

clearInterval(progressTimer);

const secs = (Date.now() - startedAt)/1000;
console.log(`Done in ${secs.toFixed(1)}s. Sent : ${sent} , accepted : ${accepted} , failed : ${failed}`);
process.exit(failed === 0 ? 0 : 1);