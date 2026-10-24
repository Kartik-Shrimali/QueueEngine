import {createWorker , register} from "@queueengine/worker";

register("send_email" , async (payload) => {
    console.log('Sending email: ', payload);
    await new Promise((resolve) =>  setTimeout(resolve , 3000));
    console.log('Email sent');
});

register('slow_test' , async(payload) => {
    console.log('Starting slow test' , payload);
    await new Promise((resolve) => setTimeout(resolve , 45000));
    console.log('Slow test finished');
})

register('poison' , async(payload) => {
    console.log(`Poison job is about to kill this worker`);
    process.exit(1);
})

register('flaky_api' , async(payload) =>{
    console.log('flaky_api job');
    const num = Math.random();

    if(num < 0.4) throw new Error('There was some error');
})

register('bench_io_200' , async(payload)=> {
    await new Promise((resolve) => setTimeout(resolve , 200))
})

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