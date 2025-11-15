export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawName, ...rest] = part.split('=');
    if (!rawName) {
      return acc;
    }
    const name = rawName.trim();
    const value = rest.join('=').trim();
    if (name.length === 0) {
      return acc;
    }
    acc[name] = decodeURIComponent(value);
    return acc;
  }, {});
}

export function getCookie(cookieHeader: string | undefined, name: string) {
  return parseCookies(cookieHeader)[name];
}
