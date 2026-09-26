import app from "./http/server.js";
import { config } from "./config.js";
import { redisClient } from "./store/redis/client.js";
import { wakeAllForShutdown } from "./core/waiters.js";

await redisClient.connect();

const listenObject = app.listen(config.port , () => {
    console.log(`Broker listening on port ${config.port}`)
})

process.on('SIGTERM' , shutDownAll);
process.on('SIGINT' , shutDownAll);

function shutDownAll(){
    console.log(`SHUTTING DOWN..................`);
    wakeAllForShutdown();
    listenObject.close(() => {process.exit(0)});
}