import { enqueueJob } from "./core/enqueue.js";
import { decideReclaim, findExpiredJobs } from "./core/reclaim.js";
import { markJobAbandoned, markJobActive, markJobPending } from "./store/pg/jobs.js";
import { redisClient } from "./store/redis/client.js";
import { qeActive } from "./store/redis/keys.js";

async function main() {
  const result = await markJobAbandoned("c5bf4396-9ae5-4e77-8d21-7669d3423721");
  console.log(result)
  process.exit(0)
}

main();