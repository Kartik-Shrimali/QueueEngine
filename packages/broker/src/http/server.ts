import express from "express";
import { requireScope } from "./middleware/auth.js";

const app : express.Express = express();

app.get("/healthz" , (req , res) => {
    res.status(200).json({
        status : "ok"
    })
})
export default app