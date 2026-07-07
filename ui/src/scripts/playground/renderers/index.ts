import { renderButtons } from './button';

// import { renderInputs } from "./input";
// import { renderCards } from "./card";

/**
 * Add one entry here for every new component doc page.
 * The key is what you pass as `renderer="..."` on <CodePlayground />.
 */
export const renderers: Record<string, (code: string) => HTMLElement[]> = {
  button: renderButtons,
  // input: renderInputs,
  // card: renderCards,
};
