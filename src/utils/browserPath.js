export const pathSeparator = '/';

export function normalizePath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/').replace(/\/+/g, '/');
}

export function joinPath(...parts) {
  return normalizePath(parts.filter(Boolean).join(pathSeparator));
}
