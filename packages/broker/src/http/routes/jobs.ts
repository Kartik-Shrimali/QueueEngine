import express from "express"
import { requireScope } from "../middleware/auth.js";
import { AppError, DEFAULT_MAX_ATTEMPTS, MAX_PAYLOAD_BYTES, type Priority } from "@queueengine/shared";
import { enqueueJob } from "../../core/enqueue.js";

const typePattern = /^[a-z0-9_.-]+$/;

const jobRouter : express.Router = express.Router();

jobRouter.post('/jobs' , requireScope('producer') , async (req , res) => {
    const {type , payload} = req.body;
    
    let priority : Priority = req.body.priority;
    let maxAttempts = req.body.maxAttempts;
    let runAfter = req.body.runAfter;

    if(typeof type !== 'string' || type.length > 128 || type.length < 1 || !typePattern.test(type)) throw new AppError('validation_failed',"type must be 1-128 chars matching [a-z0-9_.-]+");

    if(payload === undefined) throw new AppError('validation_failed',"Payload is required");

    const payloadSize = Buffer.byteLength(JSON.stringify(payload));

    if(payloadSize > MAX_PAYLOAD_BYTES) throw new AppError('payload_too_large', 'Payload exceeds the maximum limit' , {limit : MAX_PAYLOAD_BYTES , received : payloadSize} );

    if(priority === undefined) priority = "normal";
    const validPriorities = ['critical' , 'high' , 'normal' , 'low'];
    if(!validPriorities.includes(priority)) throw new AppError('validation_failed', 'Priority must be one of critical , high , low , normal');

    if(maxAttempts === undefined) maxAttempts = DEFAULT_MAX_ATTEMPTS;
    if(!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 50) throw new AppError('validation_failed', 'Max attempts should be between 1 and 50');

    if(runAfter === undefined){
        runAfter = new Date();
    }else{
        const parsedDate = new Date(runAfter);
        if(isNaN(parsedDate.getTime())) throw new AppError('validation_failed' , "runAfter must be a valid ISO 8601 timestamp");
        runAfter = parsedDate;

    }

    const response = await enqueueJob({type , payload , priority ,maxAttempts , runAfter});

    res.status(202).json({id : response.id, status : response.status, enqueuedAt : response.enqueuedAt})
})

export {jobRouter}
