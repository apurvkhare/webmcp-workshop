/**
 * The delivery address form on the checkout page. People fill it in and press Save.
 */
import { useState, type FormEvent } from 'react';
import { errorText, readAddress, type Address, type Shop } from '@shop';

interface Props {
  shop: Shop;
  /** The saved address, or null if there isn't one yet. */
  address: Address | null;
  onSaved(address: Address): void;
}

export function AddressForm({ shop, address, onSaved }: Props) {
  const [problem, setProblem] = useState('');

  /** Saves the form. Resolves with one sentence about what happened, for whoever submitted it. */
  async function save(form: HTMLFormElement): Promise<string> {
    try {
      const saved = await shop.saveAddress(readAddress(form));
      setProblem('');
      onSaved(saved);
      return `Saved the delivery address: ${saved.fullName}, ${saved.line1}, ${saved.city} ${saved.pincode}.`;
    } catch (error) {
      const text = errorText(error);
      setProblem(text.replace(/^Error: /, ''));
      return text;
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    // The shop is a single-page app: it saves with fetch instead of letting the form navigate.
    event.preventDefault();
    void save(event.currentTarget);
  }

  return (
    <form
      className="form address-form"
      onSubmit={onSubmit}
    >
      <div className="field">
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" autoComplete="name" required defaultValue={address?.fullName} />
      </div>
      <div className="field">
        <label htmlFor="phone">Mobile number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel-national"
          required
          pattern="[6-9][0-9]{9}"
          defaultValue={address?.phone}
        />
      </div>
      <div className="field">
        <label htmlFor="line1">House, street and area</label>
        <input id="line1" name="line1" autoComplete="street-address" required defaultValue={address?.line1} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" autoComplete="address-level2" required defaultValue={address?.city} />
        </div>
        <div className="field">
          <label htmlFor="pincode">PIN code</label>
          <input
            id="pincode"
            name="pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            required
            pattern="[1-9][0-9]{5}"
            defaultValue={address?.pincode}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="addressType">Address type</label>
        <select id="addressType" name="addressType" defaultValue={address?.addressType ?? 'home'}>
          <option value="home">Home</option>
          <option value="work">Work</option>
        </select>
      </div>
      {problem && (
        <p className="form-error" role="alert">
          {problem}
        </p>
      )}
      <button type="submit" className="btn btn-primary">
        Save and continue
      </button>
    </form>
  );
}
