import { enqueueJob } from "./core/enqueue.js";
import { decideReclaim, findExpiredJobs } from "./core/reclaim.js";
import { markAttemptAbandoned } from "./store/pg/attempts.js";
import { markJobAbandoned, markJobActive, markJobPending } from "./store/pg/jobs.js";
import { redisClient } from "./store/redis/client.js";
import { qeActive } from "./store/redis/keys.js";

async function main() {
  const result = await markAttemptAbandoned("f3f82963-153b-4e6b-9360-257ea5d98ca9");
  console.log(result)
  process.exit(0)
}

main();