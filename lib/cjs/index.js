"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xstream_1 = __importDefault(require("xstream"));
const delay_1 = __importDefault(require("xstream/extra/delay"));
/**
 * Factory for creating the `run` function which starts your app.
 */
exports.setup = (
/**
 * Your app's `main` function, which accepts `MainSources`, consisting
 * of a view message stream, a stream of app state, and input from drivers.
 *
 * @see `MainSources`
 */
main, 
/** Your app's start state. */
startState = {}, 
/** Drivers that your app will use. */
drivers = {}) => (view, { debug } = { debug: false }) => exports.run(main, startState, { view, drivers }, debug);
/** Creates "sink proxies" which are dummy streams as outputs to a set of drivers. */
const createSinkProxies = (drivers) => {
    const sinkProxies = {};
    for (const name in drivers) {
        if (drivers.hasOwnProperty(name)) {
            // tslint:disable-next-line no-object-mutation
            sinkProxies[name] = xstream_1.default.create();
        }
    }
    return sinkProxies;
};
const callDrivers = (sinkProxies, drivers) => {
    // We create the sources to eventually feed to the main function.
    // We attach the "view" stream directly. We call each driver, which is
    // a function, with a "sink proxy". A proxy is a faked stream which is
    // imitating the real driver output, coming from the main function.
    // Thus, we achieve a cycle.
    const sources = {};
    for (const name in drivers) {
        if (drivers.hasOwnProperty(name)) {
            const driver = drivers[name];
            // tslint:disable-next-line no-object-mutation
            sources[name] = driver(sinkProxies[name]);
        }
    }
    return sources;
};
/**
 * Starts the whole application. Takes a `main` function (your app),
 * a set of optional drivers, and a stream of messages from the view.
 *
 * We return the stream of the core app state for the app to draw in
 * the view.
 */
exports.run = (main, startState, sources, debug) => {
    const { drivers, view } = sources;
    const log = (label) => (t) => !!debug && console.log(label + ':', t);
    const proxies = createSinkProxies(drivers);
    // Incremental updates to the main app state. Cycled back via imitate so
    // we also can use the state to derive updates.
    const stateUpdate$ = xstream_1.default.create();
    // Folded app state from the incremental updates
    const state$ = stateUpdate$
        .fold((prev, update) => ({ ...prev, ...update }), startState)
        .debug(log('state'));
    const mainSources = {
        view,
        state: state$,
        ...callDrivers(proxies, drivers),
    };
    const { updates$, ...driverSinks } = main(mainSources);
    // Finally, merge incremental state updates
    const realStateUpdate$ = updates$
        .debug(log('update'))
        .compose(delay_1.default(1));
    // tslint:disable-next-line
    stateUpdate$.imitate(realStateUpdate$);
    // cycle back the output from main to the input.
    // however we do this with a delay to break up
    // synchronous chains (because we have derived models).
    for (const name in proxies) {
        if (proxies.hasOwnProperty(name)) {
            const streamProxy = proxies[name];
            const driverOut = driverSinks && driverSinks[name];
            // tslint:disable-next-line:no-expression-statement
            if (driverOut) {
                streamProxy.imitate(driverOut.compose(delay_1.default(1)));
            }
        }
    }
    return state$;
};
//# sourceMappingURL=index.js.map