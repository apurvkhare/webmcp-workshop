import type { ShopApp } from '../../client/shop.ts';
import { searchPath } from '../../client/shop.ts';
import { CATEGORIES, type Product } from '../../core/types.ts';
import { CATEGORY_COLOURS, CATEGORY_LABELS, ProductArt } from '../art.tsx';
import { GridSkeleton, ProductGrid, percentOff } from '../components.tsx';
import { useLoad, useTitle } from '../hooks.ts';
import { ArrowRightIcon, ReturnIcon, ShieldIcon, TagIcon, TruckIcon } from '../icons.tsx';
import { Link } from '../Link.tsx';

interface Rows {
  topRated: Product[];
  deals: Product[];
  counts: Map<string, number>;
}

export function HomePage({ shop }: { shop: ShopApp }) {
  useTitle('');
  const { data, error } = useLoad<Rows>(async () => {
    const all = await shop.searchProducts({});
    const inStock = all.filter((p) => p.inStock);
    const topRated = [...inStock].sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount).slice(0, 8);
    const deals = [...inStock].sort((a, b) => percentOff(b) - percentOff(a) || b.ratingCount - a.ratingCount).slice(0, 8);
    const counts = new Map<string, number>();
    for (const p of all) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return { topRated, deals, counts };
  }, []);

  return (
    <div className="home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            Good gear for <span className="hero-accent">namma</span> city.
          </h1>
          <p className="hero-lede">Headphones, keyboards, chargers and watches at fair prices, delivered across Bengaluru in a slot that suits you.</p>
          <div className="hero-actions">
            <Link href={searchPath({ category: 'headphones' })} className="btn btn-primary btn-lg">
              Shop headphones
              <ArrowRightIcon size={18} />
            </Link>
            <Link href="/search" className="btn btn-lg btn-on-dark">
              Browse everything
            </Link>
          </div>
          <p className="hero-coupon">
            <TagIcon size={18} />
            <span>
              Use <code>DEVFEST10</code> for 10% off, up to ₹500
            </span>
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <ProductArt category="headphones" colour="white" className="hero-tile hero-tile-a" />
          <ProductArt category="smartwatches" colour="gold" className="hero-tile hero-tile-b" />
          <ProductArt category="speakers" colour="coral" className="hero-tile hero-tile-c" />
        </div>
      </section>

      <ul className="promises" role="list">
        <li>
          <TruckIcon size={22} />
          <span>
            <strong>Free delivery</strong> on orders from ₹999
          </span>
        </li>
        <li>
          <ShieldIcon size={22} />
          <span>
            <strong>Pay on delivery</strong>, cash or UPI
          </span>
        </li>
        <li>
          <ReturnIcon size={22} />
          <span>
            <strong>7-day returns</strong> on everything
          </span>
        </li>
      </ul>

      <section className="home-section" aria-labelledby="categories-title">
        <div className="section-head">
          <h2 id="categories-title">Shop by category</h2>
        </div>
        <ul className="category-tiles" role="list">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link href={searchPath({ category: c })} className="category-tile">
                <ProductArt category={c} colour={CATEGORY_COLOURS[c]} />
                <span className="category-tile-name">{CATEGORY_LABELS[c]}</span>
                {data && <span className="category-tile-count">{data.counts.get(c) ?? 0} products</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="home-section" aria-labelledby="top-title">
        <div className="section-head">
          <h2 id="top-title">Top rated</h2>
          <Link href={searchPath({ sort: 'rating', minRating: 4.5 })} className="section-more">
            See all 4.5 and up
            <ArrowRightIcon size={16} />
          </Link>
        </div>
        {data ? <ProductGrid row products={data.topRated} /> : <GridSkeleton row cards={5} />}
      </section>

      <section className="home-section" aria-labelledby="deals-title">
        <div className="section-head">
          <h2 id="deals-title">Deals</h2>
          <p className="section-note">The biggest markdowns on M.R.P. this week</p>
        </div>
        {data ? <ProductGrid row products={data.deals} /> : <GridSkeleton row cards={5} />}
      </section>
    </div>
  );
}
