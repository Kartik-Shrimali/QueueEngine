import { enqueueJob } from "./core/enqueue.js";
import { decideReclaim, findExpiredJobs } from "./core/reclaim.js";
import { markJobActive, markJobPending } from "./store/pg/jobs.js";
import { redisClient } from "./store/redis/client.js";
import { qeActive } from "./store/redis/keys.js";

async function main() {
  const result = await markJobPending("d1cb81af-1cb5-4284-a999-3368eb4145e7");
  console.log(result)
  process.exit(0)
}

main();