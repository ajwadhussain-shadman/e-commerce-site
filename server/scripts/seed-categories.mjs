import { pathToFileURL } from "node:url";

const CATEGORY_NAMES = {
  "breakfast-cereals": "Breakfast & Cereals",
  "chocolates-snacks": "Chocolates & Snacks",
  "footwear-sneakers": "Footwear & Sneakers",
  "health-nutrition": "Health & Nutrition",
  "noodles-asian-foods": "Noodles & Asian Foods",
  "other-imported": "Other Imported Goods",
  "personal-care": "Personal Care",
};

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function displayName(slug) {
  return CATEGORY_NAMES[slug] || slug.split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

export async function seedCategorySubcategories(db, now = new Date()) {
  if (!db || db.databaseName !== "importora" || typeof db.collection !== "function") {
    throw new Error("Refusing to seed: the connected database must be importora.");
  }

  const products = db.collection("products");
  const categories = db.collection("categories");
  const [productCategories, existingCategories] = await Promise.all([
    products.distinct("category"),
    categories.find({}).toArray(),
  ]);

  const summary = { created: 0, updated: 0, unchanged: 0, skipped: 0, subcategoriesAdded: 0 };
  for (const rawCategory of productCategories) {
    if (typeof rawCategory !== "string" || !rawCategory.trim()) continue;
    const slug = slugify(rawCategory);
    if (!slug) { summary.skipped += 1; continue; }

    const matchingCategory = existingCategories.find((category) =>
      category.slug === rawCategory || category.slug === slug || slugify(category.name) === slug,
    );
    const productRecords = await products.find({ category: rawCategory }).toArray();
    const productSubcategories = [...new Set(productRecords
      .map((product) => product.subcategory)
      .filter((subcategory) => typeof subcategory === "string" && subcategory.trim())
      .map((subcategory) => subcategory.trim()))];
    if (!productSubcategories.length) { summary.skipped += 1; continue; }

    if (!matchingCategory) {
      await categories.insertOne({
        id: slug,
        slug,
        name: displayName(slug),
        description: "",
        image: "",
        banner: "",
        subcategories: productSubcategories,
        createdAt: now,
        updatedAt: now,
      });
      existingCategories.push({ slug, name: displayName(slug), subcategories: productSubcategories });
      summary.created += 1;
      summary.subcategoriesAdded += productSubcategories.length;
      continue;
    }

    if (matchingCategory.subcategories !== undefined && !Array.isArray(matchingCategory.subcategories)) {
      summary.skipped += 1;
      continue;
    }
    const current = Array.isArray(matchingCategory.subcategories) ? matchingCategory.subcategories : [];
    const known = new Set(current.filter((item) => typeof item === "string").map((item) => item.trim().toLocaleLowerCase()));
    const additions = productSubcategories.filter((subcategory) => !known.has(subcategory.toLocaleLowerCase()));
    if (!additions.length) {
      summary.unchanged += 1;
      continue;
    }
    await categories.updateOne(
      { _id: matchingCategory._id },
      { $addToSet: { subcategories: { $each: additions } }, $set: { updatedAt: now } },
    );
    matchingCategory.subcategories = [...current, ...additions];
    summary.updated += 1;
    summary.subcategoriesAdded += additions.length;
  }
  return summary;
}

async function main() {
  if (process.argv[2] !== "--confirm-database" || process.argv[3] !== "importora") {
    throw new Error("Run with: npm run seed:categories -- --confirm-database importora");
  }
  const dotenv = await import("dotenv");
  dotenv.config({ quiet: true });
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI must be configured before seeding categories.");

  const { connectMongo, closeMongo } = await import("../database.mjs");
  try {
    const { db } = await connectMongo();
    if (db.databaseName !== "importora") throw new Error("Refusing to seed: connected database is not importora.");
    const summary = await seedCategorySubcategories(db);
    console.log(`Category seed completed for database ${db.databaseName}: ${summary.created} created, ${summary.updated} updated, ${summary.unchanged} unchanged, ${summary.skipped} skipped; ${summary.subcategoriesAdded} catalog subcategories added.`);
  } finally {
    await closeMongo();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Category seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}
