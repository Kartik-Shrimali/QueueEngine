import { enqueueJob } from "./core/enqueue.js";
import { clearQueueState, rebuildFromPostgres } from "./core/rebuild.js";
import { decideReclaim, findExpiredJobs, reclaimExpired, reclaimJob } from "./core/reclaim.js";
import { markAttemptAbandoned } from "./store/pg/attempts.js";
import { getLiveJobs, markJobAbandoned, markJobActive, markJobPending } from "./store/pg/jobs.js";
import { redisClient } from "./store/redis/client.js";
import { qeActive } from "./store/redis/keys.js";
import { loadAllScripts } from "./store/redis/scripts/loader.js";

async function main() {
  await redisClient.connect();

  await loadAllScripts();

  const result = await rebuildFromPostgres();

  console.log(result);
  process.exit(0)
}

main();