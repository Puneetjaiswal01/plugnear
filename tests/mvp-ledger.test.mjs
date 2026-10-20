import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {btree_gist} from '@electric-sql/pglite/contrib/btree_gist';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
let pg;const host=randomUUID(),driver=randomUUID(),stranger=randomUUID();
async function as(uid,sql,args=[]){await pg.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${uid}',false)`);try{return await pg.query(sql,args)}finally{await pg.exec('reset role')}}
async function booking(){const c=randomUUID();await pg.query("insert into public.chargers(id,owner_id,title,address,latitude,longitude,connector,power_kw,price_per_kwh,status) values($1,$2,'MVP test charger','Test charging location, Mumbai',19.07,72.87,'Type 2',7.4,15,'approved')",[c,host]);await pg.query("insert into public.availability(charger_id,starts_at,ends_at) values($1,now(),now()+interval '1 day')",[c]);const r=await as(driver,"select * from public.reserve_charger($1,now()+interval '5 minutes',now()+interval '65 minutes',5,$2)",[c,randomUUID()]);const b=r.rows[0];await as(host,'select public.respond_to_booking($1,true)',[b.id]);return {c,id:b.id};}
before(async()=>{
 pg=new PGlite({extensions:{btree_gist,pgcrypto}});await pg.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb,is_anonymous boolean default false,email_confirmed_at timestamptz default now(),phone_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;");
 for(const f of ['20261019035544_plugnear_marketplace_core.sql','20261019035918_plugnear_booking_workflows.sql'])await pg.exec(await readFile(new URL('../supabase/migrations/'+f,import.meta.url),'utf8'));
 await pg.exec('grant select,insert,update,delete on all tables in schema public to authenticated;grant usage on schema public to authenticated,anon;');
 for(const f of ['marketplace_expansion.sql','mvp_core.sql','mvp_checkout_hardening.sql'])await pg.exec(await readFile(new URL('../supabase/schema/'+f,import.meta.url),'utf8'));
 await pg.query('insert into auth.users(id) values($1),($2),($3)',[host,driver,stranger]);await pg.query("insert into public.host_verifications(user_id,legal_name,evidence_note,status) values($1,'Test host','Verified test-host evidence','verified')",[host]);await as(host,"select public.save_host_upi('testhost@bank','Test Host')");
});after(async()=>pg?.close());
test('unverified members cannot create chargers or expose payout details',async()=>{
 await assert.rejects(as(driver,"insert into public.chargers(owner_id,title,address,latitude,longitude,connector,power_kw,price_per_kwh) values($1,'Test charger','Test address, Mumbai',19,72,'Type 2',7.4,15)",[driver]),/row-level security/);
 await assert.rejects(as(driver,"select public.save_host_upi('wrong@bank','Wrong Host')"),/Verified host required/);
 await assert.rejects(as(driver,'select * from private.host_payment_details'),/permission denied/);
});
test('checkout is party-restricted and snapshots price and VPA',async()=>{
 const b=await booking();await assert.rejects(as(stranger,'select public.get_booking_checkout($1)',[b.id]),/Booking unavailable/);
 const r=await as(driver,'select public.get_booking_checkout($1) as value',[b.id]);assert.equal(r.rows[0].value.amount_paise,7500);assert.equal(r.rows[0].value.bank_verified,false);
 await as(host,"select public.save_host_upi('changed@bank','Test Host')");const next=await as(driver,'select public.get_booking_checkout($1) as value',[b.id]);assert.equal(next.rows[0].value.upi_vpa,r.rows[0].value.upi_vpa);
});
test('driver reports payment but cannot confirm receipt or start charging',async()=>{
 const b=await booking();await as(driver,'select public.get_booking_checkout($1)',[b.id]);await as(driver,"select public.report_upi_payment($1,'123456789012')",[b.id]);
 await assert.rejects(as(driver,'select public.confirm_upi_receipt($1)',[b.id]),/not allowed/);await assert.rejects(as(driver,'select public.start_charging($1)',[b.id]),/Host action required/);
 assert.equal((await pg.query('select payment_status from public.bookings where id=$1',[b.id])).rows[0].payment_status,'reported');
});
test('host cannot confirm unreported payment and session requires host receipt',async()=>{
 const b=await booking();await as(driver,'select public.get_booking_checkout($1)',[b.id]);await assert.rejects(as(host,'select public.confirm_upi_receipt($1)',[b.id]),/not allowed/);await assert.rejects(as(host,'select public.start_charging($1)',[b.id]),/not actionable/);
 await as(driver,"select public.report_upi_payment($1,'123456789013')",[b.id]);await as(host,'select public.confirm_upi_receipt($1)',[b.id]);
 assert.equal((await pg.query('select payment_status from public.bookings where id=$1',[b.id])).rows[0].payment_status,'host_confirmed');
 await as(host,'select public.start_charging($1)',[b.id]);assert.equal((await pg.query('select status from public.bookings where id=$1',[b.id])).rows[0].status,'charging');
 await assert.rejects(as(driver,"select public.reserve_charger($1,now()+interval '2 hours',now()+interval '3 hours',5,$2)",[b.c,randomUUID()]),/Charger unavailable/);
 await as(host,'select public.complete_charging($1)',[b.id]);assert.equal((await pg.query('select status from public.bookings where id=$1',[b.id])).rows[0].status,'completed');
});
test('offline charger rejects new requests and occupancy writes bump revisions',async()=>{
 const b=await booking();const before=(await pg.query('select availability_revision from public.chargers where id=$1',[b.c])).rows[0].availability_revision;assert.ok(Number(before)>0);
 await as(host,'select public.set_charger_online($1,false)',[b.c]);await assert.rejects(as(driver,"select public.reserve_charger($1,now()+interval '2 hours',now()+interval '3 hours',5,$2)",[b.c,randomUUID()]),/Charger unavailable/);
 await assert.rejects(as(stranger,'select public.set_charger_online($1,true)',[b.c]),/Verified host required/);
});

test('host cannot acknowledge the same transfer for two bookings',async()=>{
 const first=await booking(),second=await booking();
 for(const b of [first,second]){await as(driver,'select public.get_booking_checkout($1)',[b.id]);await as(driver,"select public.report_upi_payment($1,'DUPLICATE12345')",[b.id]);}
 await as(host,'select public.confirm_upi_receipt($1)',[first.id]);
 await assert.rejects(as(host,'select public.confirm_upi_receipt($1)',[second.id]),/unique|duplicate/i);
 assert.equal((await pg.query('select payment_status from public.bookings where id=$1',[second.id])).rows[0].payment_status,'reported');
});
test('existing checkout cannot be reopened for a suspended charger',async()=>{const b=await booking();await as(driver,'select public.get_booking_checkout($1)',[b.id]);await pg.query("update public.chargers set status='suspended' where id=$1",[b.c]);await assert.rejects(as(driver,'select public.get_booking_checkout($1)',[b.id]),/Checkout unavailable/);});
