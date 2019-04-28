import xs, { Stream } from 'xstream';
import { Drivers, MainSources, MainSinks, setup } from '../src/run';

export interface MyState {
    foo: string;
}

export type ViewIn = string;

const MeteorDriver = (out$: Stream<string>): Stream<number> => {
    return out$.debug('meteorOut').map(s => s.length);
};

interface MyDrivers extends Drivers {
    meteor: typeof MeteorDriver;
}

function main(
    sources: MainSources<ViewIn, MyDrivers>
): MainSinks<MyState, MyDrivers> {
    const state$ = xs
        .periodic(1000)
        .map<MyState>(n => ({
            foo: `Hello ${n}!`,
        }));

    const meteorOut$ = xs.of('meteor!');

    sources.view.addListener({ next: (v) => console.log({ view: v })});
    sources.meteor.addListener({ next: (v) => console.log({ meteor: v })});

    return {
        // the app state stream
        state: state$,
        // output instructions to drivers
        meteor: meteorOut$,
    };
}

export const run = setup(main, {
    meteor: MeteorDriver,
});
