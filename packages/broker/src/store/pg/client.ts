import { Pool } from "pg";
import { config } from "../../config.js";
import type { Priority } from "@queueengine/shared";

export const pool = new Pool({connectionString : config.databaseUrl})

