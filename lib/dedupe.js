import shallowEq from './util/shallow-eq';
const I = (v) => v;
/**
 * Deduplicate elements in a stream using shallow comparison.
 *
 * Usage:
 *
 * ```ts
 * xs
 *  .of([1, 2, 1, 1])
 *  .filter(dedupe())
 * ```
 */
export const dedupe = (fn = I) => {
    // tslint:disable-next-line:no-let
    let memo;
    return (s) => {
        const t = fn(s);
        if (shallowEq(t, memo)) {
            // same a previous value => false
            return false;
        }
        else {
            // new value, remember and => true
            // tslint:disable-next-line:no-expression-statement
            memo = t;
            return true;
        }
    };
};
//# sourceMappingURL=dedupe.js.map