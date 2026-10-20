import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import { connectMongo, closeMongo } from "../database.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(projectRoot, "src/data/products.js");
const source = await readFile(sourcePath, "utf8");
const start = source.indexOf("export const products =");
const end = source.indexOf("export const brands =");
if (start < 0 || end < 0 || end <= start) throw new Error("Could not locate the static product catalog source.");
const catalogExpression = source.slice(start, end).replace("export const products =", "globalThis.catalog =");
const catalog = vm.runInNewContext(`${catalogExpression}; catalog`, Object.create(null), { timeout: 5000 });
if (!Array.isArray(catalog) || catalog.some((product) => !product.id || !product.slug)) {
  throw new Error("The source catalog is missing required product identifiers or slugs.");
}

const apply = process.argv.includes("--apply");
let mongo;
try {
  mongo = await connectMongo();
  const collection = mongo.db.collection("products");
  if (!apply) {
    console.log(`Dry run: ${catalog.length} catalog products are ready for safe insertion into the importora database. Re-run with --apply to insert missing products.`);
  } else {
    const operations = catalog.map((product) => ({
      updateOne: {
        filter: { $or: [{ id: product.id }, { slug: product.slug }] },
        update: { $setOnInsert: { ...product, createdAt: new Date(), updatedAt: new Date() } },
        upsert: true,
      },
    }));
    const result = await collection.bulkWrite(operations, { ordered: false });
    console.log(`Catalog import finished. Inserted ${result.upsertedCount} missing products; existing records were left unchanged.`);
  }
} finally {
  await closeMongo();
}
