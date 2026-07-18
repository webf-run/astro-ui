import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';

import { runAstroSource } from './Compiler';
import { astro } from './astro-lang';

declare global {
  interface HTMLElementTagNameMap {
    'code-playground': CodePlaygroundElement;
  }
}

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

const TAG_NAME = 'code-playground';

/**
 * `<code-playground>` - a self-contained, editable Astro snippet with a live
 * preview. It expects the following light-DOM structure as its children
 * (rendered by CodePlayground.astro); it does not create that markup itself,
 * so the server-rendered toolbar icons are kept intact:
 *
 *   <code-playground>
 *     <div class="code-toolbar"> …copy / run / reset buttons… </div>
 *     <div class="editor-mount" data-initial-code="…"></div>
 *     <div class="output"> <iframe class="preview-frame"></iframe> </div>
 *   </code-playground>
 *
 * Each instance wires its toolbar to a CodeMirror editor and renders the
 * compiled output into its iframe. A page only has to register the element
 * once (see `registerPlayground`); every instance then upgrades and tears
 * itself down on its own through the lifecycle callbacks - no document-wide
 * scanning or ready-flag bookkeeping.
 */
export class CodePlaygroundElement extends HTMLElement {
  #view?: EditorView;
  #iframe?: HTMLIFrameElement;
  #themeObserver?: MutationObserver;
  #initialCode = '';
  #inFlight = false;

  connectedCallback() {
    if (this.#view) {
      // already initialized (e.g. re-inserted into the DOM)
      return;
    }

    const editorMount = this.querySelector<HTMLElement>('.editor-mount');
    const iframe = this.querySelector<HTMLIFrameElement>('.preview-frame');
    const copyBtn = this.querySelector<HTMLButtonElement>('.copy-btn');
    const runBtn = this.querySelector<HTMLButtonElement>('.run-btn');
    const resetBtn = this.querySelector<HTMLButtonElement>('.reset-btn');
    if (!editorMount || !iframe || !copyBtn || !runBtn || !resetBtn) return;

    this.#iframe = iframe;
    this.#initialCode = editorMount.dataset.initialCode ?? '';

    const themeCompartment = new Compartment();

    const view = new EditorView({
      parent: editorMount,
      state: EditorState.create({
        doc: this.#initialCode,
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
    this.#view = view;

    // Keep the editor's syntax theme in sync with the site light/dark toggle,
    // which flips `data-theme` on <html> (see the Header component).
    this.#themeObserver = new MutationObserver(() => {
      view.dispatch({
        effects: themeCompartment.reconfigure(editorTheme(currentTheme())),
      });
    });
    this.#themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    this.#run(); // one render on initial mount, not on every keystroke

    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(view.state.doc.toString());

      const text = copyBtn.querySelector<HTMLElement>('.btn-text');
      const icon = copyBtn.querySelector<HTMLElement>('.btn-icon');
      if (!text || !icon) return;

      const originalText = text.textContent;
      text.textContent = 'Copied ✓';
      icon.style.display = 'none';

      setTimeout(() => {
        text.textContent = originalText ?? 'Copy';
        icon.style.display = 'inline-flex';
      }, 1500);
    });

    runBtn.addEventListener('click', () => this.#run());

    resetBtn.addEventListener('click', () => {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: this.#initialCode,
        },
      });
      this.#run();
    });
  }

  disconnectedCallback() {
    this.#themeObserver?.disconnect();
    this.#view?.destroy();
    this.#themeObserver = undefined;
    this.#view = undefined;
    this.#iframe = undefined;
  }

  /** Compile the current editor contents and paint the result into the iframe. */
  async #run() {
    if (this.#inFlight || !this.#view || !this.#iframe) return; // ignore double-clicks mid-request
    this.#inFlight = true;
    const iframe = this.#iframe;
    const code = this.#view.state.doc.toString();

    try {
      const result = await runAstroSource(code);
      if (result.error) {
        paintIframe(
          iframe,
          `<pre class="playground-error">${escapeHtml(result.error)}</pre>`
        );
      } else {
        paintIframe(iframe, result.html ?? '');
      }
    } catch (err) {
      paintIframe(
        iframe,
        `<pre class="playground-error">${escapeHtml(err instanceof Error ? err.message : String(err))}</pre>`
      );
    } finally {
      this.#inFlight = false;
    }
  }
}

/** Define the custom element once. Safe to call from every page/instance. */
export function registerPlayground() {
  if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, CodePlaygroundElement);
  }
}

function currentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function editorTheme(mode: 'light' | 'dark'): Extension {
  return mode === 'dark' ? oneDark : lightEditorTheme;
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

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] as string
  );
}
