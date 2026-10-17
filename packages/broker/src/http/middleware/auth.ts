import type { NextFunction, Request, Response } from "express";
import { config } from "../../config.js";
import { AppError } from "@queueengine/shared";

export type Scope = 'producer' | 'worker' | 'admin'

const allowedKeys : Record<Scope , string[]> = {
    producer : [config.producerApiKey , config.adminApiKey],
    worker : [config.workerApiKey , config.adminApiKey],
    admin : [config.adminApiKey]
}

const configKeys : Record<Scope , string> = {
    producer : config.producerApiKey,
    worker : config.workerApiKey,
    admin : config.adminApiKey
}

export function requireScope(scope: Scope) {
    return (req: Request, res: Response, next: NextFunction) => {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer')) {
            throw new AppError('unauthorized' , 'Missing or invalid Authorization header')
        }

        const token = header.split(" ")[1];
        
        if(!Object.values(configKeys).includes(token)) throw new AppError('unauthorized' , "Key is not valid")

        if(!allowedKeys[scope].includes(token)){
            throw new AppError('forbidden' , 'Key is valid but does not have the required scope')
        }

        req.callerScope = token === config.adminApiKey ? 'admin' : scope

        next();

    }
}