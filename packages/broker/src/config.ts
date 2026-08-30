import 'dotenv/config';

function requireEnv(name:string) : string{
    const value = process.env[name];
    if(!value){
        console.error(`Missing required environment variable : ${name}`);
        process.exit(1);
    }
    return value;
}

function optionalEnv(name : string, defaultValue : string) : string{
    return process.env[name] ?? defaultValue;
}

export const config = {
    databaseUrl : requireEnv('DATABASE_URL'),
    redisUrl : requireEnv('REDIS_URL'),
    producerApiKey : requireEnv('PRODUCER_API_KEY'),
    workerApiKey : requireEnv('WORKER_API_KEY'),
    adminApiKey : requireEnv('ADMIN_API_KEY'),
    port : optionalEnv('PORT' , '3000')
} as const;
