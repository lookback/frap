import { useEffect, useState } from 'react';
import { Stream } from 'xstream';

const useStream = <T>(stream$: Stream<T>, initialState: T) => {
    const [current, setCurrent] = useState<T>(initialState);

    useEffect(() => {
        const sub = stream$.subscribe({
            next: setCurrent,
        });

        return () => sub.unsubscribe();
    });

    return current;
};

export default useStream;
