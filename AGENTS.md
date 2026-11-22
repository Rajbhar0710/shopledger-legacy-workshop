# Repository Guidelines

## Stack

ShopLedger is a CommonJS Node.js application using Express 4 and body-parser. Its UI is static HTML, CSS, and browser JavaScript served by Express. Persistent application data is stored in `data/db.json`.

## Module Map

- `server.js` creates the Express app, serves `public/`, mounts API routes, and renders the invoice page.
- `routes/` contains the products/coupons, orders, customers, and reports API handlers.
- `lib/` contains store access (`store.js`), order operations (`orders.js`), stock (`inventory.js`), pricing/tax/coupons, Khata ledger (`ledger.js`), invoices, reports, and date helpers.
- `config.js` holds the port, shop details, tax slabs, inventory defaults, and coupons.
- `public/` contains the browser UI and its styles and scripts. `docs/architecture.svg` diagrams the app.
- `data/db.json` is the local JSON data file.

## Commands

- `npm start` runs `node server.js`; the default port is `3000`, configurable with `PORT`.
- `npm test` is a placeholder that prints an error and exits unsuccessfully. No build, lint, or real test command is configured.

## Change Rules

- Before changing behavior, write characterization tests that capture the current behavior.
- Change only the module the ticket is about. Do not make unrelated edits in other modules.
- Tests must never read or write `data/db.json`; use isolated test data instead.
- Do not add dependencies.
