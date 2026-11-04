import express from "express";
import { requireScope } from "../middleware/auth.js";
import { getSnapshot } from "../../events/stats.js";

const dashboardRouter : express.Router = express.Router();

dashboardRouter.get('/stats' , requireScope('admin') , (req , res) => {
    const snapshot = getSnapshot();

    return res.status(200).json(snapshot);
})

export {dashboardRouter}