import 'dotenv/config'

const PRODUCER_API_KEY = process.env.PRODUCER_API_KEY;

const correctRes = [];

for(let i = 0; i < 500; i++){
    const response = await fetch('http://localhost:3000/jobs' , {
        "headers" : {
            "Authorization" : `Bearer ${PRODUCER_API_KEY}`,
            "Content-Type" : "application/json"
        },
        "method" : "POST",
        "body" : JSON.stringify({
            "type" : "send_email",
            "payload" : {},
        })
    })

    if(response.status === 202)correctRes.push(response);
}

console.log(correctRes.length);