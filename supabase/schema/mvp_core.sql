-- Core MVP ledger and access changes (also exercised against local PostgreSQL).
alter table public.chargers add column operational_status text not null default 'available' check(operational_status in ('available','offline')),
 add column availability_revision bigint not null default 0;
alter table public.bookings drop constraint bookings_status_check;
alter table public.bookings add constraint bookings_status_check check(status in ('requested','confirmed','charging','cancelled','completed','declined'));
alter table public.bookings drop constraint bookings_payment_status_check;
alter table public.bookings add constraint bookings_payment_status_check check(payment_status in ('unpaid','reported','host_confirmed','paid','refunded'));
alter table public.bookings drop constraint no_overlapping_active_bookings;
alter table public.bookings add constraint no_overlapping_active_bookings exclude using gist
 (charger_id with =, tstzrange(starts_at,ends_at,'[)') with &&) where(status in ('requested','confirmed','charging'));
create policy verified_charger_insert on public.chargers as restrictive for insert to authenticated with check(owner_id=(select auth.uid()) and private.host_ready((select auth.uid())));
create policy verified_charger_update on public.chargers as restrictive for update to authenticated using(owner_id=(select auth.uid()) and private.host_ready((select auth.uid()))) with check(owner_id=(select auth.uid()) and private.host_ready((select auth.uid())));
-- Drivers must use guarded reservation RPCs; direct booking INSERT remains revoked.
create table private.host_payment_details (
 user_id uuid primary key references public.profiles(id),
 upi_vpa text not null check(upi_vpa ~ '^[A-Za-z0-9._-]{2,128}@[A-Za-z0-9.-]{2,64}$'),
 payee_name text not null check(length(trim(payee_name)) between 2 and 100),
 updated_at timestamptz not null default now()
);
create table private.direct_upi_payments (
 booking_id uuid primary key references public.bookings(id),
 upi_vpa text not null, payee_name text not null,
 amount_paise integer not null check(amount_paise>0),
 reported_reference text, reported_at timestamptz,
 confirmed_by uuid references public.profiles(id), confirmed_at timestamptz,
 created_at timestamptz not null default now()
);
create table private.session_events (
 id bigint generated always as identity primary key,
 booking_id uuid not null references public.bookings(id),
 actor_id uuid not null references public.profiles(id),
 action text not null, created_at timestamptz not null default now()
);
alter table private.host_payment_details enable row level security;
alter table private.direct_upi_payments enable row level security;
alter table private.session_events enable row level security;
revoke all on private.host_payment_details,private.direct_upi_payments,private.session_events from public,anon,authenticated;
create index direct_upi_confirmed_by_idx on private.direct_upi_payments(confirmed_by);
create index session_events_booking_idx on private.session_events(booking_id);
create index session_events_actor_idx on private.session_events(actor_id);
create index host_reviewed_by_idx on public.host_verifications(reviewed_by);
create index audit_actor_idx on public.admin_audit(actor_id);

create function private.save_host_upi(p_vpa text,p_name text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.host_ready(auth.uid()) then raise exception 'Verified host required'; end if;
 if p_vpa is null or p_vpa !~ '^[A-Za-z0-9._-]{2,128}@[A-Za-z0-9.-]{2,64}$' or p_name is null or length(trim(p_name)) not between 2 and 100 then raise exception 'Invalid UPI details'; end if;
 insert into private.host_payment_details(user_id,upi_vpa,payee_name) values(auth.uid(),p_vpa,trim(p_name))
 on conflict(user_id) do update set upi_vpa=excluded.upi_vpa,payee_name=excluded.payee_name,updated_at=now();
end $$;
create function public.save_host_upi(p_vpa text,p_name text) returns void language sql security invoker set search_path='' as $$ select private.save_host_upi(p_vpa,p_name) $$;
create function private.my_host_upi() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.active_user() then raise exception 'Account unavailable'; end if;
 return (select jsonb_build_object('upi_vpa',upi_vpa,'payee_name',payee_name) from private.host_payment_details where user_id=auth.uid());
end $$;
create function public.my_host_upi() returns jsonb language sql security invoker set search_path='' as $$ select private.my_host_upi() $$;
create function private.booking_checkout(p_booking uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.bookings; c public.chargers; p private.direct_upi_payments; h private.host_payment_details;
begin
 if not private.active_user() then raise exception 'Account unavailable'; end if;
 select * into c from public.chargers where id=(select charger_id from public.bookings where id=p_booking) for update;
 select * into b from public.bookings where id=p_booking for update;
 if b.id is null or (b.driver_id<>auth.uid() and c.owner_id<>auth.uid()) then raise exception 'Booking unavailable'; end if;
 if b.status not in ('confirmed','charging','completed') then raise exception 'Host must accept the request before checkout'; end if;
 select * into p from private.direct_upi_payments where booking_id=b.id;
 if p.booking_id is null then
  if b.driver_id<>auth.uid() or b.payment_status<>'unpaid' or b.amount_paise<=0 or b.ends_at<=now() or c.status<>'approved' or not private.host_ready(c.owner_id) then raise exception 'Checkout unavailable'; end if;
  select * into h from private.host_payment_details where user_id=c.owner_id;
  if h.user_id is null then raise exception 'Host has not configured a UPI address'; end if;
  insert into private.direct_upi_payments(booking_id,upi_vpa,payee_name,amount_paise) values(b.id,h.upi_vpa,h.payee_name,b.amount_paise) returning * into p;
 end if;
 return jsonb_build_object('booking_id',b.id,'upi_vpa',p.upi_vpa,'payee_name',p.payee_name,'amount_paise',p.amount_paise,'currency','INR','payment_status',b.payment_status,'reference',b.id::text,'reported_reference',p.reported_reference,'host_confirmed_at',p.confirmed_at,'bank_verified',false);
end $$;
create function public.get_booking_checkout(p_booking uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.booking_checkout(p_booking) $$;

create function private.direct_payment_action(p_booking uuid,p_action text,p_reference text) returns public.bookings language plpgsql security definer set search_path='' as $$
declare b public.bookings; c public.chargers; p private.direct_upi_payments;
begin
 if not private.active_user() then raise exception 'Account unavailable'; end if;
 select * into c from public.chargers where id=(select charger_id from public.bookings where id=p_booking) for update;
 select * into b from public.bookings where id=p_booking for update;
 select * into p from private.direct_upi_payments where booking_id=b.id;
 if b.id is null or (b.driver_id<>auth.uid() and c.owner_id<>auth.uid()) then raise exception 'Booking unavailable'; end if;
 if p.booking_id is null or b.status<>'confirmed' then raise exception 'Checkout unavailable'; end if;
 if p_action='report' and b.driver_id=auth.uid() and b.payment_status in ('unpaid','reported') and b.ends_at>now() then
  if p_reference is null or p_reference !~ '^[A-Za-z0-9_-]{6,64}$' then raise exception 'Enter the transaction reference from your UPI app'; end if;
  if b.payment_status='reported' then
   if p.reported_reference is distinct from p_reference then raise exception 'Payment already reported; contact the host to correct it'; end if;
   return b;
  end if;
  update private.direct_upi_payments set reported_reference=p_reference,reported_at=now() where booking_id=b.id;
  update public.bookings set payment_status='reported' where id=b.id returning * into b;
 elsif p_action='confirm' and c.owner_id=auth.uid() and private.host_ready(auth.uid()) and c.status='approved' and b.ends_at>now() and b.payment_status in ('reported','host_confirmed') then
  if b.payment_status='host_confirmed' then return b; end if;
  if p.reported_at is null then raise exception 'Driver must report payment first'; end if;
  update private.direct_upi_payments set confirmed_by=auth.uid(),confirmed_at=now() where booking_id=b.id;
  update public.bookings set payment_status='host_confirmed' where id=b.id returning * into b;
 else raise exception 'Payment action not allowed'; end if;
 insert into private.session_events(booking_id,actor_id,action) values(b.id,auth.uid(),'upi:'||p_action);
 return b;
end $$;
create function public.report_upi_payment(p_booking uuid,p_reference text) returns public.bookings language sql security invoker set search_path='' as $$ select private.direct_payment_action(p_booking,'report',p_reference) $$;
create function public.confirm_upi_receipt(p_booking uuid) returns public.bookings language sql security invoker set search_path='' as $$ select private.direct_payment_action(p_booking,'confirm',null) $$;

create function private.charge_action(p_booking uuid,p_action text) returns public.bookings language plpgsql security definer set search_path='' as $$
declare b public.bookings; c public.chargers;
begin
 if not private.active_user() then raise exception 'Account unavailable'; end if;
 select * into c from public.chargers where id=(select charger_id from public.bookings where id=p_booking) for update;
 select * into b from public.bookings where id=p_booking for update;
 if b.id is null or c.owner_id<>auth.uid() or not private.host_ready(auth.uid()) then raise exception 'Host action required'; end if;
 if p_action='start' and b.status='confirmed' and b.payment_status='host_confirmed' and c.status='approved' and b.starts_at<=now()+interval '10 minutes' and b.ends_at>now() then
  if exists(select 1 from public.bookings where charger_id=c.id and status='charging' and id<>b.id) then raise exception 'Charger is already in use'; end if;
  update public.bookings set status='charging' where id=b.id returning * into b;
 elsif p_action='complete' and b.status='charging' then
  update public.bookings set status='completed' where id=b.id returning * into b;
 else raise exception 'Session is not actionable'; end if;
 insert into private.session_events(booking_id,actor_id,action) values(b.id,auth.uid(),'charge:'||p_action);
 return b;
end $$;
create function public.start_charging(p_booking uuid) returns public.bookings language sql security invoker set search_path='' as $$ select private.charge_action(p_booking,'start') $$;
create function public.complete_charging(p_booking uuid) returns public.bookings language sql security invoker set search_path='' as $$ select private.charge_action(p_booking,'complete') $$;

create function private.set_charger_online(p_charger uuid,p_online boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.host_ready(auth.uid()) or p_online is null then raise exception 'Verified host required'; end if;
 update public.chargers set operational_status=case when p_online then 'available' else 'offline' end,availability_revision=availability_revision+1 where id=p_charger and owner_id=auth.uid();
 if not found then raise exception 'Charger unavailable'; end if;
end $$;
create function public.set_charger_online(p_charger uuid,p_online boolean) returns void language sql security invoker set search_path='' as $$ select private.set_charger_online(p_charger,p_online) $$;

create function private.charger_busy(p_charger uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if not private.active_user() then return false; end if;
 if not exists(select 1 from public.chargers c where c.id=p_charger and (c.owner_id=auth.uid() or (c.status='approved' and private.host_ready(c.owner_id)))) then return false; end if;
 return exists(select 1 from public.bookings b where b.charger_id=p_charger and (b.status='charging' or (b.status in ('requested','confirmed') and b.starts_at<now()+interval '1 hour' and b.ends_at>now() and (b.status<>'requested' or b.expires_at>now()))));
end $$;
create function private.bump_availability() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='DELETE' then update public.chargers set availability_revision=availability_revision+1 where id=old.charger_id;
 else update public.chargers set availability_revision=availability_revision+1 where id=new.charger_id;
  if TG_OP='UPDATE' and old.charger_id<>new.charger_id then update public.chargers set availability_revision=availability_revision+1 where id=old.charger_id; end if;
 end if;
 return null;
end $$;
create trigger booking_availability_revision after insert or update or delete on public.bookings for each row execute function private.bump_availability();
create trigger window_availability_revision after insert or update or delete on public.availability for each row execute function private.bump_availability();

revoke all on function private.save_host_upi(text,text),private.my_host_upi(),private.booking_checkout(uuid),private.direct_payment_action(uuid,text,text),private.charge_action(uuid,text),private.set_charger_online(uuid,boolean),private.charger_busy(uuid),private.bump_availability() from public,anon,authenticated;
grant execute on function private.save_host_upi(text,text),private.my_host_upi(),private.booking_checkout(uuid),private.direct_payment_action(uuid,text,text),private.charge_action(uuid,text),private.set_charger_online(uuid,boolean),private.charger_busy(uuid) to authenticated;
revoke all on function public.save_host_upi(text,text),public.my_host_upi(),public.get_booking_checkout(uuid),public.report_upi_payment(uuid,text),public.confirm_upi_receipt(uuid),public.start_charging(uuid),public.complete_charging(uuid),public.set_charger_online(uuid,boolean) from public,anon,authenticated;
grant execute on function public.save_host_upi(text,text),public.my_host_upi(),public.get_booking_checkout(uuid),public.report_upi_payment(uuid,text),public.confirm_upi_receipt(uuid),public.start_charging(uuid),public.complete_charging(uuid),public.set_charger_online(uuid,boolean) to authenticated;

create or replace function private.reserve_charger(p_charger uuid,p_start timestamptz,p_end timestamptz,p_kwh numeric,p_key uuid)
returns public.bookings language plpgsql security definer set search_path='' as $$
declare c public.chargers; b public.bookings;
begin
 if not private.active_user() then raise exception 'Account unavailable'; end if;
 if p_key is null or p_start is null or p_end is null or p_kwh is null then raise exception 'Missing reservation fields'; end if;
 -- Serialize competing reservations against the same charger row.
 select * into c from public.chargers where id=p_charger for update;
 select * into b from public.bookings where request_key=p_key;
 if found then
  if b.driver_id<>auth.uid() or b.charger_id<>p_charger or b.starts_at<>p_start or b.ends_at<>p_end or b.estimated_kwh<>p_kwh then raise exception 'Idempotency key conflict'; end if;
  return b;
 end if;
 if c.id is null or c.operational_status<>'available' or exists(select 1 from public.bookings where charger_id=c.id and status='charging') or c.status<>'approved' or c.owner_id=auth.uid() or not exists(select 1 from public.host_verifications where user_id=c.owner_id and status='verified') or not exists(select 1 from private.account_access where user_id=c.owner_id and not blocked) then raise exception 'Charger unavailable'; end if;
 if p_start<=now() or p_start>now()+interval '30 days' or p_end<p_start+interval '30 minutes' or p_end>p_start+interval '12 hours' or p_kwh<=0 or p_kwh>c.power_kw*extract(epoch from(p_end-p_start))/3600 then raise exception 'Invalid booking window or energy'; end if;
 if not exists(select 1 from public.availability where charger_id=c.id and starts_at<=p_start and ends_at>=p_end) then raise exception 'Outside host availability'; end if;
 update public.bookings set status='cancelled' where charger_id=c.id and status='requested' and expires_at<=now();
 insert into public.bookings(charger_id,driver_id,starts_at,ends_at,amount_paise,estimated_kwh,request_key,expires_at)
 values(c.id,auth.uid(),p_start,p_end,ceil(p_kwh*c.price_per_kwh*100)::integer,p_kwh,p_key,least(now()+interval '24 hours',p_start)) returning * into b;
 return b;
end $$;
