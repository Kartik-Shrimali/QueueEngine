import { enqueueJob } from "./core/enqueue.js";
import { clearQueueState, rebuildFromPostgres } from "./core/rebuild.js";
import { decideReclaim, findExpiredJobs, reclaimExpired, reclaimJob } from "./core/reclaim.js";
import { sweepOnce } from "./core/sweep.js";
import { acquireBrokerLock, renewBrokerLock, startLockRenewal } from "./singleton.js";
import { markAttemptAbandoned } from "./store/pg/attempts.js";
import { getLiveJobs, getStalePendingJobs, markJobAbandoned, markJobActive, markJobPending } from "./store/pg/jobs.js";
import { redisClient } from "./store/redis/client.js";
import { qeActive } from "./store/redis/keys.js";
import { loadAllScripts } from "./store/redis/scripts/loader.js";

async function main() {
  await redisClient.connect();

  await loadAllScripts();

  const id = await acquireBrokerLock();

  const result = await startLockRenewal(id);

  console.log(result);
}

main();