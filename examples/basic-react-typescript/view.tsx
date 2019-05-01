import React, { useEffect, useState, useCallback } from 'react';
import { render } from 'react-dom';
import { run, MyState, startState } from './main';
import xs, { Stream } from 'xstream';
import { useStream } from './util';

export interface DidClickButton {
    kind: 'did_click_button';
    didClick: boolean;
}

export interface FetchUserAgent {
    kind: 'fetch_user_agent';
}

/** Types of messages the view can send. */
export type ViewIn = DidClickButton | FetchUserAgent;

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
    
    // 'ourState' now includes our whole app state as a plain object
    const ourState = useStream(state$, startState);
    // …use that to create our React context
    const context = makeContext(ourState, send);

    return (
        <StateContext.Provider value={context}>
            <p>
                <button
                    onClick={() => context.send({
                        kind: 'did_click_button',
                        didClick: true,
                    } as DidClickButton)}>
                        'Click this button'
                    </button>
            </p>

            <p>
                <button 
                    disabled={!!context.state.userAgent}
                    onClick={() => context.send({
                        kind: 'fetch_user_agent',
                    } as FetchUserAgent)}>
                    Fetch browser user agent
                </button>
            </p>

            <h4>Our current state:</h4>
            <pre>{JSON.stringify(context.state, null, 4)}</pre>
        </StateContext.Provider>
    );
};

render(<App />, document.getElementById('app'));
