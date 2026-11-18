import {createClient} from "../packages/sdk/dist/index.js";

const client = createClient({brokerUrl : 'http://localhost:3000' , apiKey : "dev_producer_key_change_me"});

const result = await client.enqueue('send_email' , {to : "a@b.com"})

console.log(result);