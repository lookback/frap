import xs, { Stream } from 'xstream';
import delay from 'xstream/extra/delay';

export type MainSinks<S, D extends Drivers> = {
    state: Stream<S>;
    /** Driver output */
    drivers: { [k in keyof D]: Parameters<D[k]>[0] };
};

export type MainSources<V, D extends Drivers> = {
    view: Stream<V>;
    /** Driver input */
    drivers: { [k in keyof D]: ReturnType<D[k]> };
};

type Driver<Si, So> = Si extends void ? (() => So) : ((stream: Si) => So);

type Main<V, S, D extends Drivers> = (
    sources: MainSources<V, D>
) => MainSinks<S, D>;

export type Drivers = {
    [name: string]: Driver<Stream<any>, any | void>;
};

export type State = {
    [k: string]: any;
};

export const setup = <V, S, D extends Drivers>(
    main: Main<V, S, D>,
    drivers: D
) => (view: Stream<V>): Stream<S> => run(main, drivers, view);

type SinkProxies<Si> = { [P in keyof Si]: Stream<any> };

const makeSinkProxies = <D extends Drivers>(drivers: D): SinkProxies<D> => {
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
    drivers: D,
    sinkProxies: SinkProxies<D>
) => {
    const sources = {} as any;

    for (const name in drivers) {
        if (drivers.hasOwnProperty(name)) {
            // tslint:disable-next-line no-object-mutation
            sources[name] = (drivers[name] as any)(sinkProxies[name], name);
        }
    }

    return sources;
};

const run = <V, S, D extends Drivers, M extends Main<V, S, D>>(
    main: M,
    drivers: D,
    view: Stream<V>
): Stream<S> => {
    const proxies = makeSinkProxies(drivers);

    const mainSinks = main({
        view,
        drivers: callDrivers(drivers, proxies),
    });

    // cycle back the output from main to the input.
    // however we do this with a delay to break up
    // synchronous chains (because we have derived models).
    for (const name in proxies) {
        if (proxies.hasOwnProperty(name)) {
            const stream = proxies[name];
            // tslint:disable-next-line:no-expression-statement
            stream.imitate(mainSinks.drivers[name].compose(delay(1)));
        }
    }

    return mainSinks.state;
};
