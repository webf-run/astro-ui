import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { onCleanup, onMount } from 'solid-js';

import { astro } from './CodeMirrorAstroLang';
import { runAstroSource } from './Compiler';
import { baseEditorTheme, currentTheme, editorTheme } from './EditorTheme';

const interactiveEditorTheme: Extension = EditorView.theme({
  '&': {
    minHeight: '16rem',
  },

  '&.cm-focused': {
    outline: 'none',
  },

  '.cm-scroller': {
    overflow: 'auto',
    maxHeight: '28rem',
    fontFamily:
      "var(--sl-font-mono, 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace)",
    lineHeight: '1.6',
  },
});

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c] as string
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

        code,
        pre,
        kbd,
        samp {
          font-family:
            'JetBrains Mono Variable',
            ui-monospace,
            SFMono-Regular,
            Menlo,
            monospace;
        }

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

export interface PlaygroundHandle {
  run: () => Promise<void>;
  reset: () => Promise<void>;
  copy: () => Promise<void>;
}

export interface PlaygroundProps {
  code: string;
  filename?: string;
  onReady?: (handle: PlaygroundHandle) => void;
}

export function Playground(props: PlaygroundProps) {
  let editorMount!: HTMLDivElement;
  let iframe!: HTMLIFrameElement;

  let view: EditorView | undefined;
  let inFlight = false;

  async function run(): Promise<void> {
    if (inFlight || !view) {
      return;
    }

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
        `<pre class="playground-error">${escapeHtml(
          err instanceof Error ? err.message : String(err)
        )}</pre>`
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
  }

  async function reset(): Promise<void> {
    if (!view) {
      return;
    }

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: props.code,
      },
    });

    await run();
  }

  onMount(async () => {
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
          interactiveEditorTheme,
          themeCompartment.of(editorTheme(currentTheme())),
          EditorView.lineWrapping,
          EditorView.editable.of(true),
        ],
      }),
    });

    const themeObserver = new MutationObserver(() => {
      view?.dispatch({
        effects: themeCompartment.reconfigure(editorTheme(currentTheme())),
      });
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    /*
     * Important:
     *
     * Wait for the first compile/render before notifying ExampleBlock
     * that the playground is ready.
     *
     * This guarantees that:
     *   Edit -> live editor -> initial output -> Run
     *
     * happens in that order.
     */
    await run();

    props.onReady?.({
      run,
      reset,
      copy,
    });

    onCleanup(() => {
      themeObserver.disconnect();
      view?.destroy();
      view = undefined;
    });
  });

  return (
    <div>
      <div ref={editorMount} />

      <div class='border-t border-(--sl-color-hairline) bg-(--sl-color-bg-nav) px-3 py-2 text-xs font-medium text-[var(--sl-color-gray-2)]'>
        Output
      </div>

      <iframe
        ref={iframe}
        class='block min-h-128 w-full bg-(--sl-color-bg)'
        sandbox='allow-scripts allow-same-origin'
        title='Component preview'
      />
    </div>
  );
}
