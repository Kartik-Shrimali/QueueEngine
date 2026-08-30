import express from "express";

const app : express.Express = express();

app.get("/healthz" , (req , res) => {
    res.status(200).json({
        status : "ok"
    })
})

export default app