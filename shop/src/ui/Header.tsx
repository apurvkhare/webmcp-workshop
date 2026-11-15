import { useEffect, useState, type FormEvent } from 'react';
import type { ShopApp, ShopState } from '../client/shop.ts';
import { searchPath } from '../client/shop.ts';
import { CATEGORIES } from '../core/types.ts';
import { CATEGORY_LABELS } from './art.tsx';
import { plural } from './components.tsx';
import { errorMessage } from './hooks.ts';
import { BagIcon, SearchIcon, TruckIcon, UserIcon } from './icons.tsx';
import { Link } from './Link.tsx';
import { navigate, useLocation } from './router.ts';

export function Logo() {
  return (
    <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="11" fill="#ffc23d" />
      {/* An N whose middle stroke is a rising path: a shop sign and a road at once. */}
      <path d="M12 29V11l16 18V11" fill="none" stroke="#14213d" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Header({ shop, state }: { shop: ShopApp; state: ShopState }) {
  const { pathname, params } = useLocation();
  const urlQuery = pathname === '/search' ? (params.get('query') ?? '') : '';
  const [query, setQuery] = useState(urlQuery);
  const [problem, setProblem] = useState('');
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const activeCategory = pathname === '/search' ? params.get('category') : null;
  const items = state.cart.itemCount;

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = query.trim();
    navigate(searchPath(text ? { query: text } : {}));
  }

  async function signOut() {
    try {
      setProblem('');
      await shop.signOut();
    } catch (error) {
      setProblem(errorMessage(error));
    }
  }

  const firstName = state.user?.name.split(' ')[0] ?? '';
  const signInHref = pathname === '/signin' ? '/signin' : `/signin?next=${encodeURIComponent(pathname + (params.size ? `?${params}` : ''))}`;

  return (
    <header className="site-header">
      <div className="header-main">
        <div className="wrap header-row">
          <Link href="/" className="brand" aria-label="Namma Bazaar, home">
            <Logo />
            <span className="brand-text">
              <span className="brand-name">Namma Bazaar</span>
              <span className="brand-tag">Bengaluru’s gadget market</span>
            </span>
          </Link>

          <form role="search" className="site-search" onSubmit={onSearch}>
            <input
              type="search"
              id="site-search"
              name="query"
              aria-label="Search products"
              placeholder="Search headphones, chargers, keyboards…"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="site-search-button">
              <SearchIcon size={20} />
              <span>Search</span>
            </button>
          </form>

          <nav className="header-actions" aria-label="Account and cart">
            {state.user ? (
              <div className="account">
                <UserIcon size={22} className="account-icon" />
                <div className="account-text">
                  <span className="account-hello">
                    Hi, <strong>{firstName}</strong>
                  </span>
                  <span className="account-links">
                    <Link href="/orders" className="header-link">
                      Orders
                    </Link>
                    <button type="button" className="header-link header-button" data-action="sign-out" onClick={signOut}>
                      Sign out
                    </button>
                  </span>
                </div>
              </div>
            ) : (
              <Link href={signInHref} className="header-link account-signin">
                <UserIcon size={18} />
                Sign in
              </Link>
            )}
            <Link href="/cart" data-action="open-cart" className="cart-link" aria-label={`Cart, ${plural(items, 'item')}`}>
              <BagIcon size={22} />
              <span className="cart-label">Cart</span>
              <span className={`cart-count${items ? '' : ' cart-count-zero'}`}>{items}</span>
            </Link>
          </nav>
        </div>
        {problem && (
          <p className="wrap header-problem" role="alert">
            {problem}
          </p>
        )}
      </div>
      <div className="header-sub">
        <div className="wrap header-sub-row">
          <nav aria-label="Categories">
            <ul className="category-nav" role="list">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link href={searchPath({ category: c })} aria-current={activeCategory === c ? 'page' : undefined}>
                    {CATEGORY_LABELS[c]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="header-promise">
            <TruckIcon size={18} />
            Free delivery from ₹999
          </p>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-row">
        <div className="footer-brand">
          <Logo />
          <p>
            <strong>Namma Bazaar</strong> is a demo shop for a WebMCP workshop. Nothing here is really sold, charged or delivered, and every brand is made
            up.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="footer-links" role="list">
            <li>
              <Link href="/search">All products</Link>
            </li>
            <li>
              <Link href="/cart">Cart</Link>
            </li>
            <li>
              <Link href="/orders">Your orders</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
