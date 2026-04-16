# SAANVI — Jewellery Storefront (React)

Customer-facing jewellery site and **admin dashboard** for the SAANVI project. Built with **Vite** and **React 19**, styled with **Tailwind CSS v4**. It talks to **`jewellery_backend`** when configured, or falls back to **browser localStorage** for demos without a server.

## Stack

- **React 19** · **React Router 7**
- **Vite 7**
- **Tailwind CSS 4** · **Swiper**
- **Axios** (where used)

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

**Recommended local flow:** backend on port **5000**, frontend with:

```env
VITE_DEV_PROXY=true
```

Then API calls use same-origin `/api/...` and the dev server forwards them to Express.

### Production build

For `npm run build`, set the public API URL (no Vite proxy in production):

```env
VITE_API_URL=https://your-api.example.com
```

See `.env.production.example` for a template.

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

### Admin

| Path | Area |
|------|------|
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard |
| `/admin/products` | Product list & CRUD |
| `/admin/categories` | Categories |
| `/admin/orders` | Orders |
| `/admin/customers` | Customers |
| `/admin/merchandising` | New arrivals IDs |

Admin JWT is stored under the key defined in `STORAGE_KEYS.adminToken` in `src/services/config.js`.

## Connecting to the backend

1. Start MongoDB-backed API: `cd jewellery_backend && npm start`  
2. In `jewellery_frontend`, use `.env` with `VITE_DEV_PROXY=true`  
3. Run `npm run dev` and open the printed local URL  

Customer **register/login** is required to **add to cart**, open the **cart**, **checkout**, and place orders. With the API active, checkout uses `POST /api/orders` with a customer JWT. **My Orders** loads from `GET /api/auth/orders` when the user is signed in.

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
- **CORS errors** (direct `VITE_API_URL` without proxy) — Backend must allow your frontend origin (`cors` is open by default in this project’s API).  
- **Empty catalog with API on** — Check network tab for `/api/products`; verify DB seed and published products in admin.

---

API documentation and env for the server: **`jewellery_backend/README.md`**.
