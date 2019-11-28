export const CheminUtils = {
  splitPathname
};

function splitPathname(pathname: string): Array<string> {
  const strParts = pathname.split('/');
  if (strParts[0] === '') {
    strParts.shift();
  }
  if (strParts[strParts.length - 1] === '') {
    strParts.pop();
  }
  return strParts;
}
