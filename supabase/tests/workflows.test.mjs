import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
let pg;
const host = "00000000-0000-4000-8000-000000000001",
  driver = "00000000-0000-4000-8000-000000000002",
  stranger = "00000000-0000-4000-8000-000000000003",
  admin = "00000000-0000-4000-8000-000000000004",
  charger = "10000000-0000-4000-8000-000000000001";
const start = new Date(Date.now() + 2 * 86400000).toISOString(),
  end = new Date(Date.now() + 2 * 86400000 + 3600000).toISOString(),
  key = "20000000-0000-4000-8000-000000000001";
let booking;
async function as(uid, sql, args = []) {
  await pg.exec(
    `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${uid}',false);`,
  );
  try {
    return await pg.query(sql, args);
  } finally {
    await pg.exec("reset role;");
  }
}
async function reserve(uid = driver, k = key, s = start, e = end) {
  return as(uid, "select * from public.reserve_charger($1,$2,$3,5,$4)", [
    charger,
    s,
    e,
    k,
  ]);
}
before(async () => {
  pg = new PGlite({ extensions: { btree_gist, pgcrypto } });
  await pg.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb,is_anonymous boolean default false,email_confirmed_at timestamptz default now(),phone_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`,
  );
  for (const f of (await readdir(new URL("../migrations/", import.meta.url)))
    .filter((f) => f.endsWith("_plugnear_marketplace_core.sql") || f.endsWith("_plugnear_booking_workflows.sql"))
    .sort())
    await pg.exec(
      await readFile(new URL("../migrations/" + f, import.meta.url), "utf8"),
    );
  await pg.exec(
    "grant select,insert,update,delete on all tables in schema public to authenticated;grant usage on schema public to authenticated,anon;",
  );
  await pg.exec(
    await readFile(
      new URL("../schema/marketplace_expansion.sql", import.meta.url),
      "utf8",
    ),
  );
  await pg.exec(
    `insert into auth.users(id) values('${host}'),('${driver}'),('${stranger}'),('${admin}');update private.account_access set role='admin' where user_id='${admin}';`,
  );
  await pg.query(
    "insert into public.chargers(id,owner_id,title,address,latitude,longitude,connector,power_kw,price_per_kwh) values($1,$2,$3,$4,19.07,72.87,$5,7.4,15)",
    [charger, host, "Neighbourhood charger", "Powai, Mumbai, India", "Type 2"],
  );
  await as(
    host,
    "insert into public.availability(charger_id,starts_at,ends_at) values($1,now()+interval '1 day',now()+interval '4 days')",
    [charger],
  );
});
after(async () => {
  await pg?.close();
});
test("auth bootstrap creates private member and self profile", async () => {
  const a = await as(driver, "select public.my_access() as access");
  assert.deepEqual(a.rows[0].access, { active: true, admin: false });
  const p = await as(driver, "select id from public.profiles");
  assert.deepEqual(
    p.rows.map((x) => x.id),
    [driver],
  );
});
test("unverified and pending charger cannot be reserved", async () => {
  await assert.rejects(reserve(), /Charger unavailable/);
});
test("host cannot self-approve or forge verification", async () => {
  await assert.rejects(
    as(host, "update public.chargers set status='approved' where id=$1", [
      charger,
    ]),
    /row-level security|permission denied/g,
  );
  await assert.rejects(
    as(
      host,
      "insert into public.host_verifications(user_id,legal_name,evidence_note,status) values($1,'Host','Evidence for verification testing','verified')",
      [host],
    ),
    /row-level security|permission denied/g,
  );
});
test("member cannot use admin actions", async () => {
  await assert.rejects(
    as(
      driver,
      "select public.admin_action('charger',$1,'approved','Test malicious request')",
      [charger],
    ),
    /Administrator access required/,
  );
});
test("admin cannot approve charger without verified host", async () => {
  await assert.rejects(
    as(
      admin,
      "select public.admin_action('charger',$1,'approved','Reviewed installation')",
      [charger],
    ),
    /prerequisite unmet/,
  );
});
test("host verification and admin approval are audited", async () => {
  await as(
    host,
    "insert into public.host_verifications(user_id,legal_name,evidence_note) values($1,'Test host','Ownership and installation reviewed in test')",
    [host],
  );
  await as(
    admin,
    "select public.admin_action('verification',$1,'verified','Verified ownership through review')",
    [host],
  );
  await as(
    admin,
    "select public.admin_action('charger',$1,'approved','Reviewed installation and address')",
    [charger],
  );
  const a = await as(admin, "select * from public.admin_audit");
  assert.equal(a.rows.length, 2);
});
test("reservation computes price on server and is idempotent", async () => {
  const a = await reserve();
  booking = a.rows[0].id;
  assert.equal(a.rows[0].amount_paise, 7500);
  const b = await reserve();
  assert.equal(b.rows[0].id, booking);
});
test("overlapping pending requests are rejected atomically", async () => {
  await assert.rejects(
    reserve(stranger, "20000000-0000-4000-8000-000000000002"),
    /no_overlapping_active_bookings/,
  );
});
test("idempotency keys cannot be reused for changed payloads", async () => {
  await assert.rejects(reserve(stranger), /Idempotency key conflict/);
});
test("users cannot write paid state or bypass reservation RPC", async () => {
  await assert.rejects(
    as(driver, "update public.bookings set payment_status='paid' where id=$1", [
      booking,
    ]),
    /permission denied/,
  );
  await assert.rejects(
    as(
      driver,
      "insert into public.bookings(charger_id,driver_id,starts_at,ends_at) values($1,$2,$3,$4)",
      [charger, driver, start, end],
    ),
    /permission denied/,
  );
});
test("stranger cannot read, accept or cancel someone else’s booking", async () => {
  assert.equal(
    (await as(stranger, "select * from public.bookings")).rows.length,
    0,
  );
  await assert.rejects(
    as(stranger, "select public.respond_to_booking($1,true)", [booking]),
    /not actionable/,
  );
  await assert.rejects(
    as(stranger, "select public.cancel_my_booking($1)", [booking]),
    /not actionable/,
  );
});
test("host accepts only their request; overlap remains blocked", async () => {
  const a = await as(host, "select * from public.respond_to_booking($1,true)", [
    booking,
  ]);
  assert.equal(a.rows[0].status, "confirmed");
  await assert.rejects(
    reserve(stranger, "20000000-0000-4000-8000-000000000003"),
    /no_overlapping_active_bookings/,
  );
});
test("adjacent windows do not overlap", async () => {
  const a = await reserve(
    stranger,
    "20000000-0000-4000-8000-000000000004",
    end,
    new Date(Date.parse(end) + 3600000).toISOString(),
  );
  assert.ok(a.rows[0].id);
});
test("cancellation releases a slot", async () => {
  await as(driver, "select public.cancel_my_booking($1)", [booking]);
  const a = await reserve(stranger, "20000000-0000-4000-8000-000000000005");
  assert.ok(a.rows[0].id);
});
test("past and out-of-availability bookings fail", async () => {
  await assert.rejects(
    reserve(
      driver,
      "20000000-0000-4000-8000-000000000006",
      "2020-01-01T00:00:00Z",
      "2020-01-01T01:00:00Z",
    ),
    /Invalid booking window/,
  );
  await assert.rejects(
    reserve(
      driver,
      "20000000-0000-4000-8000-000000000007",
      new Date(Date.now() + 6 * 86400000).toISOString(),
      new Date(Date.now() + 6 * 86400000 + 3600000).toISOString(),
    ),
    /Outside host availability/,
  );
});
test("disputes require participation; only admin resolves and audits", async () => {
  await assert.rejects(
    as(
      host,
      "insert into public.disputes(booking_id,opened_by,reason) values($1,$2,'Forged reporter identity')",
      [booking, stranger],
    ),
    /row-level security|permission denied/g,
  );
  const d = await as(
    driver,
    "insert into public.disputes(booking_id,opened_by,reason) values($1,$2,'Charger not accessible on arrival') returning id",
    [booking, driver],
  );
  await assert.rejects(
    as(driver, "update public.disputes set status='resolved'"),
    /permission denied/,
  );
  await as(
    admin,
    "select public.admin_action('dispute',$1,'resolved','Contacted both parties and resolved')",
    [d.rows[0].id],
  );
});
test("blocked users lose read and mutation access; no self escalation", async () => {
  await as(
    admin,
    "select public.admin_action('user',$1,'block','Blocked following abuse review')",
    [driver],
  );
  assert.equal(
    (await as(driver, "select * from public.profiles")).rows.length,
    0,
  );
  await assert.rejects(reserve(), /Account unavailable/);
  await assert.rejects(
    as(driver, "update private.account_access set role='admin'"),
    /permission denied/,
  );
  await assert.rejects(
    as(
      admin,
      "select public.admin_action('user',$1,'block','Trying to block self')",
      [admin],
    ),
    /Invalid admin action/,
  );
});
test("anonymous role cannot execute booking or admin RPCs", async () => {
  await pg.exec("set role anon;");
  try {
    await assert.rejects(
      pg.query("select public.my_access()"),
      /permission denied/,
    );
  } finally {
    await pg.exec("reset role;");
  }
});
test("charger registration uses allowed fields and cannot impersonate another owner", async () => {
  await assert.rejects(
    as(
      stranger,
      "insert into public.chargers(owner_id,title,address,latitude,longitude,connector,power_kw,price_per_kwh) values($1,'Test charger','Test address in Mumbai',19,72,'Type 2',7,15)",
      [host],
    ),
    /row-level security/,
  );
  const r = await as(
    stranger,
    "insert into public.chargers(owner_id,title,address,latitude,longitude,connector,power_kw,price_per_kwh) values($1,'Test charger','Test address in Mumbai',19,72,'Type 2',7,15) returning status",
    [stranger],
  );
  assert.equal(r.rows[0].status, "pending");
});
test("anonymous and unconfirmed accounts cannot use marketplace privileges", async () => {
  await pg.query("update auth.users set is_anonymous=true where id=$1", [
    stranger,
  ]);
  assert.equal(
    (await as(stranger, "select public.my_access() as a")).rows[0].a.active,
    false,
  );
  await assert.rejects(reserve(stranger), /Account unavailable/);
  await pg.query(
    "update auth.users set is_anonymous=false,email_confirmed_at=null where id=$1",
    [stranger],
  );
  assert.equal(
    (await as(stranger, "select public.my_access() as a")).rows[0].a.active,
    false,
  );
  await pg.query("update auth.users set email_confirmed_at=now() where id=$1", [
    stranger,
  ]);
});
test("table privileges exclude truncate and protected column updates", async () => {
  for (const table of ["profiles", "chargers", "bookings", "admin_audit"]) {
    const r = await pg.query(
      "select has_table_privilege('authenticated',$1,'TRUNCATE') as allowed",
      ["public." + table],
    );
    assert.equal(r.rows[0].allowed, false);
  }
  await assert.rejects(
    as(stranger, "update public.profiles set created_at=now()"),
    /permission denied/,
  );
});
