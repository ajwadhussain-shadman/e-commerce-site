# Novella Imports - Backend & Database Architecture

This directory contains the planned Express.js + MongoDB backend architecture for the Novella Imports e-commerce platform.

## Architecture Separation
The Next.js storefront is structured to communicate through the data service layer (`src/services/productService.js` and `src/services/orderService.js`). 

To transition from the demo local storage state to the live MongoDB database:
1. Provide the `MONGODB_URI` environment variable in `.env`.
2. Start the Express server on port 5000: `node server/server.js`.
3. In `src/services/productService.js` and `src/services/orderService.js`, update the fetch calls to target `http://localhost:5000/api`.

## Schema Models
- **Product Model (`models/Product.js`)**: Includes fields for `name`, `slug`, `brand`, `category`, `subcategory`, `price`, `discountPrice`, `stock`, `rating`, `size`, `countryOfOrigin`, and `specifications`.
- **Order Model (`models/Order.js`)**: Tracks full customer delivery details (Dhaka / all 64 districts), line items, coupon discounts, shipping fees, total BDT, payment method, and a step-by-step parcel tracking history timeline (`Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered`).

## API Endpoints Prepared
- `GET /api/products` — Product catalog with search, price range, brand, and category filtering
- `GET /api/products/:slug` — Single product details by slug
- `POST /api/orders` — Create new customer order and generate tracking reference
- `GET /api/orders/track/:orderRef` — Customer real-time parcel tracking lookup
