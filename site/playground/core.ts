import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';

import { runAstroSource } from './compile';

function paintIframe(iframe: HTMLIFrameElement, bodyHtml: string) {
  iframe.srcdoc = `<!doctype html>
<html>
<head>
  <link rel="stylesheet" href="/astro-ui-style.css" />
  <style>
    body {
      margin: 0;
      padding: 1rem;
      font-family: system-ui, sans-serif;
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
</html>`;
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

export function initPlayground(root: HTMLElement) {
  const editorMount = root.querySelector<HTMLElement>('.editor-mount');
  const iframe = root.querySelector<HTMLIFrameElement>('.preview-frame');
  const copyBtn = root.querySelector<HTMLButtonElement>('.copy-btn');
  const runBtn = root.querySelector<HTMLButtonElement>('.run-btn');
  const resetBtn = root.querySelector<HTMLButtonElement>('.reset-btn');
  const outputBody = root.querySelector<HTMLElement>('.output');
  if (!editorMount || !iframe || !copyBtn || !runBtn || !resetBtn) return;

  const original = editorMount.dataset.original ?? '';
  let inFlight = false;

  // function setLoading(isLoading: boolean) {
  //   runBtn!.disabled = isLoading;
  //   runBtn!.classList.toggle('is-loading', isLoading);
  //   const label = runBtn!.querySelector<HTMLElement>('.btn-text');
  //   if (label) label.textContent = isLoading ? 'Running…' : 'Run';
  //   outputBody?.classList.toggle('is-loading', isLoading);
  // }

  async function run() {
    if (inFlight) return; // ignore double-clicks mid-request
    inFlight = true;
    // setLoading(true);
    const code = view.state.doc.toString();

    try {
      const result = await runAstroSource(code);
      if (result.error) {
        paintIframe(
          iframe!,
          `<pre class="playground-error">${escapeHtml(result.error)}</pre>`
        );
      } else {
        paintIframe(iframe!, result.html ?? '');
      }
    } catch (err) {
      paintIframe(
        iframe!,
        `<pre class="playground-error">${escapeHtml(err instanceof Error ? err.message : String(err))}</pre>`
      );
    } finally {
      //setLoading(false);
      inFlight = false;
    }
  }

  const view = new EditorView({
    parent: editorMount,
    state: EditorState.create({
      doc: original,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        html(),
        oneDark,

        EditorView.lineWrapping,
        EditorView.editable.of(true),
      ],
    }),
  });
  run(); // one render on initial mount, not on every keystroke

  // copyBtn.addEventListener('click', async () => {
  //   await navigator.clipboard.writeText(view.state.doc.toString());
  // });

  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(view.state.doc.toString());

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
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: original },
    });

    run();
  });
}
