import { startPromoter, stopPromoter } from "./promoter.js";
import { startReclaimer, stopReclaimer } from "./reclaimer.js";
import { startSweeper, stopSweeper } from "./sweeper.js";

export function startLoops(){
    startReclaimer();
    startPromoter();
    startSweeper();
}

export function stopLoops(){
    stopReclaimer();
    stopPromoter();
    stopSweeper();
}