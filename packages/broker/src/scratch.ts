import { enqueueJob } from "./core/enqueue.js";
import { redisClient } from "./store/redis/client.js";

async function main() {
  await redisClient.connect();

  const id = await enqueueJob({
    type: "test_job",
    payload: { hello: "world" },
    priority: "critical",
    maxAttempts: 5,
    runAfter: new Date(), // now — should go to qe:ready
  });

  console.log("Enqueued job id:", id);

  process.exit(0);
}

main();