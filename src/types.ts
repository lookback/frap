import { Stream } from 'xstream';

export type MainSinks<S, D extends Drivers> = {
    state: Stream<S>;
    /** Driver output */
    drivers?: { [k in keyof D]: Parameters<D[k]>[0] };
};

export type DriverSources<D extends Drivers> = { [k in keyof D]: ReturnType<D[k]> };

export type MainSources<V, D extends Drivers> = {
    view: Stream<V>;
    /** Driver input */
    drivers: DriverSources<D>;
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
