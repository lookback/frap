import { Stream } from 'xstream';

export type BuiltInSources<S, V> = {
    /** A stream of messages from the view. */
    view: Stream<V>;
    /** A stream of state. */
    state: Stream<S>;
};

/** The sources fed to the `main` app function. */
export type MainSources<S, V, D extends Drivers> = BuiltInSources<S, V> & {
    [k in keyof D]: ReturnType<D[k]>;
};

export type BuiltInSinks<S> = {
    /** A stream of incremental state updates. */
    updates$: Stream<Partial<S>>;
};

/** Output streams to drivers. */
export type DriverOut<D extends Drivers> = {
    [k in keyof D]: Parameters<D[k]>[0];
};

/** The outputs of the `main` function. */
export type MainSinks<S, D extends Drivers> = BuiltInSinks<S> & DriverOut<D>;

export type Driver<Si, So> = Si extends void ? (() => So) : ((s: Si) => So);

export type Main<V, S, D extends Drivers> = (
    sources: MainSources<S, V, D>
) => MainSinks<S, D>;

export type Drivers = {
    [name: string]: Driver<Stream<any>, any | void>;
};

export type State = {
    [k: string]: any;
};

export type SinkProxies<Si> = { [P in keyof Si]: Stream<any> };
