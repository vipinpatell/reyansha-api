export function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  const entry = header
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!entry) {
    return undefined;
  }
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    return undefined;
  }
}
