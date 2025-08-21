/** 修正html包a的alt值
 * 注:為了AA檢測，若包A的img也有alt說明，需把內層的alt值清空
 * @param html 
 * @returns 
 */
export function fixNestedAltInAnchor(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const anchors = doc.querySelectorAll('a[alt]');
  anchors.forEach(anchor => {
    const nestedAltTags = anchor.querySelectorAll('[alt]');
    nestedAltTags.forEach(child => {
      if (child !== anchor) {
        child.setAttribute('alt', '');
      }
    });
  });
  return doc.body.innerHTML;
}