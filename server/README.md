# Importora backend operations

The Express 5 API on port 5000 is the only Better Auth server. It uses the shared native MongoDB client in `database.mjs` and always selects the `importora` database. Mongoose is not used.

## Environment

Configure these names in the project root `.env` for the backend and in Next.js' environment files for the public frontend values. Keep real values out of source control and logs.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Express and maintenance scripts | MongoDB Atlas connection string; the application selects the `importora` database explicitly. |
| `TEST_MONGODB_URI` | Integration test runner only | Dedicated isolated MongoDB URI with an explicit database named `importora_test` or `importora_test_<suffix>`. Never point this at the live application database. |
| `BETTER_AUTH_SECRET` | Express | Better Auth signing/encryption secret; use a long, randomly generated value. |
| `BETTER_AUTH_URL` | Express | Backend origin, such as `http://localhost:5000` locally. |
| `BETTER_AUTH_COOKIE_SAME_SITE` | Express | Optional `lax` (default) or `none`; `none` requires HTTPS and is intended only when the storefront and API are cross-site. |
| `FRONTEND_ORIGINS` | Express and Better Auth | Comma-separated exact browser origins; local default is `http://localhost:3000`. No wildcard is used with credentials. |
| `NEXT_PUBLIC_AUTH_URL` | Next.js browser client | Better Auth origin; local default is `http://localhost:5000`. |
| `NEXT_PUBLIC_API_URL` | Next.js browser services | API base including `/api`; local default is `http://localhost:5000/api`. |
| `PORT` | Express | Optional API listen port; defaults to `5000`. |
| `CLOUDINARY_CLOUD_NAME` | Express | Cloudinary account cloud name used to sign product uploads. |
| `CLOUDINARY_API_KEY` | Express | Cloudinary API key used by the backend when forwarding signed uploads. |
| `CLOUDINARY_API_SECRET` | Express | Cloudinary signing secret; backend only, never put in a `NEXT_PUBLIC_*` variable. |
| `ADMIN_EMAIL` | Admin provisioning script | Exact email of an already registered user to promote with an explicit operator command. |
| `ADMIN_PROVISION_ENV` | Admin provisioning script | Explicit target environment: `development`, `staging`, or `production`. |
| `ADMIN_PROVISION_CONFIRM` | Admin provisioning script | Must exactly equal `PROMOTE_EXISTING_USER_TO_ADMIN_IN_<ENV>_IMPORTORA` for the selected environment. |

For local development, run the existing Next.js frontend on port 3000 and `npm run start:api` for Express. In production, set `BETTER_AUTH_URL`, `NEXT_PUBLIC_AUTH_URL`, and `NEXT_PUBLIC_API_URL` to the HTTPS backend origin and API path; set `FRONTEND_ORIGINS` to the exact HTTPS storefront origin(s). Better Auth uses `HttpOnly` cookies, secure cookies for HTTPS/production, and `SameSite=Lax` by default. Prefer serving the storefront and API on the same site (for example, separate subdomains under one registrable domain). If they must be cross-site, configure `BETTER_AUTH_COOKIE_SAME_SITE=none`, keep HTTPS enabled, and verify browser cookie behavior; Safari may block third-party cookies. Atlas must allow the deployment network and the database user should have only the access required for the `importora` database. Use HTTPS at the edge, preserve credentialed requests and `Set-Cookie` headers through the reverse proxy, and never use wildcard credentialed CORS.

## Data and indexes

Products, categories, orders, reviews, and role audits use the native driver in the existing `products`, `categories`, `orders`, `reviews`, and `roleAudit` collections. Startup creates indexes for product/category slugs, category/brand filters, unique review-per-user/product, review publication lookups, unique order references and checkout request keys, user order history, and status queries. The unique indexes are skipped when legacy duplicates are detected; the server reports that condition without changing records. Review duplicates and resolve them deliberately before creating those unique indexes manually.

Product ratings and review counts served by the API are calculated only from `reviews` documents whose status is `approved`. Review submissions require a Better Auth customer session, start as `pending`, and only one review per user/product is accepted. No purchase verification is claimed. Admin moderation actions are recorded in each review's moderation history. The storefront displays approved reviews only.

The protected admin panel is available at `/admin`. It includes live dashboard metrics, server-paged product management (`/admin/products`), category CRUD (`/admin/categories`), paged order search and status transitions (`/admin/orders`), review moderation (`/admin/reviews`), and customer/user administration (`/admin/customers`, `/admin/users`). Every admin API independently verifies a Better Auth session and current MongoDB role. Product deletion archives a product when an order references it, preserving the order's product snapshot; otherwise only that product record is removed. Banner management, coupon CRUD, and editable store settings are not implemented and are explicitly marked unavailable rather than showing sample records.

Product images upload as authenticated multipart requests to Express. The backend validates file signatures and MIME types, caps uploads at 20 images per request and 10 MB per image, then streams the files to Cloudinary with the official Node.js SDK. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` only in the Express host environment. The API secret never belongs in a `NEXT_PUBLIC_*` variable. Cloudinary assets use the `importora/products` folder; their secure URLs and public IDs are stored with products. The API deletes old assets only after a successful MongoDB update and only when no product or order snapshot references them. Missing or rejected Cloudinary configuration returns a safe setup error without revealing credentials.

The live storefront catalog is read from the `products` collection. The source catalog in `src/data/products.js` is retained for the insert-only import tool; the UI does not silently fall back to it when the API is unavailable. On a new environment, review a dry run with `npm run import:catalog`, then run `npm run import:catalog -- --apply` only against the intended database to insert missing entries. Order checkout accepts only IDs backed by database products and calculates amounts from those records. Do not import old browser-local sample orders; they are presentation data, not verified customer orders.

Category subcategories are stored as a string array on each document in the `categories` collection. The Add Product form gets its options from `GET /api/categories`, and the product API validates the selected subcategory against the selected category. To initialize or reconcile category documents from existing product category/subcategory values, run `npm run seed:categories -- --confirm-database importora` with the intended backend `MONGODB_URI` configured. The shared connection explicitly selects `importora`; the seed command refuses other database names, only inserts missing category documents or merges missing catalog-backed subcategories, and is safe to rerun. It never changes products or orders.

New COD orders atomically reserve stock and insert the order in a MongoDB transaction (Atlas supports transactions). Payment integrations other than cash on delivery are rejected until a provider with server-side verification is configured. Shipping rates and the existing `IMPORT10`, `WELCOME500`, and `FREESHIP` rules are calculated on the server.

## Authentication and admin access

Public registration always receives the server-owned `customer` role. Admin APIs verify both the Better Auth session and the current role in MongoDB on every request. User role changes run in a MongoDB transaction behind a shared mutation lock, use a compare-and-set update, and write a role audit record containing user IDs and role values only. The last active administrator cannot be demoted. The admin UI links are shown only for an admin session; API checks remain authoritative.

The initial administrator must already have a registered account. The provisioning script changes only that exact existing email and refuses to proceed unless the environment and confirmation string are supplied. Do not run it during automated tests or from a public request. Safe PowerShell procedure (replace the placeholders with the intended account and environment, and verify the URI is for that environment before executing):

1. Register the intended account normally and verify its identity and exact email in the Better Auth `user` collection.
2. Enter the verified Atlas URI for the selected environment at the secure prompt and set `ADMIN_EMAIL` to the exact email of that already registered account. The application selects the `importora` database on that cluster; never use a URI for a different environment:

   ```powershell
   $targetMongoUri = Read-Host -Prompt "Enter the verified <ENV>-only Atlas URI" -AsSecureString
   $env:MONGODB_URI = [System.Net.NetworkCredential]::new("", $targetMongoUri).Password
   $env:ADMIN_EMAIL = "<exact-email-of-existing-account>"
   $env:ADMIN_PROVISION_ENV = "<development|staging|production>"
   $env:ADMIN_PROVISION_CONFIRM = "PROMOTE_EXISTING_USER_TO_ADMIN_IN_<ENV>_IMPORTORA"
   try { npm run provision:admin } finally {
     Remove-Item Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
     Remove-Item Env:ADMIN_PROVISION_ENV -ErrorAction SilentlyContinue
     Remove-Item Env:ADMIN_PROVISION_CONFIRM -ErrorAction SilentlyContinue
     Remove-Item Env:MONGODB_URI -ErrorAction SilentlyContinue
     $targetMongoUri = $null
   }
   ```

3. In the confirmation string, replace `<ENV>` with the uppercase environment, e.g. staging becomes `PROMOTE_EXISTING_USER_TO_ADMIN_IN_STAGING_IMPORTORA`. Confirm the command reports an existing account was updated, then sign out and back in before checking the admin dashboard. If the account does not exist or the confirmation is incomplete, it exits without creating an account or changing a role. The operation shares the role-change transaction lock and records a safe audit event.

If all administrators become inaccessible, the project owner must verify the intended database/environment, register or identify the intended account, and run this trusted server-side provisioning command against that environment. There is no public recovery endpoint.

Customers' order lists and receipts are scoped to their Better Auth user ID. Guest tracking requires both the order reference and an exact phone-number match; the tracking API omits email, street address, notes, and phone from its response. Existing legacy orders without a user ID remain available to authorized administrators and can be tracked using the checkout phone number.

## Checks

Run `npm run test:api`, `npm run test:integration`, `npm run lint`, and `npm run build`. The API tests use in-memory collection fakes and never connect to Atlas. The integration suite requires `TEST_MONGODB_URI` targeting a database named `importora_test` (or `importora_test_<suffix>`); it creates unique test-only accounts, a test-only product, and a COD order, then deletes only those records. It never drops a database or collection. MongoDB transactions require Atlas or another replica set. The test runner rejects `NODE_ENV=production`, database names outside that test allowlist, and an exact match with `MONGODB_URI`. Run `npm run start:api` to start the application API after its required environment is configured.

### Production frontend/backend origins

Set backend-only variables in the API host's secret environment configuration: `MONGODB_URI` (production Atlas cluster), `BETTER_AUTH_SECRET` (random secret of at least 32 bytes), `BETTER_AUTH_URL` (the actual HTTPS API origin), and `FRONTEND_ORIGINS` (comma-separated exact HTTPS storefront origins, without paths or wildcard). Set `BETTER_AUTH_COOKIE_SAME_SITE=lax` when frontend and API are same-site; use `none` only for cross-site deployment over HTTPS. Set public frontend variables in the Next.js/Vercel project environment: `NEXT_PUBLIC_AUTH_URL` (same HTTPS API origin) and `NEXT_PUBLIC_API_URL` (that origin plus `/api`). Use the actual deployed origins; do not invent a domain. Preserve credentials and `Set-Cookie` through any proxy. Local defaults are for development and must not be used in production.
