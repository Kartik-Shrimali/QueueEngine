import type { NextFunction, Request, Response } from "express";
import { config } from "../../config.js";

type Scope = 'producer' | 'worker' | 'admin'

const allowedKeys : Record<Scope , string[]> = {
    producer : [config.producerApiKey , config.adminApiKey],
    worker : [config.workerApiKey , config.adminApiKey],
    admin : [config.adminApiKey]
}

export function requireScope(scope: Scope) {
    return (req: Request, res: Response, next: NextFunction) => {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer')) {
            res.status(401).json({
                msg: "Unauthorized"
            })
            return;
        }

        const token = header.split(" ")[1];

        if(!allowedKeys[scope].includes(token)){
            res.status(403).json({
                msg : "forbidden"
            })
            return;
        }

        next();

    }
}