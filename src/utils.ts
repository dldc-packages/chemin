/**
 * Split a pathname and prevent empty parts
 * Accepts a string and returns an array of strings.
 *
 * ```ts
 * splitPathname("/admin/user/5"); // ['admin', 'user', '5']
 * ```
 *
 * Not that all match* functions will do this automatically.
 * You only need this function if you want to avoid splitting multiple times.
 *
 * @param pathname
 * @returns
 */
export function splitPathname(pathname: string): Array<string> {
  const strParts = pathname.split("/");
  if (strParts[0] === "") {
    strParts.shift();
  }
  if (strParts[strParts.length - 1] === "") {
    strParts.pop();
  }
  return strParts;
}
