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

/** Our 'send' function signature. */
type Send = (event: ViewIn) => void;

const App = () => {
    const [state$, setState] = useState<Stream<MyState>>(xs.empty());

    const viewIn$ = xs.create<ViewIn>();

    // Create our actual 'send' function which drives the viewIn$
    // stream, which goes into `main`.
    const send: Send = useCallback((v: ViewIn) => {
        viewIn$.shamefullySendNext(v);
    }, []);

    useEffect(() => {
        // After mounting, kick the whole app off 🎉
        const state$ = run(viewIn$, { debug: true });
        setState(state$);
    }, []);
    
    // 'state' now includes our whole app state as a plain object
    const state = useStream(state$, startState);

    return (
        <div>
            <p>
                <button
                    onClick={() => send({
                        kind: 'did_click_button',
                        didClick: true,
                    } as DidClickButton)}>
                        Click this button
                    </button>
            </p>

            <p>
                <button 
                    disabled={!!state.userAgent}
                    onClick={() => send({
                        kind: 'fetch_user_agent',
                    } as FetchUserAgent)}>
                    Fetch browser user agent
                </button>
            </p>

            <h4>Our current state:</h4>
            <pre>{JSON.stringify(state, null, 4)}</pre>
        </div>
    );
};

render(<App />, document.getElementById('app'));
