import { ProductArt } from '../art.tsx';
import { EmptyState } from '../components.tsx';
import { useTitle } from '../hooks.ts';
import { Link } from '../Link.tsx';

export function NotFoundPage({ title = 'This page took a wrong turn', detail }: { title?: string; detail?: string }) {
  useTitle('Not found');
  return (
    <EmptyState title={title} art={<ProductArt category="speakers" colour="silver" />}>
      <p>{detail ?? 'There is nothing at this address. The link may be old, or it may have a typo.'}</p>
      <p className="empty-actions">
        <Link href="/" className="btn btn-primary">
          Go to the home page
        </Link>
        <Link href="/search" className="btn">
          Browse all products
        </Link>
      </p>
    </EmptyState>
  );
}
