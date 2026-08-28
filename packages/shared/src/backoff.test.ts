import {describe , it , expect} from "vitest";
import { computeBackoff } from "./backoff.js";
import { MAX_DELAY_MS } from "./constants.js";

describe('computeBackoff' , () => {
    it('first attempt backoff should be between 1-2 seconds' , () => {
        const delay = computeBackoff(1);
        expect(delay).toBeGreaterThanOrEqual(1000);
        expect(delay).toBeLessThan(2000);
    })

    it('check max delay is not more than MAX_DELAY_MS' , () => {
        const delay = computeBackoff(20);
        expect(delay).toBeLessThanOrEqual(MAX_DELAY_MS);
    })

    it('check if delay timeperiod increases with attempts' , () => {
        const delayInitial = computeBackoff(1);
        const delayLater = computeBackoff(5);
        expect(delayInitial).toBeLessThan(delayLater);
    })
})