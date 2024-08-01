import { DebugLogger } from '@affine/debug';

import { mixpanel } from './mixpanel';
import type { CallableEventsChain, EventsUnion } from './types';

const logger = new DebugLogger('mixpanel');

const levels = ['page', 'segment', 'module', 'control'] as const;
function makeAutoTrackProxy(
  level = 0,
  info: Record<string, string> = {},
  cache: Record<string, any> = {}
) {
  const proxy = new Proxy(
    {},
    {
      get(_target, prop) {
        if (
          typeof prop !== 'string' ||
          prop === '$$typeof' /* webpack hot load reading this prop */
        ) {
          return undefined;
        }

        if (levels[level] === 'control') {
          return (arg: any) => {
            mixpanel.track('custom_event', {
              ...info,
              control: prop,
              arg,
            });
          };
        } else {
          let levelProxy = cache[prop];
          if (levelProxy) {
            return levelProxy;
          }

          if (prop !== '$') {
            info = { ...info, [levels[level]]: prop };
          }

          levelProxy = makeAutoTrackProxy(level + 1, info, cache[prop]);
          cache[prop] = levelProxy;
          return levelProxy;
        }
      },
    }
  );

  return proxy;
}

export const track = makeAutoTrackProxy() as CallableEventsChain;

/**
 * listen on clicking on all subtree elements and auto track events if defined
 *
 * @example
 *
 * ```html
 * <button data-event-chain='$.cmdk.settings.quicksearch.changeLanguage' data-event-arg='cn' />
 * ```
 */
export function enableAutoTrack(root: HTMLElement) {
  const listener = (e: Event) => {
    const el = e.target as HTMLElement | null;
    if (!el) {
      return;
    }
    const dataset = el.dataset;

    if (dataset['eventProps']) {
      const arg = dataset['event-arg'];

      const props = dataset['eventProps']
        .split('.')
        .map(name => (name === '$' ? undefined : name));
      if (props.length !== levels.length) {
        logger.error('Invalid event props on element', el);
        return;
      }

      mixpanel.track('custom_event', {
        page: props[0] as any,
        segment: props[1],
        module: props[2],
        control: props[3],
        arg,
      });
    }
  };

  root.addEventListener('click', listener, {});
  return () => {
    root.removeEventListener('click', listener);
  };
}

declare module 'react' {
  //  we have to declare `T` but it's actually not used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    'data-event-props'?: EventsUnion;
    'data-event-arg'?: string;
  }
}
