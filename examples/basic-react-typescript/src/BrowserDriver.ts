import { Stream } from 'xstream';
import { isKind } from './util';
import { FetchUserAgent } from './app';

/** The different kinds of output to our browser driver. */
type BrowserOut = FetchUserAgent;
/** Our browser driver will only output user agent strings for now. */
type BrowserIn = string;

/**
 * A driver which interacts with browser APIs and sends back sources.
 *
 * This driver can potentially interact with all kinds of browser APIs,
 * depending on the requirements. But the important part is that all of
 * the calls to external APIs (side effects) are collected *here* and
 * not in our nice, cozy model.
 */
export const BrowserDriver = (out$: Stream<BrowserOut>): Stream<BrowserIn> => {
    // Capture output instructions from our model which tells us to
    // fetch the user agent.
    const userAgent$ = out$
        .filter(isKind<FetchUserAgent>('fetch_user_agent'))
        .mapTo(navigator.userAgent);

    return userAgent$;
};
