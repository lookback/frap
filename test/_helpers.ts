// tslint:disable no-let
import as from 'assert';
import { Stream } from 'xstream';

const assert = as.strict;

export const assertStream = <T>(
    stream$: Stream<T>,
    each: (t: T) => void,
    plannedItems?: number
) => {
    let count = 0;

    stream$.addListener({
        next: (t) => {
            each(t);
            count++;
        },
        complete: () => {
            if (typeof plannedItems !== 'undefined') {
                assert.deepStrictEqual(
                    count,
                    plannedItems,
                    // tslint:disable-next-line max-line-length
                    `Stream didn't received planned # of events (${count}, planned for ${plannedItems})`
                );
            }
        },
    });

    return stream$;
};

export const streamToPromise = <T>(s: Stream<T>): Promise<T[]> => {
    const ret: T[] = [];

    return new Promise((resolve, reject) => {
        s.addListener({
            next: (x) => ret.push(x),
            error: reject,
            complete: () => resolve(ret),
        });
    });
};
