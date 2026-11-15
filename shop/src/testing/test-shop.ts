/**
 * The shop for tests: the real rules and the real page-side object, with no server and no UI.
 * A "shopper" you script answers confirmation dialogs.
 */
import { localBackend } from '../core/backend.ts';
import { ShopService } from '../core/service.ts';
import { createShop, type ConfirmRequest, type LoggedCall, type ShopApp } from '../client/shop.ts';

export interface TestShop extends ShopApp {
  /** Every path a show* call moved the page to. */
  readonly navigations: string[];
  /** Every confirmation the shop was asked to show, signal included. */
  readonly confirmations: ConfirmRequest[];
  /** How the shopper answers from now on: true, false, or "wait" to leave the dialog open. Starts as false. */
  answerConfirm(answer: boolean | 'wait'): void;
  /** The agent log, oldest first. */
  calls(): LoggedCall[];
  /** The server side, for checking what really happened. */
  service(): ShopService;
}

export const TEST_NOW = new Date('2026-11-15T10:00:00+05:30');

export async function createTestShop(): Promise<TestShop> {
  const backend = localBackend(() => new ShopService(() => TEST_NOW));
  const navigations: string[] = [];
  const confirmations: ConfirmRequest[] = [];
  let answer: boolean | 'wait' = false;

  const app = createShop(backend, { navigate: (path) => navigations.push(path) });
  const ask = app.ui.confirm;
  const shop: TestShop = Object.assign(app, {
    navigations,
    confirmations,
    answerConfirm: (next: boolean | 'wait') => void (answer = next),
    calls: () => [...app.getState().log].reverse(),
    service: () => backend.service()
  });
  shop.ui.confirm = (request) => {
    confirmations.push(request);
    const result = ask(request);
    if (answer !== 'wait') app.getState().confirm?.answer(answer);
    return result;
  };
  await shop.init();
  return shop;
}
