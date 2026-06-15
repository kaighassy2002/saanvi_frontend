# Aashmika Designs — Jewellery Storefront (React)

Customer-facing jewellery site and **admin dashboard** for the Aashmika Designs project. Built with **Vite** and **React 19**, styled with **Tailwind CSS v4**. It talks to **`jewellery_backend`** when configured, or falls back to **browser localStorage** for demos without a server.

## Stack

- **React 19** · **React Router 7**
- **Vite 7**
- **Tailwind CSS 4** · **Swiper**
- **Native `fetch`** via `src/services/jewelleryApi.js` (no Axios)
- **Razorpay Checkout** (UPI & card — optional; COD always available)
- **Sentry** (optional production error tracking — see [`../docs/SENTRY_SETUP.md`](../docs/SENTRY_SETUP.md))

## Prerequisites

- Node.js 18+ recommended  
- (Optional) Backend running — see [`jewellery_backend/README.md`](../jewellery_backend/README.md)

## Setup

```bash
cd jewellery_frontend
npm install
```

## Environment variables

Vite only exposes variables prefixed with **`VITE_`**. Copy the example file:

```bash
cp .env.example .env
```

### Development

| Variable | Description |
|----------|-------------|
| `VITE_DEV_PROXY` | Set to **`true`** to proxy `/api` → `http://localhost:5000` (see `vite.config.js`). Recommended with the default backend port. |
| `VITE_API_URL` | Full origin of the API **without** a trailing slash, e.g. `http://localhost:5000`. Used when **`VITE_DEV_PROXY`** is not `true`. |
| `VITE_STORE_WHATSAPP` | WhatsApp number for customer chat (digits only, India code 91, e.g. `919876543210`). See `.env.example`. |
| `VITE_RAZORPAY_KEY_ID` | Optional Razorpay **public** key id. Checkout can also load the key from `GET /api/payments/razorpay-config`. |
| `VITE_GOOGLE_CLIENT_ID` | Optional Google Sign-In client id (must match backend `GOOGLE_CLIENT_ID`). |
| `VITE_SENTRY_DSN` | Optional Sentry DSN — enables error tracking in production builds only. |

**Recommended local flow:** backend on port **5000**, frontend with:

```env
VITE_DEV_PROXY=true
```

Then API calls use same-origin `/api/...` and the dev server forwards them to Express.

### Production build

For `npm run build`, set the public API URL (no Vite proxy in production):

```env
VITE_API_URL=https://your-api.example.com
VITE_STORE_WHATSAPP=919876543210
```

See [`.env.production.example`](./.env.production.example) for a template. Full hosting steps: [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md).

**Before launch:** follow the step-by-step checklist in [`../docs/LAUNCH_CHECKLIST.md`](../docs/LAUNCH_CHECKLIST.md) (env vars, build, and 15 manual E2E tests).

### Local-only mode (no backend)

If **`VITE_DEV_PROXY`** is not enabled and **`VITE_API_URL`** is empty, the app uses **`USE_LOCAL_API`** (`src/services/config.js`): catalog and wishlist use **localStorage**; **cart and checkout still require a signed-in customer** (orders are stored locally per account). Use this for UI demos only; production should use the backend.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (default Vite port, often `5173`) |
| `npm run build` | Production bundle → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint |

## App routes

### Storefront

| Path | Page |
|------|------|
| `/` | Home |
| `/collections` | Product listing |
| `/product/:id` | Product detail |
| `/cart` | Cart |
| `/wishlist` | Wishlist |
| `/checkout` | Checkout |
| `/orders` | My orders (API requires customer login for server-backed list) |
| `/profile` | Profile |
| `/auth` | Register / login |
| `/shipping` | Shipping & delivery policy |
| `/returns` | Returns & refunds policy |
| `/contact` | Contact & WhatsApp |
| `/privacy-policy` | Privacy policy |

### Admin

All admin pages except login are nested under `/admin` and require an admin JWT.

| Path | Area |
|------|------|
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard (KPIs, recent orders) |
| `/admin/products` | Product list (bulk actions, export/import) |
| `/admin/products/new` | Add product |
| `/admin/products/:id/edit` | Edit / duplicate / delete product |
| `/admin/orders` | Order list (bulk actions, export) |
| `/admin/orders/:publicId` | Order detail (status, COD confirm, refunds, courier AWB, invoice) |
| `/admin/customers` | Customer list |
| `/admin/customers/:id` | Customer profile & order history |
| `/admin/categories` | Category editor (home grid images) |
| `/admin/merchandising` | Hero slides, promo banners, new-arrivals picker |
| `/admin/inventory` | Stock levels, adjustments, stock-take, movements |
| `/admin/reviews` | Review moderation |
| `/admin/coupons` | Discount coupons |
| `/admin/size-charts` | Size chart templates |
| `/admin/analytics` | Sales & product analytics |
| `/admin/settings` | Store profile, shipping, tax, integrations health |

Redirects: `/admin/collections` → `/admin/products`; `/admin/shipping` → `/admin/settings?tab=shipping`.

Admin JWT is stored under the key defined in `STORAGE_KEYS.adminToken` in `src/services/config.js`.

## Connecting to the backend

1. Start MongoDB-backed API: `cd jewellery_backend && npm start`  
2. In `jewellery_frontend`, use `.env` with `VITE_DEV_PROXY=true`  
3. Run `npm run dev` and open the printed local URL  

Customer **register/login** is required to **add to cart**, open the **cart**, and **checkout** (`/checkout` redirects to `/auth` if unsigned in). With the API active, checkout uses the customer JWT.

**Payments:**

| Method | Flow |
|--------|------|
| **COD** | `POST /api/orders` — order saved immediately; high-value COD may need admin confirmation |
| **UPI / card** | `POST /api/orders/razorpay-order` → Razorpay Checkout popup → `POST /api/orders/razorpay-verify` |

Configure Razorpay keys on the backend (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`). Step-by-step setup: [`../docs/RAZORPAY_SETUP.md`](../docs/RAZORPAY_SETUP.md).

**My Orders** loads from `GET /api/auth/orders` when the user is signed in. Cancel/return requests use `POST /api/auth/orders/:id/cancel-request` and `.../return-request`.

**Categories:** Home grid and shop mega-menu load from `GET /api/categories` and `GET /api/catalog/categories`. Hero images use fallbacks in `src/services/shopCategories.js`.

## Project layout

```
jewellery_frontend/
├── src/
│   ├── App.jsx                 # Routes
│   ├── Admin_pages/            # Admin UI
│   ├── User_pages/             # Storefront pages & components
│   ├── context/                # Cart, wishlist, admin auth
│   ├── hooks/
│   └── services/               # API helpers, config, localStorage fallbacks
├── vite.config.js              # Dev proxy → localhost:5000
└── package.json
```

## Troubleshooting

- **API 404 in dev** — Ensure the backend is running and `VITE_DEV_PROXY=true`, or set `VITE_API_URL` to the correct origin. Restart Vite after changing `.env`.  
- **CORS errors** (direct `VITE_API_URL` without proxy) — Set `CORS_ALLOWED_ORIGINS` on the API to your exact frontend origin (e.g. `https://your-app.vercel.app`).
- **Empty catalog with API on** — Check network tab for `/api/products`; verify DB seed and published products in admin.
- **Online payment unavailable** — Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the backend; see [`../docs/RAZORPAY_SETUP.md`](../docs/RAZORPAY_SETUP.md).
- **Production errors not in Sentry** — Set `VITE_SENTRY_DSN` and rebuild; see [`../docs/SENTRY_SETUP.md`](../docs/SENTRY_SETUP.md).

---

API documentation and env for the server: **`jewellery_backend/README.md`**.
