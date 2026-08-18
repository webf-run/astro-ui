import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

/**
 * Layout/typography shared by both the read-only static view and the
 * interactive editor. CodeMirror renders its own DOM (.cm-*) which Tailwind
 * utilities can't reach, so this stays a CodeMirror theme.
 */
export const baseEditorTheme: Extension = EditorView.theme({
  '&': { fontSize: '13px' },
  '.cm-content': { padding: '8px 0', fontWeight: '500' },
  '.cm-gutters': { border: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 12px' },
});

// Light syntax theme + chrome that blends into the Starlight page background.
// (The dark side uses oneDark, which brings its own theme and highlighting.)
const lightEditorTheme: Extension = [
  syntaxHighlighting(defaultHighlightStyle),
  EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--sl-color-bg)',
        color: 'var(--sl-color-text)',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--sl-color-bg)',
        color: 'var(--sl-color-gray-3)',
      },
      '.cm-activeLine': { backgroundColor: 'var(--sl-color-gray-7, #f4f4f6)' },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: 'var(--sl-color-text)',
      },
    },
    { dark: false }
  ),
];

export function currentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function editorTheme(mode: 'light' | 'dark'): Extension {
  return mode === 'dark' ? oneDark : lightEditorTheme;
}
