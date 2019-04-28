import xs, { Stream } from 'xstream';
import { Drivers, MainSources, MainSinks, setup } from '../../src/run';
import delay from 'xstream/extra/delay';

import { ViewIn, DidClickButton, FetchUserAgent } from './view';
import { isKind } from './util';
import { BrowserDriver } from './BrowserDriver';

/** Types for all the app state in our system. */
export interface MyState {
    hasClickedButton: boolean;
    greeting?: string;
    userAgent?: string;
}

export const startState: MyState = {
    hasClickedButton: false,
};

/** Definitions for all the drivers used. */
interface MyDrivers extends Drivers {
    browser: typeof BrowserDriver;
}

/** Creates the model of our app. Takes a start state and returns
 * a stream of the resulting state from incremental updates.
 */
const makeModel = (sources: MainSources<ViewIn, MyDrivers>, startState: MyState) => {
    // incremental updates to the main app state. cycled back via imitate so
    // we also can use the state to derive updates.
    const stateUpdate$ = xs.create<Partial<MyState>>();
    // folded app state from the incremental updates
    const state$ = stateUpdate$
        .fold((prev, update) => ({ ...prev, ...update }), startState)
        .debug('state');

    // Capture this kind of message from the view and map directly to
    // an update of our app state.
    const didClick$ = sources.view
        .filter(isKind<DidClickButton>('did_click_button'))
        .map<Partial<MyState>>(msg => ({
            hasClickedButton: msg.didClick,
        }));

    // Receive input from the browser driver and map to a state update.
    const browserDriverUpdates$ = sources.browser.map<Partial<MyState>>(userAgent => ({
        userAgent,
    }));

    const fromDriver$ = xs.merge(browserDriverUpdates$);
    const fromView$ = xs.merge(didClick$);

    // A periodic update of a property in our state.
    const greetingStateUpdate$ = xs
        .periodic(1000)
        .map<Partial<MyState>>(n => ({
            greeting: `Hello ${n}!`,
        }));

    // Finally, merge incremental state updates
    const realStateUpdate$: Stream<Partial<MyState>> = xs
        .merge(greetingStateUpdate$, fromView$, fromDriver$)
        .debug('update')
        .compose(delay(1));

    // tslint:disable-next-line
    stateUpdate$.imitate(realStateUpdate$);

    return state$;
};

const main = (
    sources: MainSources<ViewIn, MyDrivers>
): MainSinks<MyState, MyDrivers> => {
    // Create a model from input sources and a start state
    const state$ = makeModel(sources, startState);

    // Filter on these messages from our view and provide them directly as
    // output to our browser driver.
    const browserOut$ = sources.view
        .filter(isKind<FetchUserAgent>('fetch_user_agent'));

    return {
        // the app state stream
        state: state$,
        // output instructions to drivers
        browser: browserOut$,
    };
};

// This function kicks everything off!
export const run = setup(main, {
    browser: BrowserDriver,
});
