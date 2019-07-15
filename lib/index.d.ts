import { Stream } from 'xstream';
/** The sources fed to the `main` app function. */
export declare type MainSources<S, V, D extends Drivers> = BuiltInSources<S, V> & {
    [k in keyof D]: ReturnType<D[k]>;
};
/** The outputs of the `main` function. */
export declare type MainSinks<S, D extends Drivers> = BuiltInSinks<S> & DriverOut<D>;
export declare type Drivers = {
    [name: string]: Driver<Stream<any> | void, any | void>;
};
declare type BuiltInSources<S, V> = {
    /** A stream of messages from the view. */
    view: Stream<V>;
    /** A stream of state. */
    state: Stream<S>;
};
declare type BuiltInSinks<S> = {
    /** A stream of incremental state updates. */
    updates$: Stream<Partial<S>>;
};
/** Output streams to drivers. */
declare type DriverOut<D extends Drivers> = {
    [k in keyof D]: Parameters<D[k]>[0];
};
declare type Driver<Si, So> = Si extends void ? (() => So) : ((s: Si) => So);
declare type Main<V, S, D extends Drivers> = (sources: MainSources<S, V, D>) => MainSinks<S, D>;
/**
 * Factory for creating the `run` function which starts your app.
 */
export declare const setup: <V, S, D extends Drivers>(main: Main<V, S, D>, startState?: S, drivers?: D) => (view: Stream<V>, { debug }?: {
    debug: boolean;
}) => Stream<S>;
/**
 * Starts the whole application. Takes a `main` function (your app),
 * a set of optional drivers, and a stream of messages from the view.
 *
 * We return the stream of the core app state for the app to draw in
 * the view.
 */
export declare const run: <V, S, D extends Drivers, M extends Main<V, S, D>>(main: M, startState: S, sources: {
    view: Stream<V>;
    drivers: D;
}, debug?: boolean | undefined) => Stream<S>;
export {};
