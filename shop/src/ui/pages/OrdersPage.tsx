import { useEffect } from 'react';
import type { ShopApp, ShopState } from '../../client/shop.ts';
import { formatINR, type Order } from '../../core/types.ts';
import { ProductArt, colourName } from '../art.tsx';
import { EmptyState, Loading, plural } from '../components.tsx';
import { useLoad, useTitle } from '../hooks.ts';
import { ArrowRightIcon, CheckIcon, TruckIcon } from '../icons.tsx';
import { Link } from '../Link.tsx';
import { navigate, useLocation } from '../router.ts';
import { PriceSummary } from './CartPage.tsx';

/** Orders belong to the shopper, so both pages send a signed-out visitor to sign in first. */
function useSignedIn(state: ShopState) {
  const { href } = useLocation();
  const signedIn = state.user !== null;
  useEffect(() => {
    if (!signedIn) navigate(`/signin?next=${encodeURIComponent(href)}`, { replace: true });
  }, [signedIn, href]);
  return signedIn;
}

const placedOn = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const itemCount = (order: Order) => order.lines.reduce((sum, l) => sum + l.quantity, 0);

export function OrdersPage({ shop, state }: { shop: ShopApp; state: ShopState }) {
  useTitle('Your orders');
  const signedIn = useSignedIn(state);
  const { data: orders, error } = useLoad(() => (signedIn ? shop.getOrders() : Promise.resolve([])), [signedIn, state.version]);

  if (!signedIn) return <Loading label="Taking you to sign in" />;
  if (error)
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  if (!orders) return <Loading label="Loading your orders" />;
  if (!orders.length)
    return (
      <EmptyState title="No orders yet" art={<ProductArt category="chargers" colour="silver" />}>
        <p>When you place an order, it shows up here with its delivery slot.</p>
        <p className="empty-actions">
          <Link href="/search" className="btn btn-primary">
            Start shopping
          </Link>
        </p>
      </EmptyState>
    );

  return (
    <div className="orders-page">
      <div className="page-head">
        <h1>Your orders</h1>
        <p className="result-count">{plural(orders.length, 'order')}</p>
      </div>
      <ul className="order-list" role="list">
        {orders.map((order) => (
          <li key={order.id} className="panel order-card">
            <div className="order-card-head">
              <h2>
                <Link href={`/orders/${encodeURIComponent(order.id)}`}>Order {order.id}</Link>
              </h2>
              <span className="pill pill-ok">
                <CheckIcon size={14} />
                {order.status}
              </span>
            </div>
            <p className="order-card-meta">
              Placed {placedOn(order.placedAt)} · {plural(itemCount(order), 'item')} · <strong>{formatINR(order.total)}</strong>
            </p>
            <p className="order-card-items">{order.lines.map((l) => l.name).join(', ')}</p>
            <p className="order-card-slot">
              <TruckIcon size={18} />
              {order.slot.label}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OrderPage({ shop, state, id }: { shop: ShopApp; state: ShopState; id: string }) {
  useTitle(`Order ${id}`);
  const signedIn = useSignedIn(state);
  const { data: order, error } = useLoad(() => (signedIn ? shop.getOrder(id) : Promise.resolve(null)), [id, signedIn, state.version]);

  if (!signedIn) return <Loading label="Taking you to sign in" />;
  if (error)
    return (
      <EmptyState title="We couldn’t find that order" art={<ProductArt category="chargers" colour="silver" />}>
        <p>{error}</p>
        <p className="empty-actions">
          <Link href="/orders" className="btn btn-primary">
            See your orders
          </Link>
        </p>
      </EmptyState>
    );
  if (!order) return <Loading label="Loading the order" />;

  const a = order.address;
  return (
    <div className="order-page">
      <div className="order-hero">
        <span className="order-hero-check">
          <CheckIcon size={28} />
        </span>
        <div>
          <h1>Order {order.id} confirmed</h1>
          <p>
            Thank you, {a.fullName.split(' ')[0]}. It arrives <strong>{order.slot.label}</strong>. Pay {formatINR(order.total)} on delivery.
          </p>
        </div>
      </div>

      <div className="two-col">
        <div className="checkout-main">
          <section className="panel" aria-labelledby="items-title">
            <h2 id="items-title">Items</h2>
            <ul className="cart-lines" role="list">
              {order.lines.map((l) => (
                <li key={`${l.productId}:${l.colour}`} className="cart-line cart-line-compact">
                  <div className="cart-line-info">
                    <h3 className="cart-line-name">
                      <Link href={`/product/${encodeURIComponent(l.productId)}`}>{l.name}</Link>
                    </h3>
                    <p className="cart-line-meta">
                      Colour: {colourName(l.colour)} · {l.quantity} × {formatINR(l.unitPrice)}
                    </p>
                  </div>
                  <p className="cart-line-total">{formatINR(l.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>
          <div className="info-grid">
            <section className="panel" aria-labelledby="address-title">
              <h2 id="address-title">Delivery address</h2>
              <address>
                {a.fullName}
                <br />
                {a.line1}
                <br />
                {a.city} {a.pincode}
                <br />
                Mobile: {a.phone}
              </address>
            </section>
            <section className="panel" aria-labelledby="slot-title">
              <h2 id="slot-title">Delivery and payment</h2>
              <p>{order.slot.label}</p>
              <p>{order.payment}</p>
              <p className="muted">Placed {placedOn(order.placedAt)}</p>
            </section>
          </div>
        </div>
        <aside className="summary-col">
          <PriceSummary cart={{ ...order, itemCount: itemCount(order) }} title="Payment summary" />
          <Link href="/search" className="btn btn-block">
            Continue shopping
            <ArrowRightIcon size={18} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
