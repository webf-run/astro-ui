import { extractTags, stripTags } from '../core';

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2';

const VARIANTS: Record<string, string> = {
  primary: 'bg-orange-400 text-black',
  secondary: 'bg-white text-purple-700 border border-purple-200',
  success: 'bg-transparent border border-white text-white',
  purple:
    'bg-purple-800 text-white border border-purple-200 rounded-md text-sm transition',
  blackwhite: 'bg-white text-gray-600 text-sm border border-gray-300',
};

const SIZES: Record<string, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-[14px]',
  lg: 'px-8 py-4 text-lg',
};

const DISABLED_CLASSES = 'opacity-50 cursor-not-allowed pointer-events-none';

export function renderButtons(code: string): HTMLElement[] {
  return extractTags(code, 'Button').map(({ attrs, inner }) => {
    const variant =
      typeof attrs.variant === 'string' && VARIANTS[attrs.variant]
        ? attrs.variant
        : 'primary';
    const size =
      typeof attrs.size === 'string' && SIZES[attrs.size] ? attrs.size : 'md';
    const type = typeof attrs.type === 'string' ? attrs.type : 'button';
    const disabled = attrs.disabled === true || attrs.disabled === 'true';
    const loading = attrs.loading === true || attrs.loading === 'true';
    const href = typeof attrs.href === 'string' ? attrs.href : undefined;

    const classes = [
      BASE_CLASSES,
      VARIANTS[variant],
      SIZES[size],
      disabled || loading ? DISABLED_CLASSES : '',
    ]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const text = loading ? 'Loading...' : stripTags(inner) || 'Button';

    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.className = classes;
      a.setAttribute('aria-disabled', String(disabled));
      a.textContent = text;
      return a;
    }

    const button = document.createElement('button');
    button.type = (type as 'button' | 'submit' | 'reset') || 'button';
    button.disabled = disabled || loading;
    button.className = classes;
    button.textContent = text;

    if (typeof attrs.style === 'string') {
      button.style.cssText = attrs.style;
    }

    // Handle showIcon prop
    const showIcon = attrs.showIcon === true || attrs.showIcon === 'true';

    if (showIcon) {
      const arrow = document.createElement('span');
      arrow.textContent = '→';
      arrow.className = 'playground-button-icon';

      button.appendChild(arrow);
    }
    return button;
  });
}
