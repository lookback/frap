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
export declare const dedupe: <S, T>(fn?: (s: S) => T) => (s: S) => boolean;
