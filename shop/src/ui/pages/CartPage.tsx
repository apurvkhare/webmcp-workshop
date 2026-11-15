import { useState, type FormEvent } from 'react';
import type { ShopApp, ShopState } from '../../client/shop.ts';
import { formatINR, type Cart, type CartLine, type Product } from '../../core/types.ts';
import { ProductArt, colourName } from '../art.tsx';
import { EmptyState, plural } from '../components.tsx';
import { errorMessage, useLoad, useTitle } from '../hooks.ts';
import { ArrowRightIcon, TagIcon, TrashIcon, TruckIcon } from '../icons.tsx';
import { Link } from '../Link.tsx';
import { navigate } from '../router.ts';

/** The server's rule (core/catalog.ts), repeated here so the catalogue stays out of the page bundle. Only used for a hint. */
const FREE_DELIVERY_FROM = 999;

export function CartPage({ shop, state }: { shop: ShopApp; state: ShopState }) {
  useTitle('Cart');
  const { cart } = state;
  const [problem, setProblem] = useState('');
  const ids = cart.lines.map((l) => l.productId).join(',');
  // Product details (category for the picture, MRP) for each line.
  const { data: products } = useLoad(async () => {
    const unique = [...new Set(cart.lines.map((l) => l.productId))];
    const found = await Promise.all(unique.map((id) => shop.getProduct(id)));
    return new Map(found.filter((p): p is Product => p !== null).map((p) => [p.id, p]));
  }, [ids]);

  async function setQuantity(line: CartLine, quantity: number) {
    try {
      setProblem('');
      await shop.setQuantity({ productId: line.productId, colour: line.colour, quantity });
    } catch (error) {
      setProblem(errorMessage(error));
    }
  }

  if (!cart.lines.length) {
    return (
      <EmptyState title="Your cart is empty" art={<ProductArt category="earbuds" colour="silver" />}>
        <p>Find something you like and it will wait for you here.</p>
        <p className="empty-actions">
          <Link href="/search" className="btn btn-primary">
            Start shopping
          </Link>
          {state.user && (
            <Link href="/orders" className="btn">
              Your orders
            </Link>
          )}
        </p>
      </EmptyState>
    );
  }

  return (
    <div className="cart-page">
      <div className="page-head">
        <h1>Your cart</h1>
        <p className="result-count">{plural(cart.itemCount, 'item')}</p>
      </div>
      <div className="two-col">
        <section aria-label="Items in your cart" className="panel">
          {problem && (
            <p className="form-error" role="alert">
              {problem}
            </p>
          )}
          <ul className="cart-lines" role="list">
            {cart.lines.map((line) => {
              const product = products?.get(line.productId);
              const key = `${line.productId}:${line.colour}`;
              return (
                <li key={key} data-line={key} className="cart-line">
                  {product ? <ProductArt category={product.category} colour={line.colour} className="cart-line-art" /> : <div className="art cart-line-art skeleton" />}
                  <div className="cart-line-info">
                    <h2 className="cart-line-name">
                      <Link href={`/product/${encodeURIComponent(line.productId)}`}>{line.name}</Link>
                    </h2>
                    <p className="cart-line-meta">
                      Colour: {colourName(line.colour)} · {formatINR(line.unitPrice)} each
                    </p>
                    <div className="cart-line-controls">
                      <label className="inline-field">
                        <span>Qty</span>
                        <select name="quantity" value={line.quantity} onChange={(e) => setQuantity(line, Number(e.target.value))}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="button" className="link-button" data-action="remove-line" onClick={() => setQuantity(line, 0)}>
                        <TrashIcon size={18} />
                        Remove<span className="visually-hidden"> {line.name}</span>
                      </button>
                    </div>
                  </div>
                  <p className="cart-line-total">{formatINR(line.lineTotal)}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="summary-col">
          <CouponBox shop={shop} cart={cart} />
          <PriceSummary cart={cart} />
          <button type="button" className="btn btn-primary btn-lg btn-block" data-action="checkout" onClick={() => navigate('/checkout')}>
            Proceed to checkout
            <ArrowRightIcon size={18} />
          </button>
        </aside>
      </div>
    </div>
  );
}

function CouponBox({ shop, cart }: { shop: ShopApp; cart: Cart }) {
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim()) {
      setProblem('Type a coupon code first.');
      return;
    }
    setBusy(true);
    try {
      await shop.applyCoupon(code);
      setProblem('');
      setCode('');
    } catch (error) {
      setProblem(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    try {
      setProblem('');
      await shop.removeCoupon();
    } catch (error) {
      setProblem(errorMessage(error));
    }
  }

  return (
    <div className="panel coupon-panel">
      {cart.coupon && (
        <div className="coupon-applied" role="status">
          <TagIcon size={20} />
          <div>
            <p>
              <strong className="coupon-code">{cart.coupon.code}</strong> applied
            </p>
            <p className="coupon-desc">{cart.coupon.description}</p>
          </div>
          <button type="button" className="link-button" data-action="remove-coupon" onClick={remove}>
            Remove
          </button>
        </div>
      )}
      <details className="coupon">
        <summary>{cart.coupon ? 'Use a different coupon' : 'Have a coupon?'}</summary>
        <form className="form coupon-form" onSubmit={apply}>
          <div className="field">
            <label htmlFor="coupon">Coupon code</label>
            <div className="coupon-row">
              <input id="coupon" name="coupon" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} />
              <button type="submit" className="btn" data-action="apply-coupon" disabled={busy}>
                Apply
              </button>
            </div>
          </div>
          {problem && (
            <p className="form-error" role="alert">
              {problem}
            </p>
          )}
        </form>
      </details>
    </div>
  );
}

export function PriceSummary({ cart, title = 'Price details' }: { cart: Pick<Cart, 'subtotal' | 'discount' | 'deliveryFee' | 'total' | 'itemCount'> & { coupon?: Cart['coupon'] | string | null }; title?: string }) {
  const couponCode = typeof cart.coupon === 'string' ? cart.coupon : cart.coupon?.code;
  const toFree = FREE_DELIVERY_FROM - (cart.subtotal - cart.discount);
  return (
    <section className="panel summary" aria-labelledby="summary-title">
      <h2 id="summary-title">{title}</h2>
      <dl className="summary-rows">
        <div>
          <dt>Subtotal ({plural(cart.itemCount, 'item')})</dt>
          <dd>{formatINR(cart.subtotal)}</dd>
        </div>
        {cart.discount > 0 && (
          <div className="summary-discount">
            <dt>Discount{couponCode ? ` (${couponCode})` : ''}</dt>
            <dd>−{formatINR(cart.discount)}</dd>
          </div>
        )}
        <div>
          <dt>Delivery</dt>
          <dd>{cart.deliveryFee ? formatINR(cart.deliveryFee) : <span className="free">Free</span>}</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd data-total>{formatINR(cart.total)}</dd>
        </div>
      </dl>
      {cart.deliveryFee > 0 && toFree > 0 && (
        <p className="summary-hint">
          <TruckIcon size={18} />
          Add {formatINR(toFree)} more for free delivery.
        </p>
      )}
    </section>
  );
}
