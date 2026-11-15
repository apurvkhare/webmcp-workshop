import type { ReactNode } from 'react';
import type { ShopApp } from '../client/shop.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { Footer, Header } from './Header.tsx';
import { useShopState } from './hooks.ts';
import { CartPage } from './pages/CartPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { OrderPage, OrdersPage } from './pages/OrdersPage.tsx';
import { ProductPage } from './pages/ProductPage.tsx';
import { SearchPage } from './pages/SearchPage.tsx';
import { SignInPage } from './pages/SignInPage.tsx';
import { useLocation } from './router.ts';

const decode = (part: string) => {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
};

export function App({ shop }: { shop: ShopApp }) {
  const state = useShopState(shop);
  const { pathname } = useLocation();
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  let page: ReactNode;
  let match: RegExpMatchArray | null;
  if (path === '/') page = <HomePage shop={shop} />;
  else if (path === '/search') page = <SearchPage shop={shop} version={state.version} />;
  else if ((match = path.match(/^\/product\/([^/]+)$/))) {
    const id = decode(match[1]!);
    page = <ProductPage key={id} shop={shop} state={state} id={id} />;
  } else if (path === '/cart') page = <CartPage shop={shop} state={state} />;
  else if (path === '/signin') page = <SignInPage shop={shop} state={state} />;
  else if (path === '/checkout') page = <CheckoutPage shop={shop} state={state} />;
  else if (path === '/orders') page = <OrdersPage shop={shop} state={state} />;
  else if ((match = path.match(/^\/orders\/([^/]+)$/))) {
    const id = decode(match[1]!);
    page = <OrderPage key={id} shop={shop} state={state} id={id} />;
  } else page = <NotFoundPage />;

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header shop={shop} state={state} />
      <main id="main" className="wrap" tabIndex={-1}>
        {page}
      </main>
      <Footer />
      <ConfirmDialog confirm={state.confirm} />
    </div>
  );
}
