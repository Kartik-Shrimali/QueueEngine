import {createWorker , register} from "@queueengine/worker";

register("send_email" , async (payload) => {
    console.log('Sending email: ', payload);
    await new Promise((resolve) =>  setTimeout(resolve , 200));
    console.log('Email sent');
});

const worker = createWorker({
    brokerUrl : 'http://localhost:3000',
    apiKey : "dev_worker_key_change_me"
});

await worker.start();