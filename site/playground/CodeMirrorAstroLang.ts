import { html, htmlLanguage } from '@codemirror/lang-html';
import { javascript, typescriptLanguage } from '@codemirror/lang-javascript';
import type { Extension } from '@codemirror/state';
import { type Input, type SyntaxNodeRef, parseMixed } from '@lezer/common';

/**
 * There is no maintained CodeMirror grammar for `.astro`, so we compose one:
 * the HTML parser handles the markup body (including nested `<script>` /
 * `<style>`), and we overlay the TypeScript parser onto the leading `---` …
 * `---` frontmatter block so its imports and expressions highlight as code.
 */

// Opening fence + inner frontmatter + closing fence, anchored at the top of
// the document. Group 1 = opening `---\n`, group 2 = the TS frontmatter body.
const FRONTMATTER = /^(---[^\n]*\r?\n)([\s\S]*?)(\r?\n---)/;

function astroMixed(node: SyntaxNodeRef, input: Input) {
  // Only mount the overlay once, on the top-level document node.
  if (!node.type.isTop) return null;

  const text = input.read(0, input.length);
  const match = FRONTMATTER.exec(text);
  if (!match) return null;

  const from = match[1].length;
  const to = from + match[2].length;
  if (to <= from) return null;

  return {
    parser: typescriptLanguage.parser,
    overlay: [{ from, to }],
  };
}

/** CodeMirror language support for `.astro` source. */
export function astro(): Extension {
  const astroLanguage = htmlLanguage.configure({
    wrap: parseMixed(astroMixed),
  });

  return [
    astroLanguage.extension,
    html().support,
    javascript({ typescript: true }).support,
  ];
}
