import xs, { Stream } from 'xstream';
import delay from 'xstream/extra/delay';
import { Main, Drivers, SinkProxies, MainSources } from './types';

// The main type exports from this lib.
export { Drivers, MainSources, MainSinks } from './types';

/**
 * Factory for creating the function which starts your app.
 * Takes your `main` function an an optional set of drivers. */
export const setup = <V, S, D extends Drivers>(
    main: Main<V, S, D>,
    drivers?: D
) => (view: Stream<V>): Stream<S> => run(main, view, drivers || {});

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

const createMainSinks = <V, D extends Drivers>(
    view: Stream<V>,
    sinkProxies: SinkProxies<D>,
    drivers: D,
): MainSources<V, D> => {

    // We create the sources to eventually feed to the main function.
    // We attach the "view" stream directly. We call each driver, which is
    // a function, with a "sink proxy". A proxy is a faked stream which is
    // imitating the real driver output, coming from the main function.
    // Thus, we achieve a cycle.
    const sources: MainSources<V, D> = {
        view,
    } as MainSources<V, D>;

    for (const name in drivers) {
        if (drivers.hasOwnProperty(name)) {
            const driver = drivers[name as string];
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
const run = <V, S, D extends Drivers, M extends Main<V, S, D>>(
    main: M,
    view: Stream<V>,
    drivers: D,
): Stream<S> => {
    const proxies = createSinkProxies(drivers);

    const mainSinks = main(createMainSinks<V, D>(view, proxies, drivers));

    // cycle back the output from main to the input.
    // however we do this with a delay to break up
    // synchronous chains (because we have derived models).
    for (const name in proxies) {
        if (proxies.hasOwnProperty(name)) {
            const streamProxy = proxies[name];
            // tslint:disable-next-line:no-expression-statement
            if (mainSinks.drivers && mainSinks.drivers[name]) {
                streamProxy.imitate(mainSinks.drivers[name].compose(delay(1)));
            }
        }
    }

    return mainSinks.state;
};
