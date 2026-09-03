export function previewSrcSet(entry, resolve = (url) => url) {
  if (!entry.thumbnailSmall || !entry.thumbnailWidth) return undefined;
  const candidates = new Map([
    [entry.thumbnailSmallWidth, entry.thumbnailSmall],
    [entry.thumbnailWidth, entry.thumbnail],
  ]);
  return [...candidates].sort(([a], [b]) => a - b)
    .map(([width, url]) => `${resolve(url)} ${width}w`).join(", ");
}
