import { startPromoter, stopPromoter } from "./promoter.js";
import { startReclaimer, stopReclaimer } from "./reclaimer.js";

export function startLoops(){
    startReclaimer();
    startPromoter();
}

export function stopLoops(){
    stopReclaimer();
    stopPromoter();
}