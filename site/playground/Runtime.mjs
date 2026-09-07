// A minimal, browser-only stand-in for Astro's real server runtime
// ("astro/runtime/server/index.js").
//
// Compiled .astro output imports these runtime functions. The playground
// provides the subset required to render Astro components to static HTML.
//
// This runtime intentionally does not attempt to implement Astro's complete
// server renderer. It only implements the behavior needed by the component
// playground.
//
// Important:
// - Supports normal `class` attributes.
// - Supports Astro `class:list`.
// - Supports nested class:list arrays and objects.
// - Supports Astro component factories.
// - Supports slots.
// - Supports spread attributes.
// - Provides no-op shims for head/script/transition APIs.

class HTMLString extends String {
  get [Symbol.toStringTag]() {
    return 'HTMLString';
  }
}

function markHTMLString(value) {
  if (value instanceof HTMLString) {
    return value;
  }

  if (typeof value === 'string') {
    return new HTMLString(value);
  }

  return value;
}

var unescapeHTML = markHTMLString;

function escapeHTML(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c]
  );
}

var Fragment = Symbol('Astro.Fragment');

/**
 * Converts values produced by compiled Astro templates into HTML.
 *
 * HTMLString values are trusted and therefore are not escaped.
 * Normal strings are escaped.
 */
async function toHtml(value) {
  if (value == null || value === false) {
    return '';
  }

  if (value instanceof HTMLString) {
    return value.toString();
  }

  if (value instanceof Promise) {
    return toHtml(await value);
  }

  if (Array.isArray(value)) {
    const parts = await Promise.all(value.map(toHtml));

    return parts.join('');
  }

  if (typeof value === 'string') {
    return escapeHTML(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return escapeHTML(String(value));
}

/**
 * Astro's compiled template helper.
 *
 * The Astro compiler generates calls similar to:
 *
 *   render`${...}`
 */
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

/**
 * Marks a function as an Astro component factory.
 */
function createComponent(factory, moduleId) {
  factory.isAstroComponentFactory = true;
  factory.moduleId = moduleId;

  return factory;
}

/**
 * Minimal createAstro implementation.
 */
function createAstro() {
  return {
    self: null,
  };
}

/**
 * Renders an Astro slot.
 */
async function renderSlot(result, slotted, fallback) {
  const source = slotted ?? fallback;

  if (!source) {
    return '';
  }

  const content = typeof source === 'function' ? await source() : source;

  return markHTMLString(await toHtml(content));
}

/**
 * Merges slot definitions.
 */
function mergeSlots(...slotted) {
  const slots = {};

  for (const slot of slotted) {
    if (!slot) {
      continue;
    }

    if (typeof slot === 'object') {
      Object.assign(slots, slot);
      continue;
    }

    if (typeof slot === 'function') {
      Object.assign(slots, mergeSlots(slot()));
    }
  }

  return slots;
}

/**
 * Normalizes component props in the same way Astro expects.
 *
 * Astro can pass both:
 *
 *   class="foo"
 *
 * and:
 *
 *   class:list={['bar', { active: true }]}
 *
 * to a component.
 *
 * When this happens, both values need to be combined into a single
 * `class` prop before the component receives its props.
 */
function normalizeProps(props = {}) {
  if (!props || typeof props !== 'object') {
    return {};
  }

  const normalized = { ...props };

  if ('class:list' in normalized) {
    const classList = serializeListValue(normalized['class:list']);
    const existingClass =
      normalized.class == null ? '' : String(normalized.class).trim();

    normalized.class = [existingClass, classList].filter(Boolean).join(' ');

    delete normalized['class:list'];
  }

  return normalized;
}

/**
 * Renders an Astro component factory.
 */
async function renderComponent(
  result,
  displayName,
  Component,
  props = {},
  slots = {}
) {
  if (Component === Fragment) {
    return renderSlot(result, slots.default);
  }

  if (Component == null) {
    return '';
  }

  if (typeof Component === 'function' && Component.isAstroComponentFactory) {
    const normalizedProps = normalizeProps(props);

    return markHTMLString(
      await toHtml(await Component(result, normalizedProps, slots ?? {}))
    );
  }

  /*
   * Native custom elements (Web Components), e.g. <wf-navbar-menu>.
   *
   * The real Astro compiler routes any hyphenated tag through
   * renderComponent - not just imported framework components - passing
   * the tag name itself as a plain string when there's no matching import.
   * Render it as an ordinary HTML element instead of throwing, so
   * progressive-enhancement custom elements preview correctly here.
   */
  if (typeof Component === 'string') {
    let attrs = '';

    for (const [key, value] of Object.entries(props ?? {})) {
      attrs += String(addAttribute(value, key));
    }

    const children = await renderSlot(result, slots?.default);

    return markHTMLString(`<${Component}${attrs}>${children}</${Component}>`);
  }

  throw new Error(
    `"${displayName}" can't be rendered in the playground preview yet - only Astro (.astro) components are supported, not framework (React/Vue/Svelte) components.`
  );
}

/**
 * Escapes an HTML attribute value.
 */
function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Converts an Astro `class:list` value into a normal class string.
 *
 * Supported values:
 *
 *   class:list="foo bar"
 *
 *   class:list={['foo', 'bar']}
 *
 *   class:list={['foo', { active: true }]}
 *
 *   class:list={[
 *     'foo',
 *     ['bar', 'baz'],
 *     { active: true, disabled: false },
 *   ]}
 *
 * The behavior intentionally mirrors the useful subset of Astro's
 * class:list semantics and clsx-style flattening.
 */
function serializeListValue(value) {
  const classes = new Set();

  const collect = (item) => {
    if (item == null || item === false) {
      return;
    }

    /*
     * Nested arrays.
     */
    if (Array.isArray(item)) {
      item.forEach(collect);
      return;
    }

    /*
     * Object syntax:
     *
     * {
     *   active: true,
     *   disabled: false
     * }
     */
    if (typeof item === 'object') {
      for (const [key, enabled] of Object.entries(item)) {
        if (enabled) {
          collect(key);
        }
      }

      return;
    }

    /*
     * Strings and other primitive values.
     *
     * Split whitespace so:
     *
     * "px-4 py-2 text-sm"
     *
     * becomes three individual classes.
     */
    const stringValue = String(item).trim();

    if (!stringValue) {
      return;
    }

    stringValue.split(/\s+/).forEach((className) => {
      if (className) {
        classes.add(className);
      }
    });
  };

  collect(value);

  return [...classes].join(' ');
}

/**
 * Adds a normal HTML attribute.
 *
 * Astro's compiler represents:
 *
 *   class:list={...}
 *
 * using:
 *
 *   addAttribute(value, 'class:list')
 *
 * so it must be converted to:
 *
 *   class="..."
 *
 * before the result reaches the iframe.
 */
function addAttribute(value, key) {
  if (key === 'class:list') {
    const classString = serializeListValue(value);

    if (!classString) {
      return '';
    }

    return markHTMLString(` class="${escapeAttr(classString)}"`);
  }

  /*
   * Astro boolean/null attributes.
   */
  if (value == null || value === false) {
    return '';
  }

  if (value === true) {
    return markHTMLString(` ${key}`);
  }

  return markHTMLString(` ${key}="${escapeAttr(value)}"`);
}

/**
 * Handles Astro spread attributes:
 *
 *   {...props}
 */
function spreadAttributes(values = {}) {
  let out = '';

  for (const [key, value] of Object.entries(values)) {
    out += addAttribute(value, key);
  }

  return markHTMLString(out);
}

/**
 * Astro head helpers.
 *
 * The playground renders component markup only, so these are intentionally
 * no-ops.
 */
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

/**
 * Astro style variable helper.
 */
function defineStyleVars(_selector, vars = {}) {
  return markHTMLString(
    Object.entries(vars)
      .map(([key, value]) => `--${key}: ${JSON.stringify(value)};`)
      .join(' ')
  );
}

/**
 * Astro script-variable helper.
 */
function defineScriptVars(vars = {}) {
  return Object.entries(vars)
    .map(([key, value]) => `const ${key} = ${JSON.stringify(value)};`)
    .join('\n');
}

/**
 * Metadata helper.
 */
function createMetadata(modId, opts) {
  return {
    modId,
    ...opts,
  };
}

/**
 * Creates the minimal Astro render result object.
 */
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

/**
 * Entry point used by the playground compiler.
 *
 * Takes a compiled Astro component factory and renders it into an HTML
 * string suitable for iframe.srcdoc.
 */
async function renderComponentToStaticHTML(
  componentFactory,
  props = {},
  slots = {}
) {
  if (typeof componentFactory !== 'function') {
    throw new Error(
      'The compiled Astro module does not export a renderable component.'
    );
  }

  const result = createResult();

  const output = await componentFactory(result, normalizeProps(props), slots);

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
  normalizeProps,
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
