import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400">/</span>
            )}
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="text-eeg-blue-electric hover:text-eeg-blue-600 font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className={index === items.length - 1 ? 'text-gray-900 font-semibold' : 'text-gray-600'}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

