import { renderButtons } from './renderers/button';
import { renderNavbar } from './renderers/navbar';

export type Renderer = (code: string) => HTMLElement[];
export const renderers = {
  button: renderButtons,
  navbar: renderNavbar,
};

const registry = new Map<string, Renderer>();

registry.set('button', renderButtons);
registry.set('navbar', renderNavbar);

export function getRenderer(name: string): Renderer {
  const renderer = registry.get(name);

  if (!renderer) {
    throw new Error(`Renderer "${name}" is not registered.`);
  }
  return renderer;
}
