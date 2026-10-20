-- Additive upgrade to the audited PlugNear v0.4 database only.
create schema if not exists extensions;
alter extension btree_gist set schema extensions;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table private.account_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'member' check(role in ('member','admin')),
 blocked boolean not null default false
);
alter table private.account_access enable row level security;
create function private.active_user() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from private.account_access a join auth.users u on u.id=a.user_id where a.user_id=auth.uid() and not a.blocked and not coalesce(u.is_anonymous,false) and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null))
$$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select private.active_user() and exists(select 1 from private.account_access where user_id=auth.uid() and role='admin' and not blocked)
$$;
revoke all on function private.active_user(), private.is_admin() from public;
grant execute on function private.active_user(), private.is_admin() to authenticated;
create function private.new_account() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id) values(new.id) on conflict do nothing;
 insert into private.account_access(user_id) values(new.id) on conflict do nothing;
 return new;
end $$;
revoke all on function private.new_account() from public;
drop trigger if exists on_auth_user_created on auth.users;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger plugnear_new_account after insert on auth.users for each row execute function private.new_account();
insert into public.profiles(id) select id from auth.users on conflict do nothing;
insert into private.account_access(user_id) select id from auth.users on conflict do nothing;

create table public.host_verifications (
 user_id uuid primary key references public.profiles(id),
 legal_name text not null check(length(trim(legal_name)) between 2 and 120),
 evidence_note text not null check(length(trim(evidence_note)) between 20 and 2000),
 status text not null default 'pending' check(status in ('pending','verified','rejected')),
 reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.availability (
 id uuid primary key default gen_random_uuid(), charger_id uuid not null references public.chargers(id),
 starts_at timestamptz not null, ends_at timestamptz not null,
 check(ends_at > starts_at), check(ends_at <= starts_at + interval '31 days')
);
create index availability_charger on public.availability(charger_id, starts_at, ends_at);
create table public.disputes (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id),
 opened_by uuid not null references public.profiles(id),
 reason text not null check(length(trim(reason)) between 10 and 2000),
 status text not null default 'open' check(status in ('open','resolved')),
 resolution text, created_at timestamptz not null default now(), resolved_at timestamptz
);
create index disputes_booking on public.disputes(booking_id);
create index disputes_user on public.disputes(opened_by);
create table public.admin_audit (
 id bigint generated always as identity primary key, actor_id uuid not null references public.profiles(id),
 action text not null, target_id uuid not null, detail text not null, created_at timestamptz not null default now()
);
alter table public.host_verifications enable row level security;
alter table public.availability enable row level security;
alter table public.disputes enable row level security;
alter table public.admin_audit enable row level security;

alter table public.bookings add column amount_paise integer not null default 0 check(amount_paise >= 0),
 add column estimated_kwh numeric not null default 0 check(estimated_kwh >= 0),
 add column payment_status text not null default 'unpaid' check(payment_status in ('unpaid','paid','refunded')),
 add column request_key uuid unique,
 add column expires_at timestamptz not null default (now()+interval '24 hours');
-- Pending requests reserve a slot too. Existing project had zero bookings at audit.
alter table public.bookings drop constraint no_overlapping_confirmed_bookings;
alter table public.bookings add constraint no_overlapping_active_bookings exclude using gist
 (charger_id with =, tstzrange(starts_at,ends_at,'[)') with &&) where(status in ('requested','confirmed'));
create index chargers_discovery on public.chargers(status, latitude, longitude);
alter table public.chargers add constraint charger_connector check(connector in ('Type 2','CCS2','Bharat AC','CHAdeMO')),
 add constraint charger_title check(length(trim(title)) between 3 and 120),
 add constraint charger_address check(length(trim(address)) between 10 and 500),
 add constraint charger_power check(power_kw <= 500),
 add constraint charger_price check(price_per_kwh <= 100);

-- Mutations with authority or money implications are RPC-only.
drop policy bookings_insert on public.bookings;
revoke insert, update, delete on public.bookings from authenticated, anon;
revoke update, delete on public.host_verifications, public.disputes from authenticated, anon;
grant select on public.host_verifications, public.availability, public.disputes, public.admin_audit to authenticated;
grant insert on public.host_verifications, public.disputes to authenticated;
grant insert, delete on public.availability to authenticated;
create policy verification_read on public.host_verifications for select to authenticated using(user_id=(select auth.uid()) or (select private.is_admin()));
create policy verification_request on public.host_verifications for insert to authenticated with check(user_id=(select auth.uid()) and status='pending' and reviewed_by is null and reviewed_at is null and (select private.active_user()));
create policy availability_read on public.availability for select to authenticated using(exists(select 1 from public.chargers c where c.id=charger_id));
create policy availability_insert on public.availability for insert to authenticated with check((select private.active_user()) and exists(select 1 from public.chargers c where c.id=charger_id and c.owner_id=(select auth.uid())));
create policy availability_delete on public.availability for delete to authenticated using((select private.active_user()) and exists(select 1 from public.chargers c where c.id=charger_id and c.owner_id=(select auth.uid())));
create policy disputes_read on public.disputes for select to authenticated using(opened_by=(select auth.uid()) or (select private.is_admin()));
create policy disputes_insert on public.disputes for insert to authenticated with check(opened_by=(select auth.uid()) and status='open' and resolution is null and resolved_at is null and (select private.active_user()) and exists(select 1 from public.bookings b where b.id=booking_id and (b.driver_id=(select auth.uid()) or exists(select 1 from public.chargers c where c.id=b.charger_id and c.owner_id=(select auth.uid())))));
create policy audit_read on public.admin_audit for select to authenticated using((select private.is_admin()));
create policy admin_profiles on public.profiles for select to authenticated using((select private.is_admin()));
create policy admin_chargers on public.chargers for select to authenticated using((select private.is_admin()));
create policy admin_bookings on public.bookings for select to authenticated using((select private.is_admin()));
-- Restrictive policies compose with all existing permissive policies.
create policy active_profiles on public.profiles as restrictive for all to authenticated using((select private.active_user())) with check((select private.active_user()));
create policy active_chargers on public.chargers as restrictive for all to authenticated using((select private.active_user())) with check((select private.active_user()));
create policy active_bookings on public.bookings as restrictive for all to authenticated using((select private.active_user())) with check((select private.active_user()));

create function private.reserve_charger(p_charger uuid,p_start timestamptz,p_end timestamptz,p_kwh numeric,p_key uuid)
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
 if c.id is null or c.status<>'approved' or c.owner_id=auth.uid() or not exists(select 1 from public.host_verifications where user_id=c.owner_id and status='verified') or not exists(select 1 from private.account_access where user_id=c.owner_id and not blocked) then raise exception 'Charger unavailable'; end if;
 if p_start<=now() or p_start>now()+interval '30 days' or p_end<p_start+interval '30 minutes' or p_end>p_start+interval '12 hours' or p_kwh<=0 or p_kwh>c.power_kw*extract(epoch from(p_end-p_start))/3600 then raise exception 'Invalid booking window or energy'; end if;
 if not exists(select 1 from public.availability where charger_id=c.id and starts_at<=p_start and ends_at>=p_end) then raise exception 'Outside host availability'; end if;
 update public.bookings set status='cancelled' where charger_id=c.id and status='requested' and expires_at<=now();
 insert into public.bookings(charger_id,driver_id,starts_at,ends_at,amount_paise,estimated_kwh,request_key,expires_at)
 values(c.id,auth.uid(),p_start,p_end,ceil(p_kwh*c.price_per_kwh*100)::integer,p_kwh,p_key,least(now()+interval '24 hours',p_start)) returning * into b;
 return b;
end $$;
create function public.reserve_charger(p_charger uuid,p_start timestamptz,p_end timestamptz,p_kwh numeric,p_key uuid) returns public.bookings language sql security invoker set search_path='' as $$ select private.reserve_charger(p_charger,p_start,p_end,p_kwh,p_key) $$;

create function private.transition_booking(p_booking_id uuid,p_action text) returns public.bookings language plpgsql security definer set search_path='' as $$
declare b public.bookings; owner uuid;
begin
 if not private.active_user() then raise exception 'Account unavailable'; end if;
 select * into b from public.bookings where id=p_booking_id for update;
 select owner_id into owner from public.chargers where id=b.charger_id;
 if b.id is null then raise exception 'Booking unavailable'; end if;
 if p_action='cancel' and b.driver_id=auth.uid() and b.status in ('requested','confirmed') and b.payment_status='unpaid' and b.starts_at>now() then
  update public.bookings set status='cancelled' where id=b.id returning * into b;
 elsif p_action in ('accept','decline') and owner=auth.uid() and b.status='requested' and b.expires_at>now() and b.starts_at>now() and exists(select 1 from public.chargers where id=b.charger_id and status='approved') then
  update public.bookings set status=case when p_action='accept' then 'confirmed' else 'declined' end where id=b.id returning * into b;
 else raise exception 'Booking not actionable'; end if;
 return b;
end $$;
create or replace function public.cancel_my_booking(p_booking_id uuid) returns public.bookings language sql security invoker set search_path='' as $$ select private.transition_booking(p_booking_id,'cancel') $$;
create or replace function public.respond_to_booking(p_booking_id uuid,p_accept boolean) returns public.bookings language sql security invoker set search_path='' as $$ select private.transition_booking(p_booking_id,case when p_accept then 'accept' else 'decline' end) $$;

create function private.admin_action(p_action text,p_id uuid,p_value text,p_note text) returns void language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 if length(trim(coalesce(p_note,'')))<5 then raise exception 'A review note is required'; end if;
 if p_action='verification' and p_value in ('verified','rejected') then
  update public.host_verifications set status=p_value,reviewed_by=auth.uid(),reviewed_at=now() where user_id=p_id;
 elsif p_action='charger' and p_value in ('approved','rejected','suspended') then
  update public.chargers c set status=p_value where id=p_id and (p_value<>'approved' or exists(select 1 from public.host_verifications h where h.user_id=c.owner_id and h.status='verified'));
 elsif p_action='user' and p_value in ('block','unblock') and p_id<>auth.uid() then
  update private.account_access set blocked=(p_value='block') where user_id=p_id and role<>'admin';
 elsif p_action='dispute' and p_value='resolved' then
  update public.disputes set status='resolved',resolution=p_note,resolved_at=now() where id=p_id and status='open';
 else raise exception 'Invalid admin action'; end if;
 get diagnostics affected=row_count;
 if affected<>1 then raise exception 'Target unavailable or prerequisite unmet'; end if;
 insert into public.admin_audit(actor_id,action,target_id,detail) values(auth.uid(),p_action||':'||p_value,p_id,p_note);
end $$;
create function public.admin_action(p_action text,p_id uuid,p_value text,p_note text) returns void language sql security invoker set search_path='' as $$ select private.admin_action(p_action,p_id,p_value,p_note) $$;
create function public.my_access() returns jsonb language sql security invoker set search_path='' as $$ select jsonb_build_object('active',private.active_user(),'admin',private.is_admin()) $$;

revoke all on function private.reserve_charger(uuid,timestamptz,timestamptz,numeric,uuid),private.transition_booking(uuid,text),private.admin_action(text,uuid,text,text) from public;
grant execute on function private.reserve_charger(uuid,timestamptz,timestamptz,numeric,uuid),private.transition_booking(uuid,text),private.admin_action(text,uuid,text,text) to authenticated;
revoke all on function public.reserve_charger(uuid,timestamptz,timestamptz,numeric,uuid),public.admin_action(text,uuid,text,text),public.my_access(),public.cancel_my_booking(uuid),public.respond_to_booking(uuid,boolean) from public,anon;
grant execute on function public.reserve_charger(uuid,timestamptz,timestamptz,numeric,uuid),public.admin_action(text,uuid,text,text),public.my_access(),public.cancel_my_booking(uuid),public.respond_to_booking(uuid,boolean) to authenticated;
-- The authorization table is deliberately inaccessible to browser clients.
revoke all on private.account_access from anon,authenticated;

-- Hide chargers whose host is unverified or blocked without exposing identity evidence.
create function private.host_ready(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.active_user() and exists(select 1 from public.host_verifications h join private.account_access a on a.user_id=h.user_id where h.user_id=p_user and h.status='verified' and not a.blocked)
$$;
revoke all on function private.host_ready(uuid) from public;
grant execute on function private.host_ready(uuid) to authenticated;
drop policy chargers_read on public.chargers;
create policy chargers_read on public.chargers for select to authenticated using(owner_id=(select auth.uid()) or (status='approved' and private.host_ready(owner_id)));
alter table public.profiles add constraint profile_name_length check(display_name is null or length(display_name)<=100), add constraint profile_phone_format check(phone is null or phone='' or phone ~ '^\+[1-9][0-9]{7,14}$');

-- Replace broad Supabase default table grants with the exact client surface.
revoke all on public.profiles,public.chargers,public.bookings,public.host_verifications,public.availability,public.disputes,public.admin_audit from public,anon,authenticated;
grant select on public.profiles,public.chargers,public.bookings,public.host_verifications,public.availability,public.disputes,public.admin_audit to authenticated;
grant update(display_name,phone) on public.profiles to authenticated;
grant insert(owner_id,title,address,latitude,longitude,connector,power_kw,price_per_kwh) on public.chargers to authenticated;
grant update(title,address,latitude,longitude,connector,power_kw,price_per_kwh) on public.chargers to authenticated;
grant insert(user_id,legal_name,evidence_note) on public.host_verifications to authenticated;
grant insert(charger_id,starts_at,ends_at),delete on public.availability to authenticated;
grant insert(booking_id,opened_by,reason) on public.disputes to authenticated;
