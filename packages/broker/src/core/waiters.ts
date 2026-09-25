interface Waiter{
    id : string,
    resolve : () => void;
}

const waiters : Waiter[] = [];

export function parkWaiter(timeoutMs : number) : Promise<boolean>{
    return new Promise((resolve) => {
        const id = crypto.randomUUID();

        const timer =  setTimeout(() => {
            removeWaiter(id);
            resolve(false); //false -> timed out, nothing to check
        } , timeoutMs);

        waiters.push({
            id,
            resolve: () =>{
                clearTimeout(timer);
                resolve(true); //true -> wake up and go check for job
            }
        })
    })
}

function removeWaiter(id : string){
    const index = waiters.findIndex((w) => w.id === id);
    if(index!== -1) waiters.splice(index , 1);
}

export function wakeOne() : boolean{
    const waiter = waiters.shift();
    if(!waiter) return false;

    waiter.resolve();
    return true;
}