import { createClient } from "redis";
import { config } from "../../config.js";

export const redisClient = createClient({url : config.redisUrl});
