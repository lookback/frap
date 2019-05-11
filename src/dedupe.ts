import shallowEq from './lib/shallow-eq';

const I = <T>(v: T) => v;

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
export const dedupe = <S, T>(fn: (s: S) => T = I): ((s: S) => boolean) => {
    // tslint:disable-next-line:no-let
    let memo: T;
    return (s: S) => {
        const t = fn(s);
        if (shallowEq(t, memo)) {
            // same a previous value => false
            return false;
        } else {
            // new value, remember and => true
            // tslint:disable-next-line:no-expression-statement
            memo = t;
            return true;
        }
    };
};
