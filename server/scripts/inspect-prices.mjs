/**
 * Read-only price/image audit for the Importora catalog.
 *
 * Prints only counts and the affected product fields; it never writes to the
 * database. Configure MONGODB_URI outside this script and never commit it.
 */
import "dotenv/config";
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not configured; price inspection skipped.");
  process.exit(0);
}

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
try {
  await client.connect();
  const products = await client.db("importora").collection("products")
    .find({}, { projection: { name: 1, price: 1, discountPrice: 1, slug: 1, image: 1, images: 1, imageAssets: 1 } })
    .toArray();
  const hasFractional = (value) => value !== null && value !== undefined && !Number.isInteger(Number(value));
  const fractionalPrice = products.filter((product) => hasFractional(product.price));
  const fractionalSale = products.filter((product) => hasFractional(product.discountPrice));
  console.log(`products=${products.length}`);
  console.log(`fractional_price=${fractionalPrice.length}`);
  console.log(`fractional_sale_price=${fractionalSale.length}`);
  console.log("affected_products=" + JSON.stringify([...new Set([...fractionalPrice, ...fractionalSale])].map((product) => ({
    name: product.name,
    slug: product.slug,
    price: product.price,
    discountPrice: product.discountPrice ?? null,
  })), null, 2));
  console.log(`products_with_images_array=${products.filter((product) => Array.isArray(product.images) && product.images.length).length}`);
  console.log(`products_with_legacy_image_only=${products.filter((product) => !(Array.isArray(product.images) && product.images.length) && typeof product.image === "string" && product.image.trim()).length}`);
  console.log(`products_with_cloudinary_assets=${products.filter((product) => Array.isArray(product.imageAssets) && product.imageAssets.length).length}`);
} catch (error) {
  console.error(`Price inspection failed (${error?.name || "database error"}).`);
  process.exitCode = 1;
} finally {
  await client.close().catch(() => {});
}
