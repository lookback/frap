import xs, { Stream } from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import { Drivers, MainSources, MainSinks, setup } from 'frap';
import { dedupe } from 'frap/lib/dedupe';

import { ViewIn, DidClickButton, FetchUserAgent } from './app';
import { isKind } from './util';
import { BrowserDriver } from './BrowserDriver';

/** Types for all the app state in our system. */
export interface MyState {
    toggledButton: 'on' | 'off';
    greeting?: string;
    userAgent?: string;
    usingMac?: boolean;
}

export const startState: MyState = {
    toggledButton: 'off',
};

/** Definitions for all the drivers used. */
interface MyDrivers extends Drivers {
    browser: typeof BrowserDriver;
}

const isUsingMac = (userAgent: string): boolean =>
    userAgent.search(/mac/i) !== -1;

/** Creates the model of our app. Takes a start state and returns
 * a stream of the resulting state from incremental updates.
 */
const makeModel = (sources: MainSources<MyState, ViewIn, MyDrivers>) => {
    // Capture this kind of message from the view and map directly to
    // an update of our app state.
    const didClick$ = sources.view
        .filter(isKind<DidClickButton>('did_click_button'))
        .compose(sampleCombine(sources.state))
        .map<Partial<MyState>>(([msg, state]) => ({
            toggledButton: state.toggledButton === 'on' ? 'off' : 'on',
        }));

    // Receive input from the browser driver and map to a state update.
    const browserDriverUpdates$ = sources.browser.map<Partial<MyState>>(
        (userAgent) => ({
            userAgent,
        })
    );

    // Use the incoming state stream to derive a new state (`isUsingMac`):
    const derived$: Stream<Partial<MyState>> = sources.state
        .map((s) => s.userAgent)
        .filter(dedupe())
        .filter((s): s is string => !!s)
        .map((userAgent) => ({
            usingMac: isUsingMac(userAgent),
        }));

    const fromDriver$ = xs.merge(browserDriverUpdates$);
    const fromView$ = xs.merge(didClick$);

    // A periodic update of a property in our state.
    const greetingStateUpdate$ = xs
        .periodic(1000)
        .map<Partial<MyState>>((n) => ({
            greeting: `Hello ${n}!`,
        }))
        .endWhen(xs.periodic(3000).take(1));

    return xs.merge(greetingStateUpdate$, fromView$, fromDriver$, derived$);
};

const main = (
    sources: MainSources<MyState, ViewIn, MyDrivers>
): MainSinks<MyState, MyDrivers> => {
    // Create a model from input sources and a start state
    const stateUpdates$ = makeModel(sources);

    // Filter on these messages from our view and provide them directly as
    // output to our browser driver.
    const browserOut$ = sources.view.filter(
        isKind<FetchUserAgent>('fetch_user_agent')
    );

    return {
        // the app state stream
        updates$: stateUpdates$,
        // output instructions to drivers
        browser: browserOut$,
    };
};

// This function kicks everything off!
export const run = setup(main, startState, {
    browser: BrowserDriver,
});
