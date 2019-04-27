# React FRP

A Functional Reactive Programming architecture with xstream, built for React apps used by Lookback's frontend. Heavily inspired by CycleJS.

## Example

See `example` directory for full code.

```ts
// main.ts
import xs, { Stream } from 'xstream';
import { Drivers, MainSources, MainSinks, setup } from 'frap';

/** Our app state. */
export interface MyState {
    foo: string;
}

/** Messages from the view. */
export type ViewIn = string;

const SomeDriver = (out$: Stream<string>): Stream<number> =>
    out$
        .debug('driverOut')
        .map(s => s.length);

interface MyDrivers extends Drivers {
    someDriver: typeof SomeDriver;
}

/**
 * Our main function. All business logic should happen in/from here. We can build
 * a model, do derived actions, handle view input, etc.
*/
function main(
    sources: MainSources<ViewIn, MyDrivers>
): MainSinks<MyState, MyDrivers> { 
    // Dummy app state stream which updates every second.
    const state$ = xs
        .periodic(1000)
        .map<MyState>(n => ({
            foo: `Hello ${n}!`
        }));

    // Dummy output to our driver
    const driverOut$ = xs
        .of('driver!');

    // Add listeners to consume the view and driver streams

    // Built-in "view" stream:
    sources.view.addListener({ next: (v) => console.log({ view: v })});
    // Drivers:
    sources.someDriver.addListener({ next: (v) => console.log({ meteor: v })});

    return {
        /** Resulting state stream. */
        state: state$,
        /** Output to the drivers. */
        drivers: {
            someDriver: driverOut$,
        },
    };
}

/** Exported function to start the whole app */
export const run = setup(main, {
    meteor: SomeDriver,
});
```

```ts
// app.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { render } from 'react-dom';
import { run, MyState, ViewIn } from './main';
import xs, { Stream } from 'xstream';
import useStream from './use-stream';

export type Send = (event: ViewIn) => void;

/**
 * Context exposed to all components via <StateContext.Consumer>
 */
export interface Context {
    /** Our app state */
    state: MyState;
    /** Function to send messages with */
    send: Send;
}

/** Helper to create a new Context for the <StateContext.Provider> */
export const makeContext = (state: MyState, send?: Send | null): Context => ({
    state,
    send: send || (() => {}), // Pass noop as default Send function
});

const startState: MyState = {
    foo: 'hej!'
}

export const StateContext = React.createContext<Context>(
    makeContext(startState)
);

/** Our top level React component. */
const App = () => {
    const [state$, setState] = useState<Stream<MyState>>(xs.empty());

    // A stream for holding all messages from all view components.
    const viewIn$ = xs.create<ViewIn>();

    const send = useCallback((v: ViewIn) => {
        viewIn$.shamefullySendNext(v);
    }, []);

    useEffect(() => {
        setState(run(viewIn$));
    }, []);
    
    const ourState = useStream(state$, startState);
    const context = makeContext(ourState, send);

    return (
        <StateContext.Provider value={context}>
            {/* State is rendered! */}
            <h1>{context.state.foo}</h1>
            {/* We can send messages into our main function! */}
            <button onClick={() => context.send('hello world')}>Click</button>
        </StateContext.Provider>
    );
};

render(<App />, document.getElementById('app'));
```

## Develop

```bash
npm install
npm run build # Build Typescript into "build"
npm run bundle # Build example bundle into "dist"
open dist/index.html # Test
```
