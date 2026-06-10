export const toTitleCase = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (match) => match.toUpperCase());

export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const normalizeMarkdown = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    // Fix one-line pasted GFM tables: "| a | b | |---|---| | c | d |"
    .replace(/\|\s+\|(?=(?:-+:?|:?-+|[A-Za-z0-9"']))/g, '|\n|')
    .replace(/([^\n])\n-\s+/g, '$1\n\n- ')
    .replace(/([^\n])\n\*\s+/g, '$1\n\n- ');

export const getPathValue = (source: Record<string, any> | null, path: string[]) =>
  path.reduce<any>((acc, key) => acc?.[key], source);
