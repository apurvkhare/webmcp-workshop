import type { ShopApp } from '../../client/shop.ts';
import { searchPath } from '../../client/shop.ts';
import { CATEGORIES, SORT_ORDERS, formatINR, type Category, type SearchFilters, type SortOrder } from '../../core/types.ts';
import { CATEGORY_LABELS, ProductArt } from '../art.tsx';
import { EmptyState, GridSkeleton, ProductGrid, plural } from '../components.tsx';
import { useLoad, useTitle } from '../hooks.ts';
import { Link } from '../Link.tsx';
import { navigate, useLocation } from '../router.ts';

const PRICE_MIN = 500;
const PRICE_MAX = 15000;

const SORT_LABELS: Record<SortOrder, string> = {
  relevance: 'Relevance',
  'price-low': 'Price: low to high',
  'price-high': 'Price: high to low',
  rating: 'Customer rating'
};

/** The URL is the single source of truth for the filters. */
function readFilters(params: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};
  const query = params.get('query')?.trim();
  if (query) filters.query = query;
  const category = params.get('category');
  if (CATEGORIES.includes(category as Category)) filters.category = category as Category;
  const maxPrice = Number(params.get('maxPrice') ?? NaN);
  if (params.get('maxPrice') && Number.isFinite(maxPrice)) filters.maxPrice = maxPrice;
  const minRating = Number(params.get('minRating') ?? NaN);
  if (params.get('minRating') && Number.isFinite(minRating)) filters.minRating = minRating;
  const sort = params.get('sort');
  if (SORT_ORDERS.includes(sort as SortOrder)) filters.sort = sort as SortOrder;
  return filters;
}

export function SearchPage({ shop, version }: { shop: ShopApp; version: number }) {
  const { params } = useLocation();
  const filters = readFilters(params);
  const key = searchPath(filters);
  const { data, error, loading } = useLoad(() => shop.searchProducts(filters), [key, version]);

  const heading = filters.query ? `Results for “${filters.query}”` : filters.category ? CATEGORY_LABELS[filters.category] : 'All products';
  useTitle(heading);

  const change = (patch: Partial<SearchFilters>, replace = false) => {
    const next: SearchFilters = { ...filters, ...patch };
    for (const k of Object.keys(next) as (keyof SearchFilters)[]) if (next[k] === undefined) delete next[k];
    navigate(searchPath(next), { replace, scroll: false });
  };

  const priceValue = filters.maxPrice === undefined ? PRICE_MAX : Math.min(PRICE_MAX, Math.max(PRICE_MIN, filters.maxPrice));
  const hasFilters = filters.category !== undefined || filters.maxPrice !== undefined || filters.minRating !== undefined || filters.sort !== undefined;

  return (
    <div className="search-page">
      <div className="page-head">
        <h1>{heading}</h1>
        <p className="result-count" aria-live="polite">
          {data ? `${plural(data.length, 'product')}${filters.query && filters.category ? ` in ${CATEGORY_LABELS[filters.category]}` : ''}` : loading ? 'Searching…' : ''}
        </p>
      </div>

      <div className="search-layout">
        <aside className="filters-panel" aria-labelledby="filters-title">
          <h2 id="filters-title" className="filters-title">
            Filters
          </h2>
          <form id="filters" className="form filters" onSubmit={(e) => e.preventDefault()}>
            <div className="field">
              <label htmlFor="filter-category">Category</label>
              <select id="filter-category" name="category" value={filters.category ?? ''} onChange={(e) => change({ category: (e.target.value || undefined) as Category | undefined })}>
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="field-label-row">
                <label htmlFor="filter-price">Max price</label>
                <output htmlFor="filter-price" className="range-output">
                  {filters.maxPrice === undefined ? 'No limit' : `Up to ${formatINR(priceValue)}`}
                </output>
              </div>
              <input
                id="filter-price"
                type="range"
                name="maxPrice"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={500}
                value={priceValue}
                // Dragging replaces the history entry, so Back doesn't step through every notch.
                onChange={(e) => {
                  const value = Number(e.target.value);
                  change({ maxPrice: value >= PRICE_MAX ? undefined : value }, true);
                }}
              />
              <div className="range-ends" aria-hidden="true">
                <span>{formatINR(PRICE_MIN)}</span>
                <span>No limit</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="filter-rating">Customer rating</label>
              <select
                id="filter-rating"
                name="minRating"
                value={filters.minRating === undefined ? '' : String(filters.minRating)}
                onChange={(e) => change({ minRating: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Any rating</option>
                <option value="3">3 stars and up</option>
                <option value="4">4 stars and up</option>
                <option value="4.5">4.5 stars and up</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="filter-sort">Sort by</label>
              <select id="filter-sort" name="sort" value={filters.sort ?? 'relevance'} onChange={(e) => change({ sort: e.target.value === 'relevance' ? undefined : (e.target.value as SortOrder) })}>
                {SORT_ORDERS.map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <button type="button" className="btn btn-block" disabled={!hasFilters} onClick={() => navigate(searchPath(filters.query ? { query: filters.query } : {}), { scroll: false })}>
              Clear filters
            </button>
          </form>
        </aside>

        <section className="results" aria-label="Results" aria-busy={loading}>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : !data ? (
            <GridSkeleton />
          ) : data.length === 0 ? (
            <EmptyState heading="h2" title="Nothing matches those filters" art={<ProductArt category="headphones" colour="silver" />}>
              <p>Try a shorter search, a higher price limit or a lower rating.</p>
              <p className="empty-actions">
                {hasFilters && (
                  <button type="button" className="btn" onClick={() => navigate(searchPath(filters.query ? { query: filters.query } : {}), { scroll: false })}>
                    Clear filters
                  </button>
                )}
                <Link href="/search" className="btn btn-primary">
                  See all products
                </Link>
              </p>
            </EmptyState>
          ) : (
            <div className={loading ? 'results-stale' : undefined}>
              <ProductGrid products={data} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
