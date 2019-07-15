"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shallow_eq_1 = __importDefault(require("./util/shallow-eq"));
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
exports.dedupe = (fn = I) => {
    // tslint:disable-next-line:no-let
    let memo;
    return (s) => {
        const t = fn(s);
        if (shallow_eq_1.default(t, memo)) {
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