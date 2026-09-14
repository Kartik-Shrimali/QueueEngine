import app from "./http/server.js";
import { config } from "./config.js";
import { redisClient } from "./store/redis/client.js";

await redisClient.connect();

app.listen(config.port , () => {
    console.log(`Broker listening on port ${config.port}`)
})