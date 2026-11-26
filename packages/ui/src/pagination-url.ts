export interface PageParams {
  page: number
  size: number
}

export const DEFAULT_SIZE_OPTIONS = [10, 25, 50]

/** Reads the standard `?page=&size=` query. Unknown sizes fall back to the first allowed option. */
export function readPaginationFromUrl(
  search: string = window.location.search,
  sizeOptions: number[] = DEFAULT_SIZE_OPTIONS,
): PageParams {
  const q = new URLSearchParams(search)
  const page = Math.max(1, Math.floor(Number(q.get('page'))) || 1)
  const size = Number(q.get('size'))
  return { page, size: sizeOptions.includes(size) ? size : sizeOptions[0] }
}

/** Writes `?page=&size=` (keeping other params) as a new history entry. */
export function writePaginationToUrl({ page, size }: PageParams): void {
  const url = new URL(window.location.href)
  url.searchParams.set('page', String(page))
  url.searchParams.set('size', String(size))
  window.history.pushState(window.history.state, '', url)
}
