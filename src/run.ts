import xs, { Stream } from 'xstream';
import delay from 'xstream/extra/delay';
import { Main, Drivers, SinkProxies, MainSources, BuiltInSources } from './types';

/**
 * Factory for creating the function which starts your app.
 * Takes your `main` function an an optional set of drivers. */
export const setup = <V, S, D extends Drivers>(
    main: Main<V, S, D>,
    startState: S,
    drivers?: D
) => (view: Stream<V>): Stream<S> => run(main, view, drivers || {}, startState);

/** Creates "sink proxies" which are dummy streams as outputs to a set of drivers. */
const createSinkProxies = <D extends Drivers>(drivers?: D): SinkProxies<D> => {
    const sinkProxies: SinkProxies<D> = {} as SinkProxies<D>;

    for (const name in drivers) {
        if (drivers.hasOwnProperty(name)) {
            // tslint:disable-next-line no-object-mutation
            sinkProxies[name] = xs.create<any>();
        }
    }

    return sinkProxies;
};

const createMainSinks = <S, V, D extends Drivers>(
    view: Stream<V>,
    state: Stream<S>,
    sinkProxies: SinkProxies<D>,
    drivers: D,
): MainSources<S, V, D> => {

    // We create the sources to eventually feed to the main function.
    // We attach the "view" stream directly. We call each driver, which is
    // a function, with a "sink proxy". A proxy is a faked stream which is
    // imitating the real driver output, coming from the main function.
    // Thus, we achieve a cycle.
    const builtInSources: BuiltInSources<S, V> = {
        view,
        state,
    };

    const sources: MainSources<S, V, D> = {} as MainSources<S, V, D>;

    for (const name in drivers) {
        if (drivers.hasOwnProperty(name)) {
            const driver = drivers[name as string];
            // tslint:disable-next-line no-object-mutation
            sources[name] = driver(sinkProxies[name]);
        }
    }

    return { ...sources, ...builtInSources };
};

/**
 * Starts the whole application. Takes a `main` function (your app),
 * a set of optional drivers, and a stream of messages from the view.
 * 
 * We return the stream of the core app state for the app to draw in
 * the view.
 */
export const run = <V, S, D extends Drivers, M extends Main<V, S, D>>(
    main: M,
    view: Stream<V>,
    drivers: D,
    startState: S,
): Stream<S> => {
    const proxies = createSinkProxies(drivers);
    
    // Incremental updates to the main app state. Cycled back via imitate so
    // we also can use the state to derive updates.
    const stateUpdate$ = xs.create<Partial<S>>();
    // Folded app state from the incremental updates
    const state$ = stateUpdate$
        .fold((prev, update) => ({ ...prev, ...update }), startState)
        .debug('state');

    const { updates$, ...driverSinks } = main(
        createMainSinks<S, V, D>(view, state$, proxies, drivers)
    );

    // Finally, merge incremental state updates
    const realStateUpdate$: Stream<Partial<S>> = updates$
        .debug('update')
        .compose(delay(1));

    // tslint:disable-next-line
    stateUpdate$.imitate(realStateUpdate$);

    // cycle back the output from main to the input.
    // however we do this with a delay to break up
    // synchronous chains (because we have derived models).
    for (const name in proxies) {
        if (proxies.hasOwnProperty(name)) {
            const streamProxy = proxies[name as string];
            const driverOut = driverSinks && driverSinks[name as string];

            // tslint:disable-next-line:no-expression-statement
            if (driverOut) {
                streamProxy.imitate(driverOut.compose(delay(1)));
            }
        }
    }

    return state$;
};
