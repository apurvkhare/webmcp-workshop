/**
 * The shop's API server, as Vite dev-server middleware: /api/* on the same origin as the page.
 * One ShopService per browser session, found by an HttpOnly cookie. Everything is in memory and
 * resets when the server restarts.
 */
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { ShopService, parseFilters } from '../core/service.ts';
import { ShopError, type ShopErrorCode } from '../core/types.ts';

const COOKIE = 'nb_session';
const STATUS: Partial<Record<ShopErrorCode, number>> = { NOT_SIGNED_IN: 401, PRODUCT_NOT_FOUND: 404, ORDER_NOT_FOUND: 404 };

type Body = Record<string, unknown>;
type Handler = (ctx: { shop: ShopService; body: Body; query: URLSearchParams; params: string[] }) => unknown;

const str = (value: unknown) => (typeof value === 'string' ? value : '');
const item = (body: Body) => ({ productId: str(body.productId), colour: str(body.colour), quantity: body.quantity as number });

const routes: [method: string, pattern: RegExp, handler: Handler][] = [
  ['GET', /^\/products$/, ({ shop, query }) => shop.searchProducts(parseFilters(Object.fromEntries(query)))],
  [
    'GET',
    /^\/products\/([^/]+)$/,
    ({ shop, params }) => shop.getProduct(params[0]!) ?? fail('PRODUCT_NOT_FOUND', `No product has the id "${params[0]}".`)
  ],
  ['GET', /^\/products\/([^/]+)\/reviews$/, ({ shop, params }) => shop.getReviews(params[0]!)],
  ['GET', /^\/cart$/, ({ shop }) => shop.getCart()],
  ['POST', /^\/cart\/items$/, ({ shop, body }) => shop.addToCart(item(body))],
  ['PATCH', /^\/cart\/items$/, ({ shop, body }) => shop.setQuantity(item(body))],
  ['POST', /^\/cart\/coupon$/, ({ shop, body }) => shop.applyCoupon(str(body.code))],
  ['DELETE', /^\/cart\/coupon$/, ({ shop }) => shop.removeCoupon()],
  ['GET', /^\/session$/, ({ shop }) => ({ user: shop.getUser() })],
  ['POST', /^\/session$/, ({ shop }) => ({ user: shop.signIn() })],
  ['DELETE', /^\/session$/, ({ shop }) => (shop.signOut(), { user: null })],
  ['GET', /^\/address$/, ({ shop }) => shop.getAddress()],
  ['PUT', /^\/address$/, ({ shop, body }) => shop.saveAddress(body)],
  ['GET', /^\/delivery-slots$/, ({ shop }) => shop.getDeliverySlots()],
  ['POST', /^\/orders\/preview$/, ({ shop, body }) => shop.previewOrder(str(body.slotId))],
  ['POST', /^\/orders$/, ({ shop, body }) => shop.placeOrder(str(body.slotId))],
  ['GET', /^\/orders$/, ({ shop }) => shop.getOrders()],
  ['GET', /^\/orders\/([^/]+)$/, ({ shop, params }) => shop.getOrder(params[0]!)]
];

function fail(code: ShopErrorCode, message: string): never {
  throw new ShopError(code, message);
}

async function readBody(req: IncomingMessage): Promise<Body> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (!chunks.length) return {};
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return parsed && typeof parsed === 'object' ? (parsed as Body) : {};
  } catch {
    return fail('BAD_REQUEST', 'The request body is not valid JSON.');
  }
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  if (status === 204) return void res.end();
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(data ?? null));
}

/** One line per agent call in the terminal that runs `npm start`. */
function printAgentCall(entry: Body) {
  const outcome = str(entry.outcome);
  const mark = outcome === 'ok' ? '✓' : outcome === 'activated' ? '→' : '✗';
  const ms = typeof entry.ms === 'number' ? `${entry.ms} ms`.padStart(8) : ''.padStart(8);
  const input = entry.input === undefined ? '' : JSON.stringify(entry.input);
  console.log(`  🤖 ${mark} ${str(entry.tool).padEnd(22)} ${outcome.padEnd(9)} ${ms}  ${input.length > 90 ? `${input.slice(0, 90)}…` : input}`);
}

export function shopApi(): Plugin {
  const sessions = new Map<string, ShopService>();
  const agentLog: Body[] = [];

  const sessionFor = (req: IncomingMessage, res: ServerResponse) => {
    let id = new RegExp(`(?:^|;\\s*)${COOKIE}=([\\w-]+)`).exec(req.headers.cookie ?? '')?.[1];
    if (!id || !sessions.has(id)) {
      id = randomUUID();
      sessions.set(id, new ShopService());
      res.setHeader('set-cookie', `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax`);
    }
    return id;
  };

  return {
    name: 'namma-bazaar-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const method = req.method ?? 'GET';
        try {
          const id = sessionFor(req, res);
          if (method === 'POST' && url.pathname === '/agent-log') {
            const entry = await readBody(req);
            agentLog.unshift(entry);
            agentLog.length = Math.min(agentLog.length, 200);
            printAgentCall(entry);
            return send(res, 204, null);
          }
          if (method === 'GET' && url.pathname === '/agent-log') return send(res, 200, agentLog);
          if (method === 'POST' && url.pathname === '/dev/reset') {
            sessions.set(id, new ShopService());
            return send(res, 204, null);
          }
          for (const [routeMethod, pattern, handler] of routes) {
            const match = routeMethod === method ? pattern.exec(url.pathname) : null;
            if (!match) continue;
            const body = method === 'GET' || method === 'DELETE' ? {} : await readBody(req);
            const params = match.slice(1).map(decodeURIComponent);
            return send(res, 200, handler({ shop: sessions.get(id)!, body, query: url.searchParams, params }));
          }
          send(res, 404, { error: { code: 'BAD_REQUEST', message: `No route for ${method} /api${url.pathname}` } });
        } catch (error) {
          if (error instanceof ShopError) return send(res, STATUS[error.code] ?? 400, { error: { code: error.code, message: error.message } });
          console.error(error);
          send(res, 500, { error: { code: 'BAD_REQUEST', message: 'The shop server hit an unexpected error.' } });
        }
      });
    }
  };
}
