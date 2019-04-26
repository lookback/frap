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
    foo: 'hej!',
};

export const StateContext = React.createContext<Context>(
    makeContext(startState)
);

const App = () => {
    const [state$, setState] = useState<Stream<MyState>>(xs.empty());

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
            <h1>{context.state.foo}</h1>
            <button onClick={() => context.send('hello world')}>Click</button>
        </StateContext.Provider>
    );
};

render(<App />, document.getElementById('app'));
