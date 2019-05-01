import { useEffect, useState } from 'react';
import { Stream } from 'xstream';

export const isKind = <T>(kind: string) =>
    (t: any): t is T => t.kind === kind;

/**
 * Hook for using xstream streams in React components.
 * 
 * Usage:
 * ```ts
 * const theString = useStream<string>(someStringStream$, 'start');
 * console.log(theString); // logs values for someStringStream$
 ```
*/
export const useStream = <T>(stream$: Stream<T>, initialState: T) => {
    const [current, setCurrent] = useState<T>(initialState);

    useEffect(() => {
        const sub = stream$.subscribe({
            next: setCurrent,
        });

        return () => sub.unsubscribe();
    });

    return current;
};
