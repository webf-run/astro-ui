/**
 * Generic "code playground" engine.
 *
 * This file has NO knowledge of Button / Input / Card / etc. It just knows how to:
 *  - parse JSX-like attributes out of a tag
 *  - find every occurrence of a given tag in a code string
 *  - wire up Copy / Run / Reset for a playground element, given a `render` function
 *
 * Each UI component gets its own tiny "renderer" (see ./renderers) that turns
 * parsed attrbutes into real DOM elements. Add a new component -> add a new
 * renderer file -> nothing here changes.
 */

export type RenderFn = (code: string) => HTMLElement[];

export type ParsedAttrs = Record<string, string | boolean>;

/** Parses a JSX-like attribute string (e.g. `variant="primary" disabled`) into an object. */
export function parseAttrs(attrString: string): ParsedAttrs {
  const attrs: ParsedAttrs = {};
  const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|\{([^}]*)\}))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrString)) !== null) {
    const name = match[1];
    if (name === '/' || name === '') continue;

    if (match[2] !== undefined) {
      attrs[name] = match[2];
    } else if (match[3] !== undefined) {
      attrs[name] = match[3].replace(/^['"]|['"]$/g, '');
    } else {
      attrs[name] = true;
    }
  }

  return attrs;
}

/** Strips nested tags out of a slot's inner content, leaving plain text. */
export function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Finds every `<Tag ...>...</Tag>` or self-closing `<Tag ... />` occurrence of `tagName` in `code`. */
export function extractTags(
  code: string,
  tagName: string
): { attrs: ParsedAttrs; inner: string }[] {
  const regex = new RegExp(
    `<${tagName}([^>]*?)(\\/>|>([\\s\\S]*?)<\\/${tagName}>)`,
    'g'
  );
  const results: { attrs: ParsedAttrs; inner: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    results.push({
      attrs: parseAttrs(match[1] || ''),
      inner: match[3] || '',
    });
  }

  return results;
}

function message(text: string, className: string): HTMLElement {
  const el = document.createElement('p');
  el.className = className;
  el.textContent = text;
  return el;
}

/**
 * Wires up Copy / Run / Reset for a single playground element.
 * `render` receives the current editor code and returns the DOM nodes to show in Output.
 */
export function initPlayground(root: HTMLElement, render: RenderFn) {
  const editor = root.querySelector<HTMLTextAreaElement>('.editor');
  const outputBody = root.querySelector<HTMLElement>('.output-body');
  const copyBtn = root.querySelector<HTMLButtonElement>('.copy-btn');
  const runBtn = root.querySelector<HTMLButtonElement>('.run-btn');
  const resetBtn = root.querySelector<HTMLButtonElement>('.reset-btn');

  if (!editor || !outputBody || !copyBtn || !runBtn || !resetBtn) return;

  function run() {
    outputBody!.innerHTML = '';

    try {
      const nodes = render(editor!.value);

      if (nodes.length === 0) {
        outputBody!.appendChild(
          message('Nothing to preview yet.', 'output-empty')
        );
      } else {
        nodes.forEach((node) => outputBody!.appendChild(node));
      }
    } catch (err) {
      outputBody!.innerHTML = '';
      outputBody!.appendChild(
        message(
          "Couldn't render this code. Check the syntax and try again.",
          'output-error'
        )
      );
    }
  }
  run(); // initial render

  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(editor.value);

    const text = copyBtn.querySelector<HTMLElement>('.btn-text');
    const icon = copyBtn.querySelector<HTMLElement>('.btn-icon');

    if (!text || !icon) return;

    const originalText = text.textContent;

    // Update button
    text.textContent = 'Copied ✓';
    icon.style.display = 'none';

    setTimeout(() => {
      text.textContent = originalText ?? 'Copy';
      icon.style.display = 'inline-flex';
    }, 1500);
  });

  runBtn.addEventListener('click', run);

  resetBtn.addEventListener('click', () => {
    editor.value = editor.dataset.original ?? '';
    run();
  });
}
