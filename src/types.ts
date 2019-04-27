import { Stream } from 'xstream';

export type BuiltInSources<V> = {
    /** A stream of messages from the view. */
    view: Stream<V>;
};

/** The sources fed to the `main` app function. */
export type MainSources<V, D extends Drivers> = BuiltInSources<V> & {
    [k in keyof D]: ReturnType<D[k]>;
};

/** The outputs of the `main` function. */
export type MainSinks<S, D extends Drivers> = {
    /** A stream of app state. */
    state: Stream<S>;
    /** Output streams to drivers. */
    drivers?: { [k in keyof D]: Parameters<D[k]>[0] };
};


export type Driver<Si, So> = Si extends void ? (() => So) : ((s: Si) => So);

export type Main<V, S, D extends Drivers> = (
    sources: MainSources<V, D>
) => MainSinks<S, D>;

export type Drivers = {
    [name: string]: Driver<Stream<any>, any | void>;
};

export type State = {
    [k: string]: any;
};

export type SinkProxies<Si> = { [P in keyof Si]: Stream<any> };
