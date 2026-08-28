import {describe , it , expect} from "vitest";
import { computeScore } from "./score.js";

describe('computeScore' , () => {
    it('critical priority score subtracts 1 hour boost' , () => {
        const randomTimestamp = 100000;
        expect(computeScore(randomTimestamp , "critical")).toBe(randomTimestamp - 3600000);
    })

    it('for same timestamp all priorities should be critical < high < normal < low' , () =>{
        const t = 100000;
        const critical = computeScore(t , 'critical');
        const high = computeScore(t , 'high');
        const normal = computeScore(t , 'normal');
        const low = computeScore(t , 'low');

        expect(critical).toBeLessThan(high);
        expect(high).toBeLessThan(normal);
        expect(normal).toBeLessThan(low);
    })
})