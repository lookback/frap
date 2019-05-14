export { run, setup } from './run';

// The main type exports from this lib.
export { Drivers, MainSources, MainSinks } from './types';

import { run, setup } from './run';

if (typeof window !== 'undefined') {
    // tslint:disable-next-line no-object-mutation
    (window as any).Frap = { run, setup };
}
