type Handler = (payload : unknown) => Promise<void>;

const handlers = new Map<string , Handler>();

export function register(type : string , fn : Handler){
    handlers.set(type , fn);
}

export async function executeJob(job : {type : string , payload : unknown}){
    const handler = handlers.get(job.type);

    if(!handler){
        return {
            outcome : 'failed' as const,
            error : {message : `no handler registered for type ${job.type}`},
        }
    }

    try{
        await handler(job.payload);
        return {outcome : 'succeeded' as const}

    }catch(error){
        return {
            outcome : 'failed' as const,
            error : {message : error instanceof Error ? error.message : String(error)}
        }
    }
}