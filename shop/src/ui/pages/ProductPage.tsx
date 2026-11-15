import { useState, type FormEvent } from 'react';
import type { ShopApp, ShopState } from '../../client/shop.ts';
import { searchPath } from '../../client/shop.ts';
import type { Product, Review } from '../../core/types.ts';
import { CATEGORY_LABELS, ProductArt, Swatch, colourName } from '../art.tsx';
import { EmptyState, Loading, Price, Rating, count } from '../components.tsx';
import { errorMessage, useLoad, useTitle } from '../hooks.ts';
import { BagIcon, CheckIcon, MinusIcon, PlusIcon, ReturnIcon, ShieldIcon, Stars, TruckIcon } from '../icons.tsx';
import { Link } from '../Link.tsx';
import { NotFoundPage } from './NotFoundPage.tsx';

const MAX_QUANTITY = 5;

export function ProductPage({ shop, state, id }: { shop: ShopApp; state: ShopState; id: string }) {
  const { data: product, error, loading } = useLoad(() => shop.getProduct(id), [id]);

  if (loading && product === undefined) return <Loading label="Loading the product" />;
  if (error)
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  if (!product) return <NotFoundPage title="We couldn’t find that product" detail={`There is no product with the id “${id}”. It may have been a typo in the link.`} />;
  return <ProductDetail shop={shop} state={state} product={product} />;
}

function ProductDetail({ shop, state, product }: { shop: ShopApp; state: ShopState; product: Product }) {
  useTitle(product.name);
  const single = product.colours.length === 1;
  const [colour, setColour] = useState(single ? (product.colours[0] ?? '') : '');
  const [quantity, setQuantity] = useState(1);
  const [problem, setProblem] = useState('');
  const [added, setAdded] = useState('');
  const [busy, setBusy] = useState(false);

  const reviews = useLoad(() => shop.getReviews(product.id), [product.id, state.version]);
  const inCart = state.cart.lines.filter((l) => l.productId === product.id);
  const shownColour = colour || product.colours[0] || 'black';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdded('');
    if (!colour) {
      setProblem('Choose a colour first.');
      document.querySelector<HTMLInputElement>('input[name="colour"]')?.focus();
      return;
    }
    setBusy(true);
    try {
      await shop.addToCart({ productId: product.id, colour, quantity });
      setProblem('');
      setAdded(`Added ${quantity} × ${product.name} (${colourName(colour)}) to your cart.`);
    } catch (error) {
      setProblem(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const clampQuantity = (n: number) => Math.max(1, Math.min(MAX_QUANTITY, Number.isFinite(n) ? Math.round(n) : 1));

  return (
    <div className="product-page">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href={searchPath({ category: product.category })}>{CATEGORY_LABELS[product.category]}</Link>
          </li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="product-layout">
        <div className="product-gallery">
          <ProductArt category={product.category} colour={shownColour} className="product-hero-art" />
        </div>

        <div className="product-info">
          <p className="product-brand">{product.brand}</p>
          <h1 className="product-name">{product.name}</h1>
          <Rating product={product} long />
          <div className="product-price-block">
            <Price product={product} size="lg" />
            <p className="price-note">Inclusive of all taxes</p>
          </div>
          <p className="product-blurb">{product.blurb}</p>

          <form className="form buy-form" onSubmit={onSubmit} noValidate>
            <fieldset className="colour-choice">
              <legend>
                Colour{colour && <span className="legend-value">: {colourName(colour)}</span>}
              </legend>
              <div className="colour-options">
                {product.colours.map((c) => (
                  <label key={c} className="colour-option">
                    <input
                      type="radio"
                      name="colour"
                      value={c}
                      checked={colour === c}
                      onChange={() => {
                        setColour(c);
                        setProblem('');
                      }}
                    />
                    <Swatch colour={c} />
                    <span>{colourName(c)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="field quantity-field">
              <label htmlFor="quantity">Quantity</label>
              <div className="stepper-input">
                <button type="button" className="icon-button" aria-label="One fewer" disabled={quantity <= 1} onClick={() => setQuantity((q) => clampQuantity(q - 1))}>
                  <MinusIcon size={18} />
                </button>
                <input
                  id="quantity"
                  type="number"
                  name="quantity"
                  min={1}
                  max={MAX_QUANTITY}
                  value={quantity}
                  onChange={(e) => setQuantity(clampQuantity(e.target.valueAsNumber))}
                />
                <button type="button" className="icon-button" aria-label="One more" disabled={quantity >= MAX_QUANTITY} onClick={() => setQuantity((q) => clampQuantity(q + 1))}>
                  <PlusIcon size={18} />
                </button>
              </div>
              <p className="field-hint">Up to {MAX_QUANTITY} per order</p>
            </div>

            {problem && (
              <p className="form-error" role="alert">
                {problem}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" data-action="add-to-cart" disabled={!product.inStock || busy}>
              <BagIcon size={20} />
              {product.inStock ? (busy ? 'Adding…' : 'Add to cart') : 'Out of stock'}
            </button>

            <div className="added-status" role="status">
              {added && (
                <p className="added-note">
                  <CheckIcon size={20} />
                  <span>
                    {added} <Link href="/cart">View cart</Link>
                  </span>
                </p>
              )}
            </div>
            {inCart.length > 0 && !added && (
              <p className="in-cart-note">
                In your cart: {inCart.map((l) => `${l.quantity} × ${colourName(l.colour)}`).join(', ')}. <Link href="/cart">View cart</Link>
              </p>
            )}
          </form>

          <ul className="product-promises" role="list">
            <li>
              <TruckIcon size={20} />
              Delivery in Bengaluru in a slot you pick, free from ₹999
            </li>
            <li>
              <ShieldIcon size={20} />
              Pay on delivery, cash or UPI
            </li>
            <li>
              <ReturnIcon size={20} />
              7-day returns
            </li>
          </ul>

          <section className="product-features" aria-labelledby="features-title">
            <h2 id="features-title">Highlights</h2>
            <ul>
              {product.features.map((f) => (
                <li key={f}>
                  <CheckIcon size={18} />
                  {f}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <Reviews product={product} reviews={reviews.data} error={reviews.error} />
    </div>
  );
}

function Reviews({ product, reviews, error }: { product: Product; reviews: Review[] | undefined; error: string }) {
  const date = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <div className="reviews-head">
        <h2 id="reviews-title">Ratings and reviews</h2>
        <div className="reviews-score">
          <span className="reviews-score-value">{product.rating.toFixed(1)}</span>
          <span>
            <Stars rating={product.rating} size={18} />
            <span className="reviews-score-count">Based on {count(product.ratingCount)} ratings</span>
          </span>
        </div>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : !reviews ? (
        <Loading label="Loading reviews" />
      ) : reviews.length === 0 ? (
        <EmptyState heading="h2" title="No written reviews yet">
          <p>Shoppers have rated it, but nobody has written about it yet.</p>
        </EmptyState>
      ) : (
        <ul className="review-list" role="list">
          {reviews.map((r) => (
            <li key={r.id}>
              <article className="review">
                <header>
                  <p className="review-rating">
                    <Stars rating={r.rating} />
                    <span>{r.rating} out of 5</span>
                  </p>
                  <h3>{r.title}</h3>
                  <p className="review-meta">
                    {r.author} · <time dateTime={r.date}>{date(r.date)}</time>
                  </p>
                </header>
                <p className="review-body">{r.body}</p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
