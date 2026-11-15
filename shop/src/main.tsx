/** The shop's entry point: builds the shop object, renders the UI and the workshop drawer, then sets up WebMCP. */
import { createRoot } from 'react-dom/client';
// The WebMCP code comes from the playground (or app/, or an exercise folder): see vite.config.ts.
import { setupWebMCP } from '@app/webmcp/index.ts';
import { httpBackend } from './client/http-backend.ts';
import { createShop } from './client/shop.ts';
import { App } from './ui/App.tsx';
import { navigate } from './ui/router.ts';
import { Workshop } from './workshop/Workshop.tsx';
import './ui/styles.css';
import './workshop/workshop.css';

const shop = createShop(httpBackend(), {
  navigate,
  // Every line of the agent log also goes to the server, which prints it in the `npm start` terminal.
  sink: (entry) => navigator.sendBeacon('/api/agent-log', new Blob([JSON.stringify(entry)], { type: 'application/json' }))
});

await shop.init();
createRoot(document.getElementById('root')!).render(<App shop={shop} />);
createRoot(document.getElementById('workshop')!).render(<Workshop shop={shop} />);

// 🧠 WebMCP is an enhancement. The shop is complete before this line, and works the same if it does nothing.
setupWebMCP(shop);
