import { BASE_MS, MAX_DELAY_MS } from "./constants.js";

export function computeBackoff(attempts : number) : number{
    return Math.min(BASE_MS * 2**(attempts-1) + (Math.random() * BASE_MS) , MAX_DELAY_MS) 
}