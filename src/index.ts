import xs, { Stream } from 'xstream';
import delay from 'xstream/extra/delay';

/** The sources fed to the `main` app function. */
export type MainSources<S, V, D extends Drivers> = BuiltInSources<S, V> &
    { [k in keyof D]: ReturnType<D[k]> };

/** The outputs of the `main` function. */
export type MainSinks<S, D extends Drivers> = BuiltInSinks<S> & DriverOut<D>;

export type Drivers = {
    [name: string]: Driver<Stream<any> | void, any | void>;
};

type BuiltInSources<S, V> = {
    /** A stream of messages from the view. */
    view: Stream<V>;
    /** A stream of state. */
    state: Stream<S>;
};

type BuiltInSinks<S> = {
    /** A stream of incremental state updates. */
    updates$: Stream<Partial<S>>;
};

/** Output streams to drivers. */
type DriverOut<D extends Drivers> = { [k in keyof D]: Parameters<D[k]>[0] };

type Driver<Si, So> = Si extends void ? (() => So) : ((s: Si) => So);

export type Main<V, S, D extends Drivers> = (
    sources: MainSources<S, V, D>
) => MainSinks<S, D>;

type SinkProxies<Si> = { [P in keyof Si]: Stream<any> };

/**
 * Factory for creating the `run` function which starts your app.
 */
export const setup = <V, S, D extends Drivers>(
    /**
     * Your app's `main` function, which accepts `MainSources`, consisting
     * of a view message stream, a stream of app state, and input from drivers.
     *
     * @see `MainSources`
     */
    main: Main<V, S, D>,
    /** Your app's start state. */
    startState: S = {} as S,
    /** Drivers that your app will use. */
    drivers: D = {} as D
) => (
    view: Stream<V>,
    { debug }: { debug: boolean } = { debug: false }
): Stream<S> => run(main, startState, { view, drivers }, debug);

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

const callDrivers = <D extends Drivers>(
    sinkProxies: SinkProxies<D>,
    drivers: D
) => {
    // We create the sources to eventually feed to the main function.
    // We attach the "view" stream directly. We call each driver, which is
    // a function, with a "sink proxy". A proxy is a faked stream which is
    // imitating the real driver output, coming from the main function.
    // Thus, we achieve a cycle.
    const sources: { [k in keyof D]: ReturnType<D[k]> } = {} as any;

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
export const run = <V, S, D extends Drivers, M extends Main<V, S, D>>(
    main: M,
    startState: S,
    sources: {
        view: Stream<V>;
        drivers: D;
    },
    debug?: boolean
): Stream<S> => {
    const { drivers, view } = sources;

    const log = (label: string) => (t: any) =>
        !!debug && console.log(label + ':', t);

    const proxies = createSinkProxies(drivers);

    // Incremental updates to the main app state. Cycled back via imitate so
    // we also can use the state to derive updates.
    const stateUpdate$ = xs.create<Partial<S>>();
    // Folded app state from the incremental updates
    const state$ = stateUpdate$
        .fold((prev, update) => ({ ...prev, ...update }), startState)
        .debug(log('state'));

    const mainSources: MainSources<S, V, D> = {
        view,
        state: state$,
        ...callDrivers<D>(proxies, drivers),
    };

    const { updates$, ...driverSinks } = main(mainSources);

    // Finally, merge incremental state updates
    const realStateUpdate$: Stream<Partial<S>> = updates$
        .debug(log('update'))
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
