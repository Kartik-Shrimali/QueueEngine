import express from "express";
import { requireScope } from "./middleware/auth.js";
import { errorMapper } from "./middleware/errors.js";
import { AppError } from "@queueengine/shared";

const app : express.Express = express();


app.get("/healthz" , (req , res) => {
    res.status(200).json({
        status : "ok"
    })
})

app.use(errorMapper);

export default app