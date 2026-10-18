import { SWEEP_INTERVAL_MS } from "@queueengine/shared";
import { sweepOnce } from "../core/sweep.js";

let running = false;
let timer : NodeJS.Timeout | null = null;

export function startSweeper(){
    timer = setInterval(async() => {
        if(running === true)return;
        running = true;

        try{
            await sweepOnce();
        }catch(error){
            console.error(error);
        }finally{
            running = false;
        }
    } , SWEEP_INTERVAL_MS);
}

export function stopSweeper(){
    if(timer){
        clearInterval(timer);
        timer = null;
    }
}