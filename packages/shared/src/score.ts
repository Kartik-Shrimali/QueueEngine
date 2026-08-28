import { PRIORITY_BOOST_MS } from "./constants.js";
import type { Priority } from "./types.js";

export function computeScore(enqueuedAtMs : number , priority : Priority) : number{
    return enqueuedAtMs - PRIORITY_BOOST_MS[priority];

}