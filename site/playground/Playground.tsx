import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';
import { Check, Copy, Play, RotateCcw } from 'lucide-solid';
import { createSignal, onCleanup, onMount } from 'solid-js';

import { astro } from './CodeMirrorAstroLang';
import { runAstroSource } from './Compiler';

// Light editor theme: default (light-oriented) highlight style plus chrome that
// blends into the Starlight page background.
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
        border: 'none',
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
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>
  `;
}

interface Props {
  /** The initial code shown in the editor. */
  code: string;
}

/**
 * An editable Astro snippet with a live preview. CodeMirror and the compile
 * pipeline are browser-only, so this island is mounted with `client:only`
 * from CodePlayground.astro.
 */
export default function Playground(props: Props) {
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
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          astro(),
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
    <>
      <div class='code-toolbar'>
        <button
          class='copy-btn playground-btn'
          classList={{ 'is-copied': copied() }}
          onClick={copy}
        >
          <span class='btn-text'>{copied() ? 'Copied ✓' : 'Copy'}</span>
          <span class='btn-icon copy-icon'>
            <Copy size={16} />
          </span>
          <span class='btn-icon check-icon'>
            <Check size={16} />
          </span>
        </button>
        <button class='run-btn playground-btn' onClick={run}>
          <span class='btn-text'>Run</span>
          <Play size={16} />
        </button>
        <button class='reset-btn playground-btn' onClick={reset}>
          <span class='btn-text'>Reset</span>
          <RotateCcw size={16} />
        </button>
      </div>

      <div class='editor-mount' ref={editorMount} />

      <div class='output'>
        <div class='output-header'>Output</div>
        <iframe
          class='preview-frame'
          sandbox='allow-scripts allow-same-origin'
          title='Component preview'
          ref={iframe}
        />
      </div>
    </>
  );
}
