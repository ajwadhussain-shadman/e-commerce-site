# Importora - E-Commerce Platform

A modern, responsive e-commerce web application for a Bangladeshi business specializing in authentic imported consumables, lifestyle footwear, and global pantry goods.

Inspired by the clean luxury aesthetic of **Novella** and the comprehensive e-commerce experience of **GhorerBazar.com**.

---

## Storefront features

- **Original Brand Identity:** Warm-neutral luxury palette (cream, ivory, charcoal, and warm amber accents) with elegant typography.
- **7 Imported Product Categories:**
  1. *Chocolates & Snacks* (Japanese matcha KitKats, Ferrero Rocher, Lotus Biscoff, Nutella)
  2. *Japanese & Chinese Foods* (Samyang Buldak 2X spicy & carbonara ramen, Nissin Raoh, Lao Gan Ma chili crisp)
  3. *Breakfast & Cereals* (Quaker UK rolled oats, Kellogg's Special K, Dorset muesli, Weetabix)
  4. *Personal Care* (Olaplex shampoo, CeraVe cleanser, Dove UK body wash, Tresemme)
  5. *Health Drinks & Nutrition* (UK-imported Horlicks, Ovaltine, Complan, Ensure)
  6. *Sneakers & Footwear* (Nike Air Jordan 1 'Panda', Adidas Samba, New Balance 574)
  7. *Other Imported Products* (Starbucks Pike Place coffee beans, Twinings tea)
- **Centralized Dataset:** 34 realistic imported products with accurate prices in Bangladeshi Taka (BDT ৳), multi-angle galleries, specifications, stock counts, and verified origins.
- **Shared Cart & Wishlist:** Real-time context state with hydration-safe `localStorage` persistence.
- **Dynamic Delivery Calculator:** Inside Dhaka (৳120), Outside Dhaka (৳180), and automatic **Free Shipping above ৳3,000**.
- **Working Promotional Coupons:**
  - `IMPORT10` — 10% off entire order
  - `WELCOME500` — ৳500 flat discount on orders above ৳2,000
  - `FREESHIP` — Free nationwide delivery
- **Checkout Flow:** Validated cash-on-delivery ordering with server-calculated totals, stock reservation, and tracking references. Online payments are unavailable until a payment provider and server-side verification are implemented.
- **Interactive Order Tracking (`/track-order`):** 5-step visual tracking timeline from Order Placed to Handed Over to Customer.
- **Admin Dashboard (`/admin`):**
  - Database-derived order value, order count, active SKUs, and pending fulfillment counts
  - Dated revenue reporting is not yet available; the UI does not display synthetic sales figures.
  - Product management with search, category filtering, delete action, and SKU addition
  - Real-time order status workflow changer (Pending → Confirmed → Processing → Shipped → Delivered)
  - Categories & Brands directories
  - Fixed checkout coupon rules and storefront promotional banners
  - Store settings panel (values are not persisted)
- **Backend:** Express 5, Better Auth, and native MongoDB driver APIs. See [`server/README.md`](./server/README.md) for environment setup, catalog import, administrator provisioning, and verification commands.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Run Production Build Check
```bash
npm run build
npm start
```

---

## 🗺️ Key Routes Map

| Route | Description |
| :--- | :--- |
| `/` | Storefront homepage (announcement bar, hero, collections, trust badges) |
| `/products` | Catalog with category, brand, and price range filters + sorting |
| `/categories/[slug]` | Dedicated category showcase with subcategory filter pills |
| `/products/[slug]` | Product details with image gallery, specs, delivery rates, & reviews |
| `/search` | Live product search with suggestions and filter results |
| `/cart` | Shopping cart with live quantity controls and coupon engine |
| `/checkout` | Delivery address form, shipping method, and cash-on-delivery checkout |
| `/order-success` | Order confirmation receipt with tracking shortcuts |
| `/track-order` | Order timeline tracker (order reference and checkout phone required) |
| `/wishlist` | Saved products with 1-click move to cart |
| `/account` | Customer profile, addresses, and order history |
| `/login` / `/register` | Better Auth email/password authentication |
| `/admin` | Complete admin control panel & analytics overview |
| `/admin/products` | Inventory table with add/edit/delete SKU actions |
| `/admin/orders` | Order management and status updater |
| `/about`, `/contact`, `/faq` | Informational customer service pages |
