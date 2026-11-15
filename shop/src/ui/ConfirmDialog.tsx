import { useLayoutEffect, useRef } from 'react';
import type { PendingConfirm } from '../client/shop.ts';
import { ShieldIcon } from './icons.tsx';

/**
 * The shopper's say before an assistant does something that matters, like placing an order.
 * Escape, a click on the backdrop and "Not now" all answer no.
 */
export function ConfirmDialog({ confirm }: { confirm: PendingConfirm | null }) {
  const ref = useRef<HTMLDialogElement>(null);

  // A layout effect, so the dialog opens and closes in the same commit as `confirm` changes.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (confirm && !dialog.open) dialog.showModal();
    if (!confirm && dialog.open) dialog.close();
  }, [confirm]);

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-who"
      onCancel={(event) => {
        event.preventDefault();
        confirm?.answer(false);
      }}
      // Chrome may close a modal on a repeated Escape without a cancel event; that is a no as well.
      // The close event arrives late: if the next question is already open by then, it isn't about that one.
      onClose={() => {
        if (!ref.current?.open) confirm?.answer(false);
      }}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        if (event.target === event.currentTarget) confirm?.answer(false);
      }}
    >
      {confirm && (
        <div className="confirm-body">
          <p className="confirm-who" id="confirm-who">
            <ShieldIcon size={20} />
            An assistant is asking to do this for you. Nothing happens unless you say yes.
          </p>
          <h2 id="confirm-title">{confirm.title}</h2>
          {confirm.lines.length > 0 && (
            <ul className="confirm-lines">
              {confirm.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
          <div className="confirm-actions">
            <button type="button" className="btn" data-action="confirm-decline" onClick={() => confirm.answer(false)} autoFocus>
              Not now
            </button>
            <button type="button" className="btn btn-primary" data-action="confirm-accept" onClick={() => confirm.answer(true)}>
              {confirm.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
