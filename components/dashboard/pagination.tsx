import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  /** Path the page links point at; the `page` query param is appended. */
  baseHref: string
}

/**
 * Server-component-safe pagination control with ellipsis collapsing.
 * Renders nothing when there is only one page.
 */
export default function Pagination({ currentPage, totalPages, baseHref }: PaginationProps) {
  if (totalPages <= 1) return null

  const href = (page: number) => `${baseHref}?page=${page}`

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-6">
      {currentPage > 1 && (
        <Link
          href={href(currentPage - 1)}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:border-eeg-blue-500 hover:text-eeg-blue-700 transition-colors"
        >
          ← Previous
        </Link>
      )}

      {pages.map((item, idx) =>
        item === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-neutral-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              item === currentPage
                ? 'bg-eeg-blue-600 text-white'
                : 'border border-neutral-300 text-neutral-700 hover:border-eeg-blue-500 hover:text-eeg-blue-700'
            }`}
          >
            {item}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link
          href={href(currentPage + 1)}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:border-eeg-blue-500 hover:text-eeg-blue-700 transition-colors"
        >
          Next →
        </Link>
      )}
    </nav>
  )
}
