import "dotenv/config";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { Pool } from "pg";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { reservePayment, expirePayments } from "../lib/payments";
import { sizesForColor } from "../lib/variants";
import { orderFinance } from "../lib/finance";
import { calculateProductPricing } from "../lib/pricing/product-pricing";

async function main() {
  const schema = `titip_test_${crypto.randomUUID().replaceAll("-", "")}`;
  assert.match(schema, /^titip_test_[a-f0-9]{32}$/);
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const setup = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
  const pool = new Pool({ connectionString, max: 12, options: `-c search_path=${schema}`, connectionTimeoutMillis: 8000 });
  const db = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  let created = false;
  try {
    await setup.query(`CREATE SCHEMA "${schema}"`); created = true;
    const client = await setup.connect();
    try {
      await client.query(`SET search_path TO "${schema}"`);
      for (const folder of (await readdir("prisma/migrations")).sort()) {
        if (!/^\d/.test(folder)) continue;
        const sql = await readFile(`prisma/migrations/${folder}/migration.sql`, "utf8");
        await client.query(sql);
      }
    } finally { client.release(); }
    console.log("PASS: full migration chain applies in an isolated schema");
    const variants = [31,32,33,34].map(size => ({colorName:"Black",size:String(size),model:null})).concat([36,37,38].map(size => ({colorName:"Brown",size:String(size),model:null})));
    assert.deepEqual(sizesForColor(variants,"Black"),["31","32","33","34"]);
    assert.deepEqual(sizesForColor(variants,"Brown"),["36","37","38"]);
    assert.deepEqual(sizesForColor(variants,null),[]);
    console.log("PASS A: color-specific sizes");
    async function allocate(total=100000) {
      return db.$transaction(async tx => {
        const order = await tx.order.create({data:{orderNumber:crypto.randomUUID(),subtotal:total,total}});
        return reservePayment(tx,order.id,total);
      }, { maxWait: 60000, timeout: 30000 });
    }
    const a = await allocate(), b = await allocate();
    assert.equal(a.uniqueCode,1); assert.equal(b.uniqueCode,2);
    assert.equal(Number(a.transferAmount),100001);
    console.log("PASS B: active suffix remains locked");
    await db.payment.update({where:{id:a.id},data:{status:"VERIFIED"}});
    const c = await allocate(); assert.equal(c.uniqueCode,1);
    const history = await db.payment.findUniqueOrThrow({where:{id:a.id}});
    assert.equal(history.uniqueCode,1);assert.equal(Number(history.transferAmount),100001);
    console.log("PASS C: verification releases code without changing history");
    const concurrent = await Promise.all(Array.from({length:20},()=>allocate(200000)));
    assert.equal(new Set(concurrent.map(p=>p.uniqueCode)).size,20);
    console.log("PASS D: 20 concurrent transactions receive distinct active codes");
    for(let i=0;i<98;i++) await allocate();
    await assert.rejects(allocate(), /Kode pembayaran sementara penuh/);
    console.log("PASS E: 100 occupied codes reject allocation safely");
    const financial = orderFinance({total:100000,totalCostSnapshot:new Prisma.Decimal(70000)});
    assert.equal(financial.revenue,100000);assert.equal(financial.profit,30000);
    console.log("PASS F: suffix excluded from revenue and profit");
    await db.payment.update({where:{id:b.id},data:{status:"REJECTED",rejectionReason:"Test rejection"}});
    const renewed = await db.$transaction(tx=>reservePayment(tx,b.orderId,100000));
    const attempt=await db.paymentAttempt.findFirstOrThrow({where:{paymentId:b.id}});
    assert.equal(attempt.status,"REJECTED");assert.equal(Number(attempt.transferAmount),100002);assert.equal(renewed.uniqueCode,2);
    const expiring = await allocate(300000);
    await db.payment.update({where:{id:expiring.id},data:{expiresAt:new Date(0)}});
    await db.$transaction(tx=>expirePayments(tx));
    assert.equal((await db.payment.findUniqueOrThrow({where:{id:expiring.id}})).status,"EXPIRED");
    const reviewing=await allocate(400000);
    await db.payment.update({where:{id:reviewing.id},data:{status:"WAITING_VERIFICATION",expiresAt:new Date(0)}});
    await db.$transaction(tx=>expirePayments(tx));
    assert.equal((await db.payment.findUniqueOrThrow({where:{id:reviewing.id}})).status,"WAITING_VERIFICATION");
    await assert.rejects(db.payment.update({where:{id:concurrent[1].id},data:{uniqueCode:concurrent[0].uniqueCode,transferAmount:concurrent[0].transferAmount}}));
    console.log("PASS: rejected history, expiry, review protection, database uniqueness constraint");
    const pricing=calculateProductPricing({purchasePriceCny:100,exchangeRate:2200,chinaShipping:10000,internationalShipping:20000,tax:5000,additionalCost:5000,marginType:"FIXED",marginFixed:1234,roundingType:"ROUND_5000"});
    assert.equal(Number(pricing.totalCost),260000);assert.equal(Number(pricing.finalSellingPrice),265000);assert.equal(Number(pricing.profit),5000);
    console.log("PASS: China shipping, cost conversion, rounding, actual selling-price profit");
  } finally {
    await db.$disconnect(); await pool.end();
    // Only remove the exact randomly named schema created by this test run.
    if(created) await setup.query(`DROP SCHEMA "${schema}" CASCADE`);
    await setup.end();
  }
}
main().catch(error=>{console.error(error instanceof Error ? error.message : "Workflow test failed");process.exitCode=1;});
