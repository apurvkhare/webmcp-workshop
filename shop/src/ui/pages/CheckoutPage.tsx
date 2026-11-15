import { useEffect, useRef, useState } from 'react';
import { AddressForm } from '@app/ui/AddressForm.tsx';
import type { ShopApp, ShopState } from '../../client/shop.ts';
import { formatINR, type Address, type OrderPreview } from '../../core/types.ts';
import { colourName } from '../art.tsx';
import { Loading } from '../components.tsx';
import { errorMessage, useLoad, useTitle } from '../hooks.ts';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ShieldIcon } from '../icons.tsx';
import { navigate } from '../router.ts';
import { PriceSummary } from './CartPage.tsx';

const STEPS = ['Address', 'Delivery slot', 'Review and place'] as const;
type Step = 1 | 2 | 3;

export function CheckoutPage({ shop, state }: { shop: ShopApp; state: ShopState }) {
  useTitle('Checkout');
  const [step, setStep] = useState<Step>(1);
  const [slotId, setSlotId] = useState('');
  /** Set while an order is being placed: the cart empties before we move to the order page. */
  const placing = useRef(false);
  const signedIn = state.user !== null;
  const empty = state.cart.lines.length === 0;

  useEffect(() => {
    if (!signedIn) navigate('/signin?next=/checkout', { replace: true });
    else if (empty && !placing.current) navigate('/cart', { replace: true });
  }, [signedIn, empty]);

  const address = useLoad(() => (signedIn ? shop.getAddress() : Promise.resolve(null)), [signedIn, state.version]);

  if (!signedIn || (empty && !placing.current)) return <Loading label="Taking you there" />;

  const go = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="checkout-page">
      <div className="page-head">
        <h1>Checkout</h1>
        <p className="secure-note">
          <ShieldIcon size={18} />
          Pay on delivery. Nothing is charged online.
        </p>
      </div>

      <ol className="steps">
        {STEPS.map((label, i) => {
          const n = (i + 1) as Step;
          const done = n < step;
          return (
            <li key={label} className={done ? 'step-done' : n === step ? 'step-current' : 'step-todo'} aria-current={n === step ? 'step' : undefined}>
              {done ? (
                <button type="button" className="step-link" onClick={() => go(n)}>
                  <span className="step-num">
                    <CheckIcon size={16} />
                  </span>
                  <span>
                    {label}
                    <span className="visually-hidden"> (done, change)</span>
                  </span>
                </button>
              ) : (
                <span className="step-link">
                  <span className="step-num">{n}</span>
                  <span>{label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="two-col">
        <div className="checkout-main">
          {step > 1 && address.data && <AddressSummary address={address.data} onChange={() => go(1)} />}

          {step === 1 && (
            <section className="panel" aria-labelledby="address-title">
              <h2 id="address-title">Delivery address</h2>
              <p className="panel-lede">We deliver across Bengaluru. Check the details, then save.</p>
              {address.loading && address.data === undefined ? (
                <Loading label="Loading your saved address" />
              ) : address.error ? (
                <p className="form-error" role="alert">
                  {address.error}
                </p>
              ) : (
                <AddressForm key={JSON.stringify(address.data ?? null)} shop={shop} address={address.data ?? null} onSaved={() => go(2)} />
              )}
            </section>
          )}

          {step === 2 && (
            <SlotStep
              shop={shop}
              slotId={slotId}
              onBack={() => go(1)}
              onChoose={(id) => {
                setSlotId(id);
                go(3);
              }}
            />
          )}

          {step === 3 && (
            <ReviewStep
              shop={shop}
              state={state}
              slotId={slotId}
              onChangeSlot={() => go(2)}
              onPlace={async () => {
                placing.current = true;
                try {
                  const order = await shop.placeOrder(slotId);
                  navigate(`/orders/${encodeURIComponent(order.id)}`);
                } catch (error) {
                  placing.current = false;
                  throw error;
                }
              }}
            />
          )}
        </div>

        <aside className="summary-col">
          <PriceSummary cart={state.cart} title="Order summary" />
        </aside>
      </div>
    </div>
  );
}

function AddressSummary({ address, onChange }: { address: Address; onChange(): void }) {
  return (
    <section className="panel done-panel" aria-labelledby="deliver-to">
      <div>
        <h2 id="deliver-to" className="done-title">
          Deliver to {address.fullName} <span className="pill">{address.addressType === 'work' ? 'Work' : 'Home'}</span>
        </h2>
        <p>
          {address.line1}, {address.city} {address.pincode} · {address.phone}
        </p>
      </div>
      <button type="button" className="btn btn-small" onClick={onChange}>
        Change<span className="visually-hidden"> address</span>
      </button>
    </section>
  );
}

function SlotStep({ shop, slotId, onBack, onChoose }: { shop: ShopApp; slotId: string; onBack(): void; onChoose(id: string): void }) {
  const slots = useLoad(() => shop.getDeliverySlots(), []);
  const [chosen, setChosen] = useState(slotId);
  const [problem, setProblem] = useState('');

  return (
    <section className="panel" aria-labelledby="slot-title">
      <h2 id="slot-title">Delivery slot</h2>
      <p className="panel-lede">Pick when someone will be home to receive it.</p>
      {slots.error ? (
        <p className="form-error" role="alert">
          {slots.error}
        </p>
      ) : !slots.data ? (
        <Loading label="Finding delivery slots" />
      ) : (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!chosen) return setProblem('Choose a delivery slot first.');
            onChoose(chosen);
          }}
        >
          <fieldset className="slot-choice">
            <legend className="visually-hidden">Delivery slot</legend>
            {slots.data.map((slot) => {
              const [day, ...rest] = slot.label.split(', ');
              return (
                <label key={slot.id} className="slot-option">
                  <input
                    type="radio"
                    name="slot"
                    value={slot.id}
                    checked={chosen === slot.id}
                    onChange={() => {
                      setChosen(slot.id);
                      setProblem('');
                    }}
                  />
                  <span className="slot-text">
                    <strong>{day}</strong>
                    <span>{rest.join(', ')}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {problem && (
            <p className="form-error" role="alert">
              {problem}
            </p>
          )}
          <div className="step-actions">
            <button type="button" className="btn" onClick={onBack}>
              <ArrowLeftIcon size={18} />
              Back
            </button>
            <button type="submit" className="btn btn-primary" data-action="choose-slot">
              Continue
              <ArrowRightIcon size={18} />
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function ReviewStep({ shop, state, slotId, onChangeSlot, onPlace }: { shop: ShopApp; state: ShopState; slotId: string; onChangeSlot(): void; onPlace(): Promise<void> }) {
  const preview = useLoad<OrderPreview>(() => shop.previewOrder(slotId), [slotId, state.version]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const p = preview.data;

  async function place() {
    setBusy(true);
    setProblem('');
    try {
      await onPlace();
    } catch (error) {
      setProblem(errorMessage(error));
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="review-title">
      <h2 id="review-title">Review and place your order</h2>
      {preview.error && !busy ? (
        <p className="form-error" role="alert">
          {preview.error}
        </p>
      ) : !p ? (
        <Loading label="Preparing your order" />
      ) : (
        <>
          <div className="review-block">
            <div>
              <h3>Delivery slot</h3>
              <p>{p.slot.label}</p>
            </div>
            <button type="button" className="btn btn-small" onClick={onChangeSlot}>
              Change<span className="visually-hidden"> slot</span>
            </button>
          </div>
          <div className="review-block">
            <div>
              <h3>Payment</h3>
              <p>
                <strong>Pay on delivery.</strong> Pay by cash or UPI when it arrives.
              </p>
            </div>
          </div>
          <div className="review-block review-items">
            <h3>Items</h3>
            <ul className="order-lines" role="list">
              {p.cart.lines.map((l) => (
                <li key={`${l.productId}:${l.colour}`}>
                  <span>
                    {l.name} <span className="muted">({colourName(l.colour)}) × {l.quantity}</span>
                  </span>
                  <span className="num">{formatINR(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </div>
          {problem && (
            <p className="form-error" role="alert">
              {problem}
            </p>
          )}
          <div className="step-actions">
            <button type="button" className="btn" onClick={onChangeSlot}>
              <ArrowLeftIcon size={18} />
              Back
            </button>
            <button type="button" className="btn btn-primary btn-lg" data-action="place-order" disabled={busy} onClick={place}>
              {busy ? 'Placing your order…' : `Place order · ${formatINR(p.total)}`}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
