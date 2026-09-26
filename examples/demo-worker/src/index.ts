import {createWorker , register} from "@queueengine/worker";

register("send_email" , async (payload) => {
    console.log('Sending email: ', payload);
    await new Promise((resolve) =>  setTimeout(resolve , 3000));
    console.log('Email sent');
});

const worker = createWorker({
    brokerUrl : 'http://localhost:3000',
    apiKey : "dev_worker_key_change_me"
});

worker.start();

process.on('SIGTERM' , shuttingDown)
process.on('SIGINT' , shuttingDown)

async function shuttingDown() {
    console.log(`Shutting down..............`);
    console.time('shutdown');
    await worker.stop();
    console.timeEnd('shutdown');
    process.exit(0);
}