import { useState } from 'react';
import type { ShopApp, ShopState } from '../../client/shop.ts';
import { Logo } from '../Header.tsx';
import { errorMessage, useTitle } from '../hooks.ts';
import { ArrowRightIcon } from '../icons.tsx';
import { Link } from '../Link.tsx';
import { navigate, safeNext, useLocation } from '../router.ts';

export function SignInPage({ shop, state }: { shop: ShopApp; state: ShopState }) {
  useTitle('Sign in');
  const { params } = useLocation();
  const next = safeNext(params.get('next'));
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  async function signIn() {
    setBusy(true);
    setProblem('');
    try {
      await shop.signIn();
      navigate(next, { replace: true });
    } catch (error) {
      setProblem(errorMessage(error));
      setBusy(false);
    }
  }

  return (
    <div className="signin">
      <div className="signin-card">
        <Logo />
        <h1>Sign in to Namma Bazaar</h1>
        {state.user ? (
          <>
            <p>
              You’re signed in as <strong>{state.user.name}</strong>.
            </p>
            <Link href={next} className="btn btn-primary btn-lg btn-block">
              Continue
              <ArrowRightIcon size={18} />
            </Link>
          </>
        ) : (
          <>
            <p>This is a demo shop, so there are no passwords. Sign in as the demo shopper to check out and see orders.</p>
            <button type="button" className="btn btn-primary btn-lg btn-block" data-action="sign-in" disabled={busy} onClick={signIn}>
              {busy ? 'Signing in…' : 'Continue as Asha Rao (demo shopper)'}
            </button>
            {problem && (
              <p className="form-error" role="alert">
                {problem}
              </p>
            )}
          </>
        )}
        <p className="signin-foot">
          <Link href="/">Back to the shop</Link>
        </p>
      </div>
    </div>
  );
}
