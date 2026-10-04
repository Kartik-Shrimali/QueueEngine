import express from "express";
import { requireScope } from "../middleware/auth.js";
import { dequeue } from "../../core/dequeue.js";
import { reportResult } from "../../core/report.js";
import { AppError, LONG_POLL_TIMEOUT_MS } from "@queueengine/shared";
import { parkWaiter } from "../../core/waiters.js";
import { heartbeat } from "../../core/heartbeat.js";
const workerRouter: express.Router = express.Router();

workerRouter.post('/jobs/dequeue', requireScope('worker'), async (req, res) => {
    const count = Math.min(Math.max(req.body.count ?? 1 , 1) , 50);
    const {workerId , types} = req.body;

    if(!workerId || typeof workerId !== 'string'){
        throw new AppError('validation_failed' , "workerId should be present")
    }

    let jobs = await dequeue(workerId,count ,types);


    if(jobs.length === 0){
        const gotSomething = await parkWaiter(LONG_POLL_TIMEOUT_MS);
        if(gotSomething) jobs = await dequeue(workerId , count , types);
    }

    if (jobs.length === 0) {
        res.status(204).send();
        return;
    }

    res.status(200).send({ jobs });
})

workerRouter.post("/jobs/:id/result", requireScope('worker'), async (req, res) => {
    const validOutcomes = ['succeeded', 'failed'];
    const jobId = req.params.id as string;
    const outcome = req.body.outcome;
    const leaseToken = req.body.leaseToken;

    if(!leaseToken || typeof leaseToken !== 'string') throw new AppError('validation_failed' , "Lease token should be present and should be string")

    if (!validOutcomes.includes(outcome)) throw new AppError('validation_failed', 'Outcome should be succeeded or failed');

    const updatedJob = await reportResult(jobId,leaseToken, outcome);
    res.status(200).json(updatedJob);
})

workerRouter.post('/jobs/heartbeat' , requireScope('worker') , async (req , res) => {
    const {workerId , leases} = req.body;

    if(!workerId || typeof workerId !== 'string') throw new AppError('validation_failed' , "workerId should be present");

    if(!Array.isArray(leases)) throw new AppError('validation_failed' , "Leases should be present");

    for(const lease of leases){
        if(lease === null || !lease.jobId || !lease.leaseToken || typeof lease.jobId !== 'string' || typeof lease.leaseToken !== 'string') throw new AppError('validation_failed' , "Incorrect values in leases");
    }

    const result = await heartbeat(workerId , leases);

    res.status(200).json(result);
})

export { workerRouter }