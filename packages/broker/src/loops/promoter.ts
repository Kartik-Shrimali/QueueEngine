import { PROMOTE_INTERVAL_MS } from "@queueengine/shared";
import { promoteDue } from "../core/promote.js";

let running = false;
let timer : NodeJS.Timeout | null = null;

export function startPromoter(){
    timer = setInterval(async () => {
        if(running === true) return;
        running = true;
        try{
            await promoteDue()
        }catch(error){
            console.error(error)
        }finally{
            running = false;
        }
    } , PROMOTE_INTERVAL_MS)
}

export function stopPromoter(){
    if(timer){
        clearInterval(timer);
        timer = null;
    }
}