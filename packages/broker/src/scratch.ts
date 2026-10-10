import { enqueueJob } from "./core/enqueue.js";
import { decideReclaim, findExpiredJobs, reclaimExpired, reclaimJob } from "./core/reclaim.js";
import { markAttemptAbandoned } from "./store/pg/attempts.js";
import { markJobAbandoned, markJobActive, markJobPending } from "./store/pg/jobs.js";
import { redisClient } from "./store/redis/client.js";
import { qeActive } from "./store/redis/keys.js";
import { loadAllScripts } from "./store/redis/scripts/loader.js";

async function main() {
  await redisClient.connect();

  await loadAllScripts();

  const result = await reclaimExpired ();

  console.log(result);
  process.exit(0)
}

main();