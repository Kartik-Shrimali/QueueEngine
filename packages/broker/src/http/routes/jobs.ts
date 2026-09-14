import express from "express"
import { requireScope } from "../middleware/auth.js";
import { AppError, DEFAULT_MAX_ATTEMPTS, MAX_PAYLOAD_BYTES, type Priority } from "@queueengine/shared";
import { enqueueJob } from "../../core/enqueue.js";
import { getJobById } from "../../store/pg/jobs.js";

const typePattern = /^[a-z0-9_.-]+$/;

const jobRouter : express.Router = express.Router();

jobRouter.post('/jobs' , requireScope('producer') , async (req , res) => {
    const {type , payload} = req.body;
    let priority : Priority = req.body.priority;
    let maxAttempts = req.body.maxAttempts;
    let runAfter = req.body.runAfter;
    
    // --- validate type: required, 1-128 chars, [a-z0-9_.-]+
    if(typeof type !== 'string' || type.length > 128 || type.length < 1 || !typePattern.test(type)) throw new AppError('validation_failed',"type must be 1-128 chars matching [a-z0-9_.-]+");

    // --- validate payload: required, ≤ MAX_PAYLOAD_BYTES
    if(payload === undefined) throw new AppError('validation_failed',"Payload is required");
    const payloadSize = Buffer.byteLength(JSON.stringify(payload));
    if(payloadSize > MAX_PAYLOAD_BYTES) throw new AppError('payload_too_large', 'Payload exceeds the maximum limit' , {limit : MAX_PAYLOAD_BYTES , received : payloadSize} );

    // --- validate priority: default to 'normal', must be one of the 4 valid values
    if(priority === undefined) priority = "normal";
    const validPriorities = ['critical' , 'high' , 'normal' , 'low'];
    if(!validPriorities.includes(priority)) throw new AppError('validation_failed', 'Priority must be one of critical , high , low , normal');

    // --- validate maxAttempts: default to DEFAULT_MAX_ATTEMPTS, must be integer 1-50
    if(maxAttempts === undefined) maxAttempts = DEFAULT_MAX_ATTEMPTS;
    if(!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 50) throw new AppError('validation_failed', 'Max attempts should be between 1 and 50');

    // --- validate runAfter: default to now, must parse as a valid date
    if(runAfter === undefined){
        runAfter = new Date();
    }else{
        const parsedDate = new Date(runAfter);
        if(isNaN(parsedDate.getTime())) throw new AppError('validation_failed' , "runAfter must be a valid ISO 8601 timestamp");
        runAfter = parsedDate;

    }

    // --- all validated — enqueue and respond
    const response = await enqueueJob({type , payload , priority ,maxAttempts , runAfter});
    res.status(202).json({id : response.id, status : response.status, enqueuedAt : response.enqueuedAt})
})

jobRouter.get('/jobs/:id' , requireScope('producer') , async (req , res) => {
    const id = req.params.id as string
    const job = await getJobById(id);

    if(!job) throw new AppError('not_found' , "No job with that id")

    const response : any = {
        id : job.id,
        type : job.type,
        status : job.status,
        priority : job.priority,
        attempts : job.attempts,
        maxAttempts : job.max_attempts,
        runAfter : job.run_after,
        deadReason : job.dead_reason,
        replayedFrom : job.replayed_from,
        enqueuedAt : job.enqueued_at,
        firstStartedAt : job.first_started_at,
        finishedAt : job.finished_at
    }
    
    if(req.callerScope === 'admin' && req.query.includePayload === 'true'){
        response.payload = job.payload
    }
    res.status(200).json(response);
})

export {jobRouter}
