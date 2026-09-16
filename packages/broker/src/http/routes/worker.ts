import express from "express";
import { requireScope } from "../middleware/auth.js";
import { dequeue } from "../../core/dequeue.js";
import { reportResult } from "../../core/report.js";
import { AppError } from "@queueengine/shared";
const workerRouter: express.Router = express.Router();

workerRouter.post('/jobs/dequeue', requireScope('worker'), async (req, res) => {
    const job = await dequeue();
    if (!job) {
        res.status(204).send();
        return;
    }

    res.status(200).send({ jobs: [job] });
})

workerRouter.post("/jobs/:id/result", requireScope('worker'), async (req, res) => {
    const validOutcomes = ['succeeded', 'failed'];
    const jobId = req.params.id as string;
    const outcome = req.body.outcome;

    if (!validOutcomes.includes(outcome)) throw new AppError('validation_failed', 'Outcome should be succeeded or failed');

    const updatedJob = await reportResult(jobId, outcome);
    res.status(200).json(updatedJob);
})

export { workerRouter }