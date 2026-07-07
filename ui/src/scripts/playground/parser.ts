export type ParsedValue = string | boolean;

export interface ParsedNode {
  component: string;
  props: Record<string, ParsedValue>;
  children: string;
}

const ATTR_REGEX = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}))?/g;

export function parseProps(attrString: string): Record<string, ParsedValue> {
  const props: Record<string, ParsedValue> = {};

  let match: RegExpExecArray | null;

  while ((match = ATTR_REGEX.exec(attrString)) !== null) {
    const key = match[1];

    if (!key || key === '/') continue;

    if (match[2] !== undefined) {
      props[key] = match[2];
    } else if (match[3] !== undefined) {
      props[key] = match[3];
    } else if (match[4] !== undefined) {
      props[key] = match[4].replace(/^['"]|['"]$/g, '');
    } else {
      props[key] = true;
    }
  }

  return props;
}

export function parseComponent(code: string, component: string): ParsedNode[] {
  const regex = new RegExp(
    `<${component}([^>]*)>([\\s\\S]*?)<\\/${component}>|<${component}([^>]*)\\/>`,
    'g'
  );

  const components: ParsedNode[] = [];

  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    const attrs = match[1] || match[3] || '';

    const children = match[2] || '';

    components.push({
      component,
      props: parseProps(attrs),
      children,
    });
  }

  return components;
}

export function stripTags(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
