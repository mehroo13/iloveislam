import Link from 'next/link';

export default function Breadcrumbs({ items }: { items: Array<{ name: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-4 sm:px-6 pt-2">
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        {items.map((it, i) => (
          <li key={i} className={i === items.length - 1 ? 'text-gray-700 dark:text-gray-300' : ''} aria-current={i === items.length - 1 ? 'page' : undefined}>
            {it.href && i !== items.length - 1 ? (
              <Link href={it.href} className="hover:underline">
                {it.name}
              </Link>
            ) : (
              <span>{it.name}</span>
            )}
            {i !== items.length - 1 && <span className="mx-2" aria-hidden>•</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
