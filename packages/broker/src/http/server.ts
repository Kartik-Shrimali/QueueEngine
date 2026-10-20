    import express from "express";
    import { requireScope } from "./middleware/auth.js";
    import { errorMapper } from "./middleware/errors.js";
    import { AppError } from "@queueengine/shared";
    import { jobRouter } from "./routes/jobs.js";
    import { workerRouter } from "./routes/worker.js";
    import { adminRouter } from "./routes/admin.js";
    import { redisClient } from "../store/redis/client.js";
    import { pool } from "../store/pg/client.js";
    import { isBrokerLockHeld } from "../singleton.js";

    const app : express.Express = express();
    app.use(express.json({limit : '300kb'}));

    app.get("/healthz" , (req , res) => {
        res.status(200).json({
            status : "ok"
        })
    })

    app.get('/readyz', async (req, res) => {
        let result1 = false;
        let result2 = false;
        let result3 = false;
        try {
            await redisClient.ping();
            result1 = true;
        } catch (error: any) {
            console.error('Some error with redis.Error : ', error.message)
        }

        try {
            await pool.query(`SELECT 1`)
            result2 = true;
        } catch (error: any) {
            console.error(`Some error in postgres.Error: `, error.message);
        }

        try {
            result3 = await isBrokerLockHeld();

        } catch (error: any) {
            console.error(`Some error in broker lock.Error: `, error.message);
        }

        if (result1 === true && result2 === true && result3 === true) {
            res.status(200).json({
                ready: true,
                checks: { redis: result1, postgres: result2, lock: result3 }
            })
        } else {
            res.status(503).json({
                ready: false,
                checks: { redis: result1, postgres: result2, lock: result3 }
            })
        }

    })

    app.use(jobRouter);
    app.use(workerRouter);
    app.use(adminRouter);
    app.use(errorMapper);

    export default app