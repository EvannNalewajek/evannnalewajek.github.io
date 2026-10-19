export function slugify(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeImg(path: string | null | undefined, fallback = ''): string {
  if (!path) return fallback;
  return path.startsWith('/') ? path : `/${path}`;
}
