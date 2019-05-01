import { run, setup } from './run';
export { run, setup } from './run';

if (typeof window !== 'undefined') {
    (window as any).Frap = { run, setup};
}
