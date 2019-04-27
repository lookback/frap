import xs, { Stream } from 'xstream';
import delay from 'xstream/extra/delay';
import { Main, Drivers, SinkProxies, DriverSources } from './types';

export { Drivers, MainSources, MainSinks } from './types';

export const setup = <V, S, D extends Drivers>(
    main: Main<V, S, D>,
    drivers: D
) => (view: Stream<V>): Stream<S> => run(main, drivers, view);

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

/** Call all drivers with the (proxied) sinks. */
const callDrivers = <D extends Drivers>(
    drivers: D,
    sinkProxies: SinkProxies<D>
): DriverSources<D> => {
    const sources: DriverSources<D> = {} as DriverSources<D>;

    for (const name in drivers) {
        if (drivers.hasOwnProperty(name)) {
            const driver = drivers[name as string];
            // tslint:disable-next-line no-object-mutation
            sources[name] = driver(sinkProxies[name]);
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
            const streamProxy = proxies[name];
            // tslint:disable-next-line:no-expression-statement
            if (mainSinks.drivers && mainSinks.drivers[name]) {
                streamProxy.imitate(mainSinks.drivers[name].compose(delay(1)));
            }
        }
    }

    return mainSinks.state;
};
