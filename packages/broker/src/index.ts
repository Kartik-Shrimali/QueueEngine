import app from "./http/server.js";
import { config } from "./config.js";
import { redisClient } from "./store/redis/client.js";
import { wakeAllForShutdown } from "./core/waiters.js";
import { loadAllScripts } from "./store/redis/scripts/loader.js";
import { startLoops, stopLoops } from "./loops/index.js";
import { rebuildFromPostgres } from "./core/rebuild.js";
import { acquireBrokerLock, releaseBrokerLock, startLockRenewal } from "./singleton.js";

await redisClient.connect();
await loadAllScripts();
const instanceId = await acquireBrokerLock();
const timer = startLockRenewal(instanceId);
const recoveredJobs = await rebuildFromPostgres();
console.log(recoveredJobs);
startLoops();

const listenObject = app.listen(config.port, () => {
    console.log(`Broker listening on port ${config.port}`)
})

process.on('SIGTERM', shutDownAll);
process.on('SIGINT', shutDownAll);

async function shutDownAll() {
    console.log(`SHUTTING DOWN..................`);
    clearInterval(timer);
    stopLoops();
    wakeAllForShutdown();
    await releaseBrokerLock(instanceId);
    listenObject.close(() => { process.exit(0) });
}