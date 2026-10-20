import "dotenv/config";
import { connectMongo, closeMongo } from "../database.mjs";

const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const environment = String(process.env.ADMIN_PROVISION_ENV || "").trim().toLowerCase();
const confirmation = String(process.env.ADMIN_PROVISION_CONFIRM || "");
const expectedConfirmation = environment ? `PROMOTE_EXISTING_USER_TO_ADMIN_IN_${environment.toUpperCase()}_IMPORTORA` : "";
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Set ADMIN_EMAIL to the exact email of an already registered account. No account is created by this command.");
  process.exitCode = 1;
} else if (!new Set(["development", "staging", "production"]).has(environment) || confirmation !== expectedConfirmation) {
  console.error("Set ADMIN_PROVISION_ENV and ADMIN_PROVISION_CONFIRM to explicitly confirm the intended importora database and environment.");
  process.exitCode = 1;
} else {
  let mongo;
  try {
    mongo = await connectMongo();
    const { client, db } = mongo;
    await db.collection("system").updateOne(
      { _id: "admin-role-mutation-lock" }, { $setOnInsert: { revision: 0 } }, { upsert: true },
    );
    try { await db.createCollection("roleAudit"); }
    catch (error) { if (error?.code !== 48 && error?.codeName !== "NamespaceExists") throw error; }
    const session = client.startSession();
    let outcome = "missing";
    try {
      await session.withTransaction(async () => {
        await db.collection("system").updateOne(
          { _id: "admin-role-mutation-lock" }, { $inc: { revision: 1 } }, { session },
        );
        const user = await db.collection("user").findOne({ email }, {
          session, projection: { id: 1, _id: 1, role: 1 },
        });
        if (!user) { outcome = "missing"; return; }
        const previousRole = user.role === "admin" ? "admin" : "customer";
        if (previousRole === "admin") { outcome = "already-admin"; return; }
        const changedAt = new Date();
        const updated = await db.collection("user").updateOne(
          { _id: user._id, email, role: user.role },
          { $set: { role: "admin", updatedAt: changedAt } }, { session },
        );
        if (!updated.matchedCount) throw new Error("The target account changed during provisioning; retry after reviewing it.");
        await db.collection("roleAudit").insertOne({
          actorUserId: `bootstrap:${environment}`, targetUserId: String(user.id || user._id),
          fromRole: previousRole, toRole: "admin", changedAt,
        }, { session });
        outcome = "updated";
      });
    } finally {
      await session.endSession();
    }
    if (outcome === "missing") {
      console.error("No existing Better Auth user matched ADMIN_EMAIL. Confirm the exact intended account is registered first.");
      process.exitCode = 1;
    } else if (outcome === "already-admin") {
      console.log(`The explicitly selected account is already an administrator in ${environment}.`);
    } else {
      console.log(`Administrator role assigned to the existing account in the explicitly confirmed ${environment} environment.`);
    }
  } catch {
    console.error("Admin provisioning failed. Verify the confirmed database target and transaction support; no credentials were printed.");
    process.exitCode = 1;
  } finally {
    await closeMongo();
  }
}
