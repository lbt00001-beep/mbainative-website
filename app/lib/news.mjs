/** @template {{ pubDate: string, link: string, relevance?: number }} T
 * @param {T[]} items
 * @param {number} [now]
 * @returns {T[]}
 */
export function recentNews(items, now = Date.now()) {
  const earliest = now - 21 * 24 * 60 * 60 * 1000;
  const links = new Set();
  return items.filter(item => {
    const date = Date.parse(item.pubDate);
    if (!Number.isFinite(date) || date < earliest || date > now || links.has(item.link) || !/^https?:\/\//i.test(item.link)) return false;
    links.add(item.link);
    return true;
  }).sort((a,b) => Date.parse(b.pubDate) - Date.parse(a.pubDate) || (b.relevance || 0) - (a.relevance || 0));
}
