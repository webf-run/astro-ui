// A minimal, browser-only stand-in for Astro's real server runtime
// ("astro/runtime/server/index.js"). Compiled .astro output imports these
// symbols; we provide just enough of them to render a component to a static
// HTML string in the playground iframe. Kept as plain .js (no types) so it
// mirrors the shape of the module it substitutes for.
//
// Exports fall into two groups:
//   - Real behavior: toHtml, render, renderComponent, renderSlot,
//     addAttribute, spreadAttributes, createComponent, createResult, etc.
//   - No-op shims (present only so imports resolve): maybeRenderHead,
//     renderHead, renderScript, renderTransition, createTransitionScope.
class HTMLString extends String {
  get [Symbol.toStringTag]() {
    return 'HTMLString';
  }
}

function markHTMLString(value) {
  if (value instanceof HTMLString) return value;
  if (typeof value === 'string') return new HTMLString(value);
  return value;
}

var unescapeHTML = markHTMLString;

function escapeHTML(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]
  );
}

var Fragment = Symbol('Astro.Fragment');

async function toHtml(value) {
  if (value == null || value === false) return '';
  if (value instanceof HTMLString) return value.toString();
  if (value instanceof Promise) return toHtml(await value);
  if (Array.isArray(value)) {
    const parts = await Promise.all(value.map(toHtml));
    return parts.join('');
  }
  if (typeof value === 'string') return escapeHTML(value);
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return escapeHTML(String(value));
}

function render(strings, ...values) {
  return (async () => {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) {
      out += await toHtml(values[i]);
      out += strings[i + 1];
    }
    return markHTMLString(out);
  })();
}

function createComponent(factory, moduleId) {
  factory.isAstroComponentFactory = true;
  factory.moduleId = moduleId;
  return factory;
}

function createAstro() {
  return { self: null };
}

async function renderSlot(result, slotted, fallback) {
  const source = slotted ?? fallback;
  if (!source) return '';
  const content = typeof source === 'function' ? await source() : source;
  return markHTMLString(await toHtml(content));
}

function mergeSlots(...slotted) {
  const slots = {};
  for (const slot of slotted) {
    if (!slot) continue;
    if (typeof slot === 'object') Object.assign(slots, slot);
    else if (typeof slot === 'function')
      Object.assign(slots, mergeSlots(slot()));
  }
  return slots;
}

async function renderComponent(
  result,
  displayName,
  Component,
  props = {},
  slots = {}
) {
  if (Component === Fragment) return renderSlot(result, slots.default);
  if (Component == null) return '';
  if (typeof Component === 'function' && Component.isAstroComponentFactory) {
    return markHTMLString(
      await toHtml(await Component(result, props ?? {}, slots ?? {}))
    );
  }
  throw new Error(
    `"${displayName}" can't be rendered in the playground preview yet - only Astro (.astro) components are supported, not framework (React/Vue/Svelte) components.`
  );
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function addAttribute(value, key) {
  if (value == null || value === false) return '';
  if (value === true) return markHTMLString(` ${key}`);
  return markHTMLString(` ${key}="${escapeAttr(value)}"`);
}

function spreadAttributes(values = {}) {
  let out = '';
  for (const [k, v] of Object.entries(values)) out += addAttribute(v, k);
  return markHTMLString(out);
}

function maybeRenderHead() {
  return '';
}

function renderHead() {
  return '';
}

function renderScript() {
  return '';
}

function renderTransition() {
  return '';
}

function createTransitionScope(_result, hash) {
  return hash ?? '';
}

function defineStyleVars(_selector, vars = {}) {
  return markHTMLString(
    Object.entries(vars)
      .map(([k, v]) => `--${k}: ${JSON.stringify(v)};`)
      .join(' ')
  );
}

function defineScriptVars(vars = {}) {
  return Object.entries(vars)
    .map(([k, v]) => `const ${k} = ${JSON.stringify(v)};`)
    .join('\n');
}

function createMetadata(modId, opts) {
  return { modId, ...opts };
}

function createResult() {
  const result = {
    styles: /* @__PURE__ */ new Set(),
    scripts: /* @__PURE__ */ new Set(),
    links: /* @__PURE__ */ new Set(),
  };
  result.createAstro = (props, slots) => ({
    props,
    self: null,
    slots: {
      has: (name) => Boolean(slots && slots[name]),
      render: (name) => renderSlot(result, slots && slots[name]),
    },
  });
  return result;
}

async function renderComponentToStaticHTML(
  componentFactory,
  props = {},
  slots = {}
) {
  const result = createResult();
  const output = await componentFactory(result, props, slots);
  return toHtml(output);
}

export {
  Fragment,
  addAttribute,
  createAstro,
  createComponent,
  createMetadata,
  createResult,
  createTransitionScope,
  defineScriptVars,
  defineStyleVars,
  markHTMLString,
  maybeRenderHead,
  mergeSlots,
  render,
  renderComponent,
  renderComponentToStaticHTML,
  renderHead,
  renderScript,
  renderSlot,
  renderTransition,
  spreadAttributes,
  unescapeHTML,
};
