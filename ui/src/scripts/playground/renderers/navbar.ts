import { extractTags } from '../core';

function getStringProp(
  attrs: Record<string, string | boolean>,
  key: string,
  fallback = ''
) {
  const value = attrs[key];

  return typeof value === 'string' ? value : fallback;
}

function hasBooleanProp(attrs: Record<string, string | boolean>, key: string) {
  return attrs[key] === true || attrs[key] === 'true';
}

function extractLinks(code: string) {
  const match = code.match(/links=\{\[([\s\S]*?)\]\}/);

  if (!match) return [];

  const arrayText = match[1];

  const itemRegex = /\{\s*label:\s*"([^"]+)"\s*,\s*href:\s*"([^"]+)"\s*\}/g;

  const links = [];

  let item;

  while ((item = itemRegex.exec(arrayText)) !== null) {
    links.push({
      label: item[1],
      href: item[2],
    });
  }

  return links;
}

export function renderNavbar(code: string): HTMLElement[] {
  const parsed = extractTags(code, 'Navbar');

  if (!parsed.length) return [];

  return parsed.map(({ attrs }) => {
    const nav = document.createElement('nav');

    nav.style.display = 'flex';
    nav.style.alignItems = 'center';
    nav.style.justifyContent = 'space-between';
    nav.style.padding = '14px 20px';
    nav.style.border = '1px solid #e5e7eb';
    nav.style.borderRadius = '10px';
    nav.style.fontFamily = 'Inter, sans-serif';
    nav.style.marginBottom = '12px';

    const transparent = hasBooleanProp(attrs, 'transparent');

    nav.style.background = transparent ? 'transparent' : '#ffffff';

    if (hasBooleanProp(attrs, 'sticky')) {
      nav.style.boxShadow = '0 2px 12px rgba(0,0,0,.08)';
    }

    if (hasBooleanProp(attrs, 'fixed')) {
      nav.style.border = '2px solid #6366f1';
    }

    // Logo

    const logo = document.createElement('div');

    logo.textContent = getStringProp(attrs, 'logo', 'Logo');

    logo.style.fontWeight = '700';
    logo.style.fontSize = '18px';

    // Links

    const linksContainer = document.createElement('div');

    linksContainer.style.display = 'flex';
    linksContainer.style.alignItems = 'center';
    linksContainer.style.gap = '24px';

    const links = extractLinks(code);

    if (links.length) {
      links.forEach((link) => {
        const a = document.createElement('a');

        a.href = link.href;
        a.textContent = link.label;

        a.style.color = '#374151';
        a.style.textDecoration = 'none';
        a.style.fontSize = '15px';

        linksContainer.appendChild(a);
      });
    } else {
      ['Home', 'Docs', 'Components'].forEach((text) => {
        const a = document.createElement('a');

        a.href = '#';
        a.textContent = text;

        a.style.color = '#374151';
        a.style.textDecoration = 'none';

        linksContainer.appendChild(a);
      });
    }

    nav.appendChild(logo);
    nav.appendChild(linksContainer);

    return nav;
  });
}
