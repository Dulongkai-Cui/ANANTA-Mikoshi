/** Public assets need an explicit deployment prefix; Next Link/router add it themselves. */
export function assetPath(path: string): string {
  return (process.env.NEXT_PUBLIC_MIKOSHI_BASE_PATH || "") + path;
}
