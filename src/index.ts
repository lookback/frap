export { run, setup } from './run';

// The main type exports from this lib.
export { Drivers, MainSources, MainSinks } from './types';

import { run, setup } from './run';

if (typeof window !== 'undefined') {
    (window as any).Frap = { run, setup};
}
