import type { Scope } from "../http/middleware/auth.ts";

declare global{
    namespace Express{
        interface Request{
            callerScope? : Scope;
        }
    }
}
export {};