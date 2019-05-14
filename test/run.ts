// tslint:disable no-let
import as from 'assert';
import { test } from 'loltest';
import { run } from '../src';
import xs, { Stream } from 'xstream';
import { Main, Drivers } from '../src/types';
import { streamToPromise } from './_helpers';
import delay from 'xstream/extra/delay';

const assert = as.strict;

interface MyDrivers extends Drivers {
    lol: () => Stream<Partial<State>>;
}

const basicMain: Main<View, State, MyDrivers> = (sources) => {
    const updates$ = sources.view.map((v) => ({ foo: v }));

    return {
        updates$,
        lol: undefined,
    };
};

interface State {
    foo: string;
}

type View = string;

test('View messages pass through Main and update state', async () => {
    const view$ = xs.create<string>();
    const expected: State[] = [{ foo: 'hello' }, { foo: 'world' }];

    const state$: Stream<State> = run(
        basicMain,
        { foo: 'hello' },
        {
            view: view$,
            drivers: {
                lol: (_) => {},
            },
        }
    ).endWhen(view$.compose(delay(100)));

    const p = streamToPromise(state$);

    view$.shamefullySendNext('world');

    const res = await p;

    assert.deepStrictEqual(res, expected);
});

// test('Streams pass through a driver', () => {
//     const view$ = xs.create<string>();
//     const expected: State[] = [{ foo: 'hello' }, { foo: 'world' }];

//     const state$ = run(
//         main,
//         { foo: 'hello' },
//         {
//             view: view$,
//             drivers: {
//                 lol: (out$: Stream<string>) =>
//                     out$.map<Partial<State>>((m) => ({
//                         foo: m,
//                     })),
//             },
//         }
//     );

//     state$.addListener({
//         next: (s) => {
//             assert.deepStrictEqual(s, expected.shift());
//         },
//     });

//     view$.shamefullySendNext('world');
// });
