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

// Scroller/focus behavior specific to the *interactive* editor (the static
// read-only view doesn't need a capped scroll height or a focus ring).
// Base typography/gutter styling lives in EditorTheme.ts, shared with the
// read-only StaticCodeView so both look identical before/after Edit.
const interactiveEditorTheme: Extension = EditorView.theme({
  '&': { minHeight: '16rem' },
  '&.cm-focused': { outline: 'none' },
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

/** Actions exposed to the persistent toolbar that lives in ExampleBlock.astro. */
export interface PlaygroundHandle {
  run: () => void;
  reset: () => void;
  copy: () => Promise<void>;
}

export interface PlaygroundProps {
  /** The initial code shown in the editor. */
  code: string;
  /** Filename shown in the editor header. */
  filename?: string;
  /**
   * Called once the editor is mounted, with the action functions the
   * persistent toolbar (Copy/Reset/Run) drives. Keeping the toolbar outside
   * this component means it never gets unmounted/remounted, so there's no
   * button-set jump when Edit is clicked.
   */
  onReady?: (handle: PlaygroundHandle) => void;
}

/**
 * An editable Astro snippet with a live preview - just the CodeMirror editor
 * and the output iframe, no toolbar chrome (that's owned by ExampleBlock.astro
 * so it can stay mounted across the static → live swap). CodeMirror and the
 * compile pipeline are browser-only; this is loaded on demand via
 * mount-on-demand.ts, never eagerly.
 */
export function Playground(props: PlaygroundProps) {
  let editorMount!: HTMLDivElement;
  let iframe!: HTMLIFrameElement;

  let view: EditorView | undefined;
  let inFlight = false;

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
    if (!view) return;
    await navigator.clipboard.writeText(view.state.doc.toString());
  }

  function reset() {
    if (!view) return;

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
          interactiveEditorTheme,
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

    props.onReady?.({ run, reset, copy });

    run(); // one render on mount, not on every keystroke

    onCleanup(() => {
      themeObserver.disconnect();
      view?.destroy();
      view = undefined;
    });
  });

  return (
    <div>
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
