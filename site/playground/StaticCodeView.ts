import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';

import { astro } from './CodeMirrorAstroLang';
import { baseEditorTheme, currentTheme, editorTheme } from './EditorTheme';

/**
 * Mounts a read-only CodeMirror instance showing `code`, with no editing
 * chrome (no history/keymap - there's nothing to undo in a read-only view).
 *
 * Deliberately kept in its own module, separate from Playground.tsx: this
 * file only imports CodeMirror packages, never Compiler.ts, so it never
 * drags in @astrojs/compiler / esbuild-wasm / the .wasm binaries. Safe to
 * import eagerly on every docs page.
 */
export function mountStaticCodeView(
  container: HTMLElement,
  code: string
): () => void {
  const themeExtension: Extension = editorTheme(currentTheme());

  const view = new EditorView({
    parent: container,
    state: EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        astro(),
        baseEditorTheme,
        themeExtension,
        EditorView.lineWrapping,
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
      ],
    }),
  });

  // Keep in sync with the site's light/dark toggle. Rebuilding state here
  // (rather than a Compartment) is fine - this view never has local edits
  // to preserve, since it's read-only.
  const themeObserver = new MutationObserver(() => {
    view.setState(
      EditorState.create({
        doc: view.state.doc,
        extensions: [
          lineNumbers(),
          astro(),
          baseEditorTheme,
          editorTheme(currentTheme()),
          EditorView.lineWrapping,
          EditorView.editable.of(false),
          EditorState.readOnly.of(true),
        ],
      })
    );
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  return () => {
    themeObserver.disconnect();
    view.destroy();
  };
}
