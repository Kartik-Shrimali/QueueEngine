import type {Request , Response , NextFunction} from "express";
import { AppError , statusMap } from "@queueengine/shared";

export function errorMapper(err : unknown , req : Request , res : Response , next : NextFunction){
    if(err instanceof AppError){
        const Errstatus = statusMap[err.code];
        res.status(Errstatus).send({
            error : err.code,
            message : err.message,
            details : err.details
        })
    }else{
        res.status(500).send({
            error : "internal_error",
            message : "Something went wrong "
        })
    }
}