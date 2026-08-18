import { render } from 'solid-js/web';

import {
  Playground,
  type PlaygroundHandle,
  type PlaygroundProps,
} from './Playground';

/**
 * Mounts the interactive playground into `container`.
 *
 * The returned Promise resolves only after Playground's onReady callback
 * fires. This prevents ExampleBlock's Run/Reset buttons from becoming
 * available before the editor/compiler is ready.
 */
export function mountPlayground(
  container: HTMLElement,
  props: Omit<PlaygroundProps, 'onReady'>,
  onReady: (handle: PlaygroundHandle) => void
): Promise<() => void> {
  return new Promise((resolve, reject) => {
    let dispose: (() => void) | undefined;

    try {
      dispose = render(
        () =>
          Playground({
            ...props,

            onReady: (handle) => {
              onReady(handle);

              resolve(dispose ?? (() => undefined));
            },
          }),

        container
      );
    } catch (error) {
      reject(error);
    }
  });
}
