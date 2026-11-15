import type { ReactNode } from 'react';
import { formatINR, type Product } from '../core/types.ts';
import { ProductArt, Swatch } from './art.tsx';
import { Stars } from './icons.tsx';
import { Link } from './Link.tsx';

export const percentOff = (p: { price: number; mrp: number }) => Math.round(((p.mrp - p.price) / p.mrp) * 100);

const COUNT = new Intl.NumberFormat('en-IN');
export const count = (n: number) => COUNT.format(n);
export const plural = (n: number, one: string, many = `${one}s`) => `${count(n)} ${n === 1 ? one : many}`;

export function Price({ product, size = 'md' }: { product: Pick<Product, 'price' | 'mrp'>; size?: 'md' | 'lg' }) {
  const off = percentOff(product);
  return (
    <p className={`price price-${size}`}>
      <span className="price-now">{formatINR(product.price)}</span>
      {off > 0 && (
        <>
          {' '}
          <span className="price-mrp">
            M.R.P. <s>{formatINR(product.mrp)}</s>
          </span>{' '}
          <span className="price-off">{off}% off</span>
        </>
      )}
    </p>
  );
}

export function Rating({ product, long = false }: { product: Pick<Product, 'rating' | 'ratingCount'>; long?: boolean }) {
  return (
    <p className="rating">
      <Stars rating={product.rating} />
      <span className="rating-value">{product.rating.toFixed(1)}</span>
      <span className="rating-count">{long ? `${count(product.ratingCount)} ratings` : `(${count(product.ratingCount)})`}</span>
    </p>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const off = percentOff(product);
  return (
    <article className="product-card" data-product-id={product.id}>
      <div className="product-card-media">
        <ProductArt category={product.category} colour={product.colours[0] ?? 'black'} />
        {!product.inStock ? <span className="badge badge-muted">Out of stock</span> : off >= 30 ? <span className="badge badge-deal">Deal</span> : null}
      </div>
      <div className="product-card-body">
        <p className="product-card-brand">{product.brand}</p>
        <h3 className="product-card-name">
          <Link href={`/product/${encodeURIComponent(product.id)}`}>{product.name}</Link>
        </h3>
        <Rating product={product} />
        <Price product={product} />
        <p className="product-card-colours">
          <span className="swatches">
            {product.colours.map((c) => (
              <Swatch key={c} colour={c} />
            ))}
          </span>
          {plural(product.colours.length, 'colour')}
        </p>
      </div>
    </article>
  );
}

export function ProductGrid({ products, row = false }: { products: Product[]; row?: boolean }) {
  return (
    <ul className={row ? 'product-row' : 'product-grid'} role="list">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

export function GridSkeleton({ cards = 8, row = false }: { cards?: number; row?: boolean }) {
  return (
    <div className={row ? 'product-row' : 'product-grid'} aria-busy="true">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-art" />
          <div className="skeleton skeleton-line" style={{ width: '40%' }} />
          <div className="skeleton skeleton-line" style={{ width: '85%' }} />
          <div className="skeleton skeleton-line" style={{ width: '55%' }} />
        </div>
      ))}
    </div>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <p className="loading" role="status">
      <span className="spinner" />
      {label}…
    </p>
  );
}

/** A friendly full-width message: empty cart, nothing found, not found. */
export function EmptyState({ title, children, art, heading = 'h1' }: { title: string; children?: ReactNode; art?: ReactNode; heading?: 'h1' | 'h2' }) {
  const H = heading;
  return (
    <div className="empty">
      {art && <div className="empty-art">{art}</div>}
      <H className="empty-title">{title}</H>
      {children}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="form-error" role="alert">
      {children}
    </p>
  );
}
