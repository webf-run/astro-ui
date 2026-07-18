import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { createSignal, onCleanup, onMount } from 'solid-js';

import { astro } from './CodeMirrorAstroLang';
import { runAstroSource } from './Compiler';
import { Toolbar } from './Toolbar';

// Layout/typography for the editor internals. CodeMirror renders its own DOM
// (.cm-*) which Tailwind utilities can't reach, so this stays a CodeMirror
// theme. Colors come from the light/dark theme swapped in the compartment.
const baseEditorTheme: Extension = EditorView.theme({
  '&': { fontSize: '13px', minHeight: '16rem' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    overflow: 'auto',
    maxHeight: '28rem',
    fontFamily:
      "var(--sl-font-mono, 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace)",
    lineHeight: '1.6',
  },
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

function currentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function editorTheme(mode: 'light' | 'dark'): Extension {
  return mode === 'dark' ? oneDark : lightEditorTheme;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] as string
  );
}

function paintIframe(iframe: HTMLIFrameElement, bodyHtml: string) {
  // The iframe is a separate document, so its styles are inlined here rather
  // than shared with the page (this is also why `.playground-error` lives here).
  iframe.srcdoc = `
    <!doctype html>
    <html>
    <head>
      <link rel="stylesheet" href="/astro-ui-style.css" />
      <style>
        body {
          margin: 0;
          padding: 1rem;
          font-family: 'IBM Plex Sans Variable', system-ui, sans-serif;
        }

        code, pre, kbd, samp {
          font-family: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        /* Space between preview components */
        body > * {
          margin: 20px;
        }

        .playground-error {
          margin: 0;
          padding: 1rem;
          color: #dc2626;
          background: #fef2f2;
          border-radius: 8px;
          font-size: 13px;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>
  `;
}

export interface PlaygroundProps {
  /** The initial code shown in the editor. */
  code: string;
  /** Filename shown in the editor header. */
  filename?: string;
}

/**
 * An editable Astro snippet with a live preview, laid out as a two-pane IDE
 * card (editor over output). CodeMirror and the compile pipeline are
 * browser-only, so this island is mounted with `client:only` from
 * CodePlayground.astro. Chrome is styled with Tailwind utilities keyed on
 * Starlight `--sl-color-*` tokens, so it recolors with the site theme.
 */
export function Playground(props: PlaygroundProps) {
  let editorMount!: HTMLDivElement;
  let iframe!: HTMLIFrameElement;

  const [copied, setCopied] = createSignal(false);

  let view: EditorView | undefined;
  let inFlight = false;
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  /** Compile the current editor contents and paint the result into the iframe. */
  async function run() {
    if (inFlight || !view) return; // ignore double-clicks mid-request
    inFlight = true;
    const code = view.state.doc.toString();

    try {
      const result = await runAstroSource(code);
      paintIframe(
        iframe,
        result.error
          ? `<pre class="playground-error">${escapeHtml(result.error)}</pre>`
          : (result.html ?? '')
      );
    } catch (err) {
      paintIframe(
        iframe,
        `<pre class="playground-error">${escapeHtml(err instanceof Error ? err.message : String(err))}</pre>`
      );
    } finally {
      inFlight = false;
    }
  }

  async function copy() {
    if (!view) {
      return;
    }

    await navigator.clipboard.writeText(view.state.doc.toString());
    setCopied(true);

    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => setCopied(false), 1500);
  }

  function reset() {
    if (!view) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: props.code },
    });
    run();
  }

  onMount(() => {
    const themeCompartment = new Compartment();

    view = new EditorView({
      parent: editorMount,
      state: EditorState.create({
        doc: props.code,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          astro(),
          baseEditorTheme,
          themeCompartment.of(editorTheme(currentTheme())),

          EditorView.lineWrapping,
          EditorView.editable.of(true),
        ],
      }),
    });

    // Keep the editor's syntax theme in sync with the site light/dark toggle,
    // which flips `data-theme` on <html> (see the Header component).
    const themeObserver = new MutationObserver(() => {
      view?.dispatch({
        effects: themeCompartment.reconfigure(editorTheme(currentTheme())),
      });
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    run(); // one render on mount, not on every keystroke

    onCleanup(() => {
      themeObserver.disconnect();
      view?.destroy();
      view = undefined;
      clearTimeout(copyTimer);
    });
  });

  return (
    <div class='overflow-hidden rounded-xl border border-(--sl-color-hairline) bg-[var(--sl-color-bg)] shadow-sm'>
      {/* Editor pane header */}
      <Toolbar
        filename={props.filename ?? 'example.astro'}
        copied={copied()}
        onCopy={copy}
        onReset={reset}
        onRun={run}
      />

      {/* Editor */}
      <div ref={editorMount} />

      {/* Output pane */}
      <div class='border-t border-(--sl-color-hairline) bg-(--sl-color-bg-nav) px-3 py-2 text-xs font-medium text-[var(--sl-color-gray-2)]'>
        Output
      </div>
      <iframe
        ref={iframe}
        class='block min-h-48 w-full bg-(--sl-color-bg)'
        sandbox='allow-scripts allow-same-origin'
        title='Component preview'
      />
    </div>
  );
}
