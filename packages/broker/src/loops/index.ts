import { startReclaimer, stopReclaimer } from "./reclaimer.js";

export function startLoops(){
    startReclaimer();
}

export function stopLoops(){
    stopReclaimer()
}